/**
 * IASE Project - NFT Verification Service
 * 
 * Questo servizio verifica la proprietà degli NFT tramite chiamate API
 * alla blockchain Ethereum.
 */

import { ethers } from 'ethers';
import { CONFIG } from '../config.js';
import { storage } from '../storage.js';

// Interfaccia minima per contratto ERC721
const ERC721_ABI = [
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenURI(uint256 tokenId) view returns (string)',
];

// Costanti per le ricompense di staking
const MONTHLY_REWARD = 1000; // 1000 IASE tokens mensili
const DAILY_REWARD = MONTHLY_REWARD / 30; // ~33.33 IASE tokens al giorno

/**
 * Verifica se un dato wallet possiede un NFT specifico
 * @param {string} walletAddress - Indirizzo del wallet da verificare
 * @param {string} tokenId - ID del token NFT da verificare
 * @returns {Promise<boolean>} True se il wallet possiede l'NFT, false altrimenti
 */
export async function verifyNftOwnership(walletAddress, tokenId) {
  try {
    console.log(`🔍 Verifica NFT #${tokenId} per wallet ${walletAddress}`);
    
    // Connetti al provider Ethereum con fallback
    let provider;
    try {
      provider = new ethers.JsonRpcProvider(CONFIG.eth.networkUrl);
      console.log(`🌐 NFT Verification connesso a ${CONFIG.eth.networkUrl}`);
    } catch (providerError) {
      console.error(`❌ Errore con provider primario: ${providerError}`);
      provider = new ethers.JsonRpcProvider(CONFIG.eth.networkUrlFallback);
      console.log(`🌐 NFT Verification connesso al fallback ${CONFIG.eth.networkUrlFallback}`);
    }
    
    // Crea un'istanza del contratto NFT
    const nftContract = new ethers.Contract(
      CONFIG.eth.nftContractAddress,
      ERC721_ABI,
      provider
    );
    
    // Ottieni il proprietario attuale del token
    const currentOwner = await nftContract.ownerOf(tokenId);
    
    // Converti gli indirizzi in formato consistente (lowercase)
    const normalizedWalletAddress = walletAddress.toLowerCase();
    const normalizedCurrentOwner = currentOwner.toLowerCase();
    
    // Verifica se il wallet è ancora proprietario
    const isOwner = normalizedCurrentOwner === normalizedWalletAddress;
    
    console.log(`${isOwner ? '✅' : '❌'} NFT #${tokenId} ${isOwner ? 'appartiene' : 'non appartiene'} a ${walletAddress}`);
    
    return isOwner;
  } catch (error) {
    console.error(`⚠️ Errore nella verifica dell'NFT #${tokenId}:`, error);
    // In caso di errore, assumiamo che la verifica sia fallita
    return false;
  }
}

/**
 * Recupera i metadati di un NFT e identifica la sua rarità
 * @param {string} tokenId - ID del token NFT
 * @returns {Promise<number>} Moltiplicatore di rarità per l'NFT
 */
export async function getNftRarityMultiplier(tokenId) {
  try {
    console.log(`🔍 Recupero metadati per NFT #${tokenId}`);
    
    // Verifica se abbiamo già salvato i tratti di questo NFT
    const existingTraits = await storage.getNftTraitsByNftId(tokenId);
    
    if (existingTraits && existingTraits.length > 0) {
      // Cerca il trait "CARD FRAME" che determina la rarità
      const frameTrait = existingTraits.find(trait => 
        trait.traitType.toUpperCase() === 'CARD FRAME');
      
      if (frameTrait) {
        const multiplier = CONFIG.staking.rarityMultipliers[frameTrait.value] || 1.0;
        console.log(`📊 Rarità NFT #${tokenId}: ${frameTrait.value} (${multiplier}x)`);
        return multiplier;
      }
    }
    
    // Se non abbiamo i traits, recuperali dall'API
    const provider = new ethers.JsonRpcProvider(CONFIG.eth.networkUrl);
    const nftContract = new ethers.Contract(
      CONFIG.eth.nftContractAddress,
      ERC721_ABI,
      provider
    );
    
    // Ottieni l'URL dei metadati
    const tokenURI = await nftContract.tokenURI(tokenId);
    console.log(`🔗 TokenURI per NFT #${tokenId}: ${tokenURI}`);
    
    // Recupera i metadati
    const response = await fetch(tokenURI);
    if (!response.ok) {
      throw new Error(`Errore HTTP: ${response.status}`);
    }
    
    const metadata = await response.json();
    console.log(`📄 Metadati per NFT #${tokenId} recuperati`);
    
    // Salva i tratti nel database
    if (metadata.attributes && Array.isArray(metadata.attributes)) {
      for (const attribute of metadata.attributes) {
        if (attribute.trait_type && attribute.value) {
          await storage.createNftTrait({
            nftId: tokenId,
            traitType: attribute.trait_type,
            value: attribute.value,
            displayType: attribute.display_type || null
          });
        }
      }
      
      // Trova il trait "CARD FRAME"
      const frameTrait = metadata.attributes.find(attr => 
        attr.trait_type.toUpperCase() === 'CARD FRAME');
      
      if (frameTrait) {
        const multiplier = CONFIG.staking.rarityMultipliers[frameTrait.value] || 1.0;
        console.log(`📊 Rarità NFT #${tokenId}: ${frameTrait.value} (${multiplier}x)`);
        return multiplier;
      }
    }
    
    // Default: Se non troviamo info sulla rarità, restituiamo il moltiplicatore base
    console.log(`⚠️ Nessuna informazione sulla rarità trovata per NFT #${tokenId}, uso moltiplicatore standard (1.0x)`);
    return 1.0;
  } catch (error) {
    console.error(`⚠️ Errore nel recupero dei metadati per l'NFT #${tokenId}:`, error);
    // In caso di errore, assumiamo rarità base
    return 1.0;
  }
}

/**
 * Verifica tutti gli NFT attualmente in staking e distribuisce ricompense
 * Funzione chiamata dal cron job giornaliero
 * @returns {Promise<void>}
 */
export async function verifyAllStakes() {
  console.log("🔍 Avvio verifica di tutti gli stake NFT attivi...");
  
  try {
    // Connessione al database
    await storage.testConnection();
    console.log("✅ Connessione al database stabilita");
    
    // Filtro per stake attivi non verificati oggi
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Ottieni tutti gli stake attivi
    const activeStakes = await storage.getActiveNftStakes();
    console.log(`ℹ️ Trovati ${activeStakes.length} stake attivi da verificare`);
    
    if (activeStakes.length === 0) {
      console.log("✅ Nessuno stake da verificare");
      return;
    }
    
    // Inizializza connessione alla blockchain una sola volta
    console.log(`🔌 Connessione a Ethereum: ${CONFIG.eth.networkUrl}`);
    let provider;
    try {
      provider = new ethers.JsonRpcProvider(CONFIG.eth.networkUrl);
    } catch (error) {
      console.error(`❌ Errore con provider primario: ${error.message}`);
      provider = new ethers.JsonRpcProvider(CONFIG.eth.networkUrlFallback);
      console.log(`🔄 Usando provider fallback: ${CONFIG.eth.networkUrlFallback}`);
    }
    
    // Inizializza contratto NFT
    const nftContract = new ethers.Contract(
      CONFIG.eth.nftContractAddress,
      ERC721_ABI,
      provider
    );
    
    // Contatori statistiche
    let verifiedCount = 0;
    let endedCount = 0;
    let rewardsDistributed = 0;
    
    // Verifica ogni stake
    for (const stake of activeStakes) {
      console.log(`\n🔍 Verificando stake ID ${stake.id} - NFT #${stake.nftId} - Wallet: ${stake.walletAddress}`);
      
      try {
        // Verifica proprietà
        const currentOwner = await nftContract.ownerOf(stake.nftId);
        
        if (currentOwner.toLowerCase() !== stake.walletAddress.toLowerCase()) {
          console.log(`⚠️ NFT #${stake.nftId} non più posseduto da ${stake.walletAddress}`);
          
          // Termina lo stake
          await storage.updateNftStake(stake.id, {
            status: "ended",
            endTimestamp: new Date().toISOString(),
            endReason: "ownership_change"
          });
          
          endedCount++;
          continue;
        }
        
        // Calcola rarità e ricompensa
        const rarityMultiplier = await getNftRarityMultiplier(stake.nftId);
        
        // Calcolo ricompensa con moltiplicatore di rarità
        const rewardAmount = DAILY_REWARD * rarityMultiplier;
        
        console.log(`💰 Ricompensa calcolata: ${rewardAmount.toFixed(2)} IASE (${rarityMultiplier}x)`);
        
        // Crea ricompensa
        await storage.createStakingReward({
          stakeId: stake.id,
          amount: rewardAmount,
          timestamp: new Date().toISOString(),
          walletAddress: stake.walletAddress,
          claimed: false,
          rarityMultiplier
        });
        
        // Aggiorna lo stake
        await storage.updateNftStake(stake.id, {
          lastVerified: new Date().toISOString(),
          daysVerified: (stake.daysVerified || 0) + 1
        });
        
        console.log(`✅ Ricompensa di ${rewardAmount.toFixed(2)} IASE aggiunta per NFT #${stake.nftId}`);
        verifiedCount++;
        rewardsDistributed += rewardAmount;
        
      } catch (error) {
        console.error(`❌ Errore durante la verifica di NFT #${stake.nftId}:`, error);
      }
    }
    
    // Riassunto finale
    console.log("\n📊 RIEPILOGO VERIFICA STAKING:");
    console.log(`✅ Stake verificati correttamente: ${verifiedCount}`);
    console.log(`❌ Stake terminati per cambio proprietà: ${endedCount}`);
    console.log(`💰 Totale ricompense distribuite: ${rewardsDistributed.toFixed(2)} IASE`);
    
  } catch (error) {
    console.error("❌ Errore durante la verifica degli stake:", error);
    throw error;
  }
}