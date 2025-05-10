import { useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const Token = () => {
  useEffect(() => {
    // Load Web3 library
    const loadWeb3Script = document.createElement('script');
    loadWeb3Script.src = 'https://cdn.jsdelivr.net/npm/web3@1.8.2/dist/web3.min.js';
    loadWeb3Script.async = true;
    document.body.appendChild(loadWeb3Script);

    // Set page title and description
    document.title = "IASE Project - Token";
    const metaDescription = document.createElement('meta');
    metaDescription.name = 'description';
    metaDescription.content = 'Discover IASE Token, the native currency of the IASE autonomous ecosystem. Learn how to add it to MetaMask and explore its future utility in space AI infrastructure.';
    document.head.appendChild(metaDescription);
    
    // Clean up function
    return () => {
      document.body.removeChild(loadWeb3Script);
      const existingMeta = document.querySelector('meta[name="description"]');
      if (existingMeta) document.head.removeChild(existingMeta);
    };
  }, []);
  
  const copyContractAddress = () => {
    const contractAddress = "0x5A170D59ae8B851DC4DD0D14cC89E5fE541752CE";
    navigator.clipboard.writeText(contractAddress).then(() => {
      alert("IASE contract address copied to clipboard!");
    });
  };
  
  // This function will be available globally for the MetaMask integration
  useEffect(() => {
    window.addTokenToMetaMask = async () => {
      if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
        try {
          const wasAdded = await window.ethereum.request({
            method: 'wallet_watchAsset',
            params: {
              type: 'ERC20',
              options: {
                address: '0x5A170D59ae8B851DC4DD0D14cC89E5fE541752CE',
                symbol: 'IASE',
                decimals: 18,
                image: 'https://iase-project.com/images/iase-token-logo.png',
              },
            },
          });
          
          if (wasAdded) {
            console.log('IASE token was added to MetaMask');
          } else {
            console.log('IASE token was not added to MetaMask');
          }
        } catch (error) {
          console.error('Error adding IASE token to MetaMask:', error);
        }
      } else {
        alert('MetaMask is not installed. Please install MetaMask to add the IASE token.');
      }
    };
    
    // Initialize Web3 functionality
    const initWeb3 = () => {
      let web3;
      let userAddress = null;
      const connectButton = document.getElementById('connectButton');
      const walletInfo = document.getElementById('walletInfo');
      const shortWallet = document.getElementById('shortWallet');
      const presaleForm = document.getElementById('presaleForm');
      const bnbAmount = document.getElementById('bnbAmount');
      const estimate = document.getElementById('estimate');
      const rangeModal = document.getElementById('rangeModal');
      const conversionRate = 1000000; // 1 BNB = 1,000,000 IASE
      const minBNB = 0.05;
      const maxBNB = 10;
      const CONTRACT_ADDRESS = "0x54799bAf11ff48a2662F0f65C09A18D96851cF3B";
      
      // ABI for the smart contract
      const ABI = [
        {
          "inputs": [],
          "name": "buyTokens",
          "outputs": [],
          "stateMutability": "payable",
          "type": "function"
        }
      ];
      
      // Connect wallet functionality
      if (connectButton) {
        connectButton.addEventListener('click', async () => {
          if (typeof window.ethereum !== 'undefined') {
            try {
              // Request account access
              const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
              userAddress = accounts[0];
              
              // Display wallet info
              if (walletInfo && shortWallet) {
                walletInfo.style.display = 'block';
                shortWallet.textContent = `${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}`;
                connectButton.textContent = 'Wallet Connected';
                connectButton.disabled = true;
                
                // Show presale form
                if (presaleForm) {
                  presaleForm.style.display = 'block';
                }
              }
              
              // Handle network change
              const chainId = await window.ethereum.request({ method: 'eth_chainId' });
              if (chainId !== '0x38') { // BSC Mainnet
                try {
                  await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0x38' }],
                  });
                } catch (switchError) {
                  if (presaleForm) {
                    presaleForm.style.display = 'none';
                  }
                  alert('Please switch to Binance Smart Chain network to buy IASE tokens.');
                }
              }
              
              // Initialize Web3
              web3 = new window.Web3(window.ethereum);
              window.web3 = web3;
              window.userAddress = userAddress;
              
            } catch (error) {
              console.error('User denied account access:', error);
            }
          } else {
            alert('Please install MetaMask to connect your wallet and participate in the IASE token sale.');
          }
        });
      }
      
      // Update estimated tokens when BNB amount changes
      if (bnbAmount && estimate) {
        bnbAmount.addEventListener('input', () => {
          const amount = parseFloat(bnbAmount.value);
          if (!isNaN(amount)) {
            const tokens = amount * conversionRate;
            estimate.textContent = `You will receive approximately ${tokens.toLocaleString()} IASE`;
          } else {
            estimate.textContent = '';
          }
        });
      }
      
      // Handle presale form submission
      if (presaleForm) {
        presaleForm.addEventListener('submit', async function(e) {
          e.preventDefault();
          
          if (!window.userAddress) {
            alert('Please connect your wallet first.');
            return;
          }
          
          const amount = parseFloat(bnbAmount.value);
          
          // Validate amount
          if (isNaN(amount) || amount < minBNB || amount > maxBNB) {
            if (rangeModal) {
              rangeModal.style.display = 'block';
            }
            return;
          }
          
          // Create contract instance
          const contract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);
          
          try {
            const tx = await contract.methods.buyTokens().send({
              from: window.userAddress,
              value: web3.utils.toWei(amount.toString(), 'ether')
            });
            
            alert(`Transaction successful! You've purchased IASE tokens.\nTransaction hash: ${tx.transactionHash}`);
            
          } catch (error) {
            console.error('Transaction failed:', error);
            alert('Transaction failed. Please try again or contact support.');
          }
        });
      }
    };
    
    // Execute initialization when the page is fully loaded
    if (document.readyState === 'complete') {
      initWeb3();
    } else {
      window.addEventListener('load', initWeb3);
      // Clean up listener
      return () => {
        window.removeEventListener('load', initWeb3);
      };
    }
  }, []);
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Token Hero */}
        <section className="py-8 md:py-12 text-center">
          <div className="max-w-4xl mx-auto">
            <img 
              src="/images/iase-token-logo.png" 
              alt="IASE Token Logo" 
              className="max-w-[150px] mx-auto mb-5"
            />
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">IASE Token</h1>
            <p className="text-xl text-gray-300 mb-6">
              The native utility token powering the Intelligent Autonomous Space Entities ecosystem
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <button 
                onClick={() => window.addTokenToMetaMask()} 
                className="inline-flex items-center px-6 py-3 bg-primary hover:bg-primary/80 text-white font-medium rounded-lg transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 512 512" fill="currentColor">
                  <path d="M378.7 32H133.3L256 182.7L378.7 32zM512 256l-107.4-141.3L289.6 256l115 141.3L512 256zM107.4 114.7L0 256l107.4 141.3L222.4 256L107.4 114.7zM133.3 480h245.4L256 329.3L133.3 480z" />
                </svg>
                Add to MetaMask
              </button>
              
              <button 
                onClick={copyContractAddress}
                className="inline-flex items-center px-6 py-3 border border-primary bg-transparent hover:bg-primary/10 text-primary font-medium rounded-lg transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Contract Address
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center mb-12">
              <div className="bg-card p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold mb-1">Token Type</h3>
                <p className="text-gray-400">BEP-20 Utility Token</p>
              </div>
              
              <div className="bg-card p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold mb-1">Total Supply</h3>
                <p className="text-gray-400">1,000,000,000 IASE</p>
              </div>
              
              <div className="bg-card p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold mb-1">Decimals</h3>
                <p className="text-gray-400">18</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Token Presale */}
        <section className="py-8 md:py-12 bg-card rounded-xl shadow-lg mb-12">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-primary text-center mb-6">
              IASE Token Pre-Sale
            </h2>
            <p className="text-lg text-center mb-8">
              Join the IASE journey early by purchasing tokens directly through the official smart contract form before the public listing expands!
            </p>
            
            <div className="bg-muted p-6 rounded-lg mb-8">
              <h3 className="text-xl font-semibold mb-4">Pre-Sale Details:</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Price: 1 BNB = 1,000,000 IASE</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Minimum purchase: 0.05 BNB (50,000 IASE)</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Maximum purchase: 10 BNB (10,000,000 IASE)</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Network: Binance Smart Chain (BSC)</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Tokens receive instantly upon transaction confirmation</span>
                </li>
              </ul>
            </div>
            
            {/* Wallet Connect + Purchase Form */}
            <div id="wallet-interface" className="flex flex-col items-center">
              <button 
                id="connectButton"
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg transition-all mb-4"
              >
                Connect Wallet
              </button>
              
              <div id="walletInfo" className="hidden text-center mb-4 text-gray-300">
                Wallet connected: <span id="shortWallet" className="text-primary font-semibold"></span>
              </div>
              
              <form id="presaleForm" className="hidden w-full max-w-md">
                <div className="mb-4">
                  <label htmlFor="bnbAmount" className="block text-gray-300 mb-2">
                    Amount in BNB (min 0.05 – max 10):
                  </label>
                  <input 
                    id="bnbAmount"
                    type="number"
                    min="0.05"
                    max="10"
                    step="0.01"
                    placeholder="Enter amount in BNB"
                    required
                    className="w-full p-3 bg-background border border-gray-700 rounded-lg focus:border-primary focus:ring-primary/30 focus:ring-2 focus:outline-none"
                  />
                </div>
                
                <div id="estimate" className="text-amber-500 mb-4 text-center"></div>
                
                <button 
                  type="submit"
                  className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-all"
                >
                  Buy IASE Tokens
                </button>
              </form>
            </div>
            
            {/* Range Modal */}
            <div id="rangeModal" className="hidden fixed inset-0 bg-black/80 flex items-center justify-center z-50">
              <div className="bg-white text-black p-6 max-w-md rounded-lg text-center">
                <p id="rangeModalText" className="text-lg mb-4">
                  Amount must be between 0.05 and 10 BNB.
                </p>
                <button 
                  onClick={() => document.getElementById('rangeModal').style.display = 'none'}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded transition-all"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </section>
        
        {/* Token Utility */}
        <section className="py-8 md:py-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-primary text-center mb-10">Token Utility</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="bg-card p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold text-primary mb-4">Ecosystem Currency</h3>
                <p className="text-gray-300 mb-4">
                  IASE serves as the primary medium of exchange within the ecosystem, enabling users to:
                </p>
                <ul className="space-y-2 text-gray-400">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Pay for computational resources in the IASE network</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Purchase NFT Units and upgrades</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Access premium features and services</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-card p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold text-primary mb-4">Governance <span className="text-sm text-yellow-500 ml-2">(Coming Soon)</span></h3>
                <p className="text-gray-300 mb-4">
                  IASE token holders will gain voting rights in the protocol's development (1000+ IASE = 1 vote), allowing them to:
                </p>
                <ul className="space-y-2 text-gray-400">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Vote on protocol improvements and parameter changes</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Propose new features and technological integrations</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Participate in resource allocation decisions</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-card p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold text-primary mb-4">Staking Rewards <span className="text-sm text-yellow-500 ml-2">(Coming Soon)</span></h3>
                <p className="text-gray-300 mb-4">
                  By staking IASE tokens, holders will be able to earn passive rewards and benefits:
                </p>
                <ul className="space-y-2 text-gray-400">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Earn additional IASE tokens as staking rewards</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Increased voting power in governance</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Priority access to new features and products</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-card p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold text-primary mb-4">Node Operations <span className="text-sm text-yellow-500 ml-2">(Coming Soon)</span></h3>
                <p className="text-gray-300 mb-4">
                  IASE tokens will enable participation in the decentralized network infrastructure:
                </p>
                <ul className="space-y-2 text-gray-400">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Run validator nodes with IASE stake</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Earn fees for processing network operations</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Contribute computing resources to the network</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        
        {/* Technical Details */}
        <section className="py-8 md:py-12 bg-card rounded-xl shadow-lg">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-primary text-center mb-8">Technical Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">Token Implementation</h3>
                <p className="text-gray-300 mb-4">
                  IASE Token deployed and verified. Smart contract publicly available.
                </p>
                <ul className="space-y-3 text-gray-400">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>ERC-20 standard compliant</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Smart contract deployed on Binance Smart Chain</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Public transactions and balance verification</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-4">Network Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between pb-2 border-b border-gray-700">
                    <span className="text-gray-300">Network:</span>
                    <span className="text-gray-400">Binance Smart Chain (BSC)</span>
                  </div>
                  <div className="flex flex-col pb-2 border-b border-gray-700">
                    <span className="text-gray-300 mb-1">Contract:</span>
                    <span className="text-gray-400 text-sm break-all">0x5A170D59ae8B851DC4DD0D14cC89E5fE541752CE</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-gray-700">
                    <span className="text-gray-300">Token Standard:</span>
                    <span className="text-gray-400">BEP-20</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-gray-700">
                    <span className="text-gray-300">Decimals:</span>
                    <span className="text-gray-400">18</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Total Supply:</span>
                    <span className="text-gray-400">1,000,000,000 IASE</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <a 
                href="https://bscscan.com/token/0x5A170D59ae8B851DC4DD0D14cC89E5fE541752CE" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-primary hover:bg-primary/80 text-white font-medium rounded-lg transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View on BSCScan
              </a>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

// Add typings for the window object to include web3-related properties
declare global {
  interface Window {
    ethereum?: any;
    web3?: any;
    userAddress?: string;
    addTokenToMetaMask?: () => Promise<void>;
  }
}

export default Token;