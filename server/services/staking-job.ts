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
  let rarityTier = "standard"; // Default
  
  // Cerca trait "CARD FRAME" o "AI-Booster" nei tratti dell'NFT
  if (traits && traits.length > 0) {
    // Cerca prima Card Frame (priorità)
    const frameTrait = traits.find(trait => 
      trait.traitType.toUpperCase() === 'CARD FRAME');
    
    if (frameTrait) {
      const frameValue = frameTrait.value.toLowerCase();
      
      // Determina la rarità in base al valore del trait
      if (frameValue.includes("elite")) {
        rarityTier = "elite";
      } else if (frameValue.includes("advanced")) {
        rarityTier = "advanced";
      } else if (frameValue.includes("prototype")) {
        rarityTier = "prototype";
      }
      
      console.log(`[Staking Job] Rarità NFT #${nftId} determinata da Card Frame: ${rarityTier}`);
    } 
    // Se non c'è Card Frame, cerca AI-Booster
    else {
      const boosterTrait = traits.find(trait => 
        trait.traitType.toUpperCase() === 'AI-BOOSTER');
      
      if (boosterTrait) {
        const boosterValue = boosterTrait.value.toString().toUpperCase();
        
        // Determina la rarità in base al valore del booster
        if (boosterValue.includes('X2.5') || boosterValue.includes('2.5')) {
          rarityTier = "prototype"; // 2.5x = Prototype
        } else if (boosterValue.includes('X2.0') || boosterValue.includes('2.0')) {
          rarityTier = "elite"; // 2.0x = Elite
        } else if (boosterValue.includes('X1.5') || boosterValue.includes('1.5')) {
          rarityTier = "advanced"; // 1.5x = Advanced
        }
        
        console.log(`[Staking Job] Rarità NFT #${nftId} determinata da AI-Booster: ${rarityTier}`);
      } else {
        console.log(`[Staking Job] Nessun trait di rarità trovato per NFT #${nftId}, usando default: ${rarityTier}`);
      }
    }
  } else {
    console.log(`[Staking Job] Nessun trait trovato per NFT #${nftId}, usando default: ${rarityTier}`);
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