import { NimbusNutritionService } from './NimbusNutritionService';
import { 
  NimbusNutritionEntry, 
  NimbusNutritionGoals,
  NimbusDailyNutritionSummary,
  NimbusAnalyticsData,
  NimbusNutritionInsight,
  NimbusGoalProgress,
  NimbusTrendData
} from '../../types/nimbus/NimbusNutrition';

export class NimbusNutritionAnalytics {
  private nutritionService: NimbusNutritionService;

  constructor() {
    this.nutritionService = new NimbusNutritionService();
  }

  // Get analytics data for a date range
  async getAnalyticsData(startDate: Date, endDate: Date): Promise<NimbusAnalyticsData> {
    const entries = await this.nutritionService.getEntriesInRange(startDate, endDate);
    const goals = await this.nutritionService.getNutritionGoals();
    
    const dailySummaries = await this.getDailySummariesInRange(startDate, endDate);
    const trends = this.calculateTrends(dailySummaries);
    const insights = await this.generateInsights(entries, dailySummaries, goals);
    const goalProgress = this.calculateGoalProgress(dailySummaries, goals);
    
    return {
      period: { startDate, endDate },
      totalDays: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
      totalEntries: entries.length,
      averageDailyCalories: this.calculateAverage(dailySummaries.map(d => d.totalCalories)),
      averageDailyProtein: this.calculateAverage(dailySummaries.map(d => d.totalProtein)),
      averageDailyCarbs: this.calculateAverage(dailySummaries.map(d => d.totalCarbs)),
      averageDailyFat: this.calculateAverage(dailySummaries.map(d => d.totalFat)),
      trends,
      insights,
      goalProgress,
      mealDistribution: this.calculateMealDistribution(entries),
      topFoods: this.getTopFoods(entries),
      consistencyScore: this.calculateConsistencyScore(dailySummaries, goals)
    };
  }

  // Get weekly analytics
  async getWeeklyAnalytics(weekStart: Date): Promise<NimbusAnalyticsData> {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return this.getAnalyticsData(weekStart, weekEnd);
  }

  // Get monthly analytics
  async getMonthlyAnalytics(year: number, month: number): Promise<NimbusAnalyticsData> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    return this.getAnalyticsData(startDate, endDate);
  }

  // Calculate trends over time
  private calculateTrends(dailySummaries: NimbusDailyNutritionSummary[]): NimbusTrendData {
    if (dailySummaries.length < 2) {
      return {
        caloriesTrend: 'stable',
        proteinTrend: 'stable',
        carbsTrend: 'stable',
        fatTrend: 'stable',
        trendStrength: 0
      };
    }

    const caloriesTrend = this.calculateTrendDirection(dailySummaries.map(d => d.totalCalories));
    const proteinTrend = this.calculateTrendDirection(dailySummaries.map(d => d.totalProtein));
    const carbsTrend = this.calculateTrendDirection(dailySummaries.map(d => d.totalCarbs));
    const fatTrend = this.calculateTrendDirection(dailySummaries.map(d => d.totalFat));

    return {
      caloriesTrend,
      proteinTrend,
      carbsTrend,
      fatTrend,
      trendStrength: this.calculateTrendStrength(dailySummaries)
    };
  }

  // Calculate trend direction (increasing, decreasing, stable)
  private calculateTrendDirection(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.ceil(values.length / 2));
    const secondHalf = values.slice(Math.ceil(values.length / 2));
    
    const firstAvg = this.calculateAverage(firstHalf);
    const secondAvg = this.calculateAverage(secondHalf);
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (change > 5) return 'increasing';
    if (change < -5) return 'decreasing';
    return 'stable';
  }

  // Calculate trend strength (0-100)
  private calculateTrendStrength(dailySummaries: NimbusDailyNutritionSummary[]): number {
    if (dailySummaries.length < 3) return 0;
    
    const calories = dailySummaries.map(d => d.totalCalories);
    const variance = this.calculateVariance(calories);
    const mean = this.calculateAverage(calories);
    
    // Coefficient of variation
    const cv = Math.sqrt(variance) / mean;
    
    // Convert to 0-100 scale (lower CV = higher consistency = higher strength)
    return Math.max(0, Math.min(100, (1 - cv) * 100));
  }

  // Generate AI-powered insights
  private async generateInsights(
    entries: NimbusNutritionEntry[], 
    dailySummaries: NimbusDailyNutritionSummary[],
    goals: NimbusNutritionGoals
  ): Promise<NimbusNutritionInsight[]> {
    const insights: NimbusNutritionInsight[] = [];
    
    // Analyze macro balance
    const avgProtein = this.calculateAverage(dailySummaries.map(d => d.totalProtein));
    const avgCarbs = this.calculateAverage(dailySummaries.map(d => d.totalCarbs));
    const avgFat = this.calculateAverage(dailySummaries.map(d => d.totalFat));
    
    const totalMacros = avgProtein + avgCarbs + avgFat;
    const proteinRatio = (avgProtein / totalMacros) * 100;
    const carbsRatio = (avgCarbs / totalMacros) * 100;
    const fatRatio = (avgFat / totalMacros) * 100;
    
    // Macro balance insights
    if (proteinRatio < 20) {
      insights.push({
        type: 'macro_balance',
        title: 'Increase Protein Intake',
        message: `Your protein intake (${proteinRatio.toFixed(1)}%) is below the recommended 20-30%. Consider adding more lean meats, fish, eggs, or plant-based proteins.`,
        priority: 'medium',
        actionable: true,
        suggestedActions: [
          'Add Greek yogurt to breakfast',
          'Include chicken breast in lunch',
          'Try protein-rich snacks like nuts or protein bars'
        ]
      });
    }
    
    if (carbsRatio > 60) {
      insights.push({
        type: 'macro_balance',
        title: 'Consider Reducing Carbs',
        message: `Your carb intake (${carbsRatio.toFixed(1)}%) is quite high. Consider balancing with more protein and healthy fats.`,
        priority: 'low',
        actionable: true,
        suggestedActions: [
          'Replace some grains with vegetables',
          'Choose protein-rich snacks over carb-heavy ones',
          'Add healthy fats like avocado or nuts'
        ]
      });
    }
    
    // Meal timing insights
    const mealTiming = this.analyzeMealTiming(entries);
    if (mealTiming.lateNightEating > 0.3) {
      insights.push({
        type: 'meal_timing',
        title: 'Late Night Eating Detected',
        message: `${(mealTiming.lateNightEating * 100).toFixed(0)}% of your calories are consumed after 8 PM. Consider eating earlier for better digestion and sleep.`,
        priority: 'medium',
        actionable: true,
        suggestedActions: [
          'Try to finish dinner by 7 PM',
          'Move snacks to earlier in the day',
          'Consider intermittent fasting'
        ]
      });
    }
    
    // Consistency insights
    const consistency = this.calculateConsistencyScore(dailySummaries, goals);
    if (consistency < 70) {
      insights.push({
        type: 'consistency',
        title: 'Improve Daily Consistency',
        message: `Your nutrition consistency score is ${consistency.toFixed(0)}%. Try to log your meals more regularly for better tracking.`,
        priority: 'high',
        actionable: true,
        suggestedActions: [
          'Set meal reminders',
          'Use barcode scanning for faster logging',
          'Plan meals in advance'
        ]
      });
    }
    
    // Goal achievement insights
    const avgCalories = this.calculateAverage(dailySummaries.map(d => d.totalCalories));
    if (avgCalories < goals.dailyCalories * 0.8) {
      insights.push({
        type: 'goal_achievement',
        title: 'Calorie Intake Below Target',
        message: `You're averaging ${avgCalories.toFixed(0)} calories, which is ${((goals.dailyCalories - avgCalories) / goals.dailyCalories * 100).toFixed(0)}% below your target.`,
        priority: 'medium',
        actionable: true,
        suggestedActions: [
          'Add healthy snacks between meals',
          'Increase portion sizes slightly',
          'Include more calorie-dense foods like nuts and avocados'
        ]
      });
    }
    
    return insights;
  }

  // Calculate goal progress
  private calculateGoalProgress(
    dailySummaries: NimbusDailyNutritionSummary[], 
    goals: NimbusNutritionGoals
  ): NimbusGoalProgress {
    const avgCalories = this.calculateAverage(dailySummaries.map(d => d.totalCalories));
    const avgProtein = this.calculateAverage(dailySummaries.map(d => d.totalProtein));
    const avgCarbs = this.calculateAverage(dailySummaries.map(d => d.totalCarbs));
    const avgFat = this.calculateAverage(dailySummaries.map(d => d.totalFat));
    
    return {
      calories: {
        target: goals.dailyCalories,
        actual: avgCalories,
        percentage: Math.min(100, (avgCalories / goals.dailyCalories) * 100)
      },
      protein: {
        target: goals.proteinGrams,
        actual: avgProtein,
        percentage: Math.min(100, (avgProtein / goals.proteinGrams) * 100)
      },
      carbs: {
        target: goals.carbsGrams,
        actual: avgCarbs,
        percentage: Math.min(100, (avgCarbs / goals.carbsGrams) * 100)
      },
      fat: {
        target: goals.fatGrams,
        actual: avgFat,
        percentage: Math.min(100, (avgFat / goals.fatGrams) * 100)
      }
    };
  }

  // Calculate meal distribution
  private calculateMealDistribution(entries: NimbusNutritionEntry[]): Record<string, number> {
    const distribution: Record<string, number> = {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      'morning-snack': 0,
      'afternoon-snack': 0,
      'evening-snack': 0
    };
    
    entries.forEach(entry => {
      const meal = entry.meal as string;
      if (distribution[meal] !== undefined) {
        distribution[meal] += entry.macros.calories;
      }
    });
    
    return distribution;
  }

  // Get top foods by frequency
  private getTopFoods(entries: NimbusNutritionEntry[]): Array<{ food: string; frequency: number; totalCalories: number }> {
    const foodMap = new Map<string, { frequency: number; totalCalories: number }>();
    
    entries.forEach(entry => {
      const food = entry.foodItem;
      const existing = foodMap.get(food) || { frequency: 0, totalCalories: 0 };
      foodMap.set(food, {
        frequency: existing.frequency + 1,
        totalCalories: existing.totalCalories + entry.macros.calories
      });
    });
    
    return Array.from(foodMap.entries())
      .map(([food, data]) => ({ food, ...data }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  }

  // Calculate consistency score
  private calculateConsistencyScore(
    dailySummaries: NimbusDailyNutritionSummary[], 
    goals: NimbusNutritionGoals
  ): number {
    if (dailySummaries.length === 0) return 0;
    
    const scores = dailySummaries.map(summary => {
      const calorieScore = Math.min(100, (summary.totalCalories / goals.dailyCalories) * 100);
      const proteinScore = Math.min(100, (summary.totalProtein / goals.proteinGrams) * 100);
      const carbsScore = Math.min(100, (summary.totalCarbs / goals.carbsGrams) * 100);
      const fatScore = Math.min(100, (summary.totalFat / goals.fatGrams) * 100);
      
      return (calorieScore + proteinScore + carbsScore + fatScore) / 4;
    });
    
    return this.calculateAverage(scores);
  }

  // Analyze meal timing patterns
  private analyzeMealTiming(entries: NimbusNutritionEntry[]): { lateNightEating: number } {
    let lateNightCalories = 0;
    let totalCalories = 0;
    
    entries.forEach(entry => {
      const hour = new Date(entry.timestamp).getHours();
      totalCalories += entry.macros.calories;
      
      if (hour >= 20 || hour <= 6) {
        lateNightCalories += entry.macros.calories;
      }
    });
    
    return {
      lateNightEating: totalCalories > 0 ? lateNightCalories / totalCalories : 0
    };
  }

  // Helper methods
  private async getDailySummariesInRange(startDate: Date, endDate: Date): Promise<NimbusDailyNutritionSummary[]> {
    const summaries: NimbusDailyNutritionSummary[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      try {
        const summary = await this.nutritionService.getDailySummary(currentDate);
        summaries.push(summary);
      } catch (error) {
        // Add empty summary for missing days
        summaries.push({
          date: new Date(currentDate),
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
          totalFiber: 0,
          totalSugar: 0,
          remainingCalories: 0,
          meals: {}
        });
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return summaries;
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = this.calculateAverage(values);
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return this.calculateAverage(squaredDiffs);
  }
}

export const nimbusNutritionAnalytics = new NimbusNutritionAnalytics(); 