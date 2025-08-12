import React, { useState } from 'react';
import { useNutritionAPI } from '../hooks/useNutritionAPI';
import { FoodItem } from '../services/nutrition/types/nutrition.types';

export const NutritionAPITest: React.FC = () => {
  const [testBarcode, setTestBarcode] = useState('9310072011691'); // Tim Tam Original
  const [testQuery, setTestQuery] = useState('Tim Tam');
  const [results, setResults] = useState<FoodItem[]>([]);
  const [barcodeResult, setBarcodeResult] = useState<FoodItem | null>(null);
  const [usageStats, setUsageStats] = useState<any>(null);

  const {
    isLoading,
    error,
    searchFood,
    lookupBarcode,
    getUsageStats,
    getAvailableProviders,
    getCacheStats,
    clearCache
  } = useNutritionAPI();

  const handleSearch = async () => {
    const result = await searchFood(testQuery);
    if (result.success) {
      setResults(result.results);
    } else {
      console.error('Search failed:', result.error);
    }
  };

  const handleBarcodeLookup = async () => {
    const result = await lookupBarcode(testBarcode);
    if (result.success && result.data) {
      setBarcodeResult(result.data);
    } else {
      console.error('Barcode lookup failed:', result.error);
    }
  };

  const handleGetUsageStats = async () => {
    const stats = await getUsageStats();
    setUsageStats(stats);
  };

  const handleClearCache = async () => {
    await clearCache();
    alert('Cache cleared!');
  };

  const cacheStats = getCacheStats();
  const availableProviders = getAvailableProviders();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white mb-6">Nutrition API Test</h1>

      {/* API Status */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
        <h2 className="text-xl font-semibold text-white mb-4">API Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {['openfoodfacts', 'fatsecret', 'spoonacular', 'nutritionix', 'usda'].map(api => (
            <div key={api} className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${availableProviders.includes(api) ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-white capitalize">{api}</span>
            </div>
          ))}
        </div>
        <p className="text-white/60 mt-2">
          Available APIs: {availableProviders.length}/5
        </p>
      </div>

      {/* Cache Stats */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Cache Statistics</h2>
          <button
            onClick={handleClearCache}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Clear Cache
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-white/60 text-sm">Size</p>
            <p className="text-white font-semibold">{cacheStats.size} items</p>
          </div>
          <div>
            <p className="text-white/60 text-sm">Hits</p>
            <p className="text-white font-semibold">{cacheStats.hits}</p>
          </div>
          <div>
            <p className="text-white/60 text-sm">Misses</p>
            <p className="text-white font-semibold">{cacheStats.misses}</p>
          </div>
          <div>
            <p className="text-white/60 text-sm">Hit Rate</p>
            <p className="text-white font-semibold">{cacheStats.hitRate.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Usage Statistics</h2>
          <button
            onClick={handleGetUsageStats}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Refresh
          </button>
        </div>
        {usageStats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Object.entries(usageStats).map(([api, stats]: [string, any]) => (
              <div key={api} className="bg-white/5 rounded-lg p-3">
                <h3 className="text-white font-medium capitalize mb-2">{api}</h3>
                <div className="space-y-1 text-sm">
                  <p className="text-white/60">Today: {stats.callsToday}</p>
                  <p className="text-white/60">Remaining: {stats.remaining}</p>
                  <p className="text-white/60">Quota: {stats.quota === Infinity ? '∞' : stats.quota}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search Test */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
        <h2 className="text-xl font-semibold text-white mb-4">Search Test</h2>
        <div className="flex space-x-4 mb-4">
          <input
            type="text"
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            placeholder="Enter search query..."
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/60"
          />
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
        
        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-white font-medium">Search Results ({results.length})</h3>
            {results.slice(0, 5).map((item) => (
              <div key={item.id} className="bg-white/5 border border-white/20 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="text-white font-medium">{item.name}</h4>
                  {item.australianProduct && (
                    <span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded-full">
                      AU
                    </span>
                  )}
                  <span className="text-white/40 text-xs capitalize">{item.source}</span>
                </div>
                <p className="text-white/60 text-sm">
                  {item.calories} cal • P: {item.protein}g • C: {item.carbs}g • F: {item.fat}g
                </p>
                <p className="text-white/40 text-xs">
                  Confidence: {Math.round(item.confidence * 100)}% • {item.serving_size}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Barcode Test */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
        <h2 className="text-xl font-semibold text-white mb-4">Barcode Test</h2>
        <div className="flex space-x-4 mb-4">
          <input
            type="text"
            value={testBarcode}
            onChange={(e) => setTestBarcode(e.target.value)}
            placeholder="Enter barcode..."
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/60"
          />
          <button
            onClick={handleBarcodeLookup}
            disabled={isLoading}
            className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Looking up...' : 'Lookup'}
          </button>
        </div>
        
        {barcodeResult && (
          <div className="bg-white/5 border border-white/20 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-white font-semibold">{barcodeResult.name}</h3>
              {barcodeResult.australianProduct && (
                <span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded-full">
                  AU
                </span>
              )}
              <span className="text-white/40 text-xs capitalize">{barcodeResult.source}</span>
            </div>
            <p className="text-white/60 mb-2">
              Brand: {barcodeResult.brand || 'Unknown'} • Barcode: {barcodeResult.barcode}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-white/60">Calories</p>
                <p className="text-white font-medium">{barcodeResult.calories}</p>
              </div>
              <div>
                <p className="text-white/60">Protein</p>
                <p className="text-white font-medium">{barcodeResult.protein}g</p>
              </div>
              <div>
                <p className="text-white/60">Carbs</p>
                <p className="text-white font-medium">{barcodeResult.carbs}g</p>
              </div>
              <div>
                <p className="text-white/60">Fat</p>
                <p className="text-white font-medium">{barcodeResult.fat}g</p>
              </div>
            </div>
            <p className="text-white/40 text-xs mt-2">
              Confidence: {Math.round(barcodeResult.confidence * 100)}% • {barcodeResult.serving_size}
            </p>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {/* Test Barcodes */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
        <h2 className="text-xl font-semibold text-white mb-4">Test Australian Barcodes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setTestBarcode('9310072011691')}
            className="bg-white/5 border border-white/20 rounded-lg p-3 text-left hover:bg-white/10 transition-colors"
          >
            <p className="text-white font-medium">Tim Tam Original</p>
            <p className="text-white/60 text-sm">9310072011691</p>
          </button>
          <button
            onClick={() => setTestBarcode('9300675024235')}
            className="bg-white/5 border border-white/20 rounded-lg p-3 text-left hover:bg-white/10 transition-colors"
          >
            <p className="text-white font-medium">Vegemite 220g</p>
            <p className="text-white/60 text-sm">9300675024235</p>
          </button>
          <button
            onClick={() => setTestBarcode('9414559001234')}
            className="bg-white/5 border border-white/20 rounded-lg p-3 text-left hover:bg-white/10 transition-colors"
          >
            <p className="text-white font-medium">Various AU Products</p>
            <p className="text-white/60 text-sm">9414559001234</p>
          </button>
          <button
            onClick={() => setTestBarcode('93123456789')}
            className="bg-white/5 border border-white/20 rounded-lg p-3 text-left hover:bg-white/10 transition-colors"
          >
            <p className="text-white font-medium">Generic Test</p>
            <p className="text-white/60 text-sm">93123456789</p>
          </button>
        </div>
      </div>
    </div>
  );
};
