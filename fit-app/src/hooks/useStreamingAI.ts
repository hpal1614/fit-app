import { useState, useCallback, useRef } from 'react';
import { AICoachService } from '../services/aiService';

interface StreamingAIOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
  workoutContext?: any;
}

// Get AI service instance
const aiService = AICoachService.getInstance();

export const useStreamingAI = (options: StreamingAIOptions = {}) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const streamResponse = useCallback(async (message: string) => {
    console.log('🚀 Starting AI response for:', message);
    
    // Reset state
    setIsStreaming(true);
    setError(null);
    setCurrentResponse('');
    
    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();
    
    try {
      // Call the real AI service
      const response = await aiService.getCoachingResponse(
        message, 
        options.workoutContext || {}, 
        'general-advice'
      );
      
      // Check if response is valid
      if (!response || !response.content) {
        throw new Error('Invalid AI response');
      }
      
      // Simulate streaming effect for better UX
      const fullContent = response.content;
      const words = fullContent.split(' ');
      let accumulatedResponse = '';
      
      // Stream the response word by word
      for (let i = 0; i < words.length; i++) {
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }
        
        const word = words[i];
        const chunk = i === 0 ? word : ' ' + word;
        accumulatedResponse += chunk;
        
        // Update state and call callbacks
        setCurrentResponse(accumulatedResponse);
        options.onChunk?.(chunk);
        
        // Simulate typing delay (20-50ms per word for faster response)
        await new Promise(resolve => setTimeout(resolve, Math.random() * 30 + 20));
      }
      
      // Add metadata if available
      if (response.metadata) {
        const metadataText = `\n\n[Provider: ${response.metadata.provider || 'AI'}, Model: ${response.metadata.model || 'Unknown'}]`;
        accumulatedResponse += metadataText;
        setCurrentResponse(accumulatedResponse);
      }
      
      options.onComplete?.(accumulatedResponse);
      
    } catch (err) {
      console.error('❌ AI Streaming Error:', err);
      const errorMsg = err instanceof Error ? err.message : 'AI service unavailable';
      setError(errorMsg);
      
      // Provide a helpful fallback message
      const fallbackMessage = `I apologize, but I'm having trouble connecting to the AI service right now. ${errorMsg}. Please try again in a moment.`;
      setCurrentResponse(fallbackMessage);
      
      options.onError?.(err as Error);
      options.onComplete?.(fallbackMessage);
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [options]);

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return {
    streamResponse,
    stopStreaming,
    isStreaming,
    currentResponse,
    error
  };
};