import { supabaseService } from './supabaseService';
import { workoutStorageService } from './workoutStorageService';

// Hybrid storage service that works with both localStorage and Supabase
export class HybridStorageService {
  private useSupabase: boolean = false;
  private currentUser: any = null;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    // Check if Supabase is available
    this.useSupabase = supabaseService.isAvailable();
    console.log('Hybrid storage: Supabase available:', this.useSupabase);
    
    if (this.useSupabase) {
      // Get current user
      const { user, error } = await supabaseService.getCurrentUser();
      if (!error && user) {
        this.currentUser = user;
        console.log('Hybrid storage: Using Supabase with user:', user.email);
      } else {
        console.log('Hybrid storage: Supabase available but no user logged in, will use Supabase for auth');
        // Don't set useSupabase to false - we want to use Supabase for authentication
      }
    } else {
      console.log('Hybrid storage: Supabase not available, using localStorage only');
    }
  }

  // Workout Templates
  async saveWorkoutTemplate(template: any): Promise<{ id: string; error: any }> {
    if (this.useSupabase && this.currentUser) {
      // Convert to Supabase format
      const supabaseTemplate = {
        user_id: this.currentUser.id,
        name: template.name,
        description: template.description,
        difficulty: template.difficulty,
        duration: template.duration,
        category: template.category,
        goals: template.goals,
        equipment: template.equipment,
        days_per_week: template.daysPerWeek,
        estimated_time: template.estimatedTime,
        rating: template.rating,
        downloads: template.downloads,
        is_custom: template.isCustom,
        is_ai: template.isAI,
        schedule: template.schedule,
        is_active: false,
        current_week: 1
      };

      const result = await supabaseService.saveWorkoutTemplate(supabaseTemplate);
      
      // Also save to localStorage as backup
      await workoutStorageService.saveWorkoutTemplate(template);
      
      return result;
    } else {
      // Use localStorage only
      return await workoutStorageService.saveWorkoutTemplate(template);
    }
  }

  async getAllWorkoutTemplates(): Promise<any[]> {
    if (this.useSupabase && this.currentUser) {
      const { templates, error } = await supabaseService.getWorkoutTemplates(this.currentUser.id);
      if (error) {
        console.warn('Failed to get templates from Supabase, falling back to localStorage:', error);
        return await workoutStorageService.getAllWorkoutTemplates();
      }
      return templates;
    } else {
      return await workoutStorageService.getAllWorkoutTemplates();
    }
  }

  async getActiveWorkoutTemplate(): Promise<any | null> {
    if (this.useSupabase && this.currentUser) {
      const { template, error } = await supabaseService.getActiveWorkoutTemplate(this.currentUser.id);
      if (error) {
        console.warn('Failed to get active template from Supabase, falling back to localStorage:', error);
        return await workoutStorageService.getActiveWorkoutTemplate();
      }
      return template;
    } else {
      return await workoutStorageService.getActiveWorkoutTemplate();
    }
  }

  async activateWorkoutTemplate(templateId: string): Promise<{ error: any }> {
    if (this.useSupabase && this.currentUser) {
      const result = await supabaseService.activateWorkoutTemplate(templateId, this.currentUser.id);
      
      // Also update localStorage
      await workoutStorageService.activateWorkoutTemplate(templateId);
      
      return result;
    } else {
      return await workoutStorageService.activateWorkoutTemplate(templateId);
    }
  }

  // Day Workouts
  async saveDayWorkout(dayWorkout: any): Promise<{ id: string; error: any }> {
    if (this.useSupabase && this.currentUser) {
      // Convert to Supabase format
      const supabaseDayWorkout = {
        user_id: this.currentUser.id,
        template_id: dayWorkout.templateId,
        template_name: dayWorkout.templateName,
        day: dayWorkout.day,
        name: dayWorkout.name,
        exercises: dayWorkout.exercises,
        scheduled_date: dayWorkout.scheduledDate,
        completed: dayWorkout.completed,
        duration: dayWorkout.duration,
        notes: dayWorkout.notes
      };

      const result = await supabaseService.saveDayWorkout(supabaseDayWorkout);
      
      // Also save to localStorage as backup
      await workoutStorageService.saveDayWorkout(dayWorkout);
      
      return result;
    } else {
      return await workoutStorageService.saveDayWorkout(dayWorkout);
    }
  }

  async getCurrentWeekWorkouts(): Promise<any[]> {
    if (this.useSupabase && this.currentUser) {
      const { workouts, error } = await supabaseService.getCurrentWeekWorkouts(this.currentUser.id);
      if (error) {
        console.warn('Failed to get week workouts from Supabase, falling back to localStorage:', error);
        return await workoutStorageService.getCurrentWeekWorkouts();
      }
      return workouts;
    } else {
      return await workoutStorageService.getCurrentWeekWorkouts();
    }
  }

  async getTodayWorkout(): Promise<any | null> {
    if (this.useSupabase && this.currentUser) {
      // Get current week workouts and find today's
      const { workouts, error } = await supabaseService.getCurrentWeekWorkouts(this.currentUser.id);
      if (error) {
        console.warn('Failed to get today workout from Supabase, falling back to localStorage:', error);
        return await workoutStorageService.getTodayWorkout();
      }
      
      const today = new Date().toISOString().split('T')[0];
      return workouts.find((w: any) => w.scheduled_date === today) || null;
    } else {
      return await workoutStorageService.getTodayWorkout();
    }
  }

  async completeWorkout(workoutId: string, actualSets: any[]): Promise<{ error: any }> {
    if (this.useSupabase && this.currentUser) {
      const result = await supabaseService.completeWorkout(workoutId, actualSets);
      
      // Also update localStorage
      await workoutStorageService.completeWorkout(workoutId, actualSets);
      
      return result;
    } else {
      return await workoutStorageService.completeWorkout(workoutId, actualSets);
    }
  }

  // Workout Stats
  async getWorkoutStats(): Promise<any> {
    if (this.useSupabase && this.currentUser) {
      const { stats, error } = await supabaseService.getWorkoutStats(this.currentUser.id);
      if (error) {
        console.warn('Failed to get stats from Supabase, falling back to localStorage:', error);
        return await workoutStorageService.getWorkoutStats();
      }
      return stats;
    } else {
      return await workoutStorageService.getWorkoutStats();
    }
  }

  // User Management
  async signUp(email: string, password: string): Promise<{ user: any; error: any }> {
    console.log('Hybrid storage: Attempting sign up with Supabase available:', this.useSupabase);
    
    if (this.useSupabase) {
      const result = await supabaseService.signUp(email, password);
      if (!result.error && result.user) {
        this.currentUser = result.user;
        this.useSupabase = true;
        console.log('Hybrid storage: Sign up successful, user:', result.user.email);
      } else {
        console.error('Hybrid storage: Sign up failed:', result.error);
      }
      return result;
    } else {
      console.error('Hybrid storage: Cannot sign up - Supabase not available');
      return { user: null, error: new Error('Supabase not available. Please check your configuration.') };
    }
  }

  async signIn(email: string, password: string): Promise<{ user: any; error: any }> {
    if (this.useSupabase) {
      const result = await supabaseService.signIn(email, password);
      if (!result.error && result.user) {
        this.currentUser = result.user;
        this.useSupabase = true;
      }
      return result;
    } else {
      return { user: null, error: new Error('Supabase not available') };
    }
  }

  async signOut(): Promise<{ error: any }> {
    if (this.useSupabase) {
      const result = await supabaseService.signOut();
      this.currentUser = null;
      this.useSupabase = false;
      return result;
    } else {
      return { error: null };
    }
  }

  async getCurrentUser(): Promise<{ user: any; error: any }> {
    if (this.useSupabase) {
      return await supabaseService.getCurrentUser();
    } else {
      return { user: null, error: new Error('Supabase not available') };
    }
  }

  // Migration helpers
  async migrateFromLocalStorage(): Promise<{ error: any }> {
    if (!this.useSupabase || !this.currentUser) {
      return { error: new Error('Supabase not available or user not logged in') };
    }

    try {
      // Get all data from localStorage
      const templates = await workoutStorageService.getAllWorkoutTemplates();
      const weekWorkouts = await workoutStorageService.getCurrentWeekWorkouts();

      // Migrate templates
      for (const template of templates) {
        await this.saveWorkoutTemplate(template);
      }

      // Migrate day workouts
      for (const workout of weekWorkouts) {
        await this.saveDayWorkout(workout);
      }

      console.log('Migration completed successfully');
      return { error: null };
    } catch (error) {
      console.error('Migration failed:', error);
      return { error };
    }
  }

  // Status methods
  isUsingSupabase(): boolean {
    return this.useSupabase;
  }

  getCurrentUserInfo(): any {
    return this.currentUser;
  }

  // Force refresh user status
  async refreshUserStatus(): Promise<void> {
    await this.initialize();
  }
}

// Export singleton instance
export const hybridStorageService = new HybridStorageService(); 