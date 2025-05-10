// Roadmap Interactive Visualization Script

document.addEventListener('DOMContentLoaded', function() {
  // Animate roadmap items when they come into view
  const roadmapItems = document.querySelectorAll('.roadmap-item');
  
  // Function to check if element is in viewport
  function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  // Function to handle scroll animation
  function handleScrollAnimation() {
    roadmapItems.forEach(item => {
      if (isInViewport(item) && !item.classList.contains('animated')) {
        item.classList.add('animated');
      }
    });
  }

  // Initial check and add scroll event
  handleScrollAnimation();
  window.addEventListener('scroll', handleScrollAnimation);

  // Add interactive features to phases
  document.querySelectorAll('.phase-toggle').forEach(button => {
    button.addEventListener('click', function() {
      const phaseId = this.getAttribute('data-phase');
      const milestonesList = document.getElementById(`milestones-${phaseId}`);
      
      // Toggle milestones visibility
      if (milestonesList.classList.contains('show')) {
        milestonesList.classList.remove('show');
        this.innerHTML = 'Show Details <i class="ri-arrow-down-s-line"></i>';
      } else {
        milestonesList.classList.add('show');
        this.innerHTML = 'Hide Details <i class="ri-arrow-up-s-line"></i>';
      }
    });
  });

  // Progress bars animation
  document.querySelectorAll('.progress-bar').forEach(bar => {
    const targetWidth = bar.getAttribute('data-progress') + '%';
    setTimeout(() => {
      bar.style.width = targetWidth;
    }, 500);
  });
});