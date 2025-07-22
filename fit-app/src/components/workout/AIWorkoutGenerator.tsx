import React, { useState } from 'react';
import { ArrowLeft, Zap } from 'lucide-react';

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
