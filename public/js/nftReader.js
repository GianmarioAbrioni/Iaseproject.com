/**
 * IASE NFT Reader
 * Utility script per leggere direttamente gli NFT dal wallet dell'utente usando ethers.js
 */

// Indirizzo contratto NFT IASE
const IASE_NFT_CONTRACT = '0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F';

// ABI minimo per ERC721 con Enumerable extension
const ERC721_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)"
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

    // Richiedi l'accesso al wallet
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();

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
      for (let i = 0; i < balance; i++) {
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
 * @param {string} tokenId - ID del token NFT
 * @returns {Promise<Object>} - Metadati dell'NFT
 */
export async function getNFTMetadata(tokenId) {
  try {
    if (!window.ethereum) {
      console.error("Wallet non trovato");
      return null;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(IASE_NFT_CONTRACT, ERC721_ABI, provider);

    // Ottieni l'URI dei metadati
    const tokenURI = await contract.tokenURI(tokenId);
    console.log(`🔗 TokenURI per NFT #${tokenId}: ${tokenURI}`);

    // Recupera i metadati dalla risorsa esterna
    const response = await fetch(tokenURI);
    if (!response.ok) {
      throw new Error(`Errore nel recupero dei metadati: ${response.status}`);
    }

    const metadata = await response.json();
    return {
      id: tokenId,
      name: metadata.name || `IASE Unit #${tokenId}`,
      image: metadata.image || "images/nft-samples/placeholder.jpg",
      rarity: getRarityFromMetadata(metadata),
      traits: metadata.attributes || []
    };
  } catch (error) {
    console.error(`❌ Errore nel recupero dei metadati per NFT #${tokenId}:`, error);
    return {
      id: tokenId,
      name: `IASE Unit #${tokenId}`,
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
    // Prima otteniamo tutti gli ID degli NFT
    const userNFTs = await getUserNFTs();
    
    if (!userNFTs || userNFTs.nftIds.length === 0) {
      console.log("Nessun NFT IASE trovato nel wallet");
      return [];
    }

    console.log(`🔍 Recupero metadati per ${userNFTs.nftIds.length} NFT...`);
    
    // Per ogni NFT, recuperiamo i metadati completi
    const nftsWithMetadata = await Promise.all(
      userNFTs.nftIds.map(async (tokenId) => {
        return await getNFTMetadata(tokenId);
      })
    );

    console.log(`✅ Caricati con successo ${nftsWithMetadata.length} NFT IASE con metadati`);
    return nftsWithMetadata;
  } catch (error) {
    console.error("❌ Errore durante il caricamento degli NFT:", error);
    return [];
  }
}