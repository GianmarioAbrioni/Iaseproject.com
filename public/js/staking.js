/**
 * IASE Staking Platform
 * Gestisce la UI e le funzionalità di staking degli NFT IASE Units
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log("🚀 IASE Staking Platform initialized");
  
  // Stato dell'applicazione
  window.stakedNfts = [];
  window.availableNfts = [];
  
  // Elementi UI - dichiarazione globale per accessibilità da altre funzioni
  window.authSection = document.getElementById('authSection');
  window.stakingDashboard = document.getElementById('stakingDashboard');
  window.loginForm = document.getElementById('loginForm');
  window.registerForm = document.getElementById('registerForm');
  window.authTabs = document.querySelectorAll('.auth-tab-btn');
  window.dashboardTabs = document.querySelectorAll('.tab-btn');
  window.tabContents = document.querySelectorAll('.tab-content');
  window.stakedNftGrid = document.getElementById('stakedNftGrid');
  window.availableNftGrid = document.getElementById('availableNftGrid');
  window.rewardsHistoryTable = document.getElementById('rewardsHistoryBody');
  window.emptyRewardsState = document.getElementById('rewardsEmptyState');
  window.claimAllBtn = document.getElementById('claimAllBtn');
  window.totalStakedNfts = document.getElementById('totalStakedNfts');
  window.totalRewards = document.getElementById('totalRewards');
  window.dailyRewards = document.getElementById('dailyRewards');
  window.pendingRewards = document.getElementById('pendingRewards');
  
  // Modali per azioni di staking
  window.stakingModal = document.getElementById('stakingModal');
  window.unstakingModal = document.getElementById('unstakingModal');
  window.confirmStakeBtn = document.getElementById('confirmStakeBtn');
  window.confirmUnstakeBtn = document.getElementById('confirmUnstakeBtn');
  window.claimAndUnstakeBtn = document.getElementById('claimAndUnstakeBtn');
  window.closeModalBtns = document.querySelectorAll('.close-modal, .close-modal-btn');
  
  // Correggi gli IDs per riferimenti corretti agli elementi HTML
  if (!window.stakedNftGrid && document.getElementById('stakedNftsContainer')) {
    console.log("Found stakedNftsContainer, using as reference");
    window.stakedNftGrid = document.getElementById('stakedNftsContainer');
  }
  
  if (!window.availableNftGrid && document.getElementById('availableNftsContainer')) {
    console.log("Found availableNftsContainer, using as reference");
    window.availableNftGrid = document.getElementById('availableNftsContainer');
  }
  
  if (!window.emptyRewardsState && document.getElementById('rewardsEmptyState')) {
    window.emptyRewardsState = document.getElementById('rewardsEmptyState');
  }
  
  // Logging di diagnostica degli elementi trovati
  console.log("📊 UI References:");
  console.log("- Staking Dashboard:", window.stakingDashboard ? "Found" : "Not found");
  console.log("- Available NFTs Container:", window.availableNftGrid ? "Found" : "Not found");
  console.log("- Staked NFTs Container:", window.stakedNftGrid ? "Found" : "Not found");
  
  // Esporta funzioni importanti per accessibilità globale
  window.loadAvailableNfts = loadAvailableNfts;
  window.renderAvailableNfts = renderAvailableNfts;
  window.openStakingModal = openStakingModal; // Aggiungiamo questa funzione per la nuova integrazione
  
  // Cleanup di dichiarazioni duplicate
  let currentUser = null;
  let selectedNft = null;
  let selectedStake = null;
  
  // Controlla se l'utente è già autenticato
  checkAuthStatus();
  
  // Event Listeners
  
  // Tab Navigation
  authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      
      // Rimuovi active da tutti i tab
      authTabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.auth-form-container').forEach(form => form.classList.remove('active'));
      
      // Attiva il tab selezionato
      tab.classList.add('active');
      document.getElementById(`${tabName}Tab`).classList.add('active');
    });
  });
  
  dashboardTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      
      // Rimuovi active da tutti i tab
      dashboardTabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Attiva il tab selezionato
      tab.classList.add('active');
      document.getElementById(`${tabName}Tab`).classList.add('active');
      
      // Aggiorna i dati se necessario
      if (tabName === 'available') {
        loadAvailableNfts();
      } else if (tabName === 'staked') {
        loadStakedNfts();
      } else if (tabName === 'rewards') {
        loadRewardsHistory();
      }
    });
  });
  
  // Form Submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
      showNotification('info', 'Accesso in corso...', 'Attendere...');
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore durante il login');
      }
      
      currentUser = await response.json();
      showNotification('success', 'Accesso effettuato', 'Benvenuto nella piattaforma di staking!');
      
      // Nascondi sezione auth e mostra dashboard
      authSection.classList.add('hidden');
      stakingDashboard.classList.remove('hidden');
      
      // Carica i dati
      initializeStakingDashboard();
      
    } catch (error) {
      console.error('Login error:', error);
      showNotification('error', 'Errore di accesso', error.message);
    }
  });
  
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validazione
    if (password !== confirmPassword) {
      showNotification('error', 'Errore registrazione', 'Le password non corrispondono');
      return;
    }
    
    try {
      showNotification('info', 'Registrazione in corso...', 'Attendere...');
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore durante la registrazione');
      }
      
      currentUser = await response.json();
      showNotification('success', 'Registrazione completata', 'Account creato con successo!');
      
      // Nascondi sezione auth e mostra dashboard
      authSection.classList.add('hidden');
      stakingDashboard.classList.remove('hidden');
      
      // Carica i dati
      initializeStakingDashboard();
      
    } catch (error) {
      console.error('Registration error:', error);
      showNotification('error', 'Errore registrazione', error.message);
    }
  });
  
  // Modal Controls
  closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      stakingModal.style.display = 'none';
      unstakingModal.style.display = 'none';
    });
  });
  
  window.addEventListener('click', (e) => {
    if (e.target === stakingModal) stakingModal.style.display = 'none';
    if (e.target === unstakingModal) unstakingModal.style.display = 'none';
  });
  
  // Staking Actions
  confirmStakeBtn.addEventListener('click', async () => {
    if (!selectedNft) return;
    
    try {
      showNotification('info', 'Staking in corso...', 'Attendere...');
      
      const response = await fetch('/api/staking/stake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nftId: selectedNft.id })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore durante lo staking');
      }
      
      const result = await response.json();
      stakingModal.style.display = 'none';
      showNotification('success', 'Staking completato', `NFT #${selectedNft.id} messo in staking con successo!`);
      
      // Aggiorna le liste
      loadStakedNfts();
      loadAvailableNfts();
      updateDashboardSummary();
      
    } catch (error) {
      console.error('Staking error:', error);
      showNotification('error', 'Errore staking', error.message);
    }
  });
  
  confirmUnstakeBtn.addEventListener('click', async () => {
    if (!selectedStake) return;
    
    try {
      showNotification('info', 'Rimozione staking in corso...', 'Attendere...');
      
      const response = await fetch('/api/staking/unstake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stakeId: selectedStake.id })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error removing NFT from staking');
      }
      
      const result = await response.json();
      unstakingModal.style.display = 'none';
      showNotification('success', 'Staking Ended', `NFT #${selectedStake.nftId} has been unstaked`);
      
      // Aggiorna le liste
      loadStakedNfts();
      loadAvailableNfts();
      updateDashboardSummary();
      
    } catch (error) {
      console.error('Unstaking error:', error);
      showNotification('error', 'Unstaking Error', error.message);
    }
  });
  
  // Add event listener only if element exists
  if (claimAndUnstakeBtn) {
    claimAndUnstakeBtn.addEventListener('click', async () => {
      if (!selectedStake) return;
      
      try {
        // Prima riscuoti le ricompense
        showNotification('info', 'Riscossione ricompense in corso...', 'Attendere...');
        
        let response = await fetch('/api/staking/claim-rewards', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ stakeId: selectedStake.id })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Errore durante la riscossione delle ricompense');
        }
        
        const claimResult = await response.json();
        
        // Poi rimuovi lo staking
        showNotification('info', 'Rimozione staking in corso...', 'Attendere...');
        
        response = await fetch('/api/staking/unstake', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ stakeId: selectedStake.id })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Errore durante la rimozione dello staking');
        }
        
        const unstakeResult = await response.json();
        unstakingModal.style.display = 'none';
        
        showNotification('success', 'Operazione completata', 
          `Ricompensa di ${claimResult.reward.amount.toFixed(2)} IASE riscossa e NFT #${selectedStake.nftId} rimosso dallo staking`);
        
        // Aggiorna le liste
        loadStakedNfts();
        loadAvailableNfts();
        loadRewardsHistory();
        updateDashboardSummary();
        
      } catch (error) {
        console.error('Claim and unstake error:', error);
        showNotification('error', 'Errore operazione', error.message);
      }
    });
  }
  
  claimAllBtn.addEventListener('click', async () => {
    if (stakedNfts.length === 0) {
      showNotification('warning', 'Nessun NFT in staking', 'Non hai NFT in staking per riscuotere ricompense');
      return;
    }
    
    try {
      showNotification('info', 'Riscossione di tutte le ricompense...', 'Attendere...');
      
      // Processa ogni stake separatamente
      for (const stake of stakedNfts) {
        // Prima otteniamo l'importo riscuotibile
        const response = await fetch('/api/staking/get-claimable-amount', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ stakeId: stake.id })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error(`Errore nel recupero dell'importo per stake #${stake.id}:`, errorData);
          continue; // Passa al prossimo stake
        }
        
        const { claimableAmount } = await response.json();
        
        if (claimableAmount <= 0) {
          console.log(`Nessuna ricompensa da riscuotere per stake #${stake.id}`);
          continue; // Passa al prossimo stake
        }
        
        // Utilizza il servizio di claim
        const claimResult = await window.claimIASEReward(stake.id, claimableAmount);
        
        if (!claimResult.success) {
          console.error(`Errore nel claim per stake #${stake.id}:`, claimResult.error);
          showNotification('error', 'Errore riscossione', 
            `Errore durante la riscossione per NFT #${stake.nftId}: ${claimResult.error}`);
        } else {
          console.log(`Claim completato per stake #${stake.id}, tx: ${claimResult.transaction}`);
        }
      }
      
      showNotification('success', 'Ricompense riscosse', 'Le ricompense disponibili sono state riscosse con successo!');
      
      // Aggiorna i dati
      loadRewardsHistory();
      loadStakedNfts();
      updateDashboardSummary();
      
    } catch (error) {
      console.error('Claim all rewards error:', error);
      showNotification('error', 'Errore riscossione', error.message);
    }
  });
  
  // Gestione eventi wallet - ascolto sia i nuovi che i vecchi eventi
  document.addEventListener('wallet:connected', handleWalletConnected);
  document.addEventListener('wallet:disconnected', handleWalletDisconnected);
  document.addEventListener('wallet:networkChanged', handleNetworkChanged);
  
  // Compatibilità con eventi vecchio formato
  document.addEventListener('walletConnected', handleWalletConnected);
  document.addEventListener('walletDisconnected', handleWalletDisconnected);
  
  // Verifica iniziale dello stato wallet
  checkWalletStatus();
  
  // NOTA: La verifica periodica è ora gestita da staking-wallet-connector.js
  
  /**
   * Verifica lo stato attuale del wallet
   */
  function checkWalletStatus() {
    const isWalletConnected = window.ethereum && window.ethereum.selectedAddress;
    const isUiShowing = !stakingDashboard.classList.contains('hidden');
    
    if (isWalletConnected && !isUiShowing) {
      // Wallet connesso ma UI non aggiornata
      console.log('Wallet connesso ma UI non aggiornata, correggendo stato...');
      handleWalletConnected({
        detail: {
          address: window.ethereum.selectedAddress,
          network: window.ethereum.chainId
        }
      });
    } else if (!isWalletConnected && isUiShowing) {
      // Wallet disconnesso ma UI mostra connesso
      console.log('Wallet disconnesso ma UI mostra connesso, correggendo stato...');
      handleWalletDisconnected();
    }
  }
  
  /**
   * Gestisce evento connessione wallet
   */
  function handleWalletConnected(event) {
    const address = event.detail?.address || window.ethereum?.selectedAddress;
    if (!address) return;
    
    console.log('Evento connessione wallet rilevato, indirizzo:', address);
    
    // Mostra dashboard di staking
    if (stakingDashboard) {
      stakingDashboard.classList.remove('hidden');
    }
    
    // Imposta indirizzo wallet nella dashboard
    const dashboardWalletAddress = document.getElementById('dashboardWalletAddress');
    if (dashboardWalletAddress) {
      const shortAddress = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
      dashboardWalletAddress.textContent = shortAddress;
    }
    
    // Aggiorna stato wallet nel wallet-connection-section
    const walletStatusText = document.getElementById('walletStatusText');
    const walletAddress = document.getElementById('walletAddress');
    const connectWalletBtn = document.getElementById('connectButtonETH');
    const disconnectWalletBtn = document.getElementById('disconnectWalletBtn');
    
    if (walletStatusText) walletStatusText.textContent = 'Wallet connected';
    if (walletStatusText) walletStatusText.classList.add('connected');
    if (walletAddress) walletAddress.textContent = address.substring(0, 6) + '...' + address.substring(address.length - 4);
    if (connectWalletBtn) connectWalletBtn.classList.add('hidden');
    if (disconnectWalletBtn) disconnectWalletBtn.classList.remove('hidden');
    
    // Carica gli NFT disponibili
    console.log('Loading NFTs after wallet connection');
    loadAvailableNfts();
  }
  
  /**
   * Gestisce evento disconnessione wallet
   */
  function handleWalletDisconnected() {
    console.log('Evento disconnessione wallet rilevato');
    
    // Nascondi dashboard di staking
    if (stakingDashboard) {
      stakingDashboard.classList.add('hidden');
    }
    
    // Aggiorna stato wallet nel wallet-connection-section
    const walletStatusText = document.getElementById('walletStatusText');
    const walletAddress = document.getElementById('walletAddress');
    const connectWalletBtn = document.getElementById('connectWalletBtn');
    const disconnectWalletBtn = document.getElementById('disconnectWalletBtn');
    
    if (walletStatusText) walletStatusText.textContent = 'Wallet not connected';
    if (walletStatusText) walletStatusText.classList.remove('connected');
    if (walletAddress) walletAddress.textContent = '';
    if (connectWalletBtn) connectWalletBtn.classList.remove('hidden');
    if (disconnectWalletBtn) disconnectWalletBtn.classList.add('hidden');
  }
  
  /**
   * Gestisce evento cambio rete
   */
  function handleNetworkChanged(event) {
    const network = event.detail?.network || window.ethereum?.chainId;
    console.log('Evento cambio rete rilevato:', network);
    
    // Verifica se è la rete corretta per lo staking (Ethereum)
    const isCorrectNetwork = network === '0x1';
    
    // Mostra/nascondi avviso rete sbagliata
    const wrongNetworkAlert = document.getElementById('wrong-network-alert');
    if (wrongNetworkAlert) {
      wrongNetworkAlert.classList.toggle('hidden', isCorrectNetwork);
    }
  }
  
  // FAQ accordions - Rimosso perché gestito dal script inline in staking.html
  
  // Funzioni
  
  async function checkAuthStatus() {
    try {
      const response = await fetch('/api/user');
      
      if (response.ok) {
        currentUser = await response.json();
        
        // Se l'utente è autenticato, inizializza la dashboard
        authSection.classList.add('hidden');
        stakingDashboard.classList.remove('hidden');
        initializeStakingDashboard();
        
        // Se il wallet è già connesso, verifica che sia lo stesso associato all'account
        if (window.userWalletAddress) {
          if (currentUser.walletAddress && currentUser.walletAddress !== window.userWalletAddress) {
            // Wallet diverso, mostra avviso
            showNotification('warning', 'Wallet diverso', 'Il wallet connesso è diverso da quello associato al tuo account.');
          }
        }
      } else {
        // Utente non autenticato, mostra sezione auth se il wallet è connesso
        if (window.userWalletAddress) {
          authSection.classList.remove('hidden');
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    }
  }
  
  async function linkWalletToAccount(walletAddress) {
    try {
      const response = await fetch('/api/staking/connect-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ walletAddress })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error connecting wallet');
      }
      
      const result = await response.json();
      currentUser = result.user;
      
      showNotification('success', 'Wallet Connected', 'Your wallet has been successfully linked to your account.');
      
      // Inizializza dashboard
      initializeStakingDashboard();
      
    } catch (error) {
      console.error('Link wallet error:', error);
      showNotification('error', 'Wallet Link Error', error.message);
    }
  }
  
  function initializeStakingDashboard() {
    // Carica i dati iniziali
    loadStakedNfts();
    loadAvailableNfts();
    loadRewardsHistory();
    updateDashboardSummary();
  }
  
  async function loadStakedNfts() {
    try {
      // Ottieni l'indirizzo wallet connesso
      const walletAddress = window.WALLET_STATE?.address || 
                           window.ethereum?.selectedAddress ||
                           window.userWalletAddress;
      
      if (!walletAddress) {
        console.log("No wallet connected, cannot load staked NFTs");
        return;
      }
      
      // Clean the wallet address (remove ellipsis if present)
      // Verifica che walletAddress sia una stringa prima di usare includes
      const cleanWalletAddress = (typeof walletAddress === 'string' && walletAddress.includes('...')) 
          ? walletAddress.replace(/\.\.\./g, '') 
          : walletAddress;
      
      console.log("Fetching staked NFTs for wallet:", cleanWalletAddress);
      const response = await fetch(`/api/staking/get-staked-nfts?wallet=${cleanWalletAddress}`);
      
      if (!response.ok) {
        throw new Error('Error retrieving staked NFTs');
      }
      
      const data = await response.json();
      console.log("Staked NFTs data received:", data);
      stakedNfts = data.stakes || [];
      
      renderStakedNfts();
      
      // Aggiorna anche il sommario della dashboard
      updateDashboardSummary();
      
    } catch (error) {
      console.error('Load staked NFTs error:', error);
      showNotification('error', 'Loading Error', 'Unable to load staked NFTs');
    }
  }
  
  /**
   * Load available NFTs for the connected wallet address
   * @param {string} contractAddress - Optional NFT contract address to filter by
   * @param {string} walletAddressOverride - Optional wallet address override
   */
  async function loadAvailableNfts(contractAddress = null, walletAddressOverride = null) {
    try {
      // Get connected wallet address
      const walletAddress = walletAddressOverride || 
                           window.WALLET_STATE?.address || 
                           window.ethereum?.selectedAddress ||
                           window.userWalletAddress;
      
      if (!walletAddress) {
        console.log("No wallet connected, cannot load NFTs");
        return;
      }
      
      // Clean the wallet address (remove ellipsis if present)
      // Verifica che walletAddress sia una stringa prima di usare includes
      const cleanWalletAddress = (typeof walletAddress === 'string' && walletAddress.includes('...')) 
          ? walletAddress.replace(/\.\.\./g, '') 
          : walletAddress;
      
      console.log("🔍 Fetching available NFTs for wallet:", cleanWalletAddress);
      
      // Show staking dashboard in advance to improve perceived loading time
      if (window.stakingDashboard) {
        console.log("Showing staking dashboard early for better UX");
        window.stakingDashboard.classList.remove('hidden');
      }
      
      // Get or create the NFT container
      if (!window.availableNftGrid) {
        window.availableNftGrid = document.getElementById('availableNftsContainer');
      }
      
      // Show loading indicator in the NFT container
      if (window.availableNftGrid) {
        window.availableNftGrid.innerHTML = `
          <div class="loading-container">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2">Loading NFTs...</p>
          </div>
        `;
      } else {
        console.error("Cannot find availableNftsContainer for loading indicator");
      }
      
      // Add contract address to query if provided
      let apiUrl = `/api/staking/get-available-nfts?wallet=${cleanWalletAddress}`;
      if (contractAddress) {
        apiUrl += `&contract=${contractAddress}`;
        console.log("Using specific contract address:", contractAddress);
      }
      
      console.log("📡 API request URL:", apiUrl);
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Error retrieving NFTs: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("📦 NFTs data received:", data);
      
      // Log completo della risposta per debugging
      console.log("📝 Full API response:", JSON.stringify(data));
      
      // Verifica il wallet tornato dalla risposta come conferma
      if (data.wallet) {
        console.log(`✅ API confirms request for wallet: ${data.wallet}`);
      }
      
      // Log dettagliato per il debugging
      if (data.nfts && data.nfts.length > 0) {
        console.log("✅ NFTs trovati nella proprietà 'nfts':", data.nfts.length);
        data.nfts.forEach(nft => console.log(`NFT trovato: ID #${nft.id}, Nome: ${nft.name}, Rarità: ${nft.rarity}`));
      } else if (data.available && data.available.length > 0) {
        console.log("✅ NFTs trovati nella proprietà 'available':", data.available.length);
        data.available.forEach(nft => console.log(`NFT trovato: ID #${nft.id}, Nome: ${nft.name}, Rarità: ${nft.rarity}`));
      } else {
        console.log("⚠️ Nessun NFT trovato nella risposta");
      }
      
      // Supporta sia "nfts" che "available" nella risposta per retrocompatibilità
      window.availableNfts = data.nfts || data.available || [];
      
      // Log finale del numero di NFT caricati
      console.log(`📊 Totale NFT caricati: ${window.availableNfts.length}`);
      
      // Render available NFTs
      renderAvailableNfts();
      
      // Show NFT section (hidden by default)
      const nftSection = document.getElementById('nftSection');
      if (nftSection) {
        nftSection.classList.remove('hidden');
      }
      
      // Also load staked NFTs and update dashboard summary
      loadStakedNfts();
      updateDashboardSummary();
      
      // Mostra notifica di successo solo se abbiamo trovato NFT
      if (availableNfts.length > 0) {
        showNotification('success', 'NFTs Loaded', `Found ${availableNfts.length} NFTs available for staking`);
      }
      
    } catch (error) {
      console.error('⚠️ Load available NFTs error:', error);
      showNotification('error', 'Loading Error', `Unable to load available NFTs: ${error.message}`);
      
      // Ensure dashboard is still shown even if there's an error
      const stakingDashboard = document.getElementById('stakingDashboard');
      if (stakingDashboard) {
        stakingDashboard.classList.remove('hidden');
      }
      
      // Show empty state in NFT container
      const availableNftGrid = document.getElementById('availableNftsContainer');
      if (availableNftGrid) {
        availableNftGrid.innerHTML = `
          <div class="empty-state error">
            <i class="ri-error-warning-line"></i>
            <h3>NFT Loading Error</h3>
            <p>An error occurred while loading NFTs: ${error.message}</p>
            <button id="retryNftLoad" class="btn primary-btn mt-3">
              <i class="ri-refresh-line"></i> Retry
            </button>
          </div>
        `;
        
        // Add retry button listener
        const retryBtn = document.getElementById('retryNftLoad');
        if (retryBtn) {
          retryBtn.addEventListener('click', () => {
            loadAvailableNfts(contractAddress, walletAddress);
          });
        }
      }
    }
  }
  
  async function loadRewardsHistory() {
    try {
      // Ottieni lo storico delle ricompense
      let totalPendingRewards = 0;
      let rewardsHistory = [];
      
      // Per ogni NFT in staking, ottieni lo storico delle ricompense
      for (const stake of stakedNfts) {
        totalPendingRewards += stake.pendingReward || 0;
        
        if (stake.rewardsHistory) {
          rewardsHistory = [...rewardsHistory, ...stake.rewardsHistory.map(reward => ({
            ...reward,
            nftId: stake.nftId
          }))];
        }
      }
      
      // Aggiorna l'UI
      pendingRewards.textContent = `${totalPendingRewards.toFixed(2)} IASE`;
      
      // Ordina lo storico per data, dal più recente
      rewardsHistory.sort((a, b) => new Date(b.rewardTime) - new Date(a.rewardTime));
      
      renderRewardsHistory(rewardsHistory);
      
    } catch (error) {
      console.error('Load rewards history error:', error);
      showNotification('error', 'Errore caricamento', 'Impossibile caricare lo storico delle ricompense');
    }
  }
  
  function updateDashboardSummary() {
    // Numero di NFT in staking
    totalStakedNfts.textContent = stakedNfts.length;
    
    // Calcola le ricompense totali ricevute
    const totalRewardsEarned = stakedNfts.reduce((total, stake) => total + (stake.totalRewardsEarned || 0), 0);
    totalRewards.textContent = `${totalRewardsEarned.toFixed(2)} IASE`;
    
    // Calcola le ricompense giornaliere totali
    const dailyRewardsRate = stakedNfts.reduce((total, stake) => total + (stake.dailyRewardRate || 0), 0);
    dailyRewards.textContent = `${dailyRewardsRate.toFixed(2)} IASE`;
  }
  
  function renderStakedNfts() {
    // Pulisci il container
    stakedNftGrid.innerHTML = '';
    
    if (stakedNfts.length === 0) {
      stakedNftGrid.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-cubes"></i>
          <h3>Nessun NFT in staking</h3>
          <p>Collega il tuo wallet e metti in staking i tuoi IASE Units per guadagnare token IASE.</p>
        </div>
      `;
      return;
    }
    
    // Renderizza ogni NFT
    stakedNfts.forEach(stake => {
      // Determina l'immagine e i dettagli dell'NFT
      // In produzione, dovresti ottenere questi dati dal contratto o da un'API
      const nftImage = `img/nfts/iase-unit-${stake.nftId.slice(-3)}.jpg`;
      const nftTitle = `IASE Unit #${stake.nftId.slice(-4)}`;
      
      const card = document.createElement('div');
      card.className = 'nft-card';
      card.innerHTML = `
        <img src="${nftImage}" alt="${nftTitle}" class="nft-image" onerror="this.src='img/nft-placeholder.jpg'">
        <div class="nft-details">
          <h3 class="nft-title">${nftTitle}</h3>
          <p class="nft-id">ID: ${stake.nftId}</p>
          <div class="rarity-badge ${stake.rarityTier.toLowerCase()}">${stake.rarityTier}</div>
          <div class="nft-rewards">
            <div class="reward-rate">
              <span class="reward-label">Daily Reward:</span>
              <span class="reward-value">${stake.dailyRewardRate.toFixed(2)} IASE</span>
            </div>
            <div class="reward-rate">
              <span class="reward-label">Pending Reward:</span>
              <span class="reward-value">${stake.pendingReward ? stake.pendingReward.toFixed(2) : '0.00'} IASE</span>
            </div>
          </div>
          <div class="nft-card-actions">
            <button class="btn outline-btn stake-action-btn" data-action="claim" data-stake-id="${stake.id}">
              <i class="fas fa-hand-holding-usd"></i> Claim
            </button>
            <button class="btn secondary-btn stake-action-btn" data-action="unstake" data-stake-id="${stake.id}">
              <i class="fas fa-unlock"></i> Unstake
            </button>
          </div>
        </div>
      `;
      
      // Aggiungi event listeners
      const claimBtn = card.querySelector('[data-action="claim"]');
      const unstakeBtn = card.querySelector('[data-action="unstake"]');
      
      claimBtn.addEventListener('click', () => handleClaimRewards(stake));
      unstakeBtn.addEventListener('click', () => openUnstakeModal(stake));
      
      stakedNftGrid.appendChild(card);
    });
  }
  
  function renderAvailableNfts() {
    console.log("🖼️ Rendering NFTs:", window.availableNfts);
    
    // Pulisci il container
    if (!window.availableNftGrid) {
      console.log("NFT grid element reference not found, getting from DOM");
      window.availableNftGrid = document.getElementById('availableNftsContainer');
      if (!window.availableNftGrid) {
        console.error("⚠️ CRITICAL: NFT grid element not found in the DOM!");
        
        // Try to find where the container should be and create it if missing
        const nftSection = document.getElementById('availableTab') || document.getElementById('nftSection');
        if (nftSection) {
          console.log("Creating missing NFT container");
          window.availableNftGrid = document.createElement('div');
          window.availableNftGrid.id = 'availableNftsContainer';
          window.availableNftGrid.className = 'nft-grid';
          nftSection.appendChild(window.availableNftGrid);
        } else {
          console.error("Cannot render NFTs: Both NFT grid and section are missing");
          return;
        }
      }
    }
    
    // Mostra la dashboard quando si rendereizzano gli NFT
    if (window.stakingDashboard && window.stakingDashboard.classList.contains('hidden')) {
      console.log("Removing hidden class from staking dashboard");
      window.stakingDashboard.classList.remove('hidden');
    }
    
    // Attiva il tab corretto
    const availableTab = document.getElementById('availableTab');
    if (availableTab && !availableTab.classList.contains('active')) {
      console.log("Activating available NFTs tab");
      
      // Rimuovi active da tutti i tab
      document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
      
      // Attiva il tab degli NFT disponibili
      availableTab.classList.add('active');
    }
    
    // Clear container
    window.availableNftGrid.innerHTML = '';
    
    if (!window.availableNfts || window.availableNfts.length === 0) {
      console.log("No NFTs available to render");
      window.availableNftGrid.innerHTML = `
        <div class="empty-state">
          <i class="ri-search-line"></i>
          <h3>No Available NFTs</h3>
          <p>Connect your Ethereum wallet to see your IASE Units available for staking.</p>
          <button id="manualRefreshNfts" class="btn primary-btn mt-3">
            <i class="ri-refresh-line"></i> Refresh
          </button>
        </div>
      `;
      
      // Add refresh button listener
      const refreshBtn = document.getElementById('manualRefreshNfts');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
          const walletAddress = window.WALLET_STATE?.address || 
                               window.ethereum?.selectedAddress ||
                               window.userWalletAddress;
          if (walletAddress) {
            loadAvailableNfts(IASE_NFT_CONTRACT, walletAddress);
          } else {
            showNotification('warning', 'Wallet non connesso', 'Collega il tuo wallet Ethereum prima di aggiornare');
          }
        });
      }
      
      return;
    }
    
    console.log(`Rendering ${window.availableNfts.length} NFTs to container`);
    
    // Renderizza ogni NFT
    window.availableNfts.forEach(nft => {
      try {
        // Determina l'immagine e i dettagli dell'NFT
        const nftId = nft.id;
        const nftTitle = nft.name || `IASE Unit #${nftId}`;
        const nftImage = nft.image || 'images/nft-placeholder.jpg';
        const rarityClass = (nft.rarity || 'standard').toLowerCase();
        
        console.log(`Creating card for NFT #${nftId} (${nftTitle})`);
        
        const card = document.createElement('div');
        card.className = 'nft-card';
        card.innerHTML = `
          <div class="nft-image-container">
            <img src="${nftImage}" alt="${nftTitle}" class="nft-image" 
                 onerror="this.onerror=null; this.src='images/nft-placeholder.jpg';">
          </div>
          <div class="nft-details">
            <h3 class="nft-title">${nftTitle}</h3>
            <p class="nft-id">ID: ${nftId}</p>
            <span class="rarity-badge ${rarityClass}">${nft.rarity || 'Standard'}</span>
            <div class="nft-card-actions mt-3">
              <button class="btn primary-btn stake-action-btn" data-action="stake" data-nft-id="${nftId}">
                <i class="ri-lock-line"></i> Metti in Staking
              </button>
            </div>
          </div>
        `;
        
        // Aggiungi event listener per staking
        card.querySelector('[data-action="stake"]').addEventListener('click', () => {
          console.log(`Stake button clicked for NFT #${nftId}`);
          openStakeModal(nft);
        });
        
        window.availableNftGrid.appendChild(card);
      } catch (err) {
        console.error(`Error rendering NFT card:`, err, nft);
      }
    });
    
    console.log("✅ NFT rendering completed");
  }
  
  function renderRewardsHistory(rewards) {
    // Aggiorna la tabella dello storico ricompense
    rewardsHistoryTable.innerHTML = '';
    
    if (rewards.length === 0) {
      emptyRewardsState.style.display = 'block';
      return;
    }
    
    emptyRewardsState.style.display = 'none';
    
    // Inserisci le righe
    rewards.forEach(reward => {
      const formattedDate = new Date(reward.rewardTime).toLocaleString();
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${formattedDate}</td>
        <td>IASE Unit #${reward.nftId.slice(-4)}</td>
        <td>${reward.amount.toFixed(2)} IASE</td>
        <td><span class="rarity-badge standard">Claimed</span></td>
      `;
      rewardsHistoryTable.appendChild(row);
    });
  }
  
  async function handleClaimRewards(stake) {
    try {
      showNotification('info', 'Claiming rewards...', 'Please wait...');
      
      // Prima otteniamo l'importo riscuotibile
      const response = await fetch('/api/staking/get-claimable-amount', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stakeId: stake.id })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error verifying available rewards');
      }
      
      const { claimableAmount } = await response.json();
      
      if (claimableAmount <= 0) {
        showNotification('warning', 'No Rewards Available', 'There are no rewards to claim for this NFT');
        return;
      }
      
      // Utilizza il servizio di claim
      showNotification('info', 'Processing Transaction...', 'Please confirm the transaction in your wallet');
      const claimResult = await window.claimIASEReward(stake.id, claimableAmount);
      
      if (!claimResult.success) {
        throw new Error(claimResult.error || 'Error claiming rewards');
      }
      
      showNotification('success', 'Rewards Claimed', 
        `You have claimed ${claimableAmount.toFixed(2)} IASE tokens for your NFT!`);
      
      // Aggiungi link a transaction scanner
      console.log(`Transaction hash: ${claimResult.transaction}`);
      
      // Aggiorna i dati
      loadStakedNfts();
      loadRewardsHistory();
      updateDashboardSummary();
      
    } catch (error) {
      console.error('Claim rewards error:', error);
      showNotification('error', 'Errore riscossione', error.message);
    }
  }
  
  /**
   * Apre il modale di staking per un NFT selezionato
   * @param {Object|string} nft - L'oggetto NFT completo o l'ID dell'NFT
   */
  function openStakeModal(nft) {
    console.log(`🔒 Apertura modale di staking per NFT`, nft);
    
    // Determina se è stato passato un oggetto completo o solo un ID
    let nftId, nftImage, nftTitle, rarityTier;
    
    if (typeof nft === 'string') {
      // Se è stato passato solo l'ID
      nftId = nft;
      nftImage = `img/nfts/iase-unit-${nftId.slice(-3)}.jpg`;
      nftTitle = `IASE Unit #${nftId.slice(-4)}`;
      
      // Determina la rarità in base all'ID (solo per fallback)
      const nftIdHash = parseInt(nftId.replace(/\D/g, '').slice(-2) || '0');
      const rarityTiers = ["standard", "advanced", "elite", "prototype"];
      const rarityWeights = [70, 20, 8, 2];
      
      let cumulativeWeight = 0;
      rarityTier = "standard";
      
      for (let i = 0; i < rarityTiers.length; i++) {
        cumulativeWeight += rarityWeights[i];
        if (nftIdHash % 100 < cumulativeWeight) {
          rarityTier = rarityTiers[i];
          break;
        }
      }
    } else {
      // Se è stato passato un oggetto NFT completo
      nftId = nft.id || nft.tokenId;
      nftImage = nft.image || `img/nfts/iase-unit-${nftId.slice(-3)}.jpg`;
      nftTitle = nft.name || `IASE Unit #${nftId.slice(-4)}`;
      rarityTier = nft.rarity || 'standard';
    }
    
    // Calcola ricompense in base alla rarità
    const baseMonthlyReward = 1000;
    const baseDailyReward = baseMonthlyReward / 30;
    
    const rarityMultipliers = {
      'standard': 1.0,
      'advanced': 1.5,
      'elite': 2.0,
      'prototype': 2.5
    };
    
    const multiplier = rarityMultipliers[rarityTier.toLowerCase()] || 1;
    const dailyReward = baseDailyReward * multiplier;
    const monthlyReward = baseMonthlyReward * multiplier;
    
    // Popola la modale
    const modalNftImage = document.getElementById('modalNftImage');
    if (modalNftImage) {
      modalNftImage.src = nftImage;
      modalNftImage.onerror = function() {
        this.src = 'img/nft-placeholder.jpg';
      };
    }
    
    const modalNftTitle = document.getElementById('modalNftTitle');
    if (modalNftTitle) modalNftTitle.textContent = nftTitle;
    
    const modalNftId = document.getElementById('modalNftId');
    if (modalNftId) modalNftId.textContent = `ID: ${nftId}`;
    
    const modalNftRarity = document.getElementById('modalNftRarity');
    if (modalNftRarity) {
      modalNftRarity.textContent = rarityTier;
      modalNftRarity.className = `rarity-badge ${rarityTier.toLowerCase()}`;
    }
    
    const modalDailyReward = document.getElementById('modalDailyReward');
    if (modalDailyReward) modalDailyReward.textContent = `${dailyReward.toFixed(2)} IASE`;
    
    const modalMonthlyReward = document.getElementById('modalMonthlyReward');
    if (modalMonthlyReward) modalMonthlyReward.textContent = `${monthlyReward.toFixed(2)} IASE`;
    
    // Salva riferimento all'NFT selezionato con più metadati
    selectedNft = {
      id: nftId,
      title: nftTitle,
      name: nftTitle,
      image: nftImage,
      rarityTier: rarityTier,
      rarity: rarityTier,
      dailyReward: dailyReward
    };
    
    // Mostra la modale
    stakingModal.style.display = 'block';
  }
  
  function openUnstakeModal(stake) {
    // Costruisci un mock dell'NFT 
    // In produzione, dovresti ottenere questi dati dal contratto o da un'API
    const nftImage = `img/nfts/iase-unit-${stake.nftId.slice(-3)}.jpg`;
    const nftTitle = `IASE Unit #${stake.nftId.slice(-4)}`;
    
    // Popola la modale
    document.getElementById('unstakeModalNftImage').src = nftImage;
    document.getElementById('unstakeModalNftImage').onerror = function() {
      this.src = 'img/nft-placeholder.jpg';
    };
    document.getElementById('unstakeModalNftTitle').textContent = nftTitle;
    document.getElementById('unstakeModalNftId').textContent = `ID: ${stake.nftId}`;
    document.getElementById('unstakeModalPendingReward').textContent = `${stake.pendingReward ? stake.pendingReward.toFixed(2) : '0.00'} IASE`;
    
    // Disabilita il pulsante di riscossione se non ci sono ricompense e se l'elemento esiste
    if (claimAndUnstakeBtn) {
      if (!stake.pendingReward || stake.pendingReward <= 0) {
        claimAndUnstakeBtn.disabled = true;
        claimAndUnstakeBtn.classList.add('secondary-btn');
        claimAndUnstakeBtn.classList.remove('primary-btn');
      } else {
        claimAndUnstakeBtn.disabled = false;
        claimAndUnstakeBtn.classList.add('primary-btn');
        claimAndUnstakeBtn.classList.remove('secondary-btn');
      }
    }
    
    // Salva riferimento allo stake selezionato
    selectedStake = stake;
    
    // Mostra la modale
    unstakingModal.style.display = 'block';
  }
  
  // Utility per notifiche
  /**
   * Calcola il rate giornaliero di ricompensa in base alla rarità
   * @param {string} rarity - La rarità dell'NFT
   * @returns {number} - La ricompensa giornaliera
   */
  function getRewardRateForRarity(rarity) {
    const rarityLower = rarity.toLowerCase();
    const rewardRates = {
      'standard': 33.33,
      'advanced': 50,
      'elite': 66.67,
      'prototype': 83.33
    };
    
    return rewardRates[rarityLower] || 33.33; // Default a Standard se rarità non riconosciuta
  }
  
  function showNotification(type, title, message, duration = 5000) {
    const container = document.getElementById('notificationContainer');
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    let icon = '';
    switch (type) {
      case 'success':
        icon = '<i class="fas fa-check-circle notification-icon"></i>';
        break;
      case 'error':
        icon = '<i class="fas fa-times-circle notification-icon"></i>';
        break;
      case 'warning':
        icon = '<i class="fas fa-exclamation-triangle notification-icon"></i>';
        break;
      case 'info':
      default:
        icon = '<i class="fas fa-info-circle notification-icon"></i>';
    }
    
    notification.innerHTML = `
      ${icon}
      <div class="notification-content">
        <h4 class="notification-title">${title}</h4>
        <p class="notification-message">${message}</p>
      </div>
      <span class="notification-close">&times;</span>
    `;
    
    container.appendChild(notification);
    
    // Chiusura notifica
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      notification.style.animation = 'fade-out 0.3s forwards';
      setTimeout(() => {
        notification.remove();
      }, 300);
    });
    
    // Auto chiusura
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'fade-out 0.3s forwards';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }
    }, duration);
  }
});