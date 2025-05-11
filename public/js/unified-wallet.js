/**
 * IASE Unified Wallet Connection Manager
 * Sistema centralizzato per gestire lo stato della connessione del wallet su tutte le pagine
 */

// Stato globale della connessione wallet
window.IASE = window.IASE || {
  wallet: {
    connected: false,
    address: null,
    chain: null,
    chainName: null,
    supportedChains: {
      // Ethereum chain per NFT staking
      '0x1': {
        name: 'Ethereum Mainnet',
        currency: 'ETH',
        explorer: 'https://etherscan.io',
        type: 'nft' // Per operazioni NFT
      },
      // BNB Smart Chain per token
      '0x38': {
        name: 'BNB Smart Chain',
        currency: 'BNB',
        explorer: 'https://bscscan.com',
        type: 'token' // Per operazioni con token
      }
    },
    expectedChainsByPage: {
      'staking.html': '0x1', // Ethereum per staking NFT
      'token.html': '0x38'   // BNB per acquisto token
    }
  },
  
  contracts: {
    // Indirizzi contrattuali
    token: '0x5A170D59ae8B851DC4DD0D14cC89E5fE541752CE', // BNB Smart Chain
    nft: '0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F'    // Ethereum
  },
  
  // Eventi custom
  events: {
    WALLET_CONNECTED: 'iase:wallet-connected',
    WALLET_DISCONNECTED: 'iase:wallet-disconnected',
    CHAIN_CHANGED: 'iase:chain-changed'
  }
};

// Inizializza il modulo wallet unificato
document.addEventListener('DOMContentLoaded', function() {
  // Inizializza UI elementi
  initWalletUI();
  
  // Controlla connessione esistente
  checkExistingConnection();
  
  // Aggiungi listeners
  setupEventListeners();
  
  // Monitora cambio rete
  monitorNetworkChange();
});

/**
 * Inizializza UI per wallet status
 */
function initWalletUI() {
  // Elementi esistenti
  const connectBtns = document.querySelectorAll('.connect-wallet-btn');
  const disconnectBtns = document.querySelectorAll('.disconnect-wallet-btn');
  
  // Event listeners per tutti i pulsanti di connessione
  connectBtns.forEach(btn => {
    btn.addEventListener('click', connectWallet);
  });
  
  // Event listeners per tutti i pulsanti di disconnessione
  disconnectBtns.forEach(btn => {
    btn.addEventListener('click', disconnectWallet);
  });
}

/**
 * Connette wallet
 */
async function connectWallet() {
  if (!window.ethereum) {
    showAlert('MetaMask non rilevato', 'Per utilizzare questa funzionalità, installa MetaMask.', 'error');
    return;
  }
  
  try {
    // Richiedi account
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    if (accounts.length === 0) {
      throw new Error('Nessun account autorizzato');
    }
    
    // Salva indirizzo
    window.IASE.wallet.address = accounts[0];
    window.IASE.wallet.connected = true;
    
    // Ottieni chain ID corrente
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    window.IASE.wallet.chain = chainId;
    
    // Verifica se siamo sulla chain corretta per la pagina attuale
    checkCorrectChain();
    
    // Salva in localStorage per persistenza
    saveWalletState();
    
    // Aggiorna UI
    updateWalletUI();
    
    // Emetti evento custom
    dispatchWalletEvent(window.IASE.events.WALLET_CONNECTED, {
      address: window.IASE.wallet.address,
      chain: window.IASE.wallet.chain
    });
    
    console.log('Wallet connesso:', window.IASE.wallet);
  } catch (error) {
    console.error('Errore connessione wallet:', error);
    showAlert('Errore Connessione', 'Si è verificato un errore durante la connessione del wallet.', 'error');
  }
}

/**
 * Disconnette wallet
 */
function disconnectWallet() {
  // Reset stato
  window.IASE.wallet.connected = false;
  window.IASE.wallet.address = null;
  window.IASE.wallet.chain = null;
  
  // Rimuovi da localStorage
  localStorage.removeItem('iase_wallet_connected');
  localStorage.removeItem('iase_wallet_address');
  
  // Aggiorna UI
  updateWalletUI();
  
  // Emetti evento custom
  dispatchWalletEvent(window.IASE.events.WALLET_DISCONNECTED);
  
  console.log('Wallet disconnesso');
}

/**
 * Aggiorna interfaccia UI con stato wallet
 */
function updateWalletUI() {
  const isConnected = window.IASE.wallet.connected;
  const address = window.IASE.wallet.address;
  
  // Status indicators
  const statusIndicators = document.querySelectorAll('.wallet-status');
  statusIndicators.forEach(indicator => {
    const statusDot = indicator.querySelector('.connection-indicator');
    const statusText = indicator.querySelector('.connection-text');
    
    if (statusDot) {
      statusDot.className = 'connection-indicator ' + (isConnected ? 'connected' : 'disconnected');
    }
    
    if (statusText && address) {
      const shortAddress = `${address.substring(0, 6)}...${address.slice(-4)}`;
      statusText.innerHTML = isConnected 
        ? `Connesso<br><span class="small opacity-75">${shortAddress}</span>` 
        : 'Disconnesso';
    }
  });
  
  // Connect/Disconnect buttons
  const connectBtns = document.querySelectorAll('.connect-wallet-btn');
  const disconnectBtns = document.querySelectorAll('.disconnect-wallet-btn');
  
  connectBtns.forEach(btn => {
    btn.style.display = isConnected ? 'none' : 'inline-flex';
  });
  
  disconnectBtns.forEach(btn => {
    btn.style.display = isConnected ? 'inline-flex' : 'none';
  });
  
  // Wallet address displays
  const addressDisplays = document.querySelectorAll('.wallet-address');
  if (address) {
    const shortAddress = `${address.substring(0, 6)}...${address.slice(-4)}`;
    addressDisplays.forEach(display => {
      display.textContent = shortAddress;
    });
  }
  
  // Chain indicator
  updateChainUI();
  
  // Mostra vari contenuti in base alla connessione
  const connectedOnlyElements = document.querySelectorAll('.connected-only');
  const disconnectedOnlyElements = document.querySelectorAll('.disconnected-only');
  
  connectedOnlyElements.forEach(el => {
    el.style.display = isConnected ? '' : 'none';
  });
  
  disconnectedOnlyElements.forEach(el => {
    el.style.display = isConnected ? 'none' : '';
  });
}

/**
 * Aggiorna UI specifico per chain/rete
 */
function updateChainUI() {
  const chainId = window.IASE.wallet.chain;
  
  // Se non c'è una chain o non siamo connessi, esci
  if (!chainId || !window.IASE.wallet.connected) return;
  
  // Chain name
  const chainInfo = window.IASE.wallet.supportedChains[chainId];
  const chainName = chainInfo ? chainInfo.name : `Chain sconosciuta (${chainId})`;
  window.IASE.wallet.chainName = chainName;
  
  // Aggiorna gli elementi UI che mostrano la chain
  const chainDisplays = document.querySelectorAll('.chain-name');
  chainDisplays.forEach(display => {
    display.textContent = chainName;
  });
  
  // Controlla se siamo sulla chain corretta per questa pagina
  const currentPage = window.location.pathname.split('/').pop();
  const expectedChain = window.IASE.wallet.expectedChainsByPage[currentPage];
  
  // Elementi di avviso chain errata
  const wrongNetworkWarnings = document.querySelectorAll('.wrong-network-warning');
  
  if (expectedChain && chainId !== expectedChain) {
    // Mostra avvisi di chain errata
    wrongNetworkWarnings.forEach(warning => {
      warning.style.display = 'block';
      
      // Imposta testo specifico per ogni tipo di pagina
      const targetChainInfo = window.IASE.wallet.supportedChains[expectedChain];
      if (targetChainInfo) {
        const warningMsg = warning.querySelector('.warning-text');
        if (warningMsg) {
          // Personalizza messaggio in base al tipo di pagina
          if (targetChainInfo.type === 'nft') {
            warningMsg.textContent = `Per lo staking di NFT è necessario utilizzare ${targetChainInfo.name}. Attualmente sei su ${chainName}.`;
          } else if (targetChainInfo.type === 'token') {
            warningMsg.textContent = `Per acquistare IASE Token è necessario utilizzare ${targetChainInfo.name}. Attualmente sei su ${chainName}.`;
          }
        }
        
        // Bottone per cambiare rete
        const switchBtn = warning.querySelector('.switch-network-btn');
        if (switchBtn) {
          switchBtn.setAttribute('data-chain', expectedChain);
          switchBtn.addEventListener('click', () => switchNetwork(expectedChain));
        }
      }
    });
  } else {
    // Nascondi avvisi se rete corretta
    wrongNetworkWarnings.forEach(warning => {
      warning.style.display = 'none';
    });
  }
}

/**
 * Cambia rete
 */
async function switchNetwork(chainId) {
  if (!window.ethereum) return;
  
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }]
    });
  } catch (error) {
    // Se la rete non è configurata, chiedi di aggiungerla
    if (error.code === 4902) {
      try {
        if (chainId === '0x38') {
          // Aggiungi BNB Smart Chain
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x38',
              chainName: 'BNB Smart Chain',
              nativeCurrency: {
                name: 'BNB',
                symbol: 'BNB',
                decimals: 18
              },
              rpcUrls: ['https://bsc-dataseed.binance.org/'],
              blockExplorerUrls: ['https://bscscan.com']
            }]
          });
        }
      } catch (addError) {
        console.error('Errore aggiunta chain:', addError);
      }
    }
    console.error('Errore switch chain:', error);
  }
}

/**
 * Verifica chain corretta per la pagina corrente
 */
function checkCorrectChain() {
  const currentPage = window.location.pathname.split('/').pop();
  const expectedChain = window.IASE.wallet.expectedChainsByPage[currentPage];
  
  if (expectedChain && window.IASE.wallet.chain !== expectedChain) {
    // Mostra notifica se siamo sulla chain sbagliata
    const chainInfo = window.IASE.wallet.supportedChains[expectedChain];
    if (chainInfo) {
      let message = '';
      
      if (chainInfo.type === 'nft') {
        message = `Per fare staking degli NFT IASE Units è necessario utilizzare ${chainInfo.name}.`;
      } else if (chainInfo.type === 'token') {
        message = `Per acquistare IASE Token è necessario utilizzare ${chainInfo.name}.`;
      }
      
      // Mostra avviso
      if (message) {
        showAlert('Rete non corretta', message, 'warning', true);
      }
    }
  }
}

/**
 * Controlla se esiste già una connessione
 */
async function checkExistingConnection() {
  const isConnected = localStorage.getItem('iase_wallet_connected') === 'true';
  const storedAddress = localStorage.getItem('iase_wallet_address');
  
  if (isConnected && storedAddress && window.ethereum) {
    try {
      // Verifica se l'indirizzo è ancora autorizzato
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      if (accounts.length > 0) {
        // Store wallet info
        window.IASE.wallet.connected = true;
        window.IASE.wallet.address = accounts[0];
        
        // Get current chain
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        window.IASE.wallet.chain = chainId;
        
        // Update UI
        updateWalletUI();
        
        // Verifica chain corretta
        checkCorrectChain();
        
        // Emetti evento
        dispatchWalletEvent(window.IASE.events.WALLET_CONNECTED, {
          address: window.IASE.wallet.address,
          chain: window.IASE.wallet.chain
        });
        
        console.log('Connessione wallet ripristinata:', window.IASE.wallet);
      } else {
        // L'account non è più autorizzato
        disconnectWallet();
      }
    } catch (error) {
      console.error('Errore verifica connessione esistente:', error);
      disconnectWallet();
    }
  }
}

/**
 * Monitor per cambio rete
 */
function monitorNetworkChange() {
  if (window.ethereum) {
    window.ethereum.on('chainChanged', chainId => {
      console.log('Chain cambiata:', chainId);
      window.IASE.wallet.chain = chainId;
      
      // Aggiorna UI
      updateChainUI();
      
      // Emetti evento custom
      dispatchWalletEvent(window.IASE.events.CHAIN_CHANGED, {
        chain: chainId
      });
      
      // Verifica chain corretta per la pagina
      checkCorrectChain();
    });
    
    window.ethereum.on('accountsChanged', accounts => {
      if (accounts.length === 0) {
        // L'utente ha disconnesso il wallet
        disconnectWallet();
      } else {
        // L'utente ha cambiato account
        window.IASE.wallet.address = accounts[0];
        updateWalletUI();
        saveWalletState();
      }
    });
  }
}

/**
 * Salva stato wallet in localStorage
 */
function saveWalletState() {
  localStorage.setItem('iase_wallet_connected', window.IASE.wallet.connected);
  localStorage.setItem('iase_wallet_address', window.IASE.wallet.address);
}

/**
 * Emetti un evento wallet
 */
function dispatchWalletEvent(eventName, detail = {}) {
  const event = new CustomEvent(eventName, { detail });
  document.dispatchEvent(event);
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Listener per pulsanti di switch network
  document.querySelectorAll('.switch-network-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const chainId = e.target.getAttribute('data-chain');
      if (chainId) {
        switchNetwork(chainId);
      }
    });
  });
  
  // Altri pulsanti e listener possono essere aggiunti qui
}

/**
 * Mostra avviso/alert
 */
function showAlert(title, message, type = 'info', hasAction = false) {
  // Se esiste una funzione di notifica globale esistente, usala
  if (typeof showNotification === 'function') {
    showNotification(type, title, message);
    return;
  }
  
  // Altrimenti crea un alert semplice
  if (hasAction) {
    // Con bottone di azione
    const result = confirm(`${title}\n\n${message}\n\nVuoi cambiare rete?`);
    if (result) {
      // Trova la chain corretta per questa pagina
      const currentPage = window.location.pathname.split('/').pop();
      const expectedChain = window.IASE.wallet.expectedChainsByPage[currentPage];
      if (expectedChain) {
        switchNetwork(expectedChain);
      }
    }
  } else {
    // Alert normale
    alert(`${title}\n\n${message}`);
  }
}

// Esporta funzioni per accesso esterno
window.IASE.connectWallet = connectWallet;
window.IASE.disconnectWallet = disconnectWallet;
window.IASE.switchNetwork = switchNetwork;