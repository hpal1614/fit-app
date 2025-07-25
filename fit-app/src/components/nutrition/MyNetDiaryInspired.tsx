import React, { useState } from 'react';
import { Search, Camera, Plus, Target, TrendingUp, Clock, Utensils, X, BarChart3 } from 'lucide-react';

interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  servingSize: string;
  barcode?: string;
}

interface LoggedFood extends FoodItem {
  logId: string;
  quantity: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  timestamp: Date;
}

export const MyNetDiaryInspired: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMeal, setSelectedMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snacks'>('breakfast');
  const [loggedFoods, setLoggedFoods] = useState<LoggedFood[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  // Sample food database
  const foodDatabase: FoodItem[] = [
    {
      id: '1',
      name: 'Chicken Breast',
      brand: 'Generic',
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      fiber: 0,
      sodium: 74,
      servingSize: '100g'
    },
    {
      id: '2', 
      name: 'Brown Rice',
      brand: 'Generic',
      calories: 111,
      protein: 2.6,
      carbs: 23,
      fat: 0.9,
      fiber: 1.8,
      sodium: 5,
      servingSize: '100g cooked'
    },
    {
      id: '3',
      name: 'Avocado',
      brand: 'Fresh',
      calories: 160,
      protein: 2,
      carbs: 9,
      fat: 15,
      fiber: 7,
      sodium: 7,
      servingSize: '100g'
    },
    {
      id: '4',
      name: 'Greek Yogurt',
      brand: 'Chobani',
      calories: 100,
      protein: 18,
      carbs: 6,
      fat: 0,
      fiber: 0,
      sugar: 4,
      servingSize: '1 cup (227g)'
    },
    {
      id: '5',
      name: 'Banana',
      brand: 'Fresh',
      calories: 89,
      protein: 1.1,
      carbs: 23,
      fat: 0.3,
      fiber: 2.6,
      sugar: 12,
      servingSize: '1 medium (118g)'
    }
  ];

  // Daily goals (example)
  const dailyGoals = {
    calories: 2200,
    protein: 150,
    carbs: 275,
    fat: 73,
    fiber: 25
  };

  // Calculate daily totals
  const dailyTotals = loggedFoods.reduce((totals, food) => ({
    calories: totals.calories + (food.calories * food.quantity),
    protein: totals.protein + (food.protein * food.quantity),
    carbs: totals.carbs + (food.carbs * food.quantity),
    fat: totals.fat + (food.fat * food.quantity),
    fiber: totals.fiber + ((food.fiber || 0) * food.quantity)
  }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

  const getMealFoods = (mealType: string) => 
    loggedFoods.filter(food => food.mealType === mealType);

  const getMealCalories = (mealType: string) =>
    getMealFoods(mealType).reduce((sum, food) => sum + (food.calories * food.quantity), 0);

  const addFoodToMeal = (food: FoodItem, quantity: number = 1) => {
    const loggedFood: LoggedFood = {
      ...food,
      logId: `${food.id}-${Date.now()}`,
      quantity,
      mealType: selectedMeal,
      timestamp: new Date()
    };
    setLoggedFoods(prev => [...prev, loggedFood]);
    setShowSearch(false);
  };

  const removeFood = (logId: string) => {
    setLoggedFoods(prev => prev.filter(food => food.logId !== logId));
  };

  const MacroBar: React.FC<{ 
    label: string; 
    current: number; 
    goal: number; 
    unit: string;
    color: string;
  }> = ({ label, current, goal, unit, color }) => {
    const percentage = Math.min((current / goal) * 100, 100);
    const isOver = current > goal;
    
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
          <span className={`${isOver ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
            {Math.round(current)}/{goal}{unit}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              isOver ? 'bg-red-500' : color
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    );
  };

  if (showSearch) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        {/* Search Header */}
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => setShowSearch(false)}
            className="text-blue-600 font-medium"
          >
            Cancel
          </button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex-1 text-center">
            Add to {selectedMeal.charAt(0).toUpperCase() + selectedMeal.slice(1)}
          </h2>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search foods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border-0 focus:ring-2 focus:ring-blue-600"
            autoFocus
          />
        </div>

        {/* Quick Add Options */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Camera className="text-blue-600 mx-auto mb-2" size={24} />
            <div className="text-sm font-medium text-gray-900 dark:text-white">Camera</div>
            <div className="text-xs text-gray-500">Scan food</div>
          </button>
          <button className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Target className="text-green-600 mx-auto mb-2" size={24} />
            <div className="text-sm font-medium text-gray-900 dark:text-white">Barcode</div>
            <div className="text-xs text-gray-500">Scan package</div>
          </button>
        </div>

        {/* Food Results */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            {searchQuery ? 'Search Results' : 'Recent Foods'}
          </h3>
          
          {foodDatabase
            .filter(food => 
              !searchQuery || 
              food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              food.brand?.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map(food => (
              <button
                key={food.id}
                onClick={() => addFoodToMeal(food)}
                className="w-full p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">{food.name}</div>
                    {food.brand && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">{food.brand}</div>
                    )}
                    <div className="text-sm text-gray-500 dark:text-gray-400">{food.servingSize}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900 dark:text-white">{food.calories} cal</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      P: {food.protein}g • C: {food.carbs}g • F: {food.fat}g
                    </div>
                  </div>
                </div>
              </button>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 pb-24">
      {/* Daily Summary Card */}
      <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold">Today's Nutrition</h2>
            <p className="text-green-100">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{Math.round(dailyTotals.calories)}</div>
            <div className="text-sm text-green-100">of {dailyGoals.calories} cal</div>
          </div>
        </div>

        {/* Calories Progress */}
        <div className="w-full bg-white/20 rounded-full h-3 mb-4">
          <div 
            className="bg-white h-3 rounded-full transition-all duration-300"
            style={{ width: `${Math.min((dailyTotals.calories / dailyGoals.calories) * 100, 100)}%` }}
          />
        </div>

        {/* Macro Summary */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold">{Math.round(dailyTotals.protein)}g</div>
            <div className="text-xs text-green-100">Protein</div>
          </div>
          <div>
            <div className="text-lg font-semibold">{Math.round(dailyTotals.carbs)}g</div>
            <div className="text-xs text-green-100">Carbs</div>
          </div>
          <div>
            <div className="text-lg font-semibold">{Math.round(dailyTotals.fat)}g</div>
            <div className="text-xs text-green-100">Fat</div>
          </div>
        </div>
      </div>

      {/* Detailed Macros */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Macro Breakdown</h3>
        <div className="space-y-4">
          <MacroBar 
            label="Protein" 
            current={dailyTotals.protein} 
            goal={dailyGoals.protein} 
            unit="g"
            color="bg-red-500"
          />
          <MacroBar 
            label="Carbohydrates" 
            current={dailyTotals.carbs} 
            goal={dailyGoals.carbs} 
            unit="g"
            color="bg-blue-500"
          />
          <MacroBar 
            label="Fat" 
            current={dailyTotals.fat} 
            goal={dailyGoals.fat} 
            unit="g"
            color="bg-yellow-500"
          />
          <MacroBar 
            label="Fiber" 
            current={dailyTotals.fiber} 
            goal={dailyGoals.fiber} 
            unit="g"
            color="bg-green-500"
          />
        </div>
      </div>

      {/* Meal Sections */}
      {(['breakfast', 'lunch', 'dinner', 'snacks'] as const).map(meal => (
        <div key={meal} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          {/* Meal Header */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Utensils className="text-gray-400" size={20} />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                    {meal}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {getMealCalories(meal)} calories
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedMeal(meal);
                  setShowSearch(true);
                }}
                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Meal Foods */}
          <div className="p-4">
            {getMealFoods(meal).length === 0 ? (
              <button
                onClick={() => {
                  setSelectedMeal(meal);
                  setShowSearch(true);
                }}
                className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
              >
                Add food to {meal}
              </button>
            ) : (
              <div className="space-y-3">
                {getMealFoods(meal).map(food => (
                  <div key={food.logId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg group">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">{food.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {food.quantity} × {food.servingSize}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {Math.round(food.calories * food.quantity)} cal
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          P: {Math.round(food.protein * food.quantity)}g • 
                          C: {Math.round(food.carbs * food.quantity)}g • 
                          F: {Math.round(food.fat * food.quantity)}g
                        </div>
                      </div>
                      <button
                        onClick={() => removeFood(food.logId)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Quick Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Stats</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {Math.round((dailyTotals.protein * 4) / dailyTotals.calories * 100) || 0}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Protein %</div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {Math.round(dailyTotals.fiber)}g
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Fiber</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyNetDiaryInspired;