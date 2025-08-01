import { 
  NimbusNutritionEntry, 
  NimbusNutritionGoals, 
  NimbusDailyNutritionSummary,
  NimbusMealType,
  NimbusMacros,
  NimbusNutritionAnalytics
} from '../../types/nimbus/NimbusNutrition';

export class NimbusNutritionService {
  private storageKey = 'nimbus_nutrition_entries';
  private goalsKey = 'nimbus_nutrition_goals';

  constructor() {
    this.initializeDefaultGoals();
  }

  private initializeDefaultGoals() {
    const existingGoals = this.getGoals();
    if (!existingGoals) {
      const defaultGoals: NimbusNutritionGoals = {
        dailyCalories: 2000,
        proteinGrams: 150,
        carbsGrams: 200,
        fatGrams: 65,
        fiberGrams: 25,
        waterLiters: 2.5
      };
      this.saveGoals(defaultGoals);
    }
  }

  // Save nutrition entry
  async addEntry(entry: Omit<NimbusNutritionEntry, 'id' | 'timestamp'>): Promise<NimbusNutritionEntry> {
    const newEntry: NimbusNutritionEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: new Date()
    };

    const entries = this.getAllEntries();
    entries.push(newEntry);
    this.saveEntries(entries);

    return newEntry;
  }

  // Get all entries
  getAllEntries(): NimbusNutritionEntry[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];
      
      const entries = JSON.parse(stored);
      return entries.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp)
      }));
    } catch (error) {
      console.error('Error loading nutrition entries:', error);
      return [];
    }
  }

  // Get entries for a specific date
  getEntriesForDate(date: Date): NimbusNutritionEntry[] {
    const entries = this.getAllEntries();
    const targetDate = this.formatDate(date);
    
    return entries.filter(entry => {
      const entryDate = this.formatDate(new Date(entry.timestamp));
      return entryDate === targetDate;
    });
  }

  // Get entries in a date range
  getEntriesInRange(startDate: Date, endDate: Date): NimbusNutritionEntry[] {
    const entries = this.getAllEntries();
    const start = this.formatDate(startDate);
    const end = this.formatDate(endDate);
    
    return entries.filter(entry => {
      const entryDate = this.formatDate(new Date(entry.timestamp));
      return entryDate >= start && entryDate <= end;
    });
  }

  // Get daily summary
  async getDailySummary(date: Date): Promise<NimbusDailyNutritionSummary> {
    const entries = this.getEntriesForDate(date);
    const goals = this.getGoals();
    
    const totals = this.calculateTotals(entries);
    const remainingCalories = Math.max(0, goals.dailyCalories - totals.calories);
    
    const macroBreakdown = this.calculateMacroBreakdown(totals, goals);
    const mealsCompleted = this.getCompletedMeals(entries);

    return {
      date,
      entries,
      totals,
      goals,
      remainingCalories,
      macroBreakdown,
      mealsCompleted
    };
  }

  // Update entry
  async updateEntry(entryId: string, updates: Partial<NimbusNutritionEntry>): Promise<NimbusNutritionEntry | null> {
    const entries = this.getAllEntries();
    const index = entries.findIndex(entry => entry.id === entryId);
    
    if (index === -1) return null;

    entries[index] = { ...entries[index], ...updates };
    this.saveEntries(entries);
    
    return entries[index];
  }

  // Delete entry
  async deleteEntry(entryId: string): Promise<boolean> {
    const entries = this.getAllEntries();
    const filteredEntries = entries.filter(entry => entry.id !== entryId);
    
    if (filteredEntries.length === entries.length) {
      return false; // Entry not found
    }

    this.saveEntries(filteredEntries);
    return true;
  }

  // Get nutrition goals
  getGoals(): NimbusNutritionGoals {
    try {
      const stored = localStorage.getItem(this.goalsKey);
      if (!stored) return this.getDefaultGoals();
      
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error loading nutrition goals:', error);
      return this.getDefaultGoals();
    }
  }

  // Update nutrition goals
  async updateGoals(goals: Partial<NimbusNutritionGoals>): Promise<NimbusNutritionGoals> {
    const currentGoals = this.getGoals();
    const updatedGoals = { ...currentGoals, ...goals };
    
    this.saveGoals(updatedGoals);
    return updatedGoals;
  }

  // Get analytics
  async getAnalytics(timeframe: 'week' | 'month' | '3months'): Promise<NimbusNutritionAnalytics> {
    const entries = this.getAllEntries();
    const goals = this.getGoals();
    
    const endDate = new Date();
    const startDate = this.getStartDate(timeframe);
    
    const filteredEntries = entries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= startDate && entryDate <= endDate;
    });

    const dailyAverages = this.calculateDailyAverages(filteredEntries, startDate, endDate);
    const avgMacroDistribution = this.calculateAverageMacroDistribution(filteredEntries);
    const goalAchievement = this.calculateGoalAchievement(filteredEntries, goals);
    const topFoods = this.calculateTopFoods(filteredEntries);

    return {
      dailyAverages,
      avgMacroDistribution,
      goalAchievement,
      topFoods
    };
  }

  // Add demo data for testing
  async addDemoData(): Promise<void> {
    const demoEntries = [
      {
        foodItem: 'Oatmeal with Berries',
        brand: 'Quaker',
        quantity: 100,
        unit: 'g' as const,
        macros: {
          calories: 150,
          protein: 5,
          carbs: 27,
          fat: 3,
          fiber: 4,
          sugar: 1
        },
        meal: 'breakfast' as NimbusMealType,
        source: 'manual' as const
      },
      {
        foodItem: 'Grilled Chicken Breast',
        brand: 'Woolworths',
        quantity: 150,
        unit: 'g' as const,
        macros: {
          calories: 250,
          protein: 45,
          carbs: 0,
          fat: 5,
          fiber: 0
        },
        meal: 'lunch' as NimbusMealType,
        source: 'manual' as const
      },
      {
        foodItem: 'Brown Rice',
        brand: 'SunRice',
        quantity: 100,
        unit: 'g' as const,
        macros: {
          calories: 110,
          protein: 2.5,
          carbs: 23,
          fat: 0.9,
          fiber: 1.8
        },
        meal: 'lunch' as NimbusMealType,
        source: 'manual' as const
      },
      {
        foodItem: 'Greek Yogurt',
        brand: 'Chobani',
        quantity: 170,
        unit: 'g' as const,
        macros: {
          calories: 100,
          protein: 17,
          carbs: 6,
          fat: 0.5,
          sugar: 4
        },
        meal: 'afternoon-snack' as NimbusMealType,
        source: 'manual' as const
      },
      {
        foodItem: 'Salmon Fillet',
        brand: 'Tassal',
        quantity: 120,
        unit: 'g' as const,
        macros: {
          calories: 280,
          protein: 35,
          carbs: 0,
          fat: 15,
          fiber: 0
        },
        meal: 'dinner' as NimbusMealType,
        source: 'manual' as const
      },
      {
        foodItem: 'Broccoli',
        brand: 'Fresh',
        quantity: 100,
        unit: 'g' as const,
        macros: {
          calories: 34,
          protein: 2.8,
          carbs: 7,
          fat: 0.4,
          fiber: 2.6
        },
        meal: 'dinner' as NimbusMealType,
        source: 'manual' as const
      }
    ];

    for (const entry of demoEntries) {
      await this.addEntry(entry);
    }
  }

  // Private helper methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private calculateTotals(entries: NimbusNutritionEntry[]): NimbusMacros {
    return entries.reduce((totals, entry) => ({
      calories: totals.calories + entry.macros.calories,
      protein: totals.protein + entry.macros.protein,
      carbs: totals.carbs + entry.macros.carbs,
      fat: totals.fat + entry.macros.fat,
      fiber: (totals.fiber || 0) + (entry.macros.fiber || 0),
      sugar: (totals.sugar || 0) + (entry.macros.sugar || 0),
      sodium: (totals.sodium || 0) + (entry.macros.sodium || 0)
    }), {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0
    });
  }

  private calculateMacroBreakdown(totals: NimbusMacros, goals: NimbusNutritionGoals) {
    const totalCalories = totals.calories;
    if (totalCalories === 0) {
      return { proteinPercent: 0, carbsPercent: 0, fatPercent: 0 };
    }

    return {
      proteinPercent: Math.round((totals.protein * 4 / totalCalories) * 100),
      carbsPercent: Math.round((totals.carbs * 4 / totalCalories) * 100),
      fatPercent: Math.round((totals.fat * 9 / totalCalories) * 100)
    };
  }

  private getCompletedMeals(entries: NimbusNutritionEntry[]): NimbusMealType[] {
    const meals = new Set<NimbusMealType>();
    entries.forEach(entry => meals.add(entry.meal));
    return Array.from(meals);
  }

  private getDefaultGoals(): NimbusNutritionGoals {
    return {
      dailyCalories: 2000,
      proteinGrams: 150,
      carbsGrams: 200,
      fatGrams: 65,
      fiberGrams: 25,
      waterLiters: 2.5
    };
  }

  private getStartDate(timeframe: 'week' | 'month' | '3months'): Date {
    const now = new Date();
    switch (timeframe) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '3months':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  private calculateDailyAverages(entries: NimbusNutritionEntry[], startDate: Date, endDate: Date) {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const dailyData: { [key: string]: NimbusMacros } = {};

    entries.forEach(entry => {
      const date = this.formatDate(new Date(entry.timestamp));
      if (!dailyData[date]) {
        dailyData[date] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }
      dailyData[date].calories += entry.macros.calories;
      dailyData[date].protein += entry.macros.protein;
      dailyData[date].carbs += entry.macros.carbs;
      dailyData[date].fat += entry.macros.fat;
    });

    return Object.entries(dailyData).map(([date, totals]) => ({
      date,
      calories: Math.round(totals.calories),
      protein: Math.round(totals.protein),
      carbs: Math.round(totals.carbs),
      fat: Math.round(totals.fat)
    }));
  }

  private calculateAverageMacroDistribution(entries: NimbusNutritionEntry[]) {
    if (entries.length === 0) {
      return { protein: 0, carbs: 0, fat: 0 };
    }

    const totals = this.calculateTotals(entries);
    const totalCalories = totals.calories;

    if (totalCalories === 0) {
      return { protein: 0, carbs: 0, fat: 0 };
    }

    return {
      protein: Math.round((totals.protein * 4 / totalCalories) * 100),
      carbs: Math.round((totals.carbs * 4 / totalCalories) * 100),
      fat: Math.round((totals.fat * 9 / totalCalories) * 100)
    };
  }

  private calculateGoalAchievement(entries: NimbusNutritionEntry[], goals: NimbusNutritionGoals) {
    const dailyData = this.calculateDailyAverages(entries, new Date(0), new Date());
    const daysMetCalorieGoal = dailyData.filter(day => day.calories >= goals.dailyCalories * 0.9).length;
    
    const avgProteinAchievement = dailyData.length > 0 
      ? Math.round((dailyData.reduce((sum, day) => sum + day.protein, 0) / dailyData.length / goals.proteinGrams) * 100)
      : 0;

    const avgCarbsAchievement = dailyData.length > 0
      ? Math.round((dailyData.reduce((sum, day) => sum + day.carbs, 0) / dailyData.length / goals.carbsGrams) * 100)
      : 0;

    const avgFatAchievement = dailyData.length > 0
      ? Math.round((dailyData.reduce((sum, day) => sum + day.fat, 0) / dailyData.length / goals.fatGrams) * 100)
      : 0;

    return {
      daysMetCalorieGoal,
      avgProteinAchievement,
      avgCarbsAchievement,
      avgFatAchievement
    };
  }

  private calculateTopFoods(entries: NimbusNutritionEntry[]) {
    const foodCounts: { [key: string]: { count: number; totalCalories: number; avgCalories: number } } = {};

    entries.forEach(entry => {
      const key = entry.foodItem.toLowerCase();
      if (!foodCounts[key]) {
        foodCounts[key] = { count: 0, totalCalories: 0, avgCalories: 0 };
      }
      foodCounts[key].count++;
      foodCounts[key].totalCalories += entry.macros.calories;
    });

    return Object.entries(foodCounts)
      .map(([name, data]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        timesLogged: data.count,
        totalCalories: Math.round(data.totalCalories),
        avgCalories: Math.round(data.totalCalories / data.count)
      }))
      .sort((a, b) => b.timesLogged - a.timesLogged)
      .slice(0, 10);
  }

  private saveEntries(entries: NimbusNutritionEntry[]) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving nutrition entries:', error);
    }
  }

  private saveGoals(goals: NimbusNutritionGoals) {
    try {
      localStorage.setItem(this.goalsKey, JSON.stringify(goals));
    } catch (error) {
      console.error('Error saving nutrition goals:', error);
    }
  }
} 