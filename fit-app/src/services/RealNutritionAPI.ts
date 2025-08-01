/**
 * Real Nutrition API Service
 * Integrates with actual food databases for real nutrition data
 */

export interface RealFoodProduct {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  category: string;
  nutritionPer100g: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
    potassium?: number;
    calcium?: number;
    iron?: number;
    vitaminA?: number;
    vitaminC?: number;
    vitaminD?: number;
    vitaminE?: number;
    vitaminB12?: number;
  };
  servingSizes: Array<{
    amount: number;
    unit: string;
    description: string;
    nutritionPerServing: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber?: number;
      sugar?: number;
    };
  }>;
  allergens?: string[];
  ingredients?: string[];
  source: 'usda' | 'openfoodfacts' | 'australian' | 'user';
  lastUpdated: Date;
}

export interface NutritionSearchResult {
  products: RealFoodProduct[];
  total: number;
  page: number;
  hasMore: boolean;
}

export interface MealPlanRequest {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: number;
  dietaryRestrictions: string[];
  preferences: string[];
  budget?: number;
  cuisine?: string[];
}

export interface MealPlan {
  id: string;
  name: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  meals: Array<{
    name: string;
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    ingredients: Array<{
      product: RealFoodProduct;
      amount: number;
      unit: string;
    }>;
    instructions: string[];
    prepTime: number;
    cookTime: number;
    difficulty: 'easy' | 'medium' | 'hard';
  }>;
  shoppingList: Array<{
    product: RealFoodProduct;
    amount: number;
    unit: string;
    estimatedCost: number;
  }>;
  nutritionSummary: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
}

class USDADatabase {
  private baseUrl = 'https://api.nal.usda.gov/fdc/v1';
  private apiKey = import.meta.env.VITE_USDA_API_KEY || '';

  async searchFoods(query: string, pageSize: number = 25): Promise<RealFoodProduct[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/foods/search?api_key=${this.apiKey}&query=${encodeURIComponent(query)}&pageSize=${pageSize}&dataType=Foundation,SR Legacy`
      );
      
      if (!response.ok) {
        throw new Error(`USDA API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.foods?.map((food: any) => this.mapUSDAToProduct(food)) || [];
    } catch (error) {
      console.error('USDA search failed:', error);
      return [];
    }
  }

  async getFoodByBarcode(barcode: string): Promise<RealFoodProduct | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/foods/search?api_key=${this.apiKey}&query=${barcode}&dataType=Foundation,SR Legacy`
      );
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const food = data.foods?.[0];
      
      return food ? this.mapUSDAToProduct(food) : null;
    } catch (error) {
      console.error('USDA barcode lookup failed:', error);
      return null;
    }
  }

  private mapUSDAToProduct(usdaFood: any): RealFoodProduct {
    const nutrients = usdaFood.foodNutrients || [];
    
    const getNutrient = (id: number) => {
      const nutrient = nutrients.find((n: any) => n.nutrientId === id);
      return nutrient?.value || 0;
    };

    return {
      id: usdaFood.fdcId.toString(),
      name: usdaFood.description,
      brand: usdaFood.brandOwner,
      category: usdaFood.foodCategory || 'Unknown',
      nutritionPer100g: {
        calories: getNutrient(1008), // Energy (kcal)
        protein: getNutrient(1003), // Protein (g)
        carbs: getNutrient(1005), // Carbohydrate (g)
        fat: getNutrient(1004), // Total lipid (fat) (g)
        fiber: getNutrient(1079), // Fiber, total dietary (g)
        sugar: getNutrient(2000), // Sugars, total including NLEA (g)
        sodium: getNutrient(1093), // Sodium, Na (mg)
        potassium: getNutrient(1092), // Potassium, K (mg)
        calcium: getNutrient(1087), // Calcium, Ca (mg)
        iron: getNutrient(1089), // Iron, Fe (mg)
        vitaminA: getNutrient(1106), // Vitamin A, IU (IU)
        vitaminC: getNutrient(1162), // Vitamin C, total ascorbic acid (mg)
        vitaminD: getNutrient(1114), // Vitamin D (D2 + D3) (µg)
        vitaminE: getNutrient(1158), // Vitamin E (alpha-tocopherol) (mg)
        vitaminB12: getNutrient(1175), // Vitamin B-12 (µg)
      },
      servingSizes: [{
        amount: 100,
        unit: 'g',
        description: 'Per 100g',
        nutritionPerServing: {
          calories: getNutrient(1008),
          protein: getNutrient(1003),
          carbs: getNutrient(1005),
          fat: getNutrient(1004),
          fiber: getNutrient(1079),
          sugar: getNutrient(2000),
        }
      }],
      source: 'usda',
      lastUpdated: new Date(),
    };
  }
}

class OpenFoodFactsDatabase {
  private baseUrl = 'https://world.openfoodfacts.org/api/v0';

  async searchFoods(query: string, pageSize: number = 25): Promise<RealFoodProduct[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/product/search?search_terms=${encodeURIComponent(query)}&page_size=${pageSize}&json=1`
      );
      
      if (!response.ok) {
        throw new Error(`Open Food Facts API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.products?.map((product: any) => this.mapOpenFoodFactsToProduct(product)) || [];
    } catch (error) {
      console.error('Open Food Facts search failed:', error);
      return [];
    }
  }

  async getFoodByBarcode(barcode: string): Promise<RealFoodProduct | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/product/${barcode}?json=1`
      );
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      if (data.status === 0) {
        return null;
      }

      return this.mapOpenFoodFactsToProduct(data.product);
    } catch (error) {
      console.error('Open Food Facts barcode lookup failed:', error);
      return null;
    }
  }

  private mapOpenFoodFactsToProduct(product: any): RealFoodProduct {
    const nutriments = product.nutriments || {};
    
    return {
      id: product.code || product._id,
      name: product.product_name || product.product_name_en || 'Unknown Product',
      brand: product.brands || product.brand_owner,
      barcode: product.code,
      category: product.categories_tags?.[0]?.replace('en:', '') || 'Unknown',
      nutritionPer100g: {
        calories: nutriments.energy_100g || nutriments['energy-kcal_100g'] || 0,
        protein: nutriments.proteins_100g || 0,
        carbs: nutriments.carbohydrates_100g || 0,
        fat: nutriments.fat_100g || 0,
        fiber: nutriments.fiber_100g || 0,
        sugar: nutriments.sugars_100g || 0,
        sodium: nutriments.sodium_100g || 0,
        potassium: nutriments.potassium_100g || 0,
        calcium: nutriments.calcium_100g || 0,
        iron: nutriments.iron_100g || 0,
        vitaminA: nutriments.vitamin_a_100g || 0,
        vitaminC: nutriments.vitamin_c_100g || 0,
        vitaminD: nutriments.vitamin_d_100g || 0,
        vitaminE: nutriments.vitamin_e_100g || 0,
        vitaminB12: nutriments.vitamin_b12_100g || 0,
      },
      servingSizes: [{
        amount: 100,
        unit: 'g',
        description: 'Per 100g',
        nutritionPerServing: {
          calories: nutriments.energy_100g || nutriments['energy-kcal_100g'] || 0,
          protein: nutriments.proteins_100g || 0,
          carbs: nutriments.carbohydrates_100g || 0,
          fat: nutriments.fat_100g || 0,
          fiber: nutriments.fiber_100g || 0,
          sugar: nutriments.sugars_100g || 0,
        }
      }],
      allergens: product.allergens_tags?.map((tag: string) => tag.replace('en:', '')) || [],
      ingredients: product.ingredients_text_en?.split(',') || [],
      source: 'openfoodfacts',
      lastUpdated: new Date(product.last_updated_t || Date.now()),
    };
  }
}

class AustralianFoodDatabase {
  // Australian Food Composition Database integration
  // This would connect to the official Australian food database
  // For now, we'll use a curated list of common Australian products

  private australianProducts: RealFoodProduct[] = [
    {
      id: 'aus-001',
      name: 'Woolworths Greek Style Natural Yoghurt',
      brand: 'Woolworths',
      barcode: '9300633000000',
      category: 'Dairy',
      nutritionPer100g: {
        calories: 59,
        protein: 10.3,
        carbs: 3.6,
        fat: 0.4,
        fiber: 0,
        sugar: 3.6,
        sodium: 45,
        potassium: 180,
        calcium: 120,
        iron: 0.1,
        vitaminA: 0,
        vitaminC: 0,
        vitaminD: 0.1,
        vitaminE: 0,
        vitaminB12: 0.4,
      },
      servingSizes: [
        {
          amount: 170,
          unit: 'g',
          description: 'Standard tub',
          nutritionPerServing: {
            calories: 100,
            protein: 17.5,
            carbs: 6.1,
            fat: 0.7,
            fiber: 0,
            sugar: 6.1,
          }
        }
      ],
      source: 'australian',
      lastUpdated: new Date(),
    },
    // Add more Australian products...
  ];

  async searchFoods(query: string, pageSize: number = 25): Promise<RealFoodProduct[]> {
    const searchTerm = query.toLowerCase();
    return this.australianProducts
      .filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.brand?.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
      )
      .slice(0, pageSize);
  }

  async getFoodByBarcode(barcode: string): Promise<RealFoodProduct | null> {
    return this.australianProducts.find(product => product.barcode === barcode) || null;
  }
}

export class RealNutritionAPI {
  private usdaDB: USDADatabase;
  private openFoodFactsDB: OpenFoodFactsDatabase;
  private australianDB: AustralianFoodDatabase;
  private cache: Map<string, RealFoodProduct> = new Map();

  constructor() {
    this.usdaDB = new USDADatabase();
    this.openFoodFactsDB = new OpenFoodFactsDatabase();
    this.australianDB = new AustralianFoodDatabase();
  }

  async searchFoods(query: string, pageSize: number = 25): Promise<NutritionSearchResult> {
    console.log(`Searching for: "${query}"`);
    
    // Search all databases in parallel
    const [usdaResults, openFoodResults, australianResults] = await Promise.allSettled([
      this.usdaDB.searchFoods(query, pageSize),
      this.openFoodFactsDB.searchFoods(query, pageSize),
      this.australianDB.searchFoods(query, pageSize),
    ]);

    // Combine and deduplicate results
    const allProducts: RealFoodProduct[] = [];
    
    if (usdaResults.status === 'fulfilled') {
      allProducts.push(...usdaResults.value);
    }
    
    if (openFoodResults.status === 'fulfilled') {
      allProducts.push(...openFoodResults.value);
    }
    
    if (australianResults.status === 'fulfilled') {
      allProducts.push(...australianResults.value);
    }

    // Remove duplicates based on name and brand
    const uniqueProducts = this.deduplicateProducts(allProducts);
    
    // Cache results
    uniqueProducts.forEach(product => {
      if (product.barcode) {
        this.cache.set(product.barcode, product);
      }
    });

    return {
      products: uniqueProducts.slice(0, pageSize),
      total: uniqueProducts.length,
      page: 1,
      hasMore: uniqueProducts.length > pageSize,
    };
  }

  async getFoodByBarcode(barcode: string): Promise<RealFoodProduct | null> {
    // Check cache first
    if (this.cache.has(barcode)) {
      return this.cache.get(barcode)!;
    }

    // Try all databases in order of preference
    const sources = [
      () => this.australianDB.getFoodByBarcode(barcode),
      () => this.openFoodFactsDB.getFoodByBarcode(barcode),
      () => this.usdaDB.getFoodByBarcode(barcode),
    ];

    for (const source of sources) {
      try {
        const result = await source();
        if (result) {
          this.cache.set(barcode, result);
          return result;
        }
      } catch (error) {
        console.error('Barcode lookup failed for source:', error);
      }
    }

    return null;
  }

  private deduplicateProducts(products: RealFoodProduct[]): RealFoodProduct[] {
    const seen = new Set<string>();
    return products.filter(product => {
      const key = `${product.name.toLowerCase()}-${product.brand?.toLowerCase() || 'unknown'}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // Clear cache (useful for testing)
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance with lazy initialization
let _realNutritionAPI: RealNutritionAPI | null = null;

export function getRealNutritionAPI(): RealNutritionAPI {
  if (!_realNutritionAPI) {
    _realNutritionAPI = new RealNutritionAPI();
  }
  return _realNutritionAPI;
}

// For backward compatibility
export const realNutritionAPI = getRealNutritionAPI(); 