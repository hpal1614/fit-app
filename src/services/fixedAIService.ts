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

class FixedAIService {
  private providers: AIProvider[] = [];
  private initialized = false;
  
  constructor() {
    this.initializeProviders();
  }
  
  private initializeProviders() {
    if (this.initialized) return;
    
    const apiKeys = {
      openrouter: import.meta.env.VITE_OPENROUTER_API_KEY,
      groq: import.meta.env.VITE_GROQ_API_KEY,
      google: import.meta.env.VITE_GOOGLE_AI_API_KEY
    };
    
    // Log API key status (safely)
    console.log('🔑 API Keys Status:', {
      openrouter: apiKeys.openrouter ? `✅ Available (${apiKeys.openrouter.length} chars)` : '❌ Missing',
      groq: apiKeys.groq ? `✅ Available (${apiKeys.groq.length} chars)` : '❌ Missing',
      google: apiKeys.google ? `✅ Available (${apiKeys.google.length} chars)` : '❌ Missing'
    });
    
    // Initialize OpenRouter if key exists and looks valid
    if (apiKeys.openrouter && apiKeys.openrouter.startsWith('sk-or-')) {
      this.providers.push({
        name: 'openrouter',
        apiKey: apiKeys.openrouter,
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        available: true
      });
    }
    
    // Initialize Groq if key exists and looks valid  
    if (apiKeys.groq && apiKeys.groq.startsWith('gsk_')) {
      this.providers.push({
        name: 'groq',
        apiKey: apiKeys.groq,
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        available: true
      });
    }
    
    console.log(`🚀 Initialized ${this.providers.length} valid AI providers`);
    this.initialized = true;
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
      providers: this.providers.length
    });
    
    // Special handling for BMI requests
    if (query.toLowerCase().includes('bmi')) {
      return this.handleBMIRequest(query);
    }
    
    // Build fitness-specific prompt
    const systemPrompt = this.buildFitnessPrompt(requestType, context);
    const userPrompt = query;
    
    // Try providers in order
    for (const provider of this.providers) {
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
  
  private handleBMIRequest(query: string): AIResponse {
    return {
      content: `To calculate your BMI (Body Mass Index), I need your height and weight!

📊 **BMI Formula**: BMI = weight (kg) ÷ [height (m)]²

**How to provide your info:**
• "I'm 5'8" and weigh 150 pounds"
• "I'm 175cm and 70kg"

**BMI Categories:**
• Underweight: Below 18.5
• Normal: 18.5-24.9  
• Overweight: 25-29.9
• Obese: 30+

Just tell me your height and weight, and I'll calculate it for you! 📏⚖️`,
      type: 'general' as AIRequestType,
      confidence: 0.95,
      timestamp: new Date(),
      isComplete: true,
      provider: 'specialized',
      metadata: { type: 'bmi_calculator' }
    };
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
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${provider.apiKey}`,
      'Content-Type': 'application/json'
    };
    
    // Add OpenRouter-specific headers
    if (provider.name === 'openrouter') {
      headers['HTTP-Referer'] = window.location.origin;
      headers['X-Title'] = 'AI Fitness Coach';
    }
    
    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${provider.name} API error: ${response.status} - ${errorText}`);
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
    
    if (lowerQuery.includes('bmi')) {
      response = this.handleBMIRequest(query).content;
    } else if (requestType === 'motivation' || lowerQuery.includes('motivat') || lowerQuery.includes('tired') || lowerQuery.includes('push')) {
      response = "You've got this! 💪 Every workout brings you closer to your goals. The hardest part is showing up, and you're already here. Push through - your future self will thank you for not giving up today!";
    } else if (requestType === 'nutrition' || lowerQuery.includes('nutrition') || lowerQuery.includes('eat') || lowerQuery.includes('diet')) {
      response = "For optimal fitness results, focus on whole foods: lean proteins (chicken, fish, eggs), complex carbs (oats, rice, sweet potatoes), healthy fats (nuts, avocado), and plenty of colorful vegetables. Stay hydrated and time your nutrition around your workouts!";
    } else if (requestType === 'form-analysis' || lowerQuery.includes('form') || lowerQuery.includes('technique')) {
      response = "Perfect form is everything! Focus on: controlled movements, full range of motion, proper breathing, and mind-muscle connection. Start light, master the technique, then gradually increase weight. Quality always beats quantity!";
    } else if (lowerQuery.includes('workout') || lowerQuery.includes('exercise') || lowerQuery.includes('training')) {
      response = "For effective workouts, prioritize compound movements like squats, deadlifts, bench press, and rows. These work multiple muscle groups efficiently. Apply progressive overload by gradually increasing weight, reps, or sets each week. Don't forget adequate rest between sessions!";
    } else {
      response = "I'm your AI fitness coach, ready to help! 🏋️‍♂️ I can assist with workout planning, exercise form, nutrition advice, motivation, and fitness calculations like BMI. What specific area would you like to focus on today?";
    }
    
    return {
      content: response,
      type: requestType,
      confidence: 0.8,
      timestamp: new Date(),
      isComplete: true,
      provider: 'intelligent_fallback',
      metadata: { fallback: true, reason: 'no_api_providers_available' }
    };
  }
}

// Export singleton instance
export const fixedAIService = new FixedAIService();
export default fixedAIService;