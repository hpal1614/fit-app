import { useState, useEffect } from 'react';
import { WorkoutDashboard } from './components/WorkoutDashboard';
import { AIChatInterface } from './components/AIChatInterface';
import { VoiceButton } from './components/VoiceButton';
import { WorkoutStats } from './components/WorkoutStats';
import { BottomNavigation } from './components/BottomNavigation';
import { WorkoutsTab } from './components/WorkoutsTab';
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
  const [activeTab, setActiveTab] = useState('logger');

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
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header - simplified for mobile */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">AI Fitness Coach</h1>
              <span className="ml-3 text-sm bg-green-500 text-white px-2 py-1 rounded-full">
                {conversationFlow.isInFlow() ? 'In Conversation' : 'Ready'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Voice Button */}
              <VoiceButton
                workoutContext={workoutLogger.workoutContext}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white"
              />

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

      {/* Tab Content */}
      <main className="pb-20"> {/* Space for bottom navigation */}
        {activeTab === 'logger' && (
          <WorkoutDashboard 
            className={`${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}
          />
        )}
        
        {activeTab === 'workouts' && (
          <WorkoutsTab 
            workoutContext={workoutLogger.workoutContext}
            aiService={aiService}
          />
        )}
        
        {activeTab === 'nutrition' && (
          <div className="p-4 text-center">
            <h2 className="text-xl font-semibold mb-4">Nutrition Coming Soon</h2>
            <p className="text-gray-500 dark:text-gray-400">
              Camera food logging and AI nutrition analysis
            </p>
          </div>
        )}
        
        {activeTab === 'coach' && (
          <div className="h-screen">
            <AIChatInterface
              workoutContext={workoutLogger.workoutContext}
              onClose={() => setActiveTab('logger')}
              className="h-full"
            />
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        workoutActive={workoutLogger.isWorkoutActive}
      />
    </div>
  );
}

export default App;
