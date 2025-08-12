import React, { useState } from 'react';
import { 
  Apple, Plus, Search, Scan, Mic, Brain, ChefHat, 
  Flame, Activity, Heart, Scale, Droplets, 
  Calendar, BarChart3, Utensils, Database, Wifi, 
  CheckCircle, AlertCircle, Lightbulb, Target,
  ChevronLeft, ChevronRight, X, Settings
} from 'lucide-react';

export const SimpleNutritionTracker: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [waterIntake, setWaterIntake] = useState(0);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  
  const dailyGoals = {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65
  };
  
  const consumed = {
    calories: 1200,
    protein: 85,
    carbs: 150,
    fat: 45
  };

  const waterGoal = 2500;

  const calculateProgress = (consumed: number, goal: number) => {
    return Math.min((consumed / goal) * 100, 100);
  };

  const getProgressGradient = (progress: number) => {
    if (progress < 50) return 'from-red-500 to-red-600';
    if (progress < 80) return 'from-yellow-500 to-orange-500';
    return 'from-green-500 to-emerald-600';
  };

  const addWaterIntake = (amount: number) => {
    setWaterIntake(prev => prev + amount);
  };

  const quickAddFoods = [
    { name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, icon: '🍌' },
    { name: 'Greek Yogurt', calories: 130, protein: 15, carbs: 9, fat: 4, icon: '🥛' },
    { name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, icon: '🍗' },
    { name: 'Brown Rice', calories: 110, protein: 2.5, carbs: 23, fat: 0.9, icon: '🍚' },
    { name: 'Broccoli', calories: 55, protein: 3.7, carbs: 11, fat: 0.6, icon: '🥦' },
    { name: 'Salmon', calories: 208, protein: 25, carbs: 0, fat: 12, icon: '🐟' }
  ];

  return (
    <div className="h-full min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">🍎 Enhanced Nutrition Dashboard</h2>
            <p className="text-white/80">Welcome! This is the NEW user-friendly nutrition tracker</p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setSelectedDate(new Date(selectedDate.getTime() - 24*60*60*1000))}
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div className="text-center">
              <span className="text-white font-medium text-lg">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
              <div className="text-white/60 text-sm">
                {selectedDate.toDateString() === new Date().toDateString() ? 'Today' : 'Selected Date'}
              </div>
            </div>
            <button 
              onClick={() => setSelectedDate(new Date(selectedDate.getTime() + 24*60*60*1000))}
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Insights Panel */}
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-lg rounded-xl p-4 border border-blue-500/40">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-medium flex items-center space-x-2">
              <Lightbulb className="w-5 h-5 text-yellow-400" />
              <span>🎉 NEW: Today's Insights</span>
            </h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-3 p-2 bg-white/5 rounded-lg">
              <span className="text-2xl">🎉</span>
              <div className="flex-1">
                <p className="text-white font-medium text-sm">Welcome to the Enhanced UI!</p>
                <p className="text-white/60 text-xs">This is the new user-friendly nutrition tracker with beautiful gradients and modern design.</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-2 bg-white/5 rounded-lg">
              <span className="text-2xl">💪</span>
              <div className="flex-1">
                <p className="text-white font-medium text-sm">Great Progress!</p>
                <p className="text-white/60 text-xs">You're doing well with your nutrition goals today.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Nutrition Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-lg rounded-xl p-4 border border-yellow-500/40">
            <div className="flex items-center space-x-2 mb-2">
              <Flame className="w-5 h-5 text-yellow-400" />
              <span className="text-white/80 text-sm">Calories</span>
            </div>
            <div className="text-2xl font-bold text-white">{consumed.calories}</div>
            <div className="text-white/60 text-sm">/ {dailyGoals.calories}</div>
            <div className="w-full bg-white/20 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 bg-gradient-to-r ${getProgressGradient(calculateProgress(consumed.calories, dailyGoals.calories))}`}
                style={{ width: `${calculateProgress(consumed.calories, dailyGoals.calories)}%` }}
              />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-lg rounded-xl p-4 border border-blue-500/40">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <span className="text-white/80 text-sm">Protein</span>
            </div>
            <div className="text-2xl font-bold text-white">{consumed.protein}g</div>
            <div className="text-white/60 text-sm">/ {dailyGoals.protein}g</div>
            <div className="w-full bg-white/20 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 bg-gradient-to-r ${getProgressGradient(calculateProgress(consumed.protein, dailyGoals.protein))}`}
                style={{ width: `${calculateProgress(consumed.protein, dailyGoals.protein)}%` }}
              />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-lg rounded-xl p-4 border border-green-500/40">
            <div className="flex items-center space-x-2 mb-2">
              <Heart className="w-5 h-5 text-green-400" />
              <span className="text-white/80 text-sm">Carbs</span>
            </div>
            <div className="text-2xl font-bold text-white">{consumed.carbs}g</div>
            <div className="text-white/60 text-sm">/ {dailyGoals.carbs}g</div>
            <div className="w-full bg-white/20 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 bg-gradient-to-r ${getProgressGradient(calculateProgress(consumed.carbs, dailyGoals.carbs))}`}
                style={{ width: `${calculateProgress(consumed.carbs, dailyGoals.carbs)}%` }}
              />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-xl p-4 border border-purple-500/40">
            <div className="flex items-center space-x-2 mb-2">
              <Scale className="w-5 h-5 text-purple-400" />
              <span className="text-white/80 text-sm">Fat</span>
            </div>
            <div className="text-2xl font-bold text-white">{consumed.fat}g</div>
            <div className="text-white/60 text-sm">/ {dailyGoals.fat}g</div>
            <div className="w-full bg-white/20 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 bg-gradient-to-r ${getProgressGradient(calculateProgress(consumed.fat, dailyGoals.fat))}`}
                style={{ width: `${calculateProgress(consumed.fat, dailyGoals.fat)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Water Intake */}
        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-lg rounded-xl p-4 border border-blue-500/40">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Droplets className="w-6 h-6 text-blue-400" />
              <span className="text-white font-medium text-lg">Water Intake</span>
            </div>
            <div className="text-white/80 text-lg font-medium">
              {waterIntake}ml / {waterGoal}ml
            </div>
          </div>
          <div className="w-full bg-white/20 rounded-full h-4 mb-4">
            <div 
              className="bg-gradient-to-r from-blue-400 to-cyan-400 h-4 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((waterIntake / waterGoal) * 100, 100)}%` }}
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[250, 500, 750, 1000].map(amount => (
              <button
                key={amount}
                onClick={() => addWaterIntake(amount)}
                className="bg-blue-500/20 text-blue-300 py-3 px-2 rounded-lg hover:bg-blue-500/30 transition-colors text-sm font-medium"
              >
                +{amount}ml
              </button>
            ))}
          </div>
        </div>

        {/* Quick Add Foods */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-medium text-lg flex items-center space-x-2">
              <ChefHat className="w-5 h-5" />
              <span>Quick Add Foods</span>
            </h3>
            <button
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              className="text-white/60 hover:text-white transition-colors"
            >
              {showQuickAdd ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
          {showQuickAdd && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {quickAddFoods.map((food, index) => (
                <button
                  key={index}
                  className="bg-white/5 border border-white/20 rounded-lg p-3 hover:bg-white/10 transition-colors text-left group"
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-2xl">{food.icon}</span>
                    <div className="text-white font-medium text-sm">{food.name}</div>
                  </div>
                  <div className="text-white/60 text-xs">{food.calories} cal • {food.protein}g protein</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex flex-col items-center space-y-2 shadow-lg hover:shadow-xl">
            <Search className="w-6 h-6" />
            <span>Search Food</span>
          </button>
          
          <button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex flex-col items-center space-y-2 shadow-lg hover:shadow-xl">
            <Scan className="w-6 h-6" />
            <span>Scan Barcode</span>
          </button>
          
          <button className="bg-gradient-to-r from-purple-500 to-violet-600 text-white p-4 rounded-xl font-medium hover:from-purple-600 hover:to-violet-700 transition-all duration-200 flex flex-col items-center space-y-2 shadow-lg hover:shadow-xl">
            <Mic className="w-6 h-6" />
            <span>Voice Input</span>
          </button>
          
          <button className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-4 rounded-xl font-medium hover:from-orange-600 hover:to-red-700 transition-all duration-200 flex flex-col items-center space-y-2 shadow-lg hover:shadow-xl">
            <Brain className="w-6 h-6" />
            <span>AI Suggestions</span>
          </button>
        </div>

        {/* API Status */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-medium flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <span>Nutrition API Status</span>
            </h3>
            <div className="flex items-center space-x-2">
              <Wifi className="w-4 h-4 text-green-400" />
              <span className="text-white/60 text-sm">
                5 APIs available
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { name: 'openfoodfacts', label: 'Open Food Facts', icon: '🌍' },
              { name: 'fatsecret', label: 'FatSecret', icon: '🔑' },
              { name: 'spoonacular', label: 'Spoonacular', icon: '🍽️' },
              { name: 'nutritionix', label: 'Nutritionix', icon: '📊' },
              { name: 'usda', label: 'USDA', icon: '🇺🇸' }
            ].map(api => (
              <div key={api.name} className="flex items-center space-x-2 p-2 bg-white/5 rounded-lg">
                <span className="text-lg">{api.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-white/80 text-xs">{api.label}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Success Message */}
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-lg rounded-xl p-4 border border-green-500/40 text-center">
          <h3 className="text-white font-medium text-lg mb-2">✅ Enhanced UI Successfully Loaded!</h3>
          <p className="text-white/80">This is the new user-friendly nutrition tracker with beautiful gradients, modern design, and enhanced functionality.</p>
        </div>
      </div>
    </div>
  );
};
