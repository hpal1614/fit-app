export function setupErrorFiltering() {
  // Only block Chrome extension errors, nothing else
  const extensionPatterns = [
    'chrome-extension://',
    'share-modal.js',
    'contentScript.bundle.js'
  ];

  const isExtensionError = (message: string, filename?: string): boolean => {
    return extensionPatterns.some(pattern => 
      message.includes(pattern) || filename?.includes(pattern)
    );
  };

  // Only override error events (not console methods)
  window.addEventListener('error', (event) => {
    if (isExtensionError(event.message || '', event.filename)) {
      event.preventDefault();
      return false;
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (isExtensionError(String(event.reason))) {
      event.preventDefault();
      return false;
    }
  });

  console.log('🛡️ Extension error filtering enabled');
}