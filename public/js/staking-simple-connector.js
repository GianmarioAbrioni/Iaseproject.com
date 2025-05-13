/**
 * IASE Units Staking - Ethereum wallet connector
 * Versione ottimizzata con rilevamento disconnessione migliorato
 */
document.addEventListener('DOMContentLoaded', function() {
  console.log('📱 Staking ETH Connector initialization started');
  
  // Remove wallet from navbar if present
  const navbarWallet = document.getElementById('wallet-component');
  if (navbarWallet) {
    navbarWallet.style.display = 'none';
  }
  
  // Export connectWalletETH function to global scope
  window.connectWalletETH = connectEthWallet;
  window.disconnectWalletETH = disconnectEthWallet;
  
  // Constants
  const NETWORK_DATA = {
    ETHEREUM_MAINNET: {
      chainId: '0x1',
      name: 'Ethereum Mainnet',
      symbol: 'ETH',
      explorer: 'https://etherscan.io'
    }
  };
  
  // IASE NFT contract address
  const IASE_NFT_CONTRACT = '0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F';
  
  // UI elements
  let connectBtn = null;
  let disconnectBtn = null;
  let walletStatusText = null;
  let walletAddress = null;
  let stakingDashboard = null;
  let wrongNetworkAlert = null;
  let walletStatusIndicator = null;
  
  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return window.ethereum && window.ethereum.isMetaMask;
  };
  
  // Check if wallet is connected
  const isWalletConnected = () => {
    return window.ethereum && 
           window.ethereum.selectedAddress && 
           window.ethereum.selectedAddress.length > 0;
  };
  
  // Update wallet status indicator color
  function updateStatusIndicator(connected) {
    if (!walletStatusIndicator) return;
    
    // Trova l'indicatore principale dello stato (il div parent)
    const statusIndicatorParent = document.querySelector('.wallet-status-indicator');
    
    if (connected) {
      walletStatusIndicator.classList.remove('disconnected');
      walletStatusIndicator.classList.add('connected');
      
      // Aggiorna anche il parent per cambiare il colore di sfondo
      if (statusIndicatorParent) {
        statusIndicatorParent.classList.remove('status-red');
        statusIndicatorParent.classList.add('status-green');
      }
    } else {
      walletStatusIndicator.classList.remove('connected');
      walletStatusIndicator.classList.add('disconnected');
      
      // Aggiorna anche il parent per cambiare il colore di sfondo
      if (statusIndicatorParent) {
        statusIndicatorParent.classList.remove('status-green');
        statusIndicatorParent.classList.add('status-red');
      }
    }
  }
  
  // Update UI based on wallet state
  function updateUI() {
    if (isWalletConnected()) {
      // Wallet connected
      const address = window.ethereum.selectedAddress;
      const shortAddress = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
      const chainId = window.ethereum.chainId;
      const isCorrectNetwork = chainId === NETWORK_DATA.ETHEREUM_MAINNET.chainId;
      
      // Update status indicator to green
      updateStatusIndicator(true);
      
      // Update connection text
      if (walletStatusText) walletStatusText.textContent = 'Wallet connected';
      if (walletAddress) walletAddress.textContent = shortAddress;
      
      // Show disconnect button, hide connect button
      if (connectBtn) connectBtn.classList.add('hidden');
      if (disconnectBtn) disconnectBtn.classList.remove('hidden');
      
      // Show staking dashboard
      if (stakingDashboard) stakingDashboard.classList.remove('hidden');
      
      // Check if on correct network
      if (wrongNetworkAlert) {
        if (isCorrectNetwork) {
          wrongNetworkAlert.classList.add('d-none');
        } else {
          wrongNetworkAlert.classList.remove('d-none');
          // Update warning message
          const warningText = wrongNetworkAlert.querySelector('span');
          if (warningText) {
            warningText.textContent = `This page requires ${NETWORK_DATA.ETHEREUM_MAINNET.name} for NFT staking. You are currently on ${getNetworkName(chainId)}.`;
          }
        }
      }
      
      // Load available NFTs only on correct network
      if (isCorrectNetwork) {
        if (typeof loadAvailableNfts === 'function') {
          console.log("Calling loadAvailableNfts function with contract:", IASE_NFT_CONTRACT);
          setTimeout(() => {
            loadAvailableNfts(IASE_NFT_CONTRACT, address);
          }, 1000);
        } else {
          console.error("loadAvailableNfts function not found - manually triggering NFT loading");
          // Soluzione alternativa per caricare gli NFT
          setTimeout(() => {
            // Emit a custom event that staking.js can listen for
            document.dispatchEvent(new CustomEvent('manual:loadNFTs', { 
              detail: { address: address, contract: IASE_NFT_CONTRACT } 
            }));
            
            // Forza visualizzazione dashboard
            const stakingDashboard = document.getElementById('stakingDashboard');
            if (stakingDashboard) {
              stakingDashboard.classList.remove('hidden');
            }
          }, 1500);
        }
      }
    } else {
      // Wallet disconnected
      // Update status indicator to red
      updateStatusIndicator(false);
      
      if (walletStatusText) walletStatusText.textContent = 'Wallet not connected';
      if (walletAddress) walletAddress.textContent = '';
      
      if (connectBtn) connectBtn.classList.remove('hidden');
      if (disconnectBtn) disconnectBtn.classList.add('hidden');
      
      if (stakingDashboard) stakingDashboard.classList.add('hidden');
      
      // Hide wrong network alert
      if (wrongNetworkAlert) wrongNetworkAlert.classList.add('d-none');
    }
  }
  
  // Connect to Ethereum wallet
  async function connectEthWallet() {
    if (!window.ethereum) {
      alert('MetaMask not found! Please install MetaMask to use this feature.');
      return;
    }
    
    if (connectBtn) {
      connectBtn.disabled = true;
      connectBtn.innerHTML = '<i class="ri-loader-4-line fa-spin"></i> Connecting...';
    }
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      console.log('✓ Connected wallet:', accounts[0]);
      
      // Check network
      const chainId = window.ethereum.chainId;
      if (chainId !== NETWORK_DATA.ETHEREUM_MAINNET.chainId) {
        console.log('⚠️ Wrong network detected, attempting to switch...');
        await switchToEthereum();
      } else {
        console.log('✓ Already connected to Ethereum Mainnet');
      }
      
      // Update UI
      updateUI();
      
      // Start connection watcher
      startConnectionWatcher();
    } catch (error) {
      console.error('❌ Error connecting to wallet:', error);
      alert('Error connecting to wallet: ' + error.message);
    } finally {
      if (connectBtn) {
        connectBtn.disabled = false;
        connectBtn.innerHTML = '<i class="ri-wallet-3-line"></i> Connect ETH Wallet';
      }
    }
  }
  
  // Check and switch network if needed
  async function checkAndSwitchNetwork() {
    if (!window.ethereum) return;
    
    try {
      const chainId = window.ethereum.chainId;
      
      if (chainId !== NETWORK_DATA.ETHEREUM_MAINNET.chainId) {
        console.log('⚠️ Wrong network detected, attempting to switch...');
        await switchToEthereum();
      } else {
        console.log('✓ Already connected to Ethereum Mainnet');
      }
    } catch (error) {
      console.error('❌ Error checking/switching network:', error);
      updateUI(); // Update UI anyway
    }
  }
  
  // Disconnect wallet function (actual implementation)
  function disconnectEthWallet() {
    console.log('🔌 Tentativo di disconnessione wallet');
    
    if (window.ethereum) {
      console.log('Esecuzione disconnessione wallet');
      
      // Metodo 1: Reimpostiamo i flag interni per la UI
      if (typeof window.ethereum._state !== 'undefined' && 
          typeof window.ethereum._state.isConnected !== 'undefined') {
        window.ethereum._state.isConnected = false;
      }
      
      // Metodo 2: reset del localStorage (MetaMask memorizza dati qui)
      try {
        localStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE');
        localStorage.removeItem('walletconnect');
        localStorage.removeItem('METAMASK_CONNECTINFO');
        localStorage.removeItem('METAMASK_CONNECT_INFO');
        localStorage.removeItem('wagmi.connected');
        localStorage.removeItem('wagmi.wallet');
        localStorage.removeItem('metamask.providers');
        localStorage.removeItem('METAMASK_ACTIVE_CONNECTION');
        console.log('✓ Rimossi dati di connessione dal localStorage');
      } catch (e) {
        console.error('Errore nella pulizia localStorage', e);
      }
      
      // Nascondi qualsiasi loading rimasto prima del reload
      const loadingEl = document.getElementById('dashboardLoading');
      if (loadingEl) {
        try {
          document.body.removeChild(loadingEl);
        } catch (err) {
          console.log("Loading element not found during disconnect");
        }
      }
      
      // Ferma il watcher della connessione prima del refresh
      stopConnectionWatcher();
      
      // Metodo 3: Forza refresh completo della pagina
      window.location.reload();
    }
  }
  
  // Switch to Ethereum network
  async function switchToEthereum() {
    if (!window.ethereum) return;
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: NETWORK_DATA.ETHEREUM_MAINNET.chainId }]
      });
      console.log('✓ Switched to Ethereum Mainnet');
    } catch (error) {
      console.error('❌ Error switching network:', error);
      // If network doesn't exist in MetaMask, we don't add it (because Ethereum is pre-installed)
      updateUI(); // Update UI anyway
    }
  }
  
  // Initialize all UI elements and events
  function setupUIEvents() {
    // Add event listeners for the connect button
    connectBtn = document.getElementById('connectButtonETH');
    if (connectBtn) {
      connectBtn.addEventListener('click', connectEthWallet);
    }
    
    // Add event listener to network switch button
    const switchNetworkBtn = document.getElementById('switch-network-btn');
    if (switchNetworkBtn) {
      switchNetworkBtn.addEventListener('click', switchToEthereum);
    }
  }
  
  // Network switch button is handled in setupUIEvents
  
  // Elegant handling of Metamask events
  function setupMetamaskListeners() {
    if (!window.ethereum) return;
    
    // Clean up any existing listeners to avoid duplicates
    window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    window.ethereum.removeListener('chainChanged', handleChainChanged);
    window.ethereum.removeListener('disconnect', handleDisconnect);
    
    // Add fresh listeners
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('disconnect', handleDisconnect);
    
    // Check current connection state immediately
    checkInitialConnection();
  }
  
  // Handle wallet disconnect event (some wallets emit this)
  function handleDisconnect(error) {
    console.log('🔌 Wallet disconnect event detected:', error);
    
    // Ferma il watcher
    stopConnectionWatcher();
    
    // Forza l'aggiornamento UI - Aggiorna tutti gli elementi visibili
    const statusIndicatorParent = document.querySelector('.wallet-status-indicator');
    if (statusIndicatorParent) {
      statusIndicatorParent.classList.remove('status-green');
      statusIndicatorParent.classList.add('status-red');
    }
    
    if (walletStatusIndicator) {
      walletStatusIndicator.classList.remove('connected');
      walletStatusIndicator.classList.add('disconnected');
    }
    
    if (walletStatusText) walletStatusText.textContent = 'Wallet not connected';
    if (walletAddress) walletAddress.textContent = '';
    
    if (connectBtn) connectBtn.classList.remove('hidden');
    if (disconnectBtn) disconnectBtn.classList.add('hidden');
    
    if (stakingDashboard) stakingDashboard.classList.add('hidden');
    
    // Ricarica la pagina dopo un breve ritardo per forzare il reset completo
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }
  
  // Handle account changes
  function handleAccountsChanged(accounts) {
    console.log('🔄 Accounts changed:', accounts);
    
    // Verifica se è il primo collegamento (non ricarica in fase di connessione)
    const isInitialConnection = !window.userWasConnected;
    
    if (accounts.length === 0) {
      console.log('👋 User disconnected wallet');
      // Ferma il monitoraggio quando MetaMask riporta disconnessione
      stopConnectionWatcher();
      
      // SOLUZIONE CRUCIALE DA TOKEN.HTML: 
      // Ricarica la pagina invece di aggiornare solo la UI
      console.log('🔄 Ricaricando la pagina dopo disconnessione wallet...');
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } else {
      console.log('✓ Account switched to:', accounts[0]);
      // Assicuriamoci che il monitoraggio sia attivo quando c'è un account connesso
      startConnectionWatcher();
      
      // Imposta la flag per indicare che ora siamo collegati
      window.userWasConnected = true;
      
      // Solo se NON è la connessione iniziale ma un cambio account, 
      // allora ricarica la pagina
      if (!isInitialConnection) {
        console.log('🔄 Ricaricando la pagina dopo cambio account...');
        setTimeout(() => {
          window.location.reload();
        }, 100);
      } else {
        // Se è la prima connessione, aggiorna solo la UI senza ricaricare
        console.log('✓ Connessione iniziale, aggiornamento UI senza reload');
        updateUI();
      }
    }
  }
  
  // Handle chain/network changes
  function handleChainChanged(chainId) {
    console.log('🔄 Network changed:', chainId);
    
    // Verifica se è la prima connessione
    const isInitialConnection = !window.networkWasDetected;
    
    // Imposta la flag per indicare che abbiamo rilevato una rete
    window.networkWasDetected = true;
    
    // Solo se non è la prima rilevazione rete (connessione iniziale)
    if (!isInitialConnection) {
      // Soluzione: Ricarica la pagina per resettare tutto quando cambia la rete
      // Questo è ciò che fa token.html (riga 319) e garantisce il reset completo
      console.log('🔄 Ricaricando la pagina dopo cambio rete...');
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } else {
      // Se è la prima rilevazione rete, aggiorna solo la UI senza ricaricare
      console.log('✓ Rilevazione rete iniziale, aggiornamento UI senza reload');
      updateUI();
    }
  }
  
  // Check initial connection state on page load
  function checkInitialConnection() {
    console.log('🔍 Eseguo controllo iniziale connessione wallet');
    
    // Se non esiste ethereum, non possiamo connetterci
    if (!window.ethereum) {
      console.log('❌ Controllo iniziale: window.ethereum non disponibile');
      updateStatusIndicator(false);
      return;
    }
    
    // Verifica presenza di indirizzo nel selectedAddress
    const hasSelectedAddress = window.ethereum.selectedAddress && 
                             window.ethereum.selectedAddress.length > 0;
    
    console.log('ℹ️ Stato iniziale:', {
      selectedAddress: window.ethereum.selectedAddress,
      isConnected: typeof window.ethereum.isConnected === 'function' ? 
                  window.ethereum.isConnected() : 'non supportato'
    });
    
    // Richiedi gli account per verificare l'effettiva connessione
    window.ethereum.request({ method: 'eth_accounts' })
      .then(accounts => {
        console.log('🔎 Account trovati:', accounts);
        
        // Verifica stato inconsistente: abbiamo selectedAddress ma nessun account autorizzato
        if (hasSelectedAddress && accounts.length === 0) {
          console.log('⚠️ Stato inconsistente rilevato: selectedAddress presente ma nessun account autorizzato');
          
          // Questo è uno stato inconsistente, significa che l'utente ha disconnesso manualmente il wallet
          // ma selectedAddress non è stato aggiornato correttamente
          updateStatusIndicator(false);
          
          if (walletStatusText) walletStatusText.textContent = 'Wallet not connected';
          if (walletAddress) walletAddress.textContent = '';
          
          // Ricarica dopo breve ritardo per ripristinare lo stato corretto
          setTimeout(() => {
            window.location.reload();
          }, 500);
          
          return;
        }
        
        if (accounts.length > 0) {
          console.log('✅ Controllo iniziale: wallet già connesso');
          
          // Aggiorna UI come se ci fossimo appena connessi
          handleAccountsChanged(accounts);
          
          // Controlla anche la rete
          checkAndSwitchNetwork();
          
          // Avvia il watcher per verificare eventuali disconnessioni future
          startConnectionWatcher();
        } else {
          console.log('❌ Controllo iniziale: wallet non autorizzato');
          updateStatusIndicator(false);
        }
      })
      .catch(err => {
        console.error('❌ Errore nel controllo iniziale:', err);
        updateStatusIndicator(false);
      });
  }
  
  // Variabile globale per l'intervallo del watcher
  let connectionWatcherInterval = null;
  
  // Flag per evitare sovrapposizioni di richieste
  let isCheckingConnection = false;
  
  // Flag per tracciare lo stato della connessione
  window.userWasConnected = false;
  window.networkWasDetected = false;
  
  // Avvia il monitoraggio periodico della connessione
  function startConnectionWatcher() {
    // Non avviare se è già attivo
    if (connectionWatcherInterval) {
      console.log('⚠️ Watcher already running, skipping');
      return;
    }
    
    // Memorizza l'indirizzo iniziale per rilevare cambiamenti
    const initialAddress = window.ethereum ? window.ethereum.selectedAddress : null;
    console.log('📝 Avvio monitoraggio disconnessione per indirizzo:', initialAddress);
    
    // Controlla lo stato della connessione OGNI SECONDO
    // con un limite massimo di 30 verifiche (30 secondi totali)
    let checkCount = 0;
    const MAX_CHECKS = 30;
    
    // Esegui una verifica immediata
    checkConnectionStatus();
    
    connectionWatcherInterval = setInterval(() => {
      if (checkCount >= MAX_CHECKS) {
        console.log('🛑 Raggiunto limite massimo di verifiche, watcher fermato');
        stopConnectionWatcher();
        return;
      }
      
      // Verifica se l'indirizzo è cambiato (indicatore di disconnessione)
      if (window.ethereum && initialAddress && window.ethereum.selectedAddress !== initialAddress) {
        console.log('🔄 Cambio indirizzo rilevato da:', initialAddress, 'a:', window.ethereum.selectedAddress || 'nessuno');
        
        if (!window.ethereum.selectedAddress) {
          // Se l'indirizzo è nullo, è una disconnessione
          console.log('🔌 Disconnessione rilevata tramite cambio indirizzo!');
          handleDisconnect({ code: 'ADDRESS_CHANGED', message: 'Indirizzo wallet cambiato a null' });
          return;
        }
      }
      
      // SOLUZIONE ALTERNATIVA: Controlla manualmente disconnessione tramite ethereum.isConnected
      // Solo alcuni wallet supportano questa proprietà
      if (window.ethereum && typeof window.ethereum.isConnected === 'function' && 
          !window.ethereum.isConnected() && isWalletConnected()) {
        console.log('🔌 Disconnessione rilevata tramite ethereum.isConnected()!');
        handleDisconnect({ code: 'IS_CONNECTED_FALSE_EVENT', message: 'ethereum.isConnected() ritorna false' });
        return;
      }
      
      checkCount++;
      checkConnectionStatus();
    }, 1000); // Intervallo ridotto a 1 secondo per reazione immediata
    
    console.log('🔍 Avviato monitoraggio connessione wallet (limite: 30 secondi, check ogni 1s)');
  }
  
  // Ferma il monitoraggio della connessione
  function stopConnectionWatcher() {
    if (connectionWatcherInterval) {
      clearInterval(connectionWatcherInterval);
      connectionWatcherInterval = null;
      console.log('🛑 Fermato monitoraggio connessione wallet');
    }
  }
  
  // Verifica lo stato attuale della connessione
  function checkConnectionStatus() {
    // Se ethereum non esiste o stiamo già controllando, usciamo
    if (!window.ethereum || isCheckingConnection) {
      stopConnectionWatcher();
      return;
    }
    
    // Flag per evitare chiamate sovrapposte
    isCheckingConnection = true;
    
    // SOLUZIONE DIRETTA: Controlla direttamente lo stato ethereum._state.isUnlocked
    // MetaMask e altri wallet compatibili hanno questa proprietà interna
    let manuallyDisconnected = false;
    
    // Metodo 1: Proprietà metamask._state.isUnlocked è false quando l'utente disconnette manualmente
    if (window.ethereum._state && 
        typeof window.ethereum._state.isUnlocked !== 'undefined' && 
        window.ethereum._state.isUnlocked === false && 
        isWalletConnected()) {
      manuallyDisconnected = true;
      console.log('🔥 DISCONNESSIONE RILEVATA: _state.isUnlocked=false ma selectedAddress presente');
      handleDisconnect({ code: 'UNLOCKED_FALSE', message: 'Stato wallet isUnlocked=false' });
      isCheckingConnection = false;
      return;
    }
    
    // Metodo 2: Fallback - Usa eth_accounts che è il metodo standard
    window.ethereum.request({ method: 'eth_accounts' })
      .then(accounts => {
        // VERIFICA CRUCIALE: Controllo disconnessione manuale - Questo è il test più importante
        // Se non ci sono account ma selectedAddress è ancora impostato, 
        // l'utente ha disconnesso manualmente il wallet
        if (accounts.length === 0 && isWalletConnected()) {
          console.log('🔥 DISCONNESSIONE MANUALE RILEVATA via eth_accounts');
          
          // SOLUZIONE TOKEN.HTML: Forza reset del selectedAddress prima della disconnessione
          try {
            window.ethereum.selectedAddress = null;
          } catch(e) { /* Ignora errori se read-only */ }
          
          // Forza un reload immediato per ricaricare completamente lo stato
          setTimeout(() => {
            window.location.reload();
          }, 100); // Tempo ridotto al minimo per una reazione immediata
          
          handleDisconnect({ code: 'MANUAL_DISCONNECT_CONFIRMED', message: 'Disconnessione wallet manuale confermata' });
          isCheckingConnection = false;
          return;
        }
        
        // Verifiche originali (mantenute come fallback)
        if (accounts.length === 0 && window.ethereum.selectedAddress) {
          console.log('🔄 Rilevata disconnessione manuale (selectedAddress presente ma nessun account)');
          handleDisconnect({ code: 'INCONSISTENT_STATE', message: 'Stato inconsistente rilevato' });
          isCheckingConnection = false;
          return;
        }
        
        if (typeof window.ethereum.isConnected === 'function' && 
            !window.ethereum.isConnected() && 
            accounts.length > 0) {
          console.log('🔄 Rilevata disconnessione: isConnected() è false ma ci sono account');
          handleDisconnect({ code: 'IS_CONNECTED_FALSE', message: 'isConnected() è false' });
          isCheckingConnection = false;
          return;
        }
        
        // Reset del flag se non abbiamo rilevato disconnessioni
        isCheckingConnection = false;
      })
      .catch(err => {
        console.error('❌ Errore nel controllo dello stato connessione:', err);
        isCheckingConnection = false;
        stopConnectionWatcher();
        
        // Se riceviamo un errore significa che probabilmente c'è un problema 
        // con la connessione al wallet, quindi trattiamola come disconnessione
        handleDisconnect({ code: 'CONNECTION_ERROR', message: err.message });
      });
  }
  
  // Add CSS for the status indicators
  function addStatusIndicatorStyles() {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .wallet-status-indicator.status-green {
        background-color: rgba(0, 180, 0, 0.15);
        border-color: #00b400;
      }
      
      .wallet-status-indicator.status-red {
        background-color: rgba(255, 50, 50, 0.15);
        border-color: #ff5050;
      }
      
      #walletIndicator.connected {
        background-color: #00b400;
      }
      
      #walletIndicator.disconnected {
        background-color: #ff5050;
      }
      
      .wallet-status-indicator {
        transition: all 0.3s ease;
      }
      
      .wallet-status-indicator #walletIndicator {
        transition: all 0.3s ease;
      }
    `;
    document.head.appendChild(styleEl);
  }
  
  // Helper to get network name from chainId
  function getNetworkName(chainId) {
    switch (chainId) {
      case '0x1':
        return 'Ethereum Mainnet';
      case '0x5':
        return 'Goerli Testnet';
      case '0xaa36a7':
        return 'Sepolia Testnet';
      case '0x38':
        return 'BNB Smart Chain';
      case '0x89':
        return 'Polygon';
      case '0xa86a':
        return 'Avalanche';
      default:
        return 'Unknown Network';
    }
  }
  
  // Initialize everything
  function init() {
    walletStatusIndicator = document.getElementById('walletIndicator');
    walletStatusText = document.getElementById('walletStatusText'); // Corretto ID errato
    walletAddress = document.getElementById('walletAddress');
    stakingDashboard = document.getElementById('stakingDashboard');
    wrongNetworkAlert = document.getElementById('wrongNetworkAlert');
    disconnectBtn = document.getElementById('disconnectWalletBtn');
    
    addStatusIndicatorStyles();
    setupMetamaskListeners();
    setupUIEvents();
    updateUI();
  }
  
  // Run initialization
  init();
});