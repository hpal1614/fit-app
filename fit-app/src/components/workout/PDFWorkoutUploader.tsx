import React from 'react';
import { ArrowLeft, FileText, Upload } from 'lucide-react';
import type { WorkoutPlan } from '../../types/workout';

export const PDFWorkoutUploader: React.FC<{
  onUpload: (plan: WorkoutPlan) => void;
  onBack: () => void;
  aiService: any;
}> = ({ onUpload, onBack, aiService }) => {
  return (
    <div className="p-4">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="mr-3">
          <ArrowLeft size={24} className="text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Upload PDF Workout
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Import workout plans from PDF files
          </p>
        </div>
      </div>

      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-4">
          <Upload size={40} className="text-orange-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
          PDF Workout Intelligence
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
          Upload any fitness PDF (AthleanX, 5/3/1, custom programs)
        </p>
        <div className="max-w-md mx-auto">
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
            <FileText size={32} className="mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This feature will be available soon!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
