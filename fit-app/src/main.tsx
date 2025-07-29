import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { setupErrorFiltering } from './utils/errorFilter'

// Set up error filtering to hide Chrome extension errors
setupErrorFiltering();

// Add global error handler for app errors only
window.addEventListener('error', (event) => {
  // Skip extension errors
  if (event.filename?.includes('chrome-extension://')) return;
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

console.log('Main.tsx loaded');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

console.log('React app rendered');
