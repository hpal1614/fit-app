import { monitoring } from './monitoringService';

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
  keyGenerator?: (context: any) => string;  // Function to generate rate limit key
  skipSuccessfulRequests?: boolean;  // Don't count successful requests
  skipFailedRequests?: boolean;  // Don't count failed requests
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequestTime: number;
}

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export class RateLimiterService {
  private limiters: Map<string, Map<string, RateLimitEntry>> = new Map();
  private configs: Map<string, RateLimitConfig> = new Map();
  private logger = monitoring.getLogger();

  // Default rate limit configurations
  private readonly DEFAULT_LIMITS = {
    // AI requests - conservative limits
    ai_chat: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10
    },
    ai_completion: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20
    },
    
    // Voice services - moderate limits
    voice_synthesis: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30
    },
    voice_streaming: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 5 // Concurrent streams
    },
    
    // Form analysis - higher limits
    form_analysis: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 60 // 1 per second
    },
    
    // Biometric updates - very high limits
    biometric_update: {
      windowMs: 1000, // 1 second
      maxRequests: 10 // 10 Hz max
    },
    
    // API endpoints
    api_general: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100
    },
    api_auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5 // Prevent brute force
    }
  };

  // Configure rate limiter
  configure(name: string, config: RateLimitConfig): void {
    this.configs.set(name, config);
    this.limiters.set(name, new Map());
    
    this.logger.info('Rate limiter configured', { name, config });
  }

  // Check rate limit
  async checkLimit(
    limiterName: string,
    key?: string,
    context?: any
  ): Promise<RateLimitResult> {
    // Get or create limiter config
    let config = this.configs.get(limiterName);
    if (!config) {
      // Use default config if available
      const defaultConfig = this.DEFAULT_LIMITS[limiterName];
      if (defaultConfig) {
        config = defaultConfig;
        this.configure(limiterName, config);
      } else {
        // No config found, allow by default
        return {
          allowed: true,
          limit: Infinity,
          remaining: Infinity,
          resetTime: 0
        };
      }
    }

    // Generate key
    const rateLimitKey = key || (config.keyGenerator ? config.keyGenerator(context) : 'global');
    
    // Get limiter map
    let limiterMap = this.limiters.get(limiterName);
    if (!limiterMap) {
      limiterMap = new Map();
      this.limiters.set(limiterName, limiterMap);
    }

    // Get or create entry
    const now = Date.now();
    let entry = limiterMap.get(rateLimitKey);
    
    if (!entry || now >= entry.resetTime) {
      // Create new entry or reset existing
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
        firstRequestTime: now
      };
      limiterMap.set(rateLimitKey, entry);
    }

    // Check limit
    const allowed = entry.count < config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - entry.count);
    const retryAfter = allowed ? undefined : Math.ceil((entry.resetTime - now) / 1000);

    // Increment count if checking (not just querying)
    if (allowed) {
      entry.count++;
    }

    // Track metrics
    if (!allowed) {
      monitoring.trackEvent('rate_limit_exceeded', {
        limiter: limiterName,
        key: rateLimitKey,
        limit: config.maxRequests,
        windowMs: config.windowMs
      });
      
      this.logger.warn('Rate limit exceeded', {
        limiter: limiterName,
        key: rateLimitKey,
        retryAfter
      });
    }

    return {
      allowed,
      limit: config.maxRequests,
      remaining,
      resetTime: entry.resetTime,
      retryAfter
    };
  }

  // Reset rate limit for a specific key
  reset(limiterName: string, key?: string): void {
    const limiterMap = this.limiters.get(limiterName);
    if (limiterMap) {
      if (key) {
        limiterMap.delete(key);
      } else {
        limiterMap.clear();
      }
      
      this.logger.info('Rate limit reset', { limiter: limiterName, key });
    }
  }

  // Get current usage for a limiter
  getUsage(limiterName: string, key?: string): {
    current: number;
    limit: number;
    percentage: number;
  } | null {
    const config = this.configs.get(limiterName);
    const limiterMap = this.limiters.get(limiterName);
    
    if (!config || !limiterMap) return null;
    
    const rateLimitKey = key || 'global';
    const entry = limiterMap.get(rateLimitKey);
    
    if (!entry || Date.now() >= entry.resetTime) {
      return {
        current: 0,
        limit: config.maxRequests,
        percentage: 0
      };
    }

    return {
      current: entry.count,
      limit: config.maxRequests,
      percentage: (entry.count / config.maxRequests) * 100
    };
  }

  // Create middleware for Express-like APIs
  middleware(limiterName: string) {
    return async (req: any, res: any, next: any) => {
      const key = req.ip || req.connection.remoteAddress;
      const result = await this.checkLimit(limiterName, key, { req });

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', result.limit);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

      if (!result.allowed) {
        res.setHeader('Retry-After', result.retryAfter);
        res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded',
          retryAfter: result.retryAfter
        });
        return;
      }

      next();
    };
  }

  // Decorator for class methods
  limit(limiterName: string, keyExtractor?: (args: unknown[]) => string) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value;

      descriptor.value = async function(...args: unknown[]) {
        const key = keyExtractor ? keyExtractor(args) : undefined;
        const result = await this.checkLimit(limiterName, key);

        if (!result.allowed) {
          throw new Error(`Rate limit exceeded. Retry after ${result.retryAfter} seconds`);
        }

        return originalMethod.apply(this, args);
      }.bind(this);

      return descriptor;
    };
  }

  // Cleanup old entries
  cleanup(): void {
    const now = Date.now();
    let totalCleaned = 0;

    this.limiters.forEach((limiterMap, limiterName) => {
      const sizeBefore = limiterMap.size;
      
      limiterMap.forEach((entry, key) => {
        if (now >= entry.resetTime) {
          limiterMap.delete(key);
        }
      });
      
      const cleaned = sizeBefore - limiterMap.size;
      if (cleaned > 0) {
        totalCleaned += cleaned;
        this.logger.debug('Rate limiter cleanup', {
          limiter: limiterName,
          entriesCleaned: cleaned
        });
      }
    });

    if (totalCleaned > 0) {
      monitoring.trackEvent('rate_limiter_cleanup', {
        totalCleaned
      });
    }
  }

  // Start periodic cleanup
  startCleanupInterval(intervalMs: number = 60000): void {
    setInterval(() => {
      this.cleanup();
    }, intervalMs);
    
    this.logger.info('Rate limiter cleanup interval started', { intervalMs });
  }

  // Get all rate limiter stats
  getStats(): Map<string, {
    config: RateLimitConfig;
    activeKeys: number;
    totalRequests: number;
  }> {
    const stats = new Map();

    this.configs.forEach((config, limiterName) => {
      const limiterMap = this.limiters.get(limiterName) || new Map();
      let totalRequests = 0;
      
      limiterMap.forEach(entry => {
        if (Date.now() < entry.resetTime) {
          totalRequests += entry.count;
        }
      });

      stats.set(limiterName, {
        config,
        activeKeys: limiterMap.size,
        totalRequests
      });
    });

    return stats;
  }

  // Create token bucket rate limiter (alternative algorithm)
  createTokenBucket(
    capacity: number,
    refillRate: number,
    refillInterval: number = 1000
  ): {
    consume: (tokens?: number) => boolean;
    getTokens: () => number;
  } {
    let tokens = capacity;
    let lastRefill = Date.now();

    const refill = () => {
      const now = Date.now();
      const timePassed = now - lastRefill;
      const tokensToAdd = (timePassed / refillInterval) * refillRate;
      tokens = Math.min(capacity, tokens + tokensToAdd);
      lastRefill = now;
    };

    return {
      consume: (tokensRequested: number = 1) => {
        refill();
        if (tokens >= tokensRequested) {
          tokens -= tokensRequested;
          return true;
        }
        return false;
      },
      getTokens: () => {
        refill();
        return tokens;
      }
    };
  }

  // Health check
  healthCheck(): {
    healthy: boolean;
    limiters: Array<{
      name: string;
      activeKeys: number;
      config: RateLimitConfig;
    }>;
  } {
    const limiters = Array.from(this.configs.entries()).map(([name, config]) => {
      const limiterMap = this.limiters.get(name) || new Map();
      return {
        name,
        activeKeys: limiterMap.size,
        config
      };
    });

    return {
      healthy: true,
      limiters
    };
  }

  // Dispose
  dispose(): void {
    this.limiters.clear();
    this.configs.clear();
    
    this.logger.info('Rate limiter service disposed');
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiterService();

// Start cleanup interval
rateLimiter.startCleanupInterval();