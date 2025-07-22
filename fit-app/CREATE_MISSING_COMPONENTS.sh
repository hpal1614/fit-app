#!/bin/bash

echo "🔧 Creating all missing components..."

# Create workout directory if it doesn't exist
mkdir -p src/components/workout

# Create AIWorkoutGenerator
cat > src/components/workout/AIWorkoutGenerator.tsx << 'ENDFILE'
import React, { useState } from 'react';
import { ArrowLeft, Zap, Clock, Target } from 'lucide-react';

interface UserProfile {
  experience: string;
  goals: string[];
  daysPerWeek: number;
  sessionLength: number;
  equipment: string[];
  limitations: string[];
}

export const AIWorkoutGenerator: React.FC<{
  onGenerate: (profile: UserProfile) => Promise<void>;
  onBack: () => void;
}> = ({ onGenerate, onBack }) => {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    experience: '',
    goals: [],
    daysPerWeek: 3,
    sessionLength: 60,
    equipment: [],
    limitations: []
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await onGenerate(profile);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          AI is creating your workout...
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          Analyzing your goals and preferences to build the perfect plan
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="mr-3">
          <ArrowLeft size={24} className="text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            AI Workout Generator
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Step {step} of 4 - Let's personalize your training
          </p>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">What's your experience level?</h3>
          <div className="space-y-2">
            {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
              <button
                key={level}
                onClick={() => setProfile(prev => ({ ...prev, experience: level }))}
                className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                  profile.experience === level
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-600'
                }`}
              >
                <div className="font-medium">{level}</div>
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setStep(2)}
            disabled={!profile.experience}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">What are your fitness goals?</h3>
          <button
            onClick={() => setStep(3)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium"
          >
            Next
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Schedule & Equipment</h3>
          <button
            onClick={() => setStep(4)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium"
          >
            Next
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Review your profile</h3>
          <button
            onClick={handleGenerate}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-medium flex items-center justify-center space-x-2"
          >
            <Zap size={20} />
            <span>Generate AI Workout</span>
          </button>
        </div>
      )}
    </div>
  );
};
ENDFILE

# Create WorkoutPlanCard
cat > src/components/workout/WorkoutPlanCard.tsx << 'ENDFILE'
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
ENDFILE

# Create CustomWorkoutBuilder
cat > src/components/workout/CustomWorkoutBuilder.tsx << 'ENDFILE'
import React from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import type { WorkoutPlan } from '../../types/workout';

export const CustomWorkoutBuilder: React.FC<{
  onSave: (plan: WorkoutPlan) => void;
  onBack: () => void;
  aiService: any;
}> = ({ onSave, onBack }) => {
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
ENDFILE

# Create PDFWorkoutUploader
cat > src/components/workout/PDFWorkoutUploader.tsx << 'ENDFILE'
import React from 'react';
import { ArrowLeft, FileText, Upload } from 'lucide-react';
import type { WorkoutPlan } from '../../types/workout';

export const PDFWorkoutUploader: React.FC<{
  onUpload: (plan: WorkoutPlan) => void;
  onBack: () => void;
  aiService: any;
}> = ({ onUpload, onBack }) => {
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
ENDFILE

echo "✅ All components created successfully!"
