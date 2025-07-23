import React, { lazy, Suspense, useEffect, useState } from 'react';
import { BottomNavigation } from './components/BottomNavigation';
import { mobileOptimization } from './services/mobileOptimizationService';
import { pwaService } from './services/pwaService';
import { performanceOptimization } from './services/performanceOptimizationService';
import './App.css';

// Lazy load heavy components
const WorkoutsTab = lazy(() => 
  import(/* webpackChunkName: "workouts" */ './components/WorkoutsTab')
);
const AIChatInterface = lazy(() => 
  import(/* webpackChunkName: "ai-chat" */ './components/AIChatInterface')
);
const FormAnalysisInterface = lazy(() => 
  import(/* webpackChunkName: "form-analysis" */ './components/FormAnalysisInterface')
);
const BiometricsDashboard = lazy(() => 
  import(/* webpackChunkName: "biometrics" */ './components/BiometricsDashboard')
);
const MobileWorkoutInterface = lazy(() => 
  import(/* webpackChunkName: "mobile-workout" */ './components/MobileWorkoutInterface')
);

// Loading component
const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <div className="spinner w-12 h-12 border-3 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-400">Loading...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'workouts' | 'coach' | 'form' | 'biometrics'>('workouts');
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  
  // Device capabilities
  const deviceCaps = mobileOptimization.getDeviceCapabilities();
  const isMobile = deviceCaps.deviceType === 'mobile';
  const isPortrait = window.innerWidth < window.innerHeight;

  useEffect(() => {
    // Setup PWA event listeners
    const handleInstallAvailable = () => setShowPWAPrompt(true);
    const handleUpdateAvailable = () => setIsUpdateAvailable(true);
    
    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('pwa-update-available', handleUpdateAvailable);
    
    // Setup image lazy loading
    mobileOptimization.setupImageLazyLoading();
    
    // Preload critical resources
    performanceOptimization.preloadResources([
      '/fonts/inter-var.woff2',
      '/sounds/notification.mp3'
    ]);
    
    // Monitor performance
    const performanceMetrics = performanceOptimization.getPerformanceMetrics();
    console.log('Performance Metrics:', performanceMetrics);
    
    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('pwa-update-available', handleUpdateAvailable);
    };
  }, []);

  // Handle PWA install
  const handleInstall = async () => {
    const installed = await pwaService.showInstallPrompt();
    if (installed) {
      setShowPWAPrompt(false);
    }
  };

  // Handle app update
  const handleUpdate = async () => {
    await pwaService.updateApp();
  };

  // For mobile in portrait mode during workout, show optimized interface
  if (isMobile && isPortrait && activeTab === 'workouts') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <MobileWorkoutInterface />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-20 md:pb-0">
      {/* PWA Install Banner */}
      {showPWAPrompt && !pwaService.isPWA() && (
        <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white p-4 z-50">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <p className="font-medium">Install AI Fitness Coach</p>
              <p className="text-sm opacity-90">Get the full app experience</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium"
              >
                Install
              </button>
              <button
                onClick={() => setShowPWAPrompt(false)}
                className="text-white opacity-70"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Available Banner */}
      {isUpdateAvailable && (
        <div className="fixed bottom-20 md:bottom-4 left-4 right-4 bg-green-600 text-white p-4 rounded-lg z-40 max-w-sm mx-auto">
          <p className="font-medium mb-2">Update Available</p>
          <button
            onClick={handleUpdate}
            className="bg-white text-green-600 px-4 py-2 rounded font-medium"
          >
            Update Now
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Suspense fallback={<LoadingScreen />}>
          {activeTab === 'workouts' && <WorkoutsTab />}
          {activeTab === 'coach' && <AIChatInterface />}
          {activeTab === 'form' && <FormAnalysisInterface />}
          {activeTab === 'biometrics' && <BiometricsDashboard />}
        </Suspense>
      </main>

      {/* Bottom Navigation - Mobile Only */}
      {isMobile && (
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      )}

      {/* Desktop Navigation */}
      {!isMobile && (
        <nav className="fixed top-0 left-0 right-0 bg-gray-800 z-40">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <h1 className="text-xl font-bold text-blue-500">AI Fitness Coach</h1>
              <div className="flex gap-6">
                {[
                  { id: 'workouts', label: 'Workouts' },
                  { id: 'coach', label: 'AI Coach' },
                  { id: 'form', label: 'Form Analysis' },
                  { id: 'biometrics', label: 'Biometrics' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Offline Indicator */}
      {!navigator.onLine && (
        <div className="fixed bottom-4 left-4 bg-yellow-600 text-white px-4 py-2 rounded-lg z-30">
          Offline Mode
        </div>
      )}
    </div>
  );
};

export default App;
