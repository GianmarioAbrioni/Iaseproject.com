import { storage } from "../storage";
import { verifyNftOwnership, calculateDailyReward, getNFTMetadata, ETH_CONFIG } from "./nft-verification";

// Costanti per le ricompense di staking (valori fissi in base alla rarità)
const BASE_DAILY_REWARD = 33.33; // Standard (1.0x)
const ADVANCED_DAILY_REWARD = 50.00; // Advanced (1.5x)
const ELITE_DAILY_REWARD = 66.67; // Elite (2.0x)
const PROTOTYPE_DAILY_REWARD = 83.33; // Prototype (2.5x)

// Per retrocompatibilità con il codice esistente
const MONTHLY_REWARD = 1000; // 1000 IASE tokens mensili
const DAILY_REWARD = MONTHLY_REWARD / 30; // ~33.33 IASE tokens al giorno

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
  
  // MODIFICA: Usa lo stesso approccio del frontend per garantire coerenza
  console.log(`[Staking Job] NFT #${nftId} - Recupero metadati completi tramite API Alchemy`);
  
  // Recupera i metadati completi come fa il frontend (getNFTMetadata)
  const metadata = await getNFTMetadata(nftId);
  console.log(`[Staking Job] Metadati recuperati per NFT #${nftId}:`, metadata?.rarity || 'non disponibile');
  
  // Usa la proprietà rarity già estratta correttamente dal metadata
  const rarity = metadata?.rarity || "Standard";
  
  // SOLUZIONE SEMPLICISSIMA:
  // Assegna direttamente il valore di reward fisso in base alla rarità
  let dailyReward = BASE_DAILY_REWARD; // Default per Standard
  
  // Assegna valore fisso in base alla rarità usando le costanti
  if (rarity === "Advanced") {
    dailyReward = ADVANCED_DAILY_REWARD;
  } else if (rarity === "Elite") {
    dailyReward = ELITE_DAILY_REWARD;
  } else if (rarity === "Prototype") {
    dailyReward = PROTOTYPE_DAILY_REWARD;
  }
  
  console.log(`[Staking Job] Rarità NFT #${nftId}: ${rarity} = ${dailyReward} IASE/giorno (valore fisso)`);
  
  // Determina il tier in base alla rarità per compatibilità (mantenuto per retrocompatibilità)
  let rarityTier = "standard";
  if (rarity === "Elite") rarityTier = "elite";
  else if (rarity === "Advanced") rarityTier = "advanced";
  else if (rarity === "Prototype") rarityTier = "prototype";
  
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