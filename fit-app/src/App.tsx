import React, { useState, useEffect } from 'react';
import {
  Home,
  MessageCircle,
  User,
  Settings,
  Bell,
  Search,
  Mic,
  Apple,
  Dumbbell
} from 'lucide-react';
import { WorkoutLoggerTab } from './components/active/WorkoutLoggerTab';
import { AIChatInterface } from './components/active/AIChatInterface';
import { NutritionTab } from './components/active/NutritionTab';
import { VoiceAssistant } from './components/active/VoiceAssistant';
import { MCPProvider } from './providers/MCPProvider';
import { useWorkout } from './hooks/useWorkout';
import { useVoice } from './hooks/useVoice';

// Define only 5 tabs
type TabType = 'home' | 'workouts' | 'nutrition' | 'coach' | 'profile';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  
  const { workout } = useWorkout();
  const { isSupported: voiceSupported } = useVoice();

  return (
    <MCPProvider>
      <div className="h-screen w-screen bg-black text-white relative overflow-hidden flex flex-col">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-6">
          <h1 className="text-2xl font-bold">FIT APP</h1>
          <div className="flex items-center space-x-4">
            <button className="p-2 bg-gray-800 rounded-full">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-2 bg-gray-800 rounded-full">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex-1 overflow-y-auto px-4 pb-24">
          {/* Home Tab */}
          {activeTab === 'home' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold mb-4">Welcome Back!</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveTab('workouts')}
                  className="p-6 bg-gray-800 rounded-2xl"
                >
                  <Dumbbell className="w-10 h-10 mb-3 text-lime-400" />
                  <h3 className="text-lg font-semibold">Start Workout</h3>
                </button>

                <button
                  onClick={() => setActiveTab('coach')}
                  className="p-6 bg-gray-800 rounded-2xl"
                >
                  <MessageCircle className="w-10 h-10 mb-3 text-blue-400" />
                  <h3 className="text-lg font-semibold">AI Coach</h3>
                </button>

                <button
                  onClick={() => setActiveTab('nutrition')}
                  className="p-6 bg-gray-800 rounded-2xl"
                >
                  <Apple className="w-10 h-10 mb-3 text-orange-400" />
                  <h3 className="text-lg font-semibold">Nutrition</h3>
                </button>

                <button
                  onClick={() => setActiveTab('profile')}
                  className="p-6 bg-gray-800 rounded-2xl"
                >
                  <User className="w-10 h-10 mb-3 text-purple-400" />
                  <h3 className="text-lg font-semibold">Profile</h3>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'workouts' && (
            <div>
              <h2 className="text-3xl font-bold mb-6">Workout Logger</h2>
              <WorkoutLoggerTab workout={workout} />
            </div>
          )}
          
          {activeTab === 'nutrition' && <NutritionTab />}
          
          {activeTab === 'coach' && (
            <AIChatInterface 
              workoutContext={workout} 
              onClose={() => setActiveTab('home')}
              className="h-[calc(100vh-12rem)]"
            />
          )}
          
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold mb-6">Your Profile</h2>
              <div className="space-y-4">
                <div className="p-4 bg-gray-800 rounded-xl">
                  <span>Voice Support: </span>
                  <span className={voiceSupported ? "text-green-400" : "text-red-400"}>
                    {voiceSupported ? "Enabled" : "Not Supported"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Voice Assistant Button */}
        <button
          onClick={() => setShowVoiceAssistant(true)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-lime-400 rounded-full shadow-lg flex items-center justify-center z-50"
        >
          <Mic className="w-6 h-6 text-black" />
        </button>

        {/* Bottom Navigation - 5 tabs */}
        <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-50">
          <div className="flex items-center justify-around py-2">
            {[
              { icon: Home, label: 'Home', key: 'home' },
              { icon: Dumbbell, label: 'Workout', key: 'workouts' },
              { icon: Apple, label: 'Nutrition', key: 'nutrition' },
              { icon: MessageCircle, label: 'Coach', key: 'coach' },
              { icon: User, label: 'Profile', key: 'profile' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabType)}
                className={`flex flex-col items-center space-y-1 px-2 py-2 ${
                  activeTab === tab.key 
                    ? 'text-lime-400' 
                    : 'text-gray-400'
                }`}
              >
                <tab.icon className="w-6 h-6" />
                <span className="text-xs">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Voice Assistant Modal */}
        {showVoiceAssistant && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full">
              <VoiceAssistant onClose={() => setShowVoiceAssistant(false)} />
            </div>
          </div>
        )}
      </div>
    </MCPProvider>
  );
}

export default App;