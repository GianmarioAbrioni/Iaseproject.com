/**
 * Initialize the IASE chatbot on all pages 
 */

// Check if document is already loaded or wait for it
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeChatbotLoader);
} else {
  initializeChatbotLoader();
}

function initializeChatbotLoader() {
  console.log("Adding chatbot initializer script...");
  
  // Check if the chatbot script is already loaded
  if (!document.querySelector('script[src*="chatbot.js"]')) {
    loadChatbotScript();
  } else {
    console.log("Chatbot script already loaded");
  }
}

function loadChatbotScript() {
  // Create script element for chatbot
  const script = document.createElement('script');
  script.src = 'js/chatbot.js';
  script.async = true;
  
  // Handle success and error
  script.onload = function() {
    console.log("Chatbot script loaded successfully");
  };
  
  script.onerror = function() {
    console.error("Failed to load chatbot script, trying fallback paths");
    tryFallbackPaths();
  };
  
  // Add to document
  document.body.appendChild(script);
}

function tryFallbackPaths() {
  // Possible paths to try
  const paths = [
    '/js/chatbot.js',
    './js/chatbot.js',
    '../js/chatbot.js'
  ];
  
  // Try each path sequentially
  function tryNextPath(index) {
    if (index >= paths.length) {
      console.error("All fallback paths failed");
      return;
    }
    
    const script = document.createElement('script');
    script.src = paths[index];
    script.async = true;
    
    script.onload = function() {
      console.log("Chatbot loaded from fallback path: " + paths[index]);
    };
    
    script.onerror = function() {
      // Try next path
      tryNextPath(index + 1);
    };
    
    document.body.appendChild(script);
  }
  
  // Start with first fallback
  tryNextPath(0);
}

// Function to initialize chatbot directly from other scripts
function initializeChatbot() {
  if (!document.querySelector('script[src*="chatbot.js"]')) {
    loadChatbotScript();
  }
}