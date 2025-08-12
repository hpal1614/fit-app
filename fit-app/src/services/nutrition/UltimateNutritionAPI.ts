import { 
  FoodItem, 
  NutritionResult, 
  SearchResult, 
  BulkResult, 
  APIUsageStats,
  APIProvider 
} from './types/nutrition.types';
import { CacheManager } from './utils/cache';
import { QuotaManager } from './utils/quotaManager';
import { AustralianProductEnhancer } from './utils/australianEnhancer';

// Import all API providers
import { OpenFoodFactsAPI } from './providers/OpenFoodFactsAPI';
import { FatSecretAPI } from './providers/FatSecretAPI';
import { SpoonacularAPI } from './providers/SpoonacularAPI';
import { NutritionixAPI } from './providers/NutritionixAPI';
import { USDAAPI } from './providers/USDAAPI';

export class UltimateNutritionAPI {
  private providers: APIProvider[] = [];
  private cache: CacheManager;
  private quotaManager: QuotaManager;
  private isInitialized = false;

  constructor() {
    this.cache = new CacheManager();
    this.quotaManager = new QuotaManager();
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize providers in priority order
    this.providers = [
      new OpenFoodFactsAPI(),
      new FatSecretAPI(),
      new SpoonacularAPI(),
      new NutritionixAPI(),
      new USDAAPI()
    ];

    // Filter out unavailable providers
    this.providers = this.providers.filter(provider => provider.isAvailable());
    
    console.log(`Initialized ${this.providers.length} nutrition API providers:`, 
      this.providers.map(p => p.name));
    
    this.isInitialized = true;
  }

  /**
   * Lookup product by barcode using waterfall strategy
   */
  async lookupBarcode(barcode: string): Promise<NutritionResult> {
    if (!this.isInitialized) {
      return { success: false, error: 'API not initialized' };
    }

    // Check cache first
    const cachedResult = this.cache.get(barcode);
    if (cachedResult) {
      return {
        success: true,
        data: cachedResult,
        source: 'cache',
        confidence: cachedResult.confidence,
        cacheHit: true
      };
    }

    // Try each provider in priority order
    for (const provider of this.providers) {
      if (!this.quotaManager.canMakeCall(provider.name)) {
        console.log(`Skipping ${provider.name} - quota exceeded`);
        continue;
      }

      try {
        console.log(`Trying ${provider.name} for barcode ${barcode}`);
        
        const result = await provider.lookupBarcode(barcode);
        
        if (result) {
          // Track API call
          this.quotaManager.trackCall(provider.name);
          
          // Cache the result
          this.cache.set(barcode, result);
          
          return {
            success: true,
            data: result,
            source: provider.name,
            confidence: result.confidence,
            apiUsed: provider.name
          };
        }
      } catch (error) {
        console.error(`Error with ${provider.name}:`, error);
        // Continue to next provider
      }
    }

    return {
      success: false,
      error: 'Product not found in any database',
      source: 'none'
    };
  }

  /**
   * Search for food items using waterfall strategy
   */
  async searchFood(query: string): Promise<SearchResult> {
    if (!this.isInitialized) {
      return { success: false, results: [], totalResults: 0, error: 'API not initialized', sources: [] };
    }

    const allResults: FoodItem[] = [];
    const sources: string[] = [];
    let totalFound = 0;

    // Try each provider in priority order
    for (const provider of this.providers) {
      if (!this.quotaManager.canMakeCall(provider.name)) {
        console.log(`Skipping ${provider.name} - quota exceeded`);
        continue;
      }

      try {
        console.log(`Searching ${provider.name} for: ${query}`);
        
        const results = await provider.searchFood(query);
        
        if (results && results.length > 0) {
          // Track API call
          this.quotaManager.trackCall(provider.name);
          
          // Add results and track source
          allResults.push(...results);
          sources.push(provider.name);
          totalFound += results.length;
          
          // Cache individual results
          results.forEach(result => {
            if (result.barcode) {
              this.cache.set(result.barcode, result);
            }
          });
        }
      } catch (error) {
        console.error(`Error with ${provider.name}:`, error);
        // Continue to next provider
      }
    }

    // Remove duplicates and sort by confidence
    const uniqueResults = this.removeDuplicates(allResults);
    const sortedResults = uniqueResults.sort((a, b) => {
      // Prioritize Australian products
      if (a.australianProduct && !b.australianProduct) return -1;
      if (!a.australianProduct && b.australianProduct) return 1;
      // Then by confidence
      return b.confidence - a.confidence;
    });

    return {
      success: sortedResults.length > 0,
      results: sortedResults.slice(0, 20), // Limit to 20 results
      totalResults: sortedResults.length,
      sources
    };
  }

  /**
   * Get product by ID from specific source
   */
  async getProductByID(id: string, source: string): Promise<FoodItem | null> {
    if (!this.isInitialized) {
      return null;
    }

    const provider = this.providers.find(p => p.name === source);
    if (!provider) {
      console.error(`Provider ${source} not found`);
      return null;
    }

    if (!this.quotaManager.canMakeCall(provider.name)) {
      console.log(`Cannot call ${provider.name} - quota exceeded`);
      return null;
    }

    try {
      const result = await provider.lookupBarcode(id);
      if (result) {
        this.quotaManager.trackCall(provider.name);
        this.cache.set(id, result);
      }
      return result;
    } catch (error) {
      console.error(`Error getting product from ${source}:`, error);
      return null;
    }
  }

  /**
   * Bulk lookup multiple barcodes
   */
  async getBulkProducts(barcodes: string[]): Promise<BulkResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        results: {},
        errors: {},
        summary: { total: barcodes.length, found: 0, notFound: 0, errors: 0 }
      };
    }

    const results: { [barcode: string]: FoodItem | null } = {};
    const errors: { [barcode: string]: string } = {};
    let found = 0;
    let notFound = 0;
    let errorCount = 0;

    // Process barcodes in batches to avoid overwhelming APIs
    const batchSize = 5;
    for (let i = 0; i < barcodes.length; i += batchSize) {
      const batch = barcodes.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (barcode) => {
        try {
          const result = await this.lookupBarcode(barcode);
          if (result.success && result.data) {
            results[barcode] = result.data;
            found++;
          } else {
            results[barcode] = null;
            notFound++;
          }
        } catch (error) {
          results[barcode] = null;
          errors[barcode] = error instanceof Error ? error.message : 'Unknown error';
          errorCount++;
        }
      });

      await Promise.all(batchPromises);
      
      // Small delay between batches to be respectful to APIs
      if (i + batchSize < barcodes.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return {
      success: found > 0,
      results,
      errors,
      summary: {
        total: barcodes.length,
        found,
        notFound,
        errors: errorCount
      }
    };
  }

  /**
   * Get usage statistics for all APIs
   */
  async getUsageStats(): Promise<APIUsageStats> {
    return this.quotaManager.getUsageStats();
  }

  /**
   * Clear the cache
   */
  async clearCache(): Promise<void> {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hits: number; misses: number; hitRate: number } {
    const stats = this.cache.getStats();
    return {
      ...stats,
      hitRate: this.cache.getHitRate()
    };
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): string[] {
    return this.providers.map(p => p.name);
  }

  /**
   * Get best available API based on quotas
   */
  getBestAvailableAPI(): string {
    return this.quotaManager.getBestAvailableAPI();
  }

  /**
   * Search by brand across all providers
   */
  async searchByBrand(brand: string): Promise<SearchResult> {
    if (!this.isInitialized) {
      return { success: false, results: [], totalResults: 0, error: 'API not initialized', sources: [] };
    }

    const allResults: FoodItem[] = [];
    const sources: string[] = [];

    // Try each provider that supports brand search
    for (const provider of this.providers) {
      if (!this.quotaManager.canMakeCall(provider.name)) {
        continue;
      }

      try {
        // Check if provider has searchByBrand method
        if ('searchByBrand' in provider && typeof (provider as any).searchByBrand === 'function') {
          const results = await (provider as any).searchByBrand(brand);
          
          if (results && results.length > 0) {
            this.quotaManager.trackCall(provider.name);
            allResults.push(...results);
            sources.push(provider.name);
          }
        }
      } catch (error) {
        console.error(`Error with ${provider.name} brand search:`, error);
      }
    }

    const uniqueResults = this.removeDuplicates(allResults);
    const sortedResults = uniqueResults.sort((a, b) => {
      if (a.australianProduct && !b.australianProduct) return -1;
      if (!a.australianProduct && b.australianProduct) return 1;
      return b.confidence - a.confidence;
    });

    return {
      success: sortedResults.length > 0,
      results: sortedResults.slice(0, 20),
      totalResults: sortedResults.length,
      sources
    };
  }

  /**
   * Search by category across all providers
   */
  async searchByCategory(category: string): Promise<SearchResult> {
    if (!this.isInitialized) {
      return { success: false, results: [], totalResults: 0, error: 'API not initialized', sources: [] };
    }

    const allResults: FoodItem[] = [];
    const sources: string[] = [];

    // Try each provider that supports category search
    for (const provider of this.providers) {
      if (!this.quotaManager.canMakeCall(provider.name)) {
        continue;
      }

      try {
        // Check if provider has searchByCategory method
        if ('searchByCategory' in provider && typeof (provider as any).searchByCategory === 'function') {
          const results = await (provider as any).searchByCategory(category);
          
          if (results && results.length > 0) {
            this.quotaManager.trackCall(provider.name);
            allResults.push(...results);
            sources.push(provider.name);
          }
        }
      } catch (error) {
        console.error(`Error with ${provider.name} category search:`, error);
      }
    }

    const uniqueResults = this.removeDuplicates(allResults);
    const sortedResults = uniqueResults.sort((a, b) => {
      if (a.australianProduct && !b.australianProduct) return -1;
      if (!a.australianProduct && b.australianProduct) return 1;
      return b.confidence - a.confidence;
    });

    return {
      success: sortedResults.length > 0,
      results: sortedResults.slice(0, 20),
      totalResults: sortedResults.length,
      sources
    };
  }

  /**
   * Get Australian nutrition recommendations
   */
  getAustralianNutritionRecommendations() {
    return AustralianProductEnhancer.getAustralianNutritionRecommendations();
  }

  /**
   * Check if product meets Australian dietary guidelines
   */
  checkAustralianDietaryGuidelines(product: FoodItem) {
    return AustralianProductEnhancer.checkAustralianDietaryGuidelines(product);
  }

  /**
   * Remove duplicate food items based on name and brand
   */
  private removeDuplicates(foods: FoodItem[]): FoodItem[] {
    const seen = new Set<string>();
    const unique: FoodItem[] = [];

    for (const food of foods) {
      const key = `${food.name.toLowerCase()}-${food.brand?.toLowerCase() || 'no-brand'}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(food);
      }
    }

    return unique;
  }

  /**
   * Reset daily quota counters
   */
  resetDailyQuotas(): void {
    this.quotaManager.resetDailyCounters();
  }

  /**
   * Get next quota reset time
   */
  getNextQuotaResetTime(): Date {
    return this.quotaManager.getNextResetTime();
  }

  /**
   * Check if any API is available
   */
  hasAvailableAPI(): boolean {
    return this.quotaManager.hasAvailableAPI();
  }

  /**
   * Get quota utilization for specific API
   */
  getQuotaUtilization(apiName: string): number {
    return this.quotaManager.getQuotaUtilization(apiName);
  }
}

// Export a singleton instance
export const ultimateNutritionAPI = new UltimateNutritionAPI();
