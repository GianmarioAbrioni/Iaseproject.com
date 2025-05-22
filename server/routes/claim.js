// Required dependencies:
// express (npm install express)
// path (built-in Node.js module)
// fs (built-in Node.js module)

import { Router } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();

// Endpoint per registrare un claim
router.post('/mark-claimed', async (req, res) => {
  try {
    const { walletAddress, stakeId, txHash } = req.body;

    // Validazione dei dati in ingresso
    if (!walletAddress || !stakeId) {
      return res.status(400).json({
        success: false,
        error: 'Parametri mancanti. walletAddress e stakeId sono richiesti'
      });
    }

    console.log(`Richiesta claim ricevuta per stakeId: ${stakeId}, wallet: ${walletAddress.toLowerCase()}`);

    try {
      // Importa lo storage per aggiornare il database
      const { storage } = await import('../storage');

      // Verifica che lo stake esista e appartenga al wallet specificato
      const stake = await storage.getNftStakeById(parseInt(stakeId));

      if (!stake) {
        return res.status(404).json({
          success: false,
          error: `Nessuno stake trovato con ID ${stakeId}`
        });
      }

      // Verifica che lo stake appartenga al wallet specificato
      if (stake.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        return res.status(403).json({
          success: false,
          error: `Lo stake specificato non appartiene al wallet ${walletAddress}`
        });
      }

      // Marca le ricompense come richieste nel database
      await storage.markRewardsAsClaimed(parseInt(stakeId));

      console.log(`✅ Ricompense marcate come richieste per stakeId: ${stakeId}`);

      // Restituisci risposta di successo
      res.status(200).json({
        success: true,
        message: 'Claim registrato con successo',
        data: {
          stakeId,
          walletAddress: walletAddress.toLowerCase(),
          txHash: txHash || `claim-${Date.now()}`,
          claimDate: new Date().toISOString()
        }
      });
    } catch (dbError) {
      console.error('❌ Errore durante l\'aggiornamento del claim nel database:', dbError);

      // Restituisci errore specifico
      return res.status(500).json({
        success: false,
        error: 'Errore durante l\'operazione di claim nel database',
        details: dbError.message
      });
    }

  } catch (error) {
    console.error('Errore durante il processo di claim:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante l\'operazione di claim'
    });
  }
});

// Endpoint per ottenere le ricompense disponibili
router.get('/rewards/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Indirizzo wallet mancante'
      });
    }

    const normalizedAddress = walletAddress.toLowerCase();
    console.log(`Richiesta ricompense per wallet: ${normalizedAddress}`);

    try {
      // Importa lo storage per leggere dal database
      const { storage } = await import('../storage');

      // Ottieni tutti gli stake attivi per questo wallet
      const activeStakes = await storage.getActiveNftStakesByWallet(normalizedAddress);

      if (!activeStakes || activeStakes.length === 0) {
        console.log(`Nessuno stake attivo trovato per wallet: ${normalizedAddress}`);
        return res.status(200).json([]);
      }

      console.log(`Trovati ${activeStakes.length} stake attivi per wallet: ${normalizedAddress}`);

      // Ottieni tutte le rewards dai record effettivi nel database
      const rewards = await Promise.all(activeStakes.map(async (stake) => {
        // Determina il reward giornaliero in base alla rarità
        let dailyReward = 33.33; // Default per Standard

        if (stake.rarityTier === 'Advanced') {
          dailyReward = 50.00;
        } else if (stake.rarityTier === 'Elite') {
          dailyReward = 66.67;
        } else if (stake.rarityTier === 'Prototype') {
          dailyReward = 83.33;
        }

        // Calcola i giorni di stake attivo
        const startDate = new Date(stake.startTime);
        const now = new Date();
        const stakeDurationMs = now.getTime() - startDate.getTime();
        const stakeDuration = Math.floor(stakeDurationMs / (1000 * 60 * 60 * 24)); // Converti millisecondi in giorni

        // Ottieni tutte le rewards registrate nel database per questo stake
        const stakingRewards = await storage.getRewardsByStakeId(stake.id);
        
        // Calcola la somma delle rewards non ancora richieste (claimed=false)
        const unclaimedRewards = stakingRewards
          .filter(reward => reward.claimed === false)
          .reduce((sum, reward) => sum + parseFloat(reward.amount), 0);

        // Calcola la somma totale di tutte le rewards per questo stake
        const totalHistoricalRewards = stakingRewards
          .reduce((sum, reward) => sum + parseFloat(reward.amount), 0);
        
        // Ottieni data dell'ultimo claim se esiste
        const claimedRewards = stakingRewards.filter(reward => reward.claimed === true);
        const lastClaimDate = claimedRewards.length > 0 ? 
          new Date(Math.max(...claimedRewards.map(r => new Date(r.rewardDate).getTime()))) : null;

        // Formatta i risultati
        return {
          stakeId: stake.id.toString(),
          tokenId: stake.nftId,
          nftId: stake.nftId,
          nftMetadata: stake.metadata || null,
          dailyReward: parseFloat(dailyReward.toFixed(2)),
          stakeDuration,
          stakeDurationDays: stakeDuration,
          stakeDateIso: startDate.toISOString(),
          stakeDate: startDate.toLocaleDateString(),
          unclaimedRewards: parseFloat(unclaimedRewards.toFixed(2)),
          totalRewards: parseFloat(totalHistoricalRewards.toFixed(2)),
          totalReward: parseFloat(totalHistoricalRewards.toFixed(2)), // Per compatibilità
          lastClaimDate: lastClaimDate ? lastClaimDate.toISOString() : null,
          rewardCount: stakingRewards.length,
          rarityTier: stake.rarityTier || 'Standard',
          claimableAmount: parseFloat(unclaimedRewards.toFixed(2))
        };
      }));

      console.log(`Recuperate ${rewards.length} ricompense per wallet: ${normalizedAddress}`);

      res.status(200).json(rewards);

    } catch (dbError) {
      console.error('❌ Errore durante il recupero delle ricompense dal database:', dbError);

      // Restituisci errore specifico
      return res.status(500).json({
        success: false,
        error: 'Errore durante il recupero delle ricompense dal database',
        details: dbError.message
      });
    }

  } catch (error) {
    console.error('Errore durante il recupero delle ricompense:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero delle ricompense'
    });
  }
});

export default router;
