/**
 * Enhanced Parallax Effects for IASE Website
 * Applies parallax effects to elements with data-parallax attribute
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('Parallax script initialized');
  
  // Check for device performance capabilities
  const isLowPowerDevice = () => {
    // Check if it's a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    // Check if it's a low-end device
    const isLowEnd = window.navigator.hardwareConcurrency && window.navigator.hardwareConcurrency <= 2;
    // Detect battery saving mode indirectly
    const batteryAPI = navigator.getBattery && typeof navigator.getBattery === 'function';
    // Small screen likely means mobile device with less power
    const isSmallScreen = window.innerWidth < 768;
    
    return isMobile || isLowEnd || isSmallScreen;
  };
  
  // Only apply full parallax effects on desktop devices with good performance
  const isHighPerformanceDevice = !isLowPowerDevice() && window.innerWidth >= 992;
  const parallaxElements = document.querySelectorAll('[data-parallax]');
  const floatingElements = document.querySelectorAll('.floating');
  const spaceBackgrounds = document.querySelectorAll('.space-background');
  
  console.log('Found parallax elements:', parallaxElements.length);
  console.log('Found floating elements:', floatingElements.length);

  // Remove parallax from space backgrounds since it causes visual issues
  if (spaceBackgrounds.length > 0) {
    console.log('Disabling parallax for space backgrounds to improve performance');
    // We're not adding scroll event listeners for space backgrounds anymore
    // This will prevent the border movement issue
  }
  
  // Initialize floating elements
  initFloatingElements();
  
  // Disable mouse move parallax for better performance
  const tokensAndNftCards = document.querySelectorAll('.token-preview-card, .nft-card');
  if (false) { // Disable this effect completely
    console.log('Enabling optimized mouse parallax for token and NFT cards');
    
    // Throttle function to limit how often the mousemove callback runs
    // This greatly improves performance
    function throttle(callback, delay) {
      let lastTime = 0;
      return function(e) {
        const now = Date.now();
        if (now - lastTime >= delay) {
          callback(e);
          lastTime = now;
        }
      };
    }
    
    // Store the current mouse position
    let mouseX = 0, mouseY = 0;
    
    // Handle mouse move with throttling (33ms = roughly 30fps, much more efficient)
    document.addEventListener('mousemove', throttle(function(e) {
      mouseX = e.clientX / window.innerWidth - 0.5;
      mouseY = e.clientY / window.innerHeight - 0.5;
      
      // Process only cards that are in viewport for better performance
      const visibleCards = Array.from(tokensAndNftCards).filter(isElementInViewport);
      
      // Only process at most 3 cards at a time for performance
      const cardsToProcess = visibleCards.slice(0, 3);
      
      cardsToProcess.forEach(function(card) {
        // Simpler tilt calculation without distance checks for better performance
        const tiltStrength = card.classList.contains('nft-card') ? 2 : 5; // Reduced tilt
        const tiltX = mouseY * tiltStrength;
        const tiltY = -mouseX * tiltStrength;
        
        card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
      });
    }, 33));
    
    // Reset all cards on mouse leave
    document.addEventListener('mouseleave', function() {
      tokensAndNftCards.forEach(function(card) {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
      });
    });
  }
  
  // Helper function to check if an element is visible in the viewport
  function isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.bottom >= 0 &&
      rect.left <= (window.innerWidth || document.documentElement.clientWidth) &&
      rect.right >= 0
    );
  }
  
  // Disable scroll-based parallax effects for maximum performance
  if (false) {
    // Throttled scroll handler - disabled for performance
    const throttledScroll = throttle(function() {
      requestTick();
    }, 100);
    
    // Disabled scroll listener
    // window.addEventListener('scroll', throttledScroll);
    
    // No initial positioning
  } else if (parallaxElements.length > 0) {
    // For low performance devices, just add a small static offset but no scroll listener
    console.log('Using lightweight static parallax for low-performance devices');
    parallaxElements.forEach(element => {
      const direction = element.getAttribute('data-direction') || 'up';
      const staticOffset = (direction === 'up' || direction === 'down') ? '5px' : '3px';
      
      if (direction === 'up') {
        element.style.transform = `translateY(-${staticOffset})`;
      } else if (direction === 'down') {
        element.style.transform = `translateY(${staticOffset})`;
      } else if (direction === 'left') {
        element.style.transform = `translateX(-${staticOffset})`;
      } else if (direction === 'right') {
        element.style.transform = `translateX(${staticOffset})`;
      }
    });
  }
  
  // Track animation frame state
  let ticking = false;
  
  function requestTick() {
    if (!ticking) {
      window.requestAnimationFrame(function() {
        positionParallaxElements();
        ticking = false;
      });
      ticking = true;
    }
  }
  
  function positionParallaxElements() {
    const windowHeight = window.innerHeight;
    
    // Get only visible elements for better performance - process max 10 elements
    const visibleElements = Array.from(parallaxElements)
      .filter(element => {
        const rect = element.getBoundingClientRect();
        return rect.top < windowHeight && rect.bottom > 0;
      })
      .slice(0, 10); // Process at most 10 elements for better performance
    
    visibleElements.forEach(function(element) {
      // Get element position
      const rect = element.getBoundingClientRect();
      
      // Calculate how far the element is from the center of the viewport
      const distanceFromCenter = (windowHeight / 2) - (rect.top + rect.height / 2);
      
      // Get parallax rate from attribute or default
      // Reduced parallax rates for better performance
      const baseRate = parseFloat(element.getAttribute('data-parallax') || 0.1);
      const parallaxRate = Math.min(baseRate, 0.1); // Cap the maximum rate for performance
      const direction = element.getAttribute('data-direction') || 'up';
      
      // Calculate offset based on position in viewport
      let offset = distanceFromCenter * parallaxRate;
      
      // Apply transform based on direction - only translate, no scaling or rotating
      if (direction === 'up') {
        element.style.transform = `translateY(${-offset}px)`;
      } else if (direction === 'down') {
        element.style.transform = `translateY(${offset}px)`;
      } else if (direction === 'left') {
        element.style.transform = `translateX(${-offset}px)`;
      } else if (direction === 'right') {
        element.style.transform = `translateX(${offset}px)`;
      }
    });
  }
  
  function initFloatingElements() {
    console.log('Initializing floating elements');
    
    floatingElements.forEach(function(element) {
      // Add random rotation and delay to make the floating more interesting
      const delay = Math.random() * 2;
      element.style.animationDelay = `${delay}s`;
      
      // Add a slight shadow for depth
      element.style.filter = 'drop-shadow(0 5px 15px rgba(0,0,0,0.15))';
    });
  }
  
  // Throttle function to limit how often callbacks run
  function throttle(callback, delay) {
    let lastTime = 0;
    return function(e) {
      const now = Date.now();
      if (now - lastTime >= delay) {
        callback(e);
        lastTime = now;
      }
    };
  }
  
  // Handle window resize with throttling for better performance
  const throttledResize = throttle(function() {
    // Check if device capabilities changed
    const isNowHighPerformance = !isLowPowerDevice() && window.innerWidth >= 992;
    
    // Re-evaluate parallax application based on new window size and performance
    if (!isNowHighPerformance) {
      // Apply simplified transforms for low-power devices
      parallaxElements.forEach(function(element) {
        const direction = element.getAttribute('data-direction') || 'up';
        const staticOffset = (direction === 'up' || direction === 'down') ? '5px' : '3px';
        
        if (direction === 'up') {
          element.style.transform = `translateY(-${staticOffset})`;
        } else if (direction === 'down') {
          element.style.transform = `translateY(${staticOffset})`;
        } else if (direction === 'left') {
          element.style.transform = `translateX(-${staticOffset})`;
        } else if (direction === 'right') {
          element.style.transform = `translateX(${staticOffset})`;
        }
      });
      
      // Reset card transforms
      tokensAndNftCards.forEach(function(card) {
        card.style.transform = '';
        if (card.classList.contains('nft-card')) {
          card.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.15)';
        }
      });
    } else if (parallaxElements.length > 0) {
      // Recalculate positions for high-performance devices
      requestTick();
    }
  }, 250); // More aggressive throttling on resize (250ms)
  
  window.addEventListener('resize', throttledResize);
});