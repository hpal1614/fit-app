export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  muscleGroups: MuscleGroup[];
  equipment: Equipment[];
  instructions: string[];
  tips: string[];
  videoUrl?: string;
  imageUrl?: string;
  primaryMuscles?: string[];
  defaultSets?: Set[];
}

export interface Set {
  id: string;
  reps: number;
  weight: number;
  restTime?: number; // in seconds
  notes?: string;
  completedAt: Date;
  difficulty?: 1 | 2 | 3 | 4 | 5;
  form?: FormRating;
  timestamp?: Date; // alias used in some services
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  sets: Set[];
  completedSets?: Set[];
  targetSets?: number;
  targetReps?: number;
  targetWeight?: number;
  notes?: string;
  restTimeBetweenSets?: number;
  order: number;
  orderIndex?: number;
  startTime?: Date;
  endTime?: Date;
  formNotes?: string;
}

export interface Workout {
  id: string;
  name: string;
  date: Date;
  startTime: Date;
  endTime?: Date;
  exercises: WorkoutExercise[];
  notes?: string;
  workoutTemplateId?: string;
  totalVolume: number;
  duration?: number; // in minutes
  mood?: WorkoutMood;
  energy?: EnergyLevel;
  type?: WorkoutType;
  totalDuration?: number;
  totalSets?: number;
  totalReps?: number;
  totalWeight?: number;
  isCompleted?: boolean;
  personalRecords?: PersonalRecord[];
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  exercises: Omit<WorkoutExercise, 'id' | 'sets'>[];
  category: WorkoutCategory;
  difficulty: DifficultyLevel;
  estimatedDuration: number; // in minutes
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkoutHistory {
  workouts: Workout[];
  personalRecords: PersonalRecord[];
  totalWorkouts: number;
  totalVolume: number;
  averageDuration: number;
  streaks: WorkoutStreak[];
}

export interface PersonalRecord {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  type: 'max_weight' | 'max_reps' | 'max_volume' | 'best_time';
  value: number;
  date: Date;
  workoutId: string;
  oneRepMax?: number;
}

export interface WorkoutStreak {
  id: string;
  startDate: Date;
  endDate?: Date;
  count: number;
  type: 'daily' | 'weekly';
  isActive: boolean;
}

export interface WorkoutContext {
  activeWorkout: Workout | null;
  currentExercise: WorkoutExercise | null;
  currentSet: number;
  isRecording: boolean;
  userLevel: UserLevel;
  preferences: WorkoutPreferences;
  workoutDuration?: number;
  totalSets?: number;
}

export interface WorkoutPreferences {
  defaultRestTime: number;
  weightUnit: 'lbs' | 'kg';
  voiceCoaching: boolean;
  autoStartTimer: boolean;
  motivationalMessages: boolean;
  formReminders: boolean;
}

// Enums and Types
export type ExerciseCategory = 
  | 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'core' | 'cardio' | 'full-body';

export type MuscleGroup = 
  | 'chest' | 'triceps' | 'shoulders' | 'biceps' | 'lats' | 'traps' | 'rhomboids'
  | 'lower-back' | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'abs' | 'obliques';

export type Equipment = 
  | 'barbell' | 'dumbbell' | 'kettlebell' | 'machine' | 'cable' | 'bodyweight'
  | 'resistance-band' | 'suspension' | 'medicine-ball' | 'foam-roller';

export type WorkoutCategory = 
  | 'strength' | 'cardio' | 'flexibility' | 'powerlifting' | 'bodybuilding'
  | 'crossfit' | 'yoga' | 'pilates' | 'sports' | 'rehabilitation';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type UserLevel = 'beginner' | 'intermediate' | 'advanced';

export type WorkoutMood = 'excellent' | 'good' | 'average' | 'poor' | 'terrible';

export type EnergyLevel = 'high' | 'medium' | 'low';

export type FormRating = 'perfect' | 'good' | 'needs-work' | 'poor';

// Progress and Analytics
export interface ProgressMetrics {
  strengthProgress: StrengthProgress[];
  volumeProgress: VolumeProgress[];
  frequencyMetrics: FrequencyMetrics;
  bodyComposition?: BodyComposition[];
  performanceMetrics: PerformanceMetrics;
}

export interface StrengthProgress {
    exerciseId: string;
  exercise: Exercise;
  maxWeight: number;
  date: Date;
  improvement: number; // percentage
}

export interface VolumeProgress {
  date: Date;
  totalVolume: number;
  exercises: { [exerciseId: string]: number };
}

export interface FrequencyMetrics {
  workoutsPerWeek: number;
  averageSessionDuration: number;
  consistency: number; // percentage
  lastWorkout: Date;
}

export interface BodyComposition {
  date: Date;
    weight: number;
    bodyFat?: number;
    muscleMass?: number;
  measurements?: BodyMeasurements;
}

export interface BodyMeasurements {
  chest?: number;
  waist?: number;
  hips?: number;
  biceps?: number;
  thighs?: number;
  calves?: number;
}

export interface PerformanceMetrics {
  averageRestTime: number;
  setCompletionRate: number;
  workoutCompletionRate: number;
  injuryRate: number;
}

// Progression and Planning
export interface Progression {
  exerciseId: string;
  suggestion: ProgressionSuggestion;
  reasoning: string;
  confidence: number;
}

export interface ProgressionSuggestion {
  type: 'weight' | 'reps' | 'sets' | 'form' | 'rest';
  change: number;
  description: string;
  timeframe: string;
}

export type { WorkoutPlan } from './ai';

export interface WorkoutMetrics {
  duration: number;
  caloriesBurned: number;
  averageHeartRate: number;
  maxHeartRate: number;
  minHeartRate: number;
  steps: number;
  distance: number;
  pace: number;
  activeDuration: number;
  restDuration: number;
  intensity: 'low' | 'moderate' | 'high';
  timestamp: Date;
}

export interface BiometricData {
  heartRate?: number;
  heartRateVariability?: number;
  stressLevel?: number;
  temperature?: number;
  bloodOxygen?: number;
  hydrationLevel?: number;
  timestamp: Date;
}

// Enum variants for compatibility with constant datasets that use enum-like access
export enum ExerciseCategory {
  COMPOUND = 'compound',
  ISOLATION = 'isolation',
  CARDIO = 'cardio',
  BODYWEIGHT = 'bodyweight',
  STRETCHING = 'stretching'
}

export enum MuscleGroup {
  CHEST = 'chest',
  BACK = 'back',
  SHOULDERS = 'shoulders',
  TRICEPS = 'triceps',
  BICEPS = 'biceps',
  CORE = 'core',
  LEGS = 'legs',
  QUADS = 'quads',
  HAMSTRINGS = 'hamstrings',
  GLUTES = 'glutes',
  CALVES = 'calves',
  LATS = 'lats',
  TRAPS = 'traps',
  RHOMBOIDS = 'rhomboids',
  FOREARMS = 'forearms'
}

export enum EquipmentType {
  BARBELL = 'barbell',
  DUMBBELL = 'dumbbell',
  KETTLEBELL = 'kettlebell',
  MACHINE = 'machine',
  CABLE = 'cable',
  BODYWEIGHT = 'bodyweight',
  RESISTANCE_BAND = 'resistance-band',
  SUSPENSION = 'suspension',
  MEDICINE_BALL = 'medicine-ball',
  FOAM_ROLLER = 'foam-roller'
}

export enum WorkoutType {
  STRENGTH = 'strength',
  CARDIO = 'cardio',
  FLEXIBILITY = 'flexibility',
  POWERLIFTING = 'powerlifting',
  BODYBUILDING = 'bodybuilding',
  CROSSFIT = 'crossfit',
  YOGA = 'yoga',
  PILATES = 'pilates',
  SPORTS = 'sports',
  REHABILITATION = 'rehabilitation',
  OTHER = 'other'
}
// Missing WorkoutPlan interfaces (CRITICAL FIX)
export interface WorkoutPlan {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  exercises: WorkoutDay[];
  metadata: WorkoutPlanMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkoutDay {
  dayNumber: number;
  name: string;
  exercises: Exercise[];
  restTime: number; // seconds between exercises
  notes?: string;
}

export interface WorkoutPlanMetadata {
  createdBy: 'ai' | 'user' | 'template';
  createdAt: Date;
  tags: string[];
  equipment: string[];
  targetMuscleGroups: string[];
  estimatedCalories?: number;
  difficultyRating?: number; // 1-10
}
