import React from 'react';
import type { WorkoutPlan } from '../../types/workout';
import type { AICoachService } from '../../services/aiService';

export const PDFWorkoutUploader: React.FC<{
  onUpload: (plan: WorkoutPlan) => void;
  onBack: () => void;
  aiService: AICoachService;
}> = ({ onBack }) => {
  return (
    <div className="p-4 text-center">
      <h2 className="text-xl font-bold mb-4">PDF Workout Uploader</h2>
      <p className="text-gray-500">This feature will be available soon!</p>
      <button onClick={onBack} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Back</button>
    </div>
  );
};
