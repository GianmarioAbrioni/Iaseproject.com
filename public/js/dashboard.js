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
  
  // Query dati NFT reali
  async function fetchRealNFTs(walletAddress) {
    try {
      if (!walletAddress) return [];
      
      // Chiamata API
      const response = await fetch(`/api/nfts/${walletAddress}`);
      if (!response.ok) throw new Error('Errore recupero NFT');
      
      const data = await response.json();
      return data.nfts || [];
    } catch (error) {
      console.error('Errore recupero NFT:', error);
      return [];
    }
  }
  
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
  async function updateConnectedUI() {
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
    
    // Rimuovi avviso di rete di test se presente
    const testNetworkWarning = document.querySelector('.test-network-warning');
    if (testNetworkWarning) {
      testNetworkWarning.classList.add('d-none');
    }
    
    // Ottieni saldo token reale invece di simulare
    await updateTokenBalance();
    
    // Ottieni data ultima transazione reale dall'API
    try {
      const response = await fetch(`/api/dashboard/${window.userAddress}`);
      if (response.ok) {
        const dashData = await response.json();
        // Se c'è lastActivity, usala per l'ultima transazione
        if (dashData.lastActivity) {
          // Calcola giorni passati
          const lastActivityDate = new Date(dashData.lastActivity);
          const today = new Date();
          const diffTime = Math.abs(today - lastActivityDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          lastTx.textContent = new Date(dashData.lastActivity).toLocaleString('it-IT');
          lastTransaction.textContent = diffDays.toString();
        } else {
          // Nessuna attività recente
          lastTx.textContent = 'Nessuna attività recente';
          lastTransaction.textContent = '-';
        }
      }
    } catch (error) {
      console.error('Errore recupero dashboard data:', error);
      lastTx.textContent = 'N/D';
      lastTransaction.textContent = '-';
    }
    
    // Ottieni informazioni sulla rete
    getNetworkInfo();
    
    // Popola gli NFT reali
    await populateNFTs();
  }
  
  // Ottieni saldo token reale
  async function fetchRealTokenBalance(walletAddress) {
    try {
      if (!walletAddress) return { balance: 0, currency: 'IASE' };
      
      // Chiamata API
      const response = await fetch(`/api/balance/${walletAddress}`);
      if (!response.ok) throw new Error('Errore recupero saldo');
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Errore recupero saldo:', error);
      return { balance: 0, currency: 'IASE' };
    }
  }
  
  // Aggiorna saldo token reale
  async function updateTokenBalance() {
    if (!window.userAddress) return;
    
    // Mostra loader
    tokenBalance.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span>';
    tokenValue.innerHTML = 'Caricamento...';
    
    // Ottieni saldo reale
    const balanceData = await fetchRealTokenBalance(window.userAddress);
    
    // Aggiorna UI
    tokenBalance.textContent = `${balanceData.balance.toLocaleString('it-IT')} IASE`;
    tokenValue.textContent = `≈ ${(balanceData.balance / 1000).toFixed(2)} EUR`;
  }
  
  // Popola NFT
  async function populateNFTs() {
    // Resetta container
    nftContainer.innerHTML = '';
    
    // Carica NFT reali dal wallet dell'utente
    let nfts = [];
    
    if (window.userAddress) {
      // Mostra loader
      nftContainer.innerHTML = '<div class="col-12 text-center py-4"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Caricamento NFT in corso...</p></div>';
      
      // Carica NFT reali dall'API
      nfts = await fetchRealNFTs(window.userAddress);
      
      // Resetta container dopo caricamento
      nftContainer.innerHTML = '';
      
      // Se non ci sono NFT, mostra messaggio
      if (nfts.length === 0) {
        nftContainer.innerHTML = '<div class="col-12 text-center py-4"><p>Non possiedi NFT IASE Units in questo wallet.</p></div>';
      }
    }
    
    // Aggiorna contatore
    nftCount.textContent = nfts.length;
    
    // Aggiungi NFT al container
    nfts.forEach(nft => {
      const nftCard = document.createElement('div');
      nftCard.className = 'col-md-6 col-lg-4';
      
      // Determina tier e rarità basati sui metadati
      const tier = nft.tier || (nft.traits ? nft.traits.find(t => t.trait_type === 'UNIT TYPE')?.value.toLowerCase() : 'standard');
      const rarity = nft.rarity || (nft.traits ? nft.traits.find(t => t.trait_type === 'CARD FRAME')?.value : 'Common');
      const description = nft.description || 'IASE Unit NFT con capacità di elaborazione AI autonoma.';
      
      nftCard.innerHTML = `
        <div class="nft-card">
          <img src="${nft.image || 'images/nft/iase-unit-default.png'}" class="nft-img" alt="${nft.name || 'IASE Unit #' + nft.id}">
          <h4 class="nft-title">${nft.name || 'IASE Unit #' + nft.id}</h4>
          <p class="nft-id">ID: ${nft.id || nft.tokenId}</p>
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="nft-tier tier-${tier}">${tier}</span>
            <span class="nft-rarity">${rarity}</span>
          </div>
          <p class="small text-muted mb-0">${description}</p>
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
  async function dashboardConnectWallet() {
    // Usa il sistema centralizzato di walletAPI se disponibile
    if (window.walletAPI && typeof window.walletAPI.connect === 'function') {
      try {
        await window.walletAPI.connect();
        
        // Il wallet address dovrebbe essere aggiornato dall'API del wallet
        if (window.walletAPI.isConnected()) {
          const address = window.walletAPI.getAddress();
          handleAccountsChanged([address]);
          return;
        }
      } catch (error) {
        console.error('Error using unified wallet API:', error);
        // Fall back to legacy method
      }
    }
    
    // Legacy method
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
  
  // Variabile globale per compatibilità, evitando duplicati
  window.connectWallet = dashboardConnectWallet;
  
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
  connectWalletBtn.addEventListener('click', dashboardConnectWallet);
  connectMainBtn.addEventListener('click', dashboardConnectWallet);
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