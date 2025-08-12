export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  calories: number;          // per 100g
  protein: number;           // per 100g
  carbs: number;            // per 100g
  fat: number;              // per 100g
  fiber?: number;           // per 100g
  sugar?: number;           // per 100g
  sodium?: number;          // per 100g
  serving_size: string;
  barcode?: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  timestamp: Date;
  quantity: number;
  image?: string;
  verified: boolean;
  source: 'openfoodfacts' | 'fatsecret' | 'spoonacular' | 'nutritionix' | 'usda' | 'cache';
  confidence: number;       // 0-1 confidence score
  australianProduct?: boolean;
  healthStarRating?: number; // Australian Health Star Rating (0-5)
  allergens?: string[];
  ingredients?: string[];
  nutritionFacts?: {
    vitaminA?: number;
    vitaminC?: number;
    vitaminD?: number;
    vitaminE?: number;
    vitaminK?: number;
    thiamin?: number;
    riboflavin?: number;
    niacin?: number;
    vitaminB6?: number;
    folate?: number;
    vitaminB12?: number;
    calcium?: number;
    iron?: number;
    magnesium?: number;
    phosphorus?: number;
    potassium?: number;
    zinc?: number;
  };
}

export interface NutritionResult {
  success: boolean;
  data?: FoodItem;
  error?: string;
  source?: string;
  confidence?: number;
  cacheHit?: boolean;
  apiUsed?: string;
}

export interface APIUsageStats {
  openfoodfacts: {
    callsToday: number;
    callsThisMonth: number;
    quota: number;
    remaining: number;
  };
  fatsecret: {
    callsToday: number;
    callsThisMonth: number;
    quota: number;
    remaining: number;
  };
  spoonacular: {
    callsToday: number;
    callsThisMonth: number;
    quota: number;
    remaining: number;
  };
  nutritionix: {
    callsToday: number;
    callsThisMonth: number;
    quota: number;
    remaining: number;
  };
  usda: {
    callsToday: number;
    callsThisMonth: number;
    quota: number;
    remaining: number;
  };
}

export interface CacheItem {
  key: string;
  data: FoodItem;
  timestamp: number;
  expiresAt: number;
}

export interface SearchResult {
  success: boolean;
  results: FoodItem[];
  totalResults: number;
  error?: string;
  sources: string[];
}

export interface BulkResult {
  success: boolean;
  results: { [barcode: string]: FoodItem | null };
  errors: { [barcode: string]: string };
  summary: {
    total: number;
    found: number;
    notFound: number;
    errors: number;
  };
}

export interface AustralianProductInfo {
  isAustralian: boolean;
  brand?: string;
  retailer?: 'Coles' | 'Woolworths' | 'ALDI' | 'IGA' | 'Other';
  healthStarRating?: number;
  nutritionPanelCompliant: boolean;
  servingSizeAustralian: boolean;
}

export interface APIProvider {
  name: string;
  priority: number;
  isAvailable(): boolean;
  searchFood(query: string): Promise<FoodItem[]>;
  lookupBarcode(barcode: string): Promise<FoodItem | null>;
  getUsageStats(): Promise<{ callsToday: number; quota: number; remaining: number }>;
}

export interface QuotaManager {
  trackCall(apiName: string): void;
  canMakeCall(apiName: string): boolean;
  getRemainingCalls(apiName: string): number;
  resetDailyCounters(): void;
  getUsageStats(): APIUsageStats;
}

export interface CacheManager {
  get(key: string): FoodItem | null;
  set(key: string, data: FoodItem, ttl?: number): void;
  has(key: string): boolean;
  clear(): void;
  getStats(): { size: number; hits: number; misses: number };
}
