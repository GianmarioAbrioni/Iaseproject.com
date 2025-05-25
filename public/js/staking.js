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
      displayedNftIds.push(stake._uniqueId);
      
      // 3. Assicurazione dei valori corretti per rarità e reward
      // Utilizziamo i valori provenienti direttamente dal backend
      // o il meccanismo di fallback in caso di dati mancanti
      
      // Garanzia di ricompensa giornaliera valida
      if (!stake.dailyReward || parseFloat(stake.dailyReward) <= 0) {
        stake.dailyReward = getFixedDailyReward(stake.rarityTier || "Standard").toString();
      }
      
      // Log per debug
      if (config.enableLogging) {
        console.log(`✅ NFT #${i+1}: ID=${tokenId}, Rarità=${stake.rarityTier}, Reward=${stake.dailyReward}/giorno`);
      }
      
      // NFT pronto per essere visualizzato nell'interfaccia
      
      // Crea elemento per l'NFT
      const nftElement = document.createElement('div');
      nftElement.classList.add('nft-card');
      nftElement.classList.add('staked');
      
      // Estrazione dei valori necessari per la visualizzazione
      const rarityName = stake.rarityTier || stake.rarityName || stake.rarity || 'Standard';
      const dailyRewardValue = stake.dailyReward || getFixedDailyReward(rarityName);
      const stakeDate = stake.startTime || stake.stakeDate || stake.createdAt;
      
      // Determinazione classe CSS in base alla rarità
      let rarityClass = 'standard'; // Default per qualsiasi NFT
      
      // Applicazione classe corretta per ogni rarità
      if (rarityName.toLowerCase().includes('advanced')) rarityClass = 'advanced';
      if (rarityName.toLowerCase().includes('elite')) rarityClass = 'elite';
      if (rarityName.toLowerCase().includes('prototype')) rarityClass = 'prototype';
      
      // Rimuoviamo questa parte perché usiamo direttamente l'URL IPFS
      
      if (config.enableLogging) {
        console.log(`🎯 NFT #${tokenId} - Rarità: ${rarityName}, Daily: ${dailyRewardValue}, Data: ${stakeDate}`);
      }
      
      // Calcolo ricompense con gestione robusta degli errori
      
      // 1. Ricompensa giornaliera (conversione sicura a numero)
      const dailyRewardNumeric = parseFloat(dailyRewardValue) || 0;
      dailyRewards += dailyRewardNumeric;
      
      // 2. Ricompense accumulate
      const accumulatedRewards = calculateRewards(stake);
      const accumulatedNumeric = parseFloat(accumulatedRewards) || 0;
      totalRewards += accumulatedNumeric;
      
      // Log riassuntivo per questo NFT
      if (config.enableLogging) {
        console.log(`💰 NFT #${tokenId}: ${dailyRewardNumeric.toFixed(2)}/giorno, Accumulato=${accumulatedNumeric.toFixed(2)}`);
      }
      
      // Log dei totali aggiornati
      if (config.enableLogging && i === stakedNfts.length - 1) {
        console.log(`📈 TOTALI FINALI: ${dailyRewards.toFixed(2)}/giorno, Accumulato=${totalRewards.toFixed(2)}`);
      }
      
      // Imposta HTML con i dati dell'NFT - stesso approccio usato per NFT disponibili
      nftElement.innerHTML = `
        <div class="nft-image">
          <img src="${stake.nft?.image || stake.image || `/images/nft/iase-unit-${tokenId}.png`}" alt="NFT #${tokenId}" id="nftImage_${tokenId}" loading="lazy" onerror="this.onerror=null; this.src='https://nftstorage.link/ipfs/bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/${tokenId}.png'">
          <div class="staked-badge">Staked</div>
        </div>
        <div class="nft-details">
          <h3 class="nft-title">IASE Unit #${tokenId}</h3>
          <div class="nft-id">Token ID: ${tokenId}</div>
          <div class="rarity-badge ${rarityClass}" id="rarityBadge_${tokenId}">${rarityName.toUpperCase()}</div>
          
          <div class="staking-info">
            <div class="staking-duration">
              <span class="info-label">Staked For:</span>
              <span class="info-value">${calculateStakingDuration(stakeDate)}</span>
            </div>
            <div class="reward-rate">
              <span class="info-label">Daily Rate:</span>
              <span class="info-value" id="dailyRate_${tokenId}">${dailyRewardValue} IASE/day</span>
            </div>
            <div class="reward-info">
              <span class="info-label">Rewards:</span>
              <span class="info-value" id="rewardValue_${tokenId}">${stake.totalRewards || 0} IASE</span>
            </div>
          </div>
          
          <div class="nft-card-actions">
            <button class="btn stake-btn unstake-btn" data-nft-id="${tokenId}">
              <i class="ri-logout-box-line"></i> Unstake
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
          openUnstakeModal(tokenId, stake);
        });
      }
    }
    
    // Aggiornamento contatori nella dashboard
    if (config.enableLogging) {
      console.log(`📊 Riepilogo finale staking:`);
      console.log(`   - NFT visualizzati: ${displayedNftIds.length} su ${stakedNfts.length}`);
      console.log(`   - Ricompense giornaliere: ${dailyRewards.toFixed(2)} IASE`);
      console.log(`   - Ricompense accumulate: ${totalRewards.toFixed(2)} IASE`);
    }
    
    // Ottieni i dati delle ricompense autentiche dal database
    async function updateRewardsFromDatabase() {
      try {
        const walletAddress = window.ethereum?.selectedAddress;
        if (!walletAddress) return;
        
        // Ottieni le rewards dal database per aggiornare la dashboard
        const response = await fetch(`/api/rewards/${walletAddress}`);
        
        if (response.ok) {
          const rewards = await response.json();
          let dbTotalRewards = 0;
          
          // Calcola il totale dal database
          rewards.forEach(reward => {
            dbTotalRewards += reward.totalReward || 0;
          });
          
          console.log(`💰 Ricompense dal database: ${dbTotalRewards.toFixed(2)} IASE`);
          console.log(`📊 Ricompense calcolate dal frontend: ${totalRewards.toFixed(2)} IASE`);
          
          // Salviamo sia i valori dal database che quelli calcolati dal frontend
          window.dbTotalRewards = dbTotalRewards;
          window.totalRewards = totalRewards;
          window.dailyRewards = dailyRewards;
          
          // Aggiorniamo gli elementi UI con i dati dal database
          if (domElements.totalRewards) {
            domElements.totalRewards.textContent = `${dbTotalRewards.toFixed(2)} IASE`;
          }
        } else {
          // Se non possiamo ottenere i dati dal database, mostriamo i calcoli frontend ma con una nota
          console.warn("⚠️ Impossibile ottenere dati dal database, usando calcoli frontend");
          
          if (domElements.totalRewards) {
            domElements.totalRewards.textContent = `${totalRewards.toFixed(2)} IASE*`;
          }
        }
      } catch (error) {
        console.error("❌ Errore nel recupero delle ricompense dal database:", error);
      }
    }
    
    // Aggiorna elementi UI che non richiedono dati dal database
    if (domElements.dailyRewards) {
      domElements.dailyRewards.textContent = `${dailyRewards.toFixed(2)} IASE`;
    }
    
    if (domElements.totalStakedNfts) {
      domElements.totalStakedNfts.textContent = displayedNftIds.length;
    }
    
    // Avvia aggiornamento da database
    updateRewardsFromDatabase();
  }

  /**
   * Apre la modale di unstake per confermare l'operazione
   * @param {string} nftId - L'ID dell'NFT da unstakare
   * @param {Object} stake - L'oggetto stake con i dettagli dell'NFT
   */
  function openUnstakeModal(nftId, stake) {
    if (config.enableLogging) {
      console.log('🔄 Apertura modale di unstake per NFT #' + nftId, stake);
    }
    
    // Ottieni il container per la modale o creane uno se non esiste
    let modalContainer = document.getElementById('unstakeModalContainer');
    if (!modalContainer) {
      modalContainer = document.createElement('div');
      modalContainer.id = 'unstakeModalContainer';
      document.body.appendChild(modalContainer);
    }
    
    // Trova la rarità o usa un valore predefinito
    let rarityValue = stake.rarityTier || stake.rarityName || stake.rarity || 'Standard';
    
    // Crea un ID sicuro per la modale
    const safeId = nftId.toString().replace(/[^a-z0-9]/gi, '');
    
    // Crea la modale HTML
    modalContainer.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal unstake-modal" id="unstakeModal_${safeId}">
        <div class="modal-header">
          <h3>Unstake NFT #${nftId}</h3>
          <button class="modal-close" onclick="closeUnstakeModal('${safeId}')">&times;</button>
        </div>
        <div class="modal-body">
          <div class="unstake-details">
            <p>Are you sure you want to unstake your <span class="highlight">${rarityValue}</span> NFT?</p>
            <p>Token ID: <span class="highlight">${nftId}</span></p>
            <p class="warning">Warning: Unstaking will stop reward accumulation for this NFT.</p>
            
            <div class="rewards-summary">
              <p>Accumulated Rewards: <span class="highlight">${calculateRewards(stake)} IASE</span></p>
            </div>
            
            <div class="unstake-options">
              <label class="checkbox-container">
                <input type="checkbox" id="claimRewardsCheckbox_${safeId}" checked>
                <span class="checkmark"></span>
                Also claim accumulated rewards
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn secondary" onclick="closeUnstakeModal('${safeId}')">Cancel</button>
          <button class="btn primary" onclick="confirmUnstake('${nftId}', '${stake.id || ''}', '${safeId}')">Confirm Unstake</button>
        </div>
      </div>
    `;
    
    // Aggiungi la modale alla pagina
    document.body.classList.add('modal-open');
    
    // Registra la funzione globale per chiudere la modale
    window.closeUnstakeModal = function(modalId) {
      const modal = document.getElementById(`unstakeModal_${modalId}`);
      if (modal && modal.parentNode) {
        document.body.classList.remove('modal-open');
        modalContainer.innerHTML = '';
      }
    };
  }

  /**
   * Conferma l'operazione di unstake di un NFT
   * @param {string} tokenId - L'ID del token NFT
   * @param {string} stakeId - L'ID dello stake nel database
   * @param {string} modalId - L'ID della modale per chiuderla dopo l'operazione
   */
  async function confirmUnstake(tokenId, stakeId, modalId) {
    if (!tokenId) {
      showMessage('Token ID mancante, impossibile procedere con l\'unstake');
      return;
    }
    
    try {
      if (domElements.loadingIndicator) {
        domElements.loadingIndicator.style.display = 'block';
      }
      
      // Verifica se l'utente vuole anche riscattare le ricompense
      const claimCheckbox = document.getElementById(`claimRewardsCheckbox_${modalId}`);
      const shouldClaimRewards = claimCheckbox && claimCheckbox.checked;
      
      if (config.enableLogging) {
        console.log(`🔄 Unstake confermato per NFT #${tokenId}, Stake ID: ${stakeId}, Claim: ${shouldClaimRewards}`);
      }
      
      // Prepara i dati per la richiesta
      const requestData = {
        tokenId: tokenId,
        stakeId: stakeId,
        walletAddress: currentWalletAddress,
        claimRewards: shouldClaimRewards
      };
      
      // Effettua la richiesta API per unstake
      const response = await fetch(`${config.apiBaseUrl}/api/unstake`, {
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
      
      if (config.enableLogging) {
        console.log('✅ Unstake completato con successo:', result);
      }
      
      // Chiudi la modale
      window.closeUnstakeModal(modalId);
      
      // Mostra messaggio di successo
      showMessage('NFT unstaked con successo!' + (shouldClaimRewards ? ' Ricompense riscattate.' : ''), false);
      
      // Ricarica gli NFT staked per aggiornare la vista
      loadStakedNFTs(currentWalletAddress);
      
    } catch (error) {
      console.error('Errore durante l\'unstake:', error);
      showMessage(`Errore durante l'unstake: ${error.message || 'Errore sconosciuto'}`);
    } finally {
      if (domElements.loadingIndicator) {
        domElements.loadingIndicator.style.display = 'none';
      }
    }
  }

  /**
   * Apre la modale di claim per riscattare le ricompense di un NFT
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
              <p>Accumulated Rewards: <span class="highlight">${rewardsAmount} IASE</span></p>
            </div>
            
            <p class="note">Rewards will be sent to your connected wallet.</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn secondary" onclick="closeClaimModal('${safeId}')">Cancel</button>
          <button class="btn primary" onclick="confirmClaim('${nftId}', '${stake.id || ''}', '${rewardsAmount}', '${safeId}')">Claim Rewards</button>
        </div>
      </div>
    `;
    
    // Aggiungi la modale alla pagina
    document.body.classList.add('modal-open');
    
    // Registra la funzione globale per chiudere la modale
    window.closeClaimModal = function(modalId) {
      const modal = document.getElementById(`claimModal_${modalId}`);
      if (modal && modal.parentNode) {
        document.body.classList.remove('modal-open');
        modalContainer.innerHTML = '';
      }
    };
  }

  /**
   * Conferma l'operazione di claim delle ricompense di un NFT
   * @param {string} tokenId - L'ID del token NFT
   * @param {string} stakeId - L'ID dello stake nel database
   * @param {string} rewardsAmount - L'ammontare di ricompense da riscattare
   * @param {string} modalId - L'ID della modale per chiuderla dopo l'operazione
   */
  async function confirmClaim(tokenId, stakeId, rewardsAmount, modalId) {
    if (!tokenId || !stakeId) {
      showMessage('Informazioni mancanti, impossibile procedere con il claim');
      return;
    }
    
    try {
      if (domElements.loadingIndicator) {
        domElements.loadingIndicator.style.display = 'block';
      }
      
      if (config.enableLogging) {
        console.log(`💰 Claim confermato per NFT #${tokenId}, Stake ID: ${stakeId}, Rewards: ${rewardsAmount}`);
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
      
      if (config.enableLogging) {
        console.log('✅ Claim completato con successo:', result);
      }
      
      // Chiudi la modale
      window.closeClaimModal(modalId);
      
      // Mostra messaggio di successo
      showMessage(`Ricompense riscattate con successo: ${rewardsAmount} IASE!`, false);
      
      // Ricarica gli NFT staked per aggiornare la vista
      loadStakedNFTs(currentWalletAddress);
      
    } catch (error) {
      console.error('Errore durante il claim delle ricompense:', error);
      showMessage(`Errore durante il claim: ${error.message || 'Errore sconosciuto'}`);
    } finally {
      if (domElements.loadingIndicator) {
        domElements.loadingIndicator.style.display = 'none';
      }
    }
  }

  /**
   * Gestisce il processo di stake di un NFT
   * @param {Event} e - L'evento del form
   */
  async function handleStake(e) {
    if (e) e.preventDefault();
    
    if (!walletConnected || !currentWalletAddress) {
      showMessage('Connetti il wallet prima di procedere con lo stake');
      return;
    }
    
    // Ottieni il tokenId dal form
    const tokenIdInput = document.getElementById('tokenIdInput');
    if (!tokenIdInput || !tokenIdInput.value) {
      showMessage('Inserisci un Token ID valido');
      return;
    }
    
    const tokenId = tokenIdInput.value.trim();
    
    try {
      if (domElements.loadingIndicator) {
        domElements.loadingIndicator.style.display = 'block';
      }
      
      if (config.enableLogging) {
        console.log(`🔄 Avvio processo di stake per NFT #${tokenId}`);
      }
      
      // Prepara i dati per la richiesta
      const requestData = {
        tokenId: tokenId,
        walletAddress: currentWalletAddress
      };
      
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
      
      if (config.enableLogging) {
        console.log('✅ Stake completato con successo:', result);
      }
      
      // Resetta il form
      if (tokenIdInput) {
        tokenIdInput.value = '';
      }
      
      // Mostra messaggio di successo
      showMessage(`NFT #${tokenId} staked con successo!`, false);
      
      // Ricarica gli NFT staked per aggiornare la vista
      loadStakedNFTs(currentWalletAddress);
      
    } catch (error) {
      console.error('Errore durante lo stake:', error);
      showMessage(`Errore durante lo stake: ${error.message || 'Errore sconosciuto'}`);
    } finally {
      if (domElements.loadingIndicator) {
        domElements.loadingIndicator.style.display = 'none';
      }
    }
  }

  /**
   * Gestisce il processo di unstake di un NFT
   * @param {HTMLElement} button - Il pulsante che ha attivato l'unstake
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
        const stake = stakes.find(s => 
          (s.tokenId === tokenId || s.token_id === tokenId) && 
          (!stakeId || s.id === stakeId)
        );
        
        if (stake) {
          // Verifica se esiste la funzione openUnstakeModal in staking.html
          if (typeof window.openUnstakeModal === 'function') {
            window.openUnstakeModal(tokenId, stake);
          } else {
            // Se non è definita globalmente, cerca il modale HTML fisso
            const unstakeModal = document.getElementById('unstakeModal');
            if (unstakeModal) {
              // Utilizza direttamente il modale HTML fisso
              unstakeModal.setAttribute('data-token-id', tokenId);
              unstakeModal.setAttribute('data-stake-id', stake.id || '');
              
              // Aggiorna elementi UI nel modal
              const unstakeNftTitle = document.getElementById('unstakeNftTitle');
              const unstakeNftId = document.getElementById('unstakeNftId');
              const unstakeNftRewards = document.getElementById('unstakeNftRewards');
              
              if (unstakeNftTitle) unstakeNftTitle.textContent = `IASE Unit #${tokenId}`;
              if (unstakeNftId) unstakeNftId.textContent = `Token ID: ${tokenId}`;
              if (unstakeNftRewards) unstakeNftRewards.textContent = `${calculateRewards(stake)} IASE`;
              
              // Mostra il modal
              unstakeModal.style.display = 'block';
            } else {
              // Se non esiste neanche il modale HTML, usa quello definito in questo file
              openUnstakeModal(tokenId, stake);
            }
          }
        } else {
          showMessage('NFT non trovato negli NFT in staking');
        }
      })
      .catch(error => {
        console.error('Errore durante il recupero dei dati dell\'NFT:', error);
        showMessage(`Errore: ${error.message || 'Errore sconosciuto'}`);
      });
  }

  // Inizializzazione quando il DOM è caricato
  document.addEventListener('DOMContentLoaded', function() {
    // Controlla se il wallet è già connesso
    if (window.isWalletConnected && window.ethereum && window.ethereum.selectedAddress) {
      currentWalletAddress = window.ethereum.selectedAddress;
      walletConnected = true;
      updateUIState();
    }
    
    // Aggiungi event listener per il pulsante di connessione wallet
    if (domElements.connectWalletBtn) {
      domElements.connectWalletBtn.addEventListener('click', connectWallet);
    }
    
    // Aggiungi event listener per il form di stake
    if (domElements.stakingForm) {
      domElements.stakingForm.addEventListener('submit', handleStake);
    }
    
    // Inizializza l'interfaccia
    updateUIState();
    
    // Aggiungi event listener per l'evento personalizzato staking:loadNFTs da staking.html
    document.addEventListener('staking:loadNFTs', function() {
      if (config.enableLogging) {
        console.log('📋 Ricevuto evento staking:loadNFTs da staking.html');
      }
      
      // Se il wallet è connesso, carica gli NFT in staking
      if (window.ethereum && window.ethereum.selectedAddress) {
        loadStakedNFTs(window.ethereum.selectedAddress);
      } else {
        console.log('⚠️ Wallet non connesso, impossibile caricare gli NFT in staking');
      }
    });
    
    // Event listener per l'evento di aggiornamento (refresh)
    document.addEventListener('staking:refresh', function() {
      if (config.enableLogging) {
        console.log('📋 Ricevuto evento staking:refresh da staking.html');
      }
      
      // Se il wallet è connesso, aggiorna gli NFT in staking
      if (window.ethereum && window.ethereum.selectedAddress) {
        loadStakedNFTs(window.ethereum.selectedAddress);
      }
    });
    
    if (config.enableLogging) {
      console.log('✅ Inizializzazione staking completata');
    }
  });

  // Esporta funzioni globali per uso esterno
  window.handleStake = handleStake;
  window.handleUnstake = handleUnstake;
  window.confirmUnstake = confirmUnstake;
  window.confirmClaim = confirmClaim;
  window.loadStakedNFTs = loadStakedNFTs;
  window.closeUnstakeModal = function(safeId) {
    const modalElement = document.getElementById(`unstakeModal_${safeId}`);
    if (modalElement) {
      const modalContainer = modalElement.parentElement;
      if (modalContainer) {
        modalContainer.innerHTML = ''; // Rimuove la modal
      }
    }
  };
  window.closeClaimModal = function() {};
})();