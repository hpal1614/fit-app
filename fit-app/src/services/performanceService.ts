export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

export interface PerformanceReport {
  metrics: PerformanceMetric[];
  diagnostics: {
    slowComponents: string[];
    memoryLeaks: string[];
    renderingIssues: string[];
  };
  recommendations: string[];
}

export class PerformanceService {
  private metrics = new Map<string, PerformanceMetric[]>();
  private observers: PerformanceObserver[] = [];
  private renderTimes = new Map<string, number[]>();
  private memorySnapshots: number[] = [];
  private isMonitoring = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private initialize(): void {
    // Observe navigation timing
    this.observeNavigationTiming();
    
    // Observe resource timing
    this.observeResourceTiming();
    
    // Observe paint timing
    this.observePaintTiming();
    
    // Monitor memory usage
    this.startMemoryMonitoring();
    
    // React component profiling
    this.setupReactProfiler();
  }

  // Navigation timing
  private observeNavigationTiming(): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              this.recordMetric('page-load', navEntry.loadEventEnd - navEntry.fetchStart, 'ms');
              this.recordMetric('dom-interactive', navEntry.domInteractive - navEntry.fetchStart, 'ms');
              this.recordMetric('first-byte', navEntry.responseStart - navEntry.requestStart, 'ms');
            }
          }
        });
        
        observer.observe({ entryTypes: ['navigation'] });
        this.observers.push(observer);
      } catch (error) {
        console.warn('Navigation timing not supported:', error);
      }
    }
  }

  // Resource timing
  private observeResourceTiming(): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'resource') {
              const resourceEntry = entry as PerformanceResourceTiming;
              const duration = resourceEntry.responseEnd - resourceEntry.startTime;
              
              // Track slow resources
              if (duration > 1000) {
                this.recordMetric('slow-resource', duration, 'ms', {
                  resource: resourceEntry.name,
                  type: resourceEntry.initiatorType
                });
              }
            }
          }
        });
        
        observer.observe({ entryTypes: ['resource'] });
        this.observers.push(observer);
      } catch (error) {
        console.warn('Resource timing not supported:', error);
      }
    }
  }

  // Paint timing
  private observePaintTiming(): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'paint') {
              this.recordMetric(entry.name, entry.startTime, 'ms');
            }
          }
        });
        
        observer.observe({ entryTypes: ['paint'] });
        this.observers.push(observer);
      } catch (error) {
        console.warn('Paint timing not supported:', error);
      }
    }
  }

  // Memory monitoring
  private startMemoryMonitoring(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const usedMemory = memory.usedJSHeapSize / 1048576; // Convert to MB
        
        this.memorySnapshots.push(usedMemory);
        
        // Keep only last 100 snapshots
        if (this.memorySnapshots.length > 100) {
          this.memorySnapshots.shift();
        }
        
        // Detect potential memory leak
        if (this.memorySnapshots.length >= 10) {
          const recent = this.memorySnapshots.slice(-10);
          const isIncreasing = recent.every((val, i) => i === 0 || val > recent[i - 1]);
          
          if (isIncreasing) {
            this.recordMetric('memory-leak-warning', usedMemory, 'MB');
          }
        }
        
        this.recordMetric('memory-usage', usedMemory, 'MB');
      }, 10000); // Every 10 seconds
    }
  }

  // React profiler setup
  private setupReactProfiler(): void {
    if ((window as any).React && (window as any).React.Profiler) {
      // This would be integrated with React components
      console.log('React Profiler available for component performance tracking');
    }
  }

  // Record metrics
  private recordMetric(
    name: string, 
    value: number, 
    unit: string, 
    metadata?: any
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now()
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    this.metrics.get(name)!.push(metric);
    
    // Keep only last 100 metrics per type
    const metrics = this.metrics.get(name)!;
    if (metrics.length > 100) {
      metrics.shift();
    }

    // Log slow operations in development
    if (import.meta.env.MODE === 'development' && value > 1000 && unit === 'ms') {
      console.warn(`Slow operation detected: ${name} took ${value}ms`, metadata);
    }
  }

  // Component render tracking
  trackComponentRender(componentName: string, renderTime: number): void {
    if (!this.renderTimes.has(componentName)) {
      this.renderTimes.set(componentName, []);
    }
    
    const times = this.renderTimes.get(componentName)!;
    times.push(renderTime);
    
    // Keep only last 50 render times
    if (times.length > 50) {
      times.shift();
    }
    
    // Warn if component is consistently slow
    if (times.length >= 10) {
      const recentAverage = times.slice(-10).reduce((a, b) => a + b, 0) / 10;
      if (recentAverage > 16) { // More than 16ms average (60fps threshold)
        this.recordMetric('slow-component', recentAverage, 'ms', { component: componentName });
      }
    }
  }

  // Performance optimization helpers
  measureOperation<T>(name: string, operation: () => T): T {
    const start = performance.now();
    try {
      return operation();
    } finally {
      const duration = performance.now() - start;
      this.recordMetric(`operation-${name}`, duration, 'ms');
    }
  }

  async measureAsyncOperation<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      return await operation();
    } finally {
      const duration = performance.now() - start;
      this.recordMetric(`async-operation-${name}`, duration, 'ms');
    }
  }

  // Debounce helper for performance
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  // Throttle helper for performance
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Request idle callback wrapper
  requestIdleCallback(callback: () => void, options?: { timeout?: number }): number {
    if ('requestIdleCallback' in window) {
      return (window as any).requestIdleCallback(callback, options);
    }
    
    // Fallback
    return window.setTimeout(callback, 1);
  }

  // Get performance report
  getPerformanceReport(): PerformanceReport {
    const report: PerformanceReport = {
      metrics: [],
      diagnostics: {
        slowComponents: [],
        memoryLeaks: [],
        renderingIssues: []
      },
      recommendations: []
    };

    // Collect all metrics
    for (const [name, metrics] of this.metrics.entries()) {
      if (metrics.length > 0) {
        const latest = metrics[metrics.length - 1];
        report.metrics.push(latest);
      }
    }

    // Identify slow components
    for (const [component, times] of this.renderTimes.entries()) {
      if (times.length >= 5) {
        const average = times.slice(-5).reduce((a, b) => a + b, 0) / 5;
        if (average > 16) {
          report.diagnostics.slowComponents.push(`${component} (avg: ${average.toFixed(2)}ms)`);
        }
      }
    }

    // Check for memory issues
    if (this.memorySnapshots.length >= 10) {
      const recent = this.memorySnapshots.slice(-10);
      const trend = recent[recent.length - 1] - recent[0];
      
      if (trend > 50) { // More than 50MB increase
        report.diagnostics.memoryLeaks.push('Potential memory leak detected');
      }
    }

    // Generate recommendations
    if (report.diagnostics.slowComponents.length > 0) {
      report.recommendations.push('Consider optimizing slow components with React.memo or useMemo');
    }
    
    if (report.diagnostics.memoryLeaks.length > 0) {
      report.recommendations.push('Review component cleanup and event listener removal');
    }

    const pageLoadMetric = this.metrics.get('page-load');
    if (pageLoadMetric && pageLoadMetric[pageLoadMetric.length - 1].value > 3000) {
      report.recommendations.push('Page load time is high. Consider code splitting and lazy loading');
    }

    return report;
  }

  // Lazy loading helper
  lazyLoad<T>(importFunc: () => Promise<T>): Promise<T> {
    return this.measureAsyncOperation('lazy-load', importFunc);
  }

  // Image optimization
  optimizeImage(src: string, options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  } = {}): string {
    // In a real implementation, this would use an image optimization service
    const params = new URLSearchParams();
    
    if (options.width) params.set('w', options.width.toString());
    if (options.height) params.set('h', options.height.toString());
    if (options.quality) params.set('q', options.quality.toString());
    if (options.format) params.set('fm', options.format);
    
    return `${src}?${params.toString()}`;
  }

  // Intersection observer for lazy loading
  createIntersectionObserver(
    callback: (entries: IntersectionObserverEntry[]) => void,
    options?: IntersectionObserverInit
  ): IntersectionObserver {
    return new IntersectionObserver((entries) => {
      this.measureOperation('intersection-observer', () => callback(entries));
    }, options);
  }

  // Clean up
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
    this.renderTimes.clear();
    this.memorySnapshots = [];
  }

  // Export metrics for analysis
  exportMetrics(): Record<string, PerformanceMetric[]> {
    const exported: Record<string, PerformanceMetric[]> = {};
    
    for (const [name, metrics] of this.metrics.entries()) {
      exported[name] = [...metrics];
    }
    
    return exported;
  }

  // Web Vitals tracking
  trackWebVitals(callback: (metric: any) => void): void {
    if ('PerformanceObserver' in window) {
      // LCP (Largest Contentful Paint)
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          callback({
            name: 'LCP',
            value: lastEntry.startTime,
            rating: lastEntry.startTime < 2500 ? 'good' : lastEntry.startTime < 4000 ? 'needs-improvement' : 'poor'
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (e) {
        console.warn('LCP not supported');
      }

      // FID (First Input Delay)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if ('processingStart' in entry) {
              const fid = (entry as any).processingStart - entry.startTime;
              callback({
                name: 'FID',
                value: fid,
                rating: fid < 100 ? 'good' : fid < 300 ? 'needs-improvement' : 'poor'
              });
              break;
            }
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (e) {
        console.warn('FID not supported');
      }

      // CLS (Cumulative Layout Shift)
      let clsValue = 0;
      let clsEntries: any[] = [];
      
      try {
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
              clsEntries.push(entry);
            }
          }
          
          callback({
            name: 'CLS',
            value: clsValue,
            rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor',
            entries: clsEntries
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (e) {
        console.warn('CLS not supported');
      }
    }
  }
}

// Singleton instance
export const performanceService = new PerformanceService();