/**
 * IASE Staking Simple Connector
 * Handles wallet connection specifically for staking page with Ethereum network
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('📱 Staking ETH Connector initialized');
  
  // Remove wallet from navbar if present
  const navbarWallet = document.getElementById('wallet-component');
  if (navbarWallet) {
    navbarWallet.style.display = 'none';
  }
  
  // Esporta la funzione connectWalletETH al global scope
  window.connectWalletETH = connectEthWallet;
  window.disconnectWalletETH = disconnectEthWallet;
  
  // Network configuration data
  const NETWORK_DATA = {
    ETHEREUM_MAINNET: {
      chainId: '0x1',
      name: 'Ethereum Mainnet',
      shortName: 'ETH',
      isCorrect: true
    },
    BSC_MAINNET: {
      chainId: '0x38',
      name: 'BNB Smart Chain',
      shortName: 'BSC',
      isCorrect: false
    }
  };
  
  // NFT Collection contract address
  const IASE_NFT_CONTRACT = '0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F';
  
  // Get UI elements
  const connectBtn = document.getElementById('connectButtonETH');
  const disconnectBtn = document.getElementById('disconnectWalletBtn');
  const walletStatusText = document.getElementById('walletStatusText');
  const walletAddress = document.getElementById('walletAddress');
  const stakingDashboard = document.getElementById('stakingDashboard');
  const wrongNetworkAlert = document.getElementById('wrong-network-alert');
  const walletStatusIndicator = document.querySelector('.wallet-status-indicator');
  
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
    
    if (connected) {
      walletStatusIndicator.classList.remove('status-red');
      walletStatusIndicator.classList.add('status-green');
    } else {
      walletStatusIndicator.classList.remove('status-green');
      walletStatusIndicator.classList.add('status-red');
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
      
      // Update text and address displays
      if (walletStatusText) walletStatusText.textContent = 'Wallet connected';
      if (walletAddress) walletAddress.textContent = shortAddress;
      
      // Show/hide buttons
      if (connectBtn) connectBtn.classList.add('hidden');
      if (disconnectBtn) disconnectBtn.classList.remove('hidden');
      
      // Show dashboard only if on correct network
      if (stakingDashboard) {
        if (isCorrectNetwork) {
          stakingDashboard.classList.remove('hidden');
        } else {
          // On wrong network, hide dashboard
          stakingDashboard.classList.add('hidden');
        }
      }
      
      // Update address in dashboard
      const dashboardWalletAddress = document.getElementById('dashboardWalletAddress');
      if (dashboardWalletAddress) dashboardWalletAddress.textContent = shortAddress;
      
      // Show/hide wrong network alert
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
      if (isCorrectNetwork && typeof loadAvailableNfts === 'function') {
        setTimeout(() => {
          loadAvailableNfts(IASE_NFT_CONTRACT, address);
        }, 1000);
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
  
  // Get network name from chainId
  function getNetworkName(chainId) {
    for (const key in NETWORK_DATA) {
      if (NETWORK_DATA[key].chainId === chainId) {
        return NETWORK_DATA[key].name;
      }
    }
    return 'Unknown Network';
  }
  
  // Connect wallet function
  async function connectEthWallet() {
    if (!isMetaMaskInstalled()) {
      alert('MetaMask is not installed. Please install MetaMask to use this feature.');
      return;
    }
    
    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      console.log('✓ Wallet connected:', accounts[0]);
      
      // Check and switch network if needed
      await checkAndSwitchNetwork();
      
      // Update UI
      updateUI();
      
    } catch (error) {
      console.error('❌ Error connecting wallet:', error);
      alert('Connection rejected.');
    }
  }
  
  // Check network and switch to Ethereum if needed
  async function checkAndSwitchNetwork() {
    if (!window.ethereum) return;
    
    const chainId = window.ethereum.chainId;
    if (chainId !== NETWORK_DATA.ETHEREUM_MAINNET.chainId) {
      console.log('⚠️ Wrong network:', getNetworkName(chainId));
      
      // Ask user to switch to Ethereum
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
    }
  }
  
  // Inizializza listeners per gli eventi di metamask
  setupMetamaskListeners();
  
  // Add event listeners (rimossi perché li gestisce la pagina HTML direttamente)
  
  // Add event listener to network switch button
  const switchNetworkBtn = document.getElementById('switch-network-btn');
  if (switchNetworkBtn) {
    switchNetworkBtn.addEventListener('click', switchToEthereum);
  }
  
  // Elegant handling of Metamask events
  function setupMetamaskListeners() {
    if (!window.ethereum) return;
    
    // Clean up any existing listeners to avoid duplicates
    window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    window.ethereum.removeListener('chainChanged', handleChainChanged);
    
    // Add fresh listeners
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    
    // Check current connection state immediately
    checkInitialConnection();
  }
  
  // Handle account changes
  function handleAccountsChanged(accounts) {
    console.log('🔄 Accounts changed:', accounts);
    if (accounts.length === 0) {
      console.log('👋 User disconnected wallet');
      // Simple UI update on disconnect - no alerts
      updateUI();
    } else {
      console.log('✓ Account switched to:', accounts[0]);
      updateUI();
    }
  }
  
  // Handle chain/network changes
  function handleChainChanged(chainId) {
    console.log('🔄 Network changed:', chainId);
    updateUI();
  }
  
  // Check initial connection state
  function checkInitialConnection() {
    window.ethereum.request({ method: 'eth_accounts' })
      .then(accounts => {
        if (accounts.length > 0) {
          console.log('✓ Wallet already connected:', accounts[0]);
          updateUI();
        }
      })
      .catch(err => console.error('Error checking accounts:', err));
  }
  
  // Add CSS for the status indicators
  function addStatusIndicatorStyles() {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .status-green {
        background-color: #4CAF50 !important;
      }
      .status-red {
        background-color: #F44336 !important;
      }
    `;
    document.head.appendChild(styleEl);
  }
  
  // Initialize everything
  function init() {
    addStatusIndicatorStyles();
    setupMetamaskListeners();
    updateUI();
  }
  
  // Run initialization
  init();
});