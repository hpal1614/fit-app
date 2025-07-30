import React, { useState, useEffect } from 'react';
import {
  Activity,
  Calendar,
  Home,
  MessageCircle,
  User,
  Settings,
  Bell,
  Search,
  Target,
  TrendingUp,
  Mic,
  Brain,
  Apple,
  Dumbbell
} from 'lucide-react';
import { WorkoutLoggerTab } from './components/active/WorkoutLoggerTab';
import { AIChatInterface } from './components/active/AIChatInterface';
import { WorkoutGenerator } from './components/active/WorkoutGenerator';
import { NutritionTab } from './components/active/NutritionTab';
import { UserProfileCard } from './components/UserProfileCard';
import { VoiceAssistant } from './components/active/VoiceAssistant';
import { MCPProvider } from './providers/MCPProvider';
import { useWorkout } from './hooks/useWorkout';
import { useVoice } from './hooks/useVoice';
import { databaseService } from './services/databaseService';

// Define only 5 tabs
type TabType = 'home' | 'workouts' | 'nutrition' | 'coach' | 'profile';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotificationBadge, setShowNotificationBadge] = useState(true);
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  
  const { workout } = useWorkout();
  const { isSupported: voiceSupported } = useVoice();
  
  const [userProfile] = useState({
    name: 'JAXON',
    level: 'Advanced',
    team: 'Morning Crew',
    currentGoal: 'Build Strength'
  });

  const [userStats] = useState({
    workoutsThisWeek: 5,
    currentStreak: 12,
    totalWorkouts: 156,
    achievements: 24
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    databaseService.initialize();
  }, []);

  return (
    <MCPProvider>
      <div className="h-screen w-screen bg-black text-white relative overflow-hidden flex flex-col">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-lime-500/10 rounded-full filter blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-500/10 rounded-full filter blur-3xl animate-pulse delay-75" />
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

        {/* User Profile Card - Show on home tab */}
        {activeTab === 'home' && (
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
          {/* Home Tab - Quick Actions */}
          {activeTab === 'home' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold mb-4">Quick Actions</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveTab('workouts')}
                  className="p-6 bg-gradient-to-br from-lime-400/20 to-green-500/20 rounded-2xl border border-lime-400/30 hover:border-lime-400/50 transition-all"
                >
                  <Dumbbell className="w-10 h-10 mb-3 text-lime-400" />
                  <h3 className="text-lg font-semibold">Start Workout</h3>
                  <p className="text-sm text-gray-400 mt-1">Log your exercises</p>
                </button>

                <button
                  onClick={() => setActiveTab('coach')}
                  className="p-6 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-2xl border border-blue-400/30 hover:border-blue-400/50 transition-all"
                >
                  <Brain className="w-10 h-10 mb-3 text-blue-400" />
                  <h3 className="text-lg font-semibold">AI Coach</h3>
                  <p className="text-sm text-gray-400 mt-1">Get instant help</p>
                </button>

                <button
                  onClick={() => setActiveTab('nutrition')}
                  className="p-6 bg-gradient-to-br from-orange-400/20 to-red-500/20 rounded-2xl border border-orange-400/30 hover:border-orange-400/50 transition-all"
                >
                  <Apple className="w-10 h-10 mb-3 text-orange-400" />
                  <h3 className="text-lg font-semibold">Nutrition</h3>
                  <p className="text-sm text-gray-400 mt-1">Track your meals</p>
                </button>

                <button
                  onClick={() => setActiveTab('profile')}
                  className="p-6 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-2xl border border-purple-400/30 hover:border-purple-400/50 transition-all"
                >
                  <TrendingUp className="w-10 h-10 mb-3 text-purple-400" />
                  <h3 className="text-lg font-semibold">Progress</h3>
                  <p className="text-sm text-gray-400 mt-1">View your stats</p>
                </button>
              </div>

              {/* Recent Activity */}
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="p-4 bg-gray-800/50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Upper Body Workout</p>
                        <p className="text-sm text-gray-400">2 hours ago</p>
                      </div>
                      <div className="text-lime-400 font-semibold">45 min</div>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-800/50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Morning Run</p>
                        <p className="text-sm text-gray-400">Yesterday</p>
                      </div>
                      <div className="text-lime-400 font-semibold">5.2 km</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'workouts' && (
            <div>
              <h2 className="text-3xl font-bold mb-6">Workout Logger</h2>
              <WorkoutLoggerTab workout={workout} />
            </div>
          )}
          
          {activeTab === 'nutrition' && <NutritionTab />}
          
          {activeTab === 'coach' && (
            <AIChatInterface 
              workoutContext={workout} 
              onClose={() => setActiveTab('home')}
              className="h-[calc(100vh-12rem)]"
            />
          )}
          
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold mb-6">Your Profile</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                  <span>Name</span>
                  <span className="text-lime-400 font-semibold">{userProfile.name}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                  <span>Fitness Level</span>
                  <span className="text-lime-400">{userProfile.level}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                  <span>Current Goal</span>
                  <span className="text-lime-400">{userProfile.currentGoal}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                  <span>Total Workouts</span>
                  <span className="text-lime-400">{userStats.totalWorkouts}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                  <span>Current Streak</span>
                  <span className="text-lime-400">{userStats.currentStreak} days</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Voice Assistant Button */}
        <button
          onClick={() => setShowVoiceAssistant(true)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-r from-lime-400 to-green-500 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-50"
        >
          <Mic className="w-6 h-6 text-black" />
        </button>

        {/* Bottom Navigation - 5 tabs only */}
        <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-lg border-t border-gray-800 z-50">
          <div className="flex items-center justify-around py-2">
            {[
              { icon: Home, label: 'Home', key: 'home' },
              { icon: Dumbbell, label: 'Workout', key: 'workouts' },
              { icon: Apple, label: 'Nutrition', key: 'nutrition' },
              { icon: MessageCircle, label: 'Coach', key: 'coach' },
              { icon: User, label: 'Profile', key: 'profile' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabType)}
                className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-lg transition-colors ${
                  activeTab === tab.key 
                    ? 'text-lime-400' 
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <tab.icon className="w-6 h-6" />
                <span className="text-xs">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Voice Assistant Modal */}
        {showVoiceAssistant && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full">
              <VoiceAssistant onClose={() => setShowVoiceAssistant(false)} />
            </div>
          </div>
        )}
      </div>
    </MCPProvider>
  );
}

export default App;