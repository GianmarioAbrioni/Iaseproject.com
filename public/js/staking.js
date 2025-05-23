/**
 * IASE Project - Staking NFT
 * Modulo principale per il funzionamento del sistema di staking
 * 
 * Questo file gestisce il caricamento e la visualizzazione degli NFT,
 * utilizzando il metodo di scansione diretta implementato in nftReader.js
 * con approccio balanceOf + ownerOf per massima compatibilità
 * 
 * Versione 1.4.0 - 2025-05-17
 * - Rimosso import ES6 per compatibilità cross-browser
 * - Utilizzo di funzioni globali da window (caricate da nftReader.js)
 * - Ottimizzazione per Render con hardcoded values
 * - Migliorata gestione della risposta API da PostgreSQL
 * - Risolti conflitti di funzione tra script multipli
 * - Supporto per configurazione tramite window.STAKING_CONFIG
 * - Corretti errori sintattici nelle funzioni principali
 * - Rimozione completa di localStorage per evitare inconsistenze
 * - Implementata pulizia della cache dopo operazioni di staking/unstaking
 */

// Verifica se esiste già un oggetto di configurazione globale, altrimenti crea uno predefinito
// Configurazione di default se non è già definita
// Questa è la configurazione usata dalla versione unificata di staking.js
window.STAKING_CONFIG = window.STAKING_CONFIG || {
  apiEndpoint: '/api',
  enableDebug: true,
  usePatchedVersion: true,
  forceApiForStakedNfts: true,
  prioritizeApiStakingData: true,
  useObsoleteEndpoint: false,
  version: '1.4.0',
  debug: false,
  apiEndpoint: '/api',
  usePatchedVersion: true,
  logApi: false
};

// Imposta la funzione di log in base alla configurazione
const logDebug = window.STAKING_CONFIG.debug 
  ? function(...args) { console.log(...args); }
  : function() {}; // No-op quando debug è false

logDebug('🚀 IASE Staking Module v1.4.0 - Inizializzazione con configurazione:', window.STAKING_CONFIG);

/**
 * Restituisce il valore fisso di reward giornaliero in base alla rarità
 * @param {string} rarity - La rarità dell'NFT (Standard, Advanced, Elite, Prototype)
 * @returns {number} Il valore della ricompensa giornaliera
 */
function getFixedDailyReward(rarity) {
  rarity = (rarity || '').toLowerCase();
  switch (rarity) {
    case 'standard':
      return 33.33;
    case 'advanced':
      return 50;
    case 'elite':
      return 66.67;
    case 'prototype':
      return 83.33;
    default:
      return 33.33; // Default a Standard se rarità non riconosciuta
  }
}

// Funzione di compatibilità per getDailyReward
function getDailyReward(metadata) {
  let rarity = 'standard';
  
  if (typeof metadata === 'string') {
    rarity = metadata.toLowerCase();
  } else if (metadata && metadata.rarity) {
    rarity = metadata.rarity.toLowerCase();
  }
  
  return getFixedDailyReward(rarity);
}

/**
 * Calcola la durata dello staking in formato leggibile
 * @param {string|Date} stakeDate - La data di inizio staking
 * @returns {string} La durata formattata
 */
function calculateStakingDuration(stakeDate) {
  if (!stakeDate) return 'Unknown';
  
  const startDate = new Date(stakeDate);
  const now = new Date();
  const daysPassed = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
  
  if (daysPassed === 0) return 'Today';
  if (daysPassed === 1) return '1 day';
  return `${daysPassed} days`;
}

/**
 * Calcola il tasso giornaliero di ricompensa basato sulla rarità
 * @param {string} rarityName - La rarità dell'NFT
 * @returns {string} Il tasso formattato
 */
function calculateDailyRate(rarityName) {
  const rarityLower = rarityName.toLowerCase();
  let rate = BASE_DAILY_REWARD; // Default standard
  
  if (rarityLower.includes('advanced')) {
    rate = ADVANCED_DAILY_REWARD;
  } else if (rarityLower.includes('elite')) {
    rate = ELITE_DAILY_REWARD;
  } else if (rarityLower.includes('prototype')) {
    rate = PROTOTYPE_DAILY_REWARD;
  }
  
  return rate.toFixed(2);
}

/**
 * Calcola le ricompense totali per uno stake
 * @param {Object} stake - L'oggetto stake
 * @returns {string} Le ricompense formattate
 */
function calculateRewards(stake) {
  // Verifica se abbiamo dati sulle ricompense dal database
  if (stake.rewards && Array.isArray(stake.rewards)) {
    // Somma tutte le ricompense non rivendicate
    const totalRewards = stake.rewards
      .filter(reward => !reward.claimed)
      .reduce((sum, reward) => sum + (parseFloat(reward.amount) || 0), 0);
    return totalRewards.toFixed(2);
  }
  
  // Altrimenti, stima in base ai giorni di staking e alla rarità
  const stakeDate = new Date(stake.stakeDate || stake.stake_date || Date.now());
  const now = new Date();
  const daysPassed = Math.floor((now - stakeDate) / (1000 * 60 * 60 * 24));
  
  const rarityName = stake.rarityName || stake.rarity || 'Standard';
  const dailyRate = parseFloat(calculateDailyRate(rarityName));
  
  return (dailyRate * daysPassed).toFixed(2);
}

// Utilizzo delle funzioni globali caricate da nftReader.js
// Le funzioni sono disponibili globalmente tramite window
const getUserNFTs = window.getUserNFTs;
const getNFTMetadata = window.getNFTMetadata;
const loadAllIASENFTs = window.loadAllIASENFTs;

// Costanti di configurazione (dinamiche per funzionare su tutti i domini)
const STAKING_API_ENDPOINT = window.location.origin; // Usa l'origine corrente (protocol + domain)
const IASE_NFT_CONTRACT = window.NFT_CONTRACT_ADDRESS || '0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F';
// Configurazione Alchemy API (priorità principale)
const ALCHEMY_API_KEY = window.ALCHEMY_API_KEY || 'uAZ1tPYna9tBMfuTa616YwMcgptV_1vB';
const ALCHEMY_API_URL = `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
// Retrocompatibilità
const INFURA_API_KEY = window.INFURA_API_KEY || '84ed164327474b4499c085d2e4345a66';

// Costanti per le ricompense di staking (valori fissi in base alla rarità)
const BASE_DAILY_REWARD = 33.33; // Standard (1.0x)
const ADVANCED_DAILY_REWARD = 50.00; // Advanced (1.5x)
const ELITE_DAILY_REWARD = 66.67; // Elite (2.0x)
const PROTOTYPE_DAILY_REWARD = 83.33; // Prototype (2.5x)

// Elementi DOM 
const domElements = {
  availableNftsContainer: document.getElementById('availableNftsContainer'),
  stakedNftsContainer: document.getElementById('stakedNftsContainer'),
  walletButton: document.getElementById('walletConnectBtn'),
  statusIndicator: document.getElementById('connectionStatus'),
  totalRewards: document.getElementById('totalRewards'),
  dailyRewards: document.getElementById('dailyRewards'),
  pendingRewards: document.getElementById('pendingRewards')
};

/**
 * Inizializzazione al caricamento della pagina
 */
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Initializing staking module v1.4.0...');
  
  // Ascolta eventi dal wallet connector
  setupWalletEvents();
  
  // Configura i tabs della dashboard
  setupDashboardTabs();
});

/**
 * Configura gli ascoltatori di eventi dal wallet connector
 */
function setupWalletEvents() {
  // Evento: wallet connesso
  window.addEventListener('wallet:connected', async function(event) {
    // Correzione: event.detail è un oggetto con proprietà {address, shortAddress, chainId}
    const walletAddress = event.detail.address;
    console.log(`✅ Wallet connected: ${walletAddress} (${event.detail.shortAddress}, Chain: ${event.detail.chainId})`);
    
    // Salva l'indirizzo del wallet in una variabile globale per operazioni future
    window.currentWalletAddress = walletAddress;
    
    // Carica gli NFT in staking con un piccolo ritardo per evitare race conditions
    setTimeout(async () => {
      try {
        console.log("🔄 Caricamento NFT in staking dopo connessione wallet...");
        await loadStakedNfts();
      } catch (err) {
        console.error("Errore nel caricamento degli NFT in staking:", err);
      }
      
      // Carica gli NFT disponibili solo dopo aver terminato il caricamento degli NFT in staking
      setTimeout(async () => {
        try {
          console.log("🔄 Caricamento NFT disponibili dopo connessione wallet...");
          await loadAvailableNfts();
        } catch (err) {
          console.error("Errore nel caricamento degli NFT disponibili:", err);
        }
      }, 1000);
    }, 500);
  });
  
  // Evento: wallet disconnesso
  window.addEventListener('wallet:disconnected', function() {
    console.log('⚠️ Wallet disconnected');
    
    // Pulisci l'interfaccia quando il wallet si disconnette
    clearNftsUI();
    
    // Rimuovi l'indirizzo del wallet dalla memoria
    window.currentWalletAddress = null;
  });
  
  // Evento per caricamento manuale NFT
  window.addEventListener('manual:loadNFTs', async function(event) {
    console.log('🔄 Manual NFT loading requested', event.detail);
    
    // Se c'è un address specifico nell'evento, usalo
    if (event.detail && event.detail.address) {
      window.currentWalletAddress = event.detail.address;
    }
    
    // Carica prima gli NFT in staking, poi quelli disponibili con un ritardo
    setTimeout(async () => {
      await loadStakedNfts();
      
      setTimeout(async () => {
        await loadAvailableNfts();
      }, 1000);
    }, 500);
  });
}

/**
 * Configura i tabs della dashboard
 */
function setupDashboardTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const tabName = this.getAttribute('data-tab');
      
      // Rimuovi la classe active da tutti i pulsanti e contenuti
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Aggiungi la classe active al pulsante e contenuto corrente
      this.classList.add('active');
      document.getElementById(`${tabName}Tab`).classList.add('active');
    });
  });
}

/**
 * Pulisce l'interfaccia NFT quando il wallet si disconnette
 */
function clearNftsUI() {
  // Pulisci container NFT in staking
  if (domElements.stakedNftsContainer) {
    domElements.stakedNftsContainer.innerHTML = `
      <div class="empty-state">
        <i class="ri-information-line"></i>
        <p>Connect your wallet to view your staked NFTs.</p>
      </div>`;
  }
  
  // Pulisci container NFT disponibili
  if (domElements.availableNftsContainer) {
    domElements.availableNftsContainer.innerHTML = `
      <div class="empty-state">
        <i class="ri-information-line"></i>
        <p>Connect your wallet to view your available NFTs.</p>
      </div>`;
  }
  
  // Resetta i contatori di rewards
  if (domElements.totalRewards) domElements.totalRewards.textContent = '0 IASE';
  if (domElements.dailyRewards) domElements.dailyRewards.textContent = '0 IASE';
  if (domElements.pendingRewards) domElements.pendingRewards.textContent = '0 IASE';
}

/**
 * Mostra un loader nell'elemento container
 * @param {HTMLElement} container - L'elemento container dove mostrare il loader
 * @param {string} message - Messaggio da mostrare durante il caricamento
 */
function showLoader(container, message) {
  if (!container) return;
  
  container.innerHTML = `
    <div class="loader-container">
      <div class="loader"></div>
      <p>${message || 'Loading...'}</p>
    </div>`;
}

/**
 * Carica gli NFT in staking per l'utente corrente
 * Questa funzione interroga il server per ottenere gli NFT attualmente in staking
 * Versione 1.4.0 con gestione migliorata degli errori e supporto per vari formati di risposta API
 */
async function loadStakedNfts() {
  console.log('🔄 Avvio caricamento NFT in staking - versione unificata 1.4.0');
  
  try {
    // Ottieni elemento container
    const container = domElements.stakedNftsContainer;
    if (!container) {
      console.error('❌ Staked NFT container not found');
      return;
    }
    
    // Pulizia preventiva
    container.innerHTML = '';
    
    // Mostra loader durante il caricamento
    showLoader(container, 'Loading staked NFTs...');
    
    // Ottieni l'indirizzo del wallet connesso da varie fonti possibili
    // Ordine di priorità: window.currentWalletAddress > window.ethereum?.selectedAddress > window.userWalletAddress
    const walletAddress = window.currentWalletAddress || window.ethereum?.selectedAddress || window.userWalletAddress;
    
    console.log('🔑 Verifico indirizzo wallet:', {
      currentWalletAddress: window.currentWalletAddress,
      ethereumSelected: window.ethereum?.selectedAddress,
      userWalletAddress: window.userWalletAddress,
      finalAddress: walletAddress
    });
    
    if (!walletAddress) {
      console.error('❌ No wallet address available');
      container.innerHTML = `
        <div class="empty-state">
          <i class="ri-information-line"></i>
          <p>Connect your wallet to view your staked NFTs.</p>
        </div>`;
      return;
    }
    
    console.log(`🔄 Caricamento NFT in staking per wallet: ${walletAddress}`);
    
    let data;
    
    try {
      // Prepara l'indirizzo del wallet nel formato corretto per l'API
      const formattedAddress = walletAddress.toLowerCase();
      console.log(`🔍 Verifico NFT in staking per wallet: ${formattedAddress}`);
      
      // Usa solo il principale endpoint per evitare chiamate multiple
      let response = null;
      let data = null;
      const endpoint = `/api/by-wallet/${formattedAddress}`;
      
      try {
        console.log(`🔄 Richiesta a endpoint principale: ${endpoint}`);
        response = await fetch(endpoint);
        if (response.ok) {
          data = await response.json();
          console.log(`✅ Endpoint ${endpoint} ha risposto con successo`, data);
        } else {
          console.log(`⚠️ Endpoint ha risposto con stato: ${response.status}`);
          data = { stakes: [] };
        }
      } catch (err) {
        console.log(`⚠️ Errore con endpoint principale:`, err.message);
        data = { stakes: [] };
      }
      
      // Se non abbiamo dati anche dopo tutti i tentativi, creiamo un oggetto vuoto
      if (!data) {
        console.log('⚠️ Nessuna risposta valida da alcun endpoint, uso oggetto vuoto');
        data = { stakes: [] };
      }
      
      // Se siamo arrivati qui, abbiamo ottenuto dei dati da elaborare
      // Verifica che i dati siano nel formato corretto
      if (!data) {
        console.warn('⚠️ Dati mancanti dalla risposta API');
        data = { stakes: [] };
      } else if (!Array.isArray(data) && !data.stakes) {
        console.warn('⚠️ Formato dati non riconosciuto:', data);
        data = { stakes: [] };
      }
      
      // Ora elabora i dati attraverso il processore
      console.log('📦 Tentativo di elaborazione dati per NFT in staking:', data);
      
      // Abbiamo già provato tutti gli endpoint possibili
      // Non facciamo chiamate API aggiuntive per evitare duplicazioni
      console.log('📦 Processiamo i dati ottenuti dagli endpoint API:', data);
      
      // Elaboriamo i dati direttamente, senza chiamate API aggiuntive
      processStakedNfts(data, container);
      
    } catch (error) {
      console.error('❌ API fetch error:', error);
      container.innerHTML = `
        <div class="empty-state">
          <i class="ri-error-warning-line"></i>
          <h3>Error loading staked NFTs</h3>
          <p>Could not connect to the server. Please try again later.</p>
          <p class="error-details">${error.message}</p>
        </div>`;
    }
  } catch (error) {
    console.error('❌ Error in loadStakedNfts:', error);
    
    // In caso di errore, mostra un messaggio
    if (domElements.stakedNftsContainer) {
      domElements.stakedNftsContainer.innerHTML = `
        <div class="empty-state">
          <i class="ri-error-warning-line"></i>
          <h3>Error loading staked NFTs</h3>
          <p>Please try again later. (${error.message})</p>
        </div>`;
    }
  }
}

/**
 * Elabora i dati degli NFT in staking ricevuti dall'API
 * @param {Object} data - Dati ricevuti dall'API
 * @param {HTMLElement} container - Container dove mostrare gli NFT
 */
function processStakedNfts(data, container) {
  logDebug('📊 Elaborazione dati degli NFT in staking:', data);
  
  // Controllo extra per assicurarsi che il container esista ancora
  if (!container || !container.parentNode) {
    console.error('❌ Container è stato rimosso nel frattempo');
    return;
  }
  
  // Estrai gli NFT in staking dalla struttura di risposta
  // Gestiamo vari formati di dati possibili per massima compatibilità
  console.log('⚙️ Formato dati ricevuti:', data);
  
  let stakedNfts = [];
  
  // Gestione di tutti i possibili formati di risposta API
  if (Array.isArray(data)) {
    // Caso 1: risposta diretta come array
    console.log('📋 Formato dati: Array diretto');
    stakedNfts = data;
  } else if (data && typeof data === 'object') {
    // Caso 2: risposta in formato {stakes: [...]}
    console.log('📋 Formato dati: Oggetto con stakes');
    if (data.stakes && Array.isArray(data.stakes)) {
      stakedNfts = data.stakes;
    } else if (data.data && data.data.stakes && Array.isArray(data.data.stakes)) {
      // Caso 3: risposta in formato {data: {stakes: [...]}}
      stakedNfts = data.data.stakes;
    } else if (data.data && Array.isArray(data.data)) {
      // Caso 4: risposta in formato {data: [...]}
      stakedNfts = data.data;
    } else {
      // Caso 5: array con nome personalizzato (es. "nfts", "items", ecc.)
      console.log('⚠️ Formato dati non standard, cerco arrays...');
      for (const key in data) {
        if (Array.isArray(data[key]) && data[key].length > 0) {
          console.log(`🔍 Trovato array in data.${key}, lo uso come stakedNfts`);
          stakedNfts = data[key];
          break;
        }
      }
      
      // Caso 6: potrebbe essere un singolo oggetto stake
      if (stakedNfts.length === 0 && (data.tokenId || data.token_id || data.nft_id)) {
        console.log('🔍 Trovato singolo oggetto stake, lo uso direttamente');
        stakedNfts = [data]; // Trasforma in array
      }
    }
  }
  
  // Salva gli NFT in staking nel global scope per riferimento futuro
  // Ma esplicitamente NON per uso come cache durante le operazioni di unstaking
  window.currentStakedNfts = stakedNfts;
  
  logDebug('🧾 NFT in staking trovati:', stakedNfts.length);
  
  // Pulisci il container
  container.innerHTML = '';
  
  // Se non ci sono NFT in staking, mostra un messaggio
  if (stakedNfts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="ri-information-line"></i>
        <h3>No Staked NFTs</h3>
        <p>You don't have any NFTs in staking yet. Stake your NFTs to start earning rewards.</p>
      </div>`;
    return;
  }
  
  // Tieni traccia delle ricompense totali e giornaliere
  let totalRewards = 0;
  let dailyRewards = 0;
  
  // Utilizzo un Set per impedire duplicati basati sull'ID del token
  const processedTokens = new Set();
  
  // Ordina gli stake in modo che quelli più recenti vengano processati prima
  // Questo garantisce che in caso di duplicati, verrà mostrato lo stake più recente
  stakedNfts.sort((a, b) => {
    const dateA = new Date(a.stakeDate || a.stake_date || 0);
    const dateB = new Date(b.stakeDate || b.stake_date || 0);
    return dateB - dateA; // Ordine decrescente (più recenti prima)
  });
  
  // Per ogni NFT in staking, crea un elemento visuale
  for (const stake of stakedNfts) {
    // Estrai il token ID, con compatibilità per vari formati
    let tokenId = stake.tokenId || stake.token_id;
    if (stake.nft_id && stake.nft_id.includes('_')) {
      // Formato 'ETH_123'
      tokenId = stake.nft_id.split('_')[1];
    }
    
    if (!tokenId) {
      console.error('❌ Impossibile determinare tokenId per:', stake);
      continue;
    }
    
    // Converti tokenId a stringa per consistenza nei confronti
    tokenId = tokenId.toString();
    
    // Verifica se questo token è già stato processato (elimina duplicati)
    if (processedTokens.has(tokenId)) {
      console.log(`⚠️ NFT #${tokenId} già mostrato, ignoro duplicato`);
      continue;
    }
    
    // Aggiungi questo token al set dei processati
    processedTokens.add(tokenId);
    
    // Crea elemento per l'NFT
    const nftElement = document.createElement('div');
    nftElement.classList.add('nft-card');
    nftElement.classList.add('staked');
    
    // Imposta HTML con i dati dell'NFT
    nftElement.innerHTML = `
      <div class="nft-image">
        <img src="images/placeholder-nft.jpg" alt="NFT #${tokenId}" id="nftImage_${tokenId}">
        <div class="staked-badge">Staked</div>
      </div>
      <div class="nft-details">
        <h3 class="nft-title">IASE Unit #${tokenId}</h3>
        <div class="nft-id">Token ID: ${tokenId}</div>
        <div class="rarity-badge" id="rarityBadge_${tokenId}">Loading...</div>
        
        <div class="staking-info">
          <div class="staking-duration">
            <span class="info-label">Staked For:</span>
            <span class="info-value">${calculateStakingDuration(stake.stakeDate || stake.stake_date)}</span>
          </div>
          <div class="reward-rate">
            <span class="info-label">Daily Rate:</span>
            <span class="info-value" id="dailyRate_${tokenId}">${calculateDailyRate(stake.rarityName || stake.rarity || 'Standard')} IASE/day</span>
          </div>
          <div class="reward-info">
            <span class="info-label">Rewards:</span>
            <span class="info-value" id="rewardValue_${tokenId}">${calculateRewards(stake)} IASE</span>
          </div>
        </div>
        
        <div class="nft-card-actions">
          <button class="btn unstake-btn" data-nft-id="${tokenId}">
            <i class="ri-logout-box-line"></i> Unstake
          </button>
          <button class="btn claim-btn" data-nft-id="${tokenId}" data-stake-id="${stake.id}">
            <i class="ri-coins-line"></i> Claim Rewards
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
        const nftId = this.getAttribute('data-nft-id');
        console.log(`🔄 Tentativo di unstake per NFT #${nftId}`);
        openUnstakeModal(nftId, stake);
      });
    }
  }

/**
 * Apre la modale di unstake per confermare l'operazione
 * @param {string} nftId - L'ID dell'NFT da unstakare
 * @param {Object} stake - L'oggetto stake con i dettagli dell'NFT
 */
function openUnstakeModal(nftId, stake) {
  console.log('🔄 Apertura modale di unstake per NFT #' + nftId, stake);
  
  // Ottieni il container per la modale o creane uno se non esiste
  let modalContainer = document.getElementById('unstakeModalContainer');
  if (!modalContainer) {
    modalContainer = document.createElement('div');
    modalContainer.id = 'unstakeModalContainer';
    document.body.appendChild(modalContainer);
  }
  
  // Trova la rarità o usa un valore predefinito
  let rarityValue = stake.rarity || stake.rarityName || 'Standard';
  // Crea un ID sicuro per la modale
  const safeId = nftId.toString().replace(/[^a-z0-9]/gi, '');
  
  // Crea la modale HTML
  modalContainer.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Unstake IASE Unit</h5>
          <button type="button" class="close-btn" data-dismiss="modal" aria-label="Close">×</button>
        </div>
        <div class="modal-body">
          <div class="nft-unstake-details">
            <div class="nft-preview">
              <img src="${stake.image || 'images/placeholder-nft.jpg'}" alt="NFT #${nftId}" class="nft-image">
              <div class="rarity-tag ${rarityValue.toLowerCase()}">${rarityValue}</div>
            </div>
            <div class="unstake-info">
              <h4>IASE Unit #${nftId}</h4>
              <div class="token-id">Token ID: ${nftId}</div>
              
              <div class="rewards-section">
                <h5>Staking Information</h5>
                <div class="staking-since">
                  <span class="label">Staking Since:</span>
                  <span class="value" id="stakingDate_${safeId}">--</span>
                </div>
                <div class="reward-rate">
                  <span class="label">Daily Rate:</span>
                  <span class="value" id="modalDailyRate_${safeId}">--</span>
                </div>
                <div class="rewards-amount">
                  <span class="label">Total Rewards:</span>
                  <span class="value" id="currentRewardsValue_${safeId}">0.00 IASE</span>
                </div>
              </div>
              
              <div class="note-message">
                <i class="ri-information-line"></i>
                <span>Note: Unstaking will only remove your NFT from staking. Use the Claim button to collect rewards.</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn cancel-btn" data-dismiss="modal">Cancel</button>
          <button type="button" class="btn confirm-unstake-btn" data-nft-id="${nftId}">
            <i class="ri-logout-box-line"></i> Unstake
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Aggiungi la classe alla modale per mostrarla
  modalContainer.classList.add('show');
  
  // Imposta la data di staking
  const stakingDate = document.getElementById(`stakingDate_${safeId}`);
  if (stakingDate) {
    const date = new Date(stake.stakeDate || stake.stake_date || Date.now());
    stakingDate.textContent = date.toLocaleDateString();
  }
  
  // Calcola e imposta le ricompense
  const rewardsValue = document.getElementById(`currentRewardsValue_${safeId}`);
  const dailyRateElement = document.getElementById(`modalDailyRate_${safeId}`);
  
  // Calcola ricompensa accumulata
  const stakeDate = new Date(stake.stakeDate || stake.stake_date || Date.now());
  const now = new Date();
  const daysStaked = Math.max(1, Math.floor((now - stakeDate) / (1000 * 60 * 60 * 24)));
  
  // Determina il daily reward in base alla rarità
  const stakingRarity = stake.rarity || stake.rarityName || 'Standard';
  const dailyReward = getFixedDailyReward(stakingRarity);
  
  // Imposta il daily rate
  if (dailyRateElement) {
    dailyRateElement.textContent = `${dailyReward.toFixed(2)} IASE/day`;
  }
  
  // Calcola reward totale
  const reward = dailyReward * daysStaked;
  
  // Imposta il valore delle reward totali
  if (rewardsValue) {
    rewardsValue.textContent = `${reward.toFixed(2)} IASE`;
  }
  
  console.log(`Modale NFT #${nftId}: ${daysStaked} giorni in staking, ${dailyReward.toFixed(2)} IASE/giorno, totale ${reward.toFixed(2)} IASE`);
}
  
  // Gestore evento per chiudere la modale
  const closeButtons = modalContainer.querySelectorAll('[data-dismiss="modal"]');
  closeButtons.forEach(button => {
    button.addEventListener('click', function() {
      modalContainer.classList.remove('show');
    });
  });
  
  // Gestore evento per il pulsante di conferma unstake
  const confirmButton = modalContainer.querySelector('.confirm-unstake-btn');
  if (confirmButton) {
    confirmButton.addEventListener('click', function() {
      const nftId = this.getAttribute('data-nft-id');
      
      console.log(`🔄 Confermato unstake per NFT #${nftId}`);
      
      // Chiamata alla funzione di unstake - passa solo nftId
      confirmUnstake(nftId, null, stake);
      
      // Nascondi la modale
      modalContainer.classList.remove('show');
    });
  }
}

/**
 * Conferma l'unstaking di un NFT
 * @param {string} nftId - L'ID dell'NFT da unstakare
 * @param {string} stakeId - IGNORATO: L'API richiede solo tokenId e address
 * @param {Object} stake - L'oggetto stake con i dettagli dell'NFT (usato solo per log)
 */
// Resa globale per essere accessibile da staking.html
window.confirmUnstake = async function(nftId, stakeId, stake) {
  console.log(`🔄 Esecuzione unstake per NFT #${nftId}`);
  
  try {
    // Ottieni l'indirizzo del wallet connesso
    const walletAddress = window.currentWalletAddress || window.ethereum?.selectedAddress || window.userWalletAddress;
    
    if (!walletAddress) {
      throw new Error('Wallet non connesso. Impossibile procedere con l\'unstake.');
    }
    
    // Preparazione dati per la richiesta - NOTA: l'API richiede SOLO tokenId e address
    const unstakeData = {
      tokenId: nftId,
      address: walletAddress
    };
    
    console.log('📤 Dati da inviare per unstake:', unstakeData);
    
    // Chiamata API al server
    const response = await fetch('/api/unstake', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(unstakeData)
    });
    
    // Controlla se la chiamata è andata a buon fine
    if (!response.ok) {
      // Se la risposta non è ok, ottieni dettagli errore e lancia eccezione
      const errorData = await response.json().catch(e => ({ error: 'Errore sconosciuto' }));
      throw new Error(`Errore API: ${response.status} - ${errorData.error || response.statusText}`);
    }
    
    // Elabora la risposta
    const data = await response.json();
    console.log('✅ Unstake completato con successo:', data);
    
    // Mostra un messaggio di successo per l'unstake
    alert(`NFT #${nftId} rimosso correttamente dallo staking!`);
    
    // Forza il ricaricamento degli NFT per aggiornare la vista
    setTimeout(() => {
      loadStakedNfts();
      setTimeout(() => {
        loadAvailableNfts();
      }, 1000);
    }, 500);
    
  } catch (error) {
    console.error('❌ Errore durante l\'unstake:', error);
    
    // Mostra messaggio di errore all'utente
    alert(`Errore durante l'unstaking: ${error.message}`);
  }
}

/**
 * Gestisce il claim delle rewards per un NFT in staking
 */
async function claimNFTRewards(nftId, stakeId) {
  try {
    console.log(`Tentativo di claim rewards per NFT #${nftId}, stake ID: ${stakeId}`);
    // Implementazione del claim rewards
    alert("Funzionalità di claim reward in fase di implementazione");
  } catch (error) {
    console.error('Errore durante il claim delle rewards:', error);
    alert(`Errore durante il claim: ${error.message}`);
  }
}

/**
 * Funzione completa per caricare gli NFT in staking
 */
async function loadStakedNfts() {
  // Reset dei contatori globali
  window.totalRewards = 0;
  window.dailyRewards = 0;
  
  try {
    const container = domElements.stakedNftsContainer;
    if (!container) {
      console.error('❌ Container per NFT in staking non trovato');
      return;
    }
    
    // Pulizia preventiva
    container.innerHTML = '';
    
    // Mostra loader durante il caricamento
    showLoader(container, 'Loading staked NFTs...');
    
    // Ottieni gli NFT in staking usando un endpoint specifico
    const response = await fetch('/api/get-staked-nfts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        walletAddress: currentWalletAddress
      })
    });
    
    if (!response.ok) {
      throw new Error(`Errore API: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    let stakedNfts = [];
    
    // Compatibilità con vari formati di risposta API
    if (Array.isArray(data)) {
      stakedNfts = data;
    } else if (data && typeof data === 'object') {
      if (data.stakes && Array.isArray(data.stakes)) {
        stakedNfts = data.stakes;
      } else if (data.data && data.data.stakes && Array.isArray(data.data.stakes)) {
        stakedNfts = data.data.stakes;
      } else if (data.data && Array.isArray(data.data)) {
        stakedNfts = data.data;
      }
    }
    
    // Aggiorna contatori
    if (domElements.totalStakedNfts) {
      domElements.totalStakedNfts.textContent = stakedNfts.length;
    }
    
    // Pulisci il container
    container.innerHTML = '';
    
    // Se non ci sono NFT in staking, mostra un messaggio
    if (stakedNfts.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="ri-information-line"></i>
          <h3>No Staked NFTs</h3>
          <p>You don't have any NFTs in staking yet. Stake your NFTs to start earning rewards.</p>
        </div>`;
      updateRewardCounters();
      return;
    }
    
    // Per ogni NFT in staking, renderizza un elemento visuale
    for (const stake of stakedNfts) {
      // Estrai il token ID, con compatibilità per vari formati
      let tokenId = stake.tokenId || stake.token_id;
      if (stake.nft_id && stake.nft_id.includes('_')) {
        tokenId = stake.nft_id.split('_')[1];
      }
      
      if (!tokenId) {
        console.error('❌ Impossibile determinare tokenId per:', stake);
        continue;
      }
      
      // Renderizza l'NFT
      renderStakedNFT(container, tokenId, stake);
    }
    
    // Aggiorna i contatori globali
    setTimeout(() => {
      // Carica le rewards dal database
      loadAndDisplayRewards();
    }, 1000);
    
  } catch (error) {
    console.error('❌ Errore durante il caricamento degli NFT in staking:', error);
    
    if (domElements.stakedNftsContainer) {
      domElements.stakedNftsContainer.innerHTML = `
        <div class="error-state">
          <i class="ri-error-warning-line"></i>
          <h3>Error Loading Staked NFTs</h3>
          <p>${error.message}</p>
        </div>`;
    }
  }
}

/**
 * Funzione helper per renderizzare un NFT in staking
 */
function renderStakedNFT(container, tokenId, stake) {
  // Crea elemento per l'NFT
  const nftElement = document.createElement('div');
  nftElement.classList.add('nft-card');
  nftElement.classList.add('staked');
  
  // Imposta HTML con i dati dell'NFT
  nftElement.innerHTML = `
    <div class="nft-image">
      <img src="images/placeholder-nft.jpg" alt="NFT #${tokenId}" id="nftImage_${tokenId}">
      <div class="staked-badge">Staked</div>
    </div>
    <div class="nft-details">
      <h3 class="nft-title">IASE Unit #${tokenId}</h3>
      <div class="nft-id">Token ID: ${tokenId}</div>
      <div class="rarity-badge" id="rarityBadge_${tokenId}">Loading...</div>
      
      <div class="staking-info">
        <div class="staking-duration">
          <span class="info-label">Staked Since:</span>
          <span class="info-value">${new Date(stake.stakeDate || stake.stake_date || Date.now()).toLocaleDateString()}</span>
        </div>
        <div class="reward-rate">
          <span class="info-label">Daily Rate:</span>
          <span class="info-value" id="dailyRate_${tokenId}">Calculating...</span>
        </div>
        <div class="reward-info">
          <span class="info-label">Total Rewards:</span>
          <span class="info-value" id="rewardValue_${tokenId}">Calculating...</span>
        </div>
      </div>
      
      <div class="nft-card-actions">
        <button class="btn unstake-btn" data-nft-id="${tokenId}">
          <i class="ri-logout-box-line"></i> Unstake
        </button>
        <button class="btn claim-btn" data-nft-id="${tokenId}" data-stake-id="${stake.id}">
          <i class="ri-coins-line"></i> Claim Rewards
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
      const nftId = this.getAttribute('data-nft-id');
      console.log(`🔄 Tentativo di unstake per NFT #${nftId}`);
      openUnstakeModal(nftId, stake);
    });
  }
  
  const claimBtn = nftElement.querySelector('.claim-btn');
  if (claimBtn) {
    claimBtn.addEventListener('click', function() {
      const nftId = this.getAttribute('data-nft-id');
      const stakeId = this.getAttribute('data-stake-id') || stake.id || stake.stakeId;
      console.log(`💰 Tentativo di claim rewards per NFT #${nftId}, stake ID: ${stakeId}`);
      claimNFTRewards(nftId, stakeId);
    });
  }
  
  // Carica i metadati dell'NFT per ottenere l'immagine e la rarità
  getNFTMetadata(tokenId)
    .then(metadata => {
      // Aggiorna l'immagine
      const imageElement = document.getElementById(`nftImage_${tokenId}`);
      if (imageElement && metadata.image) {
        imageElement.src = metadata.image;
      }
      
      // Aggiorna la rarità
      const rarityElement = document.getElementById(`rarityBadge_${tokenId}`);
      if (rarityElement) {
        const rarity = metadata.rarity || 'Standard';
        rarityElement.textContent = rarity;
        rarityElement.className = `rarity-badge ${rarity.toLowerCase()}`;
      }
      
      // Calcola la ricompensa in base alla rarità
      const rewardElement = document.getElementById(`rewardValue_${tokenId}`);
      const dailyRateElement = document.getElementById(`dailyRate_${tokenId}`);
      
      if (rewardElement || dailyRateElement) {
        // Calcola ricompensa accumulata
        const stakeDate = new Date(stake.stakeDate || stake.stake_date || Date.now());
        const now = new Date();
        const daysStaked = Math.max(1, Math.floor((now - stakeDate) / (1000 * 60 * 60 * 24)));
        
        // Determina il daily reward in base alla rarità
        const nftRarity = metadata.rarity || 'Standard';
        const dailyReward = getFixedDailyReward(nftRarity);
        
        // Mostra il daily rate
        if (dailyRateElement) {
          dailyRateElement.textContent = `${dailyReward.toFixed(2)} IASE/day`;
        }
        
        // Calcola reward totale
        const reward = dailyReward * daysStaked;
        
        // Mostra il reward totale
        if (rewardElement) {
          rewardElement.textContent = `${reward.toFixed(2)} IASE`;
        }
        
        // Aggiungi al totale
        window.totalRewards = (window.totalRewards || 0) + reward;
        window.dailyRewards = (window.dailyRewards || 0) + dailyReward;
        
        console.log(`NFT #${tokenId}: ${daysStaked} giorni in staking, ${dailyReward.toFixed(2)} IASE/giorno, totale ${reward.toFixed(2)} IASE`);
      }
    })
    .catch(err => {
      console.error(`❌ Error retrieving metadata for NFT #${tokenId}:`, err);
    });
}

/**
 * Carica le rewards dall'API e aggiorna la dashboard
 */
async function loadAndDisplayRewards() {
  try {
    if (!currentWalletAddress) {
      console.warn('⚠️ Nessun wallet connesso, impossibile caricare le rewards');
      return;
    }
    
    console.log(`🔄 Caricamento rewards per wallet ${currentWalletAddress}`);
    
    // Chiamata all'API per ottenere le rewards dal database
    const response = await fetch(`/api/rewards/${currentWalletAddress}`);
    
    if (!response.ok) {
      throw new Error(`Errore API: ${response.status} - ${response.statusText}`);
    }
    
    const rewardData = await response.json();
    console.log('📊 Dati rewards ricevuti:', rewardData);
    
    // Calcola totali rewards e daily rate
    let totalRewards = 0;
    let dailyRewards = 0;
    
    // Se abbiamo dati di rewards, li elaboriamo
    if (rewardData && rewardData.length > 0) {
      rewardData.forEach(stake => {
        // Somma i totali
        totalRewards += parseFloat(stake.totalReward || 0);
        dailyRewards += parseFloat(stake.dailyReward || 0);
        
        // Aggiorna le informazioni nella card dell'NFT
        updateNftCardWithRewards(stake);
      });
    }
    
    // Salva nei dati globali
    window.totalRewards = totalRewards;
    window.dailyRewards = dailyRewards;
    
    // Aggiorna i contatori nella dashboard
    updateRewardCounters();
    
  } catch (error) {
    console.error('❌ Errore durante il caricamento delle rewards:', error);
  }
}

/**
 * Aggiorna la card di un NFT con le informazioni sulle rewards
 */
function updateNftCardWithRewards(stakeData) {
  const tokenId = stakeData.tokenId || stakeData.nftId;
  if (!tokenId) return;
  
  // Aggiorna il daily rate
  const dailyRateElement = document.getElementById(`dailyRate_${tokenId}`);
  if (dailyRateElement) {
    dailyRateElement.textContent = `${parseFloat(stakeData.dailyReward).toFixed(2)} IASE/day`;
  }
  
  // Aggiorna il reward totale
  const rewardElement = document.getElementById(`rewardValue_${tokenId}`);
  if (rewardElement) {
    rewardElement.textContent = `${parseFloat(stakeData.totalReward).toFixed(2)} IASE`;
  }
  
  console.log(`✅ Aggiornata card NFT #${tokenId} con rewards: ${stakeData.totalReward} IASE (${stakeData.dailyReward} IASE/day)`);
}

/**
 * Aggiorna i contatori delle rewards nella dashboard
 */
function updateRewardCounters() {
  const totalRewards = window.totalRewards || 0;
  const dailyRewards = window.dailyRewards || 0;
  
  // Aggiorna i contatori nella dashboard
  if (domElements.totalRewards) domElements.totalRewards.textContent = `${totalRewards.toFixed(2)} IASE`;
  if (domElements.dailyRewards) domElements.dailyRewards.textContent = `${dailyRewards.toFixed(2)} IASE`;
  if (domElements.pendingRewards) domElements.pendingRewards.textContent = `${totalRewards.toFixed(2)} IASE`;
  
  console.log(`📊 Aggiornati contatori: ${totalRewards.toFixed(2)} IASE totali, ${dailyRewards.toFixed(2)} IASE giornalieri`);
}

/**
 * Carica gli NFT disponibili (non in staking) per l'utente corrente
 */
async function loadAvailableNfts() {
  try {
    // Ottieni elemento container
    const container = domElements.availableNftsContainer;
    if (!container) {
      console.error('❌ NFT container not found');
      return;
    }
    
    // Pulizia preventiva
    container.innerHTML = '';
    
    // Mostra loader durante il caricamento
    showLoader(container, 'Loading available NFTs...');
    
    // IMPORTANTE: Reset completo della cache locale per evitare problemi di visualizzazione
    window.stakedNftsData = null;
    window.stakedNftIds = [];
    console.log('🧹 Reset completo della cache locale per forzare caricamento fresco dal database');
    
    // Ottieni l'indirizzo del wallet connesso
    const walletAddress = window.ethereum?.selectedAddress || window.currentWalletAddress;
    
    if (!walletAddress) {
      console.error('❌ No wallet address available');
      container.innerHTML = `
        <div class="empty-state">
          <i class="ri-information-line"></i>
          <p>Connect your wallet to view your available NFTs.</p>
        </div>`;
      return;
    }
    
    console.log(`🔄 Caricamento NFT disponibili per wallet: ${walletAddress}`);
    
    // Verifica quali NFT sono già in staking per non mostrarli come disponibili
    console.log('🔍 Verifico NFT già in staking...');
    let stakedNftIds = [];
    
    if (window.currentWalletAddress || window.ethereum?.selectedAddress) {
      const walletAddress = window.currentWalletAddress || window.ethereum.selectedAddress;
      
      // METODO 1: Ottieni gli NFT in staking dal DOM (metodo originale)
      try {
        // Preleva gli ID degli NFT già in staking dal DOM
        const stakedContainer = domElements.stakedNftsContainer;
        if (stakedContainer) {
          const stakedCards = stakedContainer.querySelectorAll('.nft-card');
          stakedNftIds = Array.from(stakedCards).map(card => {
            const idBtn = card.querySelector('.unstake-btn');
            return idBtn ? idBtn.getAttribute('data-nft-id') : null;
          }).filter(id => id !== null);
        }
        console.log(`✅ Trovati ${stakedNftIds.length} NFT in staking dal DOM: ${stakedNftIds.join(', ')}`);
      } catch (error) {
        console.error('❌ Errore durante il controllo degli NFT in staking dal DOM:', error);
      }
      
      // METODO 2: Otteniamo SEMPRE direttamente gli NFT in staking tramite API (più affidabile)
      // Non usiamo più i dati in cache per evitare inconsistenze col database
      try {
        // Forziamo il caricamento fresco dal database tramite API
        console.log('🔄 Caricamento diretto degli NFT in staking tramite API per evitare inconsistenze');
        
        // Ottieni l'indirizzo del wallet connesso
        const walletAddress = window.currentWalletAddress || window.ethereum?.selectedAddress || window.userWalletAddress;
        
        // Reset della cache locale per evitare inconsistenze
        window.stakedNftsData = null;
        
        if (walletAddress) {
          // Prepara l'indirizzo del wallet nel formato corretto per l'API
          const formattedAddress = walletAddress.toLowerCase();
          console.log(`🔍 Verifico NFT in staking per wallet: ${formattedAddress}`);
            
          // Prova diversi endpoint per massima compatibilità
          let response = null;
          let data = null;
          let endpoints = [
            `/api/by-wallet/${formattedAddress}`,
            `/api/stakes/by-wallet/${formattedAddress}`,
            `/api/stakes?wallet=${formattedAddress}`,
            `/by-wallet/${formattedAddress}`
          ];
        
          // Tenta ogni endpoint finché uno non ha successo
          for (const endpoint of endpoints) {
            try {
              console.log(`🔄 Tentativo endpoint: ${endpoint}`);
              response = await fetch(endpoint);
              if (response.ok) {
                data = await response.json();
                console.log(`✅ Endpoint ${endpoint} ha risposto con successo`, data);
                break; // Esci dal ciclo se un endpoint ha successo
              } else {
                console.log(`⚠️ Endpoint ${endpoint} ha risposto con stato: ${response.status}`);
              }
            } catch (err) {
              console.log(`⚠️ Errore con endpoint ${endpoint}:`, err.message);
            }
          }
        
          if (data) {
            // Non salviamo più i dati nel window object per evitare problemi di cache
            // window.stakedNftsData = data; // Commentato per evitare l'uso della cache
            
            const apiStakedNfts = Array.isArray(data) ? data : (data.stakes || []);
            
            // Estrai gli ID dal formato nft_id o tokenId
            const apiStakedIds = apiStakedNfts.map(nft => {
              if (nft.nft_id) {
                const parts = nft.nft_id.split('_');
                return parts.length > 1 ? parts[1] : nft.nft_id;
              }
              return nft.token_id || nft.tokenId || nft.id;
            }).filter(id => id);
            
            // Aggiungi gli ID trovati all'array principale senza duplicati
            apiStakedIds.forEach(id => {
              if (!stakedNftIds.includes(id)) {
                stakedNftIds.push(id);
              }
            });
            
            console.log(`✅ Trovati ${apiStakedIds.length} NFT in staking dall'API: ${apiStakedIds.join(', ')}`);
          } else {
            console.log(`⚠️ Nessun dato ricevuto dall'API per il wallet: ${formattedAddress}`);
          }
        }
      } catch (error) {
        console.error('❌ Errore durante il controllo degli NFT in staking dall\'API:', error);
      }
    }
    
    console.log(`✅ Totale NFT in staking identificati: ${stakedNftIds.length}`);
    
    // Non salviamo gli ID in una variabile globale permanente per evitare problemi di cache
    // Gli ID vengono usati solo per il filtraggio immediato in questa funzione
    // window.stakedNftIds = stakedNftIds; // Commentato per evitare inconsistenze
    
    // Carica gli NFT con getUserNFTs() da nftReader.js
    // Utilizzerà il metodo di scansione diretta con balanceOf + ownerOf
    console.log('🔄 Caricamento NFTs utilizzando nftReader.js con metodo di scansione diretta...');
    const nftData = await getUserNFTs();
    
    // Verifica se ci sono NFT
    if (!nftData || nftData.balance === '0') {
      console.log('⚠️ No NFTs found in wallet');
      container.innerHTML = `
        <div class="empty-state">
          <i class="ri-nft-line"></i>
          <h3>No NFTs available. When you purchase NFTs, they will be displayed here.</h3>
        </div>`;
      return;
    }
    
    // Renderizza gli NFT trovati
    console.log(`✅ NFT trovati nel wallet: ${nftData.balance}, IDs: ${nftData.nftIds.join(', ')}`);
    
    // Converto gli ID degli NFT in staking in stringhe per garantire confronti coerenti
    // Questo è cruciale per evitare problemi con confronti di tipi diversi (numeri vs stringhe)
    const normalizedStakedNftIds = stakedNftIds.map(id => id.toString());
    console.log(`🔍 ID degli NFT in staking normalizzati: ${normalizedStakedNftIds.join(', ')}`);
    
    // Filtriamo gli NFT già in staking, convertendo anche gli ID del wallet in stringhe
    const preliminaryAvailableNftIds = nftData.nftIds
      .map(id => id.toString()) // Normalizza tutti gli ID in stringhe
      .filter(id => !normalizedStakedNftIds.includes(id));
    
    console.log(`🔄 NFT disponibili dopo filtro preliminare: ${preliminaryAvailableNftIds.length}, IDs: ${preliminaryAvailableNftIds.join(', ')}`);
    
    // Poi facciamo una verifica aggiuntiva con l'API per essere sicuri al 100% 
    // che gli NFT non siano in staking nel database
    const availableNftIds = [];
    
    // Funzione per verificare NFT con l'API
    const checkNftStakingStatus = async (tokenId) => {
      try {
        const walletAddress = window.currentWalletAddress || window.ethereum?.selectedAddress;
        
        // Verifica con endpoint dedicato per massima affidabilità
        console.log(`🔍 Verifica staking via API per NFT #${tokenId}`);
        const response = await fetch(`/api/check-staked-nft?token_id=${tokenId}&wallet_address=${walletAddress}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            console.log(`✅ Risultato verifica per NFT #${tokenId}: ${data.is_staked ? 'È in staking' : 'Non è in staking'}`);
            // Se disponibile, salva info anche nel log per debug
            if (data.is_staked && data.stake_info) {
              console.log(`📊 Dettagli staking NFT #${tokenId}:`, data.stake_info);
            }
            return data.is_staked;
          } else {
            console.warn(`⚠️ API ha risposto con errore: ${data.error || 'Errore sconosciuto'}`);
            return false;
          }
        }
        
        console.warn(`⚠️ Risposta API non valida (status ${response.status}) per NFT #${tokenId}`);
        return false;
      } catch (error) {
        console.error(`❌ Errore verifica NFT #${tokenId}:`, error);
        return false;
      }
    };
    
    // Array per tenere traccia degli NFT che sono in staking ma non presenti nella cache locale
    const missingStakedNfts = [];
    
    // Verifichiamo ogni NFT con l'API
    const verificationPromises = preliminaryAvailableNftIds.map(async (tokenId) => {
      const isStaked = await checkNftStakingStatus(tokenId);
      if (!isStaked) {
        availableNftIds.push(tokenId);
      } else {
        console.log(`⚠️ NFT #${tokenId} rilevato come staked dall'API ma non dalla cache locale`);
        
        // Recuperiamo informazioni dettagliate sullo stake per aggiornare la lista
        try {
          const walletAddress = window.currentWalletAddress || window.ethereum?.selectedAddress;
          const response = await fetch(`/api/check-staked-nft?token_id=${tokenId}&wallet_address=${walletAddress}`);
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.is_staked && data.stake_info) {
              // Aggiungiamo questo NFT alla lista stakedNfts se non è già presente
              missingStakedNfts.push({
                tokenId: tokenId.toString(),
                address: walletAddress,
                rarityLevel: data.stake_info.rarity_tier || 'standard',
                dailyReward: parseFloat(data.stake_info.daily_reward || 33.33),
                stakeDate: data.stake_info.staking_date || new Date().toISOString()
              });
            }
          }
        } catch (error) {
          console.error(`❌ Errore nel recupero dettagli per NFT #${tokenId}:`, error);
        }
      }
    });
    
    // Attendiamo tutte le verifiche prima di continuare
    await Promise.all(verificationPromises);
    
    // Aggiorniamo la lista globale degli NFT in staking con quelli trovati ma mancanti
    if (missingStakedNfts.length > 0) {
      console.log(`🔄 Aggiungendo ${missingStakedNfts.length} NFT mancanti alla sezione "Already Staked"`, missingStakedNfts);
      window.stakedNfts = window.stakedNfts || [];
      window.stakedNfts = [...window.stakedNfts, ...missingStakedNfts];
      
      // Aggiorniamo anche stakedNftIds per il filtro
      missingStakedNfts.forEach(nft => {
        if (!stakedNftIds.includes(nft.tokenId)) {
          stakedNftIds.push(nft.tokenId);
        }
      });
      
      // Forziamo un aggiornamento della visualizzazione degli NFT in staking
      setTimeout(() => {
        if (typeof loadStakedNfts === 'function') {
          console.log('🔄 Aggiornamento visualizzazione "Already Staked"');
          loadStakedNfts();
        }
      }, 1000);
    }
    
    console.log(`✅ NFT disponibili dopo verifica API: ${availableNftIds.length}, IDs: ${availableNftIds.join(', ')}`);
    
    // Pulisci nuovamente il container per rimuovere il loader
    container.innerHTML = '';
    
    // Se non ci sono NFT disponibili dopo il filtro
    if (availableNftIds.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="ri-nft-line"></i>
          <h3>All your NFTs are currently staked</h3>
          <p>You don't have any unstaked NFTs available. You can unstake from the "Staked NFTs" tab.</p>
        </div>`;
      return;
    }
    
    // Per ogni NFT disponibile, recupera i metadati e crea l'elemento visuale
    for (const tokenId of availableNftIds) {
      try {
        // Recupera metadati
        const metadata = await getNFTMetadata(tokenId);
        
        // Calcola e assegna il daily reward in base alla rarità
        metadata.dailyReward = getDailyReward(metadata);
        
        // Crea elemento per l'NFT
        const nftElement = document.createElement('div');
        nftElement.classList.add('nft-card');
        // Aggiungi classe basata sulla rarità per lo stile
        nftElement.classList.add(`rarity-${metadata.rarity?.toLowerCase() || 'standard'}`);
        
        // Determina classe CSS per rarità
        const rarityClass = metadata.rarity?.toLowerCase() || 'standard';
        
        // Imposta HTML con i dati dell'NFT in base al CSS esistente
        nftElement.innerHTML = `
          <style>
            /* Stili inline per badge di rarità */
            .rarity-badge.standard {
              background-color: #3498db;
              color: white;
            }
            .rarity-badge.advanced {
              background-color: #9b59b6;
              color: white;
            }
            .rarity-badge.elite {
              background-color: #f39c12;
              color: black;
            }
            .rarity-badge.prototype {
              background-color: #e74c3c;
              color: white;
              animation: pulse 2s infinite;
            }
            @keyframes pulse {
              0% { opacity: 0.8; }
              50% { opacity: 1; }
              100% { opacity: 0.8; }
            }
            
            /* Stili per le card basati sulla rarità */
            .rarity-standard {
              border: 2px solid #3498db;
              box-shadow: 0 0 10px rgba(52, 152, 219, 0.4);
            }
            .rarity-advanced {
              border: 2px solid #9b59b6;
              box-shadow: 0 0 12px rgba(155, 89, 182, 0.5);
            }
            .rarity-elite {
              border: 2px solid #f39c12;
              box-shadow: 0 0 15px rgba(243, 156, 18, 0.6);
            }
            .rarity-prototype {
              border: 2px solid #e74c3c;
              box-shadow: 0 0 20px rgba(231, 76, 60, 0.7);
              animation: glow 3s infinite alternate;
            }
            @keyframes glow {
              from { box-shadow: 0 0 10px rgba(231, 76, 60, 0.7); }
              to { box-shadow: 0 0 20px rgba(231, 76, 60, 0.9); }
            }
            
            /* Stili per i daily reward */
            .daily-reward {
              margin-top: 8px;
              padding: 5px;
              border-radius: 5px;
              font-weight: bold;
            }
            .standard-reward {
              background-color: rgba(52, 152, 219, 0.2);
            }
            .advanced-reward {
              background-color: rgba(155, 89, 182, 0.2);
            }
            .elite-reward {
              background-color: rgba(243, 156, 18, 0.2);
            }
            .prototype-reward {
              background-color: rgba(231, 76, 60, 0.2);
              animation: pulse-bg 3s infinite alternate;
            }
            @keyframes pulse-bg {
              from { background-color: rgba(231, 76, 60, 0.1); }
              to { background-color: rgba(231, 76, 60, 0.3); }
            }
          </style>
          <div class="nft-image">
            <img src="${metadata.image}" alt="NFT #${tokenId}" loading="lazy">
          </div>
          <div class="nft-details">
            <h3 class="nft-title">NFT #${tokenId}</h3>
            <div class="nft-id">Token ID: ${tokenId}</div>
            <div class="rarity-badge ${metadata.rarity?.toLowerCase() || 'standard'}">${metadata.rarity || 'Standard'}</div>
            
            <div class="nft-rewards">
              <div class="reward-rate">
                <span class="reward-label">AI Booster:</span>
                <span class="reward-value">${metadata['AI-Booster'] || metadata.aiBooster || 'X1.0'}</span>
              </div>
              <div class="reward-rate daily-reward ${metadata.rarity?.toLowerCase() || 'standard'}-reward" 
                   title="Reward fisso in base alla rarità: ${metadata.rarity || 'Standard'}">
                <span class="reward-label">Daily Reward:</span>
                <span id="daily-reward-${tokenId}" class="reward-value"></span>
              </div>
            </div>
            
            <div class="nft-card-actions">
              <button class="btn stake-btn" data-nft-id="${tokenId}">
                <i class="ri-login-box-line"></i> Stake
              </button>
            </div>
          </div>
        `;
        
        // Aggiungi l'elemento al container
        container.appendChild(nftElement);
        
        // Imposta il valore del reward giornaliero
        const rewardValue = getDailyReward(metadata.rarity);
        document.getElementById(`daily-reward-${tokenId}`).textContent = `${rewardValue} IASE`;
        
        // Aggiungi event listener per il pulsante stake
        const stakeBtn = nftElement.querySelector('.stake-btn');
        if (stakeBtn) {
          stakeBtn.addEventListener('click', function() {
            // Prima di aprire la modale, verifica che l'NFT non sia già in staking
            checkAndOpenStakeModal(tokenId);
          });
        }
      } catch (error) {
        console.error(`❌ Error retrieving metadata for NFT #${tokenId}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ Error loading NFTs:', error);
    
    // Mostra messaggio di errore con possibilità di riprovare
    const container = domElements.availableNftsContainer;
    if (container) {
      container.innerHTML = `
        <div class="error-state">
          <i class="ri-error-warning-line"></i>
          <p>Error loading NFTs. <a href="#" id="retryNftLoad">Retry</a> or <a href="#" id="tryFallbackLoad">Try alternative method</a></p>
        </div>`;
      
      // Aggiungi event listener al link di retry
      const retryLink = container.querySelector('#retryNftLoad');
      if (retryLink) {
        retryLink.addEventListener('click', function(e) {
          e.preventDefault();
          loadAvailableNfts();
        });
      }
      
      // Aggiungi event listener per metodo di fallback
      const fallbackLink = container.querySelector('#tryFallbackLoad');
      if (fallbackLink) {
        fallbackLink.addEventListener('click', function(e) {
          e.preventDefault();
          
          // Tenta caricamento tramite loadAllIASENFTs completo
          // che potrebbe utilizzare un metodo diverso rispetto al primo tentativo
          tryFallbackNftLoading();
        });
      }
    }
  }
}

// Le funzioni duplicate sono state rimosse poiché le funzionalità
// sono già implementate nel file HTML principale
// - checkAndOpenStakeModal è sostituita dalla verifica diretta in openStakeModal
// - submitStakeRequest è sostituita da confirmStakeNFT
// - refreshStakingLists è già gestita nel codice di aggiornamento esistente

/**
 * Funzione di fallback per caricare gli NFT con un metodo alternativo
 */
async function tryFallbackNftLoading() {
  try {
    console.log('🔄 Trying fallback NFT loading method...');
    
    // Ottieni container
    const container = domElements.availableNftsContainer;
    if (!container) {
      console.error('❌ NFT container not found');
      return;
    }
    
    // Mostra loader
    showLoader(container, 'Trying alternative loading method...');
    
    // Usa il metodo loadAllIASENFTs che potrebbe funzionare meglio in alcuni casi
    // Questo metodo è definito in nftReader.js
    const nftData = await loadAllIASENFTs();
    
    // Controlla se abbiamo ottenuto dati
    if (!nftData || !nftData.nfts || nftData.nfts.length === 0) {
      console.error('❌ No NFTs found with fallback method');
      container.innerHTML = `
        <div class="empty-state">
          <i class="ri-error-warning-line"></i>
          <h3>No NFTs found</h3>
          <p>We couldn't find any NFTs in your wallet. Make sure you have IASE NFTs in your connected wallet.</p>
        </div>`;
      return;
    }
    
    console.log(`✅ Found ${nftData.nfts.length} NFTs with fallback method`);
    
    // Ripulisci il container
    container.innerHTML = '';
    
    // Renderizza gli NFT
    for (const nft of nftData.nfts) {
      const tokenId = nft.tokenId || nft.id;
      
      // Crea elemento per l'NFT
      const nftElement = document.createElement('div');
      nftElement.classList.add('nft-card');
      
      // Determina se è in staking (fallback)
      const isStaked = nft.staked || false;
      
      if (isStaked) {
        // Questo NFT è già in staking, lo saltiamo
        continue;
      }
      
      // Imposta HTML con i dati dell'NFT
      nftElement.innerHTML = `
        <div class="nft-image">
          <img src="${nft.image || 'images/placeholder-nft.jpg'}" alt="NFT #${tokenId}">
        </div>
        <div class="nft-details">
          <h3 class="nft-title">NFT #${tokenId}</h3>
          <div class="nft-id">Token ID: ${tokenId}</div>
          <div class="rarity-badge ${(nft.rarity || 'standard').toLowerCase()}">${nft.rarity || 'Standard'}</div>
          
          <div class="nft-rewards">
            <div class="reward-rate daily-reward">
              <span class="reward-label">Daily Reward:</span>
              <span class="reward-value">${getDailyReward(nft.rarity)} IASE</span>
            </div>
          </div>
          
          <div class="nft-card-actions">
            <button class="btn stake-btn" data-nft-id="${tokenId}">
              <i class="ri-login-box-line"></i> Stake
            </button>
          </div>
        </div>
      `;
      
      // Aggiungi l'elemento al container
      container.appendChild(nftElement);
      
      // Aggiungi event listener per il pulsante stake
      const stakeBtn = nftElement.querySelector('.stake-btn');
      if (stakeBtn) {
        stakeBtn.addEventListener('click', function() {
          // Prima di aprire la modale, verifica che l'NFT non sia già in staking
          checkAndOpenStakeModal(tokenId);
        });
      }
    }
  } catch (fallbackError) {
    console.error('❌ Error in fallback NFT loading:', fallbackError);
    
    // Mostra messaggio di errore
    const container = domElements.availableNftsContainer;
    if (container) {
      container.innerHTML = `
        <div class="error-state">
          <i class="ri-error-warning-line"></i>
          <h3>Error loading NFTs</h3>
          <p>Both standard and fallback methods failed. Please try again later.</p>
          <p class="error-details">${fallbackError.message}</p>
          <button id="manualRetryBtn" class="btn">Try Again</button>
        </div>`;
      
      // Aggiungi event listener al pulsante di retry
      const retryBtn = container.querySelector('#manualRetryBtn');
      if (retryBtn) {
        retryBtn.addEventListener('click', function() {
          loadAvailableNfts();
        });
      }
    }
  }
}

/**
 * Mostra gli NFT sia in staking che disponibili
 * Questa funzione è chiamata all'avvio e ogni volta che ci sono aggiornamenti
 */
async function renderNFTs() {
  try {
    console.log('🔄 Rendering NFTs - versione 1.4.0...');
    
    // Prima carica gli NFT in staking
    await loadStakedNfts();
    
    // Poi carica gli NFT disponibili con un breve ritardo
    setTimeout(async () => {
      try {
        await loadAvailableNfts();
      } catch (error) {
        console.error('❌ Error loading available NFTs:', error);
      }
    }, 1000);
  } catch (error) {
    console.error('❌ Error rendering NFTs:', error);
  }
}