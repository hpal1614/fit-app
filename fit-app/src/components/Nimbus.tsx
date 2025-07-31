import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronDown, 
  Play, 
  Pause, 
  RotateCcw,
  Mic,
  Plus,
  Minus,
  X,
  ChevronUp,
  AlertCircle,
  Activity,
  Target,
  MapPin,
  Zap,
  Shield,
  TrendingUp,
  SkipForward,
  Edit
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkout } from '../hooks/useWorkout';
import { useVoice } from '../hooks/useVoice';
import { useAI } from '../hooks/useAI';
import './Nimbus.css';
// import { AICoachService } from '../services/aiService';

interface NimbusProps {
  className?: string;
}

export const Nimbus: React.FC<NimbusProps> = ({ className = '' }) => {
  // State Management
  const [currentWeight, setCurrentWeight] = useState(190);
  const [currentReps, setCurrentReps] = useState(8);
  const [currentDifficulty, setCurrentDifficulty] = useState(3);
  const [currentIncrement, setCurrentIncrement] = useState(2.5);
  const [isListening, setIsListening] = useState(false);
  const [restTime, setRestTime] = useState(135);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [currentCarouselSlide, setCurrentCarouselSlide] = useState(0);
  const [showTemplateSection, setShowTemplateSection] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showDifficultyFeedback, setShowDifficultyFeedback] = useState(false);
  const [showPainReport, setShowPainReport] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showDropSet, setShowDropSet] = useState(false);
  const [showFailureOptions, setShowFailureOptions] = useState(false);
  const [selectedReason, setSelectedReason] = useState('equipment');
  const [smartSuggestion, setSmartSuggestion] = useState('');
  const [lastSetData, setLastSetData] = useState({ weight: 175, reps: 8, rpe: 7 });
  const [voiceText, setVoiceText] = useState('🎤 "190 for 8, felt perfect"');
  const [timerPaused, setTimerPaused] = useState(false);
  const [dropOriginalReps, setDropOriginalReps] = useState(3);
  const [dropNewReps, setDropNewReps] = useState(5);

  // Hooks
  const workout = useWorkout();
  const { isListening: voiceListening, startListening, stopListening, speak, transcript } = useVoice();
  const { askCoach } = useAI();
  // const aiService = AICoachService.getInstance();

  // Audio Context
  const audioContext = useRef<AudioContext | null>(null);

  // Initialize audio
  const initAudio = () => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  // Play sound effect
  const playSound = (type = 'button') => {
    if (!audioContext.current) return;
    
    const oscillator = audioContext.current.createOscillator();
    const gainNode = audioContext.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.current.destination);
    
    if (type === 'complete') {
      oscillator.frequency.setValueAtTime(800, audioContext.current.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioContext.current.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(1200, audioContext.current.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.3, audioContext.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.5);
      oscillator.start();
      oscillator.stop(audioContext.current.currentTime + 0.5);
    } else {
      oscillator.frequency.setValueAtTime(400, audioContext.current.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.1);
      oscillator.start();
      oscillator.stop(audioContext.current.currentTime + 0.1);
    }
  };

  // Show smart suggestion with AI
  const showSmartSuggestionWithAI = async (message: string) => {
    setSmartSuggestion(message);
    await speak(message);
    setTimeout(() => setSmartSuggestion(''), 4000);
  };

  // Weight adjustment
  const adjustWeight = (amount: number) => {
    initAudio();
    const newWeight = Math.max(0, currentWeight + amount);
    setCurrentWeight(newWeight);
    playSound();
  };

  // Rep adjustment
  const adjustReps = (amount: number) => {
    initAudio();
    const newReps = Math.max(1, currentReps + amount);
    setCurrentReps(newReps);
    playSound();
  };

  // Handle voice command
  const handleVoiceToggle = async () => {
    initAudio();
    setIsListening(!isListening);
    
    if (!isListening) {
      await startListening();
      setVoiceText('🎤 Listening...');
      
      // AI-powered voice command processing
      setTimeout(async () => {
        if (transcript) {
          // Use the askCoach function instead of aiService
          const response = await askCoach(transcript);
          
          setVoiceText(`🎤 "${transcript}"`);
          await showSmartSuggestionWithAI(response);
          
          // Process voice commands
          if (transcript.toLowerCase().includes('drop') || transcript.toLowerCase().includes('failed')) {
            setShowDropSet(true);
          }
        }
        setIsListening(false);
        stopListening();
      }, 3000);
    } else {
      stopListening();
    }
    
    playSound();
  };

  // Log set with AI recommendations
  const logSet = async () => {
    initAudio();
    
    if (!showFailureOptions) {
      setShowFailureOptions(true);
      playSound();
      await showSmartSuggestionWithAI('Did you complete the full set or need to report a failure?');
      return;
    }
    
    // Log the set
    await workout.logSet({
      weight: currentWeight,
      reps: currentReps,
      rpe: currentDifficulty
    });
    
    // Get AI recommendation for next set
    const aiResponse = await askCoach(
      `Just completed ${currentWeight}lbs for ${currentReps} reps at RPE ${currentDifficulty}`
    );
    
    await showSmartSuggestionWithAI(aiResponse);
    
    // Update last set data
    setLastSetData({ weight: currentWeight, reps: currentReps, rpe: currentDifficulty });
    
    // Smart weight progression
    if (currentDifficulty <= 2) {
      adjustWeight(currentIncrement * 2);
    } else if (currentDifficulty >= 4) {
      adjustWeight(-currentIncrement);
    } else {
      adjustWeight(currentIncrement);
    }
    
    setShowFailureOptions(false);
    startRestTimer();
    playSound('complete');
  };

  // Start rest timer
  const startRestTimer = () => {
    setCurrentCarouselSlide(1);
    
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    
    const interval = setInterval(() => {
      setRestTime((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          playSound('complete');
          showSmartSuggestionWithAI('Rest complete! Ready for your next set?');
          return 135;
        }
        return prev - 1;
      });
    }, 1000);
    
    setTimerInterval(interval);
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get timer state class
  const getTimerStateClass = () => {
    if (restTime <= 10 && restTime > 0) return 'danger';
    if (restTime <= 20 && restTime > 10) return 'warning';
    if (restTime === 0) return 'complete';
    return '';
  };

  // Exercise alternatives
  const exerciseAlternatives = {
    equipment: [
      { id: 'incline-bench', name: 'Incline Barbell Press', muscles: 'Chest, Shoulders', reason: 'Uses incline bench instead' },
      { id: 'dumbbell-bench', name: 'Dumbbell Bench Press', muscles: 'Chest, Triceps', reason: 'Only needs dumbbells' },
      { id: 'push-ups', name: 'Push-ups', muscles: 'Chest, Triceps', reason: 'No equipment needed' }
    ],
    difficulty: [
      { id: 'incline-dumbbell', name: 'Incline Dumbbell Press', muscles: 'Chest, Shoulders', reason: 'Easier angle' },
      { id: 'machine-press', name: 'Machine Chest Press', muscles: 'Chest, Triceps', reason: 'Guided movement' },
      { id: 'cable-fly', name: 'Cable Chest Fly', muscles: 'Chest', reason: 'Isolation movement' }
    ],
    pain: [
      { id: 'machine-press', name: 'Machine Chest Press', muscles: 'Chest, Triceps', reason: 'Supported movement' },
      { id: 'cable-fly', name: 'Cable Chest Fly', muscles: 'Chest', reason: 'Controlled range' },
      { id: 'wall-pushups', name: 'Wall Push-ups', muscles: 'Chest, Triceps', reason: 'Minimal stress' }
    ]
  };

  return (
    <div className={`nimbus-ui ${className}`}>

      <div className="main-content">
        {/* Exercise Header */}
        <div className="exercise-header">
          <div className="workout-meta">
            {workout.currentExercise?.muscle || 'Chest'} Day • Exercise {workout.currentExerciseIndex + 1}/{workout.exercises?.length || 6}
          </div>
          <h1 className="exercise-title">{workout.currentExercise?.name || 'Bench Press'}</h1>
          <div className="set-info">
            Set {workout.currentSetIndex + 1} of {workout.currentExercise?.sets || 3} • Personal record zone
          </div>
          
          {/* Workout Template Dropdown */}
          <div className="template-toggle">
            <button 
              className="template-btn" 
              onClick={() => setShowTemplateSection(!showTemplateSection)}
            >
              <span className="template-text">
                {showTemplateSection ? 'Hide Details' : "What's Next?"}
              </span>
              <ChevronDown className={`template-arrow ${showTemplateSection ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          {/* Template Section */}
          <AnimatePresence>
            {showTemplateSection && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="template-section mt-4"
              >
                {/* Current Progress */}
                <div className="bg-accent-soft border border-accent rounded-lg p-4 mb-4">
                  <div className="text-xs text-accent uppercase tracking-wider mb-2">Current Progress</div>
                  <div className="w-full h-2 bg-bg-elevated rounded-full overflow-hidden mb-2">
                    <div 
                      className="h-full bg-gradient-to-r from-accent to-accent-dim rounded-full transition-all"
                      style={{ width: `${(workout.currentSetIndex / (workout.currentExercise?.sets || 3)) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-text-secondary text-center">
                    Set {workout.currentSetIndex + 1} of {workout.currentExercise?.sets || 3} • {Math.round((workout.currentSetIndex / (workout.currentExercise?.sets || 3)) * 100)}% complete
                  </div>
                </div>

                {/* Next Exercise Preview */}
                <div className="bg-bg-elevated rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs text-text-secondary uppercase tracking-wider">Up Next:</span>
                    <span className="text-xs text-accent bg-accent-soft px-2 py-1 rounded-full">~3 min</span>
                  </div>
                  <div className="text-base font-semibold mb-1">
                    {workout.exercises?.[workout.currentExerciseIndex + 1]?.name || 'Incline Dumbbell Press'}
                  </div>
                  <div className="text-sm text-text-secondary mb-2">
                    4 sets × 8-10 reps
                  </div>
                  <div className="text-xs text-accent bg-accent-soft px-3 py-2 rounded-lg inline-block">
                    🏋️ Equipment: Incline bench + Dumbbells (25-30 lbs)
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-text-tertiary italic">
                    <MapPin size={12} />
                    Usually available near free weights section
                  </div>
                </div>

                {/* AI Suggestions */}
                <div className="bg-bg-elevated rounded-lg p-4 mb-4 border-l-4 border-accent">
                  <div className="text-xs text-accent uppercase tracking-wider mb-3">💡 AI Coach Says</div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Target size={14} className="text-accent mt-0.5" />
                      <span className="text-xs text-text-secondary">Your bench is strong today - consider +5lbs on incline</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Zap size={14} className="text-accent mt-0.5" />
                      <span className="text-xs text-text-secondary">Incline bench is usually busy at this time - have backup ready</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2">
                  <button 
                    className="flex-1 bg-bg-elevated hover:bg-accent-soft text-text-secondary hover:text-accent border border-bg-elevated hover:border-accent rounded-lg px-3 py-2 text-xs transition-all"
                    onClick={() => workout.nextExercise()}
                  >
                    <SkipForward size={14} className="inline mr-1" /> Skip to Next
                  </button>
                  <button 
                    className="flex-1 bg-bg-elevated hover:bg-accent-soft text-text-secondary hover:text-accent border border-bg-elevated hover:border-accent rounded-lg px-3 py-2 text-xs transition-all"
                    onClick={() => showSmartSuggestionWithAI('Workout modification options coming soon!')}
                  >
                    <Edit size={14} className="inline mr-1" /> Modify Workout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Previous Set */}
        <div className="previous-card">
          <div className="text-xs text-text-secondary uppercase tracking-wider mb-2">Previous Set</div>
          <div className="text-base text-text-primary font-medium">
            {lastSetData.weight} lbs × {lastSetData.reps} reps • RPE {lastSetData.rpe}/10
          </div>
        </div>

        {/* Weight Control */}
        <div className="card">
          <div className="card-label">Weight</div>
          <div className="weight-control">
            <button className="weight-btn" onClick={() => adjustWeight(-currentIncrement)}>
              <Minus />
            </button>
            <div className="weight-display">
              <div className="weight-value">{currentWeight}</div>
              <div className="weight-unit">lbs</div>
            </div>
            <button className="weight-btn" onClick={() => adjustWeight(currentIncrement)}>
              <Plus />
            </button>
          </div>
          <div className="increment-pills">
            {[1, 2.5, 5, 10].map((inc) => (
              <button
                key={inc}
                className={`pill ${currentIncrement === inc ? 'active' : ''}`}
                onClick={() => setCurrentIncrement(inc)}
              >
                {inc}kg
              </button>
            ))}
          </div>
        </div>

        {/* Rep Counter */}
        <div className="card">
          <div className="card-label">Reps</div>
          <div className="rep-control">
            <div className="rep-section-left">
              <div className="rep-label">Current</div>
              <div className="rep-value">{currentReps}</div>
            </div>
            <div className="rep-buttons">
              <button className="rep-btn" onClick={() => adjustReps(-1)}>
                <Minus />
              </button>
              <button className="rep-btn" onClick={() => adjustReps(1)}>
                <Plus />
              </button>
            </div>
          </div>
        </div>

        {/* Difficulty */}
        <div className="card">
          <div className="card-label">Difficulty (RPE)</div>
          <div className="difficulty-track">
            <div 
              className="difficulty-fill" 
              style={{ width: `${(currentDifficulty / 5) * 100}%` }}
            />
            <div 
              className="difficulty-handle"
              style={{ left: `${(currentDifficulty / 5) * 100 - 12}px` }}
              onClick={() => setCurrentDifficulty((currentDifficulty % 5) + 1)}
            />
          </div>
          <div className="difficulty-labels">
            <span>Easy</span>
            <span>Perfect</span>
            <span>Hard</span>
          </div>
        </div>

        {/* Voice Input */}
        <div className="card">
          <div className="card-label">Voice Notes</div>
          <div className="voice-area">
            <div className="voice-text">{voiceText}</div>
          </div>
          <button 
            className={`voice-btn ${isListening ? 'listening' : ''}`}
            onClick={handleVoiceToggle}
          >
            <Mic />
          </button>
          
          {/* Log Button */}
          <button className="log-btn" onClick={logSet}>
            {showFailureOptions ? 'Completed Full Set' : 'Log Set'}
          </button>
          
          {/* Failure Options */}
          <AnimatePresence>
            {showFailureOptions && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex gap-2 mt-3"
              >
                <button 
                  className="flex-1 bg-bg-elevated hover:bg-red-900/20 text-text-secondary hover:text-red-400 border border-bg-elevated hover:border-red-400 rounded-lg px-3 py-2 text-xs transition-all"
                  onClick={() => {
                    setShowFailureOptions(false);
                    showSmartSuggestionWithAI('Failed set logged. Consider reducing weight for next set.');
                  }}
                >
                  ❌ Failed Set
                </button>
                <button 
                  className="flex-1 bg-orange-900/20 border border-orange-400 text-orange-400 hover:bg-orange-900/30 rounded-lg px-3 py-2 text-xs transition-all"
                  onClick={() => {
                    setShowDropSet(true);
                    setShowFailureOptions(false);
                  }}
                >
                  🔄 Failed → Drop Weight
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-label">Quick Actions</div>
          <div className="grid grid-cols-2 gap-3">
            <button 
              className="bg-bg-elevated hover:bg-accent-soft text-text-secondary hover:text-accent border border-bg-elevated hover:border-accent rounded-lg p-4 text-sm transition-all"
              onClick={() => setShowAlternatives(true)}
            >
              🔄 Switch Exercise
            </button>
            <button 
              className="bg-bg-elevated hover:bg-accent-soft text-text-secondary hover:text-accent border border-bg-elevated hover:border-accent rounded-lg p-4 text-sm transition-all"
              onClick={() => setShowDifficultyFeedback(true)}
            >
              ⚡ How did that feel?
            </button>
            <button 
              className="bg-bg-elevated hover:bg-accent-soft text-text-secondary hover:text-accent border border-bg-elevated hover:border-accent rounded-lg p-4 text-sm transition-all"
              onClick={() => setShowPainReport(true)}
            >
              🩹 Something hurts
            </button>
            <button 
              className="bg-bg-elevated hover:bg-accent-soft text-text-secondary hover:text-accent border border-bg-elevated hover:border-accent rounded-lg p-4 text-sm transition-all"
              onClick={() => setShowDropSet(true)}
            >
              🔥 Failed + Drop
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Carousel */}
      <div className="sticky-carousel">
        <div className="carousel-track">
          {/* Progress Card */}
          <div className="carousel-card" onClick={() => setShowAnalytics(true)}>
            <div className="progress-card">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold">Workout Progress</span>
                <ChevronUp size={16} className="text-text-secondary" />
              </div>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-conic-gradient flex items-center justify-center mr-4">
                  <div className="w-9 h-9 rounded-full bg-[#111] flex items-center justify-center">
                    <span className="text-xs font-semibold text-accent">70%</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">{workout.currentExercise?.muscle || 'Chest'} Day • Exercise {workout.currentExerciseIndex + 1}/{workout.exercises?.length || 6}</div>
                  <div className="text-xs text-text-secondary">{workout.currentExercise?.name || 'Bench Press'} • Set {workout.currentSetIndex + 1} of {workout.currentExercise?.sets || 3} • PR Zone</div>
                </div>
              </div>
            </div>
          </div>

          {/* Timer Card */}
          <div className="carousel-card">
            <div className={`timer-card ${getTimerStateClass()}`}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold">Rest Timer</span>
                <Activity size={16} className="text-text-secondary" />
              </div>
              <div className="text-3xl font-light text-center mb-1">
                {restTime > 0 ? formatTime(restTime) : 'Ready'}
              </div>
              <div className="text-xs text-text-secondary text-center uppercase tracking-wider mb-3">
                {restTime > 0 ? 'Rest remaining' : 'Set your rest time'}
              </div>
              
              {/* Timer Controls */}
              <div className="flex items-center justify-center gap-3">
                <button 
                  className="w-9 h-9 rounded-full bg-bg-elevated hover:bg-accent hover:text-bg-deep flex items-center justify-center text-sm transition-all"
                  onClick={() => setRestTime(Math.max(10, restTime - 30))}
                >
                  -30
                </button>
                <button 
                  className="w-9 h-9 rounded-full bg-bg-elevated hover:bg-accent hover:text-bg-deep flex items-center justify-center text-sm transition-all"
                  onClick={() => setRestTime(Math.max(10, restTime - 10))}
                >
                  -10
                </button>
                <button 
                  className="w-11 h-11 rounded-full bg-bg-elevated hover:bg-accent hover:text-bg-deep flex items-center justify-center transition-all"
                  onClick={() => {
                    if (timerInterval) {
                      clearInterval(timerInterval);
                      setTimerInterval(null);
                      setTimerPaused(true);
                    } else {
                      startRestTimer();
                    }
                  }}
                >
                  {timerInterval ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button 
                  className="w-9 h-9 rounded-full bg-bg-elevated hover:bg-accent hover:text-bg-deep flex items-center justify-center text-sm transition-all"
                  onClick={() => setRestTime(restTime + 10)}
                >
                  +10
                </button>
                <button 
                  className="w-9 h-9 rounded-full bg-bg-elevated hover:bg-accent hover:text-bg-deep flex items-center justify-center text-sm transition-all"
                  onClick={() => setRestTime(restTime + 30)}
                >
                  +30
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Dots */}
        <div className="flex justify-center gap-2 mt-3">
          {[0, 1].map((index) => (
            <button
              key={index}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                currentCarouselSlide === index 
                  ? 'bg-accent w-2' 
                  : 'bg-text-tertiary hover:bg-accent'
              }`}
              onClick={() => setCurrentCarouselSlide(index)}
            />
          ))}
        </div>
      </div>

      {/* Smart Suggestion */}
      <div className="smart-suggestion">{smartSuggestion}</div>

      {/* Alternative Exercises Modal */}
      <AnimatePresence>
        {showAlternatives && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowAlternatives(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal-content"
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-semibold">Alternative Exercises</h3>
                <button
                  className="text-text-secondary hover:text-text-primary"
                  onClick={() => setShowAlternatives(false)}
                >
                  <X size={24} />
                </button>
              </div>

              {/* Reason Selection */}
              <div className="flex gap-2 mb-5">
                {Object.keys(exerciseAlternatives).map((reason) => (
                  <button
                    key={reason}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs transition-all ${
                      selectedReason === reason
                        ? 'bg-accent-soft text-accent border border-accent'
                        : 'bg-bg-elevated text-text-secondary border border-bg-elevated hover:bg-accent-soft hover:text-accent hover:border-accent'
                    }`}
                    onClick={() => setSelectedReason(reason)}
                  >
                    {reason.charAt(0).toUpperCase() + reason.slice(1)} {reason === 'equipment' ? 'Taken' : reason === 'difficulty' ? 'Too Hard/Easy' : ''}
                  </button>
                ))}
              </div>

              {/* Exercise List */}
              <div className="space-y-3">
                {exerciseAlternatives[selectedReason as keyof typeof exerciseAlternatives].map((exercise) => (
                  <button
                    key={exercise.id}
                    className="w-full bg-bg-card hover:bg-accent-soft border border-bg-elevated hover:border-accent rounded-lg p-4 text-left transition-all"
                    onClick={async () => {
                      await showSmartSuggestionWithAI(`Switched to ${exercise.name}. ${exercise.reason}`);
                      setShowAlternatives(false);
                    }}
                  >
                    <div className="text-sm font-medium mb-1">{exercise.name}</div>
                    <div className="text-xs text-accent mb-1">{exercise.muscles}</div>
                    <div className="text-xs text-text-secondary">{exercise.reason}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Other modals (Difficulty Feedback, Pain Report, etc.) would follow the same pattern */}
    </div>
  );
};