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
  
  // MODIFICA: Bypass completo della cache locale, forziamo il calcolo della rarità
  // tramite la funzione calculateDailyReward che internamente userà direttamente l'API
  // Questo risolve il problema di rarità che risultano sempre "standard"
  console.log(`[Staking Job] NFT #${nftId} - Forzo calcolo della rarità tramite API diretta`);
  
  // Calcola direttamente la ricompensa giornaliera di base
  // tramite API (nft-verification.ts farà la chiamata API completa)
  // Non salva nella variabile per evitare conflict con la riga sotto
  const rewardAmount = await calculateDailyReward(nftId);
  
  // Determina la rarità in base al reward calcolato
  let rarityTier = "standard"; // Default (33.33 IASE)
  
  if (rewardAmount >= 83) {
    rarityTier = "prototype"; // 2.5x (83.33 IASE)
  } else if (rewardAmount >= 66) {
    rarityTier = "elite"; // 2.0x (66.67 IASE)
  } else if (rewardAmount >= 50) {
    rarityTier = "advanced"; // 1.5x (50 IASE)
  }
  
  console.log(`[Staking Job] Rarità NFT #${nftId} determinata dal reward calcolato (${rewardAmount} IASE): ${rarityTier}`);
  
  // Usa direttamente il valore già calcolato
  const dailyReward = rewardAmount;
  
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