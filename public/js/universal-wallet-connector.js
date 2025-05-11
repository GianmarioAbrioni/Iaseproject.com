/**
 * IASE Universal Wallet Connector
 * Da includere in tutte le pagine per garantire coerenza nella connessione wallet
 */

// Stato globale per wallet connector
const WALLET_STATE = {
  connected: false,
  address: null,
  network: null,
  networkName: null,
  
  // Indirizzi contrattuali
  contracts: {
    IASE_TOKEN: '0x5A170D59ae8B851DC4DD0D14cC89E5fE541752CE', // BNB Smart Chain
    IASE_NFT: '0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F'    // Ethereum
  },
  
  // Reti supportate
  supportedNetworks: {
    '0x1': {
      id: 1,
      name: 'Ethereum Mainnet',
      symbol: 'ETH',
      purpose: 'NFT Staking',
      isTestnet: false
    },
    '0x38': {
      id: 56, 
      name: 'BNB Smart Chain',
      symbol: 'BNB',
      purpose: 'Token Purchase',
      isTestnet: false
    }
  },
  
  // Mapping pagine a reti richieste
  pageNetworkMap: {
    'staking.html': '0x1',
    'token.html': '0x38'
  }
};

// Evento personalizzato per notificare alle altre parti dell'app
const WALLET_EVENTS = {
  CONNECTED: 'wallet:connected',
  DISCONNECTED: 'wallet:disconnected',
  NETWORK_CHANGED: 'wallet:networkChanged'
};

document.addEventListener('DOMContentLoaded', function() {
  // Inserisci il component wallet nell'header se non esiste già
  insertWalletComponent();
  
  // Verifica connessione esistente
  checkPreviousConnection();
  
  // Inizializza listener per eventi wallet
  initWalletListeners();
});

/**
 * Inserisce componente wallet nell'header
 */
function insertWalletComponent() {
  // Sulla pagina di staking, non inseriamo il wallet nella navbar
  // Questo perché la pagina staking ha già il suo pulsante di connessione specifico
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  if (currentPage === 'staking.html') {
    // Nella pagina staking, aggiungi solo gli event listener al pulsante esistente
    const connectEthWalletBtn = document.getElementById('connectWalletBtn');
    if (connectEthWalletBtn) {
      connectEthWalletBtn.addEventListener('click', connectWallet);
      console.log('Event listener per connessione wallet aggiunto al pulsante nella pagina staking');
    }
    return;
  }
  
  // Per altre pagine, continua con l'inserimento del componente nella navbar
  // Verifica se il componente esiste già
  if (document.getElementById('wallet-component')) return;
  
  // Trova il container della navbar
  const navbar = document.querySelector('.navbar-collapse') || document.querySelector('header nav');
  if (!navbar) return;
  
  // Crea il componente wallet
  const walletComponent = document.createElement('div');
  walletComponent.id = 'wallet-component';
  walletComponent.className = 'wallet-component ms-auto';
  
  // HTML del componente
  walletComponent.innerHTML = `
    <div class="wallet-status d-none d-md-flex align-items-center">
      <div class="wallet-indicator disconnected" id="wallet-indicator"></div>
      <div class="wallet-details">
        <span class="wallet-connection-status" id="wallet-connection-status">Non connesso</span>
        <small class="wallet-address d-block" id="wallet-address"></small>
        <small class="wallet-network d-block" id="wallet-network"></small>
      </div>
    </div>
    
    <div class="wallet-wrong-network alert alert-warning p-2 mt-2 d-none" id="wallet-wrong-network">
      <i class="ri-error-warning-line"></i>
      <span class="small">Rete non corretta per questa pagina.</span>
      <button class="btn btn-sm btn-warning mt-1" id="switch-network-btn">Cambia Rete</button>
    </div>
    
    <div class="wallet-actions">
      <button class="btn btn-primary connect-wallet-btn" id="connect-wallet-btn">
        <i class="ri-wallet-3-line me-1"></i> Connetti Wallet
      </button>
      
      <button class="btn btn-outline-danger disconnect-wallet-btn d-none" id="disconnect-wallet-btn">
        <i class="ri-logout-box-line me-1"></i> Disconnetti
      </button>
    </div>
  `;
  
  // Aggiungi stile CSS
  if (!document.getElementById('wallet-component-styles')) {
    const style = document.createElement('style');
    style.id = 'wallet-component-styles';
    style.textContent = `
      .wallet-component {
        display: flex;
        flex-direction: column;
        margin-left: auto;
        padding: 0.5rem;
        min-width: 200px;
      }
      
      .wallet-status {
        margin-bottom: 0.5rem;
        padding: 0.5rem;
        border-radius: 4px;
        background: rgba(0,0,0,0.1);
      }
      
      .wallet-indicator {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        margin-right: 10px;
      }
      
      .wallet-indicator.connected {
        background: #4CAF50;
        box-shadow: 0 0 5px #4CAF50;
      }
      
      .wallet-indicator.disconnected {
        background: #F44336;
        box-shadow: 0 0 5px #F44336;
      }
      
      .wallet-wrong-network {
        font-size: 0.8rem;
        margin: 0.25rem 0;
      }
      
      .wallet-address, .wallet-network {
        opacity: 0.7;
        font-size: 0.7rem;
      }
      
      @media (max-width: 768px) {
        .wallet-component {
          border-top: 1px solid rgba(255,255,255,0.1);
          margin-top: 1rem;
          padding-top: 1rem;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Aggiungi il componente alla navbar
  navbar.appendChild(walletComponent);
  
  // Aggiungi event listeners ai bottoni
  document.getElementById('connect-wallet-btn').addEventListener('click', connectWallet);
  document.getElementById('disconnect-wallet-btn').addEventListener('click', disconnectWallet);
  document.getElementById('switch-network-btn').addEventListener('click', switchToCorrectNetwork);
}

/**
 * Connette il wallet
 */
// Verifica se la funzione è già definita
const originalConnectWallet = window.connectWallet;

async function connectWallet() {
  if (!window.ethereum) {
    showError('MetaMask non rilevato', 'Installa MetaMask per connetterti.');
    return;
  }
  
  try {
    // Richiedi accesso agli account
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    
    if (accounts.length === 0) {
      throw new Error('Nessun account autorizzato');
    }
    
    // Salva l'indirizzo
    WALLET_STATE.address = accounts[0];
    WALLET_STATE.connected = true;
    
    // Ottieni info sulla rete
    const chainId = await ethereum.request({ method: 'eth_chainId' });
    WALLET_STATE.network = chainId;
    
    // Get network name
    const networkInfo = WALLET_STATE.supportedNetworks[chainId];
    WALLET_STATE.networkName = networkInfo ? networkInfo.name : 'Rete sconosciuta';
    
    // Salva stato in localStorage
    saveWalletState();
    
    // Aggiorna UI
    updateWalletUI();
    
    // Controlla se rete corretta per la pagina attuale
    checkCorrectNetwork();
    
    // Notifica componenti
    dispatchWalletEvent(WALLET_EVENTS.CONNECTED, {
      address: WALLET_STATE.address,
      network: WALLET_STATE.network,
      networkName: WALLET_STATE.networkName
    });
    
    console.log('Wallet connesso:', WALLET_STATE.address);
    
    // Mantieni compatibilità con vecchio sistema
    if (originalConnectWallet && originalConnectWallet !== connectWallet) {
      console.log('Calling legacy wallet connection handler for compatibility');
      window.userWalletAddress = WALLET_STATE.address;
    }
  } catch (error) {
    console.error('Errore connessione wallet:', error);
    showError('Errore Connessione', error.message);
  }
}

/**
 * Disconnette il wallet
 */
function disconnectWallet() {
  // Reset stato
  WALLET_STATE.connected = false;
  WALLET_STATE.address = null;
  
  // Rimuovi da localStorage
  localStorage.removeItem('iase_wallet_address');
  localStorage.removeItem('iase_wallet_connected');
  
  // Aggiorna UI
  updateWalletUI();
  
  // Notifica componenti
  dispatchWalletEvent(WALLET_EVENTS.DISCONNECTED);
  
  console.log('Wallet disconnesso');
}

/**
 * Aggiorna UI del wallet
 */
function updateWalletUI() {
  const walletIndicator = document.getElementById('wallet-indicator');
  const connectionStatus = document.getElementById('wallet-connection-status');
  const addressDisplay = document.getElementById('wallet-address');
  const networkDisplay = document.getElementById('wallet-network');
  const connectBtn = document.getElementById('connect-wallet-btn');
  const disconnectBtn = document.getElementById('disconnect-wallet-btn');
  const walletStatus = document.querySelector('.wallet-status');
  
  if (!walletIndicator) return; // Elementi non trovati
  
  if (WALLET_STATE.connected) {
    // Connesso - aggiorna UI
    walletIndicator.classList.remove('disconnected');
    walletIndicator.classList.add('connected');
    
    // Status text
    connectionStatus.textContent = 'Connesso';
    
    // Visualizza indirizzo abbreviato
    const shortAddress = `${WALLET_STATE.address.substring(0, 6)}...${WALLET_STATE.address.slice(-4)}`;
    addressDisplay.textContent = shortAddress;
    
    // Visualizza nome rete
    networkDisplay.textContent = WALLET_STATE.networkName || 'Rete sconosciuta';
    
    // Bottoni
    connectBtn.classList.add('d-none');
    disconnectBtn.classList.remove('d-none');
    
    // Mostra status
    walletStatus.classList.remove('d-none');
    
    // Aggiorna anche gli altri elementi che mostrano lo stato wallet nella pagina
    updatePageWalletState(true, shortAddress);
  } else {
    // Disconnesso - aggiorna UI
    walletIndicator.classList.add('disconnected');
    walletIndicator.classList.remove('connected');
    
    connectionStatus.textContent = 'Non connesso';
    addressDisplay.textContent = '';
    networkDisplay.textContent = '';
    
    connectBtn.classList.remove('d-none');
    disconnectBtn.classList.add('d-none');
    
    // Nascondi warning rete scorretta
    document.getElementById('wallet-wrong-network').classList.add('d-none');
    
    // Nascondi status su mobile
    walletStatus.classList.add('d-md-flex');
    
    // Aggiorna anche gli altri elementi che mostrano lo stato wallet nella pagina
    updatePageWalletState(false);
  }
}

/**
 * Aggiorna elementi specifici della pagina con lo stato del wallet
 */
function updatePageWalletState(isConnected, shortAddress = '') {
  // Aggiorna tutti gli elementi con classe wallet-status-text
  document.querySelectorAll('.wallet-status-text').forEach(el => {
    el.textContent = isConnected ? 'Connesso' : 'Non connesso';
    el.classList.toggle('text-success', isConnected);
    el.classList.toggle('text-danger', !isConnected);
  });
  
  // Aggiorna tutti gli elementi con classe wallet-address-display
  document.querySelectorAll('.wallet-address-display').forEach(el => {
    el.textContent = isConnected ? shortAddress : '-';
  });
  
  // Mostra/nascondi elementi in base alla connessione
  document.querySelectorAll('.wallet-connected-only').forEach(el => {
    el.style.display = isConnected ? '' : 'none';
  });
  
  document.querySelectorAll('.wallet-disconnected-only').forEach(el => {
    el.style.display = isConnected ? 'none' : '';
  });
}

/**
 * Verifica se siamo sulla rete corretta per la pagina attuale
 */
function checkCorrectNetwork() {
  if (!WALLET_STATE.connected) return;
  
  // Ottieni la pagina corrente
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  // Verifica se questa pagina richiede una rete specifica
  const requiredNetwork = WALLET_STATE.pageNetworkMap[currentPage];
  
  if (requiredNetwork && WALLET_STATE.network !== requiredNetwork) {
    // Siamo sulla rete sbagliata per questa pagina
    const wrongNetworkAlert = document.getElementById('wallet-wrong-network');
    if (wrongNetworkAlert) {
      wrongNetworkAlert.classList.remove('d-none');
      
      // Personalizza il messaggio in base alla pagina
      const networkInfo = WALLET_STATE.supportedNetworks[requiredNetwork];
      const message = wrongNetworkAlert.querySelector('span');
      
      if (message && networkInfo) {
        let purpose = "";
        if (currentPage === 'token.html') {
          purpose = "acquistare IASE token";
        } else if (currentPage === 'staking.html') {
          purpose = "fare staking dei tuoi NFT";
        } else {
          purpose = networkInfo.purpose;
        }
        message.textContent = `Questa pagina richiede ${networkInfo.name} per ${purpose}.`;
      }
    }
    
    return false;
  } else {
    // Rete corretta o pagina senza requisiti specifici
    const wrongNetworkAlert = document.getElementById('wallet-wrong-network');
    if (wrongNetworkAlert) {
      wrongNetworkAlert.classList.add('d-none');
    }
    
    return true;
  }
}

/**
 * Cambia alla rete corretta per la pagina attuale
 */
async function switchToCorrectNetwork() {
  if (!window.ethereum) return;
  
  // Ottieni la pagina corrente
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  // Verifica se questa pagina richiede una rete specifica
  const requiredNetwork = WALLET_STATE.pageNetworkMap[currentPage];
  
  if (!requiredNetwork) return;
  
  try {
    // Richiedi cambio rete
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: requiredNetwork }]
    });
  } catch (error) {
    // Se la rete non è configurata in MetaMask, aggiungi
    if (error.code === 4902) {
      try {
        if (requiredNetwork === '0x38') {
          // Aggiungi BNB Smart Chain
          await ethereum.request({
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
        showError('Errore Configurazione Rete', 'Impossibile aggiungere la rete richiesta.');
      }
    } else {
      console.error('Errore switch network:', error);
      showError('Errore Cambio Rete', 'Impossibile cambiare rete.');
    }
  }
}

/**
 * Verifica connessione precedente
 */
async function checkPreviousConnection() {
  // Verifica stato salvato
  const isConnected = localStorage.getItem('iase_wallet_connected') === 'true';
  const savedAddress = localStorage.getItem('iase_wallet_address');
  
  if (isConnected && savedAddress && window.ethereum) {
    try {
      // Verifica se l'account è ancora autorizzato
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      
      if (accounts.length > 0 && accounts[0].toLowerCase() === savedAddress.toLowerCase()) {
        WALLET_STATE.address = accounts[0];
        WALLET_STATE.connected = true;
        
        // Ottieni chain ID
        const chainId = await ethereum.request({ method: 'eth_chainId' });
        WALLET_STATE.network = chainId;
        
        const networkInfo = WALLET_STATE.supportedNetworks[chainId];
        WALLET_STATE.networkName = networkInfo ? networkInfo.name : 'Rete sconosciuta';
        
        console.log('Ripristinata connessione wallet:', WALLET_STATE);
        
        // Aggiorna UI
        updateWalletUI();
        
        // Controlla rete corretta
        checkCorrectNetwork();
        
        // Notifica componenti
        dispatchWalletEvent(WALLET_EVENTS.CONNECTED, {
          address: WALLET_STATE.address,
          network: WALLET_STATE.network,
          networkName: WALLET_STATE.networkName
        });
      } else {
        // Account non più autorizzato
        console.log('Account salvato non più autorizzato');
        disconnectWallet();
      }
    } catch (error) {
      console.error('Errore verifica connessione precedente:', error);
      disconnectWallet();
    }
  }
}

/**
 * Imposta listener per eventi wallet
 */
function initWalletListeners() {
  if (window.ethereum) {
    // Ascolto cambio account
    ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        // MetaMask è stato disconnesso
        disconnectWallet();
      } else {
        // Cambio account
        WALLET_STATE.address = accounts[0];
        saveWalletState();
        updateWalletUI();
      }
    });
    
    // Ascolto cambio rete
    ethereum.on('chainChanged', (chainId) => {
      console.log('Rete cambiata:', chainId);
      WALLET_STATE.network = chainId;
      
      const networkInfo = WALLET_STATE.supportedNetworks[chainId];
      WALLET_STATE.networkName = networkInfo ? networkInfo.name : 'Rete sconosciuta';
      
      // Aggiorna UI
      updateWalletUI();
      
      // Verifica rete corretta
      checkCorrectNetwork();
      
      // Notifica componenti
      dispatchWalletEvent(WALLET_EVENTS.NETWORK_CHANGED, {
        network: WALLET_STATE.network,
        networkName: WALLET_STATE.networkName
      });
    });
    
    // Aggiunta: controllo periodico per verificare disconnessioni esterne
    // Questo rileva quando il wallet viene disconnesso direttamente dal browser
    setInterval(async () => {
      if (WALLET_STATE.connected) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length === 0) {
            console.log('Rilevata disconnessione esterna del wallet');
            disconnectWallet();
          }
        } catch (error) {
          console.error('Errore nel controllo periodico del wallet:', error);
        }
      }
    }, 3000); // Controlla ogni 3 secondi
  }
}

/**
 * Salva stato wallet
 */
function saveWalletState() {
  localStorage.setItem('iase_wallet_connected', WALLET_STATE.connected);
  localStorage.setItem('iase_wallet_address', WALLET_STATE.address);
}

/**
 * Emetti evento wallet
 */
function dispatchWalletEvent(eventName, detail = {}) {
  // Crea e disponi un evento personalizzato
  document.dispatchEvent(new CustomEvent(eventName, { 
    detail: detail,
    bubbles: true,
    cancelable: true
  }));
  
  // Emetti anche gli eventi standardizzati per il wallet-status-updater
  if (eventName === WALLET_EVENTS.CONNECTED) {
    // Evento di connessione wallet per staking.html
    const walletConnectedEvent = new CustomEvent('wallet:connected', {
      detail: detail,
      bubbles: true,
      cancelable: true
    });
    document.dispatchEvent(walletConnectedEvent);
    console.log('☑️ Wallet:connected event dispatched:', detail);
  } 
  else if (eventName === WALLET_EVENTS.DISCONNECTED) {
    // Evento di disconnessione wallet per staking.html
    const walletDisconnectedEvent = new CustomEvent('wallet:disconnected', {
      detail: detail,
      bubbles: true,
      cancelable: true
    });
    document.dispatchEvent(walletDisconnectedEvent);
    console.log('☑️ Wallet:disconnected event dispatched');
  }
  else if (eventName === WALLET_EVENTS.NETWORK_CHANGED) {
    // Evento di cambio rete per staking.html
    const networkChangedEvent = new CustomEvent('wallet:networkChanged', {
      detail: detail,
      bubbles: true,
      cancelable: true
    });
    document.dispatchEvent(networkChangedEvent);
    console.log('☑️ Wallet:networkChanged event dispatched:', detail);
  }
}

/**
 * Mostra errore
 */
function showError(title, message) {
  // Verifica se esiste la funzione showNotification
  if (typeof showNotification === 'function') {
    showNotification('error', title, message);
  } else {
    alert(`${title}: ${message}`);
  }
}

// Esponi API pubblica
window.walletAPI = {
  connect: connectWallet,
  disconnect: disconnectWallet,
  getState: () => ({ ...WALLET_STATE }),
  isConnected: () => WALLET_STATE.connected,
  getAddress: () => WALLET_STATE.address,
  getNetwork: () => WALLET_STATE.network,
  getNetworkName: () => WALLET_STATE.networkName,
  switchNetwork: switchToCorrectNetwork
};