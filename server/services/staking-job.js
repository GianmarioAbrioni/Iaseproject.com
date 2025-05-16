/**
 * IASE Project - Staking Job Scheduler
 * 
 * Questo script verifica giornalmente tutti gli NFT in staking
 * e distribuisce le ricompense per quelli ancora validi.
 */

import { storage } from '../storage.js';
import { verifyNftOwnership } from './nft-verification.js';

// Costanti globali per i valori fissi dei reward
const BASE_DAILY_REWARD = 33.33; // Standard (1.0x)
const ADVANCED_DAILY_REWARD = 50.00; // Advanced (1.5x)
const ELITE_DAILY_REWARD = 66.67; // Elite (2.0x)
const PROTOTYPE_DAILY_REWARD = 83.33; // Prototype (2.5x)

async function processStakingRewards() {
  console.log("🔄 Verifica stake NFT e distribuzione ricompense avviata");
  
  try {
    // Ottieni tutti gli stake attivi
    const activeStakes = await storage.getAllActiveStakes();
    console.log(`📊 Trovati ${activeStakes.length} stake NFT attivi`);

    let verifiedCount = 0;
    let failedCount = 0;
    
    for (const stake of activeStakes) {
      try {
        // Verifica proprietà NFT
        console.log(`🔍 Verifica NFT ID ${stake.nftId} per wallet ${stake.walletAddress}`);
        const isVerified = await verifyNftOwnership(stake.walletAddress, stake.nftId);
        
        if (isVerified) {
          // Aggiorna lo stake come verificato
          await storage.updateNftStakeVerification(stake.id);
          
          // Usa valori fissi per le ricompense in base alla rarità
          let rewardAmount = BASE_DAILY_REWARD;
          let rarityName = "Standard";
          
          if (stake.rarityName) {
            const rarityLower = stake.rarityName.toLowerCase();
            
            if (rarityLower.includes('advanced')) {
              rewardAmount = ADVANCED_DAILY_REWARD;
              rarityName = "Advanced";
            } else if (rarityLower.includes('elite')) {
              rewardAmount = ELITE_DAILY_REWARD;
              rarityName = "Elite";
            } else if (rarityLower.includes('prototype')) {
              rewardAmount = PROTOTYPE_DAILY_REWARD;
              rarityName = "Prototype";
            }
          }
          
          // Crea record ricompensa
          const reward = {
            stakeId: stake.id,
            walletAddress: stake.walletAddress,
            amount: rewardAmount,
            rewardDate: new Date(),
            claimed: false
          };
          
          await storage.createStakingReward(reward);
          
          console.log(`✅ Ricompensa di ${rewardAmount.toFixed(2)} IASE tokens (${rarityName}) assegnata per NFT ${stake.nftId}`);
          verifiedCount++;
        } else {
          console.log(`❌ Verifica fallita per NFT ${stake.nftId}: non più di proprietà di ${stake.walletAddress}`);
          // Termina lo stake
          await storage.endNftStake(stake.id);
          failedCount++;
        }
      } catch (error) {
        console.error(`⚠️ Errore durante la verifica dello stake ${stake.id}:`, error);
        failedCount++;
      }
    }
    
    console.log(`🏁 Processo completato: ${verifiedCount} stake verificati, ${failedCount} falliti`);
  } catch (error) {
    console.error("🚨 Errore durante l'elaborazione degli stake:", error);
  }
}

// Esegui il job immediatamente
console.log("🚀 IASE Project - Staking Job Scheduler");
processStakingRewards().then(() => {
  console.log("✅ Job completato");
  process.exit(0);
}).catch(error => {
  console.error("🚨 Errore critico:", error);
  process.exit(1);
});