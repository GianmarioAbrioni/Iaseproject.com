// IASE Project Modern JavaScript

document.addEventListener('DOMContentLoaded', function() {
  // Add JS loaded class to enable animations
  document.documentElement.classList.add('js-loaded');
  
  // Initialize hero section particles
  initParticles();
  
  // Assicurarsi che tutti gli elementi siano visibili fin dall'inizio
  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    el.classList.add('is-visible');
  });
  
  // Inizializza le animazioni rimuovendo prima la classe is-visible
  // e poi riaggiungendola per creare l'effetto
  setTimeout(() => {
    // Prima nascondi
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      el.classList.remove('is-visible');
    });
    
    // Poi, dopo un breve ritardo, mostra di nuovo con animazione
    setTimeout(() => {
      initAnimations();
    }, 50);
  }, 0);
  
  // Initialize back to top button
  initBackToTop();
  
  // Initialize mobile-friendly navigation
  initMobileNav();
  
  // Enhanced lazy loading for images
  initLazyLoading();
  
  // Add page transition effects
  initPageTransitions();
  
  // Add dashboard link to navigation if not already present
  addDashboardLink();
});

// Smooth scroll to anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    
    e.preventDefault();
    
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      const headerOffset = 80;
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      // Close mobile menu if open
      const navbarToggler = document.querySelector('.navbar-toggler');
      const navbarCollapse = document.querySelector('.navbar-collapse');
      
      if (navbarCollapse && navbarCollapse.classList.contains('show')) {
        navbarToggler.click();
      }
    }
  });
});

// Initialize Particles in Hero Section
function initParticles() {
  const particlesContainer = document.getElementById('hero-particles');
  if (!particlesContainer) return;
  
  // Number of particles
  const particleCount = 50;
  
  // Create particles
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particle');
    
    // Random properties for a more organic look
    const size = Math.random() * 3 + 1; // 1-4px
    const opacity = Math.random() * 0.5 + 0.1; // 0.1-0.6
    const xPos = Math.random() * 100; // 0-100%
    const yPos = Math.random() * 100; // 0-100%
    const delay = Math.random() * 5; // 0-5s
    const duration = Math.random() * 20 + 10; // 10-30s
    
    // Apply styles
    particle.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      background-color: rgba(0, 191, 255, ${opacity});
      border-radius: 50%;
      left: ${xPos}%;
      top: ${yPos}%;
      animation: floatParticle ${duration}s ease-in-out ${delay}s infinite;
      box-shadow: 0 0 ${size * 2}px rgba(0, 191, 255, ${opacity});
    `;
    
    particlesContainer.appendChild(particle);
  }
  
  // Add CSS keyframes animation
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes floatParticle {
      0%, 100% {
        transform: translateY(0) translateX(0);
      }
      25% {
        transform: translateY(-20px) translateX(10px);
      }
      50% {
        transform: translateY(10px) translateX(-15px);
      }
      75% {
        transform: translateY(15px) translateX(10px);
      }
    }
  `;
  document.head.appendChild(style);
}

// Initialize animations
function initAnimations() {
  // Add fade-in animation to sections
  const sections = document.querySelectorAll('section');
  sections.forEach(section => {
    section.classList.add('fade-in');
  });
  
  // Add slide-up animation to buttons
  const buttons = document.querySelectorAll('.btn-custom, .btn-primary, .btn-secondary, .btn-outline-primary');
  buttons.forEach(button => {
    button.classList.add('slide-up');
  });
  
  // Intersection Observer for scroll animations
  if ('IntersectionObserver' in window) {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, observerOptions);
    
    // Observe elements with animate-on-scroll class
    document.querySelectorAll('.animate-on-scroll').forEach(element => {
      observer.observe(element);
    });
  } else {
    // Fallback for browsers without IntersectionObserver
    document.querySelectorAll('.animate-on-scroll').forEach(element => {
      element.classList.add('is-visible');
    });
  }
  
  // Add typing animation to hero title if present
  const heroTitle = document.querySelector('.hero-title');
  if (heroTitle) {
    heroTitle.classList.add('typing-animation');
  }
}

// Initialize back to top button
function initBackToTop() {
  // Create back to top button
  const backToTopBtn = document.createElement('a');
  backToTopBtn.classList.add('back-to-top');
  backToTopBtn.innerHTML = '&uarr;';
  backToTopBtn.setAttribute('href', '#');
  backToTopBtn.setAttribute('title', 'Back to Top');
  document.body.appendChild(backToTopBtn);
  
  // Show/hide back to top button based on scroll position
  window.addEventListener('scroll', function() {
    if (window.pageYOffset > 300) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  });
  
  // Scroll to top when button is clicked
  backToTopBtn.addEventListener('click', function(e) {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

// Initialize mobile-friendly navigation
function initMobileNav() {
  // Make dropdown menus work better on touch devices
  const dropdownItems = document.querySelectorAll('.dropdown-toggle');
  
  dropdownItems.forEach(item => {
    item.addEventListener('click', function(e) {
      const isMobile = window.innerWidth < 992;
      
      if (isMobile) {
        if (!this.classList.contains('dropdown-active')) {
          e.preventDefault();
          
          // Close other open dropdowns
          dropdownItems.forEach(otherItem => {
            if (otherItem !== this && otherItem.classList.contains('dropdown-active')) {
              otherItem.classList.remove('dropdown-active');
              otherItem.nextElementSibling.style.display = 'none';
            }
          });
          
          // Open this dropdown
          this.classList.add('dropdown-active');
          const dropdownMenu = this.nextElementSibling;
          dropdownMenu.style.display = 'block';
        }
      }
    });
  });
  
  // Close dropdowns when clicking outside
  document.addEventListener('click', function(e) {
    const isDropdownOrToggle = e.target.classList.contains('dropdown-toggle') || 
                               e.target.closest('.dropdown-menu');
    
    if (!isDropdownOrToggle) {
      dropdownItems.forEach(item => {
        item.classList.remove('dropdown-active');
        const menu = item.nextElementSibling;
        if (menu) {
          menu.style.display = '';
        }
      });
    }
  });
}

// Add dark/light mode toggle
function toggleDarkMode() {
  document.body.classList.toggle('light-mode');
  
  // Save preference
  const isDarkMode = document.body.classList.contains('light-mode') ? 'light' : 'dark';
  localStorage.setItem('theme', isDarkMode);
}

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
  document.body.classList.add('light-mode');
}

// Enhanced lazy loading function - optimized for performance
function initLazyLoading() {
  // Add loading="lazy" attribute to all images for native lazy loading
  document.querySelectorAll('img').forEach(img => {
    if (!img.hasAttribute('loading')) {
      img.setAttribute('loading', 'lazy');
    }
  });

  // Add shimmer effect to images in containers
  document.querySelectorAll('.img-container').forEach(container => {
    // Add shimmer effect
    if (!container.querySelector('.shimmer')) {
      const shimmer = document.createElement('div');
      shimmer.classList.add('shimmer');
      container.appendChild(shimmer);
    }
    
    // When the image loads, remove the shimmer
    const img = container.querySelector('img');
    if (img) {
      if (img.complete) {
        // Image already loaded
        img.classList.add('loaded');
      } else {
        // Wait for image to load
        img.addEventListener('load', () => {
          img.classList.add('loaded');
        });
      }
    }
  });
}

// Add smooth page transitions
function initPageTransitions() {
  // Add page transition overlay if it doesn't exist
  if (!document.getElementById('page-transition')) {
    const transitionOverlay = document.createElement('div');
    transitionOverlay.id = 'page-transition';
    document.body.appendChild(transitionOverlay);
  }

  // Add event listener to all links that go to a different page (not anchors)
  document.querySelectorAll('a:not([href^="#"])').forEach(link => {
    // Skip links that open in new tabs or are downloads
    if (link.getAttribute('target') === '_blank' || link.getAttribute('download') || link.getAttribute('href').startsWith('mailto:')) {
      return;
    }

    link.addEventListener('click', function(e) {
      // Skip if it's an external link
      if (this.hostname !== window.location.hostname) {
        return;
      }

      const href = this.getAttribute('href');
      
      // Skip if it's a JavaScript action
      if (href.startsWith('javascript:')) {
        return;
      }

      // Don't navigate immediately
      e.preventDefault();

      // Show transition overlay
      const transitionOverlay = document.getElementById('page-transition');
      transitionOverlay.classList.add('active');

      // Wait for animation to complete before navigating
      setTimeout(() => {
        window.location.href = href;
      }, 400);
    });
  });

  // Hide transition overlay when page has loaded
  window.addEventListener('load', () => {
    const transitionOverlay = document.getElementById('page-transition');
    transitionOverlay.classList.remove('active');
  });
}

// Add dashboard link to navigation - Disabled as now handled by wallet-connect.js
function addDashboardLink() {
  // This function has been disabled because the dashboard link is now
  // added by wallet-connect.js in a better integrated way with the wallet status
  
  // Add script tag for chatbot initializer if not present
  if (!document.querySelector('script[src="js/init-chatbot.js"]')) {
    console.log('Adding chatbot initializer script...');
    const chatbotInitScript = document.createElement('script');
    chatbotInitScript.src = 'js/init-chatbot.js';
    document.body.appendChild(chatbotInitScript);
  }
  
  // Exit early without adding the dashboard link
  return;
}