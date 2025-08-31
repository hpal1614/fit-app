import { useState, useEffect } from 'react';
import { HomeDashboard, EnhancedWorkoutLogger } from './components';
import { HomePage } from './components/HomePage';
import { NutritionAPITest } from './components/NutritionAPITest';
import { APIDebugTest } from './components/APIDebugTest';
import { ComprehensiveAPITest } from './components/ComprehensiveAPITest';
import { NimbusNutritionTracker } from './nimbus/components/nutrition/NimbusNutritionTracker';
import { UserFriendlyNutritionTracker } from './components/UserFriendlyNutritionTracker';
import { SimpleNutritionTracker } from './components/SimpleNutritionTracker';
import { TestNutritionUI } from './components/TestNutritionUI';
import { BottomNavigation } from './components/BottomNavigation';
import { WorkoutsTab } from './components/WorkoutsTab';
import { AICoachTab } from './components/AICoachTab';
import { FinalUI } from './components/finalUI';
import TestFinalUI from './components/finalUI/TestFinalUI';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'workout' | 'nutrition' | 'ai-coach' | 'final-ui' | 'test' | 'debug' | 'comprehensive'>('final-ui');
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
        <div className="card p-8 max-w-md w-full text-center">
          <div className="text-error text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">App Error</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
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
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">AI Fitness Coach</h1>
          <p className="text-gray-600 dark:text-gray-400">Loading your personal trainer...</p>
          
          {/* Loading features checklist */}
          <div className="mt-8 space-y-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span>Initializing voice recognition</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
              <span>Loading AI coaching system</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
              <span>Setting up workout database</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <span>Preparing analytics dashboard</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-error rounded-full animate-pulse"></div>
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
        return <WorkoutsTab />;
      case 'nutrition':
        return <UserFriendlyNutritionTracker />;
      case 'ai-coach':
        return <AICoachTab />;
      case 'final-ui':
        return <FinalUI />;
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

  // Show bottom navigation for main app views (home, workout, nutrition, ai-coach, final-ui)
  if (currentView === 'home' || currentView === 'workout' || currentView === 'nutrition' || currentView === 'ai-coach' || currentView === 'final-ui') {
    return (
      <div className="min-h-screen bg-gradient-dark">
        {renderCurrentView()}
        <BottomNavigation 
          currentView={currentView} 
          onNavigate={(view) => setCurrentView(view as any)} 
        />
      </div>
    );
  }

  // Show navigation for testing views only
  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Navigation */}
      <nav className="glass border-b border-white/20 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setCurrentView('home')}
            className="text-2xl font-bold text-white hover:text-primary transition-colors"
          >
            Fit App
          </button>
          <div className="flex space-x-4">
            <button
              onClick={() => setCurrentView('test')}
              className={`px-4 py-2 rounded-xl transition-colors ${
                currentView === 'test' 
                  ? 'bg-success text-white' 
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              API Test
            </button>
            <button
              onClick={() => setCurrentView('debug')}
              className={`px-4 py-2 rounded-xl transition-colors ${
                currentView === 'debug' 
                  ? 'bg-error text-white' 
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              Debug
            </button>
            <button
              onClick={() => setCurrentView('comprehensive')}
              className={`px-4 py-2 rounded-xl transition-colors ${
                currentView === 'comprehensive' 
                  ? 'bg-secondary text-white' 
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