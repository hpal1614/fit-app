import React from 'react';
import { Play, Edit, Share, Clock, Target, TrendingUp, Users } from 'lucide-react';
import type { WorkoutPlan, WorkoutTemplate } from '../../types/workout';

interface WorkoutPlanCardProps {
  plan: WorkoutPlan | WorkoutTemplate;
  isActive?: boolean;
  isTemplate?: boolean;
  progress?: number;
  onStart: () => void;
  onEdit: () => void;
  onShare: () => void;
  onLoad?: () => void;
  onDelete?: () => void;
  className?: string;
}

export const WorkoutPlanCard: React.FC<WorkoutPlanCardProps> = ({ 
  plan, 
  isActive = false,
  isTemplate = false,
  progress = 0,
  onStart, 
  onEdit, 
  onShare,
  onLoad,
  onDelete,
  className = ''
}) => {
  // Handle both WorkoutPlan and WorkoutTemplate types
  const isWorkoutTemplate = 'exercises' in plan && !('date' in plan);
  const template = isWorkoutTemplate ? plan as WorkoutTemplate : null;
  const workoutPlan = !isWorkoutTemplate ? plan as WorkoutPlan : null;

  const name = template?.name || workoutPlan?.name || 'Untitled Workout';
  const description = template?.description || workoutPlan?.description || '';
  const estimatedDuration = template?.estimatedDuration || workoutPlan?.estimatedDuration || 60;
  const difficulty = template?.difficulty || 'intermediate';
  const category = template?.category || workoutPlan?.category || 'strength';
  const exerciseCount = template?.exercises?.length || workoutPlan?.exercises?.length || 0;

  // Get difficulty color
  const getDifficultyColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-red-600 bg-red-100';
      case 'expert': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get category color
  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'strength': return 'text-blue-600 bg-blue-100';
      case 'cardio': return 'text-green-600 bg-green-100';
      case 'flexibility': return 'text-purple-600 bg-purple-100';
      case 'powerlifting': return 'text-red-600 bg-red-100';
      case 'bodybuilding': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className={`
      p-6 border rounded-xl mb-4 transition-all duration-300 hover:shadow-lg
      ${isActive ? 'ring-2 ring-fitness-blue bg-blue-50' : 'bg-white hover:bg-gray-50'}
      ${className}
    `}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-bold text-gray-900">{name}</h3>
            {isTemplate && (
              <span className="px-2 py-1 bg-purple-100 text-purple-600 text-xs rounded-full">
                Template
              </span>
            )}
            {isActive && (
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full animate-pulse">
                Active
              </span>
            )}
          </div>
          
          {description && (
            <p className="text-sm text-gray-600 mb-3">{description}</p>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(category)}`}>
              {category}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(difficulty)}`}>
              {difficulty}
            </span>
          </div>
        </div>

        {/* Progress Ring (for active workouts) */}
        {isActive && progress > 0 && (
          <div className="relative w-16 h-16 ml-4">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r="8"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="2"
              />
              <circle
                cx="12"
                cy="12"
                r="8"
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeDasharray={2 * Math.PI * 8}
                strokeDashoffset={2 * Math.PI * 8 * (1 - progress / 100)}
                className="transition-all duration-300"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-gray-700">{progress}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Clock size={16} />
          <span>{estimatedDuration} min</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Target size={16} />
          <span>{exerciseCount} exercises</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <TrendingUp size={16} />
          <span>{difficulty}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {isTemplate ? (
          <>
            <button 
              onClick={onLoad} 
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Users size={16} />
              <span>Load Template</span>
            </button>
            <button 
              onClick={onEdit} 
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              <Edit size={16} />
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={onStart} 
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Play size={16} />
              <span>{isActive ? 'Resume' : 'Start'}</span>
            </button>
            <button 
              onClick={onEdit} 
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              <Edit size={16} />
            </button>
          </>
        )}
        
        <button 
          onClick={onShare} 
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Share size={16} />
        </button>
        
        {onDelete && (
          <button 
            onClick={onDelete} 
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};
