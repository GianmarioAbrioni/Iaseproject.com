/**
 * IASE Dashboard Script
 * Gestisce la connessione wallet e le funzionalità della dashboard utente
 */

document.addEventListener('DOMContentLoaded', function() {
  // Elementi DOM
  const connectWalletBtn = document.getElementById('connect-wallet-btn');
  const connectMainBtn = document.getElementById('connect-main-btn');
  const disconnectWalletBtn = document.getElementById('disconnect-wallet-btn');
  const addTokenBtn = document.getElementById('add-token-btn');
  const connectionIndicator = document.getElementById('connection-indicator');
  const connectionText = document.getElementById('connection-text');
  const connectPrompt = document.getElementById('connect-prompt');
  const dashboardContent = document.getElementById('dashboard-content');
  const walletAddress = document.getElementById('wallet-address');
  const tokenBalance = document.getElementById('token-balance');
  const tokenValue = document.getElementById('token-value');
  const nftContainer = document.getElementById('nft-container');
  const nftCount = document.getElementById('nft-count');
  const lastTransaction = document.getElementById('last-transaction');
  const lastLogin = document.getElementById('last-login');
  const lastTx = document.getElementById('last-tx');
  const networkName = document.getElementById('network-name');
  const copyAddress = document.getElementById('copy-address');
  
  // Contratti
  const IASE_TOKEN_ADDRESS = '0x5A170D59ae8B851DC4DD0D14cC89E5fE541752CE'; // BNB Smart Chain
  const IASE_NFT_ADDRESS = '0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F'; // Ethereum
  
  // Token metadata
  const IASE_TOKEN_METADATA = {
    name: 'IASE Token',
    symbol: 'IASE',
    decimals: 18,
    image: 'images/logo.png'
  };
  
  // Definizione NFT simulati (poiché non è possibile effettuare query dirette alla blockchain senza backend)
  const mockNFTs = [
    {
      id: 1278,
      name: 'IASE Unit #1278',
      image: 'images/nft/iase-unit-1.png',
      tier: 'advanced',
      rarity: 'Rare',
      description: 'Advanced AI Unit with enhanced capabilities for complex problem-solving and scientific research.'
    },
    {
      id: 843,
      name: 'IASE Unit #843',
      image: 'images/nft/iase-unit-2.png',
      tier: 'standard',
      rarity: 'Common',
      description: 'Standard AI Unit optimized for everyday tasks and basic computational processes.'
    }
  ];
  
  // Oggetto globale per memorizzare l'indirizzo dell'utente
  window.userAddress = null;
  
  // Funzione per inizializzare web3
  async function initWeb3() {
    if (window.ethereum) {
      try {
        // Richiesta dell'account
        console.log('Ethereum provider detected!');
        window.web3 = new Web3(window.ethereum);
        return true;
      } catch (error) {
        console.error('User denied account access', error);
        return false;
      }
    } else if (window.web3) {
      // Legacy provider
      window.web3 = new Web3(web3.currentProvider);
      console.log('Legacy web3 provider detected!');
      return true;
    } else {
      console.log('Non-Ethereum browser detected. Consider trying MetaMask!');
      // Simula Web3 per test in browser senza MetaMask
      window.web3 = {
        eth: {
          accounts: ['0x0000000000000000000000000000000000000000'],
          getAccounts: () => Promise.resolve(['0x0000000000000000000000000000000000000000']),
          net: {
            getId: () => Promise.resolve(1)
          }
        }
      };
      return false;
    }
  }
  
  // Aggiorna l'interfaccia quando l'utente è connesso
  function updateConnectedUI() {
    connectPrompt.classList.add('d-none');
    dashboardContent.classList.remove('d-none');
    connectionIndicator.classList.remove('disconnected');
    connectionIndicator.classList.add('connected');
    connectionText.textContent = 'Connesso';
    connectWalletBtn.classList.add('d-none');
    disconnectWalletBtn.classList.remove('d-none');
    
    // Aggiorna data ultimo accesso
    const now = new Date();
    lastLogin.textContent = now.toLocaleString('it-IT');
    
    // Aggiorna l'indirizzo mostrato
    if (window.userAddress) {
      const shortAddress = window.userAddress.slice(0, 6) + '...' + window.userAddress.slice(-4);
      walletAddress.textContent = window.userAddress;
    }
    
    // Simula saldo token e ultimi dati transazione (poiché non possiamo realmente interagire con la blockchain)
    simulateTokenBalance();
    
    // Simula l'ultima transazione
    const lastTxDate = new Date();
    lastTxDate.setDate(lastTxDate.getDate() - 3);
    lastTx.textContent = lastTxDate.toLocaleString('it-IT');
    lastTransaction.textContent = '3';
    
    // Ottieni informazioni sulla rete
    getNetworkInfo();
    
    // Popola gli NFT
    populateNFTs();
  }
  
  // Simula saldo token
  function simulateTokenBalance() {
    // Usa ultimo byte dell'indirizzo per generare un numero casuale ma deterministico
    if (window.userAddress) {
      const lastByte = parseInt(window.userAddress.slice(-2), 16);
      const balance = 1000 + (lastByte * 50);
      
      tokenBalance.textContent = `${balance.toLocaleString('it-IT')} IASE`;
      tokenValue.textContent = `≈ ${(balance * 0.12).toLocaleString('it-IT')} EUR`;
    }
  }
  
  // Popola NFT
  function populateNFTs() {
    // Resetta container
    nftContainer.innerHTML = '';
    
    // Determina quanti NFT mostrare in base all'indirizzo dell'utente
    let nftsToShow = [];
    
    if (window.userAddress) {
      const lastChar = window.userAddress.slice(-1).toLowerCase();
      const charCode = lastChar.charCodeAt(0);
      
      // Semplice logica per determinare quali NFT mostrare in base all'indirizzo
      if (charCode % 2 === 0) {
        // Indirizzi pari hanno entrambi gli NFT
        nftsToShow = mockNFTs;
      } else {
        // Indirizzi dispari hanno solo un NFT
        nftsToShow = [mockNFTs[0]];
      }
    }
    
    // Aggiorna contatore
    nftCount.textContent = nftsToShow.length;
    
    // Aggiungi NFT al container
    nftsToShow.forEach(nft => {
      const nftCard = document.createElement('div');
      nftCard.className = 'col-md-6 col-lg-4';
      
      nftCard.innerHTML = `
        <div class="nft-card">
          <img src="${nft.image}" class="nft-img" alt="${nft.name}">
          <h4 class="nft-title">${nft.name}</h4>
          <p class="nft-id">ID: ${nft.id}</p>
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="nft-tier tier-${nft.tier}">${nft.tier}</span>
            <span class="nft-rarity">${nft.rarity}</span>
          </div>
          <p class="small text-muted mb-0">${nft.description}</p>
        </div>
      `;
      
      nftContainer.appendChild(nftCard);
    });
  }
  
  // Ottieni info rete
  async function getNetworkInfo() {
    if (!window.web3) return;
    
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const networks = {
        '0x1': 'Ethereum Mainnet',
        '0x38': 'BNB Smart Chain',
        '0x89': 'Polygon',
        '0xa86a': 'Avalanche',
        '0xa4b1': 'Arbitrum'
      };
      
      networkName.textContent = networks[chainId] || `Chain ID: ${chainId}`;
    } catch (error) {
      console.error('Error getting network:', error);
      networkName.textContent = 'Unknown';
    }
  }
  
  // Connetti wallet
  async function connectWallet() {
    const hasWeb3 = await initWeb3();
    
    if (!hasWeb3) {
      showConnectionError();
      return;
    }
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      handleAccountsChanged(accounts);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      showConnectionError();
    }
  }
  
  // Gestisce cambio account
  function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      console.log('Please connect to MetaMask.');
    } else {
      window.userAddress = accounts[0];
      console.log('Connected account:', window.userAddress);
      updateConnectedUI();
    }
  }
  
  // Disconnetti wallet
  function disconnectWallet() {
    window.userAddress = null;
    
    // Aggiorna UI
    connectPrompt.classList.remove('d-none');
    dashboardContent.classList.add('d-none');
    connectionIndicator.classList.add('disconnected');
    connectionIndicator.classList.remove('connected');
    connectionText.textContent = 'Disconnesso';
    connectWalletBtn.classList.remove('d-none');
    disconnectWalletBtn.classList.add('d-none');
  }
  
  // Mostra errore di connessione
  function showConnectionError() {
    alert('Errore di connessione. Assicurati di avere MetaMask installato e configurato correttamente.');
  }
  
  // Copia indirizzo negli appunti
  function copyAddressToClipboard() {
    if (window.userAddress) {
      navigator.clipboard.writeText(window.userAddress)
        .then(() => {
          copyAddress.innerHTML = '<i class="ri-check-line"></i>';
          setTimeout(() => {
            copyAddress.innerHTML = '<i class="ri-file-copy-line"></i>';
          }, 2000);
        })
        .catch(err => {
          console.error('Could not copy address: ', err);
        });
    }
  }
  
  // Aggiungi token a MetaMask
  window.addTokenToMetaMask = async function() {
    if (!window.ethereum) {
      alert('MetaMask non rilevato!');
      return;
    }
    
    try {
      const success = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: IASE_TOKEN_ADDRESS,
            symbol: IASE_TOKEN_METADATA.symbol,
            decimals: IASE_TOKEN_METADATA.decimals,
            image: window.location.origin + '/' + IASE_TOKEN_METADATA.image
          }
        }
      });
      
      if (success) {
        console.log('Token aggiunto con successo a MetaMask!');
      } else {
        console.log('Token non aggiunto.');
      }
    } catch (error) {
      console.error('Error adding token to MetaMask:', error);
    }
  };
  
  // Verifica connessione esistente all'avvio
  async function checkExistingConnection() {
    const hasWeb3 = await initWeb3();
    
    if (hasWeb3 && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          handleAccountsChanged(accounts);
        }
      } catch (error) {
        console.error('Error checking existing connection:', error);
      }
    }
  }
  
  // Event listeners
  connectWalletBtn.addEventListener('click', connectWallet);
  connectMainBtn.addEventListener('click', connectWallet);
  disconnectWalletBtn.addEventListener('click', disconnectWallet);
  addTokenBtn.addEventListener('click', window.addTokenToMetaMask);
  copyAddress.addEventListener('click', copyAddressToClipboard);
  
  // Controlla se MetaMask è già connesso
  checkExistingConnection();
  
  // Ascolta eventi di MetaMask
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', handleAccountsChanged);
  }
});