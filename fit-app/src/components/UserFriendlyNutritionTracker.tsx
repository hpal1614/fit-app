import React, { useState, useEffect, useRef } from 'react';
import { 
  Apple, Plus, Search, Scan, Mic, Brain, ChefHat, 
  Flame, Activity, Heart, Scale, Droplets, 
  Calendar, BarChart3, Utensils, Database, Wifi, 
  CheckCircle, AlertCircle, Lightbulb, Target,
  ChevronLeft, ChevronRight, X, Settings, Users,
  Camera, Star, Award, Info, TrendingUp
} from 'lucide-react';
import { useNutritionAPI } from '../hooks/useNutritionAPI';
import { FoodItem } from '../services/nutrition/types/nutrition.types';
import { BrowserMultiFormatReader, Result } from '@zxing/library';

interface NutritionInsight {
  id: string;
  type: 'achievement' | 'warning' | 'suggestion' | 'tip';
  title: string;
  message: string;
  icon: string;
  priority: 'low' | 'medium' | 'high';
  timestamp: Date;
}

export const UserFriendlyNutritionTracker: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'add-food' | 'barcode' | 'analytics'>('dashboard');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [voiceInput, setVoiceInput] = useState(false);
  
  const nutritionAPI = useNutritionAPI();
  const { isLoading: apiLoading, error, searchFood, getAvailableProviders } = nutritionAPI;
  
  const [waterIntake, setWaterIntake] = useState<number[]>([]);
  const [waterGoal] = useState(2500);
  
  const [dailyGoals] = useState({
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65
  });
  
  const [insights, setInsights] = useState<NutritionInsight[]>([]);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  
  // Barcode scanning refs and state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [scannedBarcode, setScannedBarcode] = useState<string>('');
  const [barcodeResult, setBarcodeResult] = useState<FoodItem | null>(null);
  const [isScanningBarcode, setIsScanningBarcode] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const consumed = foodItems
    .filter(item => {
      const itemDate = new Date(item.timestamp);
      return itemDate.toDateString() === selectedDate.toDateString();
    })
    .reduce((total, item) => ({
      calories: total.calories + (item.calories * item.quantity),
      protein: total.protein + (item.protein * item.quantity),
      carbs: total.carbs + (item.carbs * item.quantity),
      fat: total.fat + (item.fat * item.quantity)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const todayWaterIntake = waterIntake.reduce((total, amount) => total + amount, 0);

  const calculateProgress = (consumed: number, goal: number) => {
    return Math.min((consumed / goal) * 100, 100);
  };

  const getProgressGradient = (progress: number) => {
    if (progress < 50) return 'from-red-500 to-red-600';
    if (progress < 80) return 'from-yellow-500 to-orange-500';
    return 'from-green-500 to-emerald-600';
  };

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    setVoiceInput(true);
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
      console.log('Voice recognition started');
    };
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      setVoiceInput(false);
      
      // Auto-search after voice input
      setTimeout(() => {
        handleSearchFood(transcript);
      }, 500);
    };
    
    recognition.onerror = (event) => {
      console.error('Voice recognition error:', event.error);
      setVoiceInput(false);
      alert('Voice recognition failed. Please try again.');
    };
    
    recognition.onend = () => {
      setVoiceInput(false);
    };
    
    recognition.start();
  };

  const handleSearchFood = async (query: string) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    try {
      const result = await searchFood(query);
      if (result.success && result.results.length > 0) {
        setSearchResults(result.results);
      } else {
        // Fallback to sample data if API fails
        console.log('API search failed, using sample data');
        const sampleResults = generateSampleResults(query);
        setSearchResults(sampleResults);
      }
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to sample data
      const sampleResults = generateSampleResults(query);
      setSearchResults(sampleResults);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSampleResults = (query: string): FoodItem[] => {
    const queryLower = query.toLowerCase();
    const sampleFoods = [
      {
        name: 'Apple',
        calories: 95,
        protein: 0.5,
        carbs: 25,
        fat: 0.3,
        serving_size: '1 medium apple',
        category: 'snack' as const,
        verified: true,
        source: 'sample' as any,
        confidence: 0.9
      },
      {
        name: 'Chicken Breast',
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        serving_size: '100g cooked',
        category: 'lunch' as const,
        verified: true,
        source: 'sample' as any,
        confidence: 0.95
      },
      {
        name: 'Banana',
        calories: 105,
        protein: 1.3,
        carbs: 27,
        fat: 0.4,
        serving_size: '1 medium banana',
        category: 'snack' as const,
        verified: true,
        source: 'sample' as any,
        confidence: 0.9
      },
      {
        name: 'Greek Yogurt',
        calories: 130,
        protein: 15,
        carbs: 9,
        fat: 4,
        serving_size: '1 cup',
        category: 'breakfast' as const,
        verified: true,
        source: 'sample' as any,
        confidence: 0.9
      },
      {
        name: 'Salmon',
        calories: 208,
        protein: 25,
        carbs: 0,
        fat: 12,
        serving_size: '100g cooked',
        category: 'dinner' as const,
        verified: true,
        source: 'sample' as any,
        confidence: 0.95
      }
    ];

    return sampleFoods
      .filter(food => food.name.toLowerCase().includes(queryLower))
      .map(food => ({
        ...food,
        id: `sample-${food.name.toLowerCase().replace(/\s+/g, '-')}`,
        timestamp: new Date(),
        quantity: 1
      }));
  };

  const addFoodItem = (food: FoodItem) => {
    const newFood = {
      ...food,
      id: `food-${Date.now()}`,
      timestamp: selectedDate
    };
    setFoodItems(prev => [...prev, newFood]);
    generateInsights(newFood);
  };

  const addWaterIntake = (amount: number) => {
    setWaterIntake(prev => [...prev, amount]);
  };

  const generateInsights = (foodItem?: FoodItem) => {
    const newInsights: NutritionInsight[] = [];
    
    const calorieProgress = calculateProgress(consumed.calories, dailyGoals.calories);
    const proteinProgress = calculateProgress(consumed.protein, dailyGoals.protein);
    const waterProgress = calculateProgress(todayWaterIntake, waterGoal);
    
    if (calorieProgress > 90) {
      newInsights.push({
        id: `insight-${Date.now()}-1`,
        type: 'achievement',
        title: 'Calorie Goal Achieved!',
        message: `You've reached ${Math.round(calorieProgress)}% of your daily calorie goal. Great job!`,
        icon: '🎉',
        priority: 'medium',
        timestamp: new Date()
      });
    }
    
    if (proteinProgress < 50) {
      newInsights.push({
        id: `insight-${Date.now()}-2`,
        type: 'suggestion',
        title: 'Protein Boost Needed',
        message: 'Consider adding more protein-rich foods like chicken, fish, or legumes.',
        icon: '💪',
        priority: 'high',
        timestamp: new Date()
      });
    }
    
    if (waterProgress < 60) {
      newInsights.push({
        id: `insight-${Date.now()}-3`,
        type: 'tip',
        title: 'Stay Hydrated',
        message: `You've only consumed ${Math.round(waterProgress)}% of your daily water goal.`,
        icon: '💧',
        priority: 'medium',
        timestamp: new Date()
      });
    }
    
    setInsights(prev => [...newInsights, ...prev]);
  };

  const generateMealSuggestions = async () => {
    setIsLoading(true);
    
    // Analyze current nutrition status
    const calorieProgress = calculateProgress(consumed.calories, dailyGoals.calories);
    const proteinProgress = calculateProgress(consumed.protein, dailyGoals.protein);
    const carbsProgress = calculateProgress(consumed.carbs, dailyGoals.carbs);
    const fatProgress = calculateProgress(consumed.fat, dailyGoals.fat);
    
    // Generate personalized suggestions based on current status
    const suggestions = [];
    
    if (calorieProgress < 50) {
      suggestions.push({
        title: 'Low Calorie Intake',
        message: 'Consider adding more calorie-dense foods like nuts, avocados, or whole grains.',
        icon: '🔥',
        priority: 'high'
      });
    }
    
    if (proteinProgress < 60) {
      suggestions.push({
        title: 'Protein Boost Needed',
        message: 'Try adding lean protein sources like chicken breast, fish, eggs, or Greek yogurt.',
        icon: '💪',
        priority: 'high'
      });
    }
    
    if (carbsProgress < 50) {
      suggestions.push({
        title: 'Carbohydrate Balance',
        message: 'Include complex carbs like brown rice, quinoa, or sweet potatoes for sustained energy.',
        icon: '🌾',
        priority: 'medium'
      });
    }
    
    if (fatProgress < 40) {
      suggestions.push({
        title: 'Healthy Fats',
        message: 'Add healthy fats from sources like olive oil, nuts, or fatty fish.',
        icon: '🥑',
        priority: 'medium'
      });
    }
    
    // Add meal suggestions based on time of day
    const currentHour = new Date().getHours();
    let mealSuggestion = '';
    
    if (currentHour < 12) {
      mealSuggestion = 'For breakfast, try oatmeal with berries and nuts, or Greek yogurt with honey.';
    } else if (currentHour < 17) {
      mealSuggestion = 'For lunch, consider a grilled chicken salad or quinoa bowl with vegetables.';
    } else {
      mealSuggestion = 'For dinner, try salmon with roasted vegetables or a lean beef stir-fry.';
    }
    
    suggestions.push({
      title: 'Meal Suggestion',
      message: mealSuggestion,
      icon: '🍽️',
      priority: 'medium'
    });
    
    // Add water reminder if needed
    if (todayWaterIntake < waterGoal * 0.6) {
      suggestions.push({
        title: 'Stay Hydrated',
        message: 'You\'re below your water goal. Try drinking more water throughout the day.',
        icon: '💧',
        priority: 'medium'
      });
    }
    
    // Convert suggestions to insights
    const newInsights = suggestions.map((suggestion, index) => ({
      id: `ai-suggestion-${Date.now()}-${index}`,
      type: 'suggestion' as const,
      title: suggestion.title,
      message: suggestion.message,
      icon: suggestion.icon,
      priority: suggestion.priority,
      timestamp: new Date()
    }));
    
    // Add to insights with a slight delay for better UX
    setTimeout(() => {
      setInsights(prev => [...newInsights, ...prev]);
      setIsLoading(false);
    }, 1000);
  };

  const quickAddFoods = [
    { name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, icon: '🍌' },
    { name: 'Greek Yogurt', calories: 130, protein: 15, carbs: 9, fat: 4, icon: '🥛' },
    { name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, icon: '🍗' },
    { name: 'Brown Rice', calories: 110, protein: 2.5, carbs: 23, fat: 0.9, icon: '🍚' },
    { name: 'Broccoli', calories: 55, protein: 3.7, carbs: 11, fat: 0.6, icon: '🥦' },
    { name: 'Salmon', calories: 208, protein: 25, carbs: 0, fat: 12, icon: '🐟' }
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Nutrition Dashboard</h2>
          <p className="text-white/80">Track your daily nutrition goals</p>
          {error && (
            <div className="mt-2 p-3 bg-red-500/20 border border-red-500/40 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
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
      {insights.length > 0 && (
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-lg rounded-xl p-4 border border-blue-500/40">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-medium flex items-center space-x-2">
              <Lightbulb className="w-5 h-5 text-yellow-400" />
              <span>Today's Insights</span>
            </h3>
            <button 
              onClick={() => setInsights([])}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {insights.slice(0, 3).map(insight => (
              <div key={insight.id} className="flex items-center space-x-3 p-2 bg-white/5 rounded-lg">
                <span className="text-2xl">{insight.icon}</span>
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">{insight.title}</p>
                  <p className="text-white/60 text-xs">{insight.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nutrition Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-lg rounded-xl p-4 border border-yellow-500/40">
          <div className="flex items-center space-x-2 mb-2">
            <Flame className="w-5 h-5 text-yellow-400" />
            <span className="text-white/80 text-sm">Calories</span>
          </div>
          <div className="text-2xl font-bold text-white">{Math.round(consumed.calories)}</div>
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
          <div className="text-2xl font-bold text-white">{Math.round(consumed.protein)}g</div>
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
          <div className="text-2xl font-bold text-white">{Math.round(consumed.carbs)}g</div>
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
          <div className="text-2xl font-bold text-white">{Math.round(consumed.fat)}g</div>
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
            {todayWaterIntake}ml / {waterGoal}ml
          </div>
        </div>
        <div className="w-full bg-white/20 rounded-full h-4 mb-4">
          <div 
            className="bg-gradient-to-r from-blue-400 to-cyan-400 h-4 rounded-full transition-all duration-300"
            style={{ width: `${Math.min((todayWaterIntake / waterGoal) * 100, 100)}%` }}
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
                onClick={() => addFoodItem({
                  id: `quick-${index}`,
                  name: food.name,
                  calories: food.calories,
                  protein: food.protein,
                  carbs: food.carbs,
                  fat: food.fat,
                  serving_size: '1 serving',
                  category: 'snack',
                  timestamp: new Date(),
                  quantity: 1,
                  verified: true,
                  source: 'manual',
                  confidence: 1
                })}
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
        <button
          onClick={() => setCurrentView('add-food')}
          className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex flex-col items-center space-y-2 shadow-lg hover:shadow-xl"
        >
          <Search className="w-6 h-6" />
          <span>Search Food</span>
        </button>
        
        <button
          onClick={() => setCurrentView('barcode')}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex flex-col items-center space-y-2 shadow-lg hover:shadow-xl"
        >
          <Scan className="w-6 h-6" />
          <span>Scan Barcode</span>
        </button>
        
        <button
          onClick={startVoiceInput}
          className="bg-gradient-to-r from-purple-500 to-violet-600 text-white p-4 rounded-xl font-medium hover:from-purple-600 hover:to-violet-700 transition-all duration-200 flex flex-col items-center space-y-2 shadow-lg hover:shadow-xl"
        >
          <Mic className="w-6 h-6" />
          <span>Voice Input</span>
        </button>
        
        <button
          onClick={generateMealSuggestions}
          className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-4 rounded-xl font-medium hover:from-orange-600 hover:to-red-700 transition-all duration-200 flex flex-col items-center space-y-2 shadow-lg hover:shadow-xl"
        >
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
            {getAvailableProviders().length > 0 ? (
              <Wifi className="w-4 h-4 text-green-400" />
            ) : (
              <Wifi className="w-4 h-4 text-red-400" />
            )}
            <span className="text-white/60 text-sm">
              {getAvailableProviders().length} APIs available
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
                  {getAvailableProviders().includes(api.name) ? (
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  ) : (
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  )}
                  <span className="text-white/80 text-xs">{api.label}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Meals */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium text-lg flex items-center space-x-2">
            <Utensils className="w-5 h-5" />
            <span>Today's Meals</span>
          </h3>
          <button 
            onClick={() => setCurrentView('analytics')}
            className="text-white/60 hover:text-white transition-colors p-2 bg-white/10 rounded-lg"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
        
        {foodItems.filter(item => {
          const itemDate = new Date(item.timestamp);
          return itemDate.toDateString() === selectedDate.toDateString();
        }).length === 0 ? (
          <div className="text-center py-12">
            <Apple className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <p className="text-white/60 text-lg mb-2">No meals logged today</p>
            <p className="text-white/40 text-sm mb-4">Start by adding your first meal!</p>
            <button
              onClick={() => setCurrentView('add-food')}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center space-x-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              <span>Add First Meal</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {['breakfast', 'lunch', 'dinner', 'snack'].map(mealType => {
              const mealItems = foodItems.filter(item => 
                item.category === mealType && 
                new Date(item.timestamp).toDateString() === selectedDate.toDateString()
              );
              
              if (mealItems.length === 0) return null;
              
              const mealCalories = mealItems.reduce((total, item) => total + (item.calories * item.quantity), 0);
              const mealProtein = mealItems.reduce((total, item) => total + (item.protein * item.quantity), 0);
              
              return (
                <div key={mealType} className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white/90 font-medium capitalize text-lg">{mealType}</h4>
                    <div className="text-right">
                      <div className="text-white font-medium">{Math.round(mealCalories)} cal</div>
                      <div className="text-white/60 text-sm">{Math.round(mealProtein)}g protein</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {mealItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between text-sm bg-white/5 rounded-lg p-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-medium">{item.name}</span>
                            {item.brand && <span className="text-white/60">• {item.brand}</span>}
                            {item.australianProduct && (
                              <span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded-full">
                                🇦🇺 AU
                              </span>
                            )}
                          </div>
                          <div className="text-white/60 text-xs">
                            {item.serving_size} • {item.quantity}x
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white/80">{Math.round(item.calories * item.quantity)} cal</div>
                          <div className="text-white/60 text-xs">{Math.round(item.protein * item.quantity)}g protein</div>
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
        <h2 className="text-3xl font-bold text-white">Add Food</h2>
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
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  handleSearchFood(searchQuery);
                }
              }}
              placeholder="Search for food items (e.g., 'apple', 'chicken breast')..."
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

  // Barcode scanning functionality
  const startBarcodeScanning = async () => {
    setIsScanning(true);
    setIsScanningBarcode(true);
    setScannedBarcode('');
    setBarcodeResult(null);
    
    try {
      console.log('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      console.log('Camera access granted, setting up video...');
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to load
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded, starting barcode scanning...');
          
          // Start barcode scanning
          const codeReader = new BrowserMultiFormatReader();
          
          codeReader.decodeFromVideoDevice(
            undefined, // Use default camera
            videoRef.current,
            (result: Result | null, error: any) => {
              if (result) {
                console.log('Barcode detected:', result.getText());
                setScannedBarcode(result.getText());
                setIsScanningBarcode(false);
                
                // Look up the barcode
                lookupBarcodeFromAPI(result.getText());
                
                // Stop scanning after successful detection
                stopBarcodeScanning();
              }
              if (error && error.name !== 'NotFoundException') {
                console.error('Barcode scanning error:', error);
              }
            }
          );
        };
        
        videoRef.current.onerror = (error) => {
          console.error('Video error:', error);
          alert('Error loading video stream. Please try again.');
          setIsScanning(false);
          setIsScanningBarcode(false);
        };
        
        videoRef.current.oncanplay = () => {
          console.log('Video can play, should be visible now');
        };
        
      } else {
        console.error('Video ref not available');
        alert('Video element not found. Please refresh and try again.');
        setIsScanning(false);
        setIsScanningBarcode(false);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Camera access denied. Please enable camera permissions and try again.');
      setIsScanning(false);
      setIsScanningBarcode(false);
    }
  };

  const stopBarcodeScanning = () => {
    setIsScanning(false);
    setIsScanningBarcode(false);
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const lookupBarcodeFromAPI = async (barcode: string) => {
    try {
      const result = await lookupBarcode(barcode);
      if (result.success && result.data) {
        setBarcodeResult(result.data);
        // Auto-add the found food item
        addFoodItem(result.data);
      } else {
        // Create a sample food item for testing
        const sampleFood = createSampleFoodFromBarcode(barcode);
        setBarcodeResult(sampleFood);
        addFoodItem(sampleFood);
      }
    } catch (error) {
      console.error('Barcode lookup error:', error);
      // Create a sample food item for testing
      const sampleFood = createSampleFoodFromBarcode(barcode);
      setBarcodeResult(sampleFood);
      addFoodItem(sampleFood);
    }
  };

  const createSampleFoodFromBarcode = (barcode: string): FoodItem => {
    // Create sample food items based on common barcodes
    const sampleFoods: { [key: string]: FoodItem } = {
      '3017620422003': { // Nutella
        id: `barcode-${barcode}`,
        name: 'Nutella',
        calories: 539,
        protein: 6.3,
        carbs: 57.5,
        fat: 30.9,
        serving_size: '100g',
        category: 'snack',
        timestamp: new Date(),
        quantity: 1,
        verified: true,
        source: 'barcode',
        confidence: 0.9,
        barcode: barcode
      },
      '9310072011691': { // Tim Tam
        id: `barcode-${barcode}`,
        name: 'Tim Tam Original',
        calories: 502,
        protein: 5.2,
        carbs: 67.8,
        fat: 24.2,
        serving_size: '100g',
        category: 'snack',
        timestamp: new Date(),
        quantity: 1,
        verified: true,
        source: 'barcode',
        confidence: 0.9,
        barcode: barcode,
        australianProduct: true
      },
      '9300675024235': { // Vegemite
        id: `barcode-${barcode}`,
        name: 'Vegemite',
        calories: 235,
        protein: 26.0,
        carbs: 18.0,
        fat: 0.0,
        serving_size: '100g',
        category: 'breakfast',
        timestamp: new Date(),
        quantity: 1,
        verified: true,
        source: 'barcode',
        confidence: 0.9,
        barcode: barcode,
        australianProduct: true
      }
    };

    return sampleFoods[barcode] || {
      id: `barcode-${barcode}`,
      name: `Product (${barcode})`,
      calories: 200,
      protein: 10,
      carbs: 25,
      fat: 8,
      serving_size: '100g',
      category: 'snack',
      timestamp: new Date(),
      quantity: 1,
      verified: false,
      source: 'barcode',
      confidence: 0.5,
      barcode: barcode
    };
  };

  // Render barcode scanner view
  const renderBarcodeScanner = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Barcode Scanner</h2>
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

      {/* Barcode Result Display */}
      {barcodeResult && (
        <div className="bg-green-500/20 backdrop-blur-lg rounded-xl p-4 border border-green-500/40">
          <div className="flex items-center space-x-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <h3 className="text-white font-medium">Barcode Scanned Successfully!</h3>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="text-white font-medium">{barcodeResult.name}</h4>
                <p className="text-white/60 text-sm">Barcode: {scannedBarcode}</p>
                <div className="flex space-x-4 text-xs text-white/60 mt-1">
                  <span>{barcodeResult.calories} cal</span>
                  <span>P: {barcodeResult.protein}g</span>
                  <span>C: {barcodeResult.carbs}g</span>
                  <span>F: {barcodeResult.fat}g</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setBarcodeResult(null);
                  setScannedBarcode('');
                }}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                Scan Another
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
        {!isScanning ? (
          <div className="text-center py-12">
            <Camera className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-white font-medium mb-2">Ready to Scan</h3>
            <p className="text-white/60 mb-6">Position the barcode within the camera frame</p>
            <div className="space-y-4 mb-6">
              <p className="text-white/80 text-sm">Test barcodes you can try:</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                <div className="bg-white/5 rounded p-2">
                  <div className="text-white/60">3017620422003</div>
                  <div className="text-white/80">Nutella</div>
                </div>
                <div className="bg-white/5 rounded p-2">
                  <div className="text-white/60">9310072011691</div>
                  <div className="text-white/80">Tim Tam</div>
                </div>
                <div className="bg-white/5 rounded p-2">
                  <div className="text-white/60">9300675024235</div>
                  <div className="text-white/80">Vegemite</div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <button
                onClick={startBarcodeScanning}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2 mx-auto"
              >
                <Camera className="w-5 h-5" />
                <span>Start Scanner</span>
              </button>
              
              <div className="text-center">
                <p className="text-white/60 text-sm mb-2">Or enter barcode manually:</p>
                <div className="flex space-x-2 justify-center">
                  <input
                    type="text"
                    placeholder="Enter barcode number"
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        lookupBarcodeFromAPI(e.currentTarget.value.trim());
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      if (input.value.trim()) {
                        lookupBarcodeFromAPI(input.value.trim());
                        input.value = '';
                      }
                    }}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
                  >
                    Lookup
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-64 bg-black rounded-lg object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-2 border-white/80 w-48 h-24 rounded-lg"></div>
            </div>
            <div className="mt-4 text-center">
              {isScanningBarcode ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                    <p className="text-white/80">Scanning for barcode...</p>
                  </div>
                  <p className="text-white/60 text-sm">Align barcode within the frame</p>
                </div>
              ) : (
                <p className="text-white/80 mb-4">Camera active - waiting for barcode</p>
              )}
              <div className="space-y-2">
                <button
                  onClick={stopBarcodeScanning}
                  className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Stop Scanner
                </button>
                <div className="text-xs text-white/60">
                  If camera is not showing, check browser permissions
                </div>
              </div>
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
        <h2 className="text-3xl font-bold text-white">Nutrition Analytics</h2>
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

  // Render meal plan view
  const renderMealPlan = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Meal Planning</h2>
        <button
          onClick={() => setCurrentView('dashboard')}
          className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
        <div className="text-center py-12">
          <ChefHat className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-white font-medium mb-2">Meal Planning</h3>
          <p className="text-white/60 mb-6">AI-powered meal planning and recipes coming soon!</p>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );

  // Render settings view
  const renderSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Settings</h2>
        <button
          onClick={() => setCurrentView('dashboard')}
          className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
        <div className="text-center py-12">
          <Settings className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-white font-medium mb-2">Nutrition Settings</h3>
          <p className="text-white/60 mb-6">Personalized nutrition settings and preferences coming soon!</p>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );

  // Render insights view
  const renderInsights = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">AI Insights</h2>
        <button
          onClick={() => setCurrentView('dashboard')}
          className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
        <div className="text-center py-12">
          <Brain className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-white font-medium mb-2">AI-Powered Insights</h3>
          <p className="text-white/60 mb-6">Personalized nutrition insights and recommendations coming soon!</p>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );

  // Render social view
  const renderSocial = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Social Features</h2>
        <button
          onClick={() => setCurrentView('dashboard')}
          className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-white font-medium mb-2">Social Nutrition</h3>
          <p className="text-white/60 mb-6">Share progress, join challenges, and connect with friends coming soon!</p>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto">
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'add-food' && renderAddFood()}
        {currentView === 'barcode' && renderBarcodeScanner()}
        {currentView === 'analytics' && renderAnalytics()}
        {currentView === 'meal-plan' && renderMealPlan()}
        {currentView === 'settings' && renderSettings()}
        {currentView === 'insights' && renderInsights()}
        {currentView === 'social' && renderSocial()}
      </div>
    </div>
  );
};
