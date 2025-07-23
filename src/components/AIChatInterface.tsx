import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Loader, AlertCircle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiService } from '../services/aiService';
import { useVoice } from '../hooks/useVoice';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    cached?: boolean;
    responseTime?: number;
  };
}

export const AIChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isListening, startListening, stopListening, transcript } = useVoice();

  // Initialize AI service
  useEffect(() => {
    // Load conversation history
    const history = aiService.getConversationHistory();
    if (history.length > 0) {
      setMessages(history as Message[]);
    }

    // Update user profile (in a real app, this would come from user settings)
    aiService.updateUserProfile({
      id: 'user-123',
      name: 'Fitness Enthusiast',
      age: 28,
      experienceLevel: 'intermediate',
      goals: ['Build muscle', 'Increase strength'],
      equipment: ['Barbell', 'Dumbbells', 'Pull-up bar']
    });

    // Set fitness goals
    aiService.updateFitnessGoals({
      primaryGoal: 'muscle_gain',
      weeklyWorkoutTarget: 4,
      specificGoals: ['Bench press 225 lbs', 'Squat 315 lbs']
    });
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update input with voice transcript
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const startTime = Date.now();
      const response = await aiService.sendMessage(userMessage.content);
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        metadata: response.metadata
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Update workout context if discussing exercises
      if (userMessage.content.toLowerCase().includes('squat') || 
          userMessage.content.toLowerCase().includes('deadlift') ||
          userMessage.content.toLowerCase().includes('bench')) {
        aiService.updateWorkoutContext({
          currentExercise: userMessage.content.match(/(squat|deadlift|bench)/i)?.[0],
          intensity: 'medium'
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to get response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Zap className="text-green-500" size={24} />
          AI Fitness Coach
        </h2>
        <div className="text-sm text-gray-400">
          Powered by Advanced RAG
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-800 text-gray-100'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.metadata && (
                  <div className="mt-2 text-xs opacity-70">
                    {message.metadata.cached && (
                      <span className="inline-flex items-center gap-1">
                        <Zap size={12} />
                        Cached response
                      </span>
                    )}
                    {message.metadata.responseTime && (
                      <span className="ml-2">
                        {message.metadata.responseTime}ms
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-gray-800 rounded-lg p-4 flex items-center gap-2">
              <Loader className="animate-spin text-green-500" size={20} />
              <span className="text-gray-300">Thinking...</span>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center"
          >
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 flex items-center gap-2">
              <AlertCircle className="text-red-500" size={20} />
              <span className="text-red-300">{error}</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about exercises, nutrition, or get motivated..."
            className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
            disabled={isLoading}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleVoice}
            className={`p-3 rounded-lg transition-all ${
              isListening
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            <Mic size={20} className="text-white" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg px-6 py-3 font-medium transition-all"
          >
            <Send size={20} />
          </motion.button>
        </div>
        
        {/* Quick actions */}
        <div className="mt-3 flex gap-2 flex-wrap">
          {['Check my form', 'Create workout plan', 'Nutrition advice', 'Motivate me'].map((action) => (
            <motion.button
              key={action}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setInput(action)}
              className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full px-3 py-1 transition-all"
            >
              {action}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};