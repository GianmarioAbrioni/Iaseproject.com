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
    // Log informativi per debug
    if (config.enableLogging) {
      console.log(`📊 Ricevuti ${stakedNfts?.length || 0} NFT in staking dal database`);
    }
    
    // Reset dei contatori globali
    let totalRewards = 0;
    let dailyRewards = 0;
    
    // Filtriamo gli NFT per assicurarci che siano tutti validi
    const validStakedNfts = stakedNfts ? stakedNfts.filter(stake => {
      // Un NFT valido deve avere almeno un identificatore
      const isValid = stake && (stake.tokenId || stake.token_id || stake.nftId);
      if (!isValid && config.enableLogging) {
        console.warn("⚠️ NFT invalido rimosso:", stake);
      }
      return isValid;
    }) : [];
    
    // Conteggio NFT per rarità (solo per log diagnostici)
    if (config.enableLogging && validStakedNfts.length > 0) {
      const rarityStats = {};
      validStakedNfts.forEach(stake => {
        const rarity = stake.rarityTier || 'Unknown';
        rarityStats[rarity] = (rarityStats[rarity] || 0) + 1;
      });
      
      console.log(`📊 NFT per rarità:`, rarityStats);
      console.log(`📊 NFT validi: ${validStakedNfts.length}`);
    }
    
    // Calcola ricompense totali e giornaliere
    if (validStakedNfts && validStakedNfts.length > 0) {
      validStakedNfts.forEach(stake => {
        // Estrai rarità
        const rarityTier = stake.rarityTier || stake.rarity || 'Standard';
        
        // Calcolo delle ricompense
        const rewards = calculateRewards(stake);
        totalRewards += parseFloat(rewards);
        
        // Determina la ricompensa giornaliera
        const dailyReward = parseFloat(stake.dailyReward) || getFixedDailyReward(rarityTier);
        dailyRewards += dailyReward;
      });
    }
    
    // Aggiorna i contatori nell'interfaccia
    if (domElements.totalStakedNfts) {
      domElements.totalStakedNfts.textContent = validStakedNfts.length;
    }
    
    // Aggiorna i contatori delle ricompense nell'interfaccia
    if (domElements.dailyRewards) {
      domElements.dailyRewards.textContent = dailyRewards.toFixed(2);
    }
    
    // Aggiorna le ricompense dal database per valori più accurati
    updateRewardsFromDatabase(currentWalletAddress);
    
    // Passa i dati globalmente per staking.html
    window.currentStakedNFTs = validStakedNfts;
    
    // Triggera un evento personalizzato per informare staking.html che i dati sono pronti
    const nftDataEvent = new CustomEvent('stakedNFTsDataReady', { detail: validStakedNfts });
    document.dispatchEvent(nftDataEvent);
    
    // Log finale con statistiche
    if (config.enableLogging) {
      console.log(`📊 Elaborati ${validStakedNfts.length} NFT staked`);
      console.log(`📊 Ricompense giornaliere calcolate: ${dailyRewards.toFixed(2)} IASE`);
      console.log(`📊 Ricompense totali calcolate: ${totalRewards.toFixed(2)} IASE`);
    }
  }

  /**
   * Aggiorna le ricompense visualizzate con dati aggiornati dal database
   * @param {string} walletAddress - L'indirizzo del wallet
   */
  async function updateRewardsFromDatabase(walletAddress) {
    if (!walletAddress) return;
    
    try {
      // Ottieni le ricompense dal database
      const response = await fetch(`${config.apiBaseUrl}/api/rewards/${walletAddress}`);
      
      if (!response.ok) {
        console.error(`Errore recupero ricompense: ${response.status}`);
        return;
      }
      
      const rewardsData = await response.json();
      
      // Aggiorna i contatori con i dati ricevuti
      if (rewardsData && rewardsData.totalRewards !== undefined) {
        if (domElements.totalRewards) {
          domElements.totalRewards.textContent = parseFloat(rewardsData.totalRewards).toFixed(2);
        }
        
        // Log di debug
        if (config.enableLogging) {
          console.log(`📊 Ricompense totali dal database: ${rewardsData.totalRewards}`);
        }
      }
    } catch (error) {
      console.error('Errore nel recupero delle ricompense dal database:', error);
    }
  }

  /**
   * Gestisce chiusura della modale di claim
   */
  function closeClaimModal() {
    const claimModal = document.getElementById('claimModal');
    if (claimModal) {
      claimModal.style.display = 'none';
    }
  }

  /**
   * Conferma il claim delle ricompense
   */
  async function confirmClaim() {
    if (!currentWalletAddress) {
      showMessage('Wallet non connesso. Connetti il wallet prima di procedere.', true);
      return;
    }
    
    try {
      // Ottieni il totale delle ricompense
      const totalRewardsValue = parseFloat(domElements.totalRewards?.textContent || '0.00');
      
      // Skip se non ci sono ricompense
      if (totalRewardsValue <= 0) {
        showMessage('Non hai ricompense da reclamare.', true);
        closeClaimModal();
        return;
      }
      
      // Marca le ricompense come reclamate
      const response = await fetch(`${config.apiBaseUrl}/api/mark-claimed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          walletAddress: currentWalletAddress,
          amount: totalRewardsValue
        })
      });
      
      if (!response.ok) {
        throw new Error(`Errore API: ${response.status}`);
      }
      
      // Aggiorna la UI
      showMessage(`Hai reclamato con successo ${totalRewardsValue} IASE tokens!`, false);
      closeClaimModal();
      
      // Ricarica i dati di staking
      loadStakedNFTs(currentWalletAddress);
      
    } catch (error) {
      console.error('Errore durante il claim delle ricompense:', error);
      showMessage(`Errore durante il claim: ${error.message}`, true);
    }
  }

  // Inizializzazione dell'app
  function init() {
    // Verifica se il wallet è già connesso
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