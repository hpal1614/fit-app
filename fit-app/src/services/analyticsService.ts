export interface AnalyticsEvent {
  name: string;
  category: string;
  properties?: Record<string, any>;
  timestamp: number;
  sessionId: string;
  userId?: string;
}

export interface UserSession {
  id: string;
  startTime: number;
  endTime?: number;
  events: AnalyticsEvent[];
  pageViews: number;
  duration?: number;
}

export interface AnalyticsConfig {
  trackingId?: string;
  apiEndpoint?: string;
  enableConsoleLogging?: boolean;
  enableAutoTracking?: boolean;
  sampleRate?: number;
}

export class AnalyticsService {
  private config: AnalyticsConfig;
  private currentSession: UserSession | null = null;
  private events: AnalyticsEvent[] = [];
  private userId: string | null = null;
  private isInitialized = false;
  private eventQueue: AnalyticsEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(config: AnalyticsConfig = {}) {
    this.config = {
      enableConsoleLogging: import.meta.env.MODE === 'development',
      enableAutoTracking: true,
      sampleRate: 1,
      ...config
    };

    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private initialize(): void {
    if (this.isInitialized) return;

    // Start session
    this.startSession();

    // Setup auto-tracking
    if (this.config.enableAutoTracking) {
      this.setupAutoTracking();
    }

    // Setup flush interval
    this.flushInterval = setInterval(() => {
      this.flushEvents();
    }, 30000); // Flush every 30 seconds

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.endSession();
      this.flushEvents();
    });

    this.isInitialized = true;
  }

  private setupAutoTracking(): void {
    // Track page views
    this.trackPageView();
    
    // Track route changes (for SPAs)
    if ('history' in window) {
      const originalPushState = history.pushState;
      history.pushState = (...args) => {
        originalPushState.apply(history, args);
        this.trackPageView();
      };

      window.addEventListener('popstate', () => {
        this.trackPageView();
      });
    }

    // Track clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      
      // Track button clicks
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        const button = target.tagName === 'BUTTON' ? target : target.closest('button');
        const text = button?.textContent?.trim() || 'Unknown Button';
        
        this.track('button_click', {
          text: text.substring(0, 50),
          className: button?.className,
          id: button?.id
        });
      }

      // Track link clicks
      if (target.tagName === 'A' || target.closest('a')) {
        const link = target.tagName === 'A' ? target : target.closest('a');
        const href = (link as HTMLAnchorElement)?.href;
        
        if (href) {
          this.track('link_click', {
            href,
            text: link?.textContent?.trim().substring(0, 50)
          });
        }
      }
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      
      this.track('form_submit', {
        formId: form.id,
        formName: form.name,
        action: form.action
      });
    });

    // Track errors
    window.addEventListener('error', (event) => {
      this.track('error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }, 'error');
    });
  }

  // Session management
  private startSession(): void {
    const sessionId = this.generateSessionId();
    
    this.currentSession = {
      id: sessionId,
      startTime: Date.now(),
      events: [],
      pageViews: 0
    };

    this.track('session_start', {
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language
    }, 'session');
  }

  private endSession(): void {
    if (!this.currentSession) return;

    this.currentSession.endTime = Date.now();
    this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;

    this.track('session_end', {
      duration: this.currentSession.duration,
      pageViews: this.currentSession.pageViews,
      eventCount: this.currentSession.events.length
    }, 'session');
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Event tracking
  track(
    eventName: string,
    properties?: Record<string, any>,
    category: string = 'general'
  ): void {
    // Check sample rate
    if (Math.random() > this.config.sampleRate!) {
      return;
    }

    const event: AnalyticsEvent = {
      name: eventName,
      category,
      properties,
      timestamp: Date.now(),
      sessionId: this.currentSession?.id || 'no-session',
      userId: this.userId || undefined
    };

    // Add to current session
    if (this.currentSession) {
      this.currentSession.events.push(event);
    }

    // Add to events array
    this.events.push(event);

    // Add to queue
    this.eventQueue.push(event);

    // Log in development
    if (this.config.enableConsoleLogging) {
      console.log('Analytics Event:', event);
    }

    // Flush if queue is getting large
    if (this.eventQueue.length >= 50) {
      this.flushEvents();
    }
  }

  // Page tracking
  trackPageView(customPath?: string): void {
    const path = customPath || window.location.pathname;
    
    if (this.currentSession) {
      this.currentSession.pageViews++;
    }

    this.track('page_view', {
      path,
      title: document.title,
      url: window.location.href,
      queryParams: Object.fromEntries(new URLSearchParams(window.location.search))
    }, 'navigation');
  }

  // User tracking
  identify(userId: string, traits?: Record<string, any>): void {
    this.userId = userId;
    
    this.track('identify', {
      userId,
      traits
    }, 'user');
  }

  // Custom timing
  trackTiming(category: string, variable: string, time: number, label?: string): void {
    this.track('timing', {
      category,
      variable,
      time,
      label
    }, 'performance');
  }

  // Fitness-specific tracking
  trackWorkout(workout: {
    type: string;
    duration: number;
    exercises: number;
    volume?: number;
    intensity?: string;
  }): void {
    this.track('workout_complete', workout, 'fitness');
  }

  trackExercise(exercise: {
    name: string;
    sets: number;
    reps: number[];
    weight: number[];
    rest?: number;
  }): void {
    this.track('exercise_complete', exercise, 'fitness');
  }

  trackPersonalRecord(pr: {
    exercise: string;
    weight: number;
    reps: number;
    previousBest?: number;
  }): void {
    this.track('personal_record', pr, 'achievement');
  }

  trackNutrition(meal: {
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }): void {
    this.track('meal_logged', meal, 'nutrition');
  }

  trackBiometric(metric: {
    type: string;
    value: number;
    unit: string;
    timestamp?: number;
  }): void {
    this.track('biometric_recorded', metric, 'health');
  }

  // Event flushing
  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0 || !this.config.apiEndpoint) {
      return;
    }

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          events: eventsToSend,
          trackingId: this.config.trackingId
        })
      });
    } catch (error) {
      // Re-add events to queue on failure
      this.eventQueue.unshift(...eventsToSend);
      console.error('Failed to send analytics events:', error);
    }
  }

  // Analytics queries
  getSessionDuration(): number {
    if (!this.currentSession) return 0;
    
    const endTime = this.currentSession.endTime || Date.now();
    return endTime - this.currentSession.startTime;
  }

  getEventCount(category?: string): number {
    if (!category) {
      return this.events.length;
    }
    
    return this.events.filter(e => e.category === category).length;
  }

  getMostFrequentEvents(limit: number = 10): Array<{ name: string; count: number }> {
    const eventCounts = new Map<string, number>();
    
    this.events.forEach(event => {
      eventCounts.set(event.name, (eventCounts.get(event.name) || 0) + 1);
    });

    return Array.from(eventCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, count]) => ({ name, count }));
  }

  getUserJourney(): Array<{ time: string; event: string; properties?: any }> {
    return this.events
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(event => ({
        time: new Date(event.timestamp).toLocaleTimeString(),
        event: event.name,
        properties: event.properties
      }));
  }

  // A/B Testing
  getVariant(experimentName: string, variants: string[]): string {
    // Simple hash-based variant assignment
    const hash = this.hashString(experimentName + (this.userId || this.currentSession?.id || ''));
    const index = hash % variants.length;
    
    const variant = variants[index];
    
    // Track variant assignment
    this.track('experiment_viewed', {
      experiment: experimentName,
      variant
    }, 'experiment');
    
    return variant;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Goal tracking
  trackGoal(goalName: string, value?: number): void {
    this.track('goal_complete', {
      goal: goalName,
      value
    }, 'conversion');
  }

  // E-commerce style tracking for premium features
  trackPurchase(purchase: {
    item: string;
    price: number;
    currency: string;
    quantity?: number;
  }): void {
    this.track('purchase', purchase, 'revenue');
  }

  // Cleanup
  destroy(): void {
    this.endSession();
    this.flushEvents();
    
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    
    this.events = [];
    this.eventQueue = [];
    this.currentSession = null;
  }

  // Export data
  exportData(): {
    session: UserSession | null;
    events: AnalyticsEvent[];
    userId: string | null;
  } {
    return {
      session: this.currentSession,
      events: [...this.events],
      userId: this.userId
    };
  }
}

// Singleton instance
export const analyticsService = new AnalyticsService({
  trackingId: import.meta.env.VITE_ANALYTICS_ID,
  apiEndpoint: import.meta.env.VITE_ANALYTICS_ENDPOINT
});