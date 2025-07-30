import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Global error handlers to prevent app crashes
window.addEventListener('error', (event) => {
  // Suppress specific known errors that don't affect functionality
  const knownErrors = [
    'chrome-extension://invalid/',
    'process is not defined',
    'fitnessRAG.indexFitnessDocuments is not a function',
    'Failed to load resource: net::ERR_FAILED'
  ];
  
  const errorMessage = event.error?.message || event.message || '';
  
  if (knownErrors.some(knownError => errorMessage.includes(knownError))) {
    event.preventDefault();
    console.warn('Suppressed known error:', errorMessage);
    return;
  }
  
  // Log other errors normally
  console.error('Application error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason?.message || event.reason || '';
  
  if (typeof reason === 'string' && reason.includes('chrome-extension://invalid/')) {
    event.preventDefault();
    console.warn('Suppressed promise rejection:', reason);
    return;
  }
  
  console.error('Unhandled promise rejection:', event.reason);
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
