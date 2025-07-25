import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Send, X, Mic, MicOff, Copy, RefreshCw, ThumbsUp, ThumbsDown, 
  Download, MoreVertical, Clock, AlertCircle
} from 'lucide-react';
import { useVoice } from '../../hooks/useVoice';
import { enhancedAIService } from '../../services/ai/EnhancedAIService';
import { conversationManager, StreamingMessage, MessageReaction, ConversationContext } from '../../services/ai/ConversationManager';
import StreamingText from './StreamingText';
import QuickReplyGenerator from './QuickReplyGenerator';
import { v4 as uuidv4 } from 'uuid';

interface EnhancedAIChatInterfaceProps {
  workoutContext?: any;
  onClose: () => void;
}

export const EnhancedAIChatInterface: React.FC<EnhancedAIChatInterfaceProps> = ({
  workoutContext,
  onClose
}) => {
  const [conversationId] = useState(() => uuidv4());
  const [messages, setMessages] = useState<StreamingMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamingId, setCurrentStreamingId] = useState<string | null>(null);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { speak, stopSpeaking, isListening, startListening, stopListening, state } = useVoice({ workoutContext });

  // Load conversation on mount
  useEffect(() => {
    const context = conversationManager.getContext(conversationId);
    setMessages(context.messages);
    
    // Add welcome message if new conversation
    if (context.messages.length === 0) {
      const welcomeMessage: StreamingMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: workoutContext?.activeWorkout
          ? `I see you're working on ${workoutContext.currentExercise?.exercise.name}. How can I help with your workout?`
          : "Hello! I'm your AI fitness coach. I can help with workouts, nutrition, form checks, and motivation. What would you like to work on today?",
        timestamp: new Date(),
        isStreaming: false,
        isComplete: true,
        provider: 'system'
      };
      
      setMessages([welcomeMessage]);
      conversationManager.updateContext(conversationId, welcomeMessage);
    }
  }, [conversationId, workoutContext]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Voice transcription
  useEffect(() => {
    if (state.finalTranscript && state.finalTranscript !== '') {
      setInput(prev => prev + ' ' + state.finalTranscript);
    }
  }, [state.finalTranscript]);

  const handleSend = async () => {
    if (input.trim() === '' || isStreaming) return;

    const userMessage: StreamingMessage = {
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
    setError(null);
    setShowTypingIndicator(true);

    const assistantMessageId = uuidv4();
    const assistantMessage: StreamingMessage = {
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
    
    // Add a delay before starting streaming for realism
    await new Promise(resolve => setTimeout(resolve, 500));
    setShowTypingIndicator(false);

    try {
      await enhancedAIService.streamResponse(
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
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...completeMessage, id: assistantMessageId }
              : msg
          ));
          conversationManager.updateContext(conversationId, completeMessage);
          setIsStreaming(false);
          setCurrentStreamingId(null);
          
          // Auto-speak if voice was used for input
          if (isListening) {
            speak(completeMessage.content);
          }
        },
        (error) => {
          console.error('AI Error:', error);
          setError('Failed to get response. Please try again.');
          setIsStreaming(false);
          setCurrentStreamingId(null);
          setShowTypingIndicator(false);
        }
      );
    } catch (err) {
      setError('An unexpected error occurred.');
      setIsStreaming(false);
      setCurrentStreamingId(null);
      setShowTypingIndicator(false);
    }
  };

  const handleRegenerate = async (messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    // Find the user message before this assistant message
    let userMessage: StreamingMessage | null = null;
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userMessage = messages[i];
        break;
      }
    }

    if (!userMessage) return;

    // Create new assistant message
    const newAssistantId = uuidv4();
    const newAssistantMessage: StreamingMessage = {
      id: newAssistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
      isComplete: false,
      regenerationId: messageId
    };

    setMessages(prev => [
      ...prev.slice(0, messageIndex),
      newAssistantMessage,
      ...prev.slice(messageIndex + 1)
    ]);

    setCurrentStreamingId(newAssistantId);
    setIsStreaming(true);
    setShowTypingIndicator(true);

    const context = conversationManager.getContext(conversationId);

    await new Promise(resolve => setTimeout(resolve, 500));
    setShowTypingIndicator(false);

    await enhancedAIService.regenerateResponse(
      userMessage.content,
      context,
      { style: 'different' },
      (chunk) => {
        setMessages(prev => prev.map(msg => 
          msg.id === newAssistantId 
            ? { ...msg, content: chunk }
            : msg
        ));
      },
      (completeMessage) => {
        setMessages(prev => prev.map(msg => 
          msg.id === newAssistantId 
            ? { ...completeMessage, id: newAssistantId }
            : msg
        ));
        conversationManager.updateContext(conversationId, completeMessage);
        setIsStreaming(false);
        setCurrentStreamingId(null);
      },
      (error) => {
        console.error('Regeneration Error:', error);
        setError('Failed to regenerate response.');
        setIsStreaming(false);
        setCurrentStreamingId(null);
      }
    );
  };

  const handleReaction = (messageId: string, type: 'like' | 'dislike') => {
    const reaction: MessageReaction = {
      type,
      timestamp: new Date()
    };
    
    conversationManager.addReaction(conversationId, messageId, reaction);
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const updatedReactions = msg.reactions?.filter(r => r.type !== type) || [];
        updatedReactions.push(reaction);
        return { ...msg, reactions: updatedReactions };
      }
      return msg;
    }));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const exportConversation = () => {
    const markdown = conversationManager.exportAsMarkdown(conversationId);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitness-conversation-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <span className="text-xl">🤖</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold">AI Fitness Coach</h2>
              <p className="text-sm text-white/80">Always here to help</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportConversation}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
              title="Export conversation"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
            >
              <div className={`relative group max-w-[80%] ${message.role === 'user' ? 'order-2' : ''}`}>
                <div
                  className={`
                    p-4 rounded-2xl relative
                    ${message.role === 'user' 
                      ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-tr-sm' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-sm border border-gray-200 dark:border-gray-700'
                    }
                  `}
                >
                  {message.role === 'assistant' && message.isStreaming ? (
                    <StreamingText
                      text={message.content}
                      isStreaming={message.id === currentStreamingId}
                    />
                  ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}
                  
                  {/* Message timestamp */}
                  <div className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    <Clock className="w-3 h-3 inline mr-1" />
                    {formatTime(message.timestamp)}
                    {message.provider && message.provider !== 'system' && (
                      <span className="ml-2">• {message.provider}</span>
                    )}
                  </div>
                </div>

                {/* Message actions */}
                {message.role === 'assistant' && message.isComplete && (
                  <div className="absolute -bottom-8 left-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => copyToClipboard(message.content)}
                      className="p-1.5 rounded-lg bg-white dark:bg-gray-700 shadow-md hover:shadow-lg transition-all"
                      title="Copy message"
                    >
                      <Copy className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    </button>
                    <button
                      onClick={() => handleRegenerate(message.id)}
                      className="p-1.5 rounded-lg bg-white dark:bg-gray-700 shadow-md hover:shadow-lg transition-all"
                      title="Regenerate response"
                      disabled={isStreaming}
                    >
                      <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    </button>
                    <button
                      onClick={() => handleReaction(message.id, 'like')}
                      className={`p-1.5 rounded-lg bg-white dark:bg-gray-700 shadow-md hover:shadow-lg transition-all ${
                        message.reactions?.some(r => r.type === 'like') ? 'text-green-500' : 'text-gray-600 dark:text-gray-300'
                      }`}
                      title="Helpful"
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleReaction(message.id, 'dislike')}
                      className={`p-1.5 rounded-lg bg-white dark:bg-gray-700 shadow-md hover:shadow-lg transition-all ${
                        message.reactions?.some(r => r.type === 'dislike') ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'
                      }`}
                      title="Not helpful"
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {showTypingIndicator && (
            <div className="flex justify-start animate-fadeIn">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex justify-center animate-fadeIn">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick replies */}
        {!isStreaming && messages.length > 0 && (
          <QuickReplyGenerator
            conversation={messages}
            workoutContext={workoutContext}
            onSelectReply={(reply) => {
              setInput(reply);
              inputRef.current?.focus();
            }}
          />
        )}

        {/* Input area */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
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
                placeholder="Ask about workouts, nutrition, or fitness..."
                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 dark:border-gray-600 
                  bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 
                  placeholder-gray-400 dark:placeholder-gray-500 
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  resize-none max-h-32"
                rows={1}
                disabled={isStreaming}
              />
              <button
                onClick={isListening ? stopListening : startListening}
                className={`absolute right-2 bottom-2 p-2 rounded-lg transition-colors ${
                  isListening 
                    ? 'bg-red-500 text-white' 
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
                disabled={isStreaming}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="p-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 
                text-white font-medium hover:shadow-lg transform hover:scale-105 
                transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                disabled:transform-none disabled:shadow-none"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAIChatInterface;