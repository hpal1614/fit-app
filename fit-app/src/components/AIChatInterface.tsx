import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, MicOff, Volume2, Bot, User, Loader } from 'lucide-react';
import { unifiedAIService } from '../services/unifiedAIService';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  provider?: string;
  processingTime?: number;
}

interface AIChatInterfaceProps {
  aiService?: any;
  voiceService?: any;
  workoutContext?: any;
}

export const AIChatInterface: React.FC<AIChatInterfaceProps> = ({
  voiceService,
  workoutContext
}) => {
  // Initialize messages with welcome message
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 'welcome-' + Date.now(),
      content: "Hi! I'm your AI fitness coach with expertise in strength training, nutrition, and motivation. I'm here to help you reach your goals safely and effectively. What would you like to know?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Add message with proper state management
  const addMessage = useCallback((content: string, isUser: boolean, metadata?: any) => {
    const newMessage: Message = {
      id: (isUser ? 'user-' : 'ai-') + Date.now() + Math.random(),
      content,
      isUser,
      timestamp: new Date(),
      ...metadata
    };
    
    setMessages(prevMessages => {
      console.log('Adding message:', newMessage.content.substring(0, 50) + '...');
      const newMessages = [...prevMessages, newMessage];
      console.log('Total messages:', newMessages.length);
      return newMessages;
    });
  }, []);

  // Speak message (manual trigger)
  const speakMessage = async (text: string) => {
    if (!voiceService || !voiceService.speak) {
      setError('Voice service not available');
      return;
    }

    try {
      await voiceService.speak(text);
    } catch (err) {
      console.error('Voice synthesis error:', err);
      setError('Voice synthesis failed');
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    console.log('🚀 Sending message to AI:', text);

    // Clear any previous errors
    setError(null);
    
    // Add user message
    addMessage(text, true);
    setInputText('');
    setIsLoading(true);

    try {
      // Determine request type from message content
      const lowerText = text.toLowerCase();
      let requestType = 'general';
      
      if (lowerText.includes('motivat') || lowerText.includes('pump') || lowerText.includes('tired')) {
        requestType = 'motivation';
      } else if (lowerText.includes('nutrition') || lowerText.includes('diet') || lowerText.includes('eat')) {
        requestType = 'nutrition';
      } else if (lowerText.includes('form') || lowerText.includes('technique')) {
        requestType = 'form-analysis';
      } else if (lowerText.includes('workout') || lowerText.includes('routine')) {
        requestType = 'workout-planning';
      }

      console.log('🎯 Request type:', requestType);

      // Call the unified AI service
      const aiResponse = await unifiedAIService.getCoachingResponse(
        text, 
        workoutContext || {}, 
        requestType as any
      );

      console.log('✅ AI Response received:', {
        provider: aiResponse.provider,
        confidence: aiResponse.confidence,
        content: aiResponse.content.substring(0, 100) + '...'
      });

      // Add AI response
      addMessage(aiResponse.content, false, {
        provider: aiResponse.provider,
        processingTime: aiResponse.metadata?.processingTime
      });

    } catch (err) {
      console.error('❌ Chat error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMessage);
      
      // Add fallback response
      const fallbackResponse = "I'm having some technical difficulties, but I'm still here to help! Try asking me about workouts, nutrition, or motivation.";
      addMessage(fallbackResponse, false, { provider: 'fallback' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceToggle = async () => {
    if (!voiceService) {
      setError('Voice service not available');
      return;
    }

    try {
      if (isVoiceMode) {
        if (voiceService.stopListening) {
          voiceService.stopListening();
        }
        setIsVoiceMode(false);
      } else {
        if (voiceService.startListening) {
          await voiceService.startListening();
          setIsVoiceMode(true);
        }
      }
    } catch (err) {
      console.error('Voice error:', err);
      setError('Voice not available in this browser');
      setIsVoiceMode(false);
    }
  };

  const quickReplies = [
    "I need motivation to keep going",
    "What should I eat after my workout?", 
    "Help me with my exercise form",
    "Create a workout plan for me"
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex items-center space-x-3">
          <Bot className="w-8 h-8" />
          <div>
            <h2 className="text-lg font-semibold">AI Fitness Coach</h2>
            <p className="text-sm opacity-90">Expert guidance for your fitness journey</p>
          </div>
          <div className="ml-auto text-xs bg-black/20 px-2 py-1 rounded">
            {messages.length} messages
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              message.isUser 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
            }`}>
              <div className="flex items-start space-x-2">
                {!message.isUser && (
                  <Bot className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                )}
                {message.isUser && (
                  <User className="w-4 h-4 mt-0.5 flex-shrink-0 text-white" />
                )}
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <div className="flex items-center justify-between mt-1">
                    <div className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                      {message.provider && (
                        <span className="ml-2 px-1 bg-black/10 rounded text-xs">
                          {message.provider}
                        </span>
                      )}
                    </div>
                    {!message.isUser && (
                      <button
                        onClick={() => speakMessage(message.content)}
                        className="ml-2 text-xs opacity-70 hover:opacity-100 transition-opacity"
                        title="Read aloud"
                      >
                        <Volume2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-blue-600" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      {!isLoading && messages.length <= 2 && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-2">
            {quickReplies.map((reply) => (
              <button
                key={reply}
                onClick={() => handleSendMessage(reply)}
                className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputText);
          }}
          className="flex space-x-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isVoiceMode ? "Listening..." : "Ask me about fitness, nutrition, or motivation..."}
            disabled={isLoading || isVoiceMode}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-700"
          />
          
          <button
            type="button"
            onClick={handleVoiceToggle}
            className={`p-2 rounded-lg transition-colors ${
              isVoiceMode 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
            title={isVoiceMode ? "Stop listening" : "Start voice input"}
          >
            {isVoiceMode ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading || isVoiceMode}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </form>

        {error && (
          <div className="mt-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
            {error}
          </div>
        )}

        {isVoiceMode && (
          <div className="mt-2 text-sm text-blue-600 bg-blue-50 dark:bg-blue-900/20 p-2 rounded flex items-center space-x-2">
            <Mic size={16} className="animate-pulse" />
            <span>Listening for your question...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIChatInterface;
