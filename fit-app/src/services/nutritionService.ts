interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

interface FoodItem {
  name: string;
  quantity: number;
  unit: string;
  nutrition: NutritionData;
}

interface NutritionGoals {
  dailyCalories?: number;
  proteinGrams?: number;
  carbGrams?: number;
  fatGrams?: number;
}

interface NutritionAnalysis {
  foods: FoodItem[];
  totalNutrition: NutritionData;
  recommendations: string[];
  goalAlignment?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

class NutritionService {
  private foodDatabase: Map<string, NutritionData> = new Map();

  constructor() {
    this.initializeFoodDatabase();
  }

  private initializeFoodDatabase(): void {
    // Sample food database - in production would use API or larger database
    this.foodDatabase.set('chicken breast', {
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      fiber: 0,
      sodium: 74
    });

    this.foodDatabase.set('brown rice', {
      calories: 216,
      protein: 5,
      carbs: 45,
      fat: 1.8,
      fiber: 3.5,
      sugar: 0.7
    });

    this.foodDatabase.set('broccoli', {
      calories: 34,
      protein: 2.8,
      carbs: 7,
      fat: 0.4,
      fiber: 2.6,
      sugar: 1.7
    });

    this.foodDatabase.set('sweet potato', {
      calories: 86,
      protein: 1.6,
      carbs: 20,
      fat: 0.1,
      fiber: 3,
      sugar: 4.2
    });

    this.foodDatabase.set('avocado', {
      calories: 160,
      protein: 2,
      carbs: 9,
      fat: 15,
      fiber: 7,
      sugar: 0.7
    });
  }

  async analyzeFood(input: string | Blob, goals?: NutritionGoals): Promise<NutritionAnalysis> {
    try {
      let foodItems: FoodItem[] = [];
      
      if (typeof input === 'string') {
        // Text-based analysis
        foodItems = this.parseFoodText(input);
      } else {
        // Image analysis would go here
        // For now, return mock data
        foodItems = [{
          name: 'mixed meal',
          quantity: 1,
          unit: 'serving',
          nutrition: {
            calories: 450,
            protein: 30,
            carbs: 45,
            fat: 15
          }
        }];
      }

      const totalNutrition = this.calculateTotalNutrition(foodItems);
      const recommendations = this.generateRecommendations(totalNutrition, goals);
      
      const analysis: NutritionAnalysis = {
        foods: foodItems,
        totalNutrition,
        recommendations
      };

      if (goals) {
        analysis.goalAlignment = this.calculateGoalAlignment(totalNutrition, goals);
      }

      return analysis;
    } catch (error) {
      console.error('Nutrition analysis error:', error);
      throw error;
    }
  }

  private parseFoodText(text: string): FoodItem[] {
    const foods: FoodItem[] = [];
    const lowerText = text.toLowerCase();

    // Simple parsing - in production would use NLP
    for (const [foodName, nutrition] of this.foodDatabase.entries()) {
      if (lowerText.includes(foodName)) {
        foods.push({
          name: foodName,
          quantity: 100,
          unit: 'g',
          nutrition: { ...nutrition }
        });
      }
    }

    // If no foods found, try to parse quantities
    if (foods.length === 0) {
      const quantityMatch = text.match(/(\d+)\s*(?:g|grams?|oz|ounces?)/i);
      if (quantityMatch) {
        foods.push({
          name: 'unknown food',
          quantity: parseInt(quantityMatch[1]),
          unit: 'g',
          nutrition: {
            calories: 200,
            protein: 10,
            carbs: 25,
            fat: 8
          }
        });
      }
    }

    return foods;
  }

  private calculateTotalNutrition(foods: FoodItem[]): NutritionData {
    const total: NutritionData = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0
    };

    for (const food of foods) {
      const multiplier = food.quantity / 100; // Assuming base is per 100g
      total.calories += food.nutrition.calories * multiplier;
      total.protein += food.nutrition.protein * multiplier;
      total.carbs += food.nutrition.carbs * multiplier;
      total.fat += food.nutrition.fat * multiplier;
      total.fiber! += (food.nutrition.fiber || 0) * multiplier;
      total.sugar! += (food.nutrition.sugar || 0) * multiplier;
      total.sodium! += (food.nutrition.sodium || 0) * multiplier;
    }

    return total;
  }

  private generateRecommendations(nutrition: NutritionData, goals?: NutritionGoals): string[] {
    const recommendations: string[] = [];

    // Protein recommendations
    if (nutrition.protein < 20) {
      recommendations.push('Consider adding more protein to support muscle recovery');
    }

    // Fiber recommendations
    if (nutrition.fiber && nutrition.fiber < 5) {
      recommendations.push('Add more fiber-rich foods for better digestion');
    }

    // Balance recommendations
    const totalMacros = nutrition.protein + nutrition.carbs + nutrition.fat;
    const proteinRatio = nutrition.protein / totalMacros;
    const carbRatio = nutrition.carbs / totalMacros;
    const fatRatio = nutrition.fat / totalMacros;

    if (proteinRatio < 0.2) {
      recommendations.push('This meal is low in protein relative to other macros');
    }

    if (carbRatio > 0.6) {
      recommendations.push('High carb content - good for pre/post workout');
    }

    // Goal-based recommendations
    if (goals) {
      if (goals.dailyCalories && nutrition.calories > goals.dailyCalories * 0.4) {
        recommendations.push('This meal contains over 40% of your daily calorie goal');
      }
    }

    return recommendations;
  }

  private calculateGoalAlignment(nutrition: NutritionData, goals: NutritionGoals): {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } {
    return {
      calories: goals.dailyCalories ? (nutrition.calories / goals.dailyCalories) * 100 : 0,
      protein: goals.proteinGrams ? (nutrition.protein / goals.proteinGrams) * 100 : 0,
      carbs: goals.carbGrams ? (nutrition.carbs / goals.carbGrams) * 100 : 0,
      fat: goals.fatGrams ? (nutrition.fat / goals.fatGrams) * 100 : 0
    };
  }

  // Additional methods for meal planning
  async suggestMeals(goals: NutritionGoals, restrictions: string[] = []): Promise<FoodItem[]> {
    const suggestions: FoodItem[] = [];
    
    // Simple meal suggestion logic
    if (goals.proteinGrams && goals.proteinGrams > 100) {
      suggestions.push({
        name: 'chicken breast',
        quantity: 150,
        unit: 'g',
        nutrition: this.foodDatabase.get('chicken breast')!
      });
    }

    suggestions.push({
      name: 'brown rice',
      quantity: 100,
      unit: 'g',
      nutrition: this.foodDatabase.get('brown rice')!
    });

    suggestions.push({
      name: 'broccoli',
      quantity: 150,
      unit: 'g',
      nutrition: this.foodDatabase.get('broccoli')!
    });

    return suggestions;
  }
}

export const nutritionService = new NutritionService();