import React from 'react';
import { Target, Clock, TrendingUp, Info } from 'lucide-react';
import type { WorkoutExercise, Exercise } from '../types/workout';

interface ExerciseCardProps {
  exercise: WorkoutExercise | Exercise;
  isActive?: boolean;
  onExerciseSelect?: () => void;
  className?: string;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  isActive = false,
  onExerciseSelect,
  className = ''
}) => {
  // Handle both WorkoutExercise and Exercise types
  const exerciseData = 'exercise' in exercise ? exercise.exercise : exercise;
  const workoutExercise = 'exercise' in exercise ? exercise : null;
  
  const {
    name,
    category,
    muscleGroups,
    equipment,
    difficulty,
    instructions,
    tips,
    estimatedDuration
  } = exerciseData;

  // Get completed sets if it's a WorkoutExercise
  const completedSets = workoutExercise?.completedSets || [];
  const plannedSets = workoutExercise?.sets || [];

  // Calculate progress
  const progress = plannedSets.length > 0 
    ? Math.round((completedSets.length / plannedSets.length) * 100)
    : 0;

  // Get difficulty color
  const getDifficultyColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get category color
  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'strength': return 'text-blue-600 bg-blue-100';
      case 'cardio': return 'text-green-600 bg-green-100';
      case 'flexibility': return 'text-purple-600 bg-purple-100';
      case 'balance': return 'text-indigo-600 bg-indigo-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div 
      className={`
        exercise-card bg-white rounded-xl shadow-lg p-6 transition-all duration-300
        ${isActive ? 'ring-2 ring-fitness-blue shadow-xl' : 'hover:shadow-lg'}
        ${onExerciseSelect ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onExerciseSelect}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{name}</h3>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(category)}`}>
              {category}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(difficulty)}`}>
              {difficulty}
            </span>
            {equipment && equipment.length > 0 && (
              <span className="px-2 py-1 rounded-full text-xs font-medium text-gray-600 bg-gray-100">
                {equipment.join(', ')}
              </span>
            )}
          </div>
        </div>

        {/* Progress Ring (for active exercises) */}
        {isActive && workoutExercise && (
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
                stroke="#3b82f6"
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

      {/* Muscle Groups */}
      {muscleGroups && muscleGroups.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <Target size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Target Muscles</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {muscleGroups.map((muscle, index) => (
              <span
                key={index}
                className="px-2 py-1 rounded text-xs bg-fitness-blue bg-opacity-10 text-fitness-blue"
              >
                {muscle}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sets Information (for workout exercises) */}
      {workoutExercise && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Sets Progress</span>
            <span className="text-sm text-gray-500">
              {completedSets.length} / {plannedSets.length} completed
            </span>
          </div>
          
          {/* Sets Grid */}
          <div className="grid grid-cols-4 gap-2">
            {plannedSets.map((set, index) => {
              const completed = index < completedSets.length;
              const completedSet = completed ? completedSets[index] : null;
              
              return (
                <div
                  key={index}
                  className={`
                    p-2 rounded text-xs text-center border-2 transition-colors
                    ${completed 
                      ? 'bg-fitness-green bg-opacity-10 border-fitness-green text-fitness-green' 
                      : 'bg-gray-50 border-gray-200 text-gray-500'
                    }
                  `}
                >
                  <div className="font-medium">
                    Set {index + 1}
                  </div>
                  <div className="text-xs mt-1">
                    {completed && completedSet ? (
                      <>
                        {completedSet.reps} × {completedSet.weight}lb
                      </>
                    ) : (
                      <>
                        {set.reps} × {set.weight}lb
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Estimated Duration */}
      {estimatedDuration && (
        <div className="flex items-center space-x-2 mb-4 text-sm text-gray-600">
          <Clock size={16} />
          <span>{estimatedDuration} min estimated</span>
        </div>
      )}

      {/* Instructions */}
      {instructions && instructions.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <Info size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Instructions</span>
          </div>
          <ol className="text-sm text-gray-600 space-y-1 pl-4">
            {instructions.map((instruction, index) => (
              <li key={index} className="list-decimal">
                {instruction}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Tips */}
      {tips && tips.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Tips</span>
          </div>
          <ul className="text-sm text-gray-600 space-y-1 pl-4">
            {tips.map((tip, index) => (
              <li key={index} className="list-disc">
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      {isActive && (
        <div className="flex space-x-2 pt-4 border-t border-gray-100">
          <button className="flex-1 bg-fitness-blue text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">
            Log Set
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
            Skip
          </button>
        </div>
      )}
    </div>
  );
};

export default ExerciseCard;