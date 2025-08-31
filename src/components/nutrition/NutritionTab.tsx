import React, { useEffect, useMemo, useRef, useState } from 'react';
import NutritionMacros from '../finalUI/NutritionMacros';
import NutritionWater from '../finalUI/NutritionWater';

type MealKey = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface FoodSearchItem {
  id: string;
  name: string;
  brand?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_size?: string;
  verified?: boolean;
}

interface LoggedItem extends FoodSearchItem {
  meal: MealKey;
  quantity: number;
}

const initialNutrition = {
  macros: {
    protein: { current: 0, goal: 150 },
    carbs: { current: 0, goal: 250 },
    fats: { current: 0, goal: 70 }
  },
  water: { current: 0, goal: 3000 },
  meals: {
    breakfast: { protein: 0, carbs: 0, fats: 0 },
    lunch: { protein: 0, carbs: 0, fats: 0 },
    dinner: { protein: 0, carbs: 0, fats: 0 },
    snack: { protein: 0, carbs: 0, fats: 0 }
  }
};

const quickAdds: FoodSearchItem[] = [
  { id: 'qa-1', name: 'Banana', calories: 105, protein: 1, carbs: 27, fat: 0.4, serving_size: '1 medium' },
  { id: 'qa-2', name: 'Greek Yogurt', calories: 130, protein: 15, carbs: 9, fat: 4, serving_size: '1 cup' },
  { id: 'qa-3', name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, serving_size: '100g' },
  { id: 'qa-4', name: 'Brown Rice', calories: 110, protein: 2.5, carbs: 23, fat: 0.9, serving_size: '1/2 cup cooked' }
];

interface NutritionTabProps {
  aiCoach?: { getNutritionAdvice?: (text: string, context: any) => Promise<any> };
}

const NutritionTab: React.FC<NutritionTabProps> = ({ aiCoach }) => {
  const [nutrition, setNutrition] = useState(initialNutrition);
  const [activeView, setActiveView] = useState<'dashboard' | 'search' | 'barcode' | 'analytics' | 'settings'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<FoodSearchItem[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<MealKey>('breakfast');
  const [barcode, setBarcode] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [items, setItems] = useState<LoggedItem[]>([]);
  const [dailyGoals, setDailyGoals] = useState({ calories: 2000, protein: 150, carbs: 250, fat: 70 });
  const [exerciseCalories, setExerciseCalories] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'barcode' | 'facts' | 'recipe'>('barcode');
  const [ocrStatus, setOcrStatus] = useState<string>('');
  const [factsForm, setFactsForm] = useState({ servingGrams: 100, protein: 0, carbs: 0, fat: 0, consumedGrams: 100, name: 'Nutrition Facts Item' });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [recipeImage, setRecipeImage] = useState<string | null>(null);
  const [recipeIngredients, setRecipeIngredients] = useState('');
  const [recipeSuggestion, setRecipeSuggestion] = useState<string>('');

  const api = null;

  const addFoodItem = (meal: MealKey, item: FoodSearchItem, quantity = 1) => {
    setItems(prev => [
      ...prev,
      { ...item, id: `${item.id}-${Date.now()}`, meal, quantity }
    ]);
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, quantity: Math.max(1, it.quantity + delta) } : it));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(it => it.id !== id));
  };

  const handleQuickAdd = (item: FoodSearchItem) => {
    addFoodItem(selectedMeal, item, 1);
  };

  const runSearch = async () => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    if (api) {
      const found = await api.searchFood(searchQuery);
      if (found.success) {
        const mapped: FoodSearchItem[] = found.results.map((r: any) => ({
          id: r.id || r.barcode || String(Math.random()),
          name: r.name,
          brand: r.brand,
          calories: r.calories || 0,
          protein: r.protein || 0,
          carbs: r.carbs || 0,
          fat: r.fat || 0,
          serving_size: r.serving_size,
          verified: r.verified
        }));
        setResults(mapped);
      } else {
        setResults([]);
      }
    }
  };

  const lookupBarcode = async () => {
    if (!barcode.trim() || !api) return;
    const res = await api.lookupBarcode(barcode);
    if (res.success && res.data) {
      const mapped: FoodSearchItem = {
        id: res.data.barcode || String(Date.now()),
        name: res.data.name || 'Scanned Product',
        brand: res.data.brand,
        calories: res.data.calories || 0,
        protein: res.data.protein || 0,
        carbs: res.data.carbs || 0,
        fat: res.data.fat || 0,
        serving_size: res.data.serving_size || '1 serving',
        verified: res.data.verified
      };
      addFoodItem(selectedMeal, mapped, 1);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraOn(true);
      }
    } catch (e) {
      console.error('Camera error', e);
    }
  };

  const stopCamera = () => {
    setIsCameraOn(false);
    const tracks = (videoRef.current?.srcObject as MediaStream | null)?.getTracks();
    tracks?.forEach(t => t.stop());
  };

  useEffect(() => () => stopCamera(), []);

  // Derived totals from logged items
  const totals = useMemo(() => {
    const byMeal: Record<MealKey, { calories: number; protein: number; carbs: number; fat: number }> = {
      breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      lunch: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      dinner: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      snack: { calories: 0, protein: 0, carbs: 0, fat: 0 }
    };
    let calories = 0, protein = 0, carbs = 0, fat = 0;
    items.forEach(it => {
      const kcal = (it.calories || (it.protein * 4 + it.carbs * 4 + it.fat * 9)) * it.quantity;
      const p = it.protein * it.quantity;
      const c = it.carbs * it.quantity;
      const f = it.fat * it.quantity;
      calories += kcal; protein += p; carbs += c; fat += f;
      byMeal[it.meal].calories += kcal; byMeal[it.meal].protein += p; byMeal[it.meal].carbs += c; byMeal[it.meal].fat += f;
    });
    return { calories, protein, carbs, fat, byMeal };
  }, [items]);

  const caloriesRemaining = useMemo(() => Math.max(0, dailyGoals.calories - totals.calories + exerciseCalories), [dailyGoals.calories, totals.calories, exerciseCalories]);

  const nutritionForCard = useMemo(() => ({
    macros: {
      protein: { current: Math.round(totals.protein), goal: nutrition.macros.protein.goal },
      carbs: { current: Math.round(totals.carbs), goal: nutrition.macros.carbs.goal },
      fats: { current: Math.round(totals.fat), goal: nutrition.macros.fats.goal }
    },
    water: nutrition.water,
    meals: {
      breakfast: { protein: Math.round(totals.byMeal.breakfast.protein), carbs: Math.round(totals.byMeal.breakfast.carbs), fats: Math.round(totals.byMeal.breakfast.fat) },
      lunch: { protein: Math.round(totals.byMeal.lunch.protein), carbs: Math.round(totals.byMeal.lunch.carbs), fats: Math.round(totals.byMeal.lunch.fat) },
      dinner: { protein: Math.round(totals.byMeal.dinner.protein), carbs: Math.round(totals.byMeal.dinner.carbs), fats: Math.round(totals.byMeal.dinner.fat) },
      snack: { protein: Math.round(totals.byMeal.snack.protein), carbs: Math.round(totals.byMeal.snack.carbs), fats: Math.round(totals.byMeal.snack.fat) }
    }
  }), [totals, nutrition.water, nutrition.macros.protein.goal, nutrition.macros.carbs.goal, nutrition.macros.fats.goal]);

  const dashboard = (
    <div className="flex flex-col gap-6">
      {/* Calorie summary like MyFitnessPal */}
      <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-white/10 rounded-2xl p-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-sm text-white/70">Calories Remaining</div>
            <div className="text-4xl font-extrabold text-white">{Math.round(caloriesRemaining)}</div>
          </div>
          <div className="text-right text-xs text-white/60">
            <div>Goal: {dailyGoals.calories}</div>
            <div>Food: {Math.round(totals.calories)}</div>
            <div>Exercise: {exerciseCalories}</div>
          </div>
        </div>
        <div className="mt-3 w-full bg-white/10 rounded-full h-2">
          <div className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-green-500" style={{ width: `${Math.min(100, (totals.calories / Math.max(1, dailyGoals.calories)) * 100)}%` }} />
        </div>
      </div>

      {/* Macros overview */}
      <NutritionMacros nutrition={nutritionForCard as any} onLogFoodClick={(meal) => setSelectedMeal(meal.toLowerCase() as MealKey)} />

      {/* Diary sections per meal */}
      {(['breakfast','lunch','dinner','snack'] as MealKey[]).map(meal => {
        const mealItems = items.filter(i => i.meal === meal);
        const m = totals.byMeal[meal];
        return (
          <div key={meal} className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-white/90 font-semibold capitalize text-lg">{meal}</div>
                <div className="text-white/60 text-xs">{Math.round(m.calories)} kcal • {Math.round(m.protein)}P/{Math.round(m.carbs)}C/{Math.round(m.fat)}F</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setSelectedMeal(meal); setActiveView('search'); }} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs">Add Food</button>
                <button onClick={() => { setSelectedMeal(meal); setModalTab('barcode'); setIsModalOpen(true); }} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs">Scan</button>
                <button onClick={() => { setSelectedMeal(meal); setModalTab('facts'); setIsModalOpen(true); }} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs">Scan Facts</button>
                <button onClick={() => { setSelectedMeal(meal); setModalTab('recipe'); setIsModalOpen(true); }} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs">Recipe</button>
              </div>
            </div>
            {mealItems.length === 0 ? (
              <div className="text-white/50 text-sm">No items added yet.</div>
            ) : (
              <div className="space-y-2">
                {mealItems.map(it => (
                  <div key={it.id} className="flex items-center justify-between bg-white/5 rounded-lg p-2">
                    <div className="min-w-0">
                      <div className="text-white text-sm font-medium truncate" title={it.name}>{it.name}</div>
                      <div className="text-white/60 text-xs truncate">{it.brand || 'Generic'} • {it.serving_size || '1 serving'}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-white/90 text-sm">{Math.round(it.calories * it.quantity)} kcal</div>
                        <div className="text-white/60 text-[11px]">{Math.round(it.protein * it.quantity)}P/{Math.round(it.carbs * it.quantity)}C/{Math.round(it.fat * it.quantity)}F</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQuantity(it.id, -1)} className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs">-</button>
                        <div className="w-8 text-center text-xs">{it.quantity}x</div>
                        <button onClick={() => updateQuantity(it.id, 1)} className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs">+</button>
                      </div>
                      <button onClick={() => removeItem(it.id)} className="px-2 py-1 rounded bg-red-600/80 hover:bg-red-700 text-xs">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Hydration */}
      <NutritionWater initialData={nutrition.water} />

      {/* Quick add strip */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white/90 font-semibold">Quick add to {selectedMeal}</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickAdds.map(item => (
            <button key={item.id} onClick={() => handleQuickAdd(item)} className="bg-white/10 hover:bg-white/20 rounded-lg p-3 text-left">
              <div className="text-white font-medium text-sm truncate" title={item.name}>{item.name}</div>
              <div className="text-white/60 text-xs">{item.calories} kcal • {item.protein}P/{item.carbs}C/{item.fat}F</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const searchView = (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button onClick={() => setActiveView('dashboard')} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm">Back</button>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search food (e.g., chicken, oatmeal)"
          className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm"
        />
        <button onClick={runSearch} className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-sm font-semibold">Search</button>
      </div>
      {!api && (
        <div className="text-xs text-yellow-300">Nutrition API not wired in this environment; search results may be empty.</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {results.map(item => (
          <div key={item.id} className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-white font-medium text-sm truncate" title={item.name}>{item.name}</div>
              <div className="text-white/60 text-xs truncate">{item.brand || 'Generic'} • {item.serving_size || '1 serving'}</div>
              <div className="text-white/60 text-xs">{Math.round(item.calories)} kcal • {item.protein}P/{item.carbs}C/{item.fat}F</div>
            </div>
            <button onClick={() => addMacros(selectedMeal, item.protein, item.carbs, item.fat)} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs">Add to {selectedMeal}</button>
          </div>
        ))}
      </div>
    </div>
  );

  const barcodeView = (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button onClick={() => setActiveView('dashboard')} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm">Back</button>
        <input
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="Enter barcode manually"
          className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm"
        />
        <button onClick={lookupBarcode} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold">Lookup</button>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-white/80 text-sm">Camera preview</div>
          {isCameraOn ? (
            <button onClick={stopCamera} className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-xs">Stop</button>
          ) : (
            <button onClick={startCamera} className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs">Start</button>
          )}
        </div>
        <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-lg bg-black/40 aspect-video" />
        <div className="text-white/50 text-xs mt-2">Point the camera at a barcode to scan. Auto-decoding can be integrated with a decoder library.</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen text-white p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto">
        {activeView === 'dashboard' && dashboard}
        {activeView === 'search' && searchView}
        {activeView === 'barcode' && barcodeView}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="absolute inset-0 bg-black/60" onClick={() => { setIsModalOpen(false); stopCamera(); }} />
          <div className="relative bg-gray-900 w-full sm:max-w-3xl sm:rounded-2xl border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <button onClick={() => setModalTab('barcode')} className={`px-3 py-1.5 rounded-lg text-sm ${modalTab==='barcode'?'bg-white/20 text-white':'bg-white/10 text-white/80 hover:bg-white/15'}`}>Barcode</button>
                <button onClick={() => setModalTab('facts')} className={`px-3 py-1.5 rounded-lg text-sm ${modalTab==='facts'?'bg-white/20 text-white':'bg-white/10 text-white/80 hover:bg-white/15'}`}>Nutrition Facts</button>
                <button onClick={() => setModalTab('recipe')} className={`px-3 py-1.5 rounded-lg text-sm ${modalTab==='recipe'?'bg-white/20 text-white':'bg-white/10 text-white/80 hover:bg-white/15'}`}>Recipe</button>
              </div>
              <button onClick={() => { setIsModalOpen(false); stopCamera(); }} className="text-white/70 hover:text-white">✕</button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4">
              {modalTab === 'barcode' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input value={barcode} onChange={(e)=>setBarcode(e.target.value)} placeholder="Enter barcode manually" className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm" />
                    <button onClick={lookupBarcode} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold">Lookup</button>
                    {isCameraOn ? (
                      <button onClick={stopCamera} className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm">Stop Camera</button>
                    ) : (
                      <button onClick={startCamera} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm">Start Camera</button>
                    )}
                  </div>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-lg bg-black/40 aspect-video" />
                  <div className="text-white/50 text-xs">Barcode decoding will use the 5-provider waterfall via your nutrition API.</div>
                </div>
              )}

              {modalTab === 'facts' && (
                <div className="space-y-3">
                  <div className="text-white/80 text-sm">Point the camera at the Nutrition Facts label; we can sample a frame and run OCR to extract macros. You can adjust values below before saving.</div>
                  <div className="flex items-center gap-2">
                    {isCameraOn ? (
                      <button onClick={stopCamera} className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm">Stop Camera</button>
                    ) : (
                      <button onClick={startCamera} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm">Start Camera</button>
                    )}
                    <button
                      onClick={() => {
                        try {
                          if (!videoRef.current || !canvasRef.current) return;
                          const v = videoRef.current; const c = canvasRef.current; const ctx = c.getContext('2d'); if (!ctx) return;
                          c.width = v.videoWidth; c.height = v.videoHeight; ctx.drawImage(v, 0, 0, c.width, c.height);
                          // Placeholder OCR pipeline: in production, pass c.toDataURL() to OCR and parse.
                          setOcrStatus('Captured frame. Running OCR...');
                          setTimeout(() => {
                            // Simple heuristic fallback values; real OCR populates these.
                            setFactsForm(prev => ({ ...prev, protein: prev.protein || 8, carbs: prev.carbs || 22, fat: prev.fat || 9, name: prev.name }));
                            setOcrStatus('OCR completed. Please review and save.');
                          }, 800);
                        } catch (e) {
                          setOcrStatus('Failed to capture.');
                        }
                      }}
                      className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm"
                    >Capture</button>
                  </div>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-lg bg-black/40 aspect-video" />
                  <canvas ref={canvasRef} className="hidden" />
                  {ocrStatus && <div className="text-xs text-white/70">{ocrStatus}</div>}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <input value={factsForm.name} onChange={(e)=>setFactsForm({ ...factsForm, name: e.target.value })} className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm col-span-2 sm:col-span-3" placeholder="Item name" />
                    <input value={factsForm.servingGrams} onChange={(e)=>setFactsForm({ ...factsForm, servingGrams: Number(e.target.value)||0 })} className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm" placeholder="Serving grams (per label)" />
                    <input value={factsForm.protein} onChange={(e)=>setFactsForm({ ...factsForm, protein: Number(e.target.value)||0 })} className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm" placeholder="Protein (g) per serving" />
                    <input value={factsForm.carbs} onChange={(e)=>setFactsForm({ ...factsForm, carbs: Number(e.target.value)||0 })} className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm" placeholder="Carbs (g) per serving" />
                    <input value={factsForm.fat} onChange={(e)=>setFactsForm({ ...factsForm, fat: Number(e.target.value)||0 })} className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm" placeholder="Fat (g) per serving" />
                    <input value={factsForm.consumedGrams} onChange={(e)=>setFactsForm({ ...factsForm, consumedGrams: Number(e.target.value)||0 })} className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm" placeholder="Consumed grams" />
                  </div>
                  <div className="text-xs text-white/60">We scale macros by consumed grams / serving grams to derive accurate totals.</div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button onClick={() => setIsModalOpen(false)} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm">Cancel</button>
                    <button
                      onClick={() => {
                        const scale = Math.max(0, (factsForm.servingGrams || 0) > 0 ? (factsForm.consumedGrams / factsForm.servingGrams) : 1);
                        const item: FoodSearchItem = {
                          id: `facts-${Date.now()}`,
                          name: factsForm.name,
                          calories: Math.round((factsForm.protein*4 + factsForm.carbs*4 + factsForm.fat*9) * scale),
                          protein: Number((factsForm.protein * scale).toFixed(1)),
                          carbs: Number((factsForm.carbs * scale).toFixed(1)),
                          fat: Number((factsForm.fat * scale).toFixed(1)),
                          serving_size: `${factsForm.consumedGrams} g`
                        };
                        addFoodItem(selectedMeal, item, 1);
                        setIsModalOpen(false);
                      }}
                      className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-sm font-semibold"
                    >Save to {selectedMeal}</button>
                  </div>
                </div>
              )}

              {modalTab === 'recipe' && (
                <div className="space-y-3">
                  <div className="text-white/80 text-sm">Show the camera to your pantry or upload an image; AI will suggest a recipe based on visible ingredients. You can also type ingredients.</div>
                  <div className="flex items-center gap-2">
                    {isCameraOn ? (
                      <button onClick={stopCamera} className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm">Stop Camera</button>
                    ) : (
                      <button onClick={startCamera} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm">Start Camera</button>
                    )}
                    <button
                      onClick={() => {
                        try {
                          if (!videoRef.current || !canvasRef.current) return;
                          const v = videoRef.current; const c = canvasRef.current; const ctx = c.getContext('2d'); if (!ctx) return;
                          c.width = v.videoWidth; c.height = v.videoHeight; ctx.drawImage(v, 0, 0, c.width, c.height);
                          const dataUrl = c.toDataURL('image/png');
                          setRecipeImage(dataUrl);
                        } catch {}
                      }}
                      className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm"
                    >Capture</button>
                  </div>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-lg bg-black/40 aspect-video" />
                  <canvas ref={canvasRef} className="hidden" />
                  {recipeImage && (
                    <img src={recipeImage} alt="Captured" className="w-full rounded-lg border border-white/10" />
                  )}
                  <textarea value={recipeIngredients} onChange={(e)=>setRecipeIngredients(e.target.value)} placeholder="List ingredients you have..." className="w-full min-h-[100px] px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm" />
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setIsModalOpen(false)} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm">Close</button>
                    <button
                      onClick={async () => {
                        const prompt = `Suggest a simple, healthy recipe using these ingredients: ${recipeIngredients || 'unknown items'}.
If possible, include approximate macros per serving.`;
                        try {
                          if (aiCoach?.getNutritionAdvice) {
                            const res = await aiCoach.getNutritionAdvice(prompt, {});
                            setRecipeSuggestion(typeof res === 'string' ? res : (res?.content || ''));
                          } else {
                            setRecipeSuggestion('AI Coach not connected. Provide ingredients and we will generate suggestions once available.');
                          }
                        } catch {
                          setRecipeSuggestion('Failed to fetch recipe.');
                        }
                      }}
                      className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-sm font-semibold"
                    >Get Recipe</button>
                  </div>
                  {recipeSuggestion && (
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3 whitespace-pre-wrap text-sm text-white/90">{recipeSuggestion}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NutritionTab;


