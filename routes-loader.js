const express = require('express');
const { createServer } = require('http');
const path = require('path');
const claimRouter = require('./routes/claim');
const bodyParser = require('body-parser');

/**
 * Registra tutte le rotte necessarie per l'API
 * Usato in ambienti come Render che non supportano TS direttamente
 * @param {import('express').Express} app
 * @returns {import('http').Server}
 */
function registerRoutes(app) {
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // CORS per tutte le richieste
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
  });

  // Logging
  app.use((req, res, next) => {
    console.log(`📝 [${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  // Route /api/claim
  app.use('/api/claim', claimRouter);

  // ========== API PERSONALIZZATE ==========
  // 1. Staking
  app.post('/api/stake', async (req, res) => {
    try {
      const { tokenId, address, rarityLevel, dailyReward, stakeDate } = req.body;
      const normalizedAddress = address?.toLowerCase() || '';
      console.log(`🔄 Richiesta di staking per NFT #${tokenId} da ${normalizedAddress}`);
      console.log('📦 Dati staking:', req.body);

      if (!tokenId || !address || !rarityLevel || !dailyReward || !stakeDate) {
        return res.status(400).json({ error: 'Dati incompleti' });
      }

      const { storage } = await import('./storage');
      await storage.addNftStake({ tokenId, address: normalizedAddress, rarityLevel, dailyReward, stakeDate });
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('❌ Errore nello staking:', error);
      res.status(500).json({ error: 'Errore interno' });
    }
  });

  // 2. Unstaking
  app.post('/api/unstake', async (req, res) => {
    try {
      const { tokenId, address } = req.body;
      const normalizedAddress = address?.toLowerCase() || '';
      console.log(`🔁 Unstaking NFT #${tokenId} da ${normalizedAddress}`);
      console.log('📦 Dati unstaking:', req.body);

      if (!tokenId || !address) {
        return res.status(400).json({ success: false, error: 'Parametri mancanti. tokenId e address richiesti.' });
      }

      const { storage } = await import('./storage');
      const stakes = await storage.getNftStakesByWallet(normalizedAddress);
      // TODO: rimuovere il tokenId dalla lista stakes
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('❌ Errore durante unstaking:', error);
      res.status(500).json({ error: 'Errore interno' });
    }
  });

  // 3. Ottieni NFT in staking per wallet
  app.get('/api/by-wallet/:address', async (req, res) => {
    try {
      const walletAddress = req.params.address.toLowerCase();
      console.log(`🔍 GET /api/by-wallet/${walletAddress}`);

      const { storage } = await import('./storage');
      const stakes = await storage.getNftStakesByWallet(walletAddress);
      res.json({ stakes: stakes || [] });
    } catch (error) {
      console.error('❌ Errore by-wallet:', error);
      res.status(500).json({ error: 'Errore interno', message: 'Errore nel recupero degli stake' });
    }
  });

  // 4. POST alternativa per ottenere NFT in staking
  app.post('/api/get-staked-nfts', async (req, res) => {
    try {
      const walletAddress = req.body.address?.toLowerCase();
      if (!walletAddress) {
        return res.status(400).json({ error: 'Indirizzo wallet mancante' });
      }

      console.log(`📩 POST /api/get-staked-nfts per ${walletAddress}`);

      const { storage } = await import('./storage');
      const stakes = await storage.getNftStakesByWallet(walletAddress);
      res.json({ stakes: stakes || [] });
    } catch (error) {
      console.error('❌ Errore get-staked-nfts:', error);
      res.status(500).json({ error: 'Errore interno', message: 'Errore nel recupero degli stake' });
    }
  });

  return createServer(app);
}

module.exports = { registerRoutes };