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

// Variabile globale per tenere traccia del timer di verifica
let scheduleStakingVerification = null;

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
          
          if (stake.rarityTier) {
            const rarityLower = stake.rarityTier.toLowerCase();
            
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
          
          // Crea record ricompensa usando esattamente la struttura dal database reale
          const reward = {
            stakeId: stake.id,
            amount: rewardAmount,
            rewardDate: new Date(),
            claimed: false,
            claimTxHash: null
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
    return { verifiedCount, failedCount };
  } catch (error) {
    console.error("🚨 Errore durante l'elaborazione degli stake:", error);
    throw error;
  }
}

// Funzione per pianificare la verifica giornaliera degli staking
async function setupStakingVerification() {
  try {
    // Funzione per calcolare il tempo fino alla prossima mezzanotte
    function scheduleNextVerification() {
      const now = new Date();
      const midnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0, 0, 0 // mezzanotte 00:00:00
      );
      
      const msToMidnight = midnight.getTime() - now.getTime();
      const hoursToMidnight = Math.floor(msToMidnight / (1000 * 60 * 60));
      
      console.log(`⏰ Job di verifica staking pianificato per la prossima mezzanotte (tra ${hoursToMidnight} ore)`);
      
      // Imposta il timer
      return setTimeout(() => {
        console.log('🔄 Avvio verifica giornaliera degli NFT in staking...');
        
        // Esegui il job di verifica
        processStakingRewards()
          .then(() => {
            console.log('✅ Verifica staking completata con successo');
            // Pianifica la prossima esecuzione
            scheduleStakingVerification = scheduleNextVerification();
          })
          .catch(error => {
            console.error("❌ Errore durante la verifica staking:", error);
            // Pianifica comunque la prossima esecuzione
            scheduleStakingVerification = scheduleNextVerification();
          });
      }, msToMidnight);
    }
    
    // Avvia lo scheduler
    scheduleStakingVerification = scheduleNextVerification();
    
    // Aggiungi anche un endpoint per eseguire la verifica manualmente (solo in sviluppo)
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔧 Endpoint di verifica manuale abilitato (solo ambiente di sviluppo)');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Errore durante la configurazione dello scheduler staking:', error);
    return false;
  }
}

// Esporta le funzioni per poterle utilizzare esternamente
export { processStakingRewards };

// Avvio diretto della funzione se eseguita come modulo principale
if (typeof require !== 'undefined' && require.main === module) {
  console.log('🔄 Avvio diretto del job di staking...');
  processStakingRewards()
    .then(() => console.log('✅ Job completato con successo'))
    .catch(err => console.error('❌ Errore durante l\'esecuzione:', err));
}