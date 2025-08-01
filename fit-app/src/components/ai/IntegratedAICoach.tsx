import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, X, Bot, User, Loader2, Sparkles, Brain, MessageCircle, 
  Search, BookOpen, Zap, Target, Flame, Settings, Plus, Trash2
} from 'lucide-react';
import { nimbusAI } from '../../nimbus/services/NimbusAIService';
import { fitnessRAG } from '../../services/ragService';
import type { WorkoutContext } from '../../types/workout';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  mode?: 'coach' | 'research';
  sources?: Array<{
    title: string;
    type: string;
    relevance: number;
  }>;
  confidence?: number;
}

interface Chat {
  id: string;
  name: string;
  messages: Message[];
  createdAt: Date;
  mode: 'coach' | 'research';
}

interface IntegratedAICoachProps {
  context?: WorkoutContext | any;
  onClose?: () => void;
  className?: string;
}

export const IntegratedAICoach: React.FC<IntegratedAICoachProps> = ({
  context,
  onClose,
  className = ''
}) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamId, setCurrentStreamId] = useState<string | null>(null);
  const [mode, setMode] = useState<'coach' | 'research'>('coach');
  const [ragInitialized, setRagInitialized] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize RAG system
  useEffect(() => {
    initializeRAG();
  }, []);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [chats, scrollToBottom]);

  const initializeRAG = async () => {
    try {
      await fitnessRAG.initialize();
      setRagInitialized(true);
    } catch (error) {
      console.error('Failed to initialize RAG:', error);
    }
  };

  const getCurrentChat = () => {
    return chats.find(chat => chat.id === currentChatId);
  };

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      name: `New ${mode === 'coach' ? 'Coaching' : 'Research'} Chat`,
      messages: [{
        id: 'welcome',
        type: 'assistant',
        content: mode === 'coach' 
          ? "Hello! I'm your AI fitness coach. I can help you with workouts, form, motivation, and personalized guidance. What would you like to work on today?"
          : "Hello! I'm your fitness research assistant. I have access to a comprehensive knowledge base about exercises, nutrition, and training principles. What would you like to learn about?",
        timestamp: new Date(),
        mode
      }],
      createdAt: new Date(),
      mode
    };

    setChats(prev => [...prev, newChat]);
    setCurrentChatId(newChat.id);
  };

  const deleteChat = (chatId: string) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) {
      setCurrentChatId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputText.trim() || isStreaming || !currentChatId) return;
    
    const userMessage = inputText.trim();
    const messageId = Date.now().toString();
    
    // Add user message
    const newUserMessage: Message = {
      id: messageId,
      type: 'user',
      content: userMessage,
      timestamp: new Date(),
      mode
    };
    
    // Update current chat
    setChats(prev => prev.map(chat => 
      chat.id === currentChatId 
        ? { ...chat, messages: [...chat.messages, newUserMessage] }
        : chat
    ));
    
    setInputText('');
    setIsStreaming(true);
    
    // Create assistant message placeholder
    const assistantMessageId = `${messageId}-response`;
    const assistantMessage: Message = {
      id: assistantMessageId,
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
      mode
    };
    
    setChats(prev => prev.map(chat => 
      chat.id === currentChatId 
        ? { ...chat, messages: [...chat.messages, assistantMessage] }
        : chat
    ));
    
    setCurrentStreamId(assistantMessageId);
    abortControllerRef.current = new AbortController();
    
    try {
      let fullResponse = '';
      let sources: any[] = [];
      let confidence = 0;

      if (mode === 'research' && ragInitialized) {
        // Use RAG for research mode
        const ragResponse = await fitnessRAG.query(userMessage);
        fullResponse = ragResponse.answer;
        sources = ragResponse.sources;
        confidence = ragResponse.confidence;
      } else {
        // Use streaming AI for coach mode
        const stream = nimbusAI.streamMessage(
          userMessage,
          context,
          {
            signal: abortControllerRef.current.signal,
            onToken: (token) => {
              fullResponse += token;
              setChats(prev => prev.map(chat => 
                chat.id === currentChatId 
                  ? {
                      ...chat,
                      messages: chat.messages.map(msg => 
                        msg.id === assistantMessageId
                          ? { ...msg, content: fullResponse }
                          : msg
                      )
                    }
                  : chat
              ));
            }
          }
        );

        for await (const token of stream) {
          fullResponse += token;
        }
      }

      // Update final message
      setChats(prev => prev.map(chat => 
        chat.id === currentChatId 
          ? {
              ...chat,
              messages: chat.messages.map(msg => 
                msg.id === assistantMessageId
                  ? { 
                      ...msg, 
                      content: fullResponse, 
                      isStreaming: false,
                      sources,
                      confidence
                    }
                  : msg
              )
            }
          : chat
      ));

    } catch (error) {
      console.error('Message processing failed:', error);
      setChats(prev => prev.map(chat => 
        chat.id === currentChatId 
          ? {
              ...chat,
              messages: chat.messages.map(msg => 
                msg.id === assistantMessageId
                  ? { 
                      ...msg, 
                      content: 'Sorry, I encountered an error. Please try again.',
                      isStreaming: false
                    }
                  : msg
              )
            }
          : chat
      ));
    } finally {
      setIsStreaming(false);
      setCurrentStreamId(null);
    }
  };

  const cancelStreaming = () => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
    setCurrentStreamId(null);
  };

  const renderMessage = (message: Message) => {
    const isUser = message.type === 'user';
    
    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div
          className={`max-w-[80%] rounded-lg p-3 ${
            isUser
              ? 'gradient-primary text-white'
              : 'glass text-white'
          }`}
        >
          <div className="flex items-start space-x-2">
            {!isUser && (
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.mode === 'coach' ? 'gradient-success' : 'gradient-warning'
              }`}>
                {message.mode === 'coach' ? (
                  <MessageCircle className="w-3 h-3 text-white" />
                ) : (
                  <Brain className="w-3 h-3 text-white" />
                )}
              </div>
            )}
            <div className="flex-1">
              <p className="whitespace-pre-wrap">{message.content}</p>
              
              {/* Sources for research mode */}
              {!isUser && message.sources && message.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/20">
                  <p className="text-xs font-medium mb-2 text-white/70">Sources:</p>
                  <div className="space-y-1">
                    {message.sources.map((source, index) => (
                      <div key={index} className="text-xs text-white/60">
                        <span className="font-medium">{source.title}</span>
                        <span className="ml-2 text-white/40">
                          ({Math.round(source.relevance * 100)}% relevant)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Confidence for research mode */}
              {!isUser && message.confidence !== undefined && (
                <div className="mt-2 text-xs text-white/60">
                  Confidence: {Math.round(message.confidence * 100)}%
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTypingIndicator = () => {
    if (!isStreaming) return null;
    
    return (
      <div className="flex justify-start mb-4">
        <div className="glass rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce delay-200"></div>
          </div>
        </div>
      </div>
    );
  };

  const currentChat = getCurrentChat();

  return (
    <div className={`flex flex-col h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 ${className}`}>
      {/* Header */}
      <div className="bg-glass-strong border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">AI Fitness Coach</h2>
                <p className="text-xs text-white/60">Powered by advanced AI</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setMode(mode === 'coach' ? 'research' : 'coach')}
              className={`btn btn-sm ${
                mode === 'coach' ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              {mode === 'coach' ? (
                <>
                  <MessageCircle className="w-3 h-3 mr-1" />
                  Coach
                </>
              ) : (
                <>
                  <Brain className="w-3 h-3 mr-1" />
                  Research
                </>
              )}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="btn btn-secondary btn-sm"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chat List Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 bg-glass border-r border-white/10 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Chats</h3>
            <button
              onClick={createNewChat}
              className="btn btn-primary btn-sm"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          
          <div className="space-y-2">
            {chats.map(chat => (
              <div
                key={chat.id}
                className={`p-3 rounded-lg cursor-pointer transition-modern ${
                  currentChatId === chat.id 
                    ? 'glass-strong border border-white/20' 
                    : 'glass hover:bg-white/5'
                }`}
                onClick={() => setCurrentChatId(chat.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {chat.mode === 'coach' ? (
                      <MessageCircle className="w-3 h-3 text-green-400" />
                    ) : (
                      <Brain className="w-3 h-3 text-yellow-400" />
                    )}
                    <span className="text-sm text-white truncate">{chat.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat.id);
                    }}
                    className="text-white/40 hover:text-white/60"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs text-white/60 mt-1">
                  {chat.messages.length} messages
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {currentChat ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4">
                {currentChat.messages.map(renderMessage)}
                {renderTypingIndicator()}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={
                      mode === 'coach' 
                        ? "Ask your AI coach about workouts, form, motivation..."
                        : "Research exercises, nutrition, training principles..."
                    }
                    disabled={isStreaming}
                    className="flex-1 input"
                  />
                  {isStreaming ? (
                    <button
                      type="button"
                      onClick={cancelStreaming}
                      className="btn btn-danger btn-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!inputText.trim() || isStreaming}
                      className="btn btn-primary btn-sm"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 gradient-primary rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Start a New Chat
                </h3>
                <p className="text-white/60 mb-4">
                  {mode === 'coach' 
                    ? "Get personalized fitness coaching and motivation"
                    : "Research exercises, nutrition, and training principles"
                  }
                </p>
                <button
                  onClick={createNewChat}
                  className="btn btn-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 