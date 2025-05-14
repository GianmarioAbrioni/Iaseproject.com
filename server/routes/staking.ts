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
    contractAddress: process.env.REWARD_DISTRIBUTOR_CONTRACT || '',
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
    address = address.trim().replace(/\s+/g, '');
    if (address.includes('...')) {
      address = address.replace(/\.\.\./g, '');
    }
    if (!address.startsWith('0x')) {
      address = '0x' + address;
    }
    
    // Normalizza in lowercase
    address = address.toLowerCase();
    
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
    let validWalletAddress = walletAddress.trim().replace(/\s+/g, '');
    
    // Rimuovi ellissi se presenti
    if (validWalletAddress.includes('...')) {
      validWalletAddress = validWalletAddress.replace(/\.\.\./g, '');
    }
    
    // Assicurati che inizi con 0x
    if (!validWalletAddress.startsWith('0x')) {
      validWalletAddress = '0x' + validWalletAddress;
    }
    
    // Controlla che l'indirizzo abbia una lunghezza minima valida
    if (validWalletAddress.length < 10) {
      return res.status(400).json({ 
        error: 'Invalid wallet address format', 
        message: 'The provided wallet address is not in a valid Ethereum format'
      });
    }
    
    // Normalizza l'indirizzo (converte in lowercase)
    validWalletAddress = validWalletAddress.toLowerCase();
    
    // Configurazione per NFT IASE
    const NFT_CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS || "0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F";
    const infuraApiKey = process.env.INFURA_API_KEY || "84ed164327474b4499c085d2e4345a66";
    const ETHEREUM_RPC_URL = `https://mainnet.infura.io/v3/${infuraApiKey}`;
    const ETHEREUM_RPC_FALLBACK = "https://rpc.ankr.com/eth";
    
    // ABI completo per contratto ERC721Enumerable (IASE NFT)
    const ERC721_ABI = [
      // Standard ERC721
      'function balanceOf(address owner) view returns (uint256)',
      'function ownerOf(uint256 tokenId) view returns (address)',
      'function safeTransferFrom(address from, address to, uint256 tokenId)',
      'function transferFrom(address from, address to, uint256 tokenId)',
      'function approve(address to, uint256 tokenId)',
      'function getApproved(uint256 tokenId) view returns (address)',
      'function setApprovalForAll(address operator, bool approved)',
      'function isApprovedForAll(address owner, address operator) view returns (bool)',
      'function tokenURI(uint256 tokenId) view returns (string)',
      
      // ERC721Enumerable extension
      'function totalSupply() view returns (uint256)',
      'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
      'function tokenByIndex(uint256 index) view returns (uint256)',
      
      // Eventi
      'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
      'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
      'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)'
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
      const nftContract = new ethers.Contract(
        NFT_CONTRACT_ADDRESS,
        ERC721_ABI,
        provider
      );
      
      // Recupera NFT dell'utente
      try {
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
        
        // Array per memorizzare gli NFT
        const nfts = [];
        
        // Recupera tutti i tokenId posseduti dall'utente
        for (let i = 0; i < parseInt(balance.toString()); i++) {
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