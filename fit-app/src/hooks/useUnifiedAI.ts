import { useState, useEffect, useCallback, useRef } from 'react';
import { unifiedAIService } from '../services/ai/UnifiedAIService';
import { mcpService } from '../services/ai/MCPService';
import { unifiedVoiceService } from '../services/ai/UnifiedVoiceService';
import type { StreamingMessage, MCPServer, WorkoutContext } from '../types/ai';

interface UseUnifiedAIOptions {
  enableMCP?: boolean;
  enableVoice?: boolean;
  workoutContext?: WorkoutContext;
}

export const useUnifiedAI = (options: UseUnifiedAIOptions = {}) => {
  const { enableMCP = true, enableVoice = true, workoutContext } = options;
  
  const [messages, setMessages] = useState<StreamingMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [mcpServers, setMCPServers] = useState<MCPServer[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      // Initialize MCP if enabled
      if (enableMCP) {
        try {
          await mcpService.connectFitnessDatabase();
          await mcpService.connectNutritionAPI();
          const servers = await mcpService.listServers();
          setMCPServers(servers);
        } catch (error) {
          console.error('Failed to initialize MCP:', error);
        }
      }

      // Setup voice listeners if enabled
      if (enableVoice) {
        unifiedVoiceService.on('recognition:interim', (text: string) => {
          setTranscript(text);
        });
        
        unifiedVoiceService.on('recognition:final', (text: string) => {
          setTranscript(text);
        });
        
        unifiedVoiceService.on('recognition:start', () => {
          setIsListening(true);
        });
        
        unifiedVoiceService.on('recognition:end', () => {
          setIsListening(false);
        });
        
        unifiedVoiceService.on('synthesis:start', () => {
          setIsSpeaking(true);
        });
        
        unifiedVoiceService.on('synthesis:end', () => {
          setIsSpeaking(false);
        });
      }
    };

    initializeServices();

    // Cleanup
    return () => {
      if (enableVoice) {
        unifiedVoiceService.removeAllListeners();
      }
    };
  }, [enableMCP, enableVoice]);

  // Send message with streaming response
  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isStreaming) return;

    // Cancel any ongoing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    // Add user message
    const userMessage: StreamingMessage = {
      role: 'user',
      content: message,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMessage]);
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
      const stream = unifiedAIService.streamResponse(message, {
        workoutContext,
        conversationHistory: messages,
        mcpEnabled: enableMCP && mcpServers.length > 0
      });

      let fullResponse = '';
      for await (const chunk of stream) {
        if (abortControllerRef.current?.signal.aborted) break;
        
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
      if (enableVoice && !abortControllerRef.current?.signal.aborted) {
        await speak(fullResponse);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error in AI response:', error);
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === 'assistant') {
            lastMessage.content = 'Sorry, I encountered an error. Please try again.';
            lastMessage.streaming = false;
          }
          return newMessages;
        });
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [messages, isStreaming, workoutContext, enableMCP, mcpServers, enableVoice]);

  // Voice control methods
  const startListening = useCallback(() => {
    if (enableVoice) {
      unifiedVoiceService.startListening();
    }
  }, [enableVoice]);

  const stopListening = useCallback(() => {
    if (enableVoice) {
      unifiedVoiceService.stopListening();
    }
  }, [enableVoice]);

  const speak = useCallback(async (text: string) => {
    if (enableVoice) {
      try {
        await unifiedVoiceService.speak(text);
      } catch (error) {
        console.error('Speech synthesis error:', error);
      }
    }
  }, [enableVoice]);

  const stopSpeaking = useCallback(() => {
    if (enableVoice) {
      unifiedVoiceService.cancelSpeech();
    }
  }, [enableVoice]);

  // Process voice command
  const processVoiceCommand = useCallback((transcript: string) => {
    const command = unifiedVoiceService.processVoiceCommand(transcript);
    if (command) {
      // Handle specific commands
      switch (command.command) {
        case 'log_exercise':
          // TODO: Integrate with workout service
          console.log('Log exercise:', command.parameters);
          break;
        case 'start_workout':
          // TODO: Integrate with workout service
          console.log('Start workout');
          break;
        case 'end_workout':
          // TODO: Integrate with workout service
          console.log('End workout');
          break;
        case 'start_timer':
          // TODO: Integrate with timer service
          console.log('Start timer:', command.parameters);
          break;
        default:
          // Send as general query
          sendMessage(transcript);
      }
    }
  }, [sendMessage]);

  // MCP methods
  const callMCPTool = useCallback(async (serverName: string, toolName: string, args: any) => {
    if (!enableMCP) return null;
    
    try {
      return await mcpService.callTool(serverName, toolName, args);
    } catch (error) {
      console.error('MCP tool call error:', error);
      return null;
    }
  }, [enableMCP]);

  const getMCPResource = useCallback(async (serverName: string, resourcePath: string) => {
    if (!enableMCP) return null;
    
    try {
      return await mcpService.getResource(serverName, resourcePath);
    } catch (error) {
      console.error('MCP resource fetch error:', error);
      return null;
    }
  }, [enableMCP]);

  // Clear conversation
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Cancel ongoing operations
  const cancelOperations = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (isListening) {
      stopListening();
    }
    if (isSpeaking) {
      stopSpeaking();
    }
  }, [isListening, isSpeaking, stopListening, stopSpeaking]);

  return {
    // State
    messages,
    isStreaming,
    mcpServers,
    isListening,
    transcript,
    isSpeaking,
    
    // Methods
    sendMessage,
    clearMessages,
    cancelOperations,
    
    // Voice methods
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    processVoiceCommand,
    
    // MCP methods
    callMCPTool,
    getMCPResource,
    
    // Service access
    aiService: unifiedAIService,
    mcpService,
    voiceService: unifiedVoiceService
  };
};