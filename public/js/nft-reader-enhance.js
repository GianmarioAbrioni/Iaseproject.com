/**
 * IASE NFT Reader Enhancement - Fix per contratti non ERC721Enumerable
 * Questo script aggiunge la capacità di leggere NFT tramite eventi Transfer 
 * quando il contratto non supporta l'interfaccia ERC721Enumerable
 * 
 * COMPATIBILITÀ: 100% compatibile con il sistema esistente
 * INTEGRAZIONE: Aggiungi solo l'inclusione di questo script dopo nft-reader-adapter.js
 */

console.log("🔧 Loading IASE NFT Reader Enhancement - Transfer Events Support");

// Conserva riferimenti alle funzioni originali
const originalGetUserNFTs = window.getUserNFTs;
const originalLoadAllIASENFTs = window.loadAllIASENFTs;

// ABI minimo per eventi Transfer
const TRANSFER_EVENTS_ABI = [
  {"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"}
];

// Nuova funzione che usa eventi Transfer
async function getUserNFTsViaTransfer() {
  try {
    // Controlla se il wallet è connesso
    if (!window.ethereum) {
      console.error("Wallet not found or not connected");
      return null;
    }

    console.log("🔍 Reading NFTs via Transfer events...");
    
    // Ottieni l'indirizzo utente
    const userAddress = window.ethereum.selectedAddress;
    if (!userAddress) {
      console.error("No wallet address selected");
      return null;
    }
    
    console.log(`👤 User: ${userAddress}`);
    const normalizedAddress = userAddress.toLowerCase();
    
    // Crea provider Infura
    const NFT_CONTRACT = window.NFT_CONTRACT_ADDRESS || '0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F';
    const INFURA_KEY = window.INFURA_API_KEY || '84ed164327474b4499c085d2e4345a66';
    
    let provider;
    if (ethers.providers && ethers.providers.JsonRpcProvider) {
      // ethers v5
      provider = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_KEY}`);
    } else if (ethers.JsonRpcProvider) {
      // ethers v6
      provider = new ethers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_KEY}`);
    } else {
      throw new Error("Unsupported ethers.js version");
    }
    
    // Crea istanza del contratto
    const contract = new ethers.Contract(NFT_CONTRACT, TRANSFER_EVENTS_ABI, provider);

    // Leggi il balance degli NFT
    const balance = await contract.balanceOf(userAddress);
    const balanceNum = typeof balance === 'bigint' ? Number(balance) : 
                      (typeof balance.toNumber === 'function' ? balance.toNumber() : parseInt(balance.toString(), 10));
    
    if (balanceNum === 0) {
      return { address: userAddress, balance: "0", nftIds: [] };
    }
    
    // Configura filtro per eventi Transfer
    const isEthersV5 = ethers.providers && ethers.providers.JsonRpcProvider;
    const filter = isEthersV5 ? 
      contract.filters.Transfer(null, userAddress) : 
      contract.filters.Transfer(null, userAddress, null);
    
    // Query per eventi Transfer
    const events = await contract.queryFilter(filter);
    console.log(`📊 Found ${events.length} Transfer events`);
    
    // Processa gli eventi per identificare i token posseduti
    const receivedTokens = {};
    
    for (const event of events) {
      const to = event.args.to.toLowerCase();
      const tokenId = event.args.tokenId.toString();
      
      if (to === normalizedAddress) {
        receivedTokens[tokenId] = true;
      }
    }
    
    // Verifica quali token sono ancora posseduti
    const nftIds = [];
    
    for (const tokenId of Object.keys(receivedTokens)) {
      try {
        const currentOwner = (await contract.ownerOf(tokenId)).toLowerCase();
        if (currentOwner === normalizedAddress) {
          console.log(`✅ NFT #${tokenId} owned by user`);
          nftIds.push(tokenId);
        }
        
        // Se abbiamo trovato tutti gli NFT attesi, fermiamo la ricerca
        if (nftIds.length >= balanceNum) break;
      } catch (err) {
        console.error(`Error checking NFT #${tokenId} ownership:`, err);
      }
    }
    
    return {
      address: userAddress, 
      balance: balance.toString(),
      nftIds
    };
  } catch (error) {
    console.error("Error in Transfer events NFT reading:", error);
    return null;
  }
}

// Versione potenziata di getUserNFTs che usa prima il metodo originale
// e se fallisce utilizza eventi Transfer
async function enhancedGetUserNFTs() {
  try {
    console.log("🔄 Enhanced NFT loading with fallback...");
    
    // Prima tenta con il metodo originale
    const originalResult = await originalGetUserNFTs();
    
    // Se ha trovato NFT o se l'utente non ne ha, usa quel risultato
    if (originalResult && 
        (originalResult.balance === "0" || 
        (originalResult.nftIds && originalResult.nftIds.length > 0))) {
      console.log("✅ Original method successful");
      return originalResult;
    }
    
    // Se il contratto potrebbe essere non Enumerable (balance > 0 ma nftIds vuoto)
    if (originalResult && originalResult.balance && originalResult.balance !== "0" && 
        (!originalResult.nftIds || originalResult.nftIds.length === 0)) {
      console.log("⚠️ Contract may not implement ERC721Enumerable, using Transfer events");
      
      // Prova con il metodo eventi Transfer
      const transferResult = await getUserNFTsViaTransfer();
      
      if (transferResult && transferResult.nftIds && transferResult.nftIds.length > 0) {
        console.log(`✅ Transfer method found ${transferResult.nftIds.length} NFTs`);
        return transferResult;
      }
    }
    
    // Se arriviamo qui, ritorna il risultato originale o null
    return originalResult;
  } catch (error) {
    console.error("Error in enhanced NFT loading:", error);
    
    // In caso di errore, tenta il metodo fallback
    try {
      return await getUserNFTsViaTransfer();
    } catch {
      return null;
    }
  }
}

// Versione potenziata di loadAllIASENFTs
async function enhancedLoadAllIASENFTs() {
  try {
    // Ottiene tutti gli NFT con fallback automatico
    const userNFTs = await enhancedGetUserNFTs();
    
    if (!userNFTs || !userNFTs.nftIds || userNFTs.nftIds.length === 0) {
      console.log("No NFTs found");
      return [];
    }
    
    // Procede come originale: per ogni NFT, ottiene i metadati
    console.log(`Getting metadata for ${userNFTs.nftIds.length} NFTs`);
    
    // Usa la funzione getNFTMetadata per mantenere compatibilità
    const getNFTMetadata = window.getNFTMetadata;
    
    // Utilizza Promise.allSettled per massima robustezza
    const metadataResults = await Promise.allSettled(
      userNFTs.nftIds.map(async (tokenId) => {
        try {
          const numericTokenId = parseInt(String(tokenId).trim(), 10);
          if (isNaN(numericTokenId)) {
            throw new Error(`Invalid token ID: ${tokenId}`);
          }
          
          // Usa getNFTMetadata originale - non cambia
          const metadata = await getNFTMetadata(numericTokenId);
          return {
            ...metadata,
            id: String(numericTokenId) // ID sempre come stringa
          };
        } catch (err) {
          console.error(`Error getting metadata for NFT #${tokenId}:`, err);
          // Dati fallback
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
    
    // Filtra i risultati ottenuti con successo
    const nftsWithMetadata = metadataResults
      .filter(result => result.status === "fulfilled")
      .map(result => result.value);
      
    console.log(`✅ Successfully loaded ${nftsWithMetadata.length} NFTs with metadata`);
    
    // Notifica successo tramite evento
    document.dispatchEvent(new CustomEvent('nft:loadSuccess', {
      detail: { count: nftsWithMetadata.length, nfts: nftsWithMetadata }
    }));
    
    return nftsWithMetadata;
  } catch (error) {
    console.error("Error in enhanced NFT loading:", error);
    
    // In caso di errore totale, torna alla funzione originale
    try {
      return await originalLoadAllIASENFTs();
    } catch {
      return [];
    }
  }
}

// Sostituisci le funzioni con le versioni potenziate
window.getUserNFTs = enhancedGetUserNFTs;
window.loadAllIASENFTs = enhancedLoadAllIASENFTs;

// Aggiungi le funzioni anche all'oggetto nftReader
if (window.nftReader) {
  window.nftReader.getUserNFTsViaTransfer = getUserNFTsViaTransfer;
  window.nftReader.enhancedGetUserNFTs = enhancedGetUserNFTs;
  window.nftReader.enhancedLoadAllIASENFTs = enhancedLoadAllIASENFTs;
  
  // Sovrascrivere anche quelle principali per sicurezza
  window.nftReader.getUserNFTs = enhancedGetUserNFTs;
  window.nftReader.loadAllIASENFTs = enhancedLoadAllIASENFTs;
}

console.log("✅ IASE NFT Reader Enhancement loaded - Transfer Events Support active");

// Invia evento di inizializzazione
document.dispatchEvent(new CustomEvent('nft:enhancementLoaded', {
  detail: { supportsTransferEvents: true }
}));