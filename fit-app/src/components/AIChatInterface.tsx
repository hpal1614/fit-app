import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, MicOff, Volume2, Bot, User, Loader } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface AIChatInterfaceProps {
  aiService?: any;
  voiceService?: any;
  workoutContext?: any;
}

export const AIChatInterface: React.FC<AIChatInterfaceProps> = ({
  aiService,
  voiceService,
  workoutContext
}) => {
  // Initialize messages with welcome message - using functional update to prevent re-initialization
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 'welcome-' + Date.now(),
      content: "Hi! I'm your AI fitness coach. I can help you with workouts, nutrition, form tips, and motivation. What would you like to know?",
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

  // ✅ FIX: Use useCallback to prevent function recreation and state issues
  const addMessage = useCallback((content: string, isUser: boolean) => {
    const newMessage: Message = {
      id: (isUser ? 'user-' : 'ai-') + Date.now() + Math.random(),
      content,
      isUser,
      timestamp: new Date()
    };
    
    // ✅ FIX: Use functional update to ensure we get the latest state
    setMessages(prevMessages => {
      console.log('Adding message:', newMessage);
      const newMessages = [...prevMessages, newMessage];
      console.log('Total messages:', newMessages.length);
      return newMessages;
    });
  }, []);

  // ✅ FIX: Separate function to speak a message (manual trigger)
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

    console.log('Sending message:', text);

    // Clear any previous errors
    setError(null);
    
    // Add user message
    addMessage(text, true);
    setInputText('');
    setIsLoading(true);

    try {
      let response = '';
      
      if (aiService) {
        // Try to get AI response with timeout
        const aiResponse = await Promise.race([
          aiService.getCoachingResponse(text, workoutContext, 'general'),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('AI response timeout')), 10000)
          )
        ]);
        
        response = aiResponse?.content || aiResponse?.response || aiResponse?.message || 'I received your message but had trouble generating a response.';
      } else {
        // Fallback responses when AI service isn't available
        response = getFallbackResponse(text);
      }

      console.log('AI response:', response);

      // Add AI response
      addMessage(response, false);

      // ✅ FIX: Don't automatically speak - let user choose

    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMessage);
      
      // Add fallback response
      const fallbackResponse = "I'm having trouble right now, but I'm still here to help! Try asking me something else.";
      addMessage(fallbackResponse, false);
    } finally {
      setIsLoading(false);
    }
  };

  const getFallbackResponse = (text: string): string => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('workout') || lowerText.includes('exercise')) {
      return "For workouts, I recommend starting with compound movements like squats, deadlifts, and push-ups. These target multiple muscle groups efficiently!";
    }
    
    if (lowerText.includes('nutrition') || lowerText.includes('diet')) {
      return "Good nutrition is key! Focus on whole foods: lean proteins, complex carbs, healthy fats, and plenty of vegetables. Stay hydrated too!";
    }
    
    if (lowerText.includes('motivation') || lowerText.includes('tired')) {
      return "Remember why you started! Every workout counts, even if it's just 10 minutes. Progress, not perfection!";
    }
    
    if (lowerText.includes('form') || lowerText.includes('technique')) {
      return "Great form is crucial! Start light, focus on controlled movements, and gradually increase intensity. Quality over quantity always!";
    }
    
    return "That's a great question! While I'm having some technical difficulties, I encourage you to keep moving and stay consistent with your fitness goals!";
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
    "Create a workout plan",
    "Nutrition tips", 
    "Motivation boost",
    "Form check tips"
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex items-center space-x-3">
          <Bot className="w-8 h-8" />
          <div>
            <h2 className="text-lg font-semibold">AI Fitness Coach</h2>
            <p className="text-sm opacity-90">Your personal training assistant</p>
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
                    <p className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
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
            placeholder={isVoiceMode ? "Listening..." : "Ask me anything about fitness..."}
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
