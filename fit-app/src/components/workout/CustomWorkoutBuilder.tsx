import React from 'react';
import type { WorkoutPlan } from '../../types/workout';

export const CustomWorkoutBuilder: React.FC<{
  onSave: (plan: WorkoutPlan) => void;
  onBack: () => void;
  aiService: {
    getCoachingResponse: (prompt: string, context: unknown, type: string) => Promise<{ content: string }>;
  };
}> = ({ onSave: _onSave, onBack }) => {
  return (
    <div className="p-4">
      <button onClick={onBack} className="mb-4 text-blue-600">← Back</button>
      <h2 className="text-2xl font-bold mb-4">Custom Workout Builder</h2>
      <p className="text-gray-600">Custom workout builder coming soon...</p>
    </div>
  );
};
