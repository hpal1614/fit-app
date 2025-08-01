import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Plus, Clock, Check, ChevronLeft, ChevronRight,
  Mic, MicOff, Edit, Save, X, ChevronUp, ChevronDown,
  TrendingUp, RotateCcw, MessageCircle, Sparkles, Timer,
  Target, Zap, Flame, Activity, Trophy
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
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [totalVolume, setTotalVolume] = useState(0);

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

  // Calculate total volume
  useEffect(() => {
    const volume = currentExercise.sets.reduce((total, set) => {
      return total + (set.weight * set.reps);
    }, 0);
    setTotalVolume(volume);
  }, [currentExercise.sets]);

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
      reasoning: "Maintain the same weight and reps for consistency"
    };
  };

  const handleSetEdit = (setIndex: number) => {
    const set = currentExercise.sets[setIndex];
    setTempWeight(set.weight.toString());
    setTempReps(set.reps.toString());
    setEditingSet(setIndex);
    setTimeout(() => weightInputRef.current?.focus(), 100);
  };

  const handleSetComplete = () => {
    if (editingSet !== null) {
      const newSets = [...currentExercise.sets];
      newSets[editingSet] = {
        ...newSets[editingSet],
        weight: parseFloat(tempWeight) || 0,
        reps: parseInt(tempReps) || 0,
        rpe: currentRPE,
        isCompleted: true,
        timestamp: new Date()
      };
      
      setCurrentExercise({ ...currentExercise, sets: newSets });
      setEditingSet(null);
      setTempWeight('');
      setTempReps('');
      
      // Start rest timer
      setRestTimeRemaining(90); // 90 seconds rest
      setIsRestTimerActive(true);
      
      // Show AI suggestion for next set
      const nextSetIndex = editingSet + 1;
      if (nextSetIndex < newSets.length) {
        const suggestion = getSmartSuggestion(nextSetIndex);
        setAiSuggestion(suggestion.reasoning);
        setTimeout(() => setAiSuggestion(''), 5000);
      }
    }
  };

  const handleQuickAdjust = (type: 'weight' | 'reps', direction: 'up' | 'down') => {
    const currentValue = type === 'weight' ? parseFloat(tempWeight) || 0 : parseInt(tempReps) || 0;
    const increment = type === 'weight' ? 2.5 : 1;
    const newValue = direction === 'up' ? currentValue + increment : Math.max(0, currentValue - increment);
    
    if (type === 'weight') {
      setTempWeight(newValue.toString());
    } else {
      setTempReps(newValue.toString());
    }
  };

  const startWorkout = () => {
    setWorkoutStartTime(new Date());
  };

  const getWorkoutDuration = () => {
    if (!workoutStartTime) return 0;
    return Math.floor((new Date().getTime() - workoutStartTime.getTime()) / 1000);
  };

  const completedSets = currentExercise.sets.filter(s => s.isCompleted).length;
  const totalSets = currentExercise.sets.length;

  return (
    <div className="space-y-modern animate-fade-in-up">
      {/* Workout Header */}
      <div className="card card-elevated">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gradient">{currentExercise.name}</h2>
            <p className="text-gray-400 text-sm capitalize">
              {currentExercise.muscleGroups.join(', ')}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              className="btn btn-primary btn-sm"
              onClick={startWorkout}
            >
              <Play className="w-4 h-4 mr-1" />
              Start
            </button>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setIsVoiceActive(!isVoiceActive)}
            >
              {isVoiceActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Progress Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 glass rounded-lg">
            <div className="text-2xl font-bold text-blue-400">{completedSets}/{totalSets}</div>
            <div className="text-xs text-gray-400">Sets</div>
          </div>
          <div className="text-center p-3 glass rounded-lg">
            <div className="text-2xl font-bold text-green-400">{totalVolume}kg</div>
            <div className="text-xs text-gray-400">Volume</div>
          </div>
          <div className="text-center p-3 glass rounded-lg">
            <div className="text-2xl font-bold text-purple-400">
              {workoutStartTime ? formatTime(getWorkoutDuration()) : '0:00'}
            </div>
            <div className="text-xs text-gray-400">Time</div>
          </div>
        </div>

        {/* Last Performance & PR */}
        <div className="flex justify-between text-sm">
          {currentExercise.lastPerformance && (
            <div className="flex items-center text-gray-400">
              <Target className="w-4 h-4 mr-1" />
              Last: {currentExercise.lastPerformance.weight}kg × {currentExercise.lastPerformance.reps}
            </div>
          )}
          {currentExercise.personalRecord && (
            <div className="flex items-center text-yellow-400">
              <Trophy className="w-4 h-4 mr-1" />
              PR: {currentExercise.personalRecord.weight}kg × {currentExercise.personalRecord.reps}
            </div>
          )}
        </div>
      </div>

      {/* Voice Command Display */}
      {isVoiceActive && (
        <div className="card glass-strong border-blue-500/20">
          <div className="flex items-center space-x-2">
            <Mic className="w-4 h-4 text-blue-400 animate-pulse" />
            <span className="text-sm text-blue-200">
              Listening... Say "log 8 reps at 105 kilos"
            </span>
          </div>
        </div>
      )}

      {/* AI Suggestion */}
      {aiSuggestion && (
        <div className="card glass-strong border-purple-500/20 animate-fade-in">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-200">{aiSuggestion}</span>
          </div>
        </div>
      )}

      {/* Rest Timer */}
      {isRestTimerActive && (
        <div className="card glass-strong border-green-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Timer className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-200">Rest Timer</span>
            </div>
            <div className="text-lg font-bold text-green-400">
              {formatTime(restTimeRemaining)}
            </div>
          </div>
        </div>
      )}

      {/* Sets List */}
      <div className="card card-elevated">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Sets</h3>
          <div className="grid grid-cols-6 gap-2 p-3 glass rounded-lg text-xs font-medium text-gray-400">
            <span>Set</span>
            <span>Previous</span>
            <span>Weight</span>
            <span>Reps</span>
            <span>RPE</span>
            <span></span>
          </div>
        </div>

        <div className="space-y-2">
          {currentExercise.sets.map((set, index) => {
            const isEditing = editingSet === index;
            const isCompleted = set.isCompleted;
            const suggestion = getSmartSuggestion(index);

            return (
              <div key={set.id} className="p-3 glass rounded-lg transition-modern">
                <div className="grid grid-cols-6 gap-2 items-center">
                  {/* Set Number */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-modern ${
                    isCompleted ? 'gradient-success text-white' : 'glass text-gray-400'
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
                          className="input w-full text-xs text-center"
                          placeholder="kg"
                        />
                        <div className="flex justify-center space-x-1">
                          <button
                            onClick={() => handleQuickAdjust('weight', 'down')}
                            className="w-4 h-4 glass rounded-full flex items-center justify-center hover-lift"
                          >
                            <ChevronDown size={10} />
                          </button>
                          <button
                            onClick={() => handleQuickAdjust('weight', 'up')}
                            className="w-4 h-4 glass rounded-full flex items-center justify-center hover-lift"
                          >
                            <ChevronUp size={10} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSetEdit(index)}
                        className={`w-full p-2 text-xs rounded-lg transition-modern ${
                          isCompleted 
                            ? 'gradient-success text-white' 
                            : 'glass hover:bg-white/10'
                        }`}
                      >
                        {set.weight || '—'}
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
                          className="input w-full text-xs text-center"
                          placeholder="reps"
                        />
                        <div className="flex justify-center space-x-1">
                          <button
                            onClick={() => handleQuickAdjust('reps', 'down')}
                            className="w-4 h-4 glass rounded-full flex items-center justify-center hover-lift"
                          >
                            <ChevronDown size={10} />
                          </button>
                          <button
                            onClick={() => handleQuickAdjust('reps', 'up')}
                            className="w-4 h-4 glass rounded-full flex items-center justify-center hover-lift"
                          >
                            <ChevronUp size={10} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSetEdit(index)}
                        className={`w-full p-2 text-xs rounded-lg transition-modern ${
                          isCompleted 
                            ? 'gradient-success text-white' 
                            : 'glass hover:bg-white/10'
                        }`}
                      >
                        {set.reps || '—'}
                      </button>
                    )}
                  </div>

                  {/* RPE */}
                  <div className="flex items-center justify-center">
                    {isEditing ? (
                      <select
                        value={currentRPE}
                        onChange={(e) => setCurrentRPE(parseInt(e.target.value))}
                        className="input text-xs w-full text-center"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rpe => (
                          <option key={rpe} value={rpe}>{rpe}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`text-xs px-2 py-1 rounded ${
                        set.rpe ? 'glass' : 'text-gray-500'
                      }`}>
                        {set.rpe || '—'}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-center">
                    {isEditing ? (
                      <div className="flex space-x-1">
                        <button
                          onClick={handleSetComplete}
                          className="btn btn-success btn-sm"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setEditingSet(null)}
                          className="btn btn-secondary btn-sm"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSetEdit(index)}
                        disabled={isCompleted}
                        className={`btn btn-sm ${
                          isCompleted ? 'btn-secondary opacity-50' : 'btn-primary'
                        }`}
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Workout Summary */}
      {completedSets > 0 && (
        <div className="card card-elevated">
          <h3 className="text-lg font-semibold mb-3">Workout Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 glass rounded-lg">
              <div className="text-xl font-bold text-blue-400">{completedSets}</div>
              <div className="text-xs text-gray-400">Sets Completed</div>
            </div>
            <div className="text-center p-3 glass rounded-lg">
              <div className="text-xl font-bold text-green-400">{totalVolume}kg</div>
              <div className="text-xs text-gray-400">Total Volume</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};