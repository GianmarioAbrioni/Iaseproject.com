import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface HelpTip {
  id: string;
  content: string;
  page?: string;
  section?: string; 
  position?: 'top' | 'right' | 'bottom' | 'left';
  important?: boolean;
}

// Collection of help tips for different pages and sections
const helpTips: HelpTip[] = [
  // Home page tips
  {
    id: 'home-intro',
    content: 'Welcome to IASE Project! I\'m IASEY, your AI assistant. I\'ll help you navigate our platform.',
    page: 'home',
    section: 'hero',
    important: true
  },
  {
    id: 'token-info',
    content: 'Our IASE token is built on Binance Smart Chain. You can learn about tokenomics in this section.',
    page: 'token',
    section: 'tokenomics'
  },
  {
    id: 'nft-gallery',
    content: 'Browse our exclusive NFT collection and connect your wallet to mint rare items.',
    page: 'nft',
    section: 'gallery'
  },
  {
    id: 'roadmap-navigation',
    content: 'Click on different phases to explore our project timeline and milestones.',
    page: 'roadmap',
    section: 'timeline'
  },
  {
    id: 'articles-filter',
    content: 'Use these category buttons to filter articles by topic.',
    page: 'articles',
    section: 'filter'
  },
  {
    id: 'contacts-form',
    content: 'Got questions? Fill out this form and we\'ll get back to you as soon as possible!',
    page: 'contact',
    section: 'form'
  },
  {
    id: 'web3-connection',
    content: 'Connect your Web3 wallet here to interact with our smart contracts.',
    page: 'web3',
    section: 'connect'
  }
];

interface AIMascotProps {
  currentPage?: string;
  currentSection?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  autoShowDelay?: number; // milliseconds
  alwaysShow?: boolean;
}

const AIMascot: React.FC<AIMascotProps> = ({
  currentPage,
  currentSection,
  position = 'bottom-right',
  autoShowDelay = 3000, // Show after 3 seconds by default
  alwaysShow = false
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentTip, setCurrentTip] = useState<HelpTip | null>(null);
  const [hasBeenSeen, setHasBeenSeen] = useState<Record<string, boolean>>({});
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // Find relevant tips for current page/section
  useEffect(() => {
    if (!currentPage) return;
    
    const relevantTips = helpTips.filter(tip => 
      tip.page === currentPage && 
      (!tip.section || tip.section === currentSection) && 
      (!hasBeenSeen[tip.id] || tip.important)
    );
    
    if (relevantTips.length > 0) {
      // Select random tip from relevant tips
      const tip = relevantTips[Math.floor(Math.random() * relevantTips.length)];
      setCurrentTip(tip);
      
      // Auto show after delay if not minimized
      if (!isMinimized && (alwaysShow || !hasBeenSeen[tip.id])) {
        const timer = setTimeout(() => {
          setIsOpen(true);
          // Mark as seen
          setHasBeenSeen(prev => ({...prev, [tip.id]: true}));
        }, autoShowDelay);
        
        return () => clearTimeout(timer);
      }
    } else {
      setCurrentTip(null);
    }
  }, [currentPage, currentSection, hasBeenSeen, isMinimized, alwaysShow, autoShowDelay]);

  // Get position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-right':
        return 'bottom-6 right-6';
      case 'bottom-left':
        return 'bottom-6 left-6';
      case 'top-right':
        return 'top-24 right-6';
      case 'top-left':
        return 'top-24 left-6';
      default:
        return 'bottom-6 right-6';
    }
  };

  // Toggle visibility of help bubble
  const toggleHelp = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  // Minimize bubble without closing it completely
  const minimizeBubble = () => {
    setIsOpen(false);
    setIsMinimized(true);
  };

  return (
    <div className={`fixed ${getPositionClasses()} z-50`}>
      {/* Mascot button */}
      <motion.button
        onClick={toggleHelp}
        className="relative flex items-center justify-center w-14 h-14 rounded-full bg-primary shadow-lg hover:shadow-xl transition-all duration-300"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {/* AI mascot face/icon */}
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 64 64" 
            className="w-8 h-8"
          >
            {/* Eyes */}
            <circle cx="24" cy="26" r="4" fill="#333" />
            <circle cx="40" cy="26" r="4" fill="#333" />
            
            {/* Smile */}
            <path 
              d="M20 38 Q32 48 44 38" 
              fill="none" 
              stroke="#333" 
              strokeWidth="2.5" 
              strokeLinecap="round"
            />
            
            {/* Antenna */}
            <line 
              x1="32" y1="18" x2="32" y2="8" 
              stroke="#333" 
              strokeWidth="2" 
              strokeLinecap="round"
            />
            <circle cx="32" cy="6" r="2" fill="#ff5500" />
          </svg>
        </div>
        
        {/* Notification dot for unread tips */}
        {currentTip && !isOpen && !isMinimized && (
          <motion.div 
            className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
      </motion.button>
      
      {/* Help bubble */}
      <AnimatePresence>
        {isOpen && currentTip && (
          <motion.div 
            className={`absolute ${
              position.includes('bottom') ? 'bottom-16' : 'top-16'
            } ${
              position.includes('right') ? 'right-0' : 'left-0'
            } bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 max-w-xs`}
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 500, damping: 40 }}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 64 64" 
                    className="w-6 h-6"
                  >
                    <circle cx="24" cy="26" r="3" fill="#333" />
                    <circle cx="40" cy="26" r="3" fill="#333" />
                    <path 
                      d="M20 38 Q32 48 44 38" 
                      fill="none" 
                      stroke="#333" 
                      strokeWidth="2" 
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-800 dark:text-white">IASEY</h3>
              </div>
              
              <div className="flex gap-1">
                <button 
                  onClick={minimizeBubble}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  aria-label="Minimize"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  aria-label="Close"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="text-gray-700 dark:text-gray-200 text-sm">
              {currentTip.content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIMascot;