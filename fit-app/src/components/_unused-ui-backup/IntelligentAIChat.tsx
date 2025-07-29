import React, { useState, useEffect, useRef } from 'react';
import { fitnessRAG } from '../../services/ragService';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  sources?: Array<{
    title: string;
    type: string;
    relevance: number;
  }>;
  confidence?: number;
  timestamp: number;
}

interface IntelligentAIChatProps {
  className?: string;
  onClose?: () => void;
}

export const IntelligentAIChat: React.FC<IntelligentAIChatProps> = ({
  className = '',
  onClose
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ragInitialized, setRagInitialized] = useState(false);
  const [followUpSuggestions, setFollowUpSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeRAG();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeRAG = async () => {
    try {
      await fitnessRAG.initialize();
      setRagInitialized(true);
      
      // Add welcome message
      setMessages([{
        id: 'welcome',
        content: "Hello! I'm your intelligent fitness coach with deep knowledge about exercises, nutrition, and training strategies. How can I help you today?",
        role: 'assistant',
        timestamp: Date.now()
      }]);
    } catch (error) {
      console.error('Failed to initialize RAG:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !ragInitialized) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      content: input,
      role: 'user',
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Query RAG system
      const response = await fitnessRAG.query(input);
      
      const assistantMessage: Message = {
        id: `msg-${Date.now()}-ai`,
        content: response.answer,
        role: 'assistant',
        sources: response.sources,
        confidence: response.confidence,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setFollowUpSuggestions(response.followUpQuestions || []);
    } catch (error) {
      console.error('Query failed:', error);
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-error`,
        content: 'Sorry, I encountered an error processing your question. Please try again.',
        role: 'assistant',
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowUp = (question: string) => {
    setInput(question);
  };

  return (
    <div className={`flex flex-col h-full bg-white rounded-xl shadow-lg ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">🧠 Intelligent AI Coach</h2>
            <p className="text-purple-100 text-sm">Powered by fitness knowledge base</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              
              {/* Sources */}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs font-medium mb-2 text-gray-600">Sources:</p>
                  <div className="space-y-1">
                    {message.sources.map((source, index) => (
                      <div key={index} className="text-xs text-gray-500">
                        <span className="font-medium">{source.title}</span>
                        <span className="ml-2 text-gray-400">
                          ({Math.round(source.relevance * 100)}% relevant)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Confidence */}
              {message.confidence !== undefined && (
                <div className="mt-2 text-xs text-gray-500">
                  Confidence: {Math.round(message.confidence * 100)}%
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Follow-up Suggestions */}
      {followUpSuggestions.length > 0 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
          <div className="flex flex-wrap gap-2">
            {followUpSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleFollowUp(suggestion)}
                className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={ragInitialized ? "Ask about exercises, nutrition, or training..." : "Initializing knowledge base..."}
            disabled={!ragInitialized || isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={!ragInitialized || isLoading || !input.trim()}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default IntelligentAIChat;