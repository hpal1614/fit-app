import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Plus, Clock, Check, ChevronLeft, ChevronRight,
  Mic, MicOff, Edit, Save, X, ChevronUp, ChevronDown,
  TrendingUp, RotateCcw, MessageCircle, Sparkles
} from 'lucide-react';

interface WorkoutSet {
  id: string;
  reps: number;
  weight: number;
  rpe?: number;
  isCompleted: boolean;
  timestamp?: Date;
}

interface Exercise {
  id: string;
  name: string;
  muscleGroups: string[];
  sets: WorkoutSet[];
  personalRecord?: { weight: number; reps: number; date: Date };
  lastPerformance?: { weight: number; reps: number; date: Date };
}

interface WorkoutLoggerTabProps {
  workout: any; // Replace with proper workout hook type
}

export const WorkoutLoggerTab: React.FC<WorkoutLoggerTabProps> = ({ workout }) => {
  const [currentExercise, setCurrentExercise] = useState<Exercise>({
    id: '1',
    name: 'Bench Press',
    muscleGroups: ['chest', 'triceps'],
    sets: [
      { id: '1', reps: 0, weight: 0, isCompleted: false },
      { id: '2', reps: 0, weight: 0, isCompleted: false },
      { id: '3', reps: 0, weight: 0, isCompleted: false }
    ],
    lastPerformance: { weight: 100, reps: 8, date: new Date('2024-01-15') },
    personalRecord: { weight: 110, reps: 6, date: new Date('2024-01-20') }
  });

  const [editingSet, setEditingSet] = useState<number | null>(null);
  const [tempWeight, setTempWeight] = useState('');
  const [tempReps, setTempReps] = useState('');
  const [currentRPE, setCurrentRPE] = useState<number>(5);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [isRestTimerActive, setIsRestTimerActive] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');

  const weightInputRef = useRef<HTMLInputElement>(null);

  // Rest Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRestTimerActive && restTimeRemaining > 0) {
      interval = setInterval(() => {
        setRestTimeRemaining(prev => {
          if (prev <= 1) {
            setIsRestTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRestTimerActive, restTimeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSmartSuggestion = (setIndex: number) => {
    const lastPerf = currentExercise.lastPerformance;
    if (!lastPerf) return { weight: 135, reps: 8, reasoning: "Starting weight" };

    const completedSets = currentExercise.sets.filter(s => s.isCompleted);
    const avgRPE = completedSets.reduce((sum, s) => sum + (s.rpe || 5), 0) / completedSets.length || 5;

    if (avgRPE <= 6) {
      return {
        weight: lastPerf.weight + 2.5,
        reps: lastPerf.reps,
        reasoning: "You crushed it last time! Let's increase weight 💪"
      };
    } else if (avgRPE >= 8) {
      return {
        weight: lastPerf.weight - 2.5,
        reps: lastPerf.reps + 1,
        reasoning: "Focus on form today, slightly lighter but more reps"
      };
    }

    return {
      weight: lastPerf.weight,
      reps: lastPerf.reps,
      reasoning: "Perfect! Same as last time"
    };
  };

  const handleSetEdit = (setIndex: number) => {
    setEditingSet(setIndex);
    const suggestion = getSmartSuggestion(setIndex);
    setTempWeight(suggestion.weight.toString());
    setTempReps(suggestion.reps.toString());
    setAiSuggestion(suggestion.reasoning);
    setTimeout(() => weightInputRef.current?.focus(), 100);
  };

  const handleSetComplete = () => {
    if (editingSet === null) return;

    const weight = parseFloat(tempWeight) || 0;
    const reps = parseInt(tempReps) || 0;

    // Update set
    const updatedSets = currentExercise.sets.map((set, index) => 
      index === editingSet 
        ? { ...set, reps, weight, rpe: currentRPE, isCompleted: true, timestamp: new Date() }
        : set
    );

    setCurrentExercise(prev => ({
      ...prev,
      sets: updatedSets
    }));

    // Start rest timer
    if (editingSet < currentExercise.sets.length - 1) {
      setRestTimeRemaining(120);
      setIsRestTimerActive(true);
    }

    // Reset state
    setEditingSet(null);
    setTempWeight('');
    setTempReps('');
    setCurrentRPE(5);
  };

  const handleQuickAdjust = (type: 'weight' | 'reps', direction: 'up' | 'down') => {
    if (type === 'weight') {
      setTempWeight(prev => {
        const current = parseFloat(prev) || 0;
        const increment = direction === 'up' ? 2.5 : -2.5;
        return Math.max(0, current + increment).toString();
      });
    } else {
      setTempReps(prev => {
        const current = parseInt(prev) || 0;
        const increment = direction === 'up' ? 1 : -1;
        return Math.max(0, current + increment).toString();
      });
    }
  };

  const completedSets = currentExercise.sets.filter(s => s.isCompleted).length;
  const progressPercentage = (completedSets / currentExercise.sets.length) * 100;

  return (
    <div className="space-y-4">
      {/* Exercise Header */}
      <div className="bg-gray-900/80 backdrop-blur-lg rounded-2xl p-4 border border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold">{currentExercise.name}</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsVoiceActive(!isVoiceActive)}
              className={`p-2 rounded-full transition-all ${
                isVoiceActive 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-gray-700 text-gray-400'
              }`}
            >
              {isVoiceActive ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            <button className="p-2 bg-gray-700 rounded-full">
              <TrendingUp size={16} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>Progress</span>
            <span>{completedSets}/{currentExercise.sets.length} sets</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-lime-400 to-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Last Performance */}
        {currentExercise.lastPerformance && (
          <div className="text-sm text-gray-400">
            Last time: {currentExercise.lastPerformance.weight}kg × {currentExercise.lastPerformance.reps} reps
          </div>
        )}
      </div>

      {/* Voice Command Display */}
      {isVoiceActive && (
        <div className="bg-blue-900/20 border border-blue-800 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <Mic size={16} className="text-blue-400" />
            <span className="text-sm text-blue-200">
              Listening... Say "log 8 reps at 105 kilos"
            </span>
          </div>
        </div>
      )}

      {/* AI Suggestion */}
      {aiSuggestion && (
        <div className="bg-purple-900/20 border border-purple-800 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <Sparkles size={16} className="text-purple-400" />
            <span className="text-sm text-purple-200">{aiSuggestion}</span>
          </div>
        </div>
      )}

      {/* Sets List */}
      <div className="bg-gray-900/80 backdrop-blur-lg rounded-xl overflow-hidden border border-gray-800">
        {/* Header */}
        <div className="grid grid-cols-6 gap-2 p-3 bg-gray-800 text-xs font-medium text-gray-400 border-b border-gray-700">
          <span>Set</span>
          <span>Previous</span>
          <span>Weight</span>
          <span>Reps</span>
          <span>RPE</span>
          <span></span>
        </div>

        {/* Sets */}
        {currentExercise.sets.map((set, index) => {
          const isEditing = editingSet === index;
          const isCompleted = set.isCompleted;
          const suggestion = getSmartSuggestion(index);

          return (
            <div key={set.id} className="border-b border-gray-700 last:border-b-0">
              <div className="grid grid-cols-6 gap-2 p-3 items-center">
                {/* Set Number */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  isCompleted ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'
                }`}>
                  {index + 1}
                </div>

                {/* Previous */}
                <div className="text-xs text-gray-500">
                  {currentExercise.lastPerformance ? 
                    `${currentExercise.lastPerformance.weight}×${currentExercise.lastPerformance.reps}` : 
                    '—'
                  }
                </div>

                {/* Weight */}
                <div className="relative">
                  {isEditing ? (
                    <div className="space-y-1">
                      <input
                        ref={weightInputRef}
                        type="number"
                        value={tempWeight}
                        onChange={(e) => setTempWeight(e.target.value)}
                        className="w-full p-1 text-xs border border-blue-400 rounded bg-gray-800 text-white text-center"
                        placeholder="kg"
                      />
                      <div className="flex justify-center space-x-1">
                        <button
                          onClick={() => handleQuickAdjust('weight', 'down')}
                          className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center"
                        >
                          <ChevronDown size={10} />
                        </button>
                        <button
                          onClick={() => handleQuickAdjust('weight', 'up')}
                          className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center"
                        >
                          <ChevronUp size={10} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSetEdit(index)}
                      className={`w-full p-2 text-xs rounded border-2 transition-all ${
                        isCompleted 
                          ? 'bg-green-900/20 border-green-700 text-green-300' 
                          : 'bg-gray-700 border-gray-600 hover:border-blue-400'
                      }`}
                    >
                      {set.weight || suggestion.weight}
                    </button>
                  )}
                </div>

                {/* Reps */}
                <div className="relative">
                  {isEditing ? (
                    <div className="space-y-1">
                      <input
                        type="number"
                        value={tempReps}
                        onChange={(e) => setTempReps(e.target.value)}
                        className="w-full p-1 text-xs border border-blue-400 rounded bg-gray-800 text-white text-center"
                        placeholder="reps"
                      />
                      <div className="flex justify-center space-x-1">
                        <button
                          onClick={() => handleQuickAdjust('reps', 'down')}
                          className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center"
                        >
                          <ChevronDown size={10} />
                        </button>
                        <button
                          onClick={() => handleQuickAdjust('reps', 'up')}
                          className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center"
                        >
                          <ChevronUp size={10} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSetEdit(index)}
                      className={`w-full p-2 text-xs rounded border-2 transition-all ${
                        isCompleted 
                          ? 'bg-green-900/20 border-green-700 text-green-300' 
                          : 'bg-gray-700 border-gray-600 hover:border-blue-400'
                      }`}
                    >
                      {set.reps || suggestion.reps}
                    </button>
                  )}
                </div>

                {/* RPE */}
                <div className="text-center">
                  {isEditing ? (
                    <select
                      value={currentRPE}
                      onChange={(e) => setCurrentRPE(parseInt(e.target.value))}
                      className="w-full p-1 text-xs border border-gray-600 rounded bg-gray-800 text-white"
                    >
                      {[1,2,3,4,5,6,7,8,9,10].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs text-gray-500">
                      {set.rpe || '—'}
                    </span>
                  )}
                </div>

                {/* Action */}
                <div>
                  {isEditing ? (
                    <button
                      onClick={handleSetComplete}
                      className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center transition-colors"
                    >
                      <Check size={14} />
                    </button>
                  ) : isCompleted ? (
                    <div className="w-8 h-8 bg-green-500 text-white rounded-lg flex items-center justify-center">
                      <Check size={14} />
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSetEdit(index)}
                      className="w-8 h-8 bg-gray-600 hover:bg-gray-500 text-gray-400 rounded-lg flex items-center justify-center transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Rest Timer */}
              {isCompleted && index < currentExercise.sets.length - 1 && isRestTimerActive && (
                <div className="p-3 bg-blue-900/20">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Clock size={14} className="text-blue-400" />
                    <span className="text-blue-400 font-mono text-sm">
                      {formatTime(restTimeRemaining)}
                    </span>
                  </div>
                  <div className="w-full bg-blue-800 rounded-full h-1.5">
                    <div 
                      className="bg-blue-400 h-1.5 rounded-full transition-all duration-1000"
                      style={{ width: `${100 - (restTimeRemaining / 120) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Add Set Button */}
        <div className="p-3">
          <button
            className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-lg border-2 border-dashed border-gray-600 text-gray-400 flex items-center justify-center space-x-2 transition-colors"
          >
            <Plus size={16} />
            <span className="text-sm">Add Set</span>
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <button className="p-3 bg-gray-900/80 backdrop-blur-lg rounded-lg border border-gray-800 text-center">
          <RotateCcw size={16} className="mx-auto mb-1 text-gray-400" />
          <span className="text-xs text-gray-400">Repeat Last</span>
        </button>
        <button className="p-3 bg-gray-900/80 backdrop-blur-lg rounded-lg border border-gray-800 text-center">
          <Play size={16} className="mx-auto mb-1 text-gray-400" />
          <span className="text-xs text-gray-400">Start Workout</span>
        </button>
        <button className="p-3 bg-gray-900/80 backdrop-blur-lg rounded-lg border border-gray-800 text-center">
          <MessageCircle size={16} className="mx-auto mb-1 text-gray-400" />
          <span className="text-xs text-gray-400">Notes</span>
        </button>
      </div>
    </div>
  );
};