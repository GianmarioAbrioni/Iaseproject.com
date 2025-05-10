/**
 * IASE Project - Server Standalone
 * 
 * Versione completamente indipendente che non utilizza alcun modulo database
 * e funziona esclusivamente con storage in memoria e persistenza su file.
 */

// Import moduli standard (niente database)
import express from 'express';
import session from 'express-session';
import memorystore from 'memorystore';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import http from 'http';
import crypto from 'crypto';

// Info iniziali
console.log("🚀 IASE Project - Server Standalone");
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

// Sessioni con MemoryStore
const MemStore = memorystore(session);
const SESSION_SECRET = process.env.SESSION_SECRET || 'iase-project-secret-key';

app.use(session({
  secret: SESSION_SECRET,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000
  },
  store: new MemStore({
    checkPeriod: 86400000 // Pulisce le sessioni scadute ogni 24h
  }),
  resave: false,
  saveUninitialized: false
}));

// Funzioni Helper per autenticazione
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHmac('sha512', salt).update(password).digest('hex');
  return `${hash}.${salt}`;
}

function verifyPassword(storedPassword, suppliedPassword) {
  const [hash, salt] = storedPassword.split('.');
  const verifyHash = crypto.createHmac('sha512', salt).update(suppliedPassword).digest('hex');
  return hash === verifyHash;
}

// API Routes
// 1. Auth
app.post('/api/register', (req, res) => {
  const { username, password, email } = req.body;
  
  // Verifica se l'utente esiste già
  const existingUser = memoryDb.users.find(u => u.username === username);
  if (existingUser) {
    return res.status(400).json({ error: 'Username already exists' });
  }
  
  // Crea nuovo utente
  const userId = memoryDb.nextIds.users++;
  const hashedPassword = hashPassword(password);
  
  const newUser = {
    id: userId,
    username,
    password: hashedPassword,
    email,
    walletAddress: null,
    createdAt: new Date().toISOString()
  };
  
  memoryDb.users.push(newUser);
  
  // Salva dati dopo registrazione
  saveData();
  
  // Login automatico
  const userResponse = { ...newUser };
  delete userResponse.password;
  
  req.session.user = userResponse;
  res.status(201).json(userResponse);
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = memoryDb.users.find(u => u.username === username);
  if (!user || !verifyPassword(user.password, password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const userResponse = { ...user };
  delete userResponse.password;
  
  req.session.user = userResponse;
  res.json(userResponse);
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.sendStatus(200);
});

app.get('/api/user', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  res.json(req.session.user);
});

// 2. Wallet
app.post('/api/connect-wallet', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const { walletAddress } = req.body;
  
  // Aggiorna utente
  const userIndex = memoryDb.users.findIndex(u => u.id === req.session.user.id);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  memoryDb.users[userIndex].walletAddress = walletAddress;
  req.session.user.walletAddress = walletAddress;
  
  saveData();
  
  res.json({ success: true, user: req.session.user });
});

// 3. Staking
app.post('/api/nft/stake', (req, res) => {
  if (!req.session.user || !req.session.user.walletAddress) {
    return res.status(401).json({ error: 'Authentication or wallet required' });
  }
  
  const { nftId, contractAddress } = req.body;
  const walletAddress = req.session.user.walletAddress;
  
  // Verifica se NFT è già in staking
  const existingStake = memoryDb.nftStakes.find(
    s => s.nftId === nftId && s.status === 'active'
  );
  
  if (existingStake) {
    return res.status(400).json({ error: 'NFT is already staked' });
  }
  
  // Crea stake
  const stakeId = memoryDb.nextIds.nftStakes++;
  const newStake = {
    id: stakeId,
    nftId,
    contractAddress,
    walletAddress,
    startTimestamp: new Date().toISOString(),
    lastVerified: null,
    daysVerified: 0,
    status: 'active',
    endTimestamp: null,
    endReason: null
  };
  
  memoryDb.nftStakes.push(newStake);
  saveData();
  
  res.status(201).json(newStake);
});

app.get('/api/nft/stakes', (req, res) => {
  if (!req.session.user || !req.session.user.walletAddress) {
    return res.status(401).json({ error: 'Authentication or wallet required' });
  }
  
  const walletAddress = req.session.user.walletAddress;
  const stakes = memoryDb.nftStakes.filter(s => s.walletAddress === walletAddress);
  
  res.json(stakes);
});

app.post('/api/nft/unstake/:stakeId', (req, res) => {
  if (!req.session.user || !req.session.user.walletAddress) {
    return res.status(401).json({ error: 'Authentication or wallet required' });
  }
  
  const { stakeId } = req.params;
  const walletAddress = req.session.user.walletAddress;
  
  // Trova lo stake
  const stakeIndex = memoryDb.nftStakes.findIndex(
    s => s.id === parseInt(stakeId) && s.walletAddress === walletAddress && s.status === 'active'
  );
  
  if (stakeIndex === -1) {
    return res.status(404).json({ error: 'Active stake not found' });
  }
  
  // Aggiorna lo stake
  memoryDb.nftStakes[stakeIndex].status = 'ended';
  memoryDb.nftStakes[stakeIndex].endTimestamp = new Date().toISOString();
  memoryDb.nftStakes[stakeIndex].endReason = 'user_unstaked';
  
  saveData();
  
  res.json(memoryDb.nftStakes[stakeIndex]);
});

// 4. Rewards
app.get('/api/rewards', (req, res) => {
  if (!req.session.user || !req.session.user.walletAddress) {
    return res.status(401).json({ error: 'Authentication or wallet required' });
  }
  
  const walletAddress = req.session.user.walletAddress;
  const rewards = memoryDb.stakingRewards.filter(r => r.walletAddress === walletAddress);
  
  res.json(rewards);
});

app.post('/api/rewards/claim/:stakeId', (req, res) => {
  if (!req.session.user || !req.session.user.walletAddress) {
    return res.status(401).json({ error: 'Authentication or wallet required' });
  }
  
  const { stakeId } = req.params;
  const walletAddress = req.session.user.walletAddress;
  
  // Trova le ricompense
  const rewards = memoryDb.stakingRewards.filter(
    r => r.stakeId === parseInt(stakeId) && r.walletAddress === walletAddress && !r.claimed
  );
  
  if (rewards.length === 0) {
    return res.status(404).json({ error: 'No unclaimed rewards found' });
  }
  
  // Aggiorna le ricompense
  for (const reward of rewards) {
    const index = memoryDb.stakingRewards.findIndex(r => r.id === reward.id);
    if (index !== -1) {
      memoryDb.stakingRewards[index].claimed = true;
      memoryDb.stakingRewards[index].claimedAt = new Date().toISOString();
    }
  }
  
  saveData();
  
  res.json({ success: true, claimedRewards: rewards });
});

// 5. NFT Traits
app.post('/api/nft/traits', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const { nftId, traits } = req.body;
  
  // Rimuovi tratti esistenti
  memoryDb.nftTraits = memoryDb.nftTraits.filter(t => t.nftId !== nftId);
  
  // Aggiungi nuovi tratti
  for (const trait of traits) {
    const traitId = memoryDb.nextIds.nftTraits++;
    const newTrait = {
      id: traitId,
      nftId,
      traitType: trait.trait_type,
      value: trait.value
    };
    
    memoryDb.nftTraits.push(newTrait);
  }
  
  saveData();
  
  res.json({ success: true, traits: memoryDb.nftTraits.filter(t => t.nftId === nftId) });
});

app.get('/api/nft/traits/:nftId', (req, res) => {
  const { nftId } = req.params;
  const traits = memoryDb.nftTraits.filter(t => t.nftId === nftId);
  
  res.json(traits);
});

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