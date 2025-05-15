/**
 * IASE Project - Staking NFT
 * Modulo principale per il funzionamento del sistema di staking
 * 
 * Questo file gestisce il caricamento e la visualizzazione degli NFT,
 * utilizzando le funzionalità ottimizzate di nftReader.js
 */

// Importazione delle funzioni da nftReader.js (ES6 module syntax)
import { getUserNFTs, getNFTMetadata, loadAllIASENFTs } from './nftReader.js';

// Contanti di configurazione
const STAKING_API_ENDPOINT = '/api/staking';
const IASE_NFT_CONTRACT = '0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F';

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
    const walletAddress = event.detail;
    console.log(`✅ Wallet connesso: ${walletAddress}`);
    
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
    // Utilizzerà automaticamente il metodo ottimale per il contratto (Enumerable o Transfer events)
    console.log('🔄 Caricamento NFTs utilizzando nftReader.js con metodo dual-mode...');
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
        
        // Crea elemento per l'NFT
        const nftElement = document.createElement('div');
        nftElement.classList.add('nft-card');
        
        // Imposta HTML con i dati dell'NFT in base al CSS esistente
        nftElement.innerHTML = `
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
              <div class="reward-rate">
                <span class="reward-label">Daily Reward:</span>
                <span class="reward-value">33.33 IASE</span>
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
    const allNfts = await loadAllIASENFTs();
    
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
      const nftElement = document.createElement('div');
      nftElement.classList.add('nft-card');
      
      nftElement.innerHTML = `
        <div class="nft-image">
          <img src="${nft.image}" alt="NFT #${nft.id}" loading="lazy">
        </div>
        <div class="nft-details">
          <h3 class="nft-title">NFT #${nft.id}</h3>
          <div class="nft-id">Token ID: ${nft.id}</div>
          <div class="rarity-badge ${nft.rarity?.toLowerCase() || 'standard'}">${nft.rarity || 'Standard'}</div>
          
          <div class="nft-rewards">
            <div class="reward-rate">
              <span class="reward-label">AI Booster:</span>
              <span class="reward-value">${nft['AI-Booster'] || nft.aiBooster || 'X1.0'}</span>
            </div>
            <div class="reward-rate">
              <span class="reward-label">Daily Reward:</span>
              <span class="reward-value">33.33 IASE</span>
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