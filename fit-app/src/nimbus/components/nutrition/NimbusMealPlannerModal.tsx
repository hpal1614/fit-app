import React, { useState } from 'react';
import { X, ChefHat, Loader2 } from 'lucide-react';
import { NimbusMealPlanRequest, NimbusMealPlan, NimbusMealType } from '../../../types/nimbus/NimbusNutrition';
import { NimbusButton } from '../NimbusButton';
import { NimbusCard } from '../NimbusCard';
import { nimbusMealPlanner } from '../../services/NimbusMealPlanner';

interface NimbusMealPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NimbusMealPlannerModal: React.FC<NimbusMealPlannerModalProps> = ({ isOpen, onClose }) => {
  const [form, setForm] = useState<NimbusMealPlanRequest>({
    macroTargets: {
      dailyCalories: 2000,
      proteinGrams: 120,
      carbsGrams: 200,
      fatGrams: 60
    },
    daysCount: 3,
    dietaryRestrictions: [],
    cookingSkill: 'beginner',
    maxCookingTime: 30,
    weeklyBudget: 100
  });
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<NimbusMealPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleMacroChange = (macro: string, value: number) => {
    setForm((prev) => ({
      ...prev,
      macroTargets: { ...prev.macroTargets, [macro]: value }
    }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setPlan(null);
    try {
      const result = await nimbusMealPlanner.generateMealPlan(form);
      setPlan(result);
    } catch (e: any) {
      setError(e.message || 'Failed to generate meal plan');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <NimbusCard variant="default" padding="lg" className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-primary-500" /> AI Meal Planner
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Calories</label>
              <input type="number" className="nimbus-input" value={form.macroTargets.dailyCalories} onChange={e => handleMacroChange('dailyCalories', +e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Protein (g)</label>
              <input type="number" className="nimbus-input" value={form.macroTargets.proteinGrams} onChange={e => handleMacroChange('proteinGrams', +e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Carbs (g)</label>
              <input type="number" className="nimbus-input" value={form.macroTargets.carbsGrams} onChange={e => handleMacroChange('carbsGrams', +e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fat (g)</label>
              <input type="number" className="nimbus-input" value={form.macroTargets.fatGrams} onChange={e => handleMacroChange('fatGrams', +e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Days</label>
              <input type="number" className="nimbus-input" value={form.daysCount} onChange={e => handleChange('daysCount', +e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Cooking Time (min)</label>
              <input type="number" className="nimbus-input" value={form.maxCookingTime} onChange={e => handleChange('maxCookingTime', +e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Weekly Budget (AUD)</label>
              <input type="number" className="nimbus-input" value={form.weeklyBudget} onChange={e => handleChange('weeklyBudget', +e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cooking Skill</label>
              <select className="nimbus-input" value={form.cookingSkill} onChange={e => handleChange('cookingSkill', e.target.value)}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Dietary Restrictions (comma separated)</label>
            <input type="text" className="nimbus-input" value={form.dietaryRestrictions.join(', ')} onChange={e => handleChange('dietaryRestrictions', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
          </div>
        </div>

        <NimbusButton variant="primary" size="lg" onClick={handleGenerate} disabled={loading} className="w-full mb-4">
          {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
          Generate Meal Plan
        </NimbusButton>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

        {/* Result */}
        {plan && (
          <div className="mt-4">
            <h4 className="text-lg font-bold mb-2">Meal Plan for {plan.totalDays} Days</h4>
            <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
              Avg Calories: {plan.weeklyNutritionSummary.avgDailyCalories} | Protein: {plan.weeklyNutritionSummary.avgDailyProtein}g | Carbs: {plan.weeklyNutritionSummary.avgDailyCarbs}g | Fat: {plan.weeklyNutritionSummary.avgDailyFat}g
            </div>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {plan.days.map(day => (
                <div key={day.day} className="border-b pb-2">
                  <div className="font-semibold mb-1">Day {day.day}</div>
                  {['breakfast', 'lunch', 'dinner', 'snacks'].map(mealType => {
                    const meal = (day.meals as any)[mealType];
                    if (!meal) return null;
                    return (
                      <div key={mealType} className="mb-1">
                        <span className="font-medium capitalize">{mealType}:</span> {meal.name}
                        <span className="ml-2 text-xs text-gray-500">({meal.nutrition.calories} cal, P:{meal.nutrition.protein}g, C:{meal.nutrition.carbs}g, F:{meal.nutrition.fat}g)</span>
                        <div className="ml-4 text-xs text-gray-500">{meal.instructions?.join(' ')} </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="mt-4">
              <h5 className="font-semibold mb-1">Shopping List</h5>
              <ul className="list-disc pl-6 text-sm">
                {plan.shoppingList.map((item, idx) => (
                  <li key={idx}>{item.item} - {item.totalAmount} {item.unit} (${item.estimatedCost} AUD)</li>
                ))}
              </ul>
            </div>
            <div className="mt-4">
              <h5 className="font-semibold mb-1">Weekly Prep Tips</h5>
              <ul className="list-disc pl-6 text-sm">
                {plan.weeklyPrepTips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </NimbusCard>
    </div>
  );
};