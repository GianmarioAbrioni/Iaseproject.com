/**
 * IASE Staking Wallet Connector
 * Versione specializzata per la pagina staking che impedisce 
 * l'inserimento del wallet nella navbar e usa solo il pulsante dedicato
 */

window.addEventListener('DOMContentLoaded', function() {
  console.log('🔄 Staking Wallet Connector inizializzato');
  
  // Elementi UI
  const connectWalletBtn = document.getElementById('connectWalletBtn');
  const disconnectWalletBtn = document.getElementById('disconnectWalletBtn');
  const walletStatusText = document.getElementById('walletStatusText');
  const walletAddress = document.getElementById('walletAddress');
  const walletIndicator = document.querySelector('.wallet-indicator');
  const dashboardWalletAddress = document.getElementById('dashboardWalletAddress');
  const stakingDashboard = document.getElementById('stakingDashboard');
  
  // Rimuovi qualsiasi wallet component esistente nella navbar
  removeExistingWalletComponents();
  
  // Intercetta e previeni l'inserimento di nuovi wallet components
  preventWalletComponentInsertion();
  
  // Collega i pulsanti alle funzioni wallet
  setupButtonListeners();
  
  // Verifica lo stato attuale del wallet
  checkCurrentWalletStatus();
  
  // Imposta monitoraggio periodico stato wallet (per intercettare disconnessioni esterne)
  setupWalletMonitor();
  
  /**
   * Rimuove eventuali componenti wallet dalla navbar
   */
  function removeExistingWalletComponents() {
    const existingComponent = document.getElementById('wallet-component');
    if (existingComponent) {
      console.log('🗑️ Rimozione wallet component dalla navbar');
      existingComponent.remove();
    }
  }
  
  /**
   * Impedisce l'inserimento di wallet components
   * modificando la funzione insertWalletComponent
   */
  function preventWalletComponentInsertion() {
    if (window.insertWalletComponent) {
      console.log('🚫 Sostituisco insertWalletComponent per impedire inserimento in navbar');
      const originalInsertWalletComponent = window.insertWalletComponent;
      
      window.insertWalletComponent = function() {
        console.log('🚫 Inserimento wallet component bloccato nella pagina staking');
        
        // Collega event listener al pulsante di staking invece
        if (connectWalletBtn && window.connectWallet) {
          connectWalletBtn.addEventListener('click', window.connectWallet);
          console.log('✅ Event listener aggiunto al pulsante staking');
        }
        
        if (disconnectWalletBtn && window.disconnectWallet) {
          disconnectWalletBtn.addEventListener('click', window.disconnectWallet);
        }
      };
    }
  }
  
  /**
   * Collega i pulsanti alle funzioni wallet
   */
  function setupButtonListeners() {
    if (connectWalletBtn) {
      connectWalletBtn.addEventListener('click', function() {
        console.log('🔌 Pulsante connessione wallet staking cliccato');
        if (window.connectWallet) {
          window.connectWallet();
        } else if (window.ethereum) {
          console.log('Fallback: Connessione diretta via ethereum');
          ethereum.request({ method: 'eth_requestAccounts' })
            .then(handleWalletConnected)
            .catch(console.error);
        }
      });
    }
    
    if (disconnectWalletBtn) {
      disconnectWalletBtn.addEventListener('click', function() {
        console.log('🔌 Pulsante disconnessione wallet staking cliccato');
        if (window.disconnectWallet) {
          window.disconnectWallet();
        } else {
          // Fallback: disconnessione manuale
          handleWalletDisconnected();
        }
      });
    }
  }
  
  /**
   * Verifica lo stato attuale del wallet
   */
  function checkCurrentWalletStatus() {
    console.log('🔍 Verifica stato wallet');
    
    // Verifica stato globale
    if (window.WALLET_STATE && window.WALLET_STATE.connected) {
      console.log('🔌 Wallet già connesso via WALLET_STATE');
      updateUIForConnectedWallet(window.WALLET_STATE.address);
    } 
    // Verifica connection via ethereum
    else if (window.ethereum && window.ethereum.selectedAddress) {
      console.log('🔌 Wallet già connesso via ethereum');
      updateUIForConnectedWallet(window.ethereum.selectedAddress);
    } 
    // Fallback al vecchio sistema
    else if (window.userWalletAddress) {
      console.log('🔌 Wallet già connesso via userWalletAddress');
      updateUIForConnectedWallet(window.userWalletAddress);
    } 
    else {
      console.log('❌ Nessun wallet connesso');
      updateUIForDisconnectedWallet();
    }
  }
  
  /**
   * Imposta monitoraggio periodico stato wallet
   */
  function setupWalletMonitor() {
    setInterval(function() {
      const isConnectedInUI = walletStatusText && walletStatusText.classList.contains('connected');
      const isConnectedInEthereum = window.ethereum && window.ethereum.selectedAddress;
      
      if (isConnectedInEthereum && !isConnectedInUI) {
        console.log('⚠️ Stato UI inconsistente: wallet connesso ma UI disconnessa');
        updateUIForConnectedWallet(window.ethereum.selectedAddress);
      } else if (!isConnectedInEthereum && isConnectedInUI) {
        console.log('⚠️ Stato UI inconsistente: wallet disconnesso ma UI connessa');
        updateUIForDisconnectedWallet();
      }
    }, 2000);
  }
  
  /**
   * Gestisce l'evento di connessione wallet
   */
  function handleWalletConnected(accounts) {
    if (!accounts || accounts.length === 0) return;
    
    const address = accounts[0];
    console.log('✅ Wallet connesso:', address);
    
    updateUIForConnectedWallet(address);
    
    // Carica NFT e mostra dashboard
    if (typeof window.loadAvailableNfts === 'function') {
      console.log('🔄 Caricamento NFT dopo connessione');
      window.loadAvailableNfts();
    }
  }
  
  /**
   * Gestisce l'evento di disconnessione wallet
   */
  function handleWalletDisconnected() {
    console.log('❌ Wallet disconnesso');
    updateUIForDisconnectedWallet();
  }
  
  /**
   * Aggiorna UI per wallet connesso
   */
  function updateUIForConnectedWallet(address) {
    // Formatta indirizzo
    const shortAddress = address ? 
      `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : '';
    
    // Aggiorna stato wallet
    if (walletStatusText) {
      walletStatusText.textContent = 'Wallet connected';
      walletStatusText.classList.add('connected');
    }
    
    if (walletAddress) {
      walletAddress.textContent = shortAddress;
    }
    
    // Aggiorna indicatore
    if (walletIndicator) {
      walletIndicator.classList.remove('disconnected');
      walletIndicator.classList.add('connected');
    }
    
    // Aggiorna pulsanti
    if (connectWalletBtn) connectWalletBtn.classList.add('hidden');
    if (disconnectWalletBtn) disconnectWalletBtn.classList.remove('hidden');
    
    // Aggiorna indirizzo nella dashboard
    if (dashboardWalletAddress) {
      dashboardWalletAddress.textContent = shortAddress;
    }
    
    // Mostra dashboard
    if (stakingDashboard) {
      stakingDashboard.classList.remove('hidden');
    }
    
    // Carica NFT se non sono già stati caricati
    if (typeof window.loadAvailableNfts === 'function') {
      window.loadAvailableNfts();
    }
  }
  
  /**
   * Aggiorna UI per wallet disconnesso
   */
  function updateUIForDisconnectedWallet() {
    // Aggiorna stato wallet
    if (walletStatusText) {
      walletStatusText.textContent = 'Wallet not connected';
      walletStatusText.classList.remove('connected');
    }
    
    if (walletAddress) {
      walletAddress.textContent = '';
    }
    
    // Aggiorna indicatore
    if (walletIndicator) {
      walletIndicator.classList.add('disconnected');
      walletIndicator.classList.remove('connected');
    }
    
    // Aggiorna pulsanti
    if (connectWalletBtn) connectWalletBtn.classList.remove('hidden');
    if (disconnectWalletBtn) disconnectWalletBtn.classList.add('hidden');
    
    // Nascondi dashboard
    if (stakingDashboard) {
      stakingDashboard.classList.add('hidden');
    }
  }
  
  // Lista di eventi wallet da monitorare
  const walletEvents = {
    accountsChanged: function(accounts) {
      if (accounts.length === 0) {
        handleWalletDisconnected();
      } else {
        handleWalletConnected(accounts);
      }
    },
    connect: function(connectInfo) {
      console.log('Ethereum connected:', connectInfo);
      if (window.ethereum && window.ethereum.selectedAddress) {
        handleWalletConnected([window.ethereum.selectedAddress]);
      }
    },
    disconnect: function(error) {
      console.log('Ethereum disconnected:', error);
      handleWalletDisconnected();
    }
  };
  
  // Registra tutti gli event listener
  if (window.ethereum) {
    ethereum.on('accountsChanged', walletEvents.accountsChanged);
    ethereum.on('connect', walletEvents.connect);
    ethereum.on('disconnect', walletEvents.disconnect);
  }
});