/**
 * IASE Project - NFT Verification Service
 * 
 * Questo servizio verifica la proprietà degli NFT tramite chiamate API
 * alla blockchain Ethereum.
 */

import { ethers } from 'ethers';
import { CONFIG } from '../config';
import { storage } from '../storage';
import { NftStake, StakingReward } from '@shared/schema';

// Definizione interfacce per i tipi
interface NftTrait {
  nftId: string;
  traitType: string;
  value: string;
  displayType?: string | null;
}

// Remap CONFIG per semplificare l'accesso
const ETH_CONFIG = {
  networkUrl: CONFIG.ETH_NETWORK_URL,
  networkUrlFallback: CONFIG.ETH_NETWORK_URL, // Usiamo lo stesso URL come fallback
  nftContractAddress: CONFIG.NFT_CONTRACT_ADDRESS,
  rarityMultipliers: {
    "Standard": 1.0,
    "Advanced": 1.5,
    "Elite": 2.0,
    "Prototype": 2.5
  } as Record<string, number>
};

// Interfaccia minima per contratto ERC721
const ERC721_ABI = [
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenURI(uint256 tokenId) view returns (string)',
];

// Costanti per le ricompense di staking
const MONTHLY_REWARD = 1000; // 1000 IASE tokens mensili
const DAILY_REWARD = MONTHLY_REWARD / 30; // ~33.33 IASE tokens al giorno

/**
 * Calcola la ricompensa giornaliera per un NFT in base alla sua rarità
 * @param tokenId - ID del token NFT
 * @param rarityTier - Livello di rarità dell'NFT (opzionale)
 * @returns La ricompensa giornaliera calcolata
 */
export async function calculateDailyReward(tokenId: string, rarityTier?: string): Promise<number> {
  // Se la rarità è specificata, usiamo quella per calcolare il moltiplicatore
  if (rarityTier) {
    const rarityKey = rarityTier.charAt(0).toUpperCase() + rarityTier.slice(1).toLowerCase();
    const multiplier = ETH_CONFIG.rarityMultipliers[rarityKey as keyof typeof ETH_CONFIG.rarityMultipliers] || 1.0;
    return DAILY_REWARD * multiplier;
  }
  
  // Altrimenti, recuperiamo il moltiplicatore di rarità in base ai metadati dell'NFT
  const rarityMultiplier = await getNftRarityMultiplier(tokenId);
  return DAILY_REWARD * rarityMultiplier;
}

/**
 * Verifica se un dato wallet possiede un NFT specifico
 * @param walletAddress - Indirizzo del wallet da verificare
 * @param tokenId - ID del token NFT da verificare
 * @returns True se il wallet possiede l'NFT, false altrimenti
 */
export async function verifyNftOwnership(walletAddress: string, tokenId: string): Promise<boolean> {
  try {
    console.log(`🔍 Verifica NFT #${tokenId} per wallet ${walletAddress}`);
    
    // Connetti al provider Ethereum con fallback
    let provider: ethers.JsonRpcProvider;
    try {
      provider = new ethers.JsonRpcProvider(ETH_CONFIG.networkUrl);
      console.log(`🌐 NFT Verification connesso a ${ETH_CONFIG.networkUrl}`);
    } catch (providerError) {
      console.error(`❌ Errore con provider primario:`, providerError);
      provider = new ethers.JsonRpcProvider(ETH_CONFIG.networkUrlFallback);
      console.log(`🌐 NFT Verification connesso al fallback ${ETH_CONFIG.networkUrlFallback}`);
    }
    
    // Crea un'istanza del contratto NFT
    const nftContract = new ethers.Contract(
      ETH_CONFIG.nftContractAddress,
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
 * @param tokenId - ID del token NFT
 * @returns Moltiplicatore di rarità per l'NFT
 */
export async function getNftRarityMultiplier(tokenId: string): Promise<number> {
  try {
    console.log(`🔍 Recupero metadati per NFT #${tokenId}`);
    
    // Verifica se abbiamo già salvato i tratti di questo NFT
    const existingTraits = await storage.getNftTraitsByNftId(tokenId);
    
    if (existingTraits && existingTraits.length > 0) {
      // Cerca il trait "CARD FRAME" che determina la rarità
      const frameTrait = existingTraits.find(trait => 
        trait.traitType.toUpperCase() === 'CARD FRAME');
      
      if (frameTrait) {
        const multiplier = ETH_CONFIG.rarityMultipliers[frameTrait.value] || 1.0;
        console.log(`📊 Rarità NFT #${tokenId}: ${frameTrait.value} (${multiplier}x)`);
        return multiplier;
      }
    }
    
    // Se non abbiamo i traits, recuperali dall'API
    const provider = new ethers.JsonRpcProvider(ETH_CONFIG.networkUrl);
    const nftContract = new ethers.Contract(
      ETH_CONFIG.nftContractAddress,
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
            value: attribute.value
          });
        }
      }
      
      // Trova il trait "CARD FRAME"
      const frameTrait = metadata.attributes.find((attr: { trait_type: string; value: string }) => 
        attr.trait_type.toUpperCase() === 'CARD FRAME');
      
      if (frameTrait) {
        const multiplier = ETH_CONFIG.rarityMultipliers[frameTrait.value] || 1.0;
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
 */
export async function verifyAllStakes(): Promise<void> {
  console.log("🔍 Avvio verifica di tutti gli stake NFT attivi...");
  
  try {
    // Ottieni tutti gli stake attivi
    const activeStakes = await storage.getAllActiveStakes();
    console.log(`ℹ️ Trovati ${activeStakes.length} stake attivi da verificare`);
    
    if (activeStakes.length === 0) {
      console.log("✅ Nessuno stake da verificare");
      return;
    }
    
    // Inizializza connessione alla blockchain una sola volta
    console.log(`🔌 Connessione a Ethereum: ${ETH_CONFIG.networkUrl}`);
    let provider: ethers.JsonRpcProvider;
    try {
      provider = new ethers.JsonRpcProvider(ETH_CONFIG.networkUrl);
    } catch (error) {
      console.error(`❌ Errore con provider primario:`, error);
      provider = new ethers.JsonRpcProvider(ETH_CONFIG.networkUrlFallback);
      console.log(`🔄 Usando provider fallback: ${ETH_CONFIG.networkUrlFallback}`);
    }
    
    // Inizializza contratto NFT
    const nftContract = new ethers.Contract(
      ETH_CONFIG.nftContractAddress,
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
          await storage.endNftStake(stake.id);
          
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
          walletAddress: stake.walletAddress,
          claimed: false
        });
        
        // Aggiorna lo stake
        await storage.updateNftStakeVerification(stake.id);
        
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