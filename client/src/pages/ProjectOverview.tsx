import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import ProjectMenu from '@/components/ProjectMenu';

export default function ProjectOverview() {
  useEffect(() => {
    document.title = "IASE Project - Overview";
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Helmet>
        <title>IASE Project - Overview</title>
        <meta name="description" content="Learn about the IASE Project: technical architecture, governance structure, and the vision for autonomous space entities." />
      </Helmet>
      
      <main className="container mx-auto px-4 py-8">
        {/* Project Overview Hero */}
        <section className="py-8 md:py-12 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">Project Overview</h1>
            <p className="text-xl text-gray-300 mb-8">
              Technical documentation and architectural insights into the IASE ecosystem
            </p>
          </div>
        </section>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar Menu */}
          <div className="md:col-span-1">
            <div className="sticky top-24">
              <ProjectMenu />
            </div>
          </div>
          
          {/* Main Content */}
          <div className="md:col-span-3">
            {/* Technical Architecture */}
            <section className="py-8 md:py-12">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl md:text-3xl font-bold text-primary mb-8">Technical Architecture</h2>
                
                <div className="bg-card p-6 md:p-8 rounded-xl shadow-lg mb-12">
                  <h3 className="text-xl font-semibold text-primary mb-4">Core Components</h3>
                  <p className="text-gray-300 mb-6">
                    The IASE Project is built on a multi-layered technology stack that combines blockchain infrastructure, AI systems, and space-based computational frameworks. The architecture includes:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="border border-primary/30 rounded-lg p-4">
                      <h4 className="text-lg font-medium text-primary mb-2">Blockchain Layer</h4>
                      <ul className="space-y-2 text-gray-400">
                        <li className="flex items-start">
                          <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Smart contract infrastructure (Ethereum & BSC)</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Token and NFT management systems</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Governance mechanisms and voting systems</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="border border-primary/30 rounded-lg p-4">
                      <h4 className="text-lg font-medium text-primary mb-2">AI Framework</h4>
                      <ul className="space-y-2 text-gray-400">
                        <li className="flex items-start">
                          <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Distributed decision-making algorithms</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Multi-agent simulation environments</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Self-learning optimization systems</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="border border-primary/30 rounded-lg p-4">
                      <h4 className="text-lg font-medium text-primary mb-2">Space Integration</h4>
                      <ul className="space-y-2 text-gray-400">
                        <li className="flex items-start">
                          <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Space-resilient computation models</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Radiation-hardened protocol designs</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Latency-tolerant data synchronization</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="border border-primary/30 rounded-lg p-4">
                      <h4 className="text-lg font-medium text-primary mb-2">User Interface</h4>
                      <ul className="space-y-2 text-gray-400">
                        <li className="flex items-start">
                          <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Dashboard for entity monitoring</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Staking and governance interfaces</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Simulation visualization tools</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-primary mb-4">System Architecture Diagram</h3>
                  <div className="p-4 bg-muted rounded-lg mb-6">
                    <div className="grid grid-cols-3 gap-4 text-center text-sm">
                      <div className="col-span-3 bg-gradient-to-r from-primary/20 to-primary/10 p-3 rounded-lg">
                        <strong className="text-primary">User Interface Layer</strong>
                      </div>
                      
                      <div className="bg-gradient-to-r from-blue-900/30 to-blue-900/10 p-3 rounded-lg">
                        <strong className="text-blue-400">Blockchain Components</strong>
                        <div className="mt-2 space-y-1 text-gray-400">
                          <div>Token System</div>
                          <div>NFT Framework</div>
                          <div>Governance</div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-green-900/30 to-green-900/10 p-3 rounded-lg">
                        <strong className="text-green-400">AI Components</strong>
                        <div className="mt-2 space-y-1 text-gray-400">
                          <div>Decision Engines</div>
                          <div>Learning Systems</div>
                          <div>Simulation Env</div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-amber-900/30 to-amber-900/10 p-3 rounded-lg">
                        <strong className="text-amber-400">Space Systems</strong>
                        <div className="mt-2 space-y-1 text-gray-400">
                          <div>Resilient Protocols</div>
                          <div>Distributed Consensus</div>
                          <div>Fault Tolerance</div>
                        </div>
                      </div>
                      
                      <div className="col-span-3 bg-gradient-to-r from-gray-800/50 to-gray-800/30 p-3 rounded-lg">
                        <strong className="text-gray-300">Core Infrastructure Layer</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            
            {/* Governance Structure */}
            <section className="py-8 md:py-12 bg-card rounded-xl shadow-lg mb-12">
              <div className="max-w-4xl mx-auto px-4">
                <h2 className="text-2xl md:text-3xl font-bold text-primary text-center mb-8">
                  Governance Structure
                </h2>
                
                <p className="text-gray-300 mb-8">
                  The IASE ecosystem employs a multi-tiered governance structure that combines token-based voting with NFT-enhanced privileges, creating a balanced decision-making framework.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="p-6 bg-muted rounded-lg">
                    <h3 className="text-xl font-semibold text-primary mb-4">Token-Based Voting</h3>
                    <ul className="space-y-3 text-gray-400">
                      <li className="flex items-start">
                        <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>1000+ IASE = 1 vote for general governance proposals</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Quadratic voting mechanism to prevent whale domination</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Token staking required for proposal submission</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Time-locked voting periods for major decisions</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="p-6 bg-muted rounded-lg">
                    <h3 className="text-xl font-semibold text-primary mb-4">NFT-Enhanced Privileges</h3>
                    <ul className="space-y-3 text-gray-400">
                      <li className="flex items-start">
                        <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Technical Committee NFTs grant protocol parameter adjustment rights</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Early access to simulations and beta features</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Higher weight in certain governance votes</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="h-5 w-5 mr-2 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Priority queue for entity naming rights</span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="bg-muted rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-primary mb-4">Governance Flow</h3>
                  <div className="relative">
                    <div className="absolute top-0 bottom-0 left-10 border-l-2 border-dashed border-primary/30"></div>
                    
                    <div className="mb-8 ml-20 relative">
                      <div className="absolute -left-10 top-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">1</div>
                      <h4 className="text-lg font-medium text-primary mb-2">Proposal Submission</h4>
                      <p className="text-gray-400">
                        Token holders stake a minimum amount and submit formal proposals for review.
                      </p>
                    </div>
                    
                    <div className="mb-8 ml-20 relative">
                      <div className="absolute -left-10 top-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">2</div>
                      <h4 className="text-lg font-medium text-primary mb-2">Discussion Period</h4>
                      <p className="text-gray-400">
                        A 7-day discussion period follows where the community can debate the proposal in forums.
                      </p>
                    </div>
                    
                    <div className="mb-8 ml-20 relative">
                      <div className="absolute -left-10 top-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">3</div>
                      <h4 className="text-lg font-medium text-primary mb-2">Voting Phase</h4>
                      <p className="text-gray-400">
                        Eligible voters cast ballots through the governance portal over a 5-day period.
                      </p>
                    </div>
                    
                    <div className="mb-8 ml-20 relative">
                      <div className="absolute -left-10 top-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">4</div>
                      <h4 className="text-lg font-medium text-primary mb-2">Technical Review</h4>
                      <p className="text-gray-400">
                        Approved proposals are assessed by NFT holders for technical feasibility.
                      </p>
                    </div>
                    
                    <div className="ml-20 relative">
                      <div className="absolute -left-10 top-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">5</div>
                      <h4 className="text-lg font-medium text-primary mb-2">Implementation</h4>
                      <p className="text-gray-400">
                        Successful proposals are programmatically executed through smart contracts.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            
            {/* Documentation Resources */}
            <section className="py-8 md:py-12">
              <h2 className="text-2xl md:text-3xl font-bold text-primary text-center mb-12">
                Documentation Resources
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {/* Card 1 */}
                <a 
                  href="/behind" 
                  className="group bg-card rounded-xl overflow-hidden shadow-lg transition-all hover:shadow-xl hover:transform hover:-translate-y-1"
                >
                  <div className="h-48 bg-gradient-to-br from-blue-900/40 to-indigo-900/40 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-primary/50 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-primary mb-2">Behind IASE</h3>
                    <p className="text-gray-400 mb-4">
                      Learn about the origin story, vision, and people behind the IASE Project and its development.
                    </p>
                    <div className="flex items-center text-primary">
                      <span>Read More</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </a>
                
                {/* Card 2 */}
                <a 
                  href="/technology" 
                  className="group bg-card rounded-xl overflow-hidden shadow-lg transition-all hover:shadow-xl hover:transform hover:-translate-y-1"
                >
                  <div className="h-48 bg-gradient-to-br from-green-900/40 to-teal-900/40 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-primary/50 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-primary mb-2">Technology &amp; Applications</h3>
                    <p className="text-gray-400 mb-4">
                      Explore the core technologies, scientific foundations, and real-world applications of IASE systems.
                    </p>
                    <div className="flex items-center text-primary">
                      <span>View Details</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </a>
                
                {/* Card 3 */}
                <a 
                  href="/token" 
                  className="group bg-card rounded-xl overflow-hidden shadow-lg transition-all hover:shadow-xl hover:transform hover:-translate-y-1"
                >
                  <div className="h-48 bg-gradient-to-br from-amber-900/40 to-yellow-900/40 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-primary/50 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-primary mb-2">IASE Token</h3>
                    <p className="text-gray-400 mb-4">
                      Understand the IASE token economics, distribution, utility, and governance functionality.
                    </p>
                    <div className="flex items-center text-primary">
                      <span>Token Details</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </a>
                
                {/* Card 4 */}
                <a 
                  href="/nft" 
                  className="group bg-card rounded-xl overflow-hidden shadow-lg transition-all hover:shadow-xl hover:transform hover:-translate-y-1"
                >
                  <div className="h-48 bg-gradient-to-br from-pink-900/40 to-red-900/40 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-primary/50 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-primary mb-2">NFT Collection</h3>
                    <p className="text-gray-400 mb-4">
                      Discover the IASE NFT collection, their utility in the ecosystem, and special governance powers.
                    </p>
                    <div className="flex items-center text-primary">
                      <span>Explore NFTs</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </a>
                
                {/* Card 5 */}
                <a 
                  href="/roadmap" 
                  className="group bg-card rounded-xl overflow-hidden shadow-lg transition-all hover:shadow-xl hover:transform hover:-translate-y-1"
                >
                  <div className="h-48 bg-gradient-to-br from-cyan-900/40 to-blue-900/40 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-primary/50 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-primary mb-2">Project Roadmap</h3>
                    <p className="text-gray-400 mb-4">
                      Detailed timeline of the IASE Project development phases, milestones, and future strategic initiatives.
                    </p>
                    <div className="flex items-center text-primary">
                      <span>View Roadmap</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </a>
                
                {/* Card 6 */}
                <a 
                  href="/articles" 
                  className="group bg-card rounded-xl overflow-hidden shadow-lg transition-all hover:shadow-xl hover:transform hover:-translate-y-1"
                >
                  <div className="h-48 bg-gradient-to-br from-purple-900/40 to-pink-900/40 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-primary/50 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-primary mb-2">Articles &amp; Medium Posts</h3>
                    <p className="text-gray-400 mb-4">
                      Read our latest articles, updates, and technical insights on the IASE Project and autonomous space technologies.
                    </p>
                    <div className="flex items-center text-primary">
                      <span>Read Articles</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </a>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}