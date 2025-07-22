// Enums for categorization
export enum ExerciseCategory {
  COMPOUND = 'compound',
  ISOLATION = 'isolation',
  CARDIO = 'cardio',
  FLEXIBILITY = 'flexibility',
  PLYOMETRIC = 'plyometric',
  FUNCTIONAL = 'functional'
}

export enum MuscleGroup {
  CHEST = 'chest',
  BACK = 'back',
  SHOULDERS = 'shoulders',
  BICEPS = 'biceps',
  TRICEPS = 'triceps',
  FOREARMS = 'forearms',
  CORE = 'core',
  QUADS = 'quad',
  HAMSTRINGS = 'hamstrings',
  GLUTES = 'glutes',
  CALVES = 'calves',
  FULL_BODY = 'full_body'
}

export enum EquipmentType {
  BARBELL = 'barbell',
  DUMBBELL = 'dumbbell',
  CABLE = 'cable',
  MACHINE = 'machine',
  BODYWEIGHT = 'bodyweight',
  KETTLEBELL = 'kettlebell',
  RESISTANCE_BAND = 'resistance_band',
  CARDIO_MACHINE = 'cardio_machine'
}

export enum WorkoutType {
  STRENGTH = 'strength',
  CARDIO = 'cardio',
  HYBRID = 'hybrid',
  FLEXIBILITY = 'flexibility',
  SPORTS = 'sports'
}

// Core data structures
export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  muscleGroups: MuscleGroup[];
  equipment: EquipmentType[];
  instructions: string[];
  tips: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  estimatedDuration?: number;
  defaultSets?: Set[];
  videoUrl?: string;
  imageUrl?: string;
  variations?: string[];
  warnings?: string[];
}

export interface Set {
  id: string;
  reps: number;
  weight: number; // in kg or lbs based on user preference
  restTime?: number; // in seconds
  perceived_difficulty?: 1 | 2 | 3 | 4 | 5; // RPE scale
  notes?: string;
  timestamp: Date;
  isWarmup?: boolean;
  isFailure?: boolean;
  tempo?: string; // e.g., "3-1-2-1" (eccentric-pause-concentric-pause)
  isCompleted?: boolean;
  completedAt?: Date;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  sets: Set[];
  completedSets: Set[];
  startTime?: Date;
  endTime?: Date;
  targetSets?: number;
  targetReps?: number;
  targetWeight?: number;
  restTimeBetweenSets?: number;
  notes?: string;
  orderIndex: number;
}

export interface Workout {
  id: string;
  name: string;
  type: WorkoutType;
  exercises: WorkoutExercise[];
  startTime: Date;
  endTime?: Date;
  duration?: number; // in seconds
  totalDuration?: number; // in seconds
  totalSets?: number;
  totalReps?: number;
  totalWeight?: number;
  notes?: string;
  templateId?: string;
  totalVolume?: number; // calculated: sum of sets * reps * weight
  personalRecords?: PersonalRecord[];
  isCompleted: boolean;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  type: WorkoutType;
  exercises: {
    exerciseId: string;
    targetSets: number;
    targetReps: number;
    targetWeight?: number;
    restTime?: number;
    orderIndex: number;
  }[];
  estimatedDuration?: number; // in minutes
  difficulty: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  isCustom: boolean;
  createdAt: Date;
  lastUsed?: Date;
}

export interface WorkoutHistory {
  workouts: Workout[];
  totalWorkouts: number;
  totalDuration: number; // in seconds
  totalVolume: number;
  averageWorkoutDuration: number;
  favoriteExercises: string[]; // exercise IDs
  strongestLifts: PersonalRecord[];
  consistency: {
    currentStreak: number;
    longestStreak: number;
    weeklyAverage: number;
  };
}

export interface PersonalRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  type: 'one_rep_max' | 'volume' | 'endurance' | 'time';
  value: number;
  weight: number;
  reps: number;
  oneRepMax: number;
  unit: string; // kg, lbs, minutes, seconds, etc.
  date: Date;
  workoutId: string;
  isEstimated?: boolean; // if calculated from multiple reps
  notes?: string;
}

// Context and state management
export interface WorkoutContext {
  activeWorkout?: Workout;
  currentExercise?: WorkoutExercise;
  currentSet?: number;
  totalSets?: number;
  isResting?: boolean;
  restTimeRemaining?: number;
  workoutDuration?: number;
  lastPersonalRecord?: PersonalRecord;
  recentExercises?: Exercise[];
  userPreferences: WorkoutPreferences;
}

export interface WorkoutPreferences {
  defaultWeightUnit: 'kg' | 'lbs';
  defaultRestTime: number; // seconds
  autoRestTimer: boolean;
  showPersonalRecords: boolean;
  enableVoiceCommands: boolean;
  warmupRequired: boolean;
  trackRPE: boolean; // Rate of Perceived Exertion
  roundingPreference: 'exact' | 'nearest_2_5' | 'nearest_5';
  plateCalculation: boolean;
  notifications: {
    restComplete: boolean;
    personalRecord: boolean;
    workoutReminders: boolean;
  };
}

// Voice integration types
export interface VoiceWorkoutCommand {
  type: 'start_workout' | 'end_workout' | 'log_set' | 'add_exercise' | 'rest_timer' | 'next_exercise' | 'repeat_last';
  parameters: Record<string, any>;
  confidence: number;
  timestamp: Date;
}

// Progress tracking
export interface ProgressMetrics {
  volumeProgress: {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
  };
  strengthProgress: {
    exerciseId: string;
    exerciseName: string;
    current: number;
    previous: number;
    change: number;
    changePercent: number;
  }[];
  consistencyMetrics: {
    workoutsThisWeek: number;
    workoutsLastWeek: number;
    averageWorkoutsPerWeek: number;
    currentStreak: number;
  };
  bodyComposition?: {
    weight: number;
    bodyFat?: number;
    muscleMass?: number;
    date: Date;
  }[];
}

export interface WorkoutSplit {
  id: string;
  name: string;
  description?: string;
  days: {
    dayOfWeek: number; // 0-6 (Sunday-Saturday)
    templateId: string;
    isRestDay: boolean;
  }[];
  weeksToComplete: number;
  isActive: boolean;
}
// New interfaces for Workout Plans feature
export interface WorkoutPlan {
  id: string;
  name: string;
  description: string;
  type: 'ai_generated' | 'custom' | 'pdf_imported';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  daysPerWeek: number;
  estimatedDuration: number; // minutes per session
  targetGoals: string[];
  equipment: string[];
  schedule: WorkoutDay[];
  createdAt: Date;
  lastUsed?: Date;
  timesCompleted: number;
  userRating?: number;
  notes?: string;
  originalSource?: {
    type: 'pdf' | 'template' | 'ai';
    source: string;
  };
}

export interface WorkoutDay {
  name: string; // "Day 1: Push", "Monday: Upper Body"
  description?: string;
  exercises: WorkoutExercise[];
  restDayAfter?: boolean;
  notes?: string;
  estimatedDuration: number;
  warmup?: Exercise[];
  cooldown?: Exercise[];
}

export interface WorkoutPlanMetadata {
  totalWorkouts: number;
  averageRating: number;
  completionRate: number;
  popularGoals: string[];
  commonEquipment: string[];
  difficultyDistribution: Record<string, number>;
}
