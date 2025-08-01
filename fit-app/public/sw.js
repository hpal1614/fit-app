const CACHE_NAME = 'nimbus-fitness-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

const WORKOUT_DATA_CACHE = 'workout-data-v1';
const AI_RESPONSES_CACHE = 'ai-responses-v1';

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Handle API requests differently
  if (request.url.includes('/api/')) {
    event.respondWith(handleAPIRequest(request));
    return;
  }

  // Handle static assets
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          return response; // Serve from cache
        }
        
        return fetch(request)
          .then(response => {
            // Cache successful responses
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(request, responseClone));
            }
            return response;
          });
      })
      .catch(() => {
        // Fallback for offline
        if (request.destination === 'document') {
          return caches.match('/offline.html');
        }
      })
  );
});

// Handle API requests with intelligent caching
async function handleAPIRequest(request) {
  const url = new URL(request.url);
  
  // Cache AI responses for 1 hour
  if (url.pathname.includes('/ai/')) {
    const cached = await caches.match(request);
    if (cached) {
      const cacheDate = new Date(cached.headers.get('date'));
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      if (cacheDate > hourAgo) {
        return cached;
      }
    }
  }

  // Always try network first for API requests
  try {
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(AI_RESPONSES_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Return cached version if network fails
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    throw error;
  }
}

// Background sync for offline workout logging
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-workout') {
    event.waitUntil(syncWorkoutData());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Time for your workout! 💪',
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
        title: 'Start Workout',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Nimbus Fitness', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/workout')
    );
  }
});

// Background sync function
async function syncWorkoutData() {
  try {
    // Get offline workout data from IndexedDB
    const offlineWorkouts = await getOfflineWorkouts();
    
    // Sync with server
    for (const workout of offlineWorkouts) {
      await syncWorkoutToServer(workout);
    }
    
    console.log('Background sync completed');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Helper functions (these would be implemented with IndexedDB)
async function getOfflineWorkouts() {
  // This would retrieve workouts stored in IndexedDB
  return [];
}

async function syncWorkoutToServer(workout) {
  // This would sync workout data to the server
  return fetch('/api/workouts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(workout)
  });
} 