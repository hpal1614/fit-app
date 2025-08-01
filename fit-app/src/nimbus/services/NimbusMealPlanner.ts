import { NimbusAIService } from './NimbusAIService';
import {
  NimbusMealPlanRequest,
  NimbusMealPlan,
  NimbusMealType,
  NimbusQuickMeal
} from '../../types/nimbus/NimbusNutrition';

// Simulated Australian food database for ingredient validation (future expansion)
class AustralianFoodDatabase {
  // ...
}

export class NimbusMealPlanner {
  private aiService: NimbusAIService;
  private nutritionDB: AustralianFoodDatabase;

  constructor() {
    this.aiService = new NimbusAIService();
    this.nutritionDB = new AustralianFoodDatabase();
  }

  async generateMealPlan(request: NimbusMealPlanRequest): Promise<NimbusMealPlan> {
    const prompt = this.buildMealPlanPrompt(request);
    let mealPlanResponse = '';

    // Use streaming for future UI, but for now just collect the full response
    for await (const chunk of this.aiService.streamMessage(prompt)) {
      mealPlanResponse += chunk;
    }

    // Try to parse JSON from the AI response
    const jsonStart = mealPlanResponse.indexOf('{');
    const jsonEnd = mealPlanResponse.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      try {
        return JSON.parse(mealPlanResponse.slice(jsonStart, jsonEnd + 1));
      } catch (e) {
        throw new Error('Failed to parse AI meal plan response');
      }
    }
    throw new Error('No valid meal plan JSON found in AI response');
  }

  private buildMealPlanPrompt(request: NimbusMealPlanRequest): string {
    return `Create a detailed meal plan for Australian ingredients using the Nimbus nutrition app.\n\nREQUIREMENTS:\n- Daily Calories: ${request.macroTargets.dailyCalories}\n- Protein: ${request.macroTargets.proteinGrams}g\n- Carbs: ${request.macroTargets.carbsGrams}g\n- Fat: ${request.macroTargets.fatGrams}g\n- Days: ${request.daysCount}\n- Dietary Restrictions: ${request.dietaryRestrictions.join(', ') || 'None'}\n- Cooking Skill: ${request.cookingSkill}\n- Time per meal: ${request.maxCookingTime} minutes\n- Budget: $${request.weeklyBudget} AUD per week\n\nPREFERENCES:\n- Use Australian brands and ingredients when possible\n- Include foods available at Coles and Woolworths\n- Consider seasonal Australian produce\n- Provide realistic portion sizes\n- Include prep instructions for busy lifestyles\n\nFORMAT: Return structured JSON with this schema:\n{\n  "totalDays": number,\n  "weeklyNutritionSummary": {\n    "avgDailyCalories": number,\n    "avgDailyProtein": number,\n    "avgDailyCarbs": number,\n    "avgDailyFat": number\n  },\n  "days": [\n    {\n      "day": number,\n      "meals": {\n        "breakfast": {\n          "name": "meal name",\n          "ingredients": [\n            {"item": "ingredient", "amount": number, "unit": "g/ml/etc", "calories": number}\n          ],\n          "instructions": ["step 1", "step 2"],\n          "prepTime": number,\n          "nutrition": {"calories": number, "protein": number, "carbs": number, "fat": number}\n        },\n        "lunch": {...},\n        "dinner": {...},\n        "snacks": [...]\n      }\n    }\n  ],\n  "shoppingList": [\n    {"item": "ingredient", "totalAmount": number, "unit": "unit", "estimatedCost": number}\n  ],\n  "weeklyPrepTips": ["tip 1", "tip 2"]\n}`;
  }

  async generateQuickMeal(
    mealType: NimbusMealType,
    calorieTarget: number,
    restrictions: string[] = []
  ): Promise<NimbusQuickMeal> {
    const prompt = `Generate a quick ${mealType} meal for ${calorieTarget} calories.\n\nRestrictions: ${restrictions.join(', ') || 'None'}\nRequirements:\n- Under 15 minutes preparation  \n- Australian ingredients from Coles/Woolworths\n- Balanced macronutrients\n- Simple instructions\n\nReturn JSON: {\n  "name": "meal name",\n  "prepTime": minutes,\n  "ingredients": [{"item": "name", "amount": number, "unit": "unit", "estimated_calories": number}],\n  "instructions": ["step by step"],\n  "nutrition": {"calories": number, "protein": number, "carbs": number, "fat": number},\n  "tips": ["helpful tips"]\n}`;

    let response = '';
    for await (const chunk of this.aiService.streamMessage(prompt)) {
      response += chunk;
    }
    // Try to parse JSON from the AI response
    const jsonStart = response.indexOf('{');
    const jsonEnd = response.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      try {
        return JSON.parse(response.slice(jsonStart, jsonEnd + 1));
      } catch (e) {
        throw new Error('Failed to parse AI quick meal response');
      }
    }
    throw new Error('No valid quick meal JSON found in AI response');
  }
}

export const nimbusMealPlanner = new NimbusMealPlanner();