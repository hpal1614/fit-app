import { useState, useEffect } from 'react';
// import { HomeDashboard } from './components/HomeDashboard';
// import { EnhancedWorkoutLogger } from './components/EnhancedWorkoutLogger';
import { HomeDashboard, EnhancedWorkoutLogger } from './components';
import ProgramSelection from './components/onboarding/ProgramSelection';
import { PDFDebugInterface } from './components/PDFDebugInterface';
// Temporarily commented out to fix build
// import { WorkoutExtractionDemo } from './components/WorkoutExtractionDemo';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'workout' | 'onboarding' | 'debug' | 'extraction-demo'>('home');
  const [isAppReady, setIsAppReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Handle deep-link via hash: #onboarding, #templates
    const applyHashRoute = () => {
      const hash = (window.location.hash || '').toLowerCase();
      if (hash.includes('onboarding') || hash.includes('templates')) {
        setCurrentView('onboarding');
      } else if (hash.includes('debug') || hash.includes('pdf-test')) {
        setCurrentView('debug');
      } else if (hash.includes('extraction-demo') || hash.includes('workout-extraction')) {
        setCurrentView('extraction-demo');
      }
    };
    applyHashRoute();
    window.addEventListener('hashchange', applyHashRoute);
    return () => window.removeEventListener('hashchange', applyHashRoute);
  }, []);

  useEffect(() => {
    // Initialize the application
    const initializeApp = async () => {
      try {
        const hasIndexedDB = 'indexedDB' in window;
        if (!hasIndexedDB) {
          setError('Your browser does not support required features');
          return;
        }
        setIsAppReady(true);
      } catch (err) {
        setError('Failed to initialize app');
      }
    };

    initializeApp();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500 rounded-xl p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-400 mb-4">App Error</h1>
          <p className="text-red-300 mb-2">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">Reload</button>
        </div>
      </div>
    );
  }

  if (!isAppReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white/80">Loading...</div>
      </div>
    );
  }

  const renderCurrentView = () => {
    try {
      if (currentView === 'onboarding') {
        return (
          <ProgramSelection
            onChoosePdf={() => (window.location.hash = '#templates-pdf')}
            onChooseAI={() => (window.location.hash = '#templates-ai')}
            onChooseBrowse={() => (window.location.hash = '#templates-browse')}
            onBack={() => (window.location.hash = '')}
          />
        );
      }

      switch (currentView) {
        case 'home':
          return (
            <HomeDashboard
              onNavigate={() => setCurrentView('workout')}
              workout={{ isActive: false, duration: 0, getContext: () => ({}) }}
              appSettings={{}}
              onSettingsChange={() => {}}
            />
          );
        case 'debug':
          return (
            <div className="min-h-screen bg-gray-100 p-6">
              <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                  <button
                    onClick={() => {
                      setCurrentView('home');
                      window.location.hash = '';
                    }}
                    className="text-blue-600 hover:text-blue-800 mb-4"
                  >
                    ← Back to Home
                  </button>
                  <h1 className="text-3xl font-bold text-gray-900">PDF Processing Debug Interface</h1>
                  <p className="text-gray-600 mt-2">
                    Comprehensive testing and debugging tool for PDF processing system
                  </p>
                </div>
                <PDFDebugInterface />
              </div>
            </div>
          );
        case 'extraction-demo':
          return (
            <div className="min-h-screen bg-gray-100 p-6">
              <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                  <button
                    onClick={() => {
                      setCurrentView('home');
                      window.location.hash = '';
                    }}
                    className="text-blue-600 hover:text-blue-800 mb-4"
                  >
                    ← Back to Home
                  </button>
                  <h1 className="text-3xl font-bold text-gray-900">Workout PDF Extraction Demo</h1>
                  <p className="text-gray-600 mt-2">
                    Test the automatic extraction of workout data from your PDF format
                  </p>
                  <p className="text-orange-600 mt-4">
                    📧 Demo temporarily disabled due to build issues. Please use the PDF Debug Interface instead!
                  </p>
                </div>
                {/* <WorkoutExtractionDemo /> */}
              </div>
            </div>
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
                debugMode: false,
              }}
              onSettingsChange={() => {}}
            />
          );
        default:
          return (
            <HomeDashboard
              onNavigate={() => setCurrentView('workout')}
              workout={{ isActive: false, duration: 0, getContext: () => ({}) }}
              appSettings={{}}
              onSettingsChange={() => {}}
            />
          );
      }
    } catch (err) {
      console.error('Component render error:', err);
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
          <div className="bg-red-500/10 border border-red-500 rounded-xl p-8 text-center max-w-md">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Component Error</h1>
            <p className="text-red-300 mb-4">There was an error loading the component.</p>
            <button onClick={() => window.location.reload()} className="mt-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">Reload</button>
          </div>
        </div>
      );
    }
  };

  return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">{renderCurrentView()}</div>;
}

export default App;