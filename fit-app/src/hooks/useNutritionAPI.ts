import { useState, useCallback, useEffect } from 'react';
import { ultimateNutritionAPI } from '../services/nutrition';
import { FoodItem, NutritionResult, SearchResult, BulkResult, APIUsageStats } from '../services/nutrition/types/nutrition.types';

interface UseNutritionAPIState {
  isLoading: boolean;
  error: string | null;
  lastSearchQuery: string | null;
  lastBarcode: string | null;
}

interface UseNutritionAPIReturn extends UseNutritionAPIState {
  // Search functions
  searchFood: (query: string) => Promise<SearchResult>;
  searchByBrand: (brand: string) => Promise<SearchResult>;
  searchByCategory: (category: string) => Promise<SearchResult>;
  
  // Barcode functions
  lookupBarcode: (barcode: string) => Promise<NutritionResult>;
  getBulkProducts: (barcodes: string[]) => Promise<BulkResult>;
  
  // Utility functions
  getUsageStats: () => Promise<APIUsageStats>;
  clearCache: () => Promise<void>;
  getCacheStats: () => { size: number; hits: number; misses: number; hitRate: number };
  getAvailableProviders: () => string[];
  getBestAvailableAPI: () => string;
  hasAvailableAPI: () => boolean;
  getQuotaUtilization: (apiName: string) => number;
  getNextQuotaResetTime: () => Date;
  
  // Australian-specific functions
  getAustralianNutritionRecommendations: () => any;
  checkAustralianDietaryGuidelines: (product: FoodItem) => any;
  
  // State management
  clearError: () => void;
  resetState: () => void;
}

export const useNutritionAPI = (): UseNutritionAPIReturn => {
  const [state, setState] = useState<UseNutritionAPIState>({
    isLoading: false,
    error: null,
    lastSearchQuery: null,
    lastBarcode: null
  });

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Reset state
  const resetState = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      lastSearchQuery: null,
      lastBarcode: null
    });
  }, []);

  // Search food
  const searchFood = useCallback(async (query: string): Promise<SearchResult> => {
    if (!query.trim()) {
      return { success: false, results: [], totalResults: 0, error: 'Query cannot be empty', sources: [] };
    }

    setState(prev => ({ ...prev, isLoading: true, error: null, lastSearchQuery: query }));

    try {
      const result = await ultimateNutritionAPI.searchFood(query);
      setState(prev => ({ ...prev, isLoading: false }));
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      return { success: false, results: [], totalResults: 0, error: errorMessage, sources: [] };
    }
  }, []);

  // Search by brand
  const searchByBrand = useCallback(async (brand: string): Promise<SearchResult> => {
    if (!brand.trim()) {
      return { success: false, results: [], totalResults: 0, error: 'Brand cannot be empty', sources: [] };
    }

    setState(prev => ({ ...prev, isLoading: true, error: null, lastSearchQuery: brand }));

    try {
      const result = await ultimateNutritionAPI.searchByBrand(brand);
      setState(prev => ({ ...prev, isLoading: false }));
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Brand search failed';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      return { success: false, results: [], totalResults: 0, error: errorMessage, sources: [] };
    }
  }, []);

  // Search by category
  const searchByCategory = useCallback(async (category: string): Promise<SearchResult> => {
    if (!category.trim()) {
      return { success: false, results: [], totalResults: 0, error: 'Category cannot be empty', sources: [] };
    }

    setState(prev => ({ ...prev, isLoading: true, error: null, lastSearchQuery: category }));

    try {
      const result = await ultimateNutritionAPI.searchByCategory(category);
      setState(prev => ({ ...prev, isLoading: false }));
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Category search failed';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      return { success: false, results: [], totalResults: 0, error: errorMessage, sources: [] };
    }
  }, []);

  // Lookup barcode
  const lookupBarcode = useCallback(async (barcode: string): Promise<NutritionResult> => {
    if (!barcode.trim()) {
      return { success: false, error: 'Barcode cannot be empty' };
    }

    setState(prev => ({ ...prev, isLoading: true, error: null, lastBarcode: barcode }));

    try {
      const result = await ultimateNutritionAPI.lookupBarcode(barcode);
      setState(prev => ({ ...prev, isLoading: false }));
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Barcode lookup failed';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Get bulk products
  const getBulkProducts = useCallback(async (barcodes: string[]): Promise<BulkResult> => {
    if (!barcodes.length) {
      return {
        success: false,
        results: {},
        errors: {},
        summary: { total: 0, found: 0, notFound: 0, errors: 0 }
      };
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await ultimateNutritionAPI.getBulkProducts(barcodes);
      setState(prev => ({ ...prev, isLoading: false }));
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bulk lookup failed';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      return {
        success: false,
        results: {},
        errors: {},
        summary: { total: barcodes.length, found: 0, notFound: 0, errors: 1 }
      };
    }
  }, []);

  // Get usage stats
  const getUsageStats = useCallback(async (): Promise<APIUsageStats> => {
    try {
      return await ultimateNutritionAPI.getUsageStats();
    } catch (error) {
      console.error('Failed to get usage stats:', error);
      throw error;
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(async (): Promise<void> => {
    try {
      await ultimateNutritionAPI.clearCache();
    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw error;
    }
  }, []);

  // Get cache stats
  const getCacheStats = useCallback((): { size: number; hits: number; misses: number; hitRate: number } => {
    return ultimateNutritionAPI.getCacheStats();
  }, []);

  // Get available providers
  const getAvailableProviders = useCallback((): string[] => {
    return ultimateNutritionAPI.getAvailableProviders();
  }, []);

  // Get best available API
  const getBestAvailableAPI = useCallback((): string => {
    return ultimateNutritionAPI.getBestAvailableAPI();
  }, []);

  // Check if any API is available
  const hasAvailableAPI = useCallback((): boolean => {
    return ultimateNutritionAPI.hasAvailableAPI();
  }, []);

  // Get quota utilization
  const getQuotaUtilization = useCallback((apiName: string): number => {
    return ultimateNutritionAPI.getQuotaUtilization(apiName);
  }, []);

  // Get next quota reset time
  const getNextQuotaResetTime = useCallback((): Date => {
    return ultimateNutritionAPI.getNextQuotaResetTime();
  }, []);

  // Get Australian nutrition recommendations
  const getAustralianNutritionRecommendations = useCallback(() => {
    return ultimateNutritionAPI.getAustralianNutritionRecommendations();
  }, []);

  // Check Australian dietary guidelines
  const checkAustralianDietaryGuidelines = useCallback((product: FoodItem) => {
    return ultimateNutritionAPI.checkAustralianDietaryGuidelines(product);
  }, []);

  // Auto-clear errors after 5 seconds
  useEffect(() => {
    if (state.error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [state.error, clearError]);

  return {
    // State
    ...state,
    
    // Search functions
    searchFood,
    searchByBrand,
    searchByCategory,
    
    // Barcode functions
    lookupBarcode,
    getBulkProducts,
    
    // Utility functions
    getUsageStats,
    clearCache,
    getCacheStats,
    getAvailableProviders,
    getBestAvailableAPI,
    hasAvailableAPI,
    getQuotaUtilization,
    getNextQuotaResetTime,
    
    // Australian-specific functions
    getAustralianNutritionRecommendations,
    checkAustralianDietaryGuidelines,
    
    // State management
    clearError,
    resetState
  };
};
