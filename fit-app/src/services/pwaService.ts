import { monitoring } from './browserMonitoringService';

interface PWAConfig {
  enableOffline: boolean;
  enableInstallPrompt: boolean;
  enableNotifications: boolean;
  enableBackgroundSync: boolean;
  cacheStrategies: {
    [pattern: string]: 'cache-first' | 'network-first' | 'stale-while-revalidate';
  };
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export class PWAService {
  private config: PWAConfig;
  private logger = monitoring.getLogger();
  private registration: ServiceWorkerRegistration | null = null;
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  // Cache names
  private readonly CACHE_VERSION = 'v1';
  private readonly CACHE_NAMES = {
    static: `static-${this.CACHE_VERSION}`,
    dynamic: `dynamic-${this.CACHE_VERSION}`,
    images: `images-${this.CACHE_VERSION}`,
    api: `api-${this.CACHE_VERSION}`
  };

  constructor(config: Partial<PWAConfig> = {}) {
    this.config = {
      enableOffline: true,
      enableInstallPrompt: true,
      enableNotifications: true,
      enableBackgroundSync: true,
      cacheStrategies: {
        '/api/': 'network-first',
        '/static/': 'cache-first',
        '/images/': 'cache-first',
        '/': 'stale-while-revalidate'
      },
      ...config
    };

    this.initialize();
  }

  // Initialize PWA features
  private async initialize(): Promise<void> {
    // Check if running as PWA
    if (this.isStandalone) {
      monitoring.trackEvent('pwa_launch', {
        platform: navigator.platform
      });
    }

    // Register service worker
    if ('serviceWorker' in navigator) {
      await this.registerServiceWorker();
    }

    // Setup install prompt
    if (this.config.enableInstallPrompt) {
      this.setupInstallPrompt();
    }

    // Request notification permission
    if (this.config.enableNotifications && 'Notification' in window) {
      this.setupNotifications();
    }

    // Setup app lifecycle events
    this.setupLifecycleEvents();

    this.logger.info('PWA service initialized', { config: this.config });
  }

  // Register service worker
  private async registerServiceWorker(): Promise<void> {
    try {
      // Create service worker content
      const swContent = this.generateServiceWorkerContent();
      const swBlob = new Blob([swContent], { type: 'application/javascript' });
      const swUrl = URL.createObjectURL(swBlob);

      this.registration = await navigator.serviceWorker.register(swUrl, {
        scope: '/'
      });

      this.logger.info('Service worker registered');

      // Check for updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration!.installing;
        
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content available
            this.notifyUpdate();
          }
        });
      });

      // Handle messages from service worker
      navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage);

    } catch (error) {
      this.logger.error('Service worker registration failed', { error });
    }
  }

  // Generate service worker content
  private generateServiceWorkerContent(): string {
    return `
      const CACHE_VERSION = '${this.CACHE_VERSION}';
      const CACHE_NAMES = ${JSON.stringify(this.CACHE_NAMES)};
      const CACHE_STRATEGIES = ${JSON.stringify(this.config.cacheStrategies)};
      
      // Install event
      self.addEventListener('install', (event) => {
        console.log('Service worker installing...');
        
        event.waitUntil(
          caches.open(CACHE_NAMES.static).then((cache) => {
            return cache.addAll([
              '/',
              '/index.html',
              '/static/css/main.css',
              '/static/js/main.js',
              '/manifest.json'
            ]);
          })
        );
        
        self.skipWaiting();
      });
      
      // Activate event
      self.addEventListener('activate', (event) => {
        console.log('Service worker activating...');
        
        event.waitUntil(
          caches.keys().then((cacheNames) => {
            return Promise.all(
              cacheNames.map((cacheName) => {
                if (!Object.values(CACHE_NAMES).includes(cacheName)) {
                  return caches.delete(cacheName);
                }
              })
            );
          })
        );
        
        self.clients.claim();
      });
      
      // Fetch event
      self.addEventListener('fetch', (event) => {
        const { request } = event;
        const url = new URL(request.url);
        
        // Skip cross-origin requests
        if (url.origin !== location.origin) {
          return;
        }
        
        // Determine cache strategy
        let strategy = 'network-first';
        for (const [pattern, strategyName] of Object.entries(CACHE_STRATEGIES)) {
          if (url.pathname.includes(pattern)) {
            strategy = strategyName;
            break;
          }
        }
        
        // Apply cache strategy
        if (strategy === 'cache-first') {
          event.respondWith(cacheFirst(request));
        } else if (strategy === 'network-first') {
          event.respondWith(networkFirst(request));
        } else if (strategy === 'stale-while-revalidate') {
          event.respondWith(staleWhileRevalidate(request));
        }
      });
      
      // Cache strategies
      async function cacheFirst(request) {
        const cache = await caches.open(CACHE_NAMES.dynamic);
        const cached = await cache.match(request);
        
        if (cached) {
          return cached;
        }
        
        try {
          const response = await fetch(request);
          cache.put(request, response.clone());
          return response;
        } catch (error) {
          return new Response('Offline', { status: 503 });
        }
      }
      
      async function networkFirst(request) {
        try {
          const response = await fetch(request);
          const cache = await caches.open(CACHE_NAMES.dynamic);
          cache.put(request, response.clone());
          return response;
        } catch (error) {
          const cached = await caches.match(request);
          return cached || new Response('Offline', { status: 503 });
        }
      }
      
      async function staleWhileRevalidate(request) {
        const cache = await caches.open(CACHE_NAMES.dynamic);
        const cached = await cache.match(request);
        
        const fetchPromise = fetch(request).then((response) => {
          cache.put(request, response.clone());
          return response;
        });
        
        return cached || fetchPromise;
      }
      
      // Background sync
      self.addEventListener('sync', (event) => {
        if (event.tag === 'workout-sync') {
          event.waitUntil(syncWorkoutData());
        }
      });
      
      // Push notifications
      self.addEventListener('push', (event) => {
        const data = event.data ? event.data.json() : {};
        
        event.waitUntil(
          self.registration.showNotification(data.title || 'AI Fitness Coach', {
            body: data.body || 'You have a new notification',
            icon: '/icon-192.png',
            badge: '/badge-72.png',
            vibrate: [200, 100, 200],
            data: data
          })
        );
      });
      
      // Notification click
      self.addEventListener('notificationclick', (event) => {
        event.notification.close();
        
        event.waitUntil(
          clients.openWindow(event.notification.data.url || '/')
        );
      });
      
      // Helper function to sync workout data
      async function syncWorkoutData() {
        // Implement offline data sync logic
        console.log('Syncing offline workout data...');
      }
    `;
  }

  // Setup install prompt
  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      
      monitoring.trackEvent('pwa_install_prompt_available');
      
      // Notify app that install is available
      window.dispatchEvent(new CustomEvent('pwa-install-available'));
    });

    window.addEventListener('appinstalled', () => {
      monitoring.trackEvent('pwa_installed');
      this.deferredPrompt = null;
    });
  }

  // Setup notifications
  private async setupNotifications(): Promise<void> {
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      
      monitoring.trackEvent('notification_permission', {
        result: permission
      });
    }
  }

  // Setup lifecycle events
  private setupLifecycleEvents(): void {
    // Page visibility change
    document.addEventListener('visibilitychange', () => {
      monitoring.trackEvent('app_visibility_change', {
        visible: !document.hidden
      });
    });

    // Online/offline status
    window.addEventListener('online', () => {
      monitoring.trackEvent('app_online');
      this.notifyNetworkStatus(true);
    });

    window.addEventListener('offline', () => {
      monitoring.trackEvent('app_offline');
      this.notifyNetworkStatus(false);
    });

    // App focus/blur
    window.addEventListener('focus', () => {
      monitoring.trackEvent('app_focus');
    });

    window.addEventListener('blur', () => {
      monitoring.trackEvent('app_blur');
    });
  }

  // Handle service worker messages
  private handleServiceWorkerMessage = (event: MessageEvent): void => {
    const { type, data } = event.data;

    switch (type) {
      case 'cache-updated':
        this.notifyUpdate();
        break;
      case 'sync-complete':
        this.notifySyncComplete();
        break;
      default:
        break;
    }
  };

  // Show install prompt
  async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      monitoring.trackEvent('pwa_install_prompt_result', { outcome });
      
      this.deferredPrompt = null;
      return outcome === 'accepted';
    } catch (error) {
      this.logger.error('Failed to show install prompt', { error });
      return false;
    }
  }

  // Check if app can be installed
  canBeInstalled(): boolean {
    return !!this.deferredPrompt && !this.isStandalone;
  }

  // Check if running as PWA
  isPWA(): boolean {
    return this.isStandalone || 
           window.matchMedia('(display-mode: fullscreen)').matches ||
           window.matchMedia('(display-mode: minimal-ui)').matches;
  }

  // Send push notification
  async sendNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    if (!this.config.enableNotifications || Notification.permission !== 'granted') {
      return;
    }

    try {
      await this.registration?.showNotification(title, {
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        vibrate: [200, 100, 200],
        ...options
      });
    } catch (error) {
      this.logger.error('Failed to send notification', { error });
    }
  }

  // Request background sync
  async requestBackgroundSync(tag: string): Promise<void> {
    if (!this.config.enableBackgroundSync || !this.registration) {
      return;
    }

    try {
      await (this.registration as any).sync.register(tag);
      this.logger.info('Background sync registered', { tag });
    } catch (error) {
      this.logger.error('Failed to register background sync', { error });
    }
  }

  // Update app
  async updateApp(): Promise<void> {
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }

  // Check for updates
  async checkForUpdates(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      await this.registration.update();
      return !!this.registration.waiting;
    } catch (error) {
      this.logger.error('Failed to check for updates', { error });
      return false;
    }
  }

  // Clear all caches
  async clearCaches(): Promise<void> {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    
    this.logger.info('All caches cleared');
  }

  // Get cache size
  async getCacheSize(): Promise<number> {
    if (!navigator.storage?.estimate) {
      return 0;
    }

    try {
      const estimate = await navigator.storage.estimate();
      return estimate.usage || 0;
    } catch (error) {
      this.logger.error('Failed to get cache size', { error });
      return 0;
    }
  }

  // Notify update available
  private notifyUpdate(): void {
    window.dispatchEvent(new CustomEvent('pwa-update-available'));
    
    this.sendNotification('Update Available', {
      body: 'A new version of the app is available. Click to update.',
      tag: 'update',
      requireInteraction: true
    });
  }

  // Notify sync complete
  private notifySyncComplete(): void {
    window.dispatchEvent(new CustomEvent('pwa-sync-complete'));
  }

  // Notify network status
  private notifyNetworkStatus(online: boolean): void {
    window.dispatchEvent(new CustomEvent('pwa-network-status', {
      detail: { online }
    }));
  }

  // Get PWA status
  getStatus(): {
    installed: boolean;
    updateAvailable: boolean;
    offline: boolean;
    notificationsEnabled: boolean;
    backgroundSyncEnabled: boolean;
  } {
    return {
      installed: this.isPWA(),
      updateAvailable: !!this.registration?.waiting,
      offline: !navigator.onLine,
      notificationsEnabled: Notification.permission === 'granted',
      backgroundSyncEnabled: 'sync' in ServiceWorkerRegistration.prototype
    };
  }

  // Cleanup
  async dispose(): Promise<void> {
    if (this.registration) {
      await this.registration.unregister();
    }
    
    this.logger.info('PWA service disposed');
  }
}

// Export singleton instance
export const pwaService = new PWAService();