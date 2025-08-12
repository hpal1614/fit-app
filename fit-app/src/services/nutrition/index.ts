// Main API service
export { UltimateNutritionAPI, ultimateNutritionAPI } from './UltimateNutritionAPI';

// Types
export * from './types/nutrition.types';

// Utilities
export { CacheManager } from './utils/cache';
export { QuotaManager } from './utils/quotaManager';
export { DataFormatter } from './utils/dataFormatter';
export { AustralianProductEnhancer } from './utils/australianEnhancer';

// API Providers
export { OpenFoodFactsAPI } from './providers/OpenFoodFactsAPI';
export { FatSecretAPI } from './providers/FatSecretAPI';
export { SpoonacularAPI } from './providers/SpoonacularAPI';
export { NutritionixAPI } from './providers/NutritionixAPI';
export { USDAAPI } from './providers/USDAAPI';
