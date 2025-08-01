import React from 'react';
import { Plus } from 'lucide-react';
import { NimbusNutritionEntry, NimbusMealType } from '../../../types/nimbus/NimbusNutrition';
import { NimbusFoodEntry } from './NimbusFoodEntry';
import { NimbusButton } from '../NimbusButton';

interface NimbusMealSectionProps {
  meal: NimbusMealType;
  entries: NimbusNutritionEntry[];
  onAddFood: () => void;
  onEditEntry: (entry: NimbusNutritionEntry) => void;
  onDeleteEntry: (entryId: string) => void;
}

export const NimbusMealSection: React.FC<NimbusMealSectionProps> = ({
  meal,
  entries,
  onAddFood,
  onEditEntry,
  onDeleteEntry
}) => {
  const mealLabels = {
    breakfast: '🌅 Breakfast',
    lunch: '☀️ Lunch', 
    dinner: '🌙 Dinner',
    'morning-snack': '🍎 Morning Snack',
    'afternoon-snack': '🥨 Afternoon Snack',
    'evening-snack': '🍫 Evening Snack'
  };

  const totalCalories = entries.reduce((sum, entry) => sum + entry.macros.calories, 0);
  const totalProtein = entries.reduce((sum, entry) => sum + entry.macros.protein, 0);
  const totalCarbs = entries.reduce((sum, entry) => sum + entry.macros.carbs, 0);
  const totalFat = entries.reduce((sum, entry) => sum + entry.macros.fat, 0);

  return (
    <div className="nimbus-meal-section bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {mealLabels[meal]}
          </h3>
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
            <span>{Math.round(totalCalories)} calories</span>
            <span>•</span>
            <span className="text-green-600 dark:text-green-400">P: {Math.round(totalProtein)}g</span>
            <span className="text-orange-600 dark:text-orange-400">C: {Math.round(totalCarbs)}g</span>
            <span className="text-red-600 dark:text-red-400">F: {Math.round(totalFat)}g</span>
          </div>
        </div>
        
        <NimbusButton
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={onAddFood}
        >
          Add Food
        </NimbusButton>
      </div>

      {/* Food Entries */}
      <div className="space-y-3">
        {entries.map((entry) => (
          <NimbusFoodEntry
            key={entry.id}
            entry={entry}
            onEdit={() => onEditEntry(entry)}
            onDelete={() => onDeleteEntry(entry.id)}
          />
        ))}
        
        {entries.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <p className="font-medium">No foods logged for this meal yet</p>
            <p className="text-sm mt-1">Tap "Add Food" to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}; 