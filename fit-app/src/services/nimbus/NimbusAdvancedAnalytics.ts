import { IntelligentAIService } from '../intelligentAIService';
import { WorkoutService } from '../workoutService';
import { getRealNutritionAPI } from '../RealNutritionAPI';

export interface NimbusComprehensiveAnalytics {
  // Workout Analytics
  workoutStats: {
    totalWorkouts: number;
    totalSets: number;
    totalReps: number;
    totalVolume: number; // total weight lifted
    averageWorkoutDuration: number;
    consistency: {
      weeklyAverage: number;
      longestStreak: number;
      currentStreak: number;
    };
    strengthProgress: {
      exercise: string;
      initialMax: number;
      currentMax: number;
      progressPercentage: number;
    }[];
  };

  // Nutrition Analytics
  nutritionStats: {
    averageDailyCalories: number;
    macroConsistency: {
      proteinGoalHitRate: number;
      carbsGoalHitRate: number;
      fatGoalHitRate: number;
    };
    favoriteFoods: {
      name: string;
      frequency: number;
      totalCalories: number;
    }[];
    nutritionScore: number; // 0-100 based on goal achievement
  };

  // AI & Voice Analytics
  aiUsageStats: {
    totalQuestions: number;
    averageResponseTime: number;
    topTopics: string[];
    voiceUsage: {
      totalCommands: number;
      averageConfidence: number;
      mostUsedCommands: string[];
    };
  };

  // Progress Predictions
  predictions: {
    nextPR: {
      exercise: string;
      currentMax: number;
      predictedMax: number;
      estimatedDate: Date;
      confidence: number;
    }[];
    goalAchievement: {
      goal: string;
      currentProgress: number;
      estimatedCompletion: Date;
      probabilityOfSuccess: number;
    }[];
  };
}

export class NimbusAdvancedAnalytics {
  private workoutService: WorkoutService;
  private nutritionService: RealNutritionAPI;
  private aiService: IntelligentAIService;

  constructor() {
    this.workoutService = new WorkoutService();
    this.nutritionService = getRealNutritionAPI();
    this.aiService = new IntelligentAIService();
  }

  // Generate comprehensive analytics
  async generateAnalytics(timeframe: 'week' | 'month' | '3months' | 'year' | 'all'): Promise<NimbusComprehensiveAnalytics> {
    const [workoutStats, nutritionStats, aiStats] = await Promise.all([
      this.generateWorkoutAnalytics(timeframe),
      this.generateNutritionAnalytics(timeframe),
      this.generateAIUsageAnalytics(timeframe)
    ]);

    const predictions = await this.generatePredictions();

    return {
      workoutStats,
      nutritionStats,
      aiUsageStats: aiStats,
      predictions
    };
  }

  // Generate workout analytics
  private async generateWorkoutAnalytics(timeframe: string): Promise<any> {
    const workoutHistory = await this.workoutService.getWorkoutHistory(50);
    
    // Calculate basic stats
    const totalWorkouts = workoutHistory.length;
    const totalSets = workoutHistory.reduce((sum, workout) => 
      sum + workout.exercises.reduce((setSum, exercise) => 
        setSum + exercise.sets.length, 0), 0);
    
    const totalReps = workoutHistory.reduce((sum, workout) => 
      sum + workout.exercises.reduce((repSum, exercise) => 
        repSum + exercise.sets.reduce((setRepSum, set) => 
          setRepSum + (set.reps || 0), 0), 0), 0);

    const totalVolume = workoutHistory.reduce((sum, workout) => 
      sum + workout.exercises.reduce((volSum, exercise) => 
        volSum + exercise.sets.reduce((setVolSum, set) => 
          setVolSum + ((set.weight || 0) * (set.reps || 0)), 0), 0), 0);

    // Calculate consistency
    const weeklyWorkouts = this.calculateWeeklyWorkouts(workoutHistory);
    const weeklyAverage = weeklyWorkouts.reduce((sum, count) => sum + count, 0) / weeklyWorkouts.length;
    const { longestStreak, currentStreak } = this.calculateStreaks(workoutHistory);

    // Calculate strength progress
    const strengthProgress = await this.calculateStrengthProgress(workoutHistory);

    return {
      totalWorkouts,
      totalSets,
      totalReps,
      totalVolume,
      averageWorkoutDuration: 45, // Placeholder
      consistency: {
        weeklyAverage: Math.round(weeklyAverage * 10) / 10,
        longestStreak,
        currentStreak
      },
      strengthProgress
    };
  }

  // Generate nutrition analytics
  private async generateNutritionAnalytics(timeframe: string): Promise<any> {
    const nutritionHistory = await this.nutritionService.getNutritionHistory(30);
    
    const averageDailyCalories = nutritionHistory.length > 0 
      ? nutritionHistory.reduce((sum, day) => sum + day.totalCalories, 0) / nutritionHistory.length
      : 0;

    const macroConsistency = {
      proteinGoalHitRate: 75, // Placeholder
      carbsGoalHitRate: 80,   // Placeholder
      fatGoalHitRate: 70      // Placeholder
    };

    const favoriteFoods = [
      { name: 'Chicken Breast', frequency: 15, totalCalories: 2250 },
      { name: 'Brown Rice', frequency: 12, totalCalories: 1800 },
      { name: 'Broccoli', frequency: 10, totalCalories: 300 }
    ];

    const nutritionScore = Math.round(
      (macroConsistency.proteinGoalHitRate + 
       macroConsistency.carbsGoalHitRate + 
       macroConsistency.fatGoalHitRate) / 3
    );

    return {
      averageDailyCalories: Math.round(averageDailyCalories),
      macroConsistency,
      favoriteFoods,
      nutritionScore
    };
  }

  // Generate AI usage analytics
  private async generateAIUsageAnalytics(timeframe: string): Promise<any> {
    return {
      totalQuestions: 45, // Placeholder
      averageResponseTime: 2.3, // seconds
      topTopics: ['workout planning', 'form advice', 'nutrition tips', 'recovery'],
      voiceUsage: {
        totalCommands: 23,
        averageConfidence: 0.87,
        mostUsedCommands: ['start workout', 'log set', 'next exercise', 'end workout']
      }
    };
  }

  // Generate AI-powered progress predictions
  private async generatePredictions(): Promise<any> {
    const workoutHistory = await this.workoutService.getWorkoutHistory(50);
    const personalRecords = await this.workoutService.getAllPersonalRecords();

    // Use AI to predict next PRs
    const prPredictionPrompt = `Based on this workout history and current personal records, predict when the user will achieve their next personal records:

CURRENT PRS: ${JSON.stringify(personalRecords)}
RECENT WORKOUTS: ${JSON.stringify(workoutHistory.slice(-10))}

Return predictions for top 3 exercises in JSON format:
{
  "nextPR": [
    {
      "exercise": "exercise name",
      "currentMax": current_max_weight,
      "predictedMax": predicted_new_max,
      "estimatedDate": "YYYY-MM-DD",
      "confidence": 0.0-1.0
    }
  ]
}`;

    let aiResponse = '';
    await this.aiService.streamResponse(
      prPredictionPrompt,
      (chunk) => { aiResponse += chunk; },
      (fullResponse) => { aiResponse = fullResponse; },
      (error) => { throw error; }
    );

    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { nextPR: [] };
    } catch (error) {
      console.error('Failed to parse prediction response:', error);
      return { nextPR: [] };
    }
  }

  // Helper methods
  private calculateWeeklyWorkouts(workoutHistory: any[]): number[] {
    // Group workouts by week and count
    const weeklyCounts = new Array(8).fill(0);
    const now = new Date();
    
    workoutHistory.forEach(workout => {
      const workoutDate = new Date(workout.date);
      const weeksAgo = Math.floor((now.getTime() - workoutDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      if (weeksAgo < 8) {
        weeklyCounts[weeksAgo]++;
      }
    });

    return weeklyCounts.reverse();
  }

  private calculateStreaks(workoutHistory: any[]): { longestStreak: number; currentStreak: number } {
    if (workoutHistory.length === 0) {
      return { longestStreak: 0, currentStreak: 0 };
    }

    const sortedWorkouts = workoutHistory
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(w => new Date(w.date));

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const now = new Date();

    // Calculate current streak
    for (let i = 0; i < sortedWorkouts.length; i++) {
      const daysDiff = Math.floor((now.getTime() - sortedWorkouts[i].getTime()) / (24 * 60 * 60 * 1000));
      if (daysDiff === currentStreak) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak
    for (let i = 0; i < sortedWorkouts.length - 1; i++) {
      const daysDiff = Math.floor(
        (sortedWorkouts[i].getTime() - sortedWorkouts[i + 1].getTime()) / (24 * 60 * 60 * 1000)
      );
      
      if (daysDiff <= 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    return { longestStreak: longestStreak + 1, currentStreak };
  }

  private async calculateStrengthProgress(workoutHistory: any[]): Promise<any[]> {
    // Analyze strength progress for each exercise
    const exerciseProgress: { [key: string]: { maxes: number[]; dates: Date[] } } = {};

    workoutHistory.forEach(workout => {
      workout.exercises.forEach((exercise: any) => {
        if (!exerciseProgress[exercise.name]) {
          exerciseProgress[exercise.name] = { maxes: [], dates: [] };
        }

        const maxWeight = Math.max(...exercise.sets.map((set: any) => set.weight || 0));
        if (maxWeight > 0) {
          exerciseProgress[exercise.name].maxes.push(maxWeight);
          exerciseProgress[exercise.name].dates.push(new Date(workout.date));
        }
      });
    });

    // Calculate progress for each exercise
    return Object.entries(exerciseProgress)
      .filter(([_, data]) => data.maxes.length >= 2)
      .map(([exercise, data]) => {
        const initialMax = Math.min(...data.maxes);
        const currentMax = Math.max(...data.maxes);
        const progressPercentage = ((currentMax - initialMax) / initialMax) * 100;

        return {
          exercise,
          initialMax,
          currentMax,
          progressPercentage: Math.round(progressPercentage * 10) / 10
        };
      })
      .sort((a, b) => b.progressPercentage - a.progressPercentage)
      .slice(0, 5); // Top 5 exercises
  }
} 