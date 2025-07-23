import React from 'react';
import type { WorkoutPlan } from '../../types/workout';

export const CustomWorkoutBuilder: React.FC<{
  onSave: (plan: WorkoutPlan) => void;
  onBack: () => void;
  aiService: any;
}> = ({ onBack }) => {
  return (
    <div className="p-4 text-center">
      <h2 className="text-xl font-bold mb-4">Custom Workout Builder</h2>
      <p className="text-gray-500">This feature will be available soon!</p>
      <button onClick={onBack} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Back</button>
    </div>
  );
};
