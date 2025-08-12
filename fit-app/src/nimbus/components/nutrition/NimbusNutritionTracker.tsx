import React, { useState, useRef } from 'react';
import { 
  Apple, Plus, TrendingUp, Camera, Search, Scan, 
  Calendar, BarChart3, X, 
  ChefHat, Zap, Brain, Star, Award, Utensils, Scale,
  Mic, 
  CheckCircle, Info, Heart, Activity, Database, Wifi, WifiOff
} from 'lucide-react';
import { useNutritionAPI } from '../../../hooks/useNutritionAPI';
import { FoodItem } from '../../../services/nutrition/types/nutrition.types';

// Meal plan interface
interface MealPlan {
  id: string;
  name: string;
  meals: {
    breakfast: FoodItem[];
    lunch: FoodItem[];
    dinner: FoodItem[];
    snacks: FoodItem[];
  };
  totalCalories: number;
  macros: { protein: number; carbs: number; fat: number };
  date: Date;
  isActive: boolean;
}

// Water tracking interface
interface WaterIntake {
  id: string;
  amount: number; // in ml
  timestamp: Date;
  type: 'water' | 'coffee' | 'tea' | 'juice' | 'other';
}

interface NimbusNutritionTrackerProps {
  className?: string;
}

export const NimbusNutritionTracker: React.FC<NimbusNutritionTrackerProps> = ({ className = '' }) => {
  // Core state
  const [currentView, setCurrentView] = useState<'dashboard' | 'add-food' | 'barcode' | 'meal-plan' | 'analytics' | 'settings'>('dashboard');
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Food tracking state
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [voiceInput, setVoiceInput] = useState(false);
  
  // Nutrition API hook
  const nutritionAPI = useNutritionAPI();
  const { isLoading, error, searchFood, lookupBarcode, getUsageStats, getAvailableProviders } = nutritionAPI;
  
  // Meal planning state
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [activeMealPlan, setActiveMealPlan] = useState<MealPlan | null>(null);
  
  // Water tracking state
  const [waterIntake, setWaterIntake] = useState<WaterIntake[]>([]);
  const [waterGoal] = useState(2500); // ml
  
  // Goals and preferences
  const [dailyGoals, setDailyGoals] = useState({
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65,
    fiber: 25,
    sugar: 50,
    sodium: 2300
  });
  
  // Quick add items
  const [quickAddItems, setQuickAddItems] = useState<FoodItem[]>([
    {
      id: 'quick-1',
      name: 'Banana',
      calories: 105,
      protein: 1.3,
      carbs: 27,
      fat: 0.4,
      serving_size: '1 medium',
      category: 'snack',
      timestamp: new Date(),
      quantity: 1,
      verified: true,
      source: 'manual'
    },
    {
      id: 'quick-2',
      name: 'Greek Yogurt',
      calories: 130,
      protein: 15,
      carbs: 9,
      fat: 4,
      serving_size: '1 cup',
      category: 'breakfast',
      timestamp: new Date(),
      quantity: 1,
      verified: true,
      source: 'manual'
    }
  ]);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Calculate consumed nutrients
  const consumed = foodItems
    .filter(item => {
      const itemDate = new Date(item.timestamp);
      return itemDate.toDateString() === selectedDate.toDateString();
    })
    .reduce((total, item) => ({
      calories: total.calories + (item.calories * item.quantity),
      protein: total.protein + (item.protein * item.quantity),
      carbs: total.carbs + (item.carbs * item.quantity),
      fat: total.fat + (item.fat * item.quantity),
      fiber: total.fiber + ((item.fiber || 0) * item.quantity),
      sugar: total.sugar + ((item.sugar || 0) * item.quantity),
      sodium: total.sodium + ((item.sodium || 0) * item.quantity)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 });

  // Water intake for today
  const todayWaterIntake = waterIntake
    .filter(intake => {
      const intakeDate = new Date(intake.timestamp);
      return intakeDate.toDateString() === selectedDate.toDateString();
    })
    .reduce((total, intake) => total + intake.amount, 0);

  const calculateProgress = (consumed: number, goal: number) => {
    return Math.min((consumed / goal) * 100, 100);
  };

  const getProgressColor = (progress: number) => {
    if (progress < 50) return 'bg-red-500';
    if (progress < 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Barcode scanning functionality
  const startBarcodeScanning = async () => {
    setIsScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Camera access denied. Please enable camera permissions.');
      setIsScanning(false);
    }
  };

  const stopBarcodeScanning = () => {
    setIsScanning(false);
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  // Voice input functionality
  const startVoiceInput = () => {
    setVoiceInput(true);
    // Voice recognition implementation would go here
    setTimeout(() => {
      setVoiceInput(false);
      setSearchQuery("I had 2 eggs and toast for breakfast");
    }, 3000);
  };

  // Food search functionality
  const handleSearchFood = async (query: string) => {
    const result = await searchFood(query);
    if (result.success) {
      setSearchResults(result.results);
    } else {
      console.error('Search failed:', result.error);
      setSearchResults([]);
    }
  };

  // Add food item
  const addFoodItem = (food: FoodItem) => {
    const newFood = {
      ...food,
      id: `food-${Date.now()}`,
      timestamp: selectedDate
    };
    setFoodItems(prev => [...prev, newFood]);
  };

  // Add water intake
  const addWaterIntake = (amount: number, type: WaterIntake['type'] = 'water') => {
    const newIntake: WaterIntake = {
      id: `water-${Date.now()}`,
      amount,
      timestamp: selectedDate,
      type
    };
    setWaterIntake(prev => [...prev, newIntake]);
  };

  // AI meal suggestions
  const generateMealSuggestions = async () => {
    setIsLoading(true);
    // AI would generate personalized meal suggestions based on:
    // - Current macros
    // - Remaining calories
    // - Food preferences
    // - Time of day
    setTimeout(() => {
      alert('AI Meal Suggestions: Try grilled chicken with quinoa and vegetables for dinner!');
      setIsLoading(false);
    }, 2000);
  };

  // Render dashboard view
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Header with date selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Nutrition Dashboard</h2>
          <p className="text-white/80">Track your daily nutrition goals</p>
          {error && (
            <div className="mt-2 p-2 bg-red-500/20 border border-red-500/40 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setSelectedDate(new Date(selectedDate.getTime() - 24*60*60*1000))}
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            <Calendar className="w-5 h-5 text-white" />
          </button>
          <span className="text-white font-medium">
            {selectedDate.toLocaleDateString()}
          </span>
          <button 
            onClick={() => setSelectedDate(new Date(selectedDate.getTime() + 24*60*60*1000))}
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            <Calendar className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span className="text-white/80 text-sm">Calories</span>
          </div>
          <div className="text-2xl font-bold text-white">{Math.round(consumed.calories)}</div>
          <div className="text-white/60 text-sm">/ {dailyGoals.calories}</div>
          <div className="w-full bg-white/20 rounded-full h-2 mt-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(calculateProgress(consumed.calories, dailyGoals.calories))}`}
              style={{ width: `${calculateProgress(consumed.calories, dailyGoals.calories)}%` }}
            />
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="flex items-center space-x-2 mb-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <span className="text-white/80 text-sm">Protein</span>
          </div>
          <div className="text-2xl font-bold text-white">{Math.round(consumed.protein)}g</div>
          <div className="text-white/60 text-sm">/ {dailyGoals.protein}g</div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="flex items-center space-x-2 mb-2">
            <Heart className="w-5 h-5 text-green-400" />
            <span className="text-white/80 text-sm">Carbs</span>
          </div>
          <div className="text-2xl font-bold text-white">{Math.round(consumed.carbs)}g</div>
          <div className="text-white/60 text-sm">/ {dailyGoals.carbs}g</div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="flex items-center space-x-2 mb-2">
            <Scale className="w-5 h-5 text-purple-400" />
            <span className="text-white/80 text-sm">Fat</span>
          </div>
          <div className="text-2xl font-bold text-white">{Math.round(consumed.fat)}g</div>
          <div className="text-white/60 text-sm">/ {dailyGoals.fat}g</div>
        </div>
      </div>

      {/* Water intake */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Info className="w-5 h-5 text-blue-400" />
            <span className="text-white font-medium">Water Intake</span>
          </div>
          <div className="text-white/80">
            {todayWaterIntake}ml / {waterGoal}ml
          </div>
        </div>
        <div className="w-full bg-white/20 rounded-full h-3 mb-4">
          <div 
            className="bg-blue-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${Math.min((todayWaterIntake / waterGoal) * 100, 100)}%` }}
          />
        </div>
        <div className="flex space-x-2">
          {[250, 500, 750].map(amount => (
            <button
              key={amount}
              onClick={() => addWaterIntake(amount)}
              className="flex-1 bg-blue-500/20 text-blue-300 py-2 px-3 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
            >
              +{amount}ml
            </button>
          ))}
        </div>
      </div>

      {/* Quick add foods */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
        <h3 className="text-white font-medium mb-4 flex items-center space-x-2">
          <ChefHat className="w-5 h-5" />
          <span>Quick Add</span>
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {quickAddItems.map(item => (
            <button
              key={item.id}
              onClick={() => addFoodItem(item)}
              className="bg-white/5 border border-white/20 rounded-lg p-3 hover:bg-white/10 transition-colors text-left"
            >
              <div className="text-white font-medium text-sm">{item.name}</div>
              <div className="text-white/60 text-xs">{item.calories} cal • {item.serving_size}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setCurrentView('add-food')}
          className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex flex-col items-center space-y-2"
        >
          <Search className="w-6 h-6" />
          <span>Search Food</span>
        </button>
        
        <button
          onClick={() => setCurrentView('barcode')}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex flex-col items-center space-y-2"
        >
          <Scan className="w-6 h-6" />
          <span>Scan Barcode</span>
        </button>
        
        <button
          onClick={startVoiceInput}
          className="bg-gradient-to-r from-purple-500 to-violet-600 text-white p-4 rounded-xl font-medium hover:from-purple-600 hover:to-violet-700 transition-all duration-200 flex flex-col items-center space-y-2"
        >
          <Mic className="w-6 h-6" />
          <span>Voice Input</span>
        </button>
        
        <button
          onClick={generateMealSuggestions}
          className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-4 rounded-xl font-medium hover:from-orange-600 hover:to-red-700 transition-all duration-200 flex flex-col items-center space-y-2"
        >
          <Brain className="w-6 h-6" />
          <span>AI Suggestions</span>
        </button>
      </div>

      {/* API Status */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-medium flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <span>API Status</span>
          </h3>
          <div className="flex items-center space-x-2">
            {getAvailableProviders().length > 0 ? (
              <Wifi className="w-4 h-4 text-green-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-400" />
            )}
            <span className="text-white/60 text-sm">
              {getAvailableProviders().length} APIs available
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {['openfoodfacts', 'fatsecret', 'spoonacular', 'nutritionix', 'usda'].map(api => (
            <div key={api} className="flex items-center space-x-1">
              {getAvailableProviders().includes(api) ? (
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              ) : (
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              )}
              <span className="text-white/60 text-xs capitalize">{api}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Today's meals */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium flex items-center space-x-2">
            <Utensils className="w-5 h-5" />
            <span>Today's Meals</span>
          </h3>
          <button 
            onClick={() => setCurrentView('analytics')}
            className="text-white/60 hover:text-white transition-colors"
          >
            <BarChart3 className="w-5 h-5" />
          </button>
        </div>
        
        {foodItems.filter(item => {
          const itemDate = new Date(item.timestamp);
          return itemDate.toDateString() === selectedDate.toDateString();
        }).length === 0 ? (
          <div className="text-center py-8">
            <Apple className="w-12 h-12 text-white/40 mx-auto mb-3" />
            <p className="text-white/60">No meals logged today</p>
            <p className="text-white/40 text-sm">Start by adding your first meal!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {['breakfast', 'lunch', 'dinner', 'snack'].map(mealType => {
              const mealItems = foodItems.filter(item => 
                item.category === mealType && 
                new Date(item.timestamp).toDateString() === selectedDate.toDateString()
              );
              
              if (mealItems.length === 0) return null;
              
              return (
                <div key={mealType} className="bg-white/5 rounded-lg p-3">
                  <h4 className="text-white/80 font-medium capitalize mb-2">{mealType}</h4>
                  <div className="space-y-2">
                    {mealItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="text-white">{item.name}</span>
                          {item.brand && <span className="text-white/60"> - {item.brand}</span>}
                        </div>
                        <div className="text-white/80">
                          {Math.round(item.calories * item.quantity)} cal
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // Render add food view
  const renderAddFood = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Add Food</h2>
        <button
          onClick={() => setCurrentView('dashboard')}
          className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
        <div className="flex space-x-3 mb-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for food items..."
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
                  <button
          onClick={() => handleSearchFood(searchQuery)}
          disabled={!searchQuery.trim() || isLoading}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isLoading ? <Search className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          <span>Search</span>
        </button>
        </div>
        
        <div className="flex space-x-2 mb-4">
          <button
            onClick={startVoiceInput}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              voiceInput ? 'bg-red-500 text-white' : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>{voiceInput ? 'Listening...' : 'Voice Input'}</span>
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-white font-medium">Search Results</h3>
            {searchResults.map(item => (
              <div key={item.id} className="bg-white/5 border border-white/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-white font-medium">{item.name}</h4>
                      {item.australianProduct && (
                        <span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded-full">
                          AU
                        </span>
                      )}
                      {item.verified && (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      )}
                    </div>
                    <p className="text-white/60 text-sm">{item.serving_size} • {item.calories} calories</p>
                    <div className="flex space-x-4 text-xs text-white/60 mt-1">
                      <span>P: {item.protein}g</span>
                      <span>C: {item.carbs}g</span>
                      <span>F: {item.fat}g</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-white/40 text-xs capitalize">Source: {item.source}</span>
                      <span className="text-white/40 text-xs">
                        Confidence: {Math.round(item.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      addFoodItem(item);
                      setCurrentView('dashboard');
                    }}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2 ml-4"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Render barcode scanner view
  const renderBarcodeScanner = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Barcode Scanner</h2>
        <button
          onClick={() => {
            stopBarcodeScanning();
            setCurrentView('dashboard');
          }}
          className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
        {!isScanning ? (
          <div className="text-center py-12">
            <Camera className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-white font-medium mb-2">Ready to Scan</h3>
            <p className="text-white/60 mb-6">Position the barcode within the camera frame</p>
            <button
              onClick={startBarcodeScanning}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2 mx-auto"
            >
              <Camera className="w-5 h-5" />
              <span>Start Scanner</span>
            </button>
          </div>
        ) : (
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-64 bg-black rounded-lg object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-2 border-white/80 w-48 h-24 rounded-lg"></div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-white/80 mb-4">Align barcode within the frame</p>
              <button
                onClick={stopBarcodeScanning}
                className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
              >
                Stop Scanner
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Render analytics view
  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Nutrition Analytics</h2>
        <button
          onClick={() => setCurrentView('dashboard')}
          className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <h3 className="text-white font-medium mb-4 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Weekly Progress</span>
          </h3>
          <div className="space-y-3">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
              <div key={day} className="flex items-center justify-between">
                <span className="text-white/80">{day}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-24 bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${Math.random() * 100}%` }}
                    />
                  </div>
                  <span className="text-white/60 text-sm w-16 text-right">
                    {Math.round(1800 + Math.random() * 400)} cal
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <h3 className="text-white font-medium mb-4 flex items-center space-x-2">
            <Award className="w-5 h-5" />
            <span>Achievements</span>
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <Star className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-medium">Consistent Logger</p>
                <p className="text-white/60 text-sm">7 days in a row</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-medium">Protein Goal</p>
                <p className="text-white/60 text-sm">Met for 5 days</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Info className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-medium">Hydration Hero</p>
                <p className="text-white/60 text-sm">Water goal achieved</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Main render
  return (
    <div className={`h-full min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6 ${className}`}>
      <div className="max-w-6xl mx-auto">
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'add-food' && renderAddFood()}
        {currentView === 'barcode' && renderBarcodeScanner()}
        {currentView === 'analytics' && renderAnalytics()}
      </div>
    </div>
  );
};
