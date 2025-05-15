/**
 * IASE Project - Configurazione generale
 * 
 * Questo file centralizza le configurazioni dell'applicazione
 * e determina se utilizzare il database PostgreSQL o lo storage in memoria.
 */

// Determina se utilizzare il database PostgreSQL o lo storage in memoria
// In produzione, forziamo PostgreSQL per evitare problemi di persistenza
export const USE_MEMORY_DB = process.env.NODE_ENV === 'production' ? false : process.env.USE_MEMORY_DB === "true";

// Log della configurazione
console.log(`🔧 IASE Project - Modalità database: ${USE_MEMORY_DB ? 'IN-MEMORY' : 'POSTGRESQL'}`);
console.log(`🔧 Ambiente: ${process.env.NODE_ENV || 'development'}`);

// Configurazioni generali
export const CONFIG = {
  // Blockchain
  NFT_CONTRACT_ADDRESS: process.env.NFT_CONTRACT_ADDRESS || "0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F",
  REWARD_DISTRIBUTOR_CONTRACT: process.env.REWARD_DISTRIBUTOR_CONTRACT || "0x38c62fcfb6a6bbce341b41ba6740b07739bf6e1f",
  ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY || "uAZ1tPYna9tBMfuTa616YwMcgptV_1vB",
  ALCHEMY_API_URL: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY || "uAZ1tPYna9tBMfuTa616YwMcgptV_1vB"}`,
  USE_ALCHEMY_API: process.env.USE_ALCHEMY_API !== "false", // Abilita di default
  ETH_NETWORK_URL: process.env.ETH_NETWORK_URL || "https://eth.drpc.org",
  BSC_RPC_URL: process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org/",
  
  // Server
  PORT: process.env.PORT || 5000,
  SESSION_SECRET: process.env.SESSION_SECRET || "iase-project-secret-key",
  
  // Staking
  DAILY_REWARD_AMOUNT: 33.33, // ~1000 IASE al mese
  RARITY_MULTIPLIERS: {
    standard: 1.0,
    advanced: 1.5,
    elite: 2.0,
    prototype: 2.5
  }
};