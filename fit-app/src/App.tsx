import React, { useState, useEffect } from 'react';
import { WorkoutDashboard } from './components';
import './App.css';

function App() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize the application
    const initializeApp = async () => {
      try {
        // Check for required features
        const hasVoiceSupport = 'speechSynthesis' in window && 
          ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
        
        const hasIndexedDB = 'indexedDB' in window;
        
        if (!hasIndexedDB) {
          throw new Error('This app requires IndexedDB support for local data storage.');
        }

        // Check for API keys in development
        const hasApiKeys = import.meta.env.VITE_OPENROUTER_API_KEY ||
                          import.meta.env.VITE_GROQ_API_KEY ||
                          import.meta.env.VITE_GOOGLE_AI_API_KEY;

        if (!hasApiKeys) {
          console.warn('No AI API keys found. AI features will be limited.');
        }

        if (!hasVoiceSupport) {
          console.warn('Voice features are not supported in this browser.');
        }

        // Small delay to ensure everything is loaded
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setIsAppReady(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize application');
      }
    };

    initializeApp();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">App Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-fitness-blue text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Reload App
          </button>
        </div>
      </div>
    );
  }

  if (!isAppReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-fitness-blue mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Fitness Coach</h1>
          <p className="text-gray-600">Loading your personal trainer...</p>
          
          {/* Loading features checklist */}
          <div className="mt-8 space-y-2 text-sm text-gray-500">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-fitness-blue rounded-full animate-pulse"></div>
              <span>Initializing voice recognition</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-fitness-green rounded-full animate-pulse"></div>
              <span>Loading AI coaching system</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-fitness-orange rounded-full animate-pulse"></div>
              <span>Setting up workout database</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-fitness-blue p-2 rounded-lg">
                <span className="text-white font-bold text-lg">💪</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">AI Fitness Coach</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* App Version */}
              <span className="text-sm text-gray-500">
                v{import.meta.env.VITE_APP_VERSION || '1.0.0'}
              </span>
              
              {/* Status Indicators */}
              <div className="flex items-center space-x-2">
                {/* Voice Support Indicator */}
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${
                    'speechSynthesis' in window ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-xs text-gray-500">Voice</span>
                </div>
                
                {/* AI Support Indicator */}
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${
                    import.meta.env.VITE_OPENROUTER_API_KEY || 
                    import.meta.env.VITE_GROQ_API_KEY || 
                    import.meta.env.VITE_GOOGLE_AI_API_KEY 
                      ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                  <span className="text-xs text-gray-500">AI</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <WorkoutDashboard />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>
              AI Fitness Coach - Your voice-powered personal trainer
            </p>
            <p className="mt-1">
              Say "start workout" to begin or use the voice button to get coaching advice
            </p>
            
            {/* Feature highlights */}
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                🎤 Voice Commands
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                🤖 AI Coaching
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                📊 Progress Tracking
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                🏆 Personal Records
              </span>
            </div>
            
            {/* Buy Me a Coffee */}
            {import.meta.env.VITE_BMAC_USERNAME && (
              <div className="mt-4">
                <a
                  href={`https://www.buymeacoffee.com/${import.meta.env.VITE_BMAC_USERNAME}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600 transition-colors"
                >
                  ☕ Support the App
                </a>
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
