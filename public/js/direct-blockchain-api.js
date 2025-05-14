/**
 * IASE Direct Blockchain API
 * Sistema di fallback per recuperare NFT direttamente dalla blockchain
 * quando il backend API non risponde correttamente
 */

window.IASEDirectBlockchainAPI = {
  // Stato e configurazione
  config: {
    nftContractAddress: "0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F", // Indirizzo contratto IASE NFT
    infuraEndpoint: "https://mainnet.infura.io/v3/84ed164327474b4499c085d2e4345a66", // Endpoint Infura ufficiale IASE
    ethersLoaded: false
  },
  
  // ABI minimale per ERC721 Enumerable
  minimalERC721ABI: [
    "function balanceOf(address owner) view returns (uint256)",
    "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
    "function tokenURI(uint256 tokenId) view returns (string)"
  ],
  
  // Inizializza sistema di fallback
  async init() {
    console.log("🚀 IASE Direct Blockchain API: Inizializzazione sistema di fallback");
    
    // Rileva se ethers è già caricato
    if (window.ethers) {
      console.log("✅ ethers.js già caricato");
      this.config.ethersLoaded = true;
      return true;
    }
    
    // Carica ethers.js dinamicamente
    try {
      console.log("🔄 Caricamento dinamico di ethers.js");
      await this.loadEthers();
      console.log("✅ ethers.js caricato con successo");
      this.config.ethersLoaded = true;
      return true;
    } catch (error) {
      console.error("❌ Errore caricamento ethers.js:", error);
      return false;
    }
  },
  
  // Carica ethers.js dinamicamente
  loadEthers() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.ethers.io/lib/ethers-5.6.umd.min.js';
      script.async = true;
      script.onload = () => {
        if (window.ethers) {
          resolve(true);
        } else {
          reject(new Error("ethers.js caricato ma non accessibile"));
        }
      };
      script.onerror = () => reject(new Error("Impossibile caricare ethers.js"));
      document.head.appendChild(script);
    });
  },
  
  // Crea provider Ethereum (usa wallet connesso se disponibile, altrimenti Infura)
  createProvider() {
    if (!window.ethers) {
      throw new Error("ethers.js non caricato");
    }
    
    if (window.ethereum) {
      console.log("✅ Creazione provider con wallet connesso");
      return new ethers.providers.Web3Provider(window.ethereum);
    } else {
      console.log("⚠️ Wallet non disponibile, uso Infura come fallback");
      return new ethers.providers.JsonRpcProvider(this.config.infuraEndpoint);
    }
  },
  
  // Normalizza e pulisci indirizzo wallet
  normalizeAddress(address) {
    if (!address) return null;
    
    // Rimuovi spazi e converti a lowercase
    let cleanAddress = address.trim().toLowerCase();
    
    // Rimuovi ellissi se presenti
    if (cleanAddress.includes('...')) {
      cleanAddress = cleanAddress.replace(/\.\.\./g, '');
    }
    
    // Assicurati che inizi con 0x
    if (!cleanAddress.startsWith('0x')) {
      cleanAddress = '0x' + cleanAddress;
    }
    
    // Verifica lunghezza minima
    if (cleanAddress.length < 40) {
      console.error("⚠️ Indirizzo troppo corto dopo normalizzazione:", cleanAddress);
      return null;
    }
    
    return cleanAddress;
  },
  
  // Recupera NFT IASE direttamente dalla blockchain
  async getNFTs(walletAddress, contractAddressOverride = null) {
    console.log("🔍 Recupero NFT IASE direttamente dalla blockchain");
    
    try {
      // Assicurati che ethers sia caricato
      if (!this.config.ethersLoaded) {
        await this.init();
      }
      
      // Normalizza indirizzo wallet
      const cleanAddress = this.normalizeAddress(walletAddress);
      if (!cleanAddress) {
        throw new Error("Indirizzo wallet non valido");
      }
      console.log("🔑 Indirizzo wallet normalizzato:", cleanAddress);
      
      // Usa indirizzo contratto override o default
      const contractAddress = contractAddressOverride || this.config.nftContractAddress;
      console.log("📄 Contratto NFT:", contractAddress);
      
      // Crea provider e istanza contratto
      const provider = this.createProvider();
      const contract = new ethers.Contract(contractAddress, this.minimalERC721ABI, provider);
      
      // Recupera balance (numero NFT posseduti)
      const balance = await contract.balanceOf(cleanAddress);
      console.log(`✅ Balance NFT: ${balance.toString()}`);
      
      // Se non ci sono NFT, ritorna array vuoto
      if (balance.toNumber() === 0) {
        return { nfts: [] };
      }
      
      // Array per i risultati
      const nfts = [];
      
      // Recupera ogni NFT
      for (let i = 0; i < balance.toNumber(); i++) {
        try {
          // Token ID
          const tokenId = await contract.tokenOfOwnerByIndex(cleanAddress, i);
          console.log(`✅ Trovato NFT #${tokenId.toString()}`);
          
          // Crea oggetto NFT base
          const nft = {
            id: tokenId.toString(),
            tokenId: tokenId.toString(),
            name: `IASE Unit #${tokenId.toString()}`,
            image: "/images/nft-samples/placeholder.jpg", // Immagine predefinita
            contractAddress: contractAddress,
            cardFrame: "Standard", // Valore predefinito, verrà aggiornato dopo
            rarity: "Standard",
            aiBooster: "X1.0", // Valore predefinito
            "AI-Booster": "X1.0",
            // Metadati predefiniti
            iaseTraits: {
              orbitalModule: "standard",
              energyPanels: "standard", 
              antennaType: "standard",
              aiCore: "standard",
              evolutiveTrait: "standard"
            }
          };
          
          // Aggiungi all'array
          nfts.push(nft);
          
          // Prova a recuperare i metadati in background (non bloccare il processo)
          this.getTokenMetadata(contract, tokenId.toString())
            .then(metadata => {
              if (metadata) {
                // Aggiorna i dati esistenti con i metadati reali
                this.updateNFTWithMetadata(nft, metadata);
                console.log(`✅ Metadati recuperati per NFT #${tokenId.toString()}`);
              }
            })
            .catch(err => {
              console.warn(`⚠️ Errore nel recupero metadati per NFT #${tokenId.toString()}:`, err);
            });
          
        } catch (err) {
          console.error(`❌ Errore nel recupero NFT #${i}:`, err);
        }
      }
      
      console.log(`✅ Recuperati ${nfts.length} NFT dalla blockchain`);
      return { nfts };
      
    } catch (error) {
      console.error("❌ Errore nel recupero NFT dalla blockchain:", error);
      throw error;
    }
  },
  
  // Recupera metadati di un token
  async getTokenMetadata(contract, tokenId) {
    try {
      // Ottieni URI dei metadati
      const tokenURI = await contract.tokenURI(tokenId);
      console.log(`🔗 Token URI per #${tokenId}:`, tokenURI);
      
      // Verifica se l'URI è valido
      if (!tokenURI) {
        console.warn(`⚠️ URI non valido per token #${tokenId}`);
        return null;
      }
      
      // Normalizza URI (IPFS o HTTP)
      const metadataURL = this.normalizeURI(tokenURI);
      
      // Recupera metadati
      const response = await fetch(metadataURL);
      if (!response.ok) {
        console.warn(`⚠️ Risposta non OK per metadati #${tokenId}: ${response.status}`);
        return null;
      }
      
      // Decodifica JSON
      const metadata = await response.json();
      return metadata;
      
    } catch (error) {
      console.error(`❌ Errore nel recupero metadati per token #${tokenId}:`, error);
      return null;
    }
  },
  
  // Normalizza URI del token (gestisce IPFS, HTTP, ecc.)
  normalizeURI(uri) {
    // Per IPFS
    if (uri.startsWith('ipfs://')) {
      return uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    
    // Per contenuti base64
    if (uri.startsWith('data:application/json;base64,')) {
      // Decodifica base64
      const base64 = uri.replace('data:application/json;base64,', '');
      const jsonString = atob(base64);
      return JSON.parse(jsonString);
    }
    
    // URI http standard
    return uri;
  },
  
  // Aggiorna NFT con metadati recuperati
  updateNFTWithMetadata(nft, metadata) {
    if (!metadata) return;
    
    // Aggiorna proprietà di base
    if (metadata.name) nft.name = metadata.name;
    if (metadata.description) nft.description = metadata.description;
    if (metadata.image) nft.image = metadata.image;
    
    // Normalizza URI immagine se necessario
    if (nft.image && nft.image.startsWith('ipfs://')) {
      nft.image = nft.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    
    // Aggiorna attributi
    if (metadata.attributes) {
      nft.attributes = metadata.attributes;
      nft.traits = metadata.attributes;
      
      // Estrai rarity/cardFrame
      const cardFrameAttr = metadata.attributes.find(attr => 
        attr.trait_type === 'Card Frame' || 
        attr.trait_type === 'rarity'
      );
      
      if (cardFrameAttr && cardFrameAttr.value) {
        nft.rarity = cardFrameAttr.value;
        nft.cardFrame = cardFrameAttr.value;
      }
      
      // Estrai AI-Booster
      const aiBoosterAttr = metadata.attributes.find(attr => 
        attr.trait_type === 'AI-Booster' || 
        attr.trait_type === 'aiBooster'
      );
      
      if (aiBoosterAttr && aiBoosterAttr.value) {
        nft.aiBooster = aiBoosterAttr.value;
        nft['AI-Booster'] = aiBoosterAttr.value;
      }
      
      // Funzione helper per estrarre attributi per iaseTraits
      const getIaseTraitValue = (traitNames) => {
        for (const name of traitNames) {
          const attr = metadata.attributes.find(a => 
            a.trait_type && a.trait_type.toUpperCase() === name.toUpperCase()
          );
          if (attr && attr.value) return attr.value;
        }
        return 'standard';
      };
      
      // Aggiorna iaseTraits
      nft.iaseTraits = {
        orbitalModule: getIaseTraitValue(['Orbital Design Module', 'Orbital Module']),
        energyPanels: getIaseTraitValue(['Energy Panels']),
        antennaType: getIaseTraitValue(['Antenna Type']),
        aiCore: getIaseTraitValue(['AI Core']),
        evolutiveTrait: getIaseTraitValue(['Evolutive Trait'])
      };
    }
    
    // Aggiorna nel DOM se possible (event dispatch)
    if (window.dispatchEvent) {
      const updateEvent = new CustomEvent('nft-metadata-updated', { detail: { nft } });
      window.dispatchEvent(updateEvent);
    }
  }
};

// Auto-inizializzazione quando il documento è pronto
document.addEventListener('DOMContentLoaded', () => {
  // Inizializza sistema di fallback in background
  setTimeout(() => {
    window.IASEDirectBlockchainAPI.init()
      .then(success => {
        if (success) {
          console.log("✅ Sistema di fallback blockchain inizializzato con successo");
        }
      })
      .catch(err => {
        console.warn("⚠️ Inizializzazione sistema fallback fallita:", err);
      });
  }, 1000);
});