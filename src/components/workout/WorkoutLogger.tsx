import React, { useState } from 'react';
import { Workout, WorkoutExercise, Set, WorkoutPreferences } from '../../types';
import { Plus, Play, Square, Timer, Dumbbell, Target } from 'lucide-react';

interface WorkoutLoggerProps {
  workout: Workout | null;
  currentExercise: WorkoutExercise | null;
  onLogSet: (reps: number, weight: number, difficulty?: 1 | 2 | 3 | 4 | 5) => Promise<Set | null>;
  onAddExercise: (exerciseId: string) => Promise<boolean>;
  onSelectExercise: (exerciseId: string) => boolean;
  isRecording: boolean;
  preferences: WorkoutPreferences;
  onUpdatePreferences: (prefs: Partial<WorkoutPreferences>) => void;
}

export function WorkoutLogger({
  workout,
  currentExercise,
  onLogSet,
  onAddExercise,
  onSelectExercise,
  isRecording,
  preferences,
  onUpdatePreferences
}: WorkoutLoggerProps) {
  const [quickLogReps, setQuickLogReps] = useState(8);
  const [quickLogWeight, setQuickLogWeight] = useState(135);
  const [difficulty, setDifficulty] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [isLogging, setIsLogging] = useState(false);

  const handleQuickLog = async () => {
    if (!currentExercise || isLogging) return;

    setIsLogging(true);
    try {
      await onLogSet(quickLogReps, quickLogWeight, difficulty);
      // Increment weight slightly for next set
      setQuickLogWeight(prev => prev + 2.5);
    } catch (error) {
      console.error('Failed to log set:', error);
    } finally {
      setIsLogging(false);
    }
  };

  const getDifficultyColor = (level: number) => {
    const colors = ['bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500', 'bg-purple-500'];
    return colors[level - 1];
  };

  const getDifficultyText = (level: number) => {
    const texts = ['Very Easy', 'Easy', 'Just Right', 'Hard', 'Very Hard'];
    return texts[level - 1];
  };

  if (!isRecording || !workout) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <Dumbbell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No Active Workout
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Start a workout to begin logging your exercises
          </p>
          <div className="text-sm text-gray-400 dark:text-gray-500">
            Try saying: "Start workout" or "Start chest workout"
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {workout.name}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {workout.exercises.length} exercises • {workout.exercises.reduce((total, ex) => total + ex.sets.length, 0)} sets
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-fitness-green rounded-full animate-pulse" />
          <span className="text-sm text-fitness-green font-medium">Recording</span>
        </div>
      </div>

      {/* Current Exercise */}
      {currentExercise && (
        <div className="border-2 border-fitness-blue rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {currentExercise.exercise.name}
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Target className="w-4 h-4" />
              <span>
                {currentExercise.targetSets || '∞'} sets × {currentExercise.targetReps || '?'} reps
              </span>
            </div>
          </div>

          {/* Sets Display */}
          <div className="space-y-2 mb-4">
            {currentExercise.sets.map((set, index) => (
              <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-700 rounded p-2">
                <span className="text-sm font-medium">Set {index + 1}</span>
                <div className="flex items-center space-x-4 text-sm">
                  <span>{set.reps} reps</span>
                  <span>{set.weight} {preferences.weightUnit}</span>
                  {set.difficulty && (
                    <div className={`w-3 h-3 rounded-full ${getDifficultyColor(set.difficulty)}`} 
                         title={getDifficultyText(set.difficulty)} />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Log Controls */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reps
                </label>
                <input
                  type="number"
                  value={quickLogReps}
                  onChange={(e) => setQuickLogReps(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="1"
                  max="50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Weight ({preferences.weightUnit})
                </label>
                <input
                  type="number"
                  value={quickLogWeight}
                  onChange={(e) => setQuickLogWeight(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="0"
                  step="2.5"
                />
              </div>
            </div>

            {/* Difficulty Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                How did it feel?
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level as 1 | 2 | 3 | 4 | 5)}
                    className={`
                      flex-1 py-2 px-1 rounded text-xs font-medium transition-all
                      ${difficulty === level 
                        ? `${getDifficultyColor(level)} text-white scale-105` 
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:scale-105'
                      }
                    `}
                    title={getDifficultyText(level)}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                {getDifficultyText(difficulty)}
              </p>
            </div>

            {/* Log Set Button */}
            <button
              onClick={handleQuickLog}
              disabled={isLogging}
              className="w-full bg-fitness-green hover:bg-green-600 disabled:opacity-50 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              {isLogging ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Logging...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Log Set</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Exercise List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Exercises
        </h3>
        <div className="space-y-2">
          {workout.exercises.map((exercise, index) => (
            <div
              key={exercise.id}
              className={`
                p-3 rounded-lg border-2 cursor-pointer transition-all
                ${exercise.id === currentExercise?.id
                  ? 'border-fitness-blue bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }
              `}
              onClick={() => onSelectExercise(exercise.exerciseId)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {exercise.exercise.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {exercise.sets.length} sets completed
                    {exercise.targetSets && ` of ${exercise.targetSets}`}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {exercise.sets.reduce((total, set) => total + (set.weight * set.reps), 0)} {preferences.weightUnit}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Volume
                  </div>
                </div>
              </div>

              {/* Sets preview */}
              {exercise.sets.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {exercise.sets.map((set, setIndex) => (
                    <span
                      key={setIndex}
                      className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
                    >
                      {set.reps}×{set.weight}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Voice Commands Hint */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          💡 Try saying: "Log {currentExercise?.exercise.name || 'bench press'} for {quickLogReps} reps at {quickLogWeight} pounds"
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
        <div className="text-center">
          <div className="text-2xl font-bold text-fitness-blue">
            {workout.exercises.reduce((total, ex) => total + ex.sets.length, 0)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Total Sets</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-fitness-green">
            {Math.round(workout.totalVolume)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Volume ({preferences.weightUnit})</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-fitness-orange">
            {workout.exercises.length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Exercises</div>
        </div>
      </div>
    </div>
  );
}