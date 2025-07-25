import React, { useState, useRef, useEffect } from 'react';
import { Plus, Clock, Check, MoreVertical, Target, TrendingUp, Zap } from 'lucide-react';

interface Set {
  id: string;
  reps: number;
  weight: number;
  isCompleted: boolean;
  isPR: boolean;
  restTime?: number;
  rpe?: number; // Rate of Perceived Exertion (1-10)
}

interface Exercise {
  id: string;
  name: string;
  sets: Set[];
  notes?: string;
  muscleGroups: string[];
  lastPerformed?: Date;
  personalRecord?: {
    weight: number;
    reps: number;
    date: Date;
  };
}

export const StrongInspiredLogger: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([
    {
      id: '1',
      name: 'Bench Press',
      sets: [
        { id: '1-1', reps: 8, weight: 185, isCompleted: true, isPR: false },
        { id: '1-2', reps: 8, weight: 185, isCompleted: true, isPR: false },
        { id: '1-3', reps: 6, weight: 195, isCompleted: false, isPR: true },
      ],
      muscleGroups: ['Chest', 'Triceps', 'Shoulders'],
      personalRecord: { weight: 225, reps: 1, date: new Date('2024-01-15') }
    }
  ]);

  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [restTimer, setRestTimer] = useState<number>(0);
  const [isResting, setIsResting] = useState(false);
  const inputRefs = useRef<{ [key: string]: HTMLInputElement }>({});

  // Rest timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isResting && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            setIsResting(false);
            // Play notification sound or vibrate
            if (navigator.vibrate) navigator.vibrate(200);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isResting, restTimer]);

  const updateSet = (exerciseId: string, setId: string, field: keyof Set, value: any) => {
    setExercises(prev => prev.map(exercise => 
      exercise.id === exerciseId 
        ? {
            ...exercise,
            sets: exercise.sets.map(set => 
              set.id === setId ? { ...set, [field]: value } : set
            )
          }
        : exercise
    ));
  };

  const completeSet = (exerciseId: string, setId: string) => {
    updateSet(exerciseId, setId, 'isCompleted', true);
    
    // Start rest timer (default 90 seconds for strength training)
    setRestTimer(90);
    setIsResting(true);
    
    // Move focus to next set
    const exercise = exercises.find(e => e.id === exerciseId);
    const currentSetIndex = exercise?.sets.findIndex(s => s.id === setId);
    const nextSet = exercise?.sets[currentSetIndex! + 1];
    
    if (nextSet) {
      setActiveSetId(nextSet.id);
      setTimeout(() => {
        inputRefs.current[`${exerciseId}-${nextSet.id}-weight`]?.focus();
      }, 100);
    }
  };

  const addSet = (exerciseId: string) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    const lastSet = exercise?.sets[exercise.sets.length - 1];
    
    const newSet: Set = {
      id: `${exerciseId}-${Date.now()}`,
      reps: lastSet?.reps || 8,
      weight: lastSet?.weight || 0,
      isCompleted: false,
      isPR: false
    };

    setExercises(prev => prev.map(ex => 
      ex.id === exerciseId 
        ? { ...ex, sets: [...ex.sets, newSet] }
        : ex
    ));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPRIcon = (exercise: Exercise, set: Set) => {
    if (!exercise.personalRecord) return null;
    
    const isWeightPR = set.weight > exercise.personalRecord.weight;
    const isVolumePR = set.weight * set.reps > exercise.personalRecord.weight * exercise.personalRecord.reps;
    
    if (isWeightPR || isVolumePR) {
      return <TrendingUp size={14} className="text-yellow-500" title="Personal Record!" />;
    }
    return null;
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Rest Timer - Floating when active */}
      {isResting && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
          <Clock size={18} />
          <span className="font-mono font-bold">{formatTime(restTimer)}</span>
          <span className="text-sm">rest</span>
        </div>
      )}

      {exercises.map((exercise) => (
        <div key={exercise.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          {/* Exercise Header */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {exercise.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {exercise.muscleGroups.join(', ')}
                  </span>
                  {exercise.personalRecord && (
                    <span className="text-xs bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Target size={10} />
                      PR: {exercise.personalRecord.weight}lb × {exercise.personalRecord.reps}
                    </span>
                  )}
                </div>
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>

          {/* Sets Table */}
          <div className="p-4">
            {/* Table Header */}
            <div className="grid grid-cols-5 gap-3 pb-3 border-b border-gray-100 dark:border-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400">
              <div>SET</div>
              <div>PREVIOUS</div>
              <div>WEIGHT</div>
              <div>REPS</div>
              <div className="text-center">✓</div>
            </div>

            {/* Sets */}
            <div className="space-y-2 mt-3">
              {exercise.sets.map((set, index) => (
                <div 
                  key={set.id}
                  className={`grid grid-cols-5 gap-3 items-center py-2 px-3 rounded-lg transition-all ${
                    activeSetId === set.id 
                      ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-200 dark:ring-blue-800' 
                      : set.isCompleted 
                        ? 'bg-green-50 dark:bg-green-900/20' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                  onClick={() => setActiveSetId(set.id)}
                >
                  {/* Set Number */}
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {index + 1}
                  </div>

                  {/* Previous (placeholder for actual data) */}
                  <div className="text-sm text-gray-400 dark:text-gray-500">
                    {index > 0 ? `${exercise.sets[index-1].weight} × ${exercise.sets[index-1].reps}` : '—'}
                  </div>

                  {/* Weight Input */}
                  <div className="relative">
                    <input
                      ref={el => el && (inputRefs.current[`${exercise.id}-${set.id}-weight`] = el)}
                      type="number"
                      value={set.weight || ''}
                      onChange={(e) => updateSet(exercise.id, set.id, 'weight', parseFloat(e.target.value) || 0)}
                      onFocus={() => setActiveSetId(set.id)}
                      className={`w-full px-2 py-1 text-center border rounded text-sm font-mono transition-all ${
                        set.isCompleted 
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700'
                      } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="0"
                      disabled={set.isCompleted}
                    />
                    {getPRIcon(exercise, set) && (
                      <div className="absolute -top-1 -right-1">
                        {getPRIcon(exercise, set)}
                      </div>
                    )}
                  </div>

                  {/* Reps Input */}
                  <input
                    ref={el => el && (inputRefs.current[`${exercise.id}-${set.id}-reps`] = el)}
                    type="number"
                    value={set.reps || ''}
                    onChange={(e) => updateSet(exercise.id, set.id, 'reps', parseInt(e.target.value) || 0)}
                    onFocus={() => setActiveSetId(set.id)}
                    className={`w-full px-2 py-1 text-center border rounded text-sm font-mono transition-all ${
                      set.isCompleted 
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700'
                    } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="0"
                    disabled={set.isCompleted}
                  />

                  {/* Complete Button */}
                  <div className="text-center">
                    <button
                      onClick={() => !set.isCompleted && completeSet(exercise.id, set.id)}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                        set.isCompleted
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 dark:border-gray-600 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                      }`}
                      disabled={set.isCompleted}
                    >
                      {set.isCompleted && <Check size={16} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Set Button */}
            <button
              onClick={() => addSet(exercise.id)}
              className="w-full mt-4 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Add Set
            </button>
          </div>

          {/* Exercise Notes */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-700">
            <textarea
              placeholder="Add notes for this exercise..."
              className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              value={exercise.notes || ''}
              onChange={(e) => {
                setExercises(prev => prev.map(ex => 
                  ex.id === exercise.id ? { ...ex, notes: e.target.value } : ex
                ));
              }}
            />
          </div>
        </div>
      ))}

      {/* Add Exercise Button */}
      <button className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all flex items-center justify-center gap-2 bg-white dark:bg-gray-800">
        <Plus size={20} />
        Add Exercise
      </button>
    </div>
  );
};

export default StrongInspiredLogger;