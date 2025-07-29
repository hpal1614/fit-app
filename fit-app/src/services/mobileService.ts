export interface SwipeGesture {
  direction: 'up' | 'down' | 'left' | 'right';
  velocity: number;
  distance: number;
  duration: number;
}

export interface HapticPattern {
  type: 'impact' | 'notification' | 'selection';
  intensity: 'light' | 'medium' | 'heavy';
}

export class MobileService {
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchStartTime: number = 0;
  private swipeThreshold: number = 50;
  private swipeVelocityThreshold: number = 0.3;
  
  constructor() {
    this.initialize();
  }

  private initialize(): void {
    // Check for mobile capabilities
    this.setupOrientationHandling();
    this.setupVibrationAPI();
  }

  // Touch Gesture Detection
  handleTouchStart(e: TouchEvent): void {
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
    this.touchStartTime = Date.now();
  }

  handleTouchEnd(e: TouchEvent, callback: (gesture: SwipeGesture) => void): void {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndTime = Date.now();

    const deltaX = touchEndX - this.touchStartX;
    const deltaY = touchEndY - this.touchStartY;
    const duration = touchEndTime - this.touchStartTime;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / duration;

    if (distance > this.swipeThreshold && velocity > this.swipeVelocityThreshold) {
      let direction: SwipeGesture['direction'];
      
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
      }

      callback({
        direction,
        velocity,
        distance,
        duration
      });
    }
  }

  // Haptic Feedback
  async triggerHaptic(pattern: HapticPattern): Promise<void> {
    // Check if Vibration API is available
    if ('vibrate' in navigator) {
      let vibrationPattern: number | number[];
      
      switch (pattern.type) {
        case 'impact':
          vibrationPattern = pattern.intensity === 'light' ? 10 : 
                            pattern.intensity === 'medium' ? 30 : 50;
          break;
        case 'notification':
          vibrationPattern = [100, 50, 100];
          break;
        case 'selection':
          vibrationPattern = 10;
          break;
        default:
          vibrationPattern = 20;
      }
      
      navigator.vibrate(vibrationPattern);
    }

    // iOS Haptic Feedback (if available)
    if ('HapticFeedback' in window && (window as any).HapticFeedback) {
      const haptic = (window as any).HapticFeedback;
      
      switch (pattern.type) {
        case 'impact':
          haptic.impactOccurred(pattern.intensity);
          break;
        case 'notification':
          haptic.notificationOccurred('success');
          break;
        case 'selection':
          haptic.selectionChanged();
          break;
      }
    }
  }

  // Screen Wake Lock for workout sessions
  private wakeLock: WakeLockSentinel | null = null;

  async requestWakeLock(): Promise<boolean> {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
        console.log('Wake lock activated');
        
        // Re-acquire wake lock if visibility changes
        document.addEventListener('visibilitychange', async () => {
          if (this.wakeLock && document.visibilityState === 'visible') {
            this.wakeLock = await navigator.wakeLock.request('screen');
          }
        });
        
        return true;
      } catch (err) {
        console.error('Wake lock failed:', err);
        return false;
      }
    }
    return false;
  }

  async releaseWakeLock(): Promise<void> {
    if (this.wakeLock) {
      await this.wakeLock.release();
      this.wakeLock = null;
      console.log('Wake lock released');
    }
  }

  // Orientation Handling
  private setupOrientationHandling(): void {
    if ('orientation' in window) {
      window.addEventListener('orientationchange', () => {
        this.handleOrientationChange();
      });
    }

    // Modern orientation API
    if ('screen' in window && 'orientation' in window.screen) {
      window.screen.orientation.addEventListener('change', () => {
        this.handleOrientationChange();
      });
    }
  }

  private handleOrientationChange(): void {
    const orientation = this.getOrientation();
    document.body.setAttribute('data-orientation', orientation);
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('orientationChanged', {
      detail: { orientation }
    }));
  }

  getOrientation(): 'portrait' | 'landscape' {
    if ('orientation' in window) {
      return Math.abs((window as any).orientation) === 90 ? 'landscape' : 'portrait';
    }
    
    if ('screen' in window && 'orientation' in window.screen) {
      return window.screen.orientation.type.includes('landscape') ? 'landscape' : 'portrait';
    }
    
    return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  }

  // Vibration API wrapper
  private setupVibrationAPI(): void {
    // Polyfill for older browsers
    if (!('vibrate' in navigator)) {
      (navigator as any).vibrate = (navigator as any).vibrate || 
                                  (navigator as any).webkitVibrate || 
                                  (navigator as any).mozVibrate || 
                                  (navigator as any).msVibrate ||
                                  (() => false);
    }
  }

  // Device Motion for exercise tracking
  async requestMotionPermission(): Promise<boolean> {
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        return permission === 'granted';
      } catch (error) {
        console.error('Motion permission denied:', error);
        return false;
      }
    }
    return true; // Permission not required on this device
  }

  startMotionTracking(callback: (data: DeviceMotionEvent) => void): () => void {
    const handleMotion = (event: DeviceMotionEvent) => {
      callback(event);
    };

    window.addEventListener('devicemotion', handleMotion);
    
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }

  // Network Status
  getNetworkStatus(): { online: boolean; effectiveType?: string } {
    const online = navigator.onLine;
    let effectiveType: string | undefined;

    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      effectiveType = connection.effectiveType;
    }

    return { online, effectiveType };
  }

  // Battery Status
  async getBatteryStatus(): Promise<{ level: number; charging: boolean } | null> {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        return {
          level: battery.level * 100,
          charging: battery.charging
        };
      } catch (error) {
        console.error('Battery status unavailable:', error);
      }
    }
    return null;
  }

  // Touch-friendly scroll behavior
  enableSmoothScroll(element: HTMLElement): void {
    let isScrolling = false;
    let startY = 0;
    let startScrollTop = 0;

    element.addEventListener('touchstart', (e) => {
      isScrolling = true;
      startY = e.touches[0].pageY;
      startScrollTop = element.scrollTop;
    }, { passive: true });

    element.addEventListener('touchmove', (e) => {
      if (!isScrolling) return;
      
      const deltaY = startY - e.touches[0].pageY;
      element.scrollTop = startScrollTop + deltaY;
    }, { passive: true });

    element.addEventListener('touchend', () => {
      isScrolling = false;
    }, { passive: true });
  }

  // Pull-to-refresh implementation
  enablePullToRefresh(
    element: HTMLElement,
    onRefresh: () => Promise<void>,
    threshold: number = 100
  ): () => void {
    let startY = 0;
    let currentY = 0;
    let pulling = false;
    let canRefresh = false;

    const refreshIndicator = document.createElement('div');
    refreshIndicator.className = 'refresh-indicator';
    refreshIndicator.style.cssText = `
      position: absolute;
      top: -50px;
      left: 50%;
      transform: translateX(-50%);
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      opacity: 0;
    `;
    refreshIndicator.innerHTML = '↻';
    element.style.position = 'relative';
    element.appendChild(refreshIndicator);

    const handleTouchStart = (e: TouchEvent) => {
      if (element.scrollTop === 0) {
        startY = e.touches[0].pageY;
        pulling = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!pulling) return;
      
      currentY = e.touches[0].pageY;
      const pullDistance = currentY - startY;
      
      if (pullDistance > 0) {
        e.preventDefault();
        
        const progress = Math.min(pullDistance / threshold, 1);
        refreshIndicator.style.opacity = String(progress);
        refreshIndicator.style.transform = `translateX(-50%) translateY(${pullDistance * 0.5}px) rotate(${pullDistance * 2}deg)`;
        
        canRefresh = pullDistance > threshold;
      }
    };

    const handleTouchEnd = async () => {
      if (canRefresh) {
        refreshIndicator.style.transform = 'translateX(-50%) translateY(60px) rotate(720deg)';
        await onRefresh();
      }
      
      refreshIndicator.style.opacity = '0';
      refreshIndicator.style.transform = 'translateX(-50%)';
      
      pulling = false;
      canRefresh = false;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      refreshIndicator.remove();
    };
  }

  // Keyboard handling for mobile
  handleVirtualKeyboard(): void {
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      viewport.setAttribute('content', 
        'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
      );
    }

    // Adjust layout when keyboard appears
    if ('visualViewport' in window) {
      window.visualViewport?.addEventListener('resize', () => {
        const hasKeyboard = window.innerHeight < window.screen.height * 0.75;
        document.body.setAttribute('data-keyboard', hasKeyboard ? 'visible' : 'hidden');
      });
    }
  }

  // Safe area insets for notched devices
  getSafeAreaInsets(): { top: number; bottom: number; left: number; right: number } {
    const styles = getComputedStyle(document.documentElement);
    
    return {
      top: parseInt(styles.getPropertyValue('--safe-area-inset-top') || '0'),
      bottom: parseInt(styles.getPropertyValue('--safe-area-inset-bottom') || '0'),
      left: parseInt(styles.getPropertyValue('--safe-area-inset-left') || '0'),
      right: parseInt(styles.getPropertyValue('--safe-area-inset-right') || '0')
    };
  }

  // Mobile-specific storage optimization
  async clearOldData(daysToKeep: number = 30): Promise<void> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      
      // Clear old data if using more than 80% of quota
      if (usage / quota > 0.8) {
        // Implement cleanup logic here
        console.log('Storage cleanup needed:', { usage, quota });
      }
    }
  }

  // Check if running as installed PWA
  isInstalledPWA(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  // Device capabilities check
  getDeviceCapabilities(): {
    touch: boolean;
    motion: boolean;
    orientation: boolean;
    vibration: boolean;
    wakeLock: boolean;
    camera: boolean;
    microphone: boolean;
  } {
    return {
      touch: 'ontouchstart' in window,
      motion: 'DeviceMotionEvent' in window,
      orientation: 'orientation' in window || ('screen' in window && 'orientation' in window.screen),
      vibration: 'vibrate' in navigator,
      wakeLock: 'wakeLock' in navigator,
      camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      microphone: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices
    };
  }
}

// Singleton instance
export const mobileService = new MobileService();