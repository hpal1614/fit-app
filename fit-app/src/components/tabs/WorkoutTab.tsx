import React from 'react';
import { WorkoutLogger } from '../workout/WorkoutLogger';
import { WorkoutStats } from '../WorkoutStats';
import { RestTimer } from '../RestTimer';
import type { WorkoutContext } from '../../types/workout';
import { Play, Pause, Plus } from 'lucide-react';

interface WorkoutTabProps {
  context: WorkoutContext;
}

export const WorkoutTab: React.FC<WorkoutTabProps> = ({ context }) => {
  const { isActive, exercises, duration, startWorkout, endWorkout, addExercise } = context;

  return (
    <div className="space-y-6">
      {/* Workout Status Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Current Workout</h2>
          {isActive ? (
            <button
              onClick={endWorkout}
              className="btn-secondary flex items-center gap-2"
            >
              <Pause size={16} />
              End Workout
            </button>
          ) : (
            <button
              onClick={startWorkout}
              className="btn-primary flex items-center gap-2"
            >
              <Play size={16} />
              Start Workout
            </button>
          )}
        </div>

        {isActive && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: 'var(--gray-light)' }}>Duration</span>
              <span className="font-mono" style={{ color: 'var(--primary-green)' }}>
                {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: 'var(--gray-light)' }}>Exercises</span>
              <span style={{ color: 'var(--primary-green)' }}>{exercises.length}</span>
            </div>
          </div>
        )}
      </div>

      {/* Add Exercise Button */}
      {isActive && (
        <button
          onClick={() => addExercise({ name: '', sets: [] })}
          className="w-full btn-secondary flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Add Exercise
        </button>
      )}

      {/* Exercise Logger */}
      <WorkoutLogger workoutContext={context} />

      {/* Rest Timer */}
      {isActive && <RestTimer />}

      {/* Workout Stats */}
      <WorkoutStats exercises={exercises} />
    </div>
  );
};