import { FoodItem, APIProvider } from '../types/nutrition.types';
import { DataFormatter } from '../utils/dataFormatter';
import { AustralianProductEnhancer } from '../utils/australianEnhancer';

export class SpoonacularAPI implements APIProvider {
  name = 'spoonacular';
  priority = 3;
  private baseUrl = 'https://api.spoonacular.com/food';
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_SPOONACULAR_API_KEY || '';
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async searchFood(query: string): Promise<FoodItem[]> {
    try {
      const searchUrl = `${this.baseUrl}/products/search?query=${encodeURIComponent(query)}&apiKey=${this.apiKey}&number=20&addProductInformation=true`;
      
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Spoonacular search failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.products || !Array.isArray(data.products)) {
        return [];
      }

      const foodItems: FoodItem[] = [];

      for (const product of data.products) {
        if (this.isValidProduct(product)) {
          const confidence = DataFormatter.calculateConfidence(product);
          let foodItem = DataFormatter.createFoodItem(product, 'spoonacular', confidence);
          
          // Enhance with Australian product detection
          foodItem = AustralianProductEnhancer.enhanceNutritionData(foodItem);
          
          foodItems.push(foodItem);
        }
      }

      return foodItems.sort((a, b) => b.confidence - a.confidence);

    } catch (error) {
      console.error('Spoonacular search error:', error);
      return [];
    }
  }

  async lookupBarcode(barcode: string): Promise<FoodItem | null> {
    try {
      const barcodeUrl = `${this.baseUrl}/products/upc/${barcode}?apiKey=${this.apiKey}`;
      
      const response = await fetch(barcodeUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // Product not found
        }
        throw new Error(`Spoonacular barcode lookup failed: ${response.status}`);
      }

      const product = await response.json();
      
      if (!this.isValidProduct(product)) {
        return null;
      }

      const confidence = DataFormatter.calculateConfidence(product);
      let foodItem = DataFormatter.createFoodItem(product, 'spoonacular', confidence);
      
      // Enhance with Australian product detection
      foodItem = AustralianProductEnhancer.enhanceNutritionData(foodItem);
      
      return foodItem;

    } catch (error) {
      console.error('Spoonacular barcode lookup error:', error);
      return null;
    }
  }

  async getUsageStats(): Promise<{ callsToday: number; quota: number; remaining: number }> {
    // Spoonacular has 150 free calls per day
    return {
      callsToday: 0, // This would need to be tracked by the quota manager
      quota: 150,
      remaining: 150
    };
  }

  // Get product by Spoonacular ID
  async getProductByID(productId: string): Promise<FoodItem | null> {
    try {
      const productUrl = `${this.baseUrl}/products/${productId}?apiKey=${this.apiKey}`;
      
      const response = await fetch(productUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        return null;
      }

      const product = await response.json();
      
      if (!this.isValidProduct(product)) {
        return null;
      }

      const confidence = DataFormatter.calculateConfidence(product);
      let foodItem = DataFormatter.createFoodItem(product, 'spoonacular', confidence);
      
      // Enhance with Australian product detection
      foodItem = AustralianProductEnhancer.enhanceNutritionData(foodItem);
      
      return foodItem;

    } catch (error) {
      console.error('Spoonacular product lookup error:', error);
      return null;
    }
  }

  // Search by brand
  async searchByBrand(brand: string): Promise<FoodItem[]> {
    try {
      const brandUrl = `${this.baseUrl}/products/search?query=${encodeURIComponent(brand)}&apiKey=${this.apiKey}&number=20&addProductInformation=true`;
      
      const response = await fetch(brandUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Spoonacular brand search failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.products || !Array.isArray(data.products)) {
        return [];
      }

      const foodItems: FoodItem[] = [];

      for (const product of data.products) {
        if (this.isValidProduct(product) && product.brand && product.brand.toLowerCase().includes(brand.toLowerCase())) {
          const confidence = DataFormatter.calculateConfidence(product);
          let foodItem = DataFormatter.createFoodItem(product, 'spoonacular', confidence);
          
          // Enhance with Australian product detection
          foodItem = AustralianProductEnhancer.enhanceNutritionData(foodItem);
          
          foodItems.push(foodItem);
        }
      }

      return foodItems.sort((a, b) => b.confidence - a.confidence);

    } catch (error) {
      console.error('Spoonacular brand search error:', error);
      return [];
    }
  }

  // Get product nutrition information
  async getProductNutrition(productId: string): Promise<any> {
    try {
      const nutritionUrl = `${this.baseUrl}/products/${productId}/nutritionWidget.json?apiKey=${this.apiKey}`;
      
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
      console.error('Spoonacular nutrition lookup error:', error);
      return null;
    }
  }

  // Get product ingredients
  async getProductIngredients(productId: string): Promise<any> {
    try {
      const ingredientsUrl = `${this.baseUrl}/products/${productId}/ingredientWidget.json?apiKey=${this.apiKey}`;
      
      const response = await fetch(ingredientsUrl, {
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
      console.error('Spoonacular ingredients lookup error:', error);
      return null;
    }
  }

  // Search recipes (useful for meal planning)
  async searchRecipes(query: string, maxResults: number = 10): Promise<any[]> {
    try {
      const recipeUrl = `https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(query)}&apiKey=${this.apiKey}&number=${maxResults}&addRecipeInformation=true`;
      
      const response = await fetch(recipeUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Spoonacular recipe search failed: ${response.status}`);
      }

      const data = await response.json();
      
      return data.results || [];

    } catch (error) {
      console.error('Spoonacular recipe search error:', error);
      return [];
    }
  }

  // Check if product has complete nutrition data
  private isValidProduct(product: any): boolean {
    if (!product || !product.title) {
      return false;
    }

    // Check for basic nutrition information
    const hasBasicNutrition = (
      product.nutrition &&
      product.nutrition.nutrients &&
      Array.isArray(product.nutrition.nutrients) &&
      product.nutrition.nutrients.length > 0
    );

    if (!hasBasicNutrition) {
      return false;
    }

    // Check if product is not empty or placeholder
    const name = product.title.toLowerCase();
    const invalidNames = ['unknown', 'placeholder', 'test', 'sample', 'example'];
    
    return !invalidNames.some(invalid => name.includes(invalid));
  }

  // Extract nutrition data from Spoonacular format
  private extractNutritionData(product: any): any {
    const nutrition = product.nutrition || {};
    const nutrients = nutrition.nutrients || [];
    
    // Create a map of nutrients for easy access
    const nutrientMap: { [key: string]: number } = {};
    nutrients.forEach((nutrient: any) => {
      if (nutrient.name && nutrient.amount !== undefined) {
        nutrientMap[nutrient.name.toLowerCase()] = nutrient.amount;
      }
    });

    return {
      id: product.id,
      name: product.title,
      brand: product.brand,
      calories: nutrientMap['calories'] || nutrientMap['energy'] || 0,
      protein: nutrientMap['protein'] || 0,
      carbs: nutrientMap['carbohydrates'] || nutrientMap['carbohydrate'] || 0,
      fat: nutrientMap['fat'] || nutrientMap['total fat'] || 0,
      fiber: nutrientMap['fiber'] || nutrientMap['dietary fiber'] || 0,
      sugar: nutrientMap['sugar'] || nutrientMap['sugars'] || 0,
      sodium: nutrientMap['sodium'] || 0,
      serving_size: product.servingSize || '100g',
      barcode: product.upc,
      image: product.images && product.images.length > 0 ? product.images[0] : null,
      verified: true, // Spoonacular data is generally verified
      // Additional nutrition facts
      nutritionFacts: {
        vitaminA: nutrientMap['vitamin a'],
        vitaminC: nutrientMap['vitamin c'],
        vitaminD: nutrientMap['vitamin d'],
        vitaminE: nutrientMap['vitamin e'],
        vitaminK: nutrientMap['vitamin k'],
        thiamin: nutrientMap['thiamin'] || nutrientMap['vitamin b1'],
        riboflavin: nutrientMap['riboflavin'] || nutrientMap['vitamin b2'],
        niacin: nutrientMap['niacin'] || nutrientMap['vitamin b3'],
        vitaminB6: nutrientMap['vitamin b6'],
        folate: nutrientMap['folate'],
        vitaminB12: nutrientMap['vitamin b12'],
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
