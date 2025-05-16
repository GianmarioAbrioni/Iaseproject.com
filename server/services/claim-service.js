/**
 * IASE Project - Claim Service
 * 
 * Questo servizio gestisce le operazioni di claim delle ricompense.
 */

import { CONFIG } from '../config.js';

/**
 * Restituisce la configurazione del servizio di claim
 */
export function getClaimConfig() {
  return {
    rewardContractAddress: CONFIG.staking.rewardDistributorContract,
    networkRpc: CONFIG.bsc.rpcUrl,
    tokenAddress: CONFIG.bsc.tokenAddress
  };
}

/**
 * API route per ottenere la configurazione del servizio di claim
 */
export function setupClaimRoutes(app, storage) {
  // Get claim config
  app.get('/api/config', (req, res) => {
    try {
      const config = getClaimConfig();
      res.json(config);
    } catch (error) {
      console.error('Error fetching claim config:', error);
      res.status(500).json({ error: 'Errore nel recupero della configurazione' });
    }
  });

  // Get staking rewards for a wallet
  app.get('/api/rewards/:walletAddress', async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const rewards = await storage.getRewardsByWalletAddress(walletAddress);
      
      // Calcola il totale per stakingId
      const stakeTotals = {};
      for (const reward of rewards) {
        if (!stakeTotals[reward.stakeId]) {
          stakeTotals[reward.stakeId] = {
            stakeId: reward.stakeId,
            totalReward: 0,
            claimed: reward.claimed,
            rewardCount: 0
          };
        }
        
        stakeTotals[reward.stakeId].totalReward += reward.amount;
        stakeTotals[reward.stakeId].rewardCount += 1;
        
        // Se anche una sola ricompensa è claimed, tutto lo stake è marked as claimed
        if (reward.claimed) {
          stakeTotals[reward.stakeId].claimed = true;
        }
      }
      
      const result = Object.values(stakeTotals);
      res.json(result);
    } catch (error) {
      console.error('Error fetching rewards:', error);
      res.status(500).json({ error: 'Errore nel recupero delle ricompense' });
    }
  });

  // Mark rewards as claimed
  app.post('/api/mark-claimed', async (req, res) => {
    try {
      const { stakeId, txHash } = req.body;
      
      if (!stakeId) {
        return res.status(400).json({ error: 'Stake ID richiesto' });
      }
      
      await storage.markRewardsAsClaimed(stakeId);
      
      res.json({ success: true, message: 'Ricompense marcate come riscosse' });
    } catch (error) {
      console.error('Error marking rewards as claimed:', error);
      res.status(500).json({ error: 'Errore nel marcare le ricompense come riscosse' });
    }
  });
}