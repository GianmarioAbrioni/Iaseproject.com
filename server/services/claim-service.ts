/**
 * IASE Token Claim Service
 * Questo servizio interagisce con lo smart contract per distribuire i token
 */
// Utilizziamo la versione 5.x di ethers.js per compatibilità
import { ethers } from 'ethers';
import { storage } from '../storage';
import { NftStake } from '@shared/schema';

// ABI per il contratto IASERewardDistributorUltraSimple
const REWARD_DISTRIBUTOR_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "claimReward",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getContractBalance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// Verifica la configurazione dell'ambiente
function checkEnvironment() {
  const requiredEnvVars = [
    'REWARD_DISTRIBUTOR_CONTRACT',
    'BSC_RPC_URL'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Variabile d'ambiente mancante: ${envVar}`);
    }
  }
}

// Inizializza il provider
function initProvider() {
  const bscRpcUrl = process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org/';
  const contractAddress = process.env.REWARD_DISTRIBUTOR_CONTRACT as string;

  // Creiamo il provider per BNB Smart Chain
  const provider = new ethers.JsonRpcProvider(bscRpcUrl);
  const contract = new ethers.Contract(contractAddress, REWARD_DISTRIBUTOR_ABI, provider);

  return { provider, contract };
}

/**
 * Calcola l'importo riscuotibile per uno staking NFT
 * @param stakeId ID dello staking
 * @returns Importo riscuotibile
 */
export async function getClaimableAmount(stakeId: number): Promise<number> {
  try {
    // Ottieni lo stake e le sue ricompense
    const stake = await storage.getNftStakeById(stakeId);
    
    if (!stake) {
      throw new Error('Stake non trovato');
    }
    
    // Ottieni tutte le ricompense non riscosse per lo stake
    const rewards = await storage.getRewardsByStakeId(stakeId);
    const unclaimedRewards = rewards.filter(reward => !reward.claimed);
    
    // Calcola l'importo totale riscuotibile
    const claimableAmount = unclaimedRewards.reduce((total, reward) => 
      total + reward.amount, 0);
    
    return claimableAmount;
  } catch (error) {
    console.error('Errore nel calcolo dell\'importo riscuotibile:', error);
    throw error;
  }
}

/**
 * Prepara i dati per la distribuzione dei token IASE - La transazione verrà eseguita lato client
 * @param stakeId ID dello staking
 * @param recipient Indirizzo del wallet che riceverà i token
 * @param amount Importo di token da distribuire
 * @returns Dati per la transazione client-side
 */
export async function processTokenDistribution(
  stakeId: number,
  recipient: string, 
  amount: number
): Promise<{contractAddress: string, amount: string, recipient: string}> {
  try {
    // Verifica la configurazione dell'ambiente
    checkEnvironment();
    
    // Ottieni lo stake
    const stake = await storage.getNftStakeById(stakeId);
    if (!stake) {
      throw new Error('Stake non trovato');
    }
    
    // Verifica che l'indirizzo del destinatario corrisponda al proprietario dello stake
    if (stake.walletAddress.toLowerCase() !== recipient.toLowerCase()) {
      throw new Error('L\'indirizzo del wallet non corrisponde al proprietario dello stake');
    }
    
    // Calcola l'importo in wei (18 decimali)
    const amountWei = ethers.parseUnits(amount.toString(), 18);
    
    // Restituisci i dati necessari per eseguire la transazione lato client
    const contractAddress = process.env.REWARD_DISTRIBUTOR_CONTRACT as string;
    
    console.log(`Preparazione dati per il claim di ${amount} IASE tokens a ${recipient}`);
    
    // Segna le ricompense come riscosse nel database quando il client conferma la transazione
    // Questo verrà fatto tramite una chiamata API separata dal client
    
    return {
      contractAddress,
      amount: amountWei.toString(),
      recipient
    };
  } catch (error) {
    console.error('Errore durante la preparazione dei dati per la distribuzione:', error);
    throw error;
  }
}