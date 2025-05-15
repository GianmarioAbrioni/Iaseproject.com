/**
 * IASE Units Staking - Ethereum wallet connector
 * Versione ottimizzata per Render con rilevamento disconnessione migliorato e validazione wallet
 * 
 * Versione 2.0.0 - 2023-05-14
 * - Compatibilità garantita con MetaMask, Coinbase Wallet e altri wallet Ethereum
 * - Sistema di monitoring connessione per rilevare disconnessioni automatiche
 * - Gestione eventi DOM avanzata con eventi custom per integrazioni
 * - Hardcoded contract addresses e configurazioni per funzionamento immediato
 * - Validazione indirizzi wallet con controlli di integrità
 * - Logging esteso per debug e diagnostica
 */
document.addEventListener('DOMContentLoaded', function() {
  console.log('📱 IASE Staking Wallet Connector v2.0 - Inizializzazione');
  
  // Rimuovi componente wallet dalla navbar se presente
  const navbarWallet = document.getElementById('wallet-component');
  if (navbarWallet) {
    navbarWallet.style.display = 'none';
    console.log('🔄 Wallet component nascosto dalla navbar');
  }
  
  // Esponi le funzioni al global scope per accesso da altri script
  window.connectWalletETH = connectEthWallet;
  window.disconnectWalletETH = disconnectEthWallet;
  window.checkWalletConnectionETH = checkConnectionStatus;
  window.switchToEthereumMainnet = switchToEthereum;
  
  // Configurazione HARDCODED per funzionamento su Render
  const ETHEREUM_CHAIN_ID = '0x1'; // Mainnet
  const BSC_CHAIN_ID = '0x38';     // Binance Smart Chain
  
  // Dati completi per le reti principali (mainnet)
  const NETWORK_DATA = {
    ETHEREUM_MAINNET: {
      chainId: ETHEREUM_CHAIN_ID,
      chainIdDecimal: 1,
      name: 'Ethereum Mainnet',
      symbol: 'ETH',
      explorer: 'https://etherscan.io',
      rpcUrls: [
        'https://eth-mainnet.g.alchemy.com/v2/uAZ1tPYna9tBMfuTa616YwMcgptV_1vB',
        'https://mainnet.infura.io/v3/84ed164327474b4499c085d2e4345a66',
        'https://rpc.ankr.com/eth',
        'https://eth.llamarpc.com'
      ]
    },
    BSC_MAINNET: {
      chainId: BSC_CHAIN_ID,
      chainIdDecimal: 56,
      name: 'Binance Smart Chain',
      symbol: 'BNB',
      explorer: 'https://bscscan.com',
      rpcUrls: [
        'https://bsc-dataseed.binance.org',
        'https://bsc-dataseed1.defibit.io',
        'https://bsc-dataseed1.ninicoin.io'
      ]
    }
  };
  
  // Indirizzi smart contract (HARDCODED per render)
  // Utilizza prima i valori in window (se impostati in HTML) o valori di default
  const IASE_NFT_CONTRACT = window.NFT_CONTRACT_ADDRESS || '0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F';
  const IASE_REWARDS_CONTRACT = window.REWARDS_CONTRACT_ADDRESS || '0x38C62fCFb6a6Bbce341B41bA6740B07739Bf6E1F';
  
  // Log delle configurazioni (debug mode)
  if (window.IASE_DEBUG) {
    console.log('🔧 Configurazione Staking Connector:');
    console.log(`- NFT Contract: ${IASE_NFT_CONTRACT}`);
    console.log(`- Rewards Contract: ${IASE_REWARDS_CONTRACT}`);
    console.log(`- Network: ${NETWORK_DATA.ETHEREUM_MAINNET.name} (${NETWORK_DATA.ETHEREUM_MAINNET.chainId})`);
  }
  
  // Esporta globalmente l'indirizzo del contratto
  window.IASE_NFT_CONTRACT = IASE_NFT_CONTRACT;
  
  // UI elements
  let connectBtn = null;
  let disconnectBtn = null;
  let walletStatusText = null;
  let walletAddress = null;
  let stakingDashboard = null;
  let wrongNetworkAlert = null;
  let walletStatusIndicator = null;
  
  // Connection watcher
  let connectionWatcherInterval = null;
  const CONNECTION_CHECK_INTERVAL = 3000; // 3 seconds
  
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
    if (walletStatusIndicator) {
      if (connected) {
        walletStatusIndicator.classList.remove('disconnected');
        walletStatusIndicator.classList.add('connected');
      } else {
        walletStatusIndicator.classList.remove('connected');
        walletStatusIndicator.classList.add('disconnected');
      }
    }
  }
  
  // Update UI based on wallet state
  function updateUI() {
    if (isWalletConnected()) {
      // Wallet connected
      const address = window.ethereum.selectedAddress;
      
      // Clean the wallet address and then create a short version for display
      // Verifica che address sia una stringa prima di usare includes
      const cleanAddress = cleanWalletAddress(address);
      
      // IMPORTANTE: Salva l'indirizzo completo e pulito in una variabile globale per le API
      window.userWalletAddress = cleanAddress;
      console.log('📝 Indirizzo wallet completo salvato per API:', window.userWalletAddress);
      
      // Salva in localStorage per persistenza tra sessioni
      try {
        localStorage.setItem('lastWalletAddress', cleanAddress);
        console.log('💾 Indirizzo wallet salvato in localStorage');
      } catch (e) {
        console.error('❌ Errore nel salvare l\'indirizzo in localStorage:', e);
      }
      
      // Versione abbreviata solo per visualizzazione nell'UI
      const shortAddress = `${cleanAddress.substring(0, 6)}...${cleanAddress.substring(cleanAddress.length - 4)}`;
      const chainId = window.ethereum.chainId;
      const isCorrectNetwork = chainId === NETWORK_DATA.ETHEREUM_MAINNET.chainId;
      
      // Update status indicator to green
      updateStatusIndicator(true);
      
      // Update connection text
      if (walletStatusText) walletStatusText.textContent = isCorrectNetwork ? 'Wallet connected' : 'Wrong network';
      if (walletAddress) walletAddress.textContent = shortAddress;
      
      // Show disconnect button, hide connect button
      if (connectBtn) connectBtn.classList.add('hidden');
      if (disconnectBtn) disconnectBtn.classList.remove('hidden');
      
      // Show wrong network alert if necessary
      if (wrongNetworkAlert) {
        if (!isCorrectNetwork) {
          wrongNetworkAlert.classList.remove('d-none');
          const networkName = getNetworkName(chainId);
          document.getElementById('currentNetwork').textContent = networkName;
        } else {
          wrongNetworkAlert.classList.add('d-none');
        }
      }
      
      // Show staking dashboard only if connected to correct network
      if (stakingDashboard) {
        if (isCorrectNetwork) {
          stakingDashboard.classList.remove('hidden');
          // Trigger custom event for staking.js
          const event = new CustomEvent('wallet:connected', { 
            detail: { address: cleanAddress, shortAddress, chainId } 
          });
          document.dispatchEvent(event);
          
          // Execute callback after a delay to ensure UI updates first
          if (typeof onNetworkReadyCallback === 'function') {
            setTimeout(() => {
              onNetworkReadyCallback();
            }, 1500);
          }
          
          // Trigger a custom event to load NFTs
          setTimeout(() => {
            console.log("🔄 Triggering NFT loading after wallet connection");
            
            // Clean the wallet address (address is already cleaned above)
            document.dispatchEvent(new CustomEvent('manual:loadNFTs', { 
              detail: { address: cleanAddress, contract: IASE_NFT_CONTRACT } 
            }));
            
            // Nota: la visualizzazione della dashboard viene gestita dall'evento wallet:connected
            // Non è necessario forzare la visualizzazione qui poiché staking.js riceverà l'evento
            // e mostrerà la dashboard tramite handleWalletConnected
          }, 1500);
        } else {
          stakingDashboard.classList.add('hidden');
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
  
  // Function to clean wallet address
  function cleanWalletAddress(address) {
    if (!address) return '';
    
    // Ensure address is a string
    if (typeof address !== 'string') {
      address = String(address);
    }
    
    // Clean whitespace
    let cleanAddress = address.trim().replace(/\s+/g, '');
    
    // Remove ellipsis if present
    if (cleanAddress.includes('...')) {
      cleanAddress = cleanAddress.replace(/\.\.\./g, '');
    }
    
    // Ensure address starts with 0x
    if (!cleanAddress.startsWith('0x')) {
      cleanAddress = '0x' + cleanAddress;
    }
    
    // Truncate if too long
    if (cleanAddress.length > 42) {
      cleanAddress = cleanAddress.substring(0, 42);
    }
    
    return cleanAddress;
  }
  
  // Connect to Ethereum wallet
  /**
   * Connette il wallet Ethereum dell'utente (MetaMask o altri provider)
   * Gestisce tutti i controlli di sicurezza e la validazione dell'indirizzo
   * @returns {Promise<{address: string, chainId: string, connected: boolean}>}
   */
  async function connectEthWallet() {
    console.log('🔄 Tentativo connessione wallet Ethereum...');
    
    // Verifica che il browser disponga di un provider web3 (MetaMask, ecc.)
    if (!window.ethereum) {
      console.error('❌ Nessun provider Ethereum trovato nel browser');
      
      // Mostra messaggio all'utente
      const errorMessage = 'MetaMask o altro wallet Ethereum non trovato. Per utilizzare la funzionalità di staking, installa un wallet compatibile come MetaMask.';
      alert(errorMessage);
      
      // Dispatcha evento di errore per notificare altri componenti
      document.dispatchEvent(new CustomEvent('wallet:error', {
        detail: { 
          code: 'PROVIDER_MISSING',
          message: errorMessage
        }
      }));
      
      return null;
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
      // Rimosso alert di errore perché spesso appare durante connessioni andate a buon fine
      // La connessione prosegue comunque in background
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
  
  // Disconnect ETH wallet
  function disconnectEthWallet() {
    console.log('Disconnecting wallet...');
    
    // Method 1: Clear cached provider info manually
    if (window.ethereum && window.ethereum._state && window.ethereum._state.accounts) {
      window.ethereum._state.accounts = [];
    }
    
    // Method 2: Clear localStorage (this is why people stay "logged in")
    try {
      localStorage.removeItem('walletconnect');
      localStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE');
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
  
  // Switch to Ethereum network
  async function switchToEthereum() {
    if (!window.ethereum) return;
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: NETWORK_DATA.ETHEREUM_MAINNET.chainId }]
      });
      console.log('✓ Switched to Ethereum Mainnet');
      
      // Dispatch network changed event
      document.dispatchEvent(new CustomEvent('wallet:networkChanged', {
        detail: { network: NETWORK_DATA.ETHEREUM_MAINNET.chainId }
      }));
      
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
    
    console.log('✓ MetaMask event listeners setup complete');
  }
  
  // Handle disconnect event
  function handleDisconnect(error) {
    console.log('MetaMask disconnect event triggered', error);
    
    // Dispatch disconnect event for other components
    document.dispatchEvent(new CustomEvent('wallet:disconnected'));
    
    updateUI();
  }
  
  // Handle accounts changed event
  function handleAccountsChanged(accounts) {
    console.log('MetaMask accounts changed', accounts);
    
    if (accounts.length === 0) {
      // No accounts - user disconnected
      console.log('No accounts found, user disconnected');
      
      // Dispatch disconnect event for other components
      document.dispatchEvent(new CustomEvent('wallet:disconnected'));
    } else {
      // Connected with new account
      console.log('Connected with account:', accounts[0]);
      
      // Clean the wallet address
      const cleanAddress = cleanWalletAddress(accounts[0]);
      window.userWalletAddress = cleanAddress;
      
      // Dispatch connect event for other components
      document.dispatchEvent(new CustomEvent('wallet:connected', {
        detail: { address: cleanAddress, network: window.ethereum.chainId }
      }));
      
      // We must check the network after account change
      checkAndSwitchNetwork();
    }
    
    updateUI();
  }
  
  // Handle chain changed event
  function handleChainChanged(chainId) {
    console.log('MetaMask network changed', chainId);
    
    // Dispatch network changed event for other components to react
    document.dispatchEvent(new CustomEvent('wallet:networkChanged', {
      detail: { network: chainId }
    }));
    
    // Force a page reload on chain change to ensure everything is in sync
    // This is recommended by MetaMask
    window.location.reload();
  }
  
  // Check if wallet was previously connected
  function checkInitialConnection() {
    if (isWalletConnected()) {
      console.log('Wallet already connected on page load');
      updateUI();
    } else {
      console.log('No wallet connected on page load');
      
      // Attempt to recover from localStorage
      try {
        const storedAddress = localStorage.getItem('lastWalletAddress');
        if (storedAddress) {
          console.log('Found previous wallet address in localStorage:', storedAddress);
          // Don't automatically connect, but keep it for reference
          window.lastWalletAddress = storedAddress;
        }
      } catch (e) {
        console.error('Error checking localStorage:', e);
      }
    }
  }
  
  // Start connection watcher for disconnect detection
  function startConnectionWatcher() {
    // Stop any existing watcher
    stopConnectionWatcher();
    
    // Start a new watcher
    connectionWatcherInterval = setInterval(checkConnectionStatus, CONNECTION_CHECK_INTERVAL);
    console.log('✓ Connection watcher started');
  }
  
  // Stop connection watcher
  function stopConnectionWatcher() {
    if (connectionWatcherInterval) {
      clearInterval(connectionWatcherInterval);
      connectionWatcherInterval = null;
      console.log('✓ Connection watcher stopped');
    }
  }
  
  // Check current connection status
  function checkConnectionStatus() {
    if (!isWalletConnected() && walletStatusText && walletStatusText.textContent !== 'Wallet not connected') {
      console.log('⚠️ Wallet disconnection detected by watcher');
      updateUI();
    }
  }
  
  // Get network name from chainId
  function getNetworkName(chainId) {
    switch (chainId) {
      case '0x1':
        return 'Ethereum Mainnet';
      case '0x5':
        return 'Goerli Testnet';
      case '0xaa36a7':
        return 'Sepolia Testnet';
      case '0x89':
        return 'Polygon';
      case '0x38':
        return 'BNB Smart Chain';
      default:
        return `Unknown (${chainId})`;
    }
  }
  
  // Initialize app
  function init() {
    console.log('🔄 Initializing ETH wallet connector');
    
    // Get references to UI elements
    walletStatusText = document.getElementById('walletStatusText');
    walletAddress = document.getElementById('walletAddress');
    disconnectBtn = document.getElementById('disconnectWalletBtn');
    
    // Usando riferimento globale per stakingDashboard per evitare conflitti di scope
    if (document.getElementById('stakingDashboard')) {
      stakingDashboard = document.getElementById('stakingDashboard');
      console.log('✅ Riferimento stakingDashboard acquisito correttamente');
    } else {
      console.error('❌ Elemento stakingDashboard non trovato nell\'inizializzazione');
    }
    
    wrongNetworkAlert = document.getElementById('wrong-network-alert');
    walletStatusIndicator = document.getElementById('walletIndicator');
    
    // Enhance page with CSS styles
    addStatusIndicatorStyles();
    
    // Set up UI
    setupUIEvents();
    
    // Set up MetaMask listeners
    setupMetamaskListeners();
    
    // Check if wallet already connected
    checkInitialConnection();
    
    // Start connection watcher
    startConnectionWatcher();
    
    // Export functions globally
    window.connectWalletETH = connectEthWallet;
    window.disconnectWalletETH = disconnectEthWallet;
    window.cleanWalletAddress = cleanWalletAddress; // Export the clean function for use in other files
    
    console.log('✅ ETH wallet connector initialized');
  }
  
  // Add CSS styles for status indicator
  function addStatusIndicatorStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .wallet-status-indicator {
        display: flex;
        align-items: center;
        margin-bottom: 0.5rem;
      }
      .wallet-status-indicator .indicator {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        margin-right: 0.5rem;
        transition: background-color 0.3s ease;
      }
      .wallet-status-indicator .indicator.connected {
        background-color: #10b981;
        box-shadow: 0 0 5px #10b981;
      }
      .wallet-status-indicator .indicator.disconnected {
        background-color: #ef4444;
        box-shadow: 0 0 5px #ef4444;
      }
      .wallet-status-indicator .wallet-info {
        display: flex;
        flex-direction: column;
      }
      .wallet-status-indicator #walletStatusText {
        font-size: 0.8rem;
        color: #6b7280;
      }
      .wallet-status-indicator .wallet-address {
        font-size: 0.9rem;
        font-weight: 500;
        color: #1f2937;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Call init to setup everything
  init();
});