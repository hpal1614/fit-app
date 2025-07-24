import { Client } from 'langsmith';
import { register, Counter, Histogram, Gauge, Summary } from 'prom-client';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import * as Sentry from '@sentry/react';

// LangSmith configuration
interface LangSmithConfig {
  apiKey?: string;
  projectName?: string;
  endpoint?: string;
}

// Metrics configuration
interface MetricsConfig {
  enabled: boolean;
  prefix: string;
  buckets?: number[];
}

// Logging configuration  
interface LoggingConfig {
  level: string;
  enableConsole: boolean;
  enableFile: boolean;
  maxFiles?: string;
  maxSize?: string;
}

// Complete monitoring configuration
interface MonitoringConfig {
  langsmith: LangSmithConfig;
  metrics: MetricsConfig;
  logging: LoggingConfig;
  sentry?: {
    dsn: string;
    environment: string;
    tracesSampleRate: number;
  };
}

export class MonitoringService {
  private langsmithClient: Client | null = null;
  private logger: winston.Logger;
  
  // Prometheus metrics
  private metrics = {
    // AI metrics
    aiRequests: null as Counter | null,
    aiLatency: null as Histogram | null,
    aiErrors: null as Counter | null,
    aiTokenUsage: null as Counter | null,
    aiCacheHits: null as Counter | null,
    
    // Voice metrics
    voiceRequests: null as Counter | null,
    voiceLatency: null as Histogram | null,
    voiceErrors: null as Counter | null,
    voiceStreamDuration: null as Summary | null,
    
    // Biometric metrics
    biometricUpdates: null as Counter | null,
    biometricErrors: null as Counter | null,
    heartRateGauge: null as Gauge | null,
    stressLevelGauge: null as Gauge | null,
    
    // Form analysis metrics
    formAnalysisRequests: null as Counter | null,
    formAnalysisLatency: null as Histogram | null,
    formScoreGauge: null as Gauge | null,
    
    // System metrics
    activeUsers: null as Gauge | null,
    memoryUsage: null as Gauge | null,
    apiLatency: null as Histogram | null,
    errorRate: null as Counter | null
  };

  constructor(config: MonitoringConfig) {
    // Initialize logger
    this.logger = this.initializeLogger(config.logging);
    
    // Initialize LangSmith
    if (config.langsmith.apiKey) {
      this.initializeLangSmith(config.langsmith);
    }
    
    // Initialize metrics
    if (config.metrics.enabled) {
      this.initializeMetrics(config.metrics);
    }
    
    // Initialize Sentry
    if (config.sentry?.dsn) {
      this.initializeSentry(config.sentry);
    }
    
    // Start system metrics collection
    this.startSystemMetricsCollection();
    
    this.logger.info('Monitoring service initialized', { config });
  }

  // Initialize Winston logger
  private initializeLogger(config: LoggingConfig): winston.Logger {
    const transports: winston.transport[] = [];
    
    // Console transport
    if (config.enableConsole) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              return `${timestamp} [${level}]: ${message} ${
                Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
              }`;
            })
          )
        })
      );
    }
    
    // File transport with rotation
    if (config.enableFile) {
      transports.push(
        new DailyRotateFile({
          filename: 'logs/app-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: config.maxSize || '20m',
          maxFiles: config.maxFiles || '14d',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        })
      );
      
      // Error log file
      transports.push(
        new DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: config.maxSize || '20m',
          maxFiles: config.maxFiles || '30d',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        })
      );
    }
    
    return winston.createLogger({
      level: config.level,
      transports
    });
  }

  // Initialize LangSmith client
  private initializeLangSmith(config: LangSmithConfig): void {
    try {
      this.langsmithClient = new Client({
        apiUrl: config.endpoint || 'https://api.smith.langchain.com',
        apiKey: config.apiKey
      });
      
      this.logger.info('LangSmith client initialized');
    } catch (error) {
      this.logger.error('Failed to initialize LangSmith', { error });
    }
  }

  // Initialize Prometheus metrics
  private initializeMetrics(config: MetricsConfig): void {
    const { prefix } = config;
    
    // AI metrics
    this.metrics.aiRequests = new Counter({
      name: `${prefix}_ai_requests_total`,
      help: 'Total AI requests',
      labelNames: ['model', 'endpoint', 'status']
    });
    
    this.metrics.aiLatency = new Histogram({
      name: `${prefix}_ai_latency_seconds`,
      help: 'AI request latency',
      labelNames: ['model', 'endpoint'],
      buckets: config.buckets || [0.1, 0.5, 1, 2, 5]
    });
    
    this.metrics.aiErrors = new Counter({
      name: `${prefix}_ai_errors_total`,
      help: 'Total AI errors',
      labelNames: ['model', 'error_type']
    });
    
    this.metrics.aiTokenUsage = new Counter({
      name: `${prefix}_ai_tokens_total`,
      help: 'Total AI tokens used',
      labelNames: ['model', 'type']
    });
    
    this.metrics.aiCacheHits = new Counter({
      name: `${prefix}_ai_cache_hits_total`,
      help: 'AI cache hits',
      labelNames: ['cache_type']
    });
    
    // Voice metrics
    this.metrics.voiceRequests = new Counter({
      name: `${prefix}_voice_requests_total`,
      help: 'Total voice requests',
      labelNames: ['provider', 'type', 'status']
    });
    
    this.metrics.voiceLatency = new Histogram({
      name: `${prefix}_voice_latency_seconds`,
      help: 'Voice processing latency',
      labelNames: ['provider', 'type'],
      buckets: [0.05, 0.1, 0.25, 0.5, 1]
    });
    
    this.metrics.voiceErrors = new Counter({
      name: `${prefix}_voice_errors_total`,
      help: 'Total voice errors',
      labelNames: ['provider', 'error_type']
    });
    
    this.metrics.voiceStreamDuration = new Summary({
      name: `${prefix}_voice_stream_duration_seconds`,
      help: 'Voice stream duration',
      labelNames: ['provider']
    });
    
    // Biometric metrics
    this.metrics.biometricUpdates = new Counter({
      name: `${prefix}_biometric_updates_total`,
      help: 'Total biometric updates',
      labelNames: ['provider', 'metric_type']
    });
    
    this.metrics.biometricErrors = new Counter({
      name: `${prefix}_biometric_errors_total`,
      help: 'Total biometric errors',
      labelNames: ['provider', 'error_type']
    });
    
    this.metrics.heartRateGauge = new Gauge({
      name: `${prefix}_heart_rate_bpm`,
      help: 'Current heart rate',
      labelNames: ['user_id']
    });
    
    this.metrics.stressLevelGauge = new Gauge({
      name: `${prefix}_stress_level`,
      help: 'Current stress level',
      labelNames: ['user_id']
    });
    
    // Form analysis metrics
    this.metrics.formAnalysisRequests = new Counter({
      name: `${prefix}_form_analysis_requests_total`,
      help: 'Total form analysis requests',
      labelNames: ['exercise', 'status']
    });
    
    this.metrics.formAnalysisLatency = new Histogram({
      name: `${prefix}_form_analysis_latency_seconds`,
      help: 'Form analysis latency',
      labelNames: ['exercise'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5]
    });
    
    this.metrics.formScoreGauge = new Gauge({
      name: `${prefix}_form_score`,
      help: 'Current form score',
      labelNames: ['exercise', 'user_id']
    });
    
    // System metrics
    this.metrics.activeUsers = new Gauge({
      name: `${prefix}_active_users`,
      help: 'Number of active users'
    });
    
    this.metrics.memoryUsage = new Gauge({
      name: `${prefix}_memory_usage_bytes`,
      help: 'Memory usage in bytes',
      labelNames: ['type']
    });
    
    this.metrics.apiLatency = new Histogram({
      name: `${prefix}_api_latency_seconds`,
      help: 'API endpoint latency',
      labelNames: ['method', 'endpoint', 'status'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 5]
    });
    
    this.metrics.errorRate = new Counter({
      name: `${prefix}_errors_total`,
      help: 'Total errors',
      labelNames: ['type', 'severity']
    });
    
    // Register all metrics
    Object.values(this.metrics).forEach(metric => {
      if (metric) {
        register.registerMetric(metric);
      }
    });
    
    this.logger.info('Prometheus metrics initialized');
  }

  // Initialize Sentry for error tracking
  private initializeSentry(config: any): void {
    Sentry.init({
      dsn: config.dsn,
      environment: config.environment,
      tracesSampleRate: config.tracesSampleRate,
      integrations: [
        new Sentry.BrowserTracing(),
        new Sentry.Replay({
          maskAllText: true,
          blockAllMedia: true
        })
      ],
      beforeSend: (event, hint) => {
        // Filter out certain errors
        if (event.exception) {
          const error = hint.originalException;
          // Don't send network errors in development
          if (error?.message?.includes('NetworkError') && config.environment === 'development') {
            return null;
          }
        }
        return event;
      }
    });
    
    this.logger.info('Sentry initialized');
  }

  // Track AI request with LangSmith
  async trackAIRequest(params: {
    model: string;
    prompt: string;
    response: string;
    latency: number;
    tokens?: { prompt: number; completion: number };
    metadata?: any;
  }): Promise<void> {
    const { model, prompt, response, latency, tokens, metadata } = params;
    
    // Track in LangSmith
    if (this.langsmithClient) {
      try {
        await this.langsmithClient.createRun({
          name: `${model}_request`,
          run_type: 'llm',
          inputs: { prompt },
          outputs: { response },
          extra: {
            latency,
            tokens,
            ...metadata
          }
        });
      } catch (error) {
        this.logger.error('Failed to track in LangSmith', { error });
      }
    }
    
    // Track metrics
    if (this.metrics.aiRequests) {
      this.metrics.aiRequests.inc({ 
        model, 
        endpoint: metadata?.endpoint || 'default',
        status: 'success' 
      });
      
      this.metrics.aiLatency?.observe(
        { model, endpoint: metadata?.endpoint || 'default' },
        latency / 1000
      );
      
      if (tokens) {
        this.metrics.aiTokenUsage?.inc({ model, type: 'prompt' }, tokens.prompt);
        this.metrics.aiTokenUsage?.inc({ model, type: 'completion' }, tokens.completion);
      }
    }
    
    // Log
    this.logger.info('AI request tracked', {
      model,
      latency,
      tokens,
      promptLength: prompt.length,
      responseLength: response.length
    });
  }

  // Track AI error
  trackAIError(params: {
    model: string;
    error: Error;
    prompt?: string;
    metadata?: any;
  }): void {
    const { model, error, prompt, metadata } = params;
    
    // Track metrics
    if (this.metrics.aiErrors) {
      this.metrics.aiErrors.inc({ 
        model, 
        error_type: error.name || 'UnknownError'
      });
    }
    
    // Log error
    this.logger.error('AI request error', {
      model,
      error: error.message,
      stack: error.stack,
      prompt: prompt?.substring(0, 200),
      ...metadata
    });
    
    // Report to Sentry
    Sentry.captureException(error, {
      tags: { model, component: 'ai' },
      extra: metadata
    });
  }

  // Track voice interaction
  trackVoiceInteraction(params: {
    provider: string;
    type: 'speech' | 'synthesis' | 'streaming';
    duration: number;
    success: boolean;
    metadata?: any;
  }): void {
    const { provider, type, duration, success, metadata } = params;
    
    // Track metrics
    if (this.metrics.voiceRequests) {
      this.metrics.voiceRequests.inc({ 
        provider, 
        type,
        status: success ? 'success' : 'failure'
      });
      
      this.metrics.voiceLatency?.observe(
        { provider, type },
        duration / 1000
      );
      
      if (type === 'streaming') {
        this.metrics.voiceStreamDuration?.observe(
          { provider },
          duration / 1000
        );
      }
    }
    
    // Log
    this.logger.info('Voice interaction tracked', {
      provider,
      type,
      duration,
      success,
      ...metadata
    });
  }

  // Track biometric update
  trackBiometricUpdate(params: {
    provider: string;
    metrics: {
      heartRate?: number;
      hrv?: number;
      stress?: number;
      calories?: number;
    };
    userId?: string;
  }): void {
    const { provider, metrics, userId } = params;
    
    // Update gauges
    if (metrics.heartRate && this.metrics.heartRateGauge) {
      this.metrics.heartRateGauge.set(
        { user_id: userId || 'anonymous' },
        metrics.heartRate
      );
    }
    
    if (metrics.stress && this.metrics.stressLevelGauge) {
      this.metrics.stressLevelGauge.set(
        { user_id: userId || 'anonymous' },
        metrics.stress
      );
    }
    
    // Count updates
    Object.keys(metrics).forEach(metricType => {
      this.metrics.biometricUpdates?.inc({ provider, metric_type: metricType });
    });
    
    // Log
    this.logger.debug('Biometric update tracked', {
      provider,
      metrics,
      userId
    });
  }

  // Track form analysis
  trackFormAnalysis(params: {
    exercise: string;
    formScore: number;
    processingTime: number;
    errors: number;
    userId?: string;
  }): void {
    const { exercise, formScore, processingTime, errors, userId } = params;
    
    // Track metrics
    if (this.metrics.formAnalysisRequests) {
      this.metrics.formAnalysisRequests.inc({ 
        exercise,
        status: 'success'
      });
      
      this.metrics.formAnalysisLatency?.observe(
        { exercise },
        processingTime / 1000
      );
      
      this.metrics.formScoreGauge?.set(
        { exercise, user_id: userId || 'anonymous' },
        formScore
      );
    }
    
    // Log
    this.logger.info('Form analysis tracked', {
      exercise,
      formScore,
      processingTime,
      errors
    });
  }

  // Track general error
  trackError(error: Error, context?: any): void {
    // Track metrics
    if (this.metrics.errorRate) {
      this.metrics.errorRate.inc({
        type: error.name || 'UnknownError',
        severity: context?.severity || 'error'
      });
    }
    
    // Log
    this.logger.error('Application error', {
      error: error.message,
      stack: error.stack,
      ...context
    });
    
    // Report to Sentry
    Sentry.captureException(error, {
      extra: context
    });
  }

  // Track custom event
  trackEvent(name: string, properties?: any): void {
    // Log
    this.logger.info('Custom event', {
      event: name,
      ...properties
    });
    
    // Track in Sentry
    Sentry.addBreadcrumb({
      message: name,
      category: 'custom',
      data: properties,
      level: 'info'
    });
  }

  // Track API request
  trackAPIRequest(params: {
    method: string;
    endpoint: string;
    status: number;
    duration: number;
    metadata?: any;
  }): void {
    const { method, endpoint, status, duration, metadata } = params;
    
    // Track metrics
    if (this.metrics.apiLatency) {
      this.metrics.apiLatency.observe(
        { method, endpoint, status: status.toString() },
        duration / 1000
      );
    }
    
    // Log
    this.logger.info('API request', {
      method,
      endpoint,
      status,
      duration,
      ...metadata
    });
  }

  // Start collecting system metrics
  private startSystemMetricsCollection(): void {
    // Collect memory usage every 30 seconds
    setInterval(() => {
      if (this.metrics.memoryUsage && performance.memory) {
        this.metrics.memoryUsage.set(
          { type: 'heap_used' },
          performance.memory.usedJSHeapSize
        );
        this.metrics.memoryUsage.set(
          { type: 'heap_total' },
          performance.memory.totalJSHeapSize
        );
        this.metrics.memoryUsage.set(
          { type: 'heap_limit' },
          performance.memory.jsHeapSizeLimit
        );
      }
    }, 30000);
  }

  // Get metrics for export
  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  // Set active users count
  setActiveUsers(count: number): void {
    if (this.metrics.activeUsers) {
      this.metrics.activeUsers.set(count);
    }
  }

  // Create transaction for Sentry
  startTransaction(name: string, op: string): any {
    return Sentry.startTransaction({ name, op });
  }

  // Get logger instance
  getLogger(): winston.Logger {
    return this.logger;
  }

  // Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: {
      langsmith: boolean;
      sentry: boolean;
      metrics: boolean;
      logging: boolean;
    };
  }> {
    const services = {
      langsmith: !!this.langsmithClient,
      sentry: !!Sentry.getCurrentHub().getClient(),
      metrics: Object.values(this.metrics).some(m => m !== null),
      logging: !!this.logger
    };

    const healthyCount = Object.values(services).filter(v => v).length;
    const status = healthyCount === 4 ? 'healthy' : 
                  healthyCount >= 2 ? 'degraded' : 'unhealthy';

    return { status, services };
  }

  // Cleanup
  dispose(): void {
    // Clear metrics
    register.clear();
    
    // Close Sentry
    Sentry.close();
    
    this.logger.info('Monitoring service disposed');
  }
}

// Create singleton instance
export const monitoring = new MonitoringService({
  langsmith: {
    apiKey: process.env.REACT_APP_LANGSMITH_API_KEY,
    projectName: process.env.REACT_APP_LANGSMITH_PROJECT || 'ai-fitness-coach'
  },
  metrics: {
    enabled: process.env.NODE_ENV === 'production',
    prefix: 'fitness_app'
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: true,
    enableFile: process.env.NODE_ENV === 'production',
    maxFiles: '30d',
    maxSize: '20m'
  },
  sentry: process.env.REACT_APP_SENTRY_DSN ? {
    dsn: process.env.REACT_APP_SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1
  } : undefined
});