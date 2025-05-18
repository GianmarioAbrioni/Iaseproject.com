const { Router } = require('express');
const { createServer } = require('http');
const path = require('path');
const express = require('express');
const { registerRoutes } = require('./dist/routes.js');

exports.registerRoutesWrapper = function registerRoutesWrapper(app) {
  // Registra tutte le rotte, middleware e endpoint da routes.ts
  registerRoutes(app);

  return createServer(app);
};

// Esporta la funzione registerRoutes usata in server/index.ts
exports.registerRoutes = function registerRoutes(app) {
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

module.exports.default = router;