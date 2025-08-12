import React, { useState } from 'react';
import { ultimateNutritionAPI } from '../services/nutrition/UltimateNutritionAPI';

export const APIDebugTest: React.FC = () => {
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testOpenFoodFacts = async () => {
    try {
      addResult('Testing Open Food Facts...');
      const result = await ultimateNutritionAPI.lookupBarcode('3017620422003');
      if (result.success) {
        addResult(`✅ Open Food Facts: Found ${result.results.length} results`);
      } else {
        addResult(`❌ Open Food Facts: ${result.error}`);
      }
    } catch (error) {
      addResult(`❌ Open Food Facts Error: ${error}`);
    }
  };

  const testFatSecret = async () => {
    try {
      addResult('Testing FatSecret...');
      const result = await ultimateNutritionAPI.lookupBarcode('3017620422003');
      if (result.success) {
        addResult(`✅ FatSecret: Found ${result.results.length} results`);
      } else {
        addResult(`❌ FatSecret: ${result.error}`);
      }
    } catch (error) {
      addResult(`❌ FatSecret Error: ${error}`);
    }
  };

  const testSpoonacular = async () => {
    try {
      addResult('Testing Spoonacular...');
      const result = await ultimateNutritionAPI.lookupBarcode('3017620422003');
      if (result.success) {
        addResult(`✅ Spoonacular: Found ${result.results.length} results`);
      } else {
        addResult(`❌ Spoonacular: ${result.error}`);
      }
    } catch (error) {
      addResult(`❌ Spoonacular Error: ${error}`);
    }
  };

  const testNutritionix = async () => {
    try {
      addResult('Testing Nutritionix...');
      const result = await ultimateNutritionAPI.lookupBarcode('3017620422003');
      if (result.success) {
        addResult(`✅ Nutritionix: Found ${result.results.length} results`);
      } else {
        addResult(`❌ Nutritionix: ${result.error}`);
      }
    } catch (error) {
      addResult(`❌ Nutritionix Error: ${error}`);
    }
  };

  const testUSDA = async () => {
    try {
      addResult('Testing USDA...');
      const result = await ultimateNutritionAPI.lookupBarcode('3017620422003');
      if (result.success) {
        addResult(`✅ USDA: Found ${result.results.length} results`);
      } else {
        addResult(`❌ USDA: ${result.error}`);
      }
    } catch (error) {
      addResult(`❌ USDA Error: ${error}`);
    }
  };

  const testAllAPIs = async () => {
    setIsLoading(true);
    setResults([]);
    
    addResult('Starting API tests...');
    
    await testOpenFoodFacts();
    await testFatSecret();
    await testSpoonacular();
    await testNutritionix();
    await testUSDA();
    
    addResult('All tests completed!');
    setIsLoading(false);
  };

  const checkEnvironmentVariables = () => {
    addResult('Checking environment variables...');
    
    const vars = {
      'VITE_FATSECRET_CONSUMER_KEY': import.meta.env.VITE_FATSECRET_CONSUMER_KEY,
      'VITE_FATSECRET_CONSUMER_SECRET': import.meta.env.VITE_FATSECRET_CONSUMER_SECRET,
      'VITE_SPOONACULAR_API_KEY': import.meta.env.VITE_SPOONACULAR_API_KEY,
      'VITE_NUTRITIONIX_APP_ID': import.meta.env.VITE_NUTRITIONIX_APP_ID,
      'VITE_NUTRITIONIX_APP_KEY': import.meta.env.VITE_NUTRITIONIX_APP_KEY,
      'VITE_USDA_API_KEY': import.meta.env.VITE_USDA_API_KEY,
    };

    Object.entries(vars).forEach(([key, value]) => {
      if (value && value !== 'undefined') {
        addResult(`✅ ${key}: Set (${value.substring(0, 8)}...)`);
      } else {
        addResult(`❌ ${key}: Not set`);
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
      <h2 className="text-2xl font-bold text-white mb-6">API Debug Test</h2>
      
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={checkEnvironmentVariables}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Check Environment Variables
        </button>
        <button
          onClick={testAllAPIs}
          disabled={isLoading}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Test All APIs'}
        </button>
        <button
          onClick={() => setResults([])}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
        >
          Clear Results
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

      <div className="mt-6 p-4 bg-yellow-500/20 border border-yellow-500/40 rounded-lg">
        <h3 className="text-yellow-300 font-medium mb-2">Troubleshooting Tips:</h3>
        <ul className="text-yellow-200 text-sm space-y-1">
          <li>• Create a <code>.env</code> file in your project root</li>
          <li>• Add your API keys to the environment file</li>
          <li>• Restart the development server after adding keys</li>
          <li>• Check that API keys are valid and not expired</li>
          <li>• Verify API quotas haven't been exceeded</li>
        </ul>
      </div>
    </div>
  );
};
