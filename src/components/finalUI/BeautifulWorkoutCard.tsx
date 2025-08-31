import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, Info, MoreVertical, Plus, ChevronDown, ChevronUp, Zap, Search, ChevronLeft, ChevronRight, Mic, Volume2, CheckCircle, Circle, Play, Pause, Flame, TrendingDown, Trash2 } from 'lucide-react';
import { useExerciseDatabase } from '../../../fit-app/src/hooks/useExerciseDatabase';

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
  totalWorkoutSets?: number;
  completedWorkoutSets?: number;
  onSetCompleted?: (exerciseId: string, completedSets: number) => void;
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

export const BeautifulWorkoutCard: React.FC<WorkoutCardProps> = ({
  exercise, onUpdateExercise, onSwapExercise, onSave, onClose,
  currentExerciseIndex = 0, totalExercises = 1, onNextExercise, onPreviousExercise, 
  workoutExercises = [], onSupersetExerciseSelected, totalWorkoutSets = 0, completedWorkoutSets = 0, onSetCompleted
}) => {
  const [sets, setSets] = useState<SetItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [restTimer, setRestTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [showNumberWheel, setShowNumberWheel] = useState<{setId: string, field: 'weight' | 'reps' | 'dropWeight' | 'dropReps' | 'supersetWeight' | 'supersetReps'} | null>(null);
  const [numberWheelValue, setNumberWheelValue] = useState(0);
  
  // Scrollable number state for set cards
  const [scrollableField, setScrollableField] = useState<{setId: string, field: 'weight' | 'reps' | 'dropWeight' | 'dropReps' | 'supersetWeight' | 'supersetReps'} | null>(null);
  const [scrollStartY, setScrollStartY] = useState(0);
  const [scrollStartValue, setScrollStartValue] = useState(0);
  
  const [showSupersetModal, setShowSupersetModal] = useState(false);
  const [supersetExercise, setSupersetExercise] = useState<{id: string, name: string} | null>(null);
  const [supersetSetId, setSupersetSetId] = useState<string | null>(null);
  const [isCardMinimized, setIsCardMinimized] = useState(false);
  const [showEndWorkoutModal, setShowEndWorkoutModal] = useState(false);
  const [showExerciseInfoModal, setShowExerciseInfoModal] = useState(false);
  const [exerciseData, setExerciseData] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [isLoadingExerciseData, setIsLoadingExerciseData] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(60); // 60 second timer
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [supersetSearchQuery, setSupersetSearchQuery] = useState('');
  const [hasActiveDropset, setHasActiveDropset] = useState(false);
  const [showFinishPrompt, setShowFinishPrompt] = useState(false);
  const [firstUnloggedSetId, setFirstUnloggedSetId] = useState<string | null>(null);
  const [highlightSetId, setHighlightSetId] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<{ totalVolume: number; bestSet?: { weight: number; reps: number }; totalSets: number } | null>(null);
  // Weight scroll picker refs
  const weightScrollRef = useRef<HTMLDivElement | null>(null);
  const weightScrollRaf = useRef<number | null>(null);
  const numberInputRef = useRef<HTMLInputElement | null>(null);
  const [numberWheelText, setNumberWheelText] = useState('');

  // Keep scroll centered on the current numeric value for weight fields
  useEffect(() => {
    if (!showNumberWheel || !weightScrollRef.current) return;
    if (!showNumberWheel.field.toLowerCase().includes('weight')) return;
    const itemWidth = 56; // matches w-14
    const index = Math.round(numberWheelValue / 2.5);
    const left = index * itemWidth;
    try {
      weightScrollRef.current.scrollTo({ left, behavior: 'smooth' });
    } catch {
      weightScrollRef.current.scrollLeft = left;
    }
  }, [showNumberWheel, numberWheelValue]);

  // Initialize input text and focus when opening the number wheel
  useEffect(() => {
    if (showNumberWheel) {
      setNumberWheelText(String(numberWheelValue));
      setTimeout(() => numberInputRef.current?.focus(), 0);
    }
  }, [showNumberWheel]);
  
  // Use the existing exercise database hook
  const exerciseDB = useExerciseDatabase();
  
  // Get exercises for superset selection with search functionality
  const getSupersetExercises = () => {
    // If there's a search query, search through all available exercises
    if (supersetSearchQuery.trim()) {
      const searchTerm = supersetSearchQuery.toLowerCase().trim();
      let templateExercises = [];
      let otherExercises = [];
      
      // Search in workout exercises first
      if (workoutExercises && workoutExercises.length > 0) {
        const workoutMatches = workoutExercises
          .filter((ex: any) => {
            const name = (ex.name || ex.exercise?.name || '').toLowerCase();
            return name.includes(searchTerm);
          })
          .map((ex: any, index: number) => ({
            id: ex.id || ex.exerciseId || `workout-${index}`,
            name: ex.name || ex.exercise?.name || `Exercise ${index + 1}`,
            source: 'workout'
          }));
        templateExercises.push(...workoutMatches);
      }
      
      // Search in available exercises (fallback)
      const availableMatches = availableExercises
        .filter((ex) => ex.name.toLowerCase().includes(searchTerm))
        .map((ex) => ({
          ...ex,
          source: 'available'
        }));
      otherExercises.push(...availableMatches);
      
      // Remove duplicates and current exercise
      templateExercises = templateExercises.filter((ex, index, self) => {
        // Remove duplicates
        const isDuplicate = self.findIndex(e => e.name.toLowerCase() === ex.name.toLowerCase()) !== index;
        if (isDuplicate) return false;
        
        // Remove current exercise
        const currentExercise = workoutExercises[currentExerciseIndex];
        const currentName = (currentExercise?.name || currentExercise?.exercise?.name || '').toLowerCase();
        if (ex.name.toLowerCase() === currentName) return false;
        
        return true;
      });
      
      otherExercises = otherExercises.filter((ex) => {
        // Remove exercises that are already in template
        return !templateExercises.some(templateEx => 
          templateEx.name.toLowerCase() === ex.name.toLowerCase()
        );
      });
      
      // Return with separator
      return {
        templateExercises,
        otherExercises,
        hasSeparator: templateExercises.length > 0 && otherExercises.length > 0
      };
    }
    
    // If no search query, show remaining exercises from template + all other exercises
    if (workoutExercises && workoutExercises.length > 0) {
      const remainingExercises = workoutExercises
        .filter((ex: any, index: number) => {
          // Only show exercises that come AFTER the current exercise
          return index > currentExerciseIndex;
        })
        .map((ex: any, index: number) => ({
          id: ex.id || ex.exerciseId || `exercise-${index}`,
          name: ex.name || ex.exercise?.name || `Exercise ${index + 1}`,
          source: 'workout'
        }));
      
      // Get all other exercises (excluding template exercises)
      const otherExercises = availableExercises
        .filter((ex) => {
          // Remove exercises that are already in template
          return !remainingExercises.some(templateEx => 
            templateEx.name.toLowerCase() === ex.name.toLowerCase()
          );
        })
        .map((ex) => ({
          ...ex,
          source: 'available'
        }));
      
      return {
        templateExercises: remainingExercises,
        otherExercises: otherExercises,
        hasSeparator: remainingExercises.length > 0 && otherExercises.length > 0
      };
    }
    
    // Fallback to available exercises if no template
    return {
      templateExercises: [],
      otherExercises: availableExercises.map(ex => ({ ...ex, source: 'available' })),
      hasSeparator: false
    };
  };
  
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

  // Handle escape key to close modals
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showEndWorkoutModal) {
          setShowEndWorkoutModal(false);
        } else if (showSupersetModal) {
          setShowSupersetModal(false);
        } else if (showExerciseInfoModal) {
          setShowExerciseInfoModal(false);
        } else if (showNumberWheel) {
          closeNumberWheel();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showEndWorkoutModal, showSupersetModal, showExerciseInfoModal, showNumberWheel]);

  // Fetch exercise data when modal opens and database is ready
  useEffect(() => {
    console.log('Modal state:', showExerciseInfoModal, 'DB ready:', exerciseDB.ready);
    if (showExerciseInfoModal && exerciseDB.ready) {
      fetchExerciseData();
    }
  }, [showExerciseInfoModal, exerciseDB.ready]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            // Haptic feedback when timer ends
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, restTimer]);

  // Header timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          const newTime = prev - 1;
          
          // Haptic feedback at 10 seconds
          if (newTime === 10) {
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            // Play beep sound
            playBeepSound();
          }
          
          // Haptic feedback and beep at 0 seconds
          if (newTime <= 0) {
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            playBeepSound();
            setIsTimerActive(false);
            return 0;
          }
          
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timerSeconds]);

  // Beep sound function
  const playBeepSound = () => {
    try {
      // Create audio context if it doesn't exist
      if (!(window as any).audioContext) {
        (window as any).audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const audioContext = (window as any).audioContext;
      
      // Resume audio context if suspended (required for mobile)
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.log('Audio not supported:', error);
    }
  };

  // Start timer function
  const startTimer = () => {
    triggerHaptic();
    setTimerSeconds(60); // Reset to 60 seconds
    setIsTimerActive(true);
  };

  // Stop timer function
  const stopTimer = () => {
    triggerHaptic();
    setIsTimerActive(false);
    setTimerSeconds(60);
  };

  // Haptic feedback function
  const triggerHaptic = (pattern: number[] = [50]) => {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  const addSet = () => {
    triggerHaptic();
    const newSet: SetItem = {
      id: `set-${sets.length + 1}`,
      type: 'normal',
      weight: sets.length > 0 ? sets[sets.length - 1].weight : 0, // Smart default
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
    triggerHaptic([100, 50, 100]);
    setSets(sets.filter(set => set.id !== setId));
    setShowDropdown(null);
  };

  const updateSet = (setId: string, updates: Partial<SetItem>) => {
    setSets(prevSets => prevSets.map(s => s.id === setId ? { ...s, ...updates } : s));
  };

  const toggleSetCompletion = (setId: string) => {
    triggerHaptic();
    setSets(sets.map(set => {
      if (set.id === setId) {
        const newCompleted = !set.completed;
        if (newCompleted) {
          // Start rest timer when set is completed
          setRestTimer(exercise.restTime || 90);
          setIsTimerRunning(true);
          
          // Start header timer when set is completed
          setTimerSeconds(60);
          setIsTimerActive(true);
          
          // Check if all sets are completed
          const updatedSets = sets.map(s => s.id === setId ? { ...s, completed: newCompleted } : s);
          const allCompleted = updatedSets.every(s => s.completed);
          
          if (allCompleted) {
            // Celebration effect for milestone
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 2000);
            
            // Auto-show next exercise after 2 seconds
            setTimeout(() => {
              if (onNextExercise) {
                onNextExercise();
              }
            }, 2000);
          }
        }
        
        // Calculate completed sets count and notify parent
        const updatedSets = sets.map(s => s.id === setId ? { ...s, completed: newCompleted } : s);
        const completedSetsCount = updatedSets.filter(s => s.completed).length;
        if (onSetCompleted) {
          onSetCompleted(exercise.id, completedSetsCount);
        }
        
        // Force re-render to update progress rings
        setTimeout(() => {
          setSets([...updatedSets]);
        }, 0);
        
        return { ...set, completed: newCompleted };
      }
      return set;
    }));
  };

  const openNumberWheel = (setId: string, field: 'weight' | 'reps' | 'dropWeight' | 'dropReps' | 'supersetWeight' | 'supersetReps') => {
    triggerHaptic();
    const set = sets.find(s => s.id === setId);
    if (set) {
      let value = 0;
      if (field === 'weight') value = set.weight;
      else if (field === 'reps') value = set.reps;
      else if (field === 'dropWeight') value = set.dropWeight || 0;
      else if (field === 'dropReps') value = set.dropReps || 0;
      else if (field === 'supersetWeight') value = set.supersetWeight || 0;
      else if (field === 'supersetReps') value = set.supersetReps || 0;
      
      setNumberWheelValue(value);
      setShowNumberWheel({ setId, field });
    }
  };

  const closeNumberWheel = () => {
    setShowNumberWheel(null);
  };

  const updateNumberWheelValue = (value: number) => {
    setNumberWheelValue(value);
  };

  const confirmNumberWheelValue = () => {
    if (showNumberWheel) {
      updateSet(showNumberWheel.setId, { [showNumberWheel.field]: numberWheelValue });
      closeNumberWheel();
    }
  };

  // Scrollable number functions for set cards - Mobile Optimized
  const startScrollNumber = (e: React.TouchEvent | React.WheelEvent, setId: string, field: 'weight' | 'reps' | 'dropWeight' | 'dropReps' | 'supersetWeight' | 'supersetReps') => {
    e.preventDefault();
    e.stopPropagation();
    
    // Get current value for this field
    const set = sets.find(s => s.id === setId);
    if (set) {
      let currentValue = 0;
      if (field === 'weight') currentValue = set.weight;
      else if (field === 'reps') currentValue = set.reps;
      else if (field === 'dropWeight') currentValue = set.dropWeight || 0;
      else if (field === 'dropReps') currentValue = set.dropReps || 0;
      else if (field === 'supersetWeight') currentValue = set.supersetWeight || 0;
      else if (field === 'supersetReps') currentValue = set.supersetReps || 0;
      
      setScrollStartValue(currentValue);
      setScrollableField({ setId, field });
    }
  };

  const scrollNumber = (e: React.TouchEvent | React.WheelEvent) => {
    if (!scrollableField) return;
    e.preventDefault();
    e.stopPropagation();
    
    let deltaY = 0;
    
    // Handle both touch and wheel events
    if ('touches' in e) {
      // Touch event (mobile)
      const touch = e.touches[0];
      deltaY = scrollStartY - touch.clientY;
      setScrollStartY(touch.clientY); // Update start position for continuous scrolling
    } else {
      // Wheel event (desktop)
      deltaY = e.deltaY;
    }
    
    const deltaValue = Math.round(deltaY / 15); // 15px = 1 unit for smoother control
    const newValue = Math.max(0, scrollStartValue + deltaValue);
    
    // Update the set directly
    updateSet(scrollableField.setId, { [scrollableField.field]: newValue });
  };



  // Simple scrollable number state
  const [activeScrollField, setActiveScrollField] = useState<{setId: string, field: 'weight' | 'reps' | 'dropWeight' | 'dropReps' | 'supersetWeight' | 'supersetReps'} | null>(null);

  // Handle wheel events for desktop
  const handleWheel = (e: React.WheelEvent, setId: string, field: 'weight' | 'reps' | 'dropWeight' | 'dropReps' | 'supersetWeight' | 'supersetReps') => {
    e.preventDefault();
    e.stopPropagation();
    
    const delta = e.deltaY > 0 ? 1 : -1;
    const set = sets.find(s => s.id === setId);
    if (set) {
      let currentValue = 0;
      if (field === 'weight') currentValue = set.weight;
      else if (field === 'reps') currentValue = set.reps;
      else if (field === 'dropWeight') currentValue = set.dropWeight || 0;
      else if (field === 'dropReps') currentValue = set.dropReps || 0;
      else if (field === 'supersetWeight') currentValue = set.supersetWeight || 0;
      else if (field === 'supersetReps') currentValue = set.supersetReps || 0;
      
      const newValue = Math.max(0, currentValue + delta);
      console.log(`Wheel: ${field} changed from ${currentValue} to ${newValue}`);
      updateSet(setId, { [field]: newValue });
      setActiveScrollField({ setId, field });
      setTimeout(() => setActiveScrollField(null), 1000);
    }
  };

  // Handle touch events for mobile
  const handleTouchStart = (e: React.TouchEvent, setId: string, field: 'weight' | 'reps' | 'dropWeight' | 'dropReps' | 'supersetWeight' | 'supersetReps') => {
    e.preventDefault();
    e.stopPropagation();
    
    const touch = e.touches[0];
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;
    const touchY = touch.clientY;
    
    // Determine if swipe up or down
    const delta = touchY < centerY ? 1 : -1;
    
    const set = sets.find(s => s.id === setId);
    if (set) {
      let currentValue = 0;
      if (field === 'weight') currentValue = set.weight;
      else if (field === 'reps') currentValue = set.reps;
      else if (field === 'dropWeight') currentValue = set.dropWeight || 0;
      else if (field === 'dropReps') currentValue = set.dropReps || 0;
      else if (field === 'supersetWeight') currentValue = set.supersetWeight || 0;
      else if (field === 'supersetReps') currentValue = set.supersetReps || 0;
      
      const newValue = Math.max(0, currentValue + delta);
      console.log(`Touch: ${field} changed from ${currentValue} to ${newValue}`);
      updateSet(setId, { [field]: newValue });
      setActiveScrollField({ setId, field });
      setTimeout(() => setActiveScrollField(null), 1000);
    }
  };

  // Simple click handler for testing
  const handleQuickChange = (setId: string, field: 'weight' | 'reps' | 'dropWeight' | 'dropReps' | 'supersetWeight' | 'supersetReps', direction: 'up' | 'down') => {
    console.log(`🎯 Quick Change called: ${field} ${direction} for set ${setId}`);
    const set = sets.find(s => s.id === setId);
    if (set) {
      let currentValue = 0;
      if (field === 'weight') currentValue = set.weight;
      else if (field === 'reps') currentValue = set.reps;
      else if (field === 'dropWeight') currentValue = set.dropWeight || 0;
      else if (field === 'dropReps') currentValue = set.dropReps || 0;
      else if (field === 'supersetWeight') currentValue = set.supersetWeight || 0;
      else if (field === 'supersetReps') currentValue = set.supersetReps || 0;
      
      const delta = direction === 'up' ? 1 : -1;
      const newValue = Math.max(0, currentValue + delta);
      console.log(`✅ Quick Change: ${field} changed from ${currentValue} to ${newValue}`);
      updateSet(setId, { [field]: newValue });
      setActiveScrollField({ setId, field });
      setTimeout(() => setActiveScrollField(null), 1000);
    } else {
      console.log(`❌ Set not found: ${setId}`);
    }
  };

  const toggleSetExpansion = (setId: string) => {
    triggerHaptic([30]);
    setSets(sets.map(set => 
      set.id === setId ? { ...set, isExpanded: !set.isExpanded } : set
    ));
  };

  const handleSetTypeChange = (setId: string, newType: string) => {
    triggerHaptic();
    console.log(`🎯 Set type changed to: ${newType} for set: ${setId}`);
    
    // Auto-expand for all set types that need additional fields
    if (newType === 'superset') {
      setSupersetSetId(setId);
      setShowSupersetModal(true);
      // Auto-expand set if superset is selected
      setSets(prevSets => prevSets.map(s => 
        s.id === setId ? { ...s, type: newType as any, isExpanded: true } : s
      ));
      setShowDropdown(null);
    } else if (newType === 'dropset') {
      // Auto-expand set if dropset is selected
      console.log(`🟣 Expanding dropset for set: ${setId}`);
      setSets(prevSets => prevSets.map(s => 
        s.id === setId ? { ...s, type: newType as any, isExpanded: true } : s
      ));
      // Maximize the card when dropset is selected
      console.log(`🟣 Maximizing card for dropset`);
      setIsCardMinimized(false);
      // Don't close dropdown for dropset so user can see the + and - controls
    } else if (newType === 'warmup') {
      // Auto-expand set if warmup is selected (for warmup-specific fields)
      setSets(prevSets => prevSets.map(s => 
        s.id === setId ? { ...s, type: newType as any, isExpanded: true } : s
      ));
      setShowDropdown(null);
    } else {
      // For normal sets, update the type and collapse back to compact view
      setSets(prevSets => prevSets.map(s => 
        s.id === setId ? { ...s, type: newType as any, isExpanded: false } : s
      ));
      setShowDropdown(null);
    }
    
    // Log color coding for debugging
    const colorMap = {
      'warmup': '🟡 Yellow',
      'superset': '🔵 Blue', 
      'dropset': '🟣 Purple',
      'normal': '⚪ Gray'
    };
    console.log(`🎨 Color coding: ${colorMap[newType as keyof typeof colorMap]}`);
    
    // Note: removed stale post-update log which read from a closed-over `sets`
  };

  const handleSupersetButton = () => {
    triggerHaptic();
    setShowSupersetModal(true);
  };

  const selectSupersetExercise = (exerciseId: string, exerciseName: string) => {
    setSupersetExercise({ id: exerciseId, name: exerciseName });
    // Apply superset to the specific set that was clicked
    if (supersetSetId) {
      updateSet(supersetSetId, { 
        type: 'superset',
        supersetExercise: exerciseId,
        supersetExerciseName: exerciseName
      });
    }
    setShowSupersetModal(false);
    setSupersetSetId(null);
  };

  const isSetLogged = (set: SetItem) => {
    const baseLogged = (set.weight || 0) > 0 && (set.reps || 0) > 0;
    return baseLogged;
  };

  const computeAnalytics = () => {
    const totalVolume = sets.reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0) + (s.type === 'dropset' ? (s.dropWeight || 0) * (s.dropReps || 0) : 0), 0);
    const best = sets.reduce<{ weight: number; reps: number } | undefined>((best, s) => {
      if ((s.weight || 0) === 0 || (s.reps || 0) === 0) return best;
      if (!best) return { weight: s.weight || 0, reps: s.reps || 0 };
      return s.weight! > best.weight ? { weight: s.weight || 0, reps: s.reps || 0 } : best;
    }, undefined);
    setAnalyticsData({ totalVolume, bestSet: best, totalSets: sets.length });
  };

  const handleFinishClick = () => {
    // find first unlogged set
    const firstUnlogged = sets.find(s => !isSetLogged(s));
    if (firstUnlogged) {
      setFirstUnloggedSetId(firstUnlogged.id);
      setShowFinishPrompt(true);
      return;
    }
    // all logged → finish directly
    computeAnalytics();
    setShowAnalytics(true);
  };

  const gotoFirstUnloggedSet = () => {
    if (!firstUnloggedSetId) return;
    setShowFinishPrompt(false);
    // expand the set and scroll into view
    setSets(prev => prev.map(s => (s.id === firstUnloggedSetId ? { ...s, isExpanded: true } : s)));
    const el = document.getElementById(firstUnloggedSetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setHighlightSetId(firstUnloggedSetId);
    setTimeout(() => setHighlightSetId(null), 2000);
  };

  const confirmFinishAnyway = async () => {
    setShowFinishPrompt(false);
    computeAnalytics();
    setShowAnalytics(true);
    triggerHaptic([60, 40, 60]);
    setIsSaving(true);
    await onSave(exercise);
    setIsSaving(false);
  };

  const allSetsLogged = useMemo(() => sets.every(isSetLogged), [sets]);

  const fetchExerciseData = async () => {
    setIsLoadingExerciseData(true);
    
    try {
      console.log('Fetching real exercise data for:', exercise.name);
      console.log('Database ready state:', exerciseDB.ready);
      
      // Wait for database to be ready
      if (!exerciseDB.ready) {
        console.log('Database not ready yet, waiting...');
        return;
      }
      
      // 0) Try external API first (env-driven, then RapidAPI ExerciseDB)
      const extFromEnv = async (q: string) => {
        try {
          const base = (import.meta as any)?.env?.VITE_EXERCISE_API_URL as string | undefined;
          const apiKey = (import.meta as any)?.env?.VITE_EXERCISE_API_KEY as string | undefined;
          const header = (import.meta as any)?.env?.VITE_EXERCISE_API_KEY_HEADER || 'Authorization';
          if (!base) return null;
          const url = `${base.replace(/\/$/, '')}/search?name=${encodeURIComponent(q)}`;
          const res = await fetch(url, { headers: apiKey ? { [header]: apiKey } : {} });
          if (!res.ok) return null;
          const data = await res.json();
          const item = Array.isArray(data) ? data[0] : data?.results?.[0] || data;
          if (!item) return null;
          return {
            id: item.id || item._id || q,
            name: item.name || q,
            primaryMuscles: item.primaryMuscles || item.targetMuscles || item.muscles || [],
            secondaryMuscles: item.secondaryMuscles || item.synergists || [],
            equipment: item.equipment ? (Array.isArray(item.equipment) ? item.equipment : [item.equipment]) : [],
            difficulty: item.difficulty || 'unknown',
            gifUrl: item.gifUrl || item.gif || item.image || item.imageUrl,
            imageUrl: item.imageUrl || item.image || item.thumbnail,
            instructions: item.instructions || item.tips || []
          } as any;
        } catch { return null; }
      };

      const extFromRapid = async (q: string) => {
        try {
          const key = (import.meta as any)?.env?.VITE_RAPIDAPI_KEY as string | undefined;
          const host = 'exercisedb.p.rapidapi.com';
          if (!key) return null;
          const url = `https://${host}/exercises/name/${encodeURIComponent(q)}`;
          const res = await fetch(url, { headers: { 'X-RapidAPI-Key': key, 'X-RapidAPI-Host': host } });
          if (!res.ok) return null;
          const arr = await res.json();
          const item = Array.isArray(arr) ? arr[0] : null;
          if (!item) return null;
          return {
            id: item.id?.toString() || q,
            name: item.name || q,
            primaryMuscles: [item.target].filter(Boolean),
            secondaryMuscles: [item.secondaryMuscles].filter(Boolean).flat(),
            equipment: [item.equipment].filter(Boolean),
            difficulty: 'unknown',
            gifUrl: item.gifUrl,
            imageUrl: item.image || item.gifUrl,
            instructions: []
          } as any;
        } catch { return null; }
      };

      let external = await extFromEnv(exercise.name);
      if (!external) external = await extFromRapid(exercise.name);

      if (external) {
        setExerciseData(external as any);
      }

      // 1) Search by exact name in local DB
      console.log('Searching for exercise:', exercise.name);
      const searchResults = await exerciseDB.searchByName(exercise.name);
      console.log('Database search results:', searchResults);
      console.log('Number of results:', searchResults.length);
      
      // Test search to see if database has any data
      if (searchResults.length === 0) {
        console.log('No results found, testing with "squat"');
        const testResults = await exerciseDB.searchByName('squat');
        console.log('Test search results for "squat":', testResults);
        
        // Also test with "box squat" which we know exists
        console.log('Testing with "box squat"');
        const boxSquatResults = await exerciseDB.searchByName('box squat');
        console.log('Box squat results:', boxSquatResults);
        
        // Test with "barbell" to see if database has data
        console.log('Testing with "barbell"');
        const barbellResults = await exerciseDB.searchByName('barbell');
        console.log('Barbell results:', barbellResults);
      }
      
      let exerciseRecord = searchResults[0];
      
      // If no exact match found, try to find similar exercises
      if (!exerciseRecord && searchResults.length > 0) {
        exerciseRecord = searchResults.find(ex => 
          ex.name.toLowerCase().includes(exercise.name.toLowerCase()) ||
          exercise.name.toLowerCase().includes(ex.name.toLowerCase())
        ) || searchResults[0];
      }
      
      // Fallback: try by primary muscle or equipment if still not found
      if (!exerciseRecord && !external) {
        const primary = (exercise as any).primaryMuscles?.[0] || (exercise as any).muscleGroup || '';
        const equip = (exercise as any).equipment?.[0] || '';
        let byMuscle: any[] = [];
        let byEquip: any[] = [];
        if (primary) {
          try { byMuscle = await exerciseDB.searchByMuscle(primary); } catch {}
        }
        if (equip) {
          try { byEquip = await exerciseDB.searchByEquipment(equip); } catch {}
        }
        const merged = [...byMuscle, ...byEquip];
        exerciseRecord = merged.find((e: any) => e.gifUrl) || merged[0];
      }

      if (exerciseRecord && !external) {
        console.log('Found exercise record:', exerciseRecord);
        setExerciseData(exerciseRecord);
        
        // Get real performance data from localStorage or show empty state
        const getPerformanceData = () => {
          const savedProgress = localStorage.getItem(`progress_${exerciseRecord.id}`);
          if (savedProgress) {
            try {
              const parsed = JSON.parse(savedProgress);
              return {
                maxWeight: parsed.maxWeight || 0,
                bestReps: parsed.bestReps || 0,
                progress: parsed.progress || 0,
                weightHistory: parsed.weightHistory || [0, 0, 0, 0, 0, 0, 0, 0, 0],
                lastWorkout: parsed.lastUpdated || 'Never'
              };
            } catch (e) {
              console.error('Error parsing saved progress:', e);
            }
          }
          
          // Return empty state if no saved data
          return {
            maxWeight: 0,
            bestReps: 0,
            progress: 0,
            weightHistory: [0, 0, 0, 0, 0, 0, 0, 0, 0],
            lastWorkout: 'Never'
          };
        };
        
        setPerformanceData(getPerformanceData());
      } else if (!external) {
        console.log('No exercise found in database for:', exercise.name);
        // Set empty state - no demo data
        setExerciseData(null);
        setPerformanceData({
          maxWeight: 0,
          bestReps: 0,
          progress: 0,
          weightHistory: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          lastWorkout: 'Never'
        });
      }
      
    } catch (error) {
      console.error('Error fetching exercise data:', error);
      // Set empty state on error
      setExerciseData(null);
      setPerformanceData({
        maxWeight: 0,
        bestReps: 0,
        progress: 0,
        weightHistory: [0, 0, 0, 0, 0, 0, 0, 0, 0],
        lastWorkout: 'Never'
      });
    } finally {
      setIsLoadingExerciseData(false);
    }
  };

  const completedSets = sets.filter(set => set.completed).length;
  const setProgress = sets.length > 0 ? completedSets / sets.length : 0;
  
  // Calculate overall workout progress based on total workout completion (clamped to 100%)
  const overallWorkoutProgress = Math.min(1, totalWorkoutSets > 0 ? completedWorkoutSets / totalWorkoutSets : 0);
  
  // Calculate exercise progress based on current exercise sets (clamped to 100%)
  const exerciseProgress = Math.min(1, setProgress);
  
  // Update progress when sets change
  useEffect(() => {
    const completedSets = sets.filter(set => set.completed).length;
    const setProgress = sets.length > 0 ? completedSets / sets.length : 0;
    
    // Check if any set is dropset and update state
    const hasDropset = sets.some(set => set.type === 'dropset');
    setHasActiveDropset(hasDropset);
    
    // Force card to be maximized if dropset is active
    if (hasDropset) {
      setIsCardMinimized(false);
    }
    
    // Debug logging
    console.log('Progress Updated:', {
      completedSets,
      totalSets: sets.length,
      setProgress,
      totalWorkoutSets,
      completedWorkoutSets,
      overallWorkoutProgress: Math.min(1, totalWorkoutSets > 0 ? completedWorkoutSets / totalWorkoutSets : 0),
      exerciseProgress: Math.min(1, setProgress),
      hasDropset
    });
  }, [sets, totalWorkoutSets, completedWorkoutSets]);

  return (
    <div className={`fixed inset-0 flex items-end justify-center z-40 transition-all duration-500 overflow-y-auto overscroll-contain pointer-events-none ${
      isCardMinimized 
        ? 'bg-transparent' 
        : 'bg-gradient-to-br from-black/80 via-purple-900/20 to-blue-900/20 backdrop-blur-sm'
    }`}>
      {/* Celebration Effect */}
      {showCelebration && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="animate-ping">
            <div className="w-32 h-32 bg-gradient-to-r from-green-400 to-blue-500 rounded-full opacity-20"></div>
          </div>
        </div>
      )}

      {/* Finish Warning Modal */}
      {showFinishPrompt && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 w-full max-w-sm rounded-2xl p-6 backdrop-blur-xl border border-white/10">
            <h3 className="text-xl font-bold text-white mb-2">Finish Workout?</h3>
            <p className="text-gray-300 text-sm mb-4">Some sets are not logged yet. Do you still want to finish your workout?</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={gotoFirstUnloggedSet} className="bg-white/10 hover:bg-white/20 text-white text-sm font-medium py-3 rounded-xl transition-all">Go finish</button>
              <button onClick={confirmFinishAnyway} className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm font-medium py-3 rounded-xl transition-all">Finish anyway</button>
            </div>
            <button onClick={() => setShowFinishPrompt(false)} className="mt-3 w-full text-gray-400 text-xs">Cancel</button>
          </div>
        </div>
      )}

      {/* Analytics Summary Modal */}
      {showAnalytics && analyticsData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative bg-gradient-to-br from-gray-900/95 to-gray-800/95 w-full max-w-sm rounded-2xl p-6 backdrop-blur-xl border border-white/10 text-white overflow-hidden">
            {/* Inline keyframes for fancy celebration */}
            <style>{`
              @keyframes confettiFall { from { transform: translateY(-100vh) rotate(0deg); } to { transform: translateY(100vh) rotate(360deg); } }
              @keyframes popIn { 0% { transform: scale(0.85); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
              @keyframes shine { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
            `}</style>
            {/* Confetti */}
            <div className="pointer-events-none absolute inset-0">
              {Array.from({ length: 24 }).map((_, i) => {
                const colors = ['#22c55e','#f59e0b','#8b5cf6','#ef4444','#06b6d4'];
                const left = (i * 100 / 24);
                const delay = (i % 8) * 0.15;
                const duration = 3 + (i % 5) * 0.3;
                const bg = colors[i % colors.length];
                return (
                  <span key={i} style={{
                    position: 'absolute', left: `${left}%`, top: '-10%', width: '8px', height: '12px',
                    background: bg, borderRadius: '2px', opacity: 0.9,
                    transform: 'translateY(-100vh)',
                    animation: `confettiFall ${duration}s linear ${delay}s forwards`
                  }} />
                );
              })}
            </div>
            {/* Header with animated check */}
            <div className="text-center mb-6 relative animate-[popIn_300ms_ease-out]">
              <div className="relative mx-auto mb-3 w-16 h-16 rounded-full bg-green-500/20 border border-green-400/40 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-green-400/40 animate-ping" />
                <div className="absolute inset-0 rounded-full blur-xl bg-green-500/20" />
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9 text-green-400">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h3 className="text-2xl font-extrabold bg-gradient-to-r from-green-400 via-white to-green-400 bg-clip-text text-transparent" style={{ backgroundSize: '200% 100%', animation: 'shine 1.8s linear infinite' }}>Workout Complete!</h3>
              <p className="text-gray-300 text-sm">Great job pushing through today.</p>
            </div>
            <div className="rounded-xl border border-white/10 p-4 bg-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300">Total Volume</span>
                <span className="font-semibold">{Math.round(analyticsData.totalVolume)} kg</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Best Set</span>
                <span className="font-semibold">{analyticsData.bestSet ? `${analyticsData.bestSet.weight} kg × ${analyticsData.bestSet.reps}` : '—'}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button onClick={() => { setShowAnalytics(false); }} className="bg-white/10 hover:bg-white/20 text-white text-sm font-medium py-3 rounded-xl transition-all">Close</button>
              <button onClick={async () => { setShowAnalytics(false); setIsSaving(true); await onSave(exercise); setIsSaving(false); }} className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm font-medium py-3 rounded-xl transition-all">Save Summary</button>
            </div>
          </div>
        </div>
      )}

      <div 
        className={`bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 backdrop-blur-xl w-full max-w-md sm:max-w-lg md:max-w-xl rounded-t-3xl overflow-y-hidden flex flex-col border border-white/10 shadow-2xl transition-all duration-500 ease-in-out relative pointer-events-auto ${
          isCardMinimized ? 'h-40' : 'h-[85vh] sm:h-[90vh]'
        }`}
      >

        {/* Full-Width Minimized Card with Progress Rings */}
        <div className="group touch-manipulation">
          <div className="relative w-full">
                    {/* Full-Width Minimized Card */}
        <div 
          className={`w-full transition-all duration-500 ${
            isCardMinimized && !hasActiveDropset ? 'h-56 opacity-100 z-[200] fixed bottom-12 left-0 right-0' : 'h-0 opacity-0 overflow-hidden'
          }`}
          style={{
            display: hasActiveDropset ? 'none' : 'block',
            pointerEvents: hasActiveDropset ? 'none' : 'auto'
          }}
        >
                          <div 
                  onClick={hasActiveDropset ? undefined : () => {
                    if (!showExerciseInfoModal && !showSupersetModal && !showEndWorkoutModal && !showDropdown) {
                      triggerHaptic();
                      setIsCardMinimized(!isCardMinimized);
                    }
                  }}
                  className={`w-full h-full bg-gradient-to-r from-gray-900/95 to-gray-800/95 backdrop-blur-xl border-b border-white/10 flex flex-col relative transition-colors ${
                    hasActiveDropset ? '' : 'cursor-pointer hover:bg-gray-800/90'
                  }`}
                >
                  {/* Animated Timer Background - Same as Maximized Card */}
                  {isTimerActive && (
                    <div 
                      className={`absolute inset-0 transition-all duration-1000 ${
                        timerSeconds <= 10 ? 'bg-red-500/10' : 
                        timerSeconds <= 30 ? 'bg-yellow-500/10' : 
                        'bg-green-500/10'
                      }`}
                      style={{ 
                        clipPath: `inset(0 ${100 - ((timerSeconds / 60) * 100)}% 0 0)`,
                        transition: 'clip-path 1s linear, background-color 0.3s ease'
                      }}
                    ></div>
                  )}
                  {/* Main Content - Adjusted Spacing */}
                  <div className="flex items-center justify-between px-6 py-6 absolute bottom-4 left-0 right-0">

                  {/* Left: Close Button + Workout Progress Ring */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic();
                      setShowEndWorkoutModal(true);
                    }}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-300 backdrop-blur-sm"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                  
                  <div className="relative">
                    <svg className="w-12 h-12 transform -rotate-90">
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="transparent"
                        className="text-gray-700"
                      />
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke="#10B981"
                        strokeWidth="3"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 20}`}
                        strokeDashoffset={`${2 * Math.PI * 20 * (1 - overallWorkoutProgress)}`}
                        className="transition-all duration-1000 ease-out"
                        style={{ 
                          strokeDashoffset: `${2 * Math.PI * 20 * (1 - overallWorkoutProgress)}`,
                          strokeDasharray: `${2 * Math.PI * 20}`
                        }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{Math.round(overallWorkoutProgress * 100)}%</span>
                    </div>
                  </div>
                  
                  <div className="text-left">
                    <div className="text-white/80 text-sm font-medium">Workout Progress</div>
                    <div className="text-gray-400 text-xs">{completedWorkoutSets} of {totalWorkoutSets} sets</div>
                  </div>
                </div>



                {/* Right: Exercise Progress Ring */}
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-white/80 text-sm font-medium">Exercise Progress</div>
                    <div className="text-gray-400 text-xs">({currentExerciseIndex + 1}/{totalExercises})</div>
                  </div>
                  <div className="relative">
                    <svg className="w-12 h-12 transform -rotate-90">
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="transparent"
                        className="text-gray-700"
                      />
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke="#3B82F6"
                        strokeWidth="3"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 20}`}
                        strokeDashoffset={`${2 * Math.PI * 20 * (1 - exerciseProgress)}`}
                        className="transition-all duration-1000 ease-out"
                        style={{ 
                          strokeDashoffset: `${2 * Math.PI * 20 * (1 - exerciseProgress)}`,
                          strokeDasharray: `${2 * Math.PI * 20}`
                        }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{Math.round(exerciseProgress * 100)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Gradients */}
            <svg className="absolute w-0 h-0">
              <defs>
                <linearGradient id="workoutProgressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="exerciseProgressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#1D4ED8" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

        {/* Header with Glassmorphism */}
        <div className={`px-6 pt-6 pb-4 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent transition-all duration-500 relative overflow-hidden ${
          isCardMinimized ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`} 
          onClick={(e) => {
            // Allow tapping the top progress/header to minimize the card
            if (hasActiveDropset) return; // disable when dropset is active
            if (showExerciseInfoModal || showSupersetModal || showEndWorkoutModal || showDropdown) return;
            triggerHaptic();
            setIsCardMinimized(true);
          }}
        >
          {/* Background that changes color based on timer - covers header section */}
          <div 
            className={`absolute inset-0 rounded-t-3xl transition-all duration-1000 ${
              timerSeconds <= 10 ? 'bg-red-500/10' : 
              timerSeconds <= 30 ? 'bg-yellow-500/10' : 
              'bg-green-500/10'
            }`}
            style={{ 
              clipPath: `inset(0 ${100 - ((timerSeconds / 60) * 100)}% 0 0)`,
              transition: 'clip-path 1s linear, background-color 0.3s ease'
            }}
          ></div>
          {/* Exercise Name */}

          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {exercise.name}
                </h2>
                <button
                  onClick={async (e) => {
                    e.stopPropagation(); // Prevent card minimization
                    triggerHaptic();
                    setShowExerciseInfoModal(true);
                    // fetchExerciseData will be called by useEffect when modal opens
                  }}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-300 backdrop-blur-sm"
                >
                  <Info className="w-4 h-4 text-white" />
                </button>
              </div>
              
              {/* Timer Progress Bar - Compact */}
              {timerSeconds > 0 && (
                <div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-white text-sm">Timer</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-white">
                      {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
                    </span>
                    <button
                      onClick={() => setIsTimerActive(!isTimerActive)}
                      className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300"
                    >
                      {isTimerActive ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dual Progress Rings - Same as Minimized */}
          <div className="flex items-center justify-between">
            {/* Left: Workout Progress Ring */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className="text-gray-700"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="url(#workoutProgressGradient)"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - overallWorkoutProgress)}`}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">{Math.round(overallWorkoutProgress * 100)}%</span>
                </div>
              </div>
                                <div className="text-left">
                    <div className="text-white/80 text-sm font-medium">Workout Progress</div>
                    <div className="text-gray-400 text-xs">{completedWorkoutSets} of {totalWorkoutSets} sets</div>
                  </div>
            </div>

            {/* Right: Exercise Progress Ring */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-white/80 text-sm font-medium">Exercise Progress</div>
                <div className="text-gray-400 text-xs">({currentExerciseIndex + 1}/{totalExercises})</div>
              </div>
              <div className="relative">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className="text-gray-700"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="url(#exerciseProgressGradient)"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - exerciseProgress)}`}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">{Math.round(exerciseProgress * 100)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sets List with Glassmorphism Cards */}
        <div className={`flex-1 px-3 sm:px-6 py-4 pb-24 space-y-3 overflow-y-auto overscroll-contain touch-pan-y scroll-smooth transition-all duration-500 ${
          isCardMinimized ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
        }`} style={{ WebkitOverflowScrolling: 'touch' }}>
          
          {/* Mobile Instructions - removed */}
          {/* Debug Test Button - removed */}
          
          {/* Active Scroll Indicator removed by request */}
          {sets.map((set, index) => {
            // Debug logging for color coding
            console.log(`🎨 Set ${index + 1}: type=${set.type}, expanded=${set.isExpanded}, completed=${set.completed}`);
            
            // Debug: Check if dropset fields exist
            if (set.type === 'dropset') {
              console.log(`🟣 Dropset fields for set ${index + 1}:`, {
                dropWeight: set.dropWeight,
                dropReps: set.dropReps,
                isExpanded: set.isExpanded
              });
            }
            
            return (
            <div 
              key={set.id} 
              id={set.id}
              onClick={set.isExpanded ? undefined : () => toggleSetExpansion(set.id)}
              title={`Set ${index + 1}: ${set.type} (expanded: ${set.isExpanded})`}
              className={`relative group rounded-xl border overflow-visible backdrop-blur-sm transition-all duration-300 ${
                set.completed 
                  ? 'bg-gradient-to-br from-green-700/30 to-green-800/30 border-green-600/30 shadow-green-400/10' 
                  : set.type === 'warmup'
                    ? 'bg-gradient-to-br from-yellow-600/25 to-yellow-700/25 border-yellow-400/40 shadow-yellow-400/10'
                    : set.type === 'superset'
                      ? 'bg-gradient-to-br from-blue-700/30 to-blue-800/30 border-blue-600/30 shadow-blue-400/10'
                      : set.type === 'dropset'
                        ? 'bg-gradient-to-br from-purple-700/30 to-purple-800/30 border-purple-600/30 shadow-purple-400/10'
                        : 'bg-gradient-to-br from-gray-700/50 to-gray-800/50 border-gray-600/30 shadow-gray-400/10'
              } ${
                set.isExpanded ? 'p-4' : 'px-3 py-3 sm:p-4'
              } ${set.isExpanded ? '' : 'hover:scale-[1.01] cursor-pointer'} ${showDropdown === set.id ? 'z-40' : 'z-10'} ${highlightSetId === set.id ? 'ring-2 ring-green-500/70' : ''}`}
            >
              {/* Compact Set Row */}
              {!set.isExpanded && (
                <div className="flex items-center justify-between">
                  {/* Left: Set Number & Completion */}
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card expansion
                        toggleSetCompletion(set.id);
                      }}
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                        set.completed 
                          ? 'bg-gradient-to-r from-green-400 to-green-600 shadow-lg shadow-green-500/25' 
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      {set.completed ? (
                        <CheckCircle className="w-4 h-4 text-white" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-medium text-sm">Set {index + 1}</span>
                      {set.type === 'warmup' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">Warmup Set</span>
                      )}
                      {/* Removed colored dot next to set type */}
                      {/* Debug indicator */}
                      
                    </div>
                  </div>

                  {/* Center: Weight & Reps */}
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card expansion
                          handleQuickChange(set.id, 'weight', 'down');
                        }}
                        className="w-6 h-6 bg-red-500/30 hover:bg-red-500/50 text-red-300 rounded text-xs font-bold flex items-center justify-center shadow-lg shadow-red-500/20"
                      >
                        -
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card expansion
                          openNumberWheel(set.id, 'weight');
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation(); // Prevent card expansion
                          handleTouchStart(e, set.id, 'weight');
                        }}
                        onWheel={(e) => {
                          e.stopPropagation(); // Prevent card expansion
                          handleWheel(e, set.id, 'weight');
                        }}
                        className={`px-3 py-2 rounded-lg text-center transition-all duration-300 backdrop-blur-sm min-w-[60px] touch-manipulation select-none ${
                          activeScrollField?.setId === set.id && activeScrollField?.field === 'weight'
                            ? 'bg-blue-500/30 border-2 border-blue-400'
                            : 'bg-white/10 hover:bg-white/20'
                        }`}
                      >
                        <div className="text-lg font-bold">{set.weight}</div>
                        <div className="text-xs text-gray-400">kg</div>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card expansion
                          handleQuickChange(set.id, 'weight', 'up');
                        }}
                        className="w-6 h-6 bg-green-500/30 hover:bg-green-500/50 text-green-300 rounded text-xs font-bold flex items-center justify-center shadow-lg shadow-green-500/20"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card expansion
                          handleQuickChange(set.id, 'reps', 'down');
                        }}
                        className="w-6 h-6 bg-red-500/30 hover:bg-red-500/50 text-red-300 rounded text-xs font-bold flex items-center justify-center shadow-lg shadow-red-500/20"
                      >
                        -
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card expansion
                          openNumberWheel(set.id, 'reps');
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation(); // Prevent card expansion
                          handleTouchStart(e, set.id, 'reps');
                        }}
                        onWheel={(e) => {
                          e.stopPropagation(); // Prevent card expansion
                          handleWheel(e, set.id, 'reps');
                        }}
                        className={`px-3 py-2 rounded-lg text-center transition-all duration-300 backdrop-blur-sm min-w-[60px] touch-manipulation select-none ${
                          activeScrollField?.setId === set.id && activeScrollField?.field === 'reps'
                            ? 'bg-blue-500/30 border-2 border-blue-400'
                            : 'bg-white/10 hover:bg-white/20'
                        }`}
                      >
                        <div className="text-lg font-bold">{set.reps}</div>
                        <div className="text-xs text-gray-400">
                          {set.type === 'warmup' ? 'reps • Warmup' : 
                           set.type === 'dropset' ? 'reps • Dropset' : 
                           set.type === 'superset' ? 'reps • Superset' : 'reps'}
                        </div>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card expansion
                          handleQuickChange(set.id, 'reps', 'up');
                        }}
                        className="w-6 h-6 bg-green-500/30 hover:bg-green-500/50 text-green-300 rounded text-xs font-bold flex items-center justify-center shadow-lg shadow-green-500/20"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Dropset Fields - Only show in compact view for dropset */}
                  {set.type === 'dropset' && (
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card expansion
                            handleQuickChange(set.id, 'dropWeight', 'down');
                          }}
                          className="w-6 h-6 bg-red-500/30 hover:bg-red-500/50 text-red-300 rounded text-xs font-bold flex items-center justify-center shadow-lg shadow-red-500/20"
                        >
                          -
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card expansion
                            openNumberWheel(set.id, 'dropWeight');
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation(); // Prevent card expansion
                            handleTouchStart(e, set.id, 'dropWeight');
                          }}
                          onWheel={(e) => {
                            e.stopPropagation(); // Prevent card expansion
                            handleWheel(e, set.id, 'dropWeight');
                          }}
                          className={`px-3 py-2 rounded-lg text-center transition-all duration-300 backdrop-blur-sm min-w-[60px] touch-manipulation select-none ${
                            activeScrollField?.setId === set.id && activeScrollField?.field === 'dropWeight'
                              ? 'bg-purple-500/30 border-2 border-purple-400'
                              : 'bg-purple-500/20 hover:bg-purple-500/30'
                          }`}
                        >
                          <div className="text-lg font-bold">{set.dropWeight || 0}</div>
                          <div className="text-xs text-purple-200">Weight</div>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card expansion
                            handleQuickChange(set.id, 'dropWeight', 'up');
                          }}
                          className="w-6 h-6 bg-green-500/30 hover:bg-green-500/50 text-green-300 rounded text-xs font-bold flex items-center justify-center shadow-lg shadow-green-500/20"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card expansion
                            handleQuickChange(set.id, 'dropReps', 'down');
                          }}
                          className="w-6 h-6 bg-red-500/30 hover:bg-red-500/50 text-red-300 rounded text-xs font-bold flex items-center justify-center shadow-lg shadow-red-500/20"
                        >
                          -
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card expansion
                            openNumberWheel(set.id, 'dropReps');
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation(); // Prevent card expansion
                            handleTouchStart(e, set.id, 'dropReps');
                          }}
                          onWheel={(e) => {
                            e.stopPropagation(); // Prevent card expansion
                            handleWheel(e, set.id, 'dropReps');
                          }}
                          className={`px-3 py-2 rounded-lg text-center transition-all duration-300 backdrop-blur-sm min-w-[60px] touch-manipulation select-none ${
                            activeScrollField?.setId === set.id && activeScrollField?.field === 'dropReps'
                              ? 'bg-purple-500/30 border-2 border-purple-400'
                              : 'bg-purple-500/20 hover:bg-purple-500/30'
                          }`}
                        >
                          <div className="text-lg font-bold">{set.dropReps || 0}</div>
                          <div className="text-xs text-purple-200">Reps</div>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card expansion
                            handleQuickChange(set.id, 'dropReps', 'up');
                          }}
                          className="w-6 h-6 bg-green-500/30 hover:bg-green-500/50 text-green-300 rounded text-xs font-bold flex items-center justify-center shadow-lg shadow-green-500/20"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Right: Controls */}
                  <div className="flex items-center space-x-2">
                    {/* Options Menu */}
                    <div className="relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card expansion
                          setShowDropdown(showDropdown === set.id ? null : set.id);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300"
                      >
                        <MoreVertical className="w-4 h-4 text-white" />
                      </button>

                      {showDropdown === set.id && (
                        <div className="absolute right-0 top-8 bg-gray-800/90 backdrop-blur-xl rounded-lg shadow-2xl border border-white/10 min-w-40 z-50">
                          <div className="py-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleSetTypeChange(set.id, 'normal'); }}
                              className="w-full px-3 py-2 text-left text-white hover:bg-white/10 flex items-center space-x-2 text-xs transition-colors"
                            >
                              <Circle className="w-4 h-4" />
                              <span>Normal</span>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleSetTypeChange(set.id, 'warmup'); }}
                              className="w-full px-3 py-2 text-left text-white hover:bg-yellow-500/20 flex items-center space-x-2 text-xs transition-colors"
                            >
                              <Flame className="w-4 h-4" />
                              <span>Warmup</span>
                            </button>
                            <div className="px-3 py-2">
                              <div 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetTypeChange(set.id, 'dropset');
                                }}
                                className="flex items-center space-x-2 text-xs text-white hover:bg-purple-500/20 px-2 py-1 rounded cursor-pointer transition-colors"
                              >
                                <TrendingDown className="w-4 h-4" />
                                <span>Dropset</span>
                              </div>
                              {set.type === 'dropset' && (
                                <div className="space-y-2 mt-2">
                                  <div className="flex items-center space-x-1">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleQuickChange(set.id, 'dropWeight', 'down');
                                      }}
                                      className="w-5 h-5 bg-red-500/30 hover:bg-red-500/50 text-red-300 rounded text-xs font-bold flex items-center justify-center"
                                    >
                                      -
                                    </button>
                                    <span className="text-xs text-gray-300 min-w-[30px] text-center">{set.dropWeight || 0}</span>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleQuickChange(set.id, 'dropWeight', 'up');
                                      }}
                                      className="w-5 h-5 bg-green-500/30 hover:bg-green-500/50 text-green-300 rounded text-xs font-bold flex items-center justify-center"
                                    >
                                      +
                                    </button>
                                    <span className="text-xs text-gray-400">Weight</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleQuickChange(set.id, 'dropReps', 'down');
                                      }}
                                      className="w-5 h-5 bg-red-500/30 hover:bg-red-500/50 text-red-300 rounded text-xs font-bold flex items-center justify-center"
                                    >
                                      -
                                    </button>
                                    <span className="text-xs text-gray-300 min-w-[30px] text-center">{set.dropReps || 0}</span>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleQuickChange(set.id, 'dropReps', 'up');
                                      }}
                                      className="w-5 h-5 bg-green-500/30 hover:bg-green-500/50 text-green-300 rounded text-xs font-bold flex items-center justify-center"
                                    >
                                      +
                                    </button>
                                    <span className="text-xs text-gray-400">Reps</span>
                                  </div>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleSetTypeChange(set.id, 'superset'); }}
                              className="w-full px-3 py-2 text-left text-white hover:bg-blue-500/20 flex items-center space-x-2 text-xs transition-colors"
                            >
                              <Zap className="w-4 h-4" />
                              <span>Superset</span>
                            </button>
                            <div className="border-t border-white/10 my-1"></div>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteSet(set.id); }}
                              className="w-full px-3 py-2 text-left text-red-400 hover:bg-red-500/20 flex items-center space-x-2 text-xs transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>


                </div>
              )}

              {/* Expanded View */}
              {set.isExpanded && (
                <div className="space-y-4">
                  {/* Expanded Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => toggleSetCompletion(set.id)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                          set.completed 
                            ? 'bg-gradient-to-r from-green-400 to-green-600 shadow-lg shadow-green-500/25' 
                            : 'bg-white/10 hover:bg-white/20'
                        }`}
                      >
                        {set.completed ? (
                          <CheckCircle className="w-5 h-5 text-white" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      <div>
                        <h3 className="text-white font-semibold text-lg">Set {index + 1}</h3>
                        {set.type !== 'normal' && (
                          <span className={`text-xs px-3 py-1 rounded-full flex items-center space-x-2 mt-1 ${
                            set.type === 'warmup' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 
                            set.type === 'dropset' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 
                            'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {set.type === 'warmup' ? (
                              <>
                                <Flame className="w-4 h-4" />
                                <span>Warmup Set</span>
                              </>
                            ) : set.type === 'dropset' ? (
                              <>
                                <TrendingDown className="w-4 h-4" />
                                <span>Dropset</span>
                              </>
                            ) : (
                              <>
                                <Zap className="w-4 h-4" />
                                <span>Superset</span>
                              </>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Options Menu (also visible in expanded view) */}
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDropdown(showDropdown === set.id ? null : set.id);
                          }}
                          className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300"
                        >
                          <MoreVertical className="w-4 h-4 text-white" />
                        </button>

                        {showDropdown === set.id && (
                          <div className="absolute right-0 top-8 bg-gray-800/90 backdrop-blur-xl rounded-lg shadow-2xl border border-white/10 min-w-40 z-50">
                            <div className="py-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleSetTypeChange(set.id, 'normal'); }}
                                className="w-full px-3 py-2 text-left text-white hover:bg-white/10 flex items-center space-x-2 text-xs transition-colors"
                              >
                                <Circle className="w-4 h-4" />
                                <span>Normal</span>
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleSetTypeChange(set.id, 'warmup'); }}
                                className="w-full px-3 py-2 text-left text-white hover:bg-yellow-500/20 flex items-center space-x-2 text-xs transition-colors"
                              >
                                <Flame className="w-4 h-4" />
                                <span>Warmup</span>
                              </button>
                              <div className="px-3 py-2">
                                <div 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSetTypeChange(set.id, 'dropset');
                                  }}
                                  className="flex items-center space-x-2 text-xs text-white hover:bg-purple-500/20 px-2 py-1 rounded cursor-pointer transition-colors"
                                >
                                  <TrendingDown className="w-4 h-4" />
                                  <span>Dropset</span>
                                </div>
                              </div>
                              <button
                                onClick={() => handleSetTypeChange(set.id, 'superset')}
                                className="w-full px-3 py-2 text-left text-white hover:bg-blue-500/20 flex items-center space-x-2 text-xs transition-colors"
                              >
                                <Zap className="w-4 h-4" />
                                <span>Superset</span>
                              </button>
                              <div className="border-t border-white/10 my-1"></div>
                              <button
                                onClick={() => deleteSet(set.id)}
                                className="w-full px-3 py-2 text-left text-red-400 hover:bg-red-500/20 flex items-center space-x-2 text-xs transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <div className="space-y-4">
                    {/* Main Set - Only show if not superset */}
                    {set.type !== 'superset' && (
                      <div className="space-y-3">
                        <h4 className={`text-sm font-medium ${set.type === 'warmup' ? 'text-yellow-300' : 'text-white'}`}>
                          {set.type === 'warmup' ? 'Warmup Set' : 'Main Set'}
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center space-x-1">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickChange(set.id, 'weight', 'down');
                              }}
                              className="w-6 h-6 bg-red-500/30 hover:bg-red-500/50 text-red-300 rounded text-xs font-bold flex items-center justify-center shadow-lg shadow-red-500/20"
                            >
                              -
                            </button>
                            <button
                              onClick={() => openNumberWheel(set.id, 'weight')}
                              onTouchStart={(e) => handleTouchStart(e, set.id, 'weight')}
                              onWheel={(e) => handleWheel(e, set.id, 'weight')}
                              className="flex-1 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-center transition-all duration-300 backdrop-blur-sm touch-manipulation select-none"
                            >
                              <div className="text-lg font-bold">{set.weight}</div>
                              <div className="text-xs text-gray-400">Weight (kg)</div>
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickChange(set.id, 'weight', 'up');
                              }}
                              className="w-6 h-6 bg-green-500/30 hover:bg-green-500/50 text-green-300 rounded text-xs font-bold flex items-center justify-center shadow-lg shadow-green-500/20"
                            >
                              +
                            </button>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickChange(set.id, 'reps', 'down');
                              }}
                              className="w-6 h-6 bg-red-500/30 hover:bg-red-500/50 text-red-300 rounded text-xs font-bold flex items-center justify-center shadow-lg shadow-red-500/20"
                            >
                              -
                            </button>
                            <button
                              onClick={() => openNumberWheel(set.id, 'reps')}
                              onTouchStart={(e) => handleTouchStart(e, set.id, 'reps')}
                              onWheel={(e) => handleWheel(e, set.id, 'reps')}
                              className="flex-1 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-center transition-all duration-300 backdrop-blur-sm touch-manipulation select-none"
                            >
                              <div className="text-lg font-bold">{set.reps}</div>
                              <div className="text-xs text-gray-400">Repetitions</div>
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickChange(set.id, 'reps', 'up');
                              }}
                              className="w-6 h-6 bg-green-500/30 hover:bg-green-500/50 text-green-300 rounded text-xs font-bold flex items-center justify-center shadow-lg shadow-green-500/20"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                                        {/* Dropset Sub-card */}
                    {set.type === 'dropset' && (
                      <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-4 backdrop-blur-sm">
                        <div className="flex items-center space-x-2 mb-3">
                          <TrendingDown className="w-4 h-4 text-purple-400" />
                          <h4 className="text-purple-300 font-medium text-sm">Drop Set</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center space-x-1">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickChange(set.id, 'dropWeight', 'down');
                              }}
                              className="w-6 h-6 bg-red-500/30 hover:bg-red-500/50 text-red-300 rounded text-xs font-bold flex items-center justify-center shadow-lg shadow-red-500/20"
                            >
                              -
                            </button>
                            <button
                              onClick={() => openNumberWheel(set.id, 'dropWeight')}
                              onTouchStart={(e) => handleTouchStart(e, set.id, 'dropWeight')}
                              onWheel={(e) => handleWheel(e, set.id, 'dropWeight')}
                              className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 px-3 py-2 rounded-lg text-center transition-all duration-300 border border-purple-500/30 touch-manipulation select-none"
                            >
                              <div className="text-lg font-bold">{set.dropWeight || 0}</div>
                              <div className="text-xs">Weight</div>
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickChange(set.id, 'dropWeight', 'up');
                              }}
                              className="w-6 h-6 bg-green-500/30 hover:bg-green-500/50 text-green-300 rounded text-xs font-bold flex items-center justify-center shadow-lg shadow-green-500/20"
                            >
                              +
                            </button>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickChange(set.id, 'dropReps', 'down');
                              }}
                              className="w-6 h-6 bg-red-500/30 hover:bg-red-500/50 text-red-300 rounded text-xs font-bold flex items-center justify-center shadow-lg shadow-red-500/20"
                            >
                              -
                            </button>
                            <button
                              onClick={() => openNumberWheel(set.id, 'dropReps')}
                              onTouchStart={(e) => handleTouchStart(e, set.id, 'dropReps')}
                              onWheel={(e) => handleWheel(e, set.id, 'dropReps')}
                              className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 px-3 py-2 rounded-lg text-center transition-all duration-300 border border-purple-500/30 touch-manipulation select-none"
                            >
                              <div className="text-lg font-bold">{set.dropReps || 0}</div>
                              <div className="text-xs">Reps</div>
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickChange(set.id, 'dropReps', 'up');
                              }}
                              className="w-6 h-6 bg-green-500/30 hover:bg-green-500/50 text-green-300 rounded text-xs font-bold flex items-center justify-center shadow-lg shadow-green-500/20"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Superset Sub-cards */}
                    {set.type === 'superset' && supersetExercise && (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 mb-3">
                          <Zap className="w-4 h-4 text-blue-400 animate-pulse" />
                          <h4 className="text-blue-300 font-medium text-sm">Superset</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Exercise A */}
                          <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-3 backdrop-blur-sm">
                            <div className="flex items-center space-x-2 mb-2">
                              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                              <h5 className="text-blue-300 font-medium text-xs">{exercise.name}</h5>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => openNumberWheel(set.id, 'weight')}
                                onTouchStart={(e) => handleTouchStart(e, set.id, 'weight')}
                                onWheel={(e) => handleWheel(e, set.id, 'weight')}
                                className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 px-2 py-1 rounded text-center text-sm transition-all duration-300 border border-blue-500/30 touch-manipulation select-none"
                              >
                                {set.weight} kg
                              </button>
                              <button
                                onClick={() => openNumberWheel(set.id, 'reps')}
                                onTouchStart={(e) => handleTouchStart(e, set.id, 'reps')}
                                onWheel={(e) => handleWheel(e, set.id, 'reps')}
                                className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 px-2 py-1 rounded text-center text-sm transition-all duration-300 border border-blue-500/30 touch-manipulation select-none"
                              >
                                {set.reps} reps
                              </button>
                            </div>
                          </div>

                          {/* Exercise B */}
                          <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-3 backdrop-blur-sm">
                            <div className="flex items-center space-x-2 mb-2">
                              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                              <h5 className="text-purple-300 font-medium text-xs">{supersetExercise.name}</h5>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                                             <button
                                 onClick={() => openNumberWheel(set.id, 'supersetWeight')}
                                 onTouchStart={(e) => handleTouchStart(e, set.id, 'supersetWeight')}
                                 onWheel={(e) => handleWheel(e, set.id, 'supersetWeight')}
                                 className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 px-2 py-1 rounded text-center text-sm transition-all duration-300 border border-purple-500/30 touch-manipulation select-none"
                               >
                                 {set.supersetWeight || 0} kg
                               </button>
                               <button
                                 onClick={() => openNumberWheel(set.id, 'supersetReps')}
                                 onTouchStart={(e) => handleTouchStart(e, set.id, 'supersetReps')}
                                 onWheel={(e) => handleWheel(e, set.id, 'supersetReps')}
                                 className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 px-2 py-1 rounded text-center text-sm transition-all duration-300 border border-purple-500/30 touch-manipulation select-none"
                               >
                                 {set.supersetReps || 0} reps
                               </button>
                              </div>
                            </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
          })}

          {/* Add Set Button */}
          <button 
            onClick={addSet}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 text-white py-2 px-3 rounded-lg transition-all duration-300 border border-dashed border-white/20 hover:border-white/40 backdrop-blur-sm group"
          >
            <Plus className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
            <span className="font-medium text-sm">Add Set</span>
          </button>
        </div>

        {/* Compact Bottom Section */}
        <div className={`px-6 py-2 pb-24 border-t border-white/10 bg-gradient-to-r from-white/5 to-transparent transition-all duration-500 ${
          isCardMinimized ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}>
          

          {/* Notes - Compact */}
          <div className="mb-2">
            <input
              type="text"
              placeholder="Add notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white/10 text-white px-3 py-2 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 text-xs backdrop-blur-sm border border-white/10"
            />
          </div>

          {/* Navigation & Save - Compact Row */}
          <div className="flex items-center space-x-2">
            {currentExerciseIndex > 0 && onPreviousExercise && (
              <button
                onClick={onPreviousExercise}
                className="flex-1 bg-gradient-to-r from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 border border-blue-500/30 backdrop-blur-sm"
              >
                Previous
              </button>
            )}
            {currentExerciseIndex < totalExercises - 1 && onNextExercise && (
              <button
                onClick={onNextExercise}
                className="flex-1 bg-gradient-to-r from-green-500/20 to-green-600/20 hover:from-green-500/30 hover:to-green-600/30 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 border border-green-500/30 backdrop-blur-sm"
              >
                Next Exercise
              </button>
            )}
            <button
              onClick={handleFinishClick}
              disabled={isSaving}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-medium py-2 rounded-lg transition-all duration-300 shadow-lg hover:shadow-green-500/25 backdrop-blur-sm text-sm"
            >
              {isSaving ? 'Finishing…' : 'Finish Workout'}
            </button>
          </div>
        </div>
      </div>

      {/* Smart Weight & Reps Modal */}
      {showNumberWheel && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 w-full max-w-sm sm:max-w-md rounded-2xl p-5 sm:p-6 backdrop-blur-xl border border-white/10">
            {/* Header */}
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-white mb-2">
                {showNumberWheel.field === 'weight' ? 'Set Weight' : 
                 showNumberWheel.field === 'reps' ? 'Set Repetitions' :
                 showNumberWheel.field === 'dropWeight' ? 'Drop Weight' : 
                 showNumberWheel.field === 'dropReps' ? 'Drop Reps' :
                 showNumberWheel.field === 'supersetWeight' ? 'Superset Weight' : 'Superset Reps'}
              </h3>
              {/* Native numeric input for mobile keypad */}
              <div className="flex items-center justify-center gap-2">
                <input
                  ref={numberInputRef}
                  inputMode="decimal"
                  type="text"
                  value={numberWheelText}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9.]/g, '');
                    setNumberWheelText(v);
                    const parsed = parseFloat(v);
                    if (!isNaN(parsed)) setNumberWheelValue(parsed);
                  }}
                  className="w-28 text-center text-3xl font-bold bg-white/10 text-white rounded-lg px-3 py-2 outline-none border border-white/10 focus:border-white/20"
                  placeholder="0"
                />
                <span className="text-gray-400 text-sm">{showNumberWheel.field.toLowerCase().includes('weight') ? 'kg' : 'reps'}</span>
              </div>
            </div>

            {/* Scroll Weight Picker */}
            {showNumberWheel.field.toLowerCase().includes('weight') && (
              <div className="mb-5">
                <div className="relative">
                  <div
                    ref={weightScrollRef}
                    className="flex gap-2 overflow-x-auto snap-x snap-mandatory px-6 py-2"
                    onScroll={() => {
                      const container = weightScrollRef.current;
                      if (!container) return;
                      const itemWidth = 56; // px, must match w-14
                      // use rAF to avoid excessive state updates
                      if (weightScrollRaf.current) cancelAnimationFrame(weightScrollRaf.current);
                      weightScrollRaf.current = requestAnimationFrame(() => {
                        const index = Math.round(container.scrollLeft / itemWidth);
                        const value = Math.max(0, Math.min(300, index * 2.5));
                        setNumberWheelValue(value);
                      });
                    }}
                    style={{
                      scrollBehavior: 'smooth',
                      WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,1) 8%, rgba(0,0,0,1) 92%, rgba(0,0,0,0))',
                      maskImage: 'linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,1) 8%, rgba(0,0,0,1) 92%, rgba(0,0,0,0))'
                    }}
                  >
                    {Array.from({ length: 121 }, (_, i) => i * 2.5).map((w) => (
                      <button
                        key={w}
                        onClick={() => setNumberWheelValue(w)}
                        className={`snap-center w-14 sm:w-16 shrink-0 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                          numberWheelValue === w 
                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/20 scale-105' 
                            : 'bg-white/10 text-white/80 hover:bg-white/20'
                        }`}
                        title={`${w} kg`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                  {/* Edge masks with blur */}
                  <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-gray-900/95 to-transparent backdrop-blur-sm" />
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-gray-900/95 to-transparent backdrop-blur-sm" />
                  {/* center indicator */}
                  <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-white/25" />
                </div>
              </div>
            )}

            {/* Simple Bar + 5 Plate Buttons */}
            {showNumberWheel.field.toLowerCase().includes('weight') && (
              <div className="mb-5">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <button
                    onClick={() => { setNumberWheelText('20'); updateNumberWheelValue(20); }}
                    className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/10"
                    title="Olympic Bar 20kg"
                  >
                    Bar 20kg
                  </button>
                  <span className="text-gray-400 text-xs">+</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  {[25, 20, 15, 10, 5].map((plate) => (
                    <button
                      key={plate}
                      onClick={() => { const v = Math.max(0, numberWheelValue + plate * 2); setNumberWheelText(String(v)); updateNumberWheelValue(v); }}
                      className="px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/10"
                      title={`Add pair: ${plate}kg ×2`}
                    >
                      +{plate}×2
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick +/- Buttons (kept minimal) */}
            <div className="flex items-center justify-center space-x-3 sm:space-x-4 mb-4">
              <button
                onClick={() => { const v = Math.max(0, numberWheelValue - 1); setNumberWheelText(String(v)); updateNumberWheelValue(v); }}
                className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-300 flex items-center justify-center text-lg sm:text-xl font-bold"
              >
                −
              </button>
              <button
                onClick={() => { const v = numberWheelValue + 1; setNumberWheelText(String(v)); updateNumberWheelValue(v); }}
                className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-300 flex items-center justify-center text-lg sm:text-xl font-bold"
              >
                +
              </button>
            </div>

            {/* Minimal UI: removed large presets and keypad for a simpler look */}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={closeNumberWheel}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 text-base sm:text-lg font-bold py-3 sm:py-4 rounded-xl transition-all duration-300 backdrop-blur-sm"
              >
                Cancel
              </button>
              <button 
                onClick={confirmNumberWheelValue}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-base sm:text-lg font-bold py-3 sm:py-4 rounded-xl transition-all duration-300 backdrop-blur-sm"
              >
                Set {showNumberWheel.field.toLowerCase().includes('weight') ? 'Weight' : 'Reps'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Superset Exercise Selector Modal */}
      {showSupersetModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 w-full max-w-sm rounded-2xl p-6 backdrop-blur-xl border border-white/10">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-2">Choose Superset Exercise</h3>
              <p className="text-gray-400 text-sm">
                {supersetSearchQuery.trim() 
                  ? `Searching for exercises matching "${supersetSearchQuery}"`
                  : `Remaining exercises from your template`
                }
              </p>
            </div>

            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search exercises..."
                  value={supersetSearchQuery}
                  onChange={(e) => setSupersetSearchQuery(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Exercise List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(() => {
                const exercises = getSupersetExercises();
                
                return (
                  <>
                    {/* Template Exercises */}
                    {exercises.templateExercises.map((ex) => (
                      <button
                        key={ex.id}
                        onClick={() => selectSupersetExercise(ex.id, ex.name)}
                        className="w-full bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-lg text-left transition-all duration-300 backdrop-blur-sm border border-white/10 flex items-center justify-between"
                      >
                        <span>{ex.name}</span>
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">Template</span>
                      </button>
                    ))}
                    
                    {/* Separator */}
                    {exercises.hasSeparator && (
                      <div className="flex items-center py-2">
                        <div className="flex-1 border-t border-white/20"></div>
                        <span className="px-3 text-xs text-gray-400">Other Exercises</span>
                        <div className="flex-1 border-t border-white/20"></div>
                      </div>
                    )}
                    
                    {/* Other Exercises */}
                    {exercises.otherExercises.map((ex) => (
                      <button
                        key={ex.id}
                        onClick={() => selectSupersetExercise(ex.id, ex.name)}
                        className="w-full bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-lg text-left transition-all duration-300 backdrop-blur-sm border border-white/10"
                      >
                        <span>{ex.name}</span>
                      </button>
                    ))}
                  </>
                );
              })()}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent card minimization
                setShowSupersetModal(false);
                setSupersetSearchQuery(''); // Clear search when closing
              }}
              className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold py-3 rounded-xl transition-all duration-300 mt-4 backdrop-blur-sm border border-red-500/30"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* End Workout Confirmation Modal */}
      {showEndWorkoutModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 w-full max-w-sm rounded-2xl p-6 backdrop-blur-xl border border-white/10">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-4 h-4 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">End Workout?</h3>
              <p className="text-gray-400 text-sm">
                Are you sure you want to end this workout? Your progress will be saved.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  triggerHaptic();
                  setShowEndWorkoutModal(false);
                }}
                className="bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-xl transition-all duration-300 backdrop-blur-sm border border-white/10"
              >
                Continue
              </button>
              <button
                onClick={() => {
                  triggerHaptic();
                  setShowEndWorkoutModal(false);
                  onClose();
                }}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-red-500/25 backdrop-blur-sm"
              >
                End Workout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exercise Info Modal */}
      {showExerciseInfoModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 w-full max-w-lg rounded-2xl backdrop-blur-xl border border-white/10 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 sticky top-0 bg-gradient-to-br from-gray-900/95 to-gray-800/95 z-10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Info className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{exercise.name}</h3>
                  <p className="text-gray-400 text-sm">Performance & Form Guide</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card minimization
                  triggerHaptic();
                  setShowExerciseInfoModal(false);
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-300"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">

              
              {isLoadingExerciseData ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-gray-400">Loading exercise data...</span>
                </div>
              ) : (
                <>
                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-xl p-3 border border-green-500/30">
                      <div className="text-2xl font-bold text-green-400">
                        {performanceData?.maxWeight || 0}kg
                      </div>
                      <div className="text-gray-300 text-xs">Max Weight</div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-xl p-3 border border-blue-500/30">
                      <div className="text-2xl font-bold text-blue-400">
                        {performanceData?.bestReps || 0}
                      </div>
                      <div className="text-gray-300 text-xs">Best Reps</div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-xl p-3 border border-purple-500/30">
                      <div className="text-2xl font-bold text-purple-400">
                        +{performanceData?.progress || 0}%
                      </div>
                      <div className="text-gray-300 text-xs">Progress</div>
                    </div>
                  </div>
                </>
              )}

              {/* Exercise GIF/Image */}
              <div className="bg-gray-800/30 rounded-xl p-4 border border-white/10">
                <h4 className="text-white font-semibold text-sm mb-3 flex items-center">
                  <Info className="w-4 h-4 mr-2 text-blue-400" />
                  Exercise Demo
                </h4>
                {exerciseData && (exerciseData.gifUrl || exerciseData.imageUrl) ? (
                  <div className="relative">
                    <img 
                      src={exerciseData.gifUrl || exerciseData.imageUrl} 
                      alt={`${exercise.name} demonstration`}
                      className="w-full h-56 sm:h-64 object-cover rounded-lg border border-white/10"
                      onError={async (e) => {
                        // Try cached GIF, else hide
                        try {
                          if (exerciseData?.id) {
                            const url = await exerciseDB.getCachedGifUrl?.(exerciseData.id);
                            if (url) { e.currentTarget.src = url; return; }
                          }
                        } catch {}
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    {exerciseData.gifUrl && (
                      <div className="absolute top-2 right-2 bg-black/50 rounded-full px-2 py-1">
                        <span className="text-white text-xs">GIF</span>
                      </div>
                    )}
                    {exerciseData.imageUrl && !exerciseData.gifUrl && (
                      <div className="absolute top-2 right-2 bg-black/50 rounded-full px-2 py-1">
                        <span className="text-white text-xs">IMG</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-48 bg-gray-800/50 rounded-lg flex items-center justify-center border border-white/10">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Info className="w-4 h-4 text-blue-400" />
                      </div>
                      <p className="text-gray-400 text-sm">
                        {exerciseData ? 'No demo available' : 'Exercise not found in database'}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        {exerciseData ? 'Check form tips below' : 'Try a different exercise name'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Performance Graph */}
              {performanceData && (
                <div className="bg-gray-800/30 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-semibold text-sm">Weight Progress</h4>
                    <span className="text-green-400 text-xs font-medium">Last 9 workouts</span>
                  </div>
                  <div className="h-24 flex items-end justify-between space-x-1">
                    {performanceData.weightHistory.map((weight: number, index: number) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-gradient-to-t from-green-500 to-green-600 rounded-t-sm transition-all duration-500 hover:scale-105"
                          style={{ 
                            height: `${(weight / Math.max(...performanceData.weightHistory)) * 100}%`,
                            minHeight: '8px'
                          }}
                        />
                        <span className="text-xs text-gray-400 mt-1">{weight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Exercise Details */}
              <div className="bg-gray-800/30 rounded-xl p-4 border border-white/10">
                <h4 className="text-white font-semibold text-sm mb-3 flex items-center">
                  <Info className="w-4 h-4 mr-2 text-blue-400" />
                  Exercise Details
                </h4>
                {exerciseData ? (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400">Primary:</span>
                      <p className="text-white">{exerciseData.primaryMuscles.join(', ')}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Secondary:</span>
                      <p className="text-white">{exerciseData.secondaryMuscles.join(', ')}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Equipment:</span>
                      <p className="text-white">{exerciseData.equipment.join(', ')}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Difficulty:</span>
                      <p className="text-white capitalize">{exerciseData.difficulty}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-400 text-sm">Exercise not found in database</p>
                    <p className="text-gray-500 text-xs mt-1">No details available</p>
                  </div>
                )}
              </div>

              {/* Form Tips */}
              <div className="bg-gray-800/30 rounded-xl p-4 border border-white/10">
                <h4 className="text-white font-semibold text-sm mb-3 flex items-center">
                  <Info className="w-4 h-4 mr-2 text-yellow-400" />
                  Form Tips
                </h4>
                {exerciseData && exerciseData.instructions ? (
                  <div className="space-y-2">
                    {exerciseData.instructions.slice(0, 4).map((instruction: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                        <span className="text-gray-300 text-sm">{instruction}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-400 text-sm">No form tips available</p>
                    <p className="text-gray-500 text-xs mt-1">Exercise not found in database</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button 
                  onClick={() => {
                    triggerHaptic();
                    if (exerciseData?.gifUrl) {
                      window.open(exerciseData.gifUrl, '_blank');
                    }
                  }}
                  disabled={!exerciseData?.gifUrl}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 ${
                    exerciseData?.gifUrl 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white' 
                      : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {exerciseData?.gifUrl ? 'Watch Demo' : 'No Demo'}
                </button>
                <button 
                  onClick={() => {
                    triggerHaptic();
                    if (exerciseData) {
                      // Save current progress to local storage
                      const progressData = {
                        exerciseId: exerciseData.id,
                        exerciseName: exerciseData.name,
                        maxWeight: performanceData?.maxWeight || 0,
                        bestReps: performanceData?.bestReps || 0,
                        weightHistory: performanceData?.weightHistory || [0, 0, 0, 0, 0, 0, 0, 0, 0],
                        progress: performanceData?.progress || 0,
                        lastUpdated: new Date().toISOString()
                      };
                      localStorage.setItem(`progress_${exerciseData.id}`, JSON.stringify(progressData));
                      console.log('Progress saved:', progressData);
                    }
                  }}
                  disabled={!exerciseData}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 ${
                    exerciseData 
                      ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white' 
                      : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {exerciseData ? 'Save Progress' : 'No Data'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
