import { monitoring } from './monitoringService';
import { circuitBreaker } from './circuitBreakerService';
import { rateLimiter } from './rateLimiterService';
import { productionAI } from './productionAIService';
import { voiceService } from './voiceService';
import { terraService } from './terraService';
import { poseDetection } from './poseDetectionService';
import { cache } from './cacheService';
import { register } from 'prom-client';

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
  error?: string;
  metadata?: unknown;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  services: ServiceHealth[];
  metrics: {
    uptime: number;
    memory: unknown;
    cpu?: number;
  };
}

interface HealthCheckConfig {
  enableDetailedChecks: boolean;
  timeoutMs: number;
  includeMetrics: boolean;
}

export class HealthCheckService {
  private startTime = Date.now();
  private healthHistory: SystemHealth[] = [];
  private config: HealthCheckConfig;
  private logger = monitoring.getLogger();
  
  // Health check intervals
  private checkIntervals = new Map<string, NodeJS.Timeout>();

  constructor(config: Partial<HealthCheckConfig> = {}) {
    this.config = {
      enableDetailedChecks: true,
      timeoutMs: 5000,
      includeMetrics: true,
      ...config
    };
  }

  // Comprehensive health check
  async checkHealth(): Promise<SystemHealth> {
    const checks = await Promise.allSettled([
      this.checkMonitoring(),
      this.checkAI(),
      this.checkVoice(),
      this.checkBiometrics(),
      this.checkFormAnalysis(),
      this.checkCache(),
      this.checkCircuitBreakers(),
      this.checkRateLimiters()
    ]);

    const services: ServiceHealth[] = checks.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        const serviceName = this.getServiceName(index);
        return {
          name: serviceName,
          status: 'unhealthy',
          error: result.reason?.message || 'Unknown error'
        };
      }
    });

    // Calculate overall status
    const unhealthyCount = services.filter(s => s.status === 'unhealthy').length;
    const degradedCount = services.filter(s => s.status === 'degraded').length;
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyCount > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedCount > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    const health: SystemHealth = {
      status: overallStatus,
      timestamp: new Date(),
      services,
      metrics: {
        uptime: Date.now() - this.startTime,
        memory: process.memoryUsage ? process.memoryUsage() : {
          heapUsed: performance.memory?.usedJSHeapSize || 0,
          heapTotal: performance.memory?.totalJSHeapSize || 0
        },
        cpu: process.cpuUsage ? process.cpuUsage().user / 1000000 : undefined
      }
    };

    // Store in history
    this.healthHistory.push(health);
    if (this.healthHistory.length > 100) {
      this.healthHistory.shift();
    }

    // Log health status
    this.logger.info('Health check completed', {
      status: overallStatus,
      services: services.map(s => ({ name: s.name, status: s.status }))
    });

    // Track in monitoring
    monitoring.trackEvent('health_check', {
      status: overallStatus,
      unhealthyServices: services.filter(s => s.status === 'unhealthy').map(s => s.name)
    });

    return health;
  }

  // Check monitoring service
  private async checkMonitoring(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      const health = await monitoring.healthCheck();
      
      return {
        name: 'monitoring',
        status: health.status,
        latency: Date.now() - startTime,
        metadata: health.services
      };
    } catch (error) {
      return {
        name: 'monitoring',
        status: 'unhealthy',
        latency: Date.now() - startTime,
        error: error.message
      };
    }
  }

  // Check AI service
  private async checkAI(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      const health = await productionAI.healthCheck();
      const metrics = productionAI.getMetrics();
      
      return {
        name: 'ai',
        status: health.healthy ? 'healthy' : 'degraded',
        latency: Date.now() - startTime,
        metadata: {
          ...health.services,
          metrics: {
            requestCount: metrics.requestCount,
            avgTokens: metrics.averageTokensPerRequest
          }
        }
      };
    } catch (error) {
      return {
        name: 'ai',
        status: 'unhealthy',
        latency: Date.now() - startTime,
        error: error.message
      };
    }
  }

  // Check voice service
  private async checkVoice(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // Simple availability check
      const isAvailable = voiceService.isListening !== undefined;
      
      return {
        name: 'voice',
        status: isAvailable ? 'healthy' : 'degraded',
        latency: Date.now() - startTime,
        metadata: {
          mode: voiceService.getCurrentMode?.() || 'unknown',
          isListening: voiceService.isListening || false
        }
      };
    } catch (error) {
      return {
        name: 'voice',
        status: 'unhealthy',
        latency: Date.now() - startTime,
        error: error.message
      };
    }
  }

  // Check biometrics service
  private async checkBiometrics(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // Check if Terra service is responding
      const heartRateZones = terraService.calculateHeartRateZones(30);
      
      return {
        name: 'biometrics',
        status: heartRateZones.length > 0 ? 'healthy' : 'degraded',
        latency: Date.now() - startTime,
        metadata: {
          zonesConfigured: heartRateZones.length
        }
      };
    } catch (error) {
      return {
        name: 'biometrics',
        status: 'unhealthy',
        latency: Date.now() - startTime,
        error: error.message
      };
    }
  }

  // Check form analysis service
  private async checkFormAnalysis(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // Check if pose detection is initialized
      const repCount = poseDetection.getRepCount();
      
      return {
        name: 'formAnalysis',
        status: repCount >= 0 ? 'healthy' : 'degraded',
        latency: Date.now() - startTime,
        metadata: {
          initialized: repCount >= 0
        }
      };
    } catch (error) {
      return {
        name: 'formAnalysis',
        status: 'unhealthy',
        latency: Date.now() - startTime,
        error: error.message
      };
    }
  }

  // Check cache service
  private async checkCache(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // Test cache operations
      const testKey = 'health_check_test';
      await cache.set(testKey, 'test', 1);
      const value = await cache.get(testKey);
      await cache.delete(testKey);
      
      return {
        name: 'cache',
        status: value === 'test' ? 'healthy' : 'degraded',
        latency: Date.now() - startTime,
        metadata: await cache.getStats()
      };
    } catch (error) {
      return {
        name: 'cache',
        status: 'unhealthy',
        latency: Date.now() - startTime,
        error: error.message
      };
    }
  }

  // Check circuit breakers
  private async checkCircuitBreakers(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      const health = circuitBreaker.healthCheck();
      
      const openBreakers = health.breakers.filter(b => b.state === 'open');
      const status = openBreakers.length === 0 ? 'healthy' :
                    openBreakers.length < health.breakers.length / 2 ? 'degraded' : 'unhealthy';
      
      return {
        name: 'circuitBreakers',
        status,
        latency: Date.now() - startTime,
        metadata: {
          total: health.breakers.length,
          open: openBreakers.length,
          breakers: health.breakers.map(b => ({
            name: b.name,
            state: b.state,
            failures: b.metrics.failures
          }))
        }
      };
    } catch (error) {
      return {
        name: 'circuitBreakers',
        status: 'unhealthy',
        latency: Date.now() - startTime,
        error: error.message
      };
    }
  }

  // Check rate limiters
  private async checkRateLimiters(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      const health = rateLimiter.healthCheck();
      const stats = rateLimiter.getStats();
      
      // Check if any limiter is heavily utilized
      let maxUtilization = 0;
      stats.forEach((stat, name) => {
        const usage = rateLimiter.getUsage(name);
        if (usage) {
          maxUtilization = Math.max(maxUtilization, usage.percentage);
        }
      });
      
      const status = maxUtilization < 80 ? 'healthy' :
                    maxUtilization < 95 ? 'degraded' : 'unhealthy';
      
      return {
        name: 'rateLimiters',
        status,
        latency: Date.now() - startTime,
        metadata: {
          limiters: health.limiters.length,
          maxUtilization: maxUtilization.toFixed(2) + '%'
        }
      };
    } catch (error) {
      return {
        name: 'rateLimiters',
        status: 'unhealthy',
        latency: Date.now() - startTime,
        error: error.message
      };
    }
  }

  // Get service name by index
  private getServiceName(index: number): string {
    const names = [
      'monitoring',
      'ai',
      'voice',
      'biometrics',
      'formAnalysis',
      'cache',
      'circuitBreakers',
      'rateLimiters'
    ];
    return names[index] || 'unknown';
  }

  // Get metrics endpoint data
  async getMetrics(): Promise<string> {
    if (!this.config.includeMetrics) {
      return '';
    }

    try {
      return await register.metrics();
    } catch (error) {
      this.logger.error('Failed to get metrics', { error });
      return '';
    }
  }

  // Get readiness probe
  async getReadiness(): Promise<{ ready: boolean; checks: any }> {
    const health = await this.checkHealth();
    
    return {
      ready: health.status !== 'unhealthy',
      checks: {
        status: health.status,
        services: health.services.map(s => ({
          name: s.name,
          status: s.status
        }))
      }
    };
  }

  // Get liveness probe
  async getLiveness(): Promise<{ alive: boolean; uptime: number }> {
    // Simple liveness check - if we can respond, we're alive
    return {
      alive: true,
      uptime: Date.now() - this.startTime
    };
  }

  // Start periodic health checks
  startPeriodicChecks(intervalMs: number = 60000): void {
    // Main health check
    const healthInterval = setInterval(async () => {
      try {
        await this.checkHealth();
      } catch (error) {
        this.logger.error('Periodic health check failed', { error });
      }
    }, intervalMs);
    
    this.checkIntervals.set('main', healthInterval);
    
    this.logger.info('Periodic health checks started', { intervalMs });
  }

  // Stop periodic health checks
  stopPeriodicChecks(): void {
    this.checkIntervals.forEach((interval, name) => {
      clearInterval(interval);
      this.logger.info('Stopped periodic check', { name });
    });
    
    this.checkIntervals.clear();
  }

  // Get health history
  getHealthHistory(limit: number = 10): SystemHealth[] {
    return this.healthHistory.slice(-limit);
  }

  // Get health trends
  getHealthTrends(): {
    uptimePercentage: number;
    avgLatency: { [service: string]: number };
    errorRate: { [service: string]: number };
  } {
    const history = this.healthHistory;
    if (history.length === 0) {
      return {
        uptimePercentage: 100,
        avgLatency: {},
        errorRate: {}
      };
    }

    // Calculate uptime percentage
    const healthyChecks = history.filter(h => h.status === 'healthy').length;
    const uptimePercentage = (healthyChecks / history.length) * 100;

    // Calculate average latency per service
    const avgLatency: { [service: string]: number } = {};
    const latencyCounts: { [service: string]: number } = {};
    
    history.forEach(check => {
      check.services.forEach(service => {
        if (service.latency) {
          avgLatency[service.name] = (avgLatency[service.name] || 0) + service.latency;
          latencyCounts[service.name] = (latencyCounts[service.name] || 0) + 1;
        }
      });
    });
    
    Object.keys(avgLatency).forEach(service => {
      avgLatency[service] = avgLatency[service] / latencyCounts[service];
    });

    // Calculate error rate per service
    const errorRate: { [service: string]: number } = {};
    const serviceCounts: { [service: string]: number } = {};
    
    history.forEach(check => {
      check.services.forEach(service => {
        serviceCounts[service.name] = (serviceCounts[service.name] || 0) + 1;
        if (service.status === 'unhealthy') {
          errorRate[service.name] = (errorRate[service.name] || 0) + 1;
        }
      });
    });
    
    Object.keys(serviceCounts).forEach(service => {
      errorRate[service] = ((errorRate[service] || 0) / serviceCounts[service]) * 100;
    });

    return {
      uptimePercentage,
      avgLatency,
      errorRate
    };
  }

  // Create Express middleware
  middleware() {
    return async (req: any, res: any, next: any) => {
      if (req.path === '/health') {
        const health = await this.checkHealth();
        res.status(health.status === 'healthy' ? 200 : 503).json(health);
      } else if (req.path === '/ready') {
        const readiness = await this.getReadiness();
        res.status(readiness.ready ? 200 : 503).json(readiness);
      } else if (req.path === '/live') {
        const liveness = await this.getLiveness();
        res.status(200).json(liveness);
      } else if (req.path === '/metrics') {
        const metrics = await this.getMetrics();
        res.set('Content-Type', 'text/plain');
        res.send(metrics);
      } else {
        next();
      }
    };
  }

  // Dispose
  dispose(): void {
    this.stopPeriodicChecks();
    this.healthHistory = [];
    
    this.logger.info('Health check service disposed');
  }
}

// Export singleton instance
export const healthCheck = new HealthCheckService();

// Start periodic health checks
healthCheck.startPeriodicChecks();