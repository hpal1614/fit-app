import { FoodItem } from '../types/nutrition.types';

export class DataFormatter {
  // Convert calories from kJ to kcal if needed
  static normalizeCalories(calories: number, unit: string = 'kcal'): number {
    if (unit.toLowerCase() === 'kj') {
      return calories / 4.184; // Convert kJ to kcal
    }
    return calories;
  }

  // Normalize protein content to per 100g
  static normalizeProtein(protein: number, servingSize: string, unit: string = 'g'): number {
    const servingWeight = this.extractWeightFromServingSize(servingSize);
    if (servingWeight > 0) {
      return (protein / servingWeight) * 100;
    }
    return protein;
  }

  // Normalize carbs content to per 100g
  static normalizeCarbs(carbs: number, servingSize: string, unit: string = 'g'): number {
    const servingWeight = this.extractWeightFromServingSize(servingSize);
    if (servingWeight > 0) {
      return (carbs / servingWeight) * 100;
    }
    return carbs;
  }

  // Normalize fat content to per 100g
  static normalizeFat(fat: number, servingSize: string, unit: string = 'g'): number {
    const servingWeight = this.extractWeightFromServingSize(servingSize);
    if (servingWeight > 0) {
      return (fat / servingWeight) * 100;
    }
    return fat;
  }

  // Normalize fiber content to per 100g
  static normalizeFiber(fiber: number, servingSize: string, unit: string = 'g'): number {
    const servingWeight = this.extractWeightFromServingSize(servingSize);
    if (servingWeight > 0) {
      return (fiber / servingWeight) * 100;
    }
    return fiber;
  }

  // Normalize sugar content to per 100g
  static normalizeSugar(sugar: number, servingSize: string, unit: string = 'g'): number {
    const servingWeight = this.extractWeightFromServingSize(servingSize);
    if (servingWeight > 0) {
      return (sugar / servingWeight) * 100;
    }
    return sugar;
  }

  // Normalize sodium content to per 100g
  static normalizeSodium(sodium: number, servingSize: string, unit: string = 'mg'): number {
    const servingWeight = this.extractWeightFromServingSize(servingSize);
    if (servingWeight > 0) {
      return (sodium / servingWeight) * 100;
    }
    return sodium;
  }

  // Extract weight from serving size string
  static extractWeightFromServingSize(servingSize: string): number {
    if (!servingSize) return 0;

    // Common patterns for serving sizes
    const patterns = [
      /(\d+(?:\.\d+)?)\s*g/, // 100g, 100.5g
      /(\d+(?:\.\d+)?)\s*gram/, // 100 gram
      /(\d+(?:\.\d+)?)\s*grams/, // 100 grams
      /(\d+(?:\.\d+)?)\s*ml/, // 100ml
      /(\d+(?:\.\d+)?)\s*millilitre/, // 100 millilitre
      /(\d+(?:\.\d+)?)\s*millilitres/, // 100 millilitres
      /(\d+(?:\.\d+)?)\s*l/, // 1l
      /(\d+(?:\.\d+)?)\s*litre/, // 1 litre
      /(\d+(?:\.\d+)?)\s*litres/, // 1 litres
      /(\d+(?:\.\d+)?)\s*oz/, // 3.5oz
      /(\d+(?:\.\d+)?)\s*ounce/, // 3.5 ounce
      /(\d+(?:\.\d+)?)\s*ounces/, // 3.5 ounces
      /(\d+(?:\.\d+)?)\s*fl\s*oz/, // 3.5 fl oz
      /(\d+(?:\.\d+)?)\s*fluid\s*ounce/, // 3.5 fluid ounce
      /(\d+(?:\.\d+)?)\s*fluid\s*ounces/, // 3.5 fluid ounces
      /(\d+(?:\.\d+)?)\s*lb/, // 0.5lb
      /(\d+(?:\.\d+)?)\s*pound/, // 0.5 pound
      /(\d+(?:\.\d+)?)\s*pounds/, // 0.5 pounds
    ];

    for (const pattern of patterns) {
      const match = servingSize.match(pattern);
      if (match) {
        const value = parseFloat(match[1]);
        if (!isNaN(value)) {
          // Convert to grams
          if (pattern.source.includes('ml') || pattern.source.includes('millilitre') || pattern.source.includes('l') || pattern.source.includes('litre')) {
            return value; // Assume 1ml = 1g for most foods
          } else if (pattern.source.includes('oz') || pattern.source.includes('ounce')) {
            return value * 28.35; // Convert oz to g
          } else if (pattern.source.includes('lb') || pattern.source.includes('pound')) {
            return value * 453.59; // Convert lb to g
          } else {
            return value; // Already in grams
          }
        }
      }
    }

    // Default serving sizes for common items
    const defaultSizes: { [key: string]: number } = {
      'cup': 250,
      'cups': 250,
      'tablespoon': 15,
      'tablespoons': 15,
      'tbsp': 15,
      'teaspoon': 5,
      'teaspoons': 5,
      'tsp': 5,
      'slice': 30,
      'slices': 30,
      'piece': 50,
      'pieces': 50,
      'serving': 100,
      'serve': 100,
      'portion': 150,
      'pack': 100,
      'container': 150,
      'bottle': 500,
      'can': 400,
      'tin': 400,
      'jar': 300,
      'packet': 50,
      'bag': 200,
      'box': 300,
      'tub': 500,
      'pot': 150,
      'sachet': 10,
      'sachets': 10,
    };

    const lowerServingSize = servingSize.toLowerCase();
    for (const [unit, weight] of Object.entries(defaultSizes)) {
      if (lowerServingSize.includes(unit)) {
        return weight;
      }
    }

    return 100; // Default to 100g if no pattern matches
  }

  // Create a standardized FoodItem from raw API data
  static createFoodItem(
    rawData: any,
    source: 'openfoodfacts' | 'fatsecret' | 'spoonacular' | 'nutritionix' | 'usda' | 'cache',
    confidence: number = 0.8
  ): FoodItem {
    const servingSize = this.normalizeServingSize(rawData.serving_size || rawData.servingSize || '100g');
    const servingWeight = this.extractWeightFromServingSize(servingSize);

    // Normalize nutrition values to per 100g
    const calories = this.normalizeCalories(
      rawData.calories || rawData.energy || rawData.energy_kcal || 0,
      rawData.energy_unit || 'kcal'
    );

    const protein = this.normalizeProtein(
      rawData.protein || rawData.proteins || 0,
      servingSize
    );

    const carbs = this.normalizeCarbs(
      rawData.carbs || rawData.carbohydrates || rawData.carbohydrate || 0,
      servingSize
    );

    const fat = this.normalizeFat(
      rawData.fat || rawData.total_fat || rawData.totalFat || 0,
      servingSize
    );

    const fiber = this.normalizeFiber(
      rawData.fiber || rawData.fibre || rawData.dietary_fiber || 0,
      servingSize
    );

    const sugar = this.normalizeSugar(
      rawData.sugar || rawData.sugars || rawData.total_sugars || 0,
      servingSize
    );

    const sodium = this.normalizeSodium(
      rawData.sodium || rawData.salt || 0,
      servingSize
    );

    // Determine category based on name and nutrition
    const category = this.determineCategory(rawData.name || rawData.product_name || '', calories, protein, carbs, fat);

    // Extract allergens and ingredients
    const allergens = this.extractAllergens(rawData);
    const ingredients = this.extractIngredients(rawData);

    // Create nutrition facts object
    const nutritionFacts = this.extractNutritionFacts(rawData);

    return {
      id: rawData.id || rawData.product_id || rawData.code || `food_${Date.now()}`,
      name: rawData.name || rawData.product_name || rawData.title || 'Unknown Food',
      brand: rawData.brand || rawData.brands || rawData.manufacturer,
      calories: Math.round(calories * 100) / 100,
      protein: Math.round(protein * 100) / 100,
      carbs: Math.round(carbs * 100) / 100,
      fat: Math.round(fat * 100) / 100,
      fiber: fiber > 0 ? Math.round(fiber * 100) / 100 : undefined,
      sugar: sugar > 0 ? Math.round(sugar * 100) / 100 : undefined,
      sodium: sodium > 0 ? Math.round(sodium * 100) / 100 : undefined,
      serving_size: servingSize,
      barcode: rawData.barcode || rawData.code || rawData.ean || rawData.upc,
      category,
      timestamp: new Date(),
      quantity: 1,
      image: rawData.image || rawData.image_url || rawData.imageUrl,
      verified: this.isVerified(rawData),
      source,
      confidence,
      allergens: allergens.length > 0 ? allergens : undefined,
      ingredients: ingredients.length > 0 ? ingredients : undefined,
      nutritionFacts: Object.keys(nutritionFacts).length > 0 ? nutritionFacts : undefined,
    };
  }

  // Normalize serving size string
  static normalizeServingSize(servingSize: string): string {
    if (!servingSize) return '100g';

    // Clean up common variations
    let normalized = servingSize.trim();
    
    // Standardize units
    normalized = normalized.replace(/\bgram\b/gi, 'g');
    normalized = normalized.replace(/\bgrams\b/gi, 'g');
    normalized = normalized.replace(/\bmillilitre\b/gi, 'ml');
    normalized = normalized.replace(/\bmillilitres\b/gi, 'ml');
    normalized = normalized.replace(/\blitre\b/gi, 'l');
    normalized = normalized.replace(/\blitres\b/gi, 'l');
    normalized = normalized.replace(/\bounce\b/gi, 'oz');
    normalized = normalized.replace(/\bounces\b/gi, 'oz');
    normalized = normalized.replace(/\bpound\b/gi, 'lb');
    normalized = normalized.replace(/\bpounds\b/gi, 'lb');

    return normalized;
  }

  // Determine food category based on name and nutrition
  static determineCategory(name: string, calories: number, protein: number, carbs: number, fat: number): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
    const lowerName = name.toLowerCase();

    // Breakfast indicators
    if (lowerName.includes('cereal') || lowerName.includes('oat') || lowerName.includes('muesli') || 
        lowerName.includes('toast') || lowerName.includes('pancake') || lowerName.includes('waffle') ||
        lowerName.includes('yogurt') || lowerName.includes('yoghurt') || lowerName.includes('milk') ||
        lowerName.includes('egg') || lowerName.includes('bacon') || lowerName.includes('sausage')) {
      return 'breakfast';
    }

    // Lunch indicators
    if (lowerName.includes('sandwich') || lowerName.includes('wrap') || lowerName.includes('salad') ||
        lowerName.includes('soup') || lowerName.includes('pasta') || lowerName.includes('rice') ||
        lowerName.includes('chicken') || lowerName.includes('fish') || lowerName.includes('meat')) {
      return 'lunch';
    }

    // Dinner indicators
    if (lowerName.includes('steak') || lowerName.includes('roast') || lowerName.includes('grill') ||
        lowerName.includes('bake') || lowerName.includes('casserole') || lowerName.includes('curry') ||
        lowerName.includes('stew') || lowerName.includes('lasagna') || lowerName.includes('pizza')) {
      return 'dinner';
    }

    // Snack indicators
    if (lowerName.includes('chip') || lowerName.includes('crisp') || lowerName.includes('candy') ||
        lowerName.includes('chocolate') || lowerName.includes('cookie') || lowerName.includes('biscuit') ||
        lowerName.includes('nut') || lowerName.includes('fruit') || lowerName.includes('bar') ||
        calories < 200) {
      return 'snack';
    }

    // Default based on nutrition
    if (protein > 20) return 'dinner';
    if (carbs > 50) return 'lunch';
    if (calories < 300) return 'snack';
    
    return 'lunch';
  }

  // Extract allergens from raw data
  static extractAllergens(rawData: any): string[] {
    const allergens = rawData.allergens || rawData.allergen_tags || rawData.allergen_info || [];
    
    if (Array.isArray(allergens)) {
      return allergens.filter((allergen: string) => allergen && allergen.trim());
    }
    
    if (typeof allergens === 'string') {
      return allergens.split(',').map((a: string) => a.trim()).filter((a: string) => a);
    }
    
    return [];
  }

  // Extract ingredients from raw data
  static extractIngredients(rawData: any): string[] {
    const ingredients = rawData.ingredients || rawData.ingredient_list || rawData.ingredients_text || [];
    
    if (Array.isArray(ingredients)) {
      return ingredients.filter((ingredient: string) => ingredient && ingredient.trim());
    }
    
    if (typeof ingredients === 'string') {
      return ingredients.split(',').map((i: string) => i.trim()).filter((i: string) => i);
    }
    
    return [];
  }

  // Extract detailed nutrition facts
  static extractNutritionFacts(rawData: any): any {
    const facts: any = {};
    
    // Vitamins
    const vitaminFields = ['vitamin_a', 'vitamin_c', 'vitamin_d', 'vitamin_e', 'vitamin_k', 'vitamin_b1', 'vitamin_b2', 'vitamin_b3', 'vitamin_b6', 'vitamin_b12', 'folate'];
    vitaminFields.forEach(field => {
      if (rawData[field]) {
        const normalizedField = field.replace('vitamin_', '').replace('vitamin', '');
        facts[normalizedField] = rawData[field];
      }
    });

    // Minerals
    const mineralFields = ['calcium', 'iron', 'magnesium', 'phosphorus', 'potassium', 'zinc', 'selenium', 'copper', 'manganese'];
    mineralFields.forEach(field => {
      if (rawData[field]) {
        facts[field] = rawData[field];
      }
    });

    return facts;
  }

  // Check if data is verified
  static isVerified(rawData: any): boolean {
    // Check for verification indicators
    const verificationIndicators = [
      rawData.verified,
      rawData.verified_by,
      rawData.quality_score,
      rawData.completeness_score,
      rawData.data_quality
    ];

    return verificationIndicators.some(indicator => 
      indicator === true || (typeof indicator === 'number' && indicator > 0.7)
    );
  }

  // Calculate confidence score based on data completeness
  static calculateConfidence(rawData: any): number {
    let score = 0;
    let total = 0;

    // Check required fields
    const requiredFields = ['name', 'calories', 'protein', 'carbs', 'fat'];
    requiredFields.forEach(field => {
      total++;
      if (rawData[field] && rawData[field] > 0) {
        score++;
      }
    });

    // Check optional fields
    const optionalFields = ['fiber', 'sugar', 'sodium', 'brand', 'barcode', 'image'];
    optionalFields.forEach(field => {
      total++;
      if (rawData[field]) {
        score += 0.5;
      }
    });

    // Bonus for verification
    if (this.isVerified(rawData)) {
      score += 1;
      total += 1;
    }

    return Math.min(score / total, 1);
  }
}
