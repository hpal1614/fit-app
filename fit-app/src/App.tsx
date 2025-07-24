import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  MessageCircle, 
  Users, 
  User,
  Flame,
  Clock,
  Zap,
  Bell,
  Search,
  Settings,
  TrendingUp,
  Plus,
  ChevronRight,
  Calendar,
  Target,
  Heart
} from 'lucide-react';
import { WorkoutLoggerTab } from './components/WorkoutLoggerTab';
import { AIChatInterface } from './components/AIChatInterface';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { UserProfileCard } from './components/UserProfileCard';
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
  const [activeTab, setActiveTab] = useState<'workouts' | 'coach' | 'analytics' | 'profile'>('workouts');
  const [showNotificationBadge, setShowNotificationBadge] = useState(true);
  
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

  // Check for onboarding
  useEffect(() => {
    const isOnboarded = localStorage.getItem('fitnessAppOnboarded');
    if (!isOnboarded) {
      // Show onboarding in future
      console.log('User needs onboarding');
    }
  }, []);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
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

      {/* User Profile Card - Show on all tabs */}
      <div className="relative z-10 mx-6 mb-6">
        <UserProfileCard 
          userProfile={userProfile} 
          userStats={userStats}
          isActiveWorkout={workout.isActive}
          workoutDuration={workout.duration}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 mx-6 mb-24">
        {activeTab === 'workouts' && <WorkoutLoggerTab workout={workout} />}
        {activeTab === 'coach' && <AIChatInterface workoutContext={workout.getContext()} />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Profile content */}
            <div className="bg-gray-900/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-800">
              <h2 className="text-xl font-bold mb-4">Profile Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                  <span>Fitness Level</span>
                  <span className="text-lime-400">{userProfile.level}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                  <span>Team</span>
                  <span className="text-lime-400">{userProfile.team}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                  <span>Voice Commands</span>
                  <span className={voiceSupported ? "text-green-400" : "text-red-400"}>
                    {voiceSupported ? "Enabled" : "Not Supported"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-lg border-t border-gray-800">
        <div className="flex items-center justify-around py-3">
          {[
            { icon: Trophy, label: 'Workouts', key: 'workouts' },
            { icon: MessageCircle, label: 'AI Coach', key: 'coach' },
            { icon: TrendingUp, label: 'Analytics', key: 'analytics' },
            { icon: User, label: 'Profile', key: 'profile' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.key ? 'text-lime-400' : 'text-gray-400'
              }`}
            >
              <tab.icon className="w-6 h-6" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
