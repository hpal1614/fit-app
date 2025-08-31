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

export const WorkoutCardDemo: React.FC = () => {
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
    // Here you would typically show an exercise selector
    setCurrentExercise({
      ...currentExercise,
      name: 'Bench Press',
      sets: 4,
      reps: 8
    });
  };

  const handleSave = async (exercise: Exercise) => {
    console.log('Saving exercise:', exercise);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setShowWorkoutCard(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Workout Card Demo</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Current Exercise</h2>
          <div className="space-y-2 text-gray-300">
            <p><span className="font-medium">Name:</span> {currentExercise.name}</p>
            <p><span className="font-medium">Sets:</span> {currentExercise.sets}</p>
            <p><span className="font-medium">Reps:</span> {currentExercise.reps}</p>
            <p><span className="font-medium">Rest Time:</span> {currentExercise.restTime}s</p>
          </div>
        </div>

        <button
          onClick={() => setShowWorkoutCard(true)}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          Open Workout Card
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

