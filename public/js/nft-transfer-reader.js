/**
 * IASE NFT Transfer Events Reader - Versione ottimizzata per Render
 * Utility per leggere NFT dal wallet usando eventi Transfer invece di ERC721Enumerable
 * 
 * Versione 1.0.0 - 2025-05-15
 * - Compatibile con ethers.js v5 e v6
 * - Utilizza eventi Transfer invece di tokenOfOwnerByIndex
 * - Funziona con contratti ERC721 non Enumerable
 * - Stessa interfaccia del nftReader.js originale
 */

// Configurazioni globali da window o hardcoded per massima compatibilità
const IASE_NFT_CONTRACT = window.NFT_CONTRACT_ADDRESS || '0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F';
const INFURA_API_KEY = window.INFURA_API_KEY || '84ed164327474b4499c085d2e4345a66';
const ETHEREUM_RPC_FALLBACK = window.ETHEREUM_RPC_FALLBACK || 'https://rpc.ankr.com/eth';

// ABI minimo per contratto ERC721 (senza Enumerable)
const ERC721_BASIC_ABI = [
  {"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"}
];

/**
 * Legge gli NFT posseduti da un indirizzo wallet usando eventi Transfer
 * Implementa la stessa interfaccia del getUserNFTs originale
 * @returns {Promise<{address: string, balance: string, nftIds: string[]}>}
 */
export async function getUserNFTsViaTransfer() {
  try {
    // Check if wallet is connected
    if (!window.ethereum) {
      console.error("Wallet not found. Make sure MetaMask is installed and connected.");
      alert("Wallet not found. Make sure MetaMask is installed and connected.");
      return null;
    }

    console.log("🔍 Initializing NFT reading via Transfer events...");
    
    // Get user address from wallet
    const userAddress = window.ethereum.selectedAddress;
    if (!userAddress) {
      console.error("No wallet address selected");
      alert("Wallet not connected or address unavailable");
      return null;
    }
    
    console.log(`👤 Connected user: ${userAddress}`);
    const normalizedUserAddress = userAddress.toLowerCase();
    
    // Setup ethers provider with version detection
    const isEthersV5 = ethers.providers && ethers.providers.JsonRpcProvider;
    const isEthersV6 = ethers.JsonRpcProvider;
    
    let provider;
    
    // Create provider with our API key
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

    // Create instance of NFT contract 
    const contract = new ethers.Contract(IASE_NFT_CONTRACT, ERC721_BASIC_ABI, provider);

    // Read NFT balance directly with Infura (just like original)
    const balance = await contract.balanceOf(userAddress);
    console.log(`🏦 NFTs found in wallet: ${balance.toString()}`);

    // Handle zeros
    const balanceNumber = typeof balance === 'bigint' ? Number(balance) : 
                         (typeof balance.toNumber === 'function' ? balance.toNumber() : parseInt(balance.toString(), 10));
    
    if (balanceNumber === 0) {
      console.log("No NFTs found in wallet");
      return {
        address: userAddress,
        balance: "0",
        nftIds: []
      };
    }
    
    console.log(`🔍 Searching for Transfer events to address ${normalizedUserAddress}`);
    
    // Query Transfer events to the user address
    // Set up event filter - compatible with both ethers v5 and v6
    const filter = isEthersV5 ? 
      contract.filters.Transfer(null, userAddress) : 
      contract.filters.Transfer(null, userAddress, null);
    
    // Query all historical transfers to this address
    const transferEvents = await contract.queryFilter(filter);
    console.log(`📊 Found ${transferEvents.length} Transfer events to user address`);
    
    // Process transfer events to identify tokens currently owned by user
    const tokenBalances = {};
    
    // First pass: process all Transfer events to/from user
    for (const event of transferEvents) {
      // Get event details
      const from = event.args.from.toLowerCase();
      const to = event.args.to.toLowerCase();
      const tokenId = event.args.tokenId.toString();
      
      // Check if this is a transfer to user 
      if (to === normalizedUserAddress) {
        // User received this token
        tokenBalances[tokenId] = true;
      }
    }
    
    // Second pass: filter out tokens no longer owned by getting latest owner
    const nftIds = [];
    
    // For each token the user received at some point
    for (const tokenId of Object.keys(tokenBalances)) {
      try {
        const currentOwner = (await contract.ownerOf(tokenId)).toLowerCase();
        
        // If user still owns this token, add to list
        if (currentOwner === normalizedUserAddress) {
          console.log(`✅ NFT #${tokenId} verified as owned by user`);
          nftIds.push(tokenId);
        } else {
          console.log(`ℹ️ NFT #${tokenId} now owned by different address: ${currentOwner}`);
        }
      } catch (error) {
        console.error(`❌ Error checking ownership of NFT #${tokenId}:`, error);
      }
      
      // Safety check - if we found expected number of tokens, stop checking
      if (nftIds.length >= balanceNumber) {
        console.log(`✅ Found all ${balanceNumber} tokens expected from balanceOf`);
        break;
      }
    }

    console.log(`✅ Successfully identified ${nftIds.length} NFTs owned by user via Transfer events`);
    
    return {
      address: userAddress,
      balance: balance.toString(),
      nftIds
    };
  } catch (error) {
    console.error("❌ Error reading NFTs via Transfer events:", error);
    return null;
  }
}

// Re-export the original getNFTMetadata from nftReader
export { getNFTMetadata } from './nftReader.js';

/**
 * Carica tutti gli NFT IASE dal wallet e ne recupera i metadati
 * Versione che utilizza eventi Transfer invece di tokenOfOwnerByIndex
 * @returns {Promise<Array>} - Array di oggetti NFT con tutti i dettagli
 */
export async function loadAllIASENFTsViaTransfer() {
  try {
    console.log("🔄 Starting IASE NFT loading via Transfer events - version 1.0.0");
    
    // Check if ethers.js is available
    if (typeof ethers !== 'object') {
      console.error("❌ Critical error: ethers.js not available");
      throw new Error("Ethers.js library not loaded");
    }
    
    // Verify that wallet is connected to get the address
    if (!window.ethereum) {
      console.error("❌ MetaMask not available");
      throw new Error("MetaMask not available");
    }
    
    // Using getUserNFTsViaTransfer which now uses Transfer events
    console.log("🚀 Loading NFTs via Transfer events...");
    const userNFTs = await getUserNFTsViaTransfer();
    
    if (!userNFTs || !userNFTs.nftIds || userNFTs.nftIds.length === 0) {
      console.log("📢 No IASE NFTs found in wallet");
      return [];
    }

    console.log(`🔍 Retrieving metadata for ${userNFTs.nftIds.length} NFTs...`);
    
    // Using the getNFTMetadata function imported at the top
    // Using Promise.allSettled instead of Promise.all for robustness
    const metadataResults = await Promise.allSettled(
      userNFTs.nftIds.map(async (tokenId) => {
        try {
          // Clean the token ID
          const cleanTokenId = String(tokenId).trim();
          console.log(`🔢 Processing token ID: "${cleanTokenId}"`);
          
          // Force explicit conversion
          const numericTokenId = parseInt(cleanTokenId, 10);
          if (isNaN(numericTokenId)) {
            console.error(`❌ Invalid token ID: "${cleanTokenId}"`);
            throw new Error(`Invalid token ID: ${cleanTokenId}`);
          }
          
          // Use the original getNFTMetadata function
          const tokenMetadata = await getNFTMetadata(numericTokenId);
          console.log(`✅ Metadata retrieved for NFT #${numericTokenId}`);
          
          // Ensure consistent ID format
          return {
            ...tokenMetadata,
            id: String(numericTokenId)
          };
        } catch (err) {
          console.error(`❌ Error processing token ${tokenId}:`, err);
          // Fallback data (same as original)
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

    console.log(`✅ Successfully loaded ${nftsWithMetadata.length} IASE NFTs with metadata via Transfer events`);
    return nftsWithMetadata;
  } catch (error) {
    console.error("❌ Error loading NFTs via Transfer:", error);
    return [];
  }
}