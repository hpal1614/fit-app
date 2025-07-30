// Safe share modal - no DOM manipulation
console.log('Share modal loaded safely');

// Export empty functions to prevent errors
window.shareModal = {
  init: () => console.log('Share modal init'),
  show: () => console.log('Share modal show'),
  hide: () => console.log('Share modal hide')
};