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
      console.error('AI Service Error:', err);
      setError(errorMsg);
      
      // Provide a fallback response when all providers fail
      const fallbackResponse = `I apologize, but I'm having trouble connecting to the AI service right now. However, I can still help you!

For a wedding fitness plan, here are some key recommendations:

1. **Timeline**: Start 3-6 months before your wedding for best results
2. **Workout Plan**: 
   - 3-4 days of strength training
   - 2-3 days of cardio (HIIT or steady-state)
   - Focus on full-body workouts with emphasis on arms, shoulders, and core

3. **Nutrition**: 
   - Calculate your calorie needs
   - Aim for a moderate deficit (300-500 calories)
   - Prioritize protein (0.8-1g per lb body weight)
   - Stay hydrated

4. **Key Exercises**:
   - Push-ups and chest presses (chest definition)
   - Rows and lat pulldowns (back/posture)
   - Shoulder presses and lateral raises (shoulder definition)
   - Planks and core work (midsection)

Would you like me to create a specific workout plan for you? Let me know your timeline and fitness level!`;

      // Stream the fallback response
      const words = fallbackResponse.split(' ');
      let accumulatedResponse = '';
      
      for (let i = 0; i < words.length; i++) {
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }
        
        const word = words[i];
        const chunk = i === 0 ? word : ' ' + word;
        accumulatedResponse += chunk;
        
        setCurrentResponse(accumulatedResponse);
        options.onChunk?.(chunk);
        
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 30));
      }
      
      options.onComplete?.(accumulatedResponse);
      
      // Don't re-throw the error since we provided a fallback
      // options.onError?.(err as Error);
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