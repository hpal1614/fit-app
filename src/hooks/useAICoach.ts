import { useState, useCallback, useRef } from 'react';
import { AIResponse, AIRequestType, WorkoutContext, Exercise, FormAnalysis, Progression } from '../types';
import { getAIService } from '../services/aiService';

export function useAICoach() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<AIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<AIResponse[]>([]);

  const aiServiceRef = useRef(getAIService());
  const aiService = aiServiceRef.current;

  // Get coaching response
  const askCoach = useCallback(async (
    query: string,
    context: WorkoutContext,
    requestType: AIRequestType = 'general-advice'
  ): Promise<AIResponse | null> => {
    if (isLoading) return null;

    setIsLoading(true);
    setError(null);

    try {
      const response = await aiService.getCoachingResponse(query, context, requestType);
      setLastResponse(response);
      setConversationHistory(prev => [...prev, response].slice(-10)); // Keep last 10 responses
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get AI response';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [aiService, isLoading]);

  // Get form analysis
  const analyzeForm = useCallback(async (
    exercise: Exercise,
    notes: string = ''
  ): Promise<FormAnalysis | null> => {
    if (isLoading) return null;

    setIsLoading(true);
    setError(null);

    try {
      const analysis = await aiService.analyzeForm(exercise, notes);
      return analysis;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze form';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [aiService, isLoading]);

  // Get progression suggestion
  const suggestProgression = useCallback(async (
    exerciseId: string,
    currentWeight: number,
    currentReps: number
  ): Promise<Progression | null> => {
    if (isLoading) return null;

    setIsLoading(true);
    setError(null);

    try {
      const progression = await aiService.suggestProgression(exerciseId, currentWeight, currentReps);
      return progression;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to suggest progression';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [aiService, isLoading]);

  // Get motivational message
  const getMotivation = useCallback(async (
    context: WorkoutContext,
    situation?: string
  ): Promise<string | null> => {
    const query = situation || 'I need some motivation';
    const response = await askCoach(query, context, 'motivation');
    return response?.content || null;
  }, [askCoach]);

  // Get nutrition advice
  const getNutritionAdvice = useCallback(async (
    query: string,
    context: WorkoutContext
  ): Promise<string | null> => {
    const response = await askCoach(query, context, 'nutrition');
    return response?.content || null;
  }, [askCoach]);

  // Get exercise explanation
  const explainExercise = useCallback(async (
    exercise: Exercise,
    context: WorkoutContext
  ): Promise<string | null> => {
    const query = `Explain how to perform ${exercise.name} correctly`;
    const response = await askCoach(query, context, 'exercise-explanation');
    return response?.content || null;
  }, [askCoach]);

  // Get workout planning advice
  const planWorkout = useCallback(async (
    goals: string[],
    availableTime: number,
    experience: string,
    equipment: string[],
    context: WorkoutContext
  ): Promise<string | null> => {
    const query = `Plan a workout for someone with ${experience} experience, ${availableTime} minutes available, goals: ${goals.join(', ')}, equipment: ${equipment.join(', ')}`;
    const response = await askCoach(query, context, 'workout-planning');
    return response?.content || null;
  }, [askCoach]);

  // Get injury prevention advice
  const getInjuryPrevention = useCallback(async (
    exerciseId: string,
    concerns: string[],
    context: WorkoutContext
  ): Promise<string | null> => {
    const query = `How can I prevent injuries when doing ${exerciseId}? My concerns are: ${concerns.join(', ')}`;
    const response = await askCoach(query, context, 'injury-prevention');
    return response?.content || null;
  }, [askCoach]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear conversation history
  const clearHistory = useCallback(() => {
    setConversationHistory([]);
    setLastResponse(null);
  }, []);

  // Get coaching tips for current workout context
  const getContextualTips = useCallback(async (
    context: WorkoutContext
  ): Promise<string | null> => {
    if (!context.activeWorkout) {
      return await askCoach('Give me general fitness tips', context, 'general-advice');
    }

    if (context.currentExercise) {
      const query = `Give me tips for ${context.currentExercise.exercise.name}`;
      const response = await askCoach(query, context, 'form-analysis');
      return response?.content || null;
    }

    const query = `Give me tips for my current workout: ${context.activeWorkout.name}`;
    const response = await askCoach(query, context, 'general-advice');
    return response?.content || null;
  }, [askCoach]);

  // Generate encouraging message based on progress
  const encourageProgress = useCallback(async (
    context: WorkoutContext,
    recentAchievements: string[] = []
  ): Promise<string | null> => {
    let query = 'Give me encouragement for my fitness journey';
    
    if (recentAchievements.length > 0) {
      query += `. Recent achievements: ${recentAchievements.join(', ')}`;
    }
    
    if (context.activeWorkout) {
      query += `. I'm currently doing ${context.activeWorkout.name}`;
    }

    const response = await askCoach(query, context, 'motivation');
    return response?.content || null;
  }, [askCoach]);

  // Get rest time guidance
  const getRestGuidance = useCallback(async (
    exercise: Exercise,
    setsDone: number,
    targetSets: number,
    context: WorkoutContext
  ): Promise<string | null> => {
    const query = `How long should I rest after completing ${setsDone} sets of ${exercise.name}? I have ${targetSets - setsDone} sets remaining.`;
    const response = await askCoach(query, context, 'general-advice');
    return response?.content || null;
  }, [askCoach]);

  // Get weight adjustment advice
  const getWeightAdjustment = useCallback(async (
    exercise: Exercise,
    currentWeight: number,
    repsCompleted: number,
    targetReps: number,
    difficulty: number, // 1-5 scale
    context: WorkoutContext
  ): Promise<string | null> => {
    const difficultyText = ['very easy', 'easy', 'just right', 'hard', 'very hard'][difficulty - 1];
    const query = `I just did ${exercise.name} at ${currentWeight} lbs for ${repsCompleted} reps (target was ${targetReps}). It felt ${difficultyText}. Should I adjust the weight?`;
    const response = await askCoach(query, context, 'progression');
    return response?.content || null;
  }, [askCoach]);

  return {
    // State
    isLoading,
    lastResponse,
    error,
    conversationHistory,

    // General AI actions
    askCoach,
    clearError,
    clearHistory,

    // Specific coaching actions
    analyzeForm,
    suggestProgression,
    getMotivation,
    getNutritionAdvice,
    explainExercise,
    planWorkout,
    getInjuryPrevention,
    getContextualTips,
    encourageProgress,
    getRestGuidance,
    getWeightAdjustment,

    // Computed properties
    hasResponse: lastResponse !== null,
    hasError: error !== null,
    canAsk: !isLoading,
    responseCount: conversationHistory.length,
    
    // Quick access to last response properties
    lastContent: lastResponse?.content || '',
    lastConfidence: lastResponse?.confidence || 0,
    lastSuggestions: lastResponse?.suggestions || [],
    lastActions: lastResponse?.actions || []
  };
}