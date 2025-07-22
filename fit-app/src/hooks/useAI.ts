import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  AIResponse,
  FormAnalysis,
  NutritionAdvice,
  MotivationalMessage,
  WorkoutPlan,
  Progression,
  AIError
} from '../types/ai';
import type { WorkoutContext, Exercise } from '../types/workout';
import { AICoachService } from '../services/aiService';

interface UseAIOptions {
  enableCaching?: boolean;
  enableAnalytics?: boolean;
  personalityProfile?: 'supportive' | 'motivational' | 'analytical' | 'friendly';
  responseStyle?: 'conversational' | 'concise' | 'detailed';
}

// Team Status Interface for real-time monitoring
interface TeamStatus {
  openrouter: 'idle' | 'trying' | 'success' | 'failed';
  groq: 'idle' | 'trying' | 'success' | 'failed';
  google: 'idle' | 'trying' | 'success' | 'failed';
}

export interface UseAIReturn {
  // State
  isLoading: boolean;
  error: AIError | null;
  lastResponse: AIResponse | null;
  
  // Team monitoring - NEW
  loadingProvider: string | null;
  teamStatus: TeamStatus;
  
  // General coaching
  askCoach: (message: string, context?: WorkoutContext) => Promise<AIResponse>;
  
  // Specialized coaching functions
  getFormFeedback: (exercise: Exercise, videoData?: any) => Promise<FormAnalysis>;
  getNutritionAdvice: (query: string, userProfile?: any) => Promise<NutritionAdvice>;
  getMotivation: (context?: WorkoutContext) => Promise<MotivationalMessage>;
  planWorkout: (preferences: any, context?: WorkoutContext) => Promise<WorkoutPlan>;
  getProgression: (exerciseId: string, currentLevel: any) => Promise<Progression>;
  
  // Utility functions
  clearError: () => void;
  isAvailable: boolean;
}

export const useAI = (options: UseAIOptions = {}): UseAIReturn => {
  const {
    enableCaching = true,
    enableAnalytics = true,
    personalityProfile = 'supportive',
    responseStyle = 'conversational'
  } = options;

  const aiServiceRef = useRef<AICoachService | null>(null);
  
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AIError | null>(null);
  const [lastResponse, setLastResponse] = useState<AIResponse | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  
  // Team monitoring state - NEW
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [teamStatus, setTeamStatus] = useState<TeamStatus>({
    openrouter: 'idle',
    groq: 'idle', 
    google: 'idle'
  });

  // Initialize AI service
  useEffect(() => {
    const initializeAI = async () => {
      try {
        const aiService = AICoachService.getInstance();
        aiServiceRef.current = aiService;

        // Configure service
        const initialized = await aiService.initialize({
          enableCaching,
          enableAnalytics,
          personalityProfile,
          responseStyle,
          // API keys will be loaded from environment variables
          apiKey: import.meta.env.VITE_OPENAI_API_KEY || 
                   import.meta.env.VITE_OPENROUTER_API_KEY ||
                   import.meta.env.VITE_GROQ_API_KEY ||
                   import.meta.env.VITE_GOOGLE_AI_API_KEY
        });

        setIsAvailable(initialized);
      } catch (err) {
        setError({
          type: 'initialization_error',
          message: 'Failed to initialize AI coach service',
          timestamp: new Date(),
          recoverable: false
        });
      }
    };

    initializeAI();
  }, [enableCaching, enableAnalytics, personalityProfile, responseStyle]);

  // Generic AI coaching function with TEAM MONITORING AND STRICT TIMEOUT
  const askCoach = useCallback(async (
    message: string, 
    context?: WorkoutContext
  ): Promise<AIResponse> => {
    if (!aiServiceRef.current) {
      throw new Error('AI service not available');
    }

    // NEVER hang in loading state - max 5 seconds
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
      setLoadingProvider(null);
      throw new Error('Loading timeout - AI team took too long');
    }, 5000);

    setIsLoading(true);
    setError(null);
    
    // Reset team status
    setTeamStatus({
      openrouter: 'idle',
      groq: 'idle',
      google: 'idle'
    });

    try {
      // Monitor team status during request
      const statusInterval = setInterval(() => {
        if (aiServiceRef.current) {
          setTeamStatus(aiServiceRef.current.getTeamStatus());
          setLoadingProvider(aiServiceRef.current.getCurrentProvider());
        }
      }, 100);

      const response = await aiServiceRef.current.getCoachingResponse(message, context || {} as WorkoutContext, 'general-advice');
      
      clearInterval(statusInterval);
      clearTimeout(loadingTimeout);
      
      setLastResponse(response);
      setLoadingProvider(null);
      
      return response;
      
    } catch (err) {
      clearTimeout(loadingTimeout);
      
      const error: AIError = {
        type: 'request_error',
        message: err instanceof Error ? err.message : 'AI team request failed',
        timestamp: new Date(),
        recoverable: true
      };
      
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  }, []);

  // Form analysis
  const getFormFeedback = useCallback(async (
    exercise: Exercise,
    videoData?: any
  ): Promise<FormAnalysis> => {
    if (!aiServiceRef.current) {
      throw new Error('AI service not available');
    }

    setIsLoading(true);
    setError(null);

    try {
              const response = await aiServiceRef.current.analyzeForm(exercise, videoData);

      return response;
      
      throw new Error('Invalid form analysis response');
    } catch (err) {
      const error: AIError = {
        type: 'analysis_error',
        message: err instanceof Error ? err.message : 'Failed to analyze form',
        timestamp: new Date(),
        recoverable: true
      };
      
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Nutrition advice
  const getNutritionAdvice = useCallback(async (
    query: string,
    userProfile?: any
  ): Promise<NutritionAdvice> => {
    if (!aiServiceRef.current) {
      throw new Error('AI service not available');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await aiServiceRef.current.getNutritionAdvice({
        query,
        userProfile,
        timestamp: new Date()
      });

      if (response.content) {
        return response as unknown as NutritionAdvice;
      }
      
      throw new Error('Invalid nutrition advice response');
    } catch (err) {
      const error: AIError = {
        type: 'request_error',
        message: err instanceof Error ? err.message : 'Failed to get nutrition advice',
        timestamp: new Date(),
        recoverable: true
      };
      
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Motivational messages
  const getMotivation = useCallback(async (
    context?: WorkoutContext
  ): Promise<MotivationalMessage> => {
    if (!aiServiceRef.current) {
      throw new Error('AI service not available');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await aiServiceRef.current.getMotivation({
        context,
        timestamp: new Date()
      });

      if (response.content) {
        return response as unknown as MotivationalMessage;
      }
      
      throw new Error('Invalid motivation response');
    } catch (err) {
      const error: AIError = {
        type: 'request_error',
        message: err instanceof Error ? err.message : 'Failed to get motivation',
        timestamp: new Date(),
        recoverable: true
      };
      
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Workout planning
  const planWorkout = useCallback(async (
    preferences: any,
    context?: WorkoutContext
  ): Promise<WorkoutPlan> => {
    if (!aiServiceRef.current) {
      throw new Error('AI service not available');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await aiServiceRef.current.planWorkout({
        preferences,
        context,
        timestamp: new Date()
      });

      if (response.content) {
        return response as unknown as WorkoutPlan;
      }
      
      throw new Error('Invalid workout plan response');
    } catch (err) {
      const error: AIError = {
        type: 'planning_error',
        message: err instanceof Error ? err.message : 'Failed to plan workout',
        timestamp: new Date(),
        recoverable: true
      };
      
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Progression analysis
  const getProgression = useCallback(async (
    exerciseId: string,
    currentLevel: any
  ): Promise<Progression> => {
    if (!aiServiceRef.current) {
      throw new Error('AI service not available');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await aiServiceRef.current.getProgression({
        exerciseId,
        currentLevel,
        timestamp: new Date()
      });

      return response;
      
      throw new Error('Invalid progression response');
    } catch (err) {
      const error: AIError = {
        type: 'analysis_error',
        message: err instanceof Error ? err.message : 'Failed to get progression advice',
        timestamp: new Date(),
        recoverable: true
      };
      
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Error management
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isLoading,
    error,
    lastResponse,
    
    // Team monitoring - NEW
    loadingProvider,
    teamStatus,
    
    // General coaching
    askCoach,
    
    // Specialized functions
    getFormFeedback,
    getNutritionAdvice,
    getMotivation,
    planWorkout,
    getProgression,
    
    // Utility
    clearError,
    isAvailable
  };
};

export default useAI;