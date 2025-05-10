import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { insertNftStakeSchema, insertStakingRewardSchema } from '@shared/schema';
import { z } from 'zod';
import { getClaimableAmount, processTokenDistribution } from '../services/claim-service';

const router = Router();

/**
 * API per ottenere la configurazione del claim
 */
router.get('/claim-config', (req: Request, res: Response) => {
  // Invia l'indirizzo del contratto dal .env
  res.json({
    contractAddress: process.env.REWARD_DISTRIBUTOR_CONTRACT || '',
    networkRpc: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org/',
    tokenAddress: '0x5A170D59ae8B851DC4DD0D14cC89E5fE541752CE' // IASE Token address
  });
});

/**
 * API per ottenere tutti gli NFT in staking per un indirizzo wallet
 */
router.get('/by-wallet/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({ error: 'Indirizzo wallet richiesto' });
    }
    
    const stakes = await storage.getNftStakesByWallet(address);
    res.json(stakes);
  } catch (error) {
    console.error('Error getting stakes by wallet:', error);
    res.status(500).json({ error: 'Errore nel recupero degli stake' });
  }
});

/**
 * API per ottenere le ricompense per un indirizzo wallet
 */
router.get('/rewards/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({ error: 'Indirizzo wallet richiesto' });
    }
    
    const rewards = await storage.getRewardsByWalletAddress(address);
    res.json(rewards);
  } catch (error) {
    console.error('Error getting rewards by wallet:', error);
    res.status(500).json({ error: 'Errore nel recupero delle ricompense' });
  }
});

/**
 * API per mettere in staking un NFT
 */
router.post('/stake', async (req: Request, res: Response) => {
  try {
    // Validate input
    const stakeData = insertNftStakeSchema.parse(req.body);
    
    // Create stake record
    const stake = await storage.createNftStake(stakeData);
    
    res.status(201).json(stake);
  } catch (error) {
    console.error('Error staking NFT:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dati di staking non validi', details: error.errors });
    }
    
    res.status(500).json({ error: 'Errore durante lo staking dell\'NFT' });
  }
});

/**
 * API per rimuovere lo staking di un NFT
 */
router.post('/unstake', async (req: Request, res: Response) => {
  try {
    const { stakeId } = req.body;
    
    if (!stakeId) {
      return res.status(400).json({ error: 'ID dello stake richiesto' });
    }
    
    const stake = await storage.getNftStakeById(stakeId);
    
    if (!stake) {
      return res.status(404).json({ error: 'Stake non trovato' });
    }
    
    const updatedStake = await storage.endNftStake(stakeId);
    res.json(updatedStake);
  } catch (error) {
    console.error('Error unstaking NFT:', error);
    res.status(500).json({ error: 'Errore durante la rimozione dello staking' });
  }
});

/**
 * API per ottenere l'importo riscuotibile per uno staking
 */
router.post('/get-claimable-amount', async (req: Request, res: Response) => {
  try {
    const { stakeId } = req.body;
    
    if (!stakeId) {
      return res.status(400).json({ error: 'ID dello stake richiesto' });
    }
    
    const claimableAmount = await getClaimableAmount(stakeId);
    res.json({ claimableAmount });
  } catch (error) {
    console.error('Error getting claimable amount:', error);
    res.status(500).json({ error: 'Errore nel recupero dell\'importo riscuotibile' });
  }
});

/**
 * API per elaborare il claim delle ricompense
 * NOTA: Questa API non viene più utilizzata con l'approccio diretto client-contratto
 */
router.post('/process-claim', async (req: Request, res: Response) => {
  try {
    const { stakeId, walletAddress, amount } = req.body;
    
    if (!stakeId || !walletAddress || !amount) {
      return res.status(400).json({ 
        error: 'ID dello stake, indirizzo wallet e importo sono richiesti' 
      });
    }
    
    // Processa la distribuzione dei token
    const result = await processTokenDistribution(stakeId, walletAddress, amount);
    
    res.json({
      success: true,
      transactionHash: result.transactionHash,
      message: 'Ricompense distribuite con successo'
    });
  } catch (error) {
    console.error('Error processing claim:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Errore durante l\'elaborazione del claim' 
    });
  }
});

/**
 * API per segnare le ricompense come reclamate dopo una transazione diretta con il contratto
 */
router.post('/mark-claimed', async (req: Request, res: Response) => {
  try {
    const { stakeId, transactionHash } = req.body;
    
    if (!stakeId) {
      return res.status(400).json({ error: 'ID dello stake richiesto' });
    }
    
    // Ottieni lo stake
    const stake = await storage.getNftStakeById(stakeId);
    
    if (!stake) {
      return res.status(404).json({ error: 'Stake non trovato' });
    }
    
    // Segna le ricompense come riscosse
    await storage.markRewardsAsClaimed(stakeId);
    
    res.json({
      success: true,
      message: 'Ricompense segnate come riscosse',
      transactionHash: transactionHash || 'N/A'
    });
  } catch (error) {
    console.error('Error marking rewards as claimed:', error);
    res.status(500).json({ error: 'Errore durante l\'aggiornamento delle ricompense' });
  }
});

/**
 * API per riscuotere le ricompense (versione compatibile con l'implementazione precedente)
 */
router.post('/claim-rewards', async (req: Request, res: Response) => {
  try {
    const { stakeId } = req.body;
    
    if (!stakeId) {
      return res.status(400).json({ error: 'ID dello stake richiesto' });
    }
    
    // Ottieni lo stake
    const stake = await storage.getNftStakeById(stakeId);
    
    if (!stake) {
      return res.status(404).json({ error: 'Stake non trovato' });
    }
    
    // Ottieni l'importo riscuotibile
    const claimableAmount = await getClaimableAmount(stakeId);
    
    if (claimableAmount <= 0) {
      return res.status(400).json({ error: 'Non ci sono ricompense da riscuotere' });
    }
    
    // Nota: Questo endpoint è principalmente per compatibilità con la vecchia implementazione
    // La logica completa del claim viene gestita da /process-claim
    // Questo endpoint viene utilizzato dal frontend per ottenere l'importo e poi chiamare /process-claim
    
    res.json({
      success: true,
      reward: {
        stakeId,
        amount: claimableAmount
      },
      message: 'Ricompense pronte per essere riscosse'
    });
  } catch (error) {
    console.error('Error claiming rewards:', error);
    res.status(500).json({ error: 'Errore durante la riscossione delle ricompense' });
  }
});

export default router;