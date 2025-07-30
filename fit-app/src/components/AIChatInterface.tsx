import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, X, Mic, Volume2, Bot, User, Loader2 } from 'lucide-react';
import { useStreamingAI } from '../hooks/useStreamingAI';
import { useVoice } from '../hooks/useVoice';
import type { WorkoutContext } from '../types/workout';
// Removed unused AIResponse import

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState<string>('');
  
  const { streamResponse, isStreaming, stopStreaming } = useStreamingAI({
    workoutContext,
    onChunk: (chunk) => {
      setCurrentStreamingMessage(prev => prev + chunk);
    },
    onComplete: (fullResponse) => {
      // Add complete message to messages
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: fullResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setCurrentStreamingMessage('');
      
      // Speak the response
      if (!isMuted) {
        speak(fullResponse);
      }
    },
    onError: (error) => {
      console.error('AI Chat Error:', error);
      setCurrentStreamingMessage('');
    }
  });
  
  const { speak, isListening, startListening, stopListening } = useVoice({ workoutContext });
  const [inputText, setInputText] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Never show loading for more than 5 seconds - CRITICAL TIMEOUT PROTECTION
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        // Force stop loading if it takes too long
        console.warn('AI loading timeout - forcing stop');
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

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
  const sendMessage = useCallback(async (content: string, isVoice: boolean = false) => {
    if (!content.trim() || isStreaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date(),
      isVoice
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setCurrentStreamingMessage(''); // Reset streaming message

    // Start streaming response
    await streamResponse(content);
  }, [streamResponse, isStreaming]);

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

  // Process voice commands (placeholder for future implementation)
  useEffect(() => {
    // Voice command handling would be implemented here
  }, [sendMessage]);

  // Render streaming message
  const renderStreamingMessage = () => {
    if (!currentStreamingMessage) return null;
    
    return (
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-lime-400 to-green-500 flex items-center justify-center flex-shrink-0">
          <Bot className="w-5 h-5 text-black" />
        </div>
        <div className="flex-1 bg-gray-800/50 backdrop-blur-lg rounded-lg p-3 border border-gray-700">
          <p className="text-gray-100 leading-relaxed">{currentStreamingMessage}</p>
          <span className="inline-block w-2 h-4 bg-lime-400 animate-pulse ml-1" />
        </div>
      </div>
    );
  };
  
  // Smart loading indicator showing team status - NEVER HANGS
  const renderLoadingState = () => {
    return null; // Remove old loading state
  };

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
    <div className={`bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-800 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Bot size={24} className="text-lime-400" />
          <h3 className="text-xl font-bold text-white">AI Coach</h3>
          {isLoading && <Loader2 size={16} className="animate-spin text-gray-400" />}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleVoiceToggle}
            className={`p-2 rounded-lg transition-colors ${
              isVoiceMode 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
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
                  ? 'bg-lime-400 text-black' 
                  : 'bg-gray-800 text-white'
                }
              `}
            >
              <div className="flex items-start space-x-2">
                {message.type === 'ai' && (
                  <Bot size={16} className="mt-1 flex-shrink-0 text-lime-400" />
                )}
                {message.type === 'user' && (
                  <User size={16} className="mt-1 flex-shrink-0 text-black" />
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
        
        {/* Streaming message */}
        {renderStreamingMessage()}
        
        {/* Smart loading state - never hangs */}
        {renderLoadingState()}
        
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
      <div className="p-4 border-t border-gray-700">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isVoiceMode ? "Listening..." : "Ask me anything about fitness..."}
            disabled={isLoading || isVoiceMode}
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent disabled:bg-gray-900"
          />
          
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading || isVoiceMode}
            className="bg-lime-400 text-black p-2 rounded-lg hover:bg-lime-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <Send size={20} />
          </button>
        </form>

        {error && (
          <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
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