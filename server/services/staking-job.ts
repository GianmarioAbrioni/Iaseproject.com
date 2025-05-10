import { storage } from "../storage";
import { verifyNftOwnership, calculateDailyReward } from "./nft-verification";

/**
 * Servizio di verifica giornaliera per gli NFT in staking
 * Verifica che ogni NFT in staking sia ancora posseduto dal rispettivo wallet
 * e distribuisce le ricompense di conseguenza
 */
export async function verifyAndDistributeRewards(): Promise<void> {
  console.log("[Staking Job] Avvio verifica giornaliera degli NFT in staking...");
  
  try {
    // Ottieni tutti gli NFT in staking attivi
    const activeStakes = await getAllActiveStakes();
    console.log(`[Staking Job] Trovati ${activeStakes.length} NFT in staking attivi`);
    
    // Elabora ogni stake
    for (const stake of activeStakes) {
      await processStake(stake);
    }
    
    console.log("[Staking Job] Verifica e distribuzione ricompense completata con successo");
  } catch (error) {
    console.error("[Staking Job] Errore durante la verifica e distribuzione delle ricompense:", error);
  }
}

/**
 * Ottiene tutti gli NFT in staking attivi
 */
async function getAllActiveStakes() {
  // Utilizziamo la funzione storage.getAllActiveStakes() per ottenere tutti gli stake attivi
  return await storage.getAllActiveStakes();
}

/**
 * Elabora un singolo stake, verificando la proprietà dell'NFT
 * e assegnando ricompense se applicabile
 */
async function processStake(stake: any) {
  const { id, walletAddress, nftId, lastVerificationTime } = stake;
  
  console.log(`[Staking Job] Verifica NFT #${nftId} per wallet ${walletAddress}`);
  
  // Verifica che l'NFT sia ancora posseduto dal wallet
  const isStillOwned = await verifyNftOwnership(walletAddress, nftId);
  
  if (!isStillOwned) {
    console.log(`[Staking Job] NFT #${nftId} non più posseduto da ${walletAddress}, terminazione staking`);
    await storage.endNftStake(id);
    return;
  }
  
  // L'NFT è ancora posseduto, calcola e assegna la ricompensa
  console.log(`[Staking Job] NFT #${nftId} ancora posseduto da ${walletAddress}, calcolo ricompensa`);
  
  // Ottieni i tratti per determinare la rarità
  const traits = await storage.getNftTraitsByNftId(nftId);
  
  // Determina la rarità dell'NFT (in produzione, dovresti ottenere questi dati dal contratto o da un'API)
  // Per questo esempio, utilizziamo la stessa logica usata durante lo staking
  // basata sull'ID dell'NFT per determinare la rarità in modo consistente
  const rarityTiers = ["standard", "advanced", "elite", "prototype"];
  const rarityWeights = [70, 20, 8, 2]; // 70% standard, 20% advanced, 8% elite, 2% prototype
  
  const nftIdHash = parseInt(nftId.replace(/\D/g, '').slice(-2) || '0');
  let cumulativeWeight = 0;
  let rarityTier = "standard";
  
  for (let i = 0; i < rarityTiers.length; i++) {
    cumulativeWeight += rarityWeights[i];
    if (nftIdHash % 100 < cumulativeWeight) {
      rarityTier = rarityTiers[i];
      break;
    }
  }
  
  // Calcola la ricompensa giornaliera di base in base alla rarità
  const dailyReward = calculateDailyReward(nftId, rarityTier);
  
  // Assegna la ricompensa
  const rewardData = {
    stakeId: id,
    amount: dailyReward, // Ricompensa giornaliera
    walletAddress,
    transactionHash: null
  };
  
  await storage.createStakingReward(rewardData);
  
  // Aggiorna il timestamp dell'ultima verifica
  await storage.updateNftStakeVerification(id);
  
  console.log(`[Staking Job] Assegnata ricompensa di ${dailyReward} token IASE per NFT #${nftId} a ${walletAddress}`);
}