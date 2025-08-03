import React, { useState } from 'react';
import WeightCardCarousel from './WeightCardCarousel';
import type { WorkoutExercise } from '../types/workout';

// Sample workout data for Monday
const sampleWorkout = {
  exercises: [
    {
      id: '1',
      exerciseId: 'bench-press',
      exercise: {
        id: 'bench-press',
        name: 'Bench Press',
        category: 'strength' as const,
        muscleGroups: ['chest', 'triceps', 'shoulders'],
        equipment: ['barbell'],
        instructions: ['Lie on bench', 'Lower bar to chest', 'Press up'],
        tips: ['Keep feet flat', 'Retract shoulder blades'],
        defaultSets: []
      },
      sets: [],
      completedSets: [],
      targetSets: 3,
      targetReps: 8,
      targetWeight: 135,
      order: 1,
      orderIndex: 0
    },
    {
      id: '2',
      exerciseId: 'squats',
      exercise: {
        id: 'squats',
        name: 'Barbell Squats',
        category: 'strength' as const,
        muscleGroups: ['quads', 'glutes', 'hamstrings'],
        equipment: ['barbell'],
        instructions: ['Stand with bar on shoulders', 'Squat down', 'Stand up'],
        tips: ['Keep chest up', 'Knees in line with toes'],
        defaultSets: []
      },
      sets: [],
      completedSets: [],
      targetSets: 3,
      targetReps: 10,
      targetWeight: 185,
      order: 2,
      orderIndex: 1
    },
    {
      id: '3',
      exerciseId: 'deadlift',
      exercise: {
        id: 'deadlift',
        name: 'Deadlift',
        category: 'strength' as const,
        muscleGroups: ['back', 'glutes', 'hamstrings'],
        equipment: ['barbell'],
        instructions: ['Stand over bar', 'Bend down and grip', 'Stand up'],
        tips: ['Keep back straight', 'Drive through heels'],
        defaultSets: []
      },
      sets: [],
      completedSets: [],
      targetSets: 3,
      targetReps: 6,
      targetWeight: 225,
      order: 3,
      orderIndex: 2
    },
    {
      id: '4',
      exerciseId: 'pull-ups',
      exercise: {
        id: 'pull-ups',
        name: 'Pull-ups',
        category: 'strength' as const,
        muscleGroups: ['back', 'biceps'],
        equipment: ['bodyweight'],
        instructions: ['Hang from bar', 'Pull up to chin', 'Lower down'],
        tips: ['Engage lats', 'Full range of motion'],
        defaultSets: []
      },
      sets: [],
      completedSets: [],
      targetSets: 3,
      targetReps: 8,
      targetWeight: 0,
      order: 4,
      orderIndex: 3
    },
    {
      id: '5',
      exerciseId: 'dips',
      exercise: {
        id: 'dips',
        name: 'Dips',
        category: 'strength' as const,
        muscleGroups: ['chest', 'triceps', 'shoulders'],
        equipment: ['bodyweight'],
        instructions: ['Hold bars', 'Lower body', 'Push up'],
        tips: ['Keep elbows close', 'Full depth'],
        defaultSets: []
      },
      sets: [],
      completedSets: [],
      targetSets: 3,
      targetReps: 10,
      targetWeight: 0,
      order: 5,
      orderIndex: 4
    }
  ] as WorkoutExercise[]
};

export const WeightCardCarouselDemo: React.FC = () => {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

  const handleExerciseSelect = (exerciseId: string) => {
    const index = sampleWorkout.exercises.findIndex(e => e.id === exerciseId);
    if (index !== -1) {
      setCurrentExerciseIndex(index);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Monday Workout - Weight Card Carousel
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Each exercise has its own weight card. Scroll horizontally to navigate between exercises.
          </p>
        </div>

        {/* Weight Card Carousel */}
        <WeightCardCarousel
          workout={sampleWorkout}
          currentExerciseIndex={currentExerciseIndex}
          onExerciseSelect={handleExerciseSelect}
          className="mb-6"
        />

        {/* Instructions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            How to Use the Carousel
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Navigation:</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• <strong>Swipe/Scroll horizontally</strong> to move between exercises</li>
                <li>• Use the <strong>arrow buttons</strong> at the bottom</li>
                <li>• Click on the <strong>dot indicators</strong> to jump to specific exercises</li>
                <li>• Current exercise is <strong>highlighted and scaled up</strong></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Features:</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• <strong>Exact same UI</strong> as your current weight card</li>
                <li>• <strong>Individual weight cards</strong> for each exercise</li>
                <li>• <strong>Horizontal scrolling</strong> between exercises</li>
                <li>• <strong>Always shows one card</strong> at a time</li>
                <li>• <strong>Auto-scrolls</strong> to current exercise</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Current State Display */}
        <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Current State
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Current Exercise:</span>
              <div className="text-gray-900 dark:text-white">
                {sampleWorkout.exercises[currentExerciseIndex]?.exercise.name}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Exercise Index:</span>
              <div className="text-gray-900 dark:text-white">
                {currentExerciseIndex + 1} of {sampleWorkout.exercises.length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeightCardCarouselDemo; 