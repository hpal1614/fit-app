import { useState, useCallback } from 'react';
import { AICoachService } from '../services/aiService';
import type { AIResponse } from '../types/ai';

// Types for the hook return value
export interface UseAIReturn {
  askCoach: (message: string, context?: any) => Promise<AIResponse>;
  isLoading: boolean;
  error: Error | null;
  isAvailable: boolean;
  loadingProvider: string | null;
  teamStatus: {
    openrouter: 'idle' | 'trying' | 'success' | 'failed';
    groq: 'idle' | 'trying' | 'success' | 'failed';
    google: 'idle' | 'trying' | 'success' | 'failed';
  };
}

const aiService = AICoachService.getInstance();

export const useAI = (): UseAIReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Track which provider is currently being used
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  // Track AI team status for UI indicators
  const [teamStatus, setTeamStatus] = useState<UseAIReturn['teamStatus']>({
    openrouter: 'idle',
    groq: 'idle',
    google: 'idle'
  });

  const askCoach = useCallback(async (message: string, context: any = {}): Promise<AIResponse> => {
    console.log('🤖 AI Request:', message);
    setIsLoading(true);
    setError(null);

    // Assume OpenRouter will be tried first
    setLoadingProvider('openrouter');
    setTeamStatus({ openrouter: 'trying', groq: 'idle', google: 'idle' });

    try {
      const response = await Promise.race([
        aiService.getCoachingResponse(message, context, 'general-advice'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI timeout')), 5000)
        )
      ]);
      
      console.log('✅ AI Response:', response);
      // Mark provider success
      setTeamStatus((prev) => ({ ...prev, openrouter: 'success' }));
      setLoadingProvider(null);
      return response as AIResponse;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('AI request failed');
      console.error('❌ AI Error:', errorObj.message);
      setError(errorObj);

      // Mark provider failed
      setTeamStatus((prev) => ({ ...prev, openrouter: 'failed' }));
      setLoadingProvider(null);
      
      // Emergency fallback response
      return {
        content: "I'm here to help with your fitness journey! Ask me about workouts, exercises, or nutrition.",
        type: 'general-advice',
        confidence: 0.5,
        timestamp: new Date(),
        isComplete: true,
        metadata: { provider: 'error-fallback' }
      } as AIResponse;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    askCoach,
    isLoading,
    loadingProvider,
    teamStatus,
    error,
    isAvailable: true // Always available with fallbacks
  };
};
