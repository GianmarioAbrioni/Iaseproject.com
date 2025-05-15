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
  // Definisco useTransferEvents a livello di funzione per evitare redefinition errors
  let useTransferEvents = false;
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
    const infuraApiKey = process.env.INFURA_API_KEY || "84ed164327474b4499c085d2e4345a66";
    const ETHEREUM_RPC_URL = `https://mainnet.infura.io/v3/${infuraApiKey}`;
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
        // Ottieni il balance (numero di NFT posseduti)
        const balance = await nftContract.balanceOf(validWalletAddress);
        
        // Utilizziamo il flag useTransferEvents dichiarato all'inizio della funzione
        
        // Se non ci sono NFT, restituisci array vuoto
        if (balance.toString() === '0') {
          return res.json({
            success: true,
            nfts: [],
            message: 'No NFTs found for this address'
          });
        }
        
        // Array per memorizzare gli NFT
        const nfts = [];
        
        // Numerizzazione del balance
        const balanceNumber = parseInt(balance.toString());
        
        // Continua con il flag useTransferEvents dichiarato in precedenza
        
        // METODO 1: Prova prima con tokenOfOwnerByIndex (ERC721Enumerable)
        try {
          // Tenta di leggere il primo NFT per verificare se il contratto è Enumerable
          await nftContract.tokenOfOwnerByIndex(validWalletAddress, 0);
          
          console.log("✅ NFT contract supports ERC721Enumerable interface");
          
          // Se siamo qui, possiamo usare tokenOfOwnerByIndex per tutti i token
          for (let i = 0; i < balanceNumber; i++) {
            try {
              // Ottieni il tokenId all'indice i
              const tokenId = await nftContract.tokenOfOwnerByIndex(validWalletAddress, i);
            
            try {
              // Ottieni l'URI del token
              const tokenURI = await nftContract.tokenURI(tokenId);
              
              // Normalizza l'URI e recupera i metadata
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
                
                // Crea oggetto NFT con tutti i dati necessari
                nfts.push({
                  id: tokenId.toString(),
                  name: metadata.name || `IASE Unit #${tokenId}`,
                  image: imageUrl || "",
                  rarity,
                  cardFrame,
                  aiBooster,
                  "AI-Booster": aiBooster,
                  traits: [],
                  attributes: metadata.attributes || []
                });
              } else {
                console.error(`Errore nel recupero dei metadata per il token ${tokenId}: ${metadataResponse.status}`);
                
                // Aggiungi comunque l'NFT con dati di base
                nfts.push({
                  id: tokenId.toString(),
                  name: `IASE Unit #${tokenId}`,
                  image: "",
                  rarity: "Unknown",
                  traits: []
                });
              }
            } catch (metadataError) {
              console.error(`Errore nel recupero dei metadata per il token ${tokenId}: ${metadataError}`);
              
              // Aggiungi comunque l'NFT con dati di base
              nfts.push({
                id: tokenId.toString(),
                name: `IASE Unit #${tokenId}`,
                image: "",
                rarity: "Unknown",
                traits: []
              });
            }
          } catch (tokenError) {
            console.error(`Errore nel recupero del token all'indice ${i}: ${tokenError}`);
          }
        }
        
      } catch (enumError) { // Chiude il try/catch del metodo Enumerable
          // Se tokenOfOwnerByIndex fallisce, il contratto non è Enumerable
          console.log("⚠️ Contract does not support ERC721Enumerable interface");
          console.log("🔄 Switching to Transfer events method...");
          useTransferEvents = true; // Flag già dichiarato sopra
        }
        
        // METODO 2: Se il metodo Enumerable fallisce, usa gli eventi Transfer
        if (useTransferEvents || nfts.length === 0) {
          console.log("🔍 Reading NFTs via Transfer events...");
          
          // Normalizza l'indirizzo per confronti case-insensitive
          const normalizedUserAddress = validWalletAddress.toLowerCase();
          
          // Configura filtro per Transfer events
          const filter = nftContract.filters.Transfer(null, validWalletAddress, null);
          
          try {
            // Query tutti gli eventi Transfer all'indirizzo dell'utente
            const transferEvents = await nftContract.queryFilter(filter);
            console.log(`📊 Found ${transferEvents.length} Transfer events to user address`);
            
            // Mappa per tenere traccia dei token ricevuti
            const receivedTokens: {[key: string]: boolean} = {};
            
            // Elabora gli eventi Transfer
            for (const event of transferEvents) {
              // Compatibilità con diversi formati di eventi
              const eventArgs = (event as any).args;
              if (!eventArgs) continue; // Salta eventi senza args
              
              const to = eventArgs.to.toLowerCase();
              const tokenId = eventArgs.tokenId.toString();
              
              if (to === normalizedUserAddress) {
                receivedTokens[tokenId] = true;
              }
            }
            
            // Verifica quali token sono ancora posseduti dall'utente
            for (const tokenId of Object.keys(receivedTokens)) {
              try {
                // Verifica se l'utente è ancora il proprietario di questo token
                const currentOwner = (await nftContract.ownerOf(tokenId)).toLowerCase();
                
                if (currentOwner === normalizedUserAddress) {
                  console.log(`✅ NFT #${tokenId} verified as owned by user`);
                  
                  try {
                    // Ottieni l'URI del token
                    const tokenURI = await nftContract.tokenURI(tokenId);
                    
                    // Normalizza l'URI e recupera i metadata
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
                      
                      // Crea oggetto NFT con tutti i dati necessari
                      nfts.push({
                        id: tokenId.toString(),
                        name: metadata.name || `IASE Unit #${tokenId}`,
                        image: imageUrl || "",
                        rarity,
                        cardFrame,
                        aiBooster,
                        "AI-Booster": aiBooster,
                        traits: [],
                        attributes: metadata.attributes || []
                      });
                    } else {
                      // Fallback per metadata non disponibili
                      nfts.push({
                        id: tokenId.toString(),
                        name: `IASE Unit #${tokenId}`,
                        image: "",
                        rarity: "Unknown",
                        traits: []
                      });
                    }
                  } catch (metadataError) {
                    console.error(`Errore nel recupero dei metadata per il token ${tokenId}: ${metadataError}`);
                    
                    nfts.push({
                      id: tokenId.toString(),
                      name: `IASE Unit #${tokenId}`,
                      image: "",
                      rarity: "Unknown",
                      traits: []
                    });
                  }
                  
                  // Ottimizzazione: se abbiamo trovato tutti i token attesi, fermiamo la ricerca
                  if (nfts.length >= balanceNumber) {
                    console.log(`✅ Found all ${balanceNumber} tokens expected from balanceOf`);
                    break;
                  }
                }
              } catch (ownerError) {
                console.error(`❌ Error checking ownership of NFT #${tokenId}:`, ownerError);
              }
            }
            
            console.log(`✅ Successfully found ${nfts.length} NFTs via Transfer events`);
          } catch (transferError) {
            console.error("❌ Error reading NFTs via Transfer events:", transferError);
          }
        }
        
        // Restituisci gli NFT come risposta
        return res.json({
          success: true,
          nfts
        });
        
      } catch (balanceError) {
        console.error(`Errore nel recupero del balance: ${balanceError}`);
        return res.status(500).json({
          error: 'Blockchain error',
          message: 'Error fetching NFT balance from blockchain'
        });
      }
    } catch (blockchainError) {
      console.error(`Errore nella connessione alla blockchain: ${blockchainError}`);
      return res.status(500).json({
        error: 'Blockchain connection error',
        message: 'Error connecting to Ethereum blockchain'
      });
    }
  } catch (error) {
    console.error(`Errore generico nel recupero degli NFT: ${error}`);
    return res.status(500).json({
      error: 'Server error',
      message: 'Error fetching NFTs from blockchain'
    });
  }
});

/**
 * API per ottenere le ricompense per un indirizzo wallet
 */
router.get('/rewards/:address', async (req: Request, res: Response) => {
  // ... resto del codice per questa route ...
});

export default router;