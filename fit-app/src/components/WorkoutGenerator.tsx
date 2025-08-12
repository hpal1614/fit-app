import React, { useState } from 'react';
import { Zap, Target, Clock, Dumbbell, Plus, Shuffle } from 'lucide-react';

interface WorkoutGeneratorProps {
  onWorkoutGenerated: (workout: any) => void;
  className?: string;
}

export const WorkoutGenerator: React.FC<WorkoutGeneratorProps> = ({ 
  onWorkoutGenerated, 
  className = '' 
}) => {
  const [goal, setGoal] = useState('strength');
  const [duration, setDuration] = useState(60);
  const [difficulty, setDifficulty] = useState('intermediate');
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const goals = [
    { id: 'strength', name: 'Strength Building', icon: Dumbbell },
    { id: 'cardio', name: 'Cardiovascular', icon: Target },
    { id: 'flexibility', name: 'Flexibility', icon: Zap },
    { id: 'full-body', name: 'Full Body', icon: Plus }
  ];

  const muscleGroupOptions = [
    'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Glutes'
  ];

  const toggleMuscleGroup = (group: string) => {
    setMuscleGroups(prev => 
      prev.includes(group) 
        ? prev.filter(g => g !== group)
        : [...prev, group]
    );
  };

  const generateWorkout = async () => {
    setIsGenerating(true);
    
    try {
      // Simulate workout generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockWorkout = {
        id: Date.now().toString(),
        name: `${goal.charAt(0).toUpperCase() + goal.slice(1)} Workout`,
        duration,
        difficulty,
        exercises: [
          {
            name: 'Push-ups',
            sets: 3,
            reps: 12,
            muscleGroup: 'Chest',
            equipment: 'Bodyweight'
          },
          {
            name: 'Squats',
            sets: 3,
            reps: 15,
            muscleGroup: 'Legs',
            equipment: 'Bodyweight'
          },
          {
            name: 'Plank',
            sets: 3,
            duration: 30,
            muscleGroup: 'Core',
            equipment: 'Bodyweight'
          }
        ],
        createdAt: new Date().toISOString()
      };

      onWorkoutGenerated(mockWorkout);
    } catch (error) {
      console.error('Failed to generate workout:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <div className="flex items-center space-x-3 mb-6">
        <Shuffle className="text-fitness-blue" size={24} />
        <h2 className="text-xl font-bold text-gray-900">Generate Workout</h2>
      </div>

      <div className="space-y-6">
        {/* Goal Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Workout Goal
          </label>
          <div className="grid grid-cols-2 gap-3">
            {goals.map((goalOption) => {
              const Icon = goalOption.icon;
              return (
                <button
                  key={goalOption.id}
                  onClick={() => setGoal(goalOption.id)}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    goal === goalOption.id
                      ? 'border-fitness-blue bg-blue-50 text-fitness-blue'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon size={20} className="mx-auto mb-2" />
                  <span className="text-sm font-medium">{goalOption.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Duration (minutes)
          </label>
          <input
            type="range"
            min="15"
            max="120"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>15 min</span>
            <span className="font-medium text-fitness-blue">{duration} min</span>
            <span>120 min</span>
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Difficulty Level
          </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fitness-blue focus:border-transparent"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        {/* Muscle Groups */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Target Muscle Groups (optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {muscleGroupOptions.map((group) => (
              <button
                key={group}
                onClick={() => toggleMuscleGroup(group)}
                className={`px-3 py-2 rounded-full text-sm transition-colors ${
                  muscleGroups.includes(group)
                    ? 'bg-fitness-blue text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {group}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={generateWorkout}
          disabled={isGenerating}
          className="w-full bg-fitness-blue text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Shuffle size={20} />
              <span>Generate Workout</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

