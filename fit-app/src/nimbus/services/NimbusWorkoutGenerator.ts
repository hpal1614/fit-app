import { nimbusAI } from './NimbusAIService';
import type { WorkoutPlan, Exercise } from '../../types/workout';

export interface ExerciseAlternative {
  id: string;
  name: string;
  reason: string;
  equipment: string[];
  difficulty: 'easier' | 'same' | 'harder';
  muscleGroups: string[];
}

export interface WorkoutGenerationConfig {
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  goals: string[];
  daysPerWeek: number;
  sessionDuration: number; // minutes
  equipment: string[];
  limitations: string[];
  preferences?: {
    includeCardio?: boolean;
    includeStretching?: boolean;
    focusMuscleGroups?: string[];
    avoidExercises?: string[];
  };
}

export interface GeneratedWorkout {
  plan: WorkoutPlan;
  alternatives: Map<string, ExerciseAlternative[]>;
  progressionStrategy: ProgressionStrategy;
  estimatedCalories: number;
  difficulty: number; // 1-10
}

export interface ProgressionStrategy {
  type: 'linear' | 'undulating' | 'block';
  weeklyIncrement: {
    weight: number; // percentage
    reps: number; // additional reps
    sets: number; // additional sets
  };
  deloadWeek: number; // every N weeks
  intensityPhases: IntensityPhase[];
}

interface IntensityPhase {
  week: number;
  name: string;
  focus: 'strength' | 'hypertrophy' | 'endurance' | 'power';
  repRange: [number, number];
  restPeriod: number; // seconds
  intensity: number; // percentage of 1RM
}

export class NimbusWorkoutGenerator {
  private exerciseDatabase: Map<string, ExerciseInfo>;
  private alternativesCache: Map<string, ExerciseAlternative[]>;
  
  constructor() {
    this.exerciseDatabase = this.initializeExerciseDatabase();
    this.alternativesCache = new Map();
  }
  
  /**
   * Generate a complete workout plan with AI assistance
   */
  async generateWorkoutPlan(config: WorkoutGenerationConfig): Promise<GeneratedWorkout> {
    console.log('🏋️ Generating personalized workout plan...');
    
    // Step 1: Generate base plan structure with AI
    const basePlan = await this.generateBasePlanWithAI(config);
    
    // Step 2: Generate alternatives for each exercise
    const alternatives = await this.generateAlternatives(basePlan, config);
    
    // Step 3: Create progression strategy
    const progressionStrategy = this.createProgressionStrategy(config);
    
    // Step 4: Calculate estimated calories and difficulty
    const estimatedCalories = this.calculateEstimatedCalories(basePlan, config);
    const difficulty = this.calculateDifficulty(basePlan, config);
    
    return {
      plan: basePlan,
      alternatives,
      progressionStrategy,
      estimatedCalories,
      difficulty
    };
  }
  
  /**
   * Generate base workout plan using AI
   */
  private async generateBasePlanWithAI(config: WorkoutGenerationConfig): Promise<WorkoutPlan> {
    const prompt = this.buildWorkoutPrompt(config);
    
    try {
      let aiResponse = '';
      const stream = nimbusAI.streamMessage(prompt, {
        generatingWorkout: true,
        config
      });
      
      for await (const chunk of stream) {
        aiResponse += chunk;
      }
      
      // Parse AI response into structured workout plan
      return this.parseAIWorkoutResponse(aiResponse, config);
      
    } catch (error) {
      console.error('AI generation failed, using fallback:', error);
      return this.generateFallbackPlan(config);
    }
  }
  
  /**
   * Build prompt for AI workout generation
   */
  private buildWorkoutPrompt(config: WorkoutGenerationConfig): string {
    return `Create a ${config.daysPerWeek}-day workout plan for a ${config.experienceLevel} level person.
    
Goals: ${config.goals.join(', ')}
Session Duration: ${config.sessionDuration} minutes
Available Equipment: ${config.equipment.join(', ') || 'Bodyweight only'}
Limitations: ${config.limitations.join(', ') || 'None'}
${config.preferences?.focusMuscleGroups ? `Focus on: ${config.preferences.focusMuscleGroups.join(', ')}` : ''}
${config.preferences?.avoidExercises ? `Avoid: ${config.preferences.avoidExercises.join(', ')}` : ''}

Please structure the workout with:
1. Warm-up (5-10 min)
2. Main workout with exercises, sets, reps, and rest periods
3. Cool-down (5 min)

For each exercise, specify:
- Exercise name
- Sets x Reps
- Rest period
- Target muscle groups
- Form cues

Format the response as a structured workout plan.`;
  }
  
  /**
   * Parse AI response into structured workout plan
   */
  private parseAIWorkoutResponse(response: string, config: WorkoutGenerationConfig): WorkoutPlan {
    // This is a simplified parser - in production, you'd use more sophisticated NLP
    const plan: WorkoutPlan = {
      id: `nimbus-${Date.now()}`,
      name: `AI-Generated ${config.goals[0]} Plan`,
      description: `Personalized ${config.daysPerWeek}-day plan for ${config.experienceLevel} level`,
      createdAt: new Date(),
      createdBy: 'nimbus-ai',
      duration: config.daysPerWeek * 4, // 4 weeks default
      difficulty: config.experienceLevel,
      tags: config.goals,
      schedule: []
    };
    
    // Parse workout days from response
    // For now, using a template approach
    for (let day = 0; day < config.daysPerWeek; day++) {
      plan.schedule.push({
        day: day + 1,
        name: this.getDayName(day, config),
        exercises: this.generateDayExercises(day, config),
        restDay: false,
        notes: ''
      });
    }
    
    return plan;
  }
  
  /**
   * Generate alternatives for each exercise
   */
  private async generateAlternatives(
    plan: WorkoutPlan, 
    config: WorkoutGenerationConfig
  ): Promise<Map<string, ExerciseAlternative[]>> {
    const alternatives = new Map<string, ExerciseAlternative[]>();
    
    for (const day of plan.schedule) {
      if (day.restDay) continue;
      
      for (const exercise of day.exercises) {
        const alts = await this.findAlternatives(exercise.name, config);
        alternatives.set(exercise.id, alts);
      }
    }
    
    return alternatives;
  }
  
  /**
   * Find alternative exercises
   */
  private async findAlternatives(
    exerciseName: string, 
    config: WorkoutGenerationConfig
  ): Promise<ExerciseAlternative[]> {
    // Check cache first
    const cacheKey = `${exerciseName}-${config.equipment.join('-')}`;
    if (this.alternativesCache.has(cacheKey)) {
      return this.alternativesCache.get(cacheKey)!;
    }
    
    const exerciseInfo = this.exerciseDatabase.get(exerciseName.toLowerCase());
    if (!exerciseInfo) return [];
    
    const alternatives: ExerciseAlternative[] = [];
    
    // Find exercises targeting same muscle groups
    for (const [name, info] of this.exerciseDatabase) {
      if (name === exerciseName.toLowerCase()) continue;
      
      // Check muscle group overlap
      const muscleOverlap = info.primaryMuscles.some(muscle => 
        exerciseInfo.primaryMuscles.includes(muscle)
      );
      
      if (!muscleOverlap) continue;
      
      // Check equipment compatibility
      const hasRequiredEquipment = info.equipment.every(eq => 
        config.equipment.includes(eq) || eq === 'bodyweight'
      );
      
      if (!hasRequiredEquipment) continue;
      
      // Determine difficulty comparison
      let difficulty: 'easier' | 'same' | 'harder' = 'same';
      if (info.difficulty < exerciseInfo.difficulty) difficulty = 'easier';
      if (info.difficulty > exerciseInfo.difficulty) difficulty = 'harder';
      
      alternatives.push({
        id: `alt-${name}`,
        name: info.displayName,
        reason: this.getAlternativeReason(exerciseInfo, info),
        equipment: info.equipment,
        difficulty,
        muscleGroups: info.primaryMuscles
      });
    }
    
    // Sort by difficulty match
    alternatives.sort((a, b) => {
      const order = { 'same': 0, 'easier': 1, 'harder': 2 };
      return order[a.difficulty] - order[b.difficulty];
    });
    
    // Cache and return top 5
    const topAlternatives = alternatives.slice(0, 5);
    this.alternativesCache.set(cacheKey, topAlternatives);
    
    return topAlternatives;
  }
  
  /**
   * Get reason for alternative exercise
   */
  private getAlternativeReason(original: ExerciseInfo, alternative: ExerciseInfo): string {
    if (alternative.equipment.includes('bodyweight') && !original.equipment.includes('bodyweight')) {
      return 'No equipment needed';
    }
    
    if (alternative.difficulty < original.difficulty) {
      return 'Easier variation for beginners';
    }
    
    if (alternative.difficulty > original.difficulty) {
      return 'More challenging variation';
    }
    
    if (alternative.equipment.length < original.equipment.length) {
      return 'Requires less equipment';
    }
    
    return 'Similar movement pattern';
  }
  
  /**
   * Create progression strategy
   */
  private createProgressionStrategy(config: WorkoutGenerationConfig): ProgressionStrategy {
    // Default progression based on experience level
    const progressionRates = {
      beginner: { weight: 2.5, reps: 1, sets: 0.25 },
      intermediate: { weight: 2, reps: 0.5, sets: 0 },
      advanced: { weight: 1.5, reps: 0.25, sets: 0 }
    };
    
    const rate = progressionRates[config.experienceLevel];
    
    // Create intensity phases
    const phases: IntensityPhase[] = [
      {
        week: 1,
        name: 'Adaptation',
        focus: 'endurance',
        repRange: [12, 15],
        restPeriod: 60,
        intensity: 65
      },
      {
        week: 2,
        name: 'Hypertrophy',
        focus: 'hypertrophy',
        repRange: [8, 12],
        restPeriod: 90,
        intensity: 75
      },
      {
        week: 3,
        name: 'Strength',
        focus: 'strength',
        repRange: [4, 6],
        restPeriod: 180,
        intensity: 85
      },
      {
        week: 4,
        name: 'Deload',
        focus: 'endurance',
        repRange: [12, 15],
        restPeriod: 60,
        intensity: 60
      }
    ];
    
    return {
      type: config.experienceLevel === 'advanced' ? 'undulating' : 'linear',
      weeklyIncrement: rate,
      deloadWeek: 4,
      intensityPhases: phases
    };
  }
  
  /**
   * Calculate estimated calories
   */
  private calculateEstimatedCalories(plan: WorkoutPlan, config: WorkoutGenerationConfig): number {
    const baseCaloriesPerMinute = {
      beginner: 6,
      intermediate: 8,
      advanced: 10
    };
    
    const base = baseCaloriesPerMinute[config.experienceLevel];
    return Math.round(base * config.sessionDuration * 0.8); // 0.8 factor for rest periods
  }
  
  /**
   * Calculate workout difficulty
   */
  private calculateDifficulty(plan: WorkoutPlan, config: WorkoutGenerationConfig): number {
    const baseDifficulty = {
      beginner: 3,
      intermediate: 6,
      advanced: 8
    };
    
    let difficulty = baseDifficulty[config.experienceLevel];
    
    // Adjust based on volume
    const totalSets = plan.schedule.reduce((total, day) => 
      total + (day.exercises?.reduce((dayTotal, ex) => dayTotal + ex.sets, 0) || 0), 0
    );
    
    if (totalSets > 100) difficulty += 1;
    if (config.sessionDuration > 60) difficulty += 1;
    
    return Math.min(10, difficulty);
  }
  
  /**
   * Generate day name based on split
   */
  private getDayName(dayIndex: number, config: WorkoutGenerationConfig): string {
    if (config.daysPerWeek === 3) {
      return ['Full Body A', 'Full Body B', 'Full Body C'][dayIndex];
    }
    
    if (config.daysPerWeek === 4) {
      return ['Upper Power', 'Lower Power', 'Upper Hypertrophy', 'Lower Hypertrophy'][dayIndex];
    }
    
    if (config.daysPerWeek === 5) {
      return ['Chest & Triceps', 'Back & Biceps', 'Legs', 'Shoulders', 'Full Body'][dayIndex];
    }
    
    return `Day ${dayIndex + 1}`;
  }
  
  /**
   * Generate exercises for a specific day
   */
  private generateDayExercises(dayIndex: number, config: WorkoutGenerationConfig): Exercise[] {
    // This is a simplified version - in production, this would be more sophisticated
    const exercises: Exercise[] = [];
    
    // Add compound movements first
    if (dayIndex % 2 === 0) {
      exercises.push(this.createExercise('Barbell Squat', 4, '8-10', 120));
      exercises.push(this.createExercise('Romanian Deadlift', 3, '10-12', 90));
    } else {
      exercises.push(this.createExercise('Bench Press', 4, '8-10', 120));
      exercises.push(this.createExercise('Bent Over Row', 3, '10-12', 90));
    }
    
    // Add accessory movements
    exercises.push(this.createExercise('Dumbbell Lunges', 3, '12-15', 60));
    exercises.push(this.createExercise('Lat Pulldown', 3, '12-15', 60));
    
    return exercises;
  }
  
  /**
   * Create exercise object
   */
  private createExercise(name: string, sets: number, reps: string, rest: number): Exercise {
    return {
      id: `ex-${Date.now()}-${Math.random()}`,
      name,
      sets,
      reps,
      weight: undefined,
      rest,
      notes: '',
      completed: false
    };
  }
  
  /**
   * Generate fallback plan if AI fails
   */
  private generateFallbackPlan(config: WorkoutGenerationConfig): WorkoutPlan {
    console.log('Using fallback workout generation');
    
    const plan: WorkoutPlan = {
      id: `fallback-${Date.now()}`,
      name: 'Balanced Fitness Plan',
      description: 'A well-rounded workout plan',
      createdAt: new Date(),
      createdBy: 'nimbus-fallback',
      duration: 4,
      difficulty: config.experienceLevel,
      tags: config.goals,
      schedule: []
    };
    
    // Generate simple but effective plan
    for (let i = 0; i < config.daysPerWeek; i++) {
      plan.schedule.push({
        day: i + 1,
        name: this.getDayName(i, config),
        exercises: this.generateDayExercises(i, config),
        restDay: false,
        notes: 'Focus on form and progressive overload'
      });
    }
    
    return plan;
  }
  
  /**
   * Initialize exercise database
   */
  private initializeExerciseDatabase(): Map<string, ExerciseInfo> {
    const database = new Map<string, ExerciseInfo>();
    
    // Add exercises to database
    const exercises: ExerciseInfo[] = [
      {
        name: 'barbell squat',
        displayName: 'Barbell Squat',
        primaryMuscles: ['quadriceps', 'glutes'],
        secondaryMuscles: ['hamstrings', 'core'],
        equipment: ['barbell', 'squat rack'],
        difficulty: 7,
        compound: true
      },
      {
        name: 'goblet squat',
        displayName: 'Goblet Squat',
        primaryMuscles: ['quadriceps', 'glutes'],
        secondaryMuscles: ['core'],
        equipment: ['dumbbell'],
        difficulty: 4,
        compound: true
      },
      {
        name: 'bodyweight squat',
        displayName: 'Bodyweight Squat',
        primaryMuscles: ['quadriceps', 'glutes'],
        secondaryMuscles: ['hamstrings'],
        equipment: ['bodyweight'],
        difficulty: 2,
        compound: true
      },
      {
        name: 'bench press',
        displayName: 'Bench Press',
        primaryMuscles: ['chest'],
        secondaryMuscles: ['triceps', 'shoulders'],
        equipment: ['barbell', 'bench'],
        difficulty: 6,
        compound: true
      },
      {
        name: 'push up',
        displayName: 'Push Up',
        primaryMuscles: ['chest'],
        secondaryMuscles: ['triceps', 'shoulders'],
        equipment: ['bodyweight'],
        difficulty: 3,
        compound: true
      },
      // Add more exercises as needed
    ];
    
    exercises.forEach(ex => database.set(ex.name, ex));
    
    return database;
  }
}

interface ExerciseInfo {
  name: string;
  displayName: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  difficulty: number; // 1-10
  compound: boolean;
}

// Export singleton instance
export const nimbusWorkoutGenerator = new NimbusWorkoutGenerator();