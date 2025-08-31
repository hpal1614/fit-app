import React, { useState, useEffect } from 'react';
import { useVoiceRecognition } from './hooks/useVoiceRecognition';
import { useAICoach } from './hooks/useAICoach';
import { useWorkoutLogger } from './hooks/useWorkoutLogger';
import { VoiceInterface } from './components/voice/VoiceInterface';
import { WorkoutLogger } from './components/workout/WorkoutLogger';
import { ChatInterface } from './components/ai/ChatInterface';
import AICoachScreen from './components/ai/AICoachScreen';
import { WorkoutTimer } from './components/workout/WorkoutTimer';
import type { VoiceCommandResult } from './types';
import { FinalUI } from './components/finalUI';
import BottomNav, { type TabKey } from './components/BottomNav';
import { TestWorkoutCard } from './components/finalUI/TestWorkoutCard';
import { TestBeautifulWorkoutCard } from './components/finalUI/TestBeautifulWorkoutCard';
import { WorkoutsHome } from './components/workout/WorkoutsHome';
import NutritionTab from './components/nutrition/NutritionTab';
import './index.css';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showFinalUI, setShowFinalUI] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [showWorkoutCardTest, setShowWorkoutCardTest] = useState(false);
  const [showBeautifulWorkoutCardTest, setShowBeautifulWorkoutCardTest] = useState(false);
  const [isWorkoutCardOpen, setIsWorkoutCardOpen] = useState(false);

  // Initialize hooks
  const workoutLogger = useWorkoutLogger();
  const voiceRecognition = useVoiceRecognition(workoutLogger.getWorkoutContext());
  const aiCoach = useAICoach();

  // Handle voice commands
  useEffect(() => {
    if (voiceRecognition.lastCommand) {
      handleVoiceCommand(voiceRecognition.lastCommand);
    }
  }, [voiceRecognition.lastCommand]);

  // Handle voice command processing
  const handleVoiceCommand = async (command: VoiceCommandResult) => {
    const { action, parameters } = command;
    const context = workoutLogger.getWorkoutContext();

    try {
      switch (action) {
        case 'START_WORKOUT':
          if (parameters.workoutType) {
            // Find template by name
            const templates = await workoutLogger.getWorkoutTemplates();
            const template = templates.find(t => 
              t.name.toLowerCase().includes(parameters.workoutType.toLowerCase())
            );
            await workoutLogger.startWorkout(template?.id);
            await voiceRecognition.speak(`Starting ${template?.name || 'workout'}! Let's begin with your first exercise.`);
          } else {
            await workoutLogger.startWorkout();
            await voiceRecognition.speak("Workout started! What exercise would you like to begin with?");
          }
          break;

        case 'END_WORKOUT':
          const completedWorkout = await workoutLogger.endWorkout();
          if (completedWorkout) {
            const duration = completedWorkout.duration || 0;
            const totalSets = completedWorkout.exercises.reduce((total, ex) => total + ex.sets.length, 0);
            await voiceRecognition.speak(
              `Great workout! You completed ${totalSets} sets in ${duration} minutes. Well done!`
            );
          }
          break;

        case 'LOG_EXERCISE':
          if (parameters.exercise && parameters.reps && parameters.weight) {
            // Find exercise by name
            const exercises = await workoutLogger.searchExercises(parameters.exercise);
            if (exercises.length > 0) {
              const exercise = exercises[0];
              await workoutLogger.logSet(
                exercise.id, 
                parameters.reps, 
                parameters.weight
              );
              
              await voiceRecognition.speak(
                `Logged ${parameters.reps} reps of ${exercise.name} at ${parameters.weight} ${parameters.unit || 'lbs'}. Great job!`
              );

              // Offer encouragement or tips
              if (context.preferences.motivationalMessages) {
                const encouragement = await aiCoach.getContextualTips(context);
                if (encouragement) {
                  setTimeout(() => voiceRecognition.speak(encouragement), 2000);
                }
              }
            } else {
              await voiceRecognition.speak(`I couldn't find the exercise "${parameters.exercise}". Could you try a different name?`);
            }
          }
          break;

        case 'GET_PERSONAL_RECORD':
          if (parameters.value) {
            const exercises = await workoutLogger.searchExercises(parameters.value);
            if (exercises.length > 0) {
              const records = await workoutLogger.getPersonalRecords(exercises[0].id);
              const maxWeightRecord = records.find(r => r.type === 'max_weight');
              if (maxWeightRecord) {
                await voiceRecognition.speak(
                  `Your personal record for ${exercises[0].name} is ${maxWeightRecord.value} pounds.`
                );
              } else {
                await voiceRecognition.speak(
                  `I don't have a personal record for ${exercises[0].name} yet. Let's set one today!`
                );
              }
            }
          }
          break;

        case 'MOTIVATION':
          const motivation = await aiCoach.getMotivation(context);
          if (motivation) {
            await voiceRecognition.speak(motivation);
          }
          break;

        case 'AI_COACHING':
          const coaching = await aiCoach.askCoach(command.transcript, context, 'general-advice');
          if (coaching?.content) {
            await voiceRecognition.speak(coaching.content);
          }
          break;

        case 'NUTRITION_ADVICE':
          const nutrition = await aiCoach.getNutritionAdvice(command.transcript, context);
          if (nutrition) {
            await voiceRecognition.speak(nutrition);
          }
          break;

        case 'TIMER_START':
          workoutLogger.startRestTimer();
          await voiceRecognition.speak("Rest timer started. Take your time to recover.");
          break;

        case 'TIMER_STOP':
          workoutLogger.stopRestTimer();
          await voiceRecognition.speak("Timer stopped. Ready for your next set?");
          break;

        case 'NEXT_EXERCISE':
          const moved = workoutLogger.moveToNextExercise();
          if (moved && workoutLogger.currentExercise) {
            await voiceRecognition.speak(
              `Moving to ${workoutLogger.currentExercise.exercise.name}. ${workoutLogger.currentExercise.exercise.instructions[0]}`
            );
          } else {
            await voiceRecognition.speak("No more exercises in your workout. Great job!");
          }
          break;

        case 'HELP':
          await voiceRecognition.speak(
            "I can help you log exercises, start workouts, get personal records, provide motivation, and answer fitness questions. Just speak naturally!"
          );
          break;

        case 'CLARIFY':
          await voiceRecognition.speak(
            "I didn't understand that. You can say things like 'log bench press for 8 reps at 185 pounds' or 'what's my squat personal record?'"
          );
          break;

        default:
          // For unhandled commands, try AI coaching
          const response = await aiCoach.askCoach(command.transcript, context, 'general-advice');
          if (response?.content) {
            await voiceRecognition.speak(response.content);
          } else {
            await voiceRecognition.speak("I'm not sure how to help with that. Could you try rephrasing?");
          }
      }
    } catch (error) {
      console.error('Error handling voice command:', error);
      await voiceRecognition.speak("Sorry, I encountered an error. Please try again.");
    }
  };

  // Handle personal records celebration
  useEffect(() => {
    if (workoutLogger.recentPersonalRecords.length > 0) {
      const latestPR = workoutLogger.recentPersonalRecords[workoutLogger.recentPersonalRecords.length - 1];
      voiceRecognition.speak(
        `Congratulations! You just set a new personal record for ${latestPR.exercise.name}: ${latestPR.value} ${latestPR.type.replace('_', ' ')}!`
      );
    }
  }, [workoutLogger.recentPersonalRecords.length]);

  // If showing the new UI, render it
  if (showFinalUI) {
    return (
      <div className={`min-h-screen transition-all duration-300 ${
        isDarkMode ? 'dark bg-dark-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}>
        {/* Header (hidden on AI tab) */}
        {/* Header removed on all screens per request */}

        {/* Main Content - Tabs */}
        <main className="relative pb-24 lg:pb-0">
          {activeTab === 'workouts' && (
            <WorkoutsHome
              workoutLogger={workoutLogger}
              voiceRecognition={voiceRecognition}
              aiCoach={aiCoach}
            />
          )}
          {(activeTab === 'dashboard' || true) && (
            <FinalUI 
              workoutLogger={workoutLogger}
              voiceRecognition={voiceRecognition}
              aiCoach={aiCoach}
              showChat={showChat}
              onToggleChat={() => setShowChat(!showChat)}
              onWorkoutCardStateChange={setIsWorkoutCardOpen}
            />
          )}
          {activeTab === 'nutrition' && (
            <NutritionTab aiCoach={aiCoach as any} />
          )}
          {activeTab === 'ai' && (
            <AICoachScreen workoutContext={workoutLogger.getWorkoutContext()} />
          )}
        </main>

        <BottomNav active={activeTab} onChange={setActiveTab} />

        {/* Voice Command Help */}
        {voiceRecognition.transcript && (
          <div className="fixed bottom-6 left-6 right-6 md:left-auto md:w-96 glass p-4 rounded-2xl shadow-strong backdrop-blur-md animate-slide-up">
            <p className="text-sm text-gray-900 dark:text-white">
              <span className="opacity-75">You said:</span> "{voiceRecognition.transcript}"
            </p>
            <div className="w-full bg-gray-200 dark:bg-dark-600 rounded-full h-2 mt-3">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${voiceRecognition.confidence * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Display */}
        {(voiceRecognition.hasError || workoutLogger.hasError || aiCoach.hasError) && (
          <div className="fixed top-6 right-6 glass p-4 rounded-2xl shadow-strong max-w-sm animate-slide-up">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Error</h4>
                <p className="text-sm mt-1 text-gray-700 dark:text-gray-300">
                  {voiceRecognition.error?.message || workoutLogger.error || aiCoach.error}
                </p>
              </div>
              <button
                onClick={() => {
                  voiceRecognition.clearError();
                  workoutLogger.clearError();
                  aiCoach.clearError();
                }}
                className="ml-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Test Workout Card Mode
  if (showWorkoutCardTest) {
    return <TestWorkoutCard />;
  }

  // Test Beautiful Workout Card Mode
  if (showBeautifulWorkoutCardTest) {
    return <TestBeautifulWorkoutCard />;
  }

  // Original UI (fallback)
  return (
    <div className={`min-h-screen transition-all duration-300 ${
      isDarkMode ? 'dark bg-dark-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header removed on all screens per request */}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 pb-24 lg:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Voice Interface & Workout Controls */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Voice Interface */}
            <VoiceInterface
              voiceState={voiceRecognition.voiceState}
              isInitialized={voiceRecognition.isInitialized}
              error={voiceRecognition.error}
              transcript={voiceRecognition.transcript}
              confidence={voiceRecognition.confidence}
              onToggle={voiceRecognition.toggleListening}
              onClearError={voiceRecognition.clearError}
            />

            {/* Rest Timer */}
            {workoutLogger.isResting && (
              <WorkoutTimer
                timeRemaining={workoutLogger.restTimeRemaining}
                isResting={true}
                onStop={workoutLogger.stopRestTimer}
                formatTime={workoutLogger.formatRestTime}
              />
            )}

            {/* Quick Actions */}
            <div className="card p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
              <div className="space-y-3">
                {!workoutLogger.isWorkoutActive ? (
                  <button
                    onClick={() => workoutLogger.startWorkout()}
                    className="btn-primary w-full"
                  >
                    Start Workout
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => workoutLogger.endWorkout()}
                      className="w-full bg-error hover:bg-red-600 text-white font-medium px-6 py-3 rounded-xl transition-all duration-200 shadow-soft hover:shadow-medium"
                    >
                      End Workout
                    </button>
                    {!workoutLogger.isResting && (
                      <button
                        onClick={() => workoutLogger.startRestTimer()}
                        className="w-full bg-accent hover:bg-orange-600 text-white font-medium px-6 py-3 rounded-xl transition-all duration-200 shadow-soft hover:shadow-medium"
                      >
                        Start Rest Timer
                      </button>
                    )}
                  </>
                )}
                
                <button
                  onClick={() => voiceRecognition.speak("Hello! I'm your AI fitness coach. How can I help you today?")}
                  disabled={!voiceRecognition.canListen}
                  className="btn-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Test Voice
                </button>
              </div>
            </div>

            {/* Current Exercise Info */}
            {workoutLogger.hasCurrentExercise && (
              <div className="card p-6 space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Current Exercise</h3>
                <div className="space-y-2">
                  <p className="font-medium text-gray-900 dark:text-white">{workoutLogger.currentExerciseName}</p>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Sets: {workoutLogger.exerciseProgress}</span>
                    <span>Target: {workoutLogger.currentExerciseTargetReps} reps</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Center Column - Workout Logger */}
          <div className="lg:col-span-1">
            <WorkoutLogger
              workout={workoutLogger.activeWorkout}
              currentExercise={workoutLogger.currentExercise}
              onLogSet={workoutLogger.quickLogSet}
              onAddExercise={workoutLogger.addExercise}
              onSelectExercise={workoutLogger.selectExercise}
              isRecording={workoutLogger.isRecording}
              preferences={workoutLogger.preferences}
              onUpdatePreferences={workoutLogger.updatePreferences}
            />
          </div>

          {/* Right Column - AI Chat (if enabled) */}
          {showChat && (
            <div className="lg:col-span-1">
              <ChatInterface
                aiCoach={aiCoach}
                workoutContext={workoutLogger.getWorkoutContext()}
                voiceEnabled={voiceRecognition.isInitialized}
                onSpeak={voiceRecognition.speak}
              />
            </div>
          )}
        </div>

        {/* Workout Summary */}
        {workoutLogger.workoutSummary && (
          <div className="card mt-8 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Workout Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{workoutLogger.workoutSummary.duration}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Minutes</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-secondary">{workoutLogger.workoutSummary.exerciseCount}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Exercises</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-accent">{workoutLogger.workoutSummary.setCount}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Sets</p>
                </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-success">{Math.round(workoutLogger.workoutSummary.volume)}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">lbs Volume</p>
              </div>
            </div>
          </div>
        )}

        {/* Personal Records */}
        {workoutLogger.recentPersonalRecords.length > 0 && (
          <div className="card mt-8 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="mr-2">🏆</span>
              Recent Personal Records
            </h3>
            <div className="space-y-3">
              {workoutLogger.recentPersonalRecords.map((record, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-800">
                  <span className="font-medium text-gray-900 dark:text-white">{record.exercise.name}</span>
                  <span className="text-primary font-bold">
                    {record.value} {record.type.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <BottomNav active={activeTab} onChange={setActiveTab} />

      {/* Voice Command Help */}
      {voiceRecognition.transcript && (
        <div className="fixed bottom-6 left-6 right-6 md:left-auto md:w-96 glass p-4 rounded-2xl shadow-strong backdrop-blur-md animate-slide-up">
          <p className="text-sm text-gray-900 dark:text-white">
            <span className="opacity-75">You said:</span> "{voiceRecognition.transcript}"
          </p>
          <div className="w-full bg-gray-200 dark:bg-dark-600 rounded-full h-2 mt-3">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${voiceRecognition.confidence * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Display */}
      {(voiceRecognition.hasError || workoutLogger.hasError || aiCoach.hasError) && (
        <div className="fixed top-6 right-6 glass p-4 rounded-2xl shadow-strong max-w-sm animate-slide-up">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Error</h4>
              <p className="text-sm mt-1 text-gray-700 dark:text-gray-300">
                {voiceRecognition.error?.message || workoutLogger.error || aiCoach.error}
              </p>
            </div>
            <button
              onClick={() => {
                voiceRecognition.clearError();
                workoutLogger.clearError();
                aiCoach.clearError();
              }}
              className="ml-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;