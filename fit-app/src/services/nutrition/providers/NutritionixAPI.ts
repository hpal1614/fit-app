import { FoodItem, APIProvider } from '../types/nutrition.types';
import { DataFormatter } from '../utils/dataFormatter';
import { AustralianProductEnhancer } from '../utils/australianEnhancer';

export class NutritionixAPI implements APIProvider {
  name = 'nutritionix';
  priority = 4;
  private baseUrl = 'https://trackapi.nutritionix.com/v2';
  private appId: string;
  private appKey: string;

  constructor() {
    this.appId = import.meta.env.VITE_NUTRITIONIX_APP_ID || '';
    this.appKey = import.meta.env.VITE_NUTRITIONIX_APP_KEY || '';
  }

  isAvailable(): boolean {
    return !!(this.appId && this.appKey);
  }

  async searchFood(query: string): Promise<FoodItem[]> {
    try {
      const searchUrl = `${this.baseUrl}/search/instant`;
      
      const response = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-id': this.appId,
          'x-app-key': this.appKey,
          'x-remote-user-id': '0'
        },
        body: JSON.stringify({
          query: query,
          detailed: true,
          branded: true,
          common: true
        })
      });

      if (!response.ok) {
        throw new Error(`Nutritionix search failed: ${response.status}`);
      }

      const data = await response.json();
      
      const foodItems: FoodItem[] = [];

      // Process branded foods
      if (data.branded && Array.isArray(data.branded)) {
        for (const food of data.branded) {
          if (this.isValidFood(food)) {
            const confidence = DataFormatter.calculateConfidence(food);
            let foodItem = DataFormatter.createFoodItem(food, 'nutritionix', confidence);
            
            // Enhance with Australian product detection
            foodItem = AustralianProductEnhancer.enhanceNutritionData(foodItem);
            
            foodItems.push(foodItem);
          }
        }
      }

      // Process common foods
      if (data.common && Array.isArray(data.common)) {
        for (const food of data.common) {
          if (this.isValidFood(food)) {
            const confidence = DataFormatter.calculateConfidence(food);
            let foodItem = DataFormatter.createFoodItem(food, 'nutritionix', confidence);
            
            // Enhance with Australian product detection
            foodItem = AustralianProductEnhancer.enhanceNutritionData(foodItem);
            
            foodItems.push(foodItem);
          }
        }
      }

      return foodItems.sort((a, b) => b.confidence - a.confidence);

    } catch (error) {
      console.error('Nutritionix search error:', error);
      return [];
    }
  }

  async lookupBarcode(barcode: string): Promise<FoodItem | null> {
    try {
      const barcodeUrl = `${this.baseUrl}/search/item`;
      
      const response = await fetch(barcodeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-id': this.appId,
          'x-app-key': this.appKey,
          'x-remote-user-id': '0'
        },
        body: JSON.stringify({
          upc: barcode
        })
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // Food not found
        }
        throw new Error(`Nutritionix barcode lookup failed: ${response.status}`);
      }

      const food = await response.json();
      
      if (!this.isValidFood(food)) {
        return null;
      }

      const confidence = DataFormatter.calculateConfidence(food);
      let foodItem = DataFormatter.createFoodItem(food, 'nutritionix', confidence);
      
      // Enhance with Australian product detection
      foodItem = AustralianProductEnhancer.enhanceNutritionData(foodItem);
      
      return foodItem;

    } catch (error) {
      console.error('Nutritionix barcode lookup error:', error);
      return null;
    }
  }

  async getUsageStats(): Promise<{ callsToday: number; quota: number; remaining: number }> {
    // Nutritionix has 500 free calls per month
    return {
      callsToday: 0, // This would need to be tracked by the quota manager
      quota: 500,
      remaining: 500
    };
  }

  // Get food by Nutritionix ID
  async getFoodByID(foodId: string): Promise<FoodItem | null> {
    try {
      const foodUrl = `${this.baseUrl}/search/item`;
      
      const response = await fetch(foodUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-id': this.appId,
          'x-app-key': this.appKey,
          'x-remote-user-id': '0'
        },
        body: JSON.stringify({
          nix_item_id: foodId
        })
      });

      if (!response.ok) {
        return null;
      }

      const food = await response.json();
      
      if (!this.isValidFood(food)) {
        return null;
      }

      const confidence = DataFormatter.calculateConfidence(food);
      let foodItem = DataFormatter.createFoodItem(food, 'nutritionix', confidence);
      
      // Enhance with Australian product detection
      foodItem = AustralianProductEnhancer.enhanceNutritionData(foodItem);
      
      return foodItem;

    } catch (error) {
      console.error('Nutritionix food lookup error:', error);
      return null;
    }
  }

  // Search by brand
  async searchByBrand(brand: string): Promise<FoodItem[]> {
    try {
      const brandUrl = `${this.baseUrl}/search/instant`;
      
      const response = await fetch(brandUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-id': this.appId,
          'x-app-key': this.appKey,
          'x-remote-user-id': '0'
        },
        body: JSON.stringify({
          query: brand,
          detailed: true,
          branded: true,
          common: false
        })
      });

      if (!response.ok) {
        throw new Error(`Nutritionix brand search failed: ${response.status}`);
      }

      const data = await response.json();
      
      const foodItems: FoodItem[] = [];

      if (data.branded && Array.isArray(data.branded)) {
        for (const food of data.branded) {
          if (this.isValidFood(food) && food.brand_name && food.brand_name.toLowerCase().includes(brand.toLowerCase())) {
            const confidence = DataFormatter.calculateConfidence(food);
            let foodItem = DataFormatter.createFoodItem(food, 'nutritionix', confidence);
            
            // Enhance with Australian product detection
            foodItem = AustralianProductEnhancer.enhanceNutritionData(foodItem);
            
            foodItems.push(foodItem);
          }
        }
      }

      return foodItems.sort((a, b) => b.confidence - a.confidence);

    } catch (error) {
      console.error('Nutritionix brand search error:', error);
      return [];
    }
  }

  // Get natural language processing results
  async getNaturalLanguageResults(query: string): Promise<FoodItem[]> {
    try {
      const nlpUrl = `${this.baseUrl}/natural/nutrients`;
      
      const response = await fetch(nlpUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-id': this.appId,
          'x-app-key': this.appKey,
          'x-remote-user-id': '0'
        },
        body: JSON.stringify({
          query: query
        })
      });

      if (!response.ok) {
        throw new Error(`Nutritionix NLP failed: ${response.status}`);
      }

      const data = await response.json();
      
      const foodItems: FoodItem[] = [];

      if (data.foods && Array.isArray(data.foods)) {
        for (const food of data.foods) {
          if (this.isValidFood(food)) {
            const confidence = DataFormatter.calculateConfidence(food);
            let foodItem = DataFormatter.createFoodItem(food, 'nutritionix', confidence);
            
            // Enhance with Australian product detection
            foodItem = AustralianProductEnhancer.enhanceNutritionData(foodItem);
            
            foodItems.push(foodItem);
          }
        }
      }

      return foodItems.sort((a, b) => b.confidence - a.confidence);

    } catch (error) {
      console.error('Nutritionix NLP error:', error);
      return [];
    }
  }

  // Get exercise information (bonus feature)
  async searchExercises(query: string): Promise<any[]> {
    try {
      const exerciseUrl = `${this.baseUrl}/search/exercise`;
      
      const response = await fetch(exerciseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-id': this.appId,
          'x-app-key': this.appKey,
          'x-remote-user-id': '0'
        },
        body: JSON.stringify({
          query: query
        })
      });

      if (!response.ok) {
        throw new Error(`Nutritionix exercise search failed: ${response.status}`);
      }

      const data = await response.json();
      
      return data.exercises || [];

    } catch (error) {
      console.error('Nutritionix exercise search error:', error);
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
      food.nix_item_id || food.full_nutrients
    );

    if (!hasBasicNutrition) {
      return false;
    }

    // Check if food is not empty or placeholder
    const name = food.food_name.toLowerCase();
    const invalidNames = ['unknown', 'placeholder', 'test', 'sample', 'example'];
    
    return !invalidNames.some(invalid => name.includes(invalid));
  }

  // Extract nutrition data from Nutritionix format
  private extractNutritionData(food: any): any {
    // Nutritionix provides nutrients in a specific format
    const nutrients = food.full_nutrients || [];
    const nutrientMap: { [key: string]: number } = {};
    
    nutrients.forEach((nutrient: any) => {
      if (nutrient.attr_id && nutrient.value !== undefined) {
        // Map Nutritionix nutrient IDs to our format
        const nutrientId = nutrient.attr_id;
        switch (nutrientId) {
          case 208: // Calories
            nutrientMap['calories'] = nutrient.value;
            break;
          case 203: // Protein
            nutrientMap['protein'] = nutrient.value;
            break;
          case 205: // Carbohydrates
            nutrientMap['carbs'] = nutrient.value;
            break;
          case 204: // Fat
            nutrientMap['fat'] = nutrient.value;
            break;
          case 291: // Fiber
            nutrientMap['fiber'] = nutrient.value;
            break;
          case 269: // Sugars
            nutrientMap['sugar'] = nutrient.value;
            break;
          case 307: // Sodium
            nutrientMap['sodium'] = nutrient.value;
            break;
          case 320: // Vitamin A
            nutrientMap['vitaminA'] = nutrient.value;
            break;
          case 401: // Vitamin C
            nutrientMap['vitaminC'] = nutrient.value;
            break;
          case 328: // Vitamin D
            nutrientMap['vitaminD'] = nutrient.value;
            break;
          case 323: // Vitamin E
            nutrientMap['vitaminE'] = nutrient.value;
            break;
          case 430: // Vitamin K
            nutrientMap['vitaminK'] = nutrient.value;
            break;
          case 404: // Thiamin
            nutrientMap['thiamin'] = nutrient.value;
            break;
          case 405: // Riboflavin
            nutrientMap['riboflavin'] = nutrient.value;
            break;
          case 406: // Niacin
            nutrientMap['niacin'] = nutrient.value;
            break;
          case 415: // Vitamin B6
            nutrientMap['vitaminB6'] = nutrient.value;
            break;
          case 435: // Folate
            nutrientMap['folate'] = nutrient.value;
            break;
          case 418: // Vitamin B12
            nutrientMap['vitaminB12'] = nutrient.value;
            break;
          case 301: // Calcium
            nutrientMap['calcium'] = nutrient.value;
            break;
          case 303: // Iron
            nutrientMap['iron'] = nutrient.value;
            break;
          case 304: // Magnesium
            nutrientMap['magnesium'] = nutrient.value;
            break;
          case 305: // Phosphorus
            nutrientMap['phosphorus'] = nutrient.value;
            break;
          case 306: // Potassium
            nutrientMap['potassium'] = nutrient.value;
            break;
          case 309: // Zinc
            nutrientMap['zinc'] = nutrient.value;
            break;
        }
      }
    });

    return {
      id: food.nix_item_id || food.food_name,
      name: food.food_name,
      brand: food.brand_name,
      calories: nutrientMap['calories'] || 0,
      protein: nutrientMap['protein'] || 0,
      carbs: nutrientMap['carbs'] || 0,
      fat: nutrientMap['fat'] || 0,
      fiber: nutrientMap['fiber'] || 0,
      sugar: nutrientMap['sugar'] || 0,
      sodium: nutrientMap['sodium'] || 0,
      serving_size: food.serving_unit || '100g',
      barcode: food.upc,
      image: food.photo && food.photo.thumb ? food.photo.thumb : null,
      verified: true, // Nutritionix data is generally verified
      // Additional nutrition facts
      nutritionFacts: {
        vitaminA: nutrientMap['vitaminA'],
        vitaminC: nutrientMap['vitaminC'],
        vitaminD: nutrientMap['vitaminD'],
        vitaminE: nutrientMap['vitaminE'],
        vitaminK: nutrientMap['vitaminK'],
        thiamin: nutrientMap['thiamin'],
        riboflavin: nutrientMap['riboflavin'],
        niacin: nutrientMap['niacin'],
        vitaminB6: nutrientMap['vitaminB6'],
        folate: nutrientMap['folate'],
        vitaminB12: nutrientMap['vitaminB12'],
        calcium: nutrientMap['calcium'],
        iron: nutrientMap['iron'],
        magnesium: nutrientMap['magnesium'],
        phosphorus: nutrientMap['phosphorus'],
        potassium: nutrientMap['potassium'],
        zinc: nutrientMap['zinc']
      }
    };
  }
}
