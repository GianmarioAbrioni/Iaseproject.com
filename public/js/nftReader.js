/**
 * IASE NFT Reader - Versione ottimizzata per Render
 * Utility script per leggere direttamente gli NFT dal wallet dell'utente
 * con supporto multi-provider e gestione robusta di errori
 * 
 * Versione 1.2.0 - 2023-05-14
 * - Supporta ethers.js v5 e v6
 * - Gestione avanzata di provider per massima affidabilità
 * - Logging migliorato per debug
 * - Hardcoded API key e indirizzi per funzionamento immediato
 */

// Configurazioni globali con dati reali (hardcoded per render)
// Prendi prima da window (se impostati in HTML) altrimenti usa valori di default
const IASE_NFT_CONTRACT = window.NFT_CONTRACT_ADDRESS || '0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F';
const INFURA_API_KEY = window.INFURA_API_KEY || '84ed164327474b4499c085d2e4345a66';
const REWARDS_CONTRACT = window.REWARDS_CONTRACT_ADDRESS || '0x38C62fCFb6a6Bbce341B41bA6740B07739Bf6E1F';
const ETHEREUM_RPC_FALLBACK = window.ETHEREUM_RPC_FALLBACK || 'https://rpc.ankr.com/eth';

// Log delle configurazioni (solo in modalità debug)
if (window.IASE_DEBUG) {
  console.log('📊 IASE NFT Reader - Configurazione:');
  console.log(`- NFT Contract: ${IASE_NFT_CONTRACT}`);
  console.log(`- Infura API Key: ${INFURA_API_KEY.substring(0, 4)}...${INFURA_API_KEY.substring(INFURA_API_KEY.length - 4)}`);
  console.log(`- Rewards Contract: ${REWARDS_CONTRACT}`);
  console.log(`- Ethereum RPC Fallback: ${ETHEREUM_RPC_FALLBACK}`);
}

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
    // Check if wallet is connected
    if (!window.ethereum) {
      console.error("Wallet not found. Make sure MetaMask is installed and connected.");
      alert("Wallet not found. Make sure MetaMask is installed and connected.");
      return null;
    }

    console.log("🔍 Initializing NFT reading from wallet...");
    
    // Get user address from wallet
    const userAddress = window.ethereum.selectedAddress;
    if (!userAddress) {
      console.error("No wallet address selected");
      alert("Wallet not connected or address unavailable");
      return null;
    }
    
    console.log(`👤 Connected user: ${userAddress}`);
    
    // ROBUST SOLUTION: Always use Infura as direct provider
    // Compatibility with different versions of ethers.js
    const isEthersV5 = ethers.providers && ethers.providers.JsonRpcProvider;
    const isEthersV6 = ethers.JsonRpcProvider;
    
    let provider;
    
    // Create Infura provider with our API key
    if (isEthersV5) {
      // ethers v5
      console.log("✅ Using Infura provider (ethers v5)");
      const infuraUrl = `https://mainnet.infura.io/v3/${INFURA_API_KEY}`;
      provider = new ethers.providers.JsonRpcProvider(infuraUrl);
    } else if (isEthersV6) {
      // ethers v6
      console.log("✅ Using Infura provider (ethers v6)");
      const infuraUrl = `https://mainnet.infura.io/v3/${INFURA_API_KEY}`;
      provider = new ethers.JsonRpcProvider(infuraUrl);
    } else {
      throw new Error("Unsupported ethers.js version");
    }
    
    console.log("⚙️ Infura provider initialized correctly");

    // Create instance of NFT contract using the Infura provider
    const contract = new ethers.Contract(IASE_NFT_CONTRACT, ERC721_ABI, provider);

    // Read NFT balance directly with Infura
    const balance = await contract.balanceOf(userAddress);
    console.log(`🏦 NFTs found in wallet: ${balance.toString()}`);

    // Array to store NFT IDs
    const nftIds = [];

    // If there are NFTs, retrieve the ID of each one
    if (balance > 0) {
      // Handle BigInt in ethers v6
      const balanceNumber = typeof balance === 'bigint' ? Number(balance) : 
                           (typeof balance.toNumber === 'function' ? balance.toNumber() : parseInt(balance.toString(), 10));
      
      for (let i = 0; i < balanceNumber; i++) {
        try {
          const tokenId = await contract.tokenOfOwnerByIndex(userAddress, i);
          console.log(`✅ NFT #${tokenId.toString()} found`);
          nftIds.push(tokenId.toString());
        } catch (error) {
          console.error(`❌ Error retrieving NFT at index ${i}:`, error);
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
    
    // Logged for debug
    console.log(`🪙 NFT ID for contract: ${tokenIdForContract} (type: ${typeof tokenIdForContract})`);

    // ROBUST SOLUTION: Always use Infura as direct provider
    // Compatibility with different versions of ethers.js
    const isEthersV5 = ethers.providers && ethers.providers.JsonRpcProvider;
    const isEthersV6 = ethers.JsonRpcProvider;
    
    let provider, contract;
    
    try {
      console.log("🔄 Initializing Infura provider for NFT metadata...");
      
      // Use Infura directly as provider (not MetaMask/Web3Provider)
      if (isEthersV5) {
        // ethers v5
        console.log("✅ Using Infura provider for metadata (ethers v5)");
        const infuraUrl = `https://mainnet.infura.io/v3/${INFURA_API_KEY}`;
        provider = new ethers.providers.JsonRpcProvider(infuraUrl);
      } else if (isEthersV6) {
        // ethers v6
        console.log("✅ Using Infura provider for metadata (ethers v6)");
        const infuraUrl = `https://mainnet.infura.io/v3/${INFURA_API_KEY}`;
        provider = new ethers.JsonRpcProvider(infuraUrl);
      } else {
        console.error("❌ Unrecognized ethers.js version!");
        throw new Error("Unsupported ethers.js version");
      }
      
      // Create NFT contract instance with Infura provider
      contract = new ethers.Contract(IASE_NFT_CONTRACT, ERC721_ABI, provider);

      // Get metadata URI - HERE the correct number is important
      const tokenURI = await contract.tokenURI(tokenIdForContract);
      console.log(`🔗 TokenURI for NFT #${tokenIdForContract}: ${tokenURI}`);

      // Retrieve metadata from external resource
      const response = await fetch(tokenURI);
      if (!response.ok) {
        throw new Error(`HTTP error retrieving metadata: ${response.status}`);
      }

      const metadata = await response.json();
      
      // IMPORTANT: ALWAYS force string for ID in the final result
      const resultTokenId = String(tokenIdForContract);
      
      return {
        id: resultTokenId, // ALWAYS string
        name: metadata.name || `IASE Unit #${resultTokenId}`,
        image: metadata.image || "images/nft-samples/placeholder.jpg",
        rarity: getRarityFromMetadata(metadata),
        traits: metadata.attributes || []
      };
    } catch (contractError) {
      console.error(`🔥 Error with NFT contract for token #${tokenIdForContract}:`, contractError);
      throw contractError;
    }
  } catch (error) {
    console.error(`❌ Error retrieving metadata for NFT #${tokenId}:`, error);
    
    // Even in case of error, ensure type consistency (ID always string)
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
    console.log("🔄 Starting IASE NFT loading - version 1.0.2");
    
    // Check if ethers.js is available and loaded for fallback mechanism
    if (typeof ethers !== 'object') {
      console.error("❌ Critical error: ethers.js not available");
      console.log("⚠️ Attempting to dynamically load ethers.js...");
      
      try {
        // Attempt to dynamically load ethers.js
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js";
          script.async = true;
          script.onload = () => {
            console.log("✅ ethers.js loaded dynamically");
            resolve();
          };
          script.onerror = () => {
            reject(new Error("Failed to load ethers.js"));
          };
          document.head.appendChild(script);
        });
      } catch (loadError) {
        console.error("❌ Failed to load ethers.js dynamically:", loadError);
        throw new Error("Ethers.js library not loaded and dynamic loading failed");
      }
      
      // Verify that ethers.js is available after loading
      if (typeof ethers !== 'object') {
        throw new Error("Ethers.js library not loaded even after dynamic loading attempt");
      }
    }
    
    // Compatibility with different versions of ethers.js for Infura provider
    const isEthersV5 = ethers.providers && ethers.providers.JsonRpcProvider;
    const isEthersV6 = ethers.JsonRpcProvider;
    
    console.log(`🔧 Detected ethers.js version: ${isEthersV5 ? "v5" : isEthersV6 ? "v6" : "unknown"}`);
    
    // Verify that wallet is connected to get the address
    if (!window.ethereum) {
      console.error("❌ MetaMask not available");
      throw new Error("MetaMask not available");
    }
    
    // Using getUserNFTs which now uses Infura directly
    console.log("🚀 Loading NFTs via Infura provider...");
    const userNFTs = await getUserNFTs();
    
    if (!userNFTs || !userNFTs.nftIds || userNFTs.nftIds.length === 0) {
      console.log("📢 No IASE NFTs found in wallet");
      return [];
    }

    console.log(`🔍 Retrieving metadata for ${userNFTs.nftIds.length} NFTs...`);
    
    // For each NFT, retrieve complete metadata with robust type handling
    // Using Promise.allSettled instead of Promise.all to prevent a single error 
    // from blocking the entire metadata retrieval process
    const metadataResults = await Promise.allSettled(
      userNFTs.nftIds.map(async (tokenId) => {
        try {
          // CORRECTION: Explicit conversion to string and then to number (safe for BigInt)
          const cleanTokenId = String(tokenId).trim(); // Remove spaces
          console.log(`🔢 Processing token ID: "${cleanTokenId}" (type: ${typeof cleanTokenId})`);
          
          // Force explicit conversion
          const numericTokenId = parseInt(cleanTokenId, 10);
          if (isNaN(numericTokenId)) {
            console.error(`❌ Invalid token ID: "${cleanTokenId}"`);
            throw new Error(`Invalid token ID: ${cleanTokenId}`);
          }
          
          const tokenMetadata = await getNFTMetadata(numericTokenId);
          console.log(`✅ Metadata retrieved for NFT #${numericTokenId}`);
          
          // IMPORTANT: Ensure that the ID in the resulting object is ALWAYS a string
          return {
            ...tokenMetadata,
            id: String(numericTokenId) // Force string for ID
          };
        } catch (err) {
          console.error(`❌ Error processing token ${tokenId}:`, err);
          // Maintain type consistency even in case of error
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
    
    // Filter results to get only the successful ones
    const nftsWithMetadata = metadataResults
      .filter(result => result.status === "fulfilled")
      .map(result => result.value);

    console.log(`✅ Successfully loaded ${nftsWithMetadata.length} IASE NFTs with metadata`);
    return nftsWithMetadata;
  } catch (error) {
    console.error("❌ Error loading NFTs:", error);
    return [];
  }
}