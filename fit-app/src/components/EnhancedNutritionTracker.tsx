import React, { useState, useEffect, useRef } from 'react';
import { 
  Apple, Plus, TrendingUp, Camera, Search, Scan, 
  Calendar, BarChart3, X, 
  ChefHat, Zap, Brain, Star, Award, Utensils, Scale,
  Mic, 
  CheckCircle, Info, Heart, Activity, Database, Wifi, WifiOff,
  Clock, Target, Users, Settings, BookOpen, Lightbulb, 
  Coffee, Droplets, Flame, Crown, Trophy, Target as TargetIcon,
  Smartphone, Tablet, Monitor, Watch, Bell, BellOff,
  ChevronLeft, ChevronRight, Filter, SortAsc, SortDesc,
  Download, Upload, Share2, Bookmark, BookmarkPlus,
  Eye, EyeOff, Lock, Unlock, RefreshCw, AlertCircle,
  ThumbsUp, ThumbsDown, MessageCircle, HelpCircle,
  CalendarDays, CalendarRange, PieChart, LineChart,
  BarChart, Activity as ActivityIcon, Target as TargetIcon2
} from 'lucide-react';
import { useNutritionAPI } from '../hooks/useNutritionAPI';
import { FoodItem } from '../services/nutrition/types/nutrition.types';

interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  weight: number;
  height: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  fitnessGoal: 'lose_weight' | 'maintain' | 'gain_weight' | 'build_muscle';
  dietaryRestrictions: string[];
  allergies: string[];
  preferences: {
    vegetarian: boolean;
    vegan: boolean;
    glutenFree: boolean;
    dairyFree: boolean;
    lowCarb: boolean;
    keto: boolean;
    paleo: boolean;
  };
}

interface WaterIntake {
  id: string;
  amount: number;
  timestamp: Date;
  type: 'water' | 'coffee' | 'tea' | 'juice' | 'sports_drink' | 'other';
  temperature?: 'hot' | 'cold' | 'room_temp';
  container?: 'bottle' | 'glass' | 'mug' | 'other';
}

interface NutritionInsight {
  id: string;
  type: 'achievement' | 'warning' | 'suggestion' | 'tip';
  title: string;
  message: string;
  icon: string;
  priority: 'low' | 'medium' | 'high';
  timestamp: Date;
  isRead: boolean;
}

export const EnhancedNutritionTracker: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'add-food' | 'barcode' | 'meal-plan' | 'analytics' | 'settings' | 'insights' | 'social'>('dashboard');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: '1',
    name: 'John Doe',
    age: 30,
    gender: 'male',
    weight: 75,
    height: 180,
    activityLevel: 'moderate',
    fitnessGoal: 'maintain',
    dietaryRestrictions: [],
    allergies: [],
    preferences: {
      vegetarian: false,
      vegan: false,
      glutenFree: false,
      dairyFree: false,
      lowCarb: false,
      keto: false,
      paleo: false
    }
  });
  
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [voiceInput, setVoiceInput] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    category: 'all',
    verified: false,
    australianProduct: false,
    maxCalories: 1000
  });
  
  const nutritionAPI = useNutritionAPI();
  const { isLoading: apiLoading, error, searchFood, lookupBarcode, getUsageStats, getAvailableProviders } = nutritionAPI;
  
  const [waterIntake, setWaterIntake] = useState<WaterIntake[]>([]);
  const [waterGoal, setWaterGoal] = useState(2500);
  
  const [dailyGoals, setDailyGoals] = useState({
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65,
    fiber: 25,
    sugar: 50,
    sodium: 2300,
    water: 2500
  });
  
  const [insights, setInsights] = useState<NutritionInsight[]>([]);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showInsights, setShowInsights] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  const getProgressGradient = (progress: number) => {
    if (progress < 50) return 'from-red-500 to-red-600';
    if (progress < 80) return 'from-yellow-500 to-orange-500';
    return 'from-green-500 to-emerald-600';
  };

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

  const startVoiceInput = () => {
    setVoiceInput(true);
    setTimeout(() => {
      setVoiceInput(false);
      setSearchQuery("I had 2 eggs and toast for breakfast");
    }, 3000);
  };

  const handleSearchFood = async (query: string) => {
    setIsLoading(true);
    const result = await searchFood(query);
    if (result.success) {
      let filteredResults = result.results;
      
      if (searchFilters.category !== 'all') {
        filteredResults = filteredResults.filter(item => 
          item.category === searchFilters.category
        );
      }
      
      if (searchFilters.verified) {
        filteredResults = filteredResults.filter(item => item.verified);
      }
      
      if (searchFilters.australianProduct) {
        filteredResults = filteredResults.filter(item => item.australianProduct);
      }
      
      if (searchFilters.maxCalories > 0) {
        filteredResults = filteredResults.filter(item => 
          item.calories <= searchFilters.maxCalories
        );
      }
      
      setSearchResults(filteredResults);
    } else {
      console.error('Search failed:', result.error);
      setSearchResults([]);
    }
    setIsLoading(false);
  };

  const addFoodItem = (food: FoodItem, mealType?: string) => {
    const newFood = {
      ...food,
      id: `food-${Date.now()}`,
      timestamp: selectedDate,
      category: mealType as any || food.category
    };
    setFoodItems(prev => [...prev, newFood]);
    generateInsights(newFood);
  };

  const addWaterIntake = (amount: number, type: WaterIntake['type'] = 'water', container?: string) => {
    const newIntake: WaterIntake = {
      id: `water-${Date.now()}`,
      amount,
      timestamp: selectedDate,
      type,
      container: container as any
    };
    setWaterIntake(prev => [...prev, newIntake]);
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
        timestamp: new Date(),
        isRead: false
      });
    }
    
    if (proteinProgress < 50) {
      newInsights.push({
        id: `insight-${Date.now()}-2`,
        type: 'suggestion',
        title: 'Protein Boost Needed',
        message: 'Consider adding more protein-rich foods like chicken, fish, or legumes to your diet.',
        icon: '💪',
        priority: 'high',
        timestamp: new Date(),
        isRead: false
      });
    }
    
    if (waterProgress < 60) {
      newInsights.push({
        id: `insight-${Date.now()}-3`,
        type: 'tip',
        title: 'Stay Hydrated',
        message: `You've only consumed ${Math.round(waterProgress)}% of your daily water goal. Try drinking more water!`,
        icon: '💧',
        priority: 'medium',
        timestamp: new Date(),
        isRead: false
      });
    }
    
    setInsights(prev => [...newInsights, ...prev]);
  };

  const generateMealSuggestions = async () => {
    setIsLoading(true);
    setTimeout(() => {
      const suggestions = [
        {
          name: 'Grilled Chicken Quinoa Bowl',
          calories: 450,
          protein: 35,
          carbs: 45,
          fat: 12,
          prepTime: 20,
          difficulty: 'beginner' as const
        },
        {
          name: 'Salmon with Roasted Vegetables',
          calories: 380,
          protein: 28,
          carbs: 25,
          fat: 18,
          prepTime: 25,
          difficulty: 'intermediate' as const
        }
      ];
      
      suggestions.forEach((suggestion, index) => {
        const insight: NutritionInsight = {
          id: `suggestion-${Date.now()}-${index}`,
          type: 'suggestion',
          title: `AI Meal Suggestion: ${suggestion.name}`,
          message: `${suggestion.calories} cal • ${suggestion.protein}g protein • ${suggestion.prepTime}min prep • ${suggestion.difficulty} level`,
          icon: '🍽️',
          priority: 'medium',
          timestamp: new Date(),
          isRead: false
        };
        setInsights(prev => [insight, ...prev]);
      });
      
      setIsLoading(false);
    }, 2000);
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Nutrition Dashboard</h2>
          <p className="text-white/80">Welcome back, {userProfile.name}! Let's track your nutrition goals.</p>
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

      {showInsights && insights.length > 0 && (
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-lg rounded-xl p-4 border border-blue-500/40">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-medium flex items-center space-x-2">
              <Lightbulb className="w-5 h-5 text-yellow-400" />
              <span>Today's Insights</span>
            </h3>
            <button 
              onClick={() => setShowInsights(false)}
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
                <button className="text-white/40 hover:text-white transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
        <div className="mt-3 flex space-x-2">
          {['water', 'coffee', 'tea', 'juice'].map(type => (
            <button
              key={type}
              onClick={() => addWaterIntake(250, type as any)}
              className="flex-1 bg-white/10 text-white/80 py-2 px-3 rounded-lg hover:bg-white/20 transition-colors text-xs capitalize"
            >
              {type === 'water' ? '💧' : type === 'coffee' ? '☕' : type === 'tea' ? '🫖' : '🧃'} {type}
            </button>
          ))}
        </div>
      </div>

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
              <WifiOff className="w-4 h-4 text-red-400" />
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

      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium text-lg flex items-center space-x-2">
            <Utensils className="w-5 h-5" />
            <span>Today's Meals</span>
          </h3>
          <div className="flex space-x-2">
            <button 
              onClick={() => setCurrentView('analytics')}
              className="text-white/60 hover:text-white transition-colors p-2 bg-white/10 rounded-lg"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setCurrentView('meal-plan')}
              className="text-white/60 hover:text-white transition-colors p-2 bg-white/10 rounded-lg"
            >
              <BookOpen className="w-4 h-4" />
            </button>
          </div>
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

  return (
    <div className="h-full min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto">
        {currentView === 'dashboard' && renderDashboard()}
        {currentView !== 'dashboard' && (
          <div className="text-center py-12">
            <div className="text-white/60 text-lg mb-4">View not implemented yet</div>
            <button
              onClick={() => setCurrentView('dashboard')}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
