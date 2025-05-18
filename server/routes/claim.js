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

      // Calcola le ricompense per ogni stake
      const rewards = await Promise.all(activeStakes.map(async (stake) => {
        // Calcola i giorni di stake
        const startDate = new Date(stake.startTime);
        const now = new Date();
        const stakeDurationMs = now.getTime() - startDate.getTime();
        const stakeDuration = Math.floor(stakeDurationMs / (1000 * 60 * 60 * 24)); // Converti millisecondi in giorni

        // Determina il reward giornaliero in base alla rarità
        let dailyReward = 33.33; // Default per Standard

        if (stake.rarityTier === 'Advanced') {
          dailyReward = 50.00;
        } else if (stake.rarityTier === 'Elite') {
          dailyReward = 66.67;
        } else if (stake.rarityTier === 'Prototype') {
          dailyReward = 83.33;
        }

        // Calcola il reward totale
        const totalReward = parseFloat((dailyReward * stakeDuration).toFixed(2));

        // Controlla se ci sono claim precedenti
        const claimedRewards = await storage.getClaimedRewardsByStakeId(stake.id);

        // Potremmo avere molteplici claim in futuro, per ora assumiamo uno solo
        const lastClaimDate = claimedRewards.length > 0 ?
          claimedRewards[claimedRewards.length - 1].createdAt : null;

        return {
          stakeId: stake.id.toString(),
          tokenId: stake.nftId,
          dailyReward,
          stakeDuration,
          totalReward,
          lastClaimDate
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
