/**
 * IASE Project - Server con fix per ESM e path
 * 
 * Questo file è progettato specificamente per funzionare in ambiente Render
 * e risolvere il problema con import.meta.url e paths[0]
 */

// Importazioni standard
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { config as dotenvConfig } from 'dotenv';
import express from "express";

// Applica configurazione per variabili d'ambiente
dotenvConfig();

// Configura le chiavi API per la blockchain
process.env.ALCHEMY_API_KEY = 'uAZ1tPYna9tBMfuTa616YwMcgptV_1vB';
process.env.ETH_NETWORK_URL = 'https://mainnet.infura.io/v3/84ed164327474b4499c085d2e4345a66';
process.env.NFT_CONTRACT_ADDRESS = '0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F';

// Importa direttamente il server già pronto da routes.js

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Stampa informazioni di ambiente per debug
console.log(`[ENV] NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`[ENV] PUBLIC_PATH: ${process.env.PUBLIC_PATH || 'non impostato'}`);
console.log(`[ENV] STATIC_PATH: ${process.env.STATIC_PATH || 'non impostato'}`);
console.log(`[ENV] CONFIG_PATH: ${process.env.CONFIG_PATH || 'non impostato'}`);
console.log(`[ENV] USE_MEMORY_DB: ${process.env.USE_MEMORY_DB || 'non impostato'}`);
console.log(`[ENV] PORT: ${process.env.PORT || '3000 (default)'}`);
console.log(`[ENV] DATABASE_URL: ${process.env.DATABASE_URL || 'non impostato'}`);
console.log(`[ENV] LOG_LEVEL: ${process.env.LOG_LEVEL || 'non impostato'}`);
console.log(`[ENV] DEBUG: ${process.env.DEBUG || 'non impostato'}`);

// Funzione per logging in base al livello
const logLevels = { error: 0, warn: 1, info: 2, verbose: 3, debug: 4 };
const logLevel = process.env.LOG_LEVEL ? logLevels[process.env.LOG_LEVEL.toLowerCase()] || 2 : 2;

function log(level, message) {
  const messageLevel = logLevels[level.toLowerCase()];
  if (messageLevel <= logLevel) {
    const prefix = level.toUpperCase().padEnd(7);
    console.log(`[${prefix}] ${message}`);
  }
}

// Fix per __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
log('info', `Directory corrente: ${__dirname}`);


// Configurazione database
process.env.PGHOST = process.env.PGHOST || 'dpg-d0ff45buibrs73ekrt6g-a';
process.env.PGUSER = process.env.PGUSER || 'iaseproject';
process.env.PGDATABASE = process.env.PGDATABASE || 'iaseproject';
process.env.PGPASSWORD = process.env.PGPASSWORD || 'GRxrehk6Isv8s3dS3KDJFQ3HMVlxc8k1';
process.env.PGPORT = process.env.PGPORT || '5432';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://iaseproject:GRxrehk6Isv8s3dS3KDJFQ3HMVlxc8k1@dpg-d0ff45buibrs73ekrt6g-a.oregon-postgres.render.com/iaseproject';
process.env.USE_MEMORY_DB = process.env.USE_MEMORY_DB || "false";
process.env.NODE_ENV = process.env.NODE_ENV || "production";


// Verifica percorsi e serve file statici
const publicPaths = [
  process.env.PUBLIC_PATH || process.env.STATIC_PATH, // Priorità alle variabili d'ambiente
  process.env.ALTERNATIVE_PUBLIC_PATH, // Percorso alternativo
  path.join(__dirname, 'public'),
  path.join(__dirname, '..', 'public'),
  path.join(process.cwd(), 'public'),
  '/app/public',  // Percorso in ambiente Render
  '/opt/render/project/src/public' // Percorso alternativo in Render
];

let foundPublicPath = null;

// Lista tutte le directory per debug
log('debug', 'Contenuto directory principale:');
fs.readdirSync(process.cwd()).forEach(file => {
  const stats = fs.statSync(path.join(process.cwd(), file));
  log('debug', `- ${file} ${stats.isDirectory() ? '[directory]' : '[file]'}`);
});

log('debug', 'Contenuto directory del server:');
fs.readdirSync(__dirname).forEach(file => {
  const stats = fs.statSync(path.join(__dirname, file));
  log('debug', `- ${file} ${stats.isDirectory() ? '[directory]' : '[file]'}`);
});

// Cerca cartella public
for (const publicPath of publicPaths) {
  if (!publicPath) continue; // Salta percorsi undefined o null
  
  log('info', `Verifica percorso: ${publicPath}`);
  try {
    if (fs.existsSync(publicPath)) {
      foundPublicPath = publicPath;
      log('info', `✅ Cartella public trovata: ${publicPath}`);
      
      // Lista contenuto per verifica
      log('debug', 'Contenuto della cartella public:');
      fs.readdirSync(publicPath).forEach(file => {
        log('debug', `- ${file}`);
      });
      
      app.use(express.static(publicPath));
      break;
    }
  } catch (err) {
    log('error', `Errore durante la verifica del percorso ${publicPath}: ${err.message}`);
  }
}

if (!foundPublicPath) {
  log('error', '❌ Impossibile trovare la cartella public!');
  
  // Tenta di copiare la cartella public in una posizione accessibile
  const sourcePath = path.join(process.cwd(), 'public');
  const targetPath = path.join(__dirname, 'public');
  
  if (fs.existsSync(sourcePath) && !fs.existsSync(targetPath)) {
    log('info', `Tentativo di copiare public da ${sourcePath} a ${targetPath}...`);
    try {
      fs.mkdirSync(targetPath, { recursive: true });
      fs.readdirSync(sourcePath).forEach(file => {
        const sourceFile = path.join(sourcePath, file);
        const targetFile = path.join(targetPath, file);
        fs.copyFileSync(sourceFile, targetFile);
        log('debug', `Copiato: ${file}`);
      });
      log('info', '✅ Cartella public copiata con successo');
      foundPublicPath = targetPath;
      app.use(express.static(targetPath));
    } catch (err) {
      log('error', `Errore durante la copia: ${err.message}`);
    }
  }
}



// API health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: process.env.USE_MEMORY_DB === 'false' ? 'In-Memory' : 'PostgreSQL',
    paths: {
      __dirname,
      cwd: process.cwd(),
      foundPublicPath
    }
  });
});



// Import dinamico di routes.js
import('./server/routes.js').then(async (module) => {
    if (typeof module.registerRoutes === 'function') {
        module.registerRoutes(app);
    } else {
        throw new Error('registerRoutes non è una funzione esportata da routes.js');
    }

    // Importa i moduli necessari per il job di staking
    import('./server/storage.js').then(storageModule => {
        const storage = storageModule.storage;
        
        import('./server/services/nft-verification.js').then(verificationModule => {
            const verifyNftOwnership = verificationModule.verifyNftOwnership;
            
            // Costanti globali per i valori fissi dei reward
            const BASE_DAILY_REWARD = 33.33; // Standard (1.0x)
            const ADVANCED_DAILY_REWARD = 50.00; // Advanced (1.5x)
            const ELITE_DAILY_REWARD = 66.67; // Elite (2.0x)
            const PROTOTYPE_DAILY_REWARD = 83.33; // Prototype (2.5x)
            
            // Funzione principale per elaborare le ricompense di staking
            async function processStakingRewards() {
                console.log("🔄 Verifica stake NFT e distribuzione ricompense avviata");
                
                try {
                    // Ottieni tutti gli stake attivi
                    const activeStakes = await storage.getAllActiveStakes();
                    console.log(`📊 Trovati ${activeStakes.length} stake NFT attivi`);
                    
                    let verifiedCount = 0;
                    let failedCount = 0;
                    
                    for (const stake of activeStakes) {
                        try {
                            // Verifica proprietà NFT
                            console.log(`🔍 Verifica NFT ID ${stake.nftId} per wallet ${stake.walletAddress}`);
                            const isVerified = await verifyNftOwnership(stake.walletAddress, stake.nftId);
                            
                            if (isVerified) {
                                // Aggiorna lo stake come verificato
                                await storage.updateNftStakeVerification(stake.id);
                                
                                // Usa valori fissi per le ricompense in base alla rarità
                                let rewardAmount = BASE_DAILY_REWARD;
                                let rarityName = "Standard";
                                
                                if (stake.rarityTier) {
                                    const rarityLower = stake.rarityTier.toLowerCase();
                                    
                                    if (rarityLower.includes('advanced')) {
                                        rewardAmount = ADVANCED_DAILY_REWARD;
                                        rarityName = "Advanced";
                                    } else if (rarityLower.includes('elite')) {
                                        rewardAmount = ELITE_DAILY_REWARD;
                                        rarityName = "Elite";
                                    } else if (rarityLower.includes('prototype')) {
                                        rewardAmount = PROTOTYPE_DAILY_REWARD;
                                        rarityName = "Prototype";
                                    }
                                }
                                
                                // Crea record ricompensa usando esattamente la struttura dal database reale
                                const reward = {
                                    stakeId: stake.id,
                                    amount: rewardAmount,
                                    rewardDate: new Date(),
                                    claimed: false,
                                    claimTxHash: null
                                };
                                
                                await storage.createStakingReward(reward);
                                
                                console.log(`✅ Ricompensa di ${rewardAmount.toFixed(2)} IASE tokens (${rarityName}) assegnata per NFT ${stake.nftId}`);
                                verifiedCount++;
                            } else {
                                console.log(`❌ Verifica fallita per NFT ${stake.nftId}: non più di proprietà di ${stake.walletAddress}`);
                                // Termina lo stake
                                await storage.endNftStake(stake.id);
                                failedCount++;
                            }
                        } catch (error) {
                            console.error(`⚠️ Errore durante la verifica dello stake ${stake.id}:`, error);
                            failedCount++;
                        }
                    }
                    
                    console.log(`🏁 Processo completato: ${verifiedCount} stake verificati, ${failedCount} falliti`);
                    return { verifiedCount, failedCount };
                } catch (error) {
                    console.error("🚨 Errore durante l'elaborazione degli stake:", error);
                    throw error;
                }
            }
            
            // Costanti per la pianificazione
            const HOURS_24 = 24 * 60 * 60 * 1000; // 24 ore in millisecondi
            
            // Funzione per eseguire il job
            function runStakingJob() {
                console.log('🔄 Avvio verifica e distribuzione ricompense staking...');
                processStakingRewards()
                    .then(() => console.log('✅ Verifica staking completata con successo'))
                    .catch(error => console.error('❌ Errore durante la verifica staking:', error));
            }
            
            // Pianifica l'esecuzione quotidiana
            const now = new Date();
            const midnight = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() + 1,
                0, 0, 0 // mezzanotte 00:00:00
            );
            const msToMidnight = midnight.getTime() - now.getTime();
            const hoursToMidnight = Math.floor(msToMidnight / (1000 * 60 * 60));
            
            // Prima esecuzione alla prossima mezzanotte
            setTimeout(function() { runStakingJob(); }, msToMidnight);
            
            // Pianifica le esecuzioni successive ogni 24 ore
            setInterval(function() { runStakingJob(); }, HOURS_24);
            
            console.log(`⏰ Job di verifica staking pianificato per la prossima mezzanotte (tra ${hoursToMidnight} ore)`);
            console.log('⏰ Scheduler verifica staking configurato con successo');
        }).catch(error => {
            console.error('❌ Errore durante l\'importazione del modulo nft-verification:', error);
        });
    }).catch(error => {
        console.error('❌ Errore durante l\'importazione del modulo storage:', error);
    });

    const PORT = process.env.PORT || 10000;
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ Server IASE in esecuzione sulla porta ${PORT}`);
        console.log(`✅ Modalità: ${process.env.NODE_ENV || 'development'}`);
        console.log(`✅ Database: ${process.env.USE_MEMORY_DB === 'true' ? 'In-Memory' : 'PostgreSQL'}`);
    });
}).catch(err => {
    console.error('❌ Errore nel caricamento di server/routes.js:', err);
});

// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––


// – SPA fallback – skip all /api routes:
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();          // passa al router /api/...
  }
  // altrimenti serviamo l’index.html della SPA
  const indexHtml = path.join(foundPublicPath, 'index.html');
  if (fs.existsSync(indexHtml)) {
    return res.sendFile(indexHtml);
  }
  res.status(404).send('Page not found');
});
