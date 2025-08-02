import React, { useState } from 'react';
import { Plus, Play, Save, ArrowRight, ArrowLeft, X } from 'lucide-react';
import { useWorkoutExerciseConnection } from '../hooks/useWorkoutExerciseConnection';
import ExerciseCard from './ExerciseCard';
import { WorkoutPlanCard } from './workout/WorkoutPlanCard';
import type { Exercise, WorkoutTemplate } from '../types/workout';

// Sample exercises for demonstration
const sampleExercises: Exercise[] = [
  {
    id: '1',
    name: 'Push-ups',
    category: 'strength',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    equipment: ['bodyweight'],
    instructions: [
      'Start in a plank position with hands shoulder-width apart',
      'Lower your body until your chest nearly touches the floor',
      'Push back up to the starting position'
    ],
    tips: ['Keep your core tight', 'Maintain a straight line from head to heels'],
    difficulty: 2,
    estimatedDuration: 5,
    defaultSets: [
      { id: 'set-1', reps: 10, weight: 0, completedAt: new Date() },
      { id: 'set-2', reps: 10, weight: 0, completedAt: new Date() },
      { id: 'set-3', reps: 10, weight: 0, completedAt: new Date() }
    ]
  },
  {
    id: '2',
    name: 'Squats',
    category: 'strength',
    muscleGroups: ['quads', 'glutes', 'hamstrings'],
    equipment: ['bodyweight'],
    instructions: [
      'Stand with feet shoulder-width apart',
      'Lower your body as if sitting back into a chair',
      'Keep your knees behind your toes',
      'Return to standing position'
    ],
    tips: ['Keep your chest up', 'Push through your heels'],
    difficulty: 2,
    estimatedDuration: 5,
    defaultSets: [
      { id: 'set-1', reps: 15, weight: 0, completedAt: new Date() },
      { id: 'set-2', reps: 15, weight: 0, completedAt: new Date() },
      { id: 'set-3', reps: 15, weight: 0, completedAt: new Date() }
    ]
  },
  {
    id: '3',
    name: 'Plank',
    category: 'strength',
    muscleGroups: ['core', 'shoulders'],
    equipment: ['bodyweight'],
    instructions: [
      'Start in a forearm plank position',
      'Keep your body in a straight line',
      'Hold the position'
    ],
    tips: ['Engage your core', 'Don\'t let your hips sag'],
    difficulty: 1,
    estimatedDuration: 3,
    defaultSets: [
      { id: 'set-1', reps: 30, weight: 0, completedAt: new Date() },
      { id: 'set-2', reps: 30, weight: 0, completedAt: new Date() }
    ]
  }
];

export const WorkoutExerciseConnector: React.FC = () => {
  const [workoutName, setWorkoutName] = useState('');
  const [showCreateWorkout, setShowCreateWorkout] = useState(false);
  
  const {
    selectedExercises,
    activeWorkout,
    currentExercise,
    workoutTemplates,
    isBuildingWorkout,
    isWorkoutActive,
    showExerciseSelector,
    selectExercise,
    deselectExercise,
    clearSelectedExercises,
    createWorkoutFromExercises,
    startWorkout,
    pauseWorkout,
    resumeWorkout,
    endWorkout,
    nextExercise,
    previousExercise,
    saveAsTemplate,
    loadTemplate,
    setBuildingWorkout,
    setShowExerciseSelector,
    getWorkoutProgress,
    getExerciseProgress,
    isExerciseCompleted
  } = useWorkoutExerciseConnection();

  const handleCreateWorkout = () => {
    if (selectedExercises.length === 0) return;
    
    const name = workoutName || `Workout ${new Date().toLocaleDateString()}`;
    const workout = createWorkoutFromExercises(name);
    startWorkout(workout);
    setWorkoutName('');
    setShowCreateWorkout(false);
  };

  const handleSaveAsTemplate = () => {
    if (!activeWorkout) return;
    
    const name = workoutName || `${activeWorkout.name} Template`;
    saveAsTemplate(activeWorkout, name);
    setWorkoutName('');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Workout & Exercise Connector
        </h1>
        <p className="text-gray-600">
          Select exercises to build workouts, or load templates to get started
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side - Exercise Selection */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Available Exercises</h2>
            <button
              onClick={() => setBuildingWorkout(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Build Workout</span>
            </button>
          </div>

          {/* Exercise Cards */}
          <div className="space-y-4">
            {sampleExercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                isSelected={selectedExercises.some(e => e.id === exercise.id)}
                isCompleted={isExerciseCompleted(exercise.id)}
                onExerciseSelect={() => selectExercise(exercise)}
                onExerciseDeselect={() => deselectExercise(exercise.id)}
                onAddToWorkout={() => selectExercise(exercise)}
                onRemoveFromWorkout={() => deselectExercise(exercise.id)}
                showSelectionControls={isBuildingWorkout}
                showProgress={false}
                showWorkoutControls={false}
              />
            ))}
          </div>

          {/* Selected Exercises Summary */}
          {selectedExercises.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">
                Selected Exercises ({selectedExercises.length})
              </h3>
              <div className="space-y-2">
                {selectedExercises.map((exercise) => (
                  <div key={exercise.id} className="flex items-center justify-between text-sm">
                    <span className="text-blue-800">{exercise.name}</span>
                    <button
                      onClick={() => deselectExercise(exercise.id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setShowCreateWorkout(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Workout
                </button>
                <button
                  onClick={clearSelectedExercises}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Workout Management */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Workout Plans & Templates</h2>

          {/* Active Workout */}
          {activeWorkout && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-900 mb-2">Active Workout</h3>
              <WorkoutPlanCard
                plan={activeWorkout}
                isActive={isWorkoutActive}
                progress={getWorkoutProgress()}
                onStart={isWorkoutActive ? pauseWorkout : resumeWorkout}
                onEdit={() => {}}
                onShare={() => {}}
                onDelete={() => endWorkout()}
              />
              
              {/* Current Exercise */}
              {currentExercise && (
                <div className="mt-4">
                  <h4 className="font-medium text-green-900 mb-2">Current Exercise</h4>
                  <ExerciseCard
                    exercise={currentExercise}
                    isActive={true}
                    showProgress={true}
                    showWorkoutControls={true}
                  />
                  
                  {/* Navigation */}
                  <div className="flex justify-between mt-4">
                    <button
                      onClick={previousExercise}
                      disabled={activeWorkout.exercises.indexOf(currentExercise) === 0}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                      <ArrowLeft size={16} />
                      <span>Previous</span>
                    </button>
                    <button
                      onClick={nextExercise}
                      disabled={activeWorkout.exercises.indexOf(currentExercise) === activeWorkout.exercises.length - 1}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                      <span>Next</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Workout Templates */}
          {workoutTemplates.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Saved Templates</h3>
              {workoutTemplates.map((template) => (
                <WorkoutPlanCard
                  key={template.id}
                  plan={template}
                  isTemplate={true}
                  onStart={() => {}}
                  onEdit={() => {}}
                  onShare={() => {}}
                  onLoad={() => loadTemplate(template)}
                />
              ))}
            </div>
          )}

          {/* Create Workout Modal */}
          {showCreateWorkout && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Create New Workout</h3>
                <input
                  type="text"
                  placeholder="Workout name"
                  value={workoutName}
                  onChange={(e) => setWorkoutName(e.target.value)}
                  className="w-full p-2 border rounded-lg mb-4"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateWorkout}
                    disabled={selectedExercises.length === 0}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setShowCreateWorkout(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 