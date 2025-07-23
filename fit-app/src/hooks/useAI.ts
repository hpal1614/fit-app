import { useState, useCallback } from 'react';
import { AICoachService } from '../services/aiService';
import type { AIResponse } from '../types/ai';
import type { WorkoutContext } from '../types/workout';

const aiService = AICoachService.getInstance();

// Export the return type
export interface UseAIReturn {
  askCoach: (message: string, context?: WorkoutContext) => Promise<AIResponse>;
  isLoading: boolean;
  error: string | null;
  isAvailable: boolean;
  loadingProvider: string | null;
  teamStatus: {
    openrouter: 'idle' | 'trying' | 'success' | 'failed';
    groq: 'idle' | 'trying' | 'success' | 'failed';
    google: 'idle' | 'trying' | 'success' | 'failed';
  };
}

export const useAI = (): UseAIReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const askCoach = useCallback(async (message: string, context?: WorkoutContext): Promise<AIResponse> => {
    console.log('🤖 AI Request:', message);
    setIsLoading(true);
    setError(null);

    try {
      const defaultContext: WorkoutContext = {
        userPreferences: {
          defaultWeightUnit: 'kg',
          defaultRestTime: 60,
          autoRestTimer: true,
          showPersonalRecords: true,
          enableVoiceCommands: true,
          warmupRequired: false,
          trackRPE: false,
          roundingPreference: 'nearest_2_5',
          plateCalculation: false,
          notifications: {
            restComplete: true,
            personalRecord: true,
            workoutReminders: true
          }
        }
      };
      
      const response = await Promise.race([
        aiService.getCoachingResponse(message, context || defaultContext, 'general-advice'),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('AI timeout')), 5000)
        )
      ]) as AIResponse;
      
      console.log('✅ AI Response:', response);
      return response;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'AI request failed';
      console.error('❌ AI Error:', errorMsg);
      setError(errorMsg);
      
      // Emergency fallback response
      return {
        content: "I'm here to help with your fitness journey! Ask me about workouts, exercises, or nutrition.",
        type: 'general-advice',
        confidence: 0.5,
        timestamp: new Date(),
        isComplete: true,
        metadata: { provider: 'error-fallback' }
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    askCoach,
    isLoading,
    error,
    isAvailable: true, // Always available with fallbacks
    loadingProvider: aiService.getCurrentProvider(),
    teamStatus: aiService.getTeamStatus()
  };
};
