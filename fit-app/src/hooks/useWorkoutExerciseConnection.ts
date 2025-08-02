import { useState, useCallback, useEffect } from 'react';
import type { Exercise, WorkoutExercise, Workout, WorkoutTemplate } from '../types/workout';

interface WorkoutExerciseConnection {
  // Selected exercises for building workouts
  selectedExercises: Exercise[];
  
  // Current active workout
  activeWorkout: Workout | null;
  
  // Current exercise being performed
  currentExercise: WorkoutExercise | null;
  
  // Workout templates
  workoutTemplates: WorkoutTemplate[];
  
  // UI state
  isBuildingWorkout: boolean;
  isWorkoutActive: boolean;
  showExerciseSelector: boolean;
}

interface UseWorkoutExerciseConnectionReturn extends WorkoutExerciseConnection {
  // Exercise selection methods
  selectExercise: (exercise: Exercise) => void;
  deselectExercise: (exerciseId: string) => void;
  clearSelectedExercises: () => void;
  
  // Workout management methods
  createWorkoutFromExercises: (name: string, template?: WorkoutTemplate) => Workout;
  startWorkout: (workout: Workout) => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  endWorkout: () => void;
  
  // Exercise progression methods
  nextExercise: () => void;
  previousExercise: () => void;
  setCurrentExercise: (exercise: WorkoutExercise) => void;
  
  // Template management
  saveAsTemplate: (workout: Workout, name: string) => void;
  loadTemplate: (template: WorkoutTemplate) => void;
  
  // UI state methods
  setBuildingWorkout: (building: boolean) => void;
  setShowExerciseSelector: (show: boolean) => void;
  
  // Utility methods
  getWorkoutProgress: () => number;
  getExerciseProgress: (exerciseId: string) => number;
  isExerciseCompleted: (exerciseId: string) => boolean;
}

export const useWorkoutExerciseConnection = (): UseWorkoutExerciseConnectionReturn => {
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [currentExercise, setCurrentExercise] = useState<WorkoutExercise | null>(null);
  const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>([]);
  const [isBuildingWorkout, setIsBuildingWorkout] = useState(false);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);

  // Exercise selection methods
  const selectExercise = useCallback((exercise: Exercise) => {
    setSelectedExercises(prev => {
      // Don't add if already selected
      if (prev.find(e => e.id === exercise.id)) {
        return prev;
      }
      return [...prev, exercise];
    });
  }, []);

  const deselectExercise = useCallback((exerciseId: string) => {
    setSelectedExercises(prev => prev.filter(e => e.id !== exerciseId));
  }, []);

  const clearSelectedExercises = useCallback(() => {
    setSelectedExercises([]);
  }, []);

  // Workout creation from selected exercises
  const createWorkoutFromExercises = useCallback((name: string, template?: WorkoutTemplate): Workout => {
    const workoutExercises: WorkoutExercise[] = selectedExercises.map((exercise, index) => ({
      id: `workout-exercise-${Date.now()}-${index}`,
      exerciseId: exercise.id,
      exercise: exercise,
      sets: exercise.defaultSets || [
        { id: `set-${index}-1`, reps: 8, weight: 0, completedAt: new Date() },
        { id: `set-${index}-2`, reps: 8, weight: 0, completedAt: new Date() },
        { id: `set-${index}-3`, reps: 8, weight: 0, completedAt: new Date() }
      ],
      completedSets: [],
      order: index,
      startTime: new Date(),
      restTimeBetweenSets: 90
    }));

    const workout: Workout = {
      id: `workout-${Date.now()}`,
      name,
      date: new Date(),
      startTime: new Date(),
      exercises: workoutExercises,
      totalVolume: 0,
      duration: 0,
      type: template?.category || 'strength',
      isCompleted: false
    };

    return workout;
  }, [selectedExercises]);

  // Workout control methods
  const startWorkout = useCallback((workout: Workout) => {
    setActiveWorkout(workout);
    setIsWorkoutActive(true);
    setIsBuildingWorkout(false);
    setShowExerciseSelector(false);
    
    // Set first exercise as current
    if (workout.exercises.length > 0) {
      setCurrentExercise(workout.exercises[0]);
    }
  }, []);

  const pauseWorkout = useCallback(() => {
    setIsWorkoutActive(false);
  }, []);

  const resumeWorkout = useCallback(() => {
    setIsWorkoutActive(true);
  }, []);

  const endWorkout = useCallback(() => {
    if (activeWorkout) {
      setActiveWorkout(prev => prev ? { ...prev, endTime: new Date(), isCompleted: true } : null);
    }
    setIsWorkoutActive(false);
    setCurrentExercise(null);
  }, [activeWorkout]);

  // Exercise progression methods
  const nextExercise = useCallback(() => {
    if (!activeWorkout || !currentExercise) return;
    
    const currentIndex = activeWorkout.exercises.findIndex(e => e.id === currentExercise.id);
    if (currentIndex < activeWorkout.exercises.length - 1) {
      setCurrentExercise(activeWorkout.exercises[currentIndex + 1]);
    }
  }, [activeWorkout, currentExercise]);

  const previousExercise = useCallback(() => {
    if (!activeWorkout || !currentExercise) return;
    
    const currentIndex = activeWorkout.exercises.findIndex(e => e.id === currentExercise.id);
    if (currentIndex > 0) {
      setCurrentExercise(activeWorkout.exercises[currentIndex - 1]);
    }
  }, [activeWorkout, currentExercise]);

  // Template management
  const saveAsTemplate = useCallback((workout: Workout, name: string) => {
    const template: WorkoutTemplate = {
      id: `template-${Date.now()}`,
      name,
      exercises: workout.exercises.map(ex => ({
        exerciseId: ex.exerciseId,
        exercise: ex.exercise,
        targetSets: ex.sets.length,
        targetReps: ex.sets[0]?.reps || 8,
        targetWeight: ex.sets[0]?.weight || 0,
        restTimeBetweenSets: ex.restTimeBetweenSets || 90,
        order: ex.order,
        notes: ex.notes
      })),
      category: workout.type || 'strength',
      difficulty: 'intermediate',
      estimatedDuration: workout.duration || 60,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setWorkoutTemplates(prev => [template, ...prev]);
  }, []);

  const loadTemplate = useCallback((template: WorkoutTemplate) => {
    const exercises = template.exercises.map(ex => ex.exercise);
    setSelectedExercises(exercises);
    setIsBuildingWorkout(true);
  }, []);

  // Progress calculation methods
  const getWorkoutProgress = useCallback((): number => {
    if (!activeWorkout) return 0;
    
    const totalSets = activeWorkout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    const completedSets = activeWorkout.exercises.reduce((sum, ex) => sum + (ex.completedSets?.length || 0), 0);
    
    return totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  }, [activeWorkout]);

  const getExerciseProgress = useCallback((exerciseId: string): number => {
    if (!activeWorkout) return 0;
    
    const exercise = activeWorkout.exercises.find(e => e.exerciseId === exerciseId);
    if (!exercise) return 0;
    
    return exercise.sets.length > 0 
      ? Math.round(((exercise.completedSets?.length || 0) / exercise.sets.length) * 100)
      : 0;
  }, [activeWorkout]);

  const isExerciseCompleted = useCallback((exerciseId: string): boolean => {
    if (!activeWorkout) return false;
    
    const exercise = activeWorkout.exercises.find(e => e.exerciseId === exerciseId);
    if (!exercise) return false;
    
    return (exercise.completedSets?.length || 0) >= exercise.sets.length;
  }, [activeWorkout]);

  // UI state methods
  const setBuildingWorkout = useCallback((building: boolean) => {
    setIsBuildingWorkout(building);
    if (building) {
      setShowExerciseSelector(true);
    }
  }, []);

  // Auto-save templates to localStorage
  useEffect(() => {
    if (workoutTemplates.length > 0) {
      localStorage.setItem('workoutTemplates', JSON.stringify(workoutTemplates));
    }
  }, [workoutTemplates]);

  // Load templates from localStorage on mount
  useEffect(() => {
    const savedTemplates = localStorage.getItem('workoutTemplates');
    if (savedTemplates) {
      try {
        const templates = JSON.parse(savedTemplates);
        setWorkoutTemplates(templates);
      } catch (error) {
        console.error('Error loading workout templates:', error);
      }
    }
  }, []);

  return {
    // State
    selectedExercises,
    activeWorkout,
    currentExercise,
    workoutTemplates,
    isBuildingWorkout,
    isWorkoutActive,
    showExerciseSelector,
    
    // Methods
    selectExercise,
    deselectExercise,
    clearSelectedExercises,
    createWorkoutFromExercises,
    startWorkout,
    pauseWorkout,
    resumeWorkout,
    endWorkout,
    nextExercise,
    previousExercise,
    setCurrentExercise,
    saveAsTemplate,
    loadTemplate,
    setBuildingWorkout,
    setShowExerciseSelector,
    getWorkoutProgress,
    getExerciseProgress,
    isExerciseCompleted
  };
}; 