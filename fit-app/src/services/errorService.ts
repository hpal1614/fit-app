export interface ErrorContext {
  userId?: string;
  action?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  userAgent: string;
  url: string;
}

export interface ErrorReport {
  id: string;
  error: Error;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  handled: boolean;
  reported: boolean;
}

export class ErrorService {
  private errorQueue: ErrorReport[] = [];
  private maxQueueSize = 50;
  private errorHandlers = new Map<string, (error: Error, context: ErrorContext) => void>();
  private globalErrorHandler: ((error: Error, context: ErrorContext) => void) | null = null;
  private reportingEndpoint: string | null = null;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalHandlers();
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalHandlers(): void {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message), {
        action: 'uncaught-error',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        {
          action: 'unhandled-rejection',
          metadata: { reason: event.reason }
        }
      );
    });

    // React Error Boundary support
    if (typeof window !== 'undefined' && (window as any).React) {
      const originalError = console.error;
      console.error = (...args) => {
        if (args[0]?.includes?.('React')) {
          this.handleError(new Error(args[0]), {
            action: 'react-error',
            metadata: { args }
          });
        }
        originalError.apply(console, args);
      };
    }
  }

  // Error handling
  handleError(
    error: Error,
    partialContext?: Partial<ErrorContext>,
    severity: ErrorReport['severity'] = 'medium'
  ): string {
    const errorId = this.generateErrorId();
    
    const context: ErrorContext = {
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...partialContext
    };

    const report: ErrorReport = {
      id: errorId,
      error,
      context,
      severity: this.determineSeverity(error, severity),
      handled: true,
      reported: false
    };

    // Add to queue
    this.addToQueue(report);

    // Execute specific error handler if exists
    const errorType = error.constructor.name;
    const handler = this.errorHandlers.get(errorType);
    if (handler) {
      handler(error, context);
    }

    // Execute global handler
    if (this.globalErrorHandler) {
      this.globalErrorHandler(error, context);
    }

    // Report to monitoring service
    this.reportError(report);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error handled:', report);
    }

    return errorId;
  }

  private determineSeverity(error: Error, defaultSeverity: ErrorReport['severity']): ErrorReport['severity'] {
    // Network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return 'low';
    }

    // Authentication errors
    if (error.message.includes('auth') || error.message.includes('unauthorized')) {
      return 'high';
    }

    // Database errors
    if (error.message.includes('database') || error.message.includes('storage')) {
      return 'high';
    }

    // Payment/billing errors
    if (error.message.includes('payment') || error.message.includes('billing')) {
      return 'critical';
    }

    return defaultSeverity;
  }

  private generateErrorId(): string {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private addToQueue(report: ErrorReport): void {
    this.errorQueue.push(report);
    
    // Maintain queue size
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }
  }

  // Error reporting
  private async reportError(report: ErrorReport): Promise<void> {
    if (report.reported || !this.reportingEndpoint) {
      return;
    }

    try {
      const payload = {
        id: report.id,
        message: report.error.message,
        stack: report.error.stack,
        context: report.context,
        severity: report.severity,
        sessionId: this.sessionId,
        timestamp: report.context.timestamp.toISOString()
      };

      await fetch(this.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      report.reported = true;
    } catch (error) {
      console.error('Failed to report error:', error);
    }
  }

  // Error recovery strategies
  registerErrorHandler(errorType: string, handler: (error: Error, context: ErrorContext) => void): void {
    this.errorHandlers.set(errorType, handler);
  }

  setGlobalErrorHandler(handler: (error: Error, context: ErrorContext) => void): void {
    this.globalErrorHandler = handler;
  }

  setReportingEndpoint(endpoint: string): void {
    this.reportingEndpoint = endpoint;
  }

  // Retry mechanism
  async retryOperation<T>(
    operation: () => Promise<T>,
    options: {
      maxRetries?: number;
      delay?: number;
      backoff?: boolean;
      onRetry?: (attempt: number, error: Error) => void;
    } = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      delay = 1000,
      backoff = true,
      onRetry
    } = options;

    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          if (onRetry) {
            onRetry(attempt + 1, lastError);
          }
          
          const waitTime = backoff ? delay * Math.pow(2, attempt) : delay;
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    throw lastError!;
  }

  // Circuit breaker pattern
  createCircuitBreaker<T>(
    operation: () => Promise<T>,
    options: {
      threshold?: number;
      timeout?: number;
      resetTimeout?: number;
    } = {}
  ): () => Promise<T> {
    const {
      threshold = 5,
      timeout = 10000,
      resetTimeout = 60000
    } = options;

    let failures = 0;
    let state: 'closed' | 'open' | 'half-open' = 'closed';
    let nextAttempt = Date.now();

    return async () => {
      if (state === 'open') {
        if (Date.now() < nextAttempt) {
          throw new Error('Circuit breaker is OPEN');
        }
        state = 'half-open';
      }

      try {
        const result = await Promise.race([
          operation(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Operation timeout')), timeout)
          )
        ]);

        if (state === 'half-open') {
          state = 'closed';
        }
        failures = 0;
        
        return result;
      } catch (error) {
        failures++;
        
        if (failures >= threshold) {
          state = 'open';
          nextAttempt = Date.now() + resetTimeout;
        }
        
        throw error;
      }
    };
  }

  // Error recovery UI helpers
  getErrorMessage(errorId: string): string | null {
    const report = this.errorQueue.find(r => r.id === errorId);
    if (!report) return null;

    const error = report.error;
    
    // User-friendly error messages
    if (error.message.includes('network')) {
      return 'Network connection issue. Please check your internet connection.';
    }
    
    if (error.message.includes('auth')) {
      return 'Authentication failed. Please try logging in again.';
    }
    
    if (error.message.includes('permission')) {
      return 'Permission denied. Please check your settings.';
    }
    
    if (error.message.includes('quota')) {
      return 'Storage quota exceeded. Please free up some space.';
    }

    return 'An unexpected error occurred. Please try again.';
  }

  getRecoverySuggestions(errorId: string): string[] {
    const report = this.errorQueue.find(r => r.id === errorId);
    if (!report) return [];

    const suggestions: string[] = [];
    const error = report.error;

    if (error.message.includes('network')) {
      suggestions.push('Check your internet connection');
      suggestions.push('Try refreshing the page');
      suggestions.push('Disable VPN if you\'re using one');
    }

    if (error.message.includes('auth')) {
      suggestions.push('Clear your browser cache');
      suggestions.push('Try logging out and back in');
      suggestions.push('Check if your session has expired');
    }

    if (error.message.includes('camera') || error.message.includes('microphone')) {
      suggestions.push('Check browser permissions');
      suggestions.push('Make sure no other app is using the camera/microphone');
      suggestions.push('Try a different browser');
    }

    return suggestions;
  }

  // Analytics
  getErrorStats(): {
    total: number;
    bySeverity: Record<string, number>;
    byAction: Record<string, number>;
    recentErrors: ErrorReport[];
  } {
    const stats = {
      total: this.errorQueue.length,
      bySeverity: {} as Record<string, number>,
      byAction: {} as Record<string, number>,
      recentErrors: this.errorQueue.slice(-10)
    };

    this.errorQueue.forEach(report => {
      // Count by severity
      stats.bySeverity[report.severity] = (stats.bySeverity[report.severity] || 0) + 1;
      
      // Count by action
      const action = report.context.action || 'unknown';
      stats.byAction[action] = (stats.byAction[action] || 0) + 1;
    });

    return stats;
  }

  // Cleanup
  clearErrors(): void {
    this.errorQueue = [];
  }

  exportErrors(): ErrorReport[] {
    return [...this.errorQueue];
  }
}

// Singleton instance
export const errorService = new ErrorService();

// React Error Boundary Component
export class ErrorBoundary extends (window as any).React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error; errorId: string }> },
  { hasError: boolean; error: Error | null; errorId: string | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null, errorId: null };
  }

  static getDerivedStateFromError(error: Error): any {
    const errorId = errorService.handleError(error, {
      action: 'react-error-boundary'
    }, 'high');
    
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error: Error, errorInfo: any): void {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error && this.state.errorId) {
      const Fallback = this.props.fallback;
      if (Fallback) {
        return <Fallback error={this.state.error} errorId={this.state.errorId} />;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
          <div className="max-w-md w-full bg-gray-800 rounded-lg p-6">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-gray-400 mb-4">
              {errorService.getErrorMessage(this.state.errorId)}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}