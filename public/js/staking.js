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
  
  // Nascondi dashboard di staking all'inizio (prima della connessione wallet)
  if (window.stakingDashboard) {
    window.stakingDashboard.classList.add('hidden');
  }
  
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
  window.openStakingModal = openStakeModal; // Aggiungiamo questa funzione per la nuova integrazione
  
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
      
      // Nascondi sezione auth
      authSection.classList.add('hidden');
      
      // NON mostrare la dashboard qui - sarà mostrata solo dopo la connessione del wallet
      // La dashboard deve essere mostrata SOLO in handleWalletConnected
      
      // Verifica se il wallet è già connesso
      const isWalletConnected = window.ethereum && window.ethereum.selectedAddress;
      console.log('📱 Login completato. Wallet connesso?', isWalletConnected ? 'SI' : 'NO');
      
      if (isWalletConnected) {
        console.log('⚠️ Un wallet è già connesso, mostriamo la dashboard');
        // Trigger wallet connected event to show dashboard
        handleWalletConnected({
          detail: {
            address: window.ethereum.selectedAddress,
            network: window.ethereum.chainId
          }
        });
      } else {
        console.log('⚠️ Nessun wallet connesso, manteniamo dashboard nascosta');
        // Mostra messaggio di prompt per connettere wallet
        showNotification('info', 'Connetti il tuo wallet', 'Per accedere allo staking, connetti il tuo wallet Ethereum.');
      }
      
      // Inizializza comunque in background per precaricare dati necessari
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
      
      // Nascondi sezione auth
      authSection.classList.add('hidden');
      
      // NON mostrare la dashboard qui - sarà mostrata solo dopo la connessione del wallet
      // La dashboard deve essere mostrata SOLO in handleWalletConnected
      
      // Verifica se il wallet è già connesso
      const isWalletConnected = window.ethereum && window.ethereum.selectedAddress;
      console.log('📱 Registrazione completata. Wallet connesso?', isWalletConnected ? 'SI' : 'NO');
      
      if (isWalletConnected) {
        console.log('⚠️ Un wallet è già connesso, mostriamo la dashboard');
        // Trigger wallet connected event to show dashboard
        handleWalletConnected({
          detail: {
            address: window.ethereum.selectedAddress,
            network: window.ethereum.chainId
          }
        });
      } else {
        console.log('⚠️ Nessun wallet connesso, manteniamo dashboard nascosta');
        // Mostra messaggio di prompt per connettere wallet
        showNotification('info', 'Connetti il tuo wallet', 'Per accedere allo staking, connetti il tuo wallet Ethereum.');
      }
      
      // Inizializza comunque in background per precaricare dati necessari
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
    
    // Verifica della UI con riferimento globale sicuro
    let isUiShowing = false;
    
    if (window.stakingDashboard) {
      isUiShowing = !window.stakingDashboard.classList.contains('hidden');
      console.log('✅ Stato UI (riferimento window):', isUiShowing ? 'visibile' : 'nascosta');
    } else {
      const dashboardEl = document.getElementById('stakingDashboard');
      if (dashboardEl) {
        isUiShowing = !dashboardEl.classList.contains('hidden');
        console.log('✅ Stato UI (riferimento diretto):', isUiShowing ? 'visibile' : 'nascosta');
      } else {
        console.error('❌ Impossibile trovare la dashboard per verificare lo stato!');
      }
    }
    
    if (isWalletConnected && !isUiShowing) {
      // Wallet connesso ma UI non aggiornata
      console.log('🔄 Wallet connesso ma UI non aggiornata, correggendo stato...');
      handleWalletConnected({
        detail: {
          address: window.ethereum.selectedAddress,
          network: window.ethereum.chainId
        }
      });
    } else if (!isWalletConnected && isUiShowing) {
      // Wallet disconnesso ma UI mostra connesso
      console.log('🔄 Wallet disconnesso ma UI mostra connesso, correggendo stato...');
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
    
    // IMPORTANTE: Salva l'indirizzo completo in una variabile globale per le API
    window.userWalletAddress = address;
    console.log('Indirizzo wallet completo salvato per le API:', window.userWalletAddress);
    
    // Salva in localStorage per persistenza
    try {
      localStorage.setItem('lastWalletAddress', address);
      console.log('Indirizzo wallet salvato in localStorage');
    } catch (err) {
      console.error('Errore nel salvare indirizzo in localStorage:', err);
    }
    
    // Mostra dashboard di staking
    if (window.stakingDashboard) {
      console.log('✅ Mostro la dashboard di staking (riferimento window globale)');
      window.stakingDashboard.classList.remove('hidden');
    } else {
      console.error('❌ Riferimento globale stakingDashboard non trovato, tentativo diretto...');
      const dashboardEl = document.getElementById('stakingDashboard');
      if (dashboardEl) {
        console.log('✅ Dashboard trovata con getElementById, rendo visibile');
        dashboardEl.classList.remove('hidden');
      } else {
        console.error('❌❌ Dashboard non trovata in nessun modo!');
      }
    }
    
    // Imposta indirizzo wallet nella dashboard (solo per visualizzazione)
    const dashboardWalletAddress = document.getElementById('dashboardWalletAddress');
    if (dashboardWalletAddress) {
      const shortAddress = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
      dashboardWalletAddress.textContent = shortAddress;
      console.log('Indirizzo wallet abbreviato impostato nella UI:', shortAddress);
    }
    
    // Aggiorna stato wallet nel wallet-connection-section
    const walletStatusText = document.getElementById('walletStatusText');
    const walletAddress = document.getElementById('walletAddress');
    const connectWalletBtn = document.getElementById('connectButtonETH') || document.getElementById('connectWalletBtn');
    const disconnectWalletBtn = document.getElementById('disconnectWalletBtn');
    
    if (walletStatusText) walletStatusText.textContent = 'Wallet connected';
    if (walletStatusText) walletStatusText.classList.add('connected');
    if (walletAddress) walletAddress.textContent = address.substring(0, 6) + '...' + address.substring(address.length - 4);
    if (connectWalletBtn) connectWalletBtn.classList.add('hidden');
    if (disconnectWalletBtn) disconnectWalletBtn.classList.remove('hidden');
    
    // Carica gli NFT disponibili
    console.log('Loading NFTs after wallet connection');
    loadAvailableNfts(null, address);
  }
  
  /**
   * Gestisce evento disconnessione wallet
   */
  function handleWalletDisconnected() {
    console.log('Evento disconnessione wallet rilevato');
    
    // Nascondi dashboard di staking
    if (window.stakingDashboard) {
      console.log('✅ Nascondo la dashboard di staking (riferimento window globale)');
      window.stakingDashboard.classList.add('hidden');
    } else {
      console.error('❌ Riferimento globale stakingDashboard non trovato, tentativo diretto...');
      const dashboardEl = document.getElementById('stakingDashboard');
      if (dashboardEl) {
        console.log('✅ Dashboard trovata con getElementById, nascondo');
        dashboardEl.classList.add('hidden');
      }
    }
    
    // Aggiorna stato wallet nel wallet-connection-section
    const walletStatusText = document.getElementById('walletStatusText');
    const walletAddress = document.getElementById('walletAddress');
    const connectWalletBtn = document.getElementById('connectButtonETH');
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
      // Utilizza encodeURIComponent per evitare problemi con caratteri speciali nell'URL
      const apiUrl = `/api/staking/get-staked-nfts?wallet=${encodeURIComponent(cleanWalletAddress)}`;
      console.log("API URL per NFT in staking:", apiUrl);
      const response = await fetch(apiUrl);
      
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
   * Funzione per caricare dinamicamente la libreria ethers.js
   */
  function loadEthersLibrary() {
    return new Promise((resolve, reject) => {
      if (window.ethers) {
        console.log("✅ Libreria ethers già caricata");
        return resolve(window.ethers);
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.ethers.io/lib/ethers-5.7.2.umd.min.js';
      script.async = true;
      script.onload = () => {
        console.log("✅ Libreria ethers caricata con successo");
        resolve(window.ethers);
      };
      script.onerror = (err) => {
        console.error("❌ Errore nel caricamento della libreria ethers");
        reject(err);
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Load available NFTs for the connected wallet address
   * @param {string} contractAddress - Optional NFT contract address to filter by
   * @param {string} walletAddressOverride - Optional wallet address override
   */
  async function loadAvailableNfts(contractAddress = null, walletAddressOverride = null) {
  try {
    console.group("🔍🔍🔍 SUPER DEBUG: loadAvailableNfts");
    console.log("📣 DEBUG INFO: Iniziando caricamento NFT disponibili");
    console.log("📡 WALLET_STATE:", window.WALLET_STATE);
    console.log("📡 ethereum:", window.ethereum);
    console.log("📡 ethereum.selectedAddress:", window.ethereum?.selectedAddress);
    console.log("📡 userWalletAddress:", window.userWalletAddress);
    console.log("📡 walletAddressOverride:", walletAddressOverride);
    console.log("📡 contractAddress:", contractAddress);
    
    // Imposta contratto predefinito se non specificato - Compatibilità Render/Live
    if (!contractAddress) {
      contractAddress = window.IASE_NFT_CONTRACT || "0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F";
      console.log(`🔄 SUPER DEBUG: Usando contratto predefinito: ${contractAddress}`);
    }
    
    // Verifica se esiste la libreria ethers
    if (!window.ethers) {
      console.log("⚠️ Libreria ethers non trovata, tentativo di caricamento dinamico...");
      try {
        await loadEthersLibrary();
      } catch (ethersLoadError) {
        console.error("❌ Impossibile caricare la libreria ethers:", ethersLoadError);
      }
    }
    
    // Inizializza il provider Ethereum per fallback direct-to-blockchain
    if (window.ethereum && window.ethers && !window.ethersProvider) {
      try {
        window.ethersProvider = new window.ethers.providers.Web3Provider(window.ethereum);
        console.log("✅ SUPER DEBUG: Provider Ethereum creato con successo");
      } catch (providerErr) {
        console.error("❌ SUPER DEBUG: Errore nella creazione del provider Ethereum:", providerErr);
      }
    }
    
    // Prima verifica se c'è un indirizzo salvato in localStorage
    let storedAddress;
    try {
      storedAddress = localStorage.getItem('lastWalletAddress');
      if (storedAddress) {
        console.log(`📝 Trovato indirizzo wallet in localStorage: ${storedAddress}`);
      }
    } catch (err) {
      console.error('❌ Errore nel recuperare indirizzo da localStorage:', err);
    }
    
    // Verifica tutte le possibili fonti dell'indirizzo wallet in ordine di priorità
    let walletAddress = walletAddressOverride ||
      window.WALLET_STATE?.address ||
      window.ethereum?.selectedAddress ||
      window.userWalletAddress ||
      storedAddress;

    if (!walletAddress) {
      console.error("❌ ERRORE: Nessun wallet connesso, impossibile caricare gli NFT");
      console.groupEnd();
      // Mostra un messaggio all'utente
      const availableNftGrid = document.getElementById('availableNftsContainer');
      if (availableNftGrid) {
        availableNftGrid.innerHTML = `
          <div class="empty-state">
            <i class="ri-wallet-3-line"></i>
            <h3>Nessun wallet connesso</h3>
            <p>Collega il tuo wallet Ethereum per visualizzare i tuoi NFT disponibili per lo staking.</p>
            <button id="connectWalletBtn" class="btn primary-btn mt-3">
              <i class="ri-wallet-3-line"></i> Collega Wallet
            </button>
          </div>
        `;
        // Aggiungi event listener al pulsante
        const connectWalletBtn = document.getElementById('connectWalletBtn');
        if (connectWalletBtn) {
          connectWalletBtn.addEventListener('click', () => {
            if (typeof window.connectWalletETH === 'function') {
              window.connectWalletETH();
            } else {
              console.error("Funzione connectWalletETH non trovata");
              const connectButtonETH = document.getElementById('connectButtonETH');
              if (connectButtonETH) {
                connectButtonETH.click();
              }
            }
          });
        }
      }
      return;
    }
    
    // Verifica se l'indirizzo wallet è una stringa valida
    if (typeof walletAddress !== 'string') {
      console.error(`❌ L'indirizzo wallet non è una stringa valida: ${typeof walletAddress}`);
      throw new Error(`Indirizzo wallet non valido: tipo ${typeof walletAddress}`);
    }

    // Pulizia avanzata dell'indirizzo
    console.log("🔄 SUPER DEBUG: Inizio pulizia indirizzo:", walletAddress);
    let cleanWalletAddress = walletAddress.trim(); // Rimuovi spazi all'inizio e alla fine
    cleanWalletAddress = cleanWalletAddress.replace(/\s+/g, ''); // Rimuovi tutti gli spazi
    console.log("🔄 SUPER DEBUG: Dopo rimozione spazi:", cleanWalletAddress);
    
    // Rimuovi i puntini di sospensione solo se presenti e l'indirizzo non è un indirizzo completo
    if (cleanWalletAddress.includes('...') && cleanWalletAddress.length < 42) {
      console.log(`⚠️ SUPER DEBUG: Indirizzo abbreviato rilevato: ${cleanWalletAddress}`);
      cleanWalletAddress = cleanWalletAddress.replace(/\.\.\./g, '');
      console.log(`🔄 SUPER DEBUG: Dopo rimozione ellissi: ${cleanWalletAddress}`);
    }
    
    // Verifica che l'indirizzo inizi con 0x
    if (!cleanWalletAddress.startsWith('0x')) {
      console.warn(`⚠️ SUPER DEBUG: L'indirizzo wallet non inizia con 0x: ${cleanWalletAddress}`);
      cleanWalletAddress = '0x' + cleanWalletAddress;
      console.log(`🔄 SUPER DEBUG: Dopo aggiunta prefisso 0x: ${cleanWalletAddress}`);
    }
    
    // Verifica la lunghezza dell'indirizzo
    if (cleanWalletAddress.length !== 42) {
      console.warn(`⚠️ SUPER DEBUG: L'indirizzo ha una lunghezza insolita (${cleanWalletAddress.length} caratteri): ${cleanWalletAddress}`);
    }
    
    // Salva l'indirizzo pulito per uso futuro
    window.userWalletAddress = cleanWalletAddress;
    console.log("✅ SUPER DEBUG: Indirizzo finale pulito:", cleanWalletAddress);
    
    // Tenta di salvare in localStorage
    try {
      localStorage.setItem('lastWalletAddress', cleanWalletAddress);
    } catch (err) {
      console.error('❌ Errore nel salvare indirizzo in localStorage:', err);
    }
    
    console.log(`🧹 Indirizzo wallet finale utilizzato: ${cleanWalletAddress}`);

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
      // Evita problemi di codifica URL utilizzando encodeURIComponent
      console.log("🔍🔍🔍 SUPER DEBUG - Costruzione URL API");
      console.log("🔑 Indirizzo wallet pulito:", cleanWalletAddress);
      console.log("📝 Lunghezza indirizzo:", cleanWalletAddress.length);
      
      // Forza la validazione dell'indirizzo per essere sicuri
      if (!cleanWalletAddress || cleanWalletAddress.length < 10) {
        console.error("❌❌❌ ERRORE CRITICO: Indirizzo wallet non valido o troppo corto:", cleanWalletAddress);
        showNotification('error', 'Errore indirizzo wallet', 'L\'indirizzo del wallet non è valido. Riconnetti il wallet e riprova.');
        console.groupEnd();
        throw new Error('Indirizzo wallet non valido o troppo corto');
      }
      
      let apiUrl = `/api/staking/get-available-nfts?wallet=${encodeURIComponent(cleanWalletAddress)}`;
      if (contractAddress) {
        apiUrl += `&contract=${encodeURIComponent(contractAddress)}`;
        console.log("🏢 Utilizzo indirizzo contratto specifico:", contractAddress);
      }
      console.log("🔗 API URL codificata correttamente:", apiUrl);
      
      // Inizializziamo le variabili per la gestione dei dati e del fallback
      let nftData = null;
      let usedFallback = false;
      
      // Funzione per recuperare NFT direttamente dalla blockchain (fallback)
      async function loadNftsDirectFromBlockchain() {
        console.log("🔍 SUPER DEBUG: Tentativo di caricamento NFT direttamente dalla blockchain");
        if (!window.ethereum || !window.ethers) {
          console.warn("⚠️ SUPER DEBUG: Web3 o ethers non disponibile per il fallback, tentativo di caricamento diretto");
          
          // Utilizziamo la funzione globale per caricare ethers.js
          if (!window.ethers) {
            try {
              console.log("🔄 SUPER DEBUG: Caricamento dinamico di ethers.js tramite funzione globale");
              await loadEthersLibrary();
              console.log("✅ SUPER DEBUG: ethers.js caricato con successo");
            } catch (err) {
              console.error("❌ SUPER DEBUG: Errore nel caricamento di ethers.js:", err);
              throw new Error("Impossibile caricare ethers.js per il fallback");
            }
          }
        }
        
        try {
          // Contratto NFT IASE - indirizzo predefinito aggiornato
          const nftContract = contractAddress || "0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F";
          
          // ABI minimo per ERC721 - solo funzioni necessarie
          const minimalERC721ABI = [
            "function balanceOf(address owner) view returns (uint256)",
            "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
            "function tokenURI(uint256 tokenId) view returns (string)"
          ];
          
          // Crea provider (usa Infura come fallback se ethereum non è disponibile)
          let provider;
          if (window.ethereum) {
            provider = new ethers.providers.Web3Provider(window.ethereum);
          } else {
            // URL di Infura come fallback (usa chiave IASE)
            provider = new ethers.providers.JsonRpcProvider(
              "https://mainnet.infura.io/v3/84ed164327474b4499c085d2e4345a66"
            );
          }
          
          window.ethersProvider = provider;
          
          // Crea istanza contratto
          const nftContractInstance = new ethers.Contract(nftContract, minimalERC721ABI, provider);
          
          // Recupera il balance (numero di NFT posseduti)
          const balance = await nftContractInstance.balanceOf(cleanWalletAddress);
          console.log(`✅ SUPER DEBUG: Balance NFT recuperato: ${balance.toString()}`);
          
          const nfts = [];
          
          // Se non ci sono NFT, ritorna array vuoto
          if (balance.toNumber() === 0) {
            console.log("⚠️ SUPER DEBUG: Nessun NFT trovato sulla blockchain");
            return { nfts: [] };
          }
          
          // Recupera ogni NFT
          for (let i = 0; i < balance.toNumber(); i++) {
            try {
              const tokenId = await nftContractInstance.tokenOfOwnerByIndex(cleanWalletAddress, i);
              console.log(`✅ SUPER DEBUG: Trovato NFT #${tokenId.toString()}`);
              
              // Recupera l'URI dei metadati
              let tokenURI = "";
              try {
                tokenURI = await nftContractInstance.tokenURI(tokenId);
                console.log(`🔍 SUPER DEBUG: TokenURI per NFT #${tokenId.toString()}:`, tokenURI);
              } catch (uriError) {
                console.error(`❌ SUPER DEBUG: Errore nel recupero tokenURI per NFT #${tokenId.toString()}:`, uriError);
              }
              
              // Prepara l'NFT con dati di base
              let nftData = {
                id: tokenId.toString(),
                tokenId: tokenId.toString(),
                name: `IASE Unit #${tokenId.toString()}`,
                image: "/images/nft-samples/placeholder.jpg",
                cardFrame: "Standard", // Predefinito, verrà aggiornato dai metadati se possibile
                rarity: "Standard",
                aiBooster: "X1.0", // Predefinito 
                "AI-Booster": "X1.0",
                contractAddress: nftContract,
                // Aggiunge iaseTraits per compatibilità
                iaseTraits: {
                  orbitalModule: "standard",
                  energyPanels: "standard",
                  antennaType: "standard",
                  aiCore: "standard",
                  evolutiveTrait: "standard"
                }
              };
              
              // Se abbiamo un tokenURI, tentiamo di recuperare i metadati completi
              if (tokenURI) {
                try {
                  // Normalizza l'URI se necessario (gestisce ipfs://, https://, ecc.)
                  if (tokenURI.startsWith('ipfs://')) {
                    tokenURI = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
                  }
                  
                  console.log(`🔄 SUPER DEBUG: Tentativo fetch metadati da: ${tokenURI}`);
                  
                  // Recupera i metadati reali da tokenURI con timeout
                  const controller = new AbortController();
                  const timeoutId = setTimeout(() => controller.abort(), 5000);
                  
                  const metadataResponse = await fetch(tokenURI, { 
                    signal: controller.signal,
                    headers: {
                      'Accept': 'application/json'
                    }
                  });
                  
                  clearTimeout(timeoutId);
                  
                  if (metadataResponse.ok) {
                    const metadata = await metadataResponse.json();
                    console.log(`✅ SUPER DEBUG: Metadati recuperati per NFT #${tokenId.toString()}:`, metadata);
                    
                    // Aggiorna l'NFT con i metadati reali
                    if (metadata.name) nftData.name = metadata.name;
                    if (metadata.image) nftData.image = metadata.image;
                    if (metadata.attributes) {
                      for (const attr of metadata.attributes) {
                        if (attr.trait_type === 'Card Frame') nftData.cardFrame = attr.value;
                        if (attr.trait_type === 'AI-Booster') {
                          nftData.aiBooster = attr.value;
                          nftData['AI-Booster'] = attr.value;
                        }
                        
                        // Imposta rarity in base al Card Frame
                        if (attr.trait_type === 'Card Frame') {
                          nftData.rarity = attr.value;
                        }
                        
                        // Aggiorna iaseTraits se disponibili
                        if (attr.trait_type === 'Orbital Design Module') nftData.iaseTraits.orbitalModule = attr.value.toLowerCase();
                        if (attr.trait_type === 'Energy Panels') nftData.iaseTraits.energyPanels = attr.value.toLowerCase();
                        if (attr.trait_type === 'Antenna Type') nftData.iaseTraits.antennaType = attr.value.toLowerCase();
                        if (attr.trait_type === 'AI Core') nftData.iaseTraits.aiCore = attr.value.toLowerCase();
                        if (attr.trait_type === 'Evolutive Trait') nftData.iaseTraits.evolutiveTrait = attr.value.toLowerCase();
                      }
                    }
                  } else {
                    console.error(`❌ SUPER DEBUG: Errore nel recupero metadati, status: ${metadataResponse.status}`);
                  }
                } catch (metadataError) {
                  console.error(`❌ SUPER DEBUG: Errore nel recupero metadati per NFT #${tokenId.toString()}:`, metadataError);
                }
              }
              
              // Aggiungi l'NFT all'array (con metadati se disponibili)
              nfts.push(nftData);
            } catch (err) {
              console.error(`❌ SUPER DEBUG: Errore nel recupero del token ${i}:`, err);
            }
          }
          
          console.log(`✅ SUPER DEBUG: Recuperati ${nfts.length} NFT dalla blockchain`);
          return { nfts };
        } catch (err) {
          console.error("❌ SUPER DEBUG: Errore nel caricamento NFT dalla blockchain:", err);
          throw err;
        }
      }
      
      // Gestisci con timeout in caso di problemi di rete
      // Funzione per recuperare NFTs direttamente dalla blockchain usando Infura
      async function loadNftsViaBlockchain(address) {
        console.log("🔍 SUPER DEBUG: Tentativo recupero NFT diretto dalla blockchain per: " + address);
        
        try {
          // Controlla se ethers.js è disponibile, altrimenti caricalo
          if (!window.ethers) {
            console.log("🔄 SUPER DEBUG: Caricamento ethers.js...");
            await new Promise((resolve, reject) => {
              const script = document.createElement('script');
              script.src = 'https://cdn.ethers.io/lib/ethers-5.6.umd.min.js';
              script.async = true;
              script.onload = resolve;
              script.onerror = reject;
              document.head.appendChild(script);
            });
            console.log("✅ SUPER DEBUG: ethers.js caricato con successo");
          }
          
          // Usa l'API key Infura ufficiale IASE
          const infuraUrl = "https://mainnet.infura.io/v3/84ed164327474b4499c085d2e4345a66";
          
          // Configura indirizzo contratto NFT
          const nftContract = contractAddress || "0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F";
          
          // ABI minimale per ERC721
          const minimalERC721ABI = [
            "function balanceOf(address owner) view returns (uint256)",
            "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
            "function tokenURI(uint256 tokenId) view returns (string)"
          ];
          
          // Crea provider (wallet o Infura)
          const provider = window.ethereum ? 
            new ethers.providers.Web3Provider(window.ethereum) : 
            new ethers.providers.JsonRpcProvider(infuraUrl);
          
          // Crea istanza contratto
          const contract = new ethers.Contract(nftContract, minimalERC721ABI, provider);
          
          // Ottieni numero NFT posseduti
          const balance = await contract.balanceOf(address);
          console.log(`✅ SUPER DEBUG: Balance NFT: ${balance.toString()}`);
          
          // Prepara array risultati
          const nfts = [];
          
          // Recupera informazioni su ogni NFT
          for (let i = 0; i < balance.toNumber(); i++) {
            try {
              const tokenId = await contract.tokenOfOwnerByIndex(address, i);
              console.log(`✅ SUPER DEBUG: Trovato NFT #${tokenId.toString()}`);
              
              // Aggiungi NFT all'array
              nfts.push({
                id: tokenId.toString(),
                tokenId: tokenId.toString(),
                name: `IASE Unit #${tokenId.toString()}`,
                image: "/images/nft-samples/placeholder.jpg",
                rarity: "Standard",
                cardFrame: "Standard",
                aiBooster: "X1.0",
                "AI-Booster": "X1.0",
                contractAddress: nftContract,
                iaseTraits: {
                  orbitalModule: "standard",
                  energyPanels: "standard",
                  antennaType: "standard",
                  aiCore: "standard",
                  evolutiveTrait: "standard"
                }
              });
            } catch (err) {
              console.error(`❌ SUPER DEBUG: Errore nel recupero token #${i}:`, err);
            }
          }
          
          console.log(`✅ SUPER DEBUG: Recuperati ${nfts.length} NFT dalla blockchain`);
          return { nfts: nfts };
          
        } catch (error) {
          console.error("❌ SUPER DEBUG: Errore nel recupero blockchain:", error);
          throw error;
        }
      }
      
      // Il flag usedFallback è già stato inizializzato in precedenza
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 secondi di timeout
      
      let response;
      try {
        console.log("🔄 SUPER DEBUG: Invio richiesta API a", apiUrl);
        response = await fetch(apiUrl, { 
          signal: controller.signal,
          // Aggiungi cache control headers per evitare problemi di cache
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        // Elimina il timeout se la richiesta ha successo
        clearTimeout(timeoutId);
        
        console.log("✅ SUPER DEBUG: Risposta ricevuta", {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });
        
        if (!response.ok) {
          const responseText = await response.text();
          console.error(`❌ SUPER DEBUG: Errore API (${response.status} ${response.statusText}):`, responseText);
          
          console.log("⚠️ SUPER DEBUG: API fallita, tentativo di fallback sulla blockchain...");
          nftData = await loadNftsDirectFromBlockchain();
          usedFallback = true;
          console.log("✅ SUPER DEBUG: Fallback riuscito, NFT recuperati dalla blockchain");
        }
      } catch (fetchError) {
        console.error('❌ SUPER DEBUG: Errore durante il fetch degli NFT:', fetchError);
        
        // IMPORTANTE: in caso di qualsiasi errore, tenta il fallback blockchain
        if (!usedFallback) {
          try {
            console.log("⚠️ SUPER DEBUG: Errore API fetch, tentativo fallback blockchain con Infura...");
            nftData = await loadNftsDirectFromBlockchain();
            usedFallback = true;
            console.log("✅ SUPER DEBUG: Fallback riuscito, NFT recuperati dalla blockchain");
          } catch (fallbackError) {
            console.error('❌ SUPER DEBUG: Fallback blockchain fallito:', fallbackError);
            
            if (fetchError.name === 'AbortError') {
              console.error('⏱️ SUPER DEBUG: Timeout della richiesta API dopo 15 secondi');
              showNotification('error', 'Errore di Connessione', 'La richiesta al server è scaduta. Verifica la tua connessione di rete e riprova.');
            } else {
              console.error('❌ SUPER DEBUG: Errore durante il fetch degli NFT:', fetchError);
              console.error('❌ SUPER DEBUG: Stack trace completo:', fetchError.stack);
              showNotification('error', 'Errore di Caricamento', 
                `Impossibile caricare gli NFT: ${fetchError.message || 'Errore sconosciuto'}`);
            }
            console.log("🔍 SUPER DEBUG: Dati completi errore", {
              error: fetchError,
              message: fetchError.message,
              stack: fetchError.stack,
              wallet: cleanWalletAddress,
              apiUrl: apiUrl
            });
          }
        }
        console.groupEnd();
        
        // Mostra stato vuoto con pulsante retry
        if (window.availableNftGrid) {
          window.availableNftGrid.innerHTML = `
            <div class="empty-state">
              <i class="ri-error-warning-line"></i>
              <h3>Errore di caricamento</h3>
              <p>${fetchError.message || 'Impossibile caricare gli NFT. Verifica la tua connessione e riprova.'}</p>
              <button id="retryNftLoadBtn" class="btn primary-btn mt-3">
                <i class="ri-refresh-line"></i> Riprova
              </button>
            </div>
          `;
          
          // Aggiungi event listener al pulsante retry
          const retryBtn = document.getElementById('retryNftLoadBtn');
          if (retryBtn) {
            retryBtn.addEventListener('click', () => loadAvailableNfts(contractAddress, cleanWalletAddress));
          }
        }
        
        return; // Esci dalla funzione per evitare ulteriori elaborazioni
      }
      
      // Usa i dati dal fallback o dalla risposta API
      if (!nftData) {
        try {
          // Prima verifica se la risposta è in un formato valido
          let responseText = await response.text();
          console.log("🔍 SUPER DEBUG: Risposta originale ricevuta:", responseText.substring(0, 200));
          
          let jsonParseSuccessful = false;
          
          try {
            // Controlla se la risposta è vuota
            if (!responseText || responseText.trim() === '') {
              console.error("❌ SUPER DEBUG: Risposta API vuota");
              throw new Error("Risposta API vuota");
            }
            
            // Controlla se la risposta inizia con caratteri HTML (potrebbe essere una pagina di errore)
            if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
              console.error("❌ SUPER DEBUG: Risposta è una pagina HTML, non JSON:", responseText.substring(0, 100));
              throw new Error("Risposta API non valida (HTML ricevuto)");
            }
            
            // Tenta di analizzare la risposta come JSON
            let parsedData = JSON.parse(responseText);
            
            // Verifica se la risposta ha la struttura corretta
            if (!parsedData) {
              console.error("❌ SUPER DEBUG: Risposta JSON non valida (null o undefined)");
              throw new Error("Risposta JSON non valida");
            }
            
            // Verifica che ci sia un array 'nfts' nella risposta
            if (!parsedData.nfts || !Array.isArray(parsedData.nfts)) {
              console.error("❌ SUPER DEBUG: Risposta JSON senza array 'nfts' valido:", parsedData);
              throw new Error("Struttura dati 'nfts' non valida nella risposta");
            }
            
            // Se arriviamo qui, la risposta è valida
            nftData = parsedData;
            jsonParseSuccessful = true;
            console.log("📦 SUPER DEBUG: Dati NFT ricevuti:", nftData);
            
            // Log completo della risposta per debugging
            const respJson = JSON.stringify(nftData);
            console.log("📝 SUPER DEBUG: Lunghezza risposta:", respJson.length);
            console.log("📝 SUPER DEBUG: Risposta API completa:", respJson.substring(0, 1000) + 
            (respJson.length > 1000 ? '... (truncated)' : ''));
            
            // Ispeziona la struttura della risposta
            console.log("🔍 SUPER DEBUG: Chiavi dell'oggetto risposta:", Object.keys(nftData));
            
          } catch (jsonParseError) {
            console.error("❌ SUPER DEBUG: Errore parsing JSON:", jsonParseError);
            console.log("⚠️ SUPER DEBUG: Risposta non valida, attivazione fallback blockchain...");
            // Mostra una notifica all'utente per informarlo del problema
            showNotification('warning', 'Cambio modalità', 'Utilizzando connessione diretta alla blockchain per il caricamento NFT');
          }
          
          // Se il parsing JSON è fallito, usa il fallback blockchain
          if (!jsonParseSuccessful) {
            try {
              nftData = await loadNftsDirectFromBlockchain();
              usedFallback = true;
              console.log("✅ SUPER DEBUG: Fallback riuscito, NFT recuperati dalla blockchain");
            } catch (fallbackError) {
              console.error("❌ SUPER DEBUG: Anche il fallback blockchain è fallito:", fallbackError);
              showNotification('error', 'Errore di caricamento', 'Impossibile caricare gli NFT da tutte le fonti disponibili. Riprova più tardi.');
              throw new Error("Fallimento completo nel caricamento NFT: " + fallbackError.message);
            }
          }
          
          // Log sui tipi di dati per debug
          if (nftData && nftData.nfts) {
            console.log("🔍 SUPER DEBUG: Tipo nfts:", typeof nftData.nfts, Array.isArray(nftData.nfts));
          }
          if (nftData && nftData.available) {
            console.log("🔍 SUPER DEBUG: Tipo available:", typeof nftData.available, Array.isArray(nftData.available));
          }
          
        } catch (error) {
          console.error('❌ SUPER DEBUG: Errore generale nella gestione risposta:', error);
          console.error('❌ SUPER DEBUG: Stack trace completo:', error.stack);
          
          // In caso di qualsiasi errore, tenta il fallback blockchain
          try {
            console.log("⚠️ SUPER DEBUG: Errore critico, tentativo fallback blockchain di emergenza...");
            nftData = await loadNftsDirectFromBlockchain();
            usedFallback = true;
            console.log("✅ SUPER DEBUG: Fallback di emergenza riuscito");
          } catch (fallbackError) {
            console.error('❌ SUPER DEBUG: Anche il fallback blockchain è fallito:', fallbackError);
            showNotification('error', 'Errore Critico', 'Impossibile recuperare gli NFT. Riprova più tardi.');
            return;
          }
        }
      }
      
      // Verifica il wallet tornato dalla risposta come conferma
      if (nftData.wallet) {
        console.log(`✅ SUPER DEBUG: API conferma richiesta per wallet: ${nftData.wallet}`);
        console.log(`✅ SUPER DEBUG: Confronto wallet richiesto vs risposta: ${cleanWalletAddress} vs ${nftData.wallet}`);
      } else {
        console.log(`⚠️ SUPER DEBUG: Nessun campo wallet nella risposta API`);
      }
      
      // Log dettagliato per il debugging
      if (nftData.nfts && nftData.nfts.length > 0) {
        console.log("✅ SUPER DEBUG: NFTs trovati nella proprietà 'nfts':", nftData.nfts.length);
        
        // Log dettagliato dei primi 3 NFT per diagnosi
        for (let i = 0; i < Math.min(3, nftData.nfts.length); i++) {
          const nft = nftData.nfts[i];
          console.log(`🔍 SUPER DEBUG: NFT #${i} dettaglio completo:`, nft);
          console.log(`🔍 SUPER DEBUG: Attributi NFT #${i}:`, nft.attributes || nft.metadata?.attributes || 'nessun attributo');
        }
        
      } else if (nftData.available && nftData.available.length > 0) {
        console.log("✅ SUPER DEBUG: NFTs trovati nella proprietà 'available':", nftData.available.length);
        
        // Log dettagliato dei primi 3 NFT per diagnosi
        for (let i = 0; i < Math.min(3, nftData.available.length); i++) {
          const nft = nftData.available[i];
          console.log(`🔍 SUPER DEBUG: NFT #${i} dettaglio completo:`, nft);
          console.log(`🔍 SUPER DEBUG: Attributi NFT #${i}:`, nft.attributes || nft.metadata?.attributes || 'nessun attributo');
        }
        
      } else {
        console.log("⚠️ SUPER DEBUG: Nessun NFT trovato nella risposta");
        console.log("⚠️ SUPER DEBUG: Struttura completa risposta:", nftData);
      }
      
      // Supporta sia "nfts" che "available" nella risposta per retrocompatibilità
      window.availableNfts = nftData.nfts || nftData.available || [];
      
      // Pre-processamento degli NFT per trasformare attributi in formato compatibile
      if (window.availableNfts.length > 0) {
        console.log("🔄 SUPER DEBUG: Pre-processamento NFT per normalizzare attributi");
        
        window.availableNfts = window.availableNfts.map(nft => {
          // Se l'NFT ha già gli attributi processati, non fare nulla
          if (nft.iaseTraits) return nft;
          
          // Se l'NFT ha attributi in formato array, convertiamo in un formato più accessibile
          if (Array.isArray(nft.attributes)) {
            console.log(`🔄 SUPER DEBUG: Normalizzazione attributi per NFT #${nft.id}`);
            
            // Estrazione rarity e aiBooster dai vari formati possibili
            const cardFrame = nft.attributes.find(attr => 
              attr.trait_type === 'Card Frame' || 
              attr.trait_type === 'rarity' || 
              attr.name === 'Card Frame' || 
              attr.name === 'rarity'
            );
            
            const aiBooster = nft.attributes.find(attr => 
              attr.trait_type === 'AI-Booster' || 
              attr.trait_type === 'aiBooster' || 
              attr.name === 'AI-Booster' || 
              attr.name === 'aiBooster'
            );
            
            if (cardFrame) {
              nft.rarity = cardFrame.value;
              nft.cardFrame = cardFrame.value;
            }
            
            if (aiBooster) {
              nft.aiBooster = aiBooster.value;
              nft['AI-Booster'] = aiBooster.value;
            }
            
            // Estrai i tratti IASE dai vari formati possibili
            const getTraitValue = (names) => {
              for (const name of names) {
                const trait = nft.attributes.find(attr => 
                  attr.trait_type === name || attr.name === name
                );
                if (trait) return trait.value;
              }
              return 'standard';
            };
            
            // Costruisci l'oggetto iaseTraits per una visualizzazione coerente
            nft.iaseTraits = {
              orbitalModule: getTraitValue(['Orbital Design Module', 'Orbital Module']),
              energyPanels: getTraitValue(['Energy Panels']),
              antennaType: getTraitValue(['Antenna Type']),
              aiCore: getTraitValue(['AI Core'])
            };
            
            console.log(`🔄 SUPER DEBUG: NFT #${nft.id} attributi normalizzati:`, {
              rarity: nft.rarity,
              aiBooster: nft.aiBooster,
              iaseTraits: nft.iaseTraits
            });
          }
          
          return nft;
        });
      }
      
      // Log finale del numero di NFT caricati
      console.log(`📊 SUPER DEBUG: Totale NFT caricati e normalizzati: ${window.availableNfts.length}`);
      
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
    console.log("🖼️ SUPER DEBUG: Inizio rendering NFT. Disponibili:", window.availableNfts?.length || 0);
    
    // Verifica se gli NFT sono disponibili
    if (!window.availableNfts) {
      console.error("❌ SUPER DEBUG: window.availableNfts non è definito!");
      showNotification('error', 'Errore di visualizzazione', 'Impossibile visualizzare gli NFT: dati non disponibili');
      return;
    }
    
    // Log degli NFT ricevuti per debug
    if (window.availableNfts.length > 0) {
      console.log("📋 SUPER DEBUG: Primi 3 NFT per rendering:");
      for (let i = 0; i < Math.min(3, window.availableNfts.length); i++) {
        console.log(`📝 SUPER DEBUG: NFT #${i}:`, window.availableNfts[i]);
      }
    } else {
      console.log("📋 SUPER DEBUG: Nessun NFT disponibile per il rendering");
    }
    
    // Pulisci il container
    if (!window.availableNftGrid) {
      console.log("🔍 SUPER DEBUG: Riferimento griglia NFT non trovato, recupero dal DOM");
      window.availableNftGrid = document.getElementById('availableNftsContainer');
      console.log("🔍 SUPER DEBUG: Elemento griglia NFT:", window.availableNftGrid ? "trovato" : "NON trovato");
      
      if (!window.availableNftGrid) {
        console.error("⚠️ SUPER DEBUG: Elemento griglia NFT non trovato nel DOM!");
        
        // Try to find where the container should be and create it if missing
        const nftSection = document.getElementById('availableTab') || document.getElementById('nftSection');
        console.log("🔍 SUPER DEBUG: Sezione NFT:", nftSection ? "trovata" : "NON trovata");
        
        if (nftSection) {
          console.log("🔧 SUPER DEBUG: Creazione container NFT mancante");
          window.availableNftGrid = document.createElement('div');
          window.availableNftGrid.id = 'availableNftsContainer';
          window.availableNftGrid.className = 'nft-grid';
          nftSection.appendChild(window.availableNftGrid);
        } else {
          console.error("❌ SUPER DEBUG: Impossibile renderizzare gli NFT: sia la griglia che la sezione sono mancanti");
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
        // Estrai i metadati IASE dai vari formati possibili
        console.log("🔍 SUPER DEBUG: Analisi NFT per rendering:", nft);
        
        // Determina l'immagine e i dettagli dell'NFT
        const nftId = nft.id;
        const nftTitle = nft.name || `IASE Unit #${nftId}`;
        const nftImage = nft.image || 'images/nft-placeholder.jpg';
        
        // Estrazione standardizzata delle proprietà IASE
        let rarity = 'Standard';
        let aiBooster = null;
        let iaseTraits = null;
        
        // Estrai i metadati da qualunque formato disponibile
        console.log("🔍 SUPER DEBUG: Cercando attributi in:", nft.attributes, nft.metadata?.attributes);
        
        // Funzione helper per estrarre attributi
        const getAttributeValue = (attrName) => {
          // Controlla in nft.attributes array (formato standard)
          if (Array.isArray(nft.attributes)) {
            const attr = nft.attributes.find(a => 
              a.trait_type?.toLowerCase() === attrName.toLowerCase() || 
              a.name?.toLowerCase() === attrName.toLowerCase()
            );
            if (attr) return attr.value;
          }
          
          // Controlla in nft.metadata.attributes array (altro formato possibile)
          if (Array.isArray(nft.metadata?.attributes)) {
            const attr = nft.metadata.attributes.find(a => 
              a.trait_type?.toLowerCase() === attrName.toLowerCase() || 
              a.name?.toLowerCase() === attrName.toLowerCase()
            );
            if (attr) return attr.value;
          }
          
          // Controlla proprietà dirette
          if (nft[attrName]) return nft[attrName];
          if (nft.metadata?.[attrName]) return nft.metadata[attrName];
          
          // Controlla formati speciali di IASE
          if (attrName === 'rarity' && nft.cardFrame) return nft.cardFrame;
          if (attrName === 'aiBooster' && nft['AI-Booster']) return nft['AI-Booster'];
          
          return null;
        };
        
        // Estrai valori
        rarity = getAttributeValue('rarity') || getAttributeValue('Card Frame') || rarity;
        aiBooster = getAttributeValue('aiBooster') || getAttributeValue('AI-Booster');
        
        const rarityClass = (rarity || 'standard').toLowerCase();
        
        // Estrai tratti IASE specifici o costruisci oggetto vuoto
        iaseTraits = nft.iaseTraits || {};
        
        // Se non ci sono iaseTraits ma ci sono attributi, costruisci i tratti
        if (!nft.iaseTraits && (Array.isArray(nft.attributes) || Array.isArray(nft.metadata?.attributes))) {
          console.log("🔍 SUPER DEBUG: Costruendo iaseTraits da attributi");
          
          iaseTraits = {
            orbitalModule: getAttributeValue('Orbital Design Module') || getAttributeValue('Orbital Module') || 'standard',
            energyPanels: getAttributeValue('Energy Panels') || 'standard',
            antennaType: getAttributeValue('Antenna Type') || 'standard', 
            aiCore: getAttributeValue('AI Core') || 'standard'
          };
          
          console.log("🔍 SUPER DEBUG: iaseTraits costruiti:", iaseTraits);
        }
        
        console.log(`✅ SUPER DEBUG: Creating card for NFT #${nftId} (${nftTitle}), Rarity: ${rarity}, AI-Booster: ${aiBooster}`);
        
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
            <div class="nft-attributes">
              <span class="rarity-badge ${rarityClass}">${rarity}</span>
              ${aiBooster ? `<span class="boost-badge">AI-Booster: ${aiBooster}</span>` : ''}
            </div>
            ${iaseTraits ? `
            <div class="nft-traits">
              <div class="trait" title="Orbital Design Module"><i class="ri-planet-line"></i> ${(iaseTraits.orbitalModule || 'standard').replace('orbital_', '')}</div>
              <div class="trait" title="Energy Panels"><i class="ri-battery-2-charge-line"></i> ${(iaseTraits.energyPanels || 'standard').replace('panel_', '')}</div>
              <div class="trait" title="Antenna Type"><i class="ri-broadcast-line"></i> ${(iaseTraits.antennaType || 'standard').replace('antenna_', '')}</div>
              <div class="trait" title="AI Core"><i class="ri-cpu-line"></i> ${(iaseTraits.aiCore || 'standard').replace('ai_core_', '')}</div>
            </div>
            ` : ''}
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
    // Esporta globalmente la funzione per evitare errori di riferimento
    window.openStakeModal = openStakeModal;
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