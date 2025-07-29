// Filter out errors from Chrome extensions and external scripts
export function setupErrorFiltering() {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;
  
  // Override console.error
  console.error = (...args) => {
    const errorString = String(args[0]);
    
    // Comprehensive extension error patterns
    const extensionPatterns = [
      /share-modal/i,
      /chrome-extension/i,
      /web_accessible_resources/i,
      /contentScript/i,
      /extension\//i,
      /chrome-extension:\/\/invalid/i,
      /ERR_FAILED/i,
      /manifest key/i,
      /A listener indicated an asynchronous response/i
    ];
    
    const isExtensionError = extensionPatterns.some(pattern => 
      pattern.test(errorString) || 
      args.some(arg => pattern.test(String(arg)))
    );
    
    if (!isExtensionError) {
      originalConsoleError.apply(console, args);
    }
  };
  
  // Override console.warn for extension warnings
  console.warn = (...args) => {
    const warnString = String(args[0]);
    if (!warnString.includes('chrome-extension') && !warnString.includes('extension://')) {
      originalConsoleWarn.apply(console, args);
    }
  };
  
  // Override console.log for extension logs
  console.log = (...args) => {
    const logString = String(args[0]);
    if (!logString.includes('Denying load of') && !logString.includes('chrome-extension')) {
      originalConsoleLog.apply(console, args);
    }
  };
  
  // Aggressive window error filtering
  window.addEventListener('error', (event) => {
    const isExtensionError = 
      event.filename?.includes('chrome-extension://') ||
      event.filename?.includes('share-modal') ||
      event.filename?.includes('contentScript') ||
      event.message?.includes('web_accessible_resources') ||
      event.message?.includes('chrome-extension') ||
      event.message?.includes('ERR_FAILED') ||
      event.message?.includes('A listener indicated');
    
    if (isExtensionError) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, true); // Use capture phase
  
  // Filter unhandled rejections
  window.addEventListener('unhandledrejection', (event) => {
    const errorString = String(event.reason);
    if (errorString.includes('chrome-extension') || 
        errorString.includes('A listener indicated') ||
        errorString.includes('web_accessible_resources')) {
      event.preventDefault();
      return false;
    }
  });
  
  console.log('🛡️ Aggressive error filtering enabled - All Chrome extension errors will be blocked');
}