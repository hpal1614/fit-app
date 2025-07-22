import { useState, useEffect } from 'react';
import { WorkoutDashboard } from './components/WorkoutDashboard';
import { AIChatInterface } from './components/AIChatInterface';
import { VoiceButton } from './components/VoiceButton';
import { WorkoutStats } from './components/WorkoutStats';
import { useWorkout } from './hooks/useWorkout';
import { useVoice } from './hooks/useVoice';

// Import new intelligent services
import { AICoachService } from './services/aiService';
import { ConversationFlowManager } from './services/conversationFlow';
// Removed unused VoiceAction import

// Initialize intelligent services
const aiService = AICoachService.getInstance();
const conversationFlow = new ConversationFlowManager();

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Initialize hooks
  const workoutLogger = useWorkout({ enableTimers: true });
  const voiceRecognition = useVoice({ workoutContext: workoutLogger.workoutContext });

  // Voice commands are now handled by VoiceButton component internally

  // Voice button interactions are now handled by VoiceButton component internally

  // Welcome message on app load
  useEffect(() => {
    const welcomeUser = async () => {
      if (voiceRecognition.isSupported) {
        setTimeout(async () => {
          const welcomeResponse = await aiService.getCoachingResponse(
            'Welcome message for new user opening the fitness app',
            workoutLogger.workoutContext,
            'motivation'
          );
          await voiceRecognition.speak(welcomeResponse.content, { emotion: 'encouraging' });
        }, 2000);
      }
    };

    welcomeUser();
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-900'
    }`}>
      {/* Header */}
      <header className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white/80 border-gray-200'} backdrop-blur-md border-b sticky top-0 z-40`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">💪</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AI Fitness Coach
                </h1>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Smart, Voice-Powered Training
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>

              {/* Voice Button */}
              <VoiceButton
                workoutContext={workoutLogger.workoutContext}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white"
              />

              {/* AI Chat Toggle */}
              <button
                onClick={() => setShowAIChat(!showAIChat)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  showAIChat 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : isDarkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
                } border border-gray-200 dark:border-gray-600`}
              >
                🤖 AI Chat
              </button>

              {/* Stats Toggle */}
              <button
                onClick={() => setShowStats(!showStats)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  showStats 
                    ? 'bg-green-600 text-white shadow-lg' 
                    : isDarkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
                } border border-gray-200 dark:border-gray-600`}
              >
                📊 Stats
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="lg:grid lg:grid-cols-4 lg:gap-6 space-y-6 lg:space-y-0">
          {/* Primary Workout Interface */}
          <div className="lg:col-span-2">
            <WorkoutDashboard 
              className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl`}
            />

            {/* Voice Interaction Status */}
            {conversationFlow.isInFlow() && (
              <div className={`mt-4 p-4 rounded-lg ${isDarkMode ? 'bg-blue-900 bg-opacity-50' : 'bg-blue-50'} border-l-4 border-blue-500`}>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-blue-200' : 'text-blue-700'}`}>
                    Listening for follow-up...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Chat Interface */}
            {showAIChat && (
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl overflow-hidden`}>
                <AIChatInterface
                  workoutContext={workoutLogger.workoutContext}
                  onClose={() => setShowAIChat(false)}
                />
              </div>
            )}

            {/* Workout Stats */}
            {showStats && (
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl overflow-hidden`}>
                <WorkoutStats
                  workout={workoutLogger.workoutContext.activeWorkout || null}
                  onClose={() => setShowStats(false)}
                />
              </div>
            )}

            {/* Quick Actions */}
            {!showAIChat && !showStats && (
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl p-6`}>
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowAIChat(true)}
                    className="p-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors text-left"
                  >
                    <div className="text-2xl mb-2">🤖</div>
                    <div className="font-medium">Ask AI Coach</div>
                    <div className="text-sm opacity-90">Get personalized advice</div>
                  </button>
                  
                  <button
                    onClick={() => setShowStats(true)}
                    className="p-4 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors text-left"
                  >
                    <div className="text-2xl mb-2">📊</div>
                    <div className="font-medium">View Stats</div>
                    <div className="text-sm opacity-90">Track your progress</div>
                  </button>
                </div>

                {/* Voice Commands Help */}
                <div className={`mt-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h4 className="font-medium mb-2">💬 Try Voice Commands:</h4>
                  <div className="text-sm space-y-1 opacity-80">
                    <div>"Start my push workout"</div>
                    <div>"Log 8 reps at 185 pounds"</div>
                    <div>"How's my squat form?"</div>
                    <div>"I need motivation"</div>
                    <div>"Start rest timer"</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`mt-12 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white/80 border-gray-200'} backdrop-blur-md border-t`}>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              © 2024 AI Fitness Coach - Powered by intelligent voice recognition
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Voice Status: <span className={voiceRecognition.isSupported ? 'text-green-500' : 'text-red-500'}>
                  {voiceRecognition.isSupported ? 'Supported' : 'Not Available'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
