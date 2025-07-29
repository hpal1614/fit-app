import React, { useState, useCallback, useEffect } from 'react';
import { Exercise, WorkoutTemplate, WorkoutContext } from '../../types/workout';
import { ExerciseHeader } from './ExerciseHeader';
import { WeightControl } from './WeightControl';
import { RepCounter } from './RepCounter';
import { DifficultySlider } from './DifficultySlider';
import { VoiceInterface } from './VoiceInterface';
import { DropSetLogger } from './DropSetLogger';
import { RestTimer } from './RestTimer';
import { AnalyticsCard } from './AnalyticsCard';
import { QuickActions } from './QuickActions';
import { StickyCarousel } from './StickyCarousel';
import { SmartSuggestions } from './SmartSuggestions';
import { useWorkout } from '../../hooks/useWorkout';
import { useAI } from '../../hooks/useAI';
import { useVoice } from '../../hooks/useVoice';
import styles from '../../styles/workout-logger.module.css';

interface WorkoutLoggerProps {
  workoutTemplate?: WorkoutTemplate;
  onWorkoutComplete?: () => void;
}

export const WorkoutLogger: React.FC<WorkoutLoggerProps> = ({ 
  workoutTemplate,
  onWorkoutComplete 
}) => {
  // State management
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetNumber, setCurrentSetNumber] = useState(1);
  const [currentWeight, setCurrentWeight] = useState(190);
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('lbs');
  const [currentReps, setCurrentReps] = useState(8);
  const [currentDifficulty, setCurrentDifficulty] = useState(5);
  const [weightIncrement, setWeightIncrement] = useState(2.5);
  const [showDropSet, setShowDropSet] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [smartSuggestions, setSmartSuggestions] = useState<Array<{id: string; text: string; icon: string}>>([]);
  
  // Hooks
  const { logSet, currentWorkout, getExerciseHistory } = useWorkout();
  const { generateCoachingSuggestion, parseVoiceCommand } = useAI();
  const { isListening, startListening, stopListening, transcript } = useVoice();
  
  // Current exercise from template
  const currentExercise = workoutTemplate?.exercises[currentExerciseIndex];
  const totalExercises = workoutTemplate?.exercises.length || 0;
  const exerciseHistory = currentExercise ? getExerciseHistory(currentExercise.exercise?.name || '') : [];

  // Handle weight adjustment
  const handleWeightChange = useCallback((newWeight: number) => {
    setCurrentWeight(Math.max(0, newWeight));
    
    // Generate AI suggestion based on weight change
    if (currentExercise) {
      generateCoachingSuggestion({
        exercise: currentExercise.exercise?.name || '',
        currentWeight: newWeight,
        reps: currentReps,
        difficulty: currentDifficulty,
        userHistory: exerciseHistory,
        nextExercise: workoutTemplate?.exercises[currentExerciseIndex + 1]?.exercise?.name
      }).then(suggestion => {
        if (suggestion) {
          setSmartSuggestions(prev => [{
            id: Date.now().toString(),
            text: suggestion,
            icon: '💡'
          }, ...prev.slice(0, 2)]);
        }
      });
    }
  }, [currentExercise, currentReps, currentDifficulty, exerciseHistory, generateCoachingSuggestion, currentExerciseIndex, workoutTemplate]);

  // Handle set completion
  const handleCompleteSet = useCallback(async () => {
    if (!currentExercise) return;

    try {
      // Log the set with the expected parameters
      await logSet(
        currentReps,
        currentWeight,
        currentExercise.restTimeBetweenSets || 120, // Default 2 minutes rest
        '' // Empty notes for now
      );

      // Check if this was the last set
      if (currentSetNumber >= (currentExercise.targetSets || 3)) {
        // Move to next exercise
        if (currentExerciseIndex < totalExercises - 1) {
          setCurrentExerciseIndex(prev => prev + 1);
          setCurrentSetNumber(1);
          setIsResting(true);
        } else {
          // Workout complete
          onWorkoutComplete?.();
        }
      } else {
        // Move to next set
        setCurrentSetNumber(prev => prev + 1);
        setIsResting(true);
      }
    } catch (error) {
      console.error('Failed to log set:', error);
    }
  }, [currentExercise, currentWeight, currentReps, currentSetNumber, logSet, currentExerciseIndex, totalExercises, onWorkoutComplete]);

  // Handle voice command
  const handleVoiceCommand = useCallback(async (transcription: string) => {
    if (!currentExercise) return;

    const command = await parseVoiceCommand(transcription, {
      currentExercise: currentExercise.exercise?.name || '',
      expectedWeight: currentWeight,
      expectedReps: currentExercise.targetReps || 8,
      context: 'mid_workout'
    });

    // Process parsed command
    switch (command?.action) {
      case 'complete_set':
        if (command.weight) setCurrentWeight(command.weight);
        if (command.reps) setCurrentReps(command.reps);
        if (command.rpe) setCurrentDifficulty(command.rpe);
        await handleCompleteSet();
        break;
      case 'failed_set':
        setShowDropSet(true);
        break;
      case 'adjust_weight':
        if (command.weight) setCurrentWeight(command.weight);
        break;
      case 'start_timer':
        setIsResting(true);
        break;
      default:
        break;
    }
  }, [currentExercise, currentWeight, parseVoiceCommand, handleCompleteSet]);

  // Handle difficulty feedback
  const handleDifficultyFeedback = useCallback(async (feedback: 'too_easy' | 'perfect' | 'too_hard') => {
    // Generate AI-based progression advice
    const advice = await generateCoachingSuggestion({
      exercise: currentExercise?.exercise?.name || '',
      currentWeight,
      reps: currentReps,
      difficulty: currentDifficulty,
      userHistory: exerciseHistory,
      feedback
    });

    if (advice) {
      setSmartSuggestions(prev => [{
        id: Date.now().toString(),
        text: advice,
        icon: feedback === 'too_easy' ? '⚡' : feedback === 'too_hard' ? '⚠️' : '✅'
      }, ...prev.slice(0, 2)]);
    }
  }, [currentExercise, currentWeight, currentReps, currentDifficulty, exerciseHistory, generateCoachingSuggestion]);

  // Audio feedback
  const playSound = useCallback((soundType: 'tap' | 'complete' | 'start') => {
    // Audio implementation would go here
    // For now, we'll use the Web Audio API or pre-loaded audio files
  }, []);

  // Touch feedback
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.classList.add(styles.pressed);
    playSound('tap');
  }, [playSound]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.classList.remove(styles.pressed);
  }, []);

  if (!currentExercise) {
    return <div className={styles.deviceContainer}>No exercise selected</div>;
  }

  return (
    <div className={styles.deviceContainer}>
      <div className={styles.contentContainer}>
        {/* Exercise Header */}
        <ExerciseHeader
          workoutName={workoutTemplate?.name || 'Workout'}
          currentExerciseIndex={currentExerciseIndex + 1}
          totalExercises={totalExercises}
          exerciseName={currentExercise.exercise?.name || ''}
          currentSet={currentSetNumber}
          totalSets={currentExercise.targetSets || 3}
          onTemplateToggle={() => {}}
        />

        {/* Weight Control */}
        <div className={styles.card}>
          <WeightControl
            weight={currentWeight}
            unit={weightUnit}
            increment={weightIncrement}
            onWeightChange={handleWeightChange}
            onIncrementChange={setWeightIncrement}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          />
        </div>

        {/* Rep Counter */}
        <div className={styles.card}>
          <RepCounter
            reps={currentReps}
            onRepsChange={setCurrentReps}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          />
          
          {/* Difficulty Slider */}
          <DifficultySlider
            difficulty={currentDifficulty}
            onDifficultyChange={setCurrentDifficulty}
          />
        </div>

        {/* Voice Interface */}
        <VoiceInterface
          isListening={isListening}
          transcript={transcript}
          onToggleVoice={() => isListening ? stopListening() : startListening()}
          onVoiceCommand={handleVoiceCommand}
        />

        {/* Drop Set Logger (conditional) */}
        {showDropSet && (
          <DropSetLogger
            startWeight={currentWeight}
            onComplete={(dropSetData) => {
              setShowDropSet(false);
              // Handle drop set data
            }}
          />
        )}

        {/* Quick Actions */}
        <QuickActions
          onSwitchExercise={() => {}}
          onDifficultyFeedback={handleDifficultyFeedback}
          onPainReport={() => {}}
          onDropSet={() => setShowDropSet(true)}
        />

        {/* Analytics */}
        <AnalyticsCard
          currentWorkout={currentWorkout}
          currentExercise={currentExercise}
        />

        {/* Complete Set Button */}
        <button
          className={`${styles.card} ${styles.completeButton}`}
          onClick={handleCompleteSet}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{
            background: 'var(--accent)',
            color: 'var(--bg-deep)',
            textAlign: 'center',
            fontWeight: 600,
            fontSize: '18px',
            padding: '20px',
            cursor: 'pointer',
            border: 'none',
            width: '100%'
          }}
        >
          Complete Set
        </button>
      </div>

      {/* Sticky Carousel */}
      <StickyCarousel
        workoutProgress={(currentExerciseIndex / totalExercises) * 100}
        isResting={isResting}
        restDuration={currentExercise.restTimeBetweenSets || 120}
        onRestComplete={() => setIsResting(false)}
      />

      {/* Smart Suggestions */}
      <SmartSuggestions suggestions={smartSuggestions} />
    </div>
  );
};