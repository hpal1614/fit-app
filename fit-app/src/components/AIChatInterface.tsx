import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, X, Mic, Volume2, Bot, User, Loader2 } from 'lucide-react';
import { useStreamingAI } from '../hooks/useStreamingAI';
import { useVoice } from '../hooks/useVoice';
import type { WorkoutContext } from '../types/workout';
// Removed unused AIResponse import
import { ConversationFlowService } from '../services/conversationFlowService';
import { QuickReply } from '../types/conversationTypes';
import QuickReplyButtons from './QuickReplyButtons';

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
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const flowRef = useRef<ConversationFlowService | null>(null);
  
  const { streamResponse, isStreaming, stopStreaming } = useStreamingAI({
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
      try {
        const lastUser = [...messages].reverse().find(m => m.type === 'user');
        const scenario = flowRef.current?.detectScenario(lastUser?.content || '', undefined) || 'standard_beginner';
        const qr = flowRef.current?.getQuickReplies(fullResponse, scenario) || [];
        setQuickReplies(qr);
      } catch (_) {
        setQuickReplies([]);
      }
      
      // Speak the response
      if (!isMuted) {
        speak(fullResponse);
      }
    },
    onError: (error) => {
      setError(error.message);
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
    if (isStreaming) {
      const timeout = setTimeout(() => {
        // Force stop loading if it takes too long
        console.warn('AI loading timeout - forcing stop');
        stopStreaming();
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [isStreaming, stopStreaming]);

  // Initial greeting
  useEffect(() => {
    if (!flowRef.current) {
      flowRef.current = new ConversationFlowService();
    }
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
    setError(null); // Clear any previous errors

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

  // Check if AI is available (always true for simulated responses)
  const isAvailable = true;

  return (
    <div className={`bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-800 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Bot size={24} className="text-lime-400" />
          <h3 className="text-xl font-bold text-white">AI Coach</h3>
          {isStreaming && <Loader2 size={16} className="animate-spin text-gray-400" />}
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
        
        {renderStreamingMessage()}
        {renderLoadingState()}
        {quickReplies.length > 0 && (
          <QuickReplyButtons
            replies={quickReplies}
            onSelect={(reply) => sendMessage(reply.text)}
          />
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length > 1 && (
        <div className="px-4 py-2 border-t border-gray-700">
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                disabled={isStreaming}
                className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded-full hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isVoiceMode ? "Listening..." : "Ask me anything about fitness..."}
            disabled={isStreaming || isVoiceMode}
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent disabled:bg-gray-900"
          />
          
          <button
            type="submit"
            disabled={!inputText.trim() || isStreaming || isVoiceMode}
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