import React, { useState, useEffect, useRef } from 'react';
import { Plus, Minus, Clock, Save, RotateCcw } from 'lucide-react';
import type { WorkoutExercise, Set } from '../types/workout';

interface SetLoggerProps {
  exercise: WorkoutExercise;
  onSetLogged: (reps: number, weight: number, restTime?: number, notes?: string) => Promise<void>;
  className?: string;
}

export const SetLogger: React.FC<SetLoggerProps> = ({
  exercise,
  onSetLogged,
  className = ''
}) => {
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState(0);
  const [restTime, setRestTime] = useState(60);
  const [notes, setNotes] = useState('');
  const [isLogging, setIsLogging] = useState(false);
  const [lastSet, setLastSet] = useState<Set | null>(null);

  const repsInputRef = useRef<HTMLInputElement>(null);

  // Load previous set data or suggested values
  useEffect(() => {
    const lastCompletedSet = exercise.completedSets[exercise.completedSets.length - 1];
    const nextPlannedSet = exercise.sets[exercise.completedSets.length];

    if (lastCompletedSet) {
      setLastSet(lastCompletedSet);
      // Use last set as starting point with slight progression
      setReps(lastCompletedSet.reps);
      setWeight(lastCompletedSet.weight);
      setRestTime(lastCompletedSet.restTime || 60);
    } else if (nextPlannedSet) {
      // Use planned set values
      setReps(nextPlannedSet.reps);
      setWeight(nextPlannedSet.weight);
      setRestTime(nextPlannedSet.restTime || 60);
    }
  }, [exercise]);

  // Auto-focus reps input when component mounts
  useEffect(() => {
    if (repsInputRef.current) {
      repsInputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (reps <= 0) {
      alert('Please enter a valid number of reps');
      return;
    }

    if (weight < 0) {
      alert('Weight cannot be negative');
      return;
    }

    setIsLogging(true);
    
    try {
      await onSetLogged(reps, weight, restTime > 0 ? restTime : undefined, notes || undefined);
      
      // Reset notes after successful log
      setNotes('');
      
      // Suggest slight progression for next set
      if (reps >= 12) {
        setWeight(prev => prev + 2.5);
        setReps(prev => Math.max(8, prev - 2));
      }
      
    } catch (error) {
      console.error('Failed to log set:', error);
      alert('Failed to log set. Please try again.');
    } finally {
      setIsLogging(false);
    }
  };

  const adjustValue = (
    value: number,
    setter: React.Dispatch<React.SetStateAction<number>>,
    increment: number,
    min: number = 0,
    max?: number
  ) => {
    setter(prev => {
      const newValue = prev + increment;
      return Math.max(min, max ? Math.min(max, newValue) : newValue);
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent, inputType: 'reps' | 'weight' | 'rest') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Move focus to next input or submit
      switch (inputType) {
        case 'reps':
          document.getElementById('weight-input')?.focus();
          break;
        case 'weight':
          document.getElementById('rest-input')?.focus();
          break;
        case 'rest':
          handleSubmit(e);
          break;
      }
    }
  };

  const getNextSetNumber = () => exercise.completedSets.length + 1;
  const getTargetReps = () => {
    const nextSet = exercise.sets[exercise.completedSets.length];
    return nextSet?.reps || reps;
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">
          Log Set #{getNextSetNumber()}
        </h3>
        
        {lastSet && (
          <div className="text-sm text-gray-500">
            Last: {lastSet.reps} × {lastSet.weight}lb
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Reps Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Reps
            {getTargetReps() !== reps && (
              <span className="text-gray-500 ml-2">(Target: {getTargetReps()})</span>
            )}
          </label>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => adjustValue(reps, setReps, -1, 1)}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Minus size={16} />
            </button>
            
            <input
              ref={repsInputRef}
              type="number"
              min="1"
              max="50"
              value={reps}
              onChange={(e) => setReps(Math.max(1, parseInt(e.target.value) || 1))}
              onKeyPress={(e) => handleKeyPress(e, 'reps')}
              className="flex-1 text-center text-2xl font-bold py-3 border-2 border-gray-200 rounded-lg focus:border-fitness-blue focus:outline-none"
            />
            
            <button
              type="button"
              onClick={() => adjustValue(reps, setReps, 1, 1, 50)}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Weight Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Weight (lbs)
          </label>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => adjustValue(weight, setWeight, -2.5, 0)}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Minus size={16} />
            </button>
            
            <input
              id="weight-input"
              type="number"
              min="0"
              step="2.5"
              value={weight}
              onChange={(e) => setWeight(Math.max(0, parseFloat(e.target.value) || 0))}
              onKeyPress={(e) => handleKeyPress(e, 'weight')}
              className="flex-1 text-center text-2xl font-bold py-3 border-2 border-gray-200 rounded-lg focus:border-fitness-blue focus:outline-none"
            />
            
            <button
              type="button"
              onClick={() => adjustValue(weight, setWeight, 2.5, 0)}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Rest Time Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Rest Time (seconds)
          </label>
          <div className="flex items-center space-x-3">
            <Clock size={20} className="text-gray-400" />
            
            <div className="flex-1 grid grid-cols-4 gap-2">
              {[30, 60, 90, 120].map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => setRestTime(time)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    restTime === time
                      ? 'bg-fitness-blue text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {time}s
                </button>
              ))}
            </div>
            
            <input
              id="rest-input"
              type="number"
              min="0"
              step="15"
              value={restTime}
              onChange={(e) => setRestTime(Math.max(0, parseInt(e.target.value) || 0))}
              onKeyPress={(e) => handleKeyPress(e, 'rest')}
              className="w-20 text-center py-2 border-2 border-gray-200 rounded-lg focus:border-fitness-blue focus:outline-none"
            />
          </div>
        </div>

        {/* Notes Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did this set feel? Any form notes?"
            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-fitness-blue focus:outline-none resize-none"
            rows={2}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={isLogging}
            className="flex-1 bg-fitness-blue text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isLogging ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Logging...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Log Set</span>
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={() => {
              if (lastSet) {
                setReps(lastSet.reps);
                setWeight(lastSet.weight);
                setRestTime(lastSet.restTime || 60);
              }
            }}
            className="px-4 py-3 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
            disabled={!lastSet}
          >
            <RotateCcw size={16} />
            <span>Repeat</span>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              setReps(prev => prev + 1);
              setWeight(prev => prev - 2.5);
            }}
            className="py-2 px-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
          >
            ✓ Felt Easy (+1 rep, -2.5lb)
          </button>
          
          <button
            type="button"
            onClick={() => {
              setReps(prev => Math.max(1, prev - 1));
              setWeight(prev => prev + 2.5);
            }}
            className="py-2 px-4 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors text-sm font-medium"
          >
            ⚠ Felt Hard (-1 rep, +2.5lb)
          </button>
        </div>
      </form>

      {/* Voice Commands Hint */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="text-sm text-blue-700">
          <strong>Voice Commands:</strong> Try saying "log 12 reps at 135 pounds" or "that felt easy"
        </div>
      </div>
    </div>
  );
};

export default SetLogger;