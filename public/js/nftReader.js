/**
 * IASE NFT Reader - Versione ottimizzata con Alchemy API
 * Utility script per leggere gli NFT dal wallet dell'utente
 * utilizzando Alchemy API per massima affidabilità e performance
 * 
 * Versione 2.0.0 - 2025-05-15
 * - Integrazione diretta con Alchemy API
 * - Eliminato loop di scansione token per maggiore efficienza
 * - Caricamento istantaneo di tutti gli NFT con una sola chiamata API
 * - Logging migliorato per debug
 * - Hardcoded API key e indirizzi per funzionamento immediato
 * - Supporto sia per import ES6 che per script tag (doppia modalità)
 */

// Determina se lo script viene eseguito come modulo ES6 o script normale
const isModule = typeof exports === 'object' && typeof module !== 'undefined';

// Configurazioni globali con dati reali (hardcoded per render)
// Prendi prima da window (se impostati in HTML) altrimenti usa valori di default
const IASE_NFT_CONTRACT = window.NFT_CONTRACT_ADDRESS || '0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F';
const ALCHEMY_API_KEY = window.ALCHEMY_API_KEY || 'uAZ1tPYna9tBMfuTa616YwMcgptV_1vB';
const REWARDS_CONTRACT = window.REWARDS_CONTRACT_ADDRESS || '0x38C62fCFb6a6Bbce341B41bA6740B07739Bf6E1F';
const ALCHEMY_API_URL = `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

// Log delle configurazioni (solo in modalità debug)
console.log("📊 IASE NFT Reader - Configurazione:");
console.log(`- NFT Contract: ${IASE_NFT_CONTRACT}`);
console.log(`- Alchemy API Key: ${ALCHEMY_API_KEY.substring(0, 4)}...${ALCHEMY_API_KEY.substring(ALCHEMY_API_KEY.length - 4)}`);
console.log(`- Rewards Contract: ${REWARDS_CONTRACT}`);

/**
 * Legge gli NFT posseduti da un indirizzo wallet utilizzando Alchemy API
 * Versione completamente riscritta per usare API Alchemy invece della scansione diretta
 * @returns {Promise<{address: string, balance: string, nftIds: string[]}>}
 */
async function getUserNFTs() {
  try {
    // Make sure Ethereum provider is available
    if (!window.ethereum) {
      throw new Error("No Ethereum provider found. Please install MetaMask or another wallet.");
    }
    
    // Request account access
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (!accounts || accounts.length === 0) {
      throw new Error("No Ethereum accounts found. Please unlock your wallet.");
    }
    
    const walletAddress = accounts[0];
    console.log(`🔍 Cercando NFT per l'indirizzo: ${walletAddress}`);
    
    // Costruisci l'URL per la chiamata Alchemy API
    const url = `${ALCHEMY_API_URL}/getNFTs?owner=${walletAddress}&contractAddresses[]=${IASE_NFT_CONTRACT}&withMetadata=true`;
    
    try {
      console.log("🔄 Chiamata API Alchemy in corso...");
      // Esegui la chiamata API con fetch
      const response = await fetch(url);
      const data = await response.json();
      
      console.log("✅ Risposta API Alchemy ricevuta:", data);
      
      // Estrai i token IDs dagli NFT restituiti
      const ownedNfts = data.ownedNfts || [];
      const nftIds = ownedNfts.map(nft => {
        // Estrai tokenId dal tokenId dell'API (che potrebbe essere in hex)
        const tokenId = nft.id?.tokenId;
        if (!tokenId) return null;
        
        // Converti da hex a decimale se necessario
        if (tokenId.startsWith('0x')) {
          return parseInt(tokenId, 16).toString();
        }
        return tokenId;
      }).filter(id => id !== null);
      
      console.log(`✅ Trovati ${nftIds.length} NFT per questo wallet via Alchemy API`);
      
      return {
        address: walletAddress,
        balance: nftIds.length.toString(),
        nftIds: nftIds
      };
    } catch (error) {
      console.error("❌ Errore nel recupero NFT tramite Alchemy API:", error);
      
      // In caso di errore, ritorniamo un array vuoto
      console.log("⚠️ Nessun NFT recuperato a causa di un errore con l'API");
      
      return {
        address: walletAddress,
        balance: "0",
        nftIds: []
      };
    }
  } catch (error) {
    console.error("❌ Errore generale in getUserNFTs:", error);
    return { address: '', balance: '0', nftIds: [] };
  }
}

/**
 * Ottiene i metadati di un NFT specifico tramite Alchemy API
 * @param {number|string} tokenId - ID del token NFT (può essere numero o stringa)
 * @returns {Promise<Object>} - Metadati dell'NFT
 */
async function getNFTMetadata(tokenId) {
  try {
    console.log(`🔍 Recupero metadati per NFT #${tokenId}...`);
    
    // Costruisci l'URL per la chiamata Alchemy API
    const url = `${ALCHEMY_API_URL}/getNFTMetadata?contractAddress=${IASE_NFT_CONTRACT}&tokenId=${tokenId}`;
    
    // Esegui la chiamata API
    const response = await fetch(url);
    const data = await response.json();
    
    console.log(`✅ Metadati ricevuti per NFT #${tokenId}:`, data);
    
    // Estrai e normalizza i metadati
    const metadata = {
      name: data.title || `IASE Unit #${tokenId}`,
      description: data.description || "IASE NFT Unit",
      image: normalizeURI(data.media?.[0]?.gateway || data.media?.[0]?.raw || ""),
      attributes: data.metadata?.attributes || []
    };
    
    return metadata;
  } catch (error) {
    console.error(`❌ Errore nel recupero metadati per NFT #${tokenId}:`, error);
    
    // In caso di errore, restituisci metadati di placeholder
    return {
      name: `IASE Unit #${tokenId}`,
      description: "Failed to load metadata",
      image: "https://iaseproject.com/images/nft-placeholder.png"
    };
  }
}

/**
 * Normalizza gli URI per supportare vari protocolli come ipfs://
 * @param {string} uri - URI originale 
 * @returns {string} - URI normalizzato
 */
function normalizeURI(uri) {
  if (!uri) return "https://iaseproject.com/images/nft-placeholder.png";
  
  // Handle ipfs:// protocol
  if (uri.startsWith('ipfs://')) {
    return uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }
  
  // Return as is for http/https
  return uri;
}

/**
 * Estrae la rarità dai metadati dell'NFT
 * @param {Object} metadata - Metadati dell'NFT
 * @returns {string} - Livello di rarità
 */
function getRarityFromMetadata(metadata) {
  if (!metadata || !metadata.attributes) return "Common";
  
  // Cerca l'attributo rarità negli attributi
  const rarityAttribute = metadata.attributes.find(attr => 
    attr.trait_type?.toLowerCase() === 'rarity' || 
    attr.trait_type?.toLowerCase() === 'rarità'
  );
  
  return rarityAttribute?.value || "Common";
}

/**
 * Carica tutti gli NFT IASE dal wallet e ne recupera i metadati
 * Versione con Alchemy API per recupero NFT istantaneo
 * @returns {Promise<Object>} - Oggetto con indirizzo wallet, balance e array di NFT con metadati
 */
async function loadAllIASENFTs() {
  try {
    // Ottieni gli NFT posseduti dal wallet
    const nftData = await getUserNFTs();
    
    if (!nftData || !nftData.nftIds || nftData.nftIds.length === 0) {
      console.log("ℹ️ No NFTs found in the wallet");
      return { address: nftData?.address || '', balance: '0', nftIds: [] };
    }
    
    // Get metadata for each NFT
    const metadataPromises = nftData.nftIds.map(async (tokenId) => {
      try {
        const metadata = await getNFTMetadata(tokenId);
        return {
          id: tokenId,
          ...metadata,
          // Normalize URI if needed
          image: normalizeURI(metadata.image)
        };
      } catch (error) {
        console.error(`❌ Errore nel recupero metadati per NFT #${tokenId}:`, error);
        return {
          id: tokenId,
          name: `IASE Unit #${tokenId}`,
          description: "Failed to load metadata",
          image: "https://iaseproject.com/images/nft-placeholder.png"
        };
      }
    });
    
    const metadataResults = await Promise.allSettled(metadataPromises);
    
    const nftsWithMetadata = metadataResults
      .filter(result => result.status === "fulfilled")
      .map(result => result.value);
    
    console.log(`✅ Successfully loaded ${nftsWithMetadata.length} IASE NFTs with metadata`);
    return { ...nftData, nfts: nftsWithMetadata };
  } catch (error) {
    console.error("❌ Error loading NFTs:", error);
    return { address: '', balance: '0', nftIds: [] };
  }
}

// Se il file viene caricato come script normale (non come modulo ES6)
// rendiamo le funzioni disponibili globalmente nel window object
if (typeof window !== 'undefined') {
  window.getUserNFTs = getUserNFTs;
  window.getNFTMetadata = getNFTMetadata;
  window.loadAllIASENFTs = loadAllIASENFTs;
  window.normalizeURI = normalizeURI;
  console.log("✅ NFT Reader functions exposed to global window");
}

// Per supporto ES6 module (per retrocompatibilità)
if (isModule) {
  console.log("📦 NFT Reader exporting as ES6 module");
  module.exports = { getUserNFTs, getNFTMetadata, loadAllIASENFTs, normalizeURI };
}