export interface NimbusNutritionEntry {
  id: string;
  foodItem: string;
  brand?: string;
  barcode?: string;
  quantity: number;
  unit: 'g' | 'ml' | 'oz' | 'cup' | 'piece' | 'serving';
  macros: NimbusMacros;
  micronutrients?: NimbusMicronutrients;
  timestamp: Date;
  meal: NimbusMealType;
  source: 'manual' | 'barcode' | 'voice' | 'ai';
  confidence?: number;
}

export interface NimbusMacros {
  calories: number;
  protein: number;    // grams
  carbs: number;      // grams
  fat: number;        // grams
  fiber?: number;     // grams
  sugar?: number;     // grams
  sodium?: number;    // mg
}

export interface NimbusMicronutrients {
  vitaminC?: number;
  iron?: number;
  calcium?: number;
  vitaminD?: number;
  b12?: number;
}

export type NimbusMealType = 'breakfast' | 'lunch' | 'dinner' | 'morning-snack' | 'afternoon-snack' | 'evening-snack';

export interface NimbusNutritionGoals {
  dailyCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams?: number;
  waterLiters?: number;
}

export interface NimbusDailyNutritionSummary {
  date: Date;
  entries: NimbusNutritionEntry[];
  totals: NimbusMacros;
  goals: NimbusNutritionGoals;
  remainingCalories: number;
  macroBreakdown: {
    proteinPercent: number;
    carbsPercent: number;
    fatPercent: number;
  };
  mealsCompleted: NimbusMealType[];
}

export interface NimbusProductInfo {
  barcode?: string;
  name: string;
  brand?: string;
  category: string;
  nutritionPer100g: NimbusMacros;
  servingSize?: {
    amount: number;
    unit: string;
    nutritionPerServing: NimbusMacros;
  };
  retailer?: 'coles' | 'woolworths' | 'generic';
  price?: {
    amount: number;
    currency: 'AUD';
    date: Date;
  };
  imageUrl?: string;
  ingredients?: string[];
  allergens?: string[];
}

export interface NimbusMealPlanRequest {
  macroTargets: {
    dailyCalories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
  };
  daysCount: number;
  dietaryRestrictions: string[];
  cookingSkill: 'beginner' | 'intermediate' | 'advanced';
  maxCookingTime: number; // minutes
  weeklyBudget: number; // AUD
}

export interface NimbusMealPlan {
  totalDays: number;
  weeklyNutritionSummary: {
    avgDailyCalories: number;
    avgDailyProtein: number;
    avgDailyCarbs: number;
    avgDailyFat: number;
  };
  days: NimbusMealPlanDay[];
  shoppingList: NimbusShoppingItem[];
  weeklyPrepTips: string[];
}

export interface NimbusMealPlanDay {
  day: number;
  meals: {
    breakfast?: NimbusPlannedMeal;
    lunch?: NimbusPlannedMeal;
    dinner?: NimbusPlannedMeal;
    snacks?: NimbusPlannedMeal[];
  };
}

export interface NimbusPlannedMeal {
  name: string;
  ingredients: NimbusIngredient[];
  instructions: string[];
  prepTime: number; // minutes
  nutrition: NimbusMacros;
}

export interface NimbusIngredient {
  item: string;
  amount: number;
  unit: string;
  calories: number;
}

export interface NimbusShoppingItem {
  item: string;
  totalAmount: number;
  unit: string;
  estimatedCost: number;
}

export interface NimbusQuickMeal {
  name: string;
  prepTime: number;
  ingredients: NimbusIngredient[];
  instructions: string[];
  nutrition: NimbusMacros;
  tips: string[];
}

export interface NimbusAnalyticsData {
  period: { startDate: Date; endDate: Date };
  totalDays: number;
  totalEntries: number;
  averageDailyCalories: number;
  averageDailyProtein: number;
  averageDailyCarbs: number;
  averageDailyFat: number;
  trends: NimbusTrendData;
  insights: NimbusNutritionInsight[];
  goalProgress: NimbusGoalProgress;
  mealDistribution: Record<string, number>;
  topFoods: Array<{ food: string; frequency: number; totalCalories: number }>;
  consistencyScore: number;
}

export interface NimbusTrendData {
  caloriesTrend: 'increasing' | 'decreasing' | 'stable';
  proteinTrend: 'increasing' | 'decreasing' | 'stable';
  carbsTrend: 'increasing' | 'decreasing' | 'stable';
  fatTrend: 'increasing' | 'decreasing' | 'stable';
  trendStrength: number;
}

export interface NimbusNutritionInsight {
  type: 'macro_balance' | 'meal_timing' | 'consistency' | 'goal_achievement';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  suggestedActions?: string[];
}

export interface NimbusGoalProgress {
  calories: { target: number; actual: number; percentage: number };
  protein: { target: number; actual: number; percentage: number };
  carbs: { target: number; actual: number; percentage: number };
  fat: { target: number; actual: number; percentage: number };
}

export interface NimbusNutritionAnalytics {
  dailyAverages: {
    date: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }[];
  avgMacroDistribution: {
    protein: number;
    carbs: number;
    fat: number;
  };
  goalAchievement: {
    daysMetCalorieGoal: number;
    avgProteinAchievement: number;
    avgCarbsAchievement: number;
    avgFatAchievement: number;
  };
  topFoods: {
    name: string;
    timesLogged: number;
    totalCalories: number;
    avgCalories: number;
  }[];
} 