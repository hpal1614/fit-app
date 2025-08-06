import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Database types
export interface SupabaseUser {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  profile_data?: any;
}

export interface SupabaseWorkoutTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  category: 'strength' | 'cardio' | 'flexibility' | 'full-body' | 'sports';
  goals: string[];
  equipment: string[];
  days_per_week: number;
  estimated_time: number;
  rating: number;
  downloads: number;
  is_custom: boolean;
  is_ai: boolean;
  schedule: any;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  current_week: number;
  start_date?: string;
}

export interface SupabaseDayWorkout {
  id: string;
  user_id: string;
  template_id: string;
  template_name: string;
  day: string;
  name: string;
  exercises: any[];
  scheduled_date: string;
  completed: boolean;
  duration?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseWorkoutSession {
  id: string;
  user_id: string;
  template_id?: string;
  day_workout_id?: string;
  name: string;
  exercises: any[];
  start_time: string;
  end_time?: string;
  duration?: number;
  completed: boolean;
  notes?: string;
  created_at: string;
}

export interface SupabasePersonalRecord {
  id: string;
  user_id: string;
  exercise_id: string;
  exercise_name: string;
  weight: number;
  reps: number;
  one_rep_max: number;
  date: string;
  workout_id?: string;
  created_at: string;
}

export interface SupabaseNutritionLog {
  id: string;
  user_id: string;
  date: string;
  meals: any[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseAIConversation {
  id: string;
  user_id: string;
  messages: any[];
  context: any;
  created_at: string;
  updated_at: string;
}

class SupabaseService {
  private supabase: SupabaseClient;
  private isInitialized: boolean = false;

  constructor() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    console.log('Supabase URL:', supabaseUrl ? 'Found' : 'Missing');
    console.log('Supabase Key:', supabaseAnonKey ? 'Found' : 'Missing');

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase credentials not found. Running in local-only mode.');
      console.warn('Please check your .env file contains VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
      this.isInitialized = false;
      return;
    }

    try {
      this.supabase = createClient(supabaseUrl, supabaseAnonKey);
      this.isInitialized = true;
      console.log('✅ Supabase service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Supabase:', error);
      this.isInitialized = false;
    }
  }

  // Check if Supabase is available
  isAvailable(): boolean {
    return this.isInitialized;
  }

  // User Management
  async signUp(email: string, password: string): Promise<{ user: any; error: any }> {
    if (!this.isInitialized) {
      return { user: null, error: new Error('Supabase not initialized') };
    }

    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    return { user: data.user, error };
  }

  async signIn(email: string, password: string): Promise<{ user: any; error: any }> {
    if (!this.isInitialized) {
      return { user: null, error: new Error('Supabase not initialized') };
    }

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { user: data.user, error };
  }

  async signOut(): Promise<{ error: any }> {
    if (!this.isInitialized) {
      return { error: new Error('Supabase not initialized') };
    }

    const { error } = await this.supabase.auth.signOut();
    return { error };
  }

  async getCurrentUser(): Promise<{ user: any; error: any }> {
    if (!this.isInitialized) {
      return { user: null, error: new Error('Supabase not initialized') };
    }

    const { data: { user }, error } = await this.supabase.auth.getUser();
    return { user, error };
  }

  // Workout Templates
  async saveWorkoutTemplate(template: Omit<SupabaseWorkoutTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<{ id: string; error: any }> {
    if (!this.isInitialized) {
      return { id: '', error: new Error('Supabase not initialized') };
    }

    const { data, error } = await this.supabase
      .from('workout_templates')
      .insert([template])
      .select('id')
      .single();

    return { id: data?.id || '', error };
  }

  async getWorkoutTemplates(userId: string): Promise<{ templates: SupabaseWorkoutTemplate[]; error: any }> {
    if (!this.isInitialized) {
      return { templates: [], error: new Error('Supabase not initialized') };
    }

    const { data, error } = await this.supabase
      .from('workout_templates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return { templates: data || [], error };
  }

  async getActiveWorkoutTemplate(userId: string): Promise<{ template: SupabaseWorkoutTemplate | null; error: any }> {
    if (!this.isInitialized) {
      return { template: null, error: new Error('Supabase not initialized') };
    }

    const { data, error } = await this.supabase
      .from('workout_templates')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    return { template: data, error };
  }

  async activateWorkoutTemplate(templateId: string, userId: string): Promise<{ error: any }> {
    if (!this.isInitialized) {
      return { error: new Error('Supabase not initialized') };
    }

    // First, deactivate all other templates
    await this.supabase
      .from('workout_templates')
      .update({ is_active: false })
      .eq('user_id', userId);

    // Then activate the selected template
    const { error } = await this.supabase
      .from('workout_templates')
      .update({ 
        is_active: true, 
        current_week: 1,
        start_date: new Date().toISOString()
      })
      .eq('id', templateId);

    return { error };
  }

  // Day Workouts
  async saveDayWorkout(dayWorkout: Omit<SupabaseDayWorkout, 'id' | 'created_at' | 'updated_at'>): Promise<{ id: string; error: any }> {
    if (!this.isInitialized) {
      return { id: '', error: new Error('Supabase not initialized') };
    }

    const { data, error } = await this.supabase
      .from('day_workouts')
      .insert([dayWorkout])
      .select('id')
      .single();

    return { id: data?.id || '', error };
  }

  async getCurrentWeekWorkouts(userId: string): Promise<{ workouts: SupabaseDayWorkout[]; error: any }> {
    if (!this.isInitialized) {
      return { workouts: [], error: new Error('Supabase not initialized') };
    }

    const { data, error } = await this.supabase
      .from('day_workouts')
      .select('*')
      .eq('user_id', userId)
      .gte('scheduled_date', new Date().toISOString().split('T')[0])
      .lte('scheduled_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('scheduled_date', { ascending: true });

    return { workouts: data || [], error };
  }

  async completeWorkout(workoutId: string, actualSets: any[]): Promise<{ error: any }> {
    if (!this.isInitialized) {
      return { error: new Error('Supabase not initialized') };
    }

    const { error } = await this.supabase
      .from('day_workouts')
      .update({ 
        completed: true,
        exercises: actualSets,
        duration: this.calculateWorkoutDuration(actualSets),
        updated_at: new Date().toISOString()
      })
      .eq('id', workoutId);

    return { error };
  }

  // Workout Sessions
  async saveWorkoutSession(session: Omit<SupabaseWorkoutSession, 'id' | 'created_at'>): Promise<{ id: string; error: any }> {
    if (!this.isInitialized) {
      return { id: '', error: new Error('Supabase not initialized') };
    }

    const { data, error } = await this.supabase
      .from('workout_sessions')
      .insert([session])
      .select('id')
      .single();

    return { id: data?.id || '', error };
  }

  async getWorkoutHistory(userId: string, limit: number = 10): Promise<{ sessions: SupabaseWorkoutSession[]; error: any }> {
    if (!this.isInitialized) {
      return { sessions: [], error: new Error('Supabase not initialized') };
    }

    const { data, error } = await this.supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return { sessions: data || [], error };
  }

  // Personal Records
  async savePersonalRecord(record: Omit<SupabasePersonalRecord, 'id' | 'created_at'>): Promise<{ id: string; error: any }> {
    if (!this.isInitialized) {
      return { id: '', error: new Error('Supabase not initialized') };
    }

    const { data, error } = await this.supabase
      .from('personal_records')
      .insert([record])
      .select('id')
      .single();

    return { id: data?.id || '', error };
  }

  async getPersonalRecords(userId: string, exerciseId?: string): Promise<{ records: SupabasePersonalRecord[]; error: any }> {
    if (!this.isInitialized) {
      return { records: [], error: new Error('Supabase not initialized') };
    }

    let query = this.supabase
      .from('personal_records')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (exerciseId) {
      query = query.eq('exercise_id', exerciseId);
    }

    const { data, error } = await query;
    return { records: data || [], error };
  }

  // Nutrition Logs
  async saveNutritionLog(log: Omit<SupabaseNutritionLog, 'id' | 'created_at' | 'updated_at'>): Promise<{ id: string; error: any }> {
    if (!this.isInitialized) {
      return { id: '', error: new Error('Supabase not initialized') };
    }

    const { data, error } = await this.supabase
      .from('nutrition_logs')
      .insert([log])
      .select('id')
      .single();

    return { id: data?.id || '', error };
  }

  async getNutritionLogs(userId: string, date?: string): Promise<{ logs: SupabaseNutritionLog[]; error: any }> {
    if (!this.isInitialized) {
      return { logs: [], error: new Error('Supabase not initialized') };
    }

    let query = this.supabase
      .from('nutrition_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (date) {
      query = query.eq('date', date);
    }

    const { data, error } = await query;
    return { logs: data || [], error };
  }

  // AI Conversations
  async saveAIConversation(conversation: Omit<SupabaseAIConversation, 'id' | 'created_at' | 'updated_at'>): Promise<{ id: string; error: any }> {
    if (!this.isInitialized) {
      return { id: '', error: new Error('Supabase not initialized') };
    }

    const { data, error } = await this.supabase
      .from('ai_conversations')
      .insert([conversation])
      .select('id')
      .single();

    return { id: data?.id || '', error };
  }

  async getAIConversations(userId: string, limit: number = 10): Promise<{ conversations: SupabaseAIConversation[]; error: any }> {
    if (!this.isInitialized) {
      return { conversations: [], error: new Error('Supabase not initialized') };
    }

    const { data, error } = await this.supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return { conversations: data || [], error };
  }

  // Analytics
  async getWorkoutStats(userId: string, days: number = 30): Promise<{ stats: any; error: any }> {
    if (!this.isInitialized) {
      return { stats: null, error: new Error('Supabase not initialized') };
    }

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await this.supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate)
      .eq('completed', true);

    if (error) {
      return { stats: null, error };
    }

    const stats = {
      totalWorkouts: data?.length || 0,
      totalDuration: data?.reduce((sum, session) => sum + (session.duration || 0), 0) || 0,
      totalSets: data?.reduce((sum, session) => sum + session.exercises.reduce((s, e) => s + (e.sets || 0), 0), 0) || 0,
      totalReps: data?.reduce((sum, session) => sum + session.exercises.reduce((s, e) => s + (e.reps || 0), 0), 0) || 0,
      totalWeight: data?.reduce((sum, session) => sum + session.exercises.reduce((s, e) => s + (e.weight || 0), 0), 0) || 0,
      averageWorkoutDuration: data?.length ? data.reduce((sum, session) => sum + (session.duration || 0), 0) / data.length : 0,
    };

    return { stats, error: null };
  }

  // Helper methods
  private calculateWorkoutDuration(exercises: any[]): number {
    // Simple calculation: 2 minutes per exercise + rest time
    return exercises.reduce((total, exercise) => {
      const exerciseTime = 2; // 2 minutes per exercise
      const restTime = (exercise.sets - 1) * (exercise.restTime || 60) / 60; // Convert rest time to minutes
      return total + exerciseTime + restTime;
    }, 0);
  }

  // Migration helpers
  async migrateFromLocalStorage(userId: string): Promise<{ error: any }> {
    if (!this.isInitialized) {
      return { error: new Error('Supabase not initialized') };
    }

    try {
      // This will be implemented when we're ready to migrate
      console.log('Migration from localStorage not yet implemented');
      return { error: null };
    } catch (error) {
      return { error };
    }
  }
}

// Export singleton instance
export const supabaseService = new SupabaseService(); 