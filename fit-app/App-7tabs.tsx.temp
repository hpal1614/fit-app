import React, { useState, useEffect } from 'react';
import { useVoiceRecognition } from './hooks/useVoiceRecognition';
import { useAICoach } from './hooks/useAICoach';
import { useWorkoutLogger } from './hooks/useWorkoutLogger';
import { VoiceInterface } from './components/voice/VoiceInterface';
import { WorkoutLogger } from './components/workout/WorkoutLogger';
import { ChatInterface } from './components/ai/ChatInterface';
import { WorkoutTimer } from './components/workout/WorkoutTimer';
import { VoiceCommandResult } from './types';
import './index.css';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showChat, setShowChat] = useState(false);

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

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header */}
      <header className="bg-gradient-to-r from-fitness-blue to-fitness-green p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-white">AI Fitness Coach</h1>
            {workoutLogger.isWorkoutActive && (
              <div className="text-white text-sm opacity-90">
                <span className="bg-white/20 px-2 py-1 rounded">
                  {workoutLogger.workoutDurationFormatted}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Voice Status Indicator */}
            {voiceRecognition.isActive && (
              <div className="flex items-center space-x-2 text-white">
                <div className={`w-3 h-3 rounded-full animate-pulse ${
                  voiceRecognition.isListening ? 'bg-voice-listening' : 
                  voiceRecognition.isSpeaking ? 'bg-voice-speaking' : 'bg-voice-processing'
                }`} />
                <span className="text-sm">
                  {voiceRecognition.isListening ? 'Listening...' :
                   voiceRecognition.isSpeaking ? 'Speaking...' : 'Processing...'}
                </span>
              </div>
            )}
            
            {/* Chat Toggle */}
            <button
              onClick={() => setShowChat(!showChat)}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg transition-colors"
            >
              AI Chat
            </button>
            
            {/* Theme Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg transition-colors"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
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
            <div className={`p-4 rounded-lg ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            } shadow-lg`}>
              <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
              <div className="space-y-2">
                {!workoutLogger.isWorkoutActive ? (
                  <button
                    onClick={() => workoutLogger.startWorkout()}
                    className="w-full bg-fitness-green hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Start Workout
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => workoutLogger.endWorkout()}
                      className="w-full bg-fitness-red hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                      End Workout
                    </button>
                    {!workoutLogger.isResting && (
                      <button
                        onClick={() => workoutLogger.startRestTimer()}
                        className="w-full bg-fitness-orange hover:bg-orange-600 text-white py-2 px-4 rounded-lg transition-colors"
                      >
                        Start Rest Timer
                      </button>
                    )}
                  </>
                )}
                
                <button
                  onClick={() => voiceRecognition.speak("Hello! I'm your AI fitness coach. How can I help you today?")}
                  disabled={!voiceRecognition.canListen}
                  className="w-full bg-fitness-blue hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  Test Voice
                </button>
              </div>
            </div>

            {/* Current Exercise Info */}
            {workoutLogger.hasCurrentExercise && (
              <div className={`p-4 rounded-lg ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              } shadow-lg`}>
                <h3 className="text-lg font-semibold mb-2">Current Exercise</h3>
                <div className="space-y-2">
                  <p className="font-medium">{workoutLogger.currentExerciseName}</p>
                  <p className="text-sm opacity-75">
                    Sets: {workoutLogger.exerciseProgress}
                  </p>
                  <p className="text-sm opacity-75">
                    Target: {workoutLogger.currentExerciseTargetReps} reps
                  </p>
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
          <div className={`mt-6 p-4 rounded-lg ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          } shadow-lg`}>
            <h3 className="text-lg font-semibold mb-3">Workout Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-fitness-blue">{workoutLogger.workoutSummary.duration}</p>
                <p className="text-sm opacity-75">Minutes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-fitness-green">{workoutLogger.workoutSummary.exerciseCount}</p>
                <p className="text-sm opacity-75">Exercises</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-fitness-orange">{workoutLogger.workoutSummary.setCount}</p>
                <p className="text-sm opacity-75">Sets</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-fitness-red">{Math.round(workoutLogger.workoutSummary.volume)}</p>
                <p className="text-sm opacity-75">lbs Volume</p>
              </div>
            </div>
          </div>
        )}

        {/* Personal Records */}
        {workoutLogger.recentPersonalRecords.length > 0 && (
          <div className={`mt-6 p-4 rounded-lg ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          } shadow-lg`}>
            <h3 className="text-lg font-semibold mb-3">Recent Personal Records 🏆</h3>
            <div className="space-y-2">
              {workoutLogger.recentPersonalRecords.map((record, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-fitness-green/10 rounded">
                  <span className="font-medium">{record.exercise.name}</span>
                  <span className="text-fitness-green font-bold">
                    {record.value} {record.type.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Voice Command Help */}
      {voiceRecognition.transcript && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:w-96 bg-black/80 text-white p-3 rounded-lg backdrop-blur">
          <p className="text-sm">
            <span className="opacity-75">You said:</span> "{voiceRecognition.transcript}"
          </p>
          <div className="w-full bg-white/20 rounded-full h-1 mt-2">
            <div 
              className="bg-fitness-green h-1 rounded-full transition-all duration-300"
              style={{ width: `${voiceRecognition.confidence * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Display */}
      {(voiceRecognition.hasError || workoutLogger.hasError || aiCoach.hasError) && (
        <div className="fixed top-4 right-4 bg-fitness-red text-white p-4 rounded-lg shadow-lg max-w-sm">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold">Error</h4>
              <p className="text-sm mt-1">
                {voiceRecognition.error?.message || workoutLogger.error || aiCoach.error}
              </p>
            </div>
            <button
              onClick={() => {
                voiceRecognition.clearError();
                workoutLogger.clearError();
                aiCoach.clearError();
              }}
              className="ml-2 text-white/80 hover:text-white"
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