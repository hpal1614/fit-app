import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Mic, Volume2, Bot, User, Loader2 } from 'lucide-react';
import { useAI } from '../hooks/useAI';
import { useVoice } from '../hooks/useVoice';
import type { WorkoutContext } from '../types/workout';
import type { AIResponse } from '../types/ai';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  isVoice?: boolean;
}

interface AIChatInterfaceProps {
  workoutContext?: WorkoutContext;
  onClose: () => void;
  className?: string;
}

export const AIChatInterface: React.FC<AIChatInterfaceProps> = ({
  workoutContext,
  onClose,
  className = ''
}) => {
  const { getMotivation, getNutritionAdvice, isLoading, error, isAvailable } = useAI();
  const { speak, isListening, startListening, stopListening } = useVoice({ workoutContext });

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial greeting
  useEffect(() => {
    const initialMessage: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: `Hey there! I'm your AI fitness coach. ${
        workoutContext?.activeWorkout 
          ? `I see you're working on ${workoutContext.currentExercise?.exercise.name}. How can I help?`
          : 'Ready to get started with your fitness journey? Ask me about workouts, nutrition, or form tips!'
      }`,
      timestamp: new Date()
    };
    setMessages([initialMessage]);
  }, [workoutContext]);

  // Handle sending messages
  const sendMessage = async (content: string, isVoice: boolean = false) => {
    if (!content.trim() || !isAvailable) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date(),
      isVoice
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    try {
      let response: AIResponse;

      // Determine the type of request based on content
      if (content.toLowerCase().includes('motivat') || content.toLowerCase().includes('pump up')) {
        const motivation = await getMotivation(workoutContext);
        response = {
          type: 'motivation',
          content: motivation.message,
          confidence: 1.0,
          timestamp: new Date(),
          data: motivation
        };
      } else if (content.toLowerCase().includes('nutrition') || content.toLowerCase().includes('diet') || content.toLowerCase().includes('eat')) {
        const nutrition = await getNutritionAdvice(content);
        response = {
          type: 'nutrition',
          content: nutrition.reasoning,
          confidence: 1.0,
          timestamp: new Date(),
          data: nutrition
        };
      } else {
        response = await askCoach(content, workoutContext);
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.content,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Read AI response aloud if it was a voice message
      if (isVoice) {
        await speak(response.content);
      }

    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "Sorry, I'm having trouble right now. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  // Handle voice input
  const handleVoiceToggle = async () => {
    if (isListening) {
      stopListening();
      setIsVoiceMode(false);
    } else {
      setIsVoiceMode(true);
      const started = await startListening();
      if (!started) {
        setIsVoiceMode(false);
      }
    }
  };

  // Process voice commands
  useEffect(() => {
    const handleVoiceCommand = async (_result: any) => {
      if (result.success && result.action === 'send_message') {
        await sendMessage(result.transcript || result.message, true);
        setIsVoiceMode(false);
      }
    };

    // This would be connected to voice command processing
    // Implementation depends on voice service integration
  }, []);

  // Quick action buttons
  const quickActions = [
    { label: "Motivate me!", action: () => sendMessage("Give me some motivation!") },
    { label: "Form check", action: () => sendMessage("How's my form looking?") },
    { label: "Nutrition tip", action: () => sendMessage("Give me a nutrition tip") },
    { label: "Rest time?", action: () => sendMessage("How long should I rest?") },
  ];

  if (!isAvailable) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">AI Coach</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        <div className="text-center py-8">
          <Bot size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">AI Coach is currently unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Bot size={24} className="text-fitness-blue" />
          <h3 className="text-xl font-bold text-gray-900">AI Coach</h3>
          {isLoading && <Loader2 size={16} className="animate-spin text-gray-500" />}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleVoiceToggle}
            className={`p-2 rounded-lg transition-colors ${
              isVoiceMode 
                ? 'bg-voice-listening text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Mic size={16} />
          </button>
          
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                max-w-xs lg:max-w-md px-4 py-2 rounded-lg
                ${message.type === 'user' 
                  ? 'bg-fitness-blue text-white' 
                  : 'bg-gray-100 text-gray-900'
                }
              `}
            >
              <div className="flex items-start space-x-2">
                {message.type === 'ai' && (
                  <Bot size={16} className="mt-1 flex-shrink-0 text-fitness-blue" />
                )}
                {message.type === 'user' && (
                  <User size={16} className="mt-1 flex-shrink-0 text-white" />
                )}
                
                <div className="flex-1">
                  <p className="text-sm">{message.content}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-xs ${
                      message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                    
                    {message.isVoice && (
                      <Volume2 size={12} className={
                        message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                      } />
                    )}
                    
                    {message.type === 'ai' && (
                      <button
                        onClick={() => speak(message.content)}
                        className="text-gray-500 hover:text-gray-700 ml-2"
                      >
                        <Volume2 size={12} />
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
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <Bot size={16} className="text-fitness-blue" />
                <Loader2 size={16} className="animate-spin text-gray-500" />
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 border-t border-gray-100">
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              disabled={isLoading}
              className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isVoiceMode ? "Listening..." : "Ask me anything about fitness..."}
            disabled={isLoading || isVoiceMode}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fitness-blue disabled:bg-gray-100"
          />
          
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading || isVoiceMode}
            className="bg-fitness-blue text-white p-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </form>

        {error && (
          <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
            {error.message}
          </div>
        )}

        {isVoiceMode && (
          <div className="mt-2 text-sm text-blue-600 bg-blue-50 p-2 rounded flex items-center space-x-2">
            <Mic size={16} className="animate-pulse" />
            <span>Listening for your question...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIChatInterface;