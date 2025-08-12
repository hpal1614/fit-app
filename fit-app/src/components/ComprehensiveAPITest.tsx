import React, { useState } from 'react';
import { ultimateNutritionAPI } from '../services/nutrition/UltimateNutritionAPI';

export const ComprehensiveAPITest: React.FC = () => {
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testBarcode, setTestBarcode] = useState('3017620422003');

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testAllAPIs = async () => {
    setIsLoading(true);
    setResults([]);
    
    addResult('🚀 Starting comprehensive API test...');
    addResult(`📦 Testing barcode: ${testBarcode}`);
    
    try {
      // Test the main lookup function
      addResult('🔍 Testing UltimateNutritionAPI.lookupBarcode...');
      const result = await ultimateNutritionAPI.lookupBarcode(testBarcode);
      
      if (result.success) {
        addResult(`✅ Success! Found ${result.results.length} results`);
        
        // Show details for each result
        result.results.forEach((item, index) => {
          addResult(`  📋 Result ${index + 1}:`);
          addResult(`    Name: ${item.name}`);
          addResult(`    Source: ${item.source}`);
          addResult(`    Confidence: ${Math.round(item.confidence * 100)}%`);
          addResult(`    Calories: ${item.calories} kcal/100g`);
          addResult(`    Protein: ${item.protein}g/100g`);
          addResult(`    Carbs: ${item.carbs}g/100g`);
          addResult(`    Fat: ${item.fat}g/100g`);
          if (item.australianProduct) {
            addResult(`    🇦🇺 Australian Product: Yes`);
          }
          if (item.healthStarRating) {
            addResult(`    ⭐ Health Star Rating: ${item.healthStarRating}/5`);
          }
        });
      } else {
        addResult(`❌ Error: ${result.error}`);
      }
      
      // Test individual API providers
      addResult('🔧 Testing individual API providers...');
      
      const providers = ultimateNutritionAPI.getAvailableProviders();
      addResult(`📊 Available providers: ${providers.join(', ')}`);
      
      // Test search functionality
      addResult('🔍 Testing search functionality...');
      const searchResult = await ultimateNutritionAPI.searchFood('apple');
      if (searchResult.success) {
        addResult(`✅ Search successful! Found ${searchResult.results.length} results for "apple"`);
      } else {
        addResult(`❌ Search failed: ${searchResult.error}`);
      }
      
      // Test cache functionality
      addResult('💾 Testing cache functionality...');
      const cacheStats = ultimateNutritionAPI.getCacheStats();
      addResult(`📊 Cache stats: ${cacheStats.size} items, ${cacheStats.hits} hits, ${cacheStats.misses} misses`);
      
      // Test quota management
      addResult('📊 Testing quota management...');
      const usageStats = ultimateNutritionAPI.getUsageStats();
      addResult(`📈 Usage stats: ${JSON.stringify(usageStats, null, 2)}`);
      
    } catch (error) {
      addResult(`❌ Test failed with error: ${error}`);
    }
    
    addResult('🎉 Comprehensive test completed!');
    setIsLoading(false);
  };

  const testAustralianBarcodes = async () => {
    setIsLoading(true);
    setResults([]);
    
    addResult('🇦🇺 Testing Australian barcodes...');
    
    const australianBarcodes = [
      '9310072011691', // Tim Tam
      '9300675024235', // Vegemite
      '9414559001234', // Australian product
    ];
    
    for (const barcode of australianBarcodes) {
      addResult(`🔍 Testing barcode: ${barcode}`);
      try {
        const result = await ultimateNutritionAPI.lookupBarcode(barcode);
        if (result.success && result.results.length > 0) {
          const item = result.results[0];
          addResult(`✅ Found: ${item.name} (${item.source})`);
          if (item.australianProduct) {
            addResult(`🇦🇺 Australian product detected!`);
          }
        } else {
          addResult(`❌ Not found: ${result.error}`);
        }
      } catch (error) {
        addResult(`❌ Error: ${error}`);
      }
    }
    
    setIsLoading(false);
  };

  const clearCache = () => {
    ultimateNutritionAPI.clearCache();
    addResult('🗑️ Cache cleared!');
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
      <h2 className="text-3xl font-bold text-white mb-6">🧪 Comprehensive API Test</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-white font-medium mb-2">Test Barcode:</label>
          <input
            type="text"
            value={testBarcode}
            onChange={(e) => setTestBarcode(e.target.value)}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50"
            placeholder="Enter barcode to test"
          />
        </div>
        
        <div className="flex flex-col justify-end">
          <div className="text-white/80 text-sm">
            <p>💡 Try these barcodes:</p>
            <p>• 3017620422003 (Nutella)</p>
            <p>• 9310072011691 (Tim Tam)</p>
            <p>• 9300675024235 (Vegemite)</p>
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={testAllAPIs}
          disabled={isLoading}
          className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 font-medium"
        >
          {isLoading ? '🔄 Testing...' : '🚀 Test All APIs'}
        </button>
        
        <button
          onClick={testAustralianBarcodes}
          disabled={isLoading}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 font-medium"
        >
          🇦🇺 Test Australian Barcodes
        </button>
        
        <button
          onClick={clearCache}
          className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors font-medium"
        >
          🗑️ Clear Cache
        </button>
        
        <button
          onClick={() => setResults([])}
          className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium"
        >
          📝 Clear Results
        </button>
      </div>

      <div className="bg-black/20 rounded-lg p-4 max-h-96 overflow-y-auto">
        <h3 className="text-white font-medium mb-2">Test Results:</h3>
        {results.length === 0 ? (
          <p className="text-white/60">No test results yet. Click a button to start testing.</p>
        ) : (
          <div className="space-y-1">
            {results.map((result, index) => (
              <div key={index} className="text-sm font-mono">
                <span className="text-white/80">{result}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-green-500/20 border border-green-500/40 rounded-lg">
          <h3 className="text-green-300 font-medium mb-2">✅ Expected Results:</h3>
          <ul className="text-green-200 text-sm space-y-1">
            <li>• All 5 APIs should be available</li>
            <li>• Barcode lookup should return results</li>
            <li>• Australian products should be detected</li>
            <li>• Cache should be working</li>
            <li>• Quota management should be active</li>
          </ul>
        </div>
        
        <div className="p-4 bg-blue-500/20 border border-blue-500/40 rounded-lg">
          <h3 className="text-blue-300 font-medium mb-2">🔧 API Status:</h3>
          <ul className="text-blue-200 text-sm space-y-1">
            <li>• Open Food Facts: ✅ (No key needed)</li>
            <li>• FatSecret: 🔑 (OAuth 1.0)</li>
            <li>• Spoonacular: 🔑 (API Key)</li>
            <li>• Nutritionix: 🔑 (App ID + Key)</li>
            <li>• USDA: 🔑 (API Key)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
