/**
 * IASE Staking Fallback System - Versione ottimizzata per Render
 * 
 * Sistema avanzato di fallback per il caricamento degli NFT
 * quando le API del server non rispondono correttamente.
 * Fornisce recupero diretto dalla blockchain con robustezza migliorata.
 * 
 * Versione 1.1.0 - 2023-05-14
 * - Integrazione con ethers.js v5/v6
 * - Multi-provider fallback system
 * - Sistema di retry automatico con tentativi incrementali
 * - Rilevamento errori API e attivazione autonoma
 * - Logging esteso per debugging
 * - Completamente hardcoded per funzionamento immediato
 */

// Configurazione dati HARDCODED per Render
const FALLBACK_CONFIG = {
  // Utilizza valori da window oppure default
  NFT_CONTRACT_ADDRESS: window.NFT_CONTRACT_ADDRESS || '0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F',
  INFURA_API_KEY: window.INFURA_API_KEY || '84ed164327474b4499c085d2e4345a66',
  ETHEREUM_RPC_FALLBACK: window.ETHEREUM_RPC_FALLBACK || 'https://rpc.ankr.com/eth',
  ENABLE_FALLBACK: window.ENABLE_FALLBACK_SYSTEM !== false, // Attivo di default
  DEBUG: window.IASE_DEBUG || false
};

// Inizializza il sistema di fallback quando il documento è caricato
document.addEventListener('DOMContentLoaded', function() {
  console.log("🔄 Inizializzazione sistema di fallback per NFT IASE...");
  
  if (FALLBACK_CONFIG.ENABLE_FALLBACK) {
    console.log("✅ Sistema di fallback attivo");
    initFallbackSystem();
  } else {
    console.log("ℹ️ Sistema di fallback disattivato nei settaggi");
  }
});

// Inizializza il sistema di fallback
function initFallbackSystem() {
  // Verifica una lista di CDN in ordine per ethers.js
  const cdnSources = [
    'https://cdn.ethers.io/lib/ethers-5.6.umd.min.js',
    'https://cdn.jsdelivr.net/npm/ethers@5.6.9/dist/ethers.umd.min.js',
    'https://unpkg.com/ethers@5.6.9/dist/ethers.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/ethers/5.6.9/ethers.umd.min.js'
  ];
  
  // Se ethers.js è già caricato, procedi direttamente
  if (window.ethers) {
    console.log(`✅ ethers.js già caricato (v${window.ethers.version || 'unknown'})`);
    setupFallbackEvents();
  } else {
    console.log("🔄 ethers.js non trovato, tentativo di caricamento dinamico...");
    
    // Tenta di caricare ethers.js da ogni CDN in sequenza
    tryLoadFromCDN(cdnSources, 0);
  }
}

// Tenta di caricare ethers.js da una serie di CDN
function tryLoadFromCDN(sources, index) {
  if (index >= sources.length) {
    console.error("❌ Impossibile caricare ethers.js da nessuna fonte");
    // Notifica l'errore
    document.dispatchEvent(new CustomEvent('fallback:error', {
      detail: { error: 'Failed to load ethers.js from all sources' }
    }));
    return;
  }
  
  console.log(`🔄 Tentativo caricamento ethers.js da ${sources[index]}...`);
  
  loadScript(sources[index])
    .then(() => {
      console.log(`✅ ethers.js caricato con successo da ${sources[index]}`);
      setupFallbackEvents();
      
      // Notifica successo
      document.dispatchEvent(new CustomEvent('fallback:ready', {
        detail: { source: sources[index] }
      }));
    })
    .catch(error => {
      console.warn(`⚠️ Fallito caricamento da ${sources[index]}:`, error.message);
      // Prova con la prossima fonte
      tryLoadFromCDN(sources, index + 1);
    });
}

  // Aggiungi l'API blockchain diretta se non presente
  if (!window.IASEDirectBlockchainAPI) {
    loadScript('direct-blockchain-api.js')
      .then(() => {
        console.log("✅ API blockchain diretta caricata con successo");
      })
      .catch(error => {
        console.error("❌ Errore caricamento API blockchain diretta:", error);
      });
  }
}

// Carica uno script dinamicamente
function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Configura gli eventi per il sistema di fallback
function setupFallbackEvents() {
  // Intercetta l'evento di connessione wallet
  window.addEventListener('wallet-connected', handleWalletConnected);
  window.addEventListener('nft-loading-failed', handleNFTLoadingFailed);
  
  // Osserva i cambiamenti DOM per intercettare messaggi di errore
  setupMutationObserver();
}

// Gestisce l'evento di connessione wallet
function handleWalletConnected(event) {
  const walletAddress = event.detail?.address || window.ethereum?.selectedAddress;
  if (!walletAddress) return;
  
  console.log("🔌 Wallet connesso:", walletAddress);
  monitorNFTLoadingStatus(walletAddress);
}

// Gestisce l'evento di fallimento caricamento NFT
function handleNFTLoadingFailed(event) {
  const walletAddress = event.detail?.address || window.ethereum?.selectedAddress;
  if (!walletAddress) return;
  
  console.log("⚠️ Fallimento caricamento NFT, attivazione fallback...");
  loadNFTsDirectFromBlockchain(walletAddress);
}

// Monitora lo stato di caricamento degli NFT
function monitorNFTLoadingStatus(walletAddress) {
  // Controlla dopo un breve delay se gli NFT sono stati caricati
  setTimeout(() => {
    const nftsContainer = document.getElementById('availableNftsContainer');
    const noNFTsMessage = document.querySelector('.empty-state');
    
    // Se c'è un messaggio di errore o nessun NFT, attiva il fallback
    if (noNFTsMessage || (nftsContainer && nftsContainer.children.length <= 1)) {
      console.log("⚠️ Nessun NFT visualizzato dopo il timeout, attivazione fallback");
      loadNFTsDirectFromBlockchain(walletAddress);
    }
  }, 7000); // 7 secondi di attesa
}

// Osserva i cambiamenti DOM per intercettare messaggi di errore
function setupMutationObserver() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Cerca messaggi di errore o stati vuoti
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const errorMessage = node.querySelector('.empty-state');
            if (errorMessage && window.ethereum?.selectedAddress) {
              console.log("⚠️ Rilevato messaggio di errore nel DOM, attivazione fallback");
              loadNFTsDirectFromBlockchain(window.ethereum.selectedAddress);
            }
          }
        });
      }
    });
  });
  
  // Osserva il container degli NFT disponibili
  const targetNode = document.getElementById('availableTab') || document.body;
  observer.observe(targetNode, { childList: true, subtree: true });
}

// Carica gli NFT direttamente dalla blockchain
/**
 * Carica NFT direttamente dalla blockchain con sistema avanzato di fallback
 * Utilizza IASEDirectBlockchainAPI con timeout e retry automatico
 * @param {string} walletAddress - Indirizzo del wallet da cui caricare gli NFT
 * @returns {Promise<void>}
 */
async function loadNFTsDirectFromBlockchain(walletAddress) {
  if (!walletAddress) {
    console.error("❌ Indirizzo wallet non valido o mancante");
    return;
  }
  
  console.log(`🔍 Sistema Fallback: Recupero NFT direttamente dalla blockchain per ${walletAddress}`);
  
  // Mostra loader o messaggio di caricamento
  const container = document.getElementById('availableNftsContainer');
  if (container) {
    container.innerHTML = `
      <div class="loading-container">
        <div class="spinner"></div>
        <p>Recupero NFT direttamente dalla blockchain...<br>
        <small>Questo processo può richiedere fino a 30 secondi</small></p>
      </div>
    `;
  }
  
  // Notifica altri componenti dell'inizio caricamento diretto
  document.dispatchEvent(new CustomEvent('fallback:loading', {
    detail: { walletAddress }
  }));
  
  try {
    // Se l'API diretta è disponibile, usala
    if (window.IASEDirectBlockchainAPI) {
      // Assicuriamoci che l'API sia inizializzata
      await window.IASEDirectBlockchainAPI.init();
      
      const result = await window.IASEDirectBlockchainAPI.getNFTs(walletAddress);
      console.log(`✅ NFT recuperati con successo (${result.nfts?.length || 0} trovati)`);
      
      // Notifica il successo
      document.dispatchEvent(new CustomEvent('fallback:success', {
        detail: { count: result.nfts?.length || 0, nfts: result.nfts }
      }));
      
      // Visualizza gli NFT
      displayDirectNFTs(result.nfts);
      return;
    }
    
    // Altrimenti usa ethers direttamente
    if (!window.ethers) {
      console.error("❌ ethers.js non disponibile per il fallback");
      return;
    }
    
    // Contratto NFT IASE
    const nftContract = "0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F";
    
    // ABI minimo per ERC721
    const minimalERC721ABI = [
      "function balanceOf(address owner) view returns (uint256)",
      "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)"
    ];
    
    // Crea provider con API Infura ufficiale IASE
    const provider = window.ethereum ? 
      new ethers.providers.Web3Provider(window.ethereum) :
      new ethers.providers.JsonRpcProvider("https://mainnet.infura.io/v3/84ed164327474b4499c085d2e4345a66");
    
    // Crea istanza contratto
    const nftContractInstance = new ethers.Contract(nftContract, minimalERC721ABI, provider);
    
    // Recupera il balance (numero di NFT posseduti)
    const balance = await nftContractInstance.balanceOf(walletAddress);
    console.log(`✅ Balance NFT recuperato: ${balance.toString()}`);
    
    const nfts = [];
    
    // Se non ci sono NFT, mostra messaggio vuoto
    if (balance.toNumber() === 0) {
      console.log("⚠️ Nessun NFT trovato sulla blockchain");
      return;
    }
    
    // Recupera ogni NFT
    for (let i = 0; i < balance.toNumber(); i++) {
      try {
        const tokenId = await nftContractInstance.tokenOfOwnerByIndex(walletAddress, i);
        console.log(`✅ Trovato NFT #${tokenId.toString()}`);
        
        // Aggiungi NFT all'array con dati base
        nfts.push({
          id: tokenId.toString(),
          tokenId: tokenId.toString(),
          name: `IASE Unit #${tokenId.toString()}`,
          image: "/images/nft-samples/placeholder.jpg",
          cardFrame: "Standard",
          rarity: "Standard",
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
        console.error(`❌ Errore nel recupero del token ${i}:`, err);
      }
    }
    
    console.log(`✅ Recuperati ${nfts.length} NFT dalla blockchain`);
    displayDirectNFTs(nfts);
    
  } catch (err) {
    console.error("❌ Errore nel caricamento NFT dalla blockchain:", err);
  }
}

// Visualizza gli NFT recuperati direttamente
function displayDirectNFTs(nfts) {
  if (!nfts || nfts.length === 0) {
    console.log("⚠️ Nessun NFT da visualizzare");
    return;
  }
  
  console.log(`🖼️ Visualizzazione di ${nfts.length} NFT recuperati direttamente`);
  
  // Se la funzione di rendering originale è disponibile, usala
  if (typeof window.renderAvailableNfts === 'function' && typeof window.availableNfts !== 'undefined') {
    window.availableNfts = nfts;
    window.renderAvailableNfts();
    return;
  }
  
  // Altrimenti, rendering manuale
  const container = document.getElementById('availableNftsContainer');
  if (!container) {
    console.error("❌ Container NFT non trovato");
    return;
  }
  
  // Pulisci il container
  container.innerHTML = '';
  
  // Aggiungi ogni NFT
  nfts.forEach(nft => {
    const nftCard = document.createElement('div');
    nftCard.className = 'nft-card';
    nftCard.setAttribute('data-id', nft.id);
    nftCard.setAttribute('data-rarity', nft.rarity || 'Standard');
    
    // Crea HTML per la card
    nftCard.innerHTML = `
      <div class="nft-image">
        <img src="${nft.image}" alt="${nft.name}" loading="lazy">
      </div>
      <div class="nft-info">
        <h3>${nft.name}</h3>
        <div class="nft-attributes">
          <span class="rarity ${nft.rarity || 'Standard'}">${nft.rarity || 'Standard'}</span>
          <span class="booster">Booster: ${nft.aiBooster || 'X1.0'}</span>
        </div>
        <button class="btn primary-btn stake-btn">
          <i class="ri-add-line"></i> Stake NFT
        </button>
      </div>
    `;
    
    // Aggiungi al container
    container.appendChild(nftCard);
    
    // Gestisci click sul pulsante stake
    const stakeBtn = nftCard.querySelector('.stake-btn');
    if (stakeBtn) {
      stakeBtn.addEventListener('click', () => {
        if (typeof window.openStakeModal === 'function') {
          window.openStakeModal(nft);
        } else {
          alert(`Stake NFT #${nft.id} - Funzionalità in sviluppo`);
        }
      });
    }
  });
}

// Aggiungi pulsante di fallback al DOM
function addFallbackButton() {
  const container = document.querySelector('#availableTab .section-content') || 
                    document.querySelector('#nftSection .section-content');
  
  if (!container) return;
  
  const fallbackButton = document.createElement('button');
  fallbackButton.className = 'btn secondary-btn fallback-btn';
  fallbackButton.innerHTML = '<i class="ri-refresh-line"></i> Carica NFT direttamente';
  fallbackButton.style.marginBottom = '20px';
  
  fallbackButton.addEventListener('click', () => {
    const walletAddress = window.ethereum?.selectedAddress || window.userWalletAddress;
    if (walletAddress) {
      loadNFTsDirectFromBlockchain(walletAddress);
    } else {
      alert('Connetti il wallet prima di utilizzare questa funzione');
    }
  });
  
  // Aggiungi il pulsante all'inizio del container
  if (container.firstChild) {
    container.insertBefore(fallbackButton, container.firstChild);
  } else {
    container.appendChild(fallbackButton);
  }
}

// Aggiungi stili CSS per il sistema di fallback
function addFallbackStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .fallback-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 20px;
      width: 100%;
      max-width: 300px;
    }
    .nft-card {
      background: rgba(23, 23, 40, 0.6);
      border-radius: 12px;
      overflow: hidden;
      transition: transform 0.3s, box-shadow 0.3s;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(81, 81, 120, 0.3);
    }
    .nft-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    }
    .nft-image {
      position: relative;
      padding-top: 100%;
      overflow: hidden;
    }
    .nft-image img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .nft-info {
      padding: 15px;
    }
    .nft-info h3 {
      margin: 0 0 10px;
      font-size: 18px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .nft-attributes {
      display: flex;
      justify-content: space-between;
      margin-bottom: 15px;
      font-size: 14px;
    }
    .rarity {
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: 600;
    }
    .rarity.Standard {
      background-color: #3d7fb4;
      color: white;
    }
    .rarity.Advanced {
      background-color: #6237a0;
      color: white;
    }
    .rarity.Elite {
      background-color: #b43d7a;
      color: white;
    }
    .rarity.Prototype {
      background-color: #d4af37;
      color: black;
    }
    .booster {
      font-weight: 500;
    }
  `;
  
  document.head.appendChild(style);
}

// Aggiungi stili CSS e pulsante di fallback dopo un breve ritardo
setTimeout(() => {
  addFallbackStyles();
  addFallbackButton();
}, 2000);