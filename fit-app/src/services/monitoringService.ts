import log from 'loglevel';

// Set log level
log.setLevel('info');

interface MonitoringConfig {
  logging?: {
    level?: string;
  };
}

interface HealthStatus {
  healthy: boolean;
  services: {
    ai: boolean;
    voice: boolean;
    database: boolean;
  };
  timestamp: Date;
}

class MonitoringService {
  private static instance: MonitoringService;
  private config: MonitoringConfig;

  constructor(config: MonitoringConfig = {}) {
    this.config = config;
    
    // Set log level from config
    const level = config.logging?.level || 'info';
    log.setLevel(level as log.LogLevelDesc);
    
    log.info('MonitoringService initialized');
  }

  // AI Monitoring
  trackAIRequest(provider: string, model: string, duration: number, success: boolean): void {
    log.info('AI Request', {
      provider,
      model,
      duration,
      success,
      timestamp: new Date()
    });
  }

  trackAIError(provider: string, error: Error, context?: any): void {
    log.error('AI Error', {
      provider,
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date()
    });
  }

  // Voice Monitoring
  trackVoiceCommand(command: string, success: boolean, duration?: number): void {
    log.info('Voice Command', {
      command,
      success,
      duration,
      timestamp: new Date()
    });
  }

  trackVoiceError(error: Error, context?: any): void {
    log.error('Voice Error', {
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date()
    });
  }

  // Workout Monitoring
  trackWorkoutAction(action: string, metadata?: any): void {
    log.info('Workout Action', {
      action,
      metadata,
      timestamp: new Date()
    });
  }

  trackWorkoutError(error: Error, context?: any): void {
    log.error('Workout Error', {
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date()
    });
  }

  // Performance Monitoring
  trackPerformance(metric: string, value: number, unit: string = 'ms'): void {
    log.info('Performance Metric', {
      metric,
      value,
      unit,
      timestamp: new Date()
    });
  }

  // User Behavior
  trackUserAction(action: string, category: string, metadata?: any): void {
    log.info('User Action', {
      action,
      category,
      metadata,
      timestamp: new Date()
    });
  }

  // Error Tracking
  trackError(error: Error, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium', metadata?: any): void {
    const logMethod = severity === 'critical' || severity === 'high' ? 'error' : 'warn';
    log[logMethod]('Error Tracked', {
      error: error.message,
      stack: error.stack,
      severity,
      metadata,
      timestamp: new Date()
    });
  }

  // Generic Event Tracking
  trackEvent(eventName: string, properties?: any): void {
    log.info('Event', {
      name: eventName,
      properties,
      timestamp: new Date()
    });
  }

  // Health Check
  async checkHealth(): Promise<HealthStatus> {
    const status: HealthStatus = {
      healthy: true,
      services: {
        ai: true,
        voice: true,
        database: true
      },
      timestamp: new Date()
    };

    log.info('Health Check', status);
    return status;
  }

  // Logger Access
  getLogger() {
    return log;
  }

  // Singleton Access
  static getInstance(config?: MonitoringConfig): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService(config);
    }
    return MonitoringService.instance;
  }
}

// Create singleton instance
export const monitoring = new MonitoringService({
  logging: {
    level: import.meta.env.MODE === 'production' ? 'warn' : 'info'
  }
});

export default monitoring;