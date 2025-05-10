import { useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const NFT = () => {
  useEffect(() => {
    // Set page title and description
    document.title = "IASE Project - NFT Collection";
    const metaDescription = document.createElement('meta');
    metaDescription.name = 'description';
    metaDescription.content = 'Explore the IASE Units NFT Collection: staking, governance, rarity tiers and AI simulation boosters.';
    document.head.appendChild(metaDescription);
    
    // Clean up function
    return () => {
      const existingMeta = document.querySelector('meta[name="description"]');
      if (existingMeta) document.head.removeChild(existingMeta);
    };
  }, []);
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* NFT Hero */}
        <section className="py-8 md:py-12 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">IASE Units – NFT Collection</h1>
            <p className="text-xl text-gray-300 mb-4">
              Ethereum NFTs with utility: staking, governance, AI boosters and rarity-based traits.
            </p>
            <div className="inline-block bg-green-900/30 text-green-400 font-medium px-4 py-2 rounded-full mb-8">
              <span className="mr-2">🔥</span> Mint Live Now! <span className="ml-2">🔥</span>
            </div>
          </div>
        </section>
        
        {/* Collection Overview */}
        <section className="py-8 md:py-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-8">Collection Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="bg-card p-6 rounded-lg shadow-lg">
                <p className="text-gray-300 mb-4">
                  IASE Units represent the virtual infrastructure components of our decentralized autonomous space network. Each unit belongs to a rarity tier and includes unique characteristics such as:
                </p>
                
                <ul className="space-y-2 text-gray-400">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Computational capabilities</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Staking power multipliers</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Special governance rights</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>AI simulation integration layers</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-card p-6 rounded-lg shadow-lg">
                <p className="text-gray-300 mb-4">
                  The IASE Units NFT collection includes four rarity levels, each with its own percentage and functional privileges:
                </p>
                
                <ul className="space-y-3 mb-4">
                  <li className="bg-gradient-to-r from-blue-900/40 to-blue-900/20 p-3 rounded-lg">
                    <strong className="text-blue-400">Standard</strong> – 52.47% – Base access, staking enabled
                  </li>
                  <li className="bg-gradient-to-r from-purple-900/40 to-purple-900/20 p-3 rounded-lg">
                    <strong className="text-purple-400">Advanced</strong> – 26.73% – Enhanced staking, early AI dashboard features
                  </li>
                  <li className="bg-gradient-to-r from-amber-900/40 to-amber-900/20 p-3 rounded-lg">
                    <strong className="text-amber-400">Elite</strong> – 15.40% – Higher staking multipliers, access to experimental boosters
                  </li>
                  <li className="bg-gradient-to-r from-green-900/40 to-green-900/20 p-3 rounded-lg">
                    <strong className="text-green-400">Prototype (Legendary)</strong> – 5.40% – Exclusive governance rights, rare trait combinations, top-tier rewards
                  </li>
                </ul>
                
                <p className="text-gray-400">
                  These rarity levels influence both the staking power and the AI simulation integration layer of each unit.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Mint Function */}
        <section className="py-8 md:py-12 bg-card rounded-xl shadow-lg mb-12">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-primary text-center mb-6">
              Mint Function
            </h2>
            <p className="text-center mb-8">
              The official mint is live. Click the button below to mint your IASE Unit directly on Ethereum:
            </p>
            
            <div className="flex justify-center">
              <a 
                href="https://app.manifold.xyz/c/iase-units-series-1" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-[#00bfff] hover:bg-[#00a0dd] text-white font-bold rounded-lg transition-all"
              >
                Mint IASE Unit
              </a>
            </div>
          </div>
        </section>
        
        {/* NFT Utility */}
        <section className="py-8 md:py-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-8">NFT Utility</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="bg-card p-6 rounded-lg shadow-lg relative overflow-hidden">
                <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold py-1 px-3 rotate-12 shadow-lg">
                  COMING SOON
                </div>
                <h3 className="text-xl font-semibold text-primary mb-4">Staking Integration</h3>
                <p className="text-gray-300 mb-4">
                  IASE Units holders will soon be able to stake their NFTs to earn enhanced rewards in the ecosystem:
                </p>
                <ul className="space-y-2 text-gray-400">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Rarity-based multipliers affecting token yield</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Compound staking with multiple units</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Time-based staking bonuses for long-term holders</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-card p-6 rounded-lg shadow-lg relative overflow-hidden">
                <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold py-1 px-3 rotate-12 shadow-lg">
                  FUTURE FEATURE
                </div>
                <h3 className="text-xl font-semibold text-primary mb-4">Governance Access</h3>
                <p className="text-gray-300 mb-4">
                  Holding IASE Units will provide governance rights, weighted by rarity:
                </p>
                <ul className="space-y-2 text-gray-400">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Voting on technological implementations</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Proposal privileges for higher rarity tiers</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Access to ecosystem development priority votes</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-card p-6 rounded-lg shadow-lg relative overflow-hidden">
                <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold py-1 px-3 rotate-12 shadow-lg">
                  FUTURE FEATURE
                </div>
                <h3 className="text-xl font-semibold text-primary mb-4">AI Network Boosters</h3>
                <p className="text-gray-300 mb-4">
                  IASE Units will serve as infrastructure elements in our AI simulation framework:
                </p>
                <ul className="space-y-2 text-gray-400">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Enhanced simulation parameters based on rarity</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Special access to AI training capabilities</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Priority resource allocation in compute-intensive operations</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-card p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold text-primary mb-4">Digital Art & Identity</h3>
                <p className="text-gray-300 mb-4">
                  Beyond utility, IASE Units serve as digital identity markers:
                </p>
                <ul className="space-y-2 text-gray-400">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Unique digital artwork with procedurally generated traits</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Special status in community channels and discussions</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Future simulation environment integration</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        
        {/* Marketplace Links */}
        <section className="py-8 md:py-12 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-8">
              View Collection on Marketplaces
            </h2>
            <p className="mb-8 text-lg">
              The official IASE Units collection is available on leading NFT marketplaces.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <a 
                href="https://opensea.io/collection/iase-units-series-1" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-[#1868b7] hover:bg-[#1868b7]/80 text-white font-bold rounded-lg transition-all"
              >
                View on OpenSea
              </a>
              
              <a 
                href="https://rarible.com/iase-units-series-1/items" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-[#feda03] hover:bg-[#feda03]/80 text-black font-bold rounded-lg transition-all"
              >
                View on Rarible
              </a>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default NFT;