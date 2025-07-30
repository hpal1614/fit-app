// SAFE share-modal.js - Replace entire file content
(function() {
  'use strict';
  
  function initShareModal() {
    // Wait for DOM to be fully ready
    if (document.readyState !== 'complete') {
      window.addEventListener('load', initShareModal);
      return;
    }
    
    try {
      // Safe element selection with multiple fallbacks
      const shareModal = document.getElementById('share-modal') || 
                         document.querySelector('.share-modal') ||
                         document.querySelector('[data-share-modal]') ||
                         document.querySelector('.modal');
      
      if (!shareModal) {
        console.log('Share modal not found - this is normal if using React components');
        return;
      }
      
      // Safe button selection
      const shareButtons = shareModal.querySelectorAll('.share-button, [data-share], button');
      const closeButtons = shareModal.querySelectorAll('.close-button, [data-close], .close');
      
      // Add listeners only to existing elements
      shareButtons.forEach(button => {
        if (button && !button.hasAttribute('data-share-listener')) {
          button.addEventListener('click', handleShare);
          button.setAttribute('data-share-listener', 'true');
        }
      });
      
      closeButtons.forEach(button => {
        if (button && !button.hasAttribute('data-close-listener')) {
          button.addEventListener('click', closeModal);
          button.setAttribute('data-close-listener', 'true');
        }
      });
      
      console.log('Share modal initialized safely');
      
    } catch (error) {
      console.warn('Share modal initialization failed safely:', error.message);
    }
  }
  
  function handleShare() {
    try {
      if (navigator.share) {
        navigator.share({
          title: 'AI Fitness Coach',
          text: 'Check out this amazing fitness app!',
          url: window.location.href
        }).catch(err => console.log('Share cancelled'));
      } else {
        // Fallback copy to clipboard
        if (navigator.clipboard) {
          navigator.clipboard.writeText(window.location.href)
            .then(() => alert('Link copied to clipboard!'))
            .catch(() => console.log('Copy failed'));
        }
      }
    } catch (error) {
      console.warn('Share function failed safely:', error.message);
    }
  }
  
  function closeModal() {
    try {
      const modal = document.querySelector('.share-modal, #share-modal, .modal');
      if (modal) {
        modal.style.display = 'none';
        modal.classList.add('hidden');
      }
    } catch (error) {
      console.warn('Close modal failed safely:', error.message);
    }
  }
  
  // Initialize safely
  initShareModal();
  
})();