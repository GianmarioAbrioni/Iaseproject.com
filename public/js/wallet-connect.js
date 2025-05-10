/**
 * IASE Wallet Connection
 * Manages wallet connection status across all pages
 */

document.addEventListener('DOMContentLoaded', function() {
  // Create wallet status menu items dynamically if they don't exist
  createWalletStatusIndicator();
  
  // Main elements
  const walletStatusContainer = document.getElementById('wallet-status-container');
  const connectionIndicator = document.getElementById('connection-indicator');
  const connectionText = document.getElementById('connection-text');
  const connectWalletBtn = document.getElementById('connect-wallet-btn');
  const disconnectWalletBtn = document.getElementById('disconnect-wallet-btn');
  
  // Function to dynamically create wallet status indicator in the navbar
  function createWalletStatusIndicator() {
    // Check if we need to create the elements (don't add duplicates)
    if (document.getElementById('wallet-status-container')) {
      return;
    }
    
    // Find the navbar content container
    const navbarContent = document.getElementById('navbarContent');
    if (!navbarContent) return;
    
    // Create wallet status container
    const walletStatusContainer = document.createElement('div');
    walletStatusContainer.className = 'd-flex flex-column mt-3';
    walletStatusContainer.id = 'wallet-status-container';
    walletStatusContainer.style.display = 'none';
    
    // Check if we're on the dashboard page to render differently
    const onDashboardPage = window.location.pathname.includes('user-dashboard') || 
                           window.location.pathname.includes('dashboard');
    
    // Create dashboard button if we're not on the dashboard page
    let dashboardBtn = '';
    if (!onDashboardPage) {
      dashboardBtn = `
        <a href="user-dashboard.html" class="btn btn-info btn-sm mb-2 w-100">
          <i class="ri-dashboard-line me-1"></i>Dashboard
        </a>
      `;
    }
    
    // Add wallet status indicator
    walletStatusContainer.innerHTML = `
      <div class="wallet-status d-flex align-items-center mb-2">
        <span class="connection-indicator disconnected" id="connection-indicator"></span>
        <span id="connection-text">Disconnected</span>
      </div>
      
      <div class="wallet-actions">
        ${dashboardBtn}
        <button class="btn btn-primary btn-sm w-100" id="connect-wallet-btn">
          <i class="ri-wallet-3-line me-1"></i>Connect Wallet
        </button>
        <button class="btn btn-outline-danger btn-sm w-100 mt-2" id="disconnect-wallet-btn" style="display: none;">
          <i class="ri-logout-box-line me-1"></i>Disconnect
        </button>
      </div>
    `;
    
    // Append to navbar
    navbarContent.appendChild(walletStatusContainer);
    
    // Add CSS if not already defined
    if (!document.getElementById('wallet-status-styles')) {
      const styleElement = document.createElement('style');
      styleElement.id = 'wallet-status-styles';
      styleElement.textContent = `
        .wallet-status {
          display: flex;
          align-items: center;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.75);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          background-color: rgba(0, 0, 0, 0.2);
          margin-bottom: 0.5rem;
        }
        
        .connection-indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          display: inline-block;
          margin-right: 0.5rem;
        }
        
        .connected {
          background-color: #4caf50;
          box-shadow: 0 0 5px #4caf50;
        }
        
        .disconnected {
          background-color: #ff5252;
          box-shadow: 0 0 5px #ff5252;
        }
        
        #wallet-status-container {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 1rem;
          margin-top: 1rem !important;
        }
        
        .wallet-actions {
          width: 100%;
        }
        
        @media (min-width: 992px) {
          #wallet-status-container {
            width: 220px;
          }
        }
      `;
      document.head.appendChild(styleElement);
    }
  }
  
  // Constants for contract addresses
  const IASE_TOKEN_ADDRESS = '0x5A170D59ae8B851DC4DD0D14cC89E5fE541752CE'; // BNB Smart Chain
  
  // Global user address storage
  window.userAddress = null;
  
  // Initialize Web3
  async function initWeb3() {
    if (window.ethereum) {
      try {
        console.log('Ethereum provider detected');
        window.web3 = new Web3(window.ethereum);
        return true;
      } catch (error) {
        console.error('User denied account access', error);
        return false;
      }
    } else if (window.web3) {
      window.web3 = new Web3(web3.currentProvider);
      console.log('Legacy web3 provider detected');
      return true;
    } else {
      console.log('No Ethereum browser extension detected');
      return false;
    }
  }
  
  // Connect wallet
  async function connectWallet() {
    const hasWeb3 = await initWeb3();
    
    if (!hasWeb3) {
      showConnectionError();
      return;
    }
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      handleAccountsChanged(accounts);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      showConnectionError();
    }
  }
  
  // Handle accounts changed
  function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      console.log('Please connect to MetaMask');
      disconnectWallet();
    } else {
      window.userAddress = accounts[0];
      console.log('Connected account:', window.userAddress);
      updateConnectedUI();
      
      // Store in local storage for persistence
      localStorage.setItem('iaseWalletConnected', 'true');
      localStorage.setItem('iaseWalletAddress', window.userAddress);
    }
  }
  
  // Update UI when connected
  function updateConnectedUI() {
    if (!walletStatusContainer) return;
    
    // Show the wallet status container
    walletStatusContainer.style.display = 'flex';
    
    // Update indicator and text
    connectionIndicator.classList.remove('disconnected');
    connectionIndicator.classList.add('connected');
    
    // Add short address to the connection text
    if (window.userAddress) {
      const shortAddress = `${window.userAddress.substring(0, 6)}...${window.userAddress.slice(-4)}`;
      connectionText.innerHTML = `Connected<br><span class="small opacity-75">${shortAddress}</span>`;
    } else {
      connectionText.textContent = 'Connected';
    }
    
    // Update buttons
    if (connectWalletBtn) connectWalletBtn.style.display = 'none';
    if (disconnectWalletBtn) disconnectWalletBtn.style.display = 'block';
    
    // Set short address if needed elsewhere on the page
    if (window.userAddress && document.getElementById('short-address')) {
      const shortAddress = `${window.userAddress.substring(0, 6)}...${window.userAddress.slice(-4)}`;
      document.getElementById('short-address').textContent = shortAddress;
    }
    
    // Additional token-specific logic if we're on dashboard/token page
    if (typeof updateTokenInterface === 'function') {
      updateTokenInterface();
    }
  }
  
  // Disconnect wallet
  function disconnectWallet() {
    window.userAddress = null;
    
    // Remove from local storage
    localStorage.removeItem('iaseWalletConnected');
    localStorage.removeItem('iaseWalletAddress');
    
    // Update UI
    if (!walletStatusContainer) return;
    
    connectionIndicator.classList.add('disconnected');
    connectionIndicator.classList.remove('connected');
    connectionText.textContent = 'Disconnected';
    
    if (connectWalletBtn) connectWalletBtn.style.display = 'block';
    if (disconnectWalletBtn) disconnectWalletBtn.style.display = 'none';
    
    // Additional token-specific logic if we're on dashboard/token page
    if (typeof updateDisconnectedTokenInterface === 'function') {
      updateDisconnectedTokenInterface();
    }
  }
  
  // Show connection error
  function showConnectionError() {
    alert('Connection Error: Please make sure you have MetaMask installed and properly configured.');
  }
  
  // Add token to MetaMask
  window.addTokenToMetaMask = async function() {
    if (!window.ethereum) {
      alert('MetaMask not detected!');
      return;
    }
    
    try {
      const success = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: IASE_TOKEN_ADDRESS,
            symbol: 'IASE',
            decimals: 18,
            image: window.location.origin + '/images/logo.png'
          }
        }
      });
      
      if (success) {
        console.log('Token successfully added to MetaMask!');
      } else {
        console.log('Token not added.');
      }
    } catch (error) {
      console.error('Error adding token to MetaMask:', error);
    }
  };
  
  // Check for existing connection
  async function checkExistingConnection() {
    // First check local storage
    const isConnected = localStorage.getItem('iaseWalletConnected') === 'true';
    const storedAddress = localStorage.getItem('iaseWalletAddress');
    
    if (isConnected && storedAddress) {
      // Verify with MetaMask
      const hasWeb3 = await initWeb3();
      
      if (hasWeb3 && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            handleAccountsChanged(accounts);
          } else {
            // Clear outdated storage if MetaMask is not actually connected
            disconnectWallet();
          }
        } catch (error) {
          console.error('Error checking existing connection:', error);
          disconnectWallet();
        }
      }
    }
  }
  
  // Set up event listeners if elements exist
  if (connectWalletBtn) {
    connectWalletBtn.addEventListener('click', connectWallet);
  }
  
  if (disconnectWalletBtn) {
    disconnectWalletBtn.addEventListener('click', disconnectWallet);
  }
  
  // Set up MetaMask event listeners
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', () => {
      window.location.reload();
    });
  }
  
  // Check for existing connection when page loads
  checkExistingConnection();
});