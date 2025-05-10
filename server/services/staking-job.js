/**
 * IASE Project - Staking Job Scheduler
 * 
 * Questo script verifica giornalmente tutti gli NFT in staking
 * e distribuisce le ricompense per quelli ancora validi.
 */

import { storage } from '../storage.js';
import { CONFIG } from '../config.js';
import { verifyNftOwnership } from './nft-verification.js';

async function processStakingRewards() {
  console.log("🔄 Verifica stake NFT e distribuzione ricompense avviata");
  
  try {
    // Ottieni tutti gli stake attivi
    const activeStakes = await storage.getAllActiveStakes();
    console.log(`📊 Trovati ${activeStakes.length} stake NFT attivi`);

    let verifiedCount = 0;
    let failedCount = 0;
    
    // Calcola ricompensa giornaliera base (ricompensa mensile / 30 giorni)
    const dailyBaseReward = CONFIG.staking.monthlyReward / 30;
    
    for (const stake of activeStakes) {
      try {
        // Verifica proprietà NFT
        console.log(`🔍 Verifica NFT ID ${stake.nftId} per wallet ${stake.walletAddress}`);
        const isVerified = await verifyNftOwnership(stake.walletAddress, stake.nftId);
        
        if (isVerified) {
          // Aggiorna lo stake come verificato
          await storage.updateNftStakeVerification(stake.id);
          
          // Calcola ricompensa con moltiplicatore di rarità
          const rewardAmount = dailyBaseReward * stake.rarityMultiplier;
          
          // Crea record ricompensa
          const reward = {
            stakeId: stake.id,
            walletAddress: stake.walletAddress,
            amount: rewardAmount,
            rewardDate: new Date(),
            claimed: false
          };
          
          await storage.createStakingReward(reward);
          
          console.log(`✅ Ricompensa di ${rewardAmount.toFixed(2)} IASE tokens (${stake.rarityMultiplier}x) assegnata per NFT ${stake.nftId}`);
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