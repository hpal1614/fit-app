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
import { TemplateManager } from './TemplateManager';
import { EnhancedWorkoutLogger } from './EnhancedWorkoutLogger';
import { IntegratedAICoach } from './ai/IntegratedAICoach';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { NimbusNutritionTracker } from '../nimbus/components/nutrition/NimbusNutritionTracker';
import { WeeklyWorkoutDisplay } from './WeeklyWorkoutDisplay';
import { useWorkout } from '../hooks/useWorkout';
import { workoutStorageService, DayWorkout, StoredWorkoutTemplate } from '../services/workoutStorageService';

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
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showPDFUpload, setShowPDFUpload] = useState(false);
  const [showWorkoutGenerator, setShowWorkoutGenerator] = useState(false);
  const [showWorkoutLogger, setShowWorkoutLogger] = useState(false);
  const [showAICoach, setShowAICoach] = useState(false);
  const [showNutrition, setShowNutrition] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [weekWorkouts, setWeekWorkouts] = useState<DayWorkout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<DayWorkout | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
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
        console.log('HomeDashboard: Loading workout data...');
        const workouts = await workoutStorageService.getCurrentWeekWorkouts();
        const stats = await workoutStorageService.getWorkoutStats();
        
        console.log('HomeDashboard: Loaded workouts:', workouts);
        console.log('HomeDashboard: Loaded stats:', stats);
        
        setWeekWorkouts(workouts);
        
        // Ensure stats object exists with fallback values
        const safeStats = stats || {
          thisWeekWorkouts: 0,
          totalMinutes: 0,
          currentStreak: 0,
          completedWorkouts: 0
        };
        setUserStats({
          workoutsThisWeek: safeStats.thisWeekWorkouts || 0,
          totalMinutes: safeStats.totalMinutes || 0,
          caloriesBurned: Math.round((safeStats.totalMinutes || 0) * 6.67), // Rough estimate
          currentStreak: safeStats.currentStreak || 0,
          nextWorkout: workouts.length > 0 ? 'Today' : 'No plan',
          lastWorkout: safeStats.completedWorkouts > 0 ? '2 days ago' : 'Never'
        });
      } catch (error) {
        console.error('Failed to load workout data:', error);
      }
    };

    loadWorkoutData();
  }, []);

  const handleDayClick = (workout: DayWorkout) => {
    console.log('Starting workout for day:', workout);
    setSelectedWorkout(workout);
    setShowWorkoutLogger(true);
  };

  // Add sample workout template for testing
  const addSampleTemplate = async () => {
    const sampleTemplate = {
      id: 'sample-template-1',
      name: 'Push Pull Legs Split',
      description: 'A balanced 6-day workout split',
      difficulty: 'intermediate' as const,
      duration: 4,
      category: 'strength' as const,
      goals: ['Build muscle', 'Increase strength'],
      equipment: ['Barbell', 'Dumbbells', 'Bench'],
      daysPerWeek: 6,
      estimatedTime: 60,
      rating: 4.5,
      downloads: 100,
      isCustom: true,
      schedule: [
        {
          day: 'Monday',
          name: 'Push Day',
          exercises: [
            { id: '1', name: 'Bench Press', sets: 4, reps: '8-10', restTime: 120 },
            { id: '2', name: 'Incline Dumbbell Press', sets: 3, reps: '8-10', restTime: 90 },
            { id: '3', name: 'Cable Chest Fly', sets: 3, reps: '12-15', restTime: 60 },
            { id: '4', name: 'Dips', sets: 3, reps: '8-12', restTime: 90 },
            { id: '5', name: 'Push-ups', sets: 3, reps: '15-20', restTime: 60 }
          ]
        },
        {
          day: 'Tuesday',
          name: 'Pull Day',
          exercises: [
            { id: '6', name: 'Deadlift', sets: 4, reps: '6-8', restTime: 180 },
            { id: '7', name: 'Barbell Rows', sets: 3, reps: '8-10', restTime: 120 },
            { id: '8', name: 'Pull-ups', sets: 3, reps: '8-12', restTime: 90 },
            { id: '9', name: 'Cable Rows', sets: 3, reps: '12-15', restTime: 60 },
            { id: '10', name: 'Bicep Curls', sets: 3, reps: '12-15', restTime: 60 }
          ]
        },
        {
          day: 'Wednesday',
          name: 'Legs Day',
          exercises: [
            { id: '11', name: 'Squats', sets: 4, reps: '8-10', restTime: 180 },
            { id: '12', name: 'Romanian Deadlift', sets: 3, reps: '8-10', restTime: 120 },
            { id: '13', name: 'Leg Press', sets: 3, reps: '10-12', restTime: 90 },
            { id: '14', name: 'Lunges', sets: 3, reps: '12-15', restTime: 60 },
            { id: '15', name: 'Calf Raises', sets: 4, reps: '15-20', restTime: 60 }
          ]
        },
        {
          day: 'Thursday',
          name: 'Back Workout',
          exercises: [
            { id: '16', name: 'Pull-ups', sets: 4, reps: '8-12', restTime: 120 },
            { id: '17', name: 'T-Bar Rows', sets: 3, reps: '8-10', restTime: 90 },
            { id: '18', name: 'Lat Pulldowns', sets: 3, reps: '10-12', restTime: 60 },
            { id: '19', name: 'Face Pulls', sets: 3, reps: '12-15', restTime: 60 },
            { id: '20', name: 'Shrugs', sets: 3, reps: '12-15', restTime: 60 }
          ]
        },
        {
          day: 'Friday',
          name: 'Chest & Shoulders',
          exercises: [
            { id: '21', name: 'Incline Bench Press', sets: 4, reps: '8-10', restTime: 120 },
            { id: '22', name: 'Military Press', sets: 3, reps: '8-10', restTime: 90 },
            { id: '23', name: 'Dumbbell Flyes', sets: 3, reps: '12-15', restTime: 60 },
            { id: '24', name: 'Lateral Raises', sets: 3, reps: '12-15', restTime: 60 },
            { id: '25', name: 'Dips', sets: 3, reps: '8-12', restTime: 90 }
          ]
        },
        {
          day: 'Saturday',
          name: 'Arms & Abs',
          exercises: [
            { id: '26', name: 'Barbell Curls', sets: 3, reps: '10-12', restTime: 60 },
            { id: '27', name: 'Tricep Dips', sets: 3, reps: '10-12', restTime: 60 },
            { id: '28', name: 'Hammer Curls', sets: 3, reps: '12-15', restTime: 60 },
            { id: '29', name: 'Planks', sets: 3, reps: '30s hold', restTime: 60 },
            { id: '30', name: 'Crunches', sets: 3, reps: '15-20', restTime: 60 }
          ]
        }
      ],
      createdAt: new Date(),
      isActive: true,
      currentWeek: 1,
      startDate: new Date()
    };

    try {
      await workoutStorageService.saveWorkoutTemplate(sampleTemplate);
      await workoutStorageService.activateWorkoutTemplate(sampleTemplate.id);
      console.log('Sample template added and activated successfully');
      
      // Reload workout data
      const workouts = await workoutStorageService.getCurrentWeekWorkouts();
      setWeekWorkouts(workouts);
      console.log('Loaded workouts:', workouts);
      
      // Show success message
      setSuccessMessage('Sample template added successfully!');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Failed to add sample template:', error);
      setSuccessMessage('Failed to add sample template');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    }
  };

  const quickActions = [
    { 
      title: 'Upload PDF', 
      icon: <Plus className="w-5 h-5" />, 
      action: () => {
        // Open PDF upload directly
        setShowPDFUpload(true);
        setShowTemplateManager(true);
      },
      color: 'from-pink-500 to-rose-600',
      highlight: true
    },
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
      title: 'Template Manager', 
      icon: <Target className="w-5 h-5" />, 
      action: () => setShowTemplateManager(true),
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

  if (showTemplateManager) {
    return (
      <div className="h-full">
        <TemplateManager 
          showPDFUpload={showPDFUpload}
          onStartWorkout={(workout) => {
            console.log('Starting workout:', workout);
            setSelectedWorkout(workout);
            setShowTemplateManager(false);
            setShowWorkoutLogger(true);
          }}
          onAddToHome={async (template) => {
            console.log('Adding template to home:', template);
            // Template is already saved and activated by the manager
            // Just reload the workout data to show on home
            const workouts = await workoutStorageService.getCurrentWeekWorkouts();
            setWeekWorkouts(workouts);
            setShowTemplateManager(false);
            
            // Show success message
            setSuccessMessage(`✅ "${template.name}" added to your weekly schedule!`);
            setShowSuccessMessage(true);
            setTimeout(() => setShowSuccessMessage(false), 5000);
          }}
          onBack={() => {
            setShowTemplateManager(false);
            setShowPDFUpload(false);
          }}
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
        <WorkoutGenerator onWorkoutGenerated={() => {}} />
      </div>
    );
  }

  if (showWorkoutLogger) {
    return (
      <div className="h-full">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => {
              setShowWorkoutLogger(false);
              setSelectedWorkout(null);
            }}
            className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span>Back to Home</span>
          </button>
          {selectedWorkout && (
            <div className="text-white/80 text-sm">
              {selectedWorkout.name} • {selectedWorkout.exercises.length} exercises
            </div>
          )}
        </div>
        <EnhancedWorkoutLogger workout={selectedWorkout || workout} appSettings={appSettings} onSettingsChange={onSettingsChange} />
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
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in">
          {successMessage}
        </div>
      )}

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
              className={`bg-gradient-to-r ${action.color} p-4 rounded-xl text-white font-semibold hover:scale-105 transition-all duration-200 flex flex-col items-center space-y-2 ${
                action.highlight ? 'ring-2 ring-white/30 shadow-lg animate-pulse' : ''
              }`}
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

        {/* Template Manager Widget */}
        <Widget 
          title="Template Manager" 
          icon={<Target className="w-5 h-5" />}
          onClick={() => setShowTemplateManager(true)}
        >
          <div className="space-y-2">
            <p className="text-white/70 text-sm">
              Create, manage, and use workout templates
            </p>
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">
                AI • PDF • Custom • History
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

      {/* Weekly Workout Display */}
      {weekWorkouts.length > 0 ? (
        <div className="mb-6">
          <WeeklyWorkoutDisplay 
            weekWorkouts={weekWorkouts}
            onDayClick={handleDayClick}
          />
        </div>
      ) : (
        <div className="mb-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 text-center">
            <h3 className="text-xl font-semibold text-white mb-2">No Workout Plan Yet</h3>
            <p className="text-white/70 mb-4">Get started with a sample workout template to see how it works!</p>
            <div className="space-y-3">
              <button
                onClick={addSampleTemplate}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
              >
                Add Sample Template
              </button>
              <div className="text-xs text-white/50">
                Click the button above to add a sample workout template and see the weekly calendar!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debug Info */}
      <div className="mb-6">
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10">
          <h4 className="text-sm font-semibold text-white/80 mb-2">Debug Info</h4>
          <div className="text-xs text-white/60 space-y-1">
            <div>Week Workouts: {weekWorkouts.length}</div>
            <div>Current Tab: Home</div>
            <div>Workout Active: {workout.isActive ? 'Yes' : 'No'}</div>
            <div>Template Creator: Available</div>
            <div>Integration: Complete ✅</div>
            <div>User Stats: {JSON.stringify(userStats)}</div>
            <div>Week Workouts Data: {weekWorkouts.map(w => `${w.name} (${w.exercises.length} ex)`).join(', ')}</div>
          </div>
          <div className="mt-3 space-y-2">
            <button
              onClick={addSampleTemplate}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
            >
              Add Sample Template
            </button>
            <button
              onClick={async () => {
                const templates = await workoutStorageService.getAllTemplates();
                console.log('All templates:', templates);
                alert(`Found ${templates.length} templates`);
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs ml-2"
            >
              Check Templates
            </button>
          </div>
        </div>
      </div>

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
          onClick={() => setShowWorkoutLogger(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2"
        >
          <Zap className="w-5 h-5" />
          <span>Open Workout Planner</span>
        </button>
      </div>

      {/* Floating Action Button for PDF Upload */}
      <button
        onClick={() => {
          setShowPDFUpload(true);
          setShowTemplateManager(true);
        }}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 flex items-center justify-center z-50 animate-pulse"
        title="Upload PDF Workout"
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuth={(user) => {
          setCurrentUser(user);
          setShowAuthModal(false);
        }}
      />
    </div>
  );
}; 