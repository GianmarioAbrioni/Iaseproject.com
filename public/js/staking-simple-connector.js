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
  
  // Export connectWalletETH function to global scope
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
            
            // Utilizza la nuova funzionalità client-side di lettura NFT
            // Prima controlla se la funzione loadAllIASENFTs è disponibile
            if (typeof window.loadAllIASENFTs === 'function') {
              console.log("🔍 Caricando NFT utilizzando ethers.js direttamente dal wallet...");
              
              try {
                const container = document.getElementById('availableNftsContainer');
                if (container) {
                  // Mostra indicatore di caricamento
                  container.innerHTML = `
                    <div class="loading-container">
                      <div class="spinner-border text-primary" role="status"></div>
                      <p class="mt-2">Loading NFTs directly from your wallet...</p>
                    </div>
                  `;
                  
                  // Usa la funzione del nftReader per caricare gli NFT
                  window.loadAllIASENFTs()
                    .then(nfts => {
                      console.log("✅ NFT caricati correttamente con ethers.js:", nfts);
                      
                      // Svuota container
                      container.innerHTML = '';
                      
                      if (!nfts || nfts.length === 0) {
                        container.innerHTML = `
                          <div class="empty-state">
                            <i class="ri-search-line"></i>
                            <h3>No NFTs Found</h3>
                            <p>No IASE Units NFTs found in your wallet on Ethereum network.</p>
                            <button id="manualRefreshNfts" class="btn primary-btn mt-3">
                              <i class="ri-refresh-line"></i> Refresh
                            </button>
                          </div>
                        `;
                        
                        // Aggiungi listener al pulsante di refresh
                        const refreshBtn = document.getElementById('manualRefreshNfts');
                        if (refreshBtn) {
                          refreshBtn.addEventListener('click', () => {
                            console.log("🔄 Aggiornamento NFT richiesto...");
                            window.loadAllIASENFTs()
                              .then(updatedNfts => {
                                console.log("NFT aggiornati:", updatedNfts);
                                // Trigger UI update
                                document.dispatchEvent(new CustomEvent('nfts:updated', { 
                                  detail: { nfts: updatedNfts } 
                                }));
                              });
                          });
                        }
                      } else {
                        // Mostra gli NFT trovati
                        nfts.forEach(nft => {
                          const card = document.createElement('div');
                          card.className = 'nft-card';
                          card.innerHTML = `
                            <img src="${nft.image}" alt="${nft.name}" class="nft-image" onerror="this.src='images/nft-placeholder.jpg'">
                            <div class="nft-details">
                              <h3 class="nft-title">${nft.name}</h3>
                              <p class="nft-id">ID: ${nft.id}</p>
                              <span class="rarity-badge ${(nft.rarity || 'standard').toLowerCase()}">${nft.rarity || 'Standard'}</span>
                              <div class="nft-card-actions mt-3">
                                <button class="btn primary-btn stake-nft-btn" data-nft-id="${nft.id}">
                                  <i class="ri-lock-line"></i> Stake
                                </button>
                              </div>
                            </div>
                          `;
                          container.appendChild(card);
                        });
                        
                        // Aggiungi event listener ai pulsanti di staking
                        document.querySelectorAll('.stake-nft-btn').forEach(btn => {
                          btn.addEventListener('click', (e) => {
                            const nftId = e.currentTarget.getAttribute('data-nft-id');
                            console.log(`Staking richiesto per NFT ID: ${nftId}`);
                            // Mostra modale di staking
                            const selectedNft = nfts.find(nft => nft.id === nftId);
                            if (selectedNft && typeof window.openStakingModal === 'function') {
                              window.openStakingModal(selectedNft);
                            }
                          });
                        });
                      }
                    })
                    .catch(error => {
                      console.error("❌ Errore nel caricamento degli NFT con ethers.js:", error);
                      container.innerHTML = `
                        <div class="empty-state error-state">
                          <i class="ri-error-warning-line"></i>
                          <h3>Error Loading NFTs</h3>
                          <p>There was an error reading your NFTs directly from the blockchain. Please make sure you're connected to the Ethereum network.</p>
                          <p class="text-small text-muted">${error.message || 'Unknown error'}</p>
                          <button id="fallbackToApiBtn" class="btn primary-btn mt-3">
                            <i class="ri-server-line"></i> Try Server Method
                          </button>
                        </div>
                      `;
                      
                      // Aggiungi listener al pulsante di fallback
                      const fallbackBtn = document.getElementById('fallbackToApiBtn');
                      if (fallbackBtn) {
                        fallbackBtn.addEventListener('click', () => {
                          console.log("Tentativo con metodo server (fallback)...");
                          loadNftsViaAPI(address);
                        });
                      }
                    });
                } else {
                  console.error("NFT container not found!");
                }
              } catch (err) {
                console.error("Errore nell'inizializzazione del caricamento NFT:", err);
                loadNftsViaAPI(address);
              }
            } else {
              console.log("⚠️ loadAllIASENFTs non disponibile, utilizzo fallback API...");
              loadNftsViaAPI(address);
            }
            
            // Funzione di fallback che usa l'API
            function loadNftsViaAPI(walletAddress) {
              console.log("Caricamento NFT via API (metodo fallback)");
              fetch(`/api/staking/get-available-nfts?wallet=${walletAddress}&contract=${IASE_NFT_CONTRACT}`)
                .then(response => response.json())
                .then(data => {
                  console.log("NFTs caricati via API:", data);
                  
                  // Visualizza gli NFT
                  const nfts = data.nfts || data.available || [];
                  const container = document.getElementById('availableNftsContainer');
                  
                  if (container) {
                    // Svuota container
                    container.innerHTML = '';
                    
                    if (nfts.length === 0) {
                      container.innerHTML = `
                        <div class="empty-state">
                          <i class="ri-search-line"></i>
                          <h3>No NFTs Available</h3>
                          <p>Connect your wallet to see your IASE Units available for staking.</p>
                        </div>
                      `;
                    } else {
                      // Mostra gli NFT
                      nfts.forEach(nft => {
                        const card = document.createElement('div');
                        card.className = 'nft-card';
                        card.innerHTML = `
                          <img src="${nft.image}" alt="${nft.name}" class="nft-image" onerror="this.src='images/nft-placeholder.jpg'">
                          <div class="nft-details">
                            <h3 class="nft-title">${nft.name}</h3>
                            <p class="nft-id">ID: ${nft.id}</p>
                            <span class="rarity-badge ${(nft.rarity || 'standard').toLowerCase()}">${nft.rarity || 'Standard'}</span>
                            <div class="nft-card-actions mt-3">
                              <button class="btn primary-btn stake-nft-btn" data-nft-id="${nft.id}">
                                <i class="ri-lock-line"></i> Stake
                              </button>
                            </div>
                          </div>
                        `;
                        container.appendChild(card);
                      });
                      
                      // Aggiungi event listener ai pulsanti di staking
                      document.querySelectorAll('.stake-nft-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                          const nftId = e.currentTarget.getAttribute('data-nft-id');
                          console.log(`Staking richiesto per NFT ID: ${nftId}`);
                          // TODO: Implementare azione di staking
                        });
                      });
                    }
                  } else {
                    console.error("NFT container not found!");
                  }
                })
                .catch(err => console.error("Error loading NFTs via API:", err));
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