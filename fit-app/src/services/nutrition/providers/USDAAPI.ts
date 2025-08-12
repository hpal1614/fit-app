import { FoodItem, APIProvider } from '../types/nutrition.types';
import { DataFormatter } from '../utils/dataFormatter';
import { AustralianProductEnhancer } from '../utils/australianEnhancer';

export class USDAAPI implements APIProvider {
  name = 'usda';
  priority = 5;
  private baseUrl = 'https://api.nal.usda.gov/fdc/v1';
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_USDA_API_KEY || '';
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async searchFood(query: string): Promise<FoodItem[]> {
    try {
      const searchUrl = `${this.baseUrl}/foods/search?api_key=${this.apiKey}&query=${encodeURIComponent(query)}&pageSize=20&dataType=Foundation,SR Legacy`;
      
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`USDA search failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.foods || !Array.isArray(data.foods)) {
        return [];
      }

      const foodItems: FoodItem[] = [];

      for (const food of data.foods) {
        if (this.isValidFood(food)) {
          const confidence = DataFormatter.calculateConfidence(food);
          let foodItem = DataFormatter.createFoodItem(food, 'usda', confidence);
          
          // Enhance with Australian product detection
          foodItem = AustralianProductEnhancer.enhanceNutritionData(foodItem);
          
          foodItems.push(foodItem);
        }
      }

      return foodItems.sort((a, b) => b.confidence - a.confidence);

    } catch (error) {
      console.error('USDA search error:', error);
      return [];
    }
  }

  async lookupBarcode(barcode: string): Promise<FoodItem | null> {
    try {
      const barcodeUrl = `${this.baseUrl}/foods/search?api_key=${this.apiKey}&query=${barcode}&dataType=Foundation,SR Legacy`;
      
      const response = await fetch(barcodeUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // Food not found
        }
        throw new Error(`USDA barcode lookup failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.foods || !Array.isArray(data.foods) || data.foods.length === 0) {
        return null;
      }

      const food = data.foods[0]; // Get the first result
      
      if (!this.isValidFood(food)) {
        return null;
      }

      const confidence = DataFormatter.calculateConfidence(food);
      let foodItem = DataFormatter.createFoodItem(food, 'usda', confidence);
      
      // Enhance with Australian product detection
      foodItem = AustralianProductEnhancer.enhanceNutritionData(foodItem);
      
      return foodItem;

    } catch (error) {
      console.error('USDA barcode lookup error:', error);
      return null;
    }
  }

  async getUsageStats(): Promise<{ callsToday: number; quota: number; remaining: number }> {
    // USDA has unlimited free calls
    return {
      callsToday: 0, // This would need to be tracked by the quota manager
      quota: Infinity,
      remaining: Infinity
    };
  }

  // Get food by USDA ID
  async getFoodByID(foodId: string): Promise<FoodItem | null> {
    try {
      const foodUrl = `${this.baseUrl}/food/${foodId}?api_key=${this.apiKey}`;
      
      const response = await fetch(foodUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        return null;
      }

      const food = await response.json();
      
      if (!this.isValidFood(food)) {
        return null;
      }

      const confidence = DataFormatter.calculateConfidence(food);
      let foodItem = DataFormatter.createFoodItem(food, 'usda', confidence);
      
      // Enhance with Australian product detection
      foodItem = AustralianProductEnhancer.enhanceNutritionData(foodItem);
      
      return foodItem;

    } catch (error) {
      console.error('USDA food lookup error:', error);
      return null;
    }
  }

  // Search by brand
  async searchByBrand(brand: string): Promise<FoodItem[]> {
    try {
      const brandUrl = `${this.baseUrl}/foods/search?api_key=${this.apiKey}&query=${encodeURIComponent(brand)}&pageSize=20&dataType=Foundation,SR Legacy`;
      
      const response = await fetch(brandUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`USDA brand search failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.foods || !Array.isArray(data.foods)) {
        return [];
      }

      const foodItems: FoodItem[] = [];

      for (const food of data.foods) {
        if (this.isValidFood(food) && food.brandOwner && food.brandOwner.toLowerCase().includes(brand.toLowerCase())) {
          const confidence = DataFormatter.calculateConfidence(food);
          let foodItem = DataFormatter.createFoodItem(food, 'usda', confidence);
          
          // Enhance with Australian product detection
          foodItem = AustralianProductEnhancer.enhanceNutritionData(foodItem);
          
          foodItems.push(foodItem);
        }
      }

      return foodItems.sort((a, b) => b.confidence - a.confidence);

    } catch (error) {
      console.error('USDA brand search error:', error);
      return [];
    }
  }

  // Get food categories
  async getFoodCategories(): Promise<string[]> {
    try {
      const categoriesUrl = `${this.baseUrl}/foodCategories?api_key=${this.apiKey}`;
      
      const response = await fetch(categoriesUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`USDA categories request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data || !Array.isArray(data)) {
        return [];
      }

      return data.map((category: any) => category.description).filter(Boolean);

    } catch (error) {
      console.error('USDA categories error:', error);
      return [];
    }
  }

  // Search by category
  async searchByCategory(category: string): Promise<FoodItem[]> {
    try {
      const categoryUrl = `${this.baseUrl}/foods/search?api_key=${this.apiKey}&query=${encodeURIComponent(category)}&pageSize=20&dataType=Foundation,SR Legacy`;
      
      const response = await fetch(categoryUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`USDA category search failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.foods || !Array.isArray(data.foods)) {
        return [];
      }

      const foodItems: FoodItem[] = [];

      for (const food of data.foods) {
        if (this.isValidFood(food)) {
          const confidence = DataFormatter.calculateConfidence(food);
          let foodItem = DataFormatter.createFoodItem(food, 'usda', confidence);
          
          // Enhance with Australian product detection
          foodItem = AustralianProductEnhancer.enhanceNutritionData(foodItem);
          
          foodItems.push(foodItem);
        }
      }

      return foodItems.sort((a, b) => b.confidence - a.confidence);

    } catch (error) {
      console.error('USDA category search error:', error);
      return [];
    }
  }

  // Get detailed nutrition information
  async getDetailedNutrition(foodId: string): Promise<any> {
    try {
      const nutritionUrl = `${this.baseUrl}/food/${foodId}?api_key=${this.apiKey}&format=full&nutrients=203,204,205,208,269,291,307,320,401,404,405,406,415,418,430,435,301,303,304,305,306,309`;
      
      const response = await fetch(nutritionUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();

    } catch (error) {
      console.error('USDA detailed nutrition error:', error);
      return null;
    }
  }

  // Check if food has complete nutrition data
  private isValidFood(food: any): boolean {
    if (!food || !food.description) {
      return false;
    }

    // Check for basic nutrition information
    const hasBasicNutrition = (
      food.foodNutrients &&
      Array.isArray(food.foodNutrients) &&
      food.foodNutrients.length > 0
    );

    if (!hasBasicNutrition) {
      return false;
    }

    // Check if food is not empty or placeholder
    const name = food.description.toLowerCase();
    const invalidNames = ['unknown', 'placeholder', 'test', 'sample', 'example'];
    
    return !invalidNames.some(invalid => name.includes(invalid));
  }

  // Extract nutrition data from USDA format
  private extractNutritionData(food: any): any {
    const nutrients = food.foodNutrients || [];
    const nutrientMap: { [key: string]: number } = {};
    
    nutrients.forEach((nutrient: any) => {
      if (nutrient.nutrientId && nutrient.value !== undefined) {
        // Map USDA nutrient IDs to our format
        const nutrientId = nutrient.nutrientId;
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
      id: food.fdcId,
      name: food.description,
      brand: food.brandOwner,
      calories: nutrientMap['calories'] || 0,
      protein: nutrientMap['protein'] || 0,
      carbs: nutrientMap['carbs'] || 0,
      fat: nutrientMap['fat'] || 0,
      fiber: nutrientMap['fiber'] || 0,
      sugar: nutrientMap['sugar'] || 0,
      sodium: nutrientMap['sodium'] || 0,
      serving_size: food.servingSize ? `${food.servingSize} ${food.servingSizeUnit}` : '100g',
      barcode: food.gtinUpc,
      image: null, // USDA doesn't provide images
      verified: true, // USDA data is official and verified
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
