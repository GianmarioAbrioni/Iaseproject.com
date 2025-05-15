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
    console.log('🔄 Caricamento NFTs utilizzando nftReader.js con Infura...');
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
        
        // Imposta HTML con i dati dell'NFT
        nftElement.innerHTML = `
          <div class="nft-image">
            <img src="${metadata.image}" alt="NFT #${tokenId}" loading="lazy">
          </div>
          <div class="nft-info">
            <h3>NFT #${tokenId}</h3>
            <div class="nft-details">
              <span class="nft-rarity ${metadata.rarity?.toLowerCase() || 'standard'}">${metadata.rarity || 'Standard'}</span>
              <span class="nft-booster">${metadata['AI-Booster'] || metadata.aiBooster || 'X1.0'}</span>
            </div>
          </div>
          <div class="nft-card-actions">
            <button class="btn stake-btn" data-nft-id="${tokenId}">
              <i class="ri-login-box-line"></i> Stake
            </button>
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
          <p>Errore nel caricamento degli NFT. <a href="#" id="retryNftLoad">Riprova</a></p>
        </div>`;
      
      // Aggiungi event listener al link di retry
      const retryLink = container.querySelector('#retryNftLoad');
      if (retryLink) {
        retryLink.addEventListener('click', function(e) {
          e.preventDefault();
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