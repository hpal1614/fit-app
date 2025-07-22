import React from 'react';
import { Play, Edit, Share2, Calendar, Clock, Dumbbell } from 'lucide-react';
import type { WorkoutPlan } from '../../types/workout';

export const WorkoutPlanCard: React.FC<{
  plan: WorkoutPlan;
  onStart: () => void;
  onEdit: () => void;
  onShare: () => void;
}> = ({ plan, onStart, onEdit, onShare }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{plan.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{plan.description}</p>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${
          plan.type === 'ai_generated' ? 'bg-blue-100 text-blue-700' :
          plan.type === 'custom' ? 'bg-green-100 text-green-700' :
          'bg-orange-100 text-orange-700'
        }`}>
          {plan.type.replace('_', ' ')}
        </span>
      </div>

      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
        <div className="flex items-center space-x-1">
          <Calendar size={16} />
          <span>{plan.daysPerWeek} days/week</span>
        </div>
        <div className="flex items-center space-x-1">
          <Clock size={16} />
          <span>{plan.estimatedDuration} min</span>
        </div>
        <div className="flex items-center space-x-1">
          <Dumbbell size={16} />
          <span>{plan.difficulty}</span>
        </div>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={onStart}
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
        >
          <Play size={16} />
          <span>Start</span>
        </button>
        <button
          onClick={onEdit}
          className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <Edit size={16} />
        </button>
        <button
          onClick={onShare}
          className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <Share2 size={16} />
        </button>
      </div>
    </div>
  );
};
