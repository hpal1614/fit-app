import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Search, Book, Dumbbell, Apple, Brain, 
  ChevronRight, Info, Sparkles, MessageSquare 
} from 'lucide-react';
import { intelligentAIService } from '../../services/ai/IntelligentAIService';
import { conversationManager, StreamingMessage } from '../../services/ai/ConversationManager';
import StreamingText from './StreamingText';
import { v4 as uuidv4 } from 'uuid';

interface IntelligentAIChatProps {
  workoutContext?: any;
  onClose?: () => void;
}

interface ChatMessage extends StreamingMessage {
  sources?: string[];
  suggestions?: string[];
  confidence?: number;
}

export const IntelligentAIChat: React.FC<IntelligentAIChatProps> = ({
  workoutContext,
  onClose
}) => {
  const [conversationId] = useState(() => uuidv4());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamingId, setCurrentStreamingId] = useState<string | null>(null);
  const [showKnowledgePanel, setShowKnowledgePanel] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'exercise' | 'nutrition' | 'principles'>('all');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Quick action categories
  const quickActions = [
    { 
      icon: <Dumbbell className="w-5 h-5" />, 
      label: 'Exercise Form', 
      query: 'How do I perform a squat with proper form?',
      category: 'exercise' 
    },
    { 
      icon: <Apple className="w-5 h-5" />, 
      label: 'Nutrition Advice', 
      query: 'What should I eat for muscle growth?',
      category: 'nutrition' 
    },
    { 
      icon: <Brain className="w-5 h-5" />, 
      label: 'Workout Principles', 
      query: 'Explain progressive overload',
      category: 'principles' 
    },
    { 
      icon: <Search className="w-5 h-5" />, 
      label: 'Custom Program', 
      query: 'Create a beginner strength training program',
      category: 'all' 
    }
  ];

  // Sample knowledge categories for the panel
  const knowledgeCategories = {
    exercise: {
      title: 'Exercise Library',
      icon: <Dumbbell className="w-4 h-4" />,
      items: ['Barbell Squat', 'Bench Press', 'Deadlift', 'Plank', 'Running']
    },
    nutrition: {
      title: 'Nutrition Topics',
      icon: <Apple className="w-4 h-4" />,
      items: ['Protein Requirements', 'Carb Timing', 'Hydration', 'Creatine']
    },
    principles: {
      title: 'Training Principles',
      icon: <Brain className="w-4 h-4" />,
      items: ['Progressive Overload', 'Recovery', 'Specificity', 'Periodization']
    }
  };

  useEffect(() => {
    // Initial welcome message
    const welcomeMessage: ChatMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: "👋 Welcome to your Intelligent Fitness AI! I have access to a comprehensive knowledge base of exercises, nutrition science, and training principles. Ask me anything about fitness!",
      timestamp: new Date(),
      isStreaming: false,
      isComplete: true,
      provider: 'system',
      suggestions: [
        'Show me proper squat form',
        'Create a workout plan for me',
        'What should I eat post-workout?'
      ]
    };
    
    setMessages([welcomeMessage]);
    conversationManager.updateContext(conversationId, welcomeMessage);
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (input.trim() === '' || isStreaming) return;

    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      isStreaming: false,
      isComplete: true
    };

    setMessages(prev => [...prev, userMessage]);
    conversationManager.updateContext(conversationId, userMessage);
    setInput('');

    const assistantMessageId = uuidv4();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
      isComplete: false
    };

    setMessages(prev => [...prev, assistantMessage]);
    setCurrentStreamingId(assistantMessageId);
    setIsStreaming(true);

    const context = conversationManager.getContext(conversationId);

    try {
      const response = await intelligentAIService.processQueryWithRAG(
        userMessage.content,
        context,
        (chunk) => {
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: chunk }
              : msg
          ));
        },
        (completeMessage) => {
          // Response is complete
          setIsStreaming(false);
          setCurrentStreamingId(null);
        },
        (error) => {
          console.error('AI Error:', error);
          setIsStreaming(false);
          setCurrentStreamingId(null);
        }
      );

      // Update message with sources and suggestions
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { 
              ...msg, 
              isStreaming: false,
              isComplete: true,
              sources: response.sources,
              suggestions: response.suggestions,
              confidence: response.confidence,
              provider: 'RAG'
            }
          : msg
      ));

      conversationManager.updateContext(conversationId, {
        ...assistantMessage,
        content: response.content,
        isComplete: true
      });

    } catch (error) {
      console.error('Failed to process query:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { 
              ...msg, 
              content: 'I apologize, but I encountered an error. Please try again.',
              isStreaming: false,
              isComplete: true
            }
          : msg
      ));
    }
  };

  const handleQuickAction = (query: string) => {
    setInput(query);
    inputRef.current?.focus();
  };

  const handleKnowledgeItemClick = (item: string) => {
    setInput(`Tell me about ${item}`);
    inputRef.current?.focus();
  };

  const getSourceIcon = (source: string) => {
    if (source.includes('exercise')) return <Dumbbell className="w-3 h-3" />;
    if (source.includes('nutrition')) return <Apple className="w-3 h-3" />;
    if (source.includes('principle')) return <Brain className="w-3 h-3" />;
    return <Book className="w-3 h-3" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-gray-50 dark:bg-gray-900">
      {/* Knowledge Panel */}
      {showKnowledgePanel && (
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Book className="w-5 h-5 text-purple-500" />
              Knowledge Base
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Powered by fitness science
            </p>
          </div>

          {/* Category Filters */}
          <div className="p-4 space-y-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                selectedCategory === 'all' 
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              All Categories
            </button>
            {Object.entries(knowledgeCategories).map(([key, category]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key as any)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  selectedCategory === key 
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {category.icon}
                {category.title}
              </button>
            ))}
          </div>

          {/* Knowledge Items */}
          <div className="px-4 pb-4">
            {(selectedCategory === 'all' 
              ? Object.entries(knowledgeCategories) 
              : [[selectedCategory, knowledgeCategories[selectedCategory as keyof typeof knowledgeCategories]]]
            ).map(([key, category]) => (
              <div key={key} className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  {category.icon}
                  {category.title}
                </h4>
                <div className="space-y-1">
                  {category.items.map(item => (
                    <button
                      key={item}
                      onClick={() => handleKnowledgeItemClick(item)}
                      className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between group"
                    >
                      <span className="text-gray-700 dark:text-gray-300">{item}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  Intelligent Fitness AI
                  <Sparkles className="w-4 h-4 text-purple-500" />
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Powered by comprehensive fitness knowledge
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowKnowledgePanel(!showKnowledgePanel)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Toggle knowledge panel"
              >
                <Book className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Quick actions:</span>
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action.query)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white dark:bg-gray-700 
                  border border-gray-200 dark:border-gray-600 rounded-full 
                  hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-2xl ${message.role === 'user' ? 'order-2' : ''}`}>
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    message.role === 'user' 
                      ? 'bg-purple-600 text-white rounded-tr-sm' 
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-sm border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {message.role === 'assistant' && message.isStreaming ? (
                    <StreamingText
                      text={message.content}
                      isStreaming={message.id === currentStreamingId}
                    />
                  ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}
                </div>

                {/* Sources */}
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Info className="w-3 h-3" />
                    <span>Sources:</span>
                    {message.sources.map((source, index) => (
                      <span key={index} className="flex items-center gap-1">
                        {getSourceIcon(source)}
                        {source}
                      </span>
                    ))}
                    {message.confidence && (
                      <span className="ml-2">
                        ({Math.round(message.confidence * 100)}% confident)
                      </span>
                    )}
                  </div>
                )}

                {/* Suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Suggested follow-ups:</p>
                    <div className="flex flex-wrap gap-2">
                      {message.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickAction(suggestion)}
                          className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 
                            rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 
                            transition-colors flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" />
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask about exercises, nutrition, or training principles..."
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 
                  bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 
                  placeholder-gray-400 dark:placeholder-gray-500 
                  focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                  resize-none max-h-32"
                rows={1}
                disabled={isStreaming}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="p-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 
                text-white font-medium hover:shadow-lg transform hover:scale-105 
                transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                disabled:transform-none disabled:shadow-none"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            AI responses are based on scientific fitness knowledge and best practices
          </p>
        </div>
      </div>
    </div>
  );
};

export default IntelligentAIChat;