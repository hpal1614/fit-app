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
      content: `Hello! I'm your AI fitness coach${mcpEnabled ? ' with MCP intelligence' : ''}. I can help you with workouts, exercises, form tips, nutrition advice, and track your progress. ${workoutContext ? `I see you're ${workoutContext.isActive ? 'currently working out' : 'planning a workout'}. ` : ''}What would you like to know?`,
      timestamp: new Date()
    };
    setMessages([greeting]);
  }, [workoutContext]);

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
    <div className={`flex flex-col h-full bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bot className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">AI Coach</h2>
            {mcpEnabled && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-purple-100 rounded-full">
                <Brain className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-medium text-purple-700">MCP</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {/* MCP Toggle */}
            <button
              onClick={() => setMcpEnabled(!mcpEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                mcpEnabled ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'
              }`}
              title="Toggle MCP Intelligence"
            >
              <Activity className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-lg transition-colors ${
                isMuted ? 'bg-gray-100 text-gray-400' : 'bg-indigo-100 text-indigo-600'
              }`}
            >
              <Volume2 className="w-5 h-5" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                message.type === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-900'
              }`}
            >
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 mt-0.5">
                  {message.type === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4 text-indigo-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.isVoice && (
                    <div className="flex items-center space-x-1 mt-1">
                      <Mic className="w-3 h-3 opacity-60" />
                      <span className="text-xs opacity-60">Voice</span>
                    </div>
                  )}
                  {message.toolsUsed && message.toolsUsed.length > 0 && (
                    <div className="flex items-center space-x-1 mt-1">
                      <Brain className="w-3 h-3 opacity-60" />
                      <span className="text-xs opacity-60">
                        Used: {message.toolsUsed.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Streaming message */}
        {currentStreamingMessage && (
          <div className="flex justify-start">
            <div className="max-w-[70%] rounded-2xl px-4 py-3 bg-white border border-gray-200">
              <div className="flex items-start space-x-2">
                <Bot className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {currentStreamingMessage}
                  </p>
                  <div className="flex items-center space-x-1 mt-1">
                    <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                    <span className="text-xs text-gray-500">Thinking...</span>
                  </div>
                </div>
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

      {/* Input */}
      <div className="border-t border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask your AI coach anything..."
            disabled={isStreaming || mcpLoading}
            className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          />
          {isSupported && (
            <button
              onClick={handleVoiceToggle}
              disabled={isStreaming}
              className={`p-2 rounded-full transition-colors ${
                isListening
                  ? 'bg-red-100 text-red-600 animate-pulse'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              } disabled:opacity-50`}
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => handleSubmit()}
            disabled={!inputValue.trim() || isStreaming || mcpLoading}
            className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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