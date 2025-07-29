import React, { useState, useEffect } from 'react';
import { 
  Bell,
  Search,
  Settings,
  Mic,
  Apple
} from 'lucide-react';
import { AIChatInterface } from './components/AIChatInterface';
import { WorkoutGenerator } from './components/WorkoutGenerator';
import { UserProfileCard } from './components/UserProfileCard';
import { VoiceAssistant } from './components/VoiceAssistant';
import { WorkoutLoggerDemo } from './components/WorkoutLoggerDemo';
import { BottomNavigation } from './components/BottomNavigation';
import { useWorkout } from './hooks/useWorkout';
import { useVoice } from './hooks/useVoice';
import { databaseService } from './services/databaseService';
import './App.css';

interface UserStats {
  workoutsThisWeek: number;
  totalMinutes: number;
  caloriesBurned: number;
  currentStreak: number;
}

type TabType = 'logger' | 'workouts' | 'nutrition' | 'coach';

function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState<TabType>('logger');
  const [showNotificationBadge, setShowNotificationBadge] = useState(true);
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  
  // Initialize hooks
  const workout = useWorkout();
  const { isSupported: voiceSupported } = useVoice();

  // Mock user data - replace with real data later
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

  // Initialize database service (Phase 3D)
  useEffect(() => {
    // PWAService is initialized automatically in its constructor
    // Just initialize the database service
    databaseService.initialize();
  }, []);

  // Check for onboarding
  useEffect(() => {
    const isOnboarded = localStorage.getItem('fitnessAppOnboarded');
    if (!isOnboarded) {
      console.log('User needs onboarding');
    }
  }, []);

  return (
    <div className="h-screen w-screen bg-black text-white relative overflow-hidden flex flex-col">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-lime-400 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-lime-400 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-6 pt-12">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-lime-400 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-black">
              {userProfile.name.charAt(0)}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">FIT APP</h1>
            <p className="text-gray-400 text-sm">{currentTime.toLocaleTimeString()}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button 
            className="p-2 bg-gray-800 rounded-full relative hover:bg-gray-700 transition-colors"
            onClick={() => setShowNotificationBadge(false)}
          >
            <Bell className="w-5 h-5" />
            {showNotificationBadge && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-lime-400 rounded-full" />
            )}
          </button>
          <button className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* User Profile Card - Show on logger tab */}
      {activeTab === 'logger' && (
        <div className="relative z-10 mx-6 mb-6">
          <UserProfileCard 
            userProfile={userProfile} 
            userStats={userStats}
            isActiveWorkout={workout.isActive}
            workoutDuration={workout.duration}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 pb-24">
        {activeTab === 'logger' && <WorkoutLoggerDemo />}
        {activeTab === 'workouts' && <WorkoutGenerator />}
        {activeTab === 'nutrition' && (
          <div className="space-y-6">
            <div className="bg-gray-900/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-800 text-center">
              <Apple className="w-16 h-16 mx-auto mb-4 text-green-400" />
              <h2 className="text-2xl font-bold mb-2">Nutrition Tracking</h2>
              <p className="text-gray-400">AI-powered nutrition tracking coming soon!</p>
              <div className="mt-6 space-y-3">
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <p className="text-sm">📸 Camera-based food logging</p>
                </div>
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <p className="text-sm">🧠 AI nutritional analysis</p>
                </div>
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <p className="text-sm">📊 Macro & calorie tracking</p>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'coach' && <AIChatInterface workoutContext={workout.getContext()} />}
      </div>

      {/* Voice Assistant Button */}
      <button
        onClick={() => setShowVoiceAssistant(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-r from-lime-400 to-green-500 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-50"
      >
        <Mic className="w-6 h-6 text-black" />
      </button>

      {/* Bottom Navigation - 4 tabs */}
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={(tab) => setActiveTab(tab as TabType)}
        workoutActive={workout.isActive}
      />

      {/* Voice Assistant */}
      {showVoiceAssistant && (
        <VoiceAssistant
          workoutContext={workout.getContext()}
          onClose={() => setShowVoiceAssistant(false)}
          onCommand={(command, response) => {
            console.log('Voice command:', command, 'Response:', response);
          }}
        />
      )}
    </div>
  );
}

export default App;
