/**
 * IASE Staking Simple Connector
 * Handles wallet connection specifically for staking page with Ethereum network
 */

// Eseguiamo il codice dopo che il DOM è completamente caricato
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
  let connectBtn = document.getElementById('connectButtonETH');
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
    // Controllo base - verifica se ethereum esiste
    if (!window.ethereum) return false;
    
    // Controllo 1: verifica selectedAddress
    const hasSelectedAddress = 
      window.ethereum.selectedAddress && 
      window.ethereum.selectedAddress.length > 0;
    
    // Controllo 2: verifica isConnected() se disponibile
    // Alcune versioni di MetaMask forniscono questa funzione
    const hasIsConnectedMethod = 
      typeof window.ethereum.isConnected === 'function' && 
      window.ethereum.isConnected();
    
    // Controllo 3: verifica _state interno di MetaMask se accessibile
    const checkInternalState = 
      typeof window.ethereum._state !== 'undefined' && 
      typeof window.ethereum._state.isConnected !== 'undefined' && 
      window.ethereum._state.isConnected;
    
    // Se almeno due controlli passano, consideriamo il wallet connesso
    // Questo rende il rilevamento più robusto
    const connectedChecks = [
      hasSelectedAddress, 
      hasIsConnectedMethod, 
      checkInternalState
    ].filter(Boolean).length;
    
    return connectedChecks > 0;
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
    // Diagnosi completa dello stato del wallet per debugging
    console.log("🔍 Diagnosi stato wallet:");
    console.log("- window.ethereum esiste:", !!window.ethereum);
    if (window.ethereum) {
      console.log("- selectedAddress:", window.ethereum.selectedAddress);
      console.log("- chainId:", window.ethereum.chainId);
      console.log("- isConnected():", typeof window.ethereum.isConnected === 'function' ? window.ethereum.isConnected() : 'non disponibile');
      console.log("- _state:", typeof window.ethereum._state !== 'undefined' ? window.ethereum._state : 'non disponibile');
    }
    
    // Verifica se il wallet è connesso usando la funzione migliorata
    const walletIsConnected = isWalletConnected();
    console.log("✓ Stato wallet secondo isWalletConnected():", walletIsConnected);
    
    if (walletIsConnected && window.ethereum && window.ethereum.selectedAddress) {
      // Wallet connesso - mostra l'interfaccia completa
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
      // Wallet disconnected - diagnosi aggiuntiva
      console.log("⚠️ Wallet disconnesso per i seguenti motivi:");
      if (!window.ethereum) {
        console.log("- window.ethereum non esiste");
      } else if (!window.ethereum.selectedAddress) {
        console.log("- selectedAddress è nullo o vuoto");
      } else if (window.ethereum.selectedAddress.length === 0) {
        console.log("- selectedAddress è vuoto");
      } else {
        console.log("- Altri controlli falliti nella funzione isWalletConnected()");
      }
      
      // Se ci sono elementi nella UI che mostrano lo stato, aggiornali
      const walletStatusElements = document.querySelectorAll('.wallet-status, .connection-indicator');
      walletStatusElements.forEach(el => {
        if (el.classList.contains('connected')) {
          el.classList.remove('connected');
          el.classList.add('disconnected');
        }
      });
      
      // Forza stato disconnesso nell'indicatore
      updateStatusIndicator(false);
      
      if (walletStatusText) walletStatusText.textContent = 'Wallet not connected';
      if (walletAddress) walletAddress.textContent = '';
      
      if (connectBtn) {
        connectBtn.classList.remove('hidden');
        // Reset dello stato del pulsante per assicurarsi che sia utilizzabile
        connectBtn.innerHTML = '<i class="ri-wallet-3-line"></i> Connect Wallet';
        connectBtn.disabled = false;
      }
      
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
  
  // Connect wallet function - COMPLETAMENTE RISCRITTA
  async function connectEthWallet() {
  console.log('🔄 Staking: Avvio connessione portafoglio ETH (versione 3.0.1)');
  
  // OTTIMIZZAZIONE CRITICA:
  // Identifichiamo e disabilitiamo subito il pulsante per evitare doppi clic
  const connectBtn = document.getElementById('connectButtonETH');
  if (connectBtn) {
    // Controlliamo se è già in stato di connessione (disabled)
    if (connectBtn.disabled) {
      console.log('⚠️ Connessione già in corso, ignoro clic');
      return; // BLOCCA IMMEDIATAMENTE L'ESECUZIONE
    }
    
    // Disabilita immediatamente il pulsante e mostra stato di connessione
    connectBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span> Connecting...';
    connectBtn.disabled = true;
  }
  
  // Verifica MetaMask
  if (!isMetaMaskInstalled()) {
    alert('MetaMask is not installed. Please install MetaMask to use this feature.');
    // Ripristina pulsante
    if (connectBtn) {
      connectBtn.disabled = false;
      connectBtn.innerHTML = '<i class="ri-wallet-3-line"></i> Connect Wallet';
    }
    return;
  }

  try {
    // Blocca qualsiasi nuova connessione se c'è già una connessione attiva
    if (isWalletConnected()) {
      console.log('⚠️ Wallet already connected, showing dashboard directly');
      
      // VISIBILITÀ UI: Poiché il wallet è già connesso, aggiorniamo subito tutta la UI
      
      // Nascondi pulsante connessione
      if (connectBtn) connectBtn.classList.add('hidden');
      
      // Mostra pulsante disconnessione
      if (disconnectBtn) disconnectBtn.classList.remove('hidden');
      
      // Mostra dashboard
      if (stakingDashboard) stakingDashboard.classList.remove('hidden');
      
      // Aggiorna UI
      updateUI();
      return;
    }
    
    // Mostra feedback visivo sulla dashboard
    // Prima rimuoviamo qualsiasi elemento di caricamento esistente
    const existingLoadingDiv = document.getElementById('dashboardLoading');
    if (existingLoadingDiv) {
      document.body.removeChild(existingLoadingDiv);
    }
    
    // Poi creiamo un nuovo elemento di caricamento
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'dashboardLoading';
    loadingDiv.className = 'dashboard-loading';
    loadingDiv.innerHTML = `
      <div class="loading-container">
        <div class="spinner-border text-light" role="status"></div>
        <p>Connecting to wallet...</p>
      </div>
    `;
    document.body.appendChild(loadingDiv);
    
    // MOSTRA SUBITO LA DASHBOARD (SEMI-VUOTA) anche prima della connessione
    // Questo è critico per evitare la sensazione di "nulla accade"
    if (stakingDashboard) {
      stakingDashboard.classList.remove('hidden');
    }
      
      // Request account access
      console.log('Requesting accounts...');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      console.log('✓ Wallet connected:', accounts[0]);
      
      // Nascondi subito l'elemento di caricamento
      const loadingEl = document.getElementById('dashboardLoading');
      if (loadingEl) {
        try {
          document.body.removeChild(loadingEl);
        } catch (err) {
          console.log("Loading element already removed or not found");
        }
      }
      
      // Mostra immediatamente la dashboard per evitare doppi clic
      if (stakingDashboard) stakingDashboard.classList.remove('hidden');
      
      // Nascondi pulsante connessione
      if (connectBtn) {
        connectBtn.classList.add('hidden');
        connectBtn.disabled = false;
        connectBtn.innerHTML = '<i class="ri-wallet-3-line"></i> Connect Wallet';
      }
      
      // Mostra pulsante disconnessione
      if (disconnectBtn) disconnectBtn.classList.remove('hidden');
      
      // ⚠️ IMPORTANTE: aggiorniamo UI PRIMA di check network per garantire reattività
      updateStatusIndicator(true);
      
      // Aggiorna base UI
      const address = accounts[0];
      const shortAddress = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
      
      // Aggiorna visualizzazione indirizzo
      const walletStatusText = document.getElementById('walletStatusText');
      const walletAddress = document.getElementById('walletAddress');
      const dashboardWalletAddress = document.getElementById('dashboardWalletAddress');
      
      if (walletStatusText) walletStatusText.textContent = 'Wallet connected';
      if (walletAddress) walletAddress.textContent = shortAddress;
      if (dashboardWalletAddress) dashboardWalletAddress.textContent = shortAddress;
      
      // Trigger loading degli NFT subito, senza attendere updateUI
      if (typeof loadAvailableNfts === 'function') {
        console.log("Loading NFTs via standard function...");
        loadAvailableNfts(IASE_NFT_CONTRACT, address);
      } else if (typeof window.loadAllIASENFTs === 'function') {
        console.log("Loading NFTs via direct ethers.js...");
        window.loadAllIASENFTs().catch(err => console.error("Error loading NFTs:", err));
      }
      
      // Check and switch network if needed (senza await, in background)
      checkAndSwitchNetwork().catch(err => console.error("Network switch error:", err));
      
      // Update UI (without await)
      updateUI();
      
      // Avvia il monitoraggio della connessione per rilevare disconnessioni manuali
      startConnectionWatcher();
      
    } catch (error) {
      console.error('❌ Error connecting wallet:', error);
      
      // Nascondi loading
      const loadingEl = document.getElementById('dashboardLoading');
      if (loadingEl) {
        try {
          document.body.removeChild(loadingEl);
        } catch (err) {
          console.log("Loading element already removed or not found during error handling");
        }
      }
      
      // Ripristina il pulsante se c'è stato un errore
      const connectBtn = document.getElementById('connectButtonETH');
      if (connectBtn) {
        connectBtn.innerHTML = '<i class="ri-wallet-3-line"></i> Connect Wallet';
        connectBtn.disabled = false;
      }
      
      // Nascondi dashboard in caso di errore
      if (stakingDashboard) stakingDashboard.classList.add('hidden');
      
      // Mostra messaggio d'errore
      alert('Connection rejected or error occurred.');
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
    
    // Prima memorizziamo lo stato corrente per il debug
    const currentState = {
      ethereum: !!window.ethereum,
      selectedAddress: window.ethereum ? window.ethereum.selectedAddress : null,
      chainId: window.ethereum ? window.ethereum.chainId : null,
      isConnected: window.ethereum && typeof window.ethereum.isConnected === 'function' ? window.ethereum.isConnected() : 'N/A'
    };
    
    console.log('📊 Stato wallet pre-disconnessione:', currentState);
    
    // Fermiamo il watcher prima di tutto per evitare interferenze
    stopConnectionWatcher();
    
    if (window.ethereum) {
      console.log('Esecuzione disconnessione wallet');
      
      // Prima tentiamo metodi specifici di disconnessione se disponibili
      let disconnectionAttempted = false;
      
      // Metodo 1: MetaMask provider - se esiste una funzione disconnect
      if (typeof window.ethereum.disconnect === 'function') {
        try {
          console.log('🔌 Tentativo disconnessione usando ethereum.disconnect()');
          window.ethereum.disconnect();
          disconnectionAttempted = true;
        } catch (e) {
          console.warn('Errore usando ethereum.disconnect():', e);
        }
      }
      
      // Metodo 2: WalletConnect - se esiste nel provider
      if (window.ethereum.isWalletConnect) {
        try {
          console.log('🔌 Tentativo disconnessione di WalletConnect');
          window.ethereum.disconnect();
          disconnectionAttempted = true;
        } catch (e) {
          console.warn('Errore disconnettendo WalletConnect:', e);
        }
      }
      
      // Metodo 3: Reset manuale dello stato interno
      try {
        console.log('🧹 Reset manuale dello stato interno del provider');
        
        // Reimpostiamo i flag interni per la UI
        if (typeof window.ethereum._state !== 'undefined') {
          window.ethereum._state.isConnected = false;
        }
        
        // Tentiamo di azzerare selectedAddress (anche se in teoria è read-only)
        try {
          if (window.ethereum.selectedAddress) {
            Object.defineProperty(window.ethereum, 'selectedAddress', { value: null });
          }
        } catch (propError) {
          console.warn('Non è stato possibile resettare selectedAddress:', propError);
        }
        
        disconnectionAttempted = true;
      } catch (stateError) {
        console.warn('Errore nel reset dello stato interno:', stateError);
      }
      
      // Metodo 4: reset del localStorage (vari wallet memorizzano dati qui)
      try {
        console.log('🗑️ Pulizia localStorage per wallet connessi');
        
        // WalletConnect
        localStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE');
        localStorage.removeItem('walletconnect');
        
        // MetaMask
        localStorage.removeItem('METAMASK_CONNECTINFO');
        localStorage.removeItem('METAMASK_CONNECT_INFO');
        localStorage.removeItem('metamask.providers');
        localStorage.removeItem('METAMASK_ACTIVE_CONNECTION');
        
        // Altri wallet/frameworks
        localStorage.removeItem('wagmi.connected');
        localStorage.removeItem('wagmi.wallet');
        localStorage.removeItem('coinbase-wallet');
        localStorage.removeItem('WALLET_CONNECTOR');
        
        console.log('✓ Rimossi dati di connessione dal localStorage');
        disconnectionAttempted = true;
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
      
      // Aggiorniamo immediatamente l'UI per feedback visivo
      updateUI();
      
      // Metodo 5: se tutto il resto fallisce, ricarichiamo la pagina
      if (disconnectionAttempted) {
        console.log('✅ Metodi di disconnessione tentati, ricaricamento pagina tra 1 secondo...');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        // Se non abbiamo potuto tentare alcun metodo, ricarichiamo subito
        console.log('⚠️ Nessun metodo di disconnessione disponibile, ricaricamento immediato');
        window.location.reload();
      }
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
      console.log('👋 User disconnected wallet tramite evento accountsChanged');
      
      // Reset manuale di alcune proprietà per evitare stati inconsistenti
      try {
        if (typeof window.ethereum._state !== 'undefined') {
          window.ethereum._state.isConnected = false;
        }
      } catch (e) {
        // Ignoriamo eventuali errori
      }
      
      // Ferma il monitoraggio quando MetaMask riporta disconnessione
      stopConnectionWatcher();
      
      // Rimuoviamo tutte le tracce di connessione dalla UI
      document.querySelectorAll('.wallet-status, .connection-indicator').forEach(el => {
        el.classList.remove('connected');
        el.classList.add('disconnected');
      });
      
      // Aggiorniamo l'interfaccia per mostrare lo stato disconnesso
      updateUI();
      
      // Log di debug per verificare lo stato
      console.debug('Stato dopo disconnessione:', {
        selectedAddress: window.ethereum ? window.ethereum.selectedAddress : 'ethereum non disponibile',
        isWalletConnected: isWalletConnected()
      });
    } else {
      console.log('✓ Account connesso o cambiato:', accounts[0]);
      
      // Se c'è un account attivo, aggiorniamo l'UI e avviamo/riavviamo il monitoraggio
      document.querySelectorAll('.wallet-status, .connection-indicator').forEach(el => {
        el.classList.remove('disconnected');
        el.classList.add('connected');
      });
      
      // Aggiorniamo l'UI completa
      updateUI();
      
      // Se l'utente si è connesso, iniziamo il monitoraggio
      // Questo gestirà automaticamente anche il caso di cambio di account
      startConnectionWatcher();
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
          
          // Start polling for connection status
          startConnectionWatcher();
        }
      })
      .catch(err => console.error('Error checking accounts:', err));
  }
  
  // Variabile globale per l'intervallo del watcher
  let connectionWatcherInterval = null;
  
  // Flag per evitare sovrapposizioni di richieste
  let isCheckingConnection = false;
  
  // Avvia il monitoraggio periodico della connessione
  function startConnectionWatcher() {
    // Prima fermiamo qualsiasi monitoraggio esistente
    stopConnectionWatcher();
    
    // Verifica che il wallet sia effettivamente connesso prima di avviare il monitoraggio
    if (!window.ethereum || !window.ethereum.selectedAddress) {
      console.log('⚠️ Wallet non connesso, monitoraggio non avviato');
      return;
    }
    
    // Conserviamo l'indirizzo del wallet connesso per riferimento futuro
    // Questo aiuterà a rilevare disconnessioni anche se selectedAddress diventa null
    const initialConnectedAddress = window.ethereum.selectedAddress;
    console.log(`📝 Avvio monitoraggio per l'indirizzo: ${initialConnectedAddress}`);
    
    // Controlla lo stato della connessione ogni 5 secondi (tempo più lungo per evitare problemi)
    // con un limite massimo di 12 verifiche (60 secondi totali)
    let checkCount = 0;
    const MAX_CHECKS = 12;
    
    // Verifica iniziale immediata
    checkConnectionStatus();
    
    // Intervallo per verifiche successive
    connectionWatcherInterval = setInterval(() => {
      if (checkCount >= MAX_CHECKS) {
        console.log('🛑 Raggiunto limite massimo di verifiche, watcher fermato');
        stopConnectionWatcher();
        return;
      }
      
      // Confronto con l'indirizzo iniziale per rilevare cambiamenti
      if (window.ethereum && window.ethereum.selectedAddress !== initialConnectedAddress) {
        console.log(`🔄 Cambio indirizzo rilevato: da ${initialConnectedAddress} a ${window.ethereum.selectedAddress || 'nessuno'}`);
        
        // Se il nuovo indirizzo è nullo o diverso, consideriamo una disconnessione
        if (!window.ethereum.selectedAddress) {
          console.log('👋 Disconnessione rilevata tramite cambio indirizzo');
          stopConnectionWatcher();
          updateUI();
          return;
        }
        
        // Se l'indirizzo è cambiato, fermiamo questo watcher e ne avviamo uno nuovo
        console.log('🔄 Avvio nuovo monitoraggio per il nuovo indirizzo');
        stopConnectionWatcher();
        startConnectionWatcher(); // Ricomincia con il nuovo indirizzo
        return;
      }
      
      checkCount++;
      console.log(`🔍 Verifica connessione ${checkCount}/${MAX_CHECKS}...`);
      checkConnectionStatus();
    }, 5000);
    
    console.log('🔍 Avviato monitoraggio connessione wallet (limite: 60 secondi)');
  }
  
  // Ferma il monitoraggio della connessione
  function stopConnectionWatcher() {
    if (connectionWatcherInterval) {
      clearInterval(connectionWatcherInterval);
      connectionWatcherInterval = null;
      console.log('🛑 Fermato monitoraggio connessione wallet');
    }
    
    // Reset del flag di controllo per sicurezza
    isCheckingConnection = false;
    
    // Log per debug
    console.log('🧹 Monitoraggio wallet terminato, stato attuale:', {
      watcher: connectionWatcherInterval === null ? 'inattivo' : 'attivo',
      connesso: isWalletConnected(),
      indirizzo: window.ethereum ? window.ethereum.selectedAddress || 'non impostato' : 'ethereum non disponibile'
    });
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
    
    // Combiniamo i metodi disponibili per una verifica più robusta:
    // 1. Chiamata asincrona a eth_accounts
    // 2. Controllo delle proprietà interne
    // 3. Verifica di isConnected e selectedAddress
    
    // Controllo proprietà isConnected di MetaMask
    const walletConnectedByFunction = isWalletConnected();
    
    window.ethereum.request({ method: 'eth_accounts' })
      .then(accounts => {
        // Il vero test è combinare i risultati:
        // Se non ci sono account ma il wallet risulta ancora connesso secondo le altre verifiche
        // OPPURE se c'è un mismatch tra i diversi check
        const hasAccounts = accounts && accounts.length > 0;
        
        if (!hasAccounts && walletConnectedByFunction) {
          // Wallet era considerato connesso secondo isWalletConnected, ma eth_accounts dice di no
          console.log('🔄 Rilevata disconnessione manuale del wallet');
          
          // Se necessario, forziamo il reset delle proprietà interne
          try {
            if (typeof window.ethereum._state !== 'undefined') {
              window.ethereum._state.isConnected = false;
            }
            
            if (window.ethereum.selectedAddress) {
              // In alcune implementazioni questa è una proprietà read-only, ma possiamo provare
              try {
                window.ethereum.selectedAddress = null;
              } catch (e) {
                // Ignoriamo se non possiamo modificare la proprietà
              }
            }
          } catch (stateError) {
            console.log('Non è stato possibile resettare lo stato interno:', stateError);
          }
          
          // Fermiamo il watcher immediatamente dopo aver rilevato una disconnessione
          stopConnectionWatcher();
          
          // Aggiorna l'UI per mostrare lo stato disconnesso
          document.querySelectorAll(".wallet-status").forEach(el => {
            el.classList.remove("connected");
            el.classList.add("disconnected");
          });
          
          // Aggiorniamo l'UI completamente
          updateUI();
        }
        
        // Reset del flag
        isCheckingConnection = false;
      })
      .catch(err => {
        console.error('❌ Errore nel controllo dello stato connessione:', err);
        // Reset del flag anche in caso di errore
        isCheckingConnection = false;
        // In caso di errore, fermiamo il watcher
        stopConnectionWatcher();
      });
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
  
  // Controlla se il wallet è in uno stato inconsistente all'inizio
  function checkInitialWalletState() {
    console.log('🔍 Verifica iniziale dello stato del wallet...');
    
    if (!window.ethereum) {
      console.log('⚠️ Provider Ethereum non disponibile, impossibile verificare lo stato del wallet');
      return;
    }
    
    // Primo controllo: verifica se esistono incoerenze nello stato wallet
    // (selectedAddress impostato ma isConnected() è false o nessun account in eth_accounts)
    const hasSelectedAddress = window.ethereum.selectedAddress && window.ethereum.selectedAddress.length > 0;
    const usingIsConnected = typeof window.ethereum.isConnected === 'function' ? window.ethereum.isConnected() : true;
    
    if (hasSelectedAddress && !usingIsConnected) {
      console.log('⚠️ Rilevato stato incoerente: selectedAddress presente ma isConnected() è false');
      // Pulisci lo stato o aggiorna isConnected
      try {
        if (typeof window.ethereum._state !== 'undefined') {
          window.ethereum._state.isConnected = true;
        }
      } catch (e) {
        console.warn('Non è stato possibile sistemare lo stato incoerente:', e);
      }
    }
    
    // Secondo controllo più preciso con eth_accounts
    window.ethereum.request({ method: 'eth_accounts' })
      .then(accounts => {
        const hasAccounts = accounts && accounts.length > 0;
        
        if (hasSelectedAddress && !hasAccounts) {
          console.log('⚠️ Rilevato stato incoerente: selectedAddress presente ma nessun account in eth_accounts');
          console.log('🔄 Reset dello stato per evitare problemi...');
          
          // Pulizia dello stato
          try {
            if (window.ethereum.selectedAddress) {
              try {
                Object.defineProperty(window.ethereum, 'selectedAddress', { value: null });
              } catch (e) {
                // Ignoriamo errori se la proprietà è read-only
              }
            }
            
            if (typeof window.ethereum._state !== 'undefined') {
              window.ethereum._state.isConnected = false;
            }
            
            // Reset localStorage rilevante
            localStorage.removeItem('METAMASK_CONNECTINFO');
            localStorage.removeItem('METAMASK_CONNECT_INFO');
            
            console.log('✅ Reset stato wallet completato');
          } catch (e) {
            console.warn('Non è stato possibile resettare lo stato del wallet:', e);
          }
        } else if (!hasSelectedAddress && hasAccounts) {
          console.log('⚠️ Rilevato stato incoerente: account in eth_accounts ma selectedAddress non presente');
          console.log('🔄 Aggiornamento selectedAddress...');
          
          // Tentiamo di correggere
          try {
            if (accounts[0]) {
              try {
                Object.defineProperty(window.ethereum, 'selectedAddress', { value: accounts[0] });
                console.log('✅ selectedAddress aggiornato a:', accounts[0]);
              } catch (e) {
                console.warn('Non è stato possibile impostare selectedAddress:', e);
              }
            }
          } catch (e) {
            console.warn('Errore durante l\'aggiornamento dello stato:', e);
          }
        } else {
          console.log('✅ Stato wallet coerente all\'inizializzazione');
        }
      })
      .catch(err => {
        console.error('❌ Errore nel controllo dello stato iniziale:', err);
      });
  }
  
  // Initialize everything
  function init() {
    console.log('🚀 Inizializzazione wallet connector...');
    addStatusIndicatorStyles();
    
    // Verifica preliminare dello stato per correggere problemi all'avvio
    checkInitialWalletState();
    
    // Setup standard
    setupMetamaskListeners();
    setupUIEvents();
    updateUI();
    
    console.log('✅ Wallet connector inizializzato');
  }
  
  // Run initialization
  init();
});
