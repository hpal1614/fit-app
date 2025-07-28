import type { WorkoutContext, AIRequestType } from '../types';

interface AIResponse {
  content: string;
  type: AIRequestType;
  confidence: number;
  timestamp: Date;
  isComplete: boolean;
  provider?: string;
  metadata?: any;
}

interface AIProvider {
  name: string;
  apiKey: string;
  endpoint: string;
  available: boolean;
}

class UnifiedAIService {
  private providers: AIProvider[] = [];
  private currentProvider = 0;
  
  constructor() {
    this.initializeProviders();
  }
  
  private initializeProviders() {
    const apiKeys = {
      openrouter: import.meta.env.VITE_OPENROUTER_API_KEY,
      groq: import.meta.env.VITE_GROQ_API_KEY,
      google: import.meta.env.VITE_GOOGLE_AI_API_KEY
    };
    
    console.log('🔑 API Keys Status:', {
      openrouter: apiKeys.openrouter ? '✅ Available' : '❌ Missing',
      groq: apiKeys.groq ? '✅ Available' : '❌ Missing', 
      google: apiKeys.google ? '✅ Available' : '❌ Missing'
    });
    
    // Initialize providers in order of preference
    if (apiKeys.openrouter) {
      this.providers.push({
        name: 'openrouter',
        apiKey: apiKeys.openrouter,
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        available: true
      });
    }
    
    if (apiKeys.groq) {
      this.providers.push({
        name: 'groq',
        apiKey: apiKeys.groq,
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        available: true
      });
    }
    
    console.log(`🚀 Initialized ${this.providers.length} AI providers`);
  }
  
  // MAIN METHOD - This is what AIChatInterface should call
  async getCoachingResponse(
    query: string,
    context: WorkoutContext,
    requestType: AIRequestType = 'general'
  ): Promise<AIResponse> {
    console.log('🤖 AI Request:', {
      query: query.substring(0, 50) + '...',
      type: requestType,
      hasContext: !!context,
      activeWorkout: context?.activeWorkout
    });
    
    // Build fitness-specific prompt
    const systemPrompt = this.buildFitnessPrompt(requestType, context);
    const userPrompt = this.buildUserPrompt(query, context);
    
    // Try providers in order
    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];
      if (!provider.available) continue;
      
      try {
        console.log(`🎯 Trying ${provider.name}...`);
        const response = await this.callProvider(provider, systemPrompt, userPrompt, requestType);
        console.log(`✅ Success with ${provider.name}`);
        return response;
      } catch (error) {
        console.warn(`❌ ${provider.name} failed:`, error);
        continue;
      }
    }
    
    // All providers failed - return intelligent fallback
    console.log('🔄 All providers failed, using intelligent fallback');
    return this.getIntelligentFallback(query, requestType);
  }
  
  private buildFitnessPrompt(requestType: AIRequestType, context: WorkoutContext): string {
    let basePrompt = `You are an expert AI fitness coach with years of experience in strength training, bodybuilding, powerlifting, and general fitness. You provide evidence-based advice that is safe, practical, and effective.

CORE PRINCIPLES:
- Safety first: Always prioritize injury prevention
- Evidence-based: Use scientific research and proven methods  
- Personalized: Adapt advice to user's level and goals
- Motivational: Be encouraging and supportive
- Clear: Use simple, actionable language

RESPONSE STYLE:
- Conversational and friendly
- Concise but comprehensive (2-4 sentences max)
- Include specific actionable steps
- Always explain the "why" behind advice
- Use encouraging language`;

    // Add context-specific prompts
    if (context?.activeWorkout) {
      basePrompt += `\n\nCURRENT WORKOUT CONTEXT:
- Active workout: ${context.activeWorkout.type}
- Current exercise: ${context.currentExercise?.exercise.name || 'None'}
- Sets completed: ${context.currentExercise?.sets.length || 0}
- User seems to be: ${context.workoutPhase || 'mid-workout'}`;
    }
    
    // Add request-type specific instructions
    switch (requestType) {
      case 'motivation':
        basePrompt += '\n\nFOCUS: Provide motivational and encouraging response. Be energetic and positive.';
        break;
      case 'form-analysis':
        basePrompt += '\n\nFOCUS: Analyze exercise form and provide specific technique corrections.';
        break;
      case 'nutrition':
        basePrompt += '\n\nFOCUS: Provide evidence-based nutrition advice for fitness goals.';
        break;
      case 'workout-planning':
        basePrompt += '\n\nFOCUS: Design effective workout routines based on user goals and equipment.';
        break;
    }
    
    return basePrompt;
  }
  
  private buildUserPrompt(query: string, context: WorkoutContext): string {
    let prompt = query;
    
    if (context?.userPreferences) {
      prompt += `\n\nUser Context:
- Fitness Level: ${context.userPreferences.fitnessLevel || 'intermediate'}
- Goals: General fitness and strength
- Equipment: ${context.userPreferences.availableEquipment || 'gym access'}`;
    }
    
    return prompt;
  }
  
  private async callProvider(
    provider: AIProvider,
    systemPrompt: string,
    userPrompt: string,
    requestType: AIRequestType
  ): Promise<AIResponse> {
    const startTime = Date.now();
    
    const requestBody = {
      model: provider.name === 'openrouter' ? 'anthropic/claude-3.5-sonnet' : 
             provider.name === 'groq' ? 'llama-3.1-70b-versatile' : 
             'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 300,
      temperature: 0.7,
      stream: false
    };
    
    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
        ...(provider.name === 'openrouter' && {
          'HTTP-Referer': window.location.origin,
          'X-Title': 'AI Fitness Coach'
        })
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`${provider.name} API error: ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || 'No response generated';
    
    return {
      content: content.trim(),
      type: requestType,
      confidence: 0.9,
      timestamp: new Date(),
      isComplete: true,
      provider: provider.name,
      metadata: {
        processingTime: Date.now() - startTime,
        model: requestBody.model
      }
    };
  }
  
  private getIntelligentFallback(query: string, requestType: AIRequestType): AIResponse {
    const lowerQuery = query.toLowerCase();
    
    let response = '';
    
    if (requestType === 'motivation' || lowerQuery.includes('motivat')) {
      response = "You've got this! Every rep, every set is building a stronger you. Remember why you started - your goals are within reach. Keep pushing forward! 💪";
    } else if (requestType === 'nutrition' || lowerQuery.includes('nutrition') || lowerQuery.includes('eat')) {
      response = "For optimal fitness results, focus on whole foods: lean proteins (chicken, fish, eggs), complex carbs (oats, rice), healthy fats (nuts, avocado), and plenty of vegetables. Stay hydrated and time your nutrition around your workouts!";
    } else if (requestType === 'form-analysis' || lowerQuery.includes('form')) {
      response = "Good form is everything! Focus on controlled movements, full range of motion, and mind-muscle connection. Start light, master the technique, then gradually increase weight. Quality over quantity always wins!";
    } else if (lowerQuery.includes('workout') || lowerQuery.includes('exercise')) {
      response = "For effective workouts, focus on compound movements like squats, deadlifts, and push-ups. Progressive overload is key - gradually increase weight, reps, or sets each week. Don't forget rest days for recovery!";
    } else {
      response = "I'm here to help with your fitness journey! I can provide workout advice, nutrition tips, form guidance, and motivation. What specific area would you like to focus on today?";
    }
    
    return {
      content: response,
      type: requestType,
      confidence: 0.7,
      timestamp: new Date(),
      isComplete: true,
      provider: 'fallback',
      metadata: { fallback: true }
    };
  }
}

// Export singleton instance
export const unifiedAIService = new UnifiedAIService();
export default unifiedAIService;
