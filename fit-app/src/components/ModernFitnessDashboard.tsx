import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Heart, 
  Flame, 
  TrendingUp, 
  Calendar,
  Target,
  Award,
  Users,
  BarChart3,
  Brain,
  Mic,
  Camera,
  Settings,
  ChevronRight,
  Plus,
  Play,
  Pause,
  CheckCircle,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
  X,
  Send
} from 'lucide-react';
import { useMCPBiometrics, useMCPProgress, useMCPWorkoutGeneration } from '../hooks/useMCP';
import { useWorkout } from '../hooks/useWorkout';
// import { useMobile, useSwipeNavigation } from '../hooks/useMobile';
import { SimpleAIChat } from './SimpleAIChat';
import { WorkoutGenerator } from './WorkoutGenerator';

export const ModernFitnessDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAIChat, setShowAIChat] = useState(false);
  const [showWorkoutGenerator, setShowWorkoutGenerator] = useState(false);
  
  const { monitorBiometrics } = useMCPBiometrics();
  const { trackProgress } = useMCPProgress();
  const { generateWorkout } = useMCPWorkoutGeneration();
  const workout = useWorkout();
  const mainRef = useRef<HTMLElement>(null);

  // Mobile features - temporarily disabled for debugging
  // const { 
  //   isMobile, 
  //   isInstalled,
  //   orientation,
  //   networkStatus,
  //   batteryLevel,
  //   capabilities,
  //   vibrate,
  //   requestWakeLock,
  //   releaseWakeLock
  // } = useMobile({
  //   enableWakeLock: workout.isActive,
  //   enableSwipeGestures: true,
  //   enablePullToRefresh: true,
  //   onRefresh: async () => {
  //     await handleRefreshData();
  //   }
  // });
  
  // Temporary mock values
  const isMobile = false;
  const isInstalled = false;
  const networkStatus = { online: true };
  const batteryLevel = null;
  const capabilities = { wakeLock: false };
  const vibrate = () => {};
  const requestWakeLock = async () => false;
  const releaseWakeLock = async () => {};

  // Tab navigation array
  const tabs = ['dashboard', 'workouts', 'nutrition', 'ai-coach'];
  
  // Swipe navigation - temporarily disabled
  // const swipeHandlers = useSwipeNavigation(
  //   () => navigateTab('next'),     // Swipe left
  //   () => navigateTab('previous'),  // Swipe right
  //   undefined,
  //   undefined
  // );
  const swipeHandlers = {};

  // Navigate between tabs
  const navigateTab = (direction: 'next' | 'previous') => {
    const currentIndex = tabs.indexOf(activeTab);
    let newIndex: number;
    
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % tabs.length;
    } else {
      newIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
    }
    
    setActiveTab(tabs[newIndex]);
    vibrate({ type: 'selection', intensity: 'light' });
  };

  // Refresh data
  const handleRefreshData = async () => {
    vibrate({ type: 'notification', intensity: 'medium' });
    await Promise.all([
      monitorBiometrics(['heart_rate', 'recovery']),
      trackProgress('strength', 'week')
    ]);
  };

  // Mock data for demonstration
  const [biometricData, setBiometricData] = useState({
    heartRate: 72,
    calories: 2150,
    steps: 8432,
    activeMinutes: 45,
    recovery: 78,
    sleep: 7.5
  });

  // Handle workout start with mobile features
  const handleStartWorkout = async () => {
    console.log('Start workout clicked!');
    
    try {
      vibrate({ type: 'impact', intensity: 'heavy' });
      
      if (isMobile && capabilities.wakeLock) {
        await requestWakeLock();
      }
      
      // Start workout logic here
      console.log('Starting workout with mobile features enabled');
      
      // You can add more workout logic here or navigate to workout page
      alert('Workout starting! (This is a demo - implement your workout logic here)');
    } catch (error) {
      console.error('Error starting workout:', error);
    }
  };



  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white"
      {...(isMobile ? swipeHandlers : {})}
    >
      {/* Header with mobile status indicators */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 safe-area-top">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">FitTrack Pro</h1>
              {isInstalled && (
                <p className="text-xs text-blue-400">Installed App</p>
              )}
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'dashboard' 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('workouts')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'workouts' 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Workouts
            </button>
            <button 
              onClick={() => setActiveTab('nutrition')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'nutrition' 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Nutrition
            </button>
            <button 
              onClick={() => setActiveTab('ai-coach')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'ai-coach' 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              AI Coach
            </button>
          </nav>

          <div className="flex items-center space-x-4">
            {/* Mobile status indicators */}
            {isMobile && (
              <>
                {networkStatus.online ? (
                  <Wifi className="w-4 h-4 text-green-400" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-400" />
                )}
                {batteryLevel !== null && (
                  batteryLevel > 20 ? (
                    <Battery className="w-4 h-4 text-green-400" />
                  ) : (
                    <BatteryLow className="w-4 h-4 text-orange-400" />
                  )
                )}
              </>
            )}
            <button 
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              onClick={() => vibrate({ type: 'selection', intensity: 'light' })}
            >
              <Settings className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
          </div>
        </div>
      </header>

      {/* Main Content with pull-to-refresh */}
      <main 
        ref={mainRef}
        className={`max-w-7xl mx-auto px-4 py-8 ${isMobile ? 'pb-24' : ''}`}
      >
        {/* Swipe indicator for mobile */}
        {isMobile && (
          <div className="flex justify-center mb-4">
            <div className="flex space-x-2">
              {tabs.map((tab, index) => (
                <div
                  key={tab}
                  className={`h-2 rounded-full transition-all ${
                    activeTab === tab 
                      ? 'w-8 bg-white' 
                      : 'w-2 bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Hero Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div 
                className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-lg rounded-2xl p-6 border border-blue-500/20 touch-manipulation"
                onClick={() => vibrate({ type: 'selection', intensity: 'light' })}
              >
                <div className="flex items-center justify-between mb-4">
                  <Heart className="w-8 h-8 text-blue-400" />
                  <span className="text-sm text-blue-300">+2%</span>
                </div>
                <p className="text-3xl font-bold mb-1">{biometricData.heartRate}</p>
                <p className="text-gray-400">Heart Rate</p>
              </div>

              <div 
                className="bg-gradient-to-br from-orange-600/20 to-orange-800/20 backdrop-blur-lg rounded-2xl p-6 border border-orange-500/20 touch-manipulation"
                onClick={() => vibrate({ type: 'selection', intensity: 'light' })}
              >
                <div className="flex items-center justify-between mb-4">
                  <Flame className="w-8 h-8 text-orange-400" />
                  <span className="text-sm text-orange-300">+125</span>
                </div>
                <p className="text-3xl font-bold mb-1">{biometricData.calories}</p>
                <p className="text-gray-400">Calories Burned</p>
              </div>

              <div 
                className="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-lg rounded-2xl p-6 border border-green-500/20 touch-manipulation"
                onClick={() => vibrate({ type: 'selection', intensity: 'light' })}
              >
                <div className="flex items-center justify-between mb-4">
                  <Activity className="w-8 h-8 text-green-400" />
                  <span className="text-sm text-green-300">85%</span>
                </div>
                <p className="text-3xl font-bold mb-1">{biometricData.steps}</p>
                <p className="text-gray-400">Steps Today</p>
              </div>

              <div 
                className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/20 touch-manipulation"
                onClick={() => vibrate({ type: 'selection', intensity: 'light' })}
              >
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="w-8 h-8 text-purple-400" />
                  <span className="text-sm text-purple-300">+15%</span>
                </div>
                <p className="text-3xl font-bold mb-1">{biometricData.recovery}%</p>
                <p className="text-gray-400">Recovery Score</p>
              </div>
            </div>

            {/* Activity Chart - Simplified for mobile */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Weekly Activity</h2>
                <button 
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                  onClick={() => vibrate({ type: 'selection', intensity: 'light' })}
                >
                  View Details <ChevronRight className="inline w-4 h-4" />
                </button>
              </div>
              
              <div className={`grid grid-cols-7 gap-${isMobile ? '1' : '2'} mb-4`}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                  <div key={day} className="text-center">
                    <div className={`h-32 bg-gradient-to-t rounded-lg mb-2 ${
                      index < 4 
                        ? 'from-blue-600/40 to-blue-400/20' 
                        : 'from-gray-600/20 to-gray-400/10'
                    }`} style={{ height: `${Math.random() * 80 + 50}px` }} />
                    <p className={`text-${isMobile ? 'xs' : 'xs'} text-gray-400`}>{day}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button 
                className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-left hover:scale-105 transition-transform touch-manipulation"
                onClick={handleStartWorkout}
              >
                <div className="flex items-center justify-between mb-4">
                  <Play className="w-8 h-8" />
                  <ChevronRight className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Start Workout</h3>
                <p className="text-gray-300 text-sm">AI-powered session ready</p>
              </button>

              <button 
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 text-left border border-white/10 hover:bg-white/10 transition-colors touch-manipulation"
                onClick={() => {
                  console.log('Log Meal clicked!');
                  vibrate({ type: 'selection', intensity: 'light' });
                  setActiveTab('nutrition');
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <Camera className="w-8 h-8 text-green-400" />
                  <ChevronRight className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Log Meal</h3>
                <p className="text-gray-400 text-sm">Scan or photo capture</p>
              </button>

              <button 
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 text-left border border-white/10 hover:bg-white/10 transition-colors touch-manipulation"
                onClick={() => {
                  console.log('AI Analysis clicked!');
                  vibrate({ type: 'selection', intensity: 'light' });
                  setActiveTab('ai-coach');
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <Brain className="w-8 h-8 text-purple-400" />
                  <ChevronRight className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold mb-1">AI Analysis</h3>
                <p className="text-gray-400 text-sm">Get personalized insights</p>
              </button>
            </div>

            {/* Recent Achievements */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-semibold mb-4">Recent Achievements</h2>
              <div className="space-y-3">
                <div 
                  className="flex items-center space-x-4 p-3 rounded-lg hover:bg-white/5 transition-colors touch-manipulation"
                  onClick={() => vibrate({ type: 'selection', intensity: 'light' })}
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">7-Day Streak</p>
                    <p className="text-sm text-gray-400">Completed workouts every day this week</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>

                <div 
                  className="flex items-center space-x-4 p-3 rounded-lg hover:bg-white/5 transition-colors touch-manipulation"
                  onClick={() => vibrate({ type: 'selection', intensity: 'light' })}
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">New PR</p>
                    <p className="text-sm text-gray-400">Bench Press: 225 lbs x 5 reps</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'workouts' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold">Workouts</h2>
              <button 
                onClick={() => {
                  vibrate({ type: 'impact', intensity: 'medium' });
                  setShowWorkoutGenerator(true);
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 rounded-lg flex items-center space-x-2 hover:scale-105 transition-transform touch-manipulation"
              >
                <Plus className="w-5 h-5" />
                <span>Generate AI Workout</span>
              </button>
            </div>

            {/* Workout Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div 
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer touch-manipulation"
                onClick={() => vibrate({ type: 'selection', intensity: 'light' })}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <Activity className="w-6 h-6" />
                  </div>
                  <span className="text-sm text-gray-400">3x/week</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Full Body Strength</h3>
                <p className="text-gray-400 mb-4">Build overall strength with compound movements</p>
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-gray-900" />
                    <div className="w-8 h-8 bg-purple-500 rounded-full border-2 border-gray-900" />
                    <div className="w-8 h-8 bg-pink-500 rounded-full border-2 border-gray-900" />
                  </div>
                  <button className="text-blue-400 hover:text-blue-300 transition-colors">
                    Start <ChevronRight className="inline w-4 h-4" />
                  </button>
                </div>
              </div>

              <div 
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer touch-manipulation"
                onClick={() => vibrate({ type: 'selection', intensity: 'light' })}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <Flame className="w-6 h-6" />
                  </div>
                  <span className="text-sm text-gray-400">5x/week</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">HIIT Cardio Blast</h3>
                <p className="text-gray-400 mb-4">High-intensity intervals for maximum calorie burn</p>
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 bg-orange-500 rounded-full border-2 border-gray-900" />
                    <div className="w-8 h-8 bg-red-500 rounded-full border-2 border-gray-900" />
                  </div>
                  <button className="text-orange-400 hover:text-orange-300 transition-colors">
                    Start <ChevronRight className="inline w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active Workout Session */}
            {workout.isActive && (
              <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 backdrop-blur-lg rounded-2xl p-6 border border-green-500/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Workout in Progress</h3>
                  <button 
                    onClick={() => {
                      vibrate({ type: 'impact', intensity: 'light' });
                      workout.pauseWorkout();
                    }}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <Pause className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-3xl font-bold">{Math.floor(workout.elapsed / 60)}</p>
                    <p className="text-sm text-gray-400">Minutes</p>
                  </div>
                  <div>
                    <p className={`text-${isMobile ? 'xl' : '3xl'} font-bold`}>{workout.currentExercise?.name || '-'}</p>
                    <p className="text-sm text-gray-400">Current Exercise</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{workout.completedSets}</p>
                    <p className="text-sm text-gray-400">Sets Complete</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'nutrition' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold">Nutrition Tracking</h2>
              <button 
                className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 rounded-lg flex items-center space-x-2 hover:scale-105 transition-transform touch-manipulation"
                onClick={() => vibrate({ type: 'impact', intensity: 'medium' })}
              >
                <Camera className="w-5 h-5" />
                <span>Scan Food</span>
              </button>
            </div>

            {/* Macro Overview */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold mb-6">Today's Macros</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Protein</span>
                    <span className="font-medium">142g / 180g</span>
                  </div>
                  <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600" style={{ width: '79%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Carbs</span>
                    <span className="font-medium">215g / 250g</span>
                  </div>
                  <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-500 to-orange-600" style={{ width: '86%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Fats</span>
                    <span className="font-medium">68g / 80g</span>
                  </div>
                  <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600" style={{ width: '85%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Meals */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold mb-4">Recent Meals</h3>
              <div className="space-y-4">
                <div 
                  className="flex items-center space-x-4 p-4 rounded-lg bg-white/5 touch-manipulation"
                  onClick={() => vibrate({ type: 'selection', intensity: 'light' })}
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg" />
                  <div className="flex-1">
                    <p className="font-medium">Grilled Chicken Salad</p>
                    <p className="text-sm text-gray-400">385 cal • 42g protein • 18g carbs • 15g fat</p>
                  </div>
                  <span className="text-sm text-gray-400">2h ago</span>
                </div>
                <div 
                  className="flex items-center space-x-4 p-4 rounded-lg bg-white/5 touch-manipulation"
                  onClick={() => vibrate({ type: 'selection', intensity: 'light' })}
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg" />
                  <div className="flex-1">
                    <p className="font-medium">Post-Workout Shake</p>
                    <p className="text-sm text-gray-400">280 cal • 35g protein • 28g carbs • 4g fat</p>
                  </div>
                  <span className="text-sm text-gray-400">5h ago</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai-coach' && (
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                <Brain className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-bold mb-4">AI Fitness Coach</h2>
              <p className="text-gray-400 mb-8">
                Get personalized guidance, form checks, and real-time coaching powered by advanced AI
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <button 
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 text-left border border-white/10 hover:bg-white/10 transition-all hover:scale-105 touch-manipulation"
                onClick={() => {
                  vibrate({ type: 'selection', intensity: 'light' });
                  alert('Voice Coaching: This feature would enable real-time audio guidance during your workouts. (Demo)');
                }}
              >
                <Mic className="w-10 h-10 text-blue-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Voice Coaching</h3>
                <p className="text-gray-400">Real-time audio guidance during workouts</p>
              </button>

              <button 
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 text-left border border-white/10 hover:bg-white/10 transition-all hover:scale-105 touch-manipulation"
                onClick={() => {
                  vibrate({ type: 'selection', intensity: 'light' });
                  alert('Form Analysis: This feature would use your camera to analyze exercise form in real-time. (Demo)');
                }}
              >
                <Camera className="w-10 h-10 text-green-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Form Analysis</h3>
                <p className="text-gray-400">AI-powered movement pattern detection</p>
              </button>

              <button 
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 text-left border border-white/10 hover:bg-white/10 transition-all hover:scale-105 touch-manipulation"
                onClick={() => vibrate({ type: 'selection', intensity: 'light' })}
              >
                <BarChart3 className="w-10 h-10 text-purple-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Progress Insights</h3>
                <p className="text-gray-400">Detailed analytics and recommendations</p>
              </button>

              <button 
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 text-left border border-white/10 hover:bg-white/10 transition-all hover:scale-105 touch-manipulation"
                onClick={() => vibrate({ type: 'selection', intensity: 'light' })}
              >
                <Users className="w-10 h-10 text-orange-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Community</h3>
                <p className="text-gray-400">Connect with fitness enthusiasts</p>
              </button>
            </div>

            <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/20 max-w-2xl mx-auto text-center">
              <h3 className="text-2xl font-semibold mb-4">Ready to transform your fitness?</h3>
              <p className="text-gray-300 mb-6">
                Start your personalized AI coaching session now
              </p>
              <button 
                className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 rounded-lg text-lg font-medium hover:scale-105 transition-transform touch-manipulation"
                onClick={() => {
                  console.log('Start AI Session clicked!');
                  try {
                    vibrate({ type: 'impact', intensity: 'heavy' });
                  } catch (e) {
                    console.log('Vibrate not available');
                  }
                  setShowAIChat(true);
                  console.log('showAIChat set to:', true);
                }}
              >
                Start AI Session
              </button>
            </div>

            {/* AI Chat Interface */}
            <SimpleAIChat isOpen={showAIChat} onClose={() => setShowAIChat(false)} />
            
            {/* Workout Generator Modal */}
            {showWorkoutGenerator && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <WorkoutGenerator />
                  <div className="sticky bottom-0 bg-gray-900 p-4 border-t border-gray-800">
                    <button
                      onClick={() => setShowWorkoutGenerator(false)}
                      className="w-full bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation (Mobile) with safe area */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-lg border-t border-white/10 safe-area-bottom">
        <div className="grid grid-cols-4 gap-1 p-2">
          {[
            { id: 'dashboard', icon: Activity, label: 'Home' },
            { id: 'workouts', icon: Target, label: 'Workouts' },
            { id: 'nutrition', icon: Camera, label: 'Nutrition' },
            { id: 'ai-coach', icon: Brain, label: 'AI Coach' }
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => {
                setActiveTab(id);
                vibrate({ type: 'selection', intensity: 'light' });
              }}
              className={`flex flex-col items-center p-3 rounded-lg transition-all ${
                activeTab === id
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </nav>

    </div>
  );
};