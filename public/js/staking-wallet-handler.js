/**
 * IASE Staking Wallet Handler
 * Gestisce gli eventi specifici del wallet per la pagina di staking
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('Staking Wallet Handler initialized');
  
  // Elementi UI per la pagina di staking
  const connectWalletBtn = document.getElementById('connectWalletBtn');
  const stakingDashboard = document.getElementById('stakingDashboard');
  
  // Assicurati che la funzione loadAvailableNfts sia disponibile globalmente
  if (typeof window.loadAvailableNfts !== 'function' && typeof loadAvailableNfts === 'function') {
    window.loadAvailableNfts = loadAvailableNfts;
  }

  // Registra i listener per gli eventi specifici del wallet
  document.addEventListener('wallet:connected', handleWalletConnected);
  document.addEventListener('wallet:disconnected', handleWalletDisconnected);
  document.addEventListener('wallet:networkChanged', handleNetworkChanged);
  
  // Controlla lo stato corrente del wallet (è già connesso?)
  checkCurrentWalletStatus();
  
  /**
   * Verifica lo stato attuale della connessione wallet
   */
  function checkCurrentWalletStatus() {
    console.log('🔍 Staking: Checking wallet connection status');
    
    // Verifica se il wallet è già connesso tramite lo stato globale
    if (window.WALLET_STATE && window.WALLET_STATE.connected) {
      console.log('🟢 Staking: Wallet already connected, updating UI');
      handleWalletConnected({
        detail: {
          address: window.WALLET_STATE.address,
          network: window.WALLET_STATE.network
        }
      });
    } else if (window.ethereum && window.ethereum.selectedAddress) {
      // Alternativa: verifica direttamente ethereum
      console.log('🟢 Staking: Wallet connected via ethereum.selectedAddress');
      handleWalletConnected({
        detail: {
          address: window.ethereum.selectedAddress,
          network: window.ethereum.chainId
        }
      });
    } else {
      console.log('🔴 Staking: No wallet connected');
      handleWalletDisconnected();
    }
    
    // Configura timer per verifica periodica dello stato del wallet
    setInterval(periodicWalletCheck, 3000);
  }
  
  /**
   * Verifica periodica dello stato del wallet per identificare disconnessioni esterne
   */
  function periodicWalletCheck() {
    const isWalletConnected = window.ethereum && window.ethereum.selectedAddress;
    const isUiConnected = !stakingDashboard.classList.contains('hidden');
    
    if (isWalletConnected && !isUiConnected) {
      // Il wallet è connesso ma l'UI mostra disconnesso - aggiorna UI
      console.log('⚠️ Staking: Wallet state mismatch - updating UI to connected state');
      handleWalletConnected({
        detail: {
          address: window.ethereum.selectedAddress,
          network: window.ethereum.chainId
        }
      });
    } else if (!isWalletConnected && isUiConnected) {
      // Il wallet è disconnesso ma l'UI mostra connesso - aggiorna UI
      console.log('⚠️ Staking: Wallet disconnected externally - updating UI');
      handleWalletDisconnected();
    }
  }
  
  /**
   * Gestione evento di connessione del wallet
   */
  function handleWalletConnected(event) {
    const { address, network } = event.detail;
    console.log('🟢 Staking: Wallet connected event:', { address, network });
    
    // Verifica se siamo sulla rete corretta per staking (Ethereum Mainnet)
    const isCorrectNetwork = network === '0x1';
    
    // Aggiorna UI
    if (stakingDashboard) {
      stakingDashboard.classList.remove('hidden');
    }
    
    // Aggiorna il testo dell'indirizzo wallet sulla dashboard
    const dashboardWalletAddress = document.getElementById('dashboardWalletAddress');
    if (dashboardWalletAddress) {
      const shortAddress = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
      dashboardWalletAddress.textContent = shortAddress;
    }
    
    // Mostra warning se rete sbagliata
    const wrongNetworkAlert = document.getElementById('wrong-network-alert');
    if (wrongNetworkAlert) {
      wrongNetworkAlert.classList.toggle('d-none', isCorrectNetwork);
    }
    
    // Nascondi bottone connetti
    if (connectWalletBtn) {
      connectWalletBtn.classList.add('hidden');
    }
    
    // Carica gli NFT
    setTimeout(() => {
      console.log('🔄 Staking: Loading NFTs after connection');
      if (typeof window.loadAvailableNfts === 'function') {
        window.loadAvailableNfts();
      } else if (typeof loadAvailableNfts === 'function') {
        loadAvailableNfts();
      } else {
        console.error('❌ Staking: loadAvailableNfts function not found');
      }
    }, 1000);
  }
  
  /**
   * Gestione evento di disconnessione del wallet
   */
  function handleWalletDisconnected() {
    console.log('🔴 Staking: Wallet disconnected event');
    
    // Aggiorna UI
    if (stakingDashboard) {
      stakingDashboard.classList.add('hidden');
    }
    
    // Mostra bottone connetti
    if (connectWalletBtn) {
      connectWalletBtn.classList.remove('hidden');
    }
    
    // Reimposta il testo dell'indirizzo wallet sulla dashboard
    const dashboardWalletAddress = document.getElementById('dashboardWalletAddress');
    if (dashboardWalletAddress) {
      dashboardWalletAddress.textContent = '0x0000...0000';
    }
    
    // Nascondi warning rete sbagliata
    const wrongNetworkAlert = document.getElementById('wrong-network-alert');
    if (wrongNetworkAlert) {
      wrongNetworkAlert.classList.add('d-none');
    }
  }
  
  /**
   * Gestione evento di cambio rete
   */
  function handleNetworkChanged(event) {
    const { network } = event.detail;
    console.log('🔄 Staking: Network changed event:', { network });
    
    // Verifica se siamo sulla rete corretta per staking (Ethereum)
    const isCorrectNetwork = network === '0x1';
    
    // Mostra/nascondi avviso rete sbagliata
    const wrongNetworkAlert = document.getElementById('wrong-network-alert');
    if (wrongNetworkAlert) {
      wrongNetworkAlert.classList.toggle('d-none', isCorrectNetwork);
    }
  }
});