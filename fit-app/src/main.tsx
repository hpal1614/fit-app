import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { errorService } from './services/errorService';
import { ErrorBoundary } from './components/ErrorBoundary';
import { performanceService } from './services/performanceService';
import { analyticsService } from './services/analyticsService';

// Initialize services
errorService.setGlobalErrorHandler((error, context) => {
  console.error('Global error:', error, context);
  
  // Track error in analytics
  analyticsService.track('error_occurred', {
    message: error.message,
    stack: error.stack,
    context
  }, 'error');
});

// Track web vitals
performanceService.trackWebVitals((metric) => {
  console.log('Web Vital:', metric);
  
  // Send to analytics
  analyticsService.trackTiming('web-vitals', metric.name, metric.value);
});

// Wrap window.React for error boundary
(window as any).React = React;

// Service Worker Registration for PWA
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered:', registration);
        analyticsService.track('service_worker_registered');
      })
      .catch(error => {
        console.log('SW registration failed:', error);
        errorService.handleError(error, { action: 'service-worker-registration' });
      });
  });
}

// Check for app updates
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // New service worker has taken control
    if (confirm('New version available! Reload to update?')) {
      window.location.reload();
    }
  });
}

// Render app with error boundary
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary
      fallback={({ error, errorId }) => (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
          <div className="max-w-md w-full bg-gray-800 rounded-2xl p-8 text-center">
            <h1 className="text-3xl font-bold mb-4">Oops! Something went wrong</h1>
            <p className="text-gray-400 mb-6">
              {errorService.getErrorMessage(errorId) || error.message}
            </p>
            <div className="space-y-3">
              {errorService.getRecoverySuggestions(errorId).map((suggestion, index) => (
                <p key={index} className="text-sm text-gray-500">• {suggestion}</p>
              ))}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )}
    >
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
