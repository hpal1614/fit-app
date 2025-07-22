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

      {/* Step 1: Experience Level */}
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
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {level === 'Beginner' && 'New to working out or returning after a break'}
                  {level === 'Intermediate' && '6+ months of consistent training'}
                  {level === 'Advanced' && '2+ years of dedicated training'}
                </div>
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

      {/* Step 2: Goals */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">What are your fitness goals?</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'strength', name: 'Build Strength', icon: '💪' },
              { id: 'muscle', name: 'Build Muscle', icon: '🏋️' },
              { id: 'endurance', name: 'Endurance', icon: '🏃' },
              { id: 'weight_loss', name: 'Lose Weight', icon: '⚖️' },
              { id: 'athletic', name: 'Athletic Performance', icon: '⚡' },
              { id: 'general', name: 'General Fitness', icon: '🎯' }
            ].map((goal) => (
              <button
                key={goal.id}
                onClick={() => setProfile(prev => ({
                  ...prev,
                  goals: prev.goals.includes(goal.id)
                    ? prev.goals.filter(g => g !== goal.id)
                    : [...prev.goals, goal.id]
                }))}
                className={`p-4 rounded-lg border-2 text-center transition-colors ${
                  profile.goals.includes(goal.id)
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-600'
                }`}
              >
                <div className="text-2xl mb-2">{goal.icon}</div>
                <div className="text-sm font-medium">{goal.name}</div>
              </button>
            ))}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-medium"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={profile.goals.length === 0}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Schedule & Equipment */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">How often can you workout?</h3>
            <div className="flex items-center space-x-4">
              <Clock size={20} className="text-gray-500" />
              <input
                type="range"
                min="2"
                max="7"
                value={profile.daysPerWeek}
                onChange={(e) => setProfile(prev => ({ ...prev, daysPerWeek: parseInt(e.target.value) }))}
                className="flex-1"
              />
              <span className="font-medium">{profile.daysPerWeek} days/week</span>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Session length?</h3>
            <div className="flex items-center space-x-4">
              <Target size={20} className="text-gray-500" />
              <input
                type="range"
                min="30"
                max="120"
                step="15"
                value={profile.sessionLength}
                onChange={(e) => setProfile(prev => ({ ...prev, sessionLength: parseInt(e.target.value) }))}
                className="flex-1"
              />
              <span className="font-medium">{profile.sessionLength} minutes</span>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Available equipment?</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {['Barbell', 'Dumbbells', 'Machines', 'Bodyweight', 'Resistance Bands', 'Kettlebells'].map((equipment) => (
                <label key={equipment} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={profile.equipment.includes(equipment)}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      equipment: e.target.checked
                        ? [...prev.equipment, equipment]
                        : prev.equipment.filter(eq => eq !== equipment)
                    }))}
                    className="rounded"
                  />
                  <span>{equipment}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-medium"
            >
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Final Review & Generate */}
      {step === 4 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Review your profile</h3>
          
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3 text-sm">
            <div><strong>Experience:</strong> {profile.experience}</div>
            <div><strong>Goals:</strong> {profile.goals.join(', ')}</div>
            <div><strong>Schedule:</strong> {profile.daysPerWeek} days/week, {profile.sessionLength} minutes</div>
            <div><strong>Equipment:</strong> {profile.equipment.join(', ') || 'None selected'}</div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setStep(3)}
              className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-medium"
            >
              Back
            </button>
            <button
              onClick={handleGenerate}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium flex items-center justify-center space-x-2"
            >
              <Zap size={20} />
              <span>Generate AI Workout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
