import { useState } from 'react';
import { AIChatInterface } from './components/AIChatInterface';
import { useAI } from './hooks/useAI';
import { useVoice } from './hooks/useVoiceEmergency';
import { Mic, MessageCircle, Home } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const { askCoach, isLoading, error } = useAI();
  const { speak, startListening, isListening, isSupported } = useVoice();

  const handleVoiceTest = async () => {
    const response = await askCoach("Hello, test the AI");
    if (response) {
      await speak(response.content);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Header */}
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-xl font-bold">AI Fitness Coach</h1>
        <p className="text-sm opacity-90">
          {isLoading ? 'AI thinking...' : 'Ready to help'}
        </p>
      </header>

      {/* Content Area */}
      <main className="pb-20 p-4">
        {activeTab === 'home' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Emergency Test Mode</h2>
            
            {/* AI Test */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-bold mb-2">AI Test</h3>
              <button
                onClick={() => askCoach("Hello AI")}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white p-3 rounded-lg disabled:opacity-50"
              >
                {isLoading ? 'Testing AI...' : 'Test AI Response'}
              </button>
              {error && <p className="text-red-500 mt-2">Error: {error.message}</p>}
            </div>

            {/* Voice Test */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-bold mb-2">Voice Test</h3>
              <div className="space-y-2">
                <button
                  onClick={handleVoiceTest}
                  disabled={!isSupported()}
                  className="w-full bg-green-600 text-white p-3 rounded-lg disabled:opacity-50"
                >
                  Test AI + Voice
                </button>
                <button
                  onClick={startListening}
                  disabled={!isSupported() || isListening}
                  className="w-full bg-purple-600 text-white p-3 rounded-lg disabled:opacity-50"
                >
                  {isListening ? 'Listening...' : 'Test Voice Input'}
                </button>
              </div>
              {!isSupported() && <p className="text-red-500 mt-2">Voice not supported</p>}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <AIChatInterface
            onClose={() => setActiveTab('home')}
          />
        )}
      </main>

      {/* Emergency Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex-1 py-3 px-4 text-center ${
              activeTab === 'home' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
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

          <button
            onClick={handleVoiceTest}
            className="flex-1 py-3 px-4 text-center text-gray-600"
          >
            <Mic size={20} className="mx-auto mb-1" />
            <span className="text-xs">Voice</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default App;
