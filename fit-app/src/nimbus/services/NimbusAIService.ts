import type { AIResponse, ConversationMessage } from '../../types/ai';

interface NimbusAIConfig {
  providers: AIProvider[];
  defaultModel?: string;
  maxRetries?: number;
  streamingEnabled?: boolean;
  conversationMemory?: number;
  fallbackResponses?: Map<string, string>;
}

interface AIProvider {
  name: string;
  endpoint?: string;
  apiKey?: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  priority: number; // Lower number = higher priority
}

interface StreamingOptions {
  onToken?: (token: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
  signal?: AbortSignal;
}

export class NimbusAIService {
  private config: NimbusAIConfig;
  private conversationHistory: ConversationMessage[] = [];
  private activeProvider: AIProvider | null = null;
  
  constructor(config: Partial<NimbusAIConfig> = {}) {
    this.config = {
      providers: this.getDefaultProviders(),
      maxRetries: 3,
      streamingEnabled: true,
      conversationMemory: 20,
      fallbackResponses: this.getDefaultFallbacks(),
      ...config
    };
    
    // Sort providers by priority
    this.config.providers.sort((a, b) => a.priority - b.priority);
  }
  
  private getDefaultProviders(): AIProvider[] {
    return [
      {
        name: 'openrouter',
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
        model: 'openai/gpt-3.5-turbo',
        maxTokens: 1000,
        temperature: 0.7,
        priority: 1
      },
      {
        name: 'groq',
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        apiKey: import.meta.env.VITE_GROQ_API_KEY,
        model: 'mixtral-8x7b-32768',
        maxTokens: 1000,
        temperature: 0.7,
        priority: 2
      },
      {
        name: 'google',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
        apiKey: import.meta.env.VITE_GOOGLE_AI_API_KEY,
        model: 'gemini-pro',
        maxTokens: 1000,
        temperature: 0.7,
        priority: 3
      },
      {
        name: 'local',
        model: 'fallback',
        priority: 99
      }
    ];
  }
  
  private getDefaultFallbacks(): Map<string, string> {
    const fallbacks = new Map<string, string>();
    
    fallbacks.set('general', "I'm here to help with your fitness journey! Could you please rephrase your question?");
    fallbacks.set('workout', "Let me help you with your workout. What specific exercise or routine would you like assistance with?");
    fallbacks.set('nutrition', "I can provide nutrition guidance. What would you like to know about your diet or meal planning?");
    fallbacks.set('motivation', "You're doing great! Every step forward is progress. What's your current fitness goal?");
    
    return fallbacks;
  }
  
  /**
   * Send a message with streaming support
   */
  async *streamMessage(
    message: string, 
    context?: any,
    options?: StreamingOptions
  ): AsyncGenerator<string, void, unknown> {
    const startTime = Date.now();
    let fullResponse = '';
    let lastError: Error | null = null;
    
    // Add to conversation history
    this.addToHistory('user', message);
    
    // Try each provider in order of priority
    for (const provider of this.config.providers) {
      try {
        this.activeProvider = provider;
        
        if (provider.name === 'local') {
          // Local fallback
          yield* this.streamLocalResponse(message, context);
          return;
        }
        
        // Stream from AI provider
        const stream = this.streamFromProvider(provider, message, context, options);
        
        for await (const chunk of stream) {
          fullResponse += chunk;
          yield chunk;
          
          if (options?.onToken) {
            options.onToken(chunk);
          }
        }
        
        // Success - add to history and complete
        this.addToHistory('assistant', fullResponse);
        
        if (options?.onComplete) {
          options.onComplete(fullResponse);
        }
        
        console.log(`✅ AI response streamed successfully via ${provider.name} in ${Date.now() - startTime}ms`);
        return;
        
      } catch (error) {
        lastError = error as Error;
        console.error(`❌ Provider ${provider.name} failed:`, error);
        
        // Continue to next provider
        continue;
      }
    }
    
    // All providers failed - use fallback
    if (options?.onError && lastError) {
      options.onError(lastError);
    }
    
    yield* this.streamLocalResponse(message, context);
  }
  
  /**
   * Stream from a specific AI provider
   */
  private async *streamFromProvider(
    provider: AIProvider,
    message: string,
    context: any,
    options?: StreamingOptions
  ): AsyncGenerator<string, void, unknown> {
    
    if (provider.name === 'openrouter' || provider.name === 'groq') {
      yield* this.streamFromOpenAICompatible(provider, message, context, options);
    } else if (provider.name === 'google') {
      yield* this.streamFromGoogle(provider, message, context, options);
    } else if (provider.name === 'anthropic') {
      yield* this.streamFromAnthropic(provider, message, context, options);
    } else {
      throw new Error(`Unknown provider: ${provider.name}`);
    }
  }
  
  /**
   * Stream from OpenAI-compatible APIs (OpenRouter, Groq)
   */
  private async *streamFromOpenAICompatible(
    provider: AIProvider,
    message: string,
    context: any,
    options?: StreamingOptions
  ): AsyncGenerator<string, void, unknown> {
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (provider.name === 'openrouter') {
      headers['Authorization'] = `Bearer ${provider.apiKey}`;
      headers['HTTP-Referer'] = window.location.origin;
      headers['X-Title'] = 'Nimbus Fitness AI';
    } else if (provider.name === 'groq') {
      headers['Authorization'] = `Bearer ${provider.apiKey}`;
    }
    
    const response = await fetch(provider.endpoint!, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: provider.model,
        messages: this.buildMessages(message, context),
        max_tokens: provider.maxTokens,
        temperature: provider.temperature,
        stream: true
      }),
      signal: options?.signal
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');
    
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }
  
  /**
   * Stream from Google AI (Gemini)
   */
  private async *streamFromGoogle(
    provider: AIProvider,
    message: string,
    context: any,
    options?: StreamingOptions
  ): AsyncGenerator<string, void, unknown> {
    
    const endpoint = `${provider.endpoint}/gemini-pro:streamGenerateContent?key=${provider.apiKey}`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: this.buildGooglePrompt(message, context)
          }]
        }],
        generationConfig: {
          temperature: provider.temperature,
          maxOutputTokens: provider.maxTokens,
        }
      }),
      signal: options?.signal
    });
    
    if (!response.ok) {
      throw new Error(`Google AI API error: ${response.status}`);
    }
    
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');
    
    const decoder = new TextDecoder();
    let buffer = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const data = JSON.parse(line);
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              yield text;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }
  
  /**
   * Stream from Anthropic
   */
  private async *streamFromAnthropic(
    provider: AIProvider,
    message: string,
    context: any,
    options?: StreamingOptions
  ): AsyncGenerator<string, void, unknown> {
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': provider.apiKey!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: provider.model,
        messages: this.buildMessagesAnthropic(message, context),
        max_tokens: provider.maxTokens,
        temperature: provider.temperature,
        stream: true
      }),
      signal: options?.signal
    });
    
    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }
    
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');
    
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta') {
              const content = parsed.delta?.text;
              if (content) {
                yield content;
              }
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }
  
  /**
   * Stream a local fallback response
   */
  private async *streamLocalResponse(
    message: string,
    context: any
  ): AsyncGenerator<string, void, unknown> {
    
    // Detect intent and get appropriate fallback
    const intent = this.detectIntent(message);
    const response = this.config.fallbackResponses?.get(intent) || 
                    this.config.fallbackResponses?.get('general') ||
                    "I'm here to help with your fitness journey!";
    
    // Simulate streaming by yielding words
    const words = response.split(' ');
    for (const word of words) {
      yield word + ' ';
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  
  /**
   * Build messages for OpenAI format
   */
  private buildMessages(userMessage: string, context: any): any[] {
    const messages: any[] = [
      {
        role: 'system',
        content: this.getSystemPrompt(context)
      }
    ];
    
    // Add conversation history
    const historyStart = Math.max(0, this.conversationHistory.length - this.config.conversationMemory!);
    for (let i = historyStart; i < this.conversationHistory.length; i++) {
      const msg = this.conversationHistory[i];
      messages.push({
        role: msg.role,
        content: msg.content
      });
    }
    
    // Add current message
    messages.push({
      role: 'user',
      content: userMessage
    });
    
    return messages;
  }
  
  /**
   * Build messages for Anthropic format
   */
  private buildMessagesAnthropic(userMessage: string, context: any): any[] {
    const messages: any[] = [];
    
    // Add conversation history
    const historyStart = Math.max(0, this.conversationHistory.length - this.config.conversationMemory!);
    for (let i = historyStart; i < this.conversationHistory.length; i++) {
      const msg = this.conversationHistory[i];
      messages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      });
    }
    
    // Add current message
    messages.push({
      role: 'user',
      content: userMessage
    });
    
    return messages;
  }
  
  /**
   * Build Google AI prompt
   */
  private buildGooglePrompt(userMessage: string, context: any): string {
    const systemPrompt = this.getSystemPrompt(context);
    
    // Google AI doesn't have system messages, so we combine them
    let fullPrompt = systemPrompt + '\n\n';
    
    // Add conversation history
    const historyStart = Math.max(0, this.conversationHistory.length - this.config.conversationMemory!);
    for (let i = historyStart; i < this.conversationHistory.length; i++) {
      const msg = this.conversationHistory[i];
      fullPrompt += `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}\n\n`;
    }
    
    fullPrompt += `Human: ${userMessage}\n\nAssistant:`;
    
    return fullPrompt;
  }
  
  /**
   * Get system prompt based on context
   */
  private getSystemPrompt(context: any): string {
    const basePrompt = `You are Nimbus, an advanced AI fitness coach with deep knowledge of exercise science, nutrition, and wellness. 
You're encouraging, knowledgeable, and adaptive to each user's fitness level and goals.`;
    
    if (context?.workoutActive) {
      return `${basePrompt}
The user is currently in an active workout session. Provide real-time guidance, form tips, and motivation.
Current exercise: ${context.currentExercise || 'Unknown'}
Sets completed: ${context.setsCompleted || 0}`;
    }
    
    if (context?.generatingWorkout) {
      return `${basePrompt}
Help create a personalized workout plan based on the user's goals, experience level, and available equipment.`;
    }
    
    return basePrompt;
  }
  
  /**
   * Detect user intent for fallback responses
   */
  private detectIntent(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.match(/workout|exercise|routine|plan/)) {
      return 'workout';
    }
    if (lowerMessage.match(/food|diet|nutrition|meal|eat/)) {
      return 'nutrition';
    }
    if (lowerMessage.match(/motivat|inspire|help|can't|tired/)) {
      return 'motivation';
    }
    
    return 'general';
  }
  
  /**
   * Add message to conversation history
   */
  private addToHistory(role: 'user' | 'assistant', content: string): void {
    this.conversationHistory.push({
      role,
      content,
      timestamp: new Date()
    });
    
    // Trim history if needed
    if (this.conversationHistory.length > this.config.conversationMemory! * 2) {
      this.conversationHistory = this.conversationHistory.slice(-this.config.conversationMemory!);
    }
  }
  
  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }
  
  /**
   * Get current conversation history
   */
  getHistory(): ConversationMessage[] {
    return [...this.conversationHistory];
  }
  
  /**
   * Get active provider info
   */
  getActiveProvider(): AIProvider | null {
    return this.activeProvider;
  }
}

// Export singleton instance
export const nimbusAI = new NimbusAIService();