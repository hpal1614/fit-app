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

  // Generic storage methods for workout storage service
  async setItem(key: string, value: any): Promise<void> {
    try {
      // Store in a generic table or use localStorage as fallback
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, JSON.stringify(value));
      } else {
        // Fallback to database if localStorage not available
        await this.db.table('userSettings').put({ id: key, value: JSON.stringify(value) });
      }
    } catch (error) {
      console.error('Failed to set item:', error);
      throw error;
    }
  }

  async getItem(key: string): Promise<any> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } else {
        // Fallback to database if localStorage not available
        const item = await this.db.table('userSettings').get(key);
        return item ? JSON.parse(item.value) : null;
      }
    } catch (error) {
      console.error('Failed to get item:', error);
      return null;
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return Object.keys(localStorage);
      } else {
        // Fallback to database if localStorage not available
        const items = await this.db.table('userSettings').toArray();
        return items.map(item => item.id);
      }
    } catch (error) {
      console.error('Failed to get all keys:', error);
      return [];
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(key);
      } else {
        // Fallback to database if localStorage not available
        await this.db.table('userSettings').delete(key);
      }
    } catch (error) {
      console.error('Failed to remove item:', error);
      throw error;
    }
  }
}

export const databaseService = new DatabaseService();
export default DatabaseService;