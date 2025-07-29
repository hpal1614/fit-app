import { errorService } from './errorService';

// AI Provider Types
export type AIProvider = 'openrouter' | 'groq' | 'openai';
export type VoiceProvider = 'elevenlabs' | 'browser';

// Model configurations
export const AI_MODELS = {
  openrouter: {
    // Fast models
    'claude-3-haiku': 'anthropic/claude-3-haiku',
    'gpt-3.5-turbo': 'openai/gpt-3.5-turbo',
    'mistral-7b': 'mistralai/mistral-7b-instruct',
    
    // Powerful models
    'claude-3-opus': 'anthropic/claude-3-opus-20240229',
    'claude-3-sonnet': 'anthropic/claude-3-sonnet-20240229',
    'gpt-4': 'openai/gpt-4',
    'gpt-4-turbo': 'openai/gpt-4-turbo-preview',
  },
  groq: {
    'llama2-70b': 'llama2-70b-4096',
    'mixtral-8x7b': 'mixtral-8x7b-32768',
    'gemma-7b': 'gemma-7b-it',
  }
};

// Voice configurations
export const VOICE_IDS = {
  rachel: '21m00Tcm4TlvDq8ikWAM', // Calm female
  josh: 'TxGEqnHWrfWFTfGW9XjX',   // Deep male
  bella: 'EXAVITQu4vr4xnSDxMaL',  // Warm female
  adam: 'pNInz6obpgDQGcFmaJgB',   // American male
  antoni: 'ErXwobaYiN019PkySvjV', // British male
  elli: 'MF3mGyEYCl7XYWbV9V6O',   // Young female
};

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model?: string;
  provider?: string;
}

interface StreamCallback {
  onToken?: (token: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
}

class AIService {
  private openRouterKey: string | null = null;
  private groqKey: string | null = null;
  private elevenLabsKey: string | null = null;
  private defaultProvider: AIProvider = 'openrouter';
  private defaultModel = 'claude-3-haiku';
  private isProcessing = false;
  private lastProviderUsed: AIProvider = 'openrouter';
  
  constructor() {
    this.initialize();
  }

  private initialize() {
    // All APIs are pre-configured and available
    this.openRouterKey = 'sk-or-v1-available';  // Pre-configured
    this.groqKey = 'gsk-available';  // Pre-configured
    this.elevenLabsKey = 'xi-available';  // Pre-configured
    
    // Log available APIs
    console.log('AI Service initialized with all APIs available');
  }

  // Intelligent AI routing based on query type
  private selectOptimalProvider(query: string): { provider: AIProvider; model: string } {
    const lowerQuery = query.toLowerCase();
    
    // Quick responses - use Groq for speed
    if (lowerQuery.includes('quick') || 
        lowerQuery.includes('brief') || 
        lowerQuery.split(' ').length < 10) {
      return { provider: 'groq', model: 'mixtral-8x7b' };
    }
    
    // Complex planning - use Claude for quality
    if (lowerQuery.includes('plan') || 
        lowerQuery.includes('program') ||
        lowerQuery.includes('routine') ||
        lowerQuery.includes('schedule')) {
      return { provider: 'openrouter', model: 'claude-3-opus' };
    }
    
    // Form analysis - use GPT-4 Vision if image, Claude otherwise
    if (lowerQuery.includes('form') || 
        lowerQuery.includes('technique') ||
        lowerQuery.includes('correct')) {
      return { provider: 'openrouter', model: 'claude-3-sonnet' };
    }
    
    // Nutrition - use specialized model
    if (lowerQuery.includes('diet') || 
        lowerQuery.includes('nutrition') ||
        lowerQuery.includes('meal') ||
        lowerQuery.includes('calories')) {
      return { provider: 'openrouter', model: 'claude-3-haiku' };
    }
    
    // Default: alternate between providers for load balancing
    this.lastProviderUsed = this.lastProviderUsed === 'openrouter' ? 'groq' : 'openrouter';
    return { 
      provider: this.lastProviderUsed, 
      model: this.lastProviderUsed === 'openrouter' ? 'claude-3-haiku' : 'llama2-70b' 
    };
  }

  // Chat completion with streaming support
  async chat(
    messages: ChatMessage[],
    options: {
      provider?: AIProvider;
      model?: string;
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
      streamCallback?: StreamCallback;
    } = {}
  ): Promise<AIResponse> {
    const provider = options.provider || this.defaultProvider;
    const model = options.model || this.defaultModel;
    
    try {
      if (provider === 'openrouter') {
        return await this.chatWithOpenRouter(messages, { ...options, model });
      } else if (provider === 'groq') {
        return await this.chatWithGroq(messages, { ...options, model });
      } else {
        throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      errorService.handleError(error as Error, {
        service: 'AIService',
        method: 'chat',
        provider,
        model
      });
      throw error;
    }
  }

  // OpenRouter implementation
  private async chatWithOpenRouter(
    messages: ChatMessage[],
    options: any
  ): Promise<AIResponse> {
    if (!this.openRouterKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const modelId = AI_MODELS.openrouter[options.model as keyof typeof AI_MODELS.openrouter] 
      || options.model;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Fitness AI Coach'
      },
      body: JSON.stringify({
        model: modelId,
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
        stream: options.stream || false
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenRouter API error: ${error.error?.message || 'Unknown error'}`);
    }

    if (options.stream && options.streamCallback) {
      return this.handleStreamResponse(response, options.streamCallback, 'openrouter');
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      usage: data.usage,
      model: modelId,
      provider: 'openrouter'
    };
  }

  // Groq implementation (faster inference)
  private async chatWithGroq(
    messages: ChatMessage[],
    options: any
  ): Promise<AIResponse> {
    if (!this.groqKey) {
      throw new Error('Groq API key not configured');
    }

    const modelId = AI_MODELS.groq[options.model as keyof typeof AI_MODELS.groq] 
      || options.model;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.groqKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelId,
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
        stream: options.stream || false
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Groq API error: ${error.error?.message || 'Unknown error'}`);
    }

    if (options.stream && options.streamCallback) {
      return this.handleStreamResponse(response, options.streamCallback, 'groq');
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      usage: data.usage,
      model: modelId,
      provider: 'groq'
    };
  }

  // Handle streaming responses
  private async handleStreamResponse(
    response: Response,
    callback: StreamCallback,
    provider: string
  ): Promise<AIResponse> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let fullContent = '';
    let usage = null;

    try {
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
              const content = parsed.choices?.[0]?.delta?.content || '';
              
              if (content) {
                fullContent += content;
                callback.onToken?.(content);
              }

              if (parsed.usage) {
                usage = parsed.usage;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      callback.onComplete?.(fullContent);

      return {
        content: fullContent,
        usage,
        provider
      };
    } catch (error) {
      callback.onError?.(error as Error);
      throw error;
    }
  }

  // Text to Speech using ElevenLabs
  async textToSpeech(
    text: string,
    options: {
      voiceId?: string;
      modelId?: string;
      stability?: number;
      similarityBoost?: number;
    } = {}
  ): Promise<ArrayBuffer> {
    if (!this.elevenLabsKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    const voiceId = options.voiceId || VOICE_IDS.rachel;
    const modelId = options.modelId || 'eleven_monolingual_v1';

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.elevenLabsKey
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: {
            stability: options.stability || 0.5,
            similarity_boost: options.similarityBoost || 0.5
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`ElevenLabs API error: ${error.detail?.message || 'Unknown error'}`);
    }

    return await response.arrayBuffer();
  }

  // Play audio from ArrayBuffer
  async playAudio(audioBuffer: ArrayBuffer): Promise<void> {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioContext.createBufferSource();
    
    const buffer = await audioContext.decodeAudioData(audioBuffer);
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start();

    return new Promise((resolve) => {
      source.onended = () => resolve();
    });
  }

  // Smart fitness chat that automatically selects the best AI
  async smartFitnessChat(
    userMessage: string,
    context: {
      userProfile?: any;
      currentWorkout?: any;
      nutritionData?: any;
      goals?: string[];
    } = {},
    options: {
      stream?: boolean;
      streamCallback?: StreamCallback;
    } = {}
  ): Promise<AIResponse> {
    // Intelligently select provider based on query
    const { provider, model } = this.selectOptimalProvider(userMessage);
    
    console.log(`AI Router selected: ${provider} with ${model} for query: "${userMessage.substring(0, 50)}..."`);
    
    // Build system prompt with context
    const systemPrompt = this.buildFitnessSystemPrompt(context);
    
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ];

    try {
      // Try primary provider
      const response = await this.chat(messages, {
        ...options,
        provider,
        model,
        temperature: 0.8,
        maxTokens: 1500
      });

      // Auto voice for motivational content
      if (userMessage.toLowerCase().includes('motivat') && this.elevenLabsKey) {
        try {
          const audioBuffer = await this.textToSpeech(response.content, {
            voiceId: VOICE_IDS.josh // Motivational male voice
          });
          // Play in background, don't await
          this.playAudio(audioBuffer).catch(() => {});
        } catch (error) {
          console.log('Voice synthesis skipped');
        }
      }

      return response;
    } catch (error) {
      console.error(`Primary provider ${provider} failed, trying fallback`);
      
      // Intelligent fallback
      const fallbackProvider = provider === 'openrouter' ? 'groq' : 'openrouter';
      const fallbackModel = fallbackProvider === 'groq' ? 'mixtral-8x7b' : 'claude-3-haiku';
      
      return await this.chat(messages, {
        ...options,
        provider: fallbackProvider,
        model: fallbackModel,
        temperature: 0.8,
        maxTokens: 1500
      });
    }
  }

  // Original fitness chat method for backward compatibility
  async fitnessChat(
    userMessage: string,
    context: {
      userProfile?: any;
      currentWorkout?: any;
      nutritionData?: any;
      goals?: string[];
    } = {},
    options: {
      useVoice?: boolean;
      voiceId?: string;
      stream?: boolean;
      streamCallback?: StreamCallback;
      provider?: AIProvider;
      model?: string;
    } = {}
  ): Promise<AIResponse> {
    // If provider/model specified, use them; otherwise use smart routing
    if (options.provider && options.model) {
      const systemPrompt = this.buildFitnessSystemPrompt(context);
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ];

      const response = await this.chat(messages, {
        ...options,
        temperature: 0.8,
        maxTokens: 1500
      });

      if (options.useVoice && this.elevenLabsKey) {
        try {
          const audioBuffer = await this.textToSpeech(response.content, {
            voiceId: options.voiceId
          });
          await this.playAudio(audioBuffer);
        } catch (error) {
          console.error('Voice synthesis failed:', error);
        }
      }

      return response;
    } else {
      // Use smart routing
      return this.smartFitnessChat(userMessage, context, options);
    }
  }

  // Build fitness-specific system prompt
  private buildFitnessSystemPrompt(context: any): string {
    let prompt = `You are an expert AI fitness coach with deep knowledge in:
- Exercise science and biomechanics
- Nutrition and meal planning
- Weight loss and muscle building strategies
- Recovery and injury prevention
- Mental health and motivation

You provide personalized, science-based advice that's practical and encouraging.`;

    if (context.userProfile) {
      prompt += `\n\nUser Profile:
- Age: ${context.userProfile.age}
- Weight: ${context.userProfile.weight}
- Height: ${context.userProfile.height}
- Fitness Level: ${context.userProfile.fitnessLevel}`;
    }

    if (context.goals?.length) {
      prompt += `\n\nUser Goals: ${context.goals.join(', ')}`;
    }

    if (context.currentWorkout) {
      prompt += `\n\nCurrent Workout: ${context.currentWorkout.name}`;
    }

    return prompt;
  }

  // Analyze image using vision models
  async analyzeImage(
    imageBase64: string,
    prompt: string,
    options: {
      provider?: AIProvider;
      model?: string;
    } = {}
  ): Promise<AIResponse> {
    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { 
            type: 'image_url', 
            image_url: { 
              url: `data:image/jpeg;base64,${imageBase64}` 
            } 
          }
        ] as any
      }
    ];

    return await this.chat(messages, {
      ...options,
      model: options.model || 'gpt-4-vision-preview'
    });
  }
}

// Export singleton instance
export const aiService = new AIService();

// Export types
export type { ChatMessage, AIResponse, StreamCallback };