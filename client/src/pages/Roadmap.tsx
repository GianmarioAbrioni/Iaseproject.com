import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { usePageContext } from '@/App';

// Define roadmap data structure to make it more maintainable
interface Milestone {
  title: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  description: string;
}

interface Phase {
  id: number;
  title: string;
  period: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  milestones: Milestone[];
}

export default function Roadmap() {
  const [activePhase, setActivePhase] = useState<number>(0);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const { setCurrentSection } = usePageContext();

  // Check if viewport is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Set current section for the AI helper
  useEffect(() => {
    setCurrentSection('timeline');
    
    return () => {
      setCurrentSection('');
    };
  }, [setCurrentSection]);

  useEffect(() => {
    // Set page title and description
    document.title = "IASE Project - Roadmap";
    const metaDescription = document.createElement('meta');
    metaDescription.name = 'description';
    metaDescription.content = 'IASE Project development roadmap and milestones: explore our timeline from foundation to deployment.';
    document.head.appendChild(metaDescription);
    
    // Clean up function
    return () => {
      const existingMeta = document.querySelector('meta[name="description"]');
      if (existingMeta) document.head.removeChild(existingMeta);
    };
  }, []);

  // Roadmap data - preserving all original content
  const roadmap: Phase[] = [
    {
      id: 1,
      title: "Foundation",
      period: "Q1-Q2 2023",
      status: "completed",
      milestones: [
        {
          title: "Concept development and whitepaper",
          status: "completed",
          description: "Initial conceptualization and publication of the IASE whitepaper outlining the project vision and tokenomics."
        },
        {
          title: "Initial smart contract deployment",
          status: "completed",
          description: "Development and deployment of the IASE token smart contract on the Binance Smart Chain."
        },
        {
          title: "Community building",
          status: "completed",
          description: "Launch of community channels and initial growth of the IASE ecosystem supporters."
        },
        {
          title: "Release of IASE token on Binance Smart Chain",
          status: "completed",
          description: "Official token launch and initial token distribution according to the tokenomics plan."
        }
      ]
    },
    {
      id: 2,
      title: "Expansion",
      period: "Q3-Q4 2023",
      status: "in-progress",
      milestones: [
        {
          title: "NFT collection launch",
          status: "completed",
          description: "Release of the first IASE NFT collection with utility within the ecosystem."
        },
        {
          title: "Staking platform development",
          status: "in-progress",
          description: "Creation of staking mechanisms to support token utility and reward community participation."
        },
        {
          title: "Strategic partnerships",
          status: "completed",
          description: "Establishment of key partnerships to expand the IASE ecosystem and technology integration."
        },
        {
          title: "Initial AI simulation prototype",
          status: "in-progress",
          description: "Development of the first prototype for AI-driven simulation within the IASE framework."
        }
      ]
    },
    {
      id: 3,
      title: "Innovation",
      period: "Q1-Q2 2024",
      status: "upcoming",
      milestones: [
        {
          title: "DAO governance implementation",
          status: "upcoming",
          description: "Launch of the decentralized governance platform for community-driven decision making."
        },
        {
          title: "Decentralized autonomous network testnet",
          status: "upcoming",
          description: "Testing environment for the core autonomous network technology."
        },
        {
          title: "Integration with space industry partners",
          status: "upcoming",
          description: "Establishing technical partnerships with space industry entities for real-world applications."
        },
        {
          title: "Full staking platform with NFT integration",
          status: "upcoming",
          description: "Enhanced staking platform with integrated NFT features and benefits."
        }
      ]
    },
    {
      id: 4,
      title: "Deployment",
      period: "Q3-Q4 2024 and beyond",
      status: "upcoming",
      milestones: [
        {
          title: "Launch of fully functional autonomous space entity network",
          status: "upcoming",
          description: "Deployment of the complete IASE network with all core functionalities operational."
        },
        {
          title: "Application deployment across various sectors",
          status: "upcoming",
          description: "Expanding IASE technology applications to multiple sectors beyond space exploration."
        },
        {
          title: "Expanded ecosystem through partnerships",
          status: "upcoming",
          description: "Growth of the ecosystem through strategic alliances and technology integrations."
        },
        {
          title: "Scaling and further decentralization initiatives",
          status: "upcoming",
          description: "Enhanced scalability solutions and increased decentralization of the IASE network."
        }
      ]
    }
  ];

  // Get status icon component based on status string
  const getStatusIcon = (status: 'completed' | 'in-progress' | 'upcoming') => {
    switch (status) {
      case 'completed':
        return <span className="text-green-400 mr-2">✓</span>;
      case 'in-progress':
        return <span className="text-cyan-400 mr-2">→</span>;
      case 'upcoming':
        return <span className="text-gray-400 mr-2">○</span>;
      default:
        return null;
    }
  };

  // Get background color based on phase status
  const getPhaseColor = (status: 'completed' | 'in-progress' | 'upcoming', isActive: boolean) => {
    if (isActive) {
      return 'bg-primary';
    }
    
    switch (status) {
      case 'completed':
        return 'bg-primary';
      case 'in-progress':
        return 'bg-primary/70';
      case 'upcoming':
        return 'bg-primary/40';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pt-20">
        <section className="py-8 md:py-12 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-primary mb-4">Project Roadmap</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            The IASE Project is evolving through strategic phases, from foundation to full deployment.
            Explore our journey and upcoming milestones below.
          </p>
        </section>
        
        {/* Horizontal timeline navigation for all screen sizes */}
        <div className="max-w-6xl mx-auto mb-12">
          <div className="flex justify-between items-center relative mb-4">
            {/* Connection line */}
            <div className="absolute h-1 bg-gray-700 left-0 right-0 top-1/2 transform -translate-y-1/2"></div>
            
            {/* Phase nodes */}
            {roadmap.map((phase, index) => (
              <motion.div 
                key={phase.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.15 }}
                className="relative z-10"
              >
                <button
                  onClick={() => setActivePhase(index)}
                  className={`relative flex flex-col items-center group ${activePhase === index ? 'scale-110' : ''}`}
                >
                  <div 
                    className={`w-14 h-14 rounded-full ${getPhaseColor(phase.status, activePhase === index)} flex items-center justify-center transition-all duration-300 shadow-lg
                      ${activePhase === index ? 'ring-4 ring-primary/30' : 'hover:ring-2 hover:ring-primary/20'}`}
                  >
                    <span className="text-white font-bold text-lg">{phase.id}</span>
                  </div>
                  
                  <span className={`text-sm mt-2 font-medium transition-colors duration-300 
                    ${activePhase === index ? 'text-primary' : 'text-gray-400 group-hover:text-gray-300'}`}
                  >
                    {phase.title}
                  </span>
                  
                  <span className={`text-xs mt-1 transition-colors duration-300
                    ${activePhase === index ? 'text-gray-300' : 'text-gray-500 group-hover:text-gray-400'}`}
                  >
                    {phase.period}
                  </span>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Active phase content */}
        <div className="max-w-4xl mx-auto mb-16">
          <motion.div
            key={activePhase} // Change key to trigger animation on phase change
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-b from-card/80 to-card/40 rounded-xl p-8 shadow-xl backdrop-blur-sm"
          >
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  Phase {roadmap[activePhase].id}: {roadmap[activePhase].title}
                </h2>
                <p className="text-gray-300 text-lg">{roadmap[activePhase].period}</p>
              </div>
              
              <div className="mt-4 md:mt-0">
                <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium
                  ${roadmap[activePhase].status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    roadmap[activePhase].status === 'in-progress' ? 'bg-cyan-500/20 text-cyan-400' :
                    'bg-gray-500/20 text-gray-400'}`
                }>
                  {roadmap[activePhase].status === 'completed' ? 'Completed' :
                   roadmap[activePhase].status === 'in-progress' ? 'In Progress' :
                   'Upcoming'}
                </span>
              </div>
            </div>
            
            <div className="space-y-6">
              {roadmap[activePhase].milestones.map((milestone, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`p-5 rounded-lg border transition-all
                    ${milestone.status === 'completed' ? 'border-green-500/30 bg-green-500/5' :
                      milestone.status === 'in-progress' ? 'border-cyan-500/30 bg-cyan-500/5' :
                      'border-gray-700 bg-gray-800/30'}`
                  }
                >
                  <div className="flex items-start">
                    <div className="shrink-0 mt-1">
                      {getStatusIcon(milestone.status)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1.5">{milestone.title}</h3>
                      <p className="text-gray-400">{milestone.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
        
        {/* Statistics section */}
        <section className="max-w-5xl mx-auto mb-16 grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { value: "4", label: "Phases", icon: "🔄" },
            { value: "16", label: "Milestones", icon: "🎯" },
            { value: "8", label: "Completed Tasks", icon: "✅" },
            { value: "Q4 2024", label: "Target Completion", icon: "🏁" }
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-card rounded-xl p-6 text-center shadow-lg"
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
              <div className="text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </section>
        
        {/* Call to action */}
        <section className="max-w-4xl mx-auto mt-8 mb-16 text-center">
          <div className="bg-gradient-to-r from-primary/20 to-primary/5 rounded-xl p-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Join the IASE Ecosystem</h2>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              Be part of this revolutionary project bridging AI, space exploration, and decentralized technologies.
              Join our community to stay updated on our progress and upcoming milestones.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a 
                href="https://t.me/IASEtoken" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-primary hover:bg-primary/80 text-white font-medium rounded-lg transition-all shadow-lg gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                Join Our Community
              </a>
              <a 
                href="https://articles.iaseproject.com" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-card hover:bg-card-foreground/10 text-white font-medium rounded-lg transition-all shadow-lg border border-primary/20 gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                Read Our Blog
              </a>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}