import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('main.tsx starting...');

// Emergency error handlers
window.addEventListener('error', (event) => {
  console.error('Window error:', event.error);
  const knownErrors = [
    'chrome-extension://invalid/',
    'share-modal.js',
    'Service worker registration failed'
  ];
  
  if (knownErrors.some(err => event.error?.message?.includes(err))) {
    event.preventDefault();
    console.warn('Suppressed known error:', event.error?.message);
    return;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection:', event.reason);
  if (event.reason?.message?.includes('chrome-extension://invalid/')) {
    event.preventDefault();
    return;
  }
});

console.log('About to find root element...');
const rootElement = document.getElementById('root');
console.log('Root element:', rootElement);

if (!rootElement) {
  console.error('Root element not found!');
  document.body.innerHTML = '<h1>Root element not found!</h1>';
} else {
  console.log('Creating React root...');
  try {
    const root = ReactDOM.createRoot(rootElement);
    console.log('React root created, rendering app...');
    
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    console.log('React app rendered successfully');
  } catch (error) {
    console.error('Error rendering app:', error);
    rootElement.innerHTML = `<h1>Error: ${error.message}</h1>`;
  }
}
