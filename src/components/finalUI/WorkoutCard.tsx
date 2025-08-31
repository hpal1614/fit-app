import React, { useState, useRef, useEffect } from 'react';
import { X, Info, MoreVertical, Plus, ChevronDown, ChevronUp, Zap, Search } from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  restTime?: number;
  notes?: string;
}

interface WorkoutCardProps {
  exercise: Exercise;
  onUpdateExercise: (exercise: Exercise) => void;
  onSwapExercise: (exerciseId: string) => void;
  onSave: (exercise: Exercise) => void;
  onClose: () => void;
  currentExerciseIndex?: number;
  totalExercises?: number;
  onNextExercise?: () => void;
  onPreviousExercise?: () => void;
  workoutExercises?: any[];
  onSupersetExerciseSelected?: (exerciseName: string) => void;
}

interface SetItem {
  id: string;
  type: 'normal' | 'warmup' | 'dropset' | 'superset';
  weight: number;
  reps: number;
  completed: boolean;
  isExpanded?: boolean;
  dropWeight?: number;
  dropReps?: number;
  supersetExercise?: string;
  supersetExerciseName?: string;
  supersetWeight?: number;
  supersetReps?: number;
}

// Sample exercises for superset selection
const availableExercises = [
  { id: '1', name: 'Bench Press' },
  { id: '2', name: 'Squats' },
  { id: '3', name: 'Deadlifts' },
  { id: '4', name: 'Pull-ups' },
  { id: '5', name: 'Push-ups' },
  { id: '6', name: 'Lunges' },
  { id: '7', name: 'Shoulder Press' },
  { id: '8', name: 'Bicep Curls' },
  { id: '9', name: 'Tricep Dips' },
  { id: '10', name: 'Planks' },
  { id: '11', name: 'Burpees' },
  { id: '12', name: 'Mountain Climbers' },
  { id: '13', name: 'Jumping Jacks' },
  { id: '14', name: 'Russian Twists' },
  { id: '15', name: 'Leg Raises' }
];

export const WorkoutCard: React.FC<WorkoutCardProps> = ({
  exercise, onUpdateExercise, onSwapExercise, onSave, onClose,
  currentExerciseIndex = 0, totalExercises = 1, onNextExercise, onPreviousExercise, workoutExercises = [], onSupersetExerciseSelected
}) => {
  const [sets, setSets] = useState<SetItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [showNumberPad, setShowNumberPad] = useState<{setId: string, field: 'weight' | 'reps' | 'dropWeight' | 'dropReps' | 'supersetWeight' | 'supersetReps'} | null>(null);
  const [numberPadValue, setNumberPadValue] = useState('');
  const [showSupersetAnimation, setShowSupersetAnimation] = useState<string | null>(null);
  const [showExerciseSelector, setShowExerciseSelector] = useState<string | null>(null);
  const [exerciseSupersetMode, setExerciseSupersetMode] = useState(false);
  const [exerciseSearchTerm, setExerciseSearchTerm] = useState('');
  const [exerciseSupersetPartner, setExerciseSupersetPartner] = useState<{id: string, name: string} | null>(null);
  
  // Initialize sets
  useEffect(() => {
    const initialSets: SetItem[] = Array.from({ length: exercise.sets }, (_, index) => ({
      id: `set-${index + 1}`,
      type: 'normal',
      weight: 0,
      reps: exercise.reps,
      completed: false,
      isExpanded: false,
      dropWeight: 0,
      dropReps: 0,
      supersetExercise: '',
      supersetExerciseName: '',
      supersetWeight: 0,
      supersetReps: 0
    }));
    setSets(initialSets);
  }, [exercise]);

  const addSet = () => {
    const newSet: SetItem = {
      id: `set-${sets.length + 1}`,
      type: 'normal',
      weight: 0,
      reps: exercise.reps,
      completed: false,
      isExpanded: false,
      dropWeight: 0,
      dropReps: 0,
      supersetExercise: '',
      supersetExerciseName: '',
      supersetWeight: 0,
      supersetReps: 0
    };
    setSets([...sets, newSet]);
  };

  const deleteSet = (setId: string) => {
    setSets(sets.filter(set => set.id !== setId));
    setShowDropdown(null);
  };

  const updateSet = (setId: string, updates: Partial<SetItem>) => {
    setSets(sets.map(set => set.id === setId ? { ...set, ...updates } : set));
  };

  const toggleSetCompletion = (setId: string) => {
    setSets(sets.map(set => 
      set.id === setId ? { ...set, completed: !set.completed } : set
    ));
  };

  const toggleSetExpansion = (setId: string) => {
    setSets(sets.map(set => 
      set.id === setId ? { ...set, isExpanded: !set.isExpanded } : set
    ));
  };

  const openNumberPad = (setId: string, field: 'weight' | 'reps' | 'dropWeight' | 'dropReps' | 'supersetWeight' | 'supersetReps') => {
    const set = sets.find(s => s.id === setId);
    if (set) {
      let value = '0';
      if (field === 'weight') value = set.weight.toString();
      else if (field === 'reps') value = set.reps.toString();
      else if (field === 'dropWeight') value = (set.dropWeight || 0).toString();
      else if (field === 'dropReps') value = (set.dropReps || 0).toString();
      else if (field === 'supersetWeight') value = (set.supersetWeight || 0).toString();
      else if (field === 'supersetReps') value = (set.supersetReps || 0).toString();
      
      setNumberPadValue(value);
      setShowNumberPad({ setId, field });
    }
  };

  const closeNumberPad = () => {
    setShowNumberPad(null);
    setNumberPadValue('');
  };

  const updateNumberPadValue = (value: string) => {
    setNumberPadValue(value);
  };

  const confirmNumberPadValue = () => {
    if (showNumberPad) {
      const numValue = parseInt(numberPadValue) || 0;
      updateSet(showNumberPad.setId, { [showNumberPad.field]: numValue });
      closeNumberPad();
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(exercise);
    setIsSaving(false);
  };

  const getSetTypeIcon = (type: string) => {
    switch (type) {
      case 'warmup': return '⚡';
      case 'dropset': return '↘️';
      case 'superset': return '⚡';
      default: return '';
    }
  };

  const getSetTypeColor = (type: string) => {
    switch (type) {
      case 'warmup': return 'bg-yellow-500/20 border-yellow-500/30';
      case 'dropset': return 'bg-red-500/20 border-red-500/30';
      case 'superset': return 'bg-blue-500/20 border-blue-500/30';
      default: return 'bg-gray-800 border-gray-700';
    }
  };

  const getButtonColor = (type: string, completed: boolean) => {
    if (completed) return 'bg-green-500 text-white shadow-lg';
    
    switch (type) {
      case 'warmup': return 'bg-yellow-500/30 border-yellow-500/50 text-yellow-300 hover:bg-yellow-500/40';
      case 'dropset': return 'bg-red-500/30 border-red-500/50 text-red-300 hover:bg-red-500/40';
      case 'superset': return 'bg-blue-500/30 border-blue-500/50 text-blue-300 hover:bg-blue-500/40';
      default: return 'bg-gray-700 text-gray-400 hover:bg-gray-600';
    }
  };

  const handleSetTypeChange = (setId: string, newType: string) => {
    updateSet(setId, { type: newType as any });
    setShowDropdown(null);
    
    // Trigger superset animation and show exercise selector
    if (newType === 'superset') {
      setShowSupersetAnimation(setId);
      setTimeout(() => setShowSupersetAnimation(null), 2000);
      setShowExerciseSelector(setId);
    }
  };

  const selectSupersetExercise = (setId: string, exerciseId: string, exerciseName: string) => {
    if (exerciseSupersetMode) {
      // Exercise-level superset - convert all sets to superset
      setSets(sets.map(set => ({
        ...set,
        type: 'superset',
        supersetExercise: exerciseId,
        supersetExerciseName: exerciseName
      })));
      setExerciseSupersetPartner({ id: exerciseId, name: exerciseName });
      setExerciseSupersetMode(false);
      
      // Notify parent component to remove this exercise from the workout list
      if (onSupersetExerciseSelected) {
        onSupersetExerciseSelected(exerciseName);
      }
    } else {
      // Set-level superset
      updateSet(setId, { 
        supersetExercise: exerciseId, 
        supersetExerciseName: exerciseName 
      });
    }
    setShowExerciseSelector(null);
    setExerciseSearchTerm('');
  };

  // Get exercises from current workout (excluding current exercise)
  const currentWorkoutExercises = workoutExercises.filter(ex => 
    ex.name.toLowerCase().includes(exerciseSearchTerm.toLowerCase()) &&
    ex.name !== exercise.name
  );
  
  // Get other exercises (excluding current exercise and workout exercises)
  const otherExercises = availableExercises.filter(ex => 
    ex.name.toLowerCase().includes(exerciseSearchTerm.toLowerCase()) &&
    ex.name !== exercise.name &&
    !workoutExercises.some(workoutEx => workoutEx.name === ex.name)
  );

  const completedSets = sets.filter(set => set.completed).length;
  const progress = totalExercises > 0 ? (currentExerciseIndex + 1) / totalExercises : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
      <div className="bg-gray-900 w-full max-w-sm h-[85vh] rounded-t-3xl overflow-hidden flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-600 rounded-full"></div>
        </div>

        {/* Header with Navigation */}
        <div className="px-4 pb-3 border-b border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-800 transition-colors">
              <X className="w-4 h-4 text-white" />
            </button>
            
            {/* Exercise Counter */}
            <span className="text-white text-sm font-medium">
              {currentExerciseIndex + 1} / {totalExercises}
            </span>

            <button onClick={() => {}} className="p-2 rounded-full hover:bg-gray-800 transition-colors">
              <Info className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Exercise Name and Progress */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1">
                <h2 className="text-lg font-bold text-white">
                  {exerciseSupersetPartner 
                    ? `${exercise.name} + ${exerciseSupersetPartner.name}`
                    : exercise.name
                  }
                </h2>
                {exerciseSupersetPartner && (
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-3 h-3 text-blue-400" />
                      <span className="text-blue-300 text-sm">Superset Active</span>
                    </div>
                    <button
                      onClick={() => {
                        setExerciseSupersetPartner(null);
                        setSets(sets.map(set => ({
                          ...set,
                          type: 'normal',
                          supersetExercise: '',
                          supersetExerciseName: ''
                        })));
                      }}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              {!exerciseSupersetPartner && (
                <button
                  onClick={() => {
                    setExerciseSupersetMode(true);
                    setShowExerciseSelector('exercise-superset');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1"
                >
                  <Zap className="w-3 h-3" />
                  <span>Superset</span>
                </button>
              )}
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-gray-400 text-xs">
                {completedSets} of {sets.length} sets completed
              </span>
              <span className="text-gray-400 text-xs">
                {Math.round(progress * 100)}% done
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-1 mt-2">
              <div 
                className="bg-green-500 h-1 rounded-full transition-all duration-300" 
                style={{ width: `${progress * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Sets List */}
        <div className="flex-1 px-4 py-3 space-y-2 overflow-y-auto">
          {sets.map((set, index) => (
            <div key={set.id} className={`rounded-lg border ${getSetTypeColor(set.type)} p-3 transition-all duration-500 ${showSupersetAnimation === set.id ? 'animate-pulse scale-105' : ''}`}>
              {/* Set Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleSetCompletion(set.id)}
                    className={`w-6 h-6 rounded flex items-center justify-center transition-all duration-200 border ${getButtonColor(set.type, set.completed)}`}
                  >
                    {set.completed ? (
                      <span className="text-sm">✓</span>
                    ) : (
                      <span className="text-xs">{getSetTypeIcon(set.type)}</span>
                    )}
                  </button>
                  <div>
                    <h3 className="text-white font-medium text-sm">Set {index + 1}</h3>
                    {set.type !== 'normal' && (
                      <span className="text-xs text-gray-400 capitalize">{set.type}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => toggleSetExpansion(set.id)}
                    className="p-1 rounded hover:bg-gray-700 transition-colors"
                  >
                    {set.isExpanded ? (
                      <ChevronUp className="w-3 h-3 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-400" />
                    )}
                  </button>
                  
                  <div className="relative">
                    <button
                      onClick={() => setShowDropdown(showDropdown === set.id ? null : set.id)}
                      className="p-1 rounded hover:bg-gray-700 transition-colors"
                    >
                      <MoreVertical className="w-3 h-3 text-gray-400" />
                    </button>

                    {showDropdown === set.id && (
                      <div className="absolute right-0 top-8 bg-gray-800 rounded-lg shadow-lg border border-gray-700 min-w-40 z-10">
                        <div className="py-1">
                          <button
                            onClick={() => handleSetTypeChange(set.id, 'warmup')}
                            className="w-full px-3 py-2 text-left text-white hover:bg-gray-700 flex items-center space-x-2 text-sm"
                          >
                            <span>⚡</span>
                            <span>Warmup</span>
                          </button>
                          <button
                            onClick={() => handleSetTypeChange(set.id, 'dropset')}
                            className="w-full px-3 py-2 text-left text-white hover:bg-gray-700 flex items-center space-x-2 text-sm"
                          >
                            <span>↘️</span>
                            <span>Dropset</span>
                          </button>
                          <button
                            onClick={() => handleSetTypeChange(set.id, 'superset')}
                            className="w-full px-3 py-2 text-left text-white hover:bg-gray-700 flex items-center space-x-2 text-sm"
                          >
                            <span>⚡</span>
                            <span>Superset</span>
                          </button>
                          <div className="border-t border-gray-700 my-1"></div>
                          <button
                            onClick={() => deleteSet(set.id)}
                            className="w-full px-3 py-2 text-left text-red-400 hover:bg-gray-700 flex items-center space-x-2 text-sm"
                          >
                            <span>🗑️</span>
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Set Details */}
              {set.isExpanded && (
                <div className="space-y-3 pt-2 border-t border-gray-700">
                  {/* Main Set */}
                  <div className="space-y-3">
                    <h4 className="text-white font-medium text-sm">Main Set</h4>
                    {/* Weight Input */}
                    <div className="space-y-1">
                      <label className="text-gray-400 text-xs font-medium">Weight (kg)</label>
                      <button
                        onClick={() => openNumberPad(set.id, 'weight')}
                        className="w-full bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-center text-sm font-semibold transition-colors"
                      >
                        {set.weight} kg
                      </button>
                    </div>

                    {/* Reps Input */}
                    <div className="space-y-1">
                      <label className="text-gray-400 text-xs font-medium">Repetitions</label>
                      <button
                        onClick={() => openNumberPad(set.id, 'reps')}
                        className="w-full bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-center text-sm font-semibold transition-colors"
                      >
                        {set.reps} reps
                      </button>
                    </div>
                  </div>

                  {/* Dropset Sub-card */}
                  {set.type === 'dropset' && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded p-3 space-y-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-red-400 text-sm">↘️</span>
                        <h4 className="text-red-300 font-medium text-sm">Drop Set</h4>
                      </div>
                      
                      {/* Drop Weight Input */}
                      <div className="space-y-1">
                        <label className="text-red-300 text-xs font-medium">Drop Weight (kg)</label>
                        <button
                          onClick={() => openNumberPad(set.id, 'dropWeight')}
                          className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-200 px-3 py-2 rounded text-center text-sm font-semibold transition-colors border border-red-500/30"
                        >
                          {set.dropWeight || 0} kg
                        </button>
                      </div>

                      {/* Drop Reps Input */}
                      <div className="space-y-1">
                        <label className="text-red-300 text-xs font-medium">Drop Repetitions</label>
                        <button
                          onClick={() => openNumberPad(set.id, 'dropReps')}
                          className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-200 px-3 py-2 rounded text-center text-sm font-semibold transition-colors border border-red-500/30"
                        >
                          {set.dropReps || 0} reps
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Superset Sub-cards */}
                  {set.type === 'superset' && (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 mb-3">
                        <Zap className="w-4 h-4 text-blue-400 animate-pulse" />
                        <h4 className="text-blue-300 font-medium text-sm">Superset</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Exercise A (Main) */}
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3 space-y-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <h5 className="text-blue-300 font-medium text-xs">{exercise.name}</h5>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-blue-300 text-xs font-medium">Weight (kg)</label>
                            <button
                              onClick={() => openNumberPad(set.id, 'weight')}
                              className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 px-2 py-1 rounded text-center text-xs font-semibold transition-colors border border-blue-500/30"
                            >
                              {set.weight} kg
                            </button>
                          </div>

                          <div className="space-y-1">
                            <label className="text-blue-300 text-xs font-medium">Repetitions</label>
                            <button
                              onClick={() => openNumberPad(set.id, 'reps')}
                              className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 px-2 py-1 rounded text-center text-xs font-semibold transition-colors border border-blue-500/30"
                            >
                              {set.reps} reps
                            </button>
                          </div>
                        </div>

                        {/* Exercise B (Superset) */}
                        <div className="bg-purple-500/10 border border-purple-500/20 rounded p-3 space-y-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                            <h5 className="text-purple-300 font-medium text-xs">
                              {set.supersetExerciseName || 'Select Exercise'}
                            </h5>
                          </div>
                          
                          {set.supersetExerciseName ? (
                            <>
                              <div className="space-y-1">
                                <label className="text-purple-300 text-xs font-medium">Weight (kg)</label>
                                <button
                                  onClick={() => openNumberPad(set.id, 'supersetWeight')}
                                  className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 px-2 py-1 rounded text-center text-xs font-semibold transition-colors border border-purple-500/30"
                                >
                                  {set.supersetWeight || 0} kg
                                </button>
                              </div>

                              <div className="space-y-1">
                                <label className="text-purple-300 text-xs font-medium">Repetitions</label>
                                <button
                                  onClick={() => openNumberPad(set.id, 'supersetReps')}
                                  className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 px-2 py-1 rounded text-center text-xs font-semibold transition-colors border border-purple-500/30"
                                >
                                  {set.supersetReps || 0} reps
                                </button>
                              </div>
                            </>
                          ) : (
                            <button
                              onClick={() => setShowExerciseSelector(set.id)}
                              className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 px-2 py-1 rounded text-center text-xs font-semibold transition-colors border border-purple-500/30"
                            >
                              Choose Exercise
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Compact View (when not expanded) */}
              {!set.isExpanded && (
                <div className="space-y-2">
                  {/* Normal/Dropset View */}
                  {set.type !== 'superset' && (
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => openNumberPad(set.id, 'weight')}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-center text-xs transition-colors"
                      >
                        {set.weight} kg
                      </button>
                      <button
                        onClick={() => openNumberPad(set.id, 'reps')}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-center text-xs transition-colors"
                      >
                        {set.reps} reps
                      </button>
                    </div>
                  )}
                  
                  {/* Dropset compact view */}
                  {set.type === 'dropset' && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded p-2">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-red-400 text-xs">↘️</span>
                        <span className="text-red-300 text-xs font-medium">Drop</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => openNumberPad(set.id, 'dropWeight')}
                          className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 px-2 py-1 rounded text-center text-xs transition-colors border border-red-500/30"
                        >
                          {set.dropWeight || 0} kg
                        </button>
                        <button
                          onClick={() => openNumberPad(set.id, 'dropReps')}
                          className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 px-2 py-1 rounded text-center text-xs transition-colors border border-red-500/30"
                        >
                          {set.dropReps || 0} reps
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Superset compact view */}
                  {set.type === 'superset' && (
                    <div className="grid grid-cols-2 gap-2">
                      {/* Exercise A */}
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2">
                        <div className="flex items-center space-x-1 mb-1">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                          <span className="text-blue-300 text-xs font-medium">{exercise.name}</span>
                        </div>
                        <div className="space-y-1">
                          <button
                            onClick={() => openNumberPad(set.id, 'weight')}
                            className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 px-1 py-1 rounded text-center text-xs transition-colors border border-blue-500/30"
                          >
                            {set.weight} kg
                          </button>
                          <button
                            onClick={() => openNumberPad(set.id, 'reps')}
                            className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 px-1 py-1 rounded text-center text-xs transition-colors border border-blue-500/30"
                          >
                            {set.reps} reps
                          </button>
                        </div>
                      </div>

                      {/* Exercise B */}
                      <div className="bg-purple-500/10 border border-purple-500/20 rounded p-2">
                        <div className="flex items-center space-x-1 mb-1">
                          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                          <span className="text-purple-300 text-xs font-medium">
                            {set.supersetExerciseName || 'Select'}
                          </span>
                        </div>
                        {set.supersetExerciseName ? (
                          <div className="space-y-1">
                            <button
                              onClick={() => openNumberPad(set.id, 'supersetWeight')}
                              className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 px-1 py-1 rounded text-center text-xs transition-colors border border-purple-500/30"
                            >
                              {set.supersetWeight || 0} kg
                            </button>
                            <button
                              onClick={() => openNumberPad(set.id, 'supersetReps')}
                              className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 px-1 py-1 rounded text-center text-xs transition-colors border border-purple-500/30"
                            >
                              {set.supersetReps || 0} reps
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowExerciseSelector(set.id)}
                            className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 px-1 py-1 rounded text-center text-xs transition-colors border border-purple-500/30"
                          >
                            Choose
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Add Set Button */}
          <button
            onClick={addSet}
            className="w-full flex items-center justify-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white py-3 px-3 rounded-lg transition-colors border-2 border-dashed border-gray-600 hover:border-gray-500"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium text-sm">Add Set</span>
          </button>
        </div>

        {/* Notes Section */}
        <div className="px-4 py-3 border-t border-gray-800">
          <input
            type="text"
            placeholder="Add notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          />
        </div>

        {/* Next Exercise Peeking Card */}
        {currentExerciseIndex < totalExercises - 1 && onNextExercise && (
          <div className="px-4 py-3 border-t border-gray-800">
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium text-sm">Next Exercise</h4>
                  <p className="text-gray-400 text-xs mt-1">Tap to continue</p>
                </div>
                <button
                  onClick={onNextExercise}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Exercise Selector Modal */}
      {showExerciseSelector && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50">
          <div className="bg-gray-900 w-full max-w-sm rounded-t-3xl p-4 max-h-[70vh] overflow-hidden flex flex-col">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-1 bg-gray-600 rounded-full"></div>
            </div>
            
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-white mb-1">
                {exerciseSupersetMode ? 'Choose Superset Exercise' : 'Choose Superset Exercise'}
              </h3>
              <p className="text-gray-400 text-xs">
                {exerciseSupersetMode 
                  ? `Select an exercise to superset with ${exercise.name}`
                  : 'Select a different exercise for your superset'
                }
              </p>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search exercises..."
                value={exerciseSearchTerm}
                onChange={(e) => setExerciseSearchTerm(e.target.value)}
                className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Exercise List */}
            <div className="flex-1 overflow-y-auto space-y-3">
              {/* Current Workout Exercises */}
              {currentWorkoutExercises.length > 0 && (
                <div>
                  <h4 className="text-white font-medium text-sm mb-2 px-1">From This Workout</h4>
                  <div className="space-y-1">
                    {currentWorkoutExercises.map((ex) => (
                      <button
                        key={ex.id}
                        onClick={() => selectSupersetExercise(showExerciseSelector || '', ex.id, ex.name)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-left transition-colors text-sm"
                      >
                        {ex.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Other Exercises */}
              {otherExercises.length > 0 && (
                <div>
                  <h4 className="text-white font-medium text-sm mb-2 px-1">Other Exercises</h4>
                  <div className="space-y-1">
                    {otherExercises.map((ex) => (
                      <button
                        key={ex.id}
                        onClick={() => selectSupersetExercise(showExerciseSelector || '', ex.id, ex.name)}
                        className="w-full bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-left transition-colors text-sm"
                      >
                        {ex.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* No results */}
              {currentWorkoutExercises.length === 0 && otherExercises.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-gray-400 text-sm">No exercises found</p>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setShowExerciseSelector(null);
                setExerciseSearchTerm('');
                setExerciseSupersetMode(false);
              }}
              className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 rounded-lg transition-colors mt-3 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Number Pad Modal */}
      {showNumberPad && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50">
          <div className="bg-gray-900 w-full max-w-sm rounded-t-3xl p-4">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-1 bg-gray-600 rounded-full"></div>
            </div>
            
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-white mb-1">
                {showNumberPad.field === 'weight' ? 'Weight' : 
                 showNumberPad.field === 'reps' ? 'Repetitions' :
                 showNumberPad.field === 'dropWeight' ? 'Drop Weight' : 
                 showNumberPad.field === 'dropReps' ? 'Drop Repetitions' :
                 showNumberPad.field === 'supersetWeight' ? 'Superset Weight' : 'Superset Repetitions'}
              </h3>
              <div className="text-2xl font-bold text-green-400 mb-1">
                {numberPadValue}
              </div>
              <div className="text-gray-400 text-xs">
                {showNumberPad.field.includes('Weight') ? 'kg' : 'reps'}
              </div>
            </div>

            {/* Number Grid */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  onClick={() => updateNumberPadValue(numberPadValue + num.toString())}
                  className="bg-gray-700 hover:bg-gray-600 text-white text-xl font-bold py-3 rounded-lg transition-colors"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => updateNumberPadValue(numberPadValue + '0')}
                className="bg-gray-700 hover:bg-gray-600 text-white text-xl font-bold py-3 rounded-lg transition-colors"
              >
                0
              </button>
              <button
                onClick={() => setNumberPadValue(numberPadValue.slice(0, -1))}
                className="bg-gray-700 hover:bg-gray-700 text-white text-lg font-bold py-3 rounded-lg transition-colors"
              >
                ←
              </button>
              <button
                onClick={closeNumberPad}
                className="bg-red-600 hover:bg-red-700 text-white text-lg font-bold py-3 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <button
              onClick={confirmNumberPadValue}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
