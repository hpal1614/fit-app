import React, { useState, useEffect, useRef } from 'react';
import { 
  Timer, Target, Zap, Flame, Activity, Trophy, Play, Pause, 
  Plus, Minus, Mic, Settings, RotateCcw, SkipForward, 
  AlertTriangle, Heart, Dumbbell, Clock, TrendingUp, 
  ChevronDown, ChevronUp, Check, X, ArrowRight, ArrowLeft,
  RefreshCw, Shield, Lightbulb, MapPin, Users, Wifi
} from 'lucide-react';
import { getFixedVoiceService } from '../services/fixedVoiceService';

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

interface EquipmentStatus {
  name: string;
  status: 'available' | 'busy' | 'maintenance';
  waitTime?: string;
  location?: string;
}

interface SmartSuggestion {
  id: string;
  type: 'weight' | 'exercise' | 'form' | 'equipment' | 'motivation';
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
  const [currentCarouselSlide, setCurrentCarouselSlide] = useState(0);
  const [voiceText, setVoiceText] = useState('🎤 "190 for 8, felt perfect"');
  const [previousSet, setPreviousSet] = useState('175 kg × 8 reps • RPE 7/10');
  
  // New Enhanced Features State
  const [showAlternativesModal, setShowAlternativesModal] = useState(false);
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [showPainModal, setShowPainModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<'equipment' | 'difficulty' | 'pain'>('equipment');
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [equipmentStatus, setEquipmentStatus] = useState<EquipmentStatus[]>([]);
  const [voiceService, setVoiceService] = useState<ReturnType<typeof getFixedVoiceService> | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceConfidence, setVoiceConfidence] = useState(0);
  
  // Refs
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const voiceServiceRef = useRef<ReturnType<typeof getFixedVoiceService> | null>(null);

  // Audio System
  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const playSound = (type: 'button' | 'complete' = 'button') => {
    if (!audioContextRef.current) return;
    
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    if (type === 'complete') {
      oscillator.frequency.setValueAtTime(800, audioContextRef.current.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioContextRef.current.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(1200, audioContextRef.current.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.5);
      oscillator.start();
      oscillator.stop(audioContextRef.current.currentTime + 0.5);
    } else {
      oscillator.frequency.setValueAtTime(400, audioContextRef.current.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.1);
      oscillator.start();
      oscillator.stop(audioContextRef.current.currentTime + 0.1);
    }
  };

  // Weight and Rep Controls
  const adjustWeight = (amount: number) => {
    initAudio();
    setCurrentWeight(prev => Math.max(0, prev + amount));
    updatePreviousSet();
    playSound('button');
  };

  const adjustReps = (amount: number) => {
    initAudio();
    setCurrentReps(prev => Math.max(1, prev + amount));
    updatePreviousSet();
    playSound('button');
  };

  const setIncrement = (increment: number) => {
    setCurrentIncrement(increment);
    playSound('button');
  };

  const setRPE = (rpe: number) => {
    setCurrentRPE(rpe);
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
      setVoiceText(`🎤 "${currentWeight} for ${currentReps}, felt perfect"`);
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
    setTimerRunning(true);
    setCurrentCarouselSlide(1);
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    
    timerIntervalRef.current = setInterval(() => {
      setRestTime(prev => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current!);
          timerIntervalRef.current = null;
          setTimerRunning(false);
          setCurrentCarouselSlide(0);
          playSound('complete');
          return 135;
        }
        return prev - 1;
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
    updatePreviousSet();
    startRestTimer();
    
    // Smart auto-progression
    setTimeout(() => {
      if (currentRPE <= 2) {
        adjustWeight(currentIncrement * 2);
      } else if (currentRPE >= 4) {
        adjustWeight(-currentIncrement);
      } else {
        adjustWeight(currentIncrement);
      }
    }, 1000);
    
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

  // Initialize Equipment Status
  useEffect(() => {
    const mockEquipmentStatus: EquipmentStatus[] = [
      { name: 'Bench Press', status: 'available', location: 'Free Weights Area' },
      { name: 'Incline Bench', status: 'busy', waitTime: '~5 min', location: 'Free Weights Area' },
      { name: 'Cable Machine', status: 'available', location: 'Cable Station' },
      { name: 'Dumbbells 25-30lbs', status: 'available', location: 'Dumbbell Rack' },
      { name: 'Squat Rack', status: 'maintenance', location: 'Powerlifting Area' }
    ];
    
    setEquipmentStatus(mockEquipmentStatus);
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      setEquipmentStatus(prev => 
        prev.map(item => ({
          ...item,
          status: Math.random() > 0.8 ? 
            (item.status === 'available' ? 'busy' : 'available') : item.status
        }))
      );
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

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
      
      // Equipment availability suggestions
      const busyEquipment = equipmentStatus.filter(e => e.status === 'busy');
      if (busyEquipment.length > 0) {
        suggestions.push({
          id: 'equipment-busy',
          type: 'equipment',
          message: `${busyEquipment[0].name} is busy. Available in ${busyEquipment[0].waitTime}`,
          priority: 'medium'
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
  }, [currentRPE, currentReps, currentIncrement, equipmentStatus]);

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
        setCurrentReps(reps);
        showSmartSuggestion(`Set reps to ${reps}`);
      }
    }
    
    // RPE commands
    if (command.includes('rpe') || command.includes('difficulty')) {
      const match = command.match(/(\d+)/);
      if (match) {
        const rpe = parseInt(match[1]);
        if (rpe >= 1 && rpe <= 5) {
          setRPE(rpe);
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
  const getAlternativeExercises = (reason: 'equipment' | 'difficulty' | 'pain'): AlternativeExercise[] => {
    const alternatives: Record<string, AlternativeExercise[]> = {
      equipment: [
        { id: 'incline-bench', name: 'Incline Barbell Press', muscles: 'Chest, Shoulders', reason: 'Uses incline bench instead', equipment: 'Incline bench + Barbell' },
        { id: 'dumbbell-bench', name: 'Dumbbell Bench Press', muscles: 'Chest, Triceps', reason: 'Only needs dumbbells', equipment: 'Dumbbells + Flat bench' },
        { id: 'push-ups', name: 'Push-ups', muscles: 'Chest, Triceps', reason: 'No equipment needed', equipment: 'Bodyweight only' },
        { id: 'cable-press', name: 'Cable Chest Press', muscles: 'Chest, Triceps', reason: 'Uses cable machine', equipment: 'Cable machine + D-handles' }
      ],
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
    
    return alternatives[reason] || alternatives.equipment;
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

  const skipExercise = () => {
    showSmartSuggestion('Exercise skipped. Your safety comes first!');
    setShowPainModal(false);
    // In a real app, this would move to the next exercise
    playSound('button');
  };

  return (
    <div className="space-y-modern animate-fade-in-up">
      {/* Exercise Header */}
      <div className="card card-elevated">
        <div className="text-xs text-gray-400 font-medium tracking-wider uppercase mb-2">
          Chest Day • Exercise 2/6
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Bench Press</h1>
        <div className="text-gray-300">
          Set 3 of 4 • Personal record zone
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
            {/* Current Progress */}
            <div className="p-4 glass-strong border border-green-500/20 rounded-lg">
              <div className="text-xs text-green-400 font-medium tracking-wider uppercase mb-2">
                Current Progress
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full mb-2">
                <div className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full" style={{ width: '75%' }}></div>
              </div>
              <div className="text-xs text-gray-400 text-center">Set 3 of 4 • 75% complete</div>
            </div>
            
            {/* Next Exercise */}
            <div className="p-4 glass rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-gray-400 font-medium tracking-wider uppercase">Up Next:</span>
                <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">~3 min</span>
              </div>
              <div className="mb-3">
                <div className="text-lg font-semibold text-white mb-1">Incline Dumbbell Press</div>
                <div className="text-sm text-gray-400 mb-2">4 sets × 8-10 reps</div>
                <div className="text-xs text-green-400 bg-green-500/10 px-3 py-1 rounded-lg inline-block">
                  🏋️ Equipment: Incline bench + Dumbbells (25-30 lbs)
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>📍</span>
                <span>Usually available near free weights section</span>
              </div>
            </div>
            
            {/* AI Suggestions */}
            <div className="p-4 glass rounded-lg border-l-4 border-purple-500">
              <div className="text-xs text-purple-400 font-medium tracking-wider uppercase mb-3">
                💡 AI Coach Says
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-2 glass rounded">
                  <span className="text-sm">🎯</span>
                  <span className="text-xs text-gray-300">Your bench is strong today - consider +5lbs on incline</span>
                </div>
                <div className="flex items-start gap-2 p-2 glass rounded">
                  <span className="text-sm">⚡</span>
                  <span className="text-xs text-gray-300">Incline bench is usually busy at this time - have backup ready</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Previous Set */}
      <div className="card glass-strong border-green-500/20">
        <div className="text-xs text-gray-400 font-medium tracking-wider uppercase mb-2">Previous Set</div>
        <div className="text-lg font-medium text-white">{previousSet}</div>
      </div>

      {/* Weight Control */}
      <div className="card card-elevated">
        <div className="text-xs text-gray-400 font-medium tracking-wider uppercase mb-4 text-center">Weight</div>
        <div className="flex items-center justify-center gap-8 mb-6">
          <button 
            onClick={() => adjustWeight(-currentIncrement)}
            className="w-14 h-14 rounded-full glass hover:bg-white/10 transition-modern flex items-center justify-center text-2xl font-light"
          >
            <Minus className="w-6 h-6" />
          </button>
          <div className="text-center min-w-[120px]">
            <div className="text-5xl font-light text-white leading-none tracking-tight">{currentWeight}</div>
            <div className="text-sm text-gray-400 uppercase tracking-wider mt-1">lbs</div>
          </div>
          <button 
            onClick={() => adjustWeight(currentIncrement)}
            className="w-14 h-14 rounded-full glass hover:bg-white/10 transition-modern flex items-center justify-center text-2xl font-light"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
        
        {/* Increment Pills */}
        <div className="flex justify-center gap-2">
          {[1, 2.5, 5, 10].map(increment => (
            <button
              key={increment}
              onClick={() => setIncrement(increment)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-modern ${
                currentIncrement === increment 
                  ? 'bg-green-500/20 text-green-400 border border-green-500' 
                  : 'glass text-gray-400 hover:bg-white/5'
              }`}
            >
              {increment}kg
            </button>
          ))}
        </div>
      </div>

      {/* Rep Counter */}
      <div className="card card-elevated">
        <div className="text-xs text-gray-400 font-medium tracking-wider uppercase mb-4">Reps</div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 font-medium tracking-wider uppercase mb-2">Current</div>
            <div className="text-4xl font-light text-white">{currentReps}</div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => adjustReps(-1)}
              className="w-11 h-11 rounded-full glass hover:bg-white/10 transition-modern flex items-center justify-center"
            >
              <Minus className="w-5 h-5" />
            </button>
            <button 
              onClick={() => adjustReps(1)}
              className="w-11 h-11 rounded-full glass hover:bg-white/10 transition-modern flex items-center justify-center"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* RPE Slider */}
      <div className="card card-elevated">
        <div className="text-xs text-gray-400 font-medium tracking-wider uppercase mb-4">Difficulty (RPE)</div>
        <div className="relative">
          <div className="w-full h-2 bg-gray-800 rounded-full">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-300"
              style={{ width: `${(currentRPE / 5) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Easy</span>
            <span>Perfect</span>
            <span>Hard</span>
          </div>
          <div className="absolute top-0 left-0 right-0 h-2">
            {[1, 2, 3, 4, 5].map(rpe => (
              <button
                key={rpe}
                onClick={() => setRPE(rpe)}
                className="absolute w-6 h-6 bg-green-500 rounded-full -top-2 transform -translate-x-1/2 cursor-pointer hover:scale-110 transition-modern"
                style={{ left: `${(rpe / 5) * 100}%` }}
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

      {/* Sticky Carousel */}
      <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-[335px]">
        <div className="flex transition-transform duration-300" style={{ transform: `translateX(-${currentCarouselSlide * 50}%)` }}>
          {/* Progress Card */}
          <div className="flex-shrink-0 w-1/2 pr-2">
            <div className="p-4 glass-strong backdrop-blur-xl rounded-2xl border border-gray-800 cursor-pointer hover:scale-105 transition-modern">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-white">Workout Progress</div>
                <div className="text-gray-400">⌃</div>
              </div>
              <div className="flex items-center">
                <div className="w-12 h-12 relative mr-4">
                  <div className="w-full h-full rounded-full bg-gradient-to-r from-green-500 to-green-400 flex items-center justify-center">
                    <div className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center">
                      <span className="text-xs font-semibold text-green-400">70%</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white">Chest Day • Exercise 2/6</div>
                  <div className="text-xs text-gray-400">Bench Press • Set 3 of 3 • PR Zone</div>
                </div>
              </div>
            </div>
          </div>

          {/* Timer Card */}
          <div className="flex-shrink-0 w-1/2 pl-2">
            <div className={`p-4 glass-strong backdrop-blur-xl rounded-2xl border transition-modern ${getTimerCardClass()}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-white">Rest Timer</div>
                <div className="text-gray-400">⏱</div>
              </div>
              <div className="text-3xl font-light text-white text-center mb-1">
                {formatTime(restTime)}
              </div>
              <div className="text-xs text-gray-400 text-center mb-3">
                {timerRunning ? 'Rest remaining' : 'Set your rest time'}
              </div>
              <div className="flex items-center justify-center gap-2">
                <button 
                  onClick={() => adjustTimerTime(-30)}
                  className="w-8 h-8 rounded-full glass hover:bg-white/10 transition-modern flex items-center justify-center text-xs"
                >
                  -30
                </button>
                <button 
                  onClick={() => adjustTimerTime(-10)}
                  className="w-8 h-8 rounded-full glass hover:bg-white/10 transition-modern flex items-center justify-center text-xs"
                >
                  -10
                </button>
                <button 
                  onClick={toggleTimer}
                  className="w-10 h-10 rounded-full glass hover:bg-white/10 transition-modern flex items-center justify-center"
                >
                  {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => adjustTimerTime(10)}
                  className="w-8 h-8 rounded-full glass hover:bg-white/10 transition-modern flex items-center justify-center text-xs"
                >
                  +10
                </button>
                <button 
                  onClick={() => adjustTimerTime(30)}
                  className="w-8 h-8 rounded-full glass hover:bg-white/10 transition-modern flex items-center justify-center text-xs"
                >
                  +30
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Dots */}
        <div className="flex justify-center gap-2 mt-3">
          {[0, 1].map(slide => (
            <button
              key={slide}
              onClick={() => setCurrentCarouselSlide(slide)}
              className={`w-1.5 h-1.5 rounded-full transition-modern ${
                currentCarouselSlide === slide 
                  ? 'bg-green-500 scale-125' 
                  : 'bg-gray-600 hover:bg-green-500'
              }`}
            />
          ))}
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

      {/* Equipment Status Overlay */}
      <div className="fixed top-4 left-4 z-40">
        <div className="p-3 glass-strong rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-green-400" />
            <span className="text-xs font-medium text-white">Equipment Status</span>
          </div>
          <div className="space-y-1">
            {equipmentStatus.slice(0, 3).map(equipment => (
              <div key={equipment.name} className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${
                  equipment.status === 'available' ? 'bg-green-500' :
                  equipment.status === 'busy' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="text-gray-300">{equipment.name}</span>
                {equipment.waitTime && (
                  <span className="text-gray-500">({equipment.waitTime})</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 