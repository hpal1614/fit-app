import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  AIResponse,
  AIRequestType,
  WorkoutContext
} from '../types/ai';
import type { Exercise } from '../types/workout';

interface AIProvider {
  name: 'openrouter' | 'groq' | 'google';
  priority: number;
  dailyLimit: number;
  usedToday: number;
  isAvailable: boolean;
  rateLimitReset?: Date;
}

interface ProviderSelection {
  provider: 'openrouter' | 'groq' | 'google';
  rationale: string;
}

interface EnhancedContext extends WorkoutContext {
  userStats?: {
    experienceLevel: 'beginner' | 'intermediate' | 'advanced';
    preferredIntensity: 'low' | 'moderate' | 'high';
    commonMistakes: string[];
    strengthAreas: string[];
    weaknessAreas: string[];
  };
  workoutIntelligence?: {
    suggestedNextExercise?: string;
    recommendedWeight?: number;
    fatigueLikelihood: number;
    formRiskFactors: string[];
    progressionOpportunities: string[];
  };
  sessionContext?: {
    timeInWorkout: number;
    energyLevel: 'low' | 'moderate' | 'high';
    performanceToday: 'below_average' | 'average' | 'above_average';
    comparedToLastSession: 'worse' | 'similar' | 'better';
  };
  temporalContext?: {
    timeOfDay: number;
    dayOfWeek: number;
    workoutFrequency: number;
    restDaysSince: number;
    timeToNextMeal?: number;
  };
}

export class IntelligentAIService {
  private providers: AIProvider[] = [
    { name: 'groq', priority: 1, dailyLimit: 500, usedToday: 0, isAvailable: true },
    { name: 'openrouter', priority: 2, dailyLimit: 200, usedToday: 0, isAvailable: true },
    { name: 'google', priority: 3, dailyLimit: 100, usedToday: 0, isAvailable: true }
  ];

  private googleAI: GoogleGenerativeAI | null = null;
  private usageTracking = new Map<string, number>();
  private lastResetDate = new Date().toDateString();

  constructor() {
    this.initializeProviders();
    this.loadUsageFromStorage();
  }

  private initializeProviders(): void {
    // Initialize Google AI if key is available
    const googleKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
    if (googleKey) {
      this.googleAI = new GoogleGenerativeAI(googleKey);
    }

    // Reset daily counters if needed
    this.resetDailyCountersIfNeeded();
  }

  private resetDailyCountersIfNeeded(): void {
    const today = new Date().toDateString();
    if (this.lastResetDate !== today) {
      this.providers.forEach(provider => {
        provider.usedToday = 0;
        provider.isAvailable = true;
      });
      this.usageTracking.clear();
      this.lastResetDate = today;
      this.saveUsageToStorage();
    }
  }

  private loadUsageFromStorage(): void {
    try {
      const stored = localStorage.getItem('ai_usage_tracking');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.date === this.lastResetDate) {
          this.usageTracking = new Map(data.usage);
          this.providers.forEach(provider => {
            provider.usedToday = this.usageTracking.get(provider.name) || 0;
          });
        }
      }
    } catch (error) {
      console.warn('Failed to load usage tracking:', error);
    }
  }

  private saveUsageToStorage(): void {
    try {
      localStorage.setItem('ai_usage_tracking', JSON.stringify({
        date: this.lastResetDate,
        usage: Array.from(this.usageTracking.entries())
      }));
    } catch (error) {
      console.warn('Failed to save usage tracking:', error);
    }
  }

  async getCoachingResponse(
    query: string, 
    context: WorkoutContext,
    requestType: AIRequestType = 'general-advice'
  ): Promise<AIResponse> {
    const enhancedContext = this.buildEnhancedContext(context);
    const provider = this.selectBestProvider(requestType);
    const systemPrompt = this.buildContextualPrompt(query, enhancedContext, requestType);

    try {
      let response: AIResponse;
      
      switch (provider.provider) {
        case 'groq':
          response = await this.queryGroq(systemPrompt, query, requestType);
          break;
        case 'google':
          response = await this.queryGoogleAI(systemPrompt, query, requestType);
          break;
        case 'openrouter':
          response = await this.queryOpenRouter(systemPrompt, query, requestType);
          break;
        default:
          response = this.getFallbackResponse(query, enhancedContext, requestType);
      }

      // Track usage
      this.trackUsage(provider.provider, 1, response.metadata?.tokensUsed || 0);
      
      return response;
    } catch (error) {
      console.error(`${provider.provider} failed:`, error);
      return this.handleProviderFailure(provider.provider, query, enhancedContext, requestType);
    }
  }

  private selectBestProvider(requestType: AIRequestType): ProviderSelection {
    const availableProviders = this.getAvailableProviders();
    
    if (availableProviders.length === 0) {
      return { provider: 'groq', rationale: 'Fallback to local responses' };
    }

    // Smart provider selection based on request type and usage
    if (requestType === 'motivation' && availableProviders.includes('groq')) {
      return { provider: 'groq', rationale: 'Fast inference for motivational responses' };
    }
    
    if (['form-analysis', 'exercise-explanation'].includes(requestType) && availableProviders.includes('google')) {
      return { provider: 'google', rationale: 'Better reasoning for complex analysis' };
    }
    
    if (['nutrition-advice', 'workout-planning'].includes(requestType) && availableProviders.includes('openrouter')) {
      return { provider: 'openrouter', rationale: 'Advanced models for detailed advice' };
    }
    
    // Default to provider with most remaining quota
    const providerWithMostQuota = availableProviders.reduce((best, current) => {
      const bestProvider = this.providers.find(p => p.name === best)!;
      const currentProvider = this.providers.find(p => p.name === current)!;
      return (bestProvider.dailyLimit - bestProvider.usedToday) > 
             (currentProvider.dailyLimit - currentProvider.usedToday) ? best : current;
    });
    
    return { 
      provider: providerWithMostQuota, 
      rationale: 'Quota optimization' 
    };
  }

  private getAvailableProviders(): Array<'openrouter' | 'groq' | 'google'> {
    return this.providers
      .filter(p => p.isAvailable && p.usedToday < p.dailyLimit)
      .sort((a, b) => a.priority - b.priority)
      .map(p => p.name);
  }

  private async queryGroq(
    systemPrompt: string, 
    query: string, 
    requestType: AIRequestType
  ): Promise<AIResponse> {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) throw new Error('Groq API key not configured');

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
          { role: 'user', content: query }
        ],
        temperature: 0.7,
        max_tokens: 500,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error: ${response.status} ${errorText}`);
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
        tokensUsed: data.usage?.total_tokens || 0,
        processingTime,
        cached: false
      }
    };
  }

  private async queryGoogleAI(
    systemPrompt: string, 
    query: string, 
    requestType: AIRequestType
  ): Promise<AIResponse> {
    if (!this.googleAI) throw new Error('Google AI not initialized');

    const startTime = Date.now();
    const model = this.googleAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const fullPrompt = `${systemPrompt}\n\nUser: ${query}\n\nAI Coach:`;
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const content = response.text();
    const processingTime = Date.now() - startTime;
    
    return {
      content: content.trim(),
      type: requestType,
      confidence: 0.88,
      timestamp: new Date(),
      isComplete: true,
      metadata: {
        provider: 'google',
        model: 'gemini-1.5-flash',
        tokensUsed: 0, // Google AI doesn't provide token count
        processingTime,
        cached: false
      }
    };
  }

  private async queryOpenRouter(
    systemPrompt: string, 
    query: string, 
    requestType: AIRequestType
  ): Promise<AIResponse> {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OpenRouter API key not configured');

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
          { role: 'user', content: query }
        ],
        max_tokens: 600,
        temperature: 0.7,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
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
        tokensUsed: data.usage?.total_tokens || 0,
        processingTime,
        cached: false
      }
    };
  }

  private buildEnhancedContext(context: WorkoutContext): EnhancedContext {
    const enhancedContext: EnhancedContext = {
      ...context,
      userStats: {
        experienceLevel: this.estimateExperienceLevel(context),
        preferredIntensity: 'moderate',
        commonMistakes: this.identifyCommonMistakes(context),
        strengthAreas: ['consistency'],
        weaknessAreas: []
      },
      workoutIntelligence: {
        fatigueLikelihood: this.assessFatigueLevel(context),
        formRiskFactors: this.identifyFormRisks(context),
        progressionOpportunities: ['progressive overload']
      },
      sessionContext: {
        timeInWorkout: context.workoutDuration || 0,
        energyLevel: this.assessEnergyLevel(context),
        performanceToday: 'average',
        comparedToLastSession: 'similar'
      },
      temporalContext: {
        timeOfDay: new Date().getHours(),
        dayOfWeek: new Date().getDay(),
        workoutFrequency: 3,
        restDaysSince: 1
      }
    };

    return enhancedContext;
  }

  private buildContextualPrompt(
    query: string, 
    context: EnhancedContext, 
    requestType: AIRequestType
  ): string {
    let prompt = `You are COACH FLEX, an expert AI fitness trainer with 20+ years of experience. You're encouraging, knowledgeable, and safety-focused.

PERSONALITY:
- Motivational but not overwhelming
- Uses fitness terminology naturally
- Celebrates progress and effort
- Always prioritizes safety
- Gives specific, actionable advice

CURRENT CONTEXT:`;

    // Add workout context
    if (context.activeWorkout) {
      prompt += `
- User is currently doing: ${context.activeWorkout.name}
- Current exercise: ${context.currentExercise?.exercise.name || 'None'}
- Sets completed today: ${this.calculateTotalSets(context)}
- Workout duration: ${Math.floor((context.workoutDuration || 0) / 60)} minutes`;
    }

    // Add exercise-specific context
    if (context.currentExercise) {
      const exercise = context.currentExercise;
      prompt += `
- Exercise focus: ${exercise.exercise.primaryMuscles.join(', ')}
- Sets completed: ${exercise.completedSets.length}/${exercise.targetSets}
- Form notes: ${exercise.formNotes || 'None'}`;
    }

    // Add user intelligence context
    if (context.userStats) {
      prompt += `
- Experience level: ${context.userStats.experienceLevel}
- Energy level: ${context.sessionContext?.energyLevel || 'moderate'}
- Time in workout: ${context.sessionContext?.timeInWorkout || 0} minutes`;
    }

    // Add temporal context
    if (context.temporalContext) {
      prompt += `
- Time of day: ${context.temporalContext.timeOfDay}:00
- Day of week: ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][context.temporalContext.dayOfWeek]}`;
    }

    // Request-type specific prompting
    switch (requestType) {
      case 'motivation':
        prompt += `

MOTIVATION FOCUS:
- Acknowledge their current effort
- Reference specific progress
- Be encouraging without overwhelming
- Include actionable next steps
- Keep under 100 words`;
        break;
      
      case 'form-analysis':
        prompt += `

FORM ANALYSIS FOCUS:
- Break down movement phases
- Identify safety concerns
- Provide 2-3 specific cues
- Consider experience level
- Prioritize injury prevention`;
        break;
      
      case 'nutrition-advice':
        prompt += `

NUTRITION GUIDANCE:
- Consider workout timing
- Give practical food suggestions
- Include portion guidance
- Add important disclaimers
- Recommend consulting registered dietitians`;
        break;
    }

    prompt += `

RESPONSE GUIDELINES:
- Keep responses under 150 words
- Be specific and actionable
- Include safety tips when relevant
- Use encouraging language
- If discussing nutrition, include disclaimers
- If user mentions pain/injury, recommend professional consultation

USER QUERY: "${query}"

RESPONSE:`;

    return prompt;
  }

  private calculateTotalSets(context: EnhancedContext): number {
    if (!context.activeWorkout) return 0;
    return context.activeWorkout.exercises.reduce((total, ex) => total + (ex.completedSets?.length || 0), 0);
  }

  private estimateExperienceLevel(context: WorkoutContext): 'beginner' | 'intermediate' | 'advanced' {
    // Simple heuristic - would be enhanced with actual user data
    const totalSets = this.calculateTotalSets(context as EnhancedContext);
    if (totalSets < 10) return 'beginner';
    if (totalSets < 30) return 'intermediate';
    return 'advanced';
  }

  private identifyCommonMistakes(context: WorkoutContext): string[] {
    const mistakes = [];
    if (context.currentExercise?.exercise.name.toLowerCase().includes('squat')) {
      mistakes.push('knee valgus', 'shallow depth');
    }
    if (context.currentExercise?.exercise.name.toLowerCase().includes('bench')) {
      mistakes.push('arched back', 'partial range of motion');
    }
    return mistakes;
  }

  private assessFatigueLevel(context: WorkoutContext): number {
    const duration = context.workoutDuration || 0;
    if (duration > 60) return 0.8; // High fatigue after 60+ minutes
    if (duration > 30) return 0.5; // Moderate fatigue
    return 0.2; // Low fatigue
  }

  private identifyFormRisks(context: WorkoutContext): string[] {
    const risks = [];
    const fatigue = this.assessFatigueLevel(context);
    if (fatigue > 0.7) {
      risks.push('fatigue-induced form breakdown');
    }
    return risks;
  }

  private assessEnergyLevel(context: WorkoutContext): 'low' | 'moderate' | 'high' {
    const duration = context.workoutDuration || 0;
    const fatigue = this.assessFatigueLevel(context);
    
    if (fatigue > 0.7 || duration > 75) return 'low';
    if (fatigue > 0.4 || duration > 45) return 'moderate';
    return 'high';
  }

  private trackUsage(provider: 'openrouter' | 'groq' | 'google', requests: number, tokens: number): void {
    const providerObj = this.providers.find(p => p.name === provider);
    if (providerObj) {
      providerObj.usedToday += requests;
      this.usageTracking.set(provider, providerObj.usedToday);
      
      // Mark as unavailable if limit reached
      if (providerObj.usedToday >= providerObj.dailyLimit) {
        providerObj.isAvailable = false;
      }
      
      this.saveUsageToStorage();
    }
  }

  private async handleProviderFailure(
    failedProvider: 'openrouter' | 'groq' | 'google',
    query: string,
    context: EnhancedContext,
    requestType: AIRequestType
  ): Promise<AIResponse> {
    // Mark provider as temporarily unavailable
    const provider = this.providers.find(p => p.name === failedProvider);
    if (provider) {
      provider.isAvailable = false;
      provider.rateLimitReset = new Date(Date.now() + 60000); // Retry in 1 minute
    }

    // Try next available provider
    const availableProviders = this.getAvailableProviders();
    if (availableProviders.length > 0) {
      const nextProvider = this.selectBestProvider(requestType);
      return this.getCoachingResponse(query, context, requestType);
    }

    // All providers failed, return intelligent fallback
    return this.getFallbackResponse(query, context, requestType);
  }

  private getFallbackResponse(
    query: string, 
    context: EnhancedContext, 
    requestType: AIRequestType
  ): AIResponse {
    let content = '';
    
    switch (requestType) {
      case 'motivation':
        content = this.getIntelligentMotivation(context);
        break;
      case 'exercise-explanation':
        content = this.getIntelligentExerciseInfo(query, context);
        break;
      case 'form-analysis':
        content = this.getIntelligentFormAnalysis(context);
        break;
      case 'nutrition-advice':
        content = this.getIntelligentNutritionAdvice(query, context);
        break;
      default:
        content = this.getIntelligentGeneralAdvice(query, context);
    }

    return {
      content,
      type: requestType,
      confidence: 0.7,
      timestamp: new Date(),
      isComplete: true,
      metadata: {
        provider: 'local-intelligent',
        model: 'contextual-fallback',
        tokensUsed: 0,
        processingTime: 50,
        cached: false
      }
    };
  }

  private getIntelligentMotivation(context: EnhancedContext): string {
    const timeInWorkout = Math.floor((context.workoutDuration || 0) / 60);
    const currentExercise = context.currentExercise?.exercise.name;
    const energyLevel = context.sessionContext?.energyLevel || 'moderate';
    
    if (timeInWorkout > 45 && energyLevel === 'low') {
      return `You've been crushing it for ${timeInWorkout} minutes! ${currentExercise ? `Your ${currentExercise} form is looking solid.` : ''} Remember, it's about quality over quantity. Take your time with each rep and listen to your body. You're building strength with every movement!`;
    }
    
    if (currentExercise) {
      return `Looking strong on those ${currentExercise}s! Focus on controlled movement and breathe through each rep. You're doing exactly what you need to build strength and improve. Keep that momentum going! 💪`;
    }
    
    return `You're putting in the work and that's what matters! Every rep, every set is building a stronger, healthier you. Stay focused on form, control your breathing, and trust the process. You've got this! 🔥`;
  }

  private getIntelligentExerciseInfo(query: string, context: EnhancedContext): string {
    const currentExercise = context.currentExercise?.exercise;
    
    if (currentExercise) {
      return `**${currentExercise.name}**\n\n**Primary Muscles:** ${currentExercise.primaryMuscles.join(', ')}\n\n**Key Form Points:**\n${currentExercise.instructions.slice(0, 3).map((inst, i) => `${i + 1}. ${inst}`).join('\n')}\n\n**Pro Tip:** ${currentExercise.tips?.[0] || 'Focus on controlled movement and proper breathing.'}\n\nBased on your current workout, maintain consistent form as fatigue sets in!`;
    }
    
    return `I'd love to help explain any exercise! Since you're currently working out, let me know which specific movement you'd like to know about. I can provide form cues, muscle targets, and safety tips tailored to your experience level.`;
  }

  private getIntelligentFormAnalysis(context: EnhancedContext): string {
    const currentExercise = context.currentExercise?.exercise.name;
    const fatigue = context.workoutIntelligence?.fatigueLikelihood || 0;
    
    if (!currentExercise) {
      return `To analyze your form, let me know which exercise you're performing. I can provide specific cues for setup, execution, and safety based on your current workout state.`;
    }
    
    let analysis = `**Form Check: ${currentExercise}**\n\n`;
    
    if (fatigue > 0.6) {
      analysis += `**Fatigue Alert:** You've been working hard! Watch for:\n• Form breakdown as you tire\n• Rushed reps - slow down if needed\n• Listen to your body\n\n`;
    }
    
    analysis += `**Key Focus Points:**\n• Maintain proper setup position\n• Control both lifting and lowering phases\n• Keep core engaged throughout\n• Breathe consistently with the movement\n\n**Safety First:** If form starts breaking down, reduce weight or rest longer between sets.`;
    
    return analysis;
  }

  private getIntelligentNutritionAdvice(query: string, context: EnhancedContext): string {
    const timeInWorkout = context.workoutDuration || 0;
    const timeOfDay = context.temporalContext?.timeOfDay || new Date().getHours();
    
    let advice = '';
    
    if (timeInWorkout > 30) {
      advice = `**During Workout Nutrition:**\nSince you're ${Math.floor(timeInWorkout / 60)} minutes into your workout:\n• Stay hydrated with water\n• Consider electrolytes if sweating heavily\n• Light carbs (banana) if energy is dropping\n\n`;
    } else if (query.toLowerCase().includes('pre workout')) {
      advice = `**Pre-Workout Nutrition:**\n• 30-60 minutes before: Light carbs + protein\n• Examples: Banana with peanut butter, oatmeal\n• Stay hydrated but don't overdo fluids\n\n`;
    } else if (query.toLowerCase().includes('post workout')) {
      advice = `**Post-Workout Nutrition:**\n• Within 30 minutes: Protein + carbs\n• Examples: Protein shake, Greek yogurt with fruit\n• Focus on recovery and muscle repair\n\n`;
    }
    
    advice += `**Important:** These are general guidelines. For personalized nutrition plans, consult with a registered dietitian who can account for your specific goals, health status, and dietary needs.`;
    
    return advice;
  }

  private getIntelligentGeneralAdvice(query: string, context: EnhancedContext): string {
    const currentExercise = context.currentExercise?.exercise.name;
    const timeInWorkout = Math.floor((context.workoutDuration || 0) / 60);
    
    if (query.toLowerCase().includes('tired') || query.toLowerCase().includes('fatigue')) {
      return `Feeling tired is normal, especially ${timeInWorkout > 30 ? `after ${timeInWorkout} minutes of training` : 'during a workout'}! Listen to your body: reduce weight if form suffers, take longer rest periods, or consider ending on a high note. Quality over quantity always wins! 💪`;
    }
    
    if (query.toLowerCase().includes('weight') && currentExercise) {
      return `For ${currentExercise}, choose a weight that challenges you while maintaining perfect form. You should be able to complete all reps with 1-2 left in the tank. If form breaks down, reduce the weight. Progressive overload happens over weeks, not single workouts!`;
    }
    
    if (query.toLowerCase().includes('rest') || query.toLowerCase().includes('break')) {
      return `Rest is crucial for performance and safety! For strength training, rest 2-5 minutes between sets. Listen to your body - if you're breathing hard or feel your form might suffer, take extra time. Quality reps are worth the wait! ⏱️`;
    }
    
    return `I'm here to help you have the best workout possible! Whether you need form tips, motivation, exercise explanations, or general fitness advice, just ask. Remember: consistency and proper form are the keys to long-term success. Keep up the great work! 🔥`;
  }

  // Public method to get provider status
  getProviderStatus(): { provider: string; available: boolean; usage: string }[] {
    return this.providers.map(p => ({
      provider: p.name,
      available: p.isAvailable,
      usage: `${p.usedToday}/${p.dailyLimit}`
    }));
  }

  // Public method to reset a provider's availability
  resetProvider(providerName: 'openrouter' | 'groq' | 'google'): void {
    const provider = this.providers.find(p => p.name === providerName);
    if (provider) {
      provider.isAvailable = true;
      provider.rateLimitReset = undefined;
    }
  }
}