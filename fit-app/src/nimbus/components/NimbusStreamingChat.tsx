import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, X, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { NimbusButton } from './NimbusButton';
import { NimbusCard } from './NimbusCard';
import { nimbusAI } from '../services/NimbusAIService';
import type { WorkoutContext } from '../../types/workout';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface NimbusStreamingChatProps {
  context?: WorkoutContext | any;
  onClose?: () => void;
  className?: string;
  placeholder?: string;
}

export const NimbusStreamingChat: React.FC<NimbusStreamingChatProps> = ({
  context,
  onClose,
  className = '',
  placeholder = "Ask me anything about fitness..."
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamId, setCurrentStreamId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);
  
  // Handle message submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputText.trim() || isStreaming) return;
    
    const userMessage = inputText.trim();
    const messageId = Date.now().toString();
    
    // Add user message
    const newUserMessage: Message = {
      id: messageId,
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setInputText('');
    setIsStreaming(true);
    
    // Create assistant message placeholder
    const assistantMessageId = `${messageId}-response`;
    const assistantMessage: Message = {
      id: assistantMessageId,
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };
    
    setMessages(prev => [...prev, assistantMessage]);
    setCurrentStreamId(assistantMessageId);
    
    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();
    
    try {
      let fullResponse = '';
      
      // Stream the response
      const stream = nimbusAI.streamMessage(
        userMessage,
        context,
        {
          signal: abortControllerRef.current.signal,
          onToken: (token) => {
            fullResponse += token;
            setMessages(prev => 
              prev.map(msg => 
                msg.id === assistantMessageId
                  ? { ...msg, content: fullResponse }
                  : msg
              )
            );
          },
          onComplete: () => {
            setMessages(prev => 
              prev.map(msg => 
                msg.id === assistantMessageId
                  ? { ...msg, isStreaming: false }
                  : msg
              )
            );
          },
          onError: (error) => {
            console.error('Streaming error:', error);
            setMessages(prev => 
              prev.map(msg => 
                msg.id === assistantMessageId
                  ? { 
                      ...msg, 
                      content: "I apologize, but I'm having trouble responding right now. Please try again.",
                      isStreaming: false 
                    }
                  : msg
              )
            );
          }
        }
      );
      
      // Consume the stream
      for await (const chunk of stream) {
        // Tokens are handled in onToken callback
      }
      
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsStreaming(false);
      setCurrentStreamId(null);
      abortControllerRef.current = null;
    }
  };
  
  // Cancel streaming
  const cancelStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };
  
  // Render message bubble
  const renderMessage = (message: Message) => {
    const isUser = message.type === 'user';
    
    return (
      <div
        key={message.id}
        className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}
      >
        {/* Avatar */}
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
          ${isUser 
            ? 'bg-primary-500 text-white' 
            : 'bg-gradient-to-br from-primary-400 to-secondary-400'
          }
        `}>
          {isUser ? (
            <User className="w-5 h-5" />
          ) : (
            <Bot className="w-5 h-5 text-white" />
          )}
        </div>
        
        {/* Message bubble */}
        <div className={`
          max-w-[80%] rounded-2xl px-4 py-3
          ${isUser 
            ? 'bg-primary-500 text-white' 
            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
          }
        `}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
            {message.isStreaming && (
              <span className="inline-block w-2 h-4 bg-current opacity-70 animate-pulse ml-1 align-middle" />
            )}
          </p>
          
          <div className={`text-xs mt-1 ${
            isUser ? 'text-primary-100' : 'text-neutral-500 dark:text-neutral-400'
          }`}>
            {message.timestamp.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
      </div>
    );
  };
  
  // Typing indicator
  const renderTypingIndicator = () => {
    if (!isStreaming || currentStreamId) return null;
    
    return (
      <div className="flex gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        
        <div className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl px-4 py-3">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <NimbusCard
      variant="glass"
      padding="none"
      className={`flex flex-col h-full ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-white">
              Nimbus AI Coach
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Powered by advanced AI
            </p>
          </div>
        </div>
        
        {onClose && (
          <NimbusButton
            variant="ghost"
            size="sm"
            icon={<X className="w-5 h-5" />}
            onClick={onClose}
            aria-label="Close chat"
          />
        )}
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400/20 to-secondary-400/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary-500" />
            </div>
            <h4 className="font-medium text-neutral-900 dark:text-white mb-2">
              Ready to help you achieve your fitness goals!
            </h4>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Ask me about workouts, nutrition, or any fitness questions.
            </p>
          </div>
        ) : (
          <>
            {messages.map(renderMessage)}
            {renderTypingIndicator()}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-neutral-200 dark:border-neutral-700">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={placeholder}
            disabled={isStreaming}
            className={`
              flex-1 px-4 py-2 rounded-lg
              bg-neutral-100 dark:bg-neutral-800
              text-neutral-900 dark:text-white
              placeholder-neutral-500 dark:placeholder-neutral-400
              border border-transparent
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          />
          
          <NimbusButton
            type="submit"
            variant="primary"
            size="md"
            icon={<Send className="w-4 h-4" />}
            disabled={!inputText.trim() || isStreaming}
            loading={isStreaming}
          />
        </div>
        
        {isStreaming && (
          <div className="mt-2 flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin text-primary-500" />
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Nimbus is thinking...
            </span>
            <button
              type="button"
              onClick={cancelStreaming}
              className="text-xs text-red-500 hover:text-red-600 ml-auto"
            >
              Cancel
            </button>
          </div>
        )}
      </form>
    </NimbusCard>
  );
};