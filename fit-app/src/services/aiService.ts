import type {
  AICoachConfig,
  AIResponse,
  AIRequestType,
  FormAnalysis,
  Progression,
  AICache
} from '../types/ai';
import type { WorkoutContext, Exercise } from '../types/workout';
import { 
  AI_SYSTEM_PROMPTS, 
  buildContextualPrompt,
  SAFETY_DISCLAIMERS
} from '../constants/aiPrompts';
import { getExerciseById } from '../constants/exercises';
import { OpenAI } from 'openai';

export class AICoachService {
  private openai: OpenAI | null = null;
  private config: AICoachConfig;
  private cache: Map<string, AICache> = new Map();
  private requestQueue: Map<string, Promise<AIResponse>> = new Map();
  private rateLimitTracker: { count: number; resetTime: number } = { count: 0, resetTime: Date.now() };
  private isInitialized = false;

  constructor(config?: Partial<AICoachConfig>) {
    this.config = {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      maxTokens: 1000,
      temperature: 0.7,
      enableLocalFallback: true,
      enableCaching: true,
      enableAnalytics: true,
      personalityProfile: 'supportive',
      expertise: 'adaptive',
      responseStyle: 'conversational',
      ...config
    };
  }

  async initialize(): Promise<boolean> {
    try {
      // Note: In production, API key should come from backend proxy
      if (this.config.apiKey) {
        this.openai = new OpenAI({
          apiKey: this.config.apiKey,
          baseURL: this.config.baseUrl,
          dangerouslyAllowBrowser: true // Only for development
        });
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize AI service:', error);
      return false;
    }
  }

  async getCoachingResponse(
    query: string, 
    context: WorkoutContext, 
    requestType: AIRequestType = 'general-advice'
  ): Promise<AIResponse> {
    try {
      // Check cache first
      if (this.config.enableCaching) {
        const cached = this.getCachedResponse(query, context);
        if (cached) {
          return cached;
        }
      }

      // Check if request is already in progress
      const requestKey = this.getRequestKey(query, context, requestType);
      if (this.requestQueue.has(requestKey)) {
        return await this.requestQueue.get(requestKey)!;
      }

      // Create and queue the request
      const requestPromise = this.processRequest(query, context, requestType);
      this.requestQueue.set(requestKey, requestPromise);

      try {
        const response = await requestPromise;
        
        // Cache the response
        if (this.config.enableCaching) {
          this.cacheResponse(query, context, response);
        }

        return response;
      } finally {
        this.requestQueue.delete(requestKey);
      }
    } catch (error) {
      return this.handleError(error, query, context, requestType);
    }
  }

  private async processRequest(
    query: string,
    context: WorkoutContext,
    requestType: AIRequestType
  ): Promise<AIResponse> {
    // Check rate limits
    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded');
    }

    // Try AI API first
    if (this.openai && this.isInitialized) {
      try {
        return await this.getAIResponse(query, context, requestType);
      } catch (error) {
        console.warn('AI API failed, falling back to local response:', error);
      }
    }

    // Fallback to local responses
    if (this.config.enableLocalFallback) {
      return this.getLocalResponse(query, context, requestType);
    }

    throw new Error('No AI service available');
  }

  private async getAIResponse(
    query: string,
    context: WorkoutContext,
    requestType: AIRequestType
  ): Promise<AIResponse> {
    const systemPrompt = this.buildSystemPrompt(requestType, context);
    const userPrompt = this.buildUserPrompt(query, context, requestType);

    const startTime = Date.now();
    
    const completion = await this.openai!.chat.completions.create({
      model: this.config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      stream: false
    });

    const processingTime = Date.now() - startTime;
    const content = completion.choices[0]?.message?.content || '';

    // Update rate limiting
    this.rateLimitTracker.count++;

    return {
      content: content.trim(),
      type: requestType,
      confidence: 0.9, // High confidence for AI responses
      timestamp: new Date(),
      isComplete: true,
      metadata: {
        tokensUsed: completion.usage?.total_tokens,
        processingTime,
        model: this.config.model,
        cached: false
      }
    };
  }

  private getLocalResponse(
    query: string,
    context: WorkoutContext,
    requestType: AIRequestType
  ): AIResponse {
    let content = '';
    
    // Handle different request types with local responses
    switch (requestType) {
      case 'motivation':
        content = this.getLocalMotivation(query, context);
        break;
      case 'exercise-explanation':
        content = this.getLocalExerciseInfo(query, context);
        break;
      case 'rest-guidance':
        content = this.getLocalRestGuidance(context);
        break;
      case 'nutrition-advice':
        content = this.getLocalNutritionAdvice(query);
        break;
      case 'general-advice':
      default:
        content = this.getLocalGeneralAdvice(query, context);
        break;
    }

    return {
      content,
      type: requestType,
      confidence: 0.7, // Lower confidence for local responses
      timestamp: new Date(),
      isComplete: true,
      metadata: {
        processingTime: 50,
        cached: false
      },
      safetyFlags: ['local-response']
    };
  }

  private getLocalMotivation(_query: string, context: WorkoutContext): string {
    const motivationMessages = [
      "You're doing amazing! Every workout is a step towards your goals. Keep pushing forward!",
      "Remember why you started. Your future self will thank you for not giving up today!",
      "Progress isn't always visible immediately, but consistency always pays off. You've got this!",
      "The hardest part is showing up, and you're already here. That's what separates you from the rest!",
      "Champions are made when nobody's watching. Your dedication is building something incredible!"
    ];

    // Add context-specific motivation
    if (context.activeWorkout) {
      const duration = Math.floor((context.workoutDuration || 0) / 60);
      return `${motivationMessages[Math.floor(Math.random() * motivationMessages.length)]} You're ${duration} minutes into your workout - keep that momentum going!`;
    }

    return motivationMessages[Math.floor(Math.random() * motivationMessages.length)];
  }

  private getLocalExerciseInfo(query: string, context: WorkoutContext): string {
    // Try to extract exercise name from query
    const words = query.toLowerCase().split(' ');
    
    // Look for exercise in current context first
    if (context.currentExercise) {
      const exercise = context.currentExercise.exercise;
      return `**${exercise.name}**\n\n` +
        `**Primary Muscles:** ${exercise.primaryMuscles.join(', ')}\n\n` +
        `**Instructions:**\n${exercise.instructions.map((inst, i) => `${i + 1}. ${inst}`).join('\n')}\n\n` +
        `**Key Tips:**\n${exercise.tips.map(tip => `• ${tip}`).join('\n')}`;
    }

    // Try to find exercise by name in query
    for (const word of words) {
      const exercise = getExerciseById(word.replace(/s$/, '')); // Remove plural
      if (exercise) {
        return `**${exercise.name}**\n\n` +
          `**Primary Muscles:** ${exercise.primaryMuscles.join(', ')}\n\n` +
          `**Instructions:**\n${exercise.instructions.map((inst, i) => `${i + 1}. ${inst}`).join('\n')}\n\n` +
          `**Key Tips:**\n${exercise.tips.map(tip => `• ${tip}`).join('\n')}`;
      }
    }

    return "I'd be happy to explain any exercise! Could you specify which exercise you'd like to know about? For example, you could ask about squats, deadlifts, bench press, or any other movement.";
  }

  private getLocalRestGuidance(context: WorkoutContext): string {
    const defaultRest = context.userPreferences.defaultRestTime;
    
    if (context.currentExercise) {
      const exercise = context.currentExercise.exercise;
      
      if (exercise.category === 'compound') {
        return `For compound exercises like ${exercise.name}, I recommend 2-3 minutes of rest to allow full recovery between sets. This helps maintain strength and power for your next set.`;
      } else {
        return `For isolation exercises like ${exercise.name}, 60-90 seconds of rest is usually sufficient. You can adjust based on how you're feeling.`;
      }
    }

    return `Based on your settings, you typically rest for ${defaultRest} seconds between sets. For compound movements, consider 2-3 minutes. For isolation exercises, 60-90 seconds is usually enough.`;
  }

  private getLocalNutritionAdvice(query: string): string {
    const isPreWorkout = query.toLowerCase().includes('before') || query.toLowerCase().includes('pre');
    const isPostWorkout = query.toLowerCase().includes('after') || query.toLowerCase().includes('post');

    if (isPreWorkout) {
      return "**Pre-Workout Nutrition:**\n\n" +
        "• Eat 30-60 minutes before training\n" +
        "• Focus on easily digestible carbs (banana, oatmeal, toast)\n" +
        "• Include a small amount of protein\n" +
        "• Stay hydrated - drink water throughout the day\n" +
        "• Avoid high fat or fiber foods that might cause discomfort\n\n" +
        SAFETY_DISCLAIMERS.nutrition;
    }

    if (isPostWorkout) {
      return "**Post-Workout Nutrition:**\n\n" +
        "• Eat within 30-60 minutes after training\n" +
        "• Prioritize protein for muscle recovery (20-30g)\n" +
        "• Include carbs to replenish energy stores\n" +
        "• Great options: protein shake with fruit, Greek yogurt, chicken with rice\n" +
        "• Don't forget to rehydrate!\n\n" +
        SAFETY_DISCLAIMERS.nutrition;
    }

    return "**General Fitness Nutrition:**\n\n" +
      "• Focus on whole, minimally processed foods\n" +
      "• Eat adequate protein (0.8-1g per lb body weight)\n" +
      "• Include complex carbs for energy\n" +
      "• Don't fear healthy fats\n" +
      "• Stay consistent and listen to your body\n\n" +
      SAFETY_DISCLAIMERS.nutrition;
  }

  private getLocalGeneralAdvice(_query: string, context: WorkoutContext): string {
    const responses = [
      "That's a great question! While I can provide general guidance, the best approach often depends on your individual goals, experience level, and current situation.",
      "I'm here to help with your fitness journey! For the most personalized advice, consider your specific goals and how your body responds to different approaches.",
      "Fitness is very individual, but I can share some general principles that work well for most people."
    ];

    let advice = responses[Math.floor(Math.random() * responses.length)];

    // Add context if available
    if (context.activeWorkout) {
      advice += ` Since you're currently working out, remember to focus on good form and listen to your body.`;
    }

    advice += `\n\n${SAFETY_DISCLAIMERS.general}`;

    return advice;
  }

  // Specialized coaching methods
  async analyzeForm(exercise: Exercise, notes: string = ''): Promise<FormAnalysis> {
    try {
      const query = `Analyze form for ${exercise.name}. ${notes ? `User notes: ${notes}` : ''}`;
      // const prompt = getExercisePrompt(exercise, 'technique');
      
      if (this.openai && this.isInitialized) {
        // Use AI for detailed analysis
        const response = await this.getAIResponse(query, {} as WorkoutContext, 'form-analysis');
        
        // Parse AI response into FormAnalysis structure
        return {
          exercise,
          overallScore: 8, // Default score
          strengths: ['Following basic movement pattern'],
          areasForImprovement: [response.content],
          specificTips: {
            setup: exercise.instructions.slice(0, 2),
            execution: exercise.instructions.slice(2, 4),
            breathing: ['Breathe in during the eccentric phase', 'Exhale during the concentric phase'],
            common_mistakes: exercise.tips
          },
          recommendedProgression: 'Focus on mastering current weight before increasing load'
        };
      } else {
        // Local fallback
        return {
          exercise,
          overallScore: 7,
          strengths: ['Attempting the exercise consistently'],
          areasForImprovement: ['Focus on the key form points outlined in the exercise instructions'],
          specificTips: {
            setup: exercise.instructions.slice(0, 2),
            execution: exercise.instructions.slice(2),
            breathing: ['Control your breathing throughout the movement'],
            common_mistakes: exercise.tips
          },
          recommendedProgression: 'Master the movement pattern before adding weight'
        };
      }
    } catch (error) {
      throw new Error(`Form analysis failed: ${error}`);
    }
  }

  async suggestProgression(
    exerciseId: string, 
    currentWeight: number, 
    currentReps: number
  ): Promise<Progression> {
    const exercise = getExerciseById(exerciseId);
    if (!exercise) {
      throw new Error('Exercise not found');
    }

    // Calculate volume and suggest progression
    const currentVolume = currentWeight * currentReps;
    const suggestedWeightIncrease = currentWeight * 0.025; // 2.5% increase
    const suggestedWeight = Math.round((currentWeight + suggestedWeightIncrease) * 4) / 4; // Round to nearest 0.25

    return {
      exercise,
      currentStats: {
        weight: currentWeight,
        reps: currentReps,
        sets: 1, // Assume single set for calculation
        volume: currentVolume
      },
      recommendations: {
        nextSession: {
          weight: suggestedWeight,
          reps: currentReps,
          restTime: 90
        },
        shortTerm: [
          `Increase weight gradually by 2.5-5 lbs when you can complete all sets with good form`,
          `Focus on progressive overload through weight, reps, or sets`
        ],
        longTerm: [
          `Build towards more advanced variations of ${exercise.name}`,
          `Consider periodization for continued progress`
        ]
      },
      reasoning: `Based on your current performance, a small weight increase will provide appropriate stimulus for continued strength gains while maintaining good form.`
    };
  }

  // Utility methods
  private buildSystemPrompt(requestType: AIRequestType, context: WorkoutContext): string {
    let basePrompt = AI_SYSTEM_PROMPTS.base;
    
    switch (requestType) {
      case 'form-analysis':
        basePrompt = AI_SYSTEM_PROMPTS.formAnalysis;
        break;
      case 'nutrition-advice':
        basePrompt = AI_SYSTEM_PROMPTS.nutrition;
        break;
      case 'motivation':
        basePrompt = AI_SYSTEM_PROMPTS.motivation;
        break;
      case 'workout-planning':
        basePrompt = AI_SYSTEM_PROMPTS.workoutPlanning;
        break;
    }

    return buildContextualPrompt(basePrompt, context, requestType);
  }

  private buildUserPrompt(query: string, context: WorkoutContext, _requestType: AIRequestType): string {
    let prompt = query;

    // Add context information
    if (context.activeWorkout) {
      prompt += `\n\nCurrent workout context: ${context.activeWorkout.name}`;
      if (context.currentExercise) {
        prompt += `, currently doing ${context.currentExercise.exercise.name}`;
      }
    }

    return prompt;
  }

  private getCachedResponse(query: string, context: WorkoutContext): AIResponse | null {
    const cacheKey = this.getCacheKey(query, context);
    const cached = this.cache.get(cacheKey);

    if (cached && !this.isCacheExpired(cached)) {
      cached.accessCount++;
      cached.lastAccessed = new Date();
      
      return {
        ...cached.response,
        metadata: {
          ...cached.response.metadata,
          cached: true
        }
      };
    }

    return null;
  }

  private cacheResponse(query: string, context: WorkoutContext, response: AIResponse): void {
    const cacheKey = this.getCacheKey(query, context);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Cache for 1 hour

    this.cache.set(cacheKey, {
      query,
      response,
      context: this.hashContext(context),
      timestamp: new Date(),
      accessCount: 1,
      lastAccessed: new Date(),
      expiresAt
    });

    // Clean up old cache entries
    if (this.cache.size > 100) {
      this.cleanupCache();
    }
  }

  private getCacheKey(query: string, context: WorkoutContext): string {
    return `${query.toLowerCase()}_${this.hashContext(context)}`;
  }

  private getRequestKey(query: string, context: WorkoutContext, requestType: AIRequestType): string {
    return `${requestType}_${this.getCacheKey(query, context)}`;
  }

  private hashContext(context: WorkoutContext): string {
    // Simple hash of relevant context
    const contextString = JSON.stringify({
      activeWorkout: context.activeWorkout?.id,
      currentExercise: context.currentExercise?.exerciseId,
      preferences: context.userPreferences
    });
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < contextString.length; i++) {
      const char = contextString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  private isCacheExpired(cached: AICache): boolean {
    return new Date() > cached.expiresAt;
  }

  private cleanupCache(): void {
    for (const [key, cached] of this.cache.entries()) {
      if (this.isCacheExpired(cached)) {
        this.cache.delete(key);
      }
    }
  }

  private checkRateLimit(): boolean {
    const now = Date.now();
    const windowMs = 60000; // 1 minute window
    const maxRequests = 10; // Max 10 requests per minute

    // Reset if window has passed
    if (now - this.rateLimitTracker.resetTime > windowMs) {
      this.rateLimitTracker.count = 0;
      this.rateLimitTracker.resetTime = now;
    }

    return this.rateLimitTracker.count < maxRequests;
  }

  private handleError(
    error: any, 
    _query: string, 
    _context: WorkoutContext, 
    requestType: AIRequestType
  ): AIResponse {
    console.error('AI service error:', error);

    // Return a helpful error response
    return {
      content: "I'm having trouble processing that request right now. Please try again, or feel free to ask your question in a different way.",
      type: requestType,
      confidence: 0.1,
      timestamp: new Date(),
      isComplete: false,
      safetyFlags: ['error-fallback']
    };
  }

  // Public API methods
  getConfig(): AICoachConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<AICoachConfig>): void {
    this.config = { ...this.config, ...config };
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; hitRate: number } {
    const totalAccess = Array.from(this.cache.values()).reduce((sum, cached) => sum + cached.accessCount, 0);
    const hitRate = totalAccess > 0 ? (totalAccess - this.cache.size) / totalAccess : 0;
    
    return {
      size: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }

  destroy(): void {
    this.cache.clear();
    this.requestQueue.clear();
    this.isInitialized = false;
  }

  // Singleton pattern
  private static instance: AICoachService;
  
  static getInstance(config?: Partial<AICoachConfig>): AICoachService {
    if (!AICoachService.instance) {
      AICoachService.instance = new AICoachService(config);
    }
    return AICoachService.instance;
  }

  // Method aliases for compatibility with useAI hook
  async getResponse(request: any): Promise<AIResponse> {
    return this.getCoachingResponse(request.message, request.context);
  }

  async getNutritionAdvice(request: any): Promise<AIResponse> {
    const response = await this.getCoachingResponse(
      request.query,
      request.context,
      'nutrition'
    );
    return response;
  }

  async getMotivation(request: any): Promise<AIResponse> {
    const response = await this.getCoachingResponse(
      'motivate me',
      request.context,
      'motivation'
    );
    return response;
  }

  async planWorkout(request: any): Promise<AIResponse> {
    const response = await this.getCoachingResponse(
      `Plan a workout for ${request.workoutType || 'strength training'}`,
      request.context,
      'workout_planning'
    );
    return response;
  }

  async getProgression(request: any): Promise<Progression> {
    return this.suggestProgression(request.history);
  }
}

// Singleton instance
let aiServiceInstance: AICoachService | null = null;

export function getAIService(config?: Partial<AICoachConfig>): AICoachService {
  if (!aiServiceInstance) {
    aiServiceInstance = new AICoachService(config);
  }
  return aiServiceInstance;
}