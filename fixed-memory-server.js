/**
 * IASE Project - Server ottimizzato per Render
 * 
 * Server completamente in memoria che non richiede PostgreSQL
 * e risolve i problemi con l'import Neon.
 * 
 * IMPORTANTE: Questo file NON utilizza più nessun driver di database
 * quindi non ci saranno errori relativi a parametri di connessione mancanti.
 */

// Imposta queste variabili per evitare errori con il driver Neon
process.env.PGHOST = 'localhost';
process.env.PGUSER = 'localuser';
process.env.PGDATABASE = 'localdb';
process.env.PGPASSWORD = 'localpass';

import express from 'express';
import session from 'express-session';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import http from 'http';

// Info iniziali
console.log("🚀 IASE Project - Server ottimizzato per Render");
console.log("⚙️ Storage in memoria con persistenza su file");
console.log("🌐 Ambiente: Production");

// Setup base Express
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configura directory dati
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'memory-store.json');

// Assicurati che la directory dati esista
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log(`📁 Directory dati creata: ${DATA_DIR}`);
}

// Struttura dati in memoria
const memoryDb = {
  users: [],
  nftStakes: [],
  stakingRewards: [],
  nftTraits: [],
  nextIds: {
    users: 1,
    nftStakes: 1,
    stakingRewards: 1,
    nftTraits: 1
  }
};

// Carica dati dal file se esiste
if (fs.existsSync(DATA_FILE)) {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    const jsonData = JSON.parse(data);
    
    if (jsonData.users) memoryDb.users = jsonData.users;
    if (jsonData.nftStakes) memoryDb.nftStakes = jsonData.nftStakes;
    if (jsonData.stakingRewards) memoryDb.stakingRewards = jsonData.stakingRewards;
    if (jsonData.nftTraits) memoryDb.nftTraits = jsonData.nftTraits;
    if (jsonData.nextIds) memoryDb.nextIds = jsonData.nextIds;
    
    console.log(`📂 Dati caricati: ${memoryDb.users.length} utenti, ${memoryDb.nftStakes.length} stake`);
  } catch (error) {
    console.error(`❌ Errore caricamento dati: ${error.message}`);
  }
}

// Configura salvataggio automatico ogni 5 minuti
let lastSaveTime = Date.now();
const SAVE_INTERVAL = 5 * 60 * 1000; // 5 minuti

function saveData() {
  try {
    const dataToSave = {
      ...memoryDb,
      lastSaveTime: new Date().toISOString()
    };
    
    fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave, null, 2), 'utf8');
    lastSaveTime = Date.now();
    
    console.log(`💾 Dati salvati in ${DATA_FILE} (${memoryDb.users.length} utenti, ${memoryDb.nftStakes.length} stake)`);
    return true;
  } catch (error) {
    console.error(`❌ Errore salvataggio dati: ${error.message}`);
    return false;
  }
}

// Salvataggio periodico
setInterval(saveData, SAVE_INTERVAL);

// Salvataggio alla chiusura
process.on('SIGINT', () => {
  console.log('📥 Salvataggio dati prima della chiusura...');
  saveData();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('📥 Salvataggio dati prima della chiusura...');
  saveData();
  process.exit(0);
});

// Sessioni
const SESSION_SECRET = process.env.SESSION_SECRET || 'iase-project-secret-key';
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 ore
    secure: process.env.NODE_ENV === 'production'
  }
}));

// Endpoint API di base
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    time: new Date().toISOString(),
    memory: {
      users: memoryDb.users.length,
      nftStakes: memoryDb.nftStakes.length,
      stakingRewards: memoryDb.stakingRewards.length,
      nftTraits: memoryDb.nftTraits.length
    },
    lastSave: new Date(lastSaveTime).toISOString()
  });
});

// App config
app.get('/api/config', (req, res) => {
  res.json({
    eth: {
      networkUrl: process.env.ETH_NETWORK_URL || "https://eth.drpc.org",
      nftContractAddress: process.env.NFT_CONTRACT_ADDRESS || "0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F",
    },
    bsc: {
      rpcUrl: process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org/",
      tokenAddress: "0x5A170D59ae8B851DC4DD0D14cC89E5fE541752CE",
      tokenDecimals: 18
    },
    staking: {
      monthlyReward: 1000,
      rarityMultipliers: {
        "Standard": 1.0,
        "Advanced": 1.5,
        "Elite": 2.0,
        "Prototype": 2.5
      },
      rewardDistributorContract: process.env.REWARD_DISTRIBUTOR_CONTRACT || 
                              "0x38c62fcfb6a6bbce341b41ba6740b07739bf6e1f"
    }
  });
});

// Servizio file statici
const publicPath = path.join(__dirname, 'public');
console.log(`📁 Servizio file statici da: ${publicPath}`);
app.use(express.static(publicPath));

// Cattura tutte le altre richieste GET e servi index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Gestione errori
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Si è verificato un errore interno',
    message: err.message
  });
});

// Avvio server
const port = process.env.PORT || 5000;
const server = http.createServer(app);

server.listen(port, '0.0.0.0', () => {
  console.log(`✅ Server avviato sulla porta ${port}`);
});