import { databaseService } from './databaseService';

export interface StoredWorkoutTemplate {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // weeks
  category: 'strength' | 'cardio' | 'flexibility' | 'full-body' | 'sports';
  goals: string[];
  equipment: string[];
  daysPerWeek: number;
  estimatedTime: number; // minutes per session
  rating: number;
  downloads: number;
  isCustom?: boolean;
  isAI?: boolean;
  schedule: {
    day: string;
    name: string;
    exercises: {
      id: string;
      name: string;
      sets: number;
      reps: string;
      restTime: number;
      notes?: string;
    }[];
  }[];
  createdAt: Date;
  lastUsed?: Date;
  isActive?: boolean;
  currentWeek?: number;
  startDate?: Date;
}

export interface DayWorkout {
  id: string;
  templateId: string;
  templateName: string;
  day: string;
  name: string;
  exercises: {
    id: string;
    name: string;
    sets: number;
    reps: string;
    restTime: number;
    notes?: string;
    completed?: boolean;
    actualSets?: {
      reps: number;
      weight: number;
      completed: boolean;
    }[];
  }[];
  scheduledDate: Date;
  completed: boolean;
  duration?: number;
  notes?: string;
}

export interface WeeklySchedule {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  days: {
    [day: string]: DayWorkout | null;
  };
}

export class WorkoutStorageService {
  private static instance: WorkoutStorageService;
  
  public static getInstance(): WorkoutStorageService {
    if (!WorkoutStorageService.instance) {
      WorkoutStorageService.instance = new WorkoutStorageService();
    }
    return WorkoutStorageService.instance;
  }

  // Save workout template
  async saveWorkoutTemplate(template: StoredWorkoutTemplate): Promise<void> {
    try {
      await databaseService.setItem(`workout_template_${template.id}`, template);
      console.log('Workout template saved:', template.id);
    } catch (error) {
      console.error('Failed to save workout template:', error);
      throw error;
    }
  }

  // Get all workout templates
  async getAllWorkoutTemplates(): Promise<StoredWorkoutTemplate[]> {
    try {
      const templates: StoredWorkoutTemplate[] = [];
      const keys = await databaseService.getAllKeys();
      const templateKeys = keys.filter(key => key.startsWith('workout_template_'));
      
      for (const key of templateKeys) {
        const template = await databaseService.getItem(key);
        if (template) {
          templates.push(template);
        }
      }
      
      return templates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Failed to get workout templates:', error);
      return [];
    }
  }

  // Get active workout template
  async getActiveWorkoutTemplate(): Promise<StoredWorkoutTemplate | null> {
    try {
      const templates = await this.getAllWorkoutTemplates();
      return templates.find(template => template.isActive) || null;
    } catch (error) {
      console.error('Failed to get active workout template:', error);
      return null;
    }
  }

  // Activate a workout template
  async activateWorkoutTemplate(templateId: string): Promise<void> {
    try {
      // Deactivate all other templates
      const templates = await this.getAllWorkoutTemplates();
      for (const template of templates) {
        if (template.id !== templateId) {
          template.isActive = false;
          await this.saveWorkoutTemplate(template);
        }
      }

      // Activate the selected template
      const template = templates.find(t => t.id === templateId);
      if (template) {
        template.isActive = true;
        template.startDate = new Date();
        template.currentWeek = 1;
        template.lastUsed = new Date();
        await this.saveWorkoutTemplate(template);
        
        // Generate weekly schedule
        await this.generateWeeklySchedule(template);
      }
    } catch (error) {
      console.error('Failed to activate workout template:', error);
      throw error;
    }
  }

  // Generate weekly schedule from template
  async generateWeeklySchedule(template: StoredWorkoutTemplate): Promise<void> {
    try {
      const today = new Date();
      const startOfWeek = this.getStartOfWeek(today);
      
      const weeklySchedule: WeeklySchedule = {
        weekNumber: template.currentWeek || 1,
        startDate: startOfWeek,
        endDate: new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000),
        days: {}
      };

      // Generate day workouts for the week
      for (const daySchedule of template.schedule) {
        const dayDate = this.getDayDate(startOfWeek, daySchedule.day);
        const dayWorkout: DayWorkout = {
          id: `${template.id}_${daySchedule.day}_${weeklySchedule.weekNumber}`,
          templateId: template.id,
          templateName: template.name,
          day: daySchedule.day,
          name: daySchedule.name,
          exercises: daySchedule.exercises.map(exercise => ({
            ...exercise,
            completed: false,
            actualSets: []
          })),
          scheduledDate: dayDate,
          completed: false
        };

        weeklySchedule.days[daySchedule.day] = dayWorkout;
        await this.saveDayWorkout(dayWorkout);
      }

      // Save weekly schedule
      await databaseService.setItem(`weekly_schedule_${template.id}_${weeklySchedule.weekNumber}`, weeklySchedule);
      console.log('Weekly schedule generated for template:', template.id);
    } catch (error) {
      console.error('Failed to generate weekly schedule:', error);
      throw error;
    }
  }

  // Save day workout
  async saveDayWorkout(dayWorkout: DayWorkout): Promise<void> {
    try {
      await databaseService.setItem(`day_workout_${dayWorkout.id}`, dayWorkout);
    } catch (error) {
      console.error('Failed to save day workout:', error);
      throw error;
    }
  }

  // Get day workouts for current week
  async getCurrentWeekWorkouts(): Promise<DayWorkout[]> {
    try {
      const activeTemplate = await this.getActiveWorkoutTemplate();
      if (!activeTemplate) return [];

      const weekNumber = activeTemplate.currentWeek || 1;
      const weeklySchedule = await databaseService.getItem(`weekly_schedule_${activeTemplate.id}_${weekNumber}`);
      
      if (!weeklySchedule) return [];

      const dayWorkouts: DayWorkout[] = [];
      for (const dayKey of Object.keys(weeklySchedule.days)) {
        const dayWorkout = weeklySchedule.days[dayKey];
        if (dayWorkout) {
          dayWorkouts.push(dayWorkout);
        }
      }

      return dayWorkouts.sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
    } catch (error) {
      console.error('Failed to get current week workouts:', error);
      return [];
    }
  }

  // Get today's workout
  async getTodayWorkout(): Promise<DayWorkout | null> {
    try {
      const dayWorkouts = await this.getCurrentWeekWorkouts();
      const today = new Date();
      const todayName = this.getDayName(today);
      
      return dayWorkouts.find(workout => workout.day === todayName) || null;
    } catch (error) {
      console.error('Failed to get today workout:', error);
      return null;
    }
  }

  // Complete a workout
  async completeWorkout(workoutId: string, actualSets: any[]): Promise<void> {
    try {
      const workout = await databaseService.getItem(`day_workout_${workoutId}`);
      if (workout) {
        workout.completed = true;
        workout.exercises = workout.exercises.map((exercise: any, index: number) => ({
          ...exercise,
          actualSets: actualSets[index] || []
        }));
        workout.duration = this.calculateWorkoutDuration(actualSets);
        await this.saveDayWorkout(workout);
      }
    } catch (error) {
      console.error('Failed to complete workout:', error);
      throw error;
    }
  }

  // Get workout statistics
  async getWorkoutStats(): Promise<{
    totalWorkouts: number;
    completedWorkouts: number;
    currentStreak: number;
    totalMinutes: number;
    thisWeekWorkouts: number;
  }> {
    try {
      const dayWorkouts = await this.getCurrentWeekWorkouts();
      const completedWorkouts = dayWorkouts.filter(workout => workout.completed).length;
      
      return {
        totalWorkouts: dayWorkouts.length,
        completedWorkouts,
        currentStreak: this.calculateStreak(),
        totalMinutes: dayWorkouts.reduce((total, workout) => total + (workout.duration || 0), 0),
        thisWeekWorkouts: dayWorkouts.length
      };
    } catch (error) {
      console.error('Failed to get workout stats:', error);
      return {
        totalWorkouts: 0,
        completedWorkouts: 0,
        currentStreak: 0,
        totalMinutes: 0,
        thisWeekWorkouts: 0
      };
    }
  }

  // Helper methods
  private getStartOfWeek(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }

  private getDayDate(startOfWeek: Date, dayName: string): Date {
    const dayMap: { [key: string]: number } = {
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6,
      'Sunday': 0
    };
    
    const dayOffset = dayMap[dayName] || 0;
    return new Date(startOfWeek.getTime() + dayOffset * 24 * 60 * 60 * 1000);
  }

  private getDayName(date: Date): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }

  private calculateWorkoutDuration(actualSets: any[]): number {
    // Simple calculation: 2 minutes per exercise + rest time
    return actualSets.length * 2 + actualSets.reduce((total, sets) => total + (sets.length * 1.5), 0);
  }

  private calculateStreak(): number {
    // This would need to be implemented based on historical data
    return 0;
  }

  // Clear all data (for testing)
  async clearAllData(): Promise<void> {
    try {
      const keys = await databaseService.getAllKeys();
      const workoutKeys = keys.filter(key => 
        key.startsWith('workout_template_') || 
        key.startsWith('day_workout_') || 
        key.startsWith('weekly_schedule_')
      );
      
      for (const key of workoutKeys) {
        await databaseService.removeItem(key);
      }
    } catch (error) {
      console.error('Failed to clear workout data:', error);
    }
  }
}

export const workoutStorageService = WorkoutStorageService.getInstance(); 