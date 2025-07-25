import { useState, useCallback, useRef } from 'react';
import { aiService } from '../services/aiService';
import type { WorkoutContext } from '../types/workout';

interface StreamingAIOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
  workoutContext?: WorkoutContext;
}

export const useStreamingAI = (options: StreamingAIOptions = {}) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const streamResponse = useCallback(async (message: string) => {
    console.log('🚀 Starting streaming response for:', message);
    
    // Reset state
    setIsStreaming(true);
    setError(null);
    setCurrentResponse('');
    
    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();
    
    try {
      // Get response from real AI service
      const response = await aiService.getCoachingResponse(
        message,
        options.workoutContext || {
          activeWorkout: null,
          currentExercise: null,
          currentSet: 0,
          isRecording: false,
          userLevel: 'intermediate',
          preferences: {
            defaultRestTime: 60,
            weightUnit: 'lbs',
            voiceCoaching: true,
            autoStartTimer: true,
            motivationalMessages: true,
            formReminders: true
          }
        }
      );
      
      // Extract content from response
      const responseText = typeof response === 'string' 
        ? response 
        : response.content || 'I can help you with that! Let me create a custom workout plan for you.';
      
      // Simulate streaming like ChatGPT
      const words = responseText.split(' ');
      let accumulatedResponse = '';
      
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
        
        // Simulate typing delay like ChatGPT (30-80ms per word)
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 30));
      }
      
      options.onComplete?.(accumulatedResponse);
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get AI response';
      setError(errorMsg);
      options.onError?.(err as Error);
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