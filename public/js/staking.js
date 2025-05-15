/**
 * IASE Project - Staking NFT
 * Modulo principale per il funzionamento del sistema di staking
 * 
 * Questo file gestisce il caricamento e la visualizzazione degli NFT,
 * utilizzando il metodo di scansione diretta implementato in nftReader.js
 * con approccio balanceOf + ownerOf per massima compatibilità
 * 
 * Versione 1.2.0 - 2025-05-15
 * - Rimosso import ES6 per compatibilità cross-browser
 * - Utilizzo di funzioni globali da window (caricate da nftReader.js)
 * - Ottimizzazione per Render con hardcoded values
 */

// Utilizzo delle funzioni globali caricate da nftReader.js
// Le funzioni sono disponibili globalmente tramite window
const getUserNFTs = window.getUserNFTs;
const getNFTMetadata = window.getNFTMetadata;
const loadAllIASENFTs = window.loadAllIASENFTs;

// Contanti di configurazione (hardcoded per Render)
const STAKING_API_ENDPOINT = '/api/staking';
const IASE_NFT_CONTRACT = window.NFT_CONTRACT_ADDRESS || '0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F';
// Configurazione Alchemy API (priorità principale)
const ALCHEMY_API_KEY = window.ALCHEMY_API_KEY || 'uAZ1tPYna9tBMfuTa616YwMcgptV_1vB';
const ALCHEMY_API_URL = `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
// Retrocompatibilità
const INFURA_API_KEY = window.INFURA_API_KEY || '84ed164327474b4499c085d2e4345a66';

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
  console.log('🚀 Inizializzazione staking module...');
  
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
    console.log(`✅ Wallet connesso: ${walletAddress} (${event.detail.shortAddress}, Chain: ${event.detail.chainId})`);
    
    // Carica NFT quando il wallet si connette
    await loadAvailableNfts();
  });
  
  // Evento: wallet disconnesso
  window.addEventListener('wallet:disconnected', function() {
    console.log('⚠️ Wallet disconnesso');
    
    // Pulisci l'interfaccia quando il wallet si disconnette
    clearNftsUI();
  });
  
  // Evento per caricamento manuale NFT
  window.addEventListener('manual:loadNFTs', async function() {
    console.log('🔄 Richiesto caricamento manuale NFT');
    await loadAvailableNfts();
  });
}

/**
 * Pulisce l'interfaccia NFT
 */
function clearNftsUI() {
  if (domElements.availableNftsContainer) {
    domElements.availableNftsContainer.innerHTML = `
      <div class="empty-state">
        <i class="ri-information-line"></i>
        <p>Connetti il tuo wallet per visualizzare i tuoi NFT.</p>
      </div>`;
  }
}

/**
 * Mostra un loader nell'elemento specificato
 * @param {HTMLElement} container - Elemento in cui mostrare il loader
 * @param {string} message - Messaggio opzionale
 */
function showLoader(container, message = 'Caricamento...') {
  if (!container) return;
  
  container.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>${message}</p>
    </div>`;
}

/**
 * Calcola il reward giornaliero basato sulla rarità dell'NFT
 * Versione avanzata che verifica sia la rarità che l'AI-Booster
 * @param {string|Object} rarityOrNft - Rarità dell'NFT (Standard, Advanced, Elite, Prototype) o oggetto NFT
 * @returns {number} - Reward giornaliero in IASE tokens
 */
function getDailyReward(rarityOrNft) {
  // Caso in cui riceve l'oggetto NFT completo
  if (typeof rarityOrNft === 'object' && rarityOrNft !== null) {
    // Se è già stato calcolato, usa quello
    if (rarityOrNft.dailyReward) return rarityOrNft.dailyReward;
    
    // Prima priorità: verifica "Card Frame" (proprietà rarity)
    if (rarityOrNft.rarity) {
      const rarityLower = rarityOrNft.rarity.toString().toLowerCase();
      
      if (rarityLower.includes('elite')) {
        return 66.67;
      } else if (rarityLower.includes('advanced')) {
        return 50;
      } else if (rarityLower.includes('prototype')) {
        return 83.33;
      } else if (rarityLower.includes('standard')) {
        return 33.33;
      }
    }
    
    // Seconda priorità: verifica il valore dell'AI-Booster
    const aiBooster = rarityOrNft['AI-Booster'] || rarityOrNft.aiBooster;
    if (aiBooster) {
      const boosterStr = aiBooster.toString().toUpperCase();
      if (boosterStr.includes('X2.5') || boosterStr.includes('2.5')) return 83.33;
      if (boosterStr.includes('X2.0') || boosterStr.includes('2.0')) return 66.67;
      if (boosterStr.includes('X1.5') || boosterStr.includes('1.5')) return 50;
      if (boosterStr.includes('X1.0') || boosterStr.includes('1.0')) return 33.33;
    }
    
    // Se nessuna delle due è disponibile, passa la rarità come stringa
    rarityOrNft = rarityOrNft.rarity;
  }
  
  if (!rarityOrNft) return 33.33; // Default Standard
  
  // Conversione case-insensitive per rarità passata come stringa
  const rarityLower = rarityOrNft.toString().toLowerCase();
  
  if (rarityLower.includes('elite')) {
    return 66.67;
  } else if (rarityLower.includes('advanced')) {
    return 50;
  } else if (rarityLower.includes('prototype')) {
    return 83.33;
  } else {
    return 33.33; // Standard
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
      console.error('❌ Container NFT non trovato');
      return;
    }
    
    // Pulizia preventiva
    container.innerHTML = '';
    
    // Mostra loader durante il caricamento
    showLoader(container, 'Caricamento NFT disponibili...');
    
    // Carica gli NFT con getUserNFTs() da nftReader.js
    // Utilizzerà il metodo di scansione diretta con balanceOf + ownerOf
    console.log('🔄 Caricamento NFTs utilizzando nftReader.js con metodo di scansione diretta...');
    const nftData = await getUserNFTs();
    
    // Verifica se ci sono NFT
    if (!nftData || nftData.balance === '0') {
      console.log('⚠️ Nessun NFT trovato nel wallet');
      container.innerHTML = `
        <div class="empty-state">
          <i class="ri-nft-line"></i>
          <h3>Nessun NFT disponibile. Quando acquisti NFT saranno visualizzati qui.</h3>
        </div>`;
      return;
    }
    
    // Renderizza gli NFT trovati
    console.log(`✅ NFT trovati nel wallet: ${nftData.balance}, IDs: ${nftData.nftIds.join(', ')}`);
    
    // Pulisci nuovamente il container per rimuovere il loader
    container.innerHTML = '';
    
    // Per ogni NFT, recupera i metadati e crea l'elemento visuale
    for (const tokenId of nftData.nftIds) {
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
                   title="Reward calcolato in base alla rarità: ${metadata.rarity || 'Standard'} = ${metadata.dailyReward || getDailyReward(metadata.rarity)} IASE/giorno">
                <span class="reward-label">Daily Reward:</span>
                <span class="reward-value">${metadata.dailyReward || getDailyReward(metadata.rarity)} IASE</span>
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
            openStakeModal(tokenId);
          });
        }
      } catch (error) {
        console.error(`❌ Errore nel recupero metadati per NFT #${tokenId}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ Errore nel caricamento NFT:', error);
    
    // Mostra messaggio di errore con possibilità di riprovare
    const container = domElements.availableNftsContainer;
    if (container) {
      container.innerHTML = `
        <div class="error-state">
          <i class="ri-error-warning-line"></i>
          <p>Errore nel caricamento degli NFT. <a href="#" id="retryNftLoad">Riprova</a> o <a href="#" id="tryFallbackLoad">Prova metodo alternativo</a></p>
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
    showLoader(container, 'Tentativo alternativo di caricamento NFT...');
    
    console.log('🔄 Tentativo caricamento alternativo tramite loadAllIASENFTs...');
    
    // Usa direttamente loadAllIASENFTs che potrebbe utilizzare un metodo diverso
    const nftResult = await loadAllIASENFTs();
    const allNfts = nftResult?.nfts || [];
    
    if (!allNfts || allNfts.length === 0) {
      console.log('⚠️ Nessun NFT trovato con metodo alternativo');
      container.innerHTML = `
        <div class="empty-state">
          <i class="ri-nft-line"></i>
          <h3>Nessun NFT disponibile. Quando acquisti NFT saranno visualizzati qui.</h3>
        </div>`;
      return;
    }
    
    // Pulisci container e renderizza gli NFT trovati
    console.log(`✅ NFT trovati con metodo alternativo: ${allNfts.length}`);
    container.innerHTML = '';
    
    // Renderizza gli NFT trovati
    for (const nft of allNfts) {
      // Calcola e assegna il daily reward in base alla rarità
      nft.dailyReward = getDailyReward(nft);
      
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
              <span class="reward-value">${nft.dailyReward || getDailyReward(nft.rarity)} IASE</span>
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
      
      // Aggiungi event listener per il pulsante stake
      const stakeBtn = nftElement.querySelector('.stake-btn');
      if (stakeBtn) {
        stakeBtn.addEventListener('click', function() {
          openStakeModal(nft.id);
        });
      }
    }
  } catch (fallbackError) {
    console.error('❌ Errore nel caricamento NFT con metodo alternativo:', fallbackError);
    
    // Mostra messaggio di errore finale
    const container = domElements.availableNftsContainer;
    if (container) {
      container.innerHTML = `
        <div class="error-state critical">
          <i class="ri-error-warning-line"></i>
          <p>Non è stato possibile caricare i tuoi NFT. Controlla la connessione e assicurati che il wallet sia connesso alla rete Ethereum.</p>
          <button id="retryNftLoadFinal" class="btn">Riprova</button>
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
function openStakeModal(tokenId) {
  // Implementazione apertura modal di staking
  console.log(`🔄 Apertura modal staking per NFT #${tokenId}`);
  // ...
}

// Esporta le funzioni per utilizzo esterno
export { 
  loadAvailableNfts, 
  clearNftsUI,
  showLoader
};