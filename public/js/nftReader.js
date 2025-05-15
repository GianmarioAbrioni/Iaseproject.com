/**
 * IASE NFT Reader - Versione ottimizzata per Render
 * Utility script per leggere direttamente gli NFT dal wallet dell'utente
 * con supporto multi-provider e gestione robusta di errori
 * 
 * Versione 1.3.0 - 2025-05-15
 * - Supporta ethers.js v5 e v6
 * - Gestione avanzata di provider per massima affidabilità
 * - Logging migliorato per debug
 * - Hardcoded API key e indirizzi per funzionamento immediato
 * - Supporto sia per import ES6 che per script tag (doppia modalità)
 */

// Determina se lo script viene eseguito come modulo ES6 o script normale
const isModule = typeof exports === 'object' && typeof module !== 'undefined';

// Configurazioni globali con dati reali (hardcoded per render)
// Prendi prima da window (se impostati in HTML) altrimenti usa valori di default
const IASE_NFT_CONTRACT = window.NFT_CONTRACT_ADDRESS || '0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F';
const INFURA_API_KEY = window.INFURA_API_KEY || '84ed164327474b4499c085d2e4345a66';
const REWARDS_CONTRACT = window.REWARDS_CONTRACT_ADDRESS || '0x38C62fCFb6a6Bbce341B41bA6740B07739Bf6E1F';
const ETHEREUM_RPC_FALLBACK = window.ETHEREUM_RPC_FALLBACK || 'https://rpc.ankr.com/eth';

// Log delle configurazioni (solo in modalità debug)
console.log("📊 IASE NFT Reader - Configurazione:");
console.log(`- NFT Contract: ${IASE_NFT_CONTRACT}`);
console.log(`- Infura API Key: ${INFURA_API_KEY.substring(0, 4)}...${INFURA_API_KEY.substring(INFURA_API_KEY.length - 4)}`);
console.log(`- Rewards Contract: ${REWARDS_CONTRACT}`);
console.log(`- Ethereum RPC Fallback: ${ETHEREUM_RPC_FALLBACK}`);

/**
 * Legge gli NFT posseduti da un indirizzo wallet
 * Versione migliorata che supporta sia ERC721Enumerable che ERC721 base
 * @returns {Promise<{address: string, balance: string, nftIds: string[]}>}
 */
export async function getUserNFTs() {
  try {
    // Make sure Ethereum provider is available
    if (!window.ethereum) {
      throw new Error("No Ethereum provider found. Please install MetaMask or another wallet.");
    }
    
    // Request account access
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (!accounts || accounts.length === 0) {
      throw new Error("No Ethereum accounts found. Please unlock your wallet.");
    }
    
    const walletAddress = accounts[0];
    
    // ROBUST SOLUTION: Always use Infura as direct provider
    let provider, nftContract;
    
    try {
      // Create Infura provider with our API key
      if (typeof ethers.providers === 'object') {
        // ethers v5
        provider = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_API_KEY}`);
        console.log("✅ Using Infura provider (ethers v5)");
      } else {
        // ethers v6
        provider = new ethers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_API_KEY}`);
        console.log("✅ Using Infura provider (ethers v6)");
      }
      
      // Define ABI minimale per l'NFT contract
      const nftAbi = [
        "function balanceOf(address owner) view returns (uint256)",
        "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
        "function ownerOf(uint256 tokenId) view returns (address)"
      ];
      
      console.log("⚙️ Infura provider initialized correctly");
      
      // Create instance of NFT contract using the Infura provider
      nftContract = new ethers.Contract(IASE_NFT_CONTRACT, nftAbi, provider);
      
      // Read NFT balance directly with Infura
      const balance = await nftContract.balanceOf(walletAddress);
      const balanceNumber = parseInt(balance.toString());
      
      console.log(`🔍 Found ${balanceNumber} NFTs for address ${walletAddress}`);
      
      // We'll use a more reliable approach: instead of relying on tokenOfOwnerByIndex which
      // might not be implemented in all contracts, we'll scan through token IDs
      const nftIds = [];
      
      // Check ownership for tokens 1-3000 (reasonable range for our collection)
      const ownershipPromises = [];
      for (let i = 1; i <= 3000; i++) {
        ownershipPromises.push(checkTokenOwnership(i));
      }
      
      // Process ownership checks in batches to avoid rate limiting
      const batchSize = 100;
      let results = [];
      
      for (let i = 0; i < ownershipPromises.length; i += batchSize) {
        const batch = ownershipPromises.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch);
        results = [...results, ...batchResults];
        
        // Add a small delay between batches to prevent rate limiting
        if (i + batchSize < ownershipPromises.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Filter out tokens owned by the wallet
      const ownedTokens = results.filter(token => token !== null);
      
      console.log(`✅ Direct scan found ${ownedTokens.length} tokens owned by this wallet`);
      
      return {
        address: walletAddress,
        balance: balanceNumber.toString(),
        nftIds: ownedTokens
      };
      
      async function checkTokenOwnership(tokenId) {
        try {
          const owner = await nftContract.ownerOf(tokenId);
          // Check if the owner matches our wallet (case insensitive)
          if (owner.toLowerCase() === walletAddress.toLowerCase()) {
            return tokenId.toString();
          }
          return null;
        } catch (error) {
          // Token doesn't exist or other error
          return null;
        }
      }
      
    } catch (error) {
      console.error("❌ Error reading NFTs with Infura:", error);
      
      // Fallback to alternative approach or provider
      console.log("⚠️ Failing back to alternative provider for NFT reading...");
      
      try {
        // Create alternative provider
        if (typeof ethers.providers === 'object') {
          // ethers v5
          provider = new ethers.providers.JsonRpcProvider(ETHEREUM_RPC_FALLBACK);
        } else {
          // ethers v6
          provider = new ethers.JsonRpcProvider(ETHEREUM_RPC_FALLBACK);
        }
        
        // Retry with alternate provider
        console.log("🔄 Using alternate provider:", ETHEREUM_RPC_FALLBACK);
        
        // Define ABI minimale per l'NFT contract
        const nftAbi = [
          "function balanceOf(address owner) view returns (uint256)",
          "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
          "function ownerOf(uint256 tokenId) view returns (address)"
        ];
        
        // Create instance of NFT contract using the alternate provider
        nftContract = new ethers.Contract(IASE_NFT_CONTRACT, nftAbi, provider);
        
        // Read NFT balance with alternate provider
        const balance = await nftContract.balanceOf(walletAddress);
        const balanceNumber = parseInt(balance.toString());
        
        console.log(`🔍 Alternate provider found ${balanceNumber} NFTs for address ${walletAddress}`);
        
        // Same direct token scanning approach with alternate provider
        const nftIds = [];
      
        // Check ownership for tokens 1-3000 (reasonable range for our collection)
        const ownershipPromises = [];
        for (let i = 1; i <= 3000; i++) {
          ownershipPromises.push(checkTokenOwnership(i));
        }
        
        // Process ownership checks in batches to avoid rate limiting
        const batchSize = 50; // smaller batch size for alternate provider
        let results = [];
        
        for (let i = 0; i < ownershipPromises.length; i += batchSize) {
          const batch = ownershipPromises.slice(i, i + batchSize);
          const batchResults = await Promise.all(batch);
          results = [...results, ...batchResults];
          
          // Add a larger delay between batches for alternate provider
          if (i + batchSize < ownershipPromises.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
        
        // Filter out tokens owned by the wallet
        const ownedTokens = results.filter(token => token !== null);
        
        console.log(`✅ Alternate provider scan found ${ownedTokens.length} tokens owned by this wallet`);
        
        return {
          address: walletAddress,
          balance: balanceNumber.toString(),
          nftIds: ownedTokens
        };
        
        async function checkTokenOwnership(tokenId) {
          try {
            const owner = await nftContract.ownerOf(tokenId);
            // Check if the owner matches our wallet (case insensitive)
            if (owner.toLowerCase() === walletAddress.toLowerCase()) {
              return tokenId.toString();
            }
            return null;
          } catch (error) {
            // Token doesn't exist or other error
            return null;
          }
        }
      } catch (alternateError) {
        console.error("❌ Even alternate provider failed:", alternateError);
        throw new Error("Failed to read NFTs after trying multiple providers");
      }
    }
  } catch (error) {
    console.error(`❌ Error in getUserNFTs: ${error.message}`);
    throw error;
  }
}

/**
 * Ottiene i metadati di un NFT specifico
 * @param {number|string} tokenId - ID del token NFT (può essere numero o stringa)
 * @returns {Promise<Object>} - Metadati dell'NFT
 */
export async function getNFTMetadata(tokenId) {
  try {
    // ROBUST SOLUTION: Always use Infura as direct provider
    let provider, nftContract;
    
    try {
      // Create provider with API key
      if (typeof ethers.providers === 'object') {
        // ethers v5
        provider = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_API_KEY}`);
      } else {
        // ethers v6
        provider = new ethers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_API_KEY}`);
      }
      
      console.log("🔄 Initializing Infura provider for NFT metadata...");
      
      // Define minimal ABI for the NFT contract
      const nftAbi = [
        "function tokenURI(uint256 tokenId) view returns (string)",
        "function name() view returns (string)",
        "function symbol() view returns (string)"
      ];
      
      // Create contract instance
      nftContract = new ethers.Contract(IASE_NFT_CONTRACT, nftAbi, provider);
      
      // Get token URI from the contract
      const tokenURI = await nftContract.tokenURI(tokenId);
      
      // Normalize the URI (handle ipfs:// and other protocols)
      const normalizedURI = this.normalizeURI ? this.normalizeURI(tokenURI) : tokenURI;
      
      // Fetch metadata from the normalized URI
      const response = await fetch(normalizedURI);
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.statusText}`);
      }
      
      const metadata = await response.json();
      return metadata;
      
    } catch (error) {
      console.error(`❌ Error fetching metadata with Infura for token ${tokenId}:`, error);
      
      // Fallback to alternative provider
      console.log("⚠️ Falling back to alternate provider for metadata...");
      
      try {
        // Create alternative provider
        if (typeof ethers.providers === 'object') {
          // ethers v5
          provider = new ethers.providers.JsonRpcProvider(ETHEREUM_RPC_FALLBACK);
        } else {
          // ethers v6
          provider = new ethers.JsonRpcProvider(ETHEREUM_RPC_FALLBACK);
        }
        
        // Define minimal ABI for the NFT contract
        const nftAbi = [
          "function tokenURI(uint256 tokenId) view returns (string)",
          "function name() view returns (string)",
          "function symbol() view returns (string)"
        ];
        
        // Create contract instance with alternate provider
        nftContract = new ethers.Contract(IASE_NFT_CONTRACT, nftAbi, provider);
        
        // Get token URI from the contract using alternate provider
        const tokenURI = await nftContract.tokenURI(tokenId);
        
        // Normalize the URI (handle ipfs:// and other protocols)
        const normalizedURI = this.normalizeURI ? this.normalizeURI(tokenURI) : tokenURI;
        
        // Fetch metadata from the normalized URI
        const response = await fetch(normalizedURI);
        if (!response.ok) {
          throw new Error(`Failed to fetch metadata: ${response.statusText}`);
        }
        
        const metadata = await response.json();
        return metadata;
        
      } catch (alternateError) {
        console.error(`❌ Even alternate provider failed for metadata of token ${tokenId}:`, alternateError);
        
        // Emergency fallback - return minimal metadata
        return {
          name: `IASE Unit #${tokenId}`,
          description: "IASE NFT - Metadata unavailable",
          image: "https://iaseproject.com/images/nft-placeholder.png",
          attributes: [
            { trait_type: "Rarity", value: getRarityFromMetadata({ tokenId }) }
          ]
        };
      }
    }
  } catch (error) {
    console.error(`❌ Critical error in getNFTMetadata for token ${tokenId}:`, error);
    throw error;
  }
}

/**
 * Normalizza gli URI per supportare vari protocolli come ipfs://
 * @param {string} uri - URI originale 
 * @returns {string} - URI normalizzato
 */
function normalizeURI(uri) {
  if (!uri) return "";
  
  // Handle IPFS URIs
  if (uri.startsWith('ipfs://')) {
    return uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }
  
  // Handle HTTP(S) URIs
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }
  
  // Handle relative URIs
  if (uri.startsWith('/')) {
    return `https://iaseproject.com${uri}`;
  }
  
  // Default fallback
  return uri;
}

/**
 * Estrae la rarità dai metadati dell'NFT
 * @param {Object} metadata - Metadati dell'NFT
 * @returns {string} - Livello di rarità
 */
function getRarityFromMetadata(metadata) {
  if (!metadata) return "Standard";
  
  // Check if attributes exist and find rarity
  if (metadata.attributes && Array.isArray(metadata.attributes)) {
    const rarityAttribute = metadata.attributes.find(
      attr => attr.trait_type === "Rarity" || attr.trait_type === "Collection" || attr.trait_type === "Type"
    );
    
    if (rarityAttribute && rarityAttribute.value) {
      return rarityAttribute.value;
    }
  }
  
  // Fallback: use token ID to guess rarity
  if (metadata.tokenId) {
    const id = parseInt(metadata.tokenId);
    if (id <= 10) return "Legendary";
    if (id <= 100) return "Ultra Rare";
    if (id <= 500) return "Rare";
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
          script.src = 'https://cdn.ethers.io/lib/ethers-5.6.umd.min.js';
          script.onload = resolve;
          script.onerror = () => {
            // Try alternate CDN if first one fails
            const altScript = document.createElement('script');
            altScript.src = 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js';
            altScript.onload = resolve;
            altScript.onerror = reject;
            document.head.appendChild(altScript);
          };
          document.head.appendChild(script);
        });
        
        console.log("✅ Successfully loaded ethers.js dynamically");
      } catch (ethersLoadError) {
        console.error("❌ Failed to load ethers.js dynamically:", ethersLoadError);
        throw new Error("Could not load ethers.js. Please refresh the page or check your internet connection.");
      }
    }
    
    const nftData = await getUserNFTs();
    
    if (!nftData || !nftData.nftIds || nftData.nftIds.length === 0) {
      console.log("ℹ️ No NFTs found in the wallet");
      return { address: nftData?.address || '', balance: '0', nftIds: [] };
    }
    
    // Get metadata for each NFT
    const metadataPromises = nftData.nftIds.map(async (tokenId) => {
      try {
        const metadata = await getNFTMetadata(tokenId);
        return {
          id: tokenId,
          ...metadata,
          // Normalize URI if needed
          image: normalizeURI(metadata.image)
        };
      } catch (error) {
        console.error(`❌ Error getting metadata for token ${tokenId}:`, error);
        return {
          id: tokenId,
          name: `IASE Unit #${tokenId}`,
          description: "Failed to load metadata",
          image: "https://iaseproject.com/images/nft-placeholder.png"
        };
      }
    });
    
    const metadataResults = await Promise.allSettled(metadataPromises);
    
    const nftsWithMetadata = metadataResults
      .filter(result => result.status === "fulfilled")
      .map(result => result.value);
    
    console.log(`✅ Successfully loaded ${nftsWithMetadata.length} IASE NFTs with metadata`);
    return { ...nftData, nfts: nftsWithMetadata };
  } catch (error) {
    console.error("❌ Error loading NFTs:", error);
    return { address: '', balance: '0', nftIds: [] };
  }
}

// Se il file viene caricato come script normale (non come modulo ES6)
// rendiamo le funzioni disponibili globalmente nel window object
if (typeof window !== 'undefined') {
  window.getUserNFTs = getUserNFTs;
  window.getNFTMetadata = getNFTMetadata;
  window.loadAllIASENFTs = loadAllIASENFTs;
  window.normalizeURI = normalizeURI;
  console.log("✅ NFT Reader functions exposed to global window");
}

// Per supporto ES6 module (anche se non lo usiamo più - manteniamo per retrocompatibilità)
if (isModule) {
  console.log("📦 NFT Reader exporting as ES6 module");
  export { getUserNFTs, getNFTMetadata, loadAllIASENFTs, normalizeURI };
}