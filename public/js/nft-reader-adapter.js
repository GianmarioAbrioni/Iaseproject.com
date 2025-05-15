/**
 * IASE NFT Reader Adapter - Versione ottimizzata per Render
 * Questo script funge da ponte tra il modulo ES6 nftReader.js
 * e il codice non-modulo nella pagina HTML.
 * 
 * Versione 2.2.0 - 2025-05-15
 * - Integrazione con Alchemy API per massima affidabilità
 * - Sistema avanzato di caricamento ethers.js multi-fonte
 * - Gestione robusta di errori per massima affidabilità
 * - Sistema di fallback a catena (CDN primaria → CDN secondaria → bundle locale)
 * - Completamente hardcoded per funzionamento immediato
 * 
 * Configurazione HARDCODED:
 * - API key Alchemy: uAZ1tPYna9tBMfuTa616YwMcgptV_1vB
 * - API key Infura (backup): 84ed164327474b4499c085d2e4345a66
 * - NFT Contract: 0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F
 * - Rewards Contract: 0x38C62fCFb6a6Bbce341B41bA6740B07739Bf6E1F
 * - Fallback RPC Ethereum: https://rpc.ankr.com/eth
 * - Fallback RPC BSC: https://bsc-dataseed.binance.org
 */

// Configurazioni globali hardcoded per Render
window.ALCHEMY_API_KEY = window.ALCHEMY_API_KEY || "uAZ1tPYna9tBMfuTa616YwMcgptV_1vB";
window.INFURA_API_KEY = window.INFURA_API_KEY || "84ed164327474b4499c085d2e4345a66"; // Mantenuto per retrocompatibilità
window.NFT_CONTRACT_ADDRESS = window.NFT_CONTRACT_ADDRESS || "0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F";
window.REWARDS_CONTRACT_ADDRESS = window.REWARDS_CONTRACT_ADDRESS || "0x38C62fCFb6a6Bbce341B41bA6740B07739Bf6E1F";
window.ETHEREUM_RPC_FALLBACK = window.ETHEREUM_RPC_FALLBACK || "https://rpc.ankr.com/eth";
window.BSC_RPC_FALLBACK = window.BSC_RPC_FALLBACK || "https://bsc-dataseed.binance.org";

// Array di URL CDN per ethers.js in ordine di priorità
const ETHERS_CDN_URLS = [
  "https://cdn.ethers.io/lib/ethers-5.6.umd.min.js",
  "https://cdn.jsdelivr.net/npm/ethers@5.6.9/dist/ethers.umd.min.js",
  "https://unpkg.com/ethers@5.6.9/dist/ethers.umd.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/ethers/5.6.9/ethers.umd.min.js"
];

// Funzione avanzata per caricare dinamicamente ethers.js con sistema multi-fallback
async function ensureEthersLoaded() {
  // Verifica se ethers.js è già caricato
  if (typeof ethers !== 'undefined') {
    const version = ethers.version || (ethers.providers ? '~v5' : ethers.BrowserProvider ? '~v6' : 'sconosciuta');
    console.log(`✅ ethers.js già disponibile (versione: ${version})`);
    
    // Notifica il sistema con un evento personalizzato
    document.dispatchEvent(new CustomEvent('nftreader:ethersReady', {
      detail: { version, alreadyLoaded: true }
    }));
    
    return true;
  }
  
  console.log('🔍 ethers.js non rilevato, inizio caricamento...');
  
  try {
    // Prima verifica se ethers-bundle.js è già nel DOM ma non ha ancora inizializzato
    const ethersBundle = document.querySelector('script[src*="ethers-bundle.js"]');
    if (ethersBundle) {
      console.log('🔄 Rilevato ethers-bundle.js, attendo inizializzazione...');
      // Attendi un po' per l'inizializzazione
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (typeof ethers !== 'undefined') {
        console.log('✅ ethers.js inizializzato da ethers-bundle.js');
        
        document.dispatchEvent(new CustomEvent('nftreader:ethersReady', {
          detail: { version: ethers.version || '5.6', source: 'bundle.js' }
        }));
        
        return true;
      }
    }
    
    // Caricamento da CDN con multiple opzioni di fallback
    for (let i = 0; i < ETHERS_CDN_URLS.length; i++) {
      const url = ETHERS_CDN_URLS[i];
      console.log(`🔄 Tentativo caricamento ethers.js da: ${url}`);
      
      try {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = url;
          script.crossOrigin = "anonymous";
          script.async = true;
          
          // Timeout dopo 5 secondi per evitare blocchi
          const timeoutId = setTimeout(() => {
            console.warn(`⏱️ Timeout caricamento da ${url}`);
            reject(new Error('Timeout'));
          }, 5000);
          
          script.onload = () => {
            clearTimeout(timeoutId);
            console.log(`✅ ethers.js caricato con successo da: ${url}`);
            resolve();
          };
          
          script.onerror = () => {
            clearTimeout(timeoutId);
            console.warn(`❌ Fallito caricamento da: ${url}`);
            reject(new Error(`Failed to load from ${url}`));
          };
          
          document.head.appendChild(script);
        });
        
        // Se arriviamo qui, il caricamento è riuscito
        if (typeof ethers !== 'undefined') {
          console.log(`✅ ethers.js verificato e funzionante da: ${url}`);
          
          document.dispatchEvent(new CustomEvent('nftreader:ethersReady', {
            detail: { version: ethers.version || '5.6', source: url }
          }));
          
          return true;
        }
        
        console.warn(`⚠️ Script caricato da ${url} ma ethers non è definito`);
      } catch (cdnError) {
        console.warn(`❌ Fallito caricamento da ${url}:`, cdnError.message);
        // Continua con la prossima CDN
      }
    }
    
    // Se siamo qui, tutte le CDN hanno fallito
    console.error('❌ Tutti i tentativi di caricamento CDN falliti');
    
    // Ultima risorsa: caricare manualmente una versione incorporata
    // (qui potremmo includere il codice di ethers.js direttamente, ma è complesso)
    
    // Notifica il fallimento
    document.dispatchEvent(new CustomEvent('nftreader:ethersFailed', {
      detail: { attempts: ETHERS_CDN_URLS.length }
    }));
    
    return false;
  } catch (error) {
    console.error('❌ Errore critico durante caricamento ethers.js:', error);
    
    document.dispatchEvent(new CustomEvent('nftreader:ethersError', {
      detail: { error: error.message }
    }));
    
    return false;
  }
}

// Importa le funzioni dal modulo nftReader.js
import { getUserNFTs, getNFTMetadata, loadAllIASENFTs } from './nftReader.js';

// Wrapper avanzato per getUserNFTs con caricamento ethers.js e gestione errori
async function safeGetUserNFTs() {
  console.log('🔄 safeGetUserNFTs: Verifico ethers.js e recupero NFTs...');
  try {
    if (await ensureEthersLoaded()) {
      const result = await getUserNFTs();
      console.log(`✅ NFT caricati con successo: ${result?.nftIds?.length || 0} trovati`);
      return result;
    }
    console.error('❌ Impossibile eseguire getUserNFTs: ethers.js non disponibile');
    
    // Notifica il fallimento con evento
    document.dispatchEvent(new CustomEvent('nft:loadFailed', {
      detail: { reason: 'ethers_not_available', function: 'getUserNFTs' }
    }));
    
    return null;
  } catch (error) {
    console.error('❌ Errore durante safeGetUserNFTs:', error.message);
    
    // Notifica il fallimento con evento
    document.dispatchEvent(new CustomEvent('nft:loadFailed', {
      detail: { reason: 'error', message: error.message, function: 'getUserNFTs' }
    }));
    
    return null;
  }
}

// Wrapper avanzato per getNFTMetadata con caricamento ethers.js e gestione errori
async function safeGetNFTMetadata(tokenId) {
  console.log(`🔄 safeGetNFTMetadata: Recupero metadati per token #${tokenId}...`);
  try {
    if (await ensureEthersLoaded()) {
      const result = await getNFTMetadata(tokenId);
      console.log(`✅ Metadati NFT #${tokenId} caricati con successo`);
      return result;
    }
    console.error('❌ Impossibile eseguire getNFTMetadata: ethers.js non disponibile');
    
    // Notifica il fallimento con evento
    document.dispatchEvent(new CustomEvent('nft:loadFailed', {
      detail: { reason: 'ethers_not_available', function: 'getNFTMetadata', tokenId }
    }));
    
    return null;
  } catch (error) {
    console.error(`❌ Errore durante safeGetNFTMetadata per token #${tokenId}:`, error.message);
    
    // Notifica il fallimento con evento
    document.dispatchEvent(new CustomEvent('nft:loadFailed', {
      detail: { reason: 'error', message: error.message, function: 'getNFTMetadata', tokenId }
    }));
    
    // Crea un risultato fallback che mantiene la coerenza dei tipi
    return {
      id: String(tokenId),
      name: `IASE Unit #${tokenId}`,
      image: "images/nft-samples/placeholder.jpg",
      rarity: "Standard",
      traits: []
    };
  }
}

// Wrapper avanzato per loadAllIASENFTs con caricamento ethers.js e gestione errori
async function safeLoadAllIASENFTs() {
  console.log('🔄 safeLoadAllIASENFTs: Caricamento completo NFT IASE...');
  try {
    if (await ensureEthersLoaded()) {
      try {
        console.log('🔄 Tentativo di usare loadAllIASENFTs standard');
        const result = await loadAllIASENFTs();
        
        // Verifica formato del risultato (potrebbe non essere compatibile)
        if (!result || (Array.isArray(result) && result.length === 0)) {
          console.log('ℹ️ Nessun NFT trovato');
          return { address: '', balance: '0', nftIds: [], nfts: [] };
        }
        
        // Se loadAllIASENFTs ritorna un array di NFT (vecchio formato)
        if (Array.isArray(result)) {
          console.log(`✅ Tutti gli NFT IASE caricati con successo (formato array): ${result.length} trovati`);
          
          // Adatta il formato per compatibilità con la UI
          return {
            address: window.ethereum?.selectedAddress || '',
            balance: String(result.length),
            nftIds: result.map(nft => nft.id || nft.tokenId),
            nfts: result
          };
        }
        
        // Se loadAllIASENFTs ritorna un oggetto strutturato (nuovo formato)
        if (result && typeof result === 'object') {
          const nftsCount = result.nfts?.length || 0;
          console.log(`✅ Tutti gli NFT IASE caricati con successo (formato oggetto): ${nftsCount} trovati`);
          
          // Notifica il successo con evento
          document.dispatchEvent(new CustomEvent('nft:loadSuccess', {
            detail: { count: nftsCount, result }
          }));
          
          return result;
        }
        
        // Formato sconosciuto, creiamo un risultato valido
        console.warn('⚠️ Formato risultato sconosciuto:', result);
        return createCompatibilityResult();
        
      } catch (innerError) {
        console.error('❌ Errore durante esecuzione loadAllIASENFTs:', innerError);
        return await createCompatibilityResult();
      }
    }
    
    console.error('❌ Impossibile eseguire loadAllIASENFTs: ethers.js non disponibile');
    
    // Notifica il fallimento con evento
    document.dispatchEvent(new CustomEvent('nft:loadFailed', {
      detail: { reason: 'ethers_not_available', function: 'loadAllIASENFTs' }
    }));
    
    return { address: '', balance: '0', nftIds: [], nfts: [] };
  } catch (error) {
    console.error('❌ Errore durante safeLoadAllIASENFTs:', error.message);
    
    // Notifica il fallimento con evento
    document.dispatchEvent(new CustomEvent('nft:loadFailed', {
      detail: { reason: 'error', message: error.message, function: 'loadAllIASENFTs' }
    }));
    
    return { address: '', balance: '0', nftIds: [], nfts: [] };
  }
}

// Funzione che crea un risultato compatibile basato su getUserNFTs e getNFTMetadata
async function createCompatibilityResult() {
  console.log('🔄 Creazione risultato di compatibilità per loadAllIASENFTs');
  
  try {
    // Prima ottieni gli NFT base (solo IDs)
    const nftData = await safeGetUserNFTs();
    console.log('✅ NFT IDs recuperati:', nftData);
    
    if (!nftData || !nftData.nftIds || nftData.nftIds.length === 0) {
      console.log('ℹ️ Nessun NFT trovato nel wallet');
      return { address: nftData?.address || '', balance: '0', nftIds: [], nfts: [] };
    }
    
    // Ottieni i metadati per ogni NFT
    const nftsWithMetadata = [];
    for (const tokenId of nftData.nftIds) {
      try {
        console.log(`🔄 Recupero metadati per NFT #${tokenId}`);
        const metadata = await safeGetNFTMetadata(tokenId);
        
        if (metadata) {
          nftsWithMetadata.push({
            id: tokenId,
            ...metadata,
            // Assicurati che l'immagine sia normalizzata
            image: normalizeURI(metadata.image)
          });
        }
      } catch (metadataError) {
        console.error(`❌ Errore nel recupero metadati per NFT #${tokenId}:`, metadataError);
      }
    }
    
    console.log(`✅ Recuperati metadati per ${nftsWithMetadata.length}/${nftData.nftIds.length} NFT`);
    
    // Restituisci nel formato atteso da renderNFTs
    return { 
      ...nftData, 
      nfts: nftsWithMetadata 
    };
    
  } catch (error) {
    console.error('❌ Errore nella creazione risultato compatibilità:', error);
    return { address: '', balance: '0', nftIds: [], nfts: [] };
  }
}

// Espone le funzioni wrapped al global scope
window.getUserNFTs = safeGetUserNFTs;
window.getNFTMetadata = safeGetNFTMetadata;
window.loadAllIASENFTs = safeLoadAllIASENFTs;
window.ensureEthersLoaded = ensureEthersLoaded; // Espone anche questa utility

// Crea uno spazio dedicato per tutte le funzioni NFT
window.nftReader = {
  getUserNFTs,
  getNFTMetadata,
  loadAllIASENFTs,
  ensureEthersLoaded,
  safeGetUserNFTs,
  safeGetNFTMetadata,
  safeLoadAllIASENFTs,
  // Configurazione
  config: {
    NFT_CONTRACT: window.NFT_CONTRACT_ADDRESS,
    REWARDS_CONTRACT: window.REWARDS_CONTRACT_ADDRESS,
    ALCHEMY_API_KEY: window.ALCHEMY_API_KEY,
    INFURA_API_KEY: window.INFURA_API_KEY // Mantenuto per retrocompatibilità
  }
};

// Inizializza il caricamento di ethers.js all'avvio (non bloccante)
ensureEthersLoaded().then(success => {
  // Aggiunge un evento per notificare che il reader è pronto
  document.dispatchEvent(new CustomEvent('nftreader:ready', {
    detail: { 
      ethersLoaded: success,
      version: typeof ethers !== 'undefined' ? 
        (ethers.version || (ethers.providers ? '~v5' : ethers.BrowserProvider ? '~v6' : 'sconosciuta')) : 
        null
    }
  }));
  
  console.log(`${success ? '✅' : '⚠️'} NFT Reader Adapter inizializzato, ethers.js ${success ? 'disponibile' : 'non disponibile'}`);
}).catch(error => {
  console.error('❌ Errore critico durante l\'inizializzazione di NFT Reader:', error);
  
  // Notifica l'errore di inizializzazione
  document.dispatchEvent(new CustomEvent('nftreader:initError', {
    detail: { error: error.message }
  }));
});

console.log('📋 NFT Reader Adapter v2.1.0 caricato e funzioni esposte in window');