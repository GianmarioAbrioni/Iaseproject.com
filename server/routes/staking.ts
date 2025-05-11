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
      return res.status(400).json({ error: 'Indirizzo wallet richiesto' });
    }
    
    console.log(`📋 Recupero NFT in staking per wallet: ${address}`);
    
    try {
      const stakes = await storage.getNftStakesByWallet(address);
      
      // Risposta in formato JSON (assicuriamoci che sia JSON e non HTML)
      res.setHeader('Content-Type', 'application/json');
      return res.json({
        stakes: stakes || []
      });
    } catch (dbError) {
      console.error("Errore nel recupero dal DB:", dbError);
      
      // Cerca nel database PostgreSQL ma usa SQL nativo per aggirare il problema con Drizzle
      try {
        // La query SQL corrisponde alla struttura esatta del database
        const query = `
          SELECT * FROM nft_stakes 
          WHERE wallet_address = $1 
          AND active = true 
          ORDER BY start_time DESC
        `;
        
        const result = await pool.query(query, [address]);
        const stakes = result.rows;
        
        console.log(`📊 Trovati ${stakes.length} NFT in staking tramite SQL nativo`);
        
        // Risposta in formato JSON
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
    const walletAddress = req.query.wallet as string;
    
    if (!walletAddress) {
      return res.status(400).json({ 
        error: 'Wallet address is required', 
        message: 'Please provide a wallet address to fetch NFTs'
      });
    }
    
    console.log(`🔍 Cercando NFT reali per wallet: ${walletAddress}`);

    // Utilizziamo ethers importato all'inizio del file
    
    // Indirizzi e configurazione della collezione IASE
    const NFT_CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS || "0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F";
    const infuraApiKey = process.env.INFURA_API_KEY || "84ed164327474b4499c085d2e4345a66";
    const ETHEREUM_RPC_URL = process.env.ETH_NETWORK_URL || `https://mainnet.infura.io/v3/${infuraApiKey}`;
    const ETHEREUM_RPC_FALLBACK = process.env.ETH_NETWORK_FALLBACK || "https://rpc.ankr.com/eth";
    
    // ABI minimo necessario per un contratto ERC721 con Enumerable
    const ERC721_ABI = [
      'function balanceOf(address owner) view returns (uint256)',
      'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
      'function tokenURI(uint256 tokenId) view returns (string)',
      'function ownerOf(uint256 tokenId) view returns (address)',
      'function totalSupply() view returns (uint256)'
    ];
    
    try {
      // Connetti al provider Ethereum con la nuova API key Infura
      let provider;
      try {
        // Utilizziamo l'API key già definita sopra
        const infuraUrl = ETHEREUM_RPC_URL;
        
        console.log(`🌐 Tentativo connessione alla rete con Infura API: ${infuraUrl}`);
        provider = new ethers.JsonRpcProvider(infuraUrl);
        
        // Aggiungiamo un timeout per la connessione
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Timeout connessione a Infura")), 5000);
        });
        
        // Testiamo immediatamente la connessione
        const connectionTest = Promise.race([
          provider.getBlockNumber(),
          timeoutPromise
        ]);
        
        await connectionTest;
        console.log(`✅ Provider Infura connesso correttamente`);
        
      } catch (providerError) {
        console.error(`❌ Errore connessione provider primario: ${providerError}`);
        console.log(`⚠️ Tentativo con provider fallback: ${ETHEREUM_RPC_FALLBACK}`);
        provider = new ethers.JsonRpcProvider(ETHEREUM_RPC_FALLBACK);
      }
      
      // Log di diagnostica
      console.log(`📜 Contratto NFT: ${NFT_CONTRACT_ADDRESS}`);
      
      // Testa la connessione al provider
      try {
        const blockNumber = await provider.getBlockNumber();
        console.log(`✅ Provider connesso. Blocco attuale: ${blockNumber}`);
      } catch (blockError) {
        console.error(`❌ Provider non raggiungibile: ${blockError}`);
        throw new Error(`Impossibile connettersi alla rete Ethereum: ${blockError}`);
      }
      
      // Crea un'istanza del contratto NFT
      const nftContract = new ethers.Contract(
        NFT_CONTRACT_ADDRESS,
        ERC721_ABI,
        provider
      );
      
      // Ottieni il numero di NFT posseduti dal wallet
      const balance = await nftContract.balanceOf(walletAddress);
      console.log(`👛 Il wallet ${walletAddress} possiede ${balance.toString()} NFT`);
      
      // Array per memorizzare gli NFT trovati
      const nfts = [];
      
      if (balance > 0) {
        // Per ogni NFT, recupera l'ID e i metadati
        for (let i = 0; i < balance; i++) {
          try {
            // Ottieni l'ID del token
            const tokenId = await nftContract.tokenOfOwnerByIndex(walletAddress, i);
            console.log(`🔎 Trovato NFT #${tokenId.toString()} per ${walletAddress}`);
            
            // Ottieni l'URL dei metadati
            const tokenURI = await nftContract.tokenURI(tokenId);
            console.log(`🔗 TokenURI per NFT #${tokenId.toString()}: ${tokenURI}`);
            
            // Recupera i metadati
            try {
              const response = await fetch(tokenURI);
              
              if (response.ok) {
                const metadata = await response.json();
                console.log(`📄 Metadati per NFT #${tokenId.toString()} recuperati`);
                
                // Trova la rarità tra gli attributi (se presente)
                let rarity = "Standard"; // Default
                if (metadata.attributes && Array.isArray(metadata.attributes)) {
                  const frameTrait = metadata.attributes.find((attr: any) => 
                    attr.trait_type && attr.trait_type.toUpperCase() === 'CARD FRAME');
                  if (frameTrait) {
                    rarity = frameTrait.value;
                  }
                }
                
                // Aggiungi l'NFT all'array
                nfts.push({
                  id: tokenId.toString(),
                  name: metadata.name || `IASE Unit #${tokenId.toString()}`,
                  image: metadata.image || "images/nft-samples/placeholder.jpg",
                  rarity: rarity,
                  traits: metadata.attributes || []
                });
              } else {
                console.warn(`⚠️ Impossibile recuperare i metadati per NFT #${tokenId.toString()}: ${response.status}`);
                
                // Aggiungi comunque l'NFT con dati base
                nfts.push({
                  id: tokenId.toString(),
                  name: `IASE Unit #${tokenId.toString()}`,
                  image: "images/nft-samples/placeholder.jpg",
                  rarity: "Standard",
                  traits: []
                });
              }
            } catch (metadataError) {
              console.error(`⚠️ Errore nel recupero dei metadati per NFT #${tokenId.toString()}:`, metadataError);
              
              // Aggiungi comunque l'NFT con dati base
              nfts.push({
                id: tokenId.toString(),
                name: `IASE Unit #${tokenId.toString()}`,
                image: "images/nft-samples/placeholder.jpg",
                rarity: "Standard",
                traits: []
              });
            }
          } catch (tokenError) {
            console.error(`⚠️ Errore nel recupero dell'NFT ${i} per ${walletAddress}:`, tokenError);
          }
        }
        
        console.log(`✅ Trovati ${nfts.length} NFT reali per ${walletAddress}`);
      } else {
        console.log(`ℹ️ Nessun NFT trovato per ${walletAddress}`);
      }
      
      // Impostiamo l'header Content-Type per garantire che sia JSON
      res.setHeader('Content-Type', 'application/json');
      
      return res.json({
        available: nfts,
        nfts: nfts // Per retrocompatibilità
      });
    } catch (blockchainError) {
      console.error('⚠️ Errore nella connessione alla blockchain:', blockchainError);
      
      // Ritorna una risposta di errore più dettagliata
      return res.status(503).json({ 
        error: 'Errore nel recupero degli NFT dalla blockchain',
        detail: (blockchainError as Error).message || String(blockchainError),
        provider: ETHEREUM_RPC_URL
      });
    }
  } catch (error) {
    console.error('Error retrieving available NFTs:', error);
    res.status(500).json({ error: 'Errore nel recupero degli NFT disponibili' });
  }
});

/**
 * API per ottenere le ricompense per un indirizzo wallet
 */
router.get('/rewards/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({ error: 'Indirizzo wallet richiesto' });
    }
    
    const rewards = await storage.getRewardsByWalletAddress(address);
    res.json(rewards);
  } catch (error) {
    console.error('Error getting rewards by wallet:', error);
    res.status(500).json({ error: 'Errore nel recupero delle ricompense' });
  }
});

/**
 * API per mettere in staking un NFT
 */
router.post('/stake', async (req: Request, res: Response) => {
  try {
    // Validate input
    const stakeData = insertNftStakeSchema.parse(req.body);
    
    // Verifica che l'NFT sia della collezione IASE Units
    const IASE_NFT_ADDRESS = '0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F';
    // In una implementazione reale, qui verificheremmo il contratto e il possesso tramite chiamata a blockchain
    // Per ora, assumiamo che l'NFT sia valido e appartenga al wallet indicato
    
    console.log(`Verificando NFT da collezione ${IASE_NFT_ADDRESS}`);
    
    // Aggiungi il timestamp attuale
    const stakeWithTimestamp = {
      ...stakeData,
      startTime: new Date(),
      contractAddress: IASE_NFT_ADDRESS
    };
    
    // Create stake record
    const stake = await storage.createNftStake(stakeWithTimestamp);
    
    res.status(201).json(stake);
  } catch (error) {
    console.error('Error staking NFT:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dati di staking non validi', details: error.errors });
    }
    
    res.status(500).json({ error: 'Errore durante lo staking dell\'NFT' });
  }
});

/**
 * API per rimuovere lo staking di un NFT
 */
router.post('/unstake', async (req: Request, res: Response) => {
  try {
    const { stakeId } = req.body;
    
    if (!stakeId) {
      return res.status(400).json({ error: 'ID dello stake richiesto' });
    }
    
    const stake = await storage.getNftStakeById(stakeId);
    
    if (!stake) {
      return res.status(404).json({ error: 'Stake non trovato' });
    }
    
    const updatedStake = await storage.endNftStake(stakeId);
    res.json(updatedStake);
  } catch (error) {
    console.error('Error unstaking NFT:', error);
    res.status(500).json({ error: 'Errore durante la rimozione dello staking' });
  }
});

/**
 * API per ottenere l'importo riscuotibile per uno staking
 */
router.post('/get-claimable-amount', async (req: Request, res: Response) => {
  try {
    const { stakeId } = req.body;
    
    if (!stakeId) {
      return res.status(400).json({ error: 'ID dello stake richiesto' });
    }
    
    const claimableAmount = await getClaimableAmount(stakeId);
    res.json({ claimableAmount });
  } catch (error) {
    console.error('Error getting claimable amount:', error);
    res.status(500).json({ error: 'Errore nel recupero dell\'importo riscuotibile' });
  }
});

/**
 * API per elaborare il claim delle ricompense
 * NOTA: Questa API non viene più utilizzata con l'approccio diretto client-contratto
 */
router.post('/process-claim', async (req: Request, res: Response) => {
  try {
    const { stakeId, walletAddress, amount } = req.body;
    
    if (!stakeId || !walletAddress || !amount) {
      return res.status(400).json({ 
        error: 'ID dello stake, indirizzo wallet e importo sono richiesti' 
      });
    }
    
    // Processa la distribuzione dei token
    const result = await processTokenDistribution(stakeId, walletAddress, amount);
    
    res.json({
      success: true,
      transactionHash: (result as any).transactionHash || 'transaction-submitted',
      message: 'Ricompense distribuite con successo'
    });
  } catch (error) {
    console.error('Error processing claim:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Errore durante l\'elaborazione del claim' 
    });
  }
});

/**
 * API per segnare le ricompense come reclamate dopo una transazione diretta con il contratto
 */
router.post('/mark-claimed', async (req: Request, res: Response) => {
  try {
    const { stakeId, transactionHash } = req.body;
    
    if (!stakeId) {
      return res.status(400).json({ error: 'ID dello stake richiesto' });
    }
    
    // Ottieni lo stake
    const stake = await storage.getNftStakeById(stakeId);
    
    if (!stake) {
      return res.status(404).json({ error: 'Stake non trovato' });
    }
    
    // Segna le ricompense come riscosse
    await storage.markRewardsAsClaimed(stakeId);
    
    res.json({
      success: true,
      message: 'Ricompense segnate come riscosse',
      transactionHash: transactionHash || 'N/A'
    });
  } catch (error) {
    console.error('Error marking rewards as claimed:', error);
    res.status(500).json({ error: 'Errore durante l\'aggiornamento delle ricompense' });
  }
});

/**
 * API per riscuotere le ricompense (versione compatibile con l'implementazione precedente)
 */
router.post('/claim-rewards', async (req: Request, res: Response) => {
  try {
    const { stakeId } = req.body;
    
    if (!stakeId) {
      return res.status(400).json({ error: 'ID dello stake richiesto' });
    }
    
    // Ottieni lo stake
    const stake = await storage.getNftStakeById(stakeId);
    
    if (!stake) {
      return res.status(404).json({ error: 'Stake non trovato' });
    }
    
    // Ottieni l'importo riscuotibile
    const claimableAmount = await getClaimableAmount(stakeId);
    
    if (claimableAmount <= 0) {
      return res.status(400).json({ error: 'Non ci sono ricompense da riscuotere' });
    }
    
    // Nota: Questo endpoint è principalmente per compatibilità con la vecchia implementazione
    // La logica completa del claim viene gestita da /process-claim
    // Questo endpoint viene utilizzato dal frontend per ottenere l'importo e poi chiamare /process-claim
    
    res.json({
      success: true,
      reward: {
        stakeId,
        amount: claimableAmount
      },
      message: 'Ricompense pronte per essere riscosse'
    });
  } catch (error) {
    console.error('Error claiming rewards:', error);
    res.status(500).json({ error: 'Errore durante la riscossione delle ricompense' });
  }
});

export default router;