import { ethers } from 'ethers';

// Contract ABI (Interface) per il contratto degli NFT (ERC-721)
const NFT_ABI = [
  "function ownerOf(uint256 tokenId) view returns (address owner)",
  "function balanceOf(address owner) view returns (uint256 balance)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256 tokenId)",
  "function tokenURI(uint256 tokenId) view returns (string memory)"
];

// Contratto degli NFT IASE Units su Ethereum
const NFT_CONTRACT_ADDRESS = "0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F";

// Ethereum provider URL (mainnet)
const ETH_PROVIDER = process.env.ETH_PROVIDER_URL || "https://eth.public-rpc.com";

/**
 * Verifica che un wallet possegga ancora un NFT specifico
 * @param walletAddress Indirizzo del wallet
 * @param nftId ID del token NFT
 * @returns true se il wallet possiede ancora l'NFT, false altrimenti
 */
export async function verifyNftOwnership(walletAddress: string, nftId: string): Promise<boolean> {
  try {
    // Crea un provider per interagire con la blockchain
    const provider = new ethers.JsonRpcProvider(ETH_PROVIDER);
    
    // Crea un'istanza del contratto NFT
    const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, provider);
    
    // Verifica il proprietario dell'NFT
    const tokenIdBigInt = BigInt(nftId);
    const currentOwner = await nftContract.ownerOf(tokenIdBigInt);
    
    // Confronta l'indirizzo del proprietario con quello fornito (case-insensitive)
    return currentOwner.toLowerCase() === walletAddress.toLowerCase();
  } catch (error) {
    console.error("Errore durante la verifica dell'NFT:", error);
    // In caso di errore, assumiamo che l'NFT non appartenga più al wallet
    return false;
  }
}

/**
 * Ottiene tutti gli NFT IASE Units posseduti da un wallet
 * @param walletAddress Indirizzo del wallet
 * @returns Array di ID degli NFT posseduti dal wallet
 */
export async function getNftsOwnedByWallet(walletAddress: string): Promise<string[]> {
  try {
    // Crea un provider per interagire con la blockchain
    const provider = new ethers.JsonRpcProvider(ETH_PROVIDER);
    
    // Crea un'istanza del contratto NFT
    const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, provider);
    
    // Ottieni il numero di NFT posseduti dal wallet
    const balance = await nftContract.balanceOf(walletAddress);
    const balanceNumber = Number(balance);
    
    // Ottieni gli ID di tutti gli NFT posseduti dal wallet
    const nftIds: string[] = [];
    for (let i = 0; i < balanceNumber; i++) {
      const tokenId = await nftContract.tokenOfOwnerByIndex(walletAddress, i);
      nftIds.push(tokenId.toString());
    }
    
    return nftIds;
  } catch (error) {
    console.error("Errore durante il recupero degli NFT del wallet:", error);
    return [];
  }
}

/**
 * Verifica che un NFT appartenga alla collezione IASE Units
 * @param nftContractAddress Indirizzo del contratto NFT
 * @returns true se il contratto corrisponde alla collezione IASE Units
 */
export function isIaseUnitsCollection(nftContractAddress: string): boolean {
  // Indirizzo ufficiale del contratto IASE Units (case-insensitive)
  const IASE_UNITS_CONTRACT = "0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F".toLowerCase();
  return nftContractAddress.toLowerCase() === IASE_UNITS_CONTRACT;
}

/**
 * Calcola la ricompensa giornaliera di staking per un NFT
 * @param nftId ID del token NFT
 * @param rarityTier Livello di rarità dell'NFT (opzionale)
 * @returns Quantità di token IASE per la ricompensa giornaliera
 */
export function calculateDailyReward(nftId: string, rarityTier: string = 'standard'): number {
  // Ricompensa base: 1000 IASE Token al mese, divisi per 30 giorni = 33.33 IASE al giorno
  const baseMonthlyReward = 1000;
  const baseDailyReward = baseMonthlyReward / 30;
  
  // Moltiplicatori di ricompensa in base alla rarità
  const rarityMultipliers: Record<string, number> = {
    'standard': 1.0,    // Base: 33.33 IASE/giorno
    'advanced': 1.5,    // Advanced: ~50 IASE/giorno
    'elite': 2.0,       // Elite: ~66.66 IASE/giorno
    'prototype': 2.5,   // Prototype: ~83.33 IASE/giorno
  };
  
  // Ottieni il moltiplicatore corretto (default a 1.0 se la rarità non è riconosciuta)
  const multiplier = rarityMultipliers[rarityTier.toLowerCase()] || 1.0;
  
  // Calcola e restituisci la ricompensa giornaliera
  return baseDailyReward * multiplier;
}

/**
 * Calcola la ricompensa di staking in base al tempo trascorso
 * @param lastVerificationTime Timestamp dell'ultima verifica
 * @param currentTime Timestamp corrente
 * @param dailyReward Ricompensa giornaliera
 * @returns Ricompensa calcolata
 */
export function calculateReward(
  lastVerificationTime: Date,
  currentTime: Date = new Date(),
  dailyReward: number
): number {
  // Calcola i giorni trascorsi dall'ultima verifica
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysPassed = (currentTime.getTime() - lastVerificationTime.getTime()) / msPerDay;
  
  // Calcola la ricompensa proporzionale
  return dailyReward * daysPassed;
}