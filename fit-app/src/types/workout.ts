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
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  sets: Set[];
  targetSets?: number;
  targetReps?: number;
  targetWeight?: number;
  notes?: string;
  order: number;
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