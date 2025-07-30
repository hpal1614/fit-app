import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, X, Mic, Volume2, Bot, User, Loader2, Brain, Activity } from 'lucide-react';
import { useStreamingAI } from '../../hooks/useStreamingAI';
import { useVoice } from '../../hooks/useVoice';
import { useMCPTools } from '../../hooks/useMCPTools';
import type { WorkoutContext } from '../../types/workout';
// Removed unused AIResponse import

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  isVoice?: boolean;
  toolsUsed?: string[];
}

interface AIChatInterfaceProps {
  workoutContext?: WorkoutContext;
  onClose?: () => void;
  className?: string;
}

export const AIChatInterface: React.FC<AIChatInterfaceProps> = ({
  workoutContext,
  onClose,
  className = ''
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState<string>('');
  const [mcpEnabled, setMcpEnabled] = useState(true);
  
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
      
      // Speak the response
      if (!isMuted) {
        speak(fullResponse);
      }
    }
  });

  const {
    processMultimodalInput,
    lookupExercise,
    trackProgress,
    analyzeBiometrics,
    loading: mcpLoading
  } = useMCPTools();

  const [inputValue, setInputValue] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    speak,
    isSupported
  } = useVoice();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentStreamingMessage]);

  // Add initial greeting
  useEffect(() => {
    const greeting: Message = {
      id: 'initial',
      type: 'ai',
      content: `Hey there! 🎯 I'm your AI fitness coach${mcpEnabled ? ' with advanced intelligence' : ''}. I can help you with:\n\n• Workout plans & exercises 💪\n• Form tips & technique 🏋️\n• Nutrition advice 🥗\n• Progress tracking 📈\n\n${workoutContext ? `I see you're ${workoutContext.isActive ? 'crushing a workout right now' : 'planning your next session'}! ` : ''}What's on your mind?`,
      timestamp: new Date()
    };
    setMessages([greeting]);
  }, [workoutContext, mcpEnabled]);

  // Handle voice transcript
  useEffect(() => {
    if (transcript && !isListening) {
      setInputValue(transcript);
      // Auto-submit voice input
      handleSubmit(transcript);
    }
  }, [transcript, isListening]);

  const analyzeUserIntent = (message: string): { 
    useTools: boolean; 
    toolType?: 'exercise' | 'progress' | 'biometrics' | 'general' 
  } => {
    const lowerMessage = message.toLowerCase();
    
    // Exercise lookup patterns
    if (lowerMessage.match(/how to|form|technique|proper|exercise|movement/)) {
      return { useTools: true, toolType: 'exercise' };
    }
    
    // Progress tracking patterns
    if (lowerMessage.match(/progress|improvement|gains|stronger|results/)) {
      return { useTools: true, toolType: 'progress' };
    }
    
    // Biometric patterns
    if (lowerMessage.match(/heart rate|recovery|fatigue|tired|sore/)) {
      return { useTools: true, toolType: 'biometrics' };
    }
    
    return { useTools: false };
  };

  const handleSubmit = useCallback(async (inputText?: string) => {
    const messageText = inputText || inputValue.trim();
    if (!messageText || isStreaming) return;

    // Clear input
    setInputValue('');

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: messageText,
      timestamp: new Date(),
      isVoice: !!inputText
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      if (mcpEnabled) {
        // Analyze intent and use MCP tools if appropriate
        const intent = analyzeUserIntent(messageText);
        
        if (intent.useTools) {
          // Use MCP tools for intelligent response
          const mcpResponse = await processMultimodalInput({
            text: messageText,
            metadata: {
              timestamp: new Date(),
              userContext: { intent: intent.toolType },
              workoutState: workoutContext
            }
          });

          const aiMessage: Message = {
            id: `ai-${Date.now()}`,
            type: 'ai',
            content: mcpResponse.content,
            timestamp: new Date(),
            toolsUsed: mcpResponse.tools_used
          };
          setMessages(prev => [...prev, aiMessage]);
          
          if (!isMuted) {
            speak(mcpResponse.content);
          }
          return;
        }
      }

      // Fall back to streaming AI for general conversation
      const contextInfo = workoutContext ? 
        `User is ${workoutContext.isActive ? 'currently working out' : 'planning a workout'}. ` +
        `${workoutContext.currentExercise ? `Current exercise: ${workoutContext.currentExercise.name}. ` : ''}` +
        `${workoutContext.completedSets ? `Completed sets: ${workoutContext.completedSets}. ` : ''}`
        : '';

      const prompt = `${contextInfo}User asks: ${messageText}. 
        Provide a helpful, encouraging response as a fitness coach.
        ${mcpEnabled ? 'Note: MCP tools are available for specific queries about exercises, progress, or biometrics.' : ''}`;

      await streamResponse(prompt);
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: 'ai',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  }, [inputValue, isStreaming, streamResponse, workoutContext, speak, isMuted, mcpEnabled, processMultimodalInput]);

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Example prompts
  const examplePrompts = [
    "How do I improve my squat form?",
    "What's a good beginner workout?",
    "How can I increase my bench press?",
    "What should I eat after working out?",
    "How do I track my progress?"
  ];

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">AI Coach</h2>
            <p className="text-gray-400 mt-1">Your personal fitness assistant</p>
          </div>
          <div className="flex items-center gap-2">
            {mcpEnabled && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-900/30 rounded-lg backdrop-blur-sm">
                <Brain className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-medium text-purple-400">MCP Active</span>
              </div>
            )}
            <button
              onClick={() => setMcpEnabled(!mcpEnabled)}
              className={`p-2 rounded-lg transition-all ${
                mcpEnabled 
                  ? 'bg-purple-900/30 text-purple-400 hover:bg-purple-900/40' 
                  : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800/60'
              }`}
              title="Toggle Advanced AI"
            >
              <Activity className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-lg transition-all ${
                isMuted 
                  ? 'bg-gray-800/50 text-gray-400 hover:bg-gray-800/60' 
                  : 'bg-lime-900/30 text-lime-400 hover:bg-lime-900/40'
              }`}
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.type === 'ai' && (
              <div className="w-8 h-8 rounded-lg bg-lime-900/30 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-lime-400" />
              </div>
            )}
            
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                message.type === 'user'
                  ? 'bg-lime-400 text-black'
                  : 'bg-gray-800/50 text-gray-100'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.toolsUsed && message.toolsUsed.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-700">
                  <p className="text-xs text-gray-400">
                    Used: {message.toolsUsed.join(', ')}
                  </p>
                </div>
              )}
              {message.isVoice && (
                <Mic className="w-3 h-3 inline-block ml-2 opacity-50" />
              )}
            </div>
            
            {message.type === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-lime-400 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-black" />
              </div>
            )}
          </div>
        ))}
        
        {/* Streaming message */}
        {currentStreamingMessage && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-lg bg-lime-900/30 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-lime-400" />
            </div>
            <div className="max-w-[70%] rounded-2xl px-4 py-3 bg-gray-800/50 text-gray-100">
              <div className="flex-1">
                  <p className="whitespace-pre-wrap">
                    {currentStreamingMessage}
                  </p>
                  <span className="inline-flex gap-1 mt-2">
                    <span className="w-2 h-2 bg-lime-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-lime-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-lime-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Example prompts */}
      {messages.length === 1 && (
        <div className="px-6 pb-2">
          <p className="text-xs text-gray-500 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {examplePrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => setInputValue(prompt)}
                className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-800 pt-4">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isListening ? "Listening..." : "Ask me anything about fitness..."}
            disabled={isStreaming || mcpLoading || isListening}
            className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-lime-400 transition-colors"
          />
          
          {isSupported && (
            <button
              onClick={handleVoiceToggle}
              disabled={isStreaming}
              className={`p-3 rounded-xl transition-all ${
                isListening 
                  ? 'bg-red-900/30 text-red-400 hover:bg-red-900/40 animate-pulse' 
                  : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800/60'
              } disabled:opacity-50`}
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
          
          <button
            onClick={() => handleSubmit()}
            disabled={!inputValue.trim() || isStreaming || mcpLoading}
            className={`p-3 rounded-xl transition-all ${
              inputValue.trim() && !isStreaming && !mcpLoading
                ? 'bg-lime-400 text-black hover:bg-lime-500' 
                : 'bg-gray-800/50 text-gray-600'
            } disabled:cursor-not-allowed`}
          >
            {isStreaming || mcpLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatInterface;