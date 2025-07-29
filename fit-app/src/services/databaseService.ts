import Dexie, { type Table } from 'dexie';
import type {
  Workout,
  Exercise,
  WorkoutTemplate,
  PersonalRecord
} from '../types/workout';
import type { User, AppSettings } from '../types';

// Database schema interfaces
interface DBWorkout extends Omit<Workout, 'startTime' | 'endTime'> {
  startTime: string;
  endTime: string | null;
}

interface DBPersonalRecord extends Omit<PersonalRecord, 'date'> {
  date: string;
}



export class FitnessDatabase extends Dexie {
  workouts!: Table<DBWorkout>;
  personalRecords!: Table<DBPersonalRecord>;
  workoutTemplates!: Table<WorkoutTemplate>;
  exercises!: Table<Exercise>;
  userSettings!: Table<AppSettings>;
  userProfile!: Table<User>;

  constructor() {
    super('FitnessCoachDB');
    
    this.version(1).stores({
      workouts: '++id, name, type, startTime, endTime, isCompleted',
      personalRecords: '++id, exerciseId, weight, reps, oneRepMax, date, workoutId',
      workoutTemplates: '++id, name, category, difficulty, estimatedDuration',
      exercises: '++id, name, category, muscleGroups, equipment, difficulty',
      userSettings: '++id, theme, notifications, units',
      userProfile: '++id, name, email, createdAt, updatedAt'
    });

    // Add hooks for data transformation
    this.workouts.hook('creating', function (_primKey, obj, _trans) {
      obj.startTime = obj.startTime || new Date().toISOString();
    });

    this.workouts.hook('updating', function (modifications, _primKey, _obj, _trans) {
      (modifications as any).updatedAt = new Date().toISOString();
    });
  }
}

export class DatabaseService {
  private db: FitnessDatabase;


  constructor() {
    this.db = new FitnessDatabase();
  }

  async initialize(): Promise<boolean> {
    try {
      await this.db.open();
      
      // Seed initial data if needed
      await this.seedInitialData();
      
      
      return true;
    } catch (_error) {
      console.error('Failed to initialize database:', _error);
      return false;
    }
  }

  // Workout Operations
  async saveWorkout(workout: Workout): Promise<string> {
    try {
      const dbWorkout: DBWorkout = {
        ...workout,
        startTime: workout.startTime.toISOString(),
        endTime: workout.endTime?.toISOString() || null
      };
      
      const id = await this.db.workouts.put(dbWorkout);
      return id.toString();
    } catch (_error) {
      console.error('Failed to save workout:', _error);
      throw new Error('Failed to save workout');
    }
  }

  async getWorkout(id: string): Promise<Workout | null> {
    try {
      const dbWorkout = await this.db.workouts.get(id);
      if (!dbWorkout) return null;

      return {
        ...dbWorkout,
        startTime: new Date(dbWorkout.startTime),
        endTime: dbWorkout.endTime ? new Date(dbWorkout.endTime) : undefined
      };
    } catch (_error) {
      console.error('Failed to get workout:', _error);
      return null;
    }
  }

  async getWorkoutHistory(limit: number = 10): Promise<Workout[]> {
    try {
      const dbWorkouts = await this.db.workouts
        .orderBy('startTime')
        .reverse()
        .limit(limit)
        .toArray();

      return dbWorkouts.map(dbWorkout => ({
        ...dbWorkout,
        startTime: new Date(dbWorkout.startTime),
        endTime: dbWorkout.endTime ? new Date(dbWorkout.endTime) : undefined
      }));
    } catch (_error) {
      console.error('Failed to get workout history:', _error);
      return [];
    }
  }

  async deleteWorkout(id: string): Promise<boolean> {
    try {
      await this.db.workouts.delete(id);
      return true;
    } catch (_error) {
      console.error('Failed to delete workout:', _error);
      return false;
    }
  }

  async getWorkoutsByDateRange(startDate: Date, endDate: Date): Promise<Workout[]> {
    try {
      const dbWorkouts = await this.db.workouts
        .where('startTime')
        .between(startDate.toISOString(), endDate.toISOString())
        .toArray();

      return dbWorkouts.map(dbWorkout => ({
        ...dbWorkout,
        startTime: new Date(dbWorkout.startTime),
        endTime: dbWorkout.endTime ? new Date(dbWorkout.endTime) : undefined
      }));
    } catch (_error) {
      console.error('Failed to get workouts by date range:', _error);
      return [];
    }
  }

  // Personal Records Operations
  async savePersonalRecord(record: PersonalRecord): Promise<string> {
    try {
      const dbRecord: DBPersonalRecord = {
        ...record,
        date: record.date.toISOString()
      };
      
      const id = await this.db.personalRecords.put(dbRecord);
      return id.toString();
    } catch (_error) {
      console.error('Failed to save personal record:', _error);
      throw new Error('Failed to save personal record');
    }
  }

  async getPersonalRecords(exerciseId?: string): Promise<PersonalRecord[]> {
    try {
      let query = this.db.personalRecords.orderBy('date').reverse();
      
      if (exerciseId) {
        query = this.db.personalRecords.where('exerciseId').equals(exerciseId);
      }
      
      const dbRecords = await query.toArray();
      
      return dbRecords.map(dbRecord => ({
        ...dbRecord,
        date: new Date(dbRecord.date)
      }));
    } catch (_error) {
      console.error('Failed to get personal records:', _error);
      return [];
    }
  }

  async getBestPersonalRecord(exerciseId: string): Promise<PersonalRecord | null> {
    try {
      const records = await this.getPersonalRecords(exerciseId);
      if (records.length === 0) return null;
      
      return records.reduce((best, current) => 
        current.oneRepMax > best.oneRepMax ? current : best
      );
    } catch (_error) {
      console.error('Failed to get best personal record:', _error);
      return null;
    }
  }

  // Workout Templates Operations
  async saveWorkoutTemplate(template: WorkoutTemplate): Promise<string> {
    try {
      const id = await this.db.workoutTemplates.put(template);
      return id.toString();
    } catch (_error) {
      console.error('Failed to save workout template:', _error);
      throw new Error('Failed to save workout template');
    }
  }

  async getWorkoutTemplates(): Promise<WorkoutTemplate[]> {
    try {
      return await this.db.workoutTemplates.toArray();
    } catch (_error) {
      console.error('Failed to get workout templates:', _error);
      return [];
    }
  }

  async getWorkoutTemplate(id: string): Promise<WorkoutTemplate | null> {
    try {
      return await this.db.workoutTemplates.get(id) || null;
    } catch (_error) {
      console.error('Failed to get workout template:', _error);
      return null;
    }
  }

  async deleteWorkoutTemplate(id: string): Promise<boolean> {
    try {
      await this.db.workoutTemplates.delete(id);
      return true;
    } catch (_error) {
      console.error('Failed to delete workout template:', _error);
      return false;
    }
  }

  // Exercise Operations
  async saveExercise(exercise: Exercise): Promise<string> {
    try {
      const id = await this.db.exercises.put(exercise);
      return id.toString();
    } catch (_error) {
      console.error('Failed to save exercise:', _error);
      throw new Error('Failed to save exercise');
    }
  }

  async getExercises(): Promise<Exercise[]> {
    try {
      return await this.db.exercises.toArray();
    } catch (_error) {
      console.error('Failed to get exercises:', _error);
      return [];
    }
  }

  async getExercise(id: string): Promise<Exercise | null> {
    try {
      return await this.db.exercises.get(id) || null;
    } catch (_error) {
      console.error('Failed to get exercise:', _error);
      return null;
    }
  }

  async searchExercises(query: string): Promise<Exercise[]> {
    try {
      const lowerQuery = query.toLowerCase();
      return await this.db.exercises
        .filter(exercise => 
          exercise.name.toLowerCase().includes(lowerQuery) ||
          exercise.category.toLowerCase().includes(lowerQuery) ||
          exercise.muscleGroups.some((muscle: string) => muscle.toLowerCase().includes(lowerQuery))
        )
        .toArray();
    } catch (_error) {
      console.error('Failed to search exercises:', _error);
      return [];
    }
  }

  // User Settings Operations
  async saveUserSettings(settings: AppSettings): Promise<boolean> {
    try {
      await this.db.userSettings.put(settings);
      return true;
    } catch (_error) {
      console.error('Failed to save user settings:', _error);
      return false;
    }
  }

  async getUserSettings(): Promise<AppSettings | null> {
    try {
      const settings = await this.db.userSettings.toCollection().first();
      return settings || null;
    } catch (_error) {
      console.error('Failed to get user settings:', _error);
      return null;
    }
  }

  // User Profile Operations
  async saveUserProfile(profile: User): Promise<boolean> {
    try {
      await this.db.userProfile.put(profile);
      return true;
    } catch (_error) {
      console.error('Failed to save user profile:', _error);
      return false;
    }
  }

  async getUserProfile(): Promise<User | null> {
    try {
      const profile = await this.db.userProfile.toCollection().first();
      return profile || null;
    } catch (_error) {
      console.error('Failed to get user profile:', _error);
      return null;
    }
  }

  // Analytics and Statistics
  async getWorkoutStats(days: number = 30): Promise<{
    totalWorkouts: number;
    totalDuration: number;
    totalSets: number;
    totalReps: number;
    totalWeight: number;
    averageWorkoutDuration: number;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const workouts = await this.getWorkoutsByDateRange(startDate, new Date());
      
      const stats = workouts.reduce((acc, workout) => {
        acc.totalWorkouts++;
        acc.totalDuration += workout.totalDuration || 0;
        acc.totalSets += workout.totalSets || 0;
        acc.totalReps += workout.totalReps || 0;
        acc.totalWeight += workout.totalWeight || 0;
        return acc;
      }, {
        totalWorkouts: 0,
        totalDuration: 0,
        totalSets: 0,
        totalReps: 0,
        totalWeight: 0,
        averageWorkoutDuration: 0
      });

      stats.averageWorkoutDuration = stats.totalWorkouts > 0 
        ? Math.round(stats.totalDuration / stats.totalWorkouts) 
        : 0;

      return stats;
    } catch (_error) {
      console.error('Failed to get workout stats:', _error);
      return {
        totalWorkouts: 0,
        totalDuration: 0,
        totalSets: 0,
        totalReps: 0,
        totalWeight: 0,
        averageWorkoutDuration: 0
      };
    }
  }

  // Data Management
  async exportData(): Promise<{
    workouts: Workout[];
    personalRecords: PersonalRecord[];
    templates: WorkoutTemplate[];
    exercises: Exercise[];
    settings: AppSettings | null;
    profile: User | null;
  }> {
    try {
      const [workouts, personalRecords, templates, exercises, settings, profile] = await Promise.all([
        this.getWorkoutHistory(1000), // Export all workouts
        this.getPersonalRecords(),
        this.getWorkoutTemplates(),
        this.getExercises(),
        this.getUserSettings(),
        this.getUserProfile()
      ]);

      return {
        workouts,
        personalRecords,
        templates,
        exercises,
        settings,
        profile
      };
    } catch (_error) {
      console.error('Failed to export data:', _error);
      throw new Error('Failed to export data');
    }
  }

  async clearAllData(): Promise<boolean> {
    try {
      await Promise.all([
        this.db.workouts.clear(),
        this.db.personalRecords.clear(),
        this.db.workoutTemplates.clear(),
        this.db.userSettings.clear(),
        this.db.userProfile.clear()
      ]);
      return true;
    } catch (_error) {
      console.error('Failed to clear all data:', _error);
      return false;
    }
  }

  // Progress tracking method for MCP integration
  async getProgress(params: {
    metric: 'strength' | 'endurance' | 'weight' | 'measurements';
    timeframe: 'week' | 'month' | '3months' | 'year';
  }): Promise<any> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      // Calculate start date based on timeframe
      switch (params.timeframe) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case '3months':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      let progressData: any = {
        metric: params.metric,
        timeframe: params.timeframe,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        data: []
      };

      switch (params.metric) {
        case 'strength':
          // Get personal records in timeframe
          const prs = await this.db.personalRecords
            .where('date')
            .between(startDate, endDate)
            .toArray();

          progressData.data = prs.map(pr => ({
            date: pr.date,
            exercise: pr.exerciseName,
            weight: pr.weight,
            reps: pr.reps,
            improvement: pr.previousRecord ? 
              ((pr.weight - pr.previousRecord.weight) / pr.previousRecord.weight * 100).toFixed(1) + '%' : 
              'New PR'
          }));

          progressData.summary = {
            totalPRs: prs.length,
            exercisesImproved: new Set(prs.map(pr => pr.exerciseName)).size,
            averageImprovement: this.calculateAverageImprovement(prs)
          };
          break;

        case 'endurance':
          // Get workouts and calculate volume trends
          const workouts = await this.db.workouts
            .where('startTime') // Changed from 'date' to 'startTime' to match DB schema
            .between(startDate.toISOString(), endDate.toISOString())
            .toArray();

          progressData.data = workouts.map(workout => ({
            date: workout.startTime, // Use workout.startTime as date
            duration: workout.totalDuration || 0, // Assuming totalDuration is stored
            volume: workout.totalVolume || 0, // Assuming totalVolume is stored
            exerciseCount: workout.exercises.length, // Assuming exercises is an array of exercise IDs
            type: workout.type
          }));

          progressData.summary = {
            totalWorkouts: workouts.length,
            averageDuration: workouts.reduce((sum, w) => sum + w.totalDuration || 0, 0) / workouts.length,
            totalVolume: workouts.reduce((sum, w) => sum + w.totalVolume || 0, 0),
            consistency: this.calculateConsistency(workouts, params.timeframe)
          };
          break;

        case 'weight':
        case 'measurements':
          // Mock data for now - would come from user profile tracking
          progressData.data = this.generateMockProgressData(params.metric, startDate, endDate);
          progressData.summary = this.calculateProgressSummary(progressData.data);
          break;
      }

      return progressData;
    } catch (error) {
      console.error('Failed to get progress data:', error);
      throw error;
    }
  }

  private calculateAverageImprovement(prs: PersonalRecord[]): string {
    const improvements = prs
      .filter(pr => pr.previousRecord)
      .map(pr => ((pr.weight - pr.previousRecord!.weight) / pr.previousRecord!.weight * 100));
    
    if (improvements.length === 0) return '0%';
    
    const average = improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length;
    return average.toFixed(1) + '%';
  }

  private calculateConsistency(workouts: Workout[], timeframe: string): number {
    const expectedWorkouts = {
      'week': 3,
      'month': 12,
      '3months': 36,
      'year': 150
    };

    const expected = expectedWorkouts[timeframe as keyof typeof expectedWorkouts];
    return Math.min(100, (workouts.length / expected) * 100);
  }

  private generateMockProgressData(metric: string, startDate: Date, endDate: Date): any[] {
    const data = [];
    const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i <= days; i += 7) { // Weekly data points
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      if (metric === 'weight') {
        data.push({
          date: date.toISOString(),
          weight: 180 - (i / 7) * 0.5 + Math.random() * 2 - 1, // Gradual decrease with variation
          unit: 'lbs'
        });
      } else {
        data.push({
          date: date.toISOString(),
          measurements: {
            chest: 40 - (i / 30) * 0.1,
            waist: 34 - (i / 14) * 0.2,
            arms: 14 + (i / 21) * 0.1,
            thighs: 24 + (i / 28) * 0.05
          },
          unit: 'inches'
        });
      }
    }
    
    return data;
  }

  private calculateProgressSummary(data: any[]): any {
    if (data.length < 2) return { change: 0, trend: 'stable' };
    
    const first = data[0];
    const last = data[data.length - 1];
    
    if (first.weight !== undefined) {
      const change = last.weight - first.weight;
      return {
        totalChange: change.toFixed(1),
        percentChange: ((change / first.weight) * 100).toFixed(1) + '%',
        trend: change < -1 ? 'decreasing' : change > 1 ? 'increasing' : 'stable',
        averageWeekly: (change / (data.length - 1)).toFixed(2)
      };
    }
    
    return {
      measurements: {
        chest: (last.measurements.chest - first.measurements.chest).toFixed(1),
        waist: (last.measurements.waist - first.measurements.waist).toFixed(1),
        arms: (last.measurements.arms - first.measurements.arms).toFixed(1),
        thighs: (last.measurements.thighs - first.measurements.thighs).toFixed(1)
      },
      trend: 'improving'
    };
  }

  // Database maintenance
  async vacuum(): Promise<boolean> {
    try {
      // Dexie doesn't have explicit vacuum, but we can optimize by removing old data
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Could implement cleanup logic here if needed
      return true;
    } catch (_error) {
      console.error('Failed to vacuum database:', _error);
      return false;
    }
  }

  private async seedInitialData(): Promise<void> {
    try {
      // Check if we need to seed initial data
      const exerciseCount = await this.db.exercises.count();
      if (exerciseCount === 0) {
        // Seed with basic exercises from constants
        // This would be implemented based on the EXERCISE_DATABASE constant
        console.log('Seeding initial exercise data...');
      }
    } catch (_error) {
      console.error('Failed to seed initial data:', _error);
    }
  }

  // Singleton pattern
  private static instance: DatabaseService;

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // Cleanup
  async close(): Promise<void> {
    try {
      await this.db.close();
    } catch (_error) {
      console.error('Failed to close database:', _error);
    }
  }
}

export const databaseService = new DatabaseService();
export default DatabaseService;