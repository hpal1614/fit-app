import type { WorkoutContext, Exercise, PersonalRecord } from '../types/workout';
import type { NLPResult } from './nlpService';
import { DatabaseService } from './databaseService';

export interface UserLearningProfile {
  userId: string;
  profile: {
    experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    fitnessGoals: string[];
    physicalAttributes: {
      age?: number;
      weight?: number;
      height?: number;
      bodyFatPercentage?: number;
    };
  };
  patterns: LearningPatterns;
  preferences: LearnedPreferences;
  performance: PerformanceMetrics;
  insights: UserInsights;
  lastUpdated: Date;
}

export interface LearningPatterns {
  workoutPatterns: {
    preferredDays: string[];
    preferredTimes: string[];
    averageWorkoutDuration: number;
    workoutFrequency: number; // per week
    restDayPattern: string[];
  };
  exercisePatterns: {
    favoriteExercises: Array<{exercise: string, frequency: number}>;
    exerciseProgressions: Record<string, ProgressionData>;
    formIssues: Record<string, string[]>;
    exercisePairings: Array<{first: string, second: string, frequency: number}>;
  };
  communicationPatterns: {
    preferredPhrases: string[];
    commonQuestions: Array<{question: string, category: string, frequency: number}>;
    feedbackStyle: 'detailed' | 'concise' | 'motivational';
    responseTime: number; // average seconds between interactions
  };
  nutritionPatterns: {
    mealTiming: string[];
    supplementUsage: string[];
    hydrationHabits: string;
  };
}

export interface LearnedPreferences {
  units: {
    weight: 'lbs' | 'kg';
    distance: 'miles' | 'km';
    temperature: 'fahrenheit' | 'celsius';
  };
  motivation: {
    style: 'gentle' | 'tough-love' | 'analytical' | 'enthusiastic';
    frequency: 'constant' | 'periodic' | 'minimal';
    triggers: string[]; // what motivates them
  };
  coaching: {
    detailLevel: 'high' | 'medium' | 'low';
    technicalLanguage: boolean;
    preferredCues: string[];
    learningStyle: 'visual' | 'auditory' | 'kinesthetic';
  };
  goals: {
    primary: string;
    secondary: string[];
    timeline: 'short-term' | 'long-term';
    priorities: string[];
  };
}

export interface PerformanceMetrics {
  strength: {
    maxLifts: Record<string, number>;
    strengthProgressionRate: number; // percentage per month
    plateaus: Array<{exercise: string, duration: number, resolved: boolean}>;
  };
  endurance: {
    workoutCapacity: number; // total volume capability
    recoveryTime: number; // average between sets
    stamina: number; // 0-100 score
  };
  consistency: {
    adherenceRate: number; // percentage
    streaks: Array<{startDate: Date, endDate: Date, days: number}>;
    missedWorkouts: Array<{date: Date, reason?: string}>;
  };
  improvement: {
    overallProgress: number; // percentage
    exerciseImprovements: Record<string, number>; // percentage by exercise
    formImprovements: Record<string, number>; // score improvements
  };
}

export interface UserInsights {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  recommendations: Recommendation[];
  personalityTraits: string[];
  riskFactors: string[]; // injury risk, overtraining, etc.
}

export interface Recommendation {
  type: 'exercise' | 'nutrition' | 'recovery' | 'technique' | 'programming';
  priority: 'high' | 'medium' | 'low';
  description: string;
  rationale: string;
  actionItems: string[];
  expectedOutcome: string;
}

export interface ProgressionData {
  exercise: string;
  history: Array<{
    date: Date;
    weight: number;
    reps: number;
    sets: number;
    rpe?: number; // rate of perceived exertion
  }>;
  trend: 'improving' | 'maintaining' | 'declining';
  projectedMax: number;
  recommendedNext: {
    weight: number;
    reps: number;
    sets: number;
  };
}

export class UserLearningService {
  private profile: UserLearningProfile;
  private db: DatabaseService;
  private learningQueue: Array<{type: string, data: any, timestamp: Date}> = [];
  private readonly LEARNING_INTERVAL = 5 * 60 * 1000; // 5 minutes
  
  constructor() {
    this.db = DatabaseService.getInstance();
    this.profile = this.loadProfile() || this.initializeProfile();
    this.startLearningLoop();
  }

  /**
   * Learn from user interaction
   */
  async learnFromInteraction(
    nlpResult: NLPResult,
    context: WorkoutContext,
    outcome: 'success' | 'failure' | 'partial'
  ): Promise<void> {
    // Queue learning data
    this.learningQueue.push({
      type: 'interaction',
      data: { nlpResult, context, outcome },
      timestamp: new Date()
    });
    
    // Immediate learning for critical patterns
    if (outcome === 'success' && nlpResult.intent === 'log_exercise') {
      this.updateExercisePatterns(nlpResult, context);
    }
    
    // Update communication patterns
    this.updateCommunicationPatterns(nlpResult);
  }

  /**
   * Learn from workout completion
   */
  async learnFromWorkout(workout: WorkoutContext): Promise<void> {
    if (!workout.activeWorkout) return;
    
    // Update workout patterns
    this.updateWorkoutPatterns(workout);
    
    // Analyze performance
    this.analyzeWorkoutPerformance(workout);
    
    // Generate insights
    this.generateWorkoutInsights(workout);
    
    // Save profile
    this.saveProfile();
  }

  /**
   * Get personalized recommendations
   */
  getRecommendations(context: WorkoutContext): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    // Exercise recommendations based on patterns
    recommendations.push(...this.getExerciseRecommendations(context));
    
    // Nutrition recommendations based on goals
    recommendations.push(...this.getNutritionRecommendations());
    
    // Recovery recommendations based on performance
    recommendations.push(...this.getRecoveryRecommendations());
    
    // Sort by priority
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Predict user needs
   */
  predictUserNeeds(context: WorkoutContext): {
    likelyIntent: string;
    suggestedActions: string[];
    anticipatedQuestions: string[];
  } {
    const predictions = {
      likelyIntent: 'unknown',
      suggestedActions: [] as string[],
      anticipatedQuestions: [] as string[]
    };
    
    // Based on workout phase
    if (!context.activeWorkout) {
      predictions.likelyIntent = 'start_workout';
      predictions.suggestedActions = ['Start your workout', 'Review workout plan'];
    } else if (context.isResting) {
      predictions.likelyIntent = 'next_exercise';
      predictions.suggestedActions = ['Move to next exercise', 'Extend rest time'];
    }
    
    // Based on patterns
    const currentExercise = context.currentExercise?.exercise.name;
    if (currentExercise) {
      const formIssues = this.profile.patterns.exercisePatterns.formIssues[currentExercise];
      if (formIssues && formIssues.length > 0) {
        predictions.anticipatedQuestions.push(`Need help with ${currentExercise} form?`);
      }
    }
    
    // Based on time patterns
    const currentHour = new Date().getHours();
    const preferredTimes = this.profile.patterns.workoutPatterns.preferredTimes;
    if (preferredTimes.some(time => Math.abs(parseInt(time) - currentHour) < 2)) {
      predictions.suggestedActions.push('Ready for your usual workout?');
    }
    
    return predictions;
  }

  /**
   * Adapt AI responses based on user profile
   */
  adaptResponse(baseResponse: string): string {
    let adapted = baseResponse;
    
    // Adapt based on motivation style
    switch (this.profile.preferences.motivation.style) {
      case 'tough-love':
        adapted = this.makeTougher(adapted);
        break;
      case 'gentle':
        adapted = this.makeGentler(adapted);
        break;
      case 'analytical':
        adapted = this.makeMoreAnalytical(adapted);
        break;
      case 'enthusiastic':
        adapted = this.makeMoreEnthusiastic(adapted);
        break;
    }
    
    // Adapt based on detail level
    if (this.profile.preferences.coaching.detailLevel === 'low') {
      adapted = this.simplify(adapted);
    } else if (this.profile.preferences.coaching.detailLevel === 'high') {
      adapted = this.addDetail(adapted);
    }
    
    // Add personalized cues
    const cues = this.profile.preferences.coaching.preferredCues;
    if (cues.length > 0) {
      adapted += ` Remember: ${cues[0]}.`;
    }
    
    return adapted;
  }

  /**
   * Update exercise patterns from NLP results
   */
  private updateExercisePatterns(nlpResult: NLPResult, context: WorkoutContext): void {
    const exerciseEntity = nlpResult.entities.find(e => e.type === 'exercise');
    if (!exerciseEntity) return;
    
    const exercise = exerciseEntity.value as string;
    
    // Update favorite exercises
    const favorites = this.profile.patterns.exercisePatterns.favoriteExercises;
    const existing = favorites.find(f => f.exercise === exercise);
    if (existing) {
      existing.frequency++;
    } else {
      favorites.push({ exercise, frequency: 1 });
    }
    
    // Sort by frequency
    favorites.sort((a, b) => b.frequency - a.frequency);
    
    // Track exercise pairings
    if (context.currentExercise && context.currentExercise.exercise.name !== exercise) {
      this.trackExercisePairing(context.currentExercise.exercise.name, exercise);
    }
  }

  /**
   * Update communication patterns
   */
  private updateCommunicationPatterns(nlpResult: NLPResult): void {
    const patterns = this.profile.patterns.communicationPatterns;
    
    // Track common phrases
    if (nlpResult.confidence > 0.8) {
      const phrase = nlpResult.originalText.toLowerCase();
      if (!patterns.preferredPhrases.includes(phrase)) {
        patterns.preferredPhrases.push(phrase);
        if (patterns.preferredPhrases.length > 20) {
          patterns.preferredPhrases.shift();
        }
      }
    }
    
    // Track questions
    if (nlpResult.originalText.includes('?')) {
      const existing = patterns.commonQuestions.find(
        q => q.question === nlpResult.originalText
      );
      if (existing) {
        existing.frequency++;
      } else {
        patterns.commonQuestions.push({
          question: nlpResult.originalText,
          category: nlpResult.intent,
          frequency: 1
        });
      }
    }
  }

  /**
   * Update workout patterns
   */
  private updateWorkoutPatterns(workout: WorkoutContext): void {
    if (!workout.activeWorkout) return;
    
    const patterns = this.profile.patterns.workoutPatterns;
    const now = new Date();
    
    // Update preferred days
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
    if (!patterns.preferredDays.includes(dayName)) {
      patterns.preferredDays.push(dayName);
    }
    
    // Update preferred times
    const hour = now.getHours().toString();
    if (!patterns.preferredTimes.includes(hour)) {
      patterns.preferredTimes.push(hour);
    }
    
    // Update average duration
    if (workout.workoutDuration) {
      patterns.averageWorkoutDuration = 
        (patterns.averageWorkoutDuration + workout.workoutDuration) / 2;
    }
  }

  /**
   * Analyze workout performance
   */
  private analyzeWorkoutPerformance(workout: WorkoutContext): void {
    if (!workout.activeWorkout) return;
    
    const performance = this.profile.performance;
    
    // Calculate total volume
    let totalVolume = 0;
    workout.activeWorkout.exercises.forEach(exercise => {
      exercise.completedSets.forEach(set => {
        totalVolume += set.weight * set.reps;
      });
    });
    
    // Update workout capacity
    performance.endurance.workoutCapacity = 
      Math.max(performance.endurance.workoutCapacity, totalVolume);
    
    // Check for PRs and update strength metrics
    workout.activeWorkout.personalRecords?.forEach(pr => {
      const current = performance.strength.maxLifts[pr.exerciseId] || 0;
      performance.strength.maxLifts[pr.exerciseId] = Math.max(current, pr.value);
    });
  }

  /**
   * Generate workout insights
   */
  private generateWorkoutInsights(workout: WorkoutContext): void {
    const insights = this.profile.insights;
    
    // Clear old insights
    insights.recommendations = insights.recommendations.filter(
      r => r.type !== 'exercise'
    );
    
    // Add new insights based on workout
    if (workout.workoutDuration && workout.workoutDuration > 90 * 60) {
      insights.recommendations.push({
        type: 'recovery',
        priority: 'high',
        description: 'Consider shorter, more intense workouts',
        rationale: 'Your workouts are consistently over 90 minutes',
        actionItems: ['Try supersets', 'Reduce rest times', 'Focus on compound movements'],
        expectedOutcome: 'Better recovery and consistent progress'
      });
    }
  }

  /**
   * Get exercise recommendations
   */
  private getExerciseRecommendations(context: WorkoutContext): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const patterns = this.profile.patterns.exercisePatterns;
    
    // Recommend based on exercise pairings
    if (context.currentExercise) {
      const current = context.currentExercise.exercise.name;
      const pairings = patterns.exercisePairings
        .filter(p => p.first === current)
        .sort((a, b) => b.frequency - a.frequency);
      
      if (pairings.length > 0) {
        recommendations.push({
          type: 'exercise',
          priority: 'medium',
          description: `Consider ${pairings[0].second} next`,
          rationale: `You often pair this with ${current}`,
          actionItems: [`Prepare for ${pairings[0].second}`],
          expectedOutcome: 'Efficient workout flow'
        });
      }
    }
    
    return recommendations;
  }

  /**
   * Get nutrition recommendations
   */
  private getNutritionRecommendations(): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const goals = this.profile.preferences.goals;
    
    if (goals.primary === 'muscle-gain') {
      recommendations.push({
        type: 'nutrition',
        priority: 'high',
        description: 'Increase protein intake post-workout',
        rationale: 'Optimal for muscle growth and recovery',
        actionItems: ['Consume 30-40g protein within 2 hours', 'Consider whey or plant protein'],
        expectedOutcome: 'Enhanced muscle recovery and growth'
      });
    }
    
    return recommendations;
  }

  /**
   * Get recovery recommendations
   */
  private getRecoveryRecommendations(): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const performance = this.profile.performance;
    
    if (performance.consistency.adherenceRate > 90) {
      recommendations.push({
        type: 'recovery',
        priority: 'medium',
        description: 'Schedule a deload week',
        rationale: 'High training consistency may lead to accumulated fatigue',
        actionItems: ['Reduce volume by 40%', 'Focus on technique', 'Extra sleep'],
        expectedOutcome: 'Supercompensation and continued progress'
      });
    }
    
    return recommendations;
  }

  /**
   * Track exercise pairings
   */
  private trackExercisePairing(first: string, second: string): void {
    const pairings = this.profile.patterns.exercisePatterns.exercisePairings;
    const existing = pairings.find(p => p.first === first && p.second === second);
    
    if (existing) {
      existing.frequency++;
    } else {
      pairings.push({ first, second, frequency: 1 });
    }
  }

  /**
   * Response adaptation methods
   */
  private makeTougher(response: string): string {
    return response
      .replace(/great job/gi, 'decent work')
      .replace(/amazing/gi, 'solid')
      .replace(/!/g, '.')
      + ' Now push harder.';
  }

  private makeGentler(response: string): string {
    return 'You\'re doing wonderfully! ' + response
      .replace(/need to/gi, 'could try to')
      .replace(/must/gi, 'might want to');
  }

  private makeMoreAnalytical(response: string): string {
    return response + ' (Based on your performance data and progression trends)';
  }

  private makeMoreEnthusiastic(response: string): string {
    return response
      .replace(/\./g, '!')
      .toUpperCase()
      .replace(/GOOD/g, 'AMAZING')
      .replace(/NICE/g, 'FANTASTIC');
  }

  private simplify(response: string): string {
    // Remove technical jargon and simplify
    return response.split('.')[0] + '.'; // Just first sentence
  }

  private addDetail(response: string): string {
    return response + ' This targets muscle fiber recruitment and promotes hypertrophy through progressive overload.';
  }

  /**
   * Start the learning loop
   */
  private startLearningLoop(): void {
    setInterval(() => {
      this.processLearningQueue();
    }, this.LEARNING_INTERVAL);
  }

  /**
   * Process queued learning data
   */
  private processLearningQueue(): void {
    if (this.learningQueue.length === 0) return;
    
    // Process in batches
    const batch = this.learningQueue.splice(0, 10);
    
    batch.forEach(item => {
      switch (item.type) {
        case 'interaction':
          // Process interaction learning
          break;
        case 'workout':
          // Process workout learning
          break;
      }
    });
    
    // Update profile timestamp
    this.profile.lastUpdated = new Date();
    this.saveProfile();
  }

  /**
   * Initialize empty profile
   */
  private initializeProfile(): UserLearningProfile {
    return {
      userId: this.generateUserId(),
      profile: {
        experienceLevel: 'intermediate',
        fitnessGoals: [],
        physicalAttributes: {}
      },
      patterns: {
        workoutPatterns: {
          preferredDays: [],
          preferredTimes: [],
          averageWorkoutDuration: 0,
          workoutFrequency: 0,
          restDayPattern: []
        },
        exercisePatterns: {
          favoriteExercises: [],
          exerciseProgressions: {},
          formIssues: {},
          exercisePairings: []
        },
        communicationPatterns: {
          preferredPhrases: [],
          commonQuestions: [],
          feedbackStyle: 'concise',
          responseTime: 0
        },
        nutritionPatterns: {
          mealTiming: [],
          supplementUsage: [],
          hydrationHabits: 'moderate'
        }
      },
      preferences: {
        units: {
          weight: 'lbs',
          distance: 'miles',
          temperature: 'fahrenheit'
        },
        motivation: {
          style: 'enthusiastic',
          frequency: 'periodic',
          triggers: []
        },
        coaching: {
          detailLevel: 'medium',
          technicalLanguage: false,
          preferredCues: [],
          learningStyle: 'kinesthetic'
        },
        goals: {
          primary: 'general-fitness',
          secondary: [],
          timeline: 'long-term',
          priorities: []
        }
      },
      performance: {
        strength: {
          maxLifts: {},
          strengthProgressionRate: 0,
          plateaus: []
        },
        endurance: {
          workoutCapacity: 0,
          recoveryTime: 90,
          stamina: 50
        },
        consistency: {
          adherenceRate: 0,
          streaks: [],
          missedWorkouts: []
        },
        improvement: {
          overallProgress: 0,
          exerciseImprovements: {},
          formImprovements: {}
        }
      },
      insights: {
        strengths: [],
        weaknesses: [],
        opportunities: [],
        recommendations: [],
        personalityTraits: [],
        riskFactors: []
      },
      lastUpdated: new Date()
    };
  }

  /**
   * Load profile from storage
   */
  private loadProfile(): UserLearningProfile | null {
    try {
      const stored = localStorage.getItem('user_learning_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.lastUpdated = new Date(parsed.lastUpdated);
        return parsed;
      }
    } catch (error) {
      console.error('Failed to load user learning profile:', error);
    }
    return null;
  }

  /**
   * Save profile to storage
   */
  private saveProfile(): void {
    try {
      localStorage.setItem('user_learning_profile', JSON.stringify(this.profile));
    } catch (error) {
      console.error('Failed to save user learning profile:', error);
    }
  }

  /**
   * Generate unique user ID
   */
  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current profile (for debugging/export)
   */
  getProfile(): UserLearningProfile {
    return { ...this.profile };
  }

  /**
   * Reset profile (for testing)
   */
  resetProfile(): void {
    this.profile = this.initializeProfile();
    this.saveProfile();
  }

  // Singleton
  private static instance: UserLearningService;
  
  static getInstance(): UserLearningService {
    if (!UserLearningService.instance) {
      UserLearningService.instance = new UserLearningService();
    }
    return UserLearningService.instance;
  }
}

export default UserLearningService;
