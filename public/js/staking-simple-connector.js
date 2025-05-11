/**
 * IASE Staking Simple Connector
 * Handles wallet connection specifically for staking page with Ethereum network
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('📱 Staking Simple Connector initialized');
  
  // Remove wallet from navbar if present
  const navbarWallet = document.getElementById('wallet-component');
  if (navbarWallet) {
    navbarWallet.style.display = 'none';
  }
  
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
  
  // Get UI elements
  const connectBtn = document.getElementById('connectWalletBtn');
  const disconnectBtn = document.getElementById('disconnectWalletBtn');
  const walletStatusText = document.getElementById('walletStatusText');
  const walletAddress = document.getElementById('walletAddress');
  const stakingDashboard = document.getElementById('stakingDashboard');
  const wrongNetworkAlert = document.getElementById('wrong-network-alert');
  
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
  
  // Update UI based on wallet state
  function updateUI() {
    if (isWalletConnected()) {
      // Wallet connected
      const address = window.ethereum.selectedAddress;
      const shortAddress = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
      const chainId = window.ethereum.chainId;
      const isCorrectNetwork = chainId === NETWORK_DATA.ETHEREUM_MAINNET.chainId;
      
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
        loadAvailableNfts();
      }
    } else {
      // Wallet disconnected
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
  
  // Disconnect wallet function (UI only)
  function disconnectEthWallet() {
    console.log('Wallet disconnected (UI)');
    
    // MetaMask has no real disconnect API
    // We can only update our UI
    updateUI();
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
  
  // Add event listeners
  if (connectBtn) {
    connectBtn.addEventListener('click', connectEthWallet);
  }
  
  if (disconnectBtn) {
    disconnectBtn.addEventListener('click', disconnectEthWallet);
  }
  
  // Add event listener to network switch button
  const switchNetworkBtn = document.getElementById('switch-network-btn');
  if (switchNetworkBtn) {
    switchNetworkBtn.addEventListener('click', switchToEthereum);
  }
  
  // Monitor account changes in MetaMask
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', function(accounts) {
      console.log('🔄 Accounts changed:', accounts);
      if (accounts.length === 0) {
        console.log('👋 User disconnected wallet');
      }
      updateUI();
    });
    
    window.ethereum.on('chainChanged', function(chainId) {
      console.log('🔄 Chain changed:', chainId);
      updateUI();
    });
    
    // Check for initial connection state
    window.ethereum.request({ method: 'eth_accounts' })
      .then(accounts => {
        if (accounts.length > 0) {
          console.log('✓ Wallet already connected:', accounts[0]);
          updateUI();
        }
      })
      .catch(err => console.error('Error checking accounts:', err));
  }
  
  // Initial UI update
  updateUI();
});