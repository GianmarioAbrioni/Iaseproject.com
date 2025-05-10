/**
 * IASE Token Claim Service
 * Manages the process of claiming IASE tokens from accumulated rewards
 */

// Indirizzo del contratto IASE Token sulla BNB Smart Chain
const IASE_TOKEN_CONTRACT = "0x5A170D59ae8B851DC4DD0D14cC89E5fE541752CE";

// Indirizzo del contratto del distributore di ricompense
// Questo verrà soprascritto dinamicamente con il valore fornito dall'ambiente
let REWARD_DISTRIBUTOR_CONTRACT = ""; // Sarà impostato dal backend

// ABI per il contratto IASE Token (versione semplificata per le funzioni necessarie)
const IASE_TOKEN_ABI = [
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {"name": "_to", "type": "address"},
      {"name": "_value", "type": "uint256"}
    ],
    "name": "transfer",
    "outputs": [{"name": "", "type": "bool"}],
    "type": "function"
  }
];

// ABI per il contratto del distributore di ricompense (corrisponde a IASERewardDistributorUltraSimple.sol)
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

/**
 * Ottiene la configurazione del claim dal backend
 * @returns {Promise<{contractAddress: string, networkRpc: string, tokenAddress: string}>}
 */
async function getClaimConfig() {
  try {
    // Se abbiamo già ottenuto l'indirizzo del contratto, non serve richiederlo di nuovo
    if (REWARD_DISTRIBUTOR_CONTRACT) {
      return {
        contractAddress: REWARD_DISTRIBUTOR_CONTRACT,
        networkRpc: 'https://bsc-dataseed.binance.org/',
        tokenAddress: IASE_TOKEN_CONTRACT
      };
    }
    
    // Ottieni la configurazione dal backend
    const response = await fetch('/api/staking/claim-config');
    
    if (!response.ok) {
      throw new Error('Impossibile ottenere la configurazione del claim');
    }
    
    const config = await response.json();
    
    // Salva l'indirizzo del contratto per usi futuri
    REWARD_DISTRIBUTOR_CONTRACT = config.contractAddress;
    
    return config;
  } catch (error) {
    console.error('Errore durante il recupero della configurazione:', error);
    throw error;
  }
}

/**
 * Inizializza l'interazione con il contratto
 * @returns {Object} Web3 e istanze dei contratti
 */
async function initClaimService() {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask non è installato. Per favore, installa MetaMask per continuare.');
  }

  try {
    // Ottieni la configurazione del claim
    const config = await getClaimConfig();
    
    if (!config.contractAddress) {
      throw new Error('Indirizzo del contratto di distribuzione non configurato');
    }
    
    // Richiedi l'accesso al wallet dell'utente
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    const userAddress = accounts[0];
    
    // Verifica la rete corrente
    const chainId = await ethereum.request({ method: 'eth_chainId' });
    const bscChainId = '0x38'; // Mainnet BNB Smart Chain (56 in esadecimale)
    
    if (chainId !== bscChainId) {
      // Chiedi all'utente di passare alla BNB Smart Chain
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: bscChainId }]
        });
      } catch (switchError) {
        // Se la rete non è aggiunta, aggiungiamola
        if (switchError.code === 4902) {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: bscChainId,
              chainName: 'BNB Smart Chain',
              nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
              rpcUrls: [config.networkRpc || 'https://bsc-dataseed.binance.org/'],
              blockExplorerUrls: ['https://bscscan.com/']
            }]
          });
        } else {
          throw switchError;
        }
      }
    }

    // Crea le istanze Web3 e dei contratti
    const web3 = new Web3(window.ethereum);
    const iaseContract = new web3.eth.Contract(IASE_TOKEN_ABI, config.tokenAddress || IASE_TOKEN_CONTRACT);
    const rewardDistributorContract = new web3.eth.Contract(REWARD_DISTRIBUTOR_ABI, config.contractAddress);
    
    return {
      web3,
      userAddress,
      iaseContract,
      rewardDistributorContract
    };
  } catch (error) {
    console.error('Errore durante l\'inizializzazione del servizio di claim:', error);
    throw error;
  }
}

/**
 * Invia una richiesta di riscossione delle ricompense
 * @param {number} stakeId ID della stake per cui si richiede la ricompensa
 * @returns {Promise<Object>} Risultato della transazione
 */
async function claimReward(stakeId) {
  try {
    // Ottieni lo stato attuale delle ricompense da backend
    const response = await fetch('/api/staking/get-claimable-amount', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ stakeId })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Errore durante la verifica delle ricompense');
    }
    
    const data = await response.json();
    const claimableAmount = data.claimableAmount;
    
    if (claimableAmount <= 0) {
      throw new Error('Non ci sono ricompense da riscuotere');
    }
    
    // Inizializza il servizio di claim
    const { web3, userAddress, rewardDistributorContract } = await initClaimService();
    
    // Esegui direttamente la transazione con il contratto usando il wallet dell'utente
    console.log(`Riscossione di ${claimableAmount} IASE tokens...`);
    const tx = await rewardDistributorContract.methods.claimReward(userAddress, web3.utils.toWei(claimableAmount.toString(), 'ether')).send({ from: userAddress });
    
    console.log('Transazione completata:', tx.transactionHash);
    
    // Notifica al backend che la ricompensa è stata riscossa
    const markClaimedResponse = await fetch('/api/staking/mark-claimed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        stakeId,
        transactionHash: tx.transactionHash
      })
    });
    
    if (!markClaimedResponse.ok) {
      console.warn('Attenzione: impossibile aggiornare lo stato delle ricompense sul server');
    }
    
    return {
      success: true,
      transaction: tx.transactionHash,
      amount: claimableAmount
    };
  } catch (error) {
    console.error('Errore durante il claim delle ricompense:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Esponi le funzioni globalmente
window.claimIASEReward = claimReward;