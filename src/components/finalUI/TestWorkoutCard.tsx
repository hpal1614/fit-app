import React, { useState } from 'react';
import { WorkoutCard } from './WorkoutCard';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  restTime?: number;
  notes?: string;
  completed?: boolean;
}

export const TestWorkoutCard: React.FC = () => {
  const [showWorkoutCard, setShowWorkoutCard] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<Exercise>({
    id: '1',
    name: 'Cable Row',
    sets: 3,
    reps: 12,
    restTime: 90,
    notes: ''
  });

  const handleUpdateExercise = (exercise: Exercise) => {
    setCurrentExercise(exercise);
    console.log('Exercise updated:', exercise);
  };

  const handleSwapExercise = (exerciseId: string) => {
    console.log('Swapping exercise:', exerciseId);
    setCurrentExercise({
      ...currentExercise,
      name: 'Bench Press',
      sets: 4,
      reps: 8
    });
  };

  const handleSave = async (exercise: Exercise) => {
    console.log('Saving exercise:', exercise);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setShowWorkoutCard(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-6">Workout Card Demo</h1>
        <p className="text-gray-400 mb-8 max-w-md">
          Experience the new workout card interface inspired by Dropset app. 
          Click the button below to see all the features in action.
        </p>
        
        <button
          onClick={() => setShowWorkoutCard(true)}
          className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-xl transition-colors shadow-lg"
        >
          🏋️ Open Workout Card
        </button>

        {showWorkoutCard && (
          <WorkoutCard
            exercise={currentExercise}
            onUpdateExercise={handleUpdateExercise}
            onSwapExercise={handleSwapExercise}
            onSave={handleSave}
            onClose={() => setShowWorkoutCard(false)}
          />
        )}
      </div>
    </div>
  );
};

