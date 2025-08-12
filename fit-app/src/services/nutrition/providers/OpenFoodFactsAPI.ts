import { FoodItem, APIProvider } from '../types/nutrition.types';
import { DataFormatter } from '../utils/dataFormatter';
import { AustralianProductEnhancer } from '../utils/australianEnhancer';

export class OpenFoodFactsAPI implements APIProvider {
  name = 'openfoodfacts';
  priority = 1;
  private baseUrl = 'https://world.openfoodfacts.org';

  isAvailable(): boolean {
    return true; // Open Food Facts is always available (free, no API key needed)
  }

  async searchFood(query: string): Promise<FoodItem[]> {
    try {
      const searchUrl = `${this.baseUrl}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20`;
      
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'NimbusNutritionApp/1.0 (https://github.com/your-app)',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Open Food Facts search failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.products || !Array.isArray(data.products)) {
        return [];
      }

      const foodItems: FoodItem[] = [];

      for (const product of data.products) {
        if (this.isValidProduct(product)) {
          const confidence = DataFormatter.calculateConfidence(product);
          let foodItem = DataFormatter.createFoodItem(product, 'openfoodfacts', confidence);
          
          // Enhance with Australian product detection
          foodItem = AustralianProductEnhancer.enhanceNutritionData(foodItem);
          
          foodItems.push(foodItem);
        }
      }

      // Sort by relevance (confidence score) and Australian products first
      return foodItems.sort((a, b) => {
        if (a.australianProduct && !b.australianProduct) return -1;
        if (!a.australianProduct && b.australianProduct) return 1;
        return b.confidence - a.confidence;
      });

    } catch (error) {
      console.error('Open Food Facts search error:', error);
      return [];
    }
  }

  async lookupBarcode(barcode: string): Promise<FoodItem | null> {
    try {
      const barcodeUrl = `${this.baseUrl}/api/v0/product/${barcode}.json`;
      
      const response = await fetch(barcodeUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'NimbusNutritionApp/1.0 (https://github.com/your-app)',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // Product not found
        }
        throw new Error(`Open Food Facts barcode lookup failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== 1 || !data.product) {
        return null;
      }

      const product = data.product;
      
      if (!this.isValidProduct(product)) {
        return null;
      }

      const confidence = DataFormatter.calculateConfidence(product);
      let foodItem = DataFormatter.createFoodItem(product, 'openfoodfacts', confidence);
      
      // Enhance with Australian product detection
      foodItem = AustralianProductEnhancer.enhanceNutritionData(foodItem);
      
      return foodItem;

    } catch (error) {
      console.error('Open Food Facts barcode lookup error:', error);
      return null;
    }
  }

  async getUsageStats(): Promise<{ callsToday: number; quota: number; remaining: number }> {
    // Open Food Facts has no API limits
    return {
      callsToday: 0,
      quota: Infinity,
      remaining: Infinity
    };
  }

  // Get product by Open Food Facts ID
  async getProductByID(productId: string): Promise<FoodItem | null> {
    try {
      const productUrl = `${this.baseUrl}/api/v0/product/${productId}.json`;
      
      const response = await fetch(productUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'NimbusNutritionApp/1.0 (https://github.com/your-app)',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      if (data.status !== 1 || !data.product) {
        return null;
      }

      const product = data.product;
      
      if (!this.isValidProduct(product)) {
        return null;
      }

      const confidence = DataFormatter.calculateConfidence(product);
      let foodItem = DataFormatter.createFoodItem(product, 'openfoodfacts', confidence);
      
      // Enhance with Australian product detection
      foodItem = AustralianProductEnhancer.enhanceNutritionData(foodItem);
      
      return foodItem;

    } catch (error) {
      console.error('Open Food Facts product lookup error:', error);
      return null;
    }
  }

  // Search by category
  async searchByCategory(category: string): Promise<FoodItem[]> {
    try {
      const categoryUrl = `${this.baseUrl}/cgi/search.pl?action=process&tagtype_0=categories&tag_contains_0=contains&tag_0=${encodeURIComponent(category)}&json=1&page_size=20`;
      
      const response = await fetch(categoryUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'NimbusNutritionApp/1.0 (https://github.com/your-app)',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Open Food Facts category search failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.products || !Array.isArray(data.products)) {
        return [];
      }

      const foodItems: FoodItem[] = [];

      for (const product of data.products) {
        if (this.isValidProduct(product)) {
          const confidence = DataFormatter.calculateConfidence(product);
          let foodItem = DataFormatter.createFoodItem(product, 'openfoodfacts', confidence);
          
          // Enhance with Australian product detection
          foodItem = AustralianProductEnhancer.enhanceNutritionData(foodItem);
          
          foodItems.push(foodItem);
        }
      }

      return foodItems.sort((a, b) => b.confidence - a.confidence);

    } catch (error) {
      console.error('Open Food Facts category search error:', error);
      return [];
    }
  }

  // Search by brand
  async searchByBrand(brand: string): Promise<FoodItem[]> {
    try {
      const brandUrl = `${this.baseUrl}/cgi/search.pl?action=process&tagtype_0=brands&tag_contains_0=contains&tag_0=${encodeURIComponent(brand)}&json=1&page_size=20`;
      
      const response = await fetch(brandUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'NimbusNutritionApp/1.0 (https://github.com/your-app)',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Open Food Facts brand search failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.products || !Array.isArray(data.products)) {
        return [];
      }

      const foodItems: FoodItem[] = [];

      for (const product of data.products) {
        if (this.isValidProduct(product)) {
          const confidence = DataFormatter.calculateConfidence(product);
          let foodItem = DataFormatter.createFoodItem(product, 'openfoodfacts', confidence);
          
          // Enhance with Australian product detection
          foodItem = AustralianProductEnhancer.enhanceNutritionData(foodItem);
          
          foodItems.push(foodItem);
        }
      }

      return foodItems.sort((a, b) => b.confidence - a.confidence);

    } catch (error) {
      console.error('Open Food Facts brand search error:', error);
      return [];
    }
  }

  // Get product image URL
  getProductImageUrl(productId: string, imageType: 'front' | 'ingredients' | 'nutrition' = 'front'): string {
    return `${this.baseUrl}/images/products/${productId}/${imageType}.jpg`;
  }

  // Check if product has complete nutrition data
  private isValidProduct(product: any): boolean {
    if (!product || !product.product_name) {
      return false;
    }

    // Check for basic nutrition information
    const hasBasicNutrition = (
      product.nutriments &&
      (product.nutriments.energy_100g || product.nutriments.energy_kcal_100g) &&
      (product.nutriments.proteins_100g || product.nutriments.protein_100g) &&
      (product.nutriments.carbohydrates_100g || product.nutriments.carbohydrate_100g) &&
      (product.nutriments.fat_100g || product.nutriments.total_fat_100g)
    );

    if (!hasBasicNutrition) {
      return false;
    }

    // Check if product is not empty or placeholder
    const name = product.product_name.toLowerCase();
    const invalidNames = ['unknown', 'placeholder', 'test', 'sample', 'example'];
    
    return !invalidNames.some(invalid => name.includes(invalid));
  }

  // Extract nutrition data from Open Food Facts format
  private extractNutritionData(product: any): any {
    const nutriments = product.nutriments || {};
    
    return {
      id: product.code,
      name: product.product_name,
      brand: product.brands,
      calories: nutriments.energy_kcal_100g || (nutriments.energy_100g ? nutriments.energy_100g / 4.184 : 0),
      protein: nutriments.proteins_100g || nutriments.protein_100g || 0,
      carbs: nutriments.carbohydrates_100g || nutriments.carbohydrate_100g || 0,
      fat: nutriments.fat_100g || nutriments.total_fat_100g || 0,
      fiber: nutriments.fiber_100g || nutriments.fibre_100g || 0,
      sugar: nutriments.sugars_100g || nutriments.sugar_100g || 0,
      sodium: nutriments.sodium_100g || (nutriments.salt_100g ? nutriments.salt_100g * 400 : 0),
      serving_size: product.serving_size || '100g',
      barcode: product.code,
      image: product.image_front_url || product.image_url,
      allergens: product.allergen_tags || [],
      ingredients: product.ingredients_text ? product.ingredients_text.split(',') : [],
      verified: product.data_quality_errors_tags ? product.data_quality_errors_tags.length === 0 : false,
      // Additional nutrition facts
      nutritionFacts: {
        vitaminA: nutriments.vitamin_a_100g,
        vitaminC: nutriments.vitamin_c_100g,
        vitaminD: nutriments.vitamin_d_100g,
        vitaminE: nutriments.vitamin_e_100g,
        vitaminK: nutriments.vitamin_k_100g,
        thiamin: nutriments.vitamin_b1_100g,
        riboflavin: nutriments.vitamin_b2_100g,
        niacin: nutriments.vitamin_b3_100g,
        vitaminB6: nutriments.vitamin_b6_100g,
        folate: nutriments.folate_100g,
        vitaminB12: nutriments.vitamin_b12_100g,
        calcium: nutriments.calcium_100g,
        iron: nutriments.iron_100g,
        magnesium: nutriments.magnesium_100g,
        phosphorus: nutriments.phosphorus_100g,
        potassium: nutriments.potassium_100g,
        zinc: nutriments.zinc_100g
      }
    };
  }
}
