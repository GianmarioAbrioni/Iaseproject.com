import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import express from "express";
import { setupAuth } from "./auth";
import stakingRoutes from "./routes/staking";
import { verifyAndDistributeRewards } from "./services/staking-job";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configura l'autenticazione
  setupAuth(app);

  // Configura le routes per lo staking degli NFT
  app.use("/api/staking", stakingRoutes);
  
  // Aggiungi compatibilità con il percorso /api/nft/stake utilizzato su Render
  app.post("/api/nft/stake", async (req, res) => {
    try {
      const { tokenId, address, rarityLevel, dailyReward, stakeDate } = req.body;
      
      // Normalizza l'indirizzo per la consistenza
      const normalizedAddress = address.toLowerCase();
      
      // Crea il record di staking nel database
      const stake = await storage.createNFTStake({
        tokenId: parseInt(tokenId),
        walletAddress: normalizedAddress,
        rarityLevel,
        dailyReward: parseFloat(dailyReward),
        stakedAt: new Date(stakeDate),
        isActive: true
      });
      
      res.status(201).json(stake);
    } catch (error) {
      console.error("Errore durante lo staking:", error);
      res.status(500).json({ error: "Errore durante l'operazione di staking" });
    }
  });

  // Inizializza lo script di verifica giornaliera degli NFT in staking
  // Sarà eseguito una volta al giorno alle 00:01
  setupDailyStakingVerification();

  // Serve static files from the public directory
  app.use(express.static(path.join(process.cwd(), "public")));

  // API route for articles data
  app.get('/api/articles', (req, res) => {
    try {
      const articlesData = require('../public/iase_articles.json');
      res.json(articlesData);
    } catch (error) {
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

/**
 * Imposta un job giornaliero per verificare gli NFT in staking e distribuire le ricompense
 */
function setupDailyStakingVerification() {
  // Calcola il tempo fino alla prossima esecuzione (00:01)
  const now = new Date();
  const nextExecution = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1, // domani
    0, // ora 0 (mezzanotte)
    1, // minuto 1 (00:01)
    0  // secondi 0
  );
  
  // Calcola millisecondi fino alla prossima esecuzione
  const msUntilNextExecution = nextExecution.getTime() - now.getTime();
  
  // Pianifica la prima esecuzione
  const firstTimer = setTimeout(() => {
    // Esegui il job
    verifyAndDistributeRewards()
      .catch(error => console.error("[Daily Job] Errore nella verifica giornaliera:", error));
    
    // Pianifica le esecuzioni successive (ogni 24 ore)
    setInterval(() => {
      verifyAndDistributeRewards()
        .catch(error => console.error("[Daily Job] Errore nella verifica giornaliera:", error));
    }, 24 * 60 * 60 * 1000); // 24 ore in millisecondi
    
  }, msUntilNextExecution);
  
  // Prevenzione errori - pulizia in caso di shutdown
  process.on('SIGINT', () => {
    clearTimeout(firstTimer);
    process.exit(0);
  });
}
