/**
 * IASE Project - Staking NFT Management
 * 
 * Questo file gestisce tutte le operazioni relative allo staking degli NFT IASE,
 * incluse la visualizzazione degli NFT in staking, il calcolo delle ricompense,
 * e le operazioni di stake/unstake.
 * 
 * @version 2.0.0
 * @author IASE Development Team
 */

// Utilizziamo una IIFE per isolare le variabili e prevenire conflitti
(function() {
  // Costanti di configurazione
  const BASE_DAILY_REWARD = 33.33;      // Standard rarity daily reward
  const ADVANCED_DAILY_REWARD = 50.00;  // Advanced rarity daily reward
  const ELITE_DAILY_REWARD = 66.67;     // Elite rarity daily reward
  const PROTOTYPE_DAILY_REWARD = 83.33; // Prototype rarity daily reward

  // Impostazioni configurazione
  const config = {
    apiBaseUrl: window.location.origin, // Usa l'origine corrente per le API
    contractAddress: window.NFT_CONTRACT_ADDRESS || '0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F',
    refreshInterval: 60000, // Intervallo di aggiornamento in millisecondi (1 minuto)
    showPlaceholderImages: true, // Mostra immagini placeholder quando necessario
    enableLogging: true // Abilita log di debug
  };

  // Riferimenti agli elementi DOM per riuso
  const domElements = {
    stakedNftsContainer: document.getElementById('stakedNftsContainer'),
    connectWalletBtn: document.getElementById('connectWalletBtn'),
    stakingPanel: document.getElementById('stakingPanel'),
    walletDisplay: document.getElementById('connectedWallet'),
    totalRewards: document.getElementById('totalRewards'),
    dailyRewards: document.getElementById('dailyRewards'),
    totalStakedNfts: document.getElementById('totalStakedNfts'),
    stakingForm: document.getElementById('stakingForm'),
    loadingIndicator: document.getElementById('loadingIndicator'),
    errorContainer: document.getElementById('errorContainer')
  };

  // Stato dell'applicazione
  let walletConnected = false;
  let currentWalletAddress = '';
  let refreshTimer = null;

  /**
   * Formatta una data in formato leggibile
   * @param {string|Date} date - La data da formattare
   * @returns {string} - La data formattata
   */
  function formatDate(date) {
    if (!date) return 'N/A';
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid Date';
    
    return dateObj.toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Calcola la durata dello staking in formato leggibile
   * @param {string|Date} startDate - La data di inizio staking
   * @returns {string} - La durata formattata
   */
  function calculateStakingDuration(startDate) {
    if (!startDate) return 'N/A';
    
    const start = new Date(startDate);
    if (isNaN(start.getTime())) return 'Invalid Date';
    
    const now = new Date();
    const diffMs = now - start;
    
    // Conversione in giorni, ore, minuti
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  /**
   * Ottiene il tasso di ricompensa giornaliera fisso in base alla rarità
   * @param {string} rarityTier - Il livello di rarità dell'NFT
   * @returns {number} - Il tasso di ricompensa giornaliera
   */
  function getFixedDailyReward(rarityTier) {
    const rarityLower = (rarityTier || '').toLowerCase();
    
    let rate = BASE_DAILY_REWARD; // Default standard
    
    if (rarityLower.includes('advanced')) {
      rate = ADVANCED_DAILY_REWARD;
    } else if (rarityLower.includes('elite')) {
      rate = ELITE_DAILY_REWARD;
    } else if (rarityLower.includes('prototype')) {
      rate = PROTOTYPE_DAILY_REWARD;
    }
    
    return rate;
  }

  /**
   * Calcola le ricompense totali accumulate per uno stake
   * @param {Object} stake - L'oggetto stake con i dettagli dell'NFT
   * @returns {string} - Le ricompense formattate con 2 decimali
   */
  function calculateRewards(stake) {
    // 1. Ottieni la data di staking corretta con fallback
    let stakeTimestamp = stake.stakeDate || stake.startTime || stake.createdAt;
    
    // Log di debug per verificare il valore della data
    if (config.enableLogging) {
      console.log(`📅 Data di staking originale per NFT: ${JSON.stringify(stakeTimestamp)}`);
    }
    
    // Se la data è in formato stringa ISO, è probabilmente corretta
    const now = new Date();
    let stakeDate;
    
    // Verifica formato e validità della data
    if (stakeTimestamp && typeof stakeTimestamp === 'string') {
      // Prova a interpretare la data
      stakeDate = new Date(stakeTimestamp);
      
      // Se la data non è valida, verifica formati alternativi
      if (isNaN(stakeDate.getTime())) {
        // Prova con format "YYYY-MM-DD"
        if (/^\d{4}-\d{2}-\d{2}/.test(stakeTimestamp)) {
          stakeDate = new Date(stakeTimestamp + 'T00:00:00Z');
        } 
        // Prova con timestamp numerico
        else if (/^\d+$/.test(stakeTimestamp)) {
          stakeDate = new Date(parseInt(stakeTimestamp));
        }
      }
    } else if (stakeTimestamp && typeof stakeTimestamp === 'number') {
      // Se è un timestamp numerico
      stakeDate = new Date(stakeTimestamp);
    } else {
      // Fallback: usa un timestamp di test (1 mese fa)
      stakeDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      console.warn("⚠️ Nessuna data di staking valida trovata, uso data di fallback");
    }
    
    // Ultima verifica validità
    if (isNaN(stakeDate.getTime())) {
      console.error(`❌ Data di staking ancora non valida dopo i tentativi di parsing: ${stakeTimestamp}`);
      stakeDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 giorni fa come fallback
    }
    
    // Validazione aggiuntiva: se la data è nel futuro, usa la data corrente
    if (stakeDate > now) {
      console.warn("⚠️ Data di staking nel futuro, correggo con data corrente");
      stakeDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // Impostiamo a ieri per avere almeno un giorno di staking
    }
    
    if (config.enableLogging) {
      console.log(`📅 Data di staking utilizzata: ${stakeDate.toISOString()}`);
    }
    
    // 2. Calcola il tempo trascorso in giorni (con precisione a 2 decimali)
    const millisPassed = now - stakeDate;
    const daysPassed = Math.max(0, millisPassed / (1000 * 60 * 60 * 24));
    
    // 3. Determina il tasso di ricompensa giornaliera
    const rarityTier = stake.rarityTier || 'Standard';
    let dailyRate = parseFloat(stake.dailyReward) || 0;
    
    // Se il tasso giornaliero non è valido, usa il valore predefinito per la rarità
    if (isNaN(dailyRate) || dailyRate <= 0) {
      dailyRate = getFixedDailyReward(rarityTier);
    }
    
    // 4. Calcola le ricompense totali (giorni × tasso giornaliero)
    const rewards = dailyRate * daysPassed;
    
    // Log dettagliato per debug
    if (config.enableLogging) {
      console.log(`💰 ${rarityTier} NFT: ${dailyRate}/giorno × ${daysPassed.toFixed(2)} giorni = ${rewards.toFixed(2)} IASE`);
    }
    
    // Formattazione della ricompensa (minimo 0.00)
    const formattedRewards = rewards < 0.01 ? '0.00' : rewards.toFixed(2);
    
    return formattedRewards;
  }

  /**
   * Mostra un messaggio di errore nella pagina
   * @param {string} message - Il messaggio di errore da mostrare
   * @param {boolean} isError - Se true, il messaggio è un errore (rosso), altrimenti è un avviso (giallo)
   */
  function showMessage(message, isError = true) {
    if (!domElements.errorContainer) return;
    
    domElements.errorContainer.textContent = message;
    domElements.errorContainer.className = isError ? 'error-message' : 'info-message';
    domElements.errorContainer.style.display = 'block';
    
    // Nascondi il messaggio dopo 5 secondi
    setTimeout(() => {
      domElements.errorContainer.style.display = 'none';
    }, 5000);
  }

  /**
   * Aggiorna lo stato dell'interfaccia in base alla connessione del wallet
   */
  function updateUIState() {
    if (walletConnected && currentWalletAddress) {
      // Wallet connesso
      if (domElements.connectWalletBtn) {
        domElements.connectWalletBtn.textContent = 'Wallet Connected';
        domElements.connectWalletBtn.classList.add('connected');
      }
      
      if (domElements.walletDisplay) {
        const shortAddress = `${currentWalletAddress.substring(0, 6)}...${currentWalletAddress.substring(currentWalletAddress.length - 4)}`;
        domElements.walletDisplay.textContent = shortAddress;
        domElements.walletDisplay.style.display = 'block';
      }
      
      if (domElements.stakingPanel) {
        domElements.stakingPanel.style.display = 'block';
      }
      
      // Avvia il caricamento degli NFT staked
      loadStakedNFTs(currentWalletAddress);
      
      // Imposta timer di aggiornamento automatico
      if (refreshTimer) clearInterval(refreshTimer);
      refreshTimer = setInterval(() => {
        loadStakedNFTs(currentWalletAddress);
      }, config.refreshInterval);
      
    } else {
      // Wallet non connesso
      if (domElements.connectWalletBtn) {
        domElements.connectWalletBtn.textContent = 'Connect Wallet';
        domElements.connectWalletBtn.classList.remove('connected');
      }
      
      if (domElements.walletDisplay) {
        domElements.walletDisplay.style.display = 'none';
      }
      
      if (domElements.stakingPanel) {
        domElements.stakingPanel.style.display = 'none';
      }
      
      // Ferma il timer di aggiornamento
      if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
      }
    }
  }

  /**
   * Gestisce il processo di connessione al wallet
   */
  async function connectWallet() {
    if (walletConnected) {
      console.log('Wallet già connesso:', currentWalletAddress);
      return;
    }
    
    try {
      if (domElements.loadingIndicator) {
        domElements.loadingIndicator.style.display = 'block';
      }
      
      // Utilizza la funzione di connessione del wallet globale
      const address = await window.connectWallet();
      
      if (address) {
        walletConnected = true;
        currentWalletAddress = address;
        console.log('Wallet connesso con successo:', address);
        
        // Aggiorna l'interfaccia
        updateUIState();
      } else {
        showMessage('Impossibile connettersi al wallet. Riprova.');
      }
    } catch (error) {
      console.error('Errore di connessione al wallet:', error);
      showMessage(`Errore di connessione: ${error.message || 'Errore sconosciuto'}`);
    } finally {
      if (domElements.loadingIndicator) {
        domElements.loadingIndicator.style.display = 'none';
      }
    }
  }

  /**
   * Carica gli NFT in staking per un indirizzo wallet
   * @param {string} walletAddress - L'indirizzo del wallet
   */
  async function loadStakedNFTs(walletAddress) {
    if (!walletAddress) {
      console.error('Indirizzo wallet mancante per caricare gli NFT staked');
      return;
    }
    
    try {
      if (domElements.loadingIndicator) {
        domElements.loadingIndicator.style.display = 'block';
      }
      
      // Log per debug
      if (config.enableLogging) {
        console.log(`🔍 Caricamento NFT in staking per: ${walletAddress}`);
      }
      
      // Effettua la richiesta API per ottenere gli NFT in staking
      const response = await fetch(`${config.apiBaseUrl}/api/by-wallet/${walletAddress}`);
      
      if (!response.ok) {
        throw new Error(`Errore API: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (config.enableLogging) {
        console.log(`✅ Dati NFT ricevuti:`, data);
      }
      
      // Visualizza gli NFT nell'interfaccia
      displayStakedNFTs(data.stakes || []);
      
    } catch (error) {
      console.error('Errore nel caricamento degli NFT in staking:', error);
      showMessage(`Errore di caricamento: ${error.message || 'Errore sconosciuto'}`);
      
      // In caso di errore, mostra container vuoto
      if (domElements.stakedNftsContainer) {
        domElements.stakedNftsContainer.innerHTML = `
          <div class="error-state">
            <i class="ri-error-warning-line"></i>
            <h3>Errore di caricamento</h3>
            <p>${error.message || 'Si è verificato un errore nel caricamento degli NFT in staking.'}</p>
          </div>`;
      }
    } finally {
      if (domElements.loadingIndicator) {
        domElements.loadingIndicator.style.display = 'none';
      }
    }
  }

  /**
   * Visualizza gli NFT in staking nell'interfaccia
   * @param {Array} stakedNfts - Array di oggetti NFT in staking
   */
  function displayStakedNFTs(stakedNfts) {
    // Ottieni il container dove visualizzare gli NFT
    const container = domElements.stakedNftsContainer;
    if (!container) {
      console.error('Container degli NFT staked non trovato!');
      return;
    }
    
    // Svuota il container prima di aggiungere nuovi NFT
    container.innerHTML = '';
    
    // Se non ci sono NFT in staking, mostra messaggio appropriato
    if (!stakedNfts || stakedNfts.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="ri-information-line"></i>
          <h3>No Staked NFTs</h3>
          <p>You don't have any NFTs in staking yet. Stake your NFTs to start earning rewards.</p>
        </div>`;
      return;
    }
    
    // Reset dei contatori globali
    let totalRewards = 0;
    let dailyRewards = 0;
    
    // Log informativi per debug
    if (config.enableLogging) {
      console.log(`📊 Iniziando visualizzazione di ${stakedNfts.length} NFT staked`);
    }
    
    // Filtriamo gli NFT per assicurarci che siano tutti validi
    stakedNfts = stakedNfts.filter(stake => {
      // Un NFT valido deve avere almeno un identificatore
      const isValid = stake && (stake.tokenId || stake.token_id || stake.nftId);
      if (!isValid && config.enableLogging) {
        console.warn("⚠️ NFT invalido rimosso:", stake);
      }
      return isValid;
    });
    
    // Conteggio NFT per rarità (per diagnostica)
    if (config.enableLogging) {
      const rarityStats = {};
      stakedNfts.forEach(stake => {
        const rarity = stake.rarityTier || 'Unknown';
        rarityStats[rarity] = (rarityStats[rarity] || 0) + 1;
      });
      
      console.log(`📊 NFT per rarità:`, rarityStats);
      console.log(`📊 NFT da visualizzare: ${stakedNfts.length}`);
    }
    
    // Array per tracciare gli NFT visualizzati
    const displayedNftIds = [];
    
    // Elaborazione di ogni NFT in staking
    for (let i = 0; i < stakedNfts.length; i++) {
      const stake = stakedNfts[i];
      
      // 1. Estrazione token ID con validazione robusta
      let tokenId = stake.tokenId || stake.token_id || "";
      
      // Gestione nftId nei vari formati possibili
      if (!tokenId && stake.nftId) {
        tokenId = stake.nftId.includes('_') ? stake.nftId.split('_')[1] : stake.nftId;
      }
      if (!tokenId && stake.nft_id) {
        tokenId = stake.nft_id.includes('_') ? stake.nft_id.split('_')[1] : stake.nft_id;
      }
      
      // Skip NFT senza tokenId
      if (!tokenId) {
        if (config.enableLogging) {
          console.error(`❌ NFT #${i+1}/${stakedNfts.length} saltato: ID mancante`, stake);
        }
        continue;
      }
      
      // Converti tokenId a stringa e ottieni stakeId
      tokenId = tokenId.toString();
      const stakeId = stake.id || '';
      
      // 2. Assegnazione ID univoco per evitare conflitti
      stake._uniqueId = `${i}_${tokenId}_${stakeId}`;
      displayedNftIds.push(tokenId);
      
      // 3. Estrazione dati per visualizzazione
      // ==========================================
      // a. Rarità dell'NFT
      const rarityTier = stake.rarityTier || 'Standard';
      
      // b. Calcolo ricompense
      const rewards = calculateRewards(stake);
      totalRewards += parseFloat(rewards);
      
      // c. Ricompensa giornaliera
      const dailyReward = parseFloat(stake.dailyReward) || getFixedDailyReward(rarityTier);
      dailyRewards += dailyReward;
      
      // d. Data di staking e durata
      const stakeDate = stake.stakeDate || stake.startTime || stake.createdAt || new Date();
      const stakingDuration = calculateStakingDuration(stakeDate);
      
      // e. Generazione URL immagine usando lo stesso formato IPFS di staking.html
      let imageUrl = `https://nftstorage.link/ipfs/bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/${tokenId}.png`;
      
      // 4. Creazione elemento HTML per l'NFT
      const nftElement = document.createElement('div');
      nftElement.className = 'staked-nft-card';
      nftElement.dataset.tokenId = tokenId;
      nftElement.dataset.stakeId = stakeId;
      nftElement.dataset.rarityTier = rarityTier.toLowerCase();
      
      // Classe aggiuntiva basata sulla rarità
      const rarityClass = 'rarity-' + rarityTier.toLowerCase().replace(/\s+/g, '-');
      nftElement.classList.add(rarityClass);
      
      // 5. Popolamento HTML dell'elemento NFT
      nftElement.innerHTML = `
        <div class="nft-image-container">
          <div class="rarity-badge">${rarityTier}</div>
          <img src="${imageUrl}" alt="NFT #${tokenId}" class="nft-image" 
               onerror="this.onerror=null; this.src='https://nftstorage.link/ipfs/bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/${tokenId}.png';">
        </div>
        <div class="nft-details">
          <h3 class="nft-id">IASE #${tokenId}</h3>
          <div class="stake-info">
            <div class="info-row">
              <span class="label">Staked:</span>
              <span class="value">${formatDate(stakeDate)}</span>
            </div>
            <div class="info-row">
              <span class="label">Duration:</span>
              <span class="value">${stakingDuration}</span>
            </div>
            <div class="info-row">
              <span class="label">Daily:</span>
              <span class="value">${dailyReward.toFixed(2)} IASE</span>
            </div>
            <div class="info-row rewards">
              <span class="label">Rewards:</span>
              <span class="value">${rewards} IASE</span>
            </div>
          </div>
          <div class="nft-actions">
            <button class="unstake-btn" data-token-id="${tokenId}" data-stake-id="${stakeId}">Unstake</button>
            <button class="claim-btn" data-token-id="${tokenId}" data-stake-id="${stakeId}" data-rewards="${rewards}">
              Claim Rewards
            </button>
          </div>
        </div>
      `;
      
      // Aggiungi l'elemento al container
      container.appendChild(nftElement);
      
      // Aggiungi event listener per i pulsanti
      const unstakeBtn = nftElement.querySelector('.unstake-btn');
      if (unstakeBtn) {
        unstakeBtn.addEventListener('click', function() {
          if (typeof window.openUnstakeModal === 'function') {
            window.openUnstakeModal(tokenId, stake);
          } else {
            console.error('La funzione window.openUnstakeModal non esiste a livello globale');
            showMessage('Errore: impossibile aprire la modale di unstake');
          }
        });
      }
      
      // Aggiungi listener per il pulsante claim
      const claimBtn = nftElement.querySelector('.claim-btn');
      if (claimBtn) {
        claimBtn.addEventListener('click', function() {
          // Verifica se ci sono ricompense da riscattare
          const rewardsAmount = this.getAttribute('data-rewards');
          if (parseFloat(rewardsAmount) <= 0) {
            showMessage('Non ci sono ricompense da riscattare per questo NFT.');
            return;
          }
          
          // Apri la modale di claim
          openClaimModal(tokenId, stake, rewardsAmount);
        });
      }
    }
    
    // Questi contatori verranno aggiornati dalla funzione updateRewardsFromDatabase che legge i dati reali dal database
    // Solo i conteggi che non dipendono dalle ricompense vengono aggiornati qui
    
    if (domElements.totalStakedNfts) {
      domElements.totalStakedNfts.textContent = displayedNftIds.length;
    }
    
    // Avvia aggiornamento da database per ottenere i valori reali delle ricompense
    updateRewardsFromDatabase();
  }

  /**
   * @param {string} nftId - L'ID dell'NFT
   * @param {Object} stake - L'oggetto stake con i dettagli dell'NFT
   * @param {string} rewardsAmount - L'ammontare di ricompense da riscattare
   */
  function openClaimModal(nftId, stake, rewardsAmount) {
    if (config.enableLogging) {
      console.log('💰 Apertura modale di claim per NFT #' + nftId, stake, rewardsAmount);
    }
    
    // Se le ricompense sono troppo basse, mostra un messaggio e non aprire la modale
    if (parseFloat(rewardsAmount) <= 0) {
      showMessage('Non ci sono ricompense da riscattare per questo NFT.', true);
      return;
    }
    
    // Ottieni il container per la modale o creane uno se non esiste
    let modalContainer = document.getElementById('claimModalContainer');
    if (!modalContainer) {
      modalContainer = document.createElement('div');
      modalContainer.id = 'claimModalContainer';
      document.body.appendChild(modalContainer);
    }
    
    // Trova la rarità o usa un valore predefinito
    let rarityValue = stake.rarityTier || stake.rarityName || stake.rarity || 'Standard';
    
    // Crea un ID sicuro per la modale
    const safeId = nftId.toString().replace(/[^a-z0-9]/gi, '');
    
    // Crea la modale HTML
    modalContainer.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal claim-modal" id="claimModal_${safeId}">
        <div class="modal-header">
          <h3>Claim Rewards for NFT #${nftId}</h3>
          <button class="modal-close" onclick="closeClaimModal('${safeId}')">&times;</button>
        </div>
        <div class="modal-body">
          <div class="claim-details">
            <p>You are about to claim rewards for your <span class="highlight">${rarityValue}</span> NFT.</p>
            <p>Token ID: <span class="highlight">${nftId}</span></p>
            
            <div class="rewards-summary">
              <p>Available Rewards: <span class="highlight">${rewardsAmount} IASE</span></p>
            </div>
            
            <div class="claim-options">
              <p class="info">Rewards will be added to your wallet balance.</p>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn secondary" onclick="closeClaimModal('${safeId}')">Cancel</button>
          <button class="btn primary" onclick="confirmClaim('${nftId}', '${stake.id || ''}', '${rewardsAmount}', '${safeId}')">Confirm Claim</button>
        </div>
      </div>
    `;
    
    // Aggiungi la modale alla pagina
    document.body.classList.add('modal-open');
  }

  /**
   * Chiude la modale di claim
   * @param {string} safeId - L'ID sicuro della modale
   */
  function closeClaimModal(safeId) {
    const modalElement = document.getElementById(`claimModal_${safeId}`);
    if (modalElement) {
      const modalContainer = modalElement.parentElement;
      if (modalContainer) {
        modalContainer.innerHTML = ''; // Rimuove la modal
      }
    }
    
    document.body.classList.remove('modal-open');
  }

  /**
   * Conferma il claim delle ricompense
   * @param {string} tokenId - L'ID del token
   * @param {string} stakeId - L'ID dello stake
   * @param {string} rewardsAmount - L'ammontare di ricompense da riscattare
   * @param {string} modalId - L'ID della modale
   */
  async function confirmClaim(tokenId, stakeId, rewardsAmount, modalId) {
    if (!tokenId) {
      showMessage('Token ID mancante, impossibile procedere con il claim');
      return;
    }
    
    try {
      if (domElements.loadingIndicator) {
        domElements.loadingIndicator.style.display = 'block';
      }
      
      if (config.enableLogging) {
        console.log(`💰 Claim confermato per NFT #${tokenId}, Rewards: ${rewardsAmount} IASE`);
      }
      
      // Prepara i dati per la richiesta
      const requestData = {
        tokenId: tokenId,
        stakeId: stakeId,
        walletAddress: currentWalletAddress,
        rewardsAmount: rewardsAmount
      };
      
      // Effettua la richiesta API per claim
      const response = await fetch(`${config.apiBaseUrl}/api/mark-claimed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Errore API: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Chiudi la modale
      closeClaimModal(modalId);
      
      // Mostra messaggio di successo
      showMessage(`Ricompense di ${rewardsAmount} IASE reclamate con successo!`, false);
      
      // Aggiorna l'elenco degli NFT staked
      loadStakedNFTs(currentWalletAddress);
      
    } catch (error) {
      console.error('Errore nel claim delle ricompense:', error);
      showMessage(`Errore nel claim: ${error.message || 'Errore sconosciuto'}`);
    } finally {
      if (domElements.loadingIndicator) {
        domElements.loadingIndicator.style.display = 'none';
      }
    }
  }

  /**
   * Gestisce la funzionalità di unstake quando l'utente clicca il pulsante
   * @param {HTMLElement} button - Il pulsante di unstake cliccato
   */
  function handleUnstake(button) {
    if (!button) return;
    
    const tokenId = button.getAttribute('data-token-id');
    const stakeId = button.getAttribute('data-stake-id');
    
    if (!tokenId) {
      showMessage('Token ID mancante, impossibile procedere con l\'unstake');
      return;
    }
    
    // Cerca l'NFT corrispondente negli NFT staked
    fetch(`${config.apiBaseUrl}/api/by-wallet/${currentWalletAddress}`)
      .then(response => response.json())
      .then(data => {
        const stakes = data.stakes || [];
        
        // Trova lo stake corrispondente
        const stake = stakes.find(s => {
          const id = s.tokenId || s.token_id || "";
          return id.toString() === tokenId.toString();
        });
        
        if (stake) {
          // Usa la funzione global window.openUnstakeModal
          if (typeof window.openUnstakeModal === 'function') {
            window.openUnstakeModal(tokenId, stake);
          } else {
            console.error('La funzione window.openUnstakeModal non esiste a livello globale');
            showMessage('Errore: Funzione di unstake non disponibile');
          }
        } else {
          showMessage('NFT non trovato nei tuoi asset in staking');
        }
      })
      .catch(error => {
        console.error('Errore nel recupero degli NFT:', error);
        showMessage('Errore nel recupero delle informazioni NFT');
      });
  }

  /**
   * Richiede gli ultimi dati di ricompensa dal server
   */
  async function updateRewardsFromDatabase() {
    if (!currentWalletAddress) return;
    
    try {
      // Richiedi dati aggiornati delle ricompense
      const response = await fetch(`${config.apiBaseUrl}/api/rewards/${currentWalletAddress}`);
      
      if (!response.ok) {
        throw new Error(`Errore API: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (config.enableLogging) {
        console.log('📊 Dati ricompense dal database:', data);
      }
      
      // Aggiorna i contatori con i dati ricevuti
      if (domElements.totalRewards) {
        // Verifica se i dati contengono il totalRewards
        if (data.totalRewards !== undefined) {
          // Mostra solo se i rewards sono stati effettivamente distribuiti
          if (parseFloat(data.totalRewards) > 0) {
            domElements.totalRewards.textContent = parseFloat(data.totalRewards).toFixed(2);
          } else {
            domElements.totalRewards.textContent = '0.00';
          }
        } 
        // Se i rewards sono forniti come array, calcola la somma
        else if (data.rewards && Array.isArray(data.rewards) && data.rewards.length > 0) {
          const totalRewardsSum = data.rewards.reduce((sum, reward) => sum + (parseFloat(reward.totalReward) || 0), 0);
          domElements.totalRewards.textContent = totalRewardsSum.toFixed(2);
        } else {
          domElements.totalRewards.textContent = '0.00';
        }
      }
      
      if (domElements.dailyRewards) {
        // Verifica se i dati contengono il dailyRewards
        if (data.dailyRewards !== undefined) {
          domElements.dailyRewards.textContent = parseFloat(data.dailyRewards).toFixed(2);
        }
        // Se i rewards sono forniti come array, calcola la somma giornaliera
        else if (data.rewards && Array.isArray(data.rewards) && data.rewards.length > 0) {
          const dailyRewardsSum = data.rewards.reduce((sum, reward) => sum + (parseFloat(reward.dailyReward) || 0), 0);
          domElements.dailyRewards.textContent = dailyRewardsSum.toFixed(2);
        } else {
          domElements.dailyRewards.textContent = '0.00';
        }
      }
      
    } catch (error) {
      console.error('Errore nell\'aggiornamento delle ricompense:', error);
      // Non mostriamo errori all'utente in questa funzione perché è automatica
    }
  }

  /**
   * Registra un nuovo NFT in staking
   * @param {Event} event - L'evento del form submit
   */
  async function submitStakeForm(event) {
    if (event) event.preventDefault();
    
    if (!domElements.stakingForm) {
      console.error('Form di staking non trovato!');
      return;
    }
    
    // Ottieni l'ID del token dal form
    const tokenIdInput = domElements.stakingForm.querySelector('input[name="tokenId"]');
    if (!tokenIdInput || !tokenIdInput.value) {
      showMessage('Inserisci un ID token valido per lo staking');
      return;
    }
    
    const tokenId = tokenIdInput.value.trim();
    
    try {
      if (domElements.loadingIndicator) {
        domElements.loadingIndicator.style.display = 'block';
      }
      
      if (config.enableLogging) {
        console.log(`🔄 Invio richiesta di stake per NFT #${tokenId}`);
      }
      
      // Prepara i dati per la richiesta
      const requestData = {
        tokenId: tokenId,
        walletAddress: currentWalletAddress
      };
      
      // Verifica se l'NFT è già in staking
      const checkResponse = await fetch(`${config.apiBaseUrl}/api/check-staked-nft?tokenId=${tokenId}`);
      const checkData = await checkResponse.json();
      
      if (checkData.isStaked) {
        showMessage(`NFT #${tokenId} è già in staking!`, true);
        return;
      }
      
      // Effettua la richiesta API per stake
      const response = await fetch(`${config.apiBaseUrl}/api/stake`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Errore API: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Reset del form
      tokenIdInput.value = '';
      
      // Mostra messaggio di successo
      showMessage(`NFT #${tokenId} messo in staking con successo!`, false);
      
      // Aggiorna l'elenco degli NFT staked
      loadStakedNFTs(currentWalletAddress);
      
    } catch (error) {
      console.error('Errore nello staking:', error);
      showMessage(`Errore nello staking: ${error.message || 'Errore sconosciuto'}`);
    } finally {
      if (domElements.loadingIndicator) {
        domElements.loadingIndicator.style.display = 'none';
      }
    }
  }

  // Inizializzazione
  function init() {
    // Aggiungi event listener per connessione wallet
    if (domElements.connectWalletBtn) {
      domElements.connectWalletBtn.addEventListener('click', connectWallet);
    }
    
    // Aggiungi event listener per form di staking
    if (domElements.stakingForm) {
      domElements.stakingForm.addEventListener('submit', submitStakeForm);
    }
    
    // Controlla se il wallet è già connesso (utile in caso di refresh)
    if (window.ethereum && window.ethereum.selectedAddress) {
      walletConnected = true;
      currentWalletAddress = window.ethereum.selectedAddress;
      updateUIState();
    }
    
    // Esporta funzioni pubbliche
    window.refreshStakingData = () => loadStakedNFTs(currentWalletAddress);
    window.calculateRewards = calculateRewards;
    window.closeClaimModal = closeClaimModal;
    window.confirmClaim = confirmClaim;
  }

  // Avvia inizializzazione quando DOM è pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
