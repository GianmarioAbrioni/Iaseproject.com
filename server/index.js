import { Router } from 'express';
import { createServer } from 'http';
import path from 'path';
import express from 'express';
import stakingRoutes from './routes.js'; // Assuming .js extension for ES modules

// Esporta la funzione registerRoutes usata in server/index.ts
export function registerRoutes(app) {
  // Registra le routes di staking sotto /api/staking
  app.use("/api/staking", stakingRoutes);

  // Endpoint diretto per lo staking (per compatibilità)
  app.post("/api/stake", async (req, res) => {
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
};
// Note: The original TypeScript code exports 'router' but it is not defined in the provided snippet.
// We are preserving the export statement exactly as requested, but 'router' will be undefined.
export default router;
