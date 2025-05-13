/**
 * IASE Units Staking - Ethereum wallet connector
 * Versione ottimizzata con rilevamento disconnessione migliorato e validazione wallet
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
            
            // Forza visualizzazione dashboard
            const stakingDashboard = document.getElementById('stakingDashboard');
            if (stakingDashboard) {
              stakingDashboard.classList.remove('hidden');
            }
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
      console.error('⚠️ L\'indirizzo wallet non è una stringa:', typeof address);
      address = String(address);
    }
    
    // Clean whitespace
    let cleanAddress = address.trim().replace(/\s+/g, '');
    
    // Remove ellipsis if present and address is not a full address
    if (cleanAddress.includes('...') && cleanAddress.length < 42) {
      console.log('⚠️ Rilevato indirizzo abbreviato:', cleanAddress);
      cleanAddress = cleanAddress.replace(/\.\.\./g, '');
      console.log('🔧 Indirizzo dopo rimozione puntini:', cleanAddress);
    }
    
    // Ensure address starts with 0x
    if (!cleanAddress.startsWith('0x')) {
      console.warn('⚠️ L\'indirizzo wallet non inizia con 0x:', cleanAddress);
      cleanAddress = '0x' + cleanAddress;
      console.log('🔧 Aggiunto 0x all\'indirizzo:', cleanAddress);
    }
    
    // Check length and log warnings
    if (cleanAddress.length < 42) {
      console.error('⚠️ L\'indirizzo wallet è incompleto:', cleanAddress, '(lunghezza:', cleanAddress.length, ')');
    } else if (cleanAddress.length > 42) {
      console.warn('⚠️ L\'indirizzo wallet è troppo lungo:', cleanAddress, '(lunghezza:', cleanAddress.length, ')');
      // Truncate to 42 characters if too long
      cleanAddress = cleanAddress.substring(0, 42);
      console.log('🔧 Indirizzo troncato a 42 caratteri:', cleanAddress);
    }
    
    return cleanAddress;
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
    updateUI();
  }
  
  // Handle accounts changed event
  function handleAccountsChanged(accounts) {
    console.log('MetaMask accounts changed', accounts);
    
    if (accounts.length === 0) {
      // No accounts - user disconnected
      console.log('No accounts found, user disconnected');
    } else {
      // Connected with new account
      console.log('Connected with account:', accounts[0]);
      
      // Clean the wallet address
      const cleanAddress = cleanWalletAddress(accounts[0]);
      window.userWalletAddress = cleanAddress;
      
      // We must check the network after account change
      checkAndSwitchNetwork();
    }
    
    updateUI();
  }
  
  // Handle chain changed event
  function handleChainChanged(chainId) {
    console.log('MetaMask network changed', chainId);
    
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
    stakingDashboard = document.getElementById('stakingDashboard');
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