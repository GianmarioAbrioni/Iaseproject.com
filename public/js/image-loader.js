// Function to replace images with optimized versions
function loadOptimizedImages() {
  // Check if browser supports WebP
  const webpSupport = localStorage.getItem('webpSupport') === 'true';
  const imageMap = {
    // Image mappings - original path to optimized path
    'images/logo.png': webpSupport ? 'images/optimized/logo.webp' : 'images/optimized/logo.png',
    'images/iase-token-logo.png': webpSupport ? 'images/optimized/iase-token-logo.webp' : 'images/optimized/iase-token-logo.png',
    'images/iase-units-logo.png': webpSupport ? 'images/optimized/iase-units-logo.webp' : 'images/optimized/iase-units-logo.png',
    'images/italian-cover.jpg': webpSupport ? 'images/optimized/italian-cover.webp' : 'images/optimized/italian-cover.jpg',
    'images/english-cover.jpg': webpSupport ? 'images/optimized/english-cover.webp' : 'images/optimized/english-cover.jpg',
    'images/iase_comparison_table.jpg': webpSupport ? 'images/optimized/iase_comparison_table.webp' : 'images/optimized/iase_comparison_table.jpg'
  };

  // Replace images
  document.querySelectorAll('img').forEach(img => {
    const src = img.getAttribute('src');
    if (!src) return;
    
    // Remove any leading slashes for matching
    const normalizedSrc = src.replace(/^\/+/, '');
    
    // Check if we have an optimized version
    for (const [originalPath, optimizedPath] of Object.entries(imageMap)) {
      if (normalizedSrc.includes(originalPath)) {
        // Replace with optimized version
        img.setAttribute('src', optimizedPath);
        break;
      }
    }
  });

  // Replace background images in CSS
  document.querySelectorAll('[style*="background-image"]').forEach(el => {
    const style = el.getAttribute('style');
    if (!style) return;
    
    // Check if the style contains an image URL
    const urlMatch = style.match(/url\(['"]?([^'"]+?)['"]?\)/i);
    if (!urlMatch || !urlMatch[1]) return;
    
    const imgUrl = urlMatch[1];
    const normalizedUrl = imgUrl.replace(/^\/+/, '');
    
    // Check if we have an optimized version
    for (const [originalPath, optimizedPath] of Object.entries(imageMap)) {
      if (normalizedUrl.includes(originalPath)) {
        // Replace with optimized version
        const newStyle = style.replace(imgUrl, optimizedPath);
        el.setAttribute('style', newStyle);
        break;
      }
    }
  });
}

// Run after WebP detection is complete
document.addEventListener('DOMContentLoaded', () => {
  // Short delay to ensure webpSupport is set
  setTimeout(loadOptimizedImages, 50);
});