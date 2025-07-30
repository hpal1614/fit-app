import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { MCPProvider } from './providers/MCPProvider'

// Emergency error handlers
window.addEventListener('error', (event) => {
  const errorMessage = event.error?.message || event.message || '';
  const errorSource = event.filename || '';
  
  const knownErrors = [
    'chrome-extension://invalid/',
    'chrome-extension://',
    'share-modal.js',
    'Service worker registration failed',
    'addEventListener',
    'web_accessible_resources',
    'net::ERR_FAILED'
  ];
  
  if (knownErrors.some(err => errorMessage.includes(err) || errorSource.includes(err))) {
    event.preventDefault();
    event.stopPropagation();
    console.warn('Suppressed known error:', errorMessage);
    return false;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('chrome-extension://invalid/')) {
    event.preventDefault();
    return;
  }
});

console.log('Main.tsx loaded');

// Simple Error Boundary
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center',
          backgroundColor: '#1f2937',
          color: 'white',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <h1>🔧 App Recovery Mode</h1>
          <p>Something went wrong, but we're fixing it...</p>
          <pre style={{ 
            backgroundColor: '#374151', 
            padding: '10px', 
            borderRadius: '5px',
            fontSize: '12px',
            marginTop: '20px'
          }}>
            {this.state.error?.message}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              marginTop: '20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <MCPProvider>
        <App />
      </MCPProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

console.log('React app rendered with safety measures');
