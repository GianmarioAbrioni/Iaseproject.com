import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { insertNftStakeSchema, insertStakingRewardSchema } from '@shared/schema';
import { z } from 'zod';
import { getClaimableAmount, processTokenDistribution } from '../services/claim-service';
import { ethers } from 'ethers';
import { CONFIG } from '../config';
import { pool } from '../db'; // Importiamo il pool di connessione per query native

const router = Router();

/**
 * API per ottenere la configurazione del claim
 */
router.get('/claim-config', (req: Request, res: Response) => {
  // Invia l'indirizzo del contratto dal .env
  res.json({
    contractAddress: process.env.REWARD_DISTRIBUTOR_CONTRACT || '0x38C62fCFb6a6Bbce341B41bA6740B07739Bf6E1F',
    networkRpc: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org/',
    tokenAddress: '0x5A170D59ae8B851DC4DD0D14cC89E5fE541752CE' // IASE Token address
  });
});

/**
 * API per ottenere tutti gli NFT in staking per un indirizzo wallet
 */
router.get(['/by-wallet/:address', '/get-staked-nfts'], async (req: Request, res: Response) => {
  try {
    // Supporta sia il parametro nel percorso che la query
    let address = req.params.address;
    
    // Se non c'è nell'URL, controlla nella query
    if (!address && req.query.wallet) {
      address = req.query.wallet as string;
    }
    
    if (!address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    // Normalizza l'indirizzo wallet
    // Converti a stringa, rimuovi spazi e converti in lowercase
    address = address.toString().trim().toLowerCase().replace(/\s+/g, '');
    
    // Rimuovi eventuali '...' (ellipsis)
    if (address.includes('...')) {
      address = address.replace(/\.\.\./g, '');
    }
    
    // Aggiungi prefisso 0x se mancante
    if (!address.startsWith('0x')) {
      address = '0x' + address;
    }
    
    console.log(`API - 📋 Indirizzo wallet normalizzato: "${address}"`);
    
    // Verifica validità formato minimo
    if (address.length < 10) {
      console.error(`API - ❌ Indirizzo wallet troppo corto o non valido: "${address}"`);
      return res.status(400).json({ 
        error: 'Invalid wallet address format', 
        message: 'The provided wallet address is not in a valid Ethereum format'
      });
    }
    
    try {
      // Utilizza lo storage per ottenere gli NFT in staking per questo wallet
      const stakes = await storage.getStakesByWallet(address);
      res.json({ stakes: stakes || [] });
    } catch (error) {
      console.error('Error retrieving stakes from storage:', error);
      
      // Tenta il recupero tramite query SQL nativa
      try {
        const result = await pool.query(
          'SELECT * FROM nft_stakes WHERE wallet_address = $1 AND active = true',
          [address]
        );
        
        const stakes = result.rows;
        
        res.setHeader('Content-Type', 'application/json');
        return res.json({
          stakes: stakes || []
        });
      } catch (sqlError) {
        console.error("Errore anche con SQL nativo:", sqlError);
        
        // Risposta vuota ma senza errore
        res.setHeader('Content-Type', 'application/json');
        return res.json({
          stakes: []
        });
      }
    }
  } catch (error) {
    console.error('Error getting stakes by wallet:', error);
    res.status(500).json({ error: 'Errore nel recupero degli stake' });
  }
});

/**
 * API per ottenere gli NFT disponibili per staking per un indirizzo wallet
 * Questa API è utilizzata dal frontend per mostrare gli NFT disponibili
 */
router.get(['/nfts', '/get-available-nfts'], async (req: Request, res: Response) => {
  try {
    // Imposta header Content-Type
    res.setHeader('Content-Type', 'application/json');
    
    const walletAddress = req.query.wallet as string;
    
    if (!walletAddress) {
      return res.status(400).json({ 
        error: 'Wallet address is required', 
        message: 'Please provide a wallet address to fetch NFTs'
      });
    }
    
    // Pulizia e validazione dell'indirizzo wallet
    // Converti a stringa, rimuovi spazi e converti in lowercase
    let validWalletAddress = walletAddress.toString().trim().toLowerCase().replace(/\s+/g, '');
    
    // Rimuovi eventuali '...' (ellipsis)
    if (validWalletAddress.includes('...')) {
      validWalletAddress = validWalletAddress.replace(/\.\.\./g, '');
    }
    
    // Aggiungi prefisso 0x se mancante
    if (!validWalletAddress.startsWith('0x')) {
      validWalletAddress = '0x' + validWalletAddress;
    }
    
    console.log(`API NFTs - 📋 Indirizzo wallet normalizzato: "${validWalletAddress}"`);
    
    // Controlla che l'indirizzo abbia una lunghezza minima valida
    if (validWalletAddress.length < 10) {
      console.error(`API NFTs - ❌ Indirizzo wallet troppo corto o non valido: "${validWalletAddress}"`);
      return res.status(400).json({ 
        error: 'Invalid wallet address format', 
        message: 'The provided wallet address is not in a valid Ethereum format'
      });
    }
    
    // Configurazione per NFT IASE
    const NFT_CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS || "0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F";
    // Configurazione Alchemy (priorità principale)
    const alchemyApiKey = process.env.ALCHEMY_API_KEY || "uAZ1tPYna9tBMfuTa616YwMcgptV_1vB";
    const ALCHEMY_API_URL = `https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey}`;
    const USE_ALCHEMY_API = process.env.USE_ALCHEMY_API !== "false"; // Abilita di default
    // Configurazione Infura (fallback secondario)
    const infuraApiKey = process.env.INFURA_API_KEY || "84ed164327474b4499c085d2e4345a66";
    const ETHEREUM_RPC_URL = `https://mainnet.infura.io/v3/${infuraApiKey}`;
    // Fallback terziario (pubblico)
    const ETHEREUM_RPC_FALLBACK = "https://rpc.ankr.com/eth";
    
    // ABI completo per contratto ERC721Enumerable (IASE NFT)
    const ERC721EnumerableABI = [
      {"inputs":[],"stateMutability":"nonpayable","type":"constructor"},
      {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"approved","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Approval","type":"event"},
      {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},
      {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},
      {"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},
      {"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
      {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getApproved","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
      {"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
      {"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
      {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
      {"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},
      {"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bytes","name":"_data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},
      {"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},
      {"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
      {"inputs":[{"internalType":"uint256","name":"index","type":"uint256"}],"name":"tokenByIndex","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
      {"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint256","name":"index","type":"uint256"}],"name":"tokenOfOwnerByIndex","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
      {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
      {"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
      {"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},
      {"inputs":[],"name":"implementation","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
      {"stateMutability":"payable","type":"fallback"},
      {"stateMutability":"payable","type":"receive"}
    ];
    
    try {
      // Crea provider con fallback automatico
      let provider;
      try {
        provider = new ethers.JsonRpcProvider(ETHEREUM_RPC_URL);
      } catch (error) {
        provider = new ethers.JsonRpcProvider(ETHEREUM_RPC_FALLBACK);
      }
      
      // Crea istanza del contratto NFT
      const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, ERC721EnumerableABI, provider);
      
      // Recupera NFT dell'utente
      try {
        // Array per memorizzare gli NFT
        const nfts: any[] = [];
        
        // Prima tentiamo con Alchemy API se abilitata
        if (USE_ALCHEMY_API) {
          try {
            console.log("🔍 Utilizzando Alchemy API per recupero NFT ottimizzato...");
            
            // Costruisci l'URL per la chiamata Alchemy API
            // Questa API recupera tutti gli NFT di un contratto specifico posseduti dal wallet in una sola chiamata
            const alchemyNftsUrl = `${ALCHEMY_API_URL}/getNFTs?owner=${validWalletAddress}&contractAddresses[]=${NFT_CONTRACT_ADDRESS}`;
            
            // Invia la richiesta all'API
            const response = await fetch(alchemyNftsUrl);
            
            if (!response.ok) {
              console.error(`❌ Errore API Alchemy: ${response.status} ${response.statusText}`);
              throw new Error(`Errore API HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`✅ Risposta Alchemy ricevuta per NFTs del wallet ${validWalletAddress}`);
            
            // Se non ci sono NFT, restituisci array vuoto
            if (!data.ownedNfts || data.ownedNfts.length === 0) {
              return res.json({
                success: true,
                nfts: [],
                message: 'No NFTs found for this address via Alchemy API'
              });
            }
            
            // Elabora ciascun NFT
            for (const nft of data.ownedNfts) {
              // Estrai il token ID (potrebbe essere in hex)
              if (nft.id?.tokenId) {
                let tokenId = nft.id.tokenId;
                // Converti da hex a decimale se necessario
                if (tokenId.startsWith('0x')) {
                  tokenId = parseInt(tokenId, 16).toString();
                }
                
                // Prepara l'oggetto NFT
                const nftItem: any = {
                  id: tokenId,
                  name: nft.title || `IASE Unit #${tokenId}`,
                  image: "",
                  rarity: "Unknown",
                  traits: []
                };
                
                // Estrai l'immagine
                if (nft.media && nft.media.length > 0 && nft.media[0].gateway) {
                  nftItem.image = nft.media[0].gateway;
                }
                
                // Estrai attributi e rarità
                let cardFrame = "Standard";
                let aiBooster = "X1.0";
                
                if (nft.metadata && nft.metadata.attributes && Array.isArray(nft.metadata.attributes)) {
                  nftItem.attributes = nft.metadata.attributes;
                  
                  nft.metadata.attributes.forEach((attr: any) => {
                    if (attr.trait_type === "Card Frame") {
                      cardFrame = attr.value;
                    } else if (attr.trait_type === "AI-Booster") {
                      aiBooster = attr.value;
                    }
                  });
                }
                
                // Mappa la rarità in base al Card Frame
                let rarity = "Common";
                if (cardFrame === "Advanced") rarity = "Rare";
                if (cardFrame === "Elite") rarity = "Epic";
                if (cardFrame === "Prototype") rarity = "Legendary";
                
                nftItem.rarity = rarity;
                nftItem.cardFrame = cardFrame;
                nftItem.aiBooster = aiBooster;
                nftItem["AI-Booster"] = aiBooster;
                
                // Aggiungi l'NFT all'array
                nfts.push(nftItem);
              }
            }
            
            console.log(`✅ Recuperati ${nfts.length} NFT tramite Alchemy API`);
            
            // Verifica se abbiamo NFT
            if (nfts.length === 0) {
              return res.json({
                success: true,
                nfts: [],
                message: 'No valid NFTs found for this address'
              });
            }
            
            // Controlla gli NFT già in staking per filtrarli
            const stakedNFTs = await storage.getStakesByWallet(validWalletAddress);
            const stakedNFTIds = new Set(
              stakedNFTs.map((stake: any) => stake.nftId.toString())
            );
            
            // Filtra gli NFT già in staking
            const availableNFTs = nfts.filter(nft => !stakedNFTIds.has(nft.id.toString()));
            
            // Registra quanti NFT sono disponibili
            console.log(`📋 NFT disponibili per staking: ${availableNFTs.length} di ${nfts.length} totali`);
            
            // Invia gli NFT disponibili al client
            return res.json({
              success: true,
              nfts: availableNFTs,
              total: nfts.length,
              staked: stakedNFTs.length
            });
          } catch (alchemyError) {
            console.error('Errore con Alchemy API:', alchemyError);
            console.log('⚠️ Fallback a metodo tradizionale ethers.js');
          }
        }
        
        // Fallback al metodo tradizionale con ethers.js
        
        // Ottieni il balance (numero di NFT posseduti)
        const balance = await nftContract.balanceOf(validWalletAddress);
        
        // Se non ci sono NFT, restituisci array vuoto
        if (balance.toString() === '0') {
          return res.json({
            success: true,
            nfts: [],
            message: 'No NFTs found for this address'
          });
        }
        
        // Numerizzazione del balance
        const balanceNumber = parseInt(balance.toString());
        
        // Metodo tradizionale: Scansione diretta dei tokenId con ownerOf
        console.log("🔍 Utilizzando il metodo di scansione diretta (balanceOf + ownerOf)...");
        
        // Normalizza l'indirizzo del wallet per confronti case-insensitive
        const normalizedUserAddress = validWalletAddress.toLowerCase();
        
        // Definisci i limiti della scansione per la collezione IASE
        const START_TOKEN_ID = 1;
        const END_TOKEN_ID = 3000; // Limite massimo ragionevole per collezione IASE
        
        console.log(`🔄 Iniziando scansione diretta da tokenId ${START_TOKEN_ID} a ${END_TOKEN_ID}...`);
        
        // Contatore per tracciare quanti NFT abbiamo trovato
        let foundNFTs = 0;
        
        // Esegui la scansione in batch per non sovraccaricare la rete
        const BATCH_SIZE = 10;
        
        // Funzione ausiliaria per recuperare i metadati di un token
        async function getTokenMetadata(tokenId: string) {
          try {
            // Ottieni l'URI del token
            const tokenURI = await nftContract.tokenURI(tokenId);
            
            // Normalizza l'URI se è un IPFS URI
            let normalizedURI = tokenURI;
            if (normalizedURI.startsWith('ipfs://')) {
              normalizedURI = normalizedURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
            }
            
            // Fetch dei metadata
            const metadataResponse = await fetch(normalizedURI);
            if (metadataResponse.ok) {
              const metadata = await metadataResponse.json();
              
              // Normalizza l'immagine se è IPFS
              let imageUrl = metadata.image;
              if (imageUrl && imageUrl.startsWith('ipfs://')) {
                imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
              }
              
              // Estrai attributi e rarità
              let cardFrame = "Standard";
              let aiBooster = "X1.0";
              
              if (metadata.attributes && Array.isArray(metadata.attributes)) {
                metadata.attributes.forEach((attr: any) => {
                  if (attr.trait_type === "Card Frame") {
                    cardFrame = attr.value;
                  } else if (attr.trait_type === "AI-Booster") {
                    aiBooster = attr.value;
                  }
                });
              }
              
              // Mappa la rarità in base al Card Frame
              let rarity = "Common";
              if (cardFrame === "Advanced") rarity = "Rare";
              if (cardFrame === "Elite") rarity = "Epic";
              if (cardFrame === "Prototype") rarity = "Legendary";
              
              // Ritorna oggetto NFT con tutti i dati necessari
              return {
                id: tokenId.toString(),
                name: metadata.name || `IASE Unit #${tokenId}`,
                image: imageUrl || "",
                rarity,
                cardFrame,
                aiBooster,
                "AI-Booster": aiBooster,
                traits: [],
                attributes: metadata.attributes || []
              };
            } else {
              // Fallback per metadata non disponibili
              return {
                id: tokenId.toString(),
                name: `IASE Unit #${tokenId}`,
                image: "",
                rarity: "Unknown",
                traits: []
              };
            }
          } catch (error) {
            console.error(`Errore nel recupero dei metadata per il token ${tokenId}:`, error);
            return {
              id: tokenId.toString(),
              name: `IASE Unit #${tokenId}`,
              image: "",
              rarity: "Unknown",
              traits: []
            };
          }
        }
        
        // Loop attraverso tutti i possibili token IDs in batch
        for (let startId = START_TOKEN_ID; startId <= END_TOKEN_ID; startId += BATCH_SIZE) {
          // Se abbiamo già trovato tutti gli NFT, interrompiamo la scansione
          if (foundNFTs >= balanceNumber) {
            console.log(`✅ Trovati tutti i ${balanceNumber} NFT previsti da balanceOf`);
            break;
          }
          
          // Array di promesse per verifiche ownership in parallelo
          const ownershipChecks = [];
          
          // Verifica un batch di token IDs in parallelo
          for (let i = 0; i < BATCH_SIZE && (startId + i) <= END_TOKEN_ID; i++) {
            const tokenId = startId + i;
            
            ownershipChecks.push(
              (async () => {
                try {
                  const currentOwner = (await nftContract.ownerOf(tokenId)).toLowerCase();
                  
                  if (currentOwner === normalizedUserAddress) {
                    console.log(`✅ NFT #${tokenId} verificato come posseduto dall'utente`);
                    return tokenId.toString();
                  }
                  return null;
                } catch (ownerError) {
                  // Un errore qui significa generalmente che il token non esiste o non appartiene all'utente
                  return null;
                }
              })()
            );
          }
          
          // Attendi il completamento di tutte le verifiche nel batch
          const batchResults = await Promise.all(ownershipChecks);
          
          // Filtra i token IDs validi
          const validTokenIds = batchResults.filter(id => id !== null) as string[];
          
          // Per ogni token ID valido, ottieni e aggiungi i metadati
          for (const tokenId of validTokenIds) {
            try {
              const metadata = await getTokenMetadata(tokenId);
              nfts.push(metadata);
              foundNFTs++;
            } catch (metadataError) {
              console.error(`Errore nel recuperare metadati per token ${tokenId}:`, metadataError);
              nfts.push({
                id: tokenId,
                name: `IASE Unit #${tokenId}`,
                image: "",
                rarity: "Unknown",
                traits: []
              });
              foundNFTs++;
            }
          }
        }
        
        console.log(`✅ Scansione diretta completata. Trovati ${nfts.length} NFT`);
        
        // Se non abbiamo trovato NFT ma il balance indica che ce ne sono,
        // potrebbe essere necessario ampliare l'intervallo di scansione
        if (nfts.length === 0 && balanceNumber > 0) {
          console.warn("⚠️ Nessun NFT trovato nell'intervallo standard ma balanceOf indica possesso.");
          console.warn("⚠️ Considera l'ampliamento dell'intervallo di token ID se necessario.");
        }

        // Ora otteniamo anche gli NFT già in staking per questo utente
        const stakedNfts = await storage.getStakesByWallet(validWalletAddress);
        
        // Restituisci i risultati
        return res.json({
          success: true,
          nfts,
          stakedNfts: stakedNfts || [],
          balance: balanceNumber
        });
      } catch (fetchError) {
        console.error('Error fetching NFTs from blockchain:', fetchError);
        res.status(500).json({ error: 'Error fetching NFTs from blockchain', message: fetchError.message });
      }
    } catch (providerError) {
      console.error('Error setting up blockchain provider:', providerError);
      res.status(500).json({ error: 'Error connecting to blockchain provider', message: providerError.message });
    }
  } catch (error) {
    console.error('Unhandled error in get-available-nfts endpoint:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * API per ottenere le ricompense per un indirizzo wallet
 */
router.get('/rewards/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    
    // Normalizza l'indirizzo
    let normalizedAddress = address.trim().toLowerCase();
    if (!normalizedAddress.startsWith('0x')) {
      normalizedAddress = '0x' + normalizedAddress;
    }
    
    // Otteni ricompense
    const rewards = await storage.getRewardsByWallet(normalizedAddress);
    
    // Calcola totale ricompense e ricompense non rivendicate
    let totalRewards = 0;
    let unclaimedRewards = 0;
    
    rewards.forEach(reward => {
      totalRewards += parseFloat(reward.amount);
      if (!reward.claimed) {
        unclaimedRewards += parseFloat(reward.amount);
      }
    });
    
    // Aggiunge token claimabili in real-time (simulati)
    const claimableAmount = await getClaimableAmount(normalizedAddress);
    
    res.json({
      rewards,
      totalRewards,
      unclaimedRewards,
      claimableAmount
    });
  } catch (error) {
    console.error('Error getting rewards by wallet:', error);
    res.status(500).json({ error: 'Error retrieving rewards' });
  }
});

export default router;