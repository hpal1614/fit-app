import React, { useState } from 'react';
import { Plus, X, Check, Dumbbell } from 'lucide-react';
import type { WorkoutContext, Exercise, Set } from '../../types/workout';

interface WorkoutLoggerProps {
  workoutContext: WorkoutContext;
}

export const WorkoutLogger: React.FC<WorkoutLoggerProps> = ({ workoutContext }) => {
  const { exercises, addExercise, updateExercise, removeExercise, isActive } = workoutContext;
  const [newExerciseName, setNewExerciseName] = useState('');
  const [isAddingExercise, setIsAddingExercise] = useState(false);

  const handleAddExercise = () => {
    if (newExerciseName.trim()) {
      addExercise({
        name: newExerciseName.trim(),
        sets: []
      });
      setNewExerciseName('');
      setIsAddingExercise(false);
    }
  };

  const handleAddSet = (exerciseIndex: number) => {
    const exercise = exercises[exerciseIndex];
    const newSet: Set = {
      reps: 0,
      weight: 0,
      completed: false
    };
    updateExercise(exerciseIndex, {
      ...exercise,
      sets: [...exercise.sets, newSet]
    });
  };

  const handleUpdateSet = (exerciseIndex: number, setIndex: number, updates: Partial<Set>) => {
    const exercise = exercises[exerciseIndex];
    const updatedSets = [...exercise.sets];
    updatedSets[setIndex] = { ...updatedSets[setIndex], ...updates };
    updateExercise(exerciseIndex, {
      ...exercise,
      sets: updatedSets
    });
  };

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    const exercise = exercises[exerciseIndex];
    const updatedSets = exercise.sets.filter((_, idx) => idx !== setIndex);
    updateExercise(exerciseIndex, {
      ...exercise,
      sets: updatedSets
    });
  };

  if (!isActive) {
    return (
      <div className="card text-center py-8">
        <Dumbbell size={48} className="mx-auto mb-4" style={{ color: 'var(--gray-dark)' }} />
        <p style={{ color: 'var(--gray-light)' }}>Start a workout to begin logging exercises</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Exercise List */}
      {exercises.map((exercise, exerciseIndex) => (
        <div key={exerciseIndex} className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">{exercise.name}</h3>
            <button
              onClick={() => removeExercise(exerciseIndex)}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
              style={{ color: 'var(--error)' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Sets */}
          <div className="space-y-2">
            {exercise.sets.map((set, setIndex) => (
              <div
                key={setIndex}
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{ background: 'var(--dark-bg)' }}
              >
                <span className="text-sm font-medium" style={{ color: 'var(--gray-light)' }}>
                  Set {setIndex + 1}
                </span>
                
                <input
                  type="number"
                  value={set.weight || ''}
                  onChange={(e) => handleUpdateSet(exerciseIndex, setIndex, { weight: parseInt(e.target.value) || 0 })}
                  placeholder="Weight"
                  className="w-20 px-2 py-1 text-center input text-sm"
                />
                
                <span style={{ color: 'var(--gray-dark)' }}>×</span>
                
                <input
                  type="number"
                  value={set.reps || ''}
                  onChange={(e) => handleUpdateSet(exerciseIndex, setIndex, { reps: parseInt(e.target.value) || 0 })}
                  placeholder="Reps"
                  className="w-20 px-2 py-1 text-center input text-sm"
                />
                
                <button
                  onClick={() => handleUpdateSet(exerciseIndex, setIndex, { completed: !set.completed })}
                  className={`p-2 rounded-lg transition-all ${
                    set.completed 
                      ? 'bg-green-bright text-black' 
                      : 'hover:bg-gray-800'
                  }`}
                  style={{
                    background: set.completed ? 'var(--primary-green)' : 'transparent',
                    color: set.completed ? 'var(--primary-black)' : 'var(--gray-light)'
                  }}
                >
                  <Check size={16} />
                </button>
                
                <button
                  onClick={() => handleRemoveSet(exerciseIndex, setIndex)}
                  className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                  style={{ color: 'var(--gray-dark)' }}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Add Set Button */}
          <button
            onClick={() => handleAddSet(exerciseIndex)}
            className="w-full mt-3 btn-secondary text-sm py-2 flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Add Set
          </button>
        </div>
      ))}

      {/* Add Exercise */}
      {isAddingExercise ? (
        <div className="card">
          <div className="flex gap-2">
            <input
              type="text"
              value={newExerciseName}
              onChange={(e) => setNewExerciseName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddExercise()}
              placeholder="Exercise name..."
              className="flex-1 input"
              autoFocus
            />
            <button
              onClick={handleAddExercise}
              disabled={!newExerciseName.trim()}
              className="btn-primary"
            >
              <Check size={20} />
            </button>
            <button
              onClick={() => {
                setIsAddingExercise(false);
                setNewExerciseName('');
              }}
              className="btn-secondary"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAddingExercise(true)}
          className="w-full btn-secondary flex items-center justify-center gap-2 py-3"
        >
          <Plus size={20} />
          Add Exercise
        </button>
      )}
    </div>
  );
};