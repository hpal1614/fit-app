import React, { useState } from 'react';
import { X, Save, Calculator } from 'lucide-react';
import { NimbusMacros, NimbusMealType } from '../../../types/nimbus/NimbusNutrition';
import { NimbusButton } from '../NimbusButton';
import { NimbusCard } from '../NimbusCard';

interface NimbusCustomFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  meal: NimbusMealType;
  onSave: (foodData: {
    foodItem: string;
    brand?: string;
    quantity: number;
    unit: 'g' | 'ml' | 'oz' | 'cup' | 'piece' | 'serving';
    macros: NimbusMacros;
  }) => void;
}

export const NimbusCustomFoodModal: React.FC<NimbusCustomFoodModalProps> = ({
  isOpen,
  onClose,
  meal,
  onSave
}) => {
  const [form, setForm] = useState({
    foodItem: '',
    brand: '',
    quantity: 100,
    unit: 'g' as const,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!form.foodItem.trim()) {
      newErrors.foodItem = 'Food name is required';
    }
    
    if (form.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }
    
    if (form.calories < 0) {
      newErrors.calories = 'Calories cannot be negative';
    }
    
    if (form.protein < 0) {
      newErrors.protein = 'Protein cannot be negative';
    }
    
    if (form.carbs < 0) {
      newErrors.carbs = 'Carbs cannot be negative';
    }
    
    if (form.fat < 0) {
      newErrors.fat = 'Fat cannot be negative';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    
    const macros: NimbusMacros = {
      calories: form.calories,
      protein: form.protein,
      carbs: form.carbs,
      fat: form.fat,
      fiber: form.fiber || undefined,
      sugar: form.sugar || undefined
    };
    
    onSave({
      foodItem: form.foodItem.trim(),
      brand: form.brand.trim() || undefined,
      quantity: form.quantity,
      unit: form.unit,
      macros
    });
    
    // Reset form
    setForm({
      foodItem: '',
      brand: '',
      quantity: 100,
      unit: 'g',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0
    });
    setErrors({});
  };

  const calculateTotalCalories = () => {
    return (form.protein * 4) + (form.carbs * 4) + (form.fat * 9);
  };

  const handleCalorieCalculation = () => {
    const calculatedCalories = calculateTotalCalories();
    setForm(prev => ({ ...prev, calories: Math.round(calculatedCalories) }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <NimbusCard variant="default" padding="lg" className="w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Add Custom Food</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Food Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Food Name *</label>
            <input
              type="text"
              value={form.foodItem}
              onChange={(e) => handleChange('foodItem', e.target.value)}
              placeholder="e.g., Homemade Chicken Soup"
              className={`nimbus-input ${errors.foodItem ? 'border-red-500' : ''}`}
            />
            {errors.foodItem && (
              <p className="text-red-500 text-sm mt-1">{errors.foodItem}</p>
            )}
          </div>

          {/* Brand */}
          <div>
            <label className="block text-sm font-medium mb-1">Brand (optional)</label>
            <input
              type="text"
              value={form.brand}
              onChange={(e) => handleChange('brand', e.target.value)}
              placeholder="e.g., Homemade"
              className="nimbus-input"
            />
          </div>

          {/* Quantity and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Quantity *</label>
              <input
                type="number"
                value={form.quantity}
                onChange={(e) => handleChange('quantity', +e.target.value)}
                min="0"
                step="0.1"
                className={`nimbus-input ${errors.quantity ? 'border-red-500' : ''}`}
              />
              {errors.quantity && (
                <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unit</label>
              <select
                value={form.unit}
                onChange={(e) => handleChange('unit', e.target.value)}
                className="nimbus-input"
              >
                <option value="g">grams (g)</option>
                <option value="ml">milliliters (ml)</option>
                <option value="oz">ounces (oz)</option>
                <option value="cup">cups</option>
                <option value="piece">pieces</option>
                <option value="serving">servings</option>
              </select>
            </div>
          </div>

          {/* Nutrition Information */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Nutrition Information (per {form.quantity}{form.unit})</h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Calories</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={form.calories}
                    onChange={(e) => handleChange('calories', +e.target.value)}
                    min="0"
                    className={`nimbus-input flex-1 ${errors.calories ? 'border-red-500' : ''}`}
                  />
                  <NimbusButton
                    variant="secondary"
                    size="sm"
                    icon={<Calculator className="w-4 h-4" />}
                    onClick={handleCalorieCalculation}
                    title="Calculate from macros"
                  >
                    Calc
                  </NimbusButton>
                </div>
                {errors.calories && (
                  <p className="text-red-500 text-sm mt-1">{errors.calories}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Protein (g)</label>
                  <input
                    type="number"
                    value={form.protein}
                    onChange={(e) => handleChange('protein', +e.target.value)}
                    min="0"
                    step="0.1"
                    className={`nimbus-input ${errors.protein ? 'border-red-500' : ''}`}
                  />
                  {errors.protein && (
                    <p className="text-red-500 text-sm mt-1">{errors.protein}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    value={form.carbs}
                    onChange={(e) => handleChange('carbs', +e.target.value)}
                    min="0"
                    step="0.1"
                    className={`nimbus-input ${errors.carbs ? 'border-red-500' : ''}`}
                  />
                  {errors.carbs && (
                    <p className="text-red-500 text-sm mt-1">{errors.carbs}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fat (g)</label>
                  <input
                    type="number"
                    value={form.fat}
                    onChange={(e) => handleChange('fat', +e.target.value)}
                    min="0"
                    step="0.1"
                    className={`nimbus-input ${errors.fat ? 'border-red-500' : ''}`}
                  />
                  {errors.fat && (
                    <p className="text-red-500 text-sm mt-1">{errors.fat}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Fiber (g)</label>
                  <input
                    type="number"
                    value={form.fiber}
                    onChange={(e) => handleChange('fiber', +e.target.value)}
                    min="0"
                    step="0.1"
                    className="nimbus-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sugar (g)</label>
                  <input
                    type="number"
                    value={form.sugar}
                    onChange={(e) => handleChange('sugar', +e.target.value)}
                    min="0"
                    step="0.1"
                    className="nimbus-input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Calculated Calories Info */}
          {form.protein > 0 || form.carbs > 0 || form.fat > 0 ? (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Calculated calories:</strong> {calculateTotalCalories().toFixed(0)} cal
                <br />
                (Protein: {form.protein * 4} + Carbs: {form.carbs * 4} + Fat: {form.fat * 9})
              </p>
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div className="flex space-x-3 mt-6">
          <NimbusButton
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </NimbusButton>
          <NimbusButton
            variant="primary"
            icon={<Save className="w-4 h-4" />}
            onClick={handleSave}
            className="flex-1"
          >
            Save Food
          </NimbusButton>
        </div>
      </NimbusCard>
    </div>
  );
}; 