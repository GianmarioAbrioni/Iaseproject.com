/**
 * IASE Interactive AI Chatbot
 * Answers user questions about the IASE project using a predefined knowledge base
 */

document.addEventListener('DOMContentLoaded', function() {
  // Knowledge base with predefined questions and answers
  const knowledgeBase = [
    {
      keywords: ['what is', 'who is', 'iase', 'project', 'about'],
      response: "IASE (Artificial Intelligence for Sustainable Energy) is an innovative project that aims to integrate artificial intelligence with blockchain technologies to optimize energy efficiency and promote sustainable solutions. The project focuses on using AI to analyze and optimize energy consumption across various sectors."
    },
    {
      keywords: ['token', 'iase token', 'crypto', 'cryptocurrency', 'buy', 'purchase'],
      response: "The IASE Token is the official cryptocurrency of the IASE project, based on the BEP-20 standard on BNB Smart Chain (address: 0x5A170D59ae8B851DC4DD0D14cC89E5fE541752CE). The token is used for governance, staking, and access to premium platform services. Token purchases will be available during sales phases outlined in the roadmap or through selected exchanges after the official listing."
    },
    {
      keywords: ['nft', 'collection', 'unit', 'units'],
      response: "The IASE NFT collection represents virtual AI units with different capabilities and rarity levels. Each NFT serves as a license to access specific features of the IASE platform and can be upgraded over time. The collection is available on Ethereum (address: 0x8792beF25cf04bD5B1B30c47F937C8e287c4e79F) and includes Standard, Advanced, and Premium units, each with different features and benefits."
    },
    {
      keywords: ['roadmap', 'development', 'phases', 'future', 'plan'],
      response: "The IASE roadmap is structured in four main phases: Phase 1 (Research & Development), Phase 2 (Implementation & TestNet), Phase 3 (MainNet Launch & Integration), Phase 4 (Global Expansion). Currently, the project is in Phase 2, with active platform development and integration of blockchain technology with AI systems for energy sustainability."
    },
    {
      keywords: ['how it works', 'function', 'technology', 'ai', 'artificial intelligence'],
      response: "IASE uses advanced machine learning and AI algorithms to analyze energy data in real-time, identify inefficiencies, and propose optimizations. This data is recorded on blockchain to ensure transparency and immutability. The system includes neural networks for energy consumption prediction and optimization algorithms to balance energy supply and demand, contributing to carbon footprint reduction."
    },
    {
      keywords: ['team', 'developers', 'founders', 'creators'],
      response: "The IASE team consists of experts in artificial intelligence, blockchain, energy sustainability, and software development. The project was founded by a group of researchers and entrepreneurs with experience in the energy and technology sectors, with the goal of applying AI to solve global sustainability challenges. The team includes machine learning specialists, blockchain developers, energy experts, and business development professionals."
    },
    {
      keywords: ['wallet', 'metamask', 'connect', 'linking'],
      response: "To interact with IASE Token and NFTs, you can use a wallet compatible with BNB Smart Chain (for the token) and Ethereum (for NFTs). MetaMask is the recommended solution. From the dashboard page, click on 'Connect Wallet' and follow the instructions to authorize the connection. Once connected, you'll be able to view your IASE token balance and your NFTs, as well as interact with the platform's features."
    },
    {
      keywords: ['web3', 'blockchain', 'decentralization', 'decentralized'],
      response: "IASE embraces the Web3 philosophy by integrating blockchain, decentralization, and token economy. The platform uses smart contracts to ensure transparency in energy transactions and reward distribution. Decentralized governance allows token holders to vote on important project decisions, while NFT ownership guarantees access to specific features in a completely decentralized ecosystem."
    },
    {
      keywords: ['sustainability', 'green', 'eco', 'environment', 'environmental', 'climate'],
      response: "Sustainability is at the core of IASE's mission. The project aims to reduce the global carbon footprint by optimizing energy consumption through AI. IASE solutions support the transition to renewable energy by analyzing consumption patterns and producing efficiency recommendations. Additionally, the project uses low-energy-consumption blockchain to minimize its own environmental impact."
    },
    {
      keywords: ['whitepaper', 'document', 'technical', 'paper'],
      response: "The IASE whitepaper is a detailed technical document that describes the project's vision, technology, and economics. It includes technical specifications, market analysis, tokenomics, and roadmap. You can download it from the 'Whitepaper' section of our website or request it directly via email to get in-depth information on the technical and business aspects of the IASE project."
    },
    {
      keywords: ['partnership', 'partners', 'collaborations', 'alliances'],
      response: "IASE has established strategic partnerships with energy companies, research institutions, and technology organizations. These collaborations allow testing and implementing IASE solutions in real-world contexts and at scale. Partners include renewable energy providers, smart grid developers, and academic institutions specializing in AI research and energy sustainability."
    }
  ];
  
  // Check if chatbot container already exists, if not create it
  if (!document.getElementById('iase-chatbot-container')) {
    createChatbotInterface();
    addChatbotStyles();
    setupChatbotListeners();
  }
  
  // Find the best response based on user input
  function findBestResponse(userInput) {
    // Normalize input (lowercase, no punctuation)
    const normalizedInput = userInput.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    
    // Calculate the match for each knowledge base item
    let bestMatch = null;
    let highestMatchScore = 0;
    
    knowledgeBase.forEach(item => {
      let matchScore = 0;
      
      // Check each keyword
      item.keywords.forEach(keyword => {
        if (normalizedInput.includes(keyword.toLowerCase())) {
          // Add score based on keyword length (longer keywords have more weight)
          matchScore += keyword.length;
        }
      });
      
      // If this item has a better score, save it
      if (matchScore > highestMatchScore) {
        highestMatchScore = matchScore;
        bestMatch = item;
      }
    });
    
    // Default responses if no match is found
    if (highestMatchScore === 0) {
      // Check if user is greeting
      if (/hello|hi|hey|good morning|good evening|greetings/i.test(normalizedInput)) {
        return "Hello! I'm the IASE virtual assistant. How can I help you today with information about the project?";
      }
      
      // Check if it's a thank you
      if (/thanks|thank you|thx/i.test(normalizedInput)) {
        return "I'm happy to be helpful! Is there anything else you'd like to know about the IASE project?";
      }
      
      // Default response for questions without a match
      return "I'm sorry, I don't have specific information on this topic. Try asking me about IASE, the token, NFTs, the roadmap, or the project's technology.";
    }
    
    return bestMatch.response;
  }
  
  // Create chatbot interface
  function createChatbotInterface() {
    const chatbotContainer = document.createElement('div');
    chatbotContainer.id = 'iase-chatbot-container';
    
    chatbotContainer.innerHTML = `
      <div class="chatbot-icon" id="chatbot-toggle">
        <i class="ri-robot-line"></i>
      </div>
      
      <div class="chatbot-panel" id="chatbot-panel">
        <div class="chatbot-header">
          <div class="chatbot-title">
            <i class="ri-robot-line mr-2"></i>
            IASE Assistant
          </div>
          <div class="chatbot-controls">
            <span id="chatbot-minimize">
              <i class="ri-subtract-line"></i>
            </span>
          </div>
        </div>
        
        <div class="chatbot-messages" id="chatbot-messages">
          <div class="message bot-message">
            <div class="message-content">
              Hello! I'm the IASE virtual assistant. Ask me about the project, token, NFTs, or roadmap.
            </div>
          </div>
        </div>
        
        <div class="chatbot-input-area">
          <input type="text" id="chatbot-input" placeholder="Type a message..." autocomplete="off">
          <button type="button" id="chatbot-send">
            <i class="ri-send-plane-fill"></i>
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(chatbotContainer);
  }
  
  // Add CSS styles for the chatbot
  function addChatbotStyles() {
    if (!document.getElementById('chatbot-styles')) {
      const style = document.createElement('style');
      style.id = 'chatbot-styles';
      
      style.innerHTML = `
        #iase-chatbot-container {
          position: fixed;
          bottom: 20px;
          left: 20px;
          z-index: 9999;
          font-family: 'Arial', sans-serif;
        }
        
        .chatbot-icon {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #00bfff, #0066cc);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 191, 255, 0.3);
          transition: all 0.3s ease;
        }
        
        .chatbot-icon:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(0, 191, 255, 0.4);
        }
        
        .chatbot-icon i {
          font-size: 28px;
          color: white;
        }
        
        .chatbot-panel {
          position: absolute;
          bottom: 70px;
          left: 0;
          width: 350px;
          height: 500px;
          background: rgba(15, 23, 42, 0.95);
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(0, 191, 255, 0.1);
          display: none;
        }
        
        .chatbot-header {
          padding: 15px;
          background: rgba(0, 191, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(0, 191, 255, 0.1);
        }
        
        .chatbot-title {
          color: white;
          font-weight: 600;
          display: flex;
          align-items: center;
        }
        
        .chatbot-title i {
          margin-right: 10px;
          color: #00bfff;
        }
        
        .chatbot-controls span {
          cursor: pointer;
          color: rgba(255, 255, 255, 0.7);
          margin-left: 10px;
          font-size: 18px;
        }
        
        .chatbot-controls span:hover {
          color: white;
        }
        
        .chatbot-messages {
          flex: 1;
          padding: 15px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .message {
          display: flex;
          flex-direction: column;
          max-width: 80%;
        }
        
        .user-message {
          align-self: flex-end;
        }
        
        .bot-message {
          align-self: flex-start;
        }
        
        .message-content {
          padding: 10px 14px;
          border-radius: 14px;
          font-size: 14px;
          line-height: 1.4;
        }
        
        .user-message .message-content {
          background: rgba(0, 191, 255, 0.3);
          color: white;
          border-bottom-right-radius: 4px;
        }
        
        .bot-message .message-content {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border-bottom-left-radius: 4px;
        }
        
        .chatbot-input-area {
          padding: 12px;
          border-top: 1px solid rgba(0, 191, 255, 0.1);
          display: flex;
          align-items: center;
        }
        
        #chatbot-input {
          flex: 1;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 20px;
          padding: 10px 15px;
          color: white;
          outline: none;
          font-size: 14px;
        }
        
        #chatbot-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }
        
        #chatbot-send {
          background: transparent;
          border: none;
          color: #00bfff;
          margin-left: 10px;
          cursor: pointer;
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
        }
        
        #chatbot-send:hover {
          transform: scale(1.1);
        }
        
        @media (max-width: 480px) {
          .chatbot-panel {
            width: 300px;
            height: 450px;
            left: 0;
          }
        }
      `;
      
      document.head.appendChild(style);
    }
  }
  
  // Set up listeners for chatbot interaction
  function setupChatbotListeners() {
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotPanel = document.getElementById('chatbot-panel');
    const chatbotMinimize = document.getElementById('chatbot-minimize');
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotSend = document.getElementById('chatbot-send');
    const chatbotMessages = document.getElementById('chatbot-messages');
    
    // Handle opening/closing the chatbot panel
    chatbotToggle.addEventListener('click', () => {
      if (chatbotPanel.style.display === 'flex') {
        chatbotPanel.style.display = 'none';
      } else {
        chatbotPanel.style.display = 'flex';
        chatbotInput.focus();
      }
    });
    
    // Handle minimizing the chatbot
    chatbotMinimize.addEventListener('click', () => {
      chatbotPanel.style.display = 'none';
    });
    
    // Handle sending a message via button click
    chatbotSend.addEventListener('click', () => {
      sendMessage();
    });
    
    // Also handle Enter key press
    chatbotInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
      }
    });
    
    // Function to send message
    function sendMessage() {
      const message = chatbotInput.value.trim();
      if (message === '') return;
      
      // Add user message
      addMessage('user', message);
      chatbotInput.value = '';
      
      // Simulate response time and respond
      setTimeout(() => {
        const response = findBestResponse(message);
        addMessage('bot', response);
        
        // Scroll to the bottom of the chat
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
      }, 500);
    }
  }
  
  // Add a message to the chat
  function addMessage(sender, text) {
    const chatbotMessages = document.getElementById('chatbot-messages');
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}-message`;
    
    messageElement.innerHTML = `
      <div class="message-content">${text}</div>
    `;
    
    chatbotMessages.appendChild(messageElement);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  }
});