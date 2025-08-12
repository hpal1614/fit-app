import React, { useState } from 'react';
import { Brain, Zap, Target, Clock } from 'lucide-react';

interface NimbusWorkoutGeneratorProps {
  onWorkoutGenerated: (workout: any) => void;
  className?: string;
}

export const NimbusWorkoutGenerator: React.FC<NimbusWorkoutGeneratorProps> = ({
  onWorkoutGenerated,
  className = ''
}) => {
  const [preferences, setPreferences] = useState({
    goals: [] as string[],
    duration: 45,
    equipment: 'minimal',
    experience: 'intermediate'
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const goalOptions = [
    'Strength Building',
    'Weight Loss',
    'Muscle Gain',
    'Endurance',
    'Flexibility',
    'Recovery'
  ];

  const toggleGoal = (goal: string) => {
    setPreferences(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }));
  };

  const generateWorkout = async () => {
    setIsGenerating(true);
    
    try {
      // Simulate AI workout generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const workout = {
        id: Date.now().toString(),
        name: 'AI Generated Workout',
        duration: preferences.duration,
        difficulty: preferences.experience,
        goals: preferences.goals,
        exercises: [
          {
            name: 'Dynamic Warm-up',
            type: 'warmup',
            duration: 5,
            instructions: 'Light cardio and dynamic stretching'
          },
          {
            name: 'Compound Movement Block',
            type: 'strength',
            exercises: [
              { name: 'Squats', sets: 3, reps: 12 },
              { name: 'Push-ups', sets: 3, reps: 10 },
              { name: 'Lunges', sets: 3, reps: 10 }
            ]
          },
          {
            name: 'Cardio Interval',
            type: 'cardio',
            duration: 15,
            instructions: 'High intensity intervals'
          },
          {
            name: 'Cool Down',
            type: 'cooldown',
            duration: 5,
            instructions: 'Static stretching and breathing'
          }
        ],
        aiInsights: [
          'This workout targets multiple muscle groups for maximum efficiency',
          'Progressive overload built into the routine',
          'Rest periods optimized for your experience level'
        ]
      };

      onWorkoutGenerated(workout);
    } catch (error) {
      console.error('Workout generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <div className="flex items-center space-x-3 mb-6">
        <Brain className="text-fitness-blue" size={24} />
        <h2 className="text-xl font-bold text-gray-900">AI Workout Generator</h2>
      </div>

      <div className="space-y-6">
        {/* Goals */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Fitness Goals
          </label>
          <div className="grid grid-cols-2 gap-2">
            {goalOptions.map(goal => (
              <button
                key={goal}
                onClick={() => toggleGoal(goal)}
                className={`p-3 rounded-lg text-sm transition-colors ${
                  preferences.goals.includes(goal)
                    ? 'bg-fitness-blue text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {goal}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Workout Duration: {preferences.duration} minutes
          </label>
          <input
            type="range"
            min="15"
            max="90"
            value={preferences.duration}
            onChange={(e) => setPreferences(prev => ({ ...prev, duration: Number(e.target.value) }))}
            className="w-full"
          />
        </div>

        {/* Equipment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Available Equipment
          </label>
          <select
            value={preferences.equipment}
            onChange={(e) => setPreferences(prev => ({ ...prev, equipment: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fitness-blue"
          >
            <option value="minimal">Minimal (bodyweight)</option>
            <option value="basic">Basic (dumbbells, resistance bands)</option>
            <option value="full">Full gym access</option>
          </select>
        </div>

        {/* Experience */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Experience Level
          </label>
          <div className="grid grid-cols-3 gap-3">
            {['beginner', 'intermediate', 'advanced'].map(level => (
              <button
                key={level}
                onClick={() => setPreferences(prev => ({ ...prev, experience: level }))}
                className={`p-3 rounded-lg text-sm capitalize transition-colors ${
                  preferences.experience === level
                    ? 'bg-fitness-blue text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={generateWorkout}
          disabled={isGenerating || preferences.goals.length === 0}
          className="w-full bg-fitness-blue text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Generating with AI...</span>
            </>
          ) : (
            <>
              <Zap size={20} />
              <span>Generate AI Workout</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

