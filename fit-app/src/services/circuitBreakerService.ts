import CircuitBreaker from 'opossum';
import { monitoring } from './monitoringService';

interface CircuitBreakerConfig {
  timeout: number;
  errorThresholdPercentage: number;
  resetTimeout: number;
  rollingCountTimeout: number;
  rollingCountBuckets: number;
  name: string;
  fallback?: Function;
}

interface CircuitBreakerMetrics {
  requests: number;
  successes: number;
  failures: number;
  timeouts: number;
  fallbacks: number;
  circuitOpen: boolean;
  state: 'open' | 'half-open' | 'closed';
}

export class CircuitBreakerService {
  private breakers: Map<string, CircuitBreaker> = new Map();
  private metrics: Map<string, CircuitBreakerMetrics> = new Map();
  private logger = monitoring.getLogger();

  // Default configurations for different service types
  private readonly DEFAULT_CONFIGS = {
    ai: {
      timeout: 30000, // 30 seconds
      errorThresholdPercentage: 50,
      resetTimeout: 30000, // 30 seconds
      rollingCountTimeout: 10000, // 10 seconds
      rollingCountBuckets: 10
    },
    voice: {
      timeout: 5000, // 5 seconds
      errorThresholdPercentage: 30,
      resetTimeout: 20000, // 20 seconds
      rollingCountTimeout: 10000,
      rollingCountBuckets: 10
    },
    biometric: {
      timeout: 2000, // 2 seconds
      errorThresholdPercentage: 40,
      resetTimeout: 15000, // 15 seconds
      rollingCountTimeout: 10000,
      rollingCountBuckets: 10
    },
    api: {
      timeout: 10000, // 10 seconds
      errorThresholdPercentage: 50,
      resetTimeout: 30000, // 30 seconds
      rollingCountTimeout: 10000,
      rollingCountBuckets: 10
    }
  };

  // Create or get circuit breaker for a service
  getBreaker(
    name: string,
    serviceFunction: Function,
    config?: Partial<CircuitBreakerConfig>
  ): CircuitBreaker {
    // Return existing breaker if available
    if (this.breakers.has(name)) {
      return this.breakers.get(name)!;
    }

    // Determine config based on service type
    const serviceType = this.getServiceType(name);
    const defaultConfig = this.DEFAULT_CONFIGS[serviceType] || this.DEFAULT_CONFIGS.api;
    const finalConfig = { ...defaultConfig, name, ...config };

    // Create new circuit breaker
    const breaker = new CircuitBreaker(serviceFunction, {
      timeout: finalConfig.timeout,
      errorThresholdPercentage: finalConfig.errorThresholdPercentage,
      resetTimeout: finalConfig.resetTimeout,
      rollingCountTimeout: finalConfig.rollingCountTimeout,
      rollingCountBuckets: finalConfig.rollingCountBuckets,
      name: finalConfig.name
    });

    // Set up fallback if provided
    if (finalConfig.fallback) {
      breaker.fallback(finalConfig.fallback);
    }

    // Initialize metrics
    this.metrics.set(name, {
      requests: 0,
      successes: 0,
      failures: 0,
      timeouts: 0,
      fallbacks: 0,
      circuitOpen: false,
      state: 'closed'
    });

    // Set up event listeners
    this.setupEventListeners(breaker, name);

    // Store breaker
    this.breakers.set(name, breaker);

    this.logger.info('Circuit breaker created', { name, config: finalConfig });

    return breaker;
  }

  // Set up event listeners for circuit breaker
  private setupEventListeners(breaker: CircuitBreaker, name: string): void {
    const metrics = this.metrics.get(name)!;

    // Success event
    breaker.on('success', (result: any) => {
      metrics.requests++;
      metrics.successes++;
      
      monitoring.trackEvent('circuit_breaker_success', {
        name,
        latency: result?.latency
      });
    });

    // Failure event
    breaker.on('failure', (error: Error) => {
      metrics.requests++;
      metrics.failures++;
      
      monitoring.trackError(error, {
        component: 'circuit_breaker',
        breaker: name
      });
    });

    // Timeout event
    breaker.on('timeout', () => {
      metrics.requests++;
      metrics.timeouts++;
      
      monitoring.trackEvent('circuit_breaker_timeout', { name });
      
      this.logger.warn('Circuit breaker timeout', { name });
    });

    // Fallback event
    breaker.on('fallback', (result: any) => {
      metrics.fallbacks++;
      
      monitoring.trackEvent('circuit_breaker_fallback', {
        name,
        reason: result?.error?.message
      });
    });

    // Circuit open event
    breaker.on('open', () => {
      metrics.circuitOpen = true;
      metrics.state = 'open';
      
      monitoring.trackEvent('circuit_breaker_open', { name });
      
      this.logger.error('Circuit breaker opened', {
        name,
        metrics: this.getMetrics(name)
      });
    });

    // Circuit half-open event
    breaker.on('halfOpen', () => {
      metrics.state = 'half-open';
      
      monitoring.trackEvent('circuit_breaker_half_open', { name });
      
      this.logger.info('Circuit breaker half-open', { name });
    });

    // Circuit close event
    breaker.on('close', () => {
      metrics.circuitOpen = false;
      metrics.state = 'closed';
      
      monitoring.trackEvent('circuit_breaker_close', { name });
      
      this.logger.info('Circuit breaker closed', { name });
    });
  }

  // Get service type from name
  private getServiceType(name: string): keyof typeof this.DEFAULT_CONFIGS {
    if (name.includes('ai') || name.includes('llm') || name.includes('openai')) {
      return 'ai';
    }
    if (name.includes('voice') || name.includes('speech') || name.includes('elevenlabs')) {
      return 'voice';
    }
    if (name.includes('biometric') || name.includes('terra') || name.includes('health')) {
      return 'biometric';
    }
    return 'api';
  }

  // Get metrics for a circuit breaker
  getMetrics(name: string): CircuitBreakerMetrics | null {
    return this.metrics.get(name) || null;
  }

  // Get all metrics
  getAllMetrics(): Map<string, CircuitBreakerMetrics> {
    return new Map(this.metrics);
  }

  // Check if circuit is open
  isOpen(name: string): boolean {
    const breaker = this.breakers.get(name);
    return breaker ? breaker.opened : false;
  }

  // Force open a circuit
  open(name: string): void {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.open();
      this.logger.warn('Circuit breaker manually opened', { name });
    }
  }

  // Force close a circuit
  close(name: string): void {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.close();
      this.logger.info('Circuit breaker manually closed', { name });
    }
  }

  // Clear metrics for a circuit
  clearMetrics(name: string): void {
    const metrics = this.metrics.get(name);
    if (metrics) {
      metrics.requests = 0;
      metrics.successes = 0;
      metrics.failures = 0;
      metrics.timeouts = 0;
      metrics.fallbacks = 0;
    }
  }

  // Create wrapped function with circuit breaker
  wrap<T extends Function>(
    name: string,
    fn: T,
    config?: Partial<CircuitBreakerConfig>
  ): T {
    const breaker = this.getBreaker(name, fn, config);
    
    return (async (...args: unknown[]) => {
      try {
        return await breaker.fire(...args);
      } catch (error) {
        // Re-throw error after circuit breaker handling
        throw error;
      }
    }) as any as T;
  }

  // Health check for all circuit breakers
  healthCheck(): {
    healthy: boolean;
    breakers: Array<{
      name: string;
      state: string;
      metrics: CircuitBreakerMetrics;
    }>;
  } {
    const breakers = Array.from(this.breakers.entries()).map(([name, breaker]) => ({
      name,
      state: breaker.opened ? 'open' : breaker.halfOpen ? 'half-open' : 'closed',
      metrics: this.getMetrics(name)!
    }));

    const healthy = !breakers.some(b => b.state === 'open');

    return { healthy, breakers };
  }

  // Create fallback functions for common scenarios
  static createFallbacks = {
    // AI fallback - return cached or simple response
    ai: (error: Error) => {
      monitoring.trackEvent('circuit_breaker_ai_fallback', {
        error: error.message
      });
      
      return {
        message: "I'm having trouble processing your request right now. Please try again in a moment.",
        fromCache: false,
        fallback: true
      };
    },

    // Voice synthesis fallback - use browser TTS
    voiceSynthesis: (text: string) => {
      monitoring.trackEvent('circuit_breaker_voice_fallback');
      
      // Use browser's built-in TTS as fallback
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
      }
      
      return { fallback: true, provider: 'browser' };
    },

    // Biometric fallback - return last known good values
    biometric: (lastKnownGood?: any) => {
      monitoring.trackEvent('circuit_breaker_biometric_fallback');
      
      return {
        ...lastKnownGood,
        stale: true,
        fallback: true,
        timestamp: new Date()
      };
    },

    // API fallback - return cached data
    api: (cachedData?: any) => {
      monitoring.trackEvent('circuit_breaker_api_fallback');
      
      return {
        data: cachedData || null,
        fromCache: true,
        fallback: true,
        timestamp: new Date()
      };
    }
  };

  // Dispose all circuit breakers
  dispose(): void {
    this.breakers.forEach((breaker, name) => {
      breaker.shutdown();
      this.logger.info('Circuit breaker shutdown', { name });
    });
    
    this.breakers.clear();
    this.metrics.clear();
  }
}

// Export singleton instance
export const circuitBreaker = new CircuitBreakerService();