import React, { useState } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { NimbusNutritionEntry } from '../../../types/nimbus/NimbusNutrition';
import { NimbusButton } from '../NimbusButton';
import { NimbusCard } from '../NimbusCard';

interface NimbusEditFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: NimbusNutritionEntry | null;
  onSave: (entryId: string, updates: Partial<NimbusNutritionEntry>) => void;
  onDelete: (entryId: string) => void;
}

export const NimbusEditFoodModal: React.FC<NimbusEditFoodModalProps> = ({
  isOpen,
  onClose,
  entry,
  onSave,
  onDelete
}) => {
  const [quantity, setQuantity] = useState(entry?.quantity || 0);
  const [isDeleting, setIsDeleting] = useState(false);

  React.useEffect(() => {
    if (entry) {
      setQuantity(entry.quantity);
    }
  }, [entry]);

  const handleSave = () => {
    if (!entry) return;
    
    onSave(entry.id, { quantity });
    onClose();
  };

  const handleDelete = async () => {
    if (!entry) return;
    
    setIsDeleting(true);
    try {
      await onDelete(entry.id);
      onClose();
    } catch (error) {
      console.error('Error deleting entry:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !entry) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <NimbusCard variant="default" padding="lg" className="w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Edit Food Entry</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Food Info */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              {entry.foodItem}
            </h4>
            {entry.brand && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Brand: {entry.brand}
              </p>
            )}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Calories:</span>
                <span className="ml-2 font-medium">{Math.round(entry.macros.calories)}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Protein:</span>
                <span className="ml-2 font-medium">{entry.macros.protein}g</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Carbs:</span>
                <span className="ml-2 font-medium">{entry.macros.carbs}g</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Fat:</span>
                <span className="ml-2 font-medium">{entry.macros.fat}g</span>
              </div>
            </div>
          </div>

          {/* Quantity Edit */}
          <div>
            <label className="block text-sm font-medium mb-1">Quantity</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(+e.target.value)}
                min="0"
                step="0.1"
                className="nimbus-input flex-1"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {entry.unit}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Original: {entry.quantity} {entry.unit}
            </p>
          </div>

          {/* Updated Nutrition Preview */}
          {quantity !== entry.quantity && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                Updated Nutrition (per {quantity} {entry.unit}):
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-blue-600 dark:text-blue-400">Calories:</span>
                  <span className="ml-1">{Math.round((entry.macros.calories / entry.quantity) * quantity)}</span>
                </div>
                <div>
                  <span className="text-blue-600 dark:text-blue-400">Protein:</span>
                  <span className="ml-1">{((entry.macros.protein / entry.quantity) * quantity).toFixed(1)}g</span>
                </div>
                <div>
                  <span className="text-blue-600 dark:text-blue-400">Carbs:</span>
                  <span className="ml-1">{((entry.macros.carbs / entry.quantity) * quantity).toFixed(1)}g</span>
                </div>
                <div>
                  <span className="text-blue-600 dark:text-blue-400">Fat:</span>
                  <span className="ml-1">{((entry.macros.fat / entry.quantity) * quantity).toFixed(1)}g</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-3 mt-6">
          <NimbusButton
            variant="danger"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </NimbusButton>
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
            disabled={quantity === entry.quantity}
            className="flex-1"
          >
            Save Changes
          </NimbusButton>
        </div>
      </NimbusCard>
    </div>
  );
}; 