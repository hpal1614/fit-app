import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  Workout,
  WorkoutExercise,
  Exercise,
  Set,
  WorkoutContext,
  PersonalRecord
} from '../types/workout';
import { WorkoutType } from '../types/workout';
import { WorkoutService } from '../services/workoutService';

interface UseWorkoutOptions {
  autoSave?: boolean;
  enableTimers?: boolean;
}

export interface UseWorkoutReturn {
  // Current workout state
  currentWorkout: Workout | null;
  currentExercise: WorkoutExercise | null;
  currentExerciseIndex: number;
  currentSetIndex: number;
  isWorkoutActive: boolean;
  
  // Workout controls
  startWorkout: (templateId?: string, customExercises?: Exercise[], type?: WorkoutType) => Promise<Workout>;
  endWorkout: () => Promise<Workout | null>;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  
  // Exercise navigation
  nextExercise: () => WorkoutExercise | null;
  previousExercise: () => WorkoutExercise | null;
  skipExercise: () => WorkoutExercise | null;
  goToExercise: (index: number) => WorkoutExercise | null;
  
  // Set management
  logSet: (reps: number, weight: number, restTime?: number, notes?: string) => Promise<Set>;
  deleteLastSet: () => boolean;
  updateSet: (setIndex: number, updates: Partial<Set>) => boolean;
  
  // Timer management
  startRestTimer: (seconds: number) => void;
  stopRestTimer: () => void;
  restTimeRemaining: number;
  isResting: boolean;
  workoutDuration: number;
  
  // Data and context
  workoutContext: WorkoutContext;
  workoutHistory: Workout[];
  personalRecords: PersonalRecord[];
  
  // State management
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  
  // Statistics
  getTotalSets: () => number;
  getTotalReps: () => number;
  getTotalWeight: () => number;
  getWorkoutProgress: () => number;
}

export const useWorkout = (options: UseWorkoutOptions = {}): UseWorkoutReturn => {
  const { enableTimers = true } = options;
  
  const workoutServiceRef = useRef<WorkoutService | null>(null);
  
  // State management
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // Timer state
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  
  // Data state
  const [workoutHistory, setWorkoutHistory] = useState<Workout[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Timer refs
  const restTimerRef = useRef<NodeJS.Timeout | null>(null);
  const workoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize workout service
  useEffect(() => {
    const initializeWorkout = async () => {
      try {
        const workoutService = WorkoutService.getInstance();
        workoutServiceRef.current = workoutService;
        
        await workoutService.initialize();
        
        // Load initial data
        const [history, records] = await Promise.all([
          workoutService.getWorkoutHistory(10),
          workoutService.getPersonalRecords()
        ]);
        
        setWorkoutHistory(history);
        setPersonalRecords(records);
        
      } catch (_err) {
        setError('Failed to initialize workout service');
      }
    };

    initializeWorkout();

    // Cleanup on unmount
    return () => {
      if (restTimerRef.current) {
        clearInterval(restTimerRef.current);
      }
      if (workoutTimerRef.current) {
        clearInterval(workoutTimerRef.current);
      }
    };
  }, []);

  // Workout duration timer
  useEffect(() => {
    if (isWorkoutActive && !isPaused && enableTimers) {
      workoutTimerRef.current = setInterval(() => {
        if (workoutStartTime) {
          setWorkoutDuration(Math.floor((Date.now() - workoutStartTime.getTime()) / 1000));
        }
      }, 1000);
    } else {
      if (workoutTimerRef.current) {
        clearInterval(workoutTimerRef.current);
        workoutTimerRef.current = null;
      }
    }

    return () => {
      if (workoutTimerRef.current) {
        clearInterval(workoutTimerRef.current);
      }
    };
  }, [isWorkoutActive, isPaused, workoutStartTime, enableTimers]);

  // Workout controls
  const startWorkout = useCallback(async (
    templateId?: string,
    customExercises?: Exercise[],
    type: WorkoutType = WorkoutType.STRENGTH
  ): Promise<Workout> => {
    if (!workoutServiceRef.current) {
      throw new Error('Workout service not available');
    }

    setIsLoading(true);
    setError(null);

    try {
      const workout = await workoutServiceRef.current.startWorkout(templateId, customExercises, type);
      
      setCurrentWorkout(workout);
      setCurrentExerciseIndex(0);
      setCurrentSetIndex(0);
      setIsWorkoutActive(true);
      setIsPaused(false);
      setWorkoutStartTime(workout.startTime);
      setWorkoutDuration(0);
      
      return workout;
    } catch (_err) {
      const errorMessage = _err instanceof Error ? _err.message : 'Failed to start workout';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const endWorkout = useCallback(async (): Promise<Workout | null> => {
    if (!workoutServiceRef.current || !currentWorkout) {
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const completedWorkout = await workoutServiceRef.current.endWorkout();
      
      setCurrentWorkout(null);
      setCurrentExerciseIndex(0);
      setCurrentSetIndex(0);
      setIsWorkoutActive(false);
      setIsPaused(false);
      setWorkoutStartTime(null);
      setWorkoutDuration(0);
      
      // Stop timers
      if (restTimerRef.current) {
        clearInterval(restTimerRef.current);
        restTimerRef.current = null;
      }
      setIsResting(false);
      setRestTimeRemaining(0);
      
      // Refresh history and records
      if (completedWorkout) {
        const [history, records] = await Promise.all([
          workoutServiceRef.current.getWorkoutHistory(10),
          workoutServiceRef.current.getPersonalRecords()
        ]);
        
        setWorkoutHistory(history);
        setPersonalRecords(records);
      }
      
      return completedWorkout;
    } catch (_err) {
      const errorMessage = _err instanceof Error ? _err.message : 'Failed to end workout';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkout]);

  const pauseWorkout = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resumeWorkout = useCallback(() => {
    setIsPaused(false);
  }, []);

  // Exercise navigation
  const nextExercise = useCallback((): WorkoutExercise | null => {
    if (!workoutServiceRef.current) return null;
    
    const exercise = workoutServiceRef.current.nextExercise();
    if (exercise) {
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentSetIndex(0);
      
      // Update current workout
      const updatedWorkout = workoutServiceRef.current.getCurrentWorkout();
      setCurrentWorkout(updatedWorkout);
    }
    
    return exercise;
  }, []);

  const previousExercise = useCallback((): WorkoutExercise | null => {
    if (!workoutServiceRef.current) return null;
    
    const exercise = workoutServiceRef.current.previousExercise();
    if (exercise) {
      setCurrentExerciseIndex(prev => Math.max(0, prev - 1));
      setCurrentSetIndex(0);
      
      // Update current workout
      const updatedWorkout = workoutServiceRef.current.getCurrentWorkout();
      setCurrentWorkout(updatedWorkout);
    }
    
    return exercise;
  }, []);

  const skipExercise = useCallback((): WorkoutExercise | null => {
    return nextExercise();
  }, [nextExercise]);

  const goToExercise = useCallback((index: number): WorkoutExercise | null => {
    if (!currentWorkout || index < 0 || index >= currentWorkout.exercises.length) {
      return null;
    }
    
    setCurrentExerciseIndex(index);
    setCurrentSetIndex(0);
    
    return currentWorkout.exercises[index];
  }, [currentWorkout]);

  // Set management
  const logSet = useCallback(async (
    reps: number,
    weight: number,
    restTime?: number,
    notes?: string
  ): Promise<Set> => {
    if (!workoutServiceRef.current) {
      throw new Error('Workout service not available');
    }

    setIsLoading(true);
    setError(null);

    try {
      const set = await workoutServiceRef.current.logSet(
        currentExerciseIndex,
        reps,
        weight,
        restTime,
        notes
      );
      
      // Update current workout
      const updatedWorkout = workoutServiceRef.current.getCurrentWorkout();
      setCurrentWorkout(updatedWorkout);
      
      // Start rest timer if specified
      if (restTime && restTime > 0 && enableTimers) {
        startRestTimer(restTime);
      }
      
      // Move to next set
      setCurrentSetIndex(prev => prev + 1);
      
      return set;
    } catch (_err) {
      console.error('Failed to log set:', _err);
      setError('Failed to log set. Please try again.');
      throw new Error('Failed to log set. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentExerciseIndex, enableTimers]);

  const deleteLastSet = useCallback((): boolean => {
    if (!currentWorkout || currentExerciseIndex >= currentWorkout.exercises.length) {
      return false;
    }

    const exercise = currentWorkout.exercises[currentExerciseIndex];
    if (exercise.completedSets.length === 0) {
      return false;
    }

    // Remove last set
    exercise.completedSets.pop();
    setCurrentWorkout({ ...currentWorkout });
    setCurrentSetIndex(Math.max(0, currentSetIndex - 1));
    
    return true;
  }, [currentWorkout, currentExerciseIndex, currentSetIndex]);

  const updateSet = useCallback((setIndex: number, updates: Partial<Set>): boolean => {
    if (!currentWorkout || currentExerciseIndex >= currentWorkout.exercises.length) {
      return false;
    }

    const exercise = currentWorkout.exercises[currentExerciseIndex];
    if (setIndex < 0 || setIndex >= exercise.completedSets.length) {
      return false;
    }

    // Update set
    exercise.completedSets[setIndex] = { ...exercise.completedSets[setIndex], ...updates };
    setCurrentWorkout({ ...currentWorkout });
    
    return true;
  }, [currentWorkout, currentExerciseIndex]);

  // Timer management
  const startRestTimer = useCallback((seconds: number) => {
    if (!enableTimers) return;
    
    // Clear existing timer
    if (restTimerRef.current) {
      clearInterval(restTimerRef.current);
    }
    
    setRestTimeRemaining(seconds);
    setIsResting(true);
    
    restTimerRef.current = setInterval(() => {
      setRestTimeRemaining(prev => {
        if (prev <= 1) {
          setIsResting(false);
          if (restTimerRef.current) {
            clearInterval(restTimerRef.current);
            restTimerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [enableTimers]);

  const stopRestTimer = useCallback(() => {
    if (restTimerRef.current) {
      clearInterval(restTimerRef.current);
      restTimerRef.current = null;
    }
    setIsResting(false);
    setRestTimeRemaining(0);
  }, []);

  // Computed values
  const currentExercise = currentWorkout?.exercises[currentExerciseIndex] || null;

  const workoutContext: WorkoutContext = {
    activeWorkout: currentWorkout || undefined,
    currentExercise: currentExercise || undefined,
    currentSet: currentSetIndex,
    totalSets: currentWorkout?.exercises.reduce((total, ex) => total + ex.sets.length, 0) || 0,
    workoutDuration,
    isResting,
    restTimeRemaining,
    userPreferences: {
      defaultWeightUnit: 'lbs',
      defaultRestTime: 90,
      autoRestTimer: true,
      showPersonalRecords: true,
      enableVoiceCommands: true,
      warmupRequired: false,
      trackRPE: true,
      roundingPreference: 'nearest_2_5',
      plateCalculation: true,
      notifications: {
        restComplete: true,
        personalRecord: true,
        workoutReminders: true
      }
    }
  };

  // Statistics
  const getTotalSets = useCallback((): number => {
    if (!currentWorkout) return 0;
    return currentWorkout.exercises.reduce((total, ex) => total + ex.completedSets.length, 0);
  }, [currentWorkout]);

  const getTotalReps = useCallback((): number => {
    if (!currentWorkout) return 0;
    return currentWorkout.exercises.reduce(
      (total, ex) => total + ex.completedSets.reduce((reps, set) => reps + set.reps, 0), 
      0
    );
  }, [currentWorkout]);

  const getTotalWeight = useCallback((): number => {
    if (!currentWorkout) return 0;
    return currentWorkout.exercises.reduce(
      (total, ex) => total + ex.completedSets.reduce((weight, set) => weight + (set.weight * set.reps), 0), 
      0
    );
  }, [currentWorkout]);

  const getWorkoutProgress = useCallback((): number => {
    if (!currentWorkout || currentWorkout.exercises.length === 0) return 0;
    
    const totalExercises = currentWorkout.exercises.length;
    const completedExercises = currentWorkout.exercises.filter(
      ex => ex.completedSets.length > 0
    ).length;
    
    return Math.round((completedExercises / totalExercises) * 100);
  }, [currentWorkout]);

  // Error management
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Get exercise history
  const getExerciseHistory = useCallback((exerciseName: string) => {
    return workoutHistory
      .flatMap(workout => workout.exercises)
      .filter(exercise => exercise.exercise.name === exerciseName)
      .flatMap(exercise => exercise.completedSets)
      .slice(0, 10); // Get last 10 sets for this exercise
  }, [workoutHistory]);

  return {
    // Current workout state
    currentWorkout,
    currentExercise,
    currentExerciseIndex,
    currentSetIndex,
    isWorkoutActive,
    
    // Workout controls
    startWorkout,
    endWorkout,
    pauseWorkout,
    resumeWorkout,
    
    // Exercise navigation
    nextExercise,
    previousExercise,
    skipExercise,
    goToExercise,
    
    // Set management
    logSet,
    deleteLastSet,
    updateSet,
    
    // Timer management
    startRestTimer,
    stopRestTimer,
    restTimeRemaining,
    isResting,
    workoutDuration,
    
    // Data and context
    workoutContext,
    workoutHistory,
    personalRecords,
    getExerciseHistory,
    
    // State management
    isLoading,
    error,
    clearError,
    
    // Statistics
    getTotalSets,
    getTotalReps,
    getTotalWeight,
    getWorkoutProgress,
    
    // Additional stats for UI
    workoutsThisWeek: 4, // Mock data for now
    totalMinutesThisWeek: 320,
    caloriesBurnedThisWeek: 1840,
    currentStreak: 7,
    isActive: !!currentWorkout,
    duration: workoutDuration,
    getContext: () => workoutContext
  };
};

export default useWorkout;