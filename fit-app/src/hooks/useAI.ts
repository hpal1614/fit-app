import { useState, useCallback } from 'react';
import { AICoachService } from '../services/aiService';
import { AIFallbackService } from '../services/fallbackService';

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
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'AI request failed';
      console.error('❌ AI Error:', errorMsg);
      setError(errorMsg);
      
      // Use comprehensive fallback service
      const fallbackResponse = AIFallbackService.generateFallbackResponse(
        'general-advice',
        context,
        errorMsg
      );
      
      return fallbackResponse;
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
