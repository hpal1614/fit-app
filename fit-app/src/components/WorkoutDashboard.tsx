import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, SkipForward, SkipBack, Timer, Trophy, TrendingUp, MessageCircle, Trash2, Share2, CheckSquare, Square as SquareIcon } from 'lucide-react';
import { useWorkout } from '../hooks/useWorkout';
import { useVoice } from '../hooks/useVoice';
import { useAI } from '../hooks/useAI';
import VoiceButton from './VoiceButton';
import ExerciseCard from './ExerciseCard';
import SetLogger from './SetLogger';
import AIChatInterface from './AIChatInterface';
import WorkoutStats from './WorkoutStats';
import RestTimer from './RestTimer';

interface WorkoutDashboardProps {
  className?: string;
}

export const WorkoutDashboard: React.FC<WorkoutDashboardProps> = ({ className = '' }) => {
  const {
    currentWorkout,
    currentExercise,
    currentExerciseIndex,
    isWorkoutActive,
    startWorkout,
    endWorkout,
    pauseWorkout,
    resumeWorkout,
    nextExercise,
    previousExercise,
    logSet,
    workoutContext,
    workoutDuration,
    isResting,
    restTimeRemaining,
    getTotalSets,
    getTotalReps,
    getTotalWeight,
    getWorkoutProgress,
    isLoading,
    error,
    workoutHistory,
    deleteWorkouts
  } = useWorkout({ enableTimers: true });

  const { speak } = useVoice({ workoutContext });
  const { askCoach, getMotivation, isAvailable: isAIAvailable } = useAI();

  const [showAIChat, setShowAIChat] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedWorkouts, setSelectedWorkouts] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  // Handle voice commands from VoiceButton
  const handleVoiceCommand = async (transcript: string, result: any) => {
    if (result.success) {
      // Provide audio feedback for successful commands
      await speak(result.response);
      
      // Handle specific commands that might need UI updates
      switch (result.action) {
        case 'start_workout':
          if (!isWorkoutActive) {
            await handleStartWorkout();
          }
          break;
        case 'end_workout':
          if (isWorkoutActive) {
            await handleEndWorkout();
          }
          break;
        case 'next_exercise':
          if (isWorkoutActive) {
            nextExercise();
          }
          break;
        case 'previous_exercise':
          if (isWorkoutActive) {
            previousExercise();
          }
          break;
        case 'get_motivation':
          setShowAIChat(true);
          break;
      }
    }
  };

  // Workout control handlers
  const handleStartWorkout = async () => {
    try {
      await startWorkout();
      await speak('Workout started! Let\'s crush this session.');
    } catch (err) {
      console.error('Failed to start workout:', err);
      await speak('Sorry, I couldn\'t start the workout. Please try again.');
    }
  };

  const handleEndWorkout = async () => {
    try {
      const completed = await endWorkout();
      if (completed) {
        await speak(`Great job! You completed ${getTotalSets()} sets and lifted ${getTotalWeight()} total pounds.`);
        setShowStats(true);
      }
    } catch (err) {
      console.error('Failed to end workout:', err);
      await speak('There was an issue ending your workout. Please try again.');
    }
  };

  const handlePauseResume = async () => {
    if (currentWorkout?.isCompleted === false) {
      pauseWorkout();
      await speak('Workout paused.');
    } else {
      resumeWorkout();
      await speak('Workout resumed. Keep going!');
    }
  };

  // Multi-select handlers
  const toggleWorkoutSelection = (workoutId: string) => {
    const newSelected = new Set(selectedWorkouts);
    if (newSelected.has(workoutId)) {
      newSelected.delete(workoutId);
    } else {
      newSelected.add(workoutId);
    }
    setSelectedWorkouts(newSelected);
  };

  const selectAllWorkouts = () => {
    if (selectedWorkouts.size === workoutHistory.length) {
      setSelectedWorkouts(new Set());
    } else {
      setSelectedWorkouts(new Set(workoutHistory.map(w => w.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedWorkouts.size === 0) return;
    
    const confirmDelete = window.confirm(`Are you sure you want to delete ${selectedWorkouts.size} workout(s)? This action cannot be undone.`);
    
    if (confirmDelete) {
      try {
        await deleteWorkouts(Array.from(selectedWorkouts));
        setSelectedWorkouts(new Set());
        setIsMultiSelectMode(false);
        await speak(`Deleted ${selectedWorkouts.size} workouts successfully.`);
      } catch (error) {
        console.error('Failed to delete workouts:', error);
        await speak('Failed to delete workouts. Please try again.');
      }
    }
  };

  const handleShareSelected = async () => {
    if (selectedWorkouts.size === 0) return;
    
    const selectedWorkoutData = workoutHistory.filter(w => selectedWorkouts.has(w.id));
    
    // Create shareable workout summary
    const workoutSummary = selectedWorkoutData.map(workout => {
      const duration = Math.round(workout.duration / 60);
      const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
      const totalWeight = workout.exercises.reduce((sum, ex) => 
        sum + ex.sets.reduce((setSum, set) => setSum + (set.weight || 0), 0), 0
      );
      
      return `💪 Workout ${new Date(workout.startedAt).toLocaleDateString()}
🕐 Duration: ${duration} minutes
📊 Sets: ${totalSets}, Weight: ${totalWeight}lbs
🏋️ Exercises: ${workout.exercises.map(ex => ex.exercise.name).join(', ')}`;
    }).join('\n\n');

    const shareText = `Check out my fitness progress! 🔥\n\n${workoutSummary}\n\n#FitnessJourney #AIFitnessCoach`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Workout Progress',
          text: shareText,
        });
        await speak('Workout data shared successfully!');
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        await speak('Workout summary copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        await speak('Failed to share workout data.');
      }
    }
  };

  // Format duration for display
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get progress percentage
  const progressPercent = getWorkoutProgress();

  if (isLoading) {
    return (
      <div className={`${className} flex items-center justify-center min-h-96`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fitness-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workout...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} bg-red-50 border border-red-200 rounded-lg p-6`}>
        <div className="text-center">
          <div className="text-red-600 mb-2">⚠️ Error</div>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} space-y-6`}>
      {/* Header with Voice Control */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">AI Fitness Coach</h1>
          
          {/* Voice Button */}
          <VoiceButton
            workoutContext={workoutContext}
            size="lg"
            showLabel={false}
            onCommandProcessed={handleVoiceCommand}
            className="flex-shrink-0"
          />
        </div>

        {/* Workout Status Bar */}
        {isWorkoutActive ? (
          <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Timer size={16} />
                <span>{formatDuration(workoutDuration)}</span>
              </div>
              <div>Sets: {getTotalSets()}</div>
              <div>Reps: {getTotalReps()}</div>
              <div>Weight: {getTotalWeight()}lbs</div>
            </div>
            <div className="text-fitness-blue font-medium">{progressPercent}% Complete</div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-4">
            No active workout. Say "start workout" or click below to begin.
          </div>
        )}

        {/* Progress Bar */}
        {isWorkoutActive && (
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-fitness-blue h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex items-center justify-center space-x-3">
          {!isWorkoutActive ? (
            <button
              onClick={handleStartWorkout}
              className="bg-fitness-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center space-x-2"
            >
              <Play size={20} />
              <span>Start Workout</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => previousExercise()}
                className="bg-gray-100 text-gray-700 p-3 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={currentExerciseIndex === 0}
              >
                <SkipBack size={20} />
              </button>
              
              <button
                onClick={handlePauseResume}
                className="bg-fitness-orange text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors flex items-center space-x-2"
              >
                <Pause size={20} />
                <span>Pause</span>
              </button>
              
              <button
                onClick={handleEndWorkout}
                className="bg-voice-error text-white px-6 py-3 rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center space-x-2"
              >
                <Square size={20} />
                <span>End Workout</span>
              </button>
              
              <button
                onClick={() => nextExercise()}
                className="bg-gray-100 text-gray-700 p-3 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={!currentWorkout || currentExerciseIndex >= currentWorkout.exercises.length - 1}
              >
                <SkipForward size={20} />
              </button>
            </>
          )}
          
          {/* AI Chat Toggle */}
          {isAIAvailable && (
            <button
              onClick={() => setShowAIChat(!showAIChat)}
              className={`p-3 rounded-lg transition-colors ${
                showAIChat 
                  ? 'bg-fitness-green text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MessageCircle size={20} />
            </button>
          )}

          {/* History Toggle */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`p-3 rounded-lg transition-colors ${
              showHistory 
                ? 'bg-fitness-blue text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Trophy size={20} />
          </button>
        </div>
      </div>

      {/* Workout History with Multi-Select */}
      {showHistory && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Workout History</h2>
            
            <div className="flex items-center space-x-2">
              {/* Multi-select toggle */}
              <button
                onClick={() => {
                  setIsMultiSelectMode(!isMultiSelectMode);
                  setSelectedWorkouts(new Set());
                }}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  isMultiSelectMode 
                    ? 'bg-fitness-blue text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isMultiSelectMode ? 'Exit Selection' : 'Select Multiple'}
              </button>

              {/* Multi-select actions */}
              {isMultiSelectMode && (
                <>
                  <button
                    onClick={selectAllWorkouts}
                    className="px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    {selectedWorkouts.size === workoutHistory.length ? 'Deselect All' : 'Select All'}
                  </button>
                  
                  {selectedWorkouts.size > 0 && (
                    <>
                      <button
                        onClick={handleDeleteSelected}
                        className="px-3 py-2 rounded-lg text-sm bg-red-100 text-red-700 hover:bg-red-200 transition-colors flex items-center space-x-1"
                      >
                        <Trash2 size={14} />
                        <span>Delete ({selectedWorkouts.size})</span>
                      </button>
                      
                      <button
                        onClick={handleShareSelected}
                        className="px-3 py-2 rounded-lg text-sm bg-green-100 text-green-700 hover:bg-green-200 transition-colors flex items-center space-x-1"
                      >
                        <Share2 size={14} />
                        <span>Share ({selectedWorkouts.size})</span>
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Workout list */}
          <div className="space-y-3">
            {workoutHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Trophy size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No workouts completed yet.</p>
                <p className="text-sm">Start your first workout to see your progress here!</p>
              </div>
            ) : (
              workoutHistory.map((workout) => (
                <div
                  key={workout.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    selectedWorkouts.has(workout.id) 
                      ? 'border-fitness-blue bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {/* Multi-select checkbox */}
                      {isMultiSelectMode && (
                        <button
                          onClick={() => toggleWorkoutSelection(workout.id)}
                          className="text-fitness-blue hover:text-blue-700"
                        >
                          {selectedWorkouts.has(workout.id) ? 
                            <CheckSquare size={20} /> : 
                            <SquareIcon size={20} />
                          }
                        </button>
                      )}
                      
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {new Date(workout.startedAt).toLocaleDateString()}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Duration: {Math.round(workout.duration / 60)} minutes • 
                          Sets: {workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)} • 
                          Exercises: {workout.exercises.length}
                        </p>
                      </div>
                    </div>
                    
                    {!isMultiSelectMode && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleShareSelected([workout.id])}
                          className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                        >
                          <Share2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Rest Timer */}
      {isResting && (
        <RestTimer 
          timeRemaining={restTimeRemaining}
          onComplete={() => speak('Rest time is over! Ready for the next set?')}
        />
      )}

      {/* Current Exercise */}
      {isWorkoutActive && currentExercise && (
        <div className="grid md:grid-cols-2 gap-6">
          <ExerciseCard 
            exercise={currentExercise}
            isActive={true}
            onExerciseSelect={() => {}}
          />
          
          <SetLogger
            exercise={currentExercise}
            onSetLogged={async (reps, weight, restTime, notes) => {
              try {
                await logSet(reps, weight, restTime, notes);
                await speak(`Set logged: ${reps} reps at ${weight} pounds.`);
              } catch (err) {
                await speak('Failed to log set. Please try again.');
              }
            }}
          />
        </div>
      )}

      {/* AI Chat Interface */}
      {showAIChat && (
        <AIChatInterface
          workoutContext={workoutContext}
          onClose={() => setShowAIChat(false)}
        />
      )}

      {/* Workout Stats Modal */}
      {showStats && (
        <WorkoutStats
          workout={currentWorkout}
          onClose={() => setShowStats(false)}
        />
      )}
    </div>
  );
};

export default WorkoutDashboard;