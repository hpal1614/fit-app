import React, { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { WorkoutDashboard } from './components/WorkoutDashboard';
import { AIChatInterface } from './components/AIChatInterface';
import { WorkoutsTab } from './components/WorkoutsTab';
import { BottomNavigation } from './components/BottomNavigation';
import { useWorkout } from './hooks/useWorkout';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('logger');
  const { isWorkoutActive } = useWorkout();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'logger':
        return <WorkoutDashboard />;
      case 'workouts':
        return <WorkoutsTab />;
      case 'nutrition':
        return (
          <div className="flex items-center justify-center h-full text-center p-8">
            <div>
              <div className="text-6xl mb-4">🍎</div>
              <h2 className="text-xl font-semibold mb-2">Nutrition Tracking</h2>
              <p className="text-gray-600 dark:text-gray-400">Coming soon!</p>
            </div>
          </div>
        );
      case 'coach':
        return <AIChatInterface onClose={() => setActiveTab('logger')} />;
      default:
        return <WorkoutDashboard />;
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">AI Fitness Coach</h1>
              <p className="text-blue-100 text-sm">Your personal training companion</p>
            </div>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <main className="pb-16 min-h-[calc(100vh-80px)]">
        {renderTabContent()}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isWorkoutActive={isWorkoutActive}
      />
    </div>
  );
}

export default App;
