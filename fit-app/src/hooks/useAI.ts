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

  const generateCoachingSuggestion = useCallback(async (params: {
    exercise: string;
    currentWeight: number;
    reps: number;
    difficulty: number;
    userHistory: any[];
    nextExercise?: string;
    feedback?: 'too_easy' | 'perfect' | 'too_hard';
  }) => {
    try {
      const suggestion = await aiService.generateCoachingSuggestion(params);
      return suggestion;
    } catch (err) {
      console.error('Error generating coaching suggestion:', err);
      return null;
    }
  }, []);

  const parseVoiceCommand = useCallback(async (
    transcription: string,
    context: {
      currentExercise: string;
      expectedWeight: number;
      expectedReps: number;
      context: string;
    }
  ) => {
    try {
      const command = await aiService.parseVoiceCommand(transcription, context);
      return command;
    } catch (err) {
      console.error('Error parsing voice command:', err);
      return null;
    }
  }, []);

  return {
    askCoach,
    generateCoachingSuggestion,
    parseVoiceCommand,
    isLoading,
    error,
    isAvailable: true // Always available with fallbacks
  };
};
export type UseAIReturn = ReturnType<typeof useAI>;
