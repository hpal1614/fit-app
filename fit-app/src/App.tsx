import React, { useState, useEffect } from 'react';
import { WorkoutDashboard } from './components/WorkoutDashboard';
import { AIChatInterface } from './components/AIChatInterface';
import { EnhancedAIChatInterface } from './components/ai/EnhancedAIChatInterface';
import { IntelligentAIChat } from './components/ai/IntelligentAIChat';
import { WorkoutsTab } from './components/WorkoutsTab';
import { NutritionTab } from './components/NutritionTab';
import { LadderInspiredNavigation } from './components/interface/LadderInspiredNavigation';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useWorkout } from './hooks/useWorkout';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [activeTab, setActiveTab] = useState('logger');
  const [isLoading, setIsLoading] = useState(true);
  
  const { isWorkoutActive, currentWorkout } = useWorkout();

  // Persist dark mode preference
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Initial loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" text="Loading your fitness dashboard..." />
        </div>
      );
    }

    switch (activeTab) {
      case 'logger':
        return (
          <ErrorBoundary fallback="Workout Logger Error">
            <WorkoutDashboard />
          </ErrorBoundary>
        );
      case 'workouts':
        return (
          <ErrorBoundary fallback="Workouts Tab Error">
            <WorkoutsTab />
          </ErrorBoundary>
        );
      case 'nutrition':
        return (
          <ErrorBoundary fallback="Nutrition Tab Error">
            <NutritionTab />
          </ErrorBoundary>
        );
      case 'coach':
        return (
          <ErrorBoundary fallback="AI Coach Error">
            <EnhancedAIChatInterface 
              onClose={() => setActiveTab('logger')}
              workoutContext={currentWorkout}
            />
          </ErrorBoundary>
        );
      case 'progress':
        return (
          <div className="flex items-center justify-center h-full text-center p-8">
            <div>
              <div className="text-6xl mb-4">📊</div>
              <h2 className="text-xl font-semibold mb-2">Progress Tracking</h2>
              <p className="text-gray-600 dark:text-gray-400">Detailed analytics coming soon!</p>
            </div>
          </div>
        );
      case 'profile':
        return (
          <div className="flex items-center justify-center h-full text-center p-8">
            <div>
              <div className="text-6xl mb-4">👤</div>
              <h2 className="text-xl font-semibold mb-2">User Profile</h2>
              <p className="text-gray-600 dark:text-gray-400">Profile management coming soon!</p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="flex items-center justify-center h-full text-center p-8">
            <div>
              <div className="text-6xl mb-4">⚙️</div>
              <h2 className="text-xl font-semibold mb-2">Settings</h2>
              <p className="text-gray-600 dark:text-gray-400">App settings coming soon!</p>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Toggle {isDarkMode ? 'Light' : 'Dark'} Mode
              </button>
            </div>
          </div>
        );
      default:
        return (
          <ErrorBoundary fallback="Default Tab Error">
            <WorkoutDashboard />
          </ErrorBoundary>
        );
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      {/* Gradient Header */}
      <header className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white sticky top-0 z-30 shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-xl">💪</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">AI Fitness Coach</h1>
                <p className="text-white/80 text-sm">
                  {isWorkoutActive ? `Active: ${currentWorkout?.name || 'Workout'}` : 'Ready to train'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Workout Status Indicator */}
              {isWorkoutActive && (
                <div className="flex items-center space-x-2 bg-white/20 rounded-full px-3 py-1 backdrop-blur-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Live</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Workout Progress Bar */}
          {isWorkoutActive && (
            <div className="mt-3 bg-white/20 rounded-full h-2 backdrop-blur-sm">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-500"
                style={{ width: '45%' }} // This would be dynamic based on workout progress
              />
            </div>
          )}
        </div>
      </header>

      {/* Content Area */}
      <main className="min-h-[calc(100vh-120px)] relative">
        {renderTabContent()}
      </main>

      {/* Ladder-Inspired Navigation */}
      <LadderInspiredNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isWorkoutActive={isWorkoutActive}
      />
    </div>
  );
}

export default App;
