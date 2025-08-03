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
  Heart,
  Mic,
  Brain,
  Apple,
  Dumbbell,
  FileText,
  Share2,
  BarChart3,
  Activity,
  Sparkles,
  X,
  Camera
} from 'lucide-react';

// Nimbus UI Components
import { 
  NimbusBottomNavigation, 
  NavigationItem,
  NimbusCard,
  NimbusButton,
  NimbusTheme,
  NimbusStreamingChat,
  NimbusNutritionTracker,
} from './nimbus';
import { SimpleVoiceTest } from './components/voice/SimpleVoiceTest';

// Phase 4 Components
import { NimbusPDFUploader } from './components/nimbus/pdf/NimbusPDFUploader';
import { NimbusAdvancedAnalyticsDashboard } from './components/nimbus/analytics/NimbusAdvancedAnalyticsDashboard';

// Feature Components
import { WorkoutLoggerTab } from './components/WorkoutLoggerTab';
import { EnhancedWorkoutLogger } from './components/EnhancedWorkoutLogger';
import { IntegratedAICoach } from './components/ai/IntegratedAICoach';
import { WorkoutGenerator } from './components/WorkoutGenerator';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { UserProfileCard } from './components/UserProfileCard';

// Hooks & Services
import { useWorkout } from './hooks/useWorkout';
import { useVoice } from './hooks/useVoice';
import { databaseService } from './services/databaseService';

// Phase 4 Services
import { NimbusPWAService } from './services/nimbus/NimbusPWAService';
import { NimbusPerformanceOptimizer } from './services/nimbus/NimbusPerformanceOptimizer';
import { NimbusPDFWorkout } from './services/nimbus/NimbusPDFParser';

import './App.css';

interface UserStats {
  workoutsThisWeek: number;
  totalMinutes: number;
  caloriesBurned: number;
  currentStreak: number;
}

type TabType = 'workouts' | 'generator' | 'ai-coach' | 'nutrition' | 'analytics' | 'profile';

function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState<TabType>('workouts');
  const [showNotificationBadge, setShowNotificationBadge] = useState(true);
  const [parsedWorkout, setParsedWorkout] = useState<NimbusPDFWorkout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Initialize hooks
  const workout = useWorkout();
  const { isSupported: voiceSupported } = useVoice();

  // Initialize Phase 4 services
  const pwaService = new NimbusPWAService();
  const performanceOptimizer = new NimbusPerformanceOptimizer();

  // Mock user data - replace with real data later
  const userProfile = {
    name: "Himanshu P",
    level: "Intermediate",
    team: "Transform",
    avatar: "HP",
    profileImage: profileImage
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

  // Handle escape key to close profile modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showProfileModal) {
        setShowProfileModal(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showProfileModal]);

  // Initialize Phase 4 features
  useEffect(() => {
    const initializePhase4 = async () => {
      try {
        // Register PWA service worker
        await pwaService.registerServiceWorker();
        
        // Start performance monitoring
        performanceOptimizer.startPerformanceMonitoring();
        
        // Optimize performance
        await performanceOptimizer.optimizeBundleSize();
        await performanceOptimizer.optimizeResponseTimes();
        performanceOptimizer.optimizeMemoryUsage();
        
        console.log('🚀 Phase 4 features initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Phase 4 features:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializePhase4();
  }, []);

  // Check for onboarding
  useEffect(() => {
    const isOnboarded = localStorage.getItem('fitnessAppOnboarded');
    if (!isOnboarded) {
      console.log('User needs onboarding');
    }
  }, []);

  // Simplified Navigation items
  const navigationItems: NavigationItem[] = [
    { key: 'workouts', label: 'Logger', icon: Dumbbell, badge: workout.isActive },
    { key: 'generator', label: 'Generate', icon: Target },
    { key: 'ai-coach', label: 'AI Coach', icon: Brain },
    { key: 'nutrition', label: 'Nutrition', icon: Apple },
    { key: 'analytics', label: 'Stats', icon: TrendingUp },
    { key: 'profile', label: 'Profile', icon: User, badge: showNotificationBadge ? 1 : undefined }
  ];

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-primary animate-pulse flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">FIT APP</h2>
          <p className="text-gray-400">Initializing your fitness journey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden flex flex-col">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-purple-500/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-6 pt-12">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button 
              onClick={() => setShowProfileModal(true)}
              className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 cursor-pointer group overflow-hidden relative"
            >
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt={userProfile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg font-bold text-white group-hover:text-lime-300 transition-colors">
                  {userProfile.avatar}
                </span>
              )}
              <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </button>
            {workout.isActive && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gradient">FIT APP</h1>
            <p className="text-gray-400 text-sm flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {currentTime.toLocaleTimeString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="btn btn-secondary btn-sm">
            <Search className="w-4 h-4" />
          </button>
          <button 
            className="btn btn-secondary btn-sm relative"
            onClick={() => setShowNotificationBadge(false)}
          >
            <Bell className="w-4 h-4" />
            {showNotificationBadge && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
          <button className="btn btn-secondary btn-sm">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowProfileModal(false)}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-md animate-fade-in-up">
            <div className="card card-elevated">
              {/* Close Button */}
              <button
                onClick={() => setShowProfileModal(false)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
              
              <UserProfileCard 
                userProfile={userProfile} 
                userStats={userStats}
                isActiveWorkout={workout.isActive}
                workoutDuration={workout.duration}
                onAvatarChange={setProfileImage}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 pb-24">
        <div className="animate-fade-in">
          {activeTab === 'workouts' && <EnhancedWorkoutLogger workout={workout} />}
          {activeTab === 'generator' && <WorkoutGenerator />}
          {activeTab === 'ai-coach' && (
            <IntegratedAICoach 
              context={workout.getContext()} 
              className="h-[calc(100vh-16rem)]"
            />
          )}
          {activeTab === 'nutrition' && <NimbusNutritionTracker />}
          {activeTab === 'analytics' && <AnalyticsDashboard />}
          {activeTab === 'profile' && (
            <div className="space-y-modern">
              <div className="card card-elevated">
                <h2 className="text-xl font-bold mb-4 text-gradient">Profile Settings</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 glass rounded-lg">
                    <span className="flex items-center">
                      <Activity className="w-4 h-4 mr-2 text-blue-400" />
                      Fitness Level
                    </span>
                    <span className="text-blue-400 font-medium">{userProfile.level}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 glass rounded-lg">
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-2 text-green-400" />
                      Team
                    </span>
                    <span className="text-green-400 font-medium">{userProfile.team}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 glass rounded-lg">
                    <span className="flex items-center">
                      <Mic className="w-4 h-4 mr-2 text-purple-400" />
                      Voice Commands
                    </span>
                    <span className={`font-medium ${voiceSupported ? "text-green-400" : "text-red-400"}`}>
                      {voiceSupported ? "Enabled" : "Not Supported"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 glass rounded-lg">
                    <span className="flex items-center">
                      <Zap className="w-4 h-4 mr-2 text-yellow-400" />
                      PWA Features
                    </span>
                    <span className="text-yellow-400 font-medium">Active</span>
                  </div>
                  <div className="flex items-center justify-between p-3 glass rounded-lg">
                    <span className="flex items-center">
                      <Heart className="w-4 h-4 mr-2 text-red-400" />
                      Offline Storage
                    </span>
                    <span className="text-red-400 font-medium">Enabled</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nimbus Bottom Navigation */}
      <NimbusBottomNavigation
        items={navigationItems}
        activeKey={activeTab}
        onNavigate={(key) => setActiveTab(key as TabType)}
      />
    </div>
  );
}

export default App;
