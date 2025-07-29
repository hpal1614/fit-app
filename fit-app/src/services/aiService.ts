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
  buildContextualPrompt
} from '../constants/aiPrompts';
import { getExerciseById } from '../constants/exercises';
// Removed OpenAI import - using team service instead

// AI Provider Capabilities moved to IntelligentAIRouter class

// Removed AI_PROVIDER_STRENGTHS - logic moved to IntelligentAIRouter

// Team Status Interface
interface TeamStatus {
  openrouter: 'idle' | 'trying' | 'success' | 'failed';
  groq: 'idle' | 'trying' | 'success' | 'failed';
  google: 'idle' | 'trying' | 'success' | 'failed';
}

// Intelligent AI Router
export class IntelligentAIRouter {
  async getOptimalProvider(requestType: AIRequestType): Promise<string[]> {
    // Return providers ranked by capability for this request type
    switch (requestType) {
      case 'motivation':
      case 'general-advice':
      case 'form-analysis':
        // Prioritize OpenRouter (Claude) for fitness coaching
        return ['openrouter', 'groq', 'google'];
        
      case 'workout-planning':
      case 'progress-analysis':
        // Use analysis-heavy providers for data work
        return ['google', 'openrouter', 'groq'];
        
      case 'nutrition-advice':
      case 'exercise-explanation':
        // Use conversation-heavy providers for explanations
        return ['openrouter', 'groq', 'google'];
        
      default:
        // Default: fastest first, then most reliable
        return ['groq', 'openrouter', 'google'];
    }
  }
}

// AI Team Service - Parallel Processing with Instant Failover
export class AITeamService {
  private router = new IntelligentAIRouter();
  private activeRequests = new Map<string, AbortController>();
  private teamStatus: TeamStatus = { openrouter: 'idle', groq: 'idle', google: 'idle' };
  private currentProvider: string | null = null;
  
  async getTeamResponse(
    query: string, 
    context: WorkoutContext, 
    requestType: AIRequestType
  ): Promise<AIResponse> {
    const requestId = this.generateRequestId();
    const abortController = new AbortController();
    this.activeRequests.set(requestId, abortController);
    
    // Reset team status
    this.teamStatus = { openrouter: 'idle', groq: 'idle', google: 'idle' };
    
    try {
      // Get optimal provider order for this request
      const providerOrder = await this.router.getOptimalProvider(requestType);
      
      // PARALLEL STRATEGY: Start all providers simultaneously
      // First successful response wins, others are cancelled
      const promises = providerOrder.map((provider, index) => 
        this.tryProvider(provider, query, context, requestType, {
          signal: abortController.signal,
          priority: index + 1,
          timeout: 2000 + (index * 1000) // 2s, 3s, 4s timeouts
        })
      );
      
      // Race condition: first success wins
      const response = await Promise.race([
        ...promises,
        this.emergencyTimeout(5000) // Emergency timeout after 5 seconds
      ]);
      
      // Cancel remaining requests
      abortController.abort();
      
      return response;
      
    } catch (_error) {
      // ALL providers failed - use intelligent fallback
      return this.getIntelligentFallback(context, requestType);
    } finally {
      this.activeRequests.delete(requestId);
    }
  }
  
  private async tryProvider(
    provider: string,
    query: string, 
    context: WorkoutContext,
    requestType: AIRequestType,
    options: { signal: AbortSignal; priority: number; timeout: number }
  ): Promise<AIResponse> {
    const startTime = Date.now();
    
    // Update team status
    this.teamStatus[provider as keyof TeamStatus] = 'trying';
    this.currentProvider = provider;
    
    // Add exponential backoff for retries
    let retryCount = 0;
    const maxRetries = 2;
    
    while (retryCount <= maxRetries) {
      try {
        // Check if request was cancelled
        if (options.signal.aborted) {
          this.teamStatus[provider as keyof TeamStatus] = 'failed';
          throw new Error('Request cancelled');
        }
        
        // Call specific provider with timeout
        const response = await Promise.race([
          this.callSpecificProvider(provider, query, context, requestType),
          this.timeoutPromise(options.timeout)
        ]);
        
        // Success! Update team status
        this.teamStatus[provider as keyof TeamStatus] = 'success';
        this.currentProvider = null;
        
        // Add metadata about which provider responded
        return {
          ...response,
          metadata: {
            ...response.metadata,
            provider,
            priority: options.priority,
            retryCount,
            processingTime: Date.now() - startTime,
            teamResponse: true
          }
        };
        
      } catch (_error) {
        retryCount++;
        if (retryCount > maxRetries) {
          this.teamStatus[provider as keyof TeamStatus] = 'failed';
          throw new Error("AI service error");
        }
        
        // Exponential backoff: 500ms, 1s, 2s
        const delay = Math.pow(2, retryCount) * 250;
        await this.delay(delay);
      }
    }
    
    // This should never be reached, but TypeScript requires it
    this.teamStatus[provider as keyof TeamStatus] = 'failed';
    throw new Error('Max retries exceeded');
  }
  
  private async callSpecificProvider(
    provider: string,
    query: string,
    context: WorkoutContext,
    requestType: AIRequestType
  ): Promise<AIResponse> {
    const apiKeys = {
      openrouter: import.meta.env.VITE_OPENROUTER_API_KEY,
      groq: import.meta.env.VITE_GROQ_API_KEY,
      google: import.meta.env.VITE_GOOGLE_AI_API_KEY
    };
    
    switch (provider) {
      case 'openrouter':
        if (!apiKeys.openrouter) throw new Error('OpenRouter API key not available');
        return await this.callOpenRouter(query, context, requestType, apiKeys.openrouter);
      case 'groq':
        if (!apiKeys.groq) throw new Error('Groq API key not available');
        return await this.callGroq(query, context, requestType, apiKeys.groq);
      case 'google':
        if (!apiKeys.google) throw new Error('Google API key not available');
        return await this.callGemini(query, context, requestType, apiKeys.google);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }
  
  private async emergencyTimeout(ms: number): Promise<AIResponse> {
    await this.delay(ms);
    throw new Error('All AI providers timed out - using emergency fallback');
  }
  
  private getIntelligentFallback(context: WorkoutContext, requestType: AIRequestType): AIResponse {
    // Intelligent context-aware fallback based on request type and workout context
    const fallbackMessages: Record<string, string> = {
      'motivation': this.getMotivationalFallback(context),
      'form-analysis': this.getFormFallback(context),
      'nutrition-advice': this.getNutritionFallback(context),
      'nutrition': this.getNutritionFallback(context),
      'general-advice': this.getGeneralFallback(),
      'exercise-explanation': this.getGeneralFallback(),
      'rest-guidance': this.getGeneralFallback(),
      'workout-planning': this.getGeneralFallback()
    };
    
    const content = fallbackMessages[requestType] || fallbackMessages['general-advice'];
    
    return {
      content,
      type: requestType,
      confidence: 0.7,
      timestamp: new Date(),
      isComplete: true,
      metadata: {
        provider: 'intelligent-fallback',
        model: 'context-aware-fallback',
        processingTime: 0,
        cached: false,
        teamResponse: false,
        fallbackReason: 'all-providers-failed'
      }
    };
  }
  
  private getMotivationalFallback(context: WorkoutContext): string {
    const messages = [
      "You're crushing it! Every rep gets you stronger! 💪",
      "Remember why you started - you're building something incredible! 🔥",
      "Progress isn't always visible, but consistency always pays off! ⭐",
      "The hardest part is showing up, and you're already here! 🎯",
      "Champions are made when nobody's watching - keep going! 🏆"
    ];
    
    if (context.activeWorkout) {
      const duration = Math.floor((context.workoutDuration || 0) / 60);
      return `${messages[Math.floor(Math.random() * messages.length)]} You're ${duration} minutes into your workout - finish strong! 🚀`;
    }
    
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  private getFormFallback(context: WorkoutContext): string {
    if (context.currentExercise) {
      const exercise = context.currentExercise.exercise;
      return `**${exercise.name} Form Check:**\n\n` +
        `Key points to focus on:\n` +
        `• ${exercise.tips.join('\n• ')}\n\n` +
        `Keep your core tight, control the movement, and focus on quality over quantity! 🎯`;
    }
    
    return "**Form Check:** Focus on controlled movements, engage your core, and prioritize quality over quantity. If something feels wrong, stop and reset! 🎯";
  }
  
  private getNutritionFallback(context: WorkoutContext): string {
    const isPreWorkout = context.activeWorkout === null;
    
    if (isPreWorkout) {
      return "**Pre-Workout Fuel:** Try a banana with some almond butter 30-60 minutes before training. Stay hydrated! 🍌💧";
    } else {
      return "**Post-Workout Recovery:** Get protein + carbs within 30-60 minutes. Chocolate milk, protein shake with fruit, or Greek yogurt work great! 🥛🍓";
    }
  }
  
  private getGeneralFallback(): string {
    return "I'm here to help with your fitness journey! While my AI brain is taking a quick break, remember: consistency beats perfection, form beats ego, and you're already winning by showing up! 💪✨\n\nTry asking again in a moment - I'll be back online soon!";
  }
  
  // Utility methods
  private generateRequestId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
  
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private async timeoutPromise(ms: number): Promise<never> {
    return new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Provider timeout after ${ms}ms`)), ms)
    );
  }
  
  // Public methods for monitoring
  getTeamStatus(): TeamStatus {
    return { ...this.teamStatus };
  }
  
  getCurrentProvider(): string | null {
    return this.currentProvider;
  }

  // Provider-specific API calls
  private async callOpenRouter(
    query: string,
    context: WorkoutContext,
    requestType: AIRequestType,
    apiKey: string
  ): Promise<AIResponse> {
    const systemPrompt = this.buildSystemPrompt(requestType, context);
    const userPrompt = this.buildUserPrompt(query, context, requestType);
    const startTime = Date.now();

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'AI Fitness Coach'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const processingTime = Date.now() - startTime;

    return {
      content: content.trim(),
      type: requestType,
      confidence: 0.95,
      timestamp: new Date(),
      isComplete: true,
      metadata: {
        provider: 'openrouter',
        model: 'claude-3.5-sonnet',
        tokensUsed: data.usage?.total_tokens,
        processingTime,
        cached: false
      }
    };
  }

  private async callGroq(
    query: string,
    context: WorkoutContext,
    requestType: AIRequestType,
    apiKey: string
  ): Promise<AIResponse> {
    const systemPrompt = this.buildSystemPrompt(requestType, context);
    const userPrompt = this.buildUserPrompt(query, context, requestType);
    const startTime = Date.now();

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const processingTime = Date.now() - startTime;

    return {
      content: content.trim(),
      type: requestType,
      confidence: 0.92,
      timestamp: new Date(),
      isComplete: true,
      metadata: {
        provider: 'groq',
        model: 'llama-3.1-70b-versatile',
        tokensUsed: data.usage?.total_tokens,
        processingTime,
        cached: false
      }
    };
  }

  private async callGemini(
    query: string,
    context: WorkoutContext,
    requestType: AIRequestType,
    apiKey: string
  ): Promise<AIResponse> {
    const systemPrompt = this.buildSystemPrompt(requestType, context);
    const userPrompt = this.buildUserPrompt(query, context, requestType);
    const startTime = Date.now();

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}\n\nUser: ${userPrompt}`
          }]
        }],
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const processingTime = Date.now() - startTime;

    return {
      content: content.trim(),
      type: requestType,
      confidence: 0.90,
      timestamp: new Date(),
      isComplete: true,
      metadata: {
        provider: 'google',
        model: 'gemini-1.5-flash',
        tokensUsed: data.usageMetadata?.totalTokenCount,
        processingTime,
        cached: false
      }
    };
  }

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
}

export class AICoachService {
  private config: AICoachConfig;
  private cache: Map<string, AICache> = new Map();
  private requestQueue: Map<string, Promise<AIResponse>> = new Map();
  private teamService = new AITeamService();

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

  async initialize(config?: Partial<AICoachConfig>): Promise<boolean> {
    try {
      // Update config if provided
      if (config) {
        this.config = { ...this.config, ...config };
      }
      
      // Team service handles all AI providers
      return true;
    } catch (_error) {
      console.error('Failed to initialize AI service:', _error);
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

      // Create and queue the request using the NEW TEAM SERVICE
      const requestPromise = this.teamService.getTeamResponse(query, context, requestType);
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
    } catch (_error) {
      return this.handleError(new Error("Request failed"), query, context, requestType);
    }
  }

  // All old API call methods and local response logic have been moved to AITeamService

  // Public methods to get team status for monitoring
  getTeamStatus() {
    return this.teamService.getTeamStatus();
  }

  // Public method to get current provider
  getCurrentProvider(): string | null {
    return this.teamService.getCurrentProvider();
  }

  // Specialized coaching methods
  async analyzeForm(exercise: Exercise, notes: string = ''): Promise<FormAnalysis> {
    try {
      const query = `Analyze form for ${exercise.name}. ${notes ? `User notes: ${notes}` : ''}`;
      
      const response = await this.teamService.getTeamResponse(query, {} as WorkoutContext, 'form-analysis');
      
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
    } catch (_error) {
      throw new Error("Form analysis failed");
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

  // Utility methods moved to AITeamService

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



  private handleError(
    error: any, 
    _query: string, 
    _context: WorkoutContext, 
    requestType: AIRequestType
  ): AIResponse {
    console.error('AI service error:', _error);

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
  async getResponse(request: unknown): Promise<AIResponse> {
    return this.getCoachingResponse((request as any).message, (request as any).context);
  }

  async getNutritionAdvice(request: unknown): Promise<AIResponse> {
    const response = await this.getCoachingResponse(
      (request as any).query,
      (request as any).context,
      'nutrition'
    );
    return response;
  }

  async getMotivation(request: unknown): Promise<AIResponse> {
    const response = await this.getCoachingResponse(
      'motivate me',
      (request as any).context,
      'motivation'
    );
    return response;
  }

  async planWorkout(request: unknown): Promise<AIResponse> {
    const response = await this.getCoachingResponse(
      `Plan a workout for ${(request as any).workoutType || 'strength training'}`,
      (request as any).context,
      'workout_planning'
    );
    return response;
  }

  async getProgression(request: unknown): Promise<Progression> {
    return this.suggestProgression((request as any).history, 0, 0);
  }

  // New method for generating coaching suggestions
  async generateCoachingSuggestion(params: {
    exercise: string;
    currentWeight: number;
    reps: number;
    difficulty: number;
    userHistory: any[];
    nextExercise?: string;
    feedback?: 'too_easy' | 'perfect' | 'too_hard';
  }): Promise<string | null> {
    try {
      const context: WorkoutContext = {
        currentExercise: params.exercise,
        currentWeight: params.currentWeight,
        targetReps: params.reps,
        lastSetRPE: params.difficulty,
        exerciseHistory: params.userHistory,
        sessionType: 'strength' as const,
        progressionGoal: 'strength',
        fitnessLevel: 'intermediate',
        equipment: [],
        timeAvailable: 60,
        recentPerformance: 'improving',
        injuryStatus: [],
        nutritionStatus: 'adequate',
        recoveryScore: 8,
        motivationLevel: 'high',
        environmentType: 'gym',
        socialContext: 'solo'
      };

      let prompt = `Based on the current workout context:
- Exercise: ${params.exercise}
- Weight: ${params.currentWeight}lbs
- Reps: ${params.reps}
- Difficulty (RPE): ${params.difficulty}/10`;

      if (params.feedback) {
        prompt += `\n- User feedback: Set was ${params.feedback}`;
      }

      if (params.nextExercise) {
        prompt += `\n- Next exercise: ${params.nextExercise}`;
      }

      prompt += '\n\nProvide a brief, actionable coaching suggestion (1 sentence).';

      const response = await this.getCoachingResponse(prompt, context);
      return response.content;
    } catch (error) {
      console.error('Error generating coaching suggestion:', error);
      return null;
    }
  }

  // New method for parsing voice commands
  async parseVoiceCommand(
    transcription: string, 
    context: {
      currentExercise: string;
      expectedWeight: number;
      expectedReps: number;
      context: string;
    }
  ): Promise<{
    action: string;
    weight?: number;
    reps?: number;
    rpe?: number;
  } | null> {
    try {
      const prompt = `Parse this voice command from a workout session:
Transcription: "${transcription}"
Current exercise: ${context.currentExercise}
Expected weight: ${context.expectedWeight}
Expected reps: ${context.expectedReps}

Identify the action and extract any numerical values for weight, reps, or RPE.
Respond in JSON format: {"action": "...", "weight": ..., "reps": ..., "rpe": ...}

Possible actions:
- complete_set: User completed a set
- failed_set: User failed to complete the set
- adjust_weight: User wants to change the weight
- start_timer: User wants to start rest timer
- unknown: Cannot understand the command`;

      const workoutContext: WorkoutContext = {
        currentExercise: context.currentExercise,
        currentWeight: context.expectedWeight,
        targetReps: context.expectedReps,
        sessionType: 'strength' as const,
        progressionGoal: 'strength',
        fitnessLevel: 'intermediate',
        equipment: [],
        timeAvailable: 60,
        recentPerformance: 'improving',
        injuryStatus: [],
        nutritionStatus: 'adequate',
        recoveryScore: 8,
        motivationLevel: 'high',
        environmentType: 'gym',
        socialContext: 'solo'
      };

      const response = await this.getCoachingResponse(prompt, workoutContext);
      
      // Try to parse the response as JSON
      try {
        const parsed = JSON.parse(response.content);
        return parsed;
      } catch {
        // If not valid JSON, try to extract information manually
        const content = response.content.toLowerCase();
        
        if (content.includes('complete') || content.includes('finished')) {
          return { action: 'complete_set' };
        } else if (content.includes('fail') || content.includes('drop')) {
          return { action: 'failed_set' };
        } else if (content.includes('weight') || content.includes('adjust')) {
          return { action: 'adjust_weight' };
        } else if (content.includes('timer') || content.includes('rest')) {
          return { action: 'start_timer' };
        }
        
        return { action: 'unknown' };
      }
    } catch (error) {
      console.error('Error parsing voice command:', error);
      return null;
    }
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

// Ready-to-use singleton instance
export const aiService = getAIService();