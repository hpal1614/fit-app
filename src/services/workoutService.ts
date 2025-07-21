import {
  Workout,
  Exercise,
  Set,
  WorkoutExercise,
  WorkoutTemplate,
  WorkoutHistory,
  PersonalRecord,
  ProgressMetrics,
  WorkoutContext,
  WorkoutPreferences,
  VoiceInput
} from '../types';
import { EXERCISE_DATABASE, WORKOUT_TEMPLATES } from '../constants/exercises';
import Dexie, { Table } from 'dexie';

// Database schema
class WorkoutDatabase extends Dexie {
  workouts!: Table<Workout>;
  exercises!: Table<Exercise>;
  sets!: Table<Set>;
  templates!: Table<WorkoutTemplate>;
  personalRecords!: Table<PersonalRecord>;

  constructor() {
    super('FitnessCoachDB');
    
    this.version(1).stores({
      workouts: '++id, date, name, startTime, endTime, totalVolume, duration',
      exercises: '++id, name, category, &muscleGroups, equipment',
      sets: '++id, workoutExerciseId, reps, weight, completedAt, restTime',
      templates: '++id, name, category, difficulty, estimatedDuration',
      personalRecords: '++id, exerciseId, type, value, date, workoutId'
    });

    // Populate with default data on first run
    this.on('ready', () => {
      return this.populateDefaultData();
    });
  }

  private async populateDefaultData() {
    // Add default exercises if none exist
    const exerciseCount = await this.exercises.count();
    if (exerciseCount === 0) {
      await this.exercises.bulkAdd(EXERCISE_DATABASE);
    }

    // Add default templates if none exist
    const templateCount = await this.templates.count();
    if (templateCount === 0) {
      await this.templates.bulkAdd(WORKOUT_TEMPLATES);
    }
  }
}

export class WorkoutService {
  private db: WorkoutDatabase;
  private activeWorkout: Workout | null = null;
  private currentExercise: WorkoutExercise | null = null;
  private currentSet = 0;
  private isRecording = false;
  private preferences: WorkoutPreferences;
  private restTimer: number | null = null;
  private workoutTimer: number | null = null;
  private startTime: Date | null = null;

  // Event callbacks
  private onWorkoutUpdate?: (workout: Workout) => void;
  private onSetCompleted?: (set: Set, exercise: WorkoutExercise) => void;
  private onPersonalRecord?: (record: PersonalRecord) => void;
  private onRestTimerUpdate?: (timeRemaining: number) => void;

  constructor(preferences?: Partial<WorkoutPreferences>) {
    this.db = new WorkoutDatabase();
    this.preferences = this.getDefaultPreferences();
    if (preferences) {
      this.preferences = { ...this.preferences, ...preferences };
    }
  }

  // Start a new workout
  async startWorkout(templateId?: string, name?: string): Promise<Workout> {
    if (this.activeWorkout) {
      throw new Error('Another workout is already in progress');
    }

    let exercises: Omit<WorkoutExercise, 'id' | 'sets'>[] = [];
    let workoutName = name || 'Custom Workout';

    // Load template if specified
    if (templateId) {
      const template = await this.db.templates.get(templateId);
      if (template) {
        exercises = template.exercises;
        workoutName = template.name;
      }
    }

    // Create new workout
    const workout: Workout = {
      id: this.generateId(),
      name: workoutName,
      date: new Date(),
      startTime: new Date(),
      exercises: [],
      totalVolume: 0,
      workoutTemplateId: templateId
    };

    // Convert template exercises to workout exercises
    for (const templateExercise of exercises) {
      const exercise = await this.db.exercises.get(templateExercise.exerciseId);
      if (exercise) {
        const workoutExercise: WorkoutExercise = {
          id: this.generateId(),
          exerciseId: templateExercise.exerciseId,
          exercise,
          sets: [],
          targetSets: templateExercise.targetSets,
          targetReps: templateExercise.targetReps,
          targetWeight: templateExercise.targetWeight,
          order: templateExercise.order
        };
        workout.exercises.push(workoutExercise);
      }
    }

    // Save to database
    await this.db.workouts.add(workout);

    this.activeWorkout = workout;
    this.isRecording = true;
    this.startTime = new Date();
    this.startWorkoutTimer();

    if (this.onWorkoutUpdate) {
      this.onWorkoutUpdate(workout);
    }

    return workout;
  }

  // End the current workout
  async endWorkout(): Promise<Workout> {
    if (!this.activeWorkout) {
      throw new Error('No active workout to end');
    }

    const endTime = new Date();
    const duration = this.startTime ? 
      Math.floor((endTime.getTime() - this.startTime.getTime()) / 1000 / 60) : 0;

    // Update workout with final stats
    this.activeWorkout.endTime = endTime;
    this.activeWorkout.duration = duration;
    this.activeWorkout.totalVolume = this.calculateTotalVolume(this.activeWorkout);

    // Save final workout
    await this.db.workouts.put(this.activeWorkout);

    // Check for new personal records
    await this.checkForPersonalRecords(this.activeWorkout);

    const completedWorkout = { ...this.activeWorkout };

    // Clean up
    this.activeWorkout = null;
    this.currentExercise = null;
    this.currentSet = 0;
    this.isRecording = false;
    this.stopWorkoutTimer();
    this.stopRestTimer();

    return completedWorkout;
  }

  // Add an exercise to the current workout
  async addExercise(exerciseId: string): Promise<WorkoutExercise> {
    if (!this.activeWorkout) {
      throw new Error('No active workout');
    }

    const exercise = await this.db.exercises.get(exerciseId);
    if (!exercise) {
      throw new Error('Exercise not found');
    }

    const workoutExercise: WorkoutExercise = {
      id: this.generateId(),
      exerciseId,
      exercise,
      sets: [],
      order: this.activeWorkout.exercises.length + 1
    };

    this.activeWorkout.exercises.push(workoutExercise);
    await this.db.workouts.put(this.activeWorkout);

    if (this.onWorkoutUpdate) {
      this.onWorkoutUpdate(this.activeWorkout);
    }

    return workoutExercise;
  }

  // Log a set for an exercise
  async logSet(
    exerciseId: string, 
    reps: number, 
    weight: number, 
    notes?: string,
    difficulty?: 1 | 2 | 3 | 4 | 5
  ): Promise<Set> {
    if (!this.activeWorkout) {
      throw new Error('No active workout');
    }

    let workoutExercise = this.activeWorkout.exercises.find(e => e.exerciseId === exerciseId);
    
    // If exercise not in workout, add it
    if (!workoutExercise) {
      workoutExercise = await this.addExercise(exerciseId);
    }

    const set: Set = {
      id: this.generateId(),
      reps,
      weight,
      notes,
      difficulty,
      completedAt: new Date()
    };

    workoutExercise.sets.push(set);
    this.currentExercise = workoutExercise;
    this.currentSet = workoutExercise.sets.length;

    // Update total volume
    this.activeWorkout.totalVolume = this.calculateTotalVolume(this.activeWorkout);

    // Save to database
    await this.db.workouts.put(this.activeWorkout);

    if (this.onSetCompleted) {
      this.onSetCompleted(set, workoutExercise);
    }

    if (this.onWorkoutUpdate) {
      this.onWorkoutUpdate(this.activeWorkout);
    }

    // Start rest timer if enabled
    if (this.preferences.autoStartTimer) {
      this.startRestTimer(this.preferences.defaultRestTime);
    }

    return set;
  }

  // Process voice input for workout logging
  async processVoiceInput(input: VoiceInput): Promise<void> {
    const transcript = input.transcript.toLowerCase();
    
    // Extract exercise, reps, and weight from transcript
    const exerciseMatch = this.findExerciseInTranscript(transcript);
    const repsMatch = transcript.match(/(\d+)\s*reps?/);
    const weightMatch = transcript.match(/(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?|kg|kilos?)/);

    if (exerciseMatch && repsMatch && weightMatch) {
      const reps = parseInt(repsMatch[1]);
      const weight = parseFloat(weightMatch[1]);
      
      await this.logSet(exerciseMatch.id, reps, weight);
    } else {
      throw new Error('Could not parse exercise information from voice input');
    }
  }

  // Find exercise mentioned in transcript
  private findExerciseInTranscript(transcript: string): Exercise | null {
    // First try exact matches
    for (const exercise of EXERCISE_DATABASE) {
      if (transcript.includes(exercise.name.toLowerCase())) {
        return exercise;
      }
    }

    // Then try partial matches
    for (const exercise of EXERCISE_DATABASE) {
      const exerciseWords = exercise.name.toLowerCase().split(' ');
      if (exerciseWords.some(word => transcript.includes(word))) {
        return exercise;
      }
    }

    return null;
  }

  // Get workout context for AI/voice services
  getWorkoutContext(): WorkoutContext {
    return {
      activeWorkout: this.activeWorkout,
      currentExercise: this.currentExercise,
      currentSet: this.currentSet,
      isRecording: this.isRecording,
      userLevel: 'intermediate', // Would be determined from user data
      preferences: this.preferences
    };
  }

  // Rest timer management
  startRestTimer(seconds: number): void {
    this.stopRestTimer(); // Clear any existing timer
    
    let timeRemaining = seconds;
    this.restTimer = window.setInterval(() => {
      timeRemaining--;
      
      if (this.onRestTimerUpdate) {
        this.onRestTimerUpdate(timeRemaining);
      }
      
      if (timeRemaining <= 0) {
        this.stopRestTimer();
      }
    }, 1000);
  }

  stopRestTimer(): void {
    if (this.restTimer) {
      clearInterval(this.restTimer);
      this.restTimer = null;
    }
  }

  // Workout timer management
  private startWorkoutTimer(): void {
    this.workoutTimer = window.setInterval(() => {
      // Update workout duration
      if (this.activeWorkout && this.startTime) {
        const duration = Math.floor((Date.now() - this.startTime.getTime()) / 1000 / 60);
        this.activeWorkout.duration = duration;
      }
    }, 60000); // Update every minute
  }

  private stopWorkoutTimer(): void {
    if (this.workoutTimer) {
      clearInterval(this.workoutTimer);
      this.workoutTimer = null;
    }
  }

  // Calculate total volume (weight × reps) for a workout
  private calculateTotalVolume(workout: Workout): number {
    return workout.exercises.reduce((total, exercise) => {
      return total + exercise.sets.reduce((exerciseTotal, set) => {
        return exerciseTotal + (set.weight * set.reps);
      }, 0);
    }, 0);
  }

  // Check for personal records
  private async checkForPersonalRecords(workout: Workout): Promise<void> {
    for (const exercise of workout.exercises) {
      if (exercise.sets.length === 0) continue;

      // Check for max weight PR
      const maxWeight = Math.max(...exercise.sets.map(set => set.weight));
      const existingMaxWeight = await this.db.personalRecords
        .where({ exerciseId: exercise.exerciseId, type: 'max_weight' })
        .first();

      if (!existingMaxWeight || maxWeight > existingMaxWeight.value) {
        const pr: PersonalRecord = {
          id: this.generateId(),
          exerciseId: exercise.exerciseId,
          exercise: exercise.exercise,
          type: 'max_weight',
          value: maxWeight,
          date: new Date(),
          workoutId: workout.id
        };
        
        await this.db.personalRecords.add(pr);
        
        if (this.onPersonalRecord) {
          this.onPersonalRecord(pr);
        }
      }

      // Check for max reps PR (at any weight)
      const maxReps = Math.max(...exercise.sets.map(set => set.reps));
      const existingMaxReps = await this.db.personalRecords
        .where({ exerciseId: exercise.exerciseId, type: 'max_reps' })
        .first();

      if (!existingMaxReps || maxReps > existingMaxReps.value) {
        const pr: PersonalRecord = {
          id: this.generateId(),
          exerciseId: exercise.exerciseId,
          exercise: exercise.exercise,
          type: 'max_reps',
          value: maxReps,
          date: new Date(),
          workoutId: workout.id
        };
        
        await this.db.personalRecords.add(pr);
        
        if (this.onPersonalRecord) {
          this.onPersonalRecord(pr);
        }
      }

      // Check for max volume PR
      const totalVolume = exercise.sets.reduce((total, set) => 
        total + (set.weight * set.reps), 0);
      const existingMaxVolume = await this.db.personalRecords
        .where({ exerciseId: exercise.exerciseId, type: 'max_volume' })
        .first();

      if (!existingMaxVolume || totalVolume > existingMaxVolume.value) {
        const pr: PersonalRecord = {
          id: this.generateId(),
          exerciseId: exercise.exerciseId,
          exercise: exercise.exercise,
          type: 'max_volume',
          value: totalVolume,
          date: new Date(),
          workoutId: workout.id
        };
        
        await this.db.personalRecords.add(pr);
        
        if (this.onPersonalRecord) {
          this.onPersonalRecord(pr);
        }
      }
    }
  }

  // Get workout history
  async getWorkoutHistory(limit = 50): Promise<Workout[]> {
    return await this.db.workouts
      .orderBy('date')
      .reverse()
      .limit(limit)
      .toArray();
  }

  // Get personal records for an exercise
  async getPersonalRecords(exerciseId: string): Promise<PersonalRecord[]> {
    return await this.db.personalRecords
      .where('exerciseId')
      .equals(exerciseId)
      .toArray();
  }

  // Get progress metrics
  async getProgressMetrics(): Promise<ProgressMetrics> {
    const workouts = await this.getWorkoutHistory();
    const allRecords = await this.db.personalRecords.toArray();

    // Calculate strength progress
    const strengthProgress = this.calculateStrengthProgress(allRecords);
    
    // Calculate volume progress
    const volumeProgress = this.calculateVolumeProgress(workouts);
    
    // Calculate frequency metrics
    const frequencyMetrics = this.calculateFrequencyMetrics(workouts);
    
    // Calculate performance metrics
    const performanceMetrics = this.calculatePerformanceMetrics(workouts);

    return {
      strengthProgress,
      volumeProgress,
      frequencyMetrics,
      performanceMetrics
    };
  }

  private calculateStrengthProgress(records: PersonalRecord[]): any[] {
    const exerciseGroups = records.reduce((groups, record) => {
      if (record.type === 'max_weight') {
        if (!groups[record.exerciseId]) {
          groups[record.exerciseId] = [];
        }
        groups[record.exerciseId].push(record);
      }
      return groups;
    }, {} as Record<string, PersonalRecord[]>);

    return Object.entries(exerciseGroups).map(([exerciseId, exerciseRecords]) => {
      exerciseRecords.sort((a, b) => a.date.getTime() - b.date.getTime());
      const latest = exerciseRecords[exerciseRecords.length - 1];
      const previous = exerciseRecords[exerciseRecords.length - 2];
      
      const improvement = previous ? 
        ((latest.value - previous.value) / previous.value) * 100 : 0;

      return {
        exerciseId,
        exercise: latest.exercise,
        maxWeight: latest.value,
        date: latest.date,
        improvement
      };
    });
  }

  private calculateVolumeProgress(workouts: Workout[]): any[] {
    return workouts.map(workout => ({
      date: workout.date,
      totalVolume: workout.totalVolume,
      exercises: workout.exercises.reduce((acc, exercise) => {
        acc[exercise.exerciseId] = exercise.sets.reduce((total, set) => 
          total + (set.weight * set.reps), 0);
        return acc;
      }, {} as Record<string, number>)
    }));
  }

  private calculateFrequencyMetrics(workouts: Workout[]): any {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentWorkouts = workouts.filter(w => w.date >= oneWeekAgo);
    
    const totalDuration = workouts.reduce((total, workout) => 
      total + (workout.duration || 0), 0);
    const averageSessionDuration = workouts.length > 0 ? 
      totalDuration / workouts.length : 0;

    return {
      workoutsPerWeek: recentWorkouts.length,
      averageSessionDuration,
      consistency: this.calculateConsistency(workouts),
      lastWorkout: workouts.length > 0 ? workouts[0].date : new Date()
    };
  }

  private calculatePerformanceMetrics(workouts: Workout[]): any {
    const allSets = workouts.flatMap(w => 
      w.exercises.flatMap(e => e.sets.map(s => ({ ...s, exercise: e.exercise })))
    );

    const totalRestTime = allSets.reduce((total, set) => 
      total + (set.restTime || 0), 0);
    const averageRestTime = allSets.length > 0 ? 
      totalRestTime / allSets.length : 0;

    const completedSets = allSets.length;
    const plannedSets = workouts.reduce((total, workout) => 
      total + workout.exercises.reduce((exerciseTotal, exercise) => 
        exerciseTotal + (exercise.targetSets || 3), 0), 0);
    const setCompletionRate = plannedSets > 0 ? 
      (completedSets / plannedSets) * 100 : 100;

    return {
      averageRestTime,
      setCompletionRate,
      workoutCompletionRate: 95, // Simplified calculation
      injuryRate: 0 // Would track based on user reports
    };
  }

  private calculateConsistency(workouts: Workout[]): number {
    if (workouts.length < 2) return 100;
    
    // Calculate how consistent the workout frequency is
    const dates = workouts.map(w => w.date).sort((a, b) => a.getTime() - b.getTime());
    const intervals = [];
    
    for (let i = 1; i < dates.length; i++) {
      const daysBetween = (dates[i].getTime() - dates[i-1].getTime()) / (1000 * 60 * 60 * 24);
      intervals.push(daysBetween);
    }
    
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => 
      sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    
    // Convert variance to consistency percentage (lower variance = higher consistency)
    const consistency = Math.max(0, 100 - (Math.sqrt(variance) * 10));
    return Math.min(100, consistency);
  }

  // Exercise database methods
  async getExercise(id: string): Promise<Exercise | undefined> {
    return await this.db.exercises.get(id);
  }

  async searchExercises(query: string): Promise<Exercise[]> {
    const searchTerm = query.toLowerCase();
    return await this.db.exercises
      .filter(exercise => 
        exercise.name.toLowerCase().includes(searchTerm) ||
        exercise.category.toLowerCase().includes(searchTerm) ||
        exercise.muscleGroups.some(muscle => muscle.toLowerCase().includes(searchTerm))
      )
      .toArray();
  }

  async getExercisesByCategory(category: string): Promise<Exercise[]> {
    return await this.db.exercises
      .where('category')
      .equals(category)
      .toArray();
  }

  // Template methods
  async getWorkoutTemplates(): Promise<WorkoutTemplate[]> {
    return await this.db.templates.toArray();
  }

  async getWorkoutTemplate(id: string): Promise<WorkoutTemplate | undefined> {
    return await this.db.templates.get(id);
  }

  // Event handlers
  onWorkoutUpdated(callback: (workout: Workout) => void): void {
    this.onWorkoutUpdate = callback;
  }

  onSetCompletedEvent(callback: (set: Set, exercise: WorkoutExercise) => void): void {
    this.onSetCompleted = callback;
  }

  onPersonalRecordEvent(callback: (record: PersonalRecord) => void): void {
    this.onPersonalRecord = callback;
  }

  onRestTimerUpdated(callback: (timeRemaining: number) => void): void {
    this.onRestTimerUpdate = callback;
  }

  // Utility methods
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDefaultPreferences(): WorkoutPreferences {
    return {
      defaultRestTime: 90,
      weightUnit: 'lbs',
      voiceCoaching: true,
      autoStartTimer: true,
      motivationalMessages: true,
      formReminders: true
    };
  }

  // Getters
  getActiveWorkout(): Workout | null {
    return this.activeWorkout;
  }

  getCurrentExercise(): WorkoutExercise | null {
    return this.currentExercise;
  }

  getCurrentSet(): number {
    return this.currentSet;
  }

  isWorkoutActive(): boolean {
    return this.isRecording && this.activeWorkout !== null;
  }

  getPreferences(): WorkoutPreferences {
    return { ...this.preferences };
  }

  // Update preferences
  updatePreferences(newPreferences: Partial<WorkoutPreferences>): void {
    this.preferences = { ...this.preferences, ...newPreferences };
  }

  // Cleanup
  destroy(): void {
    this.stopRestTimer();
    this.stopWorkoutTimer();
    this.db.close();
  }
}

// Singleton instance
let workoutServiceInstance: WorkoutService | null = null;

export function getWorkoutService(preferences?: Partial<WorkoutPreferences>): WorkoutService {
  if (!workoutServiceInstance) {
    workoutServiceInstance = new WorkoutService(preferences);
  }
  return workoutServiceInstance;
}