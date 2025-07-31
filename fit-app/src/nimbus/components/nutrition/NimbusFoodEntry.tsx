import React from 'react';
import { Edit, Trash2, MoreVertical } from 'lucide-react';
import { NimbusNutritionEntry } from '../../../types/nimbus/NimbusNutrition';

interface NimbusFoodEntryProps {
  entry: NimbusNutritionEntry;
  onEdit: () => void;
  onDelete: () => void;
}

export const NimbusFoodEntry: React.FC<NimbusFoodEntryProps> = ({
  entry,
  onEdit,
  onDelete
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'barcode':
        return '📱';
      case 'voice':
        return '🎤';
      case 'ai':
        return '🤖';
      default:
        return '✏️';
    }
  };

  return (
    <div className="nimbus-food-entry bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm">{getSourceIcon(entry.source)}</span>
            <h4 className="font-medium text-gray-900 dark:text-white">
              {entry.foodItem}
            </h4>
            {entry.brand && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                • {entry.brand}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>
              {entry.quantity} {entry.unit}
            </span>
            <span>•</span>
            <span>{Math.round(entry.macros.calories)} cal</span>
            <span>•</span>
            <span>{formatTime(entry.timestamp)}</span>
          </div>

          {/* Macro breakdown */}
          <div className="flex space-x-4 text-xs">
            <span className="text-green-600 dark:text-green-400">
              P: {entry.macros.protein}g
            </span>
            <span className="text-orange-600 dark:text-orange-400">
              C: {entry.macros.carbs}g
            </span>
            <span className="text-red-600 dark:text-red-400">
              F: {entry.macros.fat}g
            </span>
            {entry.macros.fiber && (
              <span className="text-blue-600 dark:text-blue-400">
                Fiber: {entry.macros.fiber}g
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-1">
          <button
            onClick={onEdit}
            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            aria-label="Edit food entry"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            aria-label="Delete food entry"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}; 