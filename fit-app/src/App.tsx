import { useState, useEffect } from 'react';
// import { HomeDashboard } from './components/HomeDashboard';
// import { EnhancedWorkoutLogger } from './components/EnhancedWorkoutLogger';
import { HomeDashboard, EnhancedWorkoutLogger } from './components';
import ProgramSelection from './components/onboarding/ProgramSelection';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'workout' | 'onboarding'>('home');
  const [isAppReady, setIsAppReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Handle deep-link via hash: #onboarding, #templates
    const applyHashRoute = () => {
      const hash = (window.location.hash || '').toLowerCase();
      if (hash.includes('onboarding') || hash.includes('templates')) {
        setCurrentView('onboarding');
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