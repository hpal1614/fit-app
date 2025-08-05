import React, { useState, useEffect, useRef } from 'react';
import { 
  Timer, Target, Zap, Flame, Activity, Trophy, Play, Pause, 
  Plus, Minus, Mic, Settings, RotateCcw, SkipForward, 
  AlertTriangle, Heart, Dumbbell, Clock, TrendingUp, 
  ChevronDown, ChevronUp, Check, X, ArrowRight, ArrowLeft,
  RefreshCw, Shield, Lightbulb, Users, Wifi
} from 'lucide-react';
import { getFixedVoiceService } from '../services/fixedVoiceService';
import { nimbusAI } from '../nimbus/services/NimbusAIService';
import { EXERCISE_DATABASE, getExercisesByMuscleGroup, searchExercises } from '../constants/exercises';
import { MuscleGroup } from '../types/workout';
import { DatabaseService } from '../services/databaseService';
import RestTimer from './RestTimer';
import RestTimerSettings from './RestTimerSettings';

interface Set {
  id: string;
  weight: number;
  reps: number;
  rpe: number;
  completed: boolean;
  notes?: string;
  isDropSet?: boolean;
  originalWeight?: number;
  originalReps?: number;
}

interface AlternativeExercise {
  id: string;
  name: string;
  muscles: string;
  reason: string;
  equipment: string;
}



interface SmartSuggestion {
  id: string;
  type: 'weight' | 'exercise' | 'form' | 'motivation';
  message: string;
  action?: () => void;
  priority: 'low' | 'medium' | 'high';
}

export const EnhancedWorkoutLogger: React.FC = () => {
  // Core State
  const [currentWeight, setCurrentWeight] = useState(190);
  const [currentReps, setCurrentReps] = useState(8);
  const [currentRPE, setCurrentRPE] = useState(3);
  const [currentIncrement, setCurrentIncrement] = useState(2.5);
  const [isListening, setIsListening] = useState(false);
  const [restTime, setRestTime] = useState(135);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [showDropSet, setShowDropSet] = useState(false);
  const [showFailureOptions, setShowFailureOptions] = useState(false);
  const [voiceText, setVoiceText] = useState('🎤 "190 for 8, felt perfect"');
  const [previousSet, setPreviousSet] = useState('175 kg × 8 reps • RPE 7/10');
  
  // New Enhanced Features State
  const [showAlternativesModal, setShowAlternativesModal] = useState(false);
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [showPainModal, setShowPainModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<'difficulty' | 'pain'>('difficulty');
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [voiceService, setVoiceService] = useState<ReturnType<typeof getFixedVoiceService> | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceConfidence, setVoiceConfidence] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0); // Start with first exercise (index 0)
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  
  // Per-exercise state management
  const [exerciseStates, setExerciseStates] = useState<{
    [exerciseId: number]: {
      weight: number;
      reps: number;
      rpe: number;
      completedSets: number;
      history: Set[];
    }
  }>({});
  const [showAlternativeExercises, setShowAlternativeExercises] = useState(false);
  const [alternativeExercises, setAlternativeExercises] = useState<any[]>([]);
  const [isGeneratingAlternatives, setIsGeneratingAlternatives] = useState(false);
  const [showExerciseSwapper, setShowExerciseSwapper] = useState(false);
  const [allExercises, setAllExercises] = useState<any[]>([]);
  const [isLoadingAllExercises, setIsLoadingAllExercises] = useState(false);
  const [showPlateCalculator, setShowPlateCalculator] = useState(false);
  const [plateCalculatorType, setPlateCalculatorType] = useState<'weight' | 'reps'>('weight');
  const [plateCalculatorValue, setPlateCalculatorValue] = useState(0);
  const [expandedSetIndex, setExpandedSetIndex] = useState<number | null>(null);
  const [showDropSetForIndex, setShowDropSetForIndex] = useState<number | null>(null);
  const [dropSetWeight, setDropSetWeight] = useState(0);
  const [dropSetReps, setDropSetReps] = useState(0);
  const [showTableSettings, setShowTableSettings] = useState(false);
  const [dynamicSets, setDynamicSets] = useState<{ [exerciseId: number]: number }>({});
  const [showExerciseCompletionOverlay, setShowExerciseCompletionOverlay] = useState<number | null>(null);
  const [showTimerExpanded, setShowTimerExpanded] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [tableSettings, setTableSettings] = useState({
    showWeight: true,
    showReps: true,
    showRPE: true,
    showPrevious: true
  });
  const [overallWorkoutProgress, setOverallWorkoutProgress] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(true);
  const [showProgressInfo, setShowProgressInfo] = useState(false);
  const [weightSuggestion, setWeightSuggestion] = useState<string>('');
  const [suggestionReason, setSuggestionReason] = useState<string>('');
  const [exerciseHistory, setExerciseHistory] = useState<Set[]>([]);
  
  // New Rest Timer Modal State
  const [showRestTimerModal, setShowRestTimerModal] = useState(false);
  const [showRestTimerSettings, setShowRestTimerSettings] = useState(false);
  const [restTimerSoundEnabled, setRestTimerSoundEnabled] = useState(true);
  const [restTimerSettings, setRestTimerSettings] = useState({
    soundEnabled: true,
    defaultRestTime: 120,
    completionSound: 'whistle' as const,
    showMotivationalMessages: true,
    autoStartNextSet: false
  });
  
  // Refs
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const voiceServiceRef = useRef<ReturnType<typeof getFixedVoiceService> | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Carousel scroll handler
  const handleCarouselScroll = () => {
    if (!carouselRef.current) return;
    
    const container = carouselRef.current;
    const scrollLeft = container.scrollLeft;
    const cardWidth = container.scrollWidth / workoutExercises.length;
    const newIndex = Math.round(scrollLeft / cardWidth);
    
    if (newIndex !== currentExerciseIndex && newIndex >= 0 && newIndex < workoutExercises.length) {
      setCurrentExerciseIndex(newIndex);
    }
  };

  // Keyboard navigation handler
  const handleKeyNavigation = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        if (currentExerciseIndex > 0) {
          const newIndex = currentExerciseIndex - 1;
          setCurrentExerciseIndex(newIndex);
          showSmartSuggestion(`Switched to ${workoutExercises[newIndex]?.name}`);
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (currentExerciseIndex < workoutExercises.length - 1) {
          const newIndex = currentExerciseIndex + 1;
          setCurrentExerciseIndex(newIndex);
          showSmartSuggestion(`Switched to ${workoutExercises[newIndex]?.name}`);
        }
        break;
      case 'Home':
        e.preventDefault();
        setCurrentExerciseIndex(0);
        showSmartSuggestion(`Switched to ${workoutExercises[0]?.name}`);
        break;
      case 'End':
        e.preventDefault();
        const lastIndex = workoutExercises.length - 1;
        setCurrentExerciseIndex(lastIndex);
        showSmartSuggestion(`Switched to ${workoutExercises[lastIndex]?.name}`);
        break;
    }
  };

  // Enhanced touch gesture handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || !carouselRef.current) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    const threshold = 30; // Reduced threshold for more responsive swipes
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentExerciseIndex < workoutExercises.length - 1) {
        // Swipe left - next
        const newIndex = currentExerciseIndex + 1;
        setCurrentExerciseIndex(newIndex);
        showSmartSuggestion(`Switched to ${workoutExercises[newIndex]?.name}`);
      } else if (diff < 0 && currentExerciseIndex > 0) {
        // Swipe right - previous
        const newIndex = currentExerciseIndex - 1;
        setCurrentExerciseIndex(newIndex);
        showSmartSuggestion(`Switched to ${workoutExercises[newIndex]?.name}`);
      }
    }
    
    setTouchStart(null);
  };

  // Audio System
  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const playSound = (type: 'button' | 'complete' | 'timer_warning' = 'button') => {
    if (!audioContextRef.current) return;
    
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    if (type === 'complete') {
      // Timer completion sound - more noticeable
      oscillator.frequency.setValueAtTime(600, audioContextRef.current.currentTime);
      oscillator.frequency.setValueAtTime(800, audioContextRef.current.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(1000, audioContextRef.current.currentTime + 0.2);
      oscillator.frequency.setValueAtTime(1200, audioContextRef.current.currentTime + 0.3);
      oscillator.frequency.setValueAtTime(1400, audioContextRef.current.currentTime + 0.4);
      gainNode.gain.setValueAtTime(0.4, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.8);
      oscillator.start();
      oscillator.stop(audioContextRef.current.currentTime + 0.8);
    } else if (type === 'timer_warning') {
      // Warning sound for last 10 seconds
      oscillator.frequency.setValueAtTime(800, audioContextRef.current.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContextRef.current.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContextRef.current.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.2, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.3);
      oscillator.start();
      oscillator.stop(audioContextRef.current.currentTime + 0.3);
    } else {
      // Button click sound
      oscillator.frequency.setValueAtTime(400, audioContextRef.current.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.1);
      oscillator.start();
      oscillator.stop(audioContextRef.current.currentTime + 0.1);
    }
  };

  // Per-exercise state helpers
  const getExerciseState = (exerciseId: number) => {
    return exerciseStates[exerciseId] || {
      weight: 180 + (exerciseId * 10), // Different weight for each exercise
      reps: 8 + (exerciseId % 3), // Vary reps slightly
      rpe: 3 + (exerciseId % 4), // Vary RPE slightly
      completedSets: 0,
      history: []
    };
  };

  const updateExerciseState = (exerciseId: number, updates: Partial<{
    weight: number;
    reps: number;
    rpe: number;
    completedSets: number;
    history: Set[];
  }>) => {
    setExerciseStates(prev => ({
      ...prev,
      [exerciseId]: {
        ...getExerciseState(exerciseId),
        ...updates
      }
    }));
  };

  // Get current exercise state
  const currentExerciseState = getExerciseState(currentExerciseIndex);

  // Weight and Rep Controls
  const adjustWeight = (amount: number) => {
    initAudio();
    updateExerciseState(currentExerciseIndex, { 
      weight: Math.max(0, currentExerciseState.weight + amount) 
    });
    updatePreviousSet();
    playSound('button');
  };

  const adjustReps = (amount: number) => {
    initAudio();
    updateExerciseState(currentExerciseIndex, { 
      reps: Math.max(1, currentExerciseState.reps + amount) 
    });
    updatePreviousSet();
    playSound('button');
  };

  const setIncrement = (increment: number) => {
    setCurrentIncrement(increment);
    playSound('button');
  };

  const setRPE = (rpe: number) => {
    updateExerciseState(currentExerciseIndex, { rpe });
    updatePreviousSet();
    playSound('button');
  };

  // Voice System
  const toggleVoice = async () => {
    initAudio();
    
    if (!voiceServiceRef.current) {
      showSmartSuggestion('Voice service not available. Please check microphone permissions.');
      return;
    }
    
    if (isListening) {
      voiceServiceRef.current.stopListening();
      setVoiceText(`🎤 "${currentExerciseState.weight} for ${currentExerciseState.reps}, felt perfect"`);
    } else {
      const success = await voiceServiceRef.current.startListening();
      if (success) {
        setVoiceText('🎤 Listening...');
        showSmartSuggestion('Voice recognition active. Try saying: "add 5 pounds" or "set reps to 10"');
      } else {
        showSmartSuggestion('Failed to start voice recognition. Please check microphone permissions.');
      }
    }
    
    playSound('button');
  };

  // Timer System
  const toggleTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
      setTimerRunning(false);
      playSound('button');
    } else {
      if (restTime <= 0) {
        setRestTime(135);
      }
      startRestTimer();
    }
  };

  const adjustTimerTime = (seconds: number) => {
    setRestTime(prev => Math.max(10, prev + seconds));
    playSound('button');
  };

  const startRestTimer = () => {
    console.log('Starting rest timer with time:', restTime);
    setTimerRunning(true);
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    
    timerIntervalRef.current = setInterval(() => {
      setRestTime(prev => {
        const newTime = prev - 1;
        console.log('Timer tick:', prev, '→', newTime);
        
        // Play warning sound at 10 seconds remaining
        if (prev === 10) {
          playSound('timer_warning');
        }
        
        if (newTime <= 0) {
          clearInterval(timerIntervalRef.current!);
          timerIntervalRef.current = null;
          setTimerRunning(false);
          playSound('complete');
          showSmartSuggestion('Rest time complete! Ready for next set.');
          return restTimerSettings.defaultTime || 60;
        }
        return newTime;
      });
    }, 1000);
  };

  // Log Set System
  const logSet = () => {
    initAudio();
    
    if (!showFailureOptions) {
      setShowFailureOptions(true);
      playSound('button');
      return;
    }
    
    completeNormalSet();
  };

  const completeNormalSet = () => {
    setShowFailureOptions(false);
    
    // Get current exercise state
    const currentExerciseState = getExerciseState(currentExerciseIndex);
    
    // Add current set to history
    const newSet: Set = {
      id: Date.now().toString(),
      weight: currentExerciseState.weight,
      reps: currentExerciseState.reps,
      rpe: currentExerciseState.rpe,
      completed: true,
      isDropSet: showDropSetForIndex !== null
    };
    
    // Update exercise state with new set and increment completed sets
    updateExerciseState(currentExerciseIndex, { 
      completedSets: currentExerciseState.completedSets + 1,
      history: [...currentExerciseState.history, newSet]
    });
    
    // Check if exercise is completed
    const newCompletedSets = currentExerciseState.completedSets + 1;
    if (newCompletedSets >= getTotalSets(currentExerciseIndex)) {
      // Show completion overlay
      setTimeout(() => {
        setShowExerciseCompletionOverlay(currentExerciseIndex);
      }, 1000);
    } else {
      // Check if exercise is completed for auto-advance
      setTimeout(() => {
        checkExerciseCompletion();
      }, 500);
    }
    
    startRestTimer();
    playSound('button');
  };

  const logFailure = () => {
    const attemptedReps = currentReps;
    const completedReps = Math.floor(attemptedReps * 0.6);
    
    setCurrentReps(completedReps);
    setPreviousSet(`${currentWeight}lbs × ${completedReps}/${attemptedReps} (Failed)`);
    
    const newWeight = Math.round(currentWeight * 0.85);
    setTimeout(() => {
      setCurrentWeight(newWeight);
      updatePreviousSet();
    }, 2000);
    
    setShowFailureOptions(false);
    playSound('button');
  };

  // Drop Set System
  const startDropLog = () => {
    setShowDropSet(true);
    setShowFailureOptions(false);
    playSound('button');
  };

  const confirmDropLog = () => {
    const originalWeight = currentWeight;
    const newWeight = Math.round(currentWeight * 0.8);
    const totalReps = currentReps + Math.floor(currentReps * 0.4);
    
    setCurrentWeight(Math.round((originalWeight + newWeight) / 2));
    setCurrentReps(totalReps);
    setPreviousSet(`${originalWeight}lbs → ${newWeight}lbs (Drop Set)`);
    
    setShowDropSet(false);
    startRestTimer();
    playSound('button');
  };

  const cancelDropLog = () => {
    setShowDropSet(false);
    setShowFailureOptions(false);
    playSound('button');
  };

  // Utility Functions
  const updatePreviousSet = () => {
    setPreviousSet(`${currentWeight} lbs × ${currentReps} reps • RPE ${currentRPE}/5`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerCardClass = () => {
    if (restTime <= 10 && restTime > 0) return 'timer-card danger';
    if (restTime <= 20 && restTime > 10) return 'timer-card warning';
    if (restTime === 0) return 'timer-card complete';
    return 'timer-card';
  };

  // Initialize
  useEffect(() => {
    updatePreviousSet();
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Initialize Voice Service
  useEffect(() => {
    const initVoiceService = async () => {
      try {
        const service = getFixedVoiceService();
        const initialized = await service.initialize();
        
        if (initialized) {
          voiceServiceRef.current = service;
          setVoiceService(service);
          
          // Subscribe to voice state changes
          service.onStateChange((state) => {
            setIsListening(state.isListening);
            setVoiceTranscript(state.transcript);
            setVoiceConfidence(state.confidence);
            
            if (state.transcript && state.confidence > 0.7) {
              processVoiceCommand(state.transcript);
            }
          });
          
          console.log('✅ Voice service initialized successfully');
        } else {
          console.error('❌ Failed to initialize voice service');
        }
      } catch (error) {
        console.error('❌ Voice service initialization error:', error);
      }
    };

    initVoiceService();

    // Cleanup
    return () => {
      if (voiceServiceRef.current) {
        voiceServiceRef.current.destroy();
      }
    };
  }, []);

  // Update overall progress when exercises change
  useEffect(() => {
    setOverallWorkoutProgress(calculateOverallProgress());
  }, [currentExerciseState.completedSets, completedExercises, currentExerciseIndex]);

  // Update weight suggestions when RPE or sets change
  useEffect(() => {
    generateWeightSuggestion();
  }, [currentExerciseState.rpe, currentExerciseState.completedSets, currentExerciseState.weight]);

  // Debug timer state
  useEffect(() => {
    console.log('Timer state changed:', { timerRunning, restTime, showTimerExpanded });
  }, [timerRunning, restTime, showTimerExpanded]);

  // Ensure timer interval is cleaned up properly
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, []);



  // Load exercise history and smart defaults
  useEffect(() => {
    loadExerciseHistory();
  }, [currentExerciseIndex]);

  // Load exercise history for smart defaults
  const loadExerciseHistory = async () => {
    // Exercise-specific mock data
    const exerciseMockData: { [key: number]: Set[] } = {
      0: [ // Bench Press
        { id: '1', weight: 190, reps: 8, rpe: 3, completed: true, notes: '', isDropSet: false },
        { id: '2', weight: 195, reps: 8, rpe: 4, completed: true, notes: '', isDropSet: false },
        { id: '3', weight: 190, reps: 8, rpe: 3, completed: true, notes: '', isDropSet: false },
        { id: '4', weight: 185, reps: 8, rpe: 2, completed: true, notes: '', isDropSet: false }
      ],
      1: [ // Incline Dumbbell Press
        { id: '1', weight: 70, reps: 10, rpe: 3, completed: true, notes: '', isDropSet: false },
        { id: '2', weight: 75, reps: 10, rpe: 4, completed: true, notes: '', isDropSet: false },
        { id: '3', weight: 70, reps: 9, rpe: 4, completed: true, notes: '', isDropSet: false }
      ],
      2: [ // Cable Chest Fly
        { id: '1', weight: 45, reps: 12, rpe: 3, completed: true, notes: '', isDropSet: false },
        { id: '2', weight: 50, reps: 12, rpe: 4, completed: true, notes: '', isDropSet: false },
        { id: '3', weight: 45, reps: 15, rpe: 3, completed: true, notes: '', isDropSet: false }
      ],
      3: [ // Dips
        { id: '1', weight: 0, reps: 12, rpe: 3, completed: true, notes: 'Bodyweight', isDropSet: false },
        { id: '2', weight: 0, reps: 10, rpe: 4, completed: true, notes: 'Bodyweight', isDropSet: false },
        { id: '3', weight: 0, reps: 8, rpe: 4, completed: true, notes: 'Bodyweight', isDropSet: false }
      ],
      4: [ // Push-ups
        { id: '1', weight: 0, reps: 20, rpe: 3, completed: true, notes: 'Bodyweight', isDropSet: false },
        { id: '2', weight: 0, reps: 18, rpe: 4, completed: true, notes: 'Bodyweight', isDropSet: false },
        { id: '3', weight: 0, reps: 15, rpe: 4, completed: true, notes: 'Bodyweight', isDropSet: false }
      ],
      5: [ // Chest Stretch
        { id: '1', weight: 0, reps: 30, rpe: 1, completed: true, notes: '30s hold', isDropSet: false }
      ]
    };
    
    const mockSets = exerciseMockData[currentExerciseIndex] || exerciseMockData[0];
    setExerciseHistory(mockSets);
    
    // Set exercise-specific defaults
    const currentState = getExerciseState(currentExerciseIndex);
    updateExerciseState(currentExerciseIndex, {
      weight: mockSets[mockSets.length - 1]?.weight || currentState.weight,
      reps: mockSets[mockSets.length - 1]?.reps || currentState.reps,
      rpe: mockSets[mockSets.length - 1]?.rpe || currentState.rpe
    });
    
    // Update previous set display
    const lastSet = mockSets[mockSets.length - 1];
    if (lastSet) {
      const weightText = lastSet.weight > 0 ? `${lastSet.weight} lbs` : 'Bodyweight';
      setPreviousSet(`${weightText} × ${lastSet.reps} reps • RPE ${lastSet.rpe}/5`);
    }
    
    // TODO: Uncomment this when database is properly connected
    /*
    try {
      // Get the current exercise
      const currentExercise = workoutExercises[currentExerciseIndex];
      if (!currentExercise) return;

      // Load recent sets for this exercise from database
      const db = DatabaseService.getInstance();
      const workoutHistory = await db.getWorkoutHistory(20); // Last 20 workouts
      
      const exerciseSets: Set[] = [];
      workoutHistory.forEach(workout => {
        workout.exercises.forEach(exercise => {
          if (exercise.exercise.name.toLowerCase().includes(currentExercise.name.toLowerCase())) {
            exercise.sets.forEach(set => {
              if (set.completed) {
                exerciseSets.push(set);
              }
            });
          }
        });
      });

      setExerciseHistory(exerciseSets);

      // Set smart defaults based on recent performance
      if (exerciseSets.length > 0) {
        const recentSets = exerciseSets.slice(-3); // Last 3 sets
        const avgWeight = recentSets.reduce((sum, set) => sum + set.weight, 0) / recentSets.length;
        const avgReps = recentSets.reduce((sum, set) => sum + set.reps, 0) / recentSets.length;
        
        // Set smart defaults
        updateExerciseState(currentExerciseIndex, {
          weight: Math.round(avgWeight),
          reps: Math.round(avgReps)
        });
        
        // Update previous set display
        const lastSet = recentSets[recentSets.length - 1];
        if (lastSet) {
          setPreviousSet(`${lastSet.weight} lbs × ${lastSet.reps} reps • RPE ${lastSet.rpe}/5`);
        }
      }
    } catch (error) {
      console.error('Failed to load exercise history:', error);
    }
    */
  };

  // Generate Smart Suggestions
  useEffect(() => {
    const generateSuggestions = (): SmartSuggestion[] => {
      const suggestions: SmartSuggestion[] = [];
      
      // Weight progression suggestions
      if (currentRPE <= 2) {
        suggestions.push({
          id: 'weight-up',
          type: 'weight',
          message: `That was easy! Consider adding ${currentIncrement * 2} lbs next set`,
          action: () => adjustWeight(currentIncrement * 2),
          priority: 'high'
        });
      } else if (currentRPE >= 4) {
        suggestions.push({
          id: 'weight-down',
          type: 'weight',
          message: `That was tough! Consider reducing ${currentIncrement} lbs next set`,
          action: () => adjustWeight(-currentIncrement),
          priority: 'high'
        });
      }
      

      
      // Form suggestions
      if (currentRPE >= 4 && currentReps < 6) {
        suggestions.push({
          id: 'form-check',
          type: 'form',
          message: 'Consider checking your form. High RPE with low reps might indicate form issues.',
          priority: 'medium'
        });
      }
      
      // Motivation suggestions
      if (Math.random() > 0.7) {
        suggestions.push({
          id: 'motivation',
          type: 'motivation',
          message: 'Great consistency! You\'re building strength every session.',
          priority: 'low'
        });
      }
      
      return suggestions;
    };

    const newSuggestions = generateSuggestions();
    setSmartSuggestions(newSuggestions);
  }, [currentRPE, currentReps, currentIncrement]);

  // Process Voice Commands
  const processVoiceCommand = (transcript: string) => {
    const command = transcript.toLowerCase();
    
    // Weight commands
    if (command.includes('add') || command.includes('increase')) {
      const match = command.match(/(\d+)/);
      if (match) {
        const amount = parseInt(match[1]);
        adjustWeight(amount);
        showSmartSuggestion(`Added ${amount} lbs`);
      } else {
        adjustWeight(currentIncrement);
        showSmartSuggestion(`Added ${currentIncrement} lbs`);
      }
    }
    
    if (command.includes('reduce') || command.includes('decrease') || command.includes('drop')) {
      const match = command.match(/(\d+)/);
      if (match) {
        const amount = parseInt(match[1]);
        adjustWeight(-amount);
        showSmartSuggestion(`Reduced ${amount} lbs`);
      } else {
        adjustWeight(-currentIncrement);
        showSmartSuggestion(`Reduced ${currentIncrement} lbs`);
      }
    }
    
    // Rep commands
    if (command.includes('reps') || command.includes('repetitions')) {
      const match = command.match(/(\d+)/);
      if (match) {
        const reps = parseInt(match[1]);
        updateExerciseState(currentExerciseIndex, { reps });
        showSmartSuggestion(`Set reps to ${reps}`);
      }
    }
    
    // RPE commands
    if (command.includes('rpe') || command.includes('difficulty')) {
      const match = command.match(/(\d+)/);
      if (match) {
        const rpe = parseInt(match[1]);
        if (rpe >= 1 && rpe <= 5) {
          updateExerciseState(currentExerciseIndex, { rpe });
          showSmartSuggestion(`Set RPE to ${rpe}`);
        }
      }
    }
    
    // Log commands
    if (command.includes('log') || command.includes('complete') || command.includes('done')) {
      logSet();
    }
    
    // Timer commands
    if (command.includes('timer') || command.includes('rest')) {
      if (command.includes('start') || command.includes('begin')) {
        toggleTimer();
      } else if (command.includes('stop') || command.includes('pause')) {
        toggleTimer();
      }
    }
    
    // Alternative exercise commands
    if (command.includes('switch') || command.includes('alternative') || command.includes('change exercise')) {
      setShowAlternativesModal(true);
    }
    
    // Difficulty feedback commands
    if (command.includes('easy') || command.includes('hard') || command.includes('perfect')) {
      setShowDifficultyModal(true);
    }
    
    // Pain reporting commands
    if (command.includes('pain') || command.includes('hurt') || command.includes('discomfort')) {
      setShowPainModal(true);
    }
  };

  // Show Smart Suggestion
  const showSmartSuggestion = (message: string, duration: number = 4000) => {
    const suggestion: SmartSuggestion = {
      id: Date.now().toString(),
      type: 'motivation',
      message,
      priority: 'medium'
    };
    
    setSmartSuggestions(prev => [...prev, suggestion]);
    
    setTimeout(() => {
      setSmartSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    }, duration);
  };

  // Helper Functions for Modals
  const getAlternativeExercises = (reason: 'difficulty' | 'pain'): AlternativeExercise[] => {
    const alternatives: Record<string, AlternativeExercise[]> = {
      difficulty: [
        { id: 'incline-dumbbell', name: 'Incline Dumbbell Press', muscles: 'Chest, Shoulders', reason: 'Easier angle', equipment: 'Incline bench + Dumbbells' },
        { id: 'machine-press', name: 'Machine Chest Press', muscles: 'Chest, Triceps', reason: 'Guided movement', equipment: 'Chest press machine' },
        { id: 'cable-fly', name: 'Cable Chest Fly', muscles: 'Chest', reason: 'Isolation movement', equipment: 'Cable machine + Fly handles' },
        { id: 'wall-pushups', name: 'Wall Push-ups', muscles: 'Chest, Triceps', reason: 'Very easy variation', equipment: 'Wall only' }
      ],
      pain: [
        { id: 'machine-press', name: 'Machine Chest Press', muscles: 'Chest, Triceps', reason: 'Supported movement', equipment: 'Chest press machine' },
        { id: 'cable-fly', name: 'Cable Chest Fly', muscles: 'Chest', reason: 'Controlled range', equipment: 'Cable machine + Fly handles' },
        { id: 'wall-pushups', name: 'Wall Push-ups', muscles: 'Chest, Triceps', reason: 'Minimal stress', equipment: 'Wall only' },
        { id: 'resistance-bands', name: 'Resistance Band Press', muscles: 'Chest, Triceps', reason: 'Low impact', equipment: 'Resistance bands' }
      ]
    };
    
    return alternatives[reason] || alternatives.difficulty;
  };

  const switchToExercise = (exercise: AlternativeExercise) => {
    // Update current exercise (in a real app, this would update the workout context)
    showSmartSuggestion(`Switched to ${exercise.name}. Equipment: ${exercise.equipment}`);
    
    // Adjust weight based on exercise type
    if (exercise.name.includes('Dumbbell')) {
      setCurrentWeight(Math.round(currentWeight * 0.4)); // ~40% for dumbbells
    } else if (exercise.name.includes('Push-up') || exercise.name.includes('Wall')) {
      setCurrentWeight(0); // Bodyweight
    } else if (exercise.name.includes('Machine')) {
      setCurrentWeight(Math.round(currentWeight * 0.8)); // ~80% for machines
    }
    
    setShowAlternativesModal(false);
    playSound('button');
  };

  const handleDifficultyFeedback = (level: 'easy' | 'perfect' | 'hard' | 'failed') => {
    let weightAdjustment = 0;
    let message = '';
    
    switch(level) {
      case 'easy':
        weightAdjustment = 15;
        message = `That was too easy! Adding ${weightAdjustment} lbs for next set.`;
        break;
      case 'perfect':
        weightAdjustment = 0;
        message = 'Perfect! Keeping the same weight for next set.';
        break;
      case 'hard':
        weightAdjustment = -10;
        message = `That was tough! Reducing by ${Math.abs(weightAdjustment)} lbs for next set.`;
        break;
      case 'failed':
        weightAdjustment = -25;
        message = `No worries! Dropping ${Math.abs(weightAdjustment)} lbs to find your sweet spot.`;
        break;
    }
    
    if (weightAdjustment !== 0) {
      setCurrentWeight(Math.max(45, currentWeight + weightAdjustment)); // Don't go below empty barbell
    }
    
    showSmartSuggestion(message);
    setShowDifficultyModal(false);
    playSound('button');
  };

  const reportPain = (bodyPart: string) => {
    const painMessages: Record<string, string> = {
      shoulder: 'Shoulder discomfort noted. Consider stopping overhead movements.',
      elbow: 'Elbow discomfort noted. Avoid direct arm stress.',
      wrist: 'Wrist discomfort noted. Consider different grip or wrist wraps.',
      'lower back': 'Lower back discomfort noted. Avoid spinal loading.',
      knee: 'Knee discomfort noted. Reduce knee flexion.',
      other: 'Discomfort noted. Listen to your body.'
    };
    
    const message = painMessages[bodyPart] || 'Discomfort noted. Listen to your body.';
    showSmartSuggestion(message);
    
    // Log pain for future reference
    console.log(`Pain reported: ${bodyPart} during current exercise`);
    
    setShowPainModal(false);
    playSound('button');
  };

  const showSafeAlternatives = () => {
    setSelectedReason('pain');
    setShowPainModal(false);
    setShowAlternativesModal(true);
    showSmartSuggestion('Showing safe alternatives for your comfort.');
  };

  // Workout exercises data
  const workoutExercises = [
    { id: 0, name: 'Bench Press', sets: 4, reps: '8-10', equipment: 'Barbell + Bench', status: 'current' },
    { id: 1, name: 'Incline Dumbbell Press', sets: 3, reps: '8-10', equipment: 'Dumbbells + Incline Bench', status: 'next' },
    { id: 2, name: 'Cable Chest Fly', sets: 3, reps: '12-15', equipment: 'Cable Machine', status: 'upcoming' },
    { id: 3, name: 'Dips', sets: 3, reps: '8-12', equipment: 'Dip Bars', status: 'upcoming' },
    { id: 4, name: 'Push-ups', sets: 3, reps: '15-20', equipment: 'Bodyweight', status: 'upcoming' },
    { id: 5, name: 'Chest Stretch', sets: 1, reps: '30s hold', equipment: 'None', status: 'upcoming' }
  ];

  // Scroll to current exercise when index changes
  useEffect(() => {
    if (carouselRef.current) {
      const container = carouselRef.current;
      const cardWidth = container.scrollWidth / workoutExercises.length;
      const scrollPosition = currentExerciseIndex * cardWidth;
      container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    }
  }, [currentExerciseIndex, workoutExercises.length]);

  // Calculate workout progress
  const calculateProgress = () => {
    const currentExercise = workoutExercises[currentExerciseIndex];
    const totalSets = currentExercise?.sets || 4;
    const progress = Math.round((currentExerciseState.completedSets / totalSets) * 100);
    return Math.min(progress, 100);
  };

  // Calculate overall workout progress
  const calculateOverallProgress = () => {
    const totalExercises = workoutExercises.length;
    const completedCount = completedExercises.length;
    const currentExerciseProgress = currentExerciseState.completedSets / (workoutExercises[currentExerciseIndex]?.sets || 4);
    
    const overallProgress = ((completedCount + currentExerciseProgress) / totalExercises) * 100;
    return Math.min(Math.round(overallProgress), 100);
  };

  // Auto-advance to next exercise
  const advanceToNextExercise = () => {
    const nextExerciseIndex = currentExerciseIndex + 1;
    const nextExercise = workoutExercises[nextExerciseIndex];
    
    if (nextExercise) {
      // Mark current exercise as completed
      setCompletedExercises(prev => [...prev, currentExerciseIndex]);
      
      // Move to next exercise
      setCurrentExerciseIndex(nextExerciseIndex);
      
      // Start rest timer automatically
      startRestTimer();
      
      // Show smart suggestion
      showSmartSuggestion(`Moving to ${nextExercise.name}. Great work! 💪`);
      
      // Update overall progress
      setOverallWorkoutProgress(calculateOverallProgress());
      
      playSound('complete');
    } else {
      // Workout completed!
      setCompletedExercises(prev => [...prev, currentExerciseIndex]);
      setOverallWorkoutProgress(100);
      showSmartSuggestion('🎉 Workout completed! Amazing job today!');
      playSound('complete');
    }
  };

  // Check if exercise is completed and auto-advance
  const checkExerciseCompletion = () => {
    const currentExercise = workoutExercises[currentExerciseIndex];
    const totalSets = currentExercise?.sets || 4;
    
    if (currentExerciseState.completedSets >= totalSets && autoAdvanceEnabled) {
      // Small delay to show completion
      setTimeout(() => {
        advanceToNextExercise();
      }, 1500);
    }
  };

  // Generate smart weight suggestions based on RPE and progression
  const generateWeightSuggestion = () => {
    const currentExercise = workoutExercises[currentExerciseIndex];
    const totalSets = currentExercise?.sets || 4;
    
    // Base suggestions on RPE and set completion
    if (currentExerciseState.completedSets === 0) {
      // First set - suggest based on previous performance
      setWeightSuggestion(`${currentExerciseState.weight} lbs`);
      setSuggestionReason('Start with current weight');
      return;
    }
    
    // Analyze RPE patterns for completed sets
    const rpeLevel = currentExerciseState.rpe;
    const setsCompleted = currentExerciseState.completedSets;
    const setsRemaining = totalSets - setsCompleted;
    
    let suggestedWeight = currentWeight;
    let reason = '';
    
    if (rpeLevel <= 2) {
      // Too easy - suggest increase
      if (setsCompleted >= 2) {
        suggestedWeight = currentWeight + 5;
        reason = `RPE ${rpeLevel}/5 - Ready for progression!`;
      } else {
        suggestedWeight = currentWeight + 2.5;
        reason = `RPE ${rpeLevel}/5 - Slightly increase weight`;
      }
    } else if (rpeLevel === 3) {
      // Perfect - maintain or slight increase
      if (setsCompleted >= 3) {
        suggestedWeight = currentWeight + 2.5;
        reason = `RPE ${rpeLevel}/5 - Perfect! Ready for small increase`;
      } else {
        suggestedWeight = currentWeight;
        reason = `RPE ${rpeLevel}/5 - Perfect weight, maintain`;
      }
    } else if (rpeLevel === 4) {
      // Challenging - maintain weight
      suggestedWeight = currentWeight;
      reason = `RPE ${rpeLevel}/5 - Challenging but doable`;
    } else if (rpeLevel >= 5) {
      // Too hard - suggest decrease
      suggestedWeight = Math.max(currentWeight - 5, 0);
      reason = `RPE ${rpeLevel}/5 - Consider reducing weight`;
    }
    
    // Adjust for remaining sets
    if (setsRemaining <= 1 && rpeLevel >= 4) {
      suggestedWeight = Math.max(suggestedWeight - 2.5, 0);
      reason += ' (Final set - reduce for safety)';
    }
    
    // Ensure we don't suggest negative weight
    suggestedWeight = Math.max(suggestedWeight, 0);
    
    setWeightSuggestion(`${suggestedWeight} lbs`);
    setSuggestionReason(reason);
  };

  // Generate alternative exercises
  // Load all exercises from database
  const loadAllExercises = async () => {
    if (isLoadingAllExercises) return;
    
    setIsLoadingAllExercises(true);
    try {
      // Get all exercises from our database
      const allExercisesFromDB = EXERCISE_DATABASE.map(exercise => ({
        id: exercise.id,
        name: exercise.name,
        category: exercise.category,
        muscleGroups: exercise.muscleGroups,
        equipment: exercise.equipment,
        difficulty: exercise.difficulty,
        instructions: exercise.instructions,
        tips: exercise.tips
      }));
      
      setAllExercises(allExercisesFromDB);
    } catch (error) {
      console.error('Failed to load exercises:', error);
      setAllExercises([]);
    } finally {
      setIsLoadingAllExercises(false);
    }
  };

  const generateAlternativeExercises = async () => {
    if (isGeneratingAlternatives) return;
    
    setIsGeneratingAlternatives(true);
    try {
      const currentExercise = workoutExercises.find(e => e.id === currentExerciseIndex);
      
      // First, try to find alternatives from our database
      let alternatives = [];
      
      // Search by exercise name for variations
      const searchResults = searchExercises(currentExercise?.name || '');
      
      // Get exercises that target similar muscle groups
      const chestExercises = getExercisesByMuscleGroup(MuscleGroup.CHEST);
      const shoulderExercises = getExercisesByMuscleGroup(MuscleGroup.SHOULDERS);
      const tricepExercises = getExercisesByMuscleGroup(MuscleGroup.TRICEPS);
      
      // Combine and filter unique exercises
      const allRelated = [...chestExercises, ...shoulderExercises, ...tricepExercises];
      const uniqueAlternatives = allRelated.filter(exercise => 
        exercise.name !== currentExercise?.name
      ).slice(0, 5);
      
      alternatives = [...searchResults, ...uniqueAlternatives];
      
      // If we don't have enough alternatives, use AI to generate more
      if (alternatives.length < 3) {
        const prompt = `I'm doing ${currentExercise?.name} but want alternatives. Suggest 3-4 different exercises that target similar muscles (chest, shoulders, triceps) but use different equipment or movement patterns. Keep each suggestion under 30 words.`;
        
        let aiResponse = '';
        const stream = nimbusAI.streamMessage(prompt, {
          currentExercise: currentExercise?.name,
          targetMuscles: ['chest', 'shoulders', 'triceps'],
          needAlternatives: true
        });
        
        for await (const chunk of stream) {
          aiResponse += chunk;
        }
        
        // Parse AI suggestions
        const aiSuggestions = aiResponse
          .split('\n')
          .filter(line => line.trim().length > 0)
          .map(line => line.replace(/^\d+\.\s*/, '').trim())
          .slice(0, 3)
          .map(suggestion => ({
            id: `ai-${Date.now()}-${Math.random()}`,
            name: suggestion,
            equipment: 'AI Suggested',
            reason: 'Alternative movement pattern'
          }));
        
        alternatives = [...alternatives, ...aiSuggestions];
      }
      
      setAlternativeExercises(alternatives.slice(0, 6));
      
    } catch (error) {
      console.error('Alternative exercise generation failed:', error);
      // Fallback alternatives
      setAlternativeExercises([
        { id: 'dumbbell-press', name: 'Dumbbell Bench Press', equipment: 'Dumbbells + Bench', reason: 'Similar movement, different equipment' },
        { id: 'incline-press', name: 'Incline Barbell Press', equipment: 'Barbell + Incline Bench', reason: 'Upper chest focus' },
        { id: 'push-ups', name: 'Push-ups', equipment: 'Bodyweight', reason: 'No equipment needed' },
        { id: 'dips', name: 'Dips', equipment: 'Dip Bars', reason: 'Compound movement' },
        { id: 'cable-press', name: 'Cable Chest Press', equipment: 'Cable Machine', reason: 'Constant tension' }
      ]);
    } finally {
      setIsGeneratingAlternatives(false);
    }
  };

  const generateAISuggestions = async () => {
    if (isGeneratingAI) return;
    
    setIsGeneratingAI(true);
    try {
      const currentExercise = workoutExercises.find(e => e.id === currentExerciseIndex);
      const prompt = `I'm doing ${currentExercise?.name} with ${currentWeight} lbs for ${currentReps} reps. My RPE is ${currentRPE}/10. Give me 2-3 specific, actionable suggestions for this exercise. Keep each suggestion under 50 words.`;
      
      let fullResponse = '';
      const stream = nimbusAI.streamMessage(prompt, {
        currentExercise: currentExercise?.name,
        currentWeight,
        currentReps,
        currentRPE,
        workoutContext: 'strength training'
      });
      
      for await (const chunk of stream) {
        fullResponse += chunk;
      }
      
      // Parse the response into individual suggestions
      const suggestions = fullResponse
        .split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .slice(0, 3);
      
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('AI suggestion generation failed:', error);
      setAiSuggestions([
        "Focus on controlled breathing - inhale on the way down, exhale on the way up",
        "Keep your core tight and maintain proper form throughout the movement",
        "Consider your RPE - if it feels too easy, you might be ready to increase weight"
      ]);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const selectExercise = (exerciseId: number) => {
    setCurrentExerciseIndex(exerciseId);
    setShowExerciseSelector(false);
    showSmartSuggestion(`Switched to ${workoutExercises[exerciseId]?.name}`);
    playSound('button');
  };

  const swapExercise = (newExercise: any) => {
    // Update the current exercise in the workout
    const updatedWorkoutExercises = workoutExercises.map((exercise, index) => 
      index === currentExerciseIndex 
        ? { ...exercise, name: newExercise.name, equipment: newExercise.equipment }
        : exercise
    );
    
    // Reset progress for the new exercise
    updateExerciseState(currentExerciseIndex, { completedSets: 0 });
    
    showSmartSuggestion(`Swapped to ${newExercise.name}`);
    setShowExerciseSwapper(false);
    playSound('button');
  };

  // Plate Calculator Functions
  const openPlateCalculator = (value: number, type: 'weight' | 'reps') => {
    setPlateCalculatorType(type);
    setPlateCalculatorValue(value);
    setShowPlateCalculator(true);
  };

  const calculatePlates = (weight: number) => {
    const barWeight = 45; // Standard barbell weight
    const availablePlates = [45, 35, 25, 10, 5, 2.5]; // Available plate weights
    const platesPerSide = (weight - barWeight) / 2;
    
    if (platesPerSide <= 0) return [];
    
    const result: { weight: number; count: number }[] = [];
    let remainingWeight = platesPerSide;
    
    for (const plateWeight of availablePlates) {
      const count = Math.floor(remainingWeight / plateWeight);
      if (count > 0) {
        result.push({ weight: plateWeight, count });
        remainingWeight -= count * plateWeight;
      }
    }
    
    return result;
  };

  const applyPlateCalculatorValue = () => {
    if (plateCalculatorType === 'weight') {
      updateExerciseState(currentExerciseIndex, { weight: plateCalculatorValue });
    } else {
      updateExerciseState(currentExerciseIndex, { reps: plateCalculatorValue });
    }
    setShowPlateCalculator(false);
  };

  const skipExercise = () => {
    showSmartSuggestion('Exercise skipped. Your safety comes first!');
    setShowPainModal(false);
    // In a real app, this would move to the next exercise
    playSound('button');
  };

  const addSetToExercise = (exerciseIndex: number) => {
    setDynamicSets(prev => ({
      ...prev,
      [exerciseIndex]: (prev[exerciseIndex] || 0) + 1
    }));
    showSmartSuggestion('Set added to exercise!');
  };

  const getTotalSets = (exerciseIndex: number) => {
    const baseSets = workoutExercises[exerciseIndex]?.sets || 4;
    const additionalSets = dynamicSets[exerciseIndex] || 0;
    return baseSets + additionalSets;
  };

  const handleNextExercise = () => {
    setShowExerciseCompletionOverlay(null);
    advanceToNextExercise();
  };

  const handleAddAnotherSet = () => {
    setShowExerciseCompletionOverlay(null);
    addSetToExercise(currentExerciseIndex);
    // Reset completed sets to allow logging the new set
    updateExerciseState(currentExerciseIndex, { 
      completedSets: getTotalSets(currentExerciseIndex) - 1 
    });
  };

  const getExerciseAnalytics = (exerciseIndex: number) => {
    const exercise = workoutExercises[exerciseIndex];
    const exerciseState = getExerciseState(exerciseIndex);
    const history = exerciseState.history;
    
    if (history.length === 0) return null;
    
    const totalWeight = history.reduce((sum, set) => sum + set.weight, 0);
    const totalReps = history.reduce((sum, set) => sum + set.reps, 0);
    const avgWeight = Math.round(totalWeight / history.length);
    const avgReps = Math.round(totalReps / history.length);
    const maxWeight = Math.max(...history.map(set => set.weight));
    const minWeight = Math.min(...history.map(set => set.weight));
    const dropSets = history.filter(set => set.isDropSet).length;
    
    return {
      totalSets: history.length,
      avgWeight,
      avgReps,
      maxWeight,
      minWeight,
      dropSets,
      totalVolume: totalWeight * totalReps
    };
  };

  return (
    <div className="space-y-modern animate-fade-in-up">
      {/* Exercise Header */}
      <div className="card card-elevated">
                                <div className="flex items-center justify-between mb-4">
              <div>
              <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-gray-400 font-medium tracking-wider uppercase">
                Chest Day • Exercise {currentExerciseIndex + 1}/{workoutExercises.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowProgressInfo(!showProgressInfo)}
                  className="relative w-3 h-3 bg-blue-500 rounded-full hover:bg-blue-400 transition-all duration-300 animate-pulse hover:animate-none hover:scale-110 shadow-lg hover:shadow-blue-500/50 cursor-pointer group"
                  title="Click for progress info"
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                    Click for info
                  </div>
                </button>
                <span className="text-xs text-blue-400 font-medium">
                  Workout: {calculateOverallProgress()}%
                </span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{workoutExercises[currentExerciseIndex]?.name}</h1>
            <div className="text-gray-300">
              Set {currentExerciseState.completedSets + 1} of {workoutExercises[currentExerciseIndex]?.sets} • Personal record zone
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Auto-Advance Toggle */}
            <button
              onClick={() => setAutoAdvanceEnabled(!autoAdvanceEnabled)}
              className={`px-3 py-2 text-xs rounded-full transition-colors flex items-center gap-1 ${
                autoAdvanceEnabled 
                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                  : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
              }`}
            >
              {autoAdvanceEnabled ? 'Auto ✓' : 'Auto ✗'}
            </button>
            
            {/* Change Exercise Button */}
            <button
              onClick={() => {
                setShowExerciseSwapper(!showExerciseSwapper);
                if (!showExerciseSwapper) {
                  loadAllExercises();
                }
              }}
              disabled={isLoadingAllExercises}
              className="px-3 py-2 text-xs bg-purple-500/20 text-purple-400 rounded-full hover:bg-purple-500/30 transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {isLoadingAllExercises ? (
                <>
                  <div className="w-3 h-3 border border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                  Loading...
                </>
              ) : (
                <>
                  Change Exercise
                </>
              )}
            </button>
            
            {/* Alternative Exercise Button */}
            <button
              onClick={() => {
                setShowAlternativeExercises(!showAlternativeExercises);
                if (!showAlternativeExercises) {
                  generateAlternativeExercises();
                }
              }}
              disabled={isGeneratingAlternatives}
              className="px-3 py-2 text-xs bg-lime-500/20 text-lime-400 rounded-full hover:bg-lime-500/30 transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {isGeneratingAlternatives ? (
                <>
                  <div className="w-3 h-3 border border-lime-400 border-t-transparent rounded-full animate-spin"></div>
                  Loading...
                </>
              ) : (
                <>
                  Alternatives
                </>
              )}
            </button>
            
            {/* Progress Ring */}
            <div className="w-16 h-16 relative">
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 flex items-center gap-1">
                <span className="text-xs text-gray-400 font-medium">Exercise</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                {/* Background circle */}
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="rgba(34, 197, 94, 0.2)"
                  strokeWidth="4"
                  fill="none"
                />
                {/* Progress circle */}
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="url(#progressGradient)"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - calculateProgress() / 100)}`}
                  className="transition-all duration-500 ease-out drop-shadow-lg"
                  filter="drop-shadow(0 0 8px rgba(34, 197, 94, 0.3))"
                />
                {/* Gradient definition */}
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#4ade80" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center">
                  <span className="text-sm font-semibold text-green-400">{calculateProgress()}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Workout Template Toggle */}
        <div className="mt-4 pt-4 border-t border-gray-800">
          <button 
            onClick={() => setShowTemplate(!showTemplate)}
            className="w-full flex items-center justify-between p-3 glass rounded-lg hover:bg-white/5 transition-modern"
          >
            <span className="text-sm font-medium">What's Next?</span>
            {showTemplate ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
        
        {/* Template Section */}
        {showTemplate && (
          <div className="mt-4 space-y-3 animate-fade-in">
            {/* Exercise Selector */}
            <div className="p-4 glass rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-gray-400 font-medium tracking-wider uppercase">Choose Exercise:</span>
                <button 
                  onClick={() => setShowExerciseSelector(!showExerciseSelector)}
                  className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full hover:bg-green-500/20 transition-colors"
                >
                  {showExerciseSelector ? 'Hide' : 'Show'}
                </button>
              </div>
              
              {showExerciseSelector && (
                <div className="space-y-2 mb-3">
                  {workoutExercises.map((exercise, index) => (
                    <button
                      key={exercise.id}
                      onClick={() => selectExercise(index)}
                      className={`w-full p-3 rounded-lg text-left transition-modern ${
                        index === currentExerciseIndex 
                          ? 'glass-strong border border-green-500/20' 
                          : 'glass hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-white">{exercise.name}</div>
                          <div className="text-xs text-gray-400">{exercise.sets} sets × {exercise.reps}</div>
                          <div className="text-xs text-green-400">🏋️ {exercise.equipment}</div>
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          exercise.status === 'current' ? 'bg-blue-500/20 text-blue-400' :
                          exercise.status === 'next' ? 'bg-green-500/20 text-green-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {exercise.status}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {/* Current Exercise Info */}
              <div className="p-3 glass-strong border border-green-500/20 rounded-lg">
                <div className="text-sm font-semibold text-white mb-1">
                  {workoutExercises[currentExerciseIndex]?.name}
                </div>
                <div className="text-xs text-gray-400">
                  {workoutExercises[currentExerciseIndex]?.sets} sets × {workoutExercises[currentExerciseIndex]?.reps}
                </div>
                <div className="text-xs text-green-400 mt-1">
                  🏋️ {workoutExercises[currentExerciseIndex]?.equipment}
                </div>
              </div>
            </div>
            
            {/* AI Suggestions */}
            <div className="p-4 glass rounded-lg border-l-4 border-purple-500">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-purple-400 font-medium tracking-wider uppercase">
                  💡 AI Coach Says
                </div>
                <button
                  onClick={generateAISuggestions}
                  disabled={isGeneratingAI}
                  className="text-xs text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full hover:bg-purple-500/20 transition-colors disabled:opacity-50"
                >
                  {isGeneratingAI ? 'Generating...' : 'Refresh'}
                </button>
              </div>
              <div className="space-y-2">
                {aiSuggestions.length > 0 ? (
                  aiSuggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 glass rounded">
                      <span className="text-sm">{index === 0 ? '🎯' : index === 1 ? '⚡' : '💪'}</span>
                      <span className="text-xs text-gray-300">{suggestion}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <button
                      onClick={generateAISuggestions}
                      disabled={isGeneratingAI}
                      className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      {isGeneratingAI ? 'Generating AI suggestions...' : 'Get AI suggestions'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modern Exercise Carousel - World-Class Implementation */}
      <div className="card card-elevated">
        {/* Carousel Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-xs text-gray-400 font-medium tracking-wider uppercase">Exercise Cards</div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Swipe to navigate</span>
          </div>
        </div>
        
        {/* Modern Carousel Implementation */}
        <div className="relative w-full">
          {/* Accessibility Instructions */}
          <div className="sr-only">
            Use arrow keys to navigate between exercises. Press Home to go to first exercise, End to go to last exercise.
          </div>
          
          {/* Bulletproof Carousel Viewport */}
          <div className="relative overflow-hidden rounded-xl -mx-4">
            {/* Carousel Track */}
            <div 
              ref={carouselRef}
              onScroll={handleCarouselScroll}
              onKeyDown={handleKeyNavigation}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="flex transition-transform duration-300 ease-out"
              style={{ 
                width: `${workoutExercises.length * 100}%`,
                transform: `translateX(-${(currentExerciseIndex / workoutExercises.length) * 100}%)`
              }}
              role="region"
              aria-label="Exercise carousel"
              tabIndex={0}
            >
              {workoutExercises.map((exercise, index) => {
                const isCurrent = index === currentExerciseIndex;
                const currentExerciseState = getExerciseState(index);
                
                return (
                  <div
                    key={exercise.id}
                    className={`
                      flex-shrink-0 bg-transparent rounded-xl shadow-lg border-2 transition-all duration-300 
                      max-h-[85vh] overflow-y-auto overflow-x-hidden
                      ${isCurrent ? 'border-fitness-blue scale-105 shadow-xl' : 'border-gray-700 opacity-80'}
                      hover:scale-102
                    `}
                    style={{ 
                      width: `${100 / workoutExercises.length}%`,
                      padding: '0.5rem 1rem'
                    }}
                    role="article"
                    aria-label={`${exercise.name} - ${exercise.sets} sets of ${exercise.reps} reps`}
                    aria-current={isCurrent ? 'true' : 'false'}
                  >
                    {/* Bulletproof Exercise Card Content */}
                    <div className="p-2 sm:p-3 lg:p-4 xl:p-5">
                      {/* Mobile Exercise Header */}
                      <div className="text-center mb-4">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
                          {exercise.name}
                        </h3>
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2">
                          {getTotalSets(index)} sets × {exercise.reps}
                          {dynamicSets[index] > 0 && (
                            <span className="text-blue-600 dark:text-blue-400 ml-1">
                              (+{dynamicSets[index]})
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-green-700 dark:text-green-400">
                          {exercise.equipment}
                        </div>
                      </div>
                      

                      

                      
                      {/* Bulletproof Smart Header */}
                      <div className="flex flex-col sm:flex-row items-center justify-between mb-3 sm:mb-4 p-2 sm:p-3 lg:p-4 bg-gray-100/80 dark:bg-gray-800/30 rounded-lg gap-2 sm:gap-3">
                        <div className="text-center">
                          <div className="text-xs text-gray-600 dark:text-gray-400">Previous</div>
                          <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate max-w-[80px] sm:max-w-none">{previousSet}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-600 dark:text-gray-400">Current</div>
                          <div className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-400">Set {currentExerciseState.completedSets + 1}/{exercise.sets}</div>
                        </div>
                        {weightSuggestion && (
                          <div className="text-center">
                            <div className="text-xs text-gray-600 dark:text-gray-400">Suggestion</div>
                            <div className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-400">{weightSuggestion}</div>
                          </div>
                        )}
                      </div>

                      {/* Set Bars Interface */}
                      <div className="mb-4">
                        {/* Set Progress Bars */}
                        <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-5 px-1 sm:px-2">
                          {Array.from({ length: getTotalSets(index) }, (_, setIndex) => {
                            const isCompleted = setIndex < currentExerciseState.completedSets;
                            const isActive = setIndex === currentExerciseState.completedSets;
                            const isUpcoming = setIndex > currentExerciseState.completedSets;
                            
                            return (
                              <div
                                key={setIndex}
                                onClick={() => {
                                  // If clicking on a completed set, bring it back to active
                                  if (isCompleted) {
                                    updateExerciseState(index, { 
                                      completedSets: setIndex 
                                    });
                                  }
                                }}
                                className={`flex-1 h-3 sm:h-4 rounded-full cursor-pointer transition-all duration-200 mx-1 ${
                                  isCompleted 
                                    ? 'bg-green-500' 
                                    : isActive 
                                      ? 'bg-blue-500' 
                                      : 'bg-gray-600'
                                } ${isCompleted ? 'hover:bg-green-400' : ''}`}
                                title={`Set ${setIndex + 1}${isCompleted ? ' (Completed)' : isActive ? ' (Active)' : ' (Upcoming)'}`}
                              />
                            );
                          })}
                        </div>
                        
                        {/* Active Set Controls */}
                        <div className="p-3 sm:p-4 lg:p-5 xl:p-6 bg-gray-100/80 dark:bg-gray-800/30 rounded-lg mb-3 sm:mb-4">
                          <div className="text-center mb-5">
                            <span className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">Set {currentExerciseState.completedSets + 1}</span>
                            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 ml-2">of {getTotalSets(index)}</span>
                          </div>
                          
                          {/* Weight Control */}
                          <div className="flex items-center justify-between mb-5">
                            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Weight (lbs)</span>
                            <div className="flex items-center gap-2 sm:gap-3">
                              <button
                                onClick={() => updateExerciseState(index, { weight: Math.max(0, currentExerciseState.weight - 5) })}
                                className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-white font-bold text-lg sm:text-xl min-w-[40px] sm:min-w-[48px]"
                              >
                                -
                              </button>
                              <button
                                onClick={() => openPlateCalculator(currentExerciseState.weight, 'weight')}
                                className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 hover:bg-blue-100 dark:bg-gray-800 dark:hover:bg-blue-700 rounded text-gray-900 dark:text-white font-bold text-lg sm:text-xl border-2 border-blue-500/40 min-w-[40px] sm:min-w-[48px]"
                                title="Tap to enter custom weight"
                              >
                                {currentExerciseState.weight}
                              </button>
                              <button
                                onClick={() => updateExerciseState(index, { weight: currentExerciseState.weight + 5 })}
                                className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-white font-bold text-lg sm:text-xl min-w-[40px] sm:min-w-[48px]"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          
                          {/* Reps Control */}
                          <div className="flex items-center justify-between mb-5">
                            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Reps</span>
                            <div className="flex items-center gap-2 sm:gap-3">
                              <button
                                onClick={() => updateExerciseState(index, { 
                                  reps: Math.max(1, currentExerciseState.reps - 1) 
                                })}
                                className="w-10 h-10 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-white font-bold text-lg min-w-[40px]"
                              >
                                -
                              </button>
                              <span className="w-12 sm:w-16 text-center text-gray-900 dark:text-white font-bold text-lg">{currentExerciseState.reps}</span>
                              <button
                                onClick={() => updateExerciseState(index, { 
                                  reps: currentExerciseState.reps + 1 
                                })}
                                className="w-10 h-10 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-white font-bold text-lg min-w-[40px]"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          
                          {/* RPE Control */}
                          <div className="flex items-center justify-between mb-5">
                            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">RPE</span>
                            <div className="flex items-center gap-2 sm:gap-3">
                              <button
                                onClick={() => updateExerciseState(index, {
                                  rpe: Math.max(1, currentExerciseState.rpe - 1)
                                })}
                                className="w-10 h-10 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-white font-bold text-lg min-w-[40px]"
                              >
                                -
                              </button>
                              <span className="w-12 sm:w-16 text-center text-gray-900 dark:text-white font-bold text-lg">{currentExerciseState.rpe}</span>
                              <button
                                onClick={() => updateExerciseState(index, {
                                  rpe: Math.min(10, currentExerciseState.rpe + 1)
                                })}
                                className="w-10 h-10 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-white font-bold text-lg min-w-[40px]"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="grid grid-cols-3 gap-3 mt-5">
                            <button
                              onClick={() => {
                                showSmartSuggestion('Set marked as failed');
                                completeNormalSet();
                              }}
                              className="w-full py-3 sm:py-4 bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300 rounded-lg font-medium hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors text-xs sm:text-base min-h-[48px]"
                            >
                              ❌ Fail Set
                            </button>
                            <button
                              onClick={() => {
                                completeNormalSet();
                              }}
                              className="w-full py-3 sm:py-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-xs sm:text-base min-h-[48px]"
                            >
                              ✅ Log Set
                            </button>
                            <button
                              onClick={() => {
                                setDropSetWeight(Math.round(currentExerciseState.weight * 0.8));
                                setDropSetReps(Math.floor(currentExerciseState.reps * 0.6));
                                setShowDropSetForIndex(currentExerciseState.completedSets);
                              }}
                              className="w-full py-3 sm:py-4 bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300 rounded-lg font-medium hover:bg-purple-200 dark:hover:bg-purple-500/30 transition-colors text-xs sm:text-base min-h-[48px]"
                            >
                              🔽 Drop Set
                            </button>
                          </div>
                        </div>
                        

                        
                        {/* Last Workout Reference */}
                        {exerciseHistory.length > 0 && (
                          <div className="p-2 sm:p-3 lg:p-4 xl:p-5 bg-blue-50 border border-blue-200 dark:bg-blue-500/5 dark:border-blue-500/10 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-blue-700 dark:text-blue-400 font-medium text-xs sm:text-sm">Last Workout</span>
                              <span className="text-gray-600 dark:text-gray-400 text-xs">Monday, 15 Jul</span>
                            </div>
                            
                            <div className="flex items-center justify-center gap-3 sm:gap-4 lg:gap-6 text-xs sm:text-sm mb-4">
                              <div className="text-center">
                                <div className="text-gray-900 dark:text-white font-medium">{exerciseHistory[exerciseHistory.length - 1]?.weight || 0}</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">lbs</div>
                              </div>
                              <div className="text-center">
                                <div className="text-gray-900 dark:text-white font-medium">{exerciseHistory[exerciseHistory.length - 1]?.reps || 0}</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">reps</div>
                              </div>
                              <div className="text-center">
                                <div className="text-gray-900 dark:text-white font-medium">RPE {exerciseHistory[exerciseHistory.length - 1]?.rpe || 0}</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">effort</div>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => {
                                const lastSet = exerciseHistory[exerciseHistory.length - 1];
                                if (lastSet) {
                                  updateExerciseState(index, {
                                    weight: lastSet.weight,
                                    reps: lastSet.reps,
                                    rpe: lastSet.rpe
                                  });
                                  showSmartSuggestion('Loaded last set from previous workout');
                                }
                              }}
                              className="w-full py-3 bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300 rounded-lg font-medium hover:bg-green-200 dark:hover:bg-green-500/30 transition-colors text-xs sm:text-sm min-h-[48px]"
                            >
                              📋 Use Last Set
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Mobile Navigation */}
          <div className="flex items-center justify-center mt-3">
            <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-400">
              <span className="hidden sm:inline">👈 Swipe to navigate</span>
              <span className="sm:hidden">👈 Swipe</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">Tap dots below</span>
            </div>
          </div>
          
          {/* Bulletproof Navigation Dots */}
          <div className="flex justify-center gap-3 sm:gap-4 mt-4">
            {workoutExercises.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentExerciseIndex(index)}
                className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full transition-colors min-w-[16px] sm:min-w-[20px] ${
                  index === currentExerciseIndex 
                    ? 'bg-fitness-blue' 
                    : 'bg-gray-400 hover:bg-gray-300'
                }`}
                aria-label={`Go to exercise ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Voice Input */}
      <div className="card card-elevated">
        <div className="text-xs text-gray-400 font-medium tracking-wider uppercase mb-4">Voice Notes</div>
        <div className="p-4 glass-strong border border-green-500/20 rounded-lg mb-4 min-h-[56px] flex items-center justify-center">
          <div className="text-sm text-green-400 font-medium">{voiceText}</div>
        </div>
        
        <button 
          onClick={toggleVoice}
          className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl transition-modern ${
            isListening 
              ? 'bg-green-500 text-black animate-pulse' 
              : 'bg-gradient-to-br from-green-500 to-green-400 text-black hover:scale-105'
          }`}
        >
          <Mic className="w-6 h-6" />
        </button>

        {/* Drop Set Section */}
        {showDropSet && (
          <div className="p-4 glass-strong border border-green-500/20 rounded-lg mb-4 animate-fade-in">
            <div className="text-xs text-green-400 font-medium tracking-wider uppercase mb-3 text-center">
              Failed & Dropped Weight
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-center gap-2 p-2 glass rounded">
                <span className="text-xs text-gray-400 uppercase">Started at:</span>
                <span className="text-lg font-semibold text-white">{currentWeight}lbs</span>
                <span className="text-sm text-white">×</span>
                <input 
                  type="number" 
                  defaultValue={Math.floor(currentReps * 0.6)}
                  className="w-12 p-1 glass rounded text-center text-sm"
                />
                <span className="text-sm text-white">reps</span>
              </div>
              <div className="text-center text-green-400 text-lg">↓</div>
              <div className="flex items-center justify-center gap-2 p-2 glass rounded">
                <span className="text-xs text-gray-400 uppercase">Dropped to:</span>
                <span className="text-lg font-semibold text-white">{Math.round(currentWeight * 0.8)}lbs</span>
                <span className="text-sm text-white">×</span>
                <input 
                  type="number" 
                  defaultValue={Math.floor(currentReps * 0.4)}
                  className="w-12 p-1 glass rounded text-center text-sm"
                />
                <span className="text-sm text-white">reps</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={cancelDropLog}
                className="flex-1 p-3 glass rounded-lg text-sm font-medium hover:bg-white/5 transition-modern"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDropLog}
                className="flex-1 p-3 bg-green-500 text-black rounded-lg text-sm font-medium hover:bg-green-400 transition-modern"
              >
                Log Failed + Drop Set
              </button>
            </div>
          </div>
        )}

        {/* Main Log Button */}
        <button 
          onClick={logSet}
          className="w-full h-14 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-400 transition-modern"
        >
          {showFailureOptions ? 'Completed Full Set' : 'Log Set'}
        </button>

        {/* Failure Options */}
        {showFailureOptions && (
          <div className="flex gap-2 mt-3 animate-fade-in">
            <button 
              onClick={logFailure}
              className="flex-1 p-3 glass rounded-lg text-sm font-medium hover:bg-white/5 transition-modern"
            >
              ❌ Failed Set
            </button>
            <button 
              onClick={startDropLog}
              className="flex-1 p-3 glass rounded-lg text-sm font-medium border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 transition-modern"
            >
              🔄 Failed → Drop Weight
            </button>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card card-elevated">
        <div className="text-xs text-gray-400 font-medium tracking-wider uppercase mb-4">Quick Actions</div>
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => setShowAlternativesModal(true)}
            className="p-4 glass rounded-lg text-sm font-medium hover:bg-white/5 transition-modern text-center min-h-[48px] flex items-center justify-center"
          >
            🔄 Switch Exercise
          </button>
          <button 
            onClick={() => setShowDifficultyModal(true)}
            className="p-4 glass rounded-lg text-sm font-medium hover:bg-white/5 transition-modern text-center min-h-[48px] flex items-center justify-center"
          >
            ⚡ How did that feel?
          </button>
          <button 
            onClick={() => setShowPainModal(true)}
            className="p-4 glass rounded-lg text-sm font-medium hover:bg-white/5 transition-modern text-center min-h-[48px] flex items-center justify-center"
          >
            🩹 Something hurts
          </button>
          <button 
            onClick={startDropLog}
            className="p-4 glass rounded-lg text-sm font-medium hover:bg-white/5 transition-modern text-center min-h-[48px] flex items-center justify-center"
          >
            🔥 Failed + Drop
          </button>
        </div>
      </div>



      {/* Smart Suggestions Display */}
      {smartSuggestions.length > 0 && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-sm w-full px-4">
          {smartSuggestions.map(suggestion => (
            <div
              key={suggestion.id}
              className={`mb-2 p-3 rounded-lg text-sm font-medium text-center animate-fade-in-up ${
                suggestion.priority === 'high' 
                  ? 'bg-red-500/90 text-white' 
                  : suggestion.priority === 'medium'
                  ? 'bg-yellow-500/90 text-black'
                  : 'bg-green-500/90 text-white'
              }`}
            >
              {suggestion.message}
              {suggestion.action && (
                <button
                  onClick={suggestion.action}
                  className="ml-2 underline hover:no-underline"
                >
                  Apply
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Voice Status Indicator */}
      {isListening && (
        <div className="fixed top-4 right-4 z-50">
          <div className="flex items-center gap-2 p-2 glass-strong rounded-lg animate-pulse">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-white">Listening...</span>
            {voiceTranscript && (
              <span className="text-xs text-gray-300">"{voiceTranscript}"</span>
            )}
          </div>
        </div>
      )}

      {/* Alternative Exercises Modal */}
      {showAlternativesModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Alternative Exercises</h3>
              <button
                onClick={() => setShowAlternativesModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Reason Selection */}
            <div className="mb-6">
              <div className="flex gap-2 mb-4">
                {(['equipment', 'difficulty', 'pain'] as const).map(reason => (
                  <button
                    key={reason}
                    onClick={() => setSelectedReason(reason)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-modern ${
                      selectedReason === reason
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {reason === 'equipment' ? 'Equipment' : reason === 'difficulty' ? 'Difficulty' : 'Pain'}
                  </button>
                ))}
              </div>
            </div>

            {/* Alternative Exercises List */}
            <div className="space-y-3">
              {getAlternativeExercises(selectedReason).map(exercise => (
                <div
                  key={exercise.id}
                  onClick={() => switchToExercise(exercise)}
                  className="p-4 glass rounded-lg cursor-pointer hover:bg-white/5 transition-modern"
                >
                  <div className="text-lg font-semibold text-white mb-1">{exercise.name}</div>
                  <div className="text-sm text-green-400 mb-2">{exercise.muscles}</div>
                  <div className="text-xs text-gray-400 mb-2">{exercise.reason}</div>
                  <div className="text-xs text-gray-500">🏋️ {exercise.equipment}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Difficulty Feedback Modal */}
      {showDifficultyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">How did that set feel?</h3>
              <button
                onClick={() => setShowDifficultyModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { level: 'easy', icon: '😴', text: 'Too Easy', action: '+10-15 lbs next set' },
                { level: 'perfect', icon: '💪', text: 'Perfect', action: 'Same weight next set' },
                { level: 'hard', icon: '😤', text: 'Too Hard', action: '-10-15 lbs next set' },
                { level: 'failed', icon: '😵', text: 'Couldn\'t Complete', action: '-20+ lbs next set' }
              ].map(({ level, icon, text, action }) => (
                <button
                  key={level}
                  onClick={() => handleDifficultyFeedback(level)}
                  className="p-4 glass rounded-lg text-center hover:bg-white/5 transition-modern"
                >
                  <div className="text-2xl mb-2">{icon}</div>
                  <div className="text-sm font-semibold text-white mb-1">{text}</div>
                  <div className="text-xs text-gray-400">{action}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Exercise Swapper Modal */}
      {showExerciseSwapper && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Change Exercise</h3>
              <button
                onClick={() => setShowExerciseSwapper(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-3">
                Choose any exercise from our database to replace the current exercise
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                {['All', 'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core'].map(category => (
                  <button
                    key={category}
                    className="px-3 py-2 text-xs bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {allExercises.map((exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => swapExercise(exercise)}
                  className="w-full p-4 glass rounded-lg text-left hover:bg-white/5 transition-modern"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-lg font-semibold text-white mb-1">{exercise.name}</div>
                      <div className="text-sm text-gray-400 mb-2">
                        {exercise.muscleGroups?.join(', ') || 'Multiple muscle groups'}
                      </div>
                      <div className="text-xs text-purple-400">
                        Equipment: {exercise.equipment?.join(', ') || 'Bodyweight'}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 ml-4">
                      Difficulty: {exercise.difficulty || 'N/A'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-500 text-center">
                💡 Choose any exercise to completely replace your current exercise. Progress will reset for the new exercise.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Alternative Exercises Modal */}
      {showAlternativeExercises && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Alternative Exercises</h3>
              <button
                onClick={() => setShowAlternativeExercises(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-3">
              {alternativeExercises.map((exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => {
                    showSmartSuggestion(`Switched to ${exercise.name}`);
                    setShowAlternativeExercises(false);
                    playSound('button');
                  }}
                  className="w-full p-4 glass rounded-lg text-left hover:bg-white/5 transition-modern"
                >
                  <div className="text-lg font-semibold text-white mb-1">{exercise.name}</div>
                  <div className="text-sm text-blue-400 mb-2">🏋️ {exercise.equipment}</div>
                  <div className="text-xs text-gray-400">{exercise.reason}</div>
                </button>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-500 text-center">
                💡 AI-powered suggestions based on your current exercise and available equipment
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Info Modal */}
      {showProgressInfo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Progress Tracking</h3>
              <button
                onClick={() => setShowProgressInfo(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 glass rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                    <span className="text-green-400 text-sm">●</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Green Ring & Dot</div>
                    <div className="text-xs text-gray-400">Current exercise progress</div>
                  </div>
                </div>
                <p className="text-xs text-gray-300">
                  Shows your progress for the current exercise (e.g., 3/4 sets completed = 75%)
                </p>
              </div>
              
              <div className="p-4 glass rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <span className="text-blue-400 text-sm">●</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Blue Dot & Text</div>
                    <div className="text-xs text-gray-400">Overall workout progress</div>
                  </div>
                </div>
                <p className="text-xs text-gray-300">
                  Shows your progress through the entire workout (e.g., 2/6 exercises completed = 33%)
                </p>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-500 text-center">
                💡 Green = Current Exercise • Blue = Overall Workout
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Workout Completion Modal */}
      {overallWorkoutProgress === 100 && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-md text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-green-500 to-green-400 rounded-full flex items-center justify-center">
              <span className="text-3xl">🎉</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Workout Complete!</h3>
            <p className="text-gray-300 mb-6">
              Amazing job! You've completed all {workoutExercises.length} exercises.
            </p>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center p-3 glass rounded-lg">
                <span className="text-gray-400">Exercises Completed</span>
                <span className="text-white font-semibold">{workoutExercises.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 glass rounded-lg">
                <span className="text-gray-400">Total Sets</span>
                <span className="text-white font-semibold">
                  {workoutExercises.reduce((total, exercise) => total + exercise.sets, 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 glass rounded-lg">
                <span className="text-gray-400">Workout Duration</span>
                <span className="text-white font-semibold">~45 min</span>
              </div>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setOverallWorkoutProgress(0);
                  setCompletedExercises([]);
                  setCurrentExerciseIndex(1);
                  setCompletedSets(0);
                }}
                className="w-full p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Start New Workout
              </button>
              <button
                onClick={() => setOverallWorkoutProgress(0)}
                className="w-full p-3 glass text-gray-300 rounded-lg hover:bg-white/5 transition-colors"
              >
                Review Workout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pain Report Modal */}
      {showPainModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Let's keep you safe</h3>
              <button
                onClick={() => setShowPainModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="text-center mb-6">
              <div className="text-lg text-white mb-4">What's bothering you?</div>
              <div className="grid grid-cols-3 gap-2 mb-6">
                {['Shoulder', 'Elbow', 'Wrist', 'Lower Back', 'Knee', 'Other'].map(part => (
                  <button
                    key={part}
                    onClick={() => reportPain(part.toLowerCase())}
                    className="p-3 glass rounded-lg text-sm hover:bg-red-500/20 hover:text-red-400 transition-modern"
                  >
                    {part}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => showSafeAlternatives()}
                  className="w-full p-3 glass rounded-lg text-sm hover:bg-white/5 transition-modern"
                >
                  🛡️ Show Safe Alternatives
                </button>
                <button
                  onClick={() => skipExercise()}
                  className="w-full p-3 glass rounded-lg text-sm hover:bg-white/5 transition-modern"
                >
                  ⏭️ Skip This Exercise
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exercise Completion Overlay */}
      {showExerciseCompletionOverlay !== null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in">
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 w-full max-w-sm sm:max-w-lg lg:max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-700 animate-scale-in">
            <div className="text-center mb-4 sm:mb-6 lg:mb-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 lg:mb-6 shadow-lg animate-bounce">
                <span className="text-xl sm:text-2xl lg:text-3xl">🎉</span>
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 sm:mb-3 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                Exercise Complete!
              </h2>
              <p className="text-sm sm:text-base lg:text-xl text-gray-300 font-medium">
                {workoutExercises[showExerciseCompletionOverlay]?.name}
              </p>
              <div className="w-16 sm:w-20 lg:w-24 h-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mx-auto mt-2 sm:mt-3 lg:mt-4"></div>
            </div>

            {/* Action Buttons - Moved to top */}
            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6 lg:mb-8">
              <button
                onClick={handleNextExercise}
                className="w-full py-3 sm:py-4 lg:py-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl sm:rounded-2xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 text-base sm:text-lg lg:text-xl flex items-center justify-center gap-2 sm:gap-3 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <span className="text-lg sm:text-xl lg:text-2xl">➡️</span>
                <span>Swipe Right for Next Exercise</span>
              </button>
              
              <button
                onClick={handleAddAnotherSet}
                className="w-full py-3 sm:py-4 lg:py-5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl sm:rounded-2xl font-bold hover:from-green-700 hover:to-green-800 transition-all duration-300 text-base sm:text-lg lg:text-xl flex items-center justify-center gap-2 sm:gap-3 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <span className="text-lg sm:text-xl lg:text-2xl">➕</span>
                <span>Add Another Set</span>
              </button>
            </div>

            {/* Exercise Analytics */}
            {(() => {
              const analytics = getExerciseAnalytics(showExerciseCompletionOverlay);
              if (!analytics) return null;
              
              return (
                <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6 border border-gray-600 shadow-lg">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 lg:mb-6 text-center flex items-center justify-center gap-2">
                    <span className="text-xl sm:text-2xl">📊</span>
                    <span>Exercise Summary</span>
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4 lg:mb-6">
                    <div className="text-center bg-gray-800/50 rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 border border-gray-600">
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-400 mb-1">{analytics.totalSets}</div>
                      <div className="text-xs sm:text-sm text-gray-300 font-medium">Sets</div>
                    </div>
                    <div className="text-center bg-gray-800/50 rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 border border-gray-600">
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-400 mb-1">{analytics.avgWeight}</div>
                      <div className="text-xs sm:text-sm text-gray-300 font-medium">Avg Weight</div>
                    </div>
                    <div className="text-center bg-gray-800/50 rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 border border-gray-600">
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-400 mb-1">{analytics.avgReps}</div>
                      <div className="text-xs sm:text-sm text-gray-300 font-medium">Avg Reps</div>
                    </div>
                    <div className="text-center bg-gray-800/50 rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 border border-gray-600">
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-400 mb-1">{analytics.totalVolume}</div>
                      <div className="text-xs sm:text-sm text-gray-300 font-medium">Total Volume</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
                    <div className="text-center bg-gray-800/50 rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 border border-gray-600">
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold text-red-400 mb-1">{analytics.maxWeight}</div>
                      <div className="text-xs sm:text-sm text-gray-300 font-medium">Max Weight</div>
                    </div>
                    <div className="text-center bg-gray-800/50 rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 border border-gray-600">
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-400 mb-1">{analytics.dropSets}</div>
                      <div className="text-xs sm:text-sm text-gray-300 font-medium">Drop Sets</div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Set History */}
            {(() => {
              const exerciseState = getExerciseState(showExerciseCompletionOverlay);
              const history = exerciseState.history;
              
              if (history.length === 0) return null;
              
              return (
                <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6 border border-gray-600 shadow-lg">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 lg:mb-6 text-center flex items-center justify-center gap-2">
                    <span className="text-xl sm:text-2xl">📋</span>
                    <span>Set History</span>
                  </h3>
                  <div className="space-y-2 sm:space-y-3 max-h-32 sm:max-h-40 lg:max-h-48 overflow-y-auto pr-1 sm:pr-2">
                    {history.map((set, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-800/70 rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 border border-gray-600 hover:bg-gray-800/90 transition-colors">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                            {index + 1}
                          </div>
                          <span className="text-white font-semibold text-sm sm:text-base">Set {index + 1}</span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 text-xs sm:text-sm">
                          <div className="text-center">
                            <span className="text-blue-400 font-bold">{set.weight}</span>
                            <div className="text-xs text-gray-400">lbs</div>
                          </div>
                          <div className="text-center">
                            <span className="text-green-400 font-bold">× {set.reps}</span>
                            <div className="text-xs text-gray-400">reps</div>
                          </div>
                          <div className="text-center">
                            <span className="text-yellow-400 font-bold">RPE {set.rpe}</span>
                            <div className="text-xs text-gray-400">effort</div>
                          </div>
                          {set.isDropSet && (
                            <div className="text-center">
                              <span className="text-purple-400 text-sm sm:text-lg">🔽</span>
                              <div className="text-xs text-gray-400">drop</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}


          </div>
        </div>
      )}

      {/* Plate Calculator Modal */}
      {showPlateCalculator && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">
                {plateCalculatorType === 'weight' ? 'Weight Calculator' : 'Reps Calculator'}
              </h3>
              <button
                onClick={() => setShowPlateCalculator(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {plateCalculatorType === 'weight' ? (
              <div className="space-y-6">
                {/* Weight Input */}
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-2">Total Weight (lbs)</div>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => setPlateCalculatorValue(prev => Math.max(45, prev - 5))}
                      className="w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-xl font-bold text-white"
                    >
                      -
                    </button>
                    <div className="text-4xl font-bold text-white min-w-[120px]">
                      {plateCalculatorValue}
                    </div>
                    <button
                      onClick={() => setPlateCalculatorValue(prev => prev + 5)}
                      className="w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-xl font-bold text-white"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Plate Visualization */}
                <div className="space-y-4">
                  <div className="text-sm text-gray-400 text-center">Plates per side:</div>
                  <div className="flex justify-center">
                    <div className="flex items-center gap-2">
                      {/* Bar */}
                      <div className="w-4 h-16 bg-gray-600 rounded"></div>
                      
                      {/* Plates */}
                      {calculatePlates(plateCalculatorValue).map((plate, index) => (
                        <div key={index} className="flex flex-col items-center gap-1">
                          {Array.from({ length: plate.count }, (_, i) => (
                            <div
                              key={i}
                              className={`w-8 h-8 rounded-full border-2 ${
                                plate.weight === 45 ? 'bg-red-500 border-red-400' :
                                plate.weight === 35 ? 'bg-blue-500 border-blue-400' :
                                plate.weight === 25 ? 'bg-green-500 border-green-400' :
                                plate.weight === 10 ? 'bg-yellow-500 border-yellow-400' :
                                plate.weight === 5 ? 'bg-white border-gray-300' :
                                'bg-gray-500 border-gray-400'
                              }`}
                              title={`${plate.weight} lbs`}
                            ></div>
                          ))}
                          <div className="text-xs text-gray-400">{plate.weight}</div>
                        </div>
                      ))}
                      
                      {/* Bar */}
                      <div className="w-4 h-16 bg-gray-600 rounded"></div>
                    </div>
                  </div>
                </div>

                {/* Quick Weight Buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {[135, 185, 225, 275, 315, 365, 405, 455].map(weight => (
                    <button
                      key={weight}
                      onClick={() => setPlateCalculatorValue(weight)}
                      className={`p-2 rounded text-sm font-medium transition-colors ${
                        plateCalculatorValue === weight
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {weight}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Reps Input */}
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-2">Number of Reps</div>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => setPlateCalculatorValue(prev => Math.max(1, prev - 1))}
                      className="w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-xl font-bold text-white"
                    >
                      -
                    </button>
                    <div className="text-4xl font-bold text-white min-w-[120px]">
                      {plateCalculatorValue}
                    </div>
                    <button
                      onClick={() => setPlateCalculatorValue(prev => prev + 1)}
                      className="w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-xl font-bold text-white"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Quick Reps Buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {[5, 8, 10, 12, 15, 20, 25, 30].map(reps => (
                    <button
                      key={reps}
                      onClick={() => setPlateCalculatorValue(reps)}
                      className={`p-2 rounded text-sm font-medium transition-colors ${
                        plateCalculatorValue === reps
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {reps}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPlateCalculator(false)}
                className="flex-1 p-3 glass text-gray-300 rounded-lg hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={applyPlateCalculatorValue}
                className="flex-1 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Island Rest Timer */}
      {timerRunning && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40">
          <div 
            onClick={() => setShowTimerExpanded(!showTimerExpanded)}
            className={`backdrop-blur-2xl border border-white/20 shadow-2xl transition-all duration-500 ease-in-out cursor-pointer ${
              showTimerExpanded 
                ? 'rounded-2xl p-4 w-80' 
                : 'rounded-full p-3 w-20 h-20'
            } ${
              restTime > 30 
                ? 'bg-white/10 shadow-white/20' 
                : restTime > 10 
                  ? 'bg-yellow-500/20 shadow-yellow-500/30' 
                  : 'bg-red-500/20 shadow-red-500/30'
            }`}
          >
                         {/* Collapsed State */}
             {!showTimerExpanded && (
               <div className="flex items-center justify-center h-full">
                 <div className="relative w-12 h-12">
                   <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 48 48">
                     <circle
                       cx="24"
                       cy="24"
                       r="20"
                       stroke="rgba(255,255,255,0.3)"
                       strokeWidth="3"
                       fill="none"
                     />
                     <circle
                       cx="24"
                       cy="24"
                       r="20"
                       stroke={restTime > 30 ? "#FFFFFF" : restTime > 10 ? "#FCD34D" : "#EF4444"}
                       strokeWidth="3"
                       fill="none"
                       strokeDasharray={`${2 * Math.PI * 20}`}
                       strokeDashoffset={`${2 * Math.PI * 20 * (1 - restTime / (restTimerSettings.defaultTime || 60))}`}
                       strokeLinecap="round"
                       className="transition-all duration-1000 ease-linear drop-shadow-lg"
                     />
                   </svg>
                   <div className="absolute inset-0 flex items-center justify-center">
                     <div className={`font-bold text-sm drop-shadow-lg ${
                       restTime > 30 ? 'text-white' : restTime > 10 ? 'text-yellow-300' : 'text-red-300'
                     }`}>
                       {Math.ceil(restTime / 60)}
                     </div>
                   </div>
                 </div>
               </div>
             )}

                         {/* Expanded State */}
             {showTimerExpanded && (
               <div className="space-y-4">
                              {/* Timer Display */}
             <div className="text-center">
               <div className={`text-4xl font-bold mb-2 drop-shadow-lg ${
                 restTime > 30 ? 'text-white' : restTime > 10 ? 'text-yellow-300' : 'text-red-300'
               }`}>
                 {formatTime(restTime)}
               </div>
               <div className="w-full bg-white/10 rounded-full h-3 backdrop-blur-sm overflow-hidden">
                 <div 
                   className={`h-3 rounded-full transition-all duration-1000 ease-linear drop-shadow-lg ${
                     restTime > 30 ? 'bg-white/60' : restTime > 10 ? 'bg-yellow-400' : 'bg-red-400'
                   }`}
                   style={{ width: `${Math.min((restTime / (restTimerSettings.defaultTime || 60)) * 100, 100)}%` }}
                 ></div>
               </div>
             </div>

                 {/* Controls */}
                 <div className="flex items-center justify-center gap-2">
                   <button
                     onClick={(e) => {
                       e.stopPropagation();
                       setTimerRunning(false);
                       setRestTime(restTimerSettings.defaultTime || 60);
                       playSound('button');
                     }}
                     className="w-12 h-12 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center text-white transition-colors backdrop-blur-sm"
                     title="Stop Timer"
                   >
                     ⏹️
                   </button>
                   <button
                     onClick={(e) => {
                       e.stopPropagation();
                       setRestTime(prev => Math.max(0, prev - 10));
                       playSound('button');
                     }}
                     className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors backdrop-blur-sm"
                     title="Skip 10s"
                   >
                     ⏭️
                   </button>
                   <button
                     onClick={(e) => {
                       e.stopPropagation();
                       setTimerRunning(false);
                       setRestTime(0);
                       playSound('complete');
                       showSmartSuggestion('Rest timer skipped! Ready for next set.');
                     }}
                     className="w-12 h-12 bg-green-500/80 hover:bg-green-500 rounded-full flex items-center justify-center text-white transition-colors backdrop-blur-sm"
                     title="Skip Rest Timer"
                   >
                     ⏭️⏭️
                   </button>
                   <button
                     onClick={(e) => {
                       e.stopPropagation();
                       playSound('complete');
                     }}
                     className="w-12 h-12 bg-blue-500/80 hover:bg-blue-500 rounded-full flex items-center justify-center text-white transition-colors backdrop-blur-sm"
                     title="Test Sound"
                   >
                     🔊
                   </button>
                   <button
                     onClick={(e) => {
                       e.stopPropagation();
                       setShowRestTimerSettings(true);
                     }}
                     className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors backdrop-blur-sm"
                     title="Settings"
                   >
                     ⚙️
                   </button>
                 </div>

                 {/* Close Button */}
                 <div className="flex justify-center">
                   <button
                     onClick={(e) => {
                       e.stopPropagation();
                       setShowTimerExpanded(false);
                     }}
                     className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors backdrop-blur-sm"
                   >
                     <X className="w-4 h-4" />
                   </button>
                 </div>
               </div>
             )}
          </div>
        </div>
      )}

      {/* Rest Timer Settings Modal */}
      <RestTimerSettings
        isVisible={showRestTimerSettings}
        onClose={() => setShowRestTimerSettings(false)}
        settings={restTimerSettings}
        onSettingsChange={setRestTimerSettings}
      />

      {/* Quick Start Timer Button */}
      {!timerRunning && (
        <div className="fixed bottom-4 right-4 z-40">
          <button
            onClick={() => {
              console.log('Manual timer start clicked');
              setRestTime(30); // Set to 30 seconds for testing
              startRestTimer();
            }}
            className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-full shadow-lg text-white transition-all duration-300 transform hover:scale-105"
            title="Start Rest Timer (30s)"
          >
            <Clock className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Debug Timer State */}
      <div className="fixed bottom-4 left-4 z-40">
        <div className="p-2 bg-black/50 rounded text-white text-xs">
          Timer: {restTime}s | Running: {timerRunning ? 'Yes' : 'No'}
        </div>
      </div>

      {showDropSetForIndex === currentExerciseState.completedSets && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-gray-900 rounded-2xl p-4 sm:p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-white">Drop Set</h3>
              <button
                onClick={() => setShowDropSetForIndex(null)}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            <div className="mb-4">
              <div className="text-xs sm:text-sm text-gray-400 mb-2">New Weight (lbs)</div>
              <input
                type="number"
                min="0"
                value={dropSetWeight}
                onChange={e => setDropSetWeight(Number(e.target.value))}
                className="w-full p-2 sm:p-3 rounded-lg bg-gray-800 text-white text-base sm:text-lg mb-3 border border-gray-700 focus:border-blue-500 outline-none"
              />
              <div className="text-xs sm:text-sm text-gray-400 mb-2">New Reps</div>
              <input
                type="number"
                min="1"
                value={dropSetReps}
                onChange={e => setDropSetReps(Number(e.target.value))}
                className="w-full p-2 sm:p-3 rounded-lg bg-gray-800 text-white text-base sm:text-lg border border-gray-700 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDropSetForIndex(null)}
                className="flex-1 py-2 sm:py-3 bg-gray-700 text-gray-300 rounded-lg text-xs sm:text-base font-medium hover:bg-gray-600 transition-colors min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateExerciseState(index, {
                    weight: dropSetWeight,
                    reps: dropSetReps,
                    completedSets: currentExerciseState.completedSets + 1,
                    history: [
                      ...(currentExerciseState.history || []),
                      {
                        id: `${Date.now()}`,
                        weight: dropSetWeight,
                        reps: dropSetReps,
                        rpe: currentExerciseState.rpe,
                        completed: true,
                        isDropSet: true,
                        originalWeight: currentExerciseState.weight,
                        originalReps: currentExerciseState.reps,
                      },
                    ],
                  });
                  setShowDropSetForIndex(null);
                  showSmartSuggestion('Drop set logged!');
                }}
                className="flex-1 py-2 sm:py-3 bg-purple-500 text-white rounded-lg text-xs sm:text-base font-medium hover:bg-purple-600 transition-colors min-h-[44px]"
              >
                Confirm Drop Set
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}; 