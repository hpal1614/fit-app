import { monitoring } from './monitoringService';

interface TouchGesture {
  type: 'swipe' | 'pinch' | 'tap' | 'longpress' | 'rotate';
  handler: (event: TouchEvent) => void;
  element?: HTMLElement;
}

interface DeviceCapabilities {
  hasTouch: boolean;
  hasGyroscope: boolean;
  hasAccelerometer: boolean;
  hasCamera: boolean;
  hasMicrophone: boolean;
  maxTouchPoints: number;
  screenSize: 'small' | 'medium' | 'large';
  deviceType: 'mobile' | 'tablet' | 'desktop';
  networkType: string;
  isOnline: boolean;
}

interface PerformanceMetrics {
  fps: number;
  memory: number;
  latency: number;
  batteryLevel?: number;
}

export class MobileOptimizationService {
  private touchHandlers: Map<string, TouchGesture[]> = new Map();
  private swipeThreshold = 50;
  private longPressThreshold = 500;
  private doubleTapThreshold = 300;
  private lastTapTime = 0;
  private isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  private isAndroid = /Android/.test(navigator.userAgent);
  private logger = monitoring.getLogger();
  
  // Performance monitoring
  private performanceObserver: PerformanceObserver | null = null;
  private frameCount = 0;
  private lastFrameTime = performance.now();
  private fpsHistory: number[] = [];

  constructor() {
    this.initialize();
  }

  // Initialize mobile optimizations
  private initialize(): void {
    // Set viewport for mobile
    this.setupViewport();
    
    // Prevent bounce scrolling on iOS
    if (this.isIOS) {
      this.preventBounceScrolling();
    }
    
    // Setup performance monitoring
    this.setupPerformanceMonitoring();
    
    // Setup network monitoring
    this.setupNetworkMonitoring();
    
    // Setup orientation change handler
    this.setupOrientationHandler();
    
    // Optimize touch events
    this.optimizeTouchEvents();
    
    this.logger.info('Mobile optimization service initialized');
  }

  // Setup viewport meta tag
  private setupViewport(): void {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.setAttribute('name', 'viewport');
      document.head.appendChild(viewport);
    }
    
    viewport.setAttribute('content', 
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
    );
  }

  // Prevent bounce scrolling on iOS
  private preventBounceScrolling(): void {
    document.addEventListener('touchmove', (e) => {
      // Allow scrolling on scrollable elements
      let element = e.target as HTMLElement;
      while (element && element !== document.body) {
        if (element.scrollHeight > element.clientHeight) {
          return;
        }
        element = element.parentElement!;
      }
      e.preventDefault();
    }, { passive: false });
  }

  // Setup performance monitoring
  private setupPerformanceMonitoring(): void {
    // Monitor FPS
    const measureFPS = () => {
      const now = performance.now();
      const delta = now - this.lastFrameTime;
      
      if (delta >= 1000) {
        const fps = Math.round((this.frameCount * 1000) / delta);
        this.fpsHistory.push(fps);
        if (this.fpsHistory.length > 60) {
          this.fpsHistory.shift();
        }
        
        // Log poor performance
        if (fps < 30) {
          monitoring.trackEvent('poor_performance', {
            fps,
            device: this.getDeviceCapabilities().deviceType
          });
        }
        
        this.frameCount = 0;
        this.lastFrameTime = now;
      }
      
      this.frameCount++;
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
    
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              monitoring.trackEvent('long_task', {
                duration: entry.duration,
                name: entry.name
              });
            }
          }
        });
        
        this.performanceObserver.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        this.logger.error('Failed to setup performance observer', { error });
      }
    }
  }

  // Setup network monitoring
  private setupNetworkMonitoring(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const updateNetworkStatus = () => {
        monitoring.trackEvent('network_change', {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        });
      };
      
      connection.addEventListener('change', updateNetworkStatus);
      updateNetworkStatus();
    }
  }

  // Setup orientation change handler
  private setupOrientationHandler(): void {
    const handleOrientationChange = () => {
      const orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
      
      document.body.classList.remove('portrait', 'landscape');
      document.body.classList.add(orientation);
      
      monitoring.trackEvent('orientation_change', { orientation });
      
      // Trigger resize event for components
      window.dispatchEvent(new Event('resize'));
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    
    // Set initial orientation
    handleOrientationChange();
  }

  // Optimize touch events
  private optimizeTouchEvents(): void {
    // Add touch-action CSS for better scrolling
    const style = document.createElement('style');
    style.innerHTML = `
      * {
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
      }
      
      .scrollable {
        -webkit-overflow-scrolling: touch;
        overflow-y: auto;
      }
      
      .no-select {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
      
      button, a, .touchable {
        touch-action: manipulation;
      }
    `;
    document.head.appendChild(style);
  }

  // Register swipe gesture
  registerSwipeGesture(
    element: HTMLElement,
    onSwipe: (direction: 'left' | 'right' | 'up' | 'down') => void
  ): () => void {
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startTime = Date.now();
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const endTime = Date.now();
      
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const deltaTime = endTime - startTime;
      
      // Check if it's a swipe (not too slow)
      if (deltaTime > 500) return;
      
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      
      if (absX > this.swipeThreshold || absY > this.swipeThreshold) {
        if (absX > absY) {
          onSwipe(deltaX > 0 ? 'right' : 'left');
        } else {
          onSwipe(deltaY > 0 ? 'down' : 'up');
        }
      }
    };
    
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    // Return cleanup function
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }

  // Register pinch gesture
  registerPinchGesture(
    element: HTMLElement,
    onPinch: (scale: number) => void
  ): () => void {
    let initialDistance = 0;
    
    const getDistance = (touches: TouchList) => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };
    
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        initialDistance = getDistance(e.touches);
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialDistance > 0) {
        const currentDistance = getDistance(e.touches);
        const scale = currentDistance / initialDistance;
        onPinch(scale);
      }
    };
    
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
    };
  }

  // Register long press gesture
  registerLongPressGesture(
    element: HTMLElement,
    onLongPress: () => void
  ): () => void {
    let pressTimer: NodeJS.Timeout | null = null;
    
    const handleTouchStart = () => {
      pressTimer = setTimeout(() => {
        onLongPress();
        // Haptic feedback on supported devices
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }, this.longPressThreshold);
    };
    
    const handleTouchEnd = () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    };
    
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchmove', handleTouchEnd, { passive: true });
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchmove', handleTouchEnd);
      if (pressTimer) clearTimeout(pressTimer);
    };
  }

  // Register double tap gesture
  registerDoubleTapGesture(
    element: HTMLElement,
    onDoubleTap: () => void
  ): () => void {
    const handleTouchEnd = () => {
      const now = Date.now();
      
      if (now - this.lastTapTime < this.doubleTapThreshold) {
        onDoubleTap();
        this.lastTapTime = 0;
      } else {
        this.lastTapTime = now;
      }
    };
    
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }

  // Get device capabilities
  getDeviceCapabilities(): DeviceCapabilities {
    const width = window.innerWidth;
    
    return {
      hasTouch: 'ontouchstart' in window,
      hasGyroscope: 'DeviceOrientationEvent' in window,
      hasAccelerometer: 'DeviceMotionEvent' in window,
      hasCamera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      hasMicrophone: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      screenSize: width < 768 ? 'small' : width < 1024 ? 'medium' : 'large',
      deviceType: width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop',
      networkType: (navigator as any).connection?.effectiveType || 'unknown',
      isOnline: navigator.onLine
    };
  }

  // Get performance metrics
  getPerformanceMetrics(): PerformanceMetrics {
    const avgFPS = this.fpsHistory.length > 0
      ? this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length
      : 60;
    
    return {
      fps: Math.round(avgFPS),
      memory: performance.memory ? performance.memory.usedJSHeapSize : 0,
      latency: (navigator as any).connection?.rtt || 0,
      batteryLevel: (navigator as any).battery?.level
    };
  }

  // Request fullscreen
  async requestFullscreen(element?: HTMLElement): Promise<void> {
    const target = element || document.documentElement;
    
    try {
      if (target.requestFullscreen) {
        await target.requestFullscreen();
      } else if ((target as any).webkitRequestFullscreen) {
        await (target as any).webkitRequestFullscreen();
      }
    } catch (error) {
      this.logger.error('Failed to enter fullscreen', { error });
    }
  }

  // Exit fullscreen
  async exitFullscreen(): Promise<void> {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      }
    } catch (error) {
      this.logger.error('Failed to exit fullscreen', { error });
    }
  }

  // Lock screen orientation
  async lockOrientation(orientation: 'portrait' | 'landscape'): Promise<void> {
    if ('orientation' in screen && 'lock' in screen.orientation) {
      try {
        await screen.orientation.lock(orientation);
      } catch (error) {
        this.logger.error('Failed to lock orientation', { error });
      }
    }
  }

  // Vibrate device
  vibrate(pattern: number | number[]): void {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  // Enable wake lock to prevent screen sleep
  async enableWakeLock(): Promise<() => void> {
    if ('wakeLock' in navigator) {
      try {
        const wakeLock = await (navigator as any).wakeLock.request('screen');
        
        return () => {
          wakeLock.release();
        };
      } catch (error) {
        this.logger.error('Failed to enable wake lock', { error });
      }
    }
    
    return () => {};
  }

  // Optimize images for mobile
  optimizeImageSrc(src: string, width: number): string {
    // Add image optimization parameters
    const devicePixelRatio = window.devicePixelRatio || 1;
    const targetWidth = Math.round(width * devicePixelRatio);
    
    // If using a CDN that supports image optimization
    if (src.includes('cloudinary') || src.includes('imgix')) {
      return src.replace(/w_\d+/, `w_${targetWidth}`);
    }
    
    return src;
  }

  // Lazy load images
  setupImageLazyLoading(): void {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            
            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      });
      
      // Observe all images with data-src
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  // Reduce motion for accessibility
  prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Cleanup
  dispose(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    this.touchHandlers.clear();
    
    this.logger.info('Mobile optimization service disposed');
  }
}

// Export singleton instance
export const mobileOptimization = new MobileOptimizationService();