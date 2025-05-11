/**
 * IASE Staking Platform
 * Gestisce la UI e le funzionalità di staking degli NFT IASE Units
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elementi UI
  const authSection = document.getElementById('authSection');
  const stakingDashboard = document.getElementById('stakingDashboard');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const authTabs = document.querySelectorAll('.auth-tab-btn');
  const dashboardTabs = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const stakedNftGrid = document.getElementById('stakedNftGrid');
  const availableNftGrid = document.getElementById('availableNftGrid');
  const rewardsHistoryTable = document.getElementById('rewardsHistoryTable');
  const emptyRewardsState = document.getElementById('emptyRewardsState');
  const claimAllBtn = document.getElementById('claimAllBtn');
  const totalStakedNfts = document.getElementById('totalStakedNfts');
  const totalRewards = document.getElementById('totalRewards');
  const dailyRewards = document.getElementById('dailyRewards');
  const pendingRewards = document.getElementById('pendingRewards');
  
  // Modali
  const stakingModal = document.getElementById('stakingModal');
  const unstakingModal = document.getElementById('unstakingModal');
  const confirmStakeBtn = document.getElementById('confirmStakeBtn');
  const confirmUnstakeBtn = document.getElementById('confirmUnstakeBtn');
  // Element might not exist yet, we'll check before using it
  const claimAndUnstakeBtn = document.getElementById('claimAndUnstakeBtn');
  const closeModalBtns = document.querySelectorAll('.close-modal, .close-modal-btn');
  
  // Correggi gli IDs per riferimenti corretti agli elementi HTML
  if (!stakedNftGrid && document.getElementById('stakedNftsContainer')) {
    stakedNftGrid = document.getElementById('stakedNftsContainer');
  }
  
  if (!availableNftGrid && document.getElementById('availableNftsContainer')) {
    availableNftGrid = document.getElementById('availableNftsContainer');
  }
  
  if (!emptyRewardsState && document.getElementById('rewardsEmptyState')) {
    emptyRewardsState = document.getElementById('rewardsEmptyState');
  }
  
  // Stato dell'applicazione
  let currentUser = null;
  let stakedNfts = [];
  let availableNfts = [];
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
        throw new Error(errorData.error || 'Errore durante la rimozione dello staking');
      }
      
      const result = await response.json();
      unstakingModal.style.display = 'none';
      showNotification('success', 'Staking terminato', `NFT #${selectedStake.nftId} rimosso dallo staking`);
      
      // Aggiorna le liste
      loadStakedNfts();
      loadAvailableNfts();
      updateDashboardSummary();
      
    } catch (error) {
      console.error('Unstaking error:', error);
      showNotification('error', 'Errore rimozione staking', error.message);
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
  
  // Wallet connecting and staking are handled by wallet-connect.js
  // Handle UI updates when wallet is connected
  document.addEventListener('walletConnected', (event) => {
    const { address } = event.detail;
    
    // Se l'utente è già autenticato, collega l'indirizzo wallet all'account
    if (currentUser) {
      linkWalletToAccount(address);
    } else {
      // Altrimenti mostra la sezione di autenticazione
      authSection.classList.remove('hidden');
    }
  });
  
  document.addEventListener('walletDisconnected', () => {
    // Reset UI quando il wallet viene disconnesso
    stakingDashboard.classList.add('hidden');
    
    if (currentUser) {
      authSection.classList.remove('hidden');
    }
  });
  
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
        throw new Error(errorData.error || 'Errore durante il collegamento del wallet');
      }
      
      const result = await response.json();
      currentUser = result.user;
      
      showNotification('success', 'Wallet collegato', 'Il tuo wallet è stato collegato con successo all\'account.');
      
      // Inizializza dashboard
      initializeStakingDashboard();
      
    } catch (error) {
      console.error('Link wallet error:', error);
      showNotification('error', 'Errore collegamento wallet', error.message);
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
      const response = await fetch('/api/staking/staked');
      
      if (!response.ok) {
        throw new Error('Errore durante il recupero degli NFT in staking');
      }
      
      const data = await response.json();
      stakedNfts = data.stakes || [];
      
      renderStakedNfts();
      
    } catch (error) {
      console.error('Load staked NFTs error:', error);
      showNotification('error', 'Errore caricamento', 'Impossibile caricare gli NFT in staking');
    }
  }
  
  async function loadAvailableNfts() {
    try {
      console.log("Fetching available NFTs...");
      const response = await fetch('/api/staking/nfts');
      
      if (!response.ok) {
        throw new Error('Errore durante il recupero degli NFT');
      }
      
      const data = await response.json();
      console.log("NFTs data received:", data);
      availableNfts = data.available || [];
      
      // In questa applicazione demo, renderizziamo subito
      // In una implementazione reale, filtreremmo per NFT della collezione IASE
      renderAvailableNfts();
      
      // Mostra sezione NFT (hidden by default)
      const nftSection = document.getElementById('nftSection');
      if (nftSection) {
        nftSection.classList.remove('hidden');
      }
      
      // Mostra dashboard se è nascosto
      const stakingDashboard = document.getElementById('stakingDashboard');
      if (stakingDashboard) {
        stakingDashboard.classList.remove('hidden');
      }
      
    } catch (error) {
      console.error('Load available NFTs error:', error);
      showNotification('error', 'Errore caricamento', 'Impossibile caricare gli NFT disponibili');
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
              <span class="reward-label">Ricompensa giornaliera:</span>
              <span class="reward-value">${stake.dailyRewardRate.toFixed(2)} IASE</span>
            </div>
            <div class="reward-rate">
              <span class="reward-label">Ricompensa pendente:</span>
              <span class="reward-value">${stake.pendingReward ? stake.pendingReward.toFixed(2) : '0.00'} IASE</span>
            </div>
          </div>
          <div class="nft-card-actions">
            <button class="btn outline-btn stake-action-btn" data-action="claim" data-stake-id="${stake.id}">
              <i class="fas fa-hand-holding-usd"></i> Riscuoti
            </button>
            <button class="btn secondary-btn stake-action-btn" data-action="unstake" data-stake-id="${stake.id}">
              <i class="fas fa-unlock"></i> Rimuovi
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
    console.log("Rendering NFTs:", availableNfts);
    
    // Pulisci il container
    if (!availableNftGrid) {
      console.error("NFT grid not found in the DOM");
      return;
    }
    
    availableNftGrid.innerHTML = '';
    
    if (!availableNfts || availableNfts.length === 0) {
      availableNftGrid.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-search"></i>
          <h3>Nessun NFT disponibile</h3>
          <p>Collega il tuo wallet per visualizzare i tuoi IASE Units disponibili per lo staking.</p>
        </div>
      `;
      return;
    }
    
    // Renderizza ogni NFT
    availableNfts.forEach(nft => {
      // Determina l'immagine e i dettagli dell'NFT
      const nftId = nft.id;
      const nftTitle = nft.name || `IASE Unit #${nftId}`;
      const nftImage = nft.image || 'images/nft-placeholder.jpg';
      const rarityClass = (nft.rarity || 'standard').toLowerCase();
      
      const card = document.createElement('div');
      card.className = 'nft-card';
      card.innerHTML = `
        <img src="${nftImage}" alt="${nftTitle}" class="nft-image" onerror="this.src='images/nft-placeholder.jpg'">
        <div class="nft-details">
          <h3 class="nft-title">${nftTitle}</h3>
          <p class="nft-id">ID: ${nftId}</p>
          <span class="rarity-badge ${rarityClass}">${nft.rarity || 'Standard'}</span>
          <div class="nft-card-actions mt-3">
            <button class="btn primary-btn stake-action-btn" data-action="stake" data-nft-id="${nftId}">
              <i class="fas fa-lock"></i> Metti in Staking
            </button>
          </div>
        </div>
      `;
      
      // Aggiungi event listener
      const stakeBtn = card.querySelector('[data-action="stake"]');
      stakeBtn.addEventListener('click', () => openStakeModal(nft));
      
      availableNftGrid.appendChild(card);
    });
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
        <td><span class="rarity-badge standard">Riscosso</span></td>
      `;
      rewardsHistoryTable.appendChild(row);
    });
  }
  
  async function handleClaimRewards(stake) {
    try {
      showNotification('info', 'Riscossione ricompense...', 'Attendere...');
      
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
        throw new Error(errorData.error || 'Errore durante la verifica delle ricompense disponibili');
      }
      
      const { claimableAmount } = await response.json();
      
      if (claimableAmount <= 0) {
        showNotification('warning', 'Nessuna ricompensa', 'Non ci sono ricompense da riscuotere per questo NFT');
        return;
      }
      
      // Utilizza il servizio di claim
      showNotification('info', 'Elaborazione transazione...', 'Conferma la transazione nel tuo wallet');
      const claimResult = await window.claimIASEReward(stake.id, claimableAmount);
      
      if (!claimResult.success) {
        throw new Error(claimResult.error || 'Errore durante la riscossione delle ricompense');
      }
      
      showNotification('success', 'Ricompense riscosse', 
        `Hai riscosso ${claimableAmount.toFixed(2)} IASE token per il tuo NFT!`);
      
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
  
  function openStakeModal(nftId) {
    // Costruisci un mock dell'NFT 
    // In produzione, dovresti ottenere questi dati dal contratto o da un'API
    const nftImage = `img/nfts/iase-unit-${nftId.slice(-3)}.jpg`;
    const nftTitle = `IASE Unit #${nftId.slice(-4)}`;
    
    // Determina la rarità in base all'ID (solo per demo)
    // Lo stesso algoritmo usato nel backend
    const nftIdHash = parseInt(nftId.replace(/\D/g, '').slice(-2) || '0');
    const rarityTiers = ["standard", "advanced", "elite", "prototype"];
    const rarityWeights = [70, 20, 8, 2];
    
    let cumulativeWeight = 0;
    let rarityTier = "standard";
    
    for (let i = 0; i < rarityTiers.length; i++) {
      cumulativeWeight += rarityWeights[i];
      if (nftIdHash % 100 < cumulativeWeight) {
        rarityTier = rarityTiers[i];
        break;
      }
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
    
    const multiplier = rarityMultipliers[rarityTier.toLowerCase()];
    const dailyReward = baseDailyReward * multiplier;
    const monthlyReward = baseMonthlyReward * multiplier;
    
    // Popola la modale
    document.getElementById('modalNftImage').src = nftImage;
    document.getElementById('modalNftImage').onerror = function() {
      this.src = 'img/nft-placeholder.jpg';
    };
    document.getElementById('modalNftTitle').textContent = nftTitle;
    document.getElementById('modalNftId').textContent = `ID: ${nftId}`;
    document.getElementById('modalNftRarity').textContent = rarityTier;
    document.getElementById('modalNftRarity').className = `rarity-badge ${rarityTier.toLowerCase()}`;
    document.getElementById('modalDailyReward').textContent = `${dailyReward.toFixed(2)} IASE`;
    document.getElementById('modalMonthlyReward').textContent = `${monthlyReward.toFixed(2)} IASE`;
    
    // Salva riferimento all'NFT selezionato
    selectedNft = {
      id: nftId,
      title: nftTitle,
      image: nftImage,
      rarityTier: rarityTier,
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