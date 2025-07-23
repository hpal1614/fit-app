import { useState } from 'react';
import { WorkoutDashboard } from './components/WorkoutDashboard';
import { AIChatInterface } from './components/AIChatInterface';
import { VoiceButton } from './components/VoiceButton';
import { MessageCircle, Home } from 'lucide-react';
import { useAI } from './hooks/useAI';
import { speak } from './services/voiceService';

function App() {
  const [activeTab, setActiveTab] = useState('workout');
  const { askCoach } = useAI();

  const handleVoiceCommand = async (transcript: string) => {
    const response = await askCoach(transcript);
    if (response && (response as any).content) {
      await speak((response as any).content);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Header */}
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-xl font-bold">AI Fitness Coach</h1>
        <p className="text-sm opacity-90">
          {/* isLoading ? 'AI thinking...' : 'Ready to help' */}
          Ready to help
        </p>
      </header>

      {/* Content Area */}
      <main className="pb-20 p-4">
        {activeTab === 'workout' && (
          <WorkoutDashboard />
        )}

        {activeTab === 'chat' && (
          <AIChatInterface 
            workoutContext={{
              userPreferences: {
                defaultWeightUnit: 'kg',
                defaultRestTime: 60,
                autoRestTimer: true,
                showPersonalRecords: true,
                enableVoiceCommands: true,
                warmupRequired: false,
                trackRPE: false,
                roundingPreference: 'exact',
                plateCalculation: false,
                notifications: {
                  restComplete: true,
                  personalRecord: true,
                  workoutReminders: true
                }
              }
            }}
            onClose={() => setActiveTab('workout')}
          />
        )}
      </main>

      {/* Emergency Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('workout')}
            className={`flex-1 py-3 px-4 text-center ${
              activeTab === 'workout' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
            }`}
          >
            <Home size={20} className="mx-auto mb-1" />
            <span className="text-xs">Home</span>
          </button>
          
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-3 px-4 text-center ${
              activeTab === 'chat' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
            }`}
          >
            <MessageCircle size={20} className="mx-auto mb-1" />
            <span className="text-xs">AI Chat</span>
          </button>

          <VoiceButton 
            onCommandProcessed={(transcript) => handleVoiceCommand(transcript)}
            workoutContext={{
              userPreferences: {
                defaultWeightUnit: 'kg',
                defaultRestTime: 60,
                autoRestTimer: true,
                showPersonalRecords: true,
                enableVoiceCommands: true,
                warmupRequired: false,
                trackRPE: false,
                roundingPreference: 'exact',
                plateCalculation: false,
                notifications: {
                  restComplete: true,
                  personalRecord: true,
                  workoutReminders: true
                }
              }
            }}
          />
        </div>
      </nav>
    </div>
  );
}

export default App;
