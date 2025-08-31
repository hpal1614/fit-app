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
    const colors = ['bg-success', 'bg-accent', 'bg-warning', 'bg-error', 'bg-secondary'];
    return colors[level - 1];
  };

  const getDifficultyText = (level: number) => {
    const texts = ['Very Easy', 'Easy', 'Just Right', 'Hard', 'Very Hard'];
    return texts[level - 1];
  };

  if (!isRecording || !workout) {
    return (
      <div className="card p-8">
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-100 dark:bg-dark-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Dumbbell className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            No Active Workout
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
            Start a workout to begin logging your exercises and tracking your progress
          </p>
          <div className="text-sm text-gray-500 dark:text-gray-500 bg-gray-50 dark:bg-dark-700 rounded-xl p-4">
            <p className="font-medium mb-2">Try saying:</p>
            <p>"Start workout" or "Start chest workout"</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {workout.name}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {workout.exercises.length} exercises • {workout.exercises.reduce((total, ex) => total + ex.sets.length, 0)} sets
          </p>
        </div>
        <div className="flex items-center space-x-2 px-3 py-2 bg-primary/10 rounded-xl">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="text-sm text-primary font-medium">Recording</span>
        </div>
      </div>

      {/* Current Exercise */}
      {currentExercise && (
        <div className="border-2 border-primary/20 rounded-2xl p-6 bg-primary-50 dark:bg-primary-900/10">
          <div className="flex items-center justify-between mb-4">
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
          <div className="space-y-3 mb-6">
            {currentExercise.sets.map((set, index) => (
              <div key={index} className="flex items-center justify-between bg-white dark:bg-dark-700 rounded-xl p-4 shadow-soft">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Set {index + 1}</span>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-gray-700 dark:text-gray-300">{set.reps} reps</span>
                  <span className="text-gray-700 dark:text-gray-300">{set.weight} {preferences.weightUnit}</span>
                  {set.difficulty && (
                    <div className={`w-3 h-3 rounded-full ${getDifficultyColor(set.difficulty)}`} 
                         title={getDifficultyText(set.difficulty)} />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Log Controls */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reps
                </label>
                <input
                  type="number"
                  value={quickLogReps}
                  onChange={(e) => setQuickLogReps(parseInt(e.target.value) || 0)}
                  className="input-modern w-full"
                  min="1"
                  max="50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Weight ({preferences.weightUnit})
                </label>
                <input
                  type="number"
                  value={quickLogWeight}
                  onChange={(e) => setQuickLogWeight(parseFloat(e.target.value) || 0)}
                  className="input-modern w-full"
                  min="0"
                  step="2.5"
                />
              </div>
            </div>

            {/* Difficulty Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                How did it feel?
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level as 1 | 2 | 3 | 4 | 5)}
                    className={`
                      flex-1 py-3 px-2 rounded-xl text-sm font-medium transition-all duration-200
                      ${difficulty === level 
                        ? `${getDifficultyColor(level)} text-white scale-105 shadow-medium` 
                        : 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:scale-105 hover:bg-gray-200 dark:hover:bg-dark-600'
                      }
                    `}
                    title={getDifficultyText(level)}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
                {getDifficultyText(difficulty)}
              </p>
            </div>

            {/* Log Set Button */}
            <button
              onClick={handleQuickLog}
              disabled={isLogging}
              className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLogging ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Logging...</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Log Set</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Exercise List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Workout Exercises</h3>
        <div className="space-y-3">
          {workout.exercises.map((exercise, index) => (
            <div
              key={exercise.exercise.id}
              className={`
                p-4 rounded-xl transition-all duration-200 cursor-pointer
                ${currentExercise?.exercise.id === exercise.exercise.id
                  ? 'bg-primary-50 dark:bg-primary-900/20 border-2 border-primary/30'
                  : 'bg-gray-50 dark:bg-dark-700 hover:bg-gray-100 dark:hover:bg-dark-600'
                }
              `}
              onClick={() => onSelectExercise(exercise.exercise.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium
                    ${currentExercise?.exercise.id === exercise.exercise.id
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 dark:bg-dark-600 text-gray-700 dark:text-gray-300'
                    }
                  `}>
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {exercise.exercise.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {exercise.sets.length} sets logged
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {exercise.sets.length > 0 ? exercise.sets[exercise.sets.length - 1].weight : 0} {preferences.weightUnit}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Last set
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Exercise Button */}
      <button
        onClick={() => onAddExercise('')}
        className="w-full btn-ghost border-2 border-dashed border-gray-300 dark:border-dark-600 hover:border-primary dark:hover:border-primary py-4 rounded-xl transition-all duration-200"
      >
        <Plus className="w-5 h-5 mx-auto mb-2 text-gray-400" />
        <span className="text-gray-600 dark:text-gray-400">Add Exercise</span>
      </button>
    </div>
  );
}