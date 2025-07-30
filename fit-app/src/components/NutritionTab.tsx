import React, { useState } from 'react';
import { Apple, Camera, Upload, Loader2, Search, Info } from 'lucide-react';
import { useMCPTools } from '../hooks/useMCPTools';

export const NutritionTab: React.FC = () => {
  const [foodInput, setFoodInput] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const { analyzeNutrition, loading, error } = useMCPTools();

  const handleTextAnalysis = async () => {
    if (!foodInput.trim()) return;
    
    try {
      const result = await analyzeNutrition(foodInput);
      setAnalysisResult(result);
    } catch (err) {
      console.error('Nutrition analysis failed:', err);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageAnalysis = async () => {
    if (!imageFile) return;
    
    try {
      const result = await analyzeNutrition(imageFile);
      setAnalysisResult(result);
    } catch (err) {
      console.error('Image analysis failed:', err);
    }
  };

  const totalMacros = analysisResult?.totalNutrition || {};
  const macroPercentages = {
    protein: totalMacros.protein ? (totalMacros.protein * 4 / totalMacros.calories * 100).toFixed(1) : 0,
    carbs: totalMacros.carbs ? (totalMacros.carbs * 4 / totalMacros.calories * 100).toFixed(1) : 0,
    fat: totalMacros.fat ? (totalMacros.fat * 9 / totalMacros.calories * 100).toFixed(1) : 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-900/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-800">
        <div className="flex items-center space-x-4 mb-4">
          <Apple className="w-8 h-8 text-green-400" />
          <div>
            <h2 className="text-2xl font-bold">AI Nutrition Tracking</h2>
            <p className="text-gray-400">Analyze food with text or images</p>
          </div>
        </div>

        {/* Text Input */}
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={foodInput}
              onChange={(e) => setFoodInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleTextAnalysis()}
              placeholder="Describe your meal (e.g., 'grilled chicken breast with brown rice')"
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-lime-400 pr-12"
            />
            <button
              onClick={handleTextAnalysis}
              disabled={loading || !foodInput.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-lime-400 hover:text-lime-300 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </button>
          </div>

          {/* Image Upload */}
          <div className="flex items-center space-x-4">
            <label className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <div className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl cursor-pointer hover:bg-gray-800/70 transition-colors">
                <Camera className="w-5 h-5 text-gray-400" />
                <span className="text-gray-400">Upload food photo</span>
              </div>
            </label>
            {imageFile && (
              <button
                onClick={handleImageAnalysis}
                disabled={loading}
                className="px-4 py-3 bg-lime-400 text-black rounded-xl hover:bg-lime-500 disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Analyze Image'}
              </button>
            )}
          </div>

          {/* Image Preview */}
          {imagePreview && (
            <div className="relative rounded-xl overflow-hidden">
              <img src={imagePreview} alt="Food preview" className="w-full h-48 object-cover" />
              <button
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                }}
                className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-black/70"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <div className="space-y-6">
          {/* Macro Overview */}
          <div className="bg-gray-900/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-800">
            <h3 className="text-xl font-bold mb-4">Nutritional Analysis</h3>
            
            {/* Calories */}
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-lime-400">{totalMacros.calories || 0}</div>
              <div className="text-gray-400">Total Calories</div>
            </div>

            {/* Macro Breakdown */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{totalMacros.protein || 0}g</div>
                <div className="text-sm text-gray-400">Protein</div>
                <div className="text-xs text-gray-500">{macroPercentages.protein}%</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">{totalMacros.carbs || 0}g</div>
                <div className="text-sm text-gray-400">Carbs</div>
                <div className="text-xs text-gray-500">{macroPercentages.carbs}%</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{totalMacros.fat || 0}g</div>
                <div className="text-sm text-gray-400">Fat</div>
                <div className="text-xs text-gray-500">{macroPercentages.fat}%</div>
              </div>
            </div>

            {/* Macro Bar */}
            <div className="h-4 bg-gray-800 rounded-full overflow-hidden flex">
              <div 
                className="bg-blue-400 transition-all duration-500"
                style={{ width: `${macroPercentages.protein}%` }}
              />
              <div 
                className="bg-orange-400 transition-all duration-500"
                style={{ width: `${macroPercentages.carbs}%` }}
              />
              <div 
                className="bg-yellow-400 transition-all duration-500"
                style={{ width: `${macroPercentages.fat}%` }}
              />
            </div>

            {/* Additional Nutrients */}
            {(totalMacros.fiber || totalMacros.sugar || totalMacros.sodium) && (
              <div className="grid grid-cols-3 gap-4 mt-6">
                {totalMacros.fiber !== undefined && (
                  <div className="text-center">
                    <div className="text-lg font-semibold">{totalMacros.fiber}g</div>
                    <div className="text-xs text-gray-400">Fiber</div>
                  </div>
                )}
                {totalMacros.sugar !== undefined && (
                  <div className="text-center">
                    <div className="text-lg font-semibold">{totalMacros.sugar}g</div>
                    <div className="text-xs text-gray-400">Sugar</div>
                  </div>
                )}
                {totalMacros.sodium !== undefined && (
                  <div className="text-center">
                    <div className="text-lg font-semibold">{totalMacros.sodium}mg</div>
                    <div className="text-xs text-gray-400">Sodium</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Food Items */}
          {analysisResult.foods && analysisResult.foods.length > 0 && (
            <div className="bg-gray-900/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-800">
              <h3 className="text-xl font-bold mb-4">Food Breakdown</h3>
              <div className="space-y-3">
                {analysisResult.foods.map((food: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                    <div>
                      <div className="font-medium capitalize">{food.name}</div>
                      <div className="text-sm text-gray-400">{food.quantity}{food.unit}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{food.nutrition.calories} cal</div>
                      <div className="text-xs text-gray-400">
                        P: {food.nutrition.protein}g | C: {food.nutrition.carbs}g | F: {food.nutrition.fat}g
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
            <div className="bg-gray-900/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-800">
              <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
                <Info className="w-5 h-5 text-lime-400" />
                <span>AI Recommendations</span>
              </h3>
              <div className="space-y-3">
                {analysisResult.recommendations.map((rec: string, index: number) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-lime-400 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-gray-300">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      {!analysisResult && (
        <div className="bg-gray-900/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-800">
          <h3 className="text-xl font-bold mb-4">Quick Food Examples</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              'Chicken breast with rice',
              'Greek yogurt with berries',
              'Protein shake',
              'Salmon and vegetables',
              'Oatmeal with banana',
              'Egg white omelet'
            ].map((example) => (
              <button
                key={example}
                onClick={() => {
                  setFoodInput(example);
                  handleTextAnalysis();
                }}
                className="p-3 bg-gray-800/50 rounded-xl hover:bg-gray-800/70 transition-colors text-left"
              >
                <span className="text-sm text-gray-300">{example}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};