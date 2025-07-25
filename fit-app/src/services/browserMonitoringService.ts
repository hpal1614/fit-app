// Browser-compatible monitoring service
export class BrowserMonitoringService {
  private logs: Array<{
    timestamp: Date;
    level: string;
    message: string;
    data?: any;
  }> = [];

  constructor() {
    // Store logs in memory and localStorage
    this.loadLogs();
  }

  private loadLogs() {
    try {
      const stored = localStorage.getItem('fitness-app-logs');
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (e) {
      // Ignore errors
    }
  }

  private saveLogs() {
    try {
      // Keep only last 1000 logs
      if (this.logs.length > 1000) {
        this.logs = this.logs.slice(-1000);
      }
      localStorage.setItem('fitness-app-logs', JSON.stringify(this.logs));
    } catch (e) {
      // Ignore errors
    }
  }

  private log(level: string, message: string, data?: any) {
    const entry = {
      timestamp: new Date(),
      level,
      message,
      data
    };

    this.logs.push(entry);
    this.saveLogs();

    // Also log to console in development
    if (import.meta.env.DEV) {
      const consoleFn = level === 'error' ? console.error : 
                       level === 'warn' ? console.warn : 
                       console.log;
      consoleFn(`[${level.toUpperCase()}]`, message, data || '');
    }
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, data?: any) {
    this.log('error', message, data);
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }

  // Compatibility methods for existing code
  trackEvent(eventName: string, data?: any) {
    this.info(`Event: ${eventName}`, data);
  }

  trackError(error: Error, context?: any) {
    this.error(error.message, { error: error.stack, context });
  }

  trackMetric(metricName: string, value: number, tags?: any) {
    this.info(`Metric: ${metricName}`, { value, tags });
  }

  trackApiCall(endpoint: string, method: string, statusCode: number, duration: number) {
    this.info('API Call', { endpoint, method, statusCode, duration });
  }

  getLogs(level?: string, limit = 100) {
    let filtered = this.logs;
    if (level) {
      filtered = filtered.filter(log => log.level === level);
    }
    return filtered.slice(-limit);
  }

  clearLogs() {
    this.logs = [];
    localStorage.removeItem('fitness-app-logs');
  }
}

// Export singleton instance
export const monitoring = new BrowserMonitoringService();