import type {
  Workout,
  WorkoutExercise,
  Exercise,
  Set,
  WorkoutTemplate,
  PersonalRecord,
  WorkoutContext,
  WorkoutPreferences,
  WorkoutType,
  ExerciseCategory,
  MuscleGroup
} from '../types/workout';
import { getExerciseById, getExercisesByMuscleGroup, WORKOUT_TEMPLATES } from '../constants/exercises';
import { DatabaseService } from './databaseService';

export class WorkoutService {
  private db: DatabaseService;
  private currentWorkout: Workout | null = null;
  private currentExerciseIndex = 0;
  private currentSetIndex = 0;
  private restTimer: NodeJS.Timeout | null = null;
  private workoutTimer: NodeJS.Timeout | null = null;
  private startTime: Date | null = null;
  private isInitialized = false;

  constructor() {
    this.db = DatabaseService.getInstance();
  }

  async initialize(): Promise<boolean> {
    try {
      await this.db.initialize();
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize WorkoutService:', error);
      return false;
    }
  }

  // Workout Management
  async startWorkout(
    templateId?: string,
    customExercises?: Exercise[],
    workoutType: WorkoutType = 'strength'
  ): Promise<Workout> {
    try {
      let exercises: WorkoutExercise[] = [];

      if (templateId) {
        const template = WORKOUT_TEMPLATES.find(t => t.id === templateId);
        if (template) {
          exercises = template.exercises.map(ex => ({
            ...ex,
            id: `${Date.now()}-${Math.random()}`,
            completedSets: [],
            notes: '',
            startTime: null,
            endTime: null
          }));
        }
      } else if (customExercises) {
        exercises = customExercises.map((exercise, index) => ({
          exerciseId: exercise.id,
          exercise,
          order: index,
          sets: exercise.defaultSets || [{ id: `set-${Date.now()}-${index}`, reps: 10, weight: 0, restTime: 60, isCompleted: false }],
          completedSets: [],
          notes: '',
          id: `${Date.now()}-${index}`,
          startTime: null,
          endTime: null
        }));
      }

      this.currentWorkout = {
        id: `workout-${Date.now()}`,
        name: templateId ? `${templateId} Workout` : 'Custom Workout',
        type: workoutType,
        exercises,
        startTime: new Date(),
        endTime: null,
        totalDuration: 0,
        totalSets: 0,
        totalReps: 0,
        totalWeight: 0,
        notes: '',
        isCompleted: false,
        personalRecords: []
      };

      this.currentExerciseIndex = 0;
      this.currentSetIndex = 0;
      this.startTime = new Date();
      this.startWorkoutTimer();

      // Save to database
      await this.db.saveWorkout(this.currentWorkout);

      return this.currentWorkout;
    } catch (error) {
      console.error('Failed to start workout:', error);
      throw new Error('Failed to start workout');
    }
  }

  async endWorkout(): Promise<Workout | null> {
    if (!this.currentWorkout) return null;

    try {
      this.currentWorkout.endTime = new Date();
      this.currentWorkout.totalDuration = this.calculateWorkoutDuration();
      this.currentWorkout.isCompleted = true;

      // Calculate totals
      this.currentWorkout.totalSets = this.currentWorkout.exercises.reduce(
        (total, ex) => total + ex.completedSets.length, 0
      );
      this.currentWorkout.totalReps = this.currentWorkout.exercises.reduce(
        (total, ex) => total + ex.completedSets.reduce((reps, set) => reps + set.reps, 0), 0
      );
      this.currentWorkout.totalWeight = this.currentWorkout.exercises.reduce(
        (total, ex) => total + ex.completedSets.reduce((weight, set) => weight + (set.weight * set.reps), 0), 0
      );

      // Check for personal records
      await this.checkPersonalRecords(this.currentWorkout);

      // Save final workout
      await this.db.saveWorkout(this.currentWorkout);

      // Clear current workout
      const completedWorkout = this.currentWorkout;
      this.currentWorkout = null;
      this.stopWorkoutTimer();

      return completedWorkout;
    } catch (error) {
      console.error('Failed to end workout:', error);
      throw new Error('Failed to end workout');
    }
  }

  // Set Management
  async logSet(
    exerciseIndex: number,
    reps: number,
    weight: number,
    restTime?: number,
    notes?: string
  ): Promise<Set> {
    if (!this.currentWorkout) {
      throw new Error('No active workout');
    }

    const exercise = this.currentWorkout.exercises[exerciseIndex];
    if (!exercise) {
      throw new Error('Exercise not found');
    }

    const set: Set = {
      id: `set-${Date.now()}-${Math.random()}`,
      reps,
      weight,
      restTime: restTime || 60,
      isCompleted: true,
      completedAt: new Date(),
      notes
    };

    exercise.completedSets.push(set);

    // Check if this is a personal record
    const isRecord = await this.isPersonalRecord(exercise.exerciseId, weight, reps);
    if (isRecord) {
      const pr: PersonalRecord = {
        id: `pr-${Date.now()}`,
        exerciseId: exercise.exerciseId,
        weight,
        reps,
        oneRepMax: this.calculateOneRepMax(weight, reps),
        date: new Date(),
        workoutId: this.currentWorkout.id
      };
      
      this.currentWorkout.personalRecords.push(pr);
      await this.db.savePersonalRecord(pr);
    }

    // Update workout
    await this.db.saveWorkout(this.currentWorkout);

    // Start rest timer if specified
    if (restTime && restTime > 0) {
      this.startRestTimer(restTime);
    }

    return set;
  }

  // Navigation
  getCurrentWorkout(): Workout | null {
    return this.currentWorkout;
  }

  getCurrentExercise(): WorkoutExercise | null {
    if (!this.currentWorkout || this.currentExerciseIndex >= this.currentWorkout.exercises.length) {
      return null;
    }
    return this.currentWorkout.exercises[this.currentExerciseIndex];
  }

  nextExercise(): WorkoutExercise | null {
    if (!this.currentWorkout) return null;

    this.currentExerciseIndex++;
    this.currentSetIndex = 0;

    return this.getCurrentExercise();
  }

  previousExercise(): WorkoutExercise | null {
    if (!this.currentWorkout) return null;

    this.currentExerciseIndex = Math.max(0, this.currentExerciseIndex - 1);
    this.currentSetIndex = 0;

    return this.getCurrentExercise();
  }

  skipExercise(): WorkoutExercise | null {
    return this.nextExercise();
  }

  // Workout Context
  getWorkoutContext(): WorkoutContext {
    const currentExercise = this.getCurrentExercise();
    
    return {
      hasActiveWorkout: !!this.currentWorkout,
      currentWorkout: this.currentWorkout,
      currentExercise,
      currentExerciseIndex: this.currentExerciseIndex,
      currentSetIndex: this.currentSetIndex,
      totalExercises: this.currentWorkout?.exercises.length || 0,
      workoutDuration: this.calculateWorkoutDuration(),
      isResting: !!this.restTimer,
      restTimeRemaining: this.getRestTimeRemaining()
    };
  }

  // Timer Management
  private startWorkoutTimer(): void {
    this.workoutTimer = setInterval(() => {
      // Timer runs in background for duration tracking
    }, 1000);
  }

  private stopWorkoutTimer(): void {
    if (this.workoutTimer) {
      clearInterval(this.workoutTimer);
      this.workoutTimer = null;
    }
  }

  private startRestTimer(seconds: number): void {
    if (this.restTimer) {
      clearTimeout(this.restTimer);
    }

    this.restTimer = setTimeout(() => {
      this.restTimer = null;
      // Could emit event here for rest completion
    }, seconds * 1000);
  }

  private getRestTimeRemaining(): number {
    // Implementation would track actual remaining time
    return 0;
  }

  // Personal Records
  private async isPersonalRecord(exerciseId: string, weight: number, reps: number): Promise<boolean> {
    try {
      const records = await this.db.getPersonalRecords(exerciseId);
      const oneRepMax = this.calculateOneRepMax(weight, reps);
      
      const bestRecord = records.reduce((best, record) => 
        record.oneRepMax > best ? record.oneRepMax : best, 0
      );

      return oneRepMax > bestRecord;
    } catch (error) {
      console.error('Failed to check personal record:', error);
      return false;
    }
  }

  private async checkPersonalRecords(workout: Workout): Promise<void> {
    for (const exercise of workout.exercises) {
      for (const set of exercise.completedSets) {
        const isRecord = await this.isPersonalRecord(exercise.exerciseId, set.weight, set.reps);
        if (isRecord) {
          const pr: PersonalRecord = {
            id: `pr-${Date.now()}-${Math.random()}`,
            exerciseId: exercise.exerciseId,
            weight: set.weight,
            reps: set.reps,
            oneRepMax: this.calculateOneRepMax(set.weight, set.reps),
            date: new Date(),
            workoutId: workout.id
          };
          
          workout.personalRecords.push(pr);
          await this.db.savePersonalRecord(pr);
        }
      }
    }
  }

  private calculateOneRepMax(weight: number, reps: number): number {
    // Epley formula: 1RM = weight × (1 + reps/30)
    return Math.round(weight * (1 + reps / 30));
  }

  // Utilities
  private calculateWorkoutDuration(): number {
    if (!this.startTime) return 0;
    return Math.floor((Date.now() - this.startTime.getTime()) / 1000);
  }

  // Data Management
  async getWorkoutHistory(limit: number = 10): Promise<Workout[]> {
    try {
      return await this.db.getWorkoutHistory(limit);
    } catch (error) {
      console.error('Failed to get workout history:', error);
      return [];
    }
  }

  async getPersonalRecords(exerciseId?: string): Promise<PersonalRecord[]> {
    try {
      return await this.db.getPersonalRecords(exerciseId);
    } catch (error) {
      console.error('Failed to get personal records:', error);
      return [];
    }
  }

  async deleteWorkout(workoutId: string): Promise<boolean> {
    try {
      return await this.db.deleteWorkout(workoutId);
    } catch (error) {
      console.error('Failed to delete workout:', error);
      return false;
    }
  }

  // Static instance
  private static instance: WorkoutService;

  static getInstance(): WorkoutService {
    if (!WorkoutService.instance) {
      WorkoutService.instance = new WorkoutService();
    }
    return WorkoutService.instance;
  }
}

export default WorkoutService;