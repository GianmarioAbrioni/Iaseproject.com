/**
 * IASE Project - Staking NFT
 * Modulo principale per il funzionamento del sistema di staking
 * 
 * Questo file gestisce il caricamento e la visualizzazione degli NFT,
 * utilizzando il metodo di scansione diretta implementato in nftReader.js
 * con approccio balanceOf + ownerOf per massima compatibilità
 * 
 * Versione 1.3.0 - 2025-05-17
 * - Rimosso import ES6 per compatibilità cross-browser
 * - Utilizzo di funzioni globali da window (caricate da nftReader.js)
 * - Ottimizzazione per Render con hardcoded values
 * - Migliorata gestione della risposta API da PostgreSQL
 * - Risolti conflitti di funzione tra script multipli
 * - Supporto per configurazione tramite window.STAKING_CONFIG
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
  version: '1.3.0',
  debug: false,
  apiEndpoint: '/api',
  usePatchedVersion: true,
  logApi: false
};

// Imposta la funzione di log in base alla configurazione
const logDebug = window.STAKING_CONFIG.debug 
  ? function(...args) { console.log(...args); }
  : function() {}; // No-op quando debug è false

logDebug('🚀 IASE Staking Module v1.3.0 - Inizializzazione con configurazione:', window.STAKING_CONFIG);

/**
 * Restituisce il valore fisso di reward giornaliero in base alla rarità
 * @param {string} rarity - La rarità dell'NFT (Standard, Advanced, Elite, Prototype)
 * @returns {number} Il valore della ricompensa giornaliera
 */
function getFixedDailyReward(rarity) {
  switch (rarity) {
    case 'Standard':
      return 33.33;
    case 'Advanced':
      return 50;
    case 'Elite':
      return 66.67;
    case 'Prototype':
      return 83.33;
    default:
      return 0;
  }
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

// Rimossi vecchi riferimenti ai reward mensili
// Ora usiamo solo i valori giornalieri fissi definiti sopra

// Elementi DOM 
const domElements = {
  availableNftsContainer: document.getElementById('availableNftsContainer'),
  stakedNftsContainer: document.getElementById('stakedNftsContainer'),
  walletButton: document.getElementById('walletConnectBtn'),
  statusIndicator: document.getElementById('connectionStatus')
};

/**
 * Inizializzazione al caricamento della pagina
 */
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Initializing staking module...');
  
  // Ascolta eventi dal wallet connector
  setupWalletEvents();
  
  // Altre inizializzazioni UI...
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
 * Carica gli NFT in staking per l'utente corrente
 * Questa funzione interroga il server per ottenere gli NFT attualmente in staking
 * Versione 1.3.0 con gestione migliorata degli errori e supporto per vari formati di risposta API
 */
async function loadStakedNfts() {
  console.log('🔄 Avvio caricamento NFT in staking - versione unificata 1.3.0');
  
  // Verifico se la funzione è già definita da un altro script (evita sovrascritture)
  if (window._stakingFunctionsInitialized && !window.STAKING_CONFIG.usePatchedVersion) {
    console.log('⚠️ Funzione loadStakedNfts già definita, sto usando quella esistente');
    if (typeof window._originalLoadStakedNfts === 'function') {
      return window._originalLoadStakedNfts();
    }
    return;
  }
  
  // Salva la funzione come inizializzata
  window._stakingFunctionsInitialized = true;
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
          console.log(`🔄 Tentativo endpoint GET: ${endpoint}`);
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
      
      // Se nessun endpoint GET ha funzionato, proviamo POST
      if (!data) {
        try {
          console.log('⚠️ Tutti i tentativi GET falliti, provo con POST a /api/get-staked-nfts');
          
          const postResponse = await fetch('/api/get-staked-nfts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              walletAddress: formattedAddress, 
              address: formattedAddress 
            })
          });
          
          if (postResponse.ok) {
            data = await postResponse.json();
            console.log('📦 Dati ricevuti da POST:', data);
          } else {
            console.log(`⚠️ Anche POST fallito con stato: ${postResponse.status}`);
          }
        } catch (postErr) {
          console.log('⚠️ Errore con richiesta POST:', postErr.message);
        }
      }
      
      // Se non abbiamo dati anche dopo tutti i tentativi, creiamo un oggetto vuoto
      if (!data) {
        console.log('⚠️ Nessuna risposta valida da alcun endpoint, uso oggetto vuoto');
        data = { stakes: [] };
      }
      
      // Salva i dati in window per debug e per riferimento futuro
      window.stakedNftsData = data;
      
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
      
      // Se i dati sono vuoti o non contengono NFT in staking
      if ((!data || !data.stakes || (Array.isArray(data.stakes) && data.stakes.length === 0)) && 
          window.ethereum?.selectedAddress) {
        
        console.log('⚠️ Nessun NFT trovato nei dati, provo una chiamata API diretta');
        
        // Chiamata diretta all'API come ultimo tentativo
        const walletAddress = window.ethereum?.selectedAddress;
        
        // Chiamata asincrona all'API
        fetch(`/api/by-wallet/${walletAddress.toLowerCase()}`)
          .then(response => {
            if (response.ok) {
              return response.json();
            } else {
              throw new Error(`API error: ${response.status}`);
            }
          })
          .then(apiData => {
            console.log('✅ Dati ottenuti con chiamata API diretta:', apiData);
            processStakedNfts(apiData, container);
          })
          .catch(apiError => {
            console.error('❌ Errore nella chiamata API diretta:', apiError);
            // Fallback ai dati originali
            processStakedNfts(data, container);
          });
      } else {
        // Abbiamo già dei dati, li processiamo direttamente
        processStakedNfts(data, container);
      }
      
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
  
  if (Array.isArray(data)) {
    // Caso 1: risposta diretta come array
    console.log('📋 Formato dati: Array diretto');
    stakedNfts = data;
  } else if (data && typeof data === 'object') {
    // Caso 2: risposta in formato {stakes: [...]}
    console.log('📋 Formato dati: Oggetto con stakes');
    if (data.stakes) {
      stakedNfts = data.stakes;
    } else if (data.data && data.data.stakes) {
      // Caso 3: risposta in formato {data: {stakes: [...]}}
      stakedNfts = data.data.stakes;
    } else if (data.data && Array.isArray(data.data)) {
      // Caso 4: risposta in formato {data: [...]}
      stakedNfts = data.data;
    } else {
      // Fallback: proviamo a cercare qualsiasi array nel data
      console.log('⚠️ Formato dati non standard, cerco arrays...');
      for (const key in data) {
        if (Array.isArray(data[key])) {
          console.log(`🔍 Trovato array in data.${key}, lo uso come stakedNfts`);
          stakedNfts = data[key];
          break;
        }
      }
    }
  }
  
  // Fallback di emergenza: se ancora non abbiamo dati e abbiamo un ID NFT hard-coded per test
  if (!stakedNfts.length && window.STAKING_CONFIG.testModeEnabled) {
    console.log('⚠️ Usando NFT di test fallback per demo');
    stakedNfts = [{
      nft_id: 'ETH_123',
      token_id: '123',
      rarity: 'Advanced',
      staking_start_time: new Date().toISOString()
    }];
  }
  
  // Salva gli NFT in staking nel global scope per riferimento futuro
  window.currentStakedNfts = stakedNfts;
  
  logDebug('🧾 NFT in staking trovati:', stakedNfts.length);
  
  // Estrai gli ID degli NFT in staking per usi futuri (filtro, ecc.)
  const stakedIds = stakedNfts.map(nft => {
    if (nft.nft_id) {
      const parts = nft.nft_id.split('_');
      return parts.length > 1 ? parts[1] : nft.nft_id;
    }
    return nft.token_id || nft.tokenId || nft.id;
  }).filter(id => id);
  
  // Salva gli ID nel global scope per riferimento futuro
  window.stakedNftIds = stakedIds || [];
  
  // Se non ci sono NFT in staking, mostra un messaggio
  // Stampa per debug
  console.log(`🔍 Analisi array stakedNfts: ${Array.isArray(stakedNfts)}, lunghezza: ${stakedNfts?.length || 0}`);
  
  if (!stakedNfts || !stakedNfts.length) {
    console.log('⚠️ No staked NFTs found');
    
    // CORREZIONE IMPORTANTE: Modifica del messaggio di errore per rendere più chiaro il problema
    // e aggiunta di un pulsante per ricaricare i dati
    container.innerHTML = `
      <div class="empty-state">
        <i class="ri-nft-line"></i>
        <h3>No Staked NFTs Found</h3>
        <p>You don't have any staked NFTs yet, or si è verificato un problema nel caricamento.</p>
        <button id="reloadStakedBtn" class="btn btn-primary mt-3">
          <i class="ri-refresh-line"></i> Reload Staked NFTs
        </button>
      </div>`;
    
    // Aggiungi event listener per il pulsante di ricarica
    setTimeout(() => {
      const reloadBtn = document.getElementById('reloadStakedBtn');
      if (reloadBtn) {
        reloadBtn.addEventListener('click', function() {
          console.log('🔄 Ricaricamento manuale degli NFT in staking');
          window.stakedNftsData = null; // Reset dei dati salvati
          container.innerHTML = '<div class="loading">Loading...</div>';
          
          // Richiama direttamente l'API per ottenere i dati freschi
          const walletAddress = window.ethereum?.selectedAddress;
          if (walletAddress) {
            fetch(`/api/by-wallet/${walletAddress.toLowerCase()}`)
              .then(response => response.json())
              .then(freshData => {
                console.log('🔄 Dati freschi ricevuti:', freshData);
                processStakedNfts(freshData, container);
              })
              .catch(err => {
                console.error('❌ Errore nel ricaricamento:', err);
                container.innerHTML = `
                  <div class="error-state">
                    <i class="ri-error-warning-line"></i>
                    <h3>Error reloading staked NFTs</h3>
                    <p>${err.message}</p>
                  </div>`;
              });
          }
        });
      }
    }, 100);
    
    return;
  }
  
  // Pulisci container e renderizza gli NFT trovati
  console.log(`✅ Staked NFTs trovati: ${stakedNfts.length}`);
  container.innerHTML = '';
  
  // Renderizza gli NFT in staking
  let counter = 0;
  for (const nft of stakedNfts) {
    try {
      // Debug per vedere il formato esatto dei dati ricevuti
      console.log(`📋 Dati NFT #${counter+1}:`, nft);
      
      // Estrai i dati dall'NFT in staking
      let tokenId = '';
      if (nft.nft_id) {
        // Rimuovi lo spazio bianco e poi estrai l'ID
        const cleanNftId = nft.nft_id.trim();
        const parts = cleanNftId.split('_');
        tokenId = parts.length > 1 ? parts[1] : cleanNftId;
        
        // Se il tokenId è ancora vuoto o non è numerico, proviamo altre proprietà
        if (!tokenId || isNaN(parseInt(tokenId))) {
          // Opzioni di fallback
          tokenId = nft.token_id || nft.tokenId || nft.id || '0000';
        }
      } else if (nft.token_id) {
        tokenId = nft.token_id;
      } else if (nft.tokenId) {
        tokenId = nft.tokenId;
      } else if (nft.id && typeof nft.id === 'string' && nft.id.includes('_')) {
        const parts = nft.id.split('_');
        tokenId = parts[1] || nft.id;
      } else {
        tokenId = nft.id || '0000';
      }
      
      // Pulisci il tokenId rimuovendo caratteri non numerici
      tokenId = tokenId.toString().replace(/[^0-9]/g, '');
      
      // Verifica dei valori di rarità e rewards
      const rarityTier = nft.rarity_tier || nft.rarity || 'Standard';
      const dailyRewardRate = nft.daily_reward_rate || nft.dailyReward || getFixedDailyReward(rarityTier);
      
      // Prepara i metadati dell'NFT usando i dati dal database
      let metadata = {
        id: tokenId,
        // Utilizziamo path di immagine relativi per evitare problemi CORS e per funzionare sia in locale che in produzione
        image: `images/nft/${tokenId}.png`,  // Percorso relativo invece di assoluto
        rarity: rarityTier,
        'AI-Booster': 'X1.5',
        dailyReward: dailyRewardRate
      };
      
      // Fallback per immagini - se l'immagine non esiste, usa un'immagine di placeholder
      const img = new Image();
      img.onerror = function() {
        metadata.image = 'images/nft-placeholder.png';
      }
      img.src = metadata.image;
      
      // Stampa i dati dell'NFT per debug
      console.log("🎯 NFT in staking elaborato:", {
        tokenId: metadata.id,
        rarity: metadata.rarity,
        dailyReward: metadata.dailyReward
      });
      
      // Crea elemento NFT card
      const nftCard = document.createElement('div');
      nftCard.className = 'nft-card staked';
      nftCard.innerHTML = `
        <style>
          .staked .nft-image::after {
            content: "STAKED";
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(46, 204, 113, 0.8);
            color: white;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
          }
          .rarity-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            margin-top: 5px;
            text-align: center;
          }
          .rarity-standard {
            border: 2px solid #3498db;
            box-shadow: 0 0 10px rgba(52, 152, 219, 0.5);
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
        </style>
        <div class="nft-image">
          <img src="${metadata.image}" alt="NFT #${metadata.id}" loading="lazy" onerror="this.src='https://iaseproject.com/assets/img/nft/default.png';">
        </div>
        <div class="nft-details">
          <h3 class="nft-title">NFT #${metadata.id}</h3>
          <div class="nft-id">Token ID: ${metadata.id}</div>
          <div class="rarity-badge ${metadata.rarity?.toLowerCase() || 'standard'}">${metadata.rarity || 'Standard'}</div>
          
          <div class="nft-rewards">
            <div class="reward-rate">
              <span class="reward-label">AI Booster:</span>
              <span class="reward-value">${metadata['AI-Booster'] || 'X1.0'}</span>
            </div>
            <div class="reward-rate daily-reward ${metadata.rarity?.toLowerCase() || 'standard'}-reward">
              <span class="reward-label">Daily Reward:</span>
              <span class="reward-value">${metadata.dailyReward.toFixed(2)} IASE</span>
            </div>
          </div>
          
          <button class="unstake-btn" data-nft-id="${metadata.id}">Unstake</button>
        </div>
      `;
      
      // Aggiungi listener per il bottone di unstake
      const unstakeBtn = nftCard.querySelector('.unstake-btn');
      if (unstakeBtn) {
        unstakeBtn.addEventListener('click', unstakeNFT);
      }
      
      // Aggiungi la card al container
      container.appendChild(nftCard);
      counter++;
    } catch (error) {
      console.error(`❌ Error rendering staked NFT:`, error);
    }
  }
  
  // Aggiorna il contatore NFT (se la funzione esiste)
  if (typeof updateNFTCounter === 'function') {
    updateNFTCounter();
  }
  
  console.log(`✅ Completato rendering di ${counter} NFT in staking`);
}

/**
 * Funzione per lo unstaking di un NFT
 * @param {Event} e - Evento click dal pulsante di unstake
 */
async function unstakeNFT(e) {
  try {
    const button = e.target;
    const tokenId = button.getAttribute('data-nft-id');
    
    if (!tokenId) {
      console.error('❌ No token ID provided for unstake operation');
      return;
    }
    
    // Disabilita il pulsante e mostra stato in corso
    button.disabled = true;
    button.innerHTML = `<span class="spinner"></span> Unstaking...`;
    
    console.log(`🔄 Unstaking NFT #${tokenId}...`);
    
    // Ottieni l'indirizzo del wallet
    const walletAddress = window.ethereum?.selectedAddress || window.currentWalletAddress;
    if (!walletAddress) {
      console.error('❌ No wallet address available for unstaking');
      button.disabled = false;
      button.textContent = 'Unstake';
      alert('Wallet not connected. Please connect your wallet to unstake.');
      return;
    }
    
    // Chiama l'API per lo unstaking
    console.log(`🔄 Chiamata API per unstake di NFT #${tokenId} per wallet ${walletAddress}`);
    
    // Usa l'endpoint corretto che salva nel database PostgreSQL
    const response = await fetch(`/api/unstake`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tokenId,
        address: walletAddress // chiave consistente con l'API
      })
    });
    
    // Gestione risposta
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error (${response.status}): ${errorText}`);
    }
    
    const result = await response.json();
    
    console.log(`✅ NFT #${tokenId} unstaked successfully:`, result);
    
    // Aggiorna l'interfaccia
    alert(`NFT #${tokenId} unstaked successfully!`);
    
    // Ricarica gli NFT dopo l'unstaking
    await loadStakedNfts();
    await loadAvailableNfts();
    
  } catch (error) {
    console.error('❌ Error unstaking NFT:', error);
    alert(`Failed to unstake NFT: ${error.message}`);
    
    // Ripristina il pulsante
    if (e && e.target) {
      e.target.disabled = false;
      e.target.textContent = 'Unstake';
    }
  }
}

/**
 * Pulisce l'interfaccia NFT
 */
function clearNftsUI() {
  if (domElements.availableNftsContainer) {
    domElements.availableNftsContainer.innerHTML = `
      <div class="empty-state">
        <i class="ri-information-line"></i>
        <p>Connect your wallet to view your NFTs.</p>
      </div>`;
  }
  
  if (domElements.stakedNftsContainer) {
    domElements.stakedNftsContainer.innerHTML = `
      <div class="empty-state">
        <i class="ri-information-line"></i>
        <p>Connect your wallet to view your staked NFTs.</p>
      </div>`;
  }
}

/**
 * Mostra un loader nell'elemento specificato
 * @param {HTMLElement} container - Elemento in cui mostrare il loader
 * @param {string} message - Messaggio opzionale
 */
function showLoader(container, message = 'Loading...') {
  if (!container) return;
  
  container.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>${message}</p>
    </div>`;
}



/**
 * Restituisce il reward giornaliero fisso basato sulla rarità dell'NFT
 * Versione semplificata che assegna valore fisso in base alla rarità
 * @param {string|Object} rarityOrNft - Rarità dell'NFT (Standard, Advanced, Elite, Prototype) o oggetto NFT
 * @returns {number} - Reward giornaliero in IASE tokens
 */
function getDailyReward(rarityOrNft) {
  // Caso in cui riceve l'oggetto NFT completo
  if (typeof rarityOrNft === 'object' && rarityOrNft !== null) {
    // Se è già stato calcolato, usa quello
    if (rarityOrNft.dailyReward) return rarityOrNft.dailyReward;
    
    // Usa la rarità per determinare il reward
    if (rarityOrNft.rarity) {
      const rarityLower = rarityOrNft.rarity.toString().toLowerCase();
      
      // Assegna reward fisso in base alla rarità
      if (rarityLower.includes('elite')) {
        return ELITE_DAILY_REWARD;
      } else if (rarityLower.includes('advanced')) {
        return ADVANCED_DAILY_REWARD;
      } else if (rarityLower.includes('prototype')) {
        return PROTOTYPE_DAILY_REWARD;
      } else {
        return BASE_DAILY_REWARD; // Standard
      }
    }
    
    // Default per Standard
    return BASE_DAILY_REWARD;
  }
  
  if (!rarityOrNft) return BASE_DAILY_REWARD; // Default Standard
  
  // Conversione case-insensitive per rarità passata come stringa
  const rarityLower = rarityOrNft.toString().toLowerCase();
  
  // Assegna reward fisso in base alla rarità
  if (rarityLower.includes('elite')) {
    return ELITE_DAILY_REWARD;
  } else if (rarityLower.includes('advanced')) {
    return ADVANCED_DAILY_REWARD;
  } else if (rarityLower.includes('prototype')) {
    return PROTOTYPE_DAILY_REWARD;
  } else {
    return BASE_DAILY_REWARD; // Standard
  }
}

/**
 * Carica gli NFT disponibili per il wallet connesso
 * Soluzione definitiva che risolve il problema di visualizzazione NFT
 * Supporta sia contratti ERC721Enumerable che standard ERC721
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
    
    // Otteniamo gli NFT in staking sia dal DOM che dall'API per un filtro più affidabile
    console.log('🔍 Verifica NFT già in staking per evitare duplicati...');
    let stakedNftIds = [];
    
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
    
    // METODO 2: Otteniamo direttamente gli NFT in staking tramite API (più affidabile)
    // O utilizziamo i dati già caricati in precedenza nel window object
    try {
      // Controlla se abbiamo già dati in window.stakedNftsData
      if (window.stakedNftsData) {
        console.log('🔍 Utilizzando dati NFT in staking già caricati da window.stakedNftsData');
        
        const apiStakedNfts = Array.isArray(window.stakedNftsData) 
          ? window.stakedNftsData 
          : (window.stakedNftsData.stakes || []);
        
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
        
        console.log(`✅ Trovati ${apiStakedIds.length} NFT in staking dai dati precaricati: ${apiStakedIds.join(', ')}`);
      }
      // Se non abbiamo dati precaricati, facciamo una chiamata API
      else {
        // Ottieni l'indirizzo del wallet connesso
        const walletAddress = window.currentWalletAddress || window.ethereum?.selectedAddress || window.userWalletAddress;
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
            // Salviamo i dati nel window object per riferimenti futuri
            window.stakedNftsData = data;
            
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
      }
    } catch (error) {
      console.error('❌ Errore durante il controllo degli NFT in staking dall\'API:', error);
    }
    
    console.log(`✅ Totale NFT in staking identificati: ${stakedNftIds.length}`);
    
    // Salva gli ID nel global scope per riferimento futuro
    window.stakedNftIds = stakedNftIds;
    
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
    
    // Filtriamo gli NFT già in staking
    const availableNftIds = nftData.nftIds.filter(id => !stakedNftIds.includes(id));
    console.log(`🔄 NFT disponibili dopo filtro: ${availableNftIds.length}, IDs: ${availableNftIds.join(', ')}`);
    
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
            openStakeModal(tokenId);
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

/**
 * Tenta un caricamento alternativo degli NFT
 * utilizzando direttamente loadAllIASENFTs da nftReader.js
 */
async function tryFallbackNftLoading() {
  try {
    // Ottieni elemento container
    const container = domElements.availableNftsContainer;
    if (!container) return;
    
    // Mostra loader durante il caricamento
    showLoader(container, 'Attempting alternative NFT loading method...');
    
    console.log('🔄 Attempting alternative loading via loadAllIASENFTs...');
    
    // Usa direttamente loadAllIASENFTs che potrebbe utilizzare un metodo diverso
    const nftResult = await loadAllIASENFTs();
    const allNfts = nftResult?.nfts || [];
    
    if (!allNfts || allNfts.length === 0) {
      console.log('⚠️ No NFTs found with alternative method');
      container.innerHTML = `
        <div class="empty-state">
          <i class="ri-nft-line"></i>
          <h3>No NFTs available. When you purchase NFTs, they will be displayed here.</h3>
        </div>`;
      return;
    }
    
    // Pulisci container e renderizza gli NFT trovati
    console.log(`✅ NFTs found with alternative method: ${allNfts.length}`);
    container.innerHTML = '';
    
    // Renderizza gli NFT trovati
    for (const nft of allNfts) {
      // Calcola e assegna il daily reward in base alla rarità
      // Debug per verificare i dati dell'NFT prima del calcolo del reward
      console.log(`🔍 DEBUG NFT #${nft.id} - Rarità: ${nft.rarity}, AI-Booster: ${nft['AI-Booster'] || nft.aiBooster}`);
      
      // Forza l'assegnazione esplicita in base alla rarità invece di usare object passthrough
      if (nft.rarity) {
        const rarityLower = nft.rarity.toString().toLowerCase();
        
        if (rarityLower.includes('elite')) {
          nft.dailyReward = ELITE_DAILY_REWARD;
        } else if (rarityLower.includes('advanced')) {
          nft.dailyReward = ADVANCED_DAILY_REWARD;
        } else if (rarityLower.includes('prototype')) {
          nft.dailyReward = PROTOTYPE_DAILY_REWARD;
        } else {
          nft.dailyReward = BASE_DAILY_REWARD; // Standard
        }
      } else {
        // Default per Standard
        nft.dailyReward = BASE_DAILY_REWARD;
      }
      
      console.log(`💰 NFT #${nft.id} - Daily Reward assegnato: ${nft.dailyReward} IASE`);
      
      const nftElement = document.createElement('div');
      nftElement.classList.add('nft-card');
      
      // Determina classe CSS per rarità
      const rarityClass = nft.rarity?.toLowerCase() || 'standard';
      
      // Aggiungi classe basata sulla rarità per lo stile
      nftElement.classList.add(`rarity-${rarityClass}`);
      
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
          <img src="${nft.image}" alt="NFT #${nft.id}" loading="lazy">
        </div>
        <div class="nft-details">
          <h3 class="nft-title">NFT #${nft.id}</h3>
          <div class="nft-id">Token ID: ${nft.id}</div>
          <div class="rarity-badge ${rarityClass}">${nft.rarity || 'Standard'}</div>
          
          <div class="nft-rewards">
            <div class="reward-rate">
              <span class="reward-label">AI Booster:</span>
              <span class="reward-value">${nft['AI-Booster'] || nft.aiBooster || 'X1.0'}</span>
            </div>
            <div class="reward-rate daily-reward ${rarityClass}-reward" 
                 title="Reward calcolato in base alla rarità: ${nft.rarity || 'Standard'} = ${nft.dailyReward || getDailyReward(nft.rarity)} IASE/giorno">
              <span class="reward-label">Daily Reward:</span>
              <span id="daily-reward-${nft.id}" class="reward-value"></span>
            </div>
          </div>
          
          <div class="nft-card-actions">
            <button class="btn stake-btn" data-nft-id="${nft.id}">
              <i class="ri-login-box-line"></i> Stake
            </button>
          </div>
        </div>
      `;
      
      // Aggiungi l'elemento al container
      container.appendChild(nftElement);
      
      // Imposta il valore del reward giornaliero
      const rewardValue = getDailyReward(nft.rarity);
      document.getElementById(`daily-reward-${nft.id}`).textContent = `${rewardValue} IASE`;
      
      // Aggiungi event listener per il pulsante stake
      const stakeBtn = nftElement.querySelector('.stake-btn');
      if (stakeBtn) {
        stakeBtn.addEventListener('click', function() {
          openStakeModal(nft.id);
        });
      }
    }
  } catch (fallbackError) {
    console.error('❌ Error loading NFTs with alternative method:', fallbackError);
    
    // Mostra messaggio di errore finale
    const container = domElements.availableNftsContainer;
    if (container) {
      container.innerHTML = `
        <div class="error-state critical">
          <i class="ri-error-warning-line"></i>
          <p>Unable to load your NFTs. Check your connection and make sure your wallet is connected to the Ethereum network.</p>
          <button id="retryNftLoadFinal" class="btn">Retry</button>
        </div>`;
      
      // Aggiungi event listener al pulsante di retry finale
      const retryBtn = container.querySelector('#retryNftLoadFinal');
      if (retryBtn) {
        retryBtn.addEventListener('click', function() {
          loadAvailableNfts();
        });
      }
    }
  }
}

// Funzioni ausiliarie
/**
 * Apre il modal di staking e gestisce il processo di staking dell'NFT
 * @param {string} tokenId - ID dell'NFT da mettere in staking
 */
async function openStakeModal(tokenId) {
  console.log(`🔄 Apertura modal staking per NFT #${tokenId}`);
  
  // Recupera i metadati dell'NFT per ottenere la rarità
  const metadata = await getNFTMetadata(tokenId);
  if (!metadata) {
    alert('Could not retrieve NFT metadata. Please try again.');
    return;
  }
  
  // Calcola il daily reward basato sulla rarità
  const dailyReward = getDailyReward(metadata);
  
  try {
    // Chiedi conferma all'utente
    const confirmed = confirm(`
      Do you want to stake IASE Unit #${tokenId}?
      
      Rarity: ${metadata.rarity || 'Standard'}
      Daily Reward: ${dailyReward} IASE tokens
      
      After staking, you'll need to wait at least 24 hours before claiming rewards.
    `);
    
    if (!confirmed) {
      console.log('User cancelled staking operation');
      return;
    }
    
    // Ottieni l'indirizzo del wallet corrente
    const walletAddress = window.ethereum?.selectedAddress;
    if (!walletAddress) {
      alert('No wallet connected. Please connect your wallet first.');
      return;
    }
    
    // Mostra un indicatore di caricamento
    const container = domElements.availableNftsContainer;
    if (container) {
      showLoader(container, 'Processing your staking request...');
    }
    
    console.log(`📤 Inviando richiesta di staking per NFT #${tokenId}...`);
    
    // Prepara i dati da inviare
    const stakeData = {
      tokenId: tokenId,
      address: walletAddress,
      rarityLevel: metadata.rarity || 'Standard',
      dailyReward: dailyReward,
      stakeDate: new Date().toISOString()
    };
    
    // Invia i dati al server tramite API
    const response = await fetch('/api/stake', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(stakeData)
    });
    
    // Verifica la risposta
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Staking completato con successo:', result);
      
      // Mostra messaggio di successo
      alert(`Successfully staked NFT #${tokenId}!`);
      
      // Aggiorna l'UI - ricarica sia gli NFT in staking che quelli disponibili
      // con un leggero ritardo per dare tempo al server di aggiornare i dati
      setTimeout(() => {
        loadStakedNfts(); // Ricarica gli NFT in staking
        loadAvailableNfts(); // Ricarica gli NFT disponibili
      }, 2000);
    } else {
      throw new Error(result.error || 'Unknown error occurred during staking');
    }
  } catch (error) {
    console.error('❌ Errore durante lo staking:', error);
    alert(`Failed to stake NFT: ${error.message}`);
    
    // Ripristina l'UI
    loadAvailableNfts();
  }
}

// Rendi disponibili le funzioni nel global window scope
window.stakingFunctions = {
  loadAvailableNfts, 
  clearNftsUI,
  showLoader,
  loadStakedNfts,
  processStakedNfts
};