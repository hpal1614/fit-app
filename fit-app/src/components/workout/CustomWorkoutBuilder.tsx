import React from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import type { WorkoutPlan } from '../../types/workout';

export const CustomWorkoutBuilder: React.FC<{
  onSave: (plan: WorkoutPlan) => void;
  onBack: () => void;
  aiService: any;
}> = ({ onSave, onBack, aiService }) => {
  return (
    <div className="p-4">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="mr-3">
          <ArrowLeft size={24} className="text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Custom Workout Builder
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create your personalized workout plan
          </p>
        </div>
      </div>

      <div className="text-center py-12">
        <Plus size={48} className="mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
          Custom Workout Builder
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          This feature will be available soon!
        </p>
      </div>
    </div>
  );
};
