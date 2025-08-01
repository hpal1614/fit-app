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
  Dumbbell
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
  NimbusVoiceDemo
} from './nimbus';

// Feature Components
import { WorkoutLoggerTab } from './components/WorkoutLoggerTab';
import { IntelligentAIChat } from './components/ai/IntelligentAIChat';
import { WorkoutGenerator } from './components/WorkoutGenerator';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { UserProfileCard } from './components/UserProfileCard';


// Hooks & Services
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

type TabType = 'workouts' | 'generator' | 'intelligent-ai' | 'nutrition' | 'coach' | 'voice-demo' | 'analytics' | 'profile';

function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState<TabType>('workouts');
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

  // Initialize database service
  useEffect(() => {
    databaseService.initialize();
  }, []);

  // Check for onboarding
  useEffect(() => {
    const isOnboarded = localStorage.getItem('fitnessAppOnboarded');
    if (!isOnboarded) {
      console.log('User needs onboarding');
    }
  }, []);

  // Navigation items for NimbusBottomNavigation
  const navigationItems: NavigationItem[] = [
    { key: 'workouts', label: 'Logger', icon: Dumbbell, badge: workout.isActive },
    { key: 'generator', label: 'Generate', icon: Target },
    { key: 'intelligent-ai', label: 'Smart AI', icon: Brain },
    { key: 'nutrition', label: 'Nutrition', icon: Apple },
    { key: 'coach', label: 'Coach', icon: MessageCircle },
    { key: 'voice-demo', label: 'Voice', icon: Mic },
    { key: 'analytics', label: 'Stats', icon: TrendingUp },
    { key: 'profile', label: 'Profile', icon: User, badge: showNotificationBadge ? 1 : undefined }
  ];

  return (
    <div className="h-screen w-screen bg-neutral-950 text-white relative overflow-hidden flex flex-col">
      {/* Nimbus Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary-400 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-primary-400 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Header with Nimbus styling */}
      <div className="relative z-10 flex items-center justify-between p-6 pt-12">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-black">
              {userProfile.name.charAt(0)}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">FIT APP</h1>
            <p className="text-neutral-400 text-sm">{currentTime.toLocaleTimeString()}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <NimbusButton
            variant="ghost"
            size="sm"
            icon={<Search className="w-5 h-5" />}
            aria-label="Search"
          />
          <NimbusButton
            variant="ghost"
            size="sm"
            icon={<Bell className="w-5 h-5" />}
            onClick={() => setShowNotificationBadge(false)}
            aria-label="Notifications"
          />
          <NimbusButton
            variant="ghost"
            size="sm"
            icon={<Settings className="w-5 h-5" />}
            aria-label="Settings"
          />
        </div>
      </div>

      {/* User Profile Card - Show on key tabs only */}
      {['workouts', 'analytics', 'profile'].includes(activeTab) && (
        <div className="relative z-10 mx-6 mb-6">
          <NimbusCard variant="glass" padding="lg">
            <UserProfileCard 
              userProfile={userProfile} 
              userStats={userStats}
              isActiveWorkout={workout.isActive}
              workoutDuration={workout.duration}
            />
          </NimbusCard>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 pb-24">
        {activeTab === 'workouts' && <WorkoutLoggerTab workout={workout} />}
        {activeTab === 'generator' && <WorkoutGenerator />}
        {activeTab === 'intelligent-ai' && <IntelligentAIChat className="h-[calc(100vh-16rem)]" />}
        {activeTab === 'nutrition' && <NimbusNutritionTracker />}
        {activeTab === 'coach' && (
          <NimbusStreamingChat 
            context={workout.getContext()} 
            className="h-full"
          />
        )}
        {activeTab === 'voice-demo' && <NimbusVoiceDemo />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'profile' && (
          <NimbusCard variant="glass">
            <h2 className="text-xl font-bold mb-4">Profile Settings</h2>
            <div className="space-y-3">
              <NimbusCard variant="bordered" padding="sm">
                <div className="flex items-center justify-between">
                  <span>Fitness Level</span>
                  <span className="text-primary-400">{userProfile.level}</span>
                </div>
              </NimbusCard>
              <NimbusCard variant="bordered" padding="sm">
                <div className="flex items-center justify-between">
                  <span>Team</span>
                  <span className="text-primary-400">{userProfile.team}</span>
                </div>
              </NimbusCard>
              <NimbusCard variant="bordered" padding="sm">
                <div className="flex items-center justify-between">
                  <span>Voice Commands</span>
                  <span className={voiceSupported ? "text-primary-400" : "text-red-400"}>
                    {voiceSupported ? "Enabled" : "Not Supported"}
                  </span>
                </div>
              </NimbusCard>
              <NimbusCard variant="bordered" padding="sm">
                <div className="flex items-center justify-between">
                  <span>PWA Features</span>
                  <span className="text-primary-400">Active</span>
                </div>
              </NimbusCard>
              <NimbusCard variant="bordered" padding="sm">
                <div className="flex items-center justify-between">
                  <span>Offline Storage</span>
                  <span className="text-primary-400">Enabled</span>
                </div>
              </NimbusCard>
            </div>
          </NimbusCard>
        )}
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
