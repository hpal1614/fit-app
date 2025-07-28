import { EventEmitter } from 'events';
import type { 
  AIResponse, 
  AIProvider, 
  WorkoutContext, 
  AIRequestType,
  StreamingMessage,
  MCPServer 
} from '../../types/ai';

interface AIServiceConfig {
  providers: {
    openrouter: { apiKey: string; models: string[] };
    groq: { apiKey: string; models: string[] };
    google: { apiKey: string; models: string[] };
  };
  mcp: {
    enabled: boolean;
    servers: MCPServer[];
  };
  streaming: {
    enabled: boolean;
    chunkSize: number;
  };
  fallbacks: {
    enabled: boolean;
    fallbackResponses: Record<string, string>;
  };
}

export class UnifiedAIService extends EventEmitter {
  private config: AIServiceConfig;
  private providers: AIProvider[] = [];
  private conversationHistory: StreamingMessage[] = [];
  private mcpConnections: Map<string, MCPServer> = new Map();
  private rateLimits: Map<string, { count: number; resetAt: number }> = new Map();

  constructor(config?: Partial<AIServiceConfig>) {
    super();
    this.config = this.initializeConfig(config);
    this.initializeProviders();
  }

  private initializeConfig(config?: Partial<AIServiceConfig>): AIServiceConfig {
    return {
      providers: {
        openrouter: {
          apiKey: config?.providers?.openrouter?.apiKey || import.meta.env.VITE_OPENROUTER_API_KEY || '',
          models: config?.providers?.openrouter?.models || ['anthropic/claude-2', 'openai/gpt-4']
        },
        groq: {
          apiKey: config?.providers?.groq?.apiKey || import.meta.env.VITE_GROQ_API_KEY || '',
          models: config?.providers?.groq?.models || ['llama2-70b-4096', 'mixtral-8x7b-32768']
        },
        google: {
          apiKey: config?.providers?.google?.apiKey || import.meta.env.VITE_GOOGLE_AI_API_KEY || '',
          models: config?.providers?.google?.models || ['gemini-pro']
        }
      },
      mcp: {
        enabled: config?.mcp?.enabled ?? true,
        servers: config?.mcp?.servers || []
      },
      streaming: {
        enabled: config?.streaming?.enabled ?? true,
        chunkSize: config?.streaming?.chunkSize || 20
      },
      fallbacks: {
        enabled: config?.fallbacks?.enabled ?? true,
        fallbackResponses: config?.fallbacks?.fallbackResponses || this.getDefaultFallbacks()
      }
    };
  }

  private initializeProviders(): void {
    const { providers } = this.config;
    
    if (providers.groq.apiKey) {
      this.providers.push({
        name: 'groq',
        priority: 1,
        isAvailable: true,
        models: providers.groq.models
      });
    }
    
    if (providers.openrouter.apiKey) {
      this.providers.push({
        name: 'openrouter',
        priority: 2,
        isAvailable: true,
        models: providers.openrouter.models
      });
    }
    
    if (providers.google.apiKey) {
      this.providers.push({
        name: 'google',
        priority: 3,
        isAvailable: true,
        models: providers.google.models
      });
    }
  }

  // Main streaming response method
  async *streamResponse(
    query: string, 
    context?: {
      workoutContext?: WorkoutContext;
      conversationHistory?: StreamingMessage[];
      mcpEnabled?: boolean;
      requestType?: AIRequestType;
    }
  ): AsyncGenerator<string> {
    const startTime = Date.now();
    
    // Check MCP tools first if enabled
    if (context?.mcpEnabled && this.mcpConnections.size > 0) {
      const mcpResponse = await this.checkMCPTools(query);
      if (mcpResponse) {
        yield* this.streamText(mcpResponse);
        return;
      }
    }

    // Try each provider in priority order
    for (const provider of this.getAvailableProviders()) {
      try {
        if (this.isRateLimited(provider.name)) continue;

        const response = await this.callProvider(provider, query, context);
        if (response) {
          yield* this.streamText(response.content);
          
          // Update conversation history
          this.conversationHistory.push({
            role: 'user',
            content: query,
            timestamp: startTime
          });
          this.conversationHistory.push({
            role: 'assistant',
            content: response.content,
            timestamp: Date.now()
          });
          
          return;
        }
      } catch (error) {
        console.warn(`Provider ${provider.name} failed:`, error);
        this.handleProviderError(provider, error);
      }
    }

    // Fallback to local responses if all providers fail
    if (this.config.fallbacks.enabled) {
      const fallback = this.getFallbackResponse(query, context?.requestType);
      yield* this.streamText(fallback);
    }
  }

  // Provider-specific implementations
  private async callProvider(
    provider: AIProvider, 
    query: string, 
    context?: any
  ): Promise<AIResponse | null> {
    switch (provider.name) {
      case 'groq':
        return this.callGroq(query, context);
      case 'openrouter':
        return this.callOpenRouter(query, context);
      case 'google':
        return this.callGoogle(query, context);
      default:
        return null;
    }
  }

  private async callGroq(query: string, context?: any): Promise<AIResponse> {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.providers.groq.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.providers.groq.models[0],
        messages: this.buildMessages(query, context),
        temperature: 0.7,
        max_tokens: 1000,
        stream: false
      })
    });

    if (!response.ok) throw new Error(`Groq API error: ${response.status}`);
    
    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      type: context?.requestType || 'general',
      confidence: 0.9,
      sources: ['groq']
    };
  }

  private async callOpenRouter(query: string, context?: any): Promise<AIResponse> {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.providers.openrouter.apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'AI Fitness Coach',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.providers.openrouter.models[0],
        messages: this.buildMessages(query, context),
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) throw new Error(`OpenRouter API error: ${response.status}`);
    
    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      type: context?.requestType || 'general',
      confidence: 0.95,
      sources: ['openrouter']
    };
  }

  private async callGoogle(query: string, context?: any): Promise<AIResponse> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.config.providers.google.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: this.buildPrompt(query, context) }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        })
      }
    );

    if (!response.ok) throw new Error(`Google AI API error: ${response.status}`);
    
    const data = await response.json();
    return {
      content: data.candidates[0].content.parts[0].text,
      type: context?.requestType || 'general',
      confidence: 0.85,
      sources: ['google']
    };
  }

  // MCP Integration
  async connectMCPServer(config: MCPServer): Promise<void> {
    try {
      // Simulate MCP connection (actual implementation would use WebSocket/gRPC)
      const connection = {
        ...config,
        connected: true,
        lastPing: Date.now()
      };
      
      this.mcpConnections.set(config.name, connection);
      this.emit('mcp:connected', config.name);
    } catch (error) {
      console.error('Failed to connect MCP server:', error);
      throw error;
    }
  }

  async disconnectMCPServer(name: string): Promise<void> {
    if (this.mcpConnections.has(name)) {
      this.mcpConnections.delete(name);
      this.emit('mcp:disconnected', name);
    }
  }

  async listMCPServers(): Promise<MCPServer[]> {
    return Array.from(this.mcpConnections.values());
  }

  private async checkMCPTools(query: string): Promise<string | null> {
    // Check if query matches any MCP tool patterns
    for (const [name, server] of this.mcpConnections) {
      if (server.capabilities.includes('fitness-data')) {
        // Simulate MCP tool call
        if (query.toLowerCase().includes('exercise database')) {
          return 'Accessing exercise database through MCP...';
        }
      }
    }
    return null;
  }

  // Coaching-specific methods
  async getCoachingResponse(
    query: string, 
    type: 'motivation' | 'nutrition' | 'workout' | 'general'
  ): Promise<AIResponse> {
    const context = {
      requestType: type,
      systemPrompt: this.getCoachingPrompt(type)
    };
    
    let response = '';
    for await (const chunk of this.streamResponse(query, context)) {
      response += chunk;
    }
    
    return {
      content: response,
      type,
      confidence: 0.9,
      sources: ['unified-ai']
    };
  }

  async analyzeWorkoutForm(videoData: any): Promise<any> {
    // Placeholder for form analysis
    return {
      analysis: 'Form analysis requires video processing integration',
      suggestions: ['Keep your back straight', 'Control the movement'],
      score: 8.5
    };
  }

  async generateWorkoutPlan(preferences: any): Promise<any> {
    const prompt = `Generate a personalized workout plan with these preferences: ${JSON.stringify(preferences)}`;
    const response = await this.getCoachingResponse(prompt, 'workout');
    
    return {
      plan: response.content,
      duration: '4 weeks',
      difficulty: preferences.level || 'intermediate'
    };
  }

  async createNutritionPlan(goals: any): Promise<any> {
    const prompt = `Create a nutrition plan for these goals: ${JSON.stringify(goals)}`;
    const response = await this.getCoachingResponse(prompt, 'nutrition');
    
    return {
      plan: response.content,
      calories: goals.targetCalories || 2000,
      macros: goals.macros || { protein: 30, carbs: 40, fat: 30 }
    };
  }

  // Helper methods
  private *streamText(text: string): Generator<string> {
    const { chunkSize } = this.config.streaming;
    for (let i = 0; i < text.length; i += chunkSize) {
      yield text.slice(i, i + chunkSize);
    }
  }

  private buildMessages(query: string, context?: any): any[] {
    const messages = [];
    
    // Add system prompt
    messages.push({
      role: 'system',
      content: context?.systemPrompt || this.getDefaultSystemPrompt()
    });

    // Add conversation history
    if (context?.conversationHistory) {
      messages.push(...context.conversationHistory.slice(-10)); // Last 10 messages
    }

    // Add current query
    messages.push({ role: 'user', content: query });

    return messages;
  }

  private buildPrompt(query: string, context?: any): string {
    let prompt = context?.systemPrompt || this.getDefaultSystemPrompt();
    prompt += '\n\n';
    
    if (context?.workoutContext) {
      prompt += `Current workout state: ${JSON.stringify(context.workoutContext)}\n\n`;
    }
    
    prompt += `User query: ${query}`;
    
    return prompt;
  }

  private getDefaultSystemPrompt(): string {
    return `You are an AI fitness coach specialized in providing personalized workout guidance, 
    nutrition advice, and motivation. You understand exercise science, proper form, and safety. 
    Always be encouraging, knowledgeable, and focused on the user's goals and well-being.`;
  }

  private getCoachingPrompt(type: string): string {
    const prompts = {
      motivation: 'You are a motivational fitness coach. Be inspiring, energetic, and help users push through challenges.',
      nutrition: 'You are a nutrition expert. Provide evidence-based dietary advice tailored to fitness goals.',
      workout: 'You are a workout specialist. Design effective, safe exercise programs based on user needs.',
      general: this.getDefaultSystemPrompt()
    };
    
    return prompts[type] || prompts.general;
  }

  private getAvailableProviders(): AIProvider[] {
    return this.providers
      .filter(p => p.isAvailable)
      .sort((a, b) => a.priority - b.priority);
  }

  private isRateLimited(provider: string): boolean {
    const limit = this.rateLimits.get(provider);
    if (!limit) return false;
    
    if (Date.now() > limit.resetAt) {
      this.rateLimits.delete(provider);
      return false;
    }
    
    return limit.count >= 100; // Default rate limit
  }

  private handleProviderError(provider: AIProvider, error: any): void {
    // Mark provider as unavailable temporarily
    provider.isAvailable = false;
    setTimeout(() => {
      provider.isAvailable = true;
    }, 60000); // Retry after 1 minute

    // Update rate limits if needed
    if (error.status === 429) {
      this.rateLimits.set(provider.name, {
        count: 100,
        resetAt: Date.now() + 3600000 // 1 hour
      });
    }
  }

  private getDefaultFallbacks(): Record<string, string> {
    return {
      general: "I'm here to help with your fitness journey! What would you like to know about workouts, nutrition, or training?",
      workout: "Let's design a great workout! Tell me about your fitness goals and current level.",
      nutrition: "Nutrition is key to fitness success. What aspects of your diet would you like to improve?",
      motivation: "You've got this! Every workout brings you closer to your goals. What's challenging you today?",
      error: "I'm having trouble connecting right now, but I'm still here to help with your fitness questions!"
    };
  }

  private getFallbackResponse(query: string, type?: AIRequestType): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('workout') || lowerQuery.includes('exercise')) {
      return this.config.fallbacks.fallbackResponses.workout;
    }
    if (lowerQuery.includes('nutrition') || lowerQuery.includes('diet') || lowerQuery.includes('food')) {
      return this.config.fallbacks.fallbackResponses.nutrition;
    }
    if (lowerQuery.includes('motivat') || lowerQuery.includes('help')) {
      return this.config.fallbacks.fallbackResponses.motivation;
    }
    
    return this.config.fallbacks.fallbackResponses[type || 'general'];
  }
}

// Export singleton instance
export const unifiedAIService = new UnifiedAIService();