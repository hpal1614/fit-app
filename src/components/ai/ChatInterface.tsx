import React, { useState, useRef, useEffect } from 'react';
import { WorkoutContext } from '../../types';
import { Send, Volume2, Loader, Bot, User, Lightbulb } from 'lucide-react';
import type { QuickReply } from '../../types/conversationTypes';
import { ConversationFlowService } from '../../services/conversationFlowService';
import { QuickReplyButtons } from '../QuickReplyButtons';

interface ChatInterfaceProps {
  aiCoach: any; // Using any for now since we're importing the hook
  workoutContext: WorkoutContext;
  voiceEnabled: boolean;
  onSpeak: (text: string) => Promise<boolean>;
}

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  confidence?: number;
  suggestions?: string[];
}

export function ChatInterface({
  aiCoach,
  workoutContext,
  voiceEnabled,
  onSpeak
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: "Hello! I'm your AI fitness coach. I can help you with exercise form, nutrition advice, workout planning, and motivation. What would you like to know?",
      isUser: false,
      timestamp: new Date(),
      suggestions: [
        "Analyze my form",
        "What should I eat after my workout?",
        "I need motivation",
        "Plan my next workout"
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const flow = useRef<ConversationFlowService | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!flow.current) {
      flow.current = new ConversationFlowService();
    }
  }, []);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || aiCoach.isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await aiCoach.askCoach(message, workoutContext, 'general-advice');
      
      if (response) {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: response.content,
          isUser: false,
          timestamp: new Date(),
          confidence: response.confidence,
          suggestions: response.suggestions
        };

        setMessages(prev => [...prev, aiMessage]);
        try {
          const scenario = flow.current?.detectScenario(message);
          const qr = flow.current?.getQuickReplies(aiMessage.content, scenario || 'standard_beginner') || [];
          setQuickReplies(qr);
        } catch (_) {
          setQuickReplies([]);
        }
      } else {
        throw new Error('No response from AI coach');
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I'm having trouble responding right now. Please try again.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleQuickReplySelect = (reply: QuickReply) => {
    handleSendMessage(reply.text);
  };

  const handleSpeakMessage = async (message: string) => {
    if (voiceEnabled) {
      await onSpeak(message);
    }
  };

  const getQuickActions = () => {
    const actions = [];
    
    if (workoutContext.activeWorkout) {
      actions.push("How am I doing so far?");
      actions.push("Give me motivation");
      
      if (workoutContext.currentExercise) {
        actions.push(`Tips for ${workoutContext.currentExercise.exercise.name}`);
        actions.push("Should I increase the weight?");
      }
    } else {
      actions.push("Help me plan a workout");
      actions.push("What should I eat today?");
      actions.push("Give me workout motivation");
    }
    
    return actions;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl h-[calc(100vh-220px)] md:h-[calc(100vh-180px)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-fitness-blue rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Coach</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {aiCoach.isLoading ? 'Thinking...' : 'Ready to help'}
            </p>
          </div>
        </div>
        
        {aiCoach.lastConfidence && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Confidence: {Math.round(aiCoach.lastConfidence * 100)}%
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              message.isUser 
                ? 'bg-fitness-blue text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
            }`}>
              <div className="flex items-start space-x-2">
                {!message.isUser && (
                  <Bot className="w-4 h-4 mt-0.5 flex-shrink-0 text-fitness-blue" />
                )}
                {message.isUser && (
                  <User className="w-4 h-4 mt-0.5 flex-shrink-0 text-white" />
                )}
                <div className="flex-1">
                  <p className="text-sm">{message.content}</p>
                  
                  {/* AI Message extras */}
                  {!message.isUser && (
                    <div className="mt-2 space-y-2">
                      {/* Speak button */}
                      {voiceEnabled && (
                        <button
                          onClick={() => handleSpeakMessage(message.content)}
                          className="flex items-center space-x-1 text-xs text-gray-500 hover:text-fitness-blue transition-colors"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>Speak</span>
                        </button>
                      )}
                      
                      {/* Confidence indicator */}
                      {message.confidence && (
                        <div className="flex items-center space-x-2">
                          <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-1">
                            <div 
                              className={`h-1 rounded-full ${
                                message.confidence > 0.8 ? 'bg-green-500' :
                                message.confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${message.confidence * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Suggestions */}
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {message.suggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Smart Quick Replies (non-breaking, optional) */}
                      {quickReplies && quickReplies.length > 0 && (
                        <div className="mt-2">
                          <QuickReplyButtons replies={quickReplies} onSelect={handleQuickReplySelect} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2 flex items-center space-x-2">
              <Bot className="w-4 h-4 text-fitness-blue" />
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-600">
        <div className="flex flex-wrap gap-2">
          {getQuickActions().map((action, index) => (
            <button
              key={index}
              onClick={() => handleSendMessage(action)}
              disabled={aiCoach.isLoading}
              className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center space-x-1"
            >
              <Lightbulb className="w-3 h-3" />
              <span>{action}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-600 sticky bottom-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (inputValue.trim()) {
                  handleSendMessage(inputValue);
                }
              }
            }}
            placeholder="Ask your AI coach anything..."
            disabled={aiCoach.isLoading}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fitness-blue focus:border-transparent disabled:opacity-50"
          />
          <button
            onClick={() => handleSendMessage(inputValue)}
            disabled={!inputValue.trim() || aiCoach.isLoading}
            className="px-4 py-2 bg-fitness-blue hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center"
          >
            {aiCoach.isLoading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        
        {/* Voice hint */}
        {voiceEnabled && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            💡 You can also use voice commands instead of typing
          </p>
        )}
      </div>
    </div>
  );
}