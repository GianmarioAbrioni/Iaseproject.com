/**
 * IASE Project - NFT Verification Service
 * 
 * Questo servizio verifica la proprietà degli NFT tramite chiamate API
 * alla blockchain Ethereum usando Alchemy API per maggiore affidabilità.
 * 
 * Versione 2.0.0 - 2025-05-15
 * - Integrazione con Alchemy API per verifiche più affidabili
 * - Sistema di fallback a ethers.js diretto in caso di problemi con API
 * - Ottimizzazione cache metadati per ridurre chiamate
 * - Logging avanzato per troubleshooting
 */

import { ethers } from 'ethers';
import { CONFIG } from '../config';
import { storage } from '../storage';
import { NftStake, StakingReward } from '@shared/schema';
import fetch from 'node-fetch';

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
  alchemyApiKey: process.env.ALCHEMY_API_KEY || 'uAZ1tPYna9tBMfuTa616YwMcgptV_1vB',
  alchemyApiUrl: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY || 'uAZ1tPYna9tBMfuTa616YwMcgptV_1vB'}`,
  rarityMultipliers: {
    "Standard": 1.0,
    "Advanced": 1.5,
    "Elite": 2.0,
    "Prototype": 2.5
  } as Record<string, number>,
  useAlchemyApi: true // Flag per abilitare/disabilitare l'uso dell'API Alchemy
};

// Interfaccia minima per contratto ERC721 (estesa con enumerable estension e Transfer event)
const ERC721_ABI = [
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
];

// Costanti per le ricompense di staking
// Utilizziamo valori fissi in base alla rarità
const BASE_DAILY_REWARD = 33.33; // Standard (1.0x)
const ADVANCED_DAILY_REWARD = 50.00; // Advanced (1.5x)
const ELITE_DAILY_REWARD = 66.67; // Elite (2.0x)
const PROTOTYPE_DAILY_REWARD = 83.33; // Prototype (2.5x)

// Non usiamo più i vecchi calcoli di reward basati su valori mensili
// Ora utilizziamo solo i valori fissi giornalieri definiti sopra

/**
 * Calcola la ricompensa giornaliera per un NFT in base alla sua rarità
 * @param tokenId - ID del token NFT
 * @param rarityTier - Livello di rarità dell'NFT (opzionale)
 * @returns La ricompensa giornaliera calcolata
 */
export async function calculateDailyReward(tokenId: string, rarityTier?: string): Promise<number> {
  // Se la rarità è specificata, usiamo quella per assegnare direttamente il valore fisso
  if (rarityTier) {
    const rarityLower = rarityTier.toLowerCase();
    
    // Utilizziamo i valori fissi in base alla rarità
    if (rarityLower.includes('prototype') || rarityLower.includes('legendary')) {
      return PROTOTYPE_DAILY_REWARD;
    } else if (rarityLower.includes('elite') || rarityLower.includes('epic')) {
      return ELITE_DAILY_REWARD;
    } else if (rarityLower.includes('advanced') || rarityLower.includes('rare')) {
      return ADVANCED_DAILY_REWARD;
    } else {
      return BASE_DAILY_REWARD; // Standard/Common
    }
  }
  
  // Altrimenti, recuperiamo i metadati dell'NFT e determiniamo la rarità
  try {
    const metadata = await getNftMetadata(tokenId);
    if (!metadata) return BASE_DAILY_REWARD;
    
    // Estrai attributi rilevanti
    const attributes = metadata.attributes || [];
    let cardFrame = null;
    let aiBooster = null;
    
    for (const attr of attributes) {
      if (attr.trait_type && attr.trait_type.toLowerCase() === 'card frame') {
        cardFrame = attr.value;
      }
      if (attr.trait_type && 
          (attr.trait_type.toLowerCase() === 'ai-booster' || 
           attr.trait_type.toLowerCase() === 'ai booster')) {
        aiBooster = attr.value;
      }
    }
    
    // Determina rarità in base a Card Frame o AI-Booster
    if (cardFrame) {
      const frameValue = cardFrame.toLowerCase();
      if (frameValue.includes("prototype")) {
        return PROTOTYPE_DAILY_REWARD;
      } else if (frameValue.includes("elite")) {
        return ELITE_DAILY_REWARD;
      } else if (frameValue.includes("advanced")) {
        return ADVANCED_DAILY_REWARD;
      }
    } 
    // Fallback a AI-Booster se non c'è Card Frame o è standard
    else if (aiBooster) {
      const boosterValue = aiBooster.toString().toUpperCase();
      if (boosterValue.includes('X2.5') || boosterValue.includes('2.5')) {
        return PROTOTYPE_DAILY_REWARD;
      } else if (boosterValue.includes('X2.0') || boosterValue.includes('2.0')) {
        return ELITE_DAILY_REWARD;
      } else if (boosterValue.includes('X1.5') || boosterValue.includes('1.5')) {
        return ADVANCED_DAILY_REWARD;
      }
    }
    
    // Default per Standard/Common
    return BASE_DAILY_REWARD;
  } catch (error) {
    console.error(`Errore nel calcolo della ricompensa per il token ${tokenId}:`, error);
    return BASE_DAILY_REWARD; // Valore default in caso di errore
  }
}

/**
 * Verifica se un dato wallet possiede un NFT specifico
 * Usa prima Alchemy API per verifica veloce, con fallback a ethers.js
 * @param walletAddress - Indirizzo del wallet da verificare
 * @param tokenId - ID del token NFT da verificare
 * @returns True se il wallet possiede l'NFT, false altrimenti
 */
export async function verifyNftOwnership(walletAddress: string, tokenId: string): Promise<boolean> {
  try {
    console.log(`🔍 Verifica NFT #${tokenId} per wallet ${walletAddress}`);
    
    // Normalizza gli indirizzi (caso insensitivo)
    const normalizedWalletAddress = walletAddress.toLowerCase();
    
    // Prova prima con Alchemy API se abilitato
    if (ETH_CONFIG.useAlchemyApi) {
      try {
        console.log(`🔍 Verifica NFT #${tokenId} tramite Alchemy API`);
        
        // Costruisci l'URL per la chiamata Alchemy API
        // Poiché vogliamo verificare un token specifico, useremo proprio il tokenId
        const alchemyUrl = `${ETH_CONFIG.alchemyApiUrl}/getNFTMetadata?contractAddress=${ETH_CONFIG.nftContractAddress}&tokenId=${tokenId}`;
        
        // Invia la richiesta all'API
        const response = await fetch(alchemyUrl);
        
        if (!response.ok) {
          console.error(`❌ Errore API Alchemy: ${response.status} ${response.statusText}`);
          throw new Error(`Errore API HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`✅ Risposta Alchemy ricevuta per NFT #${tokenId}`);
        
        // Verifichiamo il proprietario
        if (data.owner) {
          const normalizedOwner = data.owner.toLowerCase();
          const isOwner = normalizedOwner === normalizedWalletAddress;
          
          console.log(`${isOwner ? '✅' : '❌'} NFT #${tokenId} ${isOwner ? 'appartiene' : 'non appartiene'} a ${walletAddress} (via Alchemy API)`);
          return isOwner;
        } else {
          console.log(`⚠️ Risposta Alchemy senza info proprietario per NFT #${tokenId}, fallback a metodo tradizionale`);
        }
      } catch (alchemyError) {
        console.error(`❌ Errore con Alchemy API:`, alchemyError);
        console.log(`⚠️ Fallback a metodo tradizionale per NFT #${tokenId}`);
      }
    }
    
    // Fallback al metodo tradizionale con ethers.js
    console.log(`🔄 Usando metodo tradizionale per NFT #${tokenId}`);
    
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
    const normalizedCurrentOwner = currentOwner.toLowerCase();
    
    // Verifica se il wallet è ancora proprietario
    const isOwner = normalizedCurrentOwner === normalizedWalletAddress;
    
    console.log(`${isOwner ? '✅' : '❌'} NFT #${tokenId} ${isOwner ? 'appartiene' : 'non appartiene'} a ${walletAddress} (via ethers.js)`);
    
    return isOwner;
  } catch (error) {
    console.error(`⚠️ Errore nella verifica dell'NFT #${tokenId}:`, error);
    // In caso di errore, assumiamo che la verifica sia fallita
    return false;
  }
}

/**
 * Recupera i metadati di un NFT e identifica la sua rarità
 * Usa Alchemy API per recupero più veloce e affidabile
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
        // Utilizziamo i valori fissi di ricompensa invece dei moltiplicatori
        const frameValue = frameTrait.value.toLowerCase();
        let multiplier = 1.0; // Default moltiplicatore
        let dailyReward = BASE_DAILY_REWARD; // Default reward
        
        if (frameValue.includes("prototype")) {
          multiplier = 2.5;
          dailyReward = PROTOTYPE_DAILY_REWARD;
        } else if (frameValue.includes("elite")) {
          multiplier = 2.0;
          dailyReward = ELITE_DAILY_REWARD;
        } else if (frameValue.includes("advanced")) {
          multiplier = 1.5;
          dailyReward = ADVANCED_DAILY_REWARD;
        }
        
        console.log(`📊 Rarità NFT #${tokenId} da cache: ${frameTrait.value} (${multiplier}x) - ${dailyReward} IASE`);
        return multiplier;
      }
    }
    
    // Se l'API Alchemy è abilitata, usiamola per ottenere i metadati
    if (ETH_CONFIG.useAlchemyApi) {
      try {
        console.log(`🔍 Recupero metadati per NFT #${tokenId} tramite Alchemy API`);
        
        // Costruisci l'URL per la chiamata Alchemy API
        const alchemyUrl = `${ETH_CONFIG.alchemyApiUrl}/getNFTMetadata?contractAddress=${ETH_CONFIG.nftContractAddress}&tokenId=${tokenId}`;
        
        // Invia la richiesta all'API
        const response = await fetch(alchemyUrl);
        
        if (!response.ok) {
          console.error(`❌ Errore API Alchemy: ${response.status} ${response.statusText}`);
          throw new Error(`Errore API HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`✅ Risposta Alchemy ricevuta per metadati NFT #${tokenId}`);
        
        // Estrai gli attributi dai metadati
        if (data.metadata && data.metadata.attributes && Array.isArray(data.metadata.attributes)) {
          // Salva i tratti nel database
          for (const attribute of data.metadata.attributes) {
            if (attribute.trait_type && attribute.value) {
              await storage.createNftTrait({
                nftId: tokenId,
                traitType: attribute.trait_type,
                value: attribute.value
              });
            }
          }
          
          // Trova il trait "CARD FRAME"
          const frameTrait = data.metadata.attributes.find((attr: { trait_type: string; value: string }) => 
            attr.trait_type.toUpperCase() === 'CARD FRAME');
          
          if (frameTrait) {
            const multiplier = ETH_CONFIG.rarityMultipliers[frameTrait.value] || 1.0;
            console.log(`📊 Rarità NFT #${tokenId}: ${frameTrait.value} (${multiplier}x) [via Alchemy]`);
            return multiplier;
          }
        } else {
          console.log(`⚠️ Metadati Alchemy non contengono attributi, fallback a metodo tradizionale`);
        }
      } catch (alchemyError) {
        console.error(`❌ Errore con Alchemy API:`, alchemyError);
        console.log(`⚠️ Fallback a metodo tradizionale per metadati NFT #${tokenId}`);
      }
    }
    
    // Fallback al metodo tradizionale con ethers.js
    console.log(`🔄 Usando metodo tradizionale per metadati NFT #${tokenId}`);
    
    try {
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
      console.log(`📄 Metadati per NFT #${tokenId} recuperati via ethers.js`);
      
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
          console.log(`📊 Rarità NFT #${tokenId}: ${frameTrait.value} (${multiplier}x) [via ethers.js]`);
          return multiplier;
        }
      }
    } catch (fallbackError) {
      console.error(`❌ Errore nel fallback per metadati NFT #${tokenId}:`, fallbackError);
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
 * Ottimizzata per utilizzare Alchemy API per verifiche più veloci
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
    
    // Contatori statistiche
    let verifiedCount = 0;
    let endedCount = 0;
    let rewardsDistributed = 0;
    
    // Raggruppiamo gli NFT per wallet per ottimizzare le chiamate API
    const stakesByWallet: Record<string, typeof activeStakes> = {};
    
    for (const stake of activeStakes) {
      if (!stakesByWallet[stake.walletAddress]) {
        stakesByWallet[stake.walletAddress] = [];
      }
      stakesByWallet[stake.walletAddress].push(stake);
    }
    
    // Verifica ogni wallet con i suoi NFT
    for (const [walletAddress, stakes] of Object.entries(stakesByWallet)) {
      console.log(`\n🔍 Verificando ${stakes.length} stake per il wallet: ${walletAddress}`);
      
      // Se l'API Alchemy è abilitata, otteniamo tutti gli NFT del wallet in una sola chiamata
      if (ETH_CONFIG.useAlchemyApi) {
        try {
          console.log(`🔍 Recupero tutti gli NFT per ${walletAddress} tramite Alchemy API in un'unica chiamata`);
          
          // Costruisci l'URL per la chiamata Alchemy API
          const alchemyUrl = `${ETH_CONFIG.alchemyApiUrl}/getNFTs?owner=${walletAddress}&contractAddresses[]=${ETH_CONFIG.nftContractAddress}`;
          
          // Invia la richiesta all'API
          const response = await fetch(alchemyUrl);
          
          if (!response.ok) {
            console.error(`❌ Errore API Alchemy: ${response.status} ${response.statusText}`);
            throw new Error(`Errore API HTTP: ${response.status}`);
          }
          
          const data = await response.json();
          console.log(`✅ Risposta Alchemy ricevuta per wallet ${walletAddress}`);
          
          // Estrai i token ID posseduti dal wallet
          const ownedTokens = new Set();
          
          if (data.ownedNfts && Array.isArray(data.ownedNfts)) {
            for (const nft of data.ownedNfts) {
              // Estrai il token ID (potrebbe essere in hex)
              if (nft.id?.tokenId) {
                let tokenId = nft.id.tokenId;
                // Converti da hex a decimale se necessario
                if (tokenId.startsWith('0x')) {
                  tokenId = parseInt(tokenId, 16).toString();
                }
                ownedTokens.add(tokenId);
              }
            }
          }
          
          console.log(`📋 Token posseduti da ${walletAddress}: ${Array.from(ownedTokens).join(', ')}`);
          
          // Verifica ogni stake del wallet
          for (const stake of stakes) {
            if (ownedTokens.has(stake.nftId)) {
              // NFT ancora posseduto, calcola ricompensa
              console.log(`✅ NFT #${stake.nftId} ancora posseduto da ${walletAddress}`);
              
              // Calcola ricompensa direttamente usando la funzione aggiornata che fornisce valori fissi
              const dailyReward = await calculateDailyReward(stake.nftId);
              
              // Per retrocompatibilità, calcoliamo il moltiplicatore approssimativo 
              const rarityMultiplier = Math.round((dailyReward / BASE_DAILY_REWARD) * 10) / 10;
              
              console.log(`💰 Ricompensa calcolata: ${dailyReward.toFixed(2)} IASE (${rarityMultiplier}x)`);
              
              // Crea ricompensa
              await storage.createStakingReward({
                stakeId: stake.id,
                amount: dailyReward,
                rewardDate: new Date(),
                claimed: false,
                claimTxHash: null
              });
              
              // Aggiorna lo stake
              await storage.updateNftStakeVerification(stake.id);
              
              console.log(`✅ Ricompensa di ${rewardAmount.toFixed(2)} IASE aggiunta per NFT #${stake.nftId}`);
              verifiedCount++;
              rewardsDistributed += rewardAmount;
            } else {
              // NFT non più posseduto
              console.log(`⚠️ NFT #${stake.nftId} non più posseduto da ${stake.walletAddress}`);
              
              // Termina lo stake
              await storage.endNftStake(stake.id);
              
              endedCount++;
            }
          }
          
          // Passa al prossimo wallet
          continue;
        } catch (alchemyError) {
          console.error(`❌ Errore con Alchemy API per wallet ${walletAddress}:`, alchemyError);
          console.log(`⚠️ Fallback a metodo tradizionale per wallet ${walletAddress}`);
        }
      }
      
      // Fallback al metodo tradizionale con ethers.js se Alchemy fallisce
      console.log(`🔄 Usando metodo tradizionale per wallet ${walletAddress}`);
      
      try {
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
        
        // Verifica ogni stake individualmente
        for (const stake of stakes) {
          console.log(`🔍 Verificando stake ID ${stake.id} - NFT #${stake.nftId}`);
          
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
            // Usiamo il valore base come riferimento di partenza
            const rewardAmount = BASE_DAILY_REWARD * rarityMultiplier;
            
            console.log(`💰 Ricompensa calcolata: ${rewardAmount.toFixed(2)} IASE (${rarityMultiplier}x)`);
            
            // Crea ricompensa usando la struttura corretta
            await storage.createStakingReward({
              stakeId: stake.id,
              amount: rewardAmount,
              rewardDate: new Date(),
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
      } catch (fallbackError) {
        console.error(`❌ Errore nel fallback per wallet ${walletAddress}:`, fallbackError);
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