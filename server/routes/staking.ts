import { Router } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();

// Importa il modulo staking dalla cartella rarita se esiste
// Non utilizzare moduli dinamici per ora - utilizza il router integrato

// Endpoint di base per lo staking (fallback)
// Registra sia /stake che /staking/stake per compatibilità
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
  } catch (error: any) {
    console.error('Errore durante lo staking:', error);
    res.status(500).json({ 
      success: false,
      error: 'Errore durante l\'operazione di staking'
    });
  }
});

// Endpoint per l'unstaking
router.post('/unstake', async (req, res) => {
  try {
    const { tokenId, address, stakeId } = req.body;
    console.log(`Richiesta di unstaking per NFT #${tokenId}, stakeId: ${stakeId}`);
    
    // Qui inserire la logica per l'unstaking (per ora è un mock)
    res.status(200).json({
      success: true,
      message: 'NFT unstaked con successo',
      data: {
        tokenId,
        address,
        unstakeDate: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Errore durante l\'unstaking:', error);
    res.status(500).json({
      success: false, 
      error: 'Errore durante l\'operazione di unstaking'
    });
  }
});

export default router;