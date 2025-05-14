/**
 * IASE Staking Fallback System
 * Questo script implementa un sistema di fallback per il caricamento degli NFT
 * quando le API del server non rispondono correttamente.
 */

// Inizializza il sistema di fallback quando il documento è caricato
document.addEventListener('DOMContentLoaded', function() {
  console.log("🔄 Inizializzazione sistema di fallback per staking IASE...");
  initFallbackSystem();
});

// Inizializza il sistema di fallback
function initFallbackSystem() {
  // Aggiungi caricamento di ethers.js se non presente
  if (!window.ethers) {
    loadScript('https://cdn.ethers.io/lib/ethers-5.6.umd.min.js')
      .then(() => {
        console.log("✅ ethers.js caricato con successo");
        setupFallbackEvents();
      })
      .catch(error => {
        console.error("❌ Errore caricamento ethers.js:", error);
      });
  } else {
    console.log("✅ ethers.js già presente, inizializzazione immediata");
    setupFallbackEvents();
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
async function loadNFTsDirectFromBlockchain(walletAddress) {
  console.log("🔍 Tentativo di caricamento NFT direttamente dalla blockchain per:", walletAddress);
  
  try {
    // Se l'API diretta è disponibile, usala
    if (window.IASEDirectBlockchainAPI) {
      const result = await window.IASEDirectBlockchainAPI.getNFTs(walletAddress);
      console.log("✅ NFT recuperati con API diretta:", result);
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