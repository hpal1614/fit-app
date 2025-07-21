import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  AIResponse,
  AIRequestType,
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
  personalityProfile?: 'supportive' | 'motivational' | 'technical' | 'casual';
  responseStyle?: 'conversational' | 'concise' | 'detailed';
}

export interface UseAIReturn {
  // State
  isLoading: boolean;
  error: AIError | null;
  lastResponse: AIResponse | null;
  
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

  // Generic AI coaching function
  const askCoach = useCallback(async (
    message: string, 
    context?: WorkoutContext
  ): Promise<AIResponse> => {
    if (!aiServiceRef.current) {
      throw new Error('AI service not available');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await aiServiceRef.current.getResponse({
        type: 'general',
        message,
        context,
        timestamp: new Date()
      });

      setLastResponse(response);
      return response;
    } catch (err) {
      const error: AIError = {
        type: 'request_error',
        message: err instanceof Error ? err.message : 'Failed to get AI response',
        timestamp: new Date(),
        recoverable: true
      };
      
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
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
      const response = await aiServiceRef.current.analyzeForm({
        exercise,
        videoData,
        timestamp: new Date()
      });

      if (response.content) {
        return response as unknown as FormAnalysis;
      }
      
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

      if (response.type === 'nutrition' && response.data) {
        return response.data as NutritionAdvice;
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

      if (response.type === 'motivation' && response.data) {
        return response.data as MotivationalMessage;
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

      if (response.type === 'workout_plan' && response.data) {
        return response.data as WorkoutPlan;
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

      if (response.type === 'progression' && response.data) {
        return response.data as Progression;
      }
      
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