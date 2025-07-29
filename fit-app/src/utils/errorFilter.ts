// Filter out errors from Chrome extensions and external scripts
export function setupErrorFiltering() {
  const originalConsoleError = console.error;
  
  console.error = (...args) => {
    const errorString = args.join(' ');
    
    // Filter out common extension errors
    const extensionPatterns = [
      /share-modal\.js/,
      /chrome-extension:\/\//,
      /web_accessible_resources/,
      /extension\//
    ];
    
    const isExtensionError = extensionPatterns.some(pattern => 
      pattern.test(errorString)
    );
    
    if (!isExtensionError) {
      originalConsoleError.apply(console, args);
    }
  };
  
  // Also filter window errors
  window.addEventListener('error', (event) => {
    const isExtensionError = 
      event.filename?.includes('chrome-extension://') ||
      event.filename?.includes('share-modal') ||
      event.message?.includes('web_accessible_resources');
    
    if (isExtensionError) {
      event.preventDefault();
    }
  });
  
  console.log('🛡️ Error filtering enabled - Chrome extension errors will be hidden');
}