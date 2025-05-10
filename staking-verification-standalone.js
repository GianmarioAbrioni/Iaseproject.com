/**
 * IASE Project - Staking Verification Job Standalone
 * 
 * Versione completamente indipendente che non utilizza alcun modulo database
 * e funziona esclusivamente con storage in memoria e persistenza su file.
 */

// FIX IMPORTANTE: Imposta esplicitamente 'localhost' come host di database
// come richiesto dall'errore in Render "please set the host to 'localhost' explicitly"
process.env.PGHOST = 'localhost';
process.env.PGUSER = 'localuser';
process.env.PGDATABASE = 'localdb';
process.env.PGPASSWORD = 'localpass';
process.env.DATABASE_URL = 'postgresql://localuser:localpass@localhost:5432/localdb';

// Import moduli standard (niente database)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ethers } from 'ethers';

// Info iniziali
console.log("🔄 IASE Project - Job Verifica Staking Standalone");
console.log("⚙️ Storage in memoria con persistenza su file");

// Configura directory dati
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'memory-store.json');

// Verifica directory e file
if (!fs.existsSync(DATA_DIR)) {
  console.log(`❌ Directory dati non trovata: ${DATA_DIR}`);
  process.exit(1);
}

if (!fs.existsSync(DATA_FILE)) {
  console.log(`❌ File dati non trovato: ${DATA_FILE}`);
  process.exit(1);
}

// Carica i dati
let memoryDb;
try {
  const data = fs.readFileSync(DATA_FILE, 'utf8');
  memoryDb = JSON.parse(data);
  console.log(`📂 Dati caricati: ${memoryDb.users.length} utenti, ${memoryDb.nftStakes.length} stake`);
} catch (error) {
  console.error(`❌ Errore caricamento dati: ${error.message}`);
  process.exit(1);
}

// Configurazione
const ETH_NETWORK_URL = process.env.ETH_NETWORK_URL || "https://eth.drpc.org";
const NFT_CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS || "0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F";
const MONTHLY_REWARD = 1000; // 1000 IASE tokens mensili
const DAILY_REWARD = MONTHLY_REWARD / 30; // ~33.33 IASE tokens al giorno
const RARITY_MULTIPLIERS = {
  "Standard": 1.0,
  "Advanced": 1.5,
  "Elite": 2.0,
  "Prototype": 2.5
};

// Funzione per salvare i dati
function saveData() {
  try {
    memoryDb.lastSaveTime = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(memoryDb, null, 2), 'utf8');
    console.log(`💾 Dati salvati in ${DATA_FILE}`);
    return true;
  } catch (error) {
    console.error(`❌ Errore salvataggio dati: ${error.message}`);
    return false;
  }
}

// Funzione per verificare gli NFT
async function verifyStakes() {
  console.log("🔍 Avvio verifica staking...");
  
  // Filtro per stake attivi non verificati oggi
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const activeStakes = memoryDb.nftStakes.filter(stake => 
    stake.status === "active" && 
    (!stake.lastVerified || new Date(stake.lastVerified) < today)
  );
  
  console.log(`ℹ️ Trovati ${activeStakes.length} stake attivi da verificare`);
  
  if (activeStakes.length === 0) {
    console.log("✅ Nessuno stake da verificare oggi");
    return;
  }
  
  // Connessione a Ethereum
  console.log(`🔌 Connessione a Ethereum: ${ETH_NETWORK_URL}`);
  const provider = new ethers.providers.JsonRpcProvider(ETH_NETWORK_URL);
  
  // ABI minimo per leggere tokenURI e ownerOf
  const nftAbi = [
    "function tokenURI(uint256 tokenId) view returns (string)",
    "function ownerOf(uint256 tokenId) view returns (address)"
  ];
  
  const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, nftAbi, provider);
  
  // Verifica ogni stake
  for (const stake of activeStakes) {
    console.log(`🔍 Verificando stake ${stake.id} - NFT #${stake.nftId} - Wallet: ${stake.walletAddress}`);
    
    try {
      // Verifica proprietà
      const currentOwner = await nftContract.ownerOf(stake.nftId);
      
      if (currentOwner.toLowerCase() !== stake.walletAddress.toLowerCase()) {
        console.log(`⚠️ NFT #${stake.nftId} non più posseduto da ${stake.walletAddress}`);
        
        // Termina lo stake
        const stakeIndex = memoryDb.nftStakes.findIndex(s => s.id === stake.id);
        if (stakeIndex !== -1) {
          memoryDb.nftStakes[stakeIndex].status = "ended";
          memoryDb.nftStakes[stakeIndex].endTimestamp = new Date().toISOString();
          memoryDb.nftStakes[stakeIndex].endReason = "ownership_change";
        }
        continue;
      }
      
      // Calcola rarità e ricompensa
      let rarity = "Standard"; // Default
      const nftTraits = memoryDb.nftTraits.filter(trait => trait.nftId === stake.nftId);
      
      for (const trait of nftTraits) {
        if (trait.traitType === "CARD FRAME") {
          if (trait.value === "Advanced") rarity = "Advanced";
          else if (trait.value === "Elite") rarity = "Elite";
          else if (trait.value === "Prototype") rarity = "Prototype";
          break;
        }
      }
      
      // Calcolo ricompensa con moltiplicatore di rarità
      const rarityMultiplier = RARITY_MULTIPLIERS[rarity] || 1.0;
      const rewardAmount = DAILY_REWARD * rarityMultiplier;
      
      console.log(`💰 Ricompensa calcolata: ${rewardAmount.toFixed(2)} IASE (${rarity}, ${rarityMultiplier}x)`);
      
      // Crea ricompensa
      const rewardId = memoryDb.nextIds.stakingRewards++;
      const reward = {
        id: rewardId,
        stakeId: stake.id,
        amount: rewardAmount,
        timestamp: new Date().toISOString(),
        walletAddress: stake.walletAddress,
        claimed: false,
        rarityMultiplier
      };
      
      memoryDb.stakingRewards.push(reward);
      
      // Aggiorna lo stake
      const stakeIndex = memoryDb.nftStakes.findIndex(s => s.id === stake.id);
      if (stakeIndex !== -1) {
        memoryDb.nftStakes[stakeIndex].lastVerified = new Date().toISOString();
        memoryDb.nftStakes[stakeIndex].daysVerified = (memoryDb.nftStakes[stakeIndex].daysVerified || 0) + 1;
      }
      
      console.log(`✅ Ricompensa di ${rewardAmount.toFixed(2)} IASE aggiunta per NFT #${stake.nftId}`);
      
    } catch (error) {
      console.error(`❌ Errore durante la verifica di NFT #${stake.nftId}:`, error.message);
    }
  }
  
  // Salva i dati
  console.log("💾 Salvataggio modifiche...");
  saveData();
  console.log("✅ Processo di verifica completato");
}

// Esegui verifica e termina
verifyStakes()
  .then(() => {
    console.log("🏁 Job completato con successo!");
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ Errore durante l'esecuzione del job:", error);
    process.exit(1);
  });