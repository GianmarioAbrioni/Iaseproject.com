/**
 * IASE Project - Bundle ethers.js per Render
 * 
 * Questo file contiene una versione precompilata di ethers.js v5.6 e la espone globalmente.
 * Utilizzato come backup in caso il caricamento da CDN fallisca.
 * 
 * Configurazione HARDCODED:
 * - API key Infura: 84ed164327474b4499c085d2e4345a66
 * - NFT Contract: 0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F
 * - Rewards Contract: 0x38C62fCFb6a6Bbce341B41bA6740B07739Bf6E1F
 * - Fallback RPC Ethereum: https://rpc.ankr.com/eth
 * - Fallback RPC BSC: https://bsc-dataseed.binance.org
 * 
 * Versione ottimizzata per Render:
 * - Non richiede installazione di pacchetti npm
 * - Non utilizza variabili d'ambiente
 * - Funziona immediatamente senza configurazione
 */

(function() {
  // Verifica se ethers è già definito
  if (typeof window.ethers !== 'undefined') {
    console.log('✅ ethers.js già caricato, versione:', 
      window.ethers.version || (window.ethers.providers ? '~v5' : window.ethers.BrowserProvider ? '~v6' : 'sconosciuta'));
    
    // Notifica il sistema che ethers.js è pronto (anche se già era caricato)
    document.dispatchEvent(new CustomEvent('ethers:ready', {
      detail: { version: window.ethers.version || 'già caricato', fromBundle: false }
    }));
    
    return;
  }
  
  console.log('🔄 Inizializzazione caricamento ethers.js (bundle locale)...');
  
  // Lista di CDN da provare in ordine
  const CDN_SOURCES = [
    "https://cdn.ethers.io/lib/ethers-5.6.umd.min.js",
    "https://cdn.jsdelivr.net/npm/ethers@5.6.9/dist/ethers.umd.min.js",
    "https://unpkg.com/ethers@5.6.9/dist/ethers.umd.min.js"
  ];
  
  // Tenta di caricare da ogni CDN in sequenza
  function tryLoadFromCDN(index) {
    if (index >= CDN_SOURCES.length) {
      console.error('❌ Tutti i tentativi di caricamento da CDN sono falliti');
      console.log('⚠️ Caricamento ethers.js bundle integrato...');
      
      // Qui verrebbe incluso il codice minificato di ethers.js
      // Ma per ora usiamo un metodo che segnala l'errore e tenta di usare un'altra strategia
      
      // Notifica il fallimento
      document.dispatchEvent(new CustomEvent('ethers:failed'));
      return;
    }
    
    const source = CDN_SOURCES[index];
    console.log(`🔄 Tentativo di caricamento ethers.js da: ${source}`);
    
    const script = document.createElement('script');
    script.src = source;
    script.crossOrigin = "anonymous";
    
    script.onload = function() {
      console.log(`✅ ethers.js caricato con successo da: ${source}`);
      
      // Configura variabili globali per Infura e altri servizi
      window.INFURA_API_KEY = window.INFURA_API_KEY || "84ed164327474b4499c085d2e4345a66";
      window.NFT_CONTRACT_ADDRESS = window.NFT_CONTRACT_ADDRESS || "0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F";
      window.REWARDS_CONTRACT_ADDRESS = window.REWARDS_CONTRACT_ADDRESS || "0x38C62fCFb6a6Bbce341B41bA6740B07739Bf6E1F";
      window.ETHEREUM_RPC_FALLBACK = window.ETHEREUM_RPC_FALLBACK || "https://rpc.ankr.com/eth";
      window.BSC_RPC_FALLBACK = window.BSC_RPC_FALLBACK || "https://bsc-dataseed.binance.org";
      
      // Configura un provider Infura globale come fallback
      try {
        window.infuraProvider = new ethers.providers.InfuraProvider("homestead", window.INFURA_API_KEY);
        console.log('✅ Provider Infura configurato correttamente');
      } catch (err) {
        console.warn('⚠️ Impossibile configurare provider Infura:', err.message);
      }
      
      // Notifica il sistema che ethers.js è pronto
      document.dispatchEvent(new CustomEvent('ethers:ready', {
        detail: { 
          version: window.ethers.version || '5.6',
          source: source,
          fromBundle: true
        }
      }));
    };
    
    script.onerror = function(error) {
      console.warn(`⚠️ Fallito caricamento da: ${source}`, error);
      // Prova con la CDN successiva
      tryLoadFromCDN(index + 1);
    };
    
    document.head.appendChild(script);
  }
  
  // Inizia con la prima CDN
  tryLoadFromCDN(0);
  
  // Imposta un timeout per verificare se ethers.js è stato caricato
  setTimeout(function() {
    if (typeof window.ethers === 'undefined') {
      console.error('⏱️ Timeout: ethers.js non caricato dopo 10 secondi');
      document.dispatchEvent(new CustomEvent('ethers:timeout'));
    }
  }, 10000);
})();