/**
 * IASE Project - Configurazione
 * 
 * Questo file contiene le configurazioni per l'app IASE Project,
 * adattato per funzionare sia in ambiente di sviluppo che di produzione.
 */

// Determina se utilizzare il database in memoria anziché PostgreSQL
// Forziamo l'uso di PostgreSQL impostando a false
export const USE_MEMORY_DB = false;

// Configura l'ambiente (development, production)
const ENV = process.env.NODE_ENV || "development";

console.log(`🔧 IASE Project - Modalità database: ${USE_MEMORY_DB ? 'IN-MEMORY' : 'POSTGRESQL'}`);
console.log(`🔧 Ambiente: ${ENV}`);

// Configurazioni generali
export const CONFIG = {
  // Configurazione Alchemy API (priorità principale)
  alchemy: {
    apiKey: process.env.ALCHEMY_API_KEY || "uAZ1tPYna9tBMfuTa616YwMcgptV_1vB",
    apiUrl: process.env.ALCHEMY_API_URL || `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY || "uAZ1tPYna9tBMfuTa616YwMcgptV_1vB"}`,
    useAlchemyApi: process.env.USE_ALCHEMY_API !== "false", // Abilita di default
    enhancedApis: process.env.ALCHEMY_ENHANCED_APIS !== "false",
    network: process.env.ALCHEMY_NETWORK || "1",
  },
  
  // Configurazione smart contract
  eth: {
    networkUrl: process.env.ETH_NETWORK_URL || `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY || "84ed164327474b4499c085d2e4345a66"}`,
    networkUrlFallback: process.env.ETH_NETWORK_FALLBACK || "https://rpc.ankr.com/eth",
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