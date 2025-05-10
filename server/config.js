/**
 * IASE Project - Configurazione
 * 
 * Questo file contiene le configurazioni per l'app IASE Project,
 * adattato per funzionare sia in ambiente di sviluppo che di produzione.
 */

// Determina se utilizzare il database in memoria anziché PostgreSQL
export const USE_MEMORY_DB = process.env.USE_MEMORY_DB === "true";

// Configura l'ambiente (development, production)
const ENV = process.env.NODE_ENV || "development";

console.log(`🔧 IASE Project - Modalità database: ${USE_MEMORY_DB ? 'IN-MEMORY' : 'POSTGRESQL'}`);
console.log(`🔧 Ambiente: ${ENV}`);

// Configurazioni generali
export const CONFIG = {
  // Configurazione smart contract
  eth: {
    networkUrl: process.env.ETH_NETWORK_URL || "https://eth.drpc.org",
    nftContractAddress: process.env.NFT_CONTRACT_ADDRESS || "0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F",
  },
  
  // Configurazione token IASE (BSC)
  bsc: {
    rpcUrl: process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org/",
    tokenAddress: "0x5A170D59ae8B851DC4DD0D14cC89E5fE541752CE",
    tokenDecimals: 18
  },
  
  // Configurazione staking
  staking: {
    // Ricompense mensili in IASE tokens (circa 33.33 token al giorno)
    monthlyReward: 1000,
    
    // Moltiplicatori per rarità NFT
    rarityMultipliers: {
      "Standard": 1.0,     // Frame normale - moltiplicatore 1x
      "Advanced": 1.5,     // Frame oro - moltiplicatore 1.5x
      "Elite": 2.0,        // Frame platino - moltiplicatore 2x
      "Prototype": 2.5     // Frame speciale - moltiplicatore 2.5x
    },
    
    // Contratto di distribuzione ricompense
    rewardDistributorContract: process.env.REWARD_DISTRIBUTOR_CONTRACT || 
                              "0x38c62fcfb6a6bbce341b41ba6740b07739bf6e1f"
  }
};