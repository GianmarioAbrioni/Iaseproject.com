// Function to check WebP support
function checkWebpSupport() {
  const canvas = typeof document === 'object' ? document.createElement('canvas') : {};
  canvas.width = canvas.height = 1;
  return canvas.toDataURL ? canvas.toDataURL('image/webp').indexOf('image/webp') === 5 : false;
}

// Set a flag in localStorage to remember support status
function setWebpSupport() {
  if (typeof window !== 'undefined' && window.localStorage) {
    const hasSupport = checkWebpSupport();
    localStorage.setItem('webpSupport', hasSupport ? 'true' : 'false');
    if (hasSupport) {
      document.documentElement.classList.add('webp-support');
    } else {
      document.documentElement.classList.add('no-webp-support');
    }
  }
}

// Check support on page load
document.addEventListener('DOMContentLoaded', setWebpSupport);