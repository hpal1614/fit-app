// Workout Storage Service
import { hybridStorageService } from './hybridStorageService';

export interface DayWorkout {
  id: string;
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
  isCompleted?: boolean;
  completedAt?: Date;
  scheduledDate?: Date;
  completed?: boolean;
}

export interface StoredWorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  difficulty: string;
  duration: number;
  category: string;
  goals: string[];
  equipment: string[];
  daysPerWeek: number;
  estimatedTime: number;
  schedule: DayWorkout[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  currentWeek: number;
  startDate: Date;
}

function generateId(): string {
  return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

export const workoutStorageService = {
  async saveTemplate(template: any) {
    return await hybridStorageService.store('workout', template.id, template);
  },
  
  async getAllTemplates() {
    const templates = await hybridStorageService.getAll('workout');
    return templates.map(t => t.data);
  },
  
  async deleteTemplate(id: string) {
    return await hybridStorageService.delete('workout', id);
  },

  async saveWorkoutTemplate(template: StoredWorkoutTemplate) {
    return await hybridStorageService.store('workout', template.id, template);
  },

  async activateWorkoutTemplate(id: string) {
    // Get all templates and deactivate them
    const allTemplates = await this.getAllTemplates();
    for (const template of allTemplates) {
      if (template.id !== id) {
        template.isActive = false;
        await this.saveWorkoutTemplate(template);
      }
    }
    
    // Activate the selected template
    const template = allTemplates.find(t => t.id === id);
    if (template) {
      template.isActive = true;
      await this.saveWorkoutTemplate(template);
    }
    
    return true;
  },

  async generateWeeklySchedule(template: StoredWorkoutTemplate): Promise<DayWorkout[]> {
    if (!template.schedule || template.schedule.length === 0) {
      console.log('No schedule found in template');
      return [];
    }

    const weeklyWorkouts: DayWorkout[] = [];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday

    // Map template schedule to current week
    template.schedule.forEach((dayWorkout, index) => {
      const scheduledDate = new Date(startOfWeek);
      scheduledDate.setDate(startOfWeek.getDate() + index);
      
      const weeklyWorkout: DayWorkout = {
        ...dayWorkout,
        id: generateId(),
        scheduledDate: scheduledDate,
        completed: false
      };
      
      weeklyWorkouts.push(weeklyWorkout);
    });

    console.log('Generated weekly schedule:', weeklyWorkouts);
    return weeklyWorkouts;
  },

  async getCurrentWeekWorkouts(): Promise<DayWorkout[]> {
    try {
      // Get all templates
      const allTemplates = await this.getAllTemplates();
      console.log('All templates:', allTemplates);
      
      // Find the active template
      const activeTemplate = allTemplates.find(template => template.isActive);
      console.log('Active template:', activeTemplate);
      
      if (!activeTemplate) {
        console.log('No active template found');
        return [];
      }

      // Generate weekly schedule from active template
      const weeklyWorkouts = await this.generateWeeklySchedule(activeTemplate);
      console.log('Current week workouts:', weeklyWorkouts);
      
      return weeklyWorkouts;
    } catch (error) {
      console.error('Error getting current week workouts:', error);
      return [];
    }
  },

  async getWorkoutStats() {
    try {
      const weeklyWorkouts = await this.getCurrentWeekWorkouts();
      const completedWorkouts = weeklyWorkouts.filter(w => w.completed).length;
      const totalSets = weeklyWorkouts.reduce((sum, workout) => 
        sum + workout.exercises.reduce((exSum, ex) => exSum + ex.sets, 0), 0
      );
      
      return {
        thisWeekWorkouts: weeklyWorkouts.length,
        totalMinutes: weeklyWorkouts.length * 45, // Rough estimate
        currentStreak: completedWorkouts,
        completedWorkouts: completedWorkouts,
        totalSets: totalSets,
        totalReps: totalSets * 10, // Rough estimate
        totalVolume: totalSets * 10 * 100 // Rough estimate
      };
    } catch (error) {
      console.error('Error getting workout stats:', error);
      return {
        thisWeekWorkouts: 0,
        totalMinutes: 0,
        currentStreak: 0,
        completedWorkouts: 0,
        totalSets: 0,
        totalReps: 0,
        totalVolume: 0
      };
    }
  }
};