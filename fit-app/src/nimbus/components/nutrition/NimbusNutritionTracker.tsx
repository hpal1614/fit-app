import React, { useState, useEffect } from 'react';
import { Camera, Plus, Search, TrendingUp, Target } from 'lucide-react';
import { NimbusNutritionService } from '../../services/NimbusNutritionService';
import { NimbusDailyNutritionSummary, NimbusMealType, NimbusNutritionEntry } from '../../../types/nimbus/NimbusNutrition';
import { NimbusMacroRing } from './NimbusMacroRing';
import { NimbusMealSection } from './NimbusMealSection';
import { NimbusButton } from '../NimbusButton';
import { NimbusCard } from '../NimbusCard';

export const NimbusNutritionTracker: React.FC = () => {
  const [dailySummary, setDailySummary] = useState<NimbusDailyNutritionSummary | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<NimbusMealType>('breakfast');
  const [showAddFood, setShowAddFood] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const nutritionService = new NimbusNutritionService();

  useEffect(() => {
    loadTodaysNutrition();
  }, []);

  const loadTodaysNutrition = async () => {
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
    setSelectedMeal(meal);
    setShowAddFood(true);
  };

  const handleEditEntry = async (entry: NimbusNutritionEntry) => {
    // TODO: Implement edit modal
    console.log('Edit entry:', entry);
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      const success = await nutritionService.deleteEntry(entryId);
      if (success) {
        await loadTodaysNutrition();
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
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

      {/* Quick Actions */}
      <div className="flex space-x-3">
        <NimbusButton
          variant="primary"
          size="md"
          icon={<Camera className="w-5 h-5" />}
          onClick={() => {/* TODO: Implement barcode scanning */}}
          className="flex-1"
        >
          Scan Barcode
        </NimbusButton>
        <NimbusButton
          variant="secondary"
          size="md"
          icon={<Search className="w-5 h-5" />}
          onClick={() => {/* TODO: Implement food search */}}
          className="flex-1"
        >
          Search Food
        </NimbusButton>
      </div>

      {/* Meal Sections */}
      <div className="space-y-4">
        {(['breakfast', 'lunch', 'dinner', 'morning_snack', 'afternoon_snack', 'evening_snack'] as NimbusMealType[]).map((meal) => (
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
              Try the demo data to see the nutrition tracker in action!
            </p>
            <div className="flex space-x-3">
              <NimbusButton
                variant="secondary"
                onClick={() => setShowAddFood(false)}
                className="flex-1"
              >
                Cancel
              </NimbusButton>
                          <NimbusButton
              variant="primary"
              onClick={async () => {
                await nutritionService.addDemoData();
                await loadTodaysNutrition();
                setShowAddFood(false);
              }}
              className="flex-1"
            >
              Add Demo Data
            </NimbusButton>
            </div>
          </NimbusCard>
        </div>
      )}
    </div>
  );
}; 