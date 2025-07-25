import { ConversationContext, StreamingMessage, conversationManager } from './ConversationManager';
import { v4 as uuidv4 } from 'uuid';

interface AIProvider {
  name: string;
  url: string;
  apiKey?: string;
  supportsSSE: boolean;
  model: string;
  priority: number;
}

interface ResponseCache {
  query: string;
  response: string;
  timestamp: number;
}

export class EnhancedAIService {
  private providers: AIProvider[] = [
    {
      name: 'OpenRouter',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
      supportsSSE: true,
      model: 'meta-llama/llama-3.2-3b-instruct:free',
      priority: 1
    },
    {
      name: 'Groq',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      apiKey: import.meta.env.VITE_GROQ_API_KEY,
      supportsSSE: true,
      model: 'llama3-8b-8192',
      priority: 2
    }
  ];

  private responseCache = new Map<string, ResponseCache>();
  private readonly CACHE_DURATION = 3600000; // 1 hour
  private readonly WORDS_PER_MINUTE = 180; // Streaming speed
  
  // Circuit breaker for provider health
  private providerFailures = new Map<string, number>();
  private providerLastFailure = new Map<string, number>();
  private readonly MAX_FAILURES = 3;
  private readonly FAILURE_RESET_TIME = 300000; // 5 minutes

  async streamResponse(
    message: string,
    context: ConversationContext,
    onChunk: (chunk: string) => void,
    onComplete: (response: StreamingMessage) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(message, context);
      const cached = this.getCachedResponse(cacheKey);
      
      if (cached) {
        await this.simulateStreaming(cached, onChunk);
        onComplete({
          id: uuidv4(),
          role: 'assistant',
          content: cached,
          timestamp: new Date(),
          isStreaming: false,
          isComplete: true,
          provider: 'cache'
        });
        return;
      }

      // Try each provider in order
      const availableProviders = this.getAvailableProviders();
      
      for (const provider of availableProviders) {
        try {
          const response = await this.tryProvider(provider, message, context);
          
          if (response) {
            // Cache the response
            this.cacheResponse(cacheKey, response);
            
            // Stream the response
            await this.simulateStreaming(response, onChunk);
            
            onComplete({
              id: uuidv4(),
              role: 'assistant',
              content: response,
              timestamp: new Date(),
              isStreaming: false,
              isComplete: true,
              provider: provider.name
            });
            
            // Reset failure count on success
            this.providerFailures.set(provider.name, 0);
            return;
          }
        } catch (providerError) {
          console.warn(`Provider ${provider.name} failed:`, providerError);
          this.recordProviderFailure(provider.name);
        }
      }

      // All providers failed - use fallback
      const fallback = this.getFallbackResponse(message, context);
      await this.simulateStreaming(fallback, onChunk);
      
      onComplete({
        id: uuidv4(),
        role: 'assistant',
        content: fallback,
        timestamp: new Date(),
        isStreaming: false,
        isComplete: true,
        provider: 'fallback'
      });

    } catch (error) {
      onError(error as Error);
    }
  }

  private async tryProvider(
    provider: AIProvider,
    message: string,
    context: ConversationContext
  ): Promise<string | null> {
    if (!provider.apiKey) return null;

    const systemPrompt = this.buildSystemPrompt(context);
    const messages = [
      { role: 'system', content: systemPrompt },
      ...this.formatContextMessages(context),
      { role: 'user', content: message }
    ];

    const response = await fetch(provider.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`,
        ...(provider.name === 'OpenRouter' && {
          'HTTP-Referer': window.location.origin,
          'X-Title': 'AI Fitness Coach'
        })
      },
      body: JSON.stringify({
        model: provider.model,
        messages,
        max_tokens: 1000,
        temperature: 0.7,
        stream: false // We'll simulate streaming
      })
    });

    if (!response.ok) {
      throw new Error(`Provider ${provider.name} returned ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  }

  private async simulateStreaming(
    text: string,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const words = text.split(' ');
    const msPerWord = 60000 / this.WORDS_PER_MINUTE;
    
    let currentText = '';
    
    for (let i = 0; i < words.length; i++) {
      currentText += (i > 0 ? ' ' : '') + words[i];
      onChunk(currentText);
      
      // Add natural pauses at punctuation
      const lastChar = words[i].slice(-1);
      const pauseMultiplier = ['.', '!', '?'].includes(lastChar) ? 3 : 
                             [',', ';', ':'].includes(lastChar) ? 2 : 1;
      
      await new Promise(resolve => 
        setTimeout(resolve, msPerWord * pauseMultiplier)
      );
    }
  }

  private buildSystemPrompt(context: ConversationContext): string {
    const { preferences, userProfile } = context;
    
    let prompt = `You are an expert AI fitness coach with deep knowledge in exercise science, nutrition, and wellness. `;
    
    // Add response style
    switch (preferences.responseStyle) {
      case 'concise':
        prompt += 'Provide brief, actionable responses. ';
        break;
      case 'detailed':
        prompt += 'Provide comprehensive, detailed explanations. ';
        break;
      case 'motivational':
        prompt += 'Be encouraging and motivational in your responses. ';
        break;
    }

    // Add expertise level
    prompt += `Tailor advice for ${preferences.expertise} fitness level. `;

    // Add focus area
    switch (preferences.focus) {
      case 'strength':
        prompt += 'Focus on strength training and muscle building. ';
        break;
      case 'cardio':
        prompt += 'Focus on cardiovascular fitness and endurance. ';
        break;
      case 'nutrition':
        prompt += 'Focus on nutrition and dietary guidance. ';
        break;
    }

    // Add user profile info if available
    if (userProfile) {
      prompt += `User is ${userProfile.fitnessLevel} level with goals: ${userProfile.goals.join(', ')}. `;
    }

    prompt += 'Always prioritize safety and proper form. Use clear formatting with bullet points or numbered lists when appropriate.';

    return prompt;
  }

  private formatContextMessages(context: ConversationContext): any[] {
    const compressed = conversationManager.compressContext(context.messages);
    
    // Convert to API format
    return context.messages
      .filter(m => m.role !== 'system' && m.isComplete)
      .slice(-10) // Keep last 10 messages
      .map(m => ({
        role: m.role,
        content: m.content
      }));
  }

  private getAvailableProviders(): AIProvider[] {
    const now = Date.now();
    
    return this.providers
      .filter(provider => {
        const failures = this.providerFailures.get(provider.name) || 0;
        const lastFailure = this.providerLastFailure.get(provider.name) || 0;
        
        // Skip if too many recent failures
        if (failures >= this.MAX_FAILURES) {
          // Check if enough time has passed to retry
          if (now - lastFailure < this.FAILURE_RESET_TIME) {
            return false;
          }
          // Reset failures
          this.providerFailures.set(provider.name, 0);
        }
        
        return true;
      })
      .sort((a, b) => a.priority - b.priority);
  }

  private recordProviderFailure(providerName: string) {
    const failures = (this.providerFailures.get(providerName) || 0) + 1;
    this.providerFailures.set(providerName, failures);
    this.providerLastFailure.set(providerName, Date.now());
  }

  private getCacheKey(message: string, context: ConversationContext): string {
    const recentContext = context.messages.slice(-3).map(m => m.content).join('|');
    return `${recentContext}|${message}`;
  }

  private getCachedResponse(key: string): string | null {
    const cached = this.responseCache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.responseCache.delete(key);
      return null;
    }
    
    return cached.response;
  }

  private cacheResponse(key: string, response: string) {
    this.responseCache.set(key, {
      query: key,
      response,
      timestamp: Date.now()
    });

    // Limit cache size
    if (this.responseCache.size > 100) {
      const oldestKey = Array.from(this.responseCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      this.responseCache.delete(oldestKey);
    }
  }

  private getFallbackResponse(message: string, context: ConversationContext): string {
    const msgLower = message.toLowerCase();
    
    // Workout-related fallbacks
    if (msgLower.includes('workout') || msgLower.includes('exercise')) {
      return "I recommend starting with compound exercises that work multiple muscle groups. Focus on proper form with exercises like squats, deadlifts, push-ups, and rows. Start with 3 sets of 8-12 reps and gradually increase intensity as you progress.";
    }
    
    // Nutrition-related fallbacks
    if (msgLower.includes('nutrition') || msgLower.includes('diet') || msgLower.includes('food')) {
      return "For optimal fitness nutrition, focus on whole foods with balanced macronutrients. Aim for lean proteins, complex carbohydrates, healthy fats, and plenty of vegetables. Stay hydrated and time your meals around your workouts for best results.";
    }
    
    // Form-related fallbacks
    if (msgLower.includes('form') || msgLower.includes('technique')) {
      return "Proper form is crucial for safety and effectiveness. Focus on controlled movements, maintain neutral spine alignment, and never sacrifice form for heavier weight. Consider working with a trainer initially to ensure correct technique.";
    }
    
    // Motivation fallbacks
    if (msgLower.includes('motivation') || msgLower.includes('tired') || msgLower.includes('help')) {
      return "Remember why you started this fitness journey! Every workout brings you closer to your goals. Start small, be consistent, and celebrate small victories. Progress takes time, but every step counts. You've got this! 💪";
    }
    
    // General fallback
    return "I'm here to help with your fitness journey! I can provide guidance on workouts, nutrition, form techniques, and motivation. What specific area would you like to focus on today?";
  }

  // Regenerate response with different parameters
  async regenerateResponse(
    originalMessage: string,
    context: ConversationContext,
    options: {
      style?: 'shorter' | 'longer' | 'different' | 'simpler';
      focus?: 'practical' | 'scientific' | 'motivational';
    },
    onChunk: (chunk: string) => void,
    onComplete: (response: StreamingMessage) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    let modifiedMessage = originalMessage;
    
    // Modify the prompt based on options
    switch (options.style) {
      case 'shorter':
        modifiedMessage = `Give a brief, concise response to: ${originalMessage}`;
        break;
      case 'longer':
        modifiedMessage = `Provide a detailed, comprehensive response to: ${originalMessage}`;
        break;
      case 'simpler':
        modifiedMessage = `Explain in simple terms: ${originalMessage}`;
        break;
      case 'different':
        modifiedMessage = `Provide an alternative perspective on: ${originalMessage}`;
        break;
    }
    
    if (options.focus) {
      modifiedMessage += ` Focus on ${options.focus} aspects.`;
    }
    
    // Clear cache for regeneration
    const cacheKey = this.getCacheKey(originalMessage, context);
    this.responseCache.delete(cacheKey);
    
    await this.streamResponse(modifiedMessage, context, onChunk, onComplete, onError);
  }
}

// Export singleton instance
export const enhancedAIService = new EnhancedAIService();