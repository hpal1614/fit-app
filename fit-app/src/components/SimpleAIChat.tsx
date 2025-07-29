import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Brain, Mic, Volume2 } from 'lucide-react';
import { aiService } from '../services/aiService';

interface SimpleAIChatProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export const SimpleAIChat: React.FC<SimpleAIChatProps> = ({ isOpen, onClose }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [apiKeys, setApiKeys] = useState({
    openRouter: '',
    groq: '',
    elevenLabs: ''
  });
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'openrouter' | 'groq'>('openrouter');
  const [selectedModel, setSelectedModel] = useState('claude-3-haiku');
  const [useVoice, setUseVoice] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load API keys from localStorage
    const savedKeys = localStorage.getItem('aiApiKeys');
    if (savedKeys) {
      const keys = JSON.parse(savedKeys);
      setApiKeys(keys);
      aiService.setApiKeys(keys);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const saveApiKeys = () => {
    localStorage.setItem('aiApiKeys', JSON.stringify(apiKeys));
    aiService.setApiKeys(apiKeys);
    setShowApiSettings(false);
  };

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;
    
    // Check if API keys are configured
    if (!apiKeys.openRouter && !apiKeys.groq) {
      setShowApiSettings(true);
      alert('Please configure at least one AI API key to use the chat.');
      return;
    }
    
    // Add user message
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsLoading(true);
    setStreamingContent('');
    
    try {
      // Add streaming message placeholder
      setMessages(prev => [...prev, { role: 'assistant', content: '', isStreaming: true }]);
      
      // Use the real AI service
      const response = await aiService.fitnessChat(
        userMsg,
        {
          goals: ['muscle building', 'strength training'], // You can make this dynamic
          userProfile: {
            fitnessLevel: 'intermediate'
          }
        },
        {
          provider: selectedProvider,
          model: selectedModel,
          stream: true,
          useVoice: useVoice && !!apiKeys.elevenLabs,
          streamCallback: {
            onToken: (token) => {
              setStreamingContent(prev => prev + token);
            },
            onComplete: (fullResponse) => {
              // Replace streaming message with final content
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: 'assistant',
                  content: fullResponse,
                  isStreaming: false
                };
                return newMessages;
              });
              setStreamingContent('');
              setIsLoading(false);
            },
            onError: (error) => {
              console.error('AI Error:', error);
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: 'assistant',
                  content: 'Sorry, I encountered an error. Please check your API settings or try again.',
                  isStreaming: false
                };
                return newMessages;
              });
              setStreamingContent('');
              setIsLoading(false);
            }
          }
        }
      );
    } catch (error: any) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Error: ${error.message}. Please check your API keys in settings.` 
      }]);
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-semibold text-white">AI Fitness Coach</h3>
              <div className="flex gap-1">
                <button 
                  onClick={() => setShowApiSettings(!showApiSettings)}
                  className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                  title="API Settings"
                >
                  ⚙️
                </button>
                <button 
                  onClick={() => setUseVoice(!useVoice)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    useVoice ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                  title="Toggle Voice Output"
                  disabled={!apiKeys.elevenLabs}
                >
                  <Volume2 className="w-3 h-3" />
                </button>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          
          {/* API Settings Panel */}
          {showApiSettings && (
            <div className="p-4 bg-gray-800/50 border-b border-gray-700">
              <h4 className="text-sm font-semibold mb-3 text-gray-300">API Configuration</h4>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-400">OpenRouter API Key</label>
                  <input 
                    type="password"
                    value={apiKeys.openRouter}
                    onChange={(e) => setApiKeys({...apiKeys, openRouter: e.target.value})}
                    placeholder="sk-or-..."
                    className="w-full bg-gray-900 text-white text-sm px-3 py-1 rounded border border-gray-700 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Groq API Key (Faster)</label>
                  <input 
                    type="password"
                    value={apiKeys.groq}
                    onChange={(e) => setApiKeys({...apiKeys, groq: e.target.value})}
                    placeholder="gsk_..."
                    className="w-full bg-gray-900 text-white text-sm px-3 py-1 rounded border border-gray-700 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">ElevenLabs API Key (Voice)</label>
                  <input 
                    type="password"
                    value={apiKeys.elevenLabs}
                    onChange={(e) => setApiKeys({...apiKeys, elevenLabs: e.target.value})}
                    placeholder="xi-..."
                    className="w-full bg-gray-900 text-white text-sm px-3 py-1 rounded border border-gray-700 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <select 
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value as 'openrouter' | 'groq')}
                    className="flex-1 bg-gray-900 text-white text-sm px-3 py-1 rounded border border-gray-700 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="openrouter">OpenRouter (Better Quality)</option>
                    <option value="groq">Groq (Faster)</option>
                  </select>
                  {selectedProvider === 'openrouter' && (
                    <select 
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="flex-1 bg-gray-900 text-white text-sm px-3 py-1 rounded border border-gray-700 focus:border-purple-500 focus:outline-none"
                    >
                      <option value="claude-3-haiku">Claude 3 Haiku (Fast)</option>
                      <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                      <option value="claude-3-opus">Claude 3 Opus (Best)</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      <option value="gpt-4">GPT-4</option>
                    </select>
                  )}
                </div>
                <button 
                  onClick={saveApiKeys}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm py-1 rounded transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </div>
          )}
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Hi! I'm your AI fitness coach powered by real AI.</p>
                <p className="text-sm mt-2">Ask me anything about workouts, nutrition, or fitness!</p>
                {(!apiKeys.openRouter && !apiKeys.groq) && (
                  <p className="text-xs mt-4 text-yellow-500">
                    ⚠️ Please configure API keys in settings (⚙️) to start chatting
                  </p>
                )}
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-3 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-800 text-gray-100'
                  }`}>
                    {msg.isStreaming ? (
                      <div className="flex items-center gap-2">
                        <span>{streamingContent || 'Thinking...'}</span>
                        <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse"></span>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-4 border-t border-gray-800">
            <div className="flex gap-2">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
                placeholder="Ask about fitness, workouts, nutrition..."
                className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isLoading}
              />
              <button 
                onClick={handleSubmit}
                disabled={isLoading || !input.trim()}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isLoading || !input.trim()
                    ? 'bg-gray-700 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};