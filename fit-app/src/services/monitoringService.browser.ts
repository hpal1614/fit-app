// Browser-safe monitoring service (no Winston)
class BrowserMonitoringService {
  private metrics: any[] = [];
  private startTime = Date.now();

  constructor() {
    console.log('Browser monitoring service initialized');
  }

  // Simple browser-safe logging
  log(level: string, message: string, meta?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta
    };
    console.log(`[${level.toUpperCase()}]`, message, meta || '');
    this.metrics.push(logEntry);
  }

  // Track metrics
  trackMetric(name: string, value: number, tags?: Record<string, string>) {
    const metric = {
      name,
      value,
      tags,
      timestamp: Date.now()
    };
    this.metrics.push(metric);
    console.log('Metric tracked:', metric);
  }

  // Track events
  trackEvent(name: string, properties?: Record<string, any>) {
    const event = {
      name,
      properties,
      timestamp: Date.now()
    };
    this.metrics.push(event);
    console.log('Event tracked:', event);
  }

  // Get system metrics (browser-safe)
  async getSystemMetrics() {
    return {
      uptime: (Date.now() - this.startTime) / 1000,
      memory: (performance as any).memory || {},
      timestamp: Date.now()
    };
  }

  // Get all metrics
  getMetrics() {
    return this.metrics;
  }

  // Clear metrics
  clearMetrics() {
    this.metrics = [];
  }

  // Simplified methods that match the original interface
  async initialize() {
    console.log('Monitoring service ready');
  }

  trackWorkoutStart(workoutId: string, userId: string) {
    this.trackEvent('workout_start', { workoutId, userId });
  }

  trackWorkoutEnd(workoutId: string, duration: number, exercises: number) {
    this.trackEvent('workout_end', { workoutId, duration, exercises });
  }

  trackExerciseComplete(exerciseId: string, sets: number, reps: number, weight: number) {
    this.trackEvent('exercise_complete', { exerciseId, sets, reps, weight });
  }

  trackAIInteraction(type: string, responseTime: number) {
    this.trackEvent('ai_interaction', { type, responseTime });
  }

  trackError(error: Error, context?: any) {
    this.log('error', error.message, { error: error.stack, context });
  }
}

// Export singleton instance
export const monitoring = new BrowserMonitoringService();