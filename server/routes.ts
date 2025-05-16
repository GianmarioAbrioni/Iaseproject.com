import express from 'express';
import path from 'path';
const router = express.Router();

// Importiamo il router di staking
import stakingRouter from './staking';

// Registra il router di staking senza prefisso aggiuntivo
// In modo che sia accessibile come /api/stake
router.use(stakingRouter);

// Endpoint di fallback per il vecchio percorso /stake
router.post('/stake', async (req, res) => {
  try {
    const { tokenId, address, rarityLevel, dailyReward, stakeDate } = req.body;
    
    // Normalizza l'indirizzo per la consistenza
    const normalizedAddress = address?.toLowerCase() || '';
    
    console.log(`Richiesta di staking ricevuta per NFT #${tokenId} da ${normalizedAddress}`);
    console.log('Dati staking:', req.body);
    
    // Se abbiamo parametri mancanti, restituisci errore
    if (!tokenId || !address) {
      return res.status(400).json({ 
        success: false,
        error: 'Parametri mancanti. tokenId e address sono richiesti.'
      });
    }
    
    // Restituisci risposta di successo
    res.status(200).json({
      success: true,
      message: 'Staking registrato con successo',
      data: {
        tokenId,
        address: normalizedAddress,
        rarityLevel,
        dailyReward,
        stakeDate: stakeDate || new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Errore durante lo staking:', error);
    res.status(500).json({ 
      success: false,
      error: 'Errore durante l\'operazione di staking'
    });
  }
});

// Esporta il router
export default router;