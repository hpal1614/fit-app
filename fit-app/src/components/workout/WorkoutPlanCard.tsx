import React from 'react';
import type { WorkoutPlan } from '../../types/workout';

export const WorkoutPlanCard: React.FC<{
  plan: WorkoutPlan;
  onStart: () => void;
  onEdit: () => void;
  onShare: () => void;
}> = ({ plan, onStart, onEdit, onShare }) => {
  return (
    <div className="p-4 border rounded mb-2">
      <h3 className="font-bold">{plan.name}</h3>
      <p className="text-sm text-gray-500">{plan.description}</p>
      <div className="flex gap-2 mt-2">
        <button onClick={onStart} className="px-2 py-1 bg-blue-600 text-white rounded">Start</button>
        <button onClick={onEdit} className="px-2 py-1 bg-yellow-500 text-white rounded">Edit</button>
        <button onClick={onShare} className="px-2 py-1 bg-green-600 text-white rounded">Share</button>
      </div>
    </div>
  );
};
