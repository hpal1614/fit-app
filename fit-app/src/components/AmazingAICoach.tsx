import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, Bot, Sparkles, Brain, MessageCircle, Mic, Volume2, 
  Zap, Plus, Trash2, Settings, User, Loader2, Copy, Check, X
} from 'lucide-react';
import { useStreamingAI } from '../hooks/useStreamingAI';
import { useVoice } from '../hooks/useVoice';
import type { WorkoutContext } from '../types/workout';
import { ConversationFlowService } from '../services/conversationFlowService';
import { QuickReply } from '../types/conversationTypes';
import QuickReplyButtons from './QuickReplyButtons';

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
  isVoice?: boolean;
}

interface Chat {
  id: string;
  name: string;
  messages: Message[];
  createdAt: Date;
  mode: 'coach' | 'research';
}

interface AmazingAICoachProps {
  context?: WorkoutContext | any;
  onClose?: () => void;
  className?: string;
}

export const AmazingAICoach: React.FC<AmazingAICoachProps> = ({
  context,
  onClose,
  className = ''
}) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [mode, setMode] = useState<'coach' | 'research'>('coach');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [generatedTemplate, setGeneratedTemplate] = useState<any>(null);
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const flowRef = useRef<ConversationFlowService | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // AI and Voice hooks
  const { streamResponse, isStreaming: aiStreaming, stopStreaming } = useStreamingAI({
    onChunk: (chunk) => {
      // Update the current streaming message
      setChats(prev => prev.map(chat => 
        chat.id === currentChatId 
          ? {
              ...chat,
              messages: chat.messages.map(msg => 
                msg.isStreaming
                  ? { ...msg, content: msg.content + chunk }
                  : msg
              )
            }
          : chat
      ));
    },
    onComplete: (fullResponse) => {
      // Mark streaming as complete
      setChats(prev => prev.map(chat => 
        chat.id === currentChatId 
          ? {
              ...chat,
              messages: chat.messages.map(msg => 
                msg.isStreaming
                  ? { 
                      ...msg, 
                      content: fullResponse, 
                      isStreaming: false,
                      confidence: 0.95
                    }
                  : msg
              )
            }
          : chat
      ));
      setIsStreaming(false);

      try {
        if (!flowRef.current) {
          flowRef.current = new ConversationFlowService();
        }
        const current = chats.find(c => c.id === currentChatId);
        const lastUser = current?.messages.slice().reverse().find(m => m.type === 'user');
        const scenario = flowRef.current.detectScenario(lastUser?.content || '', undefined);
        const qr = flowRef.current.getQuickReplies(fullResponse, scenario);
        setQuickReplies(qr);
      } catch {
        setQuickReplies([]);
      }
      
      // Check if this is a template response
      if (fullResponse.includes('💾 **Save Template:**') || fullResponse.includes('Template:')) {
        setShowSaveButton(true);
        // Extract template data from the response
        const templateMatch = fullResponse.match(/Template: (.+?)(?:\n|$)/);
        if (templateMatch) {
          setGeneratedTemplate({
            name: templateMatch[1],
            content: fullResponse,
            type: 'workout'
          });
        }
      } else {
        setShowSaveButton(false);
        setGeneratedTemplate(null);
      }
    },
    onError: (error) => {
      console.error('AI Error:', error);
      setChats(prev => prev.map(chat => 
        chat.id === currentChatId 
          ? {
              ...chat,
              messages: chat.messages.map(msg => 
                msg.isStreaming
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
      setIsStreaming(false);
    }
  });

  const { speak, isListening, startListening, stopListening } = useVoice({ workoutContext: context });

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [chats, scrollToBottom]);

  // Initialize with welcome message
  useEffect(() => {
    if (chats.length === 0) {
      createNewChat();
    }
  }, []);

  const getCurrentChat = () => {
    return chats.find(chat => chat.id === currentChatId);
  };

  const createNewChat = () => {
    const newChat: Chat = {
      id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `New ${mode === 'coach' ? 'Coaching' : 'Research'} Chat`,
      messages: [{
        id: `welcome-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'assistant',
        content: mode === 'coach' 
          ? "👋 Hello! I'm your AI fitness coach. I can help you with:\n\n💪 **Workout Planning** - Create personalized routines\n🏃‍♂️ **Form Guidance** - Perfect your technique\n🍎 **Nutrition Advice** - Fuel your fitness journey\n🎯 **Goal Setting** - Track your progress\n💡 **Motivation** - Stay inspired and focused\n\nWhat would you like to work on today?"
          : "🔬 Hello! I'm your fitness research assistant. I have access to comprehensive knowledge about:\n\n📚 **Exercise Science** - Latest research and studies\n💪 **Training Methods** - Proven techniques and protocols\n🍎 **Nutrition Science** - Evidence-based nutrition advice\n🏥 **Injury Prevention** - Safe training practices\n📊 **Performance Metrics** - Data-driven insights\n\nWhat would you like to learn about?",
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
    const userMessageId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Add user message
    const newUserMessage: Message = {
      id: userMessageId,
      type: 'user',
      content: userMessage,
      timestamp: new Date(),
      mode,
      isVoice: isVoiceMode
    };
    
    // Update current chat
    setChats(prev => prev.map(chat => 
      chat.id === currentChatId 
        ? { ...chat, messages: [...chat.messages, newUserMessage] }
        : chat
    ));
    
    setInputText('');
    setIsStreaming(true);
    
    // Create assistant message placeholder with unique ID
    const assistantMessageId = `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
    
    try {
      // Start streaming response
      await streamResponse(userMessage);
    } catch (error) {
      console.error('Message processing failed:', error);
    }
  };

  const handleVoiceToggle = async () => {
    if (isListening) {
      stopListening();
      setIsVoiceMode(false);
    } else {
      setIsVoiceMode(true);
      try {
        const started = await startListening();
        if (!started) {
          setIsVoiceMode(false);
          console.log('Voice recognition not available');
        }
      } catch (error) {
        console.error('Voice recognition error:', error);
        setIsVoiceMode(false);
      }
    }
  };

  const copyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const saveTemplate = async () => {
    if (!generatedTemplate) return;
    
    try {
      // Save template to localStorage (similar to template uploader)
      const savedTemplates = JSON.parse(localStorage.getItem('workoutTemplates') || '[]');
      const newTemplate = {
        id: `template-${Date.now()}`,
        name: generatedTemplate.name,
        content: generatedTemplate.content,
        type: generatedTemplate.type,
        createdAt: new Date().toISOString(),
        isAIGenerated: true
      };
      
      savedTemplates.push(newTemplate);
      localStorage.setItem('workoutTemplates', JSON.stringify(savedTemplates));
      
      // Show success message
      alert(`✅ Template "${generatedTemplate.name}" saved successfully! You can now use it in the workout logger.`);
      
      // Reset template state
      setShowSaveButton(false);
      setGeneratedTemplate(null);
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('❌ Failed to save template. Please try again.');
    }
  };

  const renderMessage = (message: Message) => {
    const isUser = message.type === 'user';
    const isCopied = copiedMessageId === message.id;
    
    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 group`}
      >
        <div
          className={`max-w-[85%] rounded-2xl p-4 ${
            isUser
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
              : 'bg-gray-800/90 backdrop-blur-lg text-white border border-gray-700 shadow-lg'
          }`}
        >
          <div className="flex items-start space-x-3">
            {!isUser && (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.mode === 'coach' ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-orange-400 to-red-500'
              }`}>
                {message.mode === 'coach' ? (
                  <MessageCircle className="w-4 h-4 text-white" />
                ) : (
                  <Brain className="w-4 h-4 text-white" />
                )}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-white/70">
                  {isUser ? 'You' : (message.mode === 'coach' ? 'AI Coach' : 'Research Assistant')}
                </span>
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!isUser && (
                    <button
                      onClick={() => speak(message.content)}
                      className="p-1 rounded hover:bg-white/10 transition-colors"
                    >
                      <Volume2 className="w-3 h-3 text-white/70" />
                    </button>
                  )}
                  <button
                    onClick={() => copyMessage(message.id, message.content)}
                    className="p-1 rounded hover:bg-white/10 transition-colors"
                  >
                    {isCopied ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-white/70" />
                    )}
                  </button>
                </div>
              </div>
              <div className="prose prose-invert max-w-none">
                <p className="whitespace-pre-wrap leading-relaxed text-left">{message.content}</p>
              </div>
              
              {/* Sources for research mode */}
              {!isUser && message.sources && message.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-white/20">
                  <p className="text-xs font-medium mb-2 text-white/70">📚 Sources:</p>
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
              
              {/* Confidence score */}
              {!isUser && message.confidence && (
                <div className="mt-2 text-xs text-white/50">
                  Confidence: {Math.round(message.confidence * 100)}%
                </div>
              )}
              
              {/* Timestamp */}
              <div className="mt-2 text-xs text-white/40">
                {message.timestamp.toLocaleTimeString()}
                {message.isVoice && (
                  <span className="ml-2">🎤</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const currentChat = getCurrentChat();

  return (
    <div className={`h-full flex flex-col bg-gray-900/95 backdrop-blur-lg rounded-2xl border border-gray-800 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Amazing AI Coach</h3>
            <p className="text-xs text-gray-400">
              {mode === 'coach' ? 'Personal Fitness Coach' : 'Research Assistant'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Mode Toggle */}
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setMode('coach')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                mode === 'coach'
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              style={mode === 'coach' ? { backgroundColor: '#a5e635' } : undefined}
            >
              💪 Coach
            </button>
            <button
              onClick={() => setMode('research')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                mode === 'research'
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🔬 Research
            </button>
          </div>
          
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
          
          {onClose && (
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-300 p-2"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Chat List Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 bg-gray-800/50 border-r border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-white">Chats</h4>
            <button
              onClick={createNewChat}
              className="p-1 rounded hover:bg-gray-700 transition-colors"
            >
              <Plus size={16} className="text-gray-400" />
            </button>
          </div>
          
          <div className="space-y-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  currentChatId === chat.id
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                }`}
                onClick={() => setCurrentChatId(chat.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{chat.name}</p>
                    <p className="text-xs text-gray-400">
                      {chat.messages.length} messages
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat.id);
                    }}
                    className="p-1 rounded hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={12} className="text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {currentChat?.messages.map((message) => renderMessage(message))}
            {quickReplies.length > 0 && (
              <QuickReplyButtons
                replies={quickReplies}
                onSelect={(reply) => {
                  setInputText(reply.text);
                }}
              />
            )}
            
            {/* Loading indicator */}
            {isStreaming && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-800/90 backdrop-blur-lg text-white border border-gray-700 rounded-2xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-white/70" />
                      <span className="text-sm text-white/70">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-700">
            <form onSubmit={handleSubmit} className="flex space-x-3">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    isVoiceMode 
                      ? "🎤 Listening..." 
                      : mode === 'coach'
                        ? "Ask me about workouts, form, nutrition, or motivation..."
                        : "Ask me about fitness research, studies, or evidence-based advice..."
                  }
                  disabled={isStreaming || isVoiceMode}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-900 disabled:cursor-not-allowed text-left"
                />
                {isVoiceMode && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  </div>
                )}
              </div>
              
              <button
                type="submit"
                disabled={!inputText.trim() || isStreaming || isVoiceMode}
                className="text-white p-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium hover:bg-[#94d929]"
                style={{ backgroundColor: '#a5e635' }}
              >
                <Send size={20} />
              </button>
            </form>

            {isVoiceMode && (
              <div className="mt-2 text-sm text-blue-400 bg-blue-500/10 p-2 rounded-lg flex items-center space-x-2">
                <Mic size={16} className="animate-pulse" />
                <span>Listening for your question...</span>
              </div>
            )}

            {/* Save Template Button */}
            {showSaveButton && generatedTemplate && (
              <div className="mt-4 p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-white mb-1">
                      💾 Template Ready to Save
                    </h4>
                    <p className="text-xs text-gray-400">
                      "{generatedTemplate.name}" - Click save to use in workout logger
                    </p>
                  </div>
                  <button
                    onClick={saveTemplate}
                    className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-blue-600 transition-all font-medium text-sm flex items-center space-x-2"
                  >
                    <Zap size={16} />
                    <span>Save Template</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
