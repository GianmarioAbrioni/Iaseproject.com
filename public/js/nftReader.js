/**
 * IASE NFT Reader
 * Utility script per leggere direttamente gli NFT dal wallet dell'utente usando ethers.js
 */

// Indirizzo contratto NFT IASE
const IASE_NFT_CONTRACT = '0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F';

// ABI completo per contratto ERC721Enumerable (IASE NFT)
const ERC721_ABI = [
  {"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint256","name":"index","type":"uint256"}],"name":"tokenOfOwnerByIndex","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}
];

/**
 * Legge gli NFT posseduti da un indirizzo wallet
 * @returns {Promise<{address: string, balance: string, nftIds: string[]}>}
 */
export async function getUserNFTs() {
  try {
    // Verifica che il wallet sia connesso
    if (!window.ethereum) {
      console.error("Wallet non trovato. Assicurati che MetaMask sia installato e connesso.");
      alert("Wallet non trovato. Assicurati che MetaMask sia installato e connesso.");
      return null;
    }

    console.log("🔍 Inizializzazione lettura NFT dal wallet...");
    
    // Compatibilità con diverse versioni di ethers.js
    const isEthersV5 = ethers.providers && ethers.providers.Web3Provider;
    const isEthersV6 = ethers.BrowserProvider;
    
    let provider, signer, userAddress;
    
    // Richiedi l'accesso al wallet con compatibilità per ethers v5 e v6
    if (isEthersV5) {
      // ethers v5
      provider = new ethers.providers.Web3Provider(window.ethereum);
      signer = provider.getSigner();
      userAddress = await signer.getAddress();
    } else if (isEthersV6) {
      // ethers v6
      provider = new ethers.BrowserProvider(window.ethereum);
      signer = await provider.getSigner();
      userAddress = await signer.getAddress();
    } else {
      throw new Error("Versione di ethers.js non supportata");
    }

    console.log(`👤 Utente connesso: ${userAddress}`);

    // Crea istanza del contratto NFT
    const contract = new ethers.Contract(IASE_NFT_CONTRACT, ERC721_ABI, signer);

    // Leggi il balance NFT
    const balance = await contract.balanceOf(userAddress);
    console.log(`🏦 NFT trovati nel wallet: ${balance.toString()}`);

    // Array per memorizzare gli ID degli NFT
    const nftIds = [];

    // Se ci sono NFT, recupera gli ID di ciascuno
    if (balance > 0) {
      // Gestione BigInt in ethers v6
      const balanceNumber = typeof balance === 'bigint' ? Number(balance) : 
                           (typeof balance.toNumber === 'function' ? balance.toNumber() : parseInt(balance.toString(), 10));
      
      for (let i = 0; i < balanceNumber; i++) {
        try {
          const tokenId = await contract.tokenOfOwnerByIndex(userAddress, i);
          console.log(`✅ NFT #${tokenId.toString()} trovato`);
          nftIds.push(tokenId.toString());
        } catch (error) {
          console.error(`❌ Errore nel recupero dell'NFT all'indice ${i}:`, error);
        }
      }
    }

    return {
      address: userAddress,
      balance: balance.toString(),
      nftIds
    };
  } catch (error) {
    console.error("❌ Errore durante la lettura degli NFT:", error);
    return null;
  }
}

/**
 * Ottiene i metadati di un NFT specifico
 * @param {number|string} tokenId - ID del token NFT (può essere numero o stringa)
 * @returns {Promise<Object>} - Metadati dell'NFT
 */
export async function getNFTMetadata(tokenId) {
  try {
    if (!window.ethereum) {
      console.error("❌ Wallet non trovato");
      throw new Error("MetaMask not available");
    }

    // CORREZIONE IMPORTANTE: Gestione robusta del tipo di tokenId per blockchain
    // Prima converti sempre a stringa, poi a numero per essere sicuro
    let tokenIdForContract;
    
    if (typeof tokenId === 'string') {
      // Se è già una stringa, rimuovi spazi e normalizza
      const cleaned = tokenId.trim();
      const num = parseInt(cleaned, 10);
      if (isNaN(num)) {
        throw new Error(`TokenID non valido: "${tokenId}"`);
      }
      tokenIdForContract = num; // Usa il numero per la blockchain
    } else if (typeof tokenId === 'number') {
      // Se è già un numero, usalo direttamente
      tokenIdForContract = tokenId;
    } else {
      // Se è un altro tipo, converti comunque
      const coerced = Number(tokenId);
      if (isNaN(coerced)) {
        throw new Error(`TokenID non valido: "${tokenId}" (tipo: ${typeof tokenId})`);
      }
      tokenIdForContract = coerced;
    }
    
    // Logged per debug
    console.log(`🪙 NFT ID per contratto: ${tokenIdForContract} (tipo: ${typeof tokenIdForContract})`);

    // Compatibilità con diverse versioni di ethers.js
    const isEthersV5 = ethers.providers && ethers.providers.Web3Provider;
    const isEthersV6 = ethers.BrowserProvider;
    
    try {
      // Crea provider ed istanza contratto con compatibilità per ethers v5 e v6
      let provider, contract;
      
      if (isEthersV5) {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        contract = new ethers.Contract(IASE_NFT_CONTRACT, ERC721_ABI, provider);
      } else if (isEthersV6) {
        provider = new ethers.BrowserProvider(window.ethereum);
        contract = new ethers.Contract(IASE_NFT_CONTRACT, ERC721_ABI, provider);
      } else {
        throw new Error("Versione di ethers.js non supportata");
      }

      // Ottieni l'URI dei metadati - QUI è importante il numero corretto
      const tokenURI = await contract.tokenURI(tokenIdForContract);
      console.log(`🔗 TokenURI per NFT #${tokenIdForContract}: ${tokenURI}`);

      // Recupera i metadati dalla risorsa esterna
      const response = await fetch(tokenURI);
      if (!response.ok) {
        throw new Error(`Errore HTTP nel recupero metadati: ${response.status}`);
      }

      const metadata = await response.json();
      
      // IMPORTANTE: Forza SEMPRE stringa per l'ID nel risultato finale
      const resultTokenId = String(tokenIdForContract);
      
      return {
        id: resultTokenId, // SEMPRE stringa
        name: metadata.name || `IASE Unit #${resultTokenId}`,
        image: metadata.image || "images/nft-samples/placeholder.jpg",
        rarity: getRarityFromMetadata(metadata),
        traits: metadata.attributes || []
      };
    } catch (contractError) {
      console.error(`🔥 Errore con contratto NFT per token #${tokenIdForContract}:`, contractError);
      throw contractError;
    }
  } catch (error) {
    console.error(`❌ Errore nel recupero metadati per NFT #${tokenId}:`, error);
    
    // Anche in caso di errore, garantisci coerenza dei tipi (ID sempre stringa)
    const safeTokenId = String(tokenId);
    
    return {
      id: safeTokenId,
      name: `IASE Unit #${safeTokenId}`,
      image: "images/nft-samples/placeholder.jpg",
      rarity: "Standard",
      traits: []
    };
  }
}

/**
 * Estrae la rarità dai metadati dell'NFT
 * @param {Object} metadata - Metadati dell'NFT
 * @returns {string} - Livello di rarità
 */
function getRarityFromMetadata(metadata) {
  if (!metadata.attributes || !Array.isArray(metadata.attributes)) {
    return "Standard";
  }

  // Cerca l'attributo CARD FRAME che determina la rarità
  const frameTrait = metadata.attributes.find(attr => 
    attr.trait_type && attr.trait_type.toUpperCase() === 'CARD FRAME'
  );

  if (frameTrait && frameTrait.value) {
    return frameTrait.value;
  }

  return "Standard";
}

/**
 * Carica tutti gli NFT IASE dal wallet e ne recupera i metadati
 * @returns {Promise<Array>} - Array di oggetti NFT con tutti i dettagli
 */
export async function loadAllIASENFTs() {
  try {
    console.log("🔄 Avvio caricamento NFT IASE - versione corretta 1.0.2");
    
    // Verifica che ethers.js sia disponibile e carico al meccanismo di fallback
    if (typeof ethers !== 'object') {
      console.error("❌ Errore critico: ethers.js non disponibile");
      console.log("⚠️ Tentativo di caricamento dinamico di ethers.js...");
      
      try {
        // Tentativo di caricamento dinamico di ethers.js
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = "https://cdn.ethers.io/lib/ethers-5.6.umd.min.js";
          script.async = true;
          script.onload = () => {
            console.log("✅ ethers.js caricato dinamicamente");
            resolve();
          };
          script.onerror = () => {
            reject(new Error("Impossibile caricare ethers.js"));
          };
          document.head.appendChild(script);
        });
      } catch (loadError) {
        console.error("❌ Fallito caricamento dinamico ethers.js:", loadError);
        throw new Error("Ethers.js library not loaded and dynamic loading failed");
      }
      
      // Verifica che ethers.js sia disponibile dopo il caricamento
      if (typeof ethers !== 'object') {
        throw new Error("Ethers.js library not loaded even after dynamic loading attempt");
      }
    }
    
    // Compatibilità con diverse versioni di ethers.js
    const isEthersV5 = ethers.providers && ethers.providers.Web3Provider;
    const isEthersV6 = ethers.BrowserProvider;
    
    console.log(`🔧 Rilevata versione ethers.js: ${isEthersV5 ? "v5" : isEthersV6 ? "v6" : "sconosciuta"}`);
    
    // Verifica che il wallet sia connesso
    if (!window.ethereum) {
      console.error("❌ MetaMask non disponibile");
      throw new Error("MetaMask not available");
    }
    
    // Prima otteniamo tutti gli ID degli NFT
    const userNFTs = await getUserNFTs();
    
    if (!userNFTs || !userNFTs.nftIds || userNFTs.nftIds.length === 0) {
      console.log("📢 Nessun NFT IASE trovato nel wallet");
      return [];
    }

    console.log(`🔍 Recupero metadati per ${userNFTs.nftIds.length} NFT...`);
    
    // Per ogni NFT, recuperiamo i metadati completi con gestione robusta dei tipi
    // Utilizziamo Promise.allSettled invece di Promise.all per evitare che un errore singolo 
    // blocchi tutto il processo di recupero dei metadati
    const metadataResults = await Promise.allSettled(
      userNFTs.nftIds.map(async (tokenId) => {
        try {
          // CORREZIONE: Conversione esplicita a stringa e poi a numero (sicuro per BigInt)
          const cleanTokenId = String(tokenId).trim(); // Rimuovi spazi
          console.log(`🔢 Elaborazione token ID: "${cleanTokenId}" (tipo: ${typeof cleanTokenId})`);
          
          // Forza la conversione esplicita
          const numericTokenId = parseInt(cleanTokenId, 10);
          if (isNaN(numericTokenId)) {
            console.error(`❌ ID token non valido: "${cleanTokenId}"`);
            throw new Error(`Invalid token ID: ${cleanTokenId}`);
          }
          
          const tokenMetadata = await getNFTMetadata(numericTokenId);
          console.log(`✅ Metadati recuperati per NFT #${numericTokenId}`);
          
          // IMPORTANTE: Garantisci che l'ID nell'oggetto risultante sia SEMPRE una stringa
          return {
            ...tokenMetadata,
            id: String(numericTokenId) // Forza stringa per l'ID
          };
        } catch (err) {
          console.error(`❌ Errore elaborazione token ${tokenId}:`, err);
          // Mantieni coerenza dei tipi anche in caso di errore
          return {
            id: String(tokenId),
            name: `IASE Unit #${tokenId}`,
            image: "images/nft-samples/placeholder.jpg",
            rarity: "Standard",
            traits: []
          };
        }
      })
    );
    
    // Filtra i risultati per ottenere solo quelli riusciti
    const nftsWithMetadata = metadataResults
      .filter(result => result.status === "fulfilled")
      .map(result => result.value);

    console.log(`✅ Caricati con successo ${nftsWithMetadata.length} NFT IASE con metadati`);
    return nftsWithMetadata;
  } catch (error) {
    console.error("❌ Errore durante il caricamento degli NFT:", error);
    return [];
  }
}