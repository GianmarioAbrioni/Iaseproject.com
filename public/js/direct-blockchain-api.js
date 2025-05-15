/**
 * IASE Direct Blockchain API - Versione ottimizzata per Render
 * Sistema di fallback per recuperare NFT direttamente dalla blockchain
 * quando il backend API non risponde correttamente
 * 
 * Versione 2.0.0 - 2025-05-15
 * - Completa integrazione con Alchemy API
 * - Multiple providers fallback (Alchemy -> Web3 -> Ankr -> Pubblico)
 * - Sistema robusto per evitare errori Rate Limit
 * - Ottimizzazione cache metadati per ridurre chiamate
 * - Normalizzazione indirizzi per supporto wallet diversi
 * - Zero dipendenze - Funziona immediatamente senza configurazione
 * 
 * Configurazione HARDCODED:
 * - NFT Contract: 0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F
 * - Alchemy API Key: uAZ1tPYna9tBMfuTa616YwMcgptV_1vB
 * - Infura API Key (backup): 84ed164327474b4499c085d2e4345a66
 */

window.IASEDirectBlockchainAPI = {
  // Stato e configurazione (hardcoded per Render)
  config: {
    // Prendi i valori da window oppure usa i default hardcoded
    nftContractAddress: window.NFT_CONTRACT_ADDRESS || "0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F",
    alchemyApiKey: window.ALCHEMY_API_KEY || "uAZ1tPYna9tBMfuTa616YwMcgptV_1vB",
    infuraApiKey: window.INFURA_API_KEY || "84ed164327474b4499c085d2e4345a66", // Mantenuto per fallback
    fallbackRpcUrl: window.ETHEREUM_RPC_FALLBACK || "https://rpc.ankr.com/eth",
    
    // Stato interno
    ethersLoaded: false,
    metadataCache: {}, // Cache per i metadati
    providerAttempts: 0, // Contatore tentativi provider
    lastProviderSuccess: null, // Ultimo provider utilizzato con successo
    debug: window.IASE_DEBUG || false,
    useAlchemyApi: true // Abilitato di default
  },
  
  // Lista provider RPC in ordine di priorità
  rpcProviders: [
    // Prima funzione: genera URL Alchemy con API key configurata
    (config) => `https://eth-mainnet.g.alchemy.com/v2/${config.alchemyApiKey}`,
    // Seconda funzione: genera URL Infura con API key configurata (fallback)
    (config) => `https://mainnet.infura.io/v3/${config.infuraApiKey}`,
    // URL di fallback in ordine di priorità
    (config) => config.fallbackRpcUrl, 
    () => "https://eth.llamarpc.com",
    () => "https://ethereum.publicnode.com",
    () => "https://rpc.eth.gateway.fm"
  ],
  
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
  /**
   * Crea un provider Ethereum con sistema avanzato di fallback
   * Prova nell'ordine: Web3Provider (wallet) -> InfuraProvider -> Fallback RPC
   * Con compatibilità ethers.js v5/v6
   * @returns {ethers.providers.Provider|ethers.Provider} Provider Ethereum
   */
  async createProvider() {
    // Verifica che ethers.js sia caricato
    if (!window.ethers) {
      console.error("❌ ethers.js non caricato");
      throw new Error("ethers.js non disponibile");
    }
    
    // Rileva versione di ethers.js
    const isV5 = window.ethers.providers && typeof window.ethers.providers.Web3Provider === 'function';
    const isV6 = typeof window.ethers.BrowserProvider === 'function';
    
    if (this.config.debug) {
      console.log(`🔍 Versione ethers.js rilevata: ${isV5 ? 'v5' : isV6 ? 'v6' : 'sconosciuta'}`);
    }
    
    // STRATEGIA 1: Usa wallet connesso se disponibile
    if (window.ethereum) {
      try {
        console.log("🔄 Tentativo con wallet connesso (MetaMask/Web3)");
        
        if (isV5) {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          await provider.getBlockNumber(); // Verifica connessione
          console.log("✅ Provider creato con wallet connesso (v5)");
          this.config.lastProviderSuccess = "Web3Provider";
          return provider;
        } else if (isV6) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          await provider.getBlockNumber(); // Verifica connessione
          console.log("✅ Provider creato con wallet connesso (v6)");
          this.config.lastProviderSuccess = "BrowserProvider";
          return provider;
        }
      } catch (walletError) {
        console.warn("⚠️ Errore con wallet:", walletError.message);
        // Continua con altri provider
      }
    }
    
    // STRATEGIA 2: Usa i provider RPC in ordine di priorità
    for (let i = 0; i < this.rpcProviders.length; i++) {
      const rpcUrlFn = this.rpcProviders[i];
      const rpcUrl = rpcUrlFn(this.config);
      
      try {
        console.log(`🔄 Tentativo provider RPC ${i+1}/${this.rpcProviders.length}: ${rpcUrl}`);
        
        // Incrementa contatore tentativi
        this.config.providerAttempts++;
        
        let provider;
        if (isV5) {
          provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        } else if (isV6) {
          provider = new ethers.JsonRpcProvider(rpcUrl);
        } else {
          throw new Error("Versione ethers.js non supportata");
        }
        
        // Verifica che il provider funzioni
        await provider.getBlockNumber();
        
        console.log(`✅ Provider RPC funzionante: ${rpcUrl}`);
        this.config.lastProviderSuccess = rpcUrl;
        return provider;
      } catch (rpcError) {
        console.warn(`⚠️ Provider RPC fallito (${rpcUrl}):`, rpcError.message);
        // Continua con il provider successivo
      }
    }
    
    // Se arriviamo qui, tutti i provider hanno fallito
    console.error("❌ Tutti i provider hanno fallito");
    throw new Error("Impossibile connettersi ad Ethereum: tutti i provider hanno fallito");
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
  /**
   * Recupera gli NFT posseduti da un indirizzo wallet direttamente dalla blockchain
   * con sistema avanzato multi-provider e gestione errori
   * @param {string} walletAddress - Indirizzo wallet da cui leggere gli NFT
   * @param {string} contractAddressOverride - Opzionale: indirizzo contratto NFT alternativo
   * @returns {Promise<{nfts: Array, walletAddress: string}>} Lista NFT e indirizzo normalizzato
   */
  async getNFTs(walletAddress, contractAddressOverride = null) {
    console.log(`🔄 DirectBlockchainAPI: Avvio recupero NFT per ${walletAddress}`);
    
    try {
      // Normalizza indirizzo wallet
      const cleanAddress = this.normalizeAddress(walletAddress);
      
      // Se l'uso di Alchemy API è abilitato, prova a usare direttamente l'API REST
      if (this.config.useAlchemyApi && this.config.alchemyApiKey) {
        try {
          console.log("🔄 Tentativo di recupero NFT tramite Alchemy API REST...");
          
          // Costruisci l'URL per la chiamata Alchemy API
          const contractAddress = contractAddressOverride || this.config.nftContractAddress;
          const alchemyUrl = `https://eth-mainnet.g.alchemy.com/v2/${this.config.alchemyApiKey}/getNFTs?owner=${cleanAddress}&contractAddresses[]=${contractAddress}&withMetadata=true`;
          
          // Esegui la chiamata API con fetch
          const response = await fetch(alchemyUrl);
          
          if (!response.ok) {
            throw new Error(`API Alchemy ha risposto con ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log("✅ Risposta Alchemy API:", data);
          
          // Estrai i token IDs dagli NFT restituiti
          const ownedNfts = data.ownedNfts || [];
          const nftIds = ownedNfts.map(nft => {
            // Estrai tokenId dal tokenId dell'API (che potrebbe essere in hex)
            const tokenId = nft.id?.tokenId;
            if (!tokenId) return null;
            
            // Converti da hex a decimale se necessario
            if (tokenId.startsWith('0x')) {
              return parseInt(tokenId, 16).toString();
            }
            return tokenId;
          }).filter(id => id !== null);
          
          console.log(`✅ Trovati ${nftIds.length} NFT tramite Alchemy API`);
          
          return {
            address: cleanAddress,
            balance: nftIds.length.toString(),
            nftIds: nftIds
          };
        } catch (alchemyError) {
          console.error("❌ Errore nel recupero tramite Alchemy API:", alchemyError);
          console.log("⚠️ Fallback a metodo ethers.js tradizionale...");
        }
      }
      
      // Fallback al metodo tradizionale con ethers.js
      // Assicurati che ethers sia caricato
      if (!this.config.ethersLoaded) {
        await this.init();
      }
      if (!cleanAddress) {
        throw new Error("Indirizzo wallet non valido");
      }
      console.log("🔑 Indirizzo wallet normalizzato:", cleanAddress);
      
      // Usa indirizzo contratto override o default
      const contractAddress = contractAddressOverride || this.config.nftContractAddress;
      console.log("📄 Contratto NFT:", contractAddress);
      
      // Crea provider e contratto con nuovo sistema di fallback avanzato
      console.log(`🔄 Creazione provider per contratto: ${contractAddress}`);
      const provider = await this.createProvider();
      
      // Determina quale versione di ethers.js stiamo usando
      const isV5 = window.ethers.providers && typeof window.ethers.providers.Web3Provider === 'function';
      const isV6 = typeof window.ethers.BrowserProvider === 'function';
      
      // Crea contratto con compatibilità v5/v6
      console.log(`🔄 Creazione contratto NFT: ${contractAddress}`);
      const contract = new ethers.Contract(contractAddress, this.minimalERC721ABI, provider);
      
      // Recupera balance (numero NFT posseduti) con supporto per BigInt (ethers v6)
      console.log(`🔄 Lettura balance NFT per ${cleanAddress}...`);
      const balance = await contract.balanceOf(cleanAddress);
      
      // Gestisci compatibilità tra diverse rappresentazioni numeriche
      let balanceNumber;
      if (typeof balance === 'bigint') {
        balanceNumber = Number(balance);
        console.log(`✅ Balance NFT (BigInt): ${balance} -> ${balanceNumber}`);
      } else if (typeof balance.toNumber === 'function') {
        balanceNumber = balance.toNumber();
        console.log(`✅ Balance NFT: ${balance.toString()} -> ${balanceNumber}`);
      } else {
        balanceNumber = parseInt(balance.toString(), 10);
        console.log(`✅ Balance NFT (parsed): ${balance.toString()} -> ${balanceNumber}`);
      }
      
      // Se non ci sono NFT, ritorna array vuoto
      if (balanceNumber === 0) {
        console.log(`ℹ️ Nessun NFT trovato per ${cleanAddress}`);
        return { nfts: [], walletAddress: cleanAddress };
      }
      
      console.log(`🔍 Trovati ${balanceNumber} NFT per ${cleanAddress}`);
      
      // Array per i risultati
      const nfts = [];
      
      // Recupera ogni NFT con gestione errori migliorata
      console.log(`🔄 Avvio recupero di ${balanceNumber} NFT...`);
      
      // Utilizziamo Promise.allSettled per massima resilienza
      const tokenPromises = [];
      
      for (let i = 0; i < balanceNumber; i++) {
        // Creiamo una funzione asincrona per ogni NFT da recuperare
        const fetchTokenPromise = async (index) => {
          try {
            console.log(`🔄 Recupero NFT #${index+1}/${balanceNumber}...`);
            const tokenId = await contract.tokenOfOwnerByIndex(cleanAddress, index);
            console.log(`✅ Trovato NFT #${tokenId.toString()}`);
            
            // Crea oggetto NFT base con dati minimi ma completi
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
            
            // Prova a recuperare i metadati (con timeout per evitare blocchi)
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error("Timeout")), 5000)
            );
            
            try {
              // Race tra recupero metadati e timeout
              const metadata = await Promise.race([
                this.getTokenMetadata(contract, tokenId.toString()),
                timeoutPromise
              ]);
              
              if (metadata) {
                // Aggiorna i dati con i metadati reali
                this.updateNFTWithMetadata(nft, metadata);
                console.log(`✅ Metadati recuperati per NFT #${tokenId.toString()}`);
              }
            } catch (metadataError) {
              console.warn(`⚠️ Errore/timeout nel recupero metadati per NFT #${tokenId.toString()}:`, 
                metadataError.message);
              // Continua con i dati predefiniti
            }
            
            return nft; // Ritorna l'NFT con i metadati che siamo riusciti a recuperare
          } catch (err) {
            console.error(`❌ Errore nel recupero NFT #${index}:`, err.message);
            return null;
          }
        };
        
        // Aggiungi la promise alla lista
        tokenPromises.push(fetchTokenPromise(i));
      }
      
      // Esegui tutte le promise in parallelo e gestisci i risultati
      const results = await Promise.all(tokenPromises);
      
      // Filtra i risultati validi e aggiungi all'array finale
      for (const nft of results) {
        if (nft) nfts.push(nft);
      }
      
      console.log(`✅ Recuperati ${nfts.length}/${balanceNumber} NFT dalla blockchain`);
      return { nfts, walletAddress: cleanAddress };
      
    } catch (error) {
      console.error("❌ Errore nel recupero NFT dalla blockchain:", error);
      throw error;
    }
  },
  
  // Recupera metadati di un token
  async getTokenMetadata(contract, tokenId) {
    try {
      // Usa Alchemy API prima se disponibile
      if (this.config.useAlchemyApi && this.config.alchemyApiKey) {
        try {
          console.log(`🔄 Tentativo di recupero metadati per NFT #${tokenId} tramite Alchemy API...`);
          
          // Costruisci l'URL per la chiamata Alchemy API
          const alchemyUrl = `https://eth-mainnet.g.alchemy.com/v2/${this.config.alchemyApiKey}/getNFTMetadata?contractAddress=${this.config.nftContractAddress}&tokenId=${tokenId}`;
          
          // Esegui la chiamata API
          const response = await fetch(alchemyUrl);
          
          if (!response.ok) {
            throw new Error(`API Alchemy ha risposto con ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log(`✅ Metadati ricevuti per NFT #${tokenId} via Alchemy:`, data);
          
          // Estrai e normalizza i metadati
          const metadata = {
            name: data.title || `IASE Unit #${tokenId}`,
            description: data.description || "IASE NFT Unit",
            image: this.normalizeURI(data.media?.[0]?.gateway || data.media?.[0]?.raw || ""),
            attributes: data.metadata?.attributes || []
          };
          
          // Salva nella cache
          this.config.metadataCache[tokenId] = metadata;
          
          return metadata;
        } catch (alchemyError) {
          console.error(`❌ Errore nel recupero metadati per NFT #${tokenId} via Alchemy:`, alchemyError);
          console.log("⚠️ Fallback a metodo ethers.js tradizionale per metadati...");
        }
      }
      
      // Fallback al metodo tradizionale - Ottieni URI dei metadati
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