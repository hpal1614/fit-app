import { FoodItem, APIProvider } from '../types/nutrition.types';
import { DataFormatter } from '../utils/dataFormatter';
import { AustralianProductEnhancer } from '../utils/australianEnhancer';
import OAuth from 'oauth-1.0a';
import CryptoJS from 'crypto-js';

export class FatSecretAPI implements APIProvider {
  name = 'fatsecret';
  priority = 2;
  private baseUrl = 'https://platform.fatsecret.com/rest/server.api';
  private consumerKey: string;
  private consumerSecret: string;
  private oauth: OAuth;

  constructor() {
    this.consumerKey = import.meta.env.VITE_FATSECRET_CONSUMER_KEY || '';
    this.consumerSecret = import.meta.env.VITE_FATSECRET_CONSUMER_SECRET || '';
    
    this.oauth = new OAuth({
      consumer: {
        key: this.consumerKey,
        secret: this.consumerSecret
      },
      signature_method: 'HMAC-SHA1',
      hash_function(base_string, key) {
        return CryptoJS.HmacSHA1(base_string, key).toString(CryptoJS.enc.Base64);
      }
    });
  }

  isAvailable(): boolean {
    return !!(this.consumerKey && this.consumerSecret);
  }

  async searchFood(query: string): Promise<FoodItem[]> {
    try {
      const params = {
        method: 'foods.search',
        search_expression: query,
        format: 'json',
        max_results: '20'
      };

      const request_data = {
        url: this.baseUrl,
        method: 'POST',
        data: params
      };

      const headers = this.oauth.toHeader(this.oauth.authorize(request_data));

      const formData = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`FatSecret search failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.foods || !data.foods.food) {
        return [];
      }

      const foods = Array.isArray(data.foods.food) ? data.foods.food : [data.foods.food];
      const foodItems: FoodItem[] = [];

      for (const food of foods) {
        if (this.isValidFood(food)) {
          const confidence = DataFormatter.calculateConfidence(food);
          let foodItem = DataFormatter.createFoodItem(food, 'fatsecret', confidence);
          
          // Enhance with Australian product detection
          foodItem = AustralianProductEnhancer.enhanceNutritionData(foodItem);
          
          foodItems.push(foodItem);
        }
      }

      return foodItems.sort((a, b) => b.confidence - a.confidence);

    } catch (error) {
      console.error('FatSecret search error:', error);
      return [];
    }
  }

  async lookupBarcode(barcode: string): Promise<FoodItem | null> {
    try {
      const params = {
        method: 'food.get.v2',
        food_id: barcode,
        format: 'json'
      };

      const request_data = {
        url: this.baseUrl,
        method: 'POST',
        data: params
      };

      const headers = this.oauth.toHeader(this.oauth.authorize(request_data));

      const formData = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // Food not found
        }
        throw new Error(`FatSecret barcode lookup failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.food) {
        return null;
      }

      const food = data.food;
      
      if (!this.isValidFood(food)) {
        return null;
      }

      const confidence = DataFormatter.calculateConfidence(food);
      let foodItem = DataFormatter.createFoodItem(food, 'fatsecret', confidence);
      
      // Enhance with Australian product detection
      foodItem = AustralianProductEnhancer.enhanceNutritionData(foodItem);
      
      return foodItem;

    } catch (error) {
      console.error('FatSecret barcode lookup error:', error);
      return null;
    }
  }

  async getUsageStats(): Promise<{ callsToday: number; quota: number; remaining: number }> {
    // FatSecret has 5,000 free calls per day
    return {
      callsToday: 0, // This would need to be tracked by the quota manager
      quota: 5000,
      remaining: 5000
    };
  }

  // Get food by FatSecret ID
  async getFoodByID(foodId: string): Promise<FoodItem | null> {
    try {
      const params = {
        method: 'food.get.v2',
        food_id: foodId,
        format: 'json'
      };

      const request_data = {
        url: this.baseUrl,
        method: 'POST',
        data: params
      };

      const headers = this.oauth.toHeader(this.oauth.authorize(request_data));

      const formData = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      if (!data.food) {
        return null;
      }

      const food = data.food;
      
      if (!this.isValidFood(food)) {
        return null;
      }

      const confidence = DataFormatter.calculateConfidence(food);
      let foodItem = DataFormatter.createFoodItem(food, 'fatsecret', confidence);
      
      // Enhance with Australian product detection
      foodItem = AustralianProductEnhancer.enhanceNutritionData(foodItem);
      
      return foodItem;

    } catch (error) {
      console.error('FatSecret food lookup error:', error);
      return null;
    }
  }

  // Search by brand
  async searchByBrand(brand: string): Promise<FoodItem[]> {
    try {
      const params = {
        method: 'foods.search',
        search_expression: brand,
        format: 'json',
        max_results: '20'
      };

      const request_data = {
        url: this.baseUrl,
        method: 'POST',
        data: params
      };

      const headers = this.oauth.toHeader(this.oauth.authorize(request_data));

      const formData = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`FatSecret brand search failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.foods || !data.foods.food) {
        return [];
      }

      const foods = Array.isArray(data.foods.food) ? data.foods.food : [data.foods.food];
      const foodItems: FoodItem[] = [];

      for (const food of foods) {
        if (this.isValidFood(food) && food.brand_name && food.brand_name.toLowerCase().includes(brand.toLowerCase())) {
          const confidence = DataFormatter.calculateConfidence(food);
          let foodItem = DataFormatter.createFoodItem(food, 'fatsecret', confidence);
          
          // Enhance with Australian product detection
          foodItem = AustralianProductEnhancer.enhanceNutritionData(foodItem);
          
          foodItems.push(foodItem);
        }
      }

      return foodItems.sort((a, b) => b.confidence - a.confidence);

    } catch (error) {
      console.error('FatSecret brand search error:', error);
      return [];
    }
  }

  // Get food categories
  async getFoodCategories(): Promise<string[]> {
    try {
      const params = {
        method: 'food_categories.get',
        format: 'json'
      };

      const request_data = {
        url: this.baseUrl,
        method: 'POST',
        data: params
      };

      const headers = this.oauth.toHeader(this.oauth.authorize(request_data));

      const formData = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`FatSecret categories request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.food_categories || !data.food_categories.food_category) {
        return [];
      }

      const categories = Array.isArray(data.food_categories.food_category) 
        ? data.food_categories.food_category 
        : [data.food_categories.food_category];

      return categories.map((cat: any) => cat.food_category_name).filter(Boolean);

    } catch (error) {
      console.error('FatSecret categories error:', error);
      return [];
    }
  }

  // Check if food has complete nutrition data
  private isValidFood(food: any): boolean {
    if (!food || !food.food_name) {
      return false;
    }

    // Check for basic nutrition information
    const hasBasicNutrition = (
      food.servings && 
      food.servings.serving && 
      (Array.isArray(food.servings.serving) ? food.servings.serving[0] : food.servings.serving)
    );

    if (!hasBasicNutrition) {
      return false;
    }

    // Check if food is not empty or placeholder
    const name = food.food_name.toLowerCase();
    const invalidNames = ['unknown', 'placeholder', 'test', 'sample', 'example'];
    
    return !invalidNames.some(invalid => name.includes(invalid));
  }

  // Extract nutrition data from FatSecret format
  private extractNutritionData(food: any): any {
    const serving = Array.isArray(food.servings.serving) 
      ? food.servings.serving[0] 
      : food.servings.serving;

    const nutrition = serving.serving_description || {};
    
    return {
      id: food.food_id,
      name: food.food_name,
      brand: food.brand_name,
      calories: nutrition.calories || 0,
      protein: nutrition.protein || 0,
      carbs: nutrition.carbohydrate || 0,
      fat: nutrition.fat || 0,
      fiber: nutrition.fiber || 0,
      sugar: nutrition.sugar || 0,
      sodium: nutrition.sodium || 0,
      serving_size: serving.serving_description || '1 serving',
      barcode: food.food_id,
      image: food.food_url,
      verified: true, // FatSecret data is generally verified
      // Additional nutrition facts
      nutritionFacts: {
        vitaminA: nutrition.vitamin_a,
        vitaminC: nutrition.vitamin_c,
        vitaminD: nutrition.vitamin_d,
        vitaminE: nutrition.vitamin_e,
        vitaminK: nutrition.vitamin_k,
        thiamin: nutrition.thiamin,
        riboflavin: nutrition.riboflavin,
        niacin: nutrition.niacin,
        vitaminB6: nutrition.vitamin_b6,
        folate: nutrition.folate,
        vitaminB12: nutrition.vitamin_b12,
        calcium: nutrition.calcium,
        iron: nutrition.iron,
        magnesium: nutrition.magnesium,
        phosphorus: nutrition.phosphorus,
        potassium: nutrition.potassium,
        zinc: nutrition.zinc
      }
    };
  }
}
