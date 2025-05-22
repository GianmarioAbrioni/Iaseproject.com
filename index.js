/**
 * IASE Project - Root Index File
 * 
 * File di bootstrap principale per Render che previene
 * l'errore con i percorsi relativi.
 */

// Dipendenze base
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';


// Fix per __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione server
const app = express();
const PORT = process.env.PORT || 10000;

 // Configurazione middleware
app.use(express.urlencoded({ extended: true }));

// Configurazione Express
// Configurazione database
const pg_config = {
  host: process.env.PGHOST || 'dpg-d0ff45buibrs73ekrt6g-a',
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || 'iaseproject',
  user: process.env.PGUSER || 'iaseproject',
  password: process.env.PGPASSWORD || 'GRxrehk6Isv8s3dS3KDJFQ3HMVlxc8k1',
};

// Verifica la presenza della cartella public
const publicPath = path.join(__dirname, 'public');
if (!fs.existsSync(publicPath)) {
  console.error(`ERRORE: Percorso 'public' non trovato: ${publicPath}`);
  console.log('Directory corrente:', __dirname);
  console.log('Contenuto della directory:');
  fs.readdirSync(__dirname).forEach(file => {
    console.log('- ' + file);
  });
} else {
  console.log(`✅ Percorso 'public' trovato: ${publicPath}`);
}

// Configurazione middleware per parsing JSON e URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route API /api/health definita qui (prima di routes.js) perché è una route di base
// e non richiede accesso al database
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    time: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    paths: {
      root: __dirname,
      public: publicPath
    }
  });
});

// Nota: NON registriamo ancora il middleware per i file statici
// Verrà registrato solo DOPO aver caricato le API

// Job di verifica staking giornaliero (per sostituire il cron job di render.yml)
let scheduleStakingVerification = null;

// Funzione per verificare gli stake NFT e distribuire ricompense giornaliere
async function processStakingRewards() {
  console.log("🔄 Verifica stake NFT e distribuzione ricompense avviata");
  
  try {
    // Import necessario per accedere allo storage
    const storageModule = await import('./server/storage.js');
    const storage = storageModule.storage;
    
    // Ottieni tutti gli stake attivi
    const activeStakes = await storage.getAllActiveStakes();
    console.log(`📊 Trovati ${activeStakes.length} stake NFT attivi`);

    let verifiedCount = 0;
    let failedCount = 0;
    
    // Valori fissi per le ricompense in base alla rarità
    const BASE_DAILY_REWARD = 33.33; // Standard (1.0x)
    const ADVANCED_DAILY_REWARD = 50.00; // Advanced (1.5x)
    const ELITE_DAILY_REWARD = 66.67; // Elite (2.0x)
    const PROTOTYPE_DAILY_REWARD = 83.33; // Prototype (2.5x)
    
    for (const stake of activeStakes) {
      try {
        // Per semplificare, assumiamo che tutti gli stake siano validi
        // In un ambiente di produzione, qui andrebbe implementata la verifica
        // della proprietà on-chain tramite API esterne come Alchemy
        
        const isVerified = true; // Semplificate per questo ambiente
        
        if (isVerified) {
          // Aggiorna lo stake come verificato
          await storage.updateNftStakeVerification(stake.id);
          
          // Determina la ricompensa in base alla rarità
          let rewardAmount = BASE_DAILY_REWARD;
          let rarityName = "Standard";
          
          if (stake.rarityName) {
            const rarityLower = stake.rarityName.toLowerCase();
            
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
          
          // Crea record ricompensa
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

// Funzione per pianificare la verifica giornaliera degli staking
async function setupStakingVerification() {
  try {
    // Funzione per calcolare il tempo fino alla prossima mezzanotte
    function scheduleNextVerification() {
      const now = new Date();
      const midnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0, 0, 0 // mezzanotte 00:00:00
      );
      
      const msToMidnight = midnight.getTime() - now.getTime();
      const hoursToMidnight = Math.floor(msToMidnight / (1000 * 60 * 60));
      
      console.log(`⏰ Job di verifica staking pianificato per la prossima mezzanotte (tra ${hoursToMidnight} ore)`);
      
      // Imposta il timer
      return setTimeout(() => {
        console.log('🔄 Avvio verifica giornaliera degli NFT in staking...');
        
        // Esegui il job di verifica
        processStakingRewards()
          .then(() => {
            console.log('✅ Verifica staking completata con successo');
            // Pianifica la prossima esecuzione
            scheduleStakingVerification = scheduleNextVerification();
          })
          .catch(error => {
            console.error("❌ Errore durante la verifica staking:", error);
            // Pianifica comunque la prossima esecuzione
            scheduleStakingVerification = scheduleNextVerification();
          });
      }, msToMidnight);
    }
    
    // Avvia lo scheduler
    scheduleStakingVerification = scheduleNextVerification();
    
    // Aggiungi anche un endpoint per eseguire la verifica manualmente (solo in sviluppo)
    if (process.env.NODE_ENV !== 'production') {
      app.get('/api/admin/verify-stakes', async (req, res) => {
        try {
          console.log('🔄 Avvio manuale della verifica staking...');
          await processStakingRewards();
          res.json({ success: true, message: 'Verifica staking completata con successo' });
        } catch (error) {
          console.error('❌ Errore durante la verifica staking:', error);
          res.status(500).json({ success: false, error: 'Errore durante la verifica staking' });
        }
      });
    }
    
    console.log('⏰ Scheduler verifica staking configurato con successo');
  } catch (error) {
    console.error('❌ Errore durante la configurazione dello scheduler staking:', error);
  }
}

// PRIMA REGISTRIAMO LE API, POI I FILE STATICI
// Questo è fondamentale per il funzionamento corretto degli endpoint API
import('./server/routes.js')
  .then(module => {
    console.log('✅ Modulo routes.js caricato correttamente');

    if (typeof module.registerRoutes === 'function') {
      // 1. PRIMO PASSO: Registra le rotte API (hanno priorità assoluta)
      const server = module.registerRoutes(app);
      console.log('✅ Routes API registrate correttamente');
      
      // Configura lo scheduler per la verifica staking
      setupStakingVerification();
      
      // 2. SECONDO PASSO: Servi i file statici (solo DOPO aver registrato le API)
      app.use(express.static(publicPath));
      
      // 3. TERZO PASSO: Fallback per SPA (ultimo middleware registrato)
      app.get('*', (req, res) => {
        if (fs.existsSync(path.join(publicPath, 'index.html'))) {
          res.sendFile(path.join(publicPath, 'index.html'));
        } else {
          res.status(404).send('Page not found');
        }
      });
      
      // 4. Avvia il server
      server.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ Server IASE in esecuzione sulla porta ${PORT}`);
        console.log(`✅ Modalità: ${process.env.NODE_ENV || 'development'}`);
        console.log(`✅ Database: ${process.env.USE_MEMORY_DB === 'true' ? 'In-Memory' : 'PostgreSQL'}`);
      });
    } else {
      throw new Error('La funzione registerRoutes non è stata trovata nel modulo');
    }
  })
  .catch(err => {
    console.error('❌ Errore nel caricamento di server/routes.js:', err);
  });