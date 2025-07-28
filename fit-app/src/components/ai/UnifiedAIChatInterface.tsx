import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Mic, MicOff, Loader, Settings, Server, Sparkles } from 'lucide-react';
import { unifiedAIService } from '../../services/ai/UnifiedAIService';
import { mcpService } from '../../services/ai/MCPService';
import { useVoice } from '../../hooks/useVoice';
import type { StreamingMessage, WorkoutContext, MCPServer } from '../../types/ai';
import '../../styles/theme.css';

interface AIChatInterfaceProps {
  theme?: 'black-green';
  enableVoice?: boolean;
  enableMCP?: boolean;
  workoutContext?: WorkoutContext;
}

export const AIChatInterface: React.FC<AIChatInterfaceProps> = ({
  theme = 'black-green',
  enableVoice = true,
  enableMCP = true,
  workoutContext
}) => {
  const [messages, setMessages] = useState<StreamingMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [mcpServers, setMCPServers] = useState<MCPServer[]>([]);
  const [showMCPPanel, setShowMCPPanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    speak
  } = useVoice();

  // Initialize MCP servers on mount
  useEffect(() => {
    if (enableMCP) {
      initializeMCPServers();
    }
  }, [enableMCP]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle voice transcript
  useEffect(() => {
    if (transcript && isListening) {
      setInputValue(transcript);
    }
  }, [transcript, isListening]);

  const initializeMCPServers = async () => {
    try {
      await mcpService.connectFitnessDatabase();
      await mcpService.connectNutritionAPI();
      const servers = await mcpService.listServers();
      setMCPServers(servers);
    } catch (error) {
      console.error('Failed to initialize MCP servers:', error);
    }
  };

  const handleSendMessage = async () => {
    const message = inputValue.trim();
    if (!message || isStreaming) return;

    // Add user message
    const userMessage: StreamingMessage = {
      role: 'user',
      content: message,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsStreaming(true);

    // Create assistant message placeholder
    const assistantMessage: StreamingMessage = {
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      streaming: true
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      console.log('📤 Sending message to AI:', message);
      
      // Stream response
      const stream = unifiedAIService.streamResponse(message, {
        workoutContext,
        conversationHistory: messages,
        mcpEnabled: enableMCP && mcpServers.length > 0
      });

      let fullResponse = '';
      let chunkCount = 0;
      
      for await (const chunk of stream) {
        chunkCount++;
        fullResponse += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === 'assistant') {
            lastMessage.content = fullResponse;
          }
          return newMessages;
        });
      }

      console.log(`✅ Received ${chunkCount} chunks, total response length: ${fullResponse.length}`);

      // Mark streaming complete
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.role === 'assistant') {
          lastMessage.streaming = false;
        }
        return newMessages;
      });

      // Speak response if voice is enabled
      if (enableVoice && fullResponse) {
        speak(fullResponse);
      }
    } catch (error) {
      console.error('❌ Error streaming response:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.role === 'assistant') {
          lastMessage.content = `Sorry, I encountered an error: ${error.message || 'Unknown error'}. Please check the console for details.`;
          lastMessage.streaming = false;
        }
        return newMessages;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const renderMessage = (message: StreamingMessage, index: number) => {
    const isUser = message.role === 'user';
    
    return (
      <div
        key={index}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div
          className={`max-w-[80%] ${isUser ? 'message-user' : 'message-ai'}`}
          style={{
            animation: message.streaming ? 'pulse 1.5s ease-in-out infinite' : undefined
          }}
        >
          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
          {message.streaming && (
            <div className="flex items-center gap-1 mt-2">
              <Loader size={12} className="animate-spin" />
              <span className="text-xs opacity-60">Thinking...</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-2">
          <Sparkles size={20} style={{ color: 'var(--primary-green)' }} />
          <h2 className="text-lg font-bold">AI Fitness Coach</h2>
        </div>
        
        {enableMCP && (
          <button
            onClick={() => setShowMCPPanel(!showMCPPanel)}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            style={{ color: mcpServers.length > 0 ? 'var(--primary-green)' : 'var(--gray-light)' }}
          >
            <Server size={20} />
          </button>
        )}
      </div>

      {/* MCP Panel */}
      {showMCPPanel && enableMCP && (
        <div className="p-4 border-b" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--primary-green)' }}>
            MCP Connections
          </h3>
          <div className="space-y-2">
            {mcpServers.map(server => (
              <div key={server.name} className="flex items-center justify-between text-sm">
                <span>{server.name}</span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: server.connected ? 'var(--primary-green)' : 'var(--error)' }}
                  />
                  <span style={{ color: 'var(--gray-light)' }}>
                    {server.capabilities.length} tools
                  </span>
                </div>
              </div>
            ))}
            {mcpServers.length === 0 && (
              <p className="text-sm" style={{ color: 'var(--gray-light)' }}>
                No MCP servers connected
              </p>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Sparkles size={48} className="mx-auto mb-4" style={{ color: 'var(--primary-green)' }} />
            <h3 className="text-xl font-bold mb-2">Welcome to AI Fitness Coach!</h3>
            <p style={{ color: 'var(--gray-light)' }}>
              Ask me anything about workouts, nutrition, or fitness goals.
            </p>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 mt-6 max-w-md mx-auto">
              <button
                onClick={() => setInputValue("Create a workout plan for building muscle")}
                className="btn-secondary text-sm py-3"
              >
                💪 Build Muscle
              </button>
              <button
                onClick={() => setInputValue("What should I eat for weight loss?")}
                className="btn-secondary text-sm py-3"
              >
                🥗 Nutrition Tips
              </button>
              <button
                onClick={() => setInputValue("How do I improve my bench press form?")}
                className="btn-secondary text-sm py-3"
              >
                📐 Form Check
              </button>
              <button
                onClick={() => setInputValue("I need motivation to workout today")}
                className="btn-secondary text-sm py-3"
              >
                🔥 Motivation
              </button>
            </div>
          </div>
        )}
        
        {messages.map((message, index) => renderMessage(message, index))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-2">
          {enableVoice && (
            <button
              onClick={toggleVoice}
              className={`p-3 rounded-lg transition-all ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'hover:bg-gray-800'
              }`}
              style={{ 
                background: isListening ? 'var(--error)' : 'var(--card-bg)',
                color: isListening ? 'white' : 'var(--gray-light)'
              }}
            >
              {isListening ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
          )}
          
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about fitness..."
            className="flex-1 input"
            disabled={isStreaming}
          />
          
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isStreaming}
            className="btn-primary p-3"
            style={{
              opacity: (!inputValue.trim() || isStreaming) ? 0.5 : 1,
              cursor: (!inputValue.trim() || isStreaming) ? 'not-allowed' : 'pointer'
            }}
          >
            {isStreaming ? <Loader size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
        
        {isListening && (
          <div className="mt-2 text-sm" style={{ color: 'var(--primary-green)' }}>
            🎤 Listening...
          </div>
        )}
      </div>
    </div>
  );
};