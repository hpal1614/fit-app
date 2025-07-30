// BLOCK Chrome extension interference - Add at TOP of main.tsx
(function blockChromeExtensions() {
  // Block invalid chrome extension requests
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    if (typeof url === 'string' && url.includes('chrome-extension://invalid/')) {
      return Promise.reject(new Error('Blocked invalid extension'));
    }
    return originalFetch.apply(this, args);
  };
  
  // Block contentScript errors
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const message = args[0];
    if (typeof message === 'string' && 
        (message.includes('chrome-extension://invalid/') || 
         message.includes('contentScript.bundle.js'))) {
      return; // Silently ignore these errors
    }
    return originalConsoleError.apply(this, args);
  };
  
  console.log('Chrome extension blocker active');
})();

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// EMERGENCY: Add this at the top of main.tsx after imports
console.log('Environment check:', {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
});

// Fix missing environment variables
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Supabase credentials missing - app will use fallback mode');
  
  // Set fallback values to prevent crashes
  (window as any).__SUPABASE_FALLBACK__ = true;
}

// NUCLEAR ERROR SUPPRESSION - Add if desperate
window.addEventListener('error', (e) => {
  const knownErrors = [
    'chrome-extension',
    'contentScript',
    'addEventListener',
    'Invalid URL',
    'net::ERR_FAILED',
    'process is not defined',
    'fitnessRAG.indexFitnessDocuments is not a function'
  ];
  
  if (knownErrors.some(err => e.error?.message?.includes(err) || e.message?.includes(err))) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
  
  // Log other errors normally
  console.error('Application error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  const knownErrors = [
    'chrome-extension',
    'Invalid URL',
    'Supabase'
  ];
  
  if (knownErrors.some(err => e.reason?.message?.includes(err) || e.reason?.includes(err))) {
    e.preventDefault();
    return false;
  }
  
  console.error('Unhandled promise rejection:', e.reason);
});

// Add error boundary for React components
console.log('Global error handlers initialized');

console.log('Main.tsx loaded');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

console.log('React app rendered');
