/**
 * IASE Project - Server Produzione
 * 
 * Versione produzione ottimizzata che utilizza dati reali dalla blockchain
 * per la dashboard e le funzionalità di staking.
 */

// Importazioni essenziali
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import pg from 'pg';

// Fix per __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione database PostgreSQL
const pgConfig = {
  host: process.env.PGHOST || 'dpg-d0ff45buibrs73ekrt6g-a',
  port: Number(process.env.PGPORT) || 5432,
  database: process.env.PGDATABASE || 'iaseproject',
  user: process.env.PGUSER || 'iaseproject',
  password: process.env.PGPASSWORD || 'GRxrehk6Isv8s3dS3KDJFQ3HMVlxc8k1',
  ssl: { rejectUnauthorized: false }
};

// Crea il pool di connessioni
const pool = new pg.Pool(pgConfig);

// Funzioni per interagire con i dati reali
const dataService = {
  // Verifica connessione al database
  async testConnection() {
    let client;
    try {
      client = await pool.connect();
      const result = await client.query('SELECT NOW()');
      return { success: true, time: result.rows[0].now };
    } catch (err) {
      console.error('Errore connessione DB:', err.message);
      return { success: false, error: err.message };
    } finally {
      if (client) client.release();
    }
  },

  // Ottiene NFT reali per un wallet
  async getNFTsForWallet(walletAddress) {
    if (!walletAddress) return [];
    
    let client;
    try {
      client = await pool.connect();
      const query = `
        SELECT * FROM nft_stakes 
        WHERE wallet_address = $1 
        ORDER BY stake_date DESC
      `;
      const result = await client.query(query, [walletAddress]);
      return result.rows || [];
    } catch (err) {
      console.error('Errore query NFT:', err.message);
      return [];
    } finally {
      if (client) client.release();
    }
  },
  
  // Ottiene bilancio token reale
  async getTokenBalance(walletAddress) {
    if (!walletAddress) return { balance: 0, currency: 'IASE' };
    
    let client;
    try {
      client = await pool.connect();
      const query = `
        SELECT SUM(amount) as balance FROM staking_rewards 
        WHERE wallet_address = $1 AND claimed = false
      `;
      const result = await client.query(query, [walletAddress]);
      return { 
        balance: parseInt(result.rows[0]?.balance || 0), 
        currency: 'IASE' 
      };
    } catch (err) {
      console.error('Errore query bilancio:', err.message);
      return { balance: 0, currency: 'IASE' };
    } finally {
      if (client) client.release();
    }
  }
};

// Express setup ottimizzato
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const PORT = process.env.PORT || 3000;

// Configurazione Cache per migliorare le performance
app.use((req, res, next) => {
  if (req.url.match(/\.(css|js|jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }
  next();
});

// Trova cartella public
const publicPaths = [
  process.env.PUBLIC_PATH,
  path.join(__dirname, 'public'),
  path.join(process.cwd(), 'public'),
  '/app/public',
  '/opt/render/project/src/public'
];

let foundPublicPath = null;
for (const publicPath of publicPaths) {
  if (publicPath && fs.existsSync(publicPath)) {
    foundPublicPath = publicPath;
    console.log(`[INFO] Cartella public trovata: ${publicPath}`);
    
    app.use(express.static(publicPath, {
      maxAge: '1d',
      etag: true,
      lastModified: true,
    }));
    break;
  }
}

// API che restituiscono dati reali
app.get('/api/health', async (req, res) => {
  const dbStatus = await dataService.testConnection();
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    database: dbStatus
  });
});

// API per ottenere NFT reali
app.get('/api/nfts/:walletAddress', async (req, res) => {
  const { walletAddress } = req.params;
  const nfts = await dataService.getNFTsForWallet(walletAddress);
  res.json({ nfts });
});

// API per ottenere bilancio token reale
app.get('/api/balance/:walletAddress', async (req, res) => {
  const { walletAddress } = req.params;
  const balance = await dataService.getTokenBalance(walletAddress);
  res.json(balance);
});

// API per Dashboard dati reali
app.get('/api/dashboard/:walletAddress', async (req, res) => {
  const { walletAddress } = req.params;
  
  try {
    // Esegue tutte le query in parallelo per performance
    const [nfts, balance, dbStatus] = await Promise.all([
      dataService.getNFTsForWallet(walletAddress),
      dataService.getTokenBalance(walletAddress),
      dataService.testConnection()
    ]);
    
    // Formatta i dati per la dashboard
    res.json({
      wallet: {
        address: walletAddress,
        balance: balance.balance,
        currency: 'IASE',
        eur_value: (balance.balance / 1000).toFixed(2) // Converti in EUR assumendo 1 IASE = 0.001 EUR
      },
      nfts: nfts,
      nftCount: nfts.length,
      lastActivity: dbStatus.time,
      network: {
        isTest: false, // Questo è importante! Non più rete di test
        name: 'Ethereum Mainnet'
      }
    });
  } catch (err) {
    console.error('Errore API dashboard:', err);
    res.status(500).json({
      error: 'Errore durante il recupero dei dati dashboard',
      message: err.message
    });
  }
});

// Fallback per SPA
app.get('*', (req, res) => {
  if (foundPublicPath && fs.existsSync(path.join(foundPublicPath, 'index.html'))) {
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.sendFile(path.join(foundPublicPath, 'index.html'));
  } else {
    res.status(404).send('Page not found');
  }
});

// Avvio server
const server = http.createServer(app);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[INFO] Server in esecuzione su porta ${PORT}`);
  console.log(`[INFO] Ambiente: ${process.env.NODE_ENV}`);
  console.log(`[INFO] Modalità: PRODUZIONE con dati reali`);
});