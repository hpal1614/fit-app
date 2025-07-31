import React, { useState, useEffect } from 'react';
import { 
  Bell,
  Search,
  Settings,
  Mic
} from 'lucide-react';
import { Nimbus } from './components/Nimbus';
import { AIChatInterface } from './components/AIChatInterface';
import { WorkoutsTab } from './components/WorkoutsTab';
import { BottomNavigation } from './components/BottomNavigation';
import { useWorkout } from './hooks/useWorkout';
import { useVoice } from './hooks/useVoice';
import './App.css';

interface UserStats {
  workoutsThisWeek: number;
  totalMinutes: number;
  caloriesBurned: number;
  currentStreak: number;
}

function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('logger');
  const [showNotificationBadge, setShowNotificationBadge] = useState(true);
  
  // Initialize hooks
  const workout = useWorkout();
  const { isSupported: voiceSupported } = useVoice();

  // Mock user data
  const userProfile = {
    name: "Himanshu P",
    level: "Intermediate",
    team: "Transform"
  };

  const userStats: UserStats = {
    workoutsThisWeek: workout.workoutsThisWeek || 4,
    totalMinutes: workout.totalMinutesThisWeek || 320,
    caloriesBurned: workout.caloriesBurnedThisWeek || 1840,
    currentStreak: workout.currentStreak || 7
  };

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-lime-400 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-lime-400 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4 pt-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-lime-400 rounded-full flex items-center justify-center">
            <span className="text-lg font-bold text-black">
              {userProfile.name.charAt(0)}
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold">FIT APP</h1>
            <p className="text-gray-400 text-xs">{currentTime.toLocaleTimeString()}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors">
            <Search className="w-4 h-4" />
          </button>
          <button 
            className="p-2 bg-gray-800 rounded-full relative hover:bg-gray-700 transition-colors"
            onClick={() => setShowNotificationBadge(false)}
          >
            <Bell className="w-4 h-4" />
            {showNotificationBadge && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-lime-400 rounded-full" />
            )}
          </button>
          <button className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 pb-20">
        {/* Quick Stats Bar */}
        <div className="mb-4 grid grid-cols-4 gap-2">
          <div className="bg-gray-900/80 backdrop-blur-lg rounded-xl p-3 border border-gray-800">
            <p className="text-xs text-gray-400">This Week</p>
            <p className="text-lg font-bold text-lime-400">{userStats.workoutsThisWeek}</p>
          </div>
          <div className="bg-gray-900/80 backdrop-blur-lg rounded-xl p-3 border border-gray-800">
            <p className="text-xs text-gray-400">Minutes</p>
            <p className="text-lg font-bold">{userStats.totalMinutes}</p>
          </div>
          <div className="bg-gray-900/80 backdrop-blur-lg rounded-xl p-3 border border-gray-800">
            <p className="text-xs text-gray-400">Calories</p>
            <p className="text-lg font-bold">{userStats.caloriesBurned}</p>
          </div>
          <div className="bg-gray-900/80 backdrop-blur-lg rounded-xl p-3 border border-gray-800">
            <p className="text-xs text-gray-400">Streak</p>
            <p className="text-lg font-bold text-lime-400">{userStats.currentStreak}d</p>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'logger' && (
          <div>
            <Nimbus />
          </div>
        )}
        
        {activeTab === 'workouts' && <WorkoutsTab />}
        
        {activeTab === 'nutrition' && (
          <div className="bg-gray-900/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-800 text-center">
            <div className="text-6xl mb-4">🥗</div>
            <h2 className="text-xl font-bold mb-2">Nutrition Tracking</h2>
            <p className="text-gray-400 mb-4">AI-powered nutrition tracking coming soon!</p>
            <div className="space-y-2">
              <div className="p-3 bg-gray-800/50 rounded-lg text-sm">📸 Camera food logging</div>
              <div className="p-3 bg-gray-800/50 rounded-lg text-sm">🧠 AI nutritional analysis</div>
              <div className="p-3 bg-gray-800/50 rounded-lg text-sm">📊 Macro tracking</div>
            </div>
          </div>
        )}
        
        {activeTab === 'coach' && (
          <AIChatInterface workoutContext={workout.getContext()} />
        )}
      </div>

      {/* Voice Assistant Button */}
      <button
        className="fixed bottom-24 right-4 w-12 h-12 bg-gradient-to-r from-lime-400 to-green-500 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-50"
        onClick={() => console.log('Voice assistant')}
      >
        <Mic className="w-6 h-6 text-black" />
      </button>

      {/* Bottom Navigation is already styled with lime theme in BottomNavigation.tsx */}
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        workoutActive={workout.isActive}
      />
    </div>
  );
}

export default App;