import { aiServiceFactory } from './aiServiceFactory';
import { monitoring } from './monitoringService';
import { circuitBreaker } from './circuitBreakerService';
import { rateLimiter } from './rateLimiterService';
import { cache } from './cacheService';

interface ProductionAIConfig {
  enableMonitoring: boolean;
  enableCircuitBreaker: boolean;
  enableRateLimiting: boolean;
  enableCaching: boolean;
  fallbackResponses?: Map<string, string>;
}

interface AIRequestMetadata {
  userId?: string;
  sessionId?: string;
  requestType?: string;
  tags?: string[];
}

interface AIResponse {
  message: string;
  metadata?: {
    model?: string;
    tokens?: { prompt: number; completion: number };
    cached?: boolean;
    fallback?: boolean;
    latency?: number;
  };
}

export class ProductionAIService {
  private config: ProductionAIConfig;
  private logger = monitoring.getLogger();
  private requestCount = 0;
  private totalTokens = { prompt: 0, completion: 0 };
  private aiService: any;
  
  // Circuit breaker wrapped functions
  private wrappedSendMessage: any;
  private wrappedStreamMessage: any;

  constructor(config: Partial<ProductionAIConfig> = {}) {
    this.config = {
      enableMonitoring: true,
      enableCircuitBreaker: true,
      enableRateLimiting: true,
      enableCaching: true,
      fallbackResponses: new Map([
        ['greeting', 'Hello! How can I help you with your fitness journey today?'],
        ['error', 'I apologize, but I\'m having trouble processing your request. Please try again.'],
        ['workout', 'Here\'s a simple workout: 3 sets of 10 push-ups, 15 squats, and 20 jumping jacks.'],
        ['motivation', 'You\'re doing great! Every workout counts towards your fitness goals.']
      ]),
      ...config
    };

    // Get AI service from factory
    this.aiService = aiServiceFactory.getBaseAIService();

    // Wrap AI service methods with circuit breakers
    this.wrappedSendMessage = this.config.enableCircuitBreaker
      ? circuitBreaker.wrap(
          'ai_sendMessage',
          this.aiService.sendMessage?.bind(this.aiService) || this.createAIFallback('error'),
          {
            fallback: this.createAIFallback('error')
          }
        )
      : this.aiService.sendMessage?.bind(this.aiService) || this.createAIFallback('error');

    this.wrappedStreamMessage = this.config.enableCircuitBreaker
      ? circuitBreaker.wrap(
          'ai_streamMessage',
          this.aiService.streamMessage?.bind(this.aiService) || this.createStreamFallback(),
          {
            fallback: this.createStreamFallback()
          }
        )
      : this.aiService.streamMessage?.bind(this.aiService) || this.createStreamFallback();

    this.logger.info('Production AI service initialized', { config: this.config });
  }

  // Send message with production features
  async sendMessage(
    message: string,
    metadata?: AIRequestMetadata
  ): Promise<AIResponse> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    try {
      // Check rate limit
      if (this.config.enableRateLimiting) {
        const rateLimitResult = await rateLimiter.checkLimit(
          'ai_chat',
          metadata?.userId || metadata?.sessionId
        );
        
        if (!rateLimitResult.allowed) {
          throw new Error(`Rate limit exceeded. Retry after ${rateLimitResult.retryAfter} seconds`);
        }
      }

      // Check cache
      if (this.config.enableCaching) {
        const cacheKey = this.generateCacheKey(message, metadata);
        const cachedResponse = await cache.get(cacheKey);
        
        if (cachedResponse) {
          const response = JSON.parse(cachedResponse);
          
          // Track cache hit
          if (this.config.enableMonitoring) {
            monitoring.trackEvent('ai_cache_hit', {
              requestId,
              cacheKey,
              ...metadata
            });
          }
          
          return {
            ...response,
            metadata: {
              ...response.metadata,
              cached: true,
              latency: Date.now() - startTime
            }
          };
        }
      }

      // Make AI request
      const response = await this.wrappedSendMessage(message);
      
      // Estimate tokens (simplified)
      const tokens = {
        prompt: Math.ceil(message.length / 4),
        completion: Math.ceil(response.message.length / 4)
      };
      
      this.totalTokens.prompt += tokens.prompt;
      this.totalTokens.completion += tokens.completion;
      this.requestCount++;

      // Cache response
      if (this.config.enableCaching && !response.fromCache) {
        const cacheKey = this.generateCacheKey(message, metadata);
        await cache.set(
          cacheKey,
          JSON.stringify({ message: response.message }),
          300 // 5 minute TTL
        );
      }

      // Track in monitoring
      if (this.config.enableMonitoring) {
        await monitoring.trackAIRequest({
          model: response.model || 'gpt-3.5-turbo',
          prompt: message,
          response: response.message,
          latency: Date.now() - startTime,
          tokens,
          metadata: {
            requestId,
            ...metadata,
            cached: response.fromCache || false
          }
        });
      }

      return {
        message: response.message,
        metadata: {
          model: response.model,
          tokens,
          cached: response.fromCache || false,
          latency: Date.now() - startTime
        }
      };

    } catch (error) {
      // Track error
      if (this.config.enableMonitoring) {
        monitoring.trackAIError({
          model: 'gpt-3.5-turbo',
          error: error as Error,
          prompt: message,
          metadata: {
            requestId,
            ...metadata
          }
        });
      }

      // Return fallback response
      const fallbackType = this.detectFallbackType(message);
      const fallbackMessage = this.config.fallbackResponses?.get(fallbackType) || 
                            'I apologize, but I\'m unable to process your request right now.';

      return {
        message: fallbackMessage,
        metadata: {
          fallback: true,
          latency: Date.now() - startTime
        }
      };
    }
  }

  // Stream message with production features
  async *streamMessage(
    message: string,
    metadata?: AIRequestMetadata
  ): AsyncGenerator<string, void, unknown> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    let totalContent = '';
    
    try {
      // Check rate limit
      if (this.config.enableRateLimiting) {
        const rateLimitResult = await rateLimiter.checkLimit(
          'ai_completion',
          metadata?.userId || metadata?.sessionId
        );
        
        if (!rateLimitResult.allowed) {
          throw new Error(`Rate limit exceeded. Retry after ${rateLimitResult.retryAfter} seconds`);
        }
      }

      // Stream from AI
      const stream = this.wrappedStreamMessage(message);
      
      for await (const chunk of stream) {
        totalContent += chunk;
        yield chunk;
      }

      // Track successful completion
      if (this.config.enableMonitoring) {
        const tokens = {
          prompt: Math.ceil(message.length / 4),
          completion: Math.ceil(totalContent.length / 4)
        };
        
        await monitoring.trackAIRequest({
          model: 'gpt-3.5-turbo',
          prompt: message,
          response: totalContent,
          latency: Date.now() - startTime,
          tokens,
          metadata: {
            requestId,
            streaming: true,
            ...metadata
          }
        });
      }

    } catch (error) {
      // Track error
      if (this.config.enableMonitoring) {
        monitoring.trackAIError({
          model: 'gpt-3.5-turbo',
          error: error as Error,
          prompt: message,
          metadata: {
            requestId,
            streaming: true,
            ...metadata
          }
        });
      }

      // Yield fallback response
      const fallbackType = this.detectFallbackType(message);
      const fallbackMessage = this.config.fallbackResponses?.get(fallbackType) || 
                            'I apologize, but I\'m unable to process your request right now.';
      
      yield fallbackMessage;
    }
  }

  // Get fitness-specific coaching response
  async getCoachingResponse(
    context: string,
    userProfile?: any,
    metadata?: AIRequestMetadata
  ): Promise<AIResponse> {
    const enhancedPrompt = this.buildCoachingPrompt(context, userProfile);
    return this.sendMessage(enhancedPrompt, {
      ...metadata,
      requestType: 'coaching'
    });
  }

  // Get form analysis insights
  async getFormAnalysisInsights(
    formData: any,
    metadata?: AIRequestMetadata
  ): Promise<AIResponse> {
    const prompt = `Analyze this exercise form data and provide specific corrections:
      Exercise: ${formData.exercise}
      Form Score: ${formData.formScore}%
      Errors: ${JSON.stringify(formData.errors)}
      
      Provide 2-3 specific, actionable tips to improve form.`;
    
    return this.sendMessage(prompt, {
      ...metadata,
      requestType: 'form_analysis'
    });
  }

  // Get biometric insights
  async getBiometricInsights(
    biometricData: any,
    metadata?: AIRequestMetadata
  ): Promise<AIResponse> {
    const prompt = `Based on these biometric readings:
      Heart Rate: ${biometricData.heartRate} bpm
      HRV: ${biometricData.hrv} ms
      Stress Level: ${biometricData.stress}%
      Recovery Score: ${biometricData.recovery}%
      
      Provide personalized workout recommendations.`;
    
    return this.sendMessage(prompt, {
      ...metadata,
      requestType: 'biometric_analysis'
    });
  }

  // Build enhanced coaching prompt
  private buildCoachingPrompt(context: string, userProfile?: any): string {
    let prompt = context;
    
    if (userProfile) {
      prompt += `\n\nUser Profile:
        - Fitness Level: ${userProfile.fitnessLevel || 'intermediate'}
        - Goals: ${userProfile.goals?.join(', ') || 'general fitness'}
        - Preferences: ${userProfile.preferences?.join(', ') || 'none specified'}
        - Recent Activity: ${userProfile.recentActivity || 'unknown'}`;
    }
    
    prompt += '\n\nProvide personalized, encouraging, and scientifically-backed advice.';
    
    return prompt;
  }

  // Generate cache key
  private generateCacheKey(message: string, metadata?: AIRequestMetadata): string {
    const baseKey = message.toLowerCase().trim().substring(0, 100);
    const metaKey = metadata?.requestType || 'general';
    return `ai:${metaKey}:${baseKey}`;
  }

  // Generate request ID
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Detect fallback type based on message content
  private detectFallbackType(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return 'greeting';
    }
    if (lowerMessage.includes('workout') || lowerMessage.includes('exercise')) {
      return 'workout';
    }
    if (lowerMessage.includes('motivat') || lowerMessage.includes('encourag')) {
      return 'motivation';
    }
    
    return 'error';
  }

  // Create AI fallback function
  private createAIFallback(type: string) {
    return (error: Error) => {
      const fallbackMessage = this.config.fallbackResponses?.get(type) || 
                            'I apologize, but I\'m unable to process your request right now.';
      
      return {
        message: fallbackMessage,
        fromCache: false,
        fallback: true,
        error: error.message
      };
    };
  }

  // Create stream fallback function
  private createStreamFallback() {
    return async function* (error: Error) {
      const fallbackMessage = 'I apologize, but I\'m unable to process your request right now.';
      yield fallbackMessage;
    };
  }

  // Get service metrics
  getMetrics(): {
    requestCount: number;
    totalTokens: { prompt: number; completion: number };
    averageTokensPerRequest: { prompt: number; completion: number };
    circuitBreakerStatus: any;
    rateLimiterStatus: any;
  } {
    const cbStatus = circuitBreaker.getMetrics('ai_sendMessage');
    const rlStatus = rateLimiter.getUsage('ai_chat');
    
    return {
      requestCount: this.requestCount,
      totalTokens: this.totalTokens,
      averageTokensPerRequest: {
        prompt: this.requestCount > 0 ? this.totalTokens.prompt / this.requestCount : 0,
        completion: this.requestCount > 0 ? this.totalTokens.completion / this.requestCount : 0
      },
      circuitBreakerStatus: cbStatus,
      rateLimiterStatus: rlStatus
    };
  }

  // Health check
  async healthCheck(): Promise<{
    healthy: boolean;
    services: {
      ai: boolean;
      circuitBreaker: boolean;
      rateLimiter: boolean;
      cache: boolean;
    };
  }> {
    const services = {
      ai: false,
      circuitBreaker: !circuitBreaker.isOpen('ai_sendMessage'),
      rateLimiter: true,
      cache: true
    };

    // Test AI service
    try {
      const response = await this.aiService.sendMessage('test');
      services.ai = !!response.message;
    } catch (error) {
      services.ai = false;
    }

    const healthy = Object.values(services).every(v => v);
    
    return { healthy, services };
  }

  // Reset metrics
  resetMetrics(): void {
    this.requestCount = 0;
    this.totalTokens = { prompt: 0, completion: 0 };
    circuitBreaker.clearMetrics('ai_sendMessage');
    circuitBreaker.clearMetrics('ai_streamMessage');
  }

  // Dispose
  dispose(): void {
    this.logger.info('Production AI service disposed');
  }
}

// Export singleton instance
export const productionAI = new ProductionAIService();