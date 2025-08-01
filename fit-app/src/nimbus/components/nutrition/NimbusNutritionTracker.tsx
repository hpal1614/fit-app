import React, { useState, useEffect } from 'react';
import { Camera, Plus, Search, TrendingUp, Target, ChefHat, BarChart3 } from 'lucide-react';
import { NimbusNutritionService } from '../../services/NimbusNutritionService';
import { NimbusDailyNutritionSummary, NimbusMealType, NimbusNutritionEntry, NimbusProductInfo } from '../../../types/nimbus/NimbusNutrition';
import { NimbusMacroRing } from './NimbusMacroRing';
import { NimbusMealSection } from './NimbusMealSection';
import { NimbusBarcodeScannerModal } from './NimbusBarcodeScannerModal';
import { NimbusFoodSearchModal } from './NimbusFoodSearchModal';
import { NimbusButton } from '../NimbusButton';
import { NimbusCard } from '../NimbusCard';
import { NimbusMealPlannerModal } from './NimbusMealPlannerModal';
import { NimbusNutritionAnalytics } from './NimbusNutritionAnalytics';
import { NimbusCustomFoodModal } from './NimbusCustomFoodModal';
import { NimbusEditFoodModal } from './NimbusEditFoodModal';

export const NimbusNutritionTracker: React.FC = () => {
  const [dailySummary, setDailySummary] = useState<NimbusDailyNutritionSummary | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<NimbusMealType>('breakfast');
  const [showAddFood, setShowAddFood] = useState(false);

  // Debug modal state changes
  useEffect(() => {
    console.log('showAddFood changed to:', showAddFood, 'at:', new Date().toISOString());
  }, [showAddFood]);

  // Force close modal on mount
  useEffect(() => {
    console.log('Component mounted - forcing modal to close');
    setShowAddFood(false);
  }, []);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showFoodSearch, setShowFoodSearch] = useState(false);

  // Debug showFoodSearch changes
  useEffect(() => {
    console.log('showFoodSearch changed to:', showFoodSearch, 'at:', new Date().toISOString());
  }, [showFoodSearch]);
  const [showMealPlanner, setShowMealPlanner] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showCustomFood, setShowCustomFood] = useState(false);
  const [showEditFood, setShowEditFood] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<NimbusNutritionEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const nutritionService = new NimbusNutritionService();

  useEffect(() => {
    console.log('NimbusNutritionTracker component mounted');
    loadTodaysNutrition();
  }, []);

  const closeAllModals = () => {
    console.log('Closing all modals - called from:', new Error().stack?.split('\n')[2] || 'unknown');
    console.log('Before closing - showFoodSearch:', showFoodSearch);
    setShowAddFood(false);
    setShowBarcodeScanner(false);
    setShowFoodSearch(false);
    setShowCustomFood(false);
    setShowEditFood(false);
    setShowMealPlanner(false);
    setShowAnalytics(false);
    setSelectedEntry(null);
    console.log('After closing - showFoodSearch should be false');
  };

  const loadTodaysNutrition = async () => {
    console.log('loadTodaysNutrition called');
    setIsLoading(true);
    try {
      const today = new Date();
      const summary = await nutritionService.getDailySummary(today);
      setDailySummary(summary);
    } catch (error) {
      console.error('Error loading nutrition data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFood = (meal: NimbusMealType) => {
    console.log('handleAddFood called for meal:', meal);
    setSelectedMeal(meal);
    setShowAddFood(true);
  };

  const handleProductFound = async (product: NimbusProductInfo) => {
    try {
      const servingSize = product.servingSize?.amount || 100;
      const nutrition = product.servingSize?.nutritionPerServing || product.nutritionPer100g;
      
      await nutritionService.addEntry({
        foodItem: product.name,
        brand: product.brand,
        barcode: product.barcode,
        quantity: servingSize,
        unit: (product.servingSize?.unit as any) || 'g',
        macros: nutrition,
        meal: selectedMeal,
        source: product.barcode ? 'barcode' : 'manual'
      });
      
      await loadTodaysNutrition();
      
      // Close all modals after successful addition
      closeAllModals();
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const handleCustomFoodSave = async (foodData: {
    foodItem: string;
    brand?: string;
    quantity: number;
    unit: 'g' | 'ml' | 'oz' | 'cup' | 'piece' | 'serving';
    macros: NimbusMacros;
  }) => {
    try {
      await nutritionService.addEntry({
        foodItem: foodData.foodItem,
        brand: foodData.brand,
        quantity: foodData.quantity,
        unit: foodData.unit,
        macros: foodData.macros,
        meal: selectedMeal,
        source: 'manual'
      });
      
      await loadTodaysNutrition();
      
      // Close modals after successful addition
      closeAllModals();
    } catch (error) {
      console.error('Error adding custom food:', error);
    }
  };

  const handleEditEntry = async (entry: NimbusNutritionEntry) => {
    setSelectedEntry(entry);
    setShowEditFood(true);
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      const success = await nutritionService.deleteEntry(entryId);
      if (success) {
        await loadTodaysNutrition();
        closeAllModals();
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const handleUpdateEntry = async (entryId: string, updates: Partial<NimbusNutritionEntry>) => {
    try {
      const updatedEntry = await nutritionService.updateEntry(entryId, updates);
      if (updatedEntry) {
        await loadTodaysNutrition();
        closeAllModals();
      }
    } catch (error) {
      console.error('Error updating entry:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your nutrition data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="nimbus-nutrition-tracker p-4 space-y-6">
      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mb-2">
        <NimbusButton
          variant="secondary"
          size="md"
          icon={<BarChart3 className="w-5 h-5" />}
          onClick={() => {
            closeAllModals();
            setShowAnalytics(true);
          }}
        >
          Analytics
        </NimbusButton>
        <NimbusButton
          variant="primary"
          size="md"
          icon={<ChefHat className="w-5 h-5" />}
          onClick={() => {
            closeAllModals();
            setShowMealPlanner(true);
          }}
        >
          AI Meal Planner
        </NimbusButton>
      </div>
      {/* Daily Progress Overview */}
      <NimbusCard variant="glass" padding="lg" className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Today's Nutrition
        </h2>
        
        {dailySummary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Calories */}
            <div className="text-center">
              <NimbusMacroRing 
                current={dailySummary.totals.calories}
                target={dailySummary.goals.dailyCalories}
                color="#3B82F6"
                label="Calories"
              />
            </div>
            
            {/* Protein */}
            <div className="text-center">
              <NimbusMacroRing 
                current={dailySummary.totals.protein}
                target={dailySummary.goals.proteinGrams}
                color="#10B981"
                label="Protein"
                unit="g"
              />
            </div>
            
            {/* Carbs */}
            <div className="text-center">
              <NimbusMacroRing 
                current={dailySummary.totals.carbs}
                target={dailySummary.goals.carbsGrams}
                color="#F59E0B"
                label="Carbs"
                unit="g"
              />
            </div>
            
            {/* Fat */}
            <div className="text-center">
              <NimbusMacroRing 
                current={dailySummary.totals.fat}
                target={dailySummary.goals.fatGrams}
                color="#EF4444"
                label="Fat"
                unit="g"
              />
            </div>
          </div>
        )}

        {/* Remaining Calories */}
        {dailySummary && (
          <div className="mt-6 text-center">
            <p className="text-lg text-gray-700 dark:text-gray-300">
              <span className="font-bold text-2xl text-blue-600">
                {dailySummary.remainingCalories}
              </span> calories remaining
            </p>
          </div>
        )}
      </NimbusCard>

      {/* Quick Actions - REMOVED TO FIX MODAL ISSUE */}
      {/* These buttons were causing the modal to open automatically */}
      {/* The functionality is available in the "Add Food" modal for each meal */}

      {/* Meal Sections */}
      <div className="space-y-4">
        {(['breakfast', 'lunch', 'dinner', 'morning-snack', 'afternoon-snack', 'evening-snack'] as NimbusMealType[]).map((meal) => (
          <NimbusMealSection
            key={meal}
            meal={meal}
            entries={dailySummary?.entries.filter(e => e.meal === meal) || []}
            onAddFood={() => handleAddFood(meal)}
            onEditEntry={handleEditEntry}
            onDeleteEntry={handleDeleteEntry}
          />
        ))}
      </div>

            {/* Add Food Modal */}
      {showAddFood && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <NimbusCard variant="default" padding="lg" className="w-full max-w-md mx-4">
            <h3 className="text-xl font-bold mb-4">Add Food to {selectedMeal}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Choose how you'd like to add food to your {selectedMeal}:
            </p>
            <div className="space-y-3 mb-4">
              <NimbusButton
                variant="primary"
                size="md"
                icon={<Camera className="w-4 h-4" />}
                onClick={() => {
                  closeAllModals();
                  setShowBarcodeScanner(true);
                }}
                className="w-full"
              >
                Scan Barcode
              </NimbusButton>
              <NimbusButton
                variant="secondary"
                size="md"
                icon={<Search className="w-4 h-4" />}
                onClick={() => {
                  closeAllModals();
                  setShowFoodSearch(true);
                }}
                className="w-full"
              >
                Search Products
              </NimbusButton>
              <NimbusButton
                variant="secondary"
                size="md"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  closeAllModals();
                  setShowCustomFood(true);
                }}
                className="w-full"
              >
                Add Custom Food
              </NimbusButton>
              <NimbusButton
                variant="ghost"
                size="md"
                onClick={async () => {
                  await nutritionService.addDemoData();
                  await loadTodaysNutrition();
                  closeAllModals();
                }}
                className="w-full"
              >
                Add Demo Data
              </NimbusButton>
            </div>
            <NimbusButton
              variant="secondary"
              onClick={closeAllModals}
              className="w-full"
            >
              Cancel
            </NimbusButton>
          </NimbusCard>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      <NimbusBarcodeScannerModal
        isOpen={showBarcodeScanner}
        onClose={closeAllModals}
        onProductFound={handleProductFound}
      />

      {/* Food Search Modal */}
      {(() => {
        console.log('Rendering FoodSearchModal - isOpen:', showFoodSearch);
        return true;
      })() && (
        <NimbusFoodSearchModal
          isOpen={showFoodSearch}
          onClose={closeAllModals}
          onProductFound={handleProductFound}
        />
      )}

      {/* Meal Planner Modal */}
      <NimbusMealPlannerModal isOpen={showMealPlanner} onClose={closeAllModals} />

      {/* Analytics Modal */}
      <NimbusNutritionAnalytics isOpen={showAnalytics} onClose={closeAllModals} />

      {/* Custom Food Modal */}
      <NimbusCustomFoodModal
        isOpen={showCustomFood}
        onClose={closeAllModals}
        meal={selectedMeal}
        onSave={handleCustomFoodSave}
      />

      {/* Edit Food Modal */}
      <NimbusEditFoodModal
        isOpen={showEditFood}
        onClose={closeAllModals}
        entry={selectedEntry}
        onSave={handleUpdateEntry}
        onDelete={handleDeleteEntry}
      />
    </div>
  );
}; 