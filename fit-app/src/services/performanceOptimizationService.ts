import { monitoring } from './monitoringService';

interface ComponentLoadConfig {
  preload?: boolean;
  priority?: 'high' | 'normal' | 'low';
  timeout?: number;
}

interface ResourceHint {
  url: string;
  type: 'preconnect' | 'prefetch' | 'preload' | 'dns-prefetch';
  as?: string;
}

interface PerformanceBudget {
  maxBundleSize: number;
  maxImageSize: number;
  maxFontSize: number;
  maxTotalSize: number;
  maxLoadTime: number;
  maxFirstPaint: number;
}

export class PerformanceOptimizationService {
  private logger = monitoring.getLogger();
  private loadedComponents = new Set<string>();
  private pendingComponents = new Map<string, Promise<any>>();
  private performanceObserver: PerformanceObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private resourceTimings = new Map<string, number>();
  
  // Performance budgets
  private budget: PerformanceBudget = {
    maxBundleSize: 300 * 1024, // 300KB
    maxImageSize: 100 * 1024,  // 100KB
    maxFontSize: 50 * 1024,    // 50KB
    maxTotalSize: 1024 * 1024, // 1MB
    maxLoadTime: 3000,         // 3s
    maxFirstPaint: 1500        // 1.5s
  };

  constructor() {
    this.initialize();
  }

  // Initialize performance optimizations
  private initialize(): void {
    // Setup performance observer
    this.setupPerformanceObserver();
    
    // Setup intersection observer for lazy loading
    this.setupIntersectionObserver();
    
    // Add resource hints
    this.addResourceHints();
    
    // Optimize critical rendering path
    this.optimizeCriticalPath();
    
    // Monitor and report core web vitals
    this.monitorCoreWebVitals();
    
    this.logger.info('Performance optimization service initialized');
  }

  // Setup performance observer
  private setupPerformanceObserver(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      // Monitor resource timings
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resource = entry as PerformanceResourceTiming;
          
          // Track resource load times
          this.resourceTimings.set(resource.name, resource.duration);
          
          // Check against budget
          if (resource.transferSize) {
            this.checkResourceBudget(resource);
          }
        }
      });
      
      resourceObserver.observe({ entryTypes: ['resource'] });
      
      // Monitor navigation timing
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const navigation = entry as PerformanceNavigationTiming;
          
          monitoring.trackEvent('navigation_timing', {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
            totalDuration: navigation.loadEventEnd - navigation.fetchStart
          });
        }
      });
      
      navigationObserver.observe({ entryTypes: ['navigation'] });
      
    } catch (error) {
      this.logger.error('Failed to setup performance observer', { error });
    }
  }

  // Setup intersection observer for lazy loading
  private setupIntersectionObserver(): void {
    if (!('IntersectionObserver' in window)) return;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            
            // Load lazy component
            if (element.dataset.component) {
              this.loadComponent(element.dataset.component);
            }
            
            // Load lazy image
            if (element.tagName === 'IMG' && element.dataset.src) {
              this.loadImage(element as HTMLImageElement);
            }
            
            // Unobserve after loading
            this.intersectionObserver?.unobserve(element);
          }
        });
      },
      {
        rootMargin: '50px' // Start loading 50px before visible
      }
    );
  }

  // Add resource hints for better performance
  private addResourceHints(): void {
    const hints: ResourceHint[] = [
      // Preconnect to API endpoints
      { url: 'https://api.openai.com', type: 'preconnect' },
      { url: 'https://api.elevenlabs.io', type: 'preconnect' },
      { url: 'https://api.tryterra.co', type: 'preconnect' },
      
      // DNS prefetch for external resources
      { url: 'https://fonts.googleapis.com', type: 'dns-prefetch' },
      { url: 'https://fonts.gstatic.com', type: 'dns-prefetch' },
      
      // Preload critical fonts
      { 
        url: '/fonts/inter-var.woff2', 
        type: 'preload', 
        as: 'font' 
      }
    ];

    hints.forEach(hint => {
      const link = document.createElement('link');
      link.rel = hint.type;
      link.href = hint.url;
      if (hint.as) {
        link.as = hint.as;
        link.crossOrigin = 'anonymous';
      }
      document.head.appendChild(link);
    });
  }

  // Optimize critical rendering path
  private optimizeCriticalPath(): void {
    // Inline critical CSS
    this.inlineCriticalCSS();
    
    // Defer non-critical scripts
    this.deferNonCriticalScripts();
    
    // Optimize font loading
    this.optimizeFontLoading();
  }

  // Inline critical CSS
  private inlineCriticalCSS(): void {
    // Critical CSS for above-the-fold content
    const criticalCSS = `
      body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
      .app { min-height: 100vh; background: #111827; color: white; }
      .loading { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
      .spinner { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.3); 
                 border-top-color: #3B82F6; border-radius: 50%; animation: spin 1s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
    `;

    const style = document.createElement('style');
    style.innerHTML = criticalCSS;
    document.head.insertBefore(style, document.head.firstChild);
  }

  // Defer non-critical scripts
  private deferNonCriticalScripts(): void {
    document.querySelectorAll('script[src]').forEach(script => {
      const src = script.getAttribute('src');
      if (src && !src.includes('critical')) {
        script.setAttribute('defer', '');
      }
    });
  }

  // Optimize font loading
  private optimizeFontLoading(): void {
    if ('fonts' in document) {
      // Use Font Loading API
      document.fonts.ready.then(() => {
        document.body.classList.add('fonts-loaded');
      });
    }

    // Add font-display: swap to @font-face rules
    const style = document.createElement('style');
    style.innerHTML = `
      @font-face {
        font-display: swap;
      }
    `;
    document.head.appendChild(style);
  }

  // Monitor Core Web Vitals
  private monitorCoreWebVitals(): void {
    // Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      monitoring.trackEvent('web_vitals_lcp', {
        value: lastEntry.startTime,
        good: lastEntry.startTime < 2500
      });
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay (FID)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        const fid = entry.processingStart - entry.startTime;
        
        monitoring.trackEvent('web_vitals_fid', {
          value: fid,
          good: fid < 100
        });
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      
      monitoring.trackEvent('web_vitals_cls', {
        value: clsValue,
        good: clsValue < 0.1
      });
    }).observe({ entryTypes: ['layout-shift'] });
  }

  // Check resource against budget
  private checkResourceBudget(resource: PerformanceResourceTiming): void {
    const size = resource.transferSize;
    const type = this.getResourceType(resource.name);
    
    let budgetExceeded = false;
    let maxSize = 0;
    
    switch (type) {
      case 'script':
      case 'stylesheet':
        maxSize = this.budget.maxBundleSize;
        budgetExceeded = size > maxSize;
        break;
      case 'image':
        maxSize = this.budget.maxImageSize;
        budgetExceeded = size > maxSize;
        break;
      case 'font':
        maxSize = this.budget.maxFontSize;
        budgetExceeded = size > maxSize;
        break;
    }
    
    if (budgetExceeded) {
      monitoring.trackEvent('performance_budget_exceeded', {
        resource: resource.name,
        type,
        size,
        maxSize,
        exceededBy: size - maxSize
      });
      
      this.logger.warn('Performance budget exceeded', {
        resource: resource.name,
        size,
        maxSize
      });
    }
  }

  // Get resource type from URL
  private getResourceType(url: string): string {
    if (url.match(/\.(js|mjs)$/)) return 'script';
    if (url.match(/\.(css)$/)) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|otf|eot)$/)) return 'font';
    return 'other';
  }

  // Lazy load component
  async loadComponent(
    componentName: string, 
    config: ComponentLoadConfig = {}
  ): Promise<any> {
    // Check if already loaded
    if (this.loadedComponents.has(componentName)) {
      return;
    }

    // Check if already loading
    if (this.pendingComponents.has(componentName)) {
      return this.pendingComponents.get(componentName);
    }

    const loadPromise = this.performComponentLoad(componentName, config);
    this.pendingComponents.set(componentName, loadPromise);

    try {
      const component = await loadPromise;
      this.loadedComponents.add(componentName);
      this.pendingComponents.delete(componentName);
      return component;
    } catch (error) {
      this.pendingComponents.delete(componentName);
      throw error;
    }
  }

  // Perform actual component load
  private async performComponentLoad(
    componentName: string,
    config: ComponentLoadConfig
  ): Promise<any> {
    const startTime = performance.now();

    try {
      // Dynamic import based on component name
      let component;
      
      switch (componentName) {
        case 'BiometricsDashboard':
          component = await import(
            /* webpackChunkName: "biometrics" */
            /* webpackPrefetch: true */
            '../components/BiometricsDashboard'
          );
          break;
          
        case 'FormAnalysisInterface':
          component = await import(
            /* webpackChunkName: "form-analysis" */
            /* webpackPrefetch: true */
            '../components/FormAnalysisInterface'
          );
          break;
          
        case 'MonitoringDashboard':
          component = await import(
            /* webpackChunkName: "monitoring" */
            '../components/MonitoringDashboard'
          );
          break;
          
        default:
          throw new Error(`Unknown component: ${componentName}`);
      }

      const loadTime = performance.now() - startTime;
      
      monitoring.trackEvent('component_loaded', {
        component: componentName,
        loadTime,
        priority: config.priority || 'normal'
      });

      return component;
    } catch (error) {
      monitoring.trackError(error as Error, {
        component: componentName,
        operation: 'component_load'
      });
      throw error;
    }
  }

  // Load image lazily
  private loadImage(img: HTMLImageElement): void {
    const src = img.dataset.src;
    if (!src) return;

    // Create a new image to preload
    const tempImg = new Image();
    
    tempImg.onload = () => {
      img.src = src;
      img.classList.add('loaded');
      img.removeAttribute('data-src');
    };
    
    tempImg.onerror = () => {
      img.classList.add('error');
      this.logger.error('Failed to load image', { src });
    };
    
    tempImg.src = src;
  }

  // Observe element for lazy loading
  observeElement(element: HTMLElement): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.observe(element);
    }
  }

  // Preload critical resources
  preloadResources(urls: string[]): void {
    urls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      link.as = this.getResourceAs(url);
      
      if (link.as === 'font') {
        link.crossOrigin = 'anonymous';
      }
      
      document.head.appendChild(link);
    });
  }

  // Get resource 'as' attribute for preload
  private getResourceAs(url: string): string {
    if (url.match(/\.(js|mjs)$/)) return 'script';
    if (url.match(/\.(css)$/)) return 'style';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|otf|eot)$/)) return 'font';
    return 'fetch';
  }

  // Optimize images
  optimizeImageUrl(url: string, options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  } = {}): string {
    // If using a CDN that supports transforms
    const params = new URLSearchParams();
    
    if (options.width) params.set('w', options.width.toString());
    if (options.height) params.set('h', options.height.toString());
    if (options.quality) params.set('q', options.quality.toString());
    if (options.format) params.set('f', options.format);
    
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${params.toString()}`;
  }

  // Get performance metrics
  getPerformanceMetrics(): {
    resources: Map<string, number>;
    loadTime: number;
    firstPaint: number;
    firstContentfulPaint: number;
    domContentLoaded: number;
  } {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    
    return {
      resources: new Map(this.resourceTimings),
      loadTime: navigation?.loadEventEnd - navigation?.fetchStart || 0,
      firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
      domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.fetchStart || 0
    };
  }

  // Clear performance data
  clearMetrics(): void {
    this.resourceTimings.clear();
    performance.clearResourceTimings();
  }

  // Cleanup
  dispose(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    
    this.loadedComponents.clear();
    this.pendingComponents.clear();
    this.resourceTimings.clear();
    
    this.logger.info('Performance optimization service disposed');
  }
}

// Export singleton instance
export const performanceOptimization = new PerformanceOptimizationService();