/**
 * IASE Wallet Connector Wrapper
 * 
 * Questo script risolve i problemi di conflitto tra le diverse implementazioni
 * della connessione wallet (wallet-connect.js, universal-wallet-connector.js, unified-wallet.js)
 * 
 * Carica l'implementazione appropriata in base al contesto della pagina.
 */

// Evita il double-loading dello script
if (typeof window.walletConnectorLoaded === 'undefined') {
  window.walletConnectorLoaded = true;

  // Determina quale pagina è attualmente caricata
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  // Mappa delle pagine che richiedono un connettore specifico
  const specialPages = {
    'token.html': {
      script: 'universal-wallet-connector.js',
      requiredNetwork: '0x38', // BNB Chain
      purpose: 'Token Purchase'
    },
    'staking.html': {
      script: 'universal-wallet-connector.js',
      requiredNetwork: '0x1',  // Ethereum Mainnet
      purpose: 'NFT Staking'
    },
    'user-dashboard.html': {
      script: 'universal-wallet-connector.js',
      requiredNetwork: null, // Accetta entrambe le reti
      purpose: 'Dashboard Access'
    }
  };

  // Carica lo script appropriato
  function loadWalletConnector() {
    const scriptSrc = specialPages[currentPage] ? 
      specialPages[currentPage].script : 
      'wallet-connect.js';
    
    // Se lo script è già caricato, non fare nulla
    if (document.querySelector(`script[src="js/${scriptSrc}"]`)) {
      console.log(`Wallet connector script ${scriptSrc} already loaded`);
      return;
    }
    
    // Carica lo script
    const script = document.createElement('script');
    script.src = `js/${scriptSrc}`;
    script.async = true;
    
    // Carica i requisiti di rete nello script
    if (specialPages[currentPage]) {
      window.requiredNetwork = specialPages[currentPage].requiredNetwork;
      window.networkPurpose = specialPages[currentPage].purpose;
    }
    
    // Aggiungi lo script al DOM
    document.body.appendChild(script);
    console.log(`Loaded wallet connector: ${scriptSrc}`);
  }

  // Esegui il caricamento quando il documento è pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadWalletConnector);
  } else {
    loadWalletConnector();
  }
}