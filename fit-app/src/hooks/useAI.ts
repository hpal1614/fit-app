import { useState, useCallback } from 'react';
import { AICoachService } from '../services/aiService';

const aiService = AICoachService.getInstance();

export const useAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const askCoach = useCallback(async (message: string, context?: Record<string, unknown>) => {
    console.log('🤖 AI Request:', message);
    setIsLoading(true);
    setError(null);

    try {
      const response = await Promise.race([
        aiService.getCoachingResponse(message, context || { userPreferences: { defaultWeightUnit: 'kg', defaultRestTime: 60, autoRestTimer: true, showPersonalRecords: true, enableVoiceCommands: true, warmupRequired: true, trackRPE: true, roundingPreference: 'exact', plateCalculation: true, notifications: { restComplete: true, personalRecord: true, workoutReminders: true } } }, 'general-advice'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI timeout')), 5000)
        )
      ]);
      
      console.log('✅ AI Response:', response);
      return response;
    } catch (_err) {
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
    isAvailable: true // Always available with fallbacks
  };
};
export type UseAIReturn = ReturnType<typeof useAI>;
