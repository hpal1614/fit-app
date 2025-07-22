import React, { useState, useEffect } from 'react';
import { WorkoutDashboard } from './components/WorkoutDashboard';
import { AIChatInterface } from './components/AIChatInterface';
import { VoiceButton } from './components/VoiceButton';
import { WorkoutStats } from './components/WorkoutStats';
import { useWorkout } from './hooks/useWorkout';
import { useVoice } from './hooks/useVoice';

// Import new intelligent services
import { IntelligentAIService } from './services/intelligentAIService';
import { FitnessNLP } from './services/naturalLanguageProcessor';
import { ConversationFlowManager } from './services/conversationFlow';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Initialize intelligent services
  const [aiService] = useState(() => new IntelligentAIService());
  const [nlpService] = useState(() => new FitnessNLP());
  const [conversationFlow] = useState(() => new ConversationFlowManager());

  // Hooks
  const workoutLogger = useWorkout({ enableTimers: true });
  const voiceRecognition = useVoice({ workoutContext: workoutLogger.workoutContext });

  // Handle enhanced voice commands
  const handleVoiceCommand = async (transcript: string) => {
    try {
      console.log('🎙️ Voice input:', transcript);

      // Get enhanced context
      const workoutContext = workoutLogger.workoutContext;

      // Process with conversational flow
      const response = await conversationFlow.processUserInput(transcript, workoutContext);

      console.log('🤖 AI Response:', response);

      // Execute any actions
      if (response.actions) {
        for (const action of response.actions) {
          await executeWorkoutCommand(action.action, action.parameters || {});
        }
      }

      // Speak the response with appropriate emotion
      await voiceRecognition.speak(response.text, {
        emotion: response.emotion,
        priority: response.priority || 'medium'
      });

      // Show suggestions in UI if available
      if (response.suggestions && response.suggestions.length > 0) {
        console.log('💡 Suggestions:', response.suggestions);
        // Could display these in a UI component
      }

    } catch (error) {
      console.error('❌ Voice command failed:', error);
      await voiceRecognition.speak(
        "Sorry, I had trouble processing that. Could you try again?",
        { emotion: 'apologetic' }
      );
    }
  };

  // Enhanced command execution with intelligent responses
  const executeWorkoutCommand = async (action: string, parameters: any = {}) => {
    const context = workoutLogger.workoutContext;

    try {
      switch (action) {
        case 'START_WORKOUT':
          if (parameters.workoutType) {
            await workoutLogger.startWorkout(undefined, undefined, parameters.workoutType);
            await voiceRecognition.speak(
              `Starting your ${parameters.workoutType} workout! Let's crush it today! 💪`,
              { emotion: 'encouraging' }
            );
          } else {
            await workoutLogger.startWorkout();
            await voiceRecognition.speak(
              "Workout started! What exercise would you like to begin with?",
              { emotion: 'encouraging' }
            );
          }
          break;

        case 'END_WORKOUT':
          const completedWorkout = await workoutLogger.endWorkout();
          if (completedWorkout) {
            const duration = workoutLogger.workoutDuration;
            const totalSets = workoutLogger.getTotalSets();
            
            // Get AI-generated workout summary
            const summaryResponse = await aiService.getCoachingResponse(
              `Generate an encouraging workout completion message. User completed ${totalSets} sets in ${duration} minutes.`,
              context,
              'motivation'
            );
            
            await voiceRecognition.speak(summaryResponse.content, { emotion: 'celebratory' });
          }
          break;

        case 'LOG_EXERCISE':
          const { exercise, reps, weight, unit = 'lbs' } = parameters;
          if (exercise && reps && weight) {
            await workoutLogger.logSet(reps, weight);
            
            // Get intelligent feedback based on the set
            const setFeedback = await aiService.getCoachingResponse(
              `User just completed ${reps} reps of ${exercise} at ${weight} ${unit}. Provide encouraging feedback.`,
              context,
              'motivation'
            );
            
            await voiceRecognition.speak(setFeedback.content, { emotion: 'celebratory' });
          }
          break;

        case 'NEXT_EXERCISE':
          if (workoutLogger.isWorkoutActive) {
            const nextEx = workoutLogger.nextExercise();
            if (nextEx) {
              const exerciseInfo = await aiService.getCoachingResponse(
                `User is moving to ${nextEx.exercise.name}. Give brief form reminders and encouragement.`,
                context,
                'exercise-explanation'
              );
              await voiceRecognition.speak(exerciseInfo.content, { emotion: 'instructional' });
            }
          }
          break;

        case 'PREVIOUS_EXERCISE':
          if (workoutLogger.isWorkoutActive) {
            workoutLogger.previousExercise();
            await voiceRecognition.speak("Going back to the previous exercise!", { emotion: 'neutral' });
          }
          break;

        case 'START_REST_TIMER':
          const restTime = parameters.seconds || 90; // Default 90 seconds
          workoutLogger.startRestTimer(restTime);
          await voiceRecognition.speak(
            `Started ${restTime} second rest timer. Take your time and breathe!`,
            { emotion: 'instructional' }
          );
          break;

        case 'FORM_ANALYSIS':
          const exercise = parameters.exercise || context.currentExercise?.exercise.name;
          if (exercise) {
            const formAnalysis = await aiService.getCoachingResponse(
              `Analyze form for ${exercise}. Provide key form points and safety tips.`,
              context,
              'form-analysis'
            );
            await voiceRecognition.speak(formAnalysis.content, { emotion: 'instructional' });
          } else {
            await voiceRecognition.speak(
              "Which exercise would you like form tips for?",
              { emotion: 'questioning' }
            );
          }
          break;

        case 'MOTIVATION_REQUEST':
          const motivation = await aiService.getCoachingResponse(
            parameters.context || 'User needs motivation during workout',
            context,
            'motivation'
          );
          await voiceRecognition.speak(motivation.content, { emotion: 'encouraging' });
          break;

        case 'NUTRITION_QUERY':
          const nutritionAdvice = await aiService.getCoachingResponse(
            parameters.query || 'General nutrition advice',
            context,
            'nutrition-advice'
          );
          await voiceRecognition.speak(nutritionAdvice.content, { emotion: 'instructional' });
          break;

        case 'EXERCISE_INFO':
          const exerciseInfoResponse = await aiService.getCoachingResponse(
            `Explain ${parameters.exercise}: muscles worked, form tips, and benefits.`,
            context,
            'exercise-explanation'
          );
          await voiceRecognition.speak(exerciseInfoResponse.content, { emotion: 'instructional' });
          break;

        case 'GET_PROGRESS':
          const exercise = parameters.exercise;
          if (exercise) {
            // This would normally fetch from database
            await voiceRecognition.speak(
              `Your current personal record for ${exercise} would be displayed here. Keep pushing your limits!`,
              { emotion: 'encouraging' }
            );
          }
          break;

        case 'SHOW_STATS':
          setShowStats(true);
          await voiceRecognition.speak("Opening your workout statistics!", { emotion: 'neutral' });
          break;

        case 'SHOW_HISTORY':
          await voiceRecognition.speak("Your workout history would be displayed here!", { emotion: 'neutral' });
          break;

        case 'HELP':
          const helpMessage = `I'm your AI fitness coach! I can help you:
          • Log sets by saying "Log bench press 8 reps at 185 pounds"
          • Analyze form by saying "How's my squat form?"
          • Provide motivation when you say "I need motivation"
          • Give nutrition advice when you ask "What should I eat?"
          • Control your workout with "Start workout" or "Next exercise"
          
          Just speak naturally and I'll understand!`;
          
          await voiceRecognition.speak(helpMessage, { emotion: 'instructional' });
          break;

        case 'CLARIFY':
          const suggestions = nlpService.getSuggestions(parameters.originalTranscript || '');
          await voiceRecognition.speak(
            `I didn't quite understand that. ${suggestions[0] || "Try saying something like 'Log bench press 8 reps at 185 pounds'"}`,
            { emotion: 'apologetic' }
          );
          break;

        default:
          // Get AI response for unknown commands
          const response = await aiService.getCoachingResponse(
            `User said: "${parameters.originalTranscript || 'Unknown command'}". Provide a helpful response.`,
            context,
            'general-advice'
          );
          await voiceRecognition.speak(response.content, { emotion: 'neutral' });
      }
    } catch (error) {
      console.error(`Failed to execute command ${action}:`, error);
      await voiceRecognition.speak(
        "I had trouble with that command. Could you try again?",
        { emotion: 'apologetic' }
      );
    }
  };

  // Handle voice button interactions
  const handleVoiceButtonClick = async () => {
    if (voiceRecognition.isListening) {
      voiceRecognition.stopListening();
    } else {
      try {
        await voiceRecognition.startListening();
      } catch (error) {
        console.error('Failed to start listening:', error);
        await voiceRecognition.speak(
          "I'm having trouble with voice recognition. Please check your microphone permissions.",
          { emotion: 'apologetic' }
        );
      }
    }
  };

  // Welcome message on app load
  useEffect(() => {
    const welcomeUser = async () => {
      if (voiceRecognition.isSupported()) {
        setTimeout(async () => {
          const welcomeResponse = await aiService.getCoachingResponse(
            'Welcome message for new user opening the fitness app',
            workoutLogger.workoutContext,
            'motivation'
          );
          
          // Don't auto-speak welcome, just log it
          console.log('🤖 Welcome message ready:', welcomeResponse.content);
        }, 2000);
      }
    };

    welcomeUser();
  }, []);

  // Show provider status in development
  useEffect(() => {
    const logProviderStatus = () => {
      const status = aiService.getProviderStatus();
      console.log('🔌 AI Provider Status:', status);
    };

    logProviderStatus();
    const interval = setInterval(logProviderStatus, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [aiService]);

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">AI Fitness Coach</h1>
              <span className="ml-3 text-sm bg-green-500 text-white px-2 py-1 rounded-full">
                {conversationFlow.isInFlow() ? 'In Conversation' : 'Ready'}
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* AI Provider Status */}
              <div className="hidden sm:flex items-center space-x-2 text-sm text-blue-100">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>AI Active</span>
              </div>

              {/* Voice Button */}
              <VoiceButton
                isListening={voiceRecognition.isListening}
                isSupported={voiceRecognition.isSupported()}
                onClick={handleVoiceButtonClick}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white"
              />

              {/* AI Chat Toggle */}
              <button
                onClick={() => setShowAIChat(!showAIChat)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-all duration-200"
              >
                {showAIChat ? 'Hide Chat' : 'AI Chat'}
              </button>

              {/* Stats Toggle */}
              <button
                onClick={() => setShowStats(!showStats)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-all duration-200"
              >
                {showStats ? 'Hide Stats' : 'Stats'}
              </button>

              {/* Theme Toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg transition-all duration-200"
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Workout Dashboard */}
          <div className="lg:col-span-2">
            <WorkoutDashboard 
              className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl`}
              workoutLogger={workoutLogger}
              voiceRecognition={voiceRecognition}
              onVoiceCommand={handleVoiceCommand}
            />

            {/* Voice Interaction Status */}
            {conversationFlow.isInFlow() && (
              <div className={`mt-4 p-4 rounded-lg ${isDarkMode ? 'bg-blue-900 bg-opacity-50' : 'bg-blue-50'} border-l-4 border-blue-500`}>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      AI Coach is listening...
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-300">
                      Current conversation: {conversationFlow.getCurrentFlow()?.type.replace('_', ' ').toLowerCase()}
                    </p>
                  </div>
                  <button
                    onClick={() => conversationFlow.cancelCurrentFlow()}
                    className="ml-auto text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Chat Interface */}
            {showAIChat && (
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl overflow-hidden`}>
                <AIChatInterface
                  workoutContext={workoutLogger.workoutContext}
                  onClose={() => setShowAIChat(false)}
                  aiService={aiService}
                  conversationFlow={conversationFlow}
                />
              </div>
            )}

            {/* Workout Stats */}
            {showStats && (
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl overflow-hidden`}>
                <WorkoutStats
                  workoutContext={workoutLogger.workoutContext}
                  workoutHistory={workoutLogger.workoutHistory}
                  personalRecords={workoutLogger.personalRecords}
                  onClose={() => setShowStats(false)}
                />
              </div>
            )}

            {/* Voice Commands Help */}
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl p-6`}>
              <h3 className="text-lg font-semibold mb-4">Voice Commands</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start">
                  <span className="text-blue-500 mr-2">🎙️</span>
                  <div>
                    <p className="font-medium">Log Sets</p>
                    <p className="text-gray-500 dark:text-gray-400">
                      "Log bench press 8 reps at 185 pounds"
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">💪</span>
                  <div>
                    <p className="font-medium">Form Analysis</p>
                    <p className="text-gray-500 dark:text-gray-400">
                      "How's my squat form?"
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-yellow-500 mr-2">🔥</span>
                  <div>
                    <p className="font-medium">Motivation</p>
                    <p className="text-gray-500 dark:text-gray-400">
                      "I need motivation"
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-purple-500 mr-2">🥗</span>
                  <div>
                    <p className="font-medium">Nutrition</p>
                    <p className="text-gray-500 dark:text-gray-400">
                      "What should I eat after workout?"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`mt-16 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} py-8`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Powered by AI • Groq, OpenRouter & Google AI • Made with ❤️ for fitness
            </p>
            <div className="mt-2 flex justify-center space-x-4 text-xs text-gray-400">
              {aiService.getProviderStatus().map(provider => (
                <span key={provider.provider} className={provider.available ? 'text-green-500' : 'text-red-500'}>
                  {provider.provider}: {provider.usage}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
