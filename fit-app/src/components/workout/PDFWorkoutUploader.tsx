import React from 'react';
import type { WorkoutPlan } from '../../types/workout';

export const PDFWorkoutUploader: React.FC<{
  onUpload: (plan: WorkoutPlan) => void;
  onBack: () => void;
  aiService: {
    getCoachingResponse: (prompt: string, context: unknown, type: string) => Promise<{ content: string }>;
  };
}> = ({ onUpload: _onUpload, onBack }) => {
  return (
    <div className="p-4">
      <button onClick={onBack} className="mb-4 text-blue-600">← Back</button>
      <h2 className="text-2xl font-bold mb-4">PDF Workout Uploader</h2>
      <p className="text-gray-600">PDF upload feature coming soon...</p>
    </div>
  );
};
