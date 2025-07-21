import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Workout,
  WorkoutExercise,
  Set,
  PersonalRecord,
  WorkoutContext,
  Exercise,
  WorkoutPreferences,
  VoiceInput
} from '../types';
import { getWorkoutService } from '../services/workoutService';

export function useWorkoutLogger(preferences?: Partial<WorkoutPreferences>) {
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [currentExercise, setCurrentExercise] = useState<WorkoutExercise | null>(null);
  const [currentSet, setCurrentSet] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const workoutServiceRef = useRef(getWorkoutService(preferences));
  const workoutService = workoutServiceRef.current;

  // Set up event listeners
  useEffect(() => {
    workoutService.onWorkoutUpdated((workout) => {
      setActiveWorkout({ ...workout });
      setIsRecording(workoutService.isWorkoutActive());
      setCurrentExercise(workoutService.getCurrentExercise());
      setCurrentSet(workoutService.getCurrentSet());
    });

    workoutService.onSetCompletedEvent((set, exercise) => {
      // Update current exercise and set count
      setCurrentExercise({ ...exercise });
      setCurrentSet(exercise.sets.length);
    });

    workoutService.onPersonalRecordEvent((record) => {
      setPersonalRecords(prev => [...prev, record]);
    });

    workoutService.onRestTimerUpdated((timeRemaining) => {
      setRestTimeRemaining(timeRemaining);
    });

    // Set up workout duration timer
    const durationTimer = setInterval(() => {
      if (isRecording && activeWorkout) {
        const elapsed = Math.floor((Date.now() - activeWorkout.startTime.getTime()) / 1000 / 60);
        setWorkoutDuration(elapsed);
      }
    }, 60000); // Update every minute

    return () => {
      clearInterval(durationTimer);
      workoutService.destroy();
    };
  }, [workoutService, isRecording, activeWorkout]);

  // Start a new workout
  const startWorkout = useCallback(async (templateId?: string, name?: string): Promise<boolean> => {
    try {
      setError(null);
      const workout = await workoutService.startWorkout(templateId, name);
      setActiveWorkout(workout);
      setIsRecording(true);
      setWorkoutDuration(0);
      setPersonalRecords([]);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start workout');
      return false;
    }
  }, [workoutService]);

  // End the current workout
  const endWorkout = useCallback(async (): Promise<Workout | null> => {
    try {
      setError(null);
      const completedWorkout = await workoutService.endWorkout();
      setActiveWorkout(null);
      setCurrentExercise(null);
      setCurrentSet(0);
      setIsRecording(false);
      setRestTimeRemaining(0);
      setWorkoutDuration(0);
      return completedWorkout;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end workout');
      return null;
    }
  }, [workoutService]);

  // Add an exercise to the current workout
  const addExercise = useCallback(async (exerciseId: string): Promise<boolean> => {
    try {
      setError(null);
      await workoutService.addExercise(exerciseId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add exercise');
      return false;
    }
  }, [workoutService]);

  // Log a set
  const logSet = useCallback(async (
    exerciseId: string,
    reps: number,
    weight: number,
    notes?: string,
    difficulty?: 1 | 2 | 3 | 4 | 5
  ): Promise<Set | null> => {
    try {
      setError(null);
      const set = await workoutService.logSet(exerciseId, reps, weight, notes, difficulty);
      return set;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log set');
      return null;
    }
  }, [workoutService]);

  // Process voice input for logging
  const processVoiceInput = useCallback(async (input: VoiceInput): Promise<boolean> => {
    try {
      setError(null);
      await workoutService.processVoiceInput(input);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process voice input');
      return false;
    }
  }, [workoutService]);

  // Quick log set for current exercise
  const quickLogSet = useCallback(async (
    reps: number,
    weight: number,
    difficulty?: 1 | 2 | 3 | 4 | 5
  ): Promise<Set | null> => {
    if (!currentExercise) {
      setError('No current exercise selected');
      return null;
    }
    return await logSet(currentExercise.exerciseId, reps, weight, undefined, difficulty);
  }, [currentExercise, logSet]);

  // Rest timer controls
  const startRestTimer = useCallback((seconds?: number) => {
    const restTime = seconds || workoutService.getPreferences().defaultRestTime;
    workoutService.startRestTimer(restTime);
  }, [workoutService]);

  const stopRestTimer = useCallback(() => {
    workoutService.stopRestTimer();
    setRestTimeRemaining(0);
  }, [workoutService]);

  // Get workout context for AI/voice services
  const getWorkoutContext = useCallback((): WorkoutContext => {
    return workoutService.getWorkoutContext();
  }, [workoutService]);

  // Get workout history
  const getWorkoutHistory = useCallback(async (limit = 50) => {
    try {
      return await workoutService.getWorkoutHistory(limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get workout history');
      return [];
    }
  }, [workoutService]);

  // Get personal records for an exercise
  const getPersonalRecords = useCallback(async (exerciseId: string) => {
    try {
      return await workoutService.getPersonalRecords(exerciseId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get personal records');
      return [];
    }
  }, [workoutService]);

  // Get progress metrics
  const getProgressMetrics = useCallback(async () => {
    try {
      return await workoutService.getProgressMetrics();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get progress metrics');
      return null;
    }
  }, [workoutService]);

  // Search exercises
  const searchExercises = useCallback(async (query: string) => {
    try {
      return await workoutService.searchExercises(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search exercises');
      return [];
    }
  }, [workoutService]);

  // Get exercises by category
  const getExercisesByCategory = useCallback(async (category: string) => {
    try {
      return await workoutService.getExercisesByCategory(category);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get exercises by category');
      return [];
    }
  }, [workoutService]);

  // Get workout templates
  const getWorkoutTemplates = useCallback(async () => {
    try {
      return await workoutService.getWorkoutTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get workout templates');
      return [];
    }
  }, [workoutService]);

  // Update preferences
  const updatePreferences = useCallback((newPreferences: Partial<WorkoutPreferences>) => {
    workoutService.updatePreferences(newPreferences);
  }, [workoutService]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Computed values
  const isWorkoutActive = activeWorkout !== null && isRecording;
  const hasCurrentExercise = currentExercise !== null;
  const isResting = restTimeRemaining > 0;
  const totalSets = activeWorkout?.exercises.reduce((total, ex) => total + ex.sets.length, 0) || 0;
  const totalVolume = activeWorkout?.totalVolume || 0;
  const currentExerciseSets = currentExercise?.sets.length || 0;
  const recentPersonalRecords = personalRecords.slice(-5); // Last 5 PRs

  // Exercise navigation
  const getCurrentExerciseIndex = useCallback(() => {
    if (!activeWorkout || !currentExercise) return -1;
    return activeWorkout.exercises.findIndex(ex => ex.id === currentExercise.id);
  }, [activeWorkout, currentExercise]);

  const moveToNextExercise = useCallback(() => {
    if (!activeWorkout) return false;
    const currentIndex = getCurrentExerciseIndex();
    if (currentIndex >= 0 && currentIndex < activeWorkout.exercises.length - 1) {
      const nextExercise = activeWorkout.exercises[currentIndex + 1];
      setCurrentExercise(nextExercise);
      setCurrentSet(nextExercise.sets.length);
      return true;
    }
    return false;
  }, [activeWorkout, getCurrentExerciseIndex]);

  const moveToPreviousExercise = useCallback(() => {
    if (!activeWorkout) return false;
    const currentIndex = getCurrentExerciseIndex();
    if (currentIndex > 0) {
      const prevExercise = activeWorkout.exercises[currentIndex - 1];
      setCurrentExercise(prevExercise);
      setCurrentSet(prevExercise.sets.length);
      return true;
    }
    return false;
  }, [activeWorkout, getCurrentExerciseIndex]);

  const selectExercise = useCallback((exerciseId: string) => {
    if (!activeWorkout) return false;
    const exercise = activeWorkout.exercises.find(ex => ex.exerciseId === exerciseId);
    if (exercise) {
      setCurrentExercise(exercise);
      setCurrentSet(exercise.sets.length);
      return true;
    }
    return false;
  }, [activeWorkout]);

  // Format rest time for display
  const formatRestTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    // State
    activeWorkout,
    currentExercise,
    currentSet,
    isRecording,
    restTimeRemaining,
    workoutDuration,
    personalRecords,
    error,

    // Actions
    startWorkout,
    endWorkout,
    addExercise,
    logSet,
    quickLogSet,
    processVoiceInput,
    startRestTimer,
    stopRestTimer,
    updatePreferences,
    clearError,

    // Navigation
    moveToNextExercise,
    moveToPreviousExercise,
    selectExercise,
    getCurrentExerciseIndex,

    // Data fetching
    getWorkoutContext,
    getWorkoutHistory,
    getPersonalRecords,
    getProgressMetrics,
    searchExercises,
    getExercisesByCategory,
    getWorkoutTemplates,

    // Computed properties
    isWorkoutActive,
    hasCurrentExercise,
    isResting,
    totalSets,
    totalVolume,
    currentExerciseSets,
    recentPersonalRecords,

    // Utility
    formatRestTime,

    // Quick access
    preferences: workoutService.getPreferences(),
    hasError: error !== null,
    canLog: isWorkoutActive,
    restTimeFormatted: formatRestTime(restTimeRemaining),
    workoutDurationFormatted: `${workoutDuration} min`,
    
    // Exercise info
    currentExerciseName: currentExercise?.exercise.name || '',
    currentExerciseTargetSets: currentExercise?.targetSets || 0,
    currentExerciseTargetReps: currentExercise?.targetReps || 0,
    exerciseProgress: currentExercise ? 
      `${currentExerciseSets}/${currentExercise.targetSets || '∞'}` : '',
    
    // Workout summary
    workoutSummary: activeWorkout ? {
      name: activeWorkout.name,
      duration: workoutDuration,
      exerciseCount: activeWorkout.exercises.length,
      setCount: totalSets,
      volume: totalVolume
    } : null
  };
}