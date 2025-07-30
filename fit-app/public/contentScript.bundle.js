// Safe content script to prevent extension errors
(function() {
  'use strict';
  
  // Prevent errors from chrome-extension://invalid/ requests
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    if (typeof url === 'string' && url.includes('chrome-extension://invalid/')) {
      console.warn('Blocked invalid extension request:', url);
      return Promise.reject(new Error('Invalid extension URL'));
    }
    return originalFetch.apply(this, args);
  };
  
  // Prevent resource loading errors
  const originalCreateElement = document.createElement;
  document.createElement = function(tagName) {
    const element = originalCreateElement.call(this, tagName);
    
    if (tagName.toLowerCase() === 'script' || tagName.toLowerCase() === 'link') {
      const originalSrc = element.setAttribute;
      element.setAttribute = function(name, value) {
        if ((name === 'src' || name === 'href') && 
            typeof value === 'string' && 
            value.includes('chrome-extension://invalid/')) {
          console.warn('Blocked invalid extension resource:', value);
          return;
        }
        return originalSrc.call(this, name, value);
      };
    }
    
    return element;
  };
  
  console.log('Safe content script loaded');
})();