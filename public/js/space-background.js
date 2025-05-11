/**
 * IASE Space Background Generator
 * Creates a dynamic starry background for space-themed sections
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('Space Background Generator initialized');
  
  // Check device capabilities
  const isLowPoweredDevice = () => {
    // Check if it's a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Check if it's a low-end device (approximation)
    const isLowEnd = window.navigator.hardwareConcurrency && window.navigator.hardwareConcurrency <= 2;
    
    // Small screen devices are likely to be less powerful
    const isSmallScreen = window.innerWidth < 768;
    
    return isMobile || isLowEnd || isSmallScreen;
  };
  
  // Initialize space backgrounds
  const spaceBackgrounds = document.querySelectorAll('.space-background');
  console.log('Found space backgrounds:', spaceBackgrounds.length);
  
  if (spaceBackgrounds.length > 0) {
    // Apply either simplified or full background based on device capabilities
    if (isLowPoweredDevice()) {
      console.log('Disabling parallax for space backgrounds to improve performance');
      applySimplifiedBackground(spaceBackgrounds);
    } else {
      spaceBackgrounds.forEach(createStarryBackground);
    }
    
    // Common styling for all backgrounds
    spaceBackgrounds.forEach(element => {
      element.style.cssText = `
        background: linear-gradient(125deg, #050520 0%, #0B0B30 100%) !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        z-index: -9 !important;
        pointer-events: none !important;
      `;
      
      // Ensure content is above the background
      if (element.parentElement) {
        const parentStyle = window.getComputedStyle(element.parentElement);
        if (parentStyle.position === 'static') {
          element.parentElement.style.position = 'relative';
        }
      }
    });
    
    // Add z-index to main containers for proper layering
    const mainContainers = document.querySelectorAll('.container, .content, main, section, header, footer, .hero-section, .header-content, .token-section');
    mainContainers.forEach(container => {
      container.style.position = 'relative';
      container.style.zIndex = '10';
    });
  }
  
  // Apply simplified background for low-powered devices
  function applySimplifiedBackground(elements) {
    elements.forEach(element => {
      // Add a few static stars instead of animated ones
      const staticStarCount = 15;
      for (let i = 0; i < staticStarCount; i++) {
        const star = document.createElement('div');
        star.classList.add('static-star');
        
        const size = Math.random() * 2 + 1;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.backgroundColor = '#fff';
        star.style.position = 'absolute';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.borderRadius = '50%';
        
        element.appendChild(star);
      }
    });
  }
  
  function createStarryBackground(element) {
    console.log('Creating starry background for element:', element);
    
    // Drastically reduce star count for better performance
    const starCount = window.innerWidth < 768 ? 5 : window.innerWidth < 1200 ? 10 : 15;
    
    // Clear any existing stars
    const existingStars = element.querySelectorAll('.star');
    existingStars.forEach(star => star.remove());
    
    // Generate new stars
    for (let i = 0; i < starCount; i++) {
      createStar(element);
    }
    
    // Add fog/nebula effect
    const fog = document.createElement('div');
    fog.classList.add('space-fog');
    element.appendChild(fog);
  }
  
  function createStar(container) {
    const star = document.createElement('div');
    star.classList.add('star');
    
    // Random size between 1 and 4px
    const size = Math.random() * 3 + 1;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    
    // Random position
    const xPos = Math.random() * 100;
    const yPos = Math.random() * 100;
    star.style.left = `${xPos}%`;
    star.style.top = `${yPos}%`;
    
    // Random animation duration between 3 and 6 seconds
    star.style.setProperty('--duration', `${Math.random() * 3 + 3}s`);
    
    // Random animation delay
    star.style.setProperty('--delay', `${Math.random() * 5}s`);
    
    // Add small touch of color to some stars
    if (Math.random() > 0.6) {
      const hue = Math.floor(Math.random() * 60) + 190; // Blue to purple range
      star.style.backgroundColor = `hsl(${hue}, 100%, 90%)`;
    }
    
    // Add larger, brighter stars occasionally
    if (Math.random() > 0.95) {
      star.style.width = `${size + 2}px`;
      star.style.height = `${size + 2}px`;
      star.style.boxShadow = `0 0 ${size * 2}px rgba(255, 255, 255, 0.8)`;
    }
    
    container.appendChild(star);
  }
  
  // Completely disable resize handler for maximum performance
  // Don't recreate stars on resize as it's very expensive
  // This also fixes the problem with menu opening which triggers resize events
});