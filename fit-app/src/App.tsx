import React, { useState, useEffect } from 'react';
import {
  Home,
  MessageCircle,
  User,
  Settings,
  Bell,
  Search,
  Mic,
  Apple,
  Dumbbell,
  TrendingUp,
  Timer,
  Activity,
  Zap,
  Target,
  Wifi,
  WifiOff
} from 'lucide-react';

// Components
import { WorkoutLoggerTab } from './components/active/WorkoutLoggerTab';
import { AIChatInterface } from './components/active/AIChatInterface';
import { WorkoutGenerator } from './components/active/WorkoutGenerator';
import { NutritionTab } from './components/active/NutritionTab';
import { VoiceAssistant } from './components/active/VoiceAssistant';
import { UserProfileCard } from './components/UserProfileCard';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';

// Providers & Hooks
import { useWorkout } from './hooks/useWorkout';
import { useVoice } from './hooks/useVoice';
// import { useMCPTools } from './hooks/useMCPTools'; // Temporarily disabled

// Services
import { databaseService } from './services/databaseService';
import { pwaService } from './services/pwaService';

// Import AI test utility
import './services/testAI';

// Add direct test function to window
if (typeof window !== 'undefined') {
  window.testAIDirectly = async () => {
    console.log('🧪 Direct AI Test Starting...');
    try {
      const { freeAIService } = await import('./services/freeAIService');
      const response = await freeAIService.getResponse('How do I do a squat?');
      console.log('✅ Free AI Response:', response);
      return response;
    } catch (error) {
      console.error('❌ Direct AI Test Failed:', error);
      throw error;
    }
  };
}

// Define only 5 tabs
type TabType = 'home' | 'workouts' | 'nutrition' | 'coach' | 'profile';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotificationBadge, setShowNotificationBadge] = useState(true);
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showWorkoutGenerator, setShowWorkoutGenerator] = useState(false);
  
  const { workout, startWorkout, completeWorkout, addExercise } = useWorkout();
  const { isSupported: voiceSupported } = useVoice();
  
  // Safety check for workout object
  const safeWorkout = workout || { isActive: false, duration: 0, exercises: [] };
  // Temporarily disable MCP tools to fix black screen
  const analyzeForm = null;
  const generateAIWorkout = null;
  const analyzeBiometrics = null;
  const analyzeNutrition = null;
  const lookupExercise = null;
  const trackProgress = null;
  
  // TODO: Re-enable when MCP is fixed
  // const { 
  //   analyzeForm, 
  //   generateWorkout: generateAIWorkout, 
  //   analyzeBiometrics,
  //   analyzeNutrition,
  //   lookupExercise,
  //   trackProgress 
  // } = useMCPTools();
  
  const [userProfile] = useState({
    name: 'JAXON',
    level: 'Advanced',
    team: 'Morning Crew',
    currentGoal: 'Build Strength',
    age: 28,
    experienceLevel: 'advanced',
    goals: ['strength', 'muscle'],
    equipment: ['barbell', 'dumbbells', 'pullup_bar']
  });

  const [userStats] = useState({
    workoutsThisWeek: 5,
    currentStreak: 12,
    totalWorkouts: 156,
    achievements: 24,
    personalRecords: 8,
    totalVolume: '245,320 lbs'
  });

  // Initialize services
  useEffect(() => {
    // Initialize database
    databaseService.initialize();
    
    // Initialize PWA features (already initialized on import)
    try {
      // PWA service initializes automatically, just check if it's available
      if (pwaService && pwaService.getStatus) {
        const status = pwaService.getStatus();
        console.log('PWA service status:', status);
      } else {
        console.log('PWA service not available - app will work without offline features');
      }
    } catch (error) {
      console.warn('PWA initialization check failed:', error);
    }
    
    // Online/offline detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Quick action handlers
  const handleQuickWorkout = async (type: string) => {
    await startWorkout();
    setActiveTab('workouts');
    // Pre-populate with common exercises based on type
    if (type === 'upper') {
      await addExercise({
        id: Date.now().toString(),
        name: 'Bench Press',
        targetMuscle: 'Chest',
        sets: []
      });
    }
  };

  return (
    <div className="h-screen w-screen bg-black text-white relative overflow-hidden flex flex-col">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-lime-500/10 rounded-full filter blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-500/10 rounded-full filter blur-3xl animate-pulse delay-75" />
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-6 pt-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-lime-400 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-black">
                {userProfile.name.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">FIT APP</h1>
              <p className="text-gray-400 text-sm flex items-center gap-2">
                {currentTime.toLocaleTimeString()}
                {isOnline ? (
                  <Wifi className="w-3 h-3 text-green-400" />
                ) : (
                  <WifiOff className="w-3 h-3 text-red-400" />
                )}
              </p>
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
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-lime-400 rounded-full animate-pulse" />
              )}
            </button>
            <button className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex-1 overflow-y-auto px-4 pb-24">
          {/* Home Tab - Dashboard */}
          {activeTab === 'home' && (
            <div className="space-y-6">
              {/* User Profile Card */}
              <UserProfileCard 
                userProfile={userProfile} 
                userStats={userStats}
                isActiveWorkout={safeWorkout.isActive}
                workoutDuration={safeWorkout.duration}
              />
              
              {/* Quick Actions */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleQuickWorkout('upper')}
                    className="p-6 bg-gradient-to-br from-lime-400/20 to-green-500/20 rounded-2xl border border-lime-400/30 hover:border-lime-400/50 transition-all"
                  >
                    <Dumbbell className="w-10 h-10 mb-3 text-lime-400" />
                    <h3 className="text-lg font-semibold">Upper Body</h3>
                    <p className="text-sm text-gray-400 mt-1">Quick chest & arms</p>
                  </button>

                  <button
                    onClick={() => handleQuickWorkout('lower')}
                    className="p-6 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-2xl border border-blue-400/30 hover:border-blue-400/50 transition-all"
                  >
                    <Target className="w-10 h-10 mb-3 text-blue-400" />
                    <h3 className="text-lg font-semibold">Lower Body</h3>
                    <p className="text-sm text-gray-400 mt-1">Legs & glutes focus</p>
                  </button>

                  <button
                    onClick={() => {
                      setShowWorkoutGenerator(true);
                      setActiveTab('workouts');
                    }}
                    className="p-6 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-2xl border border-purple-400/30 hover:border-purple-400/50 transition-all"
                  >
                    <Zap className="w-10 h-10 mb-3 text-purple-400" />
                    <h3 className="text-lg font-semibold">AI Workout</h3>
                    <p className="text-sm text-gray-400 mt-1">Generate custom plan</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('nutrition')}
                    className="p-6 bg-gradient-to-br from-orange-400/20 to-red-500/20 rounded-2xl border border-orange-400/30 hover:border-orange-400/50 transition-all"
                  >
                    <Apple className="w-10 h-10 mb-3 text-orange-400" />
                    <h3 className="text-lg font-semibold">Track Food</h3>
                    <p className="text-sm text-gray-400 mt-1">Log your meals</p>
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="p-4 bg-gray-800/50 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-lime-400" />
                        <div>
                          <p className="font-medium">Upper Body Workout</p>
                          <p className="text-sm text-gray-400">2 hours ago • 12 exercises</p>
                        </div>
                      </div>
                      <div className="text-lime-400 font-semibold">45 min</div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-800/50 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Timer className="w-5 h-5 text-blue-400" />
                        <div>
                          <p className="font-medium">Morning Run</p>
                          <p className="text-sm text-gray-400">Yesterday • Outdoor</p>
                        </div>
                      </div>
                      <div className="text-blue-400 font-semibold">5.2 km</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Workout Tab - Logger + Generator */}
          {activeTab === 'workouts' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold">Workout</h2>
                <button
                  onClick={() => setShowWorkoutGenerator(!showWorkoutGenerator)}
                  className="px-4 py-2 bg-lime-400 text-black rounded-lg font-medium hover:bg-lime-500 transition-colors"
                >
                  {showWorkoutGenerator ? 'Logger' : 'AI Generator'}
                </button>
              </div>
              
              {showWorkoutGenerator ? (
                <WorkoutGenerator />
              ) : (
                <WorkoutLoggerTab workout={safeWorkout} />
              )}
            </div>
          )}
          
          {/* Nutrition Tab */}
          {activeTab === 'nutrition' && <NutritionTab />}
          
          {/* Coach Tab - Enhanced AI Chat */}
          {activeTab === 'coach' && (
            <AIChatInterface 
              workoutContext={safeWorkout} 
              onClose={() => setActiveTab('home')}
              className="h-[calc(100vh-12rem)]"
            />
          )}
          
          {/* Profile Tab - Stats + Settings */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold mb-6">Profile & Stats</h2>
              
              {/* User Info */}
              <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-4">User Profile</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Name</span>
                    <span className="font-medium">{userProfile.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Level</span>
                    <span className="font-medium">{userProfile.level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Goal</span>
                    <span className="font-medium">{userProfile.currentGoal}</span>
                  </div>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm">
                  <TrendingUp className="w-8 h-8 text-lime-400 mb-2" />
                  <p className="text-2xl font-bold">{userStats.currentStreak}</p>
                  <p className="text-sm text-gray-400">Day Streak</p>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm">
                  <Activity className="w-8 h-8 text-blue-400 mb-2" />
                  <p className="text-2xl font-bold">{userStats.totalWorkouts}</p>
                  <p className="text-sm text-gray-400">Total Workouts</p>
                </div>
              </div>
              
              {/* Analytics Dashboard */}
              <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-4">Analytics</h3>
                <AnalyticsDashboard />
              </div>
              
              {/* Settings */}
              <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-4">App Features</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Voice Commands</span>
                    <span className={voiceSupported ? "text-green-400" : "text-red-400"}>
                      {voiceSupported ? "Enabled" : "Not Supported"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Offline Mode</span>
                    <span className="text-green-400">Enabled</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>PWA Features</span>
                    <span className="text-green-400">Active</span>
                  </div>
                  <button 
                    onClick={async () => {
                      try {
                        if (pwaService && pwaService.showInstallPrompt) {
                          const installed = await pwaService.showInstallPrompt();
                          if (installed) {
                            console.log('App installed successfully!');
                          }
                        } else {
                          console.log('PWA install not available');
                        }
                      } catch (error) {
                        console.warn('PWA install failed:', error);
                      }
                    }}
                    className="w-full mt-4 px-4 py-2 bg-lime-400 text-black rounded-lg font-medium hover:bg-lime-500 transition-colors"
                  >
                    Install App
                  </button>
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
                className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-lg transition-all ${
                  activeTab === tab.key 
                    ? 'text-lime-400 scale-110' 
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <tab.icon className="w-6 h-6" />
                <span className="text-xs font-medium">{tab.label}</span>
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
  );
}

export default App;