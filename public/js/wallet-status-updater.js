/**
 * IASE Wallet Status Updater
 * 
 * Script per aggiornare l'interfaccia utente dello staking quando
 * il wallet è connesso o disconnesso.
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('Wallet Status Updater loaded');
  
  // Elementi UI
  const walletIndicator = document.getElementById('walletIndicator');
  const walletStatusText = document.getElementById('walletStatusText');
  const walletAddressEl = document.getElementById('walletAddress');
  const connectWalletBtn = document.getElementById('connectWalletBtn');
  const disconnectWalletBtn = document.getElementById('disconnectWalletBtn');
  
  // Aggiungi event listeners per eventi wallet
  document.addEventListener('wallet:connected', handleWalletConnected);
  document.addEventListener('wallet:disconnected', handleWalletDisconnected);
  document.addEventListener('wallet:networkChanged', handleNetworkChanged);
  
  // Compatibilità con eventi del sistema originale
  document.addEventListener('wallet_connected', function(event) {
    console.log('Evento wallet_connected ricevuto (compatibilità):', event);
    if (event.detail && event.detail.address) {
      handleWalletConnected(event);
    }
  });
  
  document.addEventListener('wallet_disconnected', function() {
    console.log('Evento wallet_disconnected ricevuto (compatibilità)');
    handleWalletDisconnected();
  });
  
  // Verifica lo stato attuale del wallet (se già connesso)
  checkCurrentWalletStatus();
  
  /**
   * Verifica lo stato attuale del wallet
   */
  function checkCurrentWalletStatus() {
    console.log('Checking current wallet status');
    
    // Verifica dalla variabile globale del wallet connector
    if (window.WALLET_STATE && window.WALLET_STATE.connected) {
      console.log('Wallet già connesso:', window.WALLET_STATE);
      updateUIForConnectedWallet(
        window.WALLET_STATE.address,
        window.WALLET_STATE.network
      );
    } else if (window.userWalletAddress) {
      // Compatibilità con il vecchio sistema
      console.log('Wallet connesso (vecchio sistema):', window.userWalletAddress);
      updateUIForConnectedWallet(window.userWalletAddress, null);
    } else {
      console.log('Wallet non connesso');
      updateUIForDisconnectedWallet();
    }
  }
  
  /**
   * Gestisce l'evento di connessione wallet
   */
  function handleWalletConnected(event) {
    console.log('Wallet connected event received:', event.detail);
    const { address, network } = event.detail;
    updateUIForConnectedWallet(address, network);
    
    // Aggiorna altre parti della UI se necessario
    if (typeof loadAvailableNfts === 'function') {
      setTimeout(() => {
        console.log('Loading NFTs after wallet connection');
        loadAvailableNfts();
      }, 1000);
    }
  }
  
  /**
   * Gestisce l'evento di disconnessione wallet
   */
  function handleWalletDisconnected() {
    console.log('Wallet disconnected event received');
    updateUIForDisconnectedWallet();
  }
  
  /**
   * Gestisce l'evento di cambio rete
   */
  function handleNetworkChanged(event) {
    console.log('Network changed event received:', event.detail);
    const { network } = event.detail;
    
    // Aggiorna la UI con la nuova rete
    if (walletIndicator) {
      // Verifica se la rete è quella richiesta per lo staking (Ethereum)
      const isCorrectNetwork = network === '0x1';
      walletIndicator.classList.toggle('wrong-network', !isCorrectNetwork);
      
      // Mostra/nascondi avviso rete sbagliata
      const wrongNetworkAlert = document.getElementById('wrong-network-alert');
      if (wrongNetworkAlert) {
        wrongNetworkAlert.classList.toggle('d-none', isCorrectNetwork);
      }
    }
  }
  
  /**
   * Aggiorna la UI per wallet connesso
   */
  function updateUIForConnectedWallet(address, network) {
    console.log('Updating UI for connected wallet:', address, network);
    
    // Formatta l'indirizzo wallet
    const shortAddress = address ? 
      `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : '';
    
    // Aggiorna indicatore wallet
    if (walletIndicator) {
      walletIndicator.classList.remove('disconnected');
      walletIndicator.classList.add('connected');
      
      // Verifica se la rete è quella richiesta per lo staking (Ethereum)
      const isCorrectNetwork = network === '0x1';
      walletIndicator.classList.toggle('wrong-network', !isCorrectNetwork);
      
      // Mostra/nascondi avviso rete sbagliata
      const wrongNetworkAlert = document.getElementById('wrong-network-alert');
      if (wrongNetworkAlert) {
        wrongNetworkAlert.classList.toggle('d-none', isCorrectNetwork);
      }
    }
    
    // Aggiorna testo stato wallet
    if (walletStatusText) {
      walletStatusText.textContent = 'Wallet connected';
      walletStatusText.classList.add('connected');
    }
    
    // Aggiorna indirizzo wallet
    if (walletAddressEl) {
      walletAddressEl.textContent = shortAddress;
    }
    
    // Aggiorna bottoni
    if (connectWalletBtn) {
      connectWalletBtn.classList.add('hidden');
    }
    if (disconnectWalletBtn) {
      disconnectWalletBtn.classList.remove('hidden');
    }
    
    // Aggiorna altri elementi specifici per staking
    const walletConnectionSection = document.querySelector('.wallet-connection-section');
    const stakingSteps = document.querySelector('.staking-steps');
    
    if (walletConnectionSection) {
      walletConnectionSection.classList.add('connected');
    }
    
    if (stakingSteps) {
      stakingSteps.classList.add('wallet-connected');
    }
    
    // Aggiorna NFT disponibili se funzione esiste
    if (typeof loadAvailableNfts === 'function') {
      console.log('Loading available NFTs');
      loadAvailableNfts();
    }
  }
  
  /**
   * Aggiorna la UI per wallet disconnesso
   */
  function updateUIForDisconnectedWallet() {
    console.log('Updating UI for disconnected wallet');
    
    // Aggiorna indicatore wallet
    if (walletIndicator) {
      walletIndicator.classList.remove('connected');
      walletIndicator.classList.add('disconnected');
      walletIndicator.classList.remove('wrong-network');
    }
    
    // Aggiorna testo stato wallet
    if (walletStatusText) {
      walletStatusText.textContent = 'Wallet not connected';
      walletStatusText.classList.remove('connected');
    }
    
    // Aggiorna indirizzo wallet
    if (walletAddressEl) {
      walletAddressEl.textContent = '';
    }
    
    // Aggiorna bottoni
    if (connectWalletBtn) {
      connectWalletBtn.classList.remove('hidden');
    }
    if (disconnectWalletBtn) {
      disconnectWalletBtn.classList.add('hidden');
    }
    
    // Nascondi avviso rete sbagliata
    const wrongNetworkAlert = document.getElementById('wrong-network-alert');
    if (wrongNetworkAlert) {
      wrongNetworkAlert.classList.add('d-none');
    }
    
    // Aggiorna altri elementi specifici per staking
    const walletConnectionSection = document.querySelector('.wallet-connection-section');
    const stakingSteps = document.querySelector('.staking-steps');
    
    if (walletConnectionSection) {
      walletConnectionSection.classList.remove('connected');
    }
    
    if (stakingSteps) {
      stakingSteps.classList.remove('wallet-connected');
    }
  }
});