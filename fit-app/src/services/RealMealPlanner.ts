/**
 * Real AI Meal Planner Service
 * Uses actual nutritional analysis and real food databases
 */

import { getRealNutritionAPI, RealFoodProduct, MealPlanRequest, MealPlan } from './RealNutritionAPI';
import { NimbusAIService } from '../nimbus/services/NimbusAIService';

interface NutritionalRequirements {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
}

interface MealTemplate {
  name: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  foodCategories: string[];
  prepTime: number;
  cookTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export class RealMealPlanner {
  private aiService: NimbusAIService;
  private mealTemplates: MealTemplate[] = [
    {
      name: 'Protein-Rich Breakfast',
      type: 'breakfast',
      targetCalories: 400,
      targetProtein: 25,
      targetCarbs: 45,
      targetFat: 15,
      foodCategories: ['eggs', 'dairy', 'grains', 'fruits'],
      prepTime: 10,
      cookTime: 15,
      difficulty: 'easy'
    },
    {
      name: 'Balanced Lunch',
      type: 'lunch',
      targetCalories: 600,
      targetProtein: 35,
      targetCarbs: 60,
      targetFat: 20,
      foodCategories: ['protein', 'grains', 'vegetables', 'healthy-fats'],
      prepTime: 15,
      cookTime: 20,
      difficulty: 'medium'
    },
    {
      name: 'Light Dinner',
      type: 'dinner',
      targetCalories: 500,
      targetProtein: 30,
      targetCarbs: 40,
      targetFat: 25,
      foodCategories: ['protein', 'vegetables', 'healthy-fats'],
      prepTime: 20,
      cookTime: 25,
      difficulty: 'medium'
    },
    {
      name: 'Healthy Snack',
      type: 'snack',
      targetCalories: 200,
      targetProtein: 10,
      targetCarbs: 25,
      targetFat: 10,
      foodCategories: ['fruits', 'nuts', 'dairy'],
      prepTime: 5,
      cookTime: 0,
      difficulty: 'easy'
    }
  ];

  constructor() {
    this.aiService = new NimbusAIService();
  }

  async generateMealPlan(request: MealPlanRequest): Promise<MealPlan> {
    console.log('Generating real meal plan for:', request);

    // Calculate daily nutritional requirements
    const dailyRequirements = this.calculateDailyRequirements(request);
    
    // Generate meals based on requirements
    const meals = await this.generateMeals(request, dailyRequirements);
    
    // Create shopping list
    const shoppingList = this.createShoppingList(meals);
    
    // Calculate nutrition summary
    const nutritionSummary = this.calculateNutritionSummary(meals);

    const mealPlan: MealPlan = {
      id: `meal-plan-${Date.now()}`,
      name: `Personalized ${request.meals}-Day Meal Plan`,
      totalCalories: nutritionSummary.calories,
      totalProtein: nutritionSummary.protein,
      totalCarbs: nutritionSummary.carbs,
      totalFat: nutritionSummary.fat,
      meals,
      shoppingList,
      nutritionSummary
    };

    return mealPlan;
  }

  private calculateDailyRequirements(request: MealPlanRequest): NutritionalRequirements {
    const { calories, protein, carbs, fat } = request;
    
    return {
      calories,
      protein,
      carbs,
      fat,
      fiber: Math.max(25, calories * 0.014), // 14g per 1000 calories minimum
      sodium: 2300 // Daily recommended limit
    };
  }

  private async generateMeals(request: MealPlanRequest, dailyRequirements: NutritionalRequirements): Promise<MealPlan['meals']> {
    const meals: MealPlan['meals'] = [];
    const { meals: mealCount, dietaryRestrictions, preferences } = request;

    // Distribute calories across meals
    const caloriesPerMeal = dailyRequirements.calories / mealCount;
    const proteinPerMeal = dailyRequirements.protein / mealCount;
    const carbsPerMeal = dailyRequirements.carbs / mealCount;
    const fatPerMeal = dailyRequirements.fat / mealCount;

    for (let i = 0; i < mealCount; i++) {
      const mealType = this.getMealType(i, mealCount);
      const template = this.getMealTemplate(mealType);
      
      const meal = await this.generateSingleMeal({
        template,
        targetCalories: caloriesPerMeal,
        targetProtein: proteinPerMeal,
        targetCarbs: carbsPerMeal,
        targetFat: fatPerMeal,
        dietaryRestrictions,
        preferences
      });

      meals.push(meal);
    }

    return meals;
  }

  private getMealType(index: number, totalMeals: number): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
    if (totalMeals === 3) {
      return index === 0 ? 'breakfast' : index === 1 ? 'lunch' : 'dinner';
    } else if (totalMeals === 4) {
      return index === 0 ? 'breakfast' : index === 1 ? 'lunch' : index === 2 ? 'dinner' : 'snack';
    } else {
      return index === 0 ? 'breakfast' : index === 1 ? 'lunch' : 'dinner';
    }
  }

  private getMealTemplate(mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'): MealTemplate {
    return this.mealTemplates.find(template => template.type === mealType) || this.mealTemplates[0];
  }

  private async generateSingleMeal(params: {
    template: MealTemplate;
    targetCalories: number;
    targetProtein: number;
    targetCarbs: number;
    targetFat: number;
    dietaryRestrictions: string[];
    preferences: string[];
  }): Promise<MealPlan['meals'][0]> {
    const { template, targetCalories, targetProtein, targetCarbs, targetFat, dietaryRestrictions, preferences } = params;

    // Search for suitable foods based on template categories
    const ingredients: Array<{ product: RealFoodProduct; amount: number; unit: string }> = [];
    let currentCalories = 0;
    let currentProtein = 0;
    let currentCarbs = 0;
    let currentFat = 0;

    // Search for foods in each category
    for (const category of template.foodCategories) {
      const searchResults = await getRealNutritionAPI().searchFoods(category, 10);
      
      // Filter based on dietary restrictions
      const filteredProducts = searchResults.products.filter(product => 
        this.meetsDietaryRestrictions(product, dietaryRestrictions)
      );

      if (filteredProducts.length > 0) {
        // Select the best product based on nutritional needs
        const selectedProduct = this.selectBestProduct(filteredProducts, {
          targetCalories: targetCalories - currentCalories,
          targetProtein: targetProtein - currentProtein,
          targetCarbs: targetCarbs - currentCarbs,
          targetFat: targetFat - currentFat
        });

        if (selectedProduct) {
          const amount = this.calculateOptimalAmount(selectedProduct, {
            targetCalories: targetCalories - currentCalories,
            targetProtein: targetProtein - currentProtein,
            targetCarbs: targetCarbs - currentCarbs,
            targetFat: targetFat - currentFat
          });

          ingredients.push({
            product: selectedProduct,
            amount,
            unit: 'g'
          });

          // Update current nutrition
          const nutrition = selectedProduct.nutritionPer100g;
          const multiplier = amount / 100;
          currentCalories += nutrition.calories * multiplier;
          currentProtein += nutrition.protein * multiplier;
          currentCarbs += nutrition.carbs * multiplier;
          currentFat += nutrition.fat * multiplier;
        }
      }
    }

    // Generate cooking instructions using AI
    const instructions = await this.generateCookingInstructions(ingredients, template);

    return {
      name: template.name,
      type: template.type,
      calories: Math.round(currentCalories),
      protein: Math.round(currentProtein * 10) / 10,
      carbs: Math.round(currentCarbs * 10) / 10,
      fat: Math.round(currentFat * 10) / 10,
      ingredients,
      instructions,
      prepTime: template.prepTime,
      cookTime: template.cookTime,
      difficulty: template.difficulty
    };
  }

  private meetsDietaryRestrictions(product: RealFoodProduct, restrictions: string[]): boolean {
    if (restrictions.length === 0) return true;

    const productInfo = `${product.name} ${product.brand || ''} ${product.ingredients?.join(' ') || ''}`.toLowerCase();

    for (const restriction of restrictions) {
      const restrictionLower = restriction.toLowerCase();
      
      if (restrictionLower.includes('vegan')) {
        if (productInfo.includes('milk') || productInfo.includes('cheese') || productInfo.includes('egg') || productInfo.includes('meat')) {
          return false;
        }
      } else if (restrictionLower.includes('vegetarian')) {
        if (productInfo.includes('meat') || productInfo.includes('fish') || productInfo.includes('chicken')) {
          return false;
        }
      } else if (restrictionLower.includes('gluten-free')) {
        if (productInfo.includes('wheat') || productInfo.includes('gluten') || productInfo.includes('barley') || productInfo.includes('rye')) {
          return false;
        }
      } else if (restrictionLower.includes('dairy-free')) {
        if (productInfo.includes('milk') || productInfo.includes('cheese') || productInfo.includes('yogurt') || productInfo.includes('cream')) {
          return false;
        }
      }
    }

    return true;
  }

  private selectBestProduct(products: RealFoodProduct[], targets: {
    targetCalories: number;
    targetProtein: number;
    targetCarbs: number;
    targetFat: number;
  }): RealFoodProduct | null {
    if (products.length === 0) return null;

    // Score each product based on how well it matches the targets
    const scoredProducts = products.map(product => {
      const nutrition = product.nutritionPer100g;
      let score = 0;

      // Score based on protein content (higher is better for most meals)
      if (targets.targetProtein > 0) {
        score += (nutrition.protein / targets.targetProtein) * 2;
      }

      // Score based on calorie density (prefer moderate density)
      const calorieDensity = nutrition.calories / 100;
      const idealDensity = targets.targetCalories / 100;
      score += 1 - Math.abs(calorieDensity - idealDensity) / idealDensity;

      // Prefer products with more complete nutrition data
      score += Object.values(nutrition).filter(v => v > 0).length / 10;

      return { product, score };
    });

    // Return the product with the highest score
    scoredProducts.sort((a, b) => b.score - a.score);
    return scoredProducts[0]?.product || null;
  }

  private calculateOptimalAmount(product: RealFoodProduct, targets: {
    targetCalories: number;
    targetProtein: number;
    targetCarbs: number;
    targetFat: number;
  }): number {
    const nutrition = product.nutritionPer100g;
    
    // Calculate amounts based on different nutrients
    const amounts = [];
    
    if (targets.targetCalories > 0 && nutrition.calories > 0) {
      amounts.push((targets.targetCalories / nutrition.calories) * 100);
    }
    
    if (targets.targetProtein > 0 && nutrition.protein > 0) {
      amounts.push((targets.targetProtein / nutrition.protein) * 100);
    }
    
    if (targets.targetCarbs > 0 && nutrition.carbs > 0) {
      amounts.push((targets.targetCarbs / nutrition.carbs) * 100);
    }
    
    if (targets.targetFat > 0 && nutrition.fat > 0) {
      amounts.push((targets.targetFat / nutrition.fat) * 100);
    }

    // Return the average amount, but ensure it's reasonable
    const averageAmount = amounts.length > 0 ? amounts.reduce((a, b) => a + b) / amounts.length : 100;
    
    // Clamp between 25g and 500g
    return Math.max(25, Math.min(500, Math.round(averageAmount)));
  }

  private async generateCookingInstructions(ingredients: Array<{ product: RealFoodProduct; amount: number; unit: string }>, template: MealTemplate): Promise<string[]> {
    const ingredientList = ingredients.map(ing => 
      `${ing.amount}${ing.unit} ${ing.product.name}`
    ).join(', ');

    const prompt = `Create simple cooking instructions for a ${template.name} using these ingredients: ${ingredientList}.
    
    Requirements:
    - Keep instructions simple and clear
    - Total prep time should be around ${template.prepTime} minutes
    - Total cook time should be around ${template.cookTime} minutes
    - Difficulty level: ${template.difficulty}
    - Return only the numbered steps, no additional text

    Instructions:`;

    try {
      const response = await this.aiService.streamMessage(prompt);
      const instructions = response.split('\n').filter(line => 
        line.trim().match(/^\d+\./) || line.trim().match(/^-\s/)
      ).map(line => line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim());

      return instructions.length > 0 ? instructions : [
        '1. Gather all ingredients',
        '2. Prepare ingredients according to package instructions',
        '3. Combine ingredients in a suitable container',
        '4. Serve and enjoy!'
      ];
    } catch (error) {
      console.error('Failed to generate cooking instructions:', error);
      return [
        '1. Gather all ingredients',
        '2. Prepare ingredients according to package instructions',
        '3. Combine ingredients in a suitable container',
        '4. Serve and enjoy!'
      ];
    }
  }

  private createShoppingList(meals: MealPlan['meals']): MealPlan['shoppingList'] {
    const shoppingList = new Map<string, { product: RealFoodProduct; amount: number; unit: string; estimatedCost: number }>();

    meals.forEach(meal => {
      meal.ingredients.forEach(ingredient => {
        const key = ingredient.product.id;
        const existing = shoppingList.get(key);
        
        if (existing) {
          existing.amount += ingredient.amount;
        } else {
          shoppingList.set(key, {
            product: ingredient.product,
            amount: ingredient.amount,
            unit: ingredient.unit,
            estimatedCost: this.estimateCost(ingredient.product, ingredient.amount)
          });
        }
      });
    });

    return Array.from(shoppingList.values());
  }

  private estimateCost(product: RealFoodProduct, amount: number): number {
    // Simple cost estimation based on product category and amount
    const baseCosts: Record<string, number> = {
      'Dairy': 0.08, // $8/kg
      'Protein': 0.15, // $15/kg
      'Grains': 0.03, // $3/kg
      'Vegetables': 0.05, // $5/kg
      'Fruits': 0.08, // $8/kg
      'Nuts': 0.20, // $20/kg
      'Unknown': 0.10, // $10/kg default
    };

    const category = product.category || 'Unknown';
    const baseCost = baseCosts[category] || baseCosts['Unknown'];
    return Math.round((baseCost * amount / 100) * 100) / 100; // Round to 2 decimal places
  }

  private calculateNutritionSummary(meals: MealPlan['meals']): MealPlan['nutritionSummary'] {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;
    let totalSugar = 0;
    let totalSodium = 0;

    meals.forEach(meal => {
      meal.ingredients.forEach(ingredient => {
        const nutrition = ingredient.product.nutritionPer100g;
        const multiplier = ingredient.amount / 100;
        
        totalCalories += nutrition.calories * multiplier;
        totalProtein += nutrition.protein * multiplier;
        totalCarbs += nutrition.carbs * multiplier;
        totalFat += nutrition.fat * multiplier;
        totalFiber += (nutrition.fiber || 0) * multiplier;
        totalSugar += (nutrition.sugar || 0) * multiplier;
        totalSodium += (nutrition.sodium || 0) * multiplier;
      });
    });

    return {
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein * 10) / 10,
      carbs: Math.round(totalCarbs * 10) / 10,
      fat: Math.round(totalFat * 10) / 10,
      fiber: Math.round(totalFiber * 10) / 10,
      sugar: Math.round(totalSugar * 10) / 10,
      sodium: Math.round(totalSodium)
    };
  }
}

// Export singleton instance
export const realMealPlanner = new RealMealPlanner(); 