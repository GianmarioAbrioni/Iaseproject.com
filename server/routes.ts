import express, { type Express } from 'express';
import { createServer, type Server } from 'http';
import path from 'path';
import stakingRouter from './routes/staking';
import claimRouter from './routes/claim';

export function registerRoutes(app: Express): Server {
  // Registra i router specifici
  app.use('/api/staking', stakingRouter);
  app.use('/api/claim', claimRouter);
  
  // Aggiungi un endpoint personalizzato per gestire le chiamate da staking.html/js
  app.get('/api/by-wallet/:address', async (req, res) => {
    try {
      // Ottieni l'indirizzo dal parametro
      const walletAddress = req.params.address.toLowerCase();
      console.log(`Endpoint personalizzato: Chiamata a /api/by-wallet/${walletAddress}`);
      
      // Cerca gli stake nel database
      const { storage } = await import('./storage');
      const stakes = await storage.getNftStakesByWallet(walletAddress);
      
      // Restituisci i dati con la struttura attesa dai client
      res.json({ stakes: stakes || [] });
    } catch (error) {
      console.error('Errore nell\'endpoint personalizzato:', error);
      res.status(500).json({ error: 'Errore interno', message: 'Si è verificato un errore durante il recupero degli stake' });
    }
  });
  
  // Endpoint per gestire le chiamate POST a get-staked-nfts
  app.post('/api/get-staked-nfts', async (req, res) => {
    try {
      // Ottieni l'indirizzo dal body
      const walletAddress = req.body.address?.toLowerCase();
      
      if (!walletAddress) {
        return res.status(400).json({ error: 'Indirizzo wallet mancante' });
      }
      
      console.log(`Endpoint personalizzato: Chiamata POST a /api/get-staked-nfts per ${walletAddress}`);
      
      // Cerca gli stake nel database
      const { storage } = await import('./storage');
      const stakes = await storage.getNftStakesByWallet(walletAddress);
      
      // Restituisci i dati con la struttura attesa dai client
      res.json({ stakes: stakes || [] });
    } catch (error) {
      console.error('Errore nell\'endpoint personalizzato:', error);
      res.status(500).json({ error: 'Errore interno', message: 'Si è verificato un errore durante il recupero degli stake' });
    }
  });
  app.post('/api/stake', async (req, res) => {
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

  // Serve static files from the public directory
  app.use(express.static(path.join(process.cwd(), "public")));

  // API route for articles data
  app.get('/api/articles', (req, res) => {
    try {
      const articlesData = require('../public/iase_articles.json');
      res.json(articlesData);
    } catch (error: any) {
      console.error('Error loading articles data:', error);
      res.status(500).json({ error: 'Failed to load articles data' });
    }
  });

  // Serve HTML files for specific routes
  app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
  });
  
  // Project routes
  app.get('/project-overview', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'project-overview.html'));
  });
  
  app.get('/technology', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'technology.html'));
  });
  
  app.get('/behind', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'behind.html'));
  });
  
  // Web3 routes
  app.get('/web3', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'web3.html'));
  });
  
  app.get('/token', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'token.html'));
  });
  
  app.get('/nft', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'nft.html'));
  });
  
  app.get('/staking', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'staking.html'));
  });
  
  app.get('/roadmap', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'roadmap.html'));
  });
  
  // Resources routes
  app.get('/articles', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'articles.html'));
  });
  
  app.get('/publication', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'publication.html'));
  });
  
  app.get('/contact', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'contact.html'));
  });
  
  // Policy routes
  app.get('/privacy-policy', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'privacy-policy.html'));
  });
  
  app.get('/cookie-policy', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'cookie-policy.html'));
  });

  // Fallback route - send index.html for any other routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
  });

  const httpServer = createServer(app);
  
  return httpServer;
}
