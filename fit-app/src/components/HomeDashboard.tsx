import React, { useState, useEffect } from 'react';
import { AuthModal } from './AuthModal';
import { hybridStorageService } from '../services/hybridStorageService';
import { 
  Dumbbell, 
  Target, 
  Brain, 
  Apple, 
  TrendingUp, 
  User, 
  Clock, 
  Flame, 
  Zap, 
  Calendar,
  Plus,
  ArrowRight,
  Activity,
  Heart,
  Trophy,
  MessageCircle,
  Camera,
  BarChart3,
  Settings,
  Play,
  Pause,
  RotateCcw,
  CheckCircle
} from 'lucide-react';
import { WorkoutGenerator } from './WorkoutGenerator';
import { WorkoutPlanner } from './WorkoutPlanner';
import { EnhancedWorkoutLogger } from './EnhancedWorkoutLogger';
import { IntegratedAICoach } from './ai/IntegratedAICoach';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { NimbusNutritionTracker } from '../nimbus/components/nutrition/NimbusNutritionTracker';
import { useWorkout } from '../hooks/useWorkout';
import { workoutStorageService, DayWorkout } from '../services/workoutStorageService';

interface WidgetProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  badge?: React.ReactNode;
}

const Widget: React.FC<WidgetProps> = ({ title, icon, children, onClick, className = '', badge }) => {
  return (
    <div 
      className={`bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200 cursor-pointer ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="text-white/80">
            {icon}
          </div>
          <h3 className="font-semibold text-white">{title}</h3>
        </div>
        {badge && badge}
      </div>
      {children}
    </div>
  );
};

interface HomeDashboardProps {
  onNavigate: (tab: string) => void;
  workout: any;
  appSettings: any;
  onSettingsChange: (settings: any) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({ 
  onNavigate, 
  workout, 
  appSettings, 
  onSettingsChange 
}) => {
  const [showWorkoutPlanner, setShowWorkoutPlanner] = useState(false);
  const [showWorkoutGenerator, setShowWorkoutGenerator] = useState(false);
  const [showWorkoutLogger, setShowWorkoutLogger] = useState(false);
  const [showAICoach, setShowAICoach] = useState(false);
  const [showNutrition, setShowNutrition] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [weekWorkouts, setWeekWorkouts] = useState<DayWorkout[]>([]);
  const [userStats, setUserStats] = useState({
    workoutsThisWeek: 0,
    totalMinutes: 0,
    caloriesBurned: 0,
    currentStreak: 0,
    nextWorkout: 'No plan',
    lastWorkout: 'Never'
  });

  // Load workout data
  useEffect(() => {
    const loadWorkoutData = async () => {
      try {
        const workouts = await workoutStorageService.getCurrentWeekWorkouts();
        const stats = await workoutStorageService.getWorkoutStats();
        
        setWeekWorkouts(workouts);
        setUserStats({
          workoutsThisWeek: stats.thisWeekWorkouts,
          totalMinutes: stats.totalMinutes,
          caloriesBurned: Math.round(stats.totalMinutes * 6.67), // Rough estimate
          currentStreak: stats.currentStreak,
          nextWorkout: workouts.length > 0 ? 'Today' : 'No plan',
          lastWorkout: stats.completedWorkouts > 0 ? '2 days ago' : 'Never'
        });
      } catch (error) {
        console.error('Failed to load workout data:', error);
      }
    };

    loadWorkoutData();
  }, []);

  const quickActions = [
    { 
      title: weekWorkouts.length > 0 ? 'Today\'s Workout' : 'Start Workout', 
      icon: <Play className="w-5 h-5" />, 
      action: () => {
        if (weekWorkouts.length > 0) {
          const todayWorkout = weekWorkouts.find(w => !w.completed);
          if (todayWorkout) {
            console.log('Starting today\'s workout:', todayWorkout);
            // Navigate to workout logger with today's workout
          } else {
            setShowWorkoutLogger(true);
          }
        } else {
          setShowWorkoutLogger(true);
        }
      },
      color: 'from-green-500 to-emerald-600'
    },
    { 
      title: 'Workout Planner', 
      icon: <Target className="w-5 h-5" />, 
      action: () => setShowWorkoutPlanner(true),
      color: 'from-blue-500 to-indigo-600'
    },
    { 
      title: 'AI Coach', 
      icon: <Brain className="w-5 h-5" />, 
      action: () => setShowAICoach(true),
      color: 'from-purple-500 to-violet-600'
    },
    { 
      title: 'Log Nutrition', 
      icon: <Apple className="w-5 h-5" />, 
      action: () => setShowNutrition(true),
      color: 'from-orange-500 to-red-600'
    }
  ];

  const recentActivities = [
    { type: 'workout', name: 'Upper Body Strength', duration: '45 min', time: '2 days ago' },
    { type: 'nutrition', name: 'Breakfast logged', duration: '650 cal', time: '1 day ago' },
    { type: 'ai-coach', name: 'Form analysis', duration: '5 min', time: '3 days ago' }
  ];

  if (showWorkoutPlanner) {
    return (
      <div className="h-full">
        <WorkoutPlanner 
          onStartWorkout={(template) => {
            console.log('Starting workout with template:', template);
            // Here you would integrate with the workout logger
            setShowWorkoutPlanner(false);
          }}
          onBack={() => setShowWorkoutPlanner(false)}
        />
      </div>
    );
  }

  if (showWorkoutGenerator) {
    return (
      <div className="h-full">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => setShowWorkoutGenerator(false)}
            className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span>Back to Home</span>
          </button>
        </div>
        <WorkoutGenerator />
      </div>
    );
  }

  if (showWorkoutLogger) {
    return (
      <div className="h-full">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => setShowWorkoutLogger(false)}
            className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span>Back to Home</span>
          </button>
        </div>
        <EnhancedWorkoutLogger workout={workout} appSettings={appSettings} onSettingsChange={onSettingsChange} />
      </div>
    );
  }

  if (showAICoach) {
    return (
      <div className="h-full">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => setShowAICoach(false)}
            className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span>Back to Home</span>
          </button>
        </div>
        <IntegratedAICoach context={workout.getContext()} className="h-[calc(100vh-16rem)]" />
      </div>
    );
  }

  if (showNutrition) {
    return (
      <div className="h-full">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => setShowNutrition(false)}
            className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span>Back to Home</span>
          </button>
        </div>
        <NimbusNutritionTracker />
      </div>
    );
  }

  if (showAnalytics) {
    return (
      <div className="h-full">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => setShowAnalytics(false)}
            className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span>Back to Home</span>
          </button>
        </div>
        <AnalyticsDashboard />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Welcome Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-between mb-6">
          <div></div>
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-lg rounded-xl px-4 py-2 border border-white/20">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white font-medium">{currentUser.email}</span>
                </div>
                <button
                  onClick={() => hybridStorageService.signOut()}
                  className="bg-red-500/20 backdrop-blur-lg text-red-300 px-4 py-2 rounded-xl border border-red-500/30 hover:bg-red-500/30 transition-all duration-200 font-medium"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
        <h1 className="text-5xl font-bold text-white mb-3 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
          Welcome to FIT APP
        </h1>
        <p className="text-white/80 text-xl font-medium mb-2">Your AI-powered fitness companion</p>
        {!currentUser && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
            <div className={`w-2 h-2 rounded-full ${hybridStorageService.isUsingSupabase() ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
            <p className="text-white/70 text-sm font-medium">
              {hybridStorageService.isUsingSupabase() 
                ? '🔗 Cloud storage enabled' 
                : '💾 Local storage only'
              }
            </p>
          </div>
        )}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Widget title="This Week" icon={<Calendar className="w-5 h-5" />}>
          <div className="text-2xl font-bold text-white">{userStats.workoutsThisWeek}</div>
          <div className="text-white/60 text-sm">Workouts</div>
        </Widget>
        
        <Widget title="Minutes" icon={<Clock className="w-5 h-5" />}>
          <div className="text-2xl font-bold text-white">{userStats.totalMinutes}</div>
          <div className="text-white/60 text-sm">Active Time</div>
        </Widget>
        
        <Widget title="Calories" icon={<Flame className="w-5 h-5" />}>
          <div className="text-2xl font-bold text-white">{userStats.caloriesBurned}</div>
          <div className="text-white/60 text-sm">Burned</div>
        </Widget>
        
        <Widget title="Streak" icon={<Trophy className="w-5 h-5" />}>
          <div className="text-2xl font-bold text-white">{userStats.currentStreak}</div>
          <div className="text-white/60 text-sm">Days</div>
        </Widget>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className={`bg-gradient-to-r ${action.color} p-4 rounded-xl text-white font-semibold hover:scale-105 transition-all duration-200 flex flex-col items-center space-y-2`}
            >
              {action.icon}
              <span>{action.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Workout Logger Widget */}
        <Widget 
          title="Workout Logger" 
          icon={<Dumbbell className="w-5 h-5" />}
          onClick={() => setShowWorkoutLogger(true)}
          badge={workout.isActive && (
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          )}
        >
          <div className="space-y-2">
            <p className="text-white/70 text-sm">
              {workout.isActive ? 'Active workout in progress' : 'Track your exercises and progress'}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">
                {workout.isActive ? `${workout.duration} min` : 'Ready to start'}
              </span>
              <ArrowRight className="w-4 h-4 text-white/60" />
            </div>
          </div>
        </Widget>

        {/* AI Coach Widget */}
        <Widget 
          title="AI Coach" 
          icon={<Brain className="w-5 h-5" />}
          onClick={() => setShowAICoach(true)}
        >
          <div className="space-y-2">
            <p className="text-white/70 text-sm">Get personalized coaching and form analysis</p>
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Always available</span>
              <ArrowRight className="w-4 h-4 text-white/60" />
            </div>
          </div>
        </Widget>

        {/* Nutrition Tracker Widget */}
        <Widget 
          title="Nutrition" 
          icon={<Apple className="w-5 h-5" />}
          onClick={() => setShowNutrition(true)}
        >
          <div className="space-y-2">
            <p className="text-white/70 text-sm">Track meals, macros, and nutritional goals</p>
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Barcode scanning</span>
              <ArrowRight className="w-4 h-4 text-white/60" />
            </div>
          </div>
        </Widget>

        {/* Analytics Widget */}
        <Widget 
          title="Analytics" 
          icon={<BarChart3 className="w-5 h-5" />}
          onClick={() => setShowAnalytics(true)}
        >
          <div className="space-y-2">
            <p className="text-white/70 text-sm">View detailed progress and performance metrics</p>
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Advanced insights</span>
              <ArrowRight className="w-4 h-4 text-white/60" />
            </div>
          </div>
        </Widget>
      </div>

      {/* This Week's Workouts */}
      {weekWorkouts.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">This Week's Workouts</h2>
          <div className="space-y-3">
            {weekWorkouts.map((dayWorkout) => (
              <div 
                key={dayWorkout.id} 
                className={`bg-white/10 backdrop-blur-lg rounded-lg p-4 border-2 transition-all duration-200 cursor-pointer hover:bg-white/15 ${
                  dayWorkout.completed ? 'border-green-500/50' : 'border-white/20'
                }`}
                onClick={() => {
                  // Here you would navigate to the workout logger with this specific workout
                  console.log('Starting workout:', dayWorkout);
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      dayWorkout.completed ? 'bg-green-500/20' : 'bg-white/20'
                    }`}>
                      {dayWorkout.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <Dumbbell className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{dayWorkout.day}</h3>
                      <p className="text-white/70 text-sm">{dayWorkout.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white/60 text-sm">
                      {dayWorkout.exercises.length} exercises
                    </div>
                    {dayWorkout.completed && (
                      <div className="text-green-400 text-sm">
                        Completed
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">
                    {dayWorkout.exercises.length} exercises • ~{dayWorkout.exercises.length * 3} min
                  </span>
                  <div className="flex items-center space-x-2">
                    {dayWorkout.completed ? (
                      <span className="text-green-400">✓ Done</span>
                    ) : (
                      <button className="bg-green-600 text-white px-3 py-1 rounded-full text-xs hover:bg-green-700 transition-colors">
                        Start
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {recentActivities.map((activity, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-lg rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  {activity.type === 'workout' && <Dumbbell className="w-4 h-4 text-white" />}
                  {activity.type === 'nutrition' && <Apple className="w-4 h-4 text-white" />}
                  {activity.type === 'ai-coach' && <Brain className="w-4 h-4 text-white" />}
                </div>
                <div>
                  <p className="text-white font-medium">{activity.name}</p>
                  <p className="text-white/60 text-sm">{activity.duration} • {activity.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Workout Generation */}
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-white">Need a Workout?</h3>
            <p className="text-white/70">Generate a personalized workout plan in seconds</p>
          </div>
          <Target className="w-8 h-8 text-white/80" />
        </div>
        <button
          onClick={() => setShowWorkoutPlanner(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2"
        >
          <Zap className="w-5 h-5" />
          <span>Open Workout Planner</span>
        </button>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setShowAuthModal(false);
        }}
      />
    </div>
  );
}; 