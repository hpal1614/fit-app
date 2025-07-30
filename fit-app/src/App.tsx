import React, { useState, useEffect } from 'react';
import { 
  Dumbbell,
  MessageCircle, 
  BarChart3,
  Mic,
  User,
  Bell,
  Search,
  Settings,
  Clock,
  Zap,
  Heart
} from 'lucide-react';
import { WorkoutLoggerTab } from './components/WorkoutLoggerTab';
import { AIChatInterface } from './components/AIChatInterface';
import { MonitoringDashboard } from './components/MonitoringDashboard';
import { VoiceCoachInterface } from './components/VoiceCoachInterface';
import { UserProfileCard } from './components/UserProfileCard';
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

type TabType = 'workout' | 'ai-coach' | 'monitoring' | 'voice' | 'profile';

function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState<TabType>('workout');
  const [showNotificationBadge, setShowNotificationBadge] = useState(true);
  
  // Initialize hooks
  const workout = useWorkout();
  const { isSupported: voiceSupported } = useVoice();

  // Mock user data - replace with real data later
  const userProfile = {
    name: "Himanshu P",
    level: "Advanced",
    team: "Elite Performance"
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

  // Initialize database service
  useEffect(() => {
    databaseService.initialize();
  }, []);

  return (
    <div className="h-screen w-screen bg-black text-white relative overflow-hidden flex flex-col">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-lime-400 to-green-500 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-green-500 to-lime-400 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-lime-400 rounded-full blur-2xl opacity-30 animate-ping" />
      </div>

      {/* Premium Header */}
      <div className="relative z-10 flex items-center justify-between p-6 pt-12 bg-gradient-to-b from-black via-gray-900/50 to-transparent">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-14 h-14 bg-gradient-to-br from-lime-400 to-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-lime-400/30">
              <span className="text-3xl font-black text-black">{userProfile.name.charAt(0)}</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-lime-400 rounded-full flex items-center justify-center">
              <Zap className="w-3 h-3 text-black" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-lime-400 to-green-500 bg-clip-text text-transparent">
              FIT APP PRO
            </h1>
            <p className="text-gray-400 text-sm flex items-center gap-2">
              <Clock className="w-3 h-3" />
              {currentTime.toLocaleTimeString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="p-3 bg-gray-800/80 backdrop-blur rounded-xl hover:bg-gray-700/80 transition-all transform hover:scale-105">
            <Search className="w-5 h-5" />
          </button>
          <button 
            className="p-3 bg-gray-800/80 backdrop-blur rounded-xl relative hover:bg-gray-700/80 transition-all transform hover:scale-105"
            onClick={() => setShowNotificationBadge(false)}
          >
            <Bell className="w-5 h-5" />
            {showNotificationBadge && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-lime-400 rounded-full animate-pulse" />
            )}
          </button>
          <button className="p-3 bg-gray-800/80 backdrop-blur rounded-xl hover:bg-gray-700/80 transition-all transform hover:scale-105">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* User Stats Card - Show on specific tabs */}
      {['workout', 'monitoring', 'profile'].includes(activeTab) && (
        <div className="relative z-10 mx-6 mb-4">
          <UserProfileCard 
            userProfile={userProfile} 
            userStats={userStats}
            isActiveWorkout={workout.isActive}
            workoutDuration={workout.duration}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 pb-24">
        {activeTab === 'workout' && <WorkoutLoggerTab workout={workout} />}
        {activeTab === 'ai-coach' && (
          <AIChatInterface 
            workoutContext={workout.getContext()} 
            onClose={() => {}}
            className="h-full"
          />
        )}
        {activeTab === 'monitoring' && <MonitoringDashboard />}
        {activeTab === 'voice' && (
          <VoiceCoachInterface 
            workoutContext={workout.getContext()}
            onClose={() => {}}
          />
        )}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-gray-900/80 backdrop-blur-xl rounded-3xl p-8 border border-lime-400/20 shadow-2xl shadow-lime-400/10">
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-lime-400 to-green-500 bg-clip-text text-transparent">
                Profile Settings
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 bg-gray-800/50 rounded-2xl backdrop-blur">
                  <span className="text-gray-300">Fitness Level</span>
                  <span className="text-lime-400 font-bold">{userProfile.level}</span>
                </div>
                <div className="flex items-center justify-between p-5 bg-gray-800/50 rounded-2xl backdrop-blur">
                  <span className="text-gray-300">Team</span>
                  <span className="text-lime-400 font-bold">{userProfile.team}</span>
                </div>
                <div className="flex items-center justify-between p-5 bg-gray-800/50 rounded-2xl backdrop-blur">
                  <span className="text-gray-300">Voice Commands</span>
                  <span className={`font-bold ${voiceSupported ? "text-green-400" : "text-red-400"}`}>
                    {voiceSupported ? "Enabled" : "Not Supported"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-5 bg-gray-800/50 rounded-2xl backdrop-blur">
                  <span className="text-gray-300">Current Streak</span>
                  <span className="text-lime-400 font-bold flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    {userStats.currentStreak} days
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Premium Bottom Navigation - 5 Tabs */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-lime-400/20 z-50">
        <div className="relative">
          {/* Active tab indicator */}
          <div 
            className="absolute top-0 h-1 bg-gradient-to-r from-lime-400 to-green-500 transition-all duration-300"
            style={{
              width: '20%',
              left: `${['workout', 'ai-coach', 'monitoring', 'voice', 'profile'].indexOf(activeTab) * 20}%`
            }}
          />
          
          <div className="flex items-center justify-around py-3">
            {[
              { icon: Dumbbell, label: 'Workout', key: 'workout' },
              { icon: MessageCircle, label: 'AI Coach', key: 'ai-coach' },
              { icon: BarChart3, label: 'Monitoring', key: 'monitoring' },
              { icon: Mic, label: 'Voice', key: 'voice' },
              { icon: User, label: 'Profile', key: 'profile' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabType)}
                className={`relative flex flex-col items-center space-y-1 px-3 py-2 rounded-xl transition-all duration-300 ${
                  activeTab === tab.key 
                    ? 'text-lime-400 scale-110' 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {activeTab === tab.key && (
                  <div className="absolute inset-0 bg-lime-400/10 rounded-xl blur-xl" />
                )}
                <tab.icon className={`w-6 h-6 ${activeTab === tab.key ? 'drop-shadow-[0_0_8px_rgba(163,230,53,0.8)]' : ''}`} />
                <span className="text-[11px] font-semibold">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
