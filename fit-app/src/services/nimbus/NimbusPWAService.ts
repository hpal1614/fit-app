export class NimbusPWAService {
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported = 'serviceWorker' in navigator && 'PushManager' in window;

  // Register service worker
  async registerServiceWorker(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('PWA features not supported in this browser');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registered successfully');
      
      // Listen for updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration!.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              this.showUpdateNotification();
            }
          });
        }
      });

      return true;
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      return false;
    }
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if (!this.isSupported) return false;

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  // Send push notification
  async sendNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    if (!this.isSupported || !this.registration) return;

    const defaultOptions: NotificationOptions = {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      },
      actions: [
        {
          action: 'explore',
          title: 'Open App',
          icon: '/icons/checkmark.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/icons/xmark.png'
        }
      ],
      ...options
    };

    try {
      await this.registration.showNotification(title, defaultOptions);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  // Schedule workout reminder
  async scheduleWorkoutReminder(hour: number, minute: number): Promise<void> {
    if (!this.isSupported || !this.registration) return;

    try {
      const now = new Date();
      const reminderTime = new Date();
      reminderTime.setHours(hour, minute, 0, 0);

      // If time has passed today, schedule for tomorrow
      if (reminderTime <= now) {
        reminderTime.setDate(reminderTime.getDate() + 1);
      }

      const delay = reminderTime.getTime() - now.getTime();

      setTimeout(() => {
        this.sendNotification('Time for your workout! 💪', {
          body: 'Your scheduled workout time has arrived. Ready to crush it?',
          tag: 'workout-reminder',
          requireInteraction: true
        });
      }, delay);

      console.log(`Workout reminder scheduled for ${reminderTime.toLocaleString()}`);
    } catch (error) {
      console.error('Failed to schedule workout reminder:', error);
    }
  }

  // Check if app is installed
  isAppInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  // Show install prompt
  async showInstallPrompt(): Promise<void> {
    if (!this.isSupported || !this.registration) return;

    // Check if app is already installed
    if (this.isAppInstalled()) {
      console.log('App is already installed');
      return;
    }

    // Check if install prompt is available
    const deferredPrompt = (window as any).deferredPrompt;
    if (!deferredPrompt) {
      console.log('Install prompt not available');
      return;
    }

    try {
      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('✅ User accepted the install prompt');
      } else {
        console.log('❌ User dismissed the install prompt');
      }

      // Clear the deferredPrompt
      (window as any).deferredPrompt = null;
    } catch (error) {
      console.error('Failed to show install prompt:', error);
    }
  }

  // Handle offline workout logging
  async logOfflineWorkout(workout: any): Promise<void> {
    try {
      // Store workout in IndexedDB for offline sync
      await this.storeOfflineWorkout(workout);
      
      // Register background sync if supported
      if (this.registration && 'sync' in this.registration) {
        await this.registration.sync.register('background-sync-workout');
      }
      
      console.log('Offline workout logged successfully');
    } catch (error) {
      console.error('Failed to log offline workout:', error);
    }
  }

  // Store workout in IndexedDB
  private async storeOfflineWorkout(workout: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('NimbusFitness', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['workouts'], 'readwrite');
        const store = transaction.objectStore('workouts');
        
        const addRequest = store.add({
          ...workout,
          timestamp: Date.now(),
          synced: false
        });

        addRequest.onsuccess = () => resolve();
        addRequest.onerror = () => reject(addRequest.error);
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('workouts')) {
          db.createObjectStore('workouts', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  // Get offline workouts
  async getOfflineWorkouts(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('NimbusFitness', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['workouts'], 'readonly');
        const store = transaction.objectStore('workouts');
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => resolve(getAllRequest.result);
        getAllRequest.onerror = () => reject(getAllRequest.error);
      };
    });
  }

  // Clear synced offline workouts
  async clearSyncedWorkouts(): Promise<void> {
    const workouts = await this.getOfflineWorkouts();
    const syncedWorkouts = workouts.filter(w => w.synced);

    return new Promise((resolve, reject) => {
      const request = indexedDB.open('NimbusFitness', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['workouts'], 'readwrite');
        const store = transaction.objectStore('workouts');

        syncedWorkouts.forEach(workout => {
          store.delete(workout.id);
        });

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };
    });
  }

  // Show update notification
  private showUpdateNotification(): void {
    this.sendNotification('App Update Available', {
      body: 'A new version of Nimbus Fitness is available. Click to update.',
      tag: 'app-update',
      requireInteraction: true,
      actions: [
        {
          action: 'update',
          title: 'Update Now',
          icon: '/icons/update.png'
        }
      ]
    });
  }

  // Get PWA status
  getPWAStatus(): {
    isSupported: boolean;
    isInstalled: boolean;
    hasNotifications: boolean;
    hasServiceWorker: boolean;
  } {
    return {
      isSupported: this.isSupported,
      isInstalled: this.isAppInstalled(),
      hasNotifications: 'Notification' in window && Notification.permission === 'granted',
      hasServiceWorker: !!this.registration
    };
  }
} 