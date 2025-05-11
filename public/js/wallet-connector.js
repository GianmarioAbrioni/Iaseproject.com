/**
 * IASE Wallet Connector Wrapper
 * 
 * Questo script risolve i problemi di conflitto tra le diverse implementazioni
 * della connessione wallet (wallet-connect.js, universal-wallet-connector.js, unified-wallet.js)
 * 
 * Carica l'implementazione appropriata in base al contesto della pagina.
 */

// Evita il double-loading dello script
if (typeof window.walletConnectorLoaded === 'undefined') {
  window.walletConnectorLoaded = true;

  // Determina quale pagina è attualmente caricata
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  // Mappa delle pagine che richiedono un connettore specifico
  const specialPages = {
    'token.html': {
      script: 'universal-wallet-connector.js',
      requiredNetwork: '0x38', // BNB Chain
      purpose: 'Token Purchase',
      networkName: 'BNB Smart Chain'
    },
    'staking.html': {
      script: 'universal-wallet-connector.js',
      requiredNetwork: '0x1',  // Ethereum Mainnet
      purpose: 'NFT Staking',
      networkName: 'Ethereum'
    },
    'user-dashboard.html': {
      script: 'universal-wallet-connector.js',
      requiredNetwork: null, // Accetta entrambe le reti
      purpose: 'Dashboard Access'
    }
  };
  
  // Aggiungi informazioni di rete ai bottoni
  document.addEventListener('DOMContentLoaded', function() {
    // Per bottoni che hanno data-network="bnb"
    const bnbButtons = document.querySelectorAll('[data-network="bnb"]');
    bnbButtons.forEach(button => {
      button.addEventListener('click', async function() {
        console.log('BNB button clicked');
        if (window.ethereum) {
          try {
            // Cambia prima alla rete BNB se non è già selezionata
            const chainId = await ethereum.request({ method: 'eth_chainId' });
            console.log('Current chainId:', chainId);
            
            if (chainId !== '0x38') {
              console.log('Switching to BNB Smart Chain');
              try {
                await ethereum.request({
                  method: 'wallet_switchEthereumChain',
                  params: [{ chainId: '0x38' }]
                });
                console.log('Successfully switched to BNB');
              } catch (switchError) {
                console.error('Switch error:', switchError);
                // Se la rete non è configurata in MetaMask, aggiungi BNB Chain
                if (switchError.code === 4902) {
                  console.log('BNB not configured, adding network');
                  await ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                      chainId: '0x38',
                      chainName: 'BNB Smart Chain',
                      nativeCurrency: {
                        name: 'BNB',
                        symbol: 'BNB',
                        decimals: 18
                      },
                      rpcUrls: ['https://bsc-dataseed.binance.org/'],
                      blockExplorerUrls: ['https://bscscan.com']
                    }]
                  });
                  console.log('BNB network added');
                }
              }
            }
            
            // Dopo aver configurato la rete, procedi con la connessione
            if (typeof window.connectWallet === 'function') {
              console.log('Calling connectWallet()');
              window.connectWallet();
            } else {
              console.error('connectWallet function not available');
            }
            
          } catch (error) {
            console.error('Errore switch rete:', error);
          }
        } else {
          console.error('MetaMask not installed');
          alert('MetaMask non è installato. Installa MetaMask per continuare.');
        }
      });
    });
    
    // Per bottoni che hanno data-network="ethereum"
    const ethButtons = document.querySelectorAll('[data-network="ethereum"]');
    ethButtons.forEach(button => {
      button.addEventListener('click', async function() {
        console.log('ETH button clicked');
        if (window.ethereum) {
          try {
            // Cambia prima alla rete Ethereum se non è già selezionata
            const chainId = await ethereum.request({ method: 'eth_chainId' });
            console.log('Current chainId:', chainId);
            
            if (chainId !== '0x1') {
              console.log('Switching to Ethereum Mainnet');
              try {
                await ethereum.request({
                  method: 'wallet_switchEthereumChain',
                  params: [{ chainId: '0x1' }]
                });
                console.log('Successfully switched to Ethereum');
              } catch (switchError) {
                console.error('Switch error:', switchError);
              }
            }
            
            // Dopo aver configurato la rete, procedi con la connessione
            if (typeof window.connectWallet === 'function') {
              console.log('Calling connectWallet()');
              window.connectWallet();
            } else {
              console.error('connectWallet function not available');
            }
            
          } catch (error) {
            console.error('Errore switch rete:', error);
          }
        } else {
          console.error('MetaMask not installed');
          alert('MetaMask non è installato. Installa MetaMask per continuare.');
        }
      });
    });
  });

  // Carica lo script appropriato
  function loadWalletConnector() {
    const scriptSrc = specialPages[currentPage] ? 
      specialPages[currentPage].script : 
      'wallet-connect.js';
    
    // Se lo script è già caricato, non fare nulla
    if (document.querySelector(`script[src="js/${scriptSrc}"]`)) {
      console.log(`Wallet connector script ${scriptSrc} already loaded`);
      return;
    }
    
    // Carica lo script
    const script = document.createElement('script');
    script.src = `js/${scriptSrc}`;
    script.async = true;
    
    // Carica i requisiti di rete nello script
    if (specialPages[currentPage]) {
      window.requiredNetwork = specialPages[currentPage].requiredNetwork;
      window.networkPurpose = specialPages[currentPage].purpose;
    }
    
    // Aggiungi lo script al DOM
    document.body.appendChild(script);
    console.log(`Loaded wallet connector: ${scriptSrc}`);
  }

  // Esegui il caricamento quando il documento è pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadWalletConnector);
  } else {
    loadWalletConnector();
  }
}