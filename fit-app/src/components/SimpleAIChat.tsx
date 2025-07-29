import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Brain, Zap, Sparkles } from 'lucide-react';
import { mockAIService } from '../services/mockAIService';

interface SimpleAIChatProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  provider?: string;
  model?: string;
  processingTime?: number;
}

export const SimpleAIChat: React.FC<SimpleAIChatProps> = ({ isOpen, onClose }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;
    
    // Add user message
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsLoading(true);
    setStreamingContent('');
    
    try {
      // Add streaming message placeholder
      setMessages(prev => [...prev, { role: 'assistant', content: '', isStreaming: true }]);
      
      // Use the mock AI service
      const response = await mockAIService.generateResponse(
        userMsg,
        {
          userProfile: {
            fitnessLevel: 'intermediate',
            goals: ['muscle building', 'strength training']
          }
        },
        (token) => {
          setStreamingContent(prev => prev + token);
        }
      );
      
      // Update with final response
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: 'assistant',
          content: response.content,
          isStreaming: false,
          provider: response.provider,
          model: response.model,
          processingTime: response.processingTime
        };
        return newMessages;
      });
      setStreamingContent('');
      setIsLoading(false);
      
    } catch (error: any) {
      console.error('Chat error:', error);
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: 'assistant',
          content: 'I apologize for the inconvenience. Let me help you with fitness advice. What would you like to know?',
          isStreaming: false
        };
        return newMessages;
      });
      setStreamingContent('');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <Brain className="w-6 h-6 text-purple-500" />
              AI Fitness Coach
            </h3>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Sparkles className="w-3 h-3" />
              <span>Powered by Multiple AIs</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">Hi! I'm your AI fitness coach.</p>
              <p className="text-sm">I use multiple AI models to give you the best advice:</p>
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center justify-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span>Fast responses with Groq</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span>Complex planning with Claude</span>
                </div>
              </div>
              <p className="text-sm mt-4 text-purple-400">Ask me anything about fitness!</p>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] ${msg.role === 'assistant' ? 'space-y-2' : ''}`}>
                    <div className={`p-3 rounded-lg ${
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
                    {msg.role === 'assistant' && msg.provider && !msg.isStreaming && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 px-3">
                        <span className="flex items-center gap-1">
                          {msg.provider === 'groq' ? (
                            <Zap className="w-3 h-3 text-yellow-500" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-purple-500" />
                          )}
                          {msg.model} • {msg.processingTime ? `${(msg.processingTime / 1000).toFixed(1)}s` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
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
              placeholder="Ask about workouts, nutrition, form, planning..."
              className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isLoading}
            />
            <button 
              onClick={handleSubmit}
              disabled={isLoading || !input.trim()}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                isLoading || !input.trim()
                  ? 'bg-gray-700 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            AI automatically selects the best model for your question
          </p>
        </div>
      </div>
    </div>
  );
};