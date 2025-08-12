import { useState, useEffect } from 'react';
import { HomeDashboard, EnhancedWorkoutLogger } from './components';
import { HomePage } from './components/HomePage';
import { NutritionAPITest } from './components/NutritionAPITest';
import { APIDebugTest } from './components/APIDebugTest';
import { ComprehensiveAPITest } from './components/ComprehensiveAPITest';
import { NimbusNutritionTracker } from './nimbus/components/nutrition/NimbusNutritionTracker';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'workout' | 'nutrition' | 'test' | 'debug' | 'comprehensive'>('home');
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
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-fitness-purple rounded-full animate-pulse"></div>
              <span>Preparing analytics dashboard</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-fitness-red rounded-full animate-pulse"></div>
              <span>Loading nutrition API</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleNavigate = (view: string) => {
    setCurrentView(view as any);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'home':
        return (
          <HomeDashboard 
            onNavigate={() => setCurrentView('workout')} 
            workout={{
              isActive: false,
              duration: 0,
              getContext: () => ({})
            }}
            appSettings={{}}
            onSettingsChange={() => {}}
          />
        );
      case 'workout':
        return (
          <EnhancedWorkoutLogger 
            appSettings={{
              autoAdvanceEnabled: true,
              defaultRestTime: 120,
              soundEnabled: true,
              notificationsEnabled: true,
              voiceCommandsEnabled: true,
              aiCoachingEnabled: true,
              offlineMode: false,
              debugMode: false
            }}
            onSettingsChange={() => {}}
          />
        );
      case 'nutrition':
        return <NimbusNutritionTracker />;
      case 'test':
        return <NutritionAPITest />;
      case 'debug':
        return <APIDebugTest />;
      case 'comprehensive':
        return <ComprehensiveAPITest />;
      default:
        return (
          <HomeDashboard 
            onNavigate={() => setCurrentView('workout')} 
            workout={{
              isActive: false,
              duration: 0,
              getContext: () => ({})
            }}
            appSettings={{}}
            onSettingsChange={() => {}}
          />
        );
    }
  };

  // Don't show navigation for the main app views (home, workout)
  if (currentView === 'home' || currentView === 'workout') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        {renderCurrentView()}
      </div>
    );
  }

  // Show navigation for nutrition and testing views
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Navigation */}
      <nav className="bg-white/10 backdrop-blur-lg border-b border-white/20 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setCurrentView('home')}
            className="text-2xl font-bold text-white hover:text-blue-300 transition-colors"
          >
            Fit App
          </button>
          <div className="flex space-x-4">
            <button
              onClick={() => setCurrentView('workout')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentView === 'workout' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              💪 Workout
            </button>
            <button
              onClick={() => setCurrentView('nutrition')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentView === 'nutrition' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              🍎 Nutrition
            </button>
            <button
              onClick={() => setCurrentView('test')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentView === 'test' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              API Test
            </button>
            <button
              onClick={() => setCurrentView('debug')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentView === 'debug' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              Debug
            </button>
            <button
              onClick={() => setCurrentView('comprehensive')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentView === 'comprehensive' 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              🧪 Test
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-6xl mx-auto p-6">
        {renderCurrentView()}
      </main>
    </div>
  );
}

export default App;