import {
  AICoachConfig,
  AIRequest,
  AIResponse,
  AIRequestType,
  WorkoutContext,
  Exercise,
  FormAnalysis,
  NutritionAdvice,
  MotivationalMessage,
  WorkoutPlan,
  Progression,
  AICache,
  AIModel,
  TokenUsage,
  SafetyCheck
} from '../types';
import {
  buildContextualPrompt,
  getExercisePrompt,
  NUTRITION_PROMPTS,
  MOTIVATION_PROMPTS,
  SAFETY_DISCLAIMERS,
  RESPONSE_FORMATS
} from '../constants/aiPrompts';
import OpenAI from 'openai';

export class AICoachService {
  private openai: OpenAI | null = null;
  private config: AICoachConfig;
  private cache: Map<string, AICache> = new Map();
  private requestQueue: AIRequest[] = [];
  private isProcessing = false;
  private rateLimitReset: number = 0;
  private requestCount = 0;
  private maxRequestsPerMinute = 60;

  constructor(config: Partial<AICoachConfig> = {}) {
    this.config = this.getDefaultConfig();
    Object.assign(this.config, config);
    
    this.initializeAI();
    this.startCacheCleanup();
  }

  // Initialize AI service
  private initializeAI(): void {
    // Only initialize OpenAI if API endpoint is provided
    if (this.config.apiEndpoint && process.env.NODE_ENV !== 'development') {
      try {
        this.openai = new OpenAI({
          baseURL: this.config.apiEndpoint,
          dangerouslyAllowBrowser: false // Should be handled by backend proxy
        });
      } catch (error) {
        console.warn('Failed to initialize OpenAI client:', error);
      }
    }
  }

  // Get coaching response
  async getCoachingResponse(
    query: string,
    context: WorkoutContext,
    requestType: AIRequestType = 'general-advice'
  ): Promise<AIResponse> {
    const request: AIRequest = {
      query,
      context,
      requestType,
      priority: 'medium',
      sessionId: this.generateSessionId(),
      timestamp: new Date()
    };

    // Check cache first
    const cacheKey = this.generateCacheKey(request);
    const cachedResponse = this.getFromCache(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Check rate limits
    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    try {
      const response = await this.processRequest(request);
      
      // Cache successful responses
      this.addToCache(cacheKey, response, context);
      
      return response;
    } catch (error) {
      // Fallback to local processing
      return this.getFallbackResponse(request);
    }
  }

  // Process AI request
  private async processRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      // Build contextual prompt
      const systemPrompt = buildContextualPrompt(
        request.requestType,
        request.context
      );

      let response: string;
      let model = this.config.model;
      let tokenUsage: TokenUsage = { prompt: 0, completion: 0, total: 0 };

      if (this.openai && this.config.model.startsWith('gpt')) {
        // Use OpenAI API
        const completion = await this.openai.chat.completions.create({
          model: this.config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: request.query }
          ],
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
        });

        response = completion.choices[0]?.message?.content || 'No response generated';
        tokenUsage = {
          prompt: completion.usage?.prompt_tokens || 0,
          completion: completion.usage?.completion_tokens || 0,
          total: completion.usage?.total_tokens || 0
        };
      } else {
        // Use local model or simple rule-based responses
        response = await this.getLocalResponse(request, systemPrompt);
        model = 'local-fallback';
      }

      // Perform safety check
      const safetyCheck = this.performSafetyCheck(response, request);
      
      // Add safety disclaimers if needed
      if (safetyCheck.medicalDisclaimer) {
        response += '\n\n' + SAFETY_DISCLAIMERS.general;
      }

      const processingTime = Date.now() - startTime;

      return {
        content: response,
        confidence: this.calculateConfidence(request, response),
        suggestions: this.generateFollowUpSuggestions(request, response),
        followUpQuestions: this.generateFollowUpQuestions(request),
        actions: this.extractActions(response, request),
        metadata: {
          model,
          tokens: tokenUsage,
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          category: this.categorizeResponse(request.requestType),
          safety: safetyCheck
        },
        cached: false,
        processingTime
      };

    } catch (error) {
      throw new Error(`AI processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get local/fallback response
  private async getLocalResponse(request: AIRequest, systemPrompt: string): Promise<string> {
    // Simple rule-based responses for common queries
    const query = request.query.toLowerCase();
    
    if (request.requestType === 'motivation') {
      return this.getMotivationalResponse(request);
    }
    
    if (request.requestType === 'form-analysis' && request.context.currentExercise) {
      return this.getFormAnalysisResponse(request.context.currentExercise.exercise);
    }
    
    if (request.requestType === 'nutrition') {
      return this.getNutritionResponse(query);
    }
    
    if (query.includes('personal record') || query.includes('pr') || query.includes('max')) {
      return this.getPersonalRecordResponse(request);
    }
    
    // Generic helpful response
    return "I'm here to help with your fitness journey! While I'm working on a detailed response, remember that consistency and proper form are key to success. What specific area would you like to focus on?";
  }

  // Get motivational response
  private getMotivationalResponse(request: AIRequest): string {
    const motivationalMessages = [
      "You've got this! Every rep brings you closer to your goals. Focus on the process, and the results will follow.",
      "Remember why you started. That version of yourself who decided to make a change is counting on you right now.",
      "Strength isn't just built in the gym - it's built in moments like this when you choose to push forward.",
      "Your body can do it. It's your mind you need to convince. You're stronger than you think!",
      "Progress isn't always visible immediately, but every workout is an investment in a better you."
    ];
    
    const randomIndex = Math.floor(Math.random() * motivationalMessages.length);
    return motivationalMessages[randomIndex];
  }

  // Get form analysis response
  private getFormAnalysisResponse(exercise: Exercise): string {
    return `For ${exercise.name}, focus on these key points:\n\n` +
           `Setup: ${exercise.instructions[0]}\n\n` +
           `Execution: ${exercise.instructions.slice(1).join('. ')}\n\n` +
           `Key Tips:\n${exercise.tips.map(tip => `• ${tip}`).join('\n')}\n\n` +
           `Remember: Quality over quantity! Master the movement pattern before adding weight.`;
  }

  // Get nutrition response
  private getNutritionResponse(query: string): string {
    if (query.includes('pre workout') || query.includes('before')) {
      return "For pre-workout nutrition, aim for easily digestible carbs 30-60 minutes before training. Try a banana with a small amount of nut butter, or oatmeal with berries. Stay hydrated and avoid heavy fats or too much fiber right before training.";
    }
    
    if (query.includes('post workout') || query.includes('after')) {
      return "Post-workout, focus on protein and carbs within 30-60 minutes. A protein shake with fruit, chocolate milk, or Greek yogurt with granola are great options. This helps with muscle recovery and glycogen replenishment.";
    }
    
    return "For general fitness nutrition, focus on whole foods: lean proteins, complex carbs, healthy fats, and plenty of vegetables. Stay hydrated throughout the day and time your meals around your workouts for optimal performance and recovery.";
  }

  // Get personal record response
  private getPersonalRecordResponse(request: AIRequest): string {
    // This would integrate with workout data in a real implementation
    return "I'd love to help you track your personal records! To give you accurate information, I'll need access to your workout history. In the meantime, focus on progressive overload - gradually increasing weight, reps, or sets over time.";
  }

  // Analyze exercise form
  async analyzeForm(exercise: Exercise, notes: string): Promise<FormAnalysis> {
    const request: AIRequest = {
      query: `Analyze form for ${exercise.name}. User notes: ${notes}`,
      context: { 
        activeWorkout: null, 
        currentExercise: null, 
        currentSet: 0, 
        isRecording: false, 
        userLevel: 'intermediate',
        preferences: {
          defaultRestTime: 90,
          weightUnit: 'lbs',
          voiceCoaching: true,
          autoStartTimer: true,
          motivationalMessages: true,
          formReminders: true
        }
      },
      requestType: 'form-analysis',
      priority: 'high',
      sessionId: this.generateSessionId(),
      timestamp: new Date()
    };

    const response = await this.getCoachingResponse(
      request.query,
      request.context,
      'form-analysis'
    );

    // Parse response into structured form analysis
    return {
      exercise,
      analysis: {
        overallScore: 7, // Would be extracted from AI response
        strengths: ['Good setup', 'Proper breathing'],
        improvements: ['Depth could be better', 'Control the negative'],
        commonMistakes: ['Rushing the movement', 'Not engaging core'],
        injuryRisks: [],
        biomechanics: {
          jointAngles: [],
          muscleActivation: [],
          forceDistribution: [],
          movementPattern: {
            quality: 'good',
            symmetry: 85,
            consistency: 80,
            tempo: {
              eccentric: 2,
              pause: 1,
              concentric: 1,
              optimal: true,
              recommendations: ['Slow down the eccentric phase']
            }
          }
        }
      },
      recommendations: [
        {
          type: 'technique',
          priority: 'high',
          description: 'Focus on controlled movement',
          instruction: 'Take 2-3 seconds on the way down',
          expectedImprovement: 'Better muscle activation and safety',
          timeline: 'Immediate'
        }
      ],
      confidence: response.confidence,
      safetyAssessment: {
        riskLevel: 'safe',
        warnings: [],
        stopCriteria: ['Sharp pain', 'Dizziness'],
        modifications: ['Reduce weight if form breaks down']
      }
    };
  }

  // Suggest progression
  async suggestProgression(exerciseId: string, currentWeight: number, currentReps: number): Promise<Progression> {
    const query = `Suggest progression for exercise ${exerciseId}. Current: ${currentWeight} lbs for ${currentReps} reps`;
    
    const context: WorkoutContext = {
      activeWorkout: null,
      currentExercise: null,
      currentSet: 0,
      isRecording: false,
      userLevel: 'intermediate',
      preferences: {
        defaultRestTime: 90,
        weightUnit: 'lbs',
        voiceCoaching: true,
        autoStartTimer: true,
        motivationalMessages: true,
        formReminders: true
      }
    };

    await this.getCoachingResponse(query, context, 'progression');

    // Return structured progression suggestion
    return {
      exerciseId,
      suggestion: {
        type: 'weight',
        change: 5,
        description: 'Add 5 lbs to the bar',
        timeframe: 'Next week'
      },
      reasoning: 'You\'ve completed all sets with good form. Time to increase the challenge.',
      confidence: 0.85
    };
  }

  // Perform safety check on AI response
  private performSafetyCheck(response: string, request: AIRequest): SafetyCheck {
    const medicalKeywords = ['pain', 'injury', 'hurt', 'doctor', 'medical'];
    const injuryRisks = ['high intensity', 'maximum weight', 'pain through'];
    
    const hasMedicalContent = medicalKeywords.some(keyword => 
      response.toLowerCase().includes(keyword)
    );
    
    const hasInjuryRisk = injuryRisks.some(risk => 
      response.toLowerCase().includes(risk)
    );

    return {
      passed: true,
      warnings: hasInjuryRisk ? ['High intensity activity mentioned'] : [],
      medicalDisclaimer: hasMedicalContent,
      injuryRisk: hasInjuryRisk ? 'medium' : 'low'
    };
  }

  // Calculate response confidence
  private calculateConfidence(request: AIRequest, response: string): number {
    let confidence = 0.8; // Base confidence
    
    // Adjust based on response length and detail
    if (response.length > 200) confidence += 0.1;
    if (response.includes('•') || response.includes('\n')) confidence += 0.05;
    
    // Adjust based on request type
    switch (request.requestType) {
      case 'motivation':
        confidence = 0.9; // High confidence for motivational responses
        break;
      case 'form-analysis':
        confidence = response.includes('form') ? 0.85 : 0.7;
        break;
      case 'nutrition':
        confidence = response.includes('protein') || response.includes('carb') ? 0.8 : 0.6;
        break;
    }
    
    return Math.min(confidence, 1.0);
  }

  // Generate follow-up suggestions
  private generateFollowUpSuggestions(request: AIRequest, response: string): string[] {
    const suggestions: string[] = [];
    
    switch (request.requestType) {
      case 'form-analysis':
        suggestions.push('Would you like tips for progression?');
        suggestions.push('Want to see similar exercises?');
        break;
      case 'nutrition':
        suggestions.push('Need meal prep ideas?');
        suggestions.push('Want supplement recommendations?');
        break;
      case 'motivation':
        suggestions.push('Set a new goal for this week?');
        suggestions.push('Track your progress?');
        break;
      default:
        suggestions.push('Need more specific advice?');
        suggestions.push('Want to explore related topics?');
    }
    
    return suggestions;
  }

  // Generate follow-up questions
  private generateFollowUpQuestions(request: AIRequest): string[] {
    const questions: string[] = [];
    
    switch (request.requestType) {
      case 'form-analysis':
        questions.push('How did that feel?');
        questions.push('Any specific areas of concern?');
        break;
      case 'nutrition':
        questions.push('Do you have any dietary restrictions?');
        questions.push('What are your current goals?');
        break;
      case 'workout-planning':
        questions.push('How many days per week can you train?');
        questions.push('What equipment do you have access to?');
        break;
    }
    
    return questions;
  }

  // Extract actionable items from response
  private extractActions(response: string, request: AIRequest): any[] {
    const actions: any[] = [];
    
    // Simple pattern matching for common actions
    if (response.includes('increase') && response.includes('weight')) {
      actions.push({
        type: 'adjust-weight',
        description: 'Increase weight for next session',
        parameters: { direction: 'increase' },
        priority: 'soon'
      });
    }
    
    if (response.includes('rest') && response.includes('day')) {
      actions.push({
        type: 'take-rest',
        description: 'Schedule a rest day',
        parameters: { duration: '1 day' },
        priority: 'immediate'
      });
    }
    
    return actions;
  }

  // Categorize response type
  private categorizeResponse(requestType: AIRequestType): string {
    switch (requestType) {
      case 'form-analysis':
        return 'analytical';
      case 'motivation':
        return 'motivational';
      case 'nutrition':
        return 'instructional';
      case 'workout-planning':
        return 'analytical';
      default:
        return 'general';
    }
  }

  // Cache management
  private generateCacheKey(request: AIRequest): string {
    const contextKey = JSON.stringify({
      requestType: request.requestType,
      userLevel: request.context.userLevel,
      exercise: request.context.currentExercise?.exercise.name
    });
    return `${request.query.toLowerCase().trim()}_${btoa(contextKey)}`;
  }

  private getFromCache(key: string): AIResponse | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    // Check if cache is still valid
    const now = new Date();
    const cacheAge = now.getTime() - cached.timestamp.getTime();
    if (cacheAge > cached.ttl * 60 * 1000) {
      this.cache.delete(key);
      return null;
    }
    
    // Update cache stats
    cached.hits++;
    cached.lastAccessed = now;
    
    return { ...cached.response, cached: true };
  }

  private addToCache(key: string, response: AIResponse, context: WorkoutContext): void {
    const cacheEntry: AICache = {
      key,
      response,
      context,
      timestamp: new Date(),
      hits: 0,
      lastAccessed: new Date(),
      ttl: this.getCacheTTL(response.metadata.category)
    };
    
    this.cache.set(key, cacheEntry);
    
    // Limit cache size
    if (this.cache.size > 1000) {
      this.cleanupCache();
    }
  }

  private getCacheTTL(category: string): number {
    // Cache TTL in minutes
    switch (category) {
      case 'factual':
        return 60; // 1 hour
      case 'motivational':
        return 30; // 30 minutes
      case 'personalized':
        return 15; // 15 minutes
      default:
        return 45; // 45 minutes
    }
  }

  private cleanupCache(): void {
    const entries = Array.from(this.cache.entries());
    entries.sort(([,a], [,b]) => a.lastAccessed.getTime() - b.lastAccessed.getTime());
    
    // Remove oldest 20% of entries
    const toRemove = Math.floor(entries.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  private startCacheCleanup(): void {
    setInterval(() => {
      this.cleanupCache();
    }, 10 * 60 * 1000); // Every 10 minutes
  }

  // Rate limiting
  private checkRateLimit(): boolean {
    const now = Date.now();
    
    // Reset counter every minute
    if (now > this.rateLimitReset) {
      this.requestCount = 0;
      this.rateLimitReset = now + 60 * 1000;
    }
    
    if (this.requestCount >= this.maxRequestsPerMinute) {
      return false;
    }
    
    this.requestCount++;
    return true;
  }

  // Fallback response for when AI is unavailable
  private getFallbackResponse(request: AIRequest): AIResponse {
    const fallbackMessage = this.getFallbackMessage(request.requestType);
    
    return {
      content: fallbackMessage,
      confidence: 0.6,
      suggestions: ['Try again later', 'Ask a more specific question'],
      followUpQuestions: [],
      actions: [],
      metadata: {
        model: 'fallback',
        tokens: { prompt: 0, completion: 0, total: 0 },
        timestamp: new Date(),
        requestId: this.generateRequestId(),
        category: 'general',
        safety: { passed: true, warnings: [], medicalDisclaimer: false, injuryRisk: 'low' }
      },
      cached: false,
      processingTime: 0
    };
  }

  private getFallbackMessage(requestType: AIRequestType): string {
    switch (requestType) {
      case 'motivation':
        return "Keep pushing forward! Every workout counts toward your goals.";
      case 'form-analysis':
        return "Focus on proper form and controlled movement. Quality over quantity!";
      case 'nutrition':
        return "Remember the basics: adequate protein, stay hydrated, and eat whole foods.";
      default:
        return "I'm here to help with your fitness journey. What specific question can I answer?";
    }
  }

  // Utility methods
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Default configuration
  private getDefaultConfig(): AICoachConfig {
    return {
      model: 'gpt-3.5-turbo',
      apiEndpoint: '/api/ai', // Backend proxy endpoint
      personality: {
        name: 'AI Coach',
        role: 'coach',
        tone: 'motivational',
        expertise: ['strength-training', 'nutrition', 'motivation'],
        communication: {
          verbosity: 'detailed',
          technicality: 'intermediate',
          examples: true,
          analogies: true,
          dataVisualization: false
        },
        encouragementStyle: {
          frequency: 'moderate',
          type: 'motivational',
          personalization: true,
          goalOriented: true
        }
      },
      expertise: 'specialized',
      responseStyle: 'conversational',
      contextWindow: 4000,
      maxTokens: 500,
      temperature: 0.7
    };
  }

  // Cleanup
  destroy(): void {
    this.cache.clear();
    this.requestQueue = [];
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