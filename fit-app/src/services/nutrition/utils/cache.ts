import { FoodItem, CacheItem } from '../types/nutrition.types';

const CACHE_PREFIX = 'nutrition_cache_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const MAX_CACHE_SIZE = 1000;

export class CacheManager {
  private stats = {
    hits: 0,
    misses: 0,
    size: 0
  };

  constructor() {
    this.loadStats();
  }

  private getCacheKey(key: string): string {
    return `${CACHE_PREFIX}${key}`;
  }

  private loadStats(): void {
    try {
      const statsData = localStorage.getItem(`${CACHE_PREFIX}stats`);
      if (statsData) {
        this.stats = JSON.parse(statsData);
      }
    } catch (error) {
      console.warn('Failed to load cache stats:', error);
    }
  }

  private saveStats(): void {
    try {
      localStorage.setItem(`${CACHE_PREFIX}stats`, JSON.stringify(this.stats));
    } catch (error) {
      console.warn('Failed to save cache stats:', error);
    }
  }

  private cleanupExpired(): void {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== `${CACHE_PREFIX}stats`);
    
    let expiredCount = 0;
    cacheKeys.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const cacheItem: CacheItem = JSON.parse(data);
          if (Date.now() > cacheItem.expiresAt) {
            localStorage.removeItem(key);
            expiredCount++;
          }
        }
      } catch (error) {
        // Remove corrupted cache entries
        localStorage.removeItem(key);
        expiredCount++;
      }
    });

    if (expiredCount > 0) {
      console.log(`Cleaned up ${expiredCount} expired cache entries`);
    }
  }

  private enforceSizeLimit(): void {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== `${CACHE_PREFIX}stats`);
    
    if (cacheKeys.length > MAX_CACHE_SIZE) {
      // Sort by timestamp and remove oldest entries
      const cacheItems: Array<{ key: string; timestamp: number }> = [];
      
      cacheKeys.forEach(key => {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const cacheItem: CacheItem = JSON.parse(data);
            cacheItems.push({ key, timestamp: cacheItem.timestamp });
          }
        } catch (error) {
          // Remove corrupted entries
          localStorage.removeItem(key);
        }
      });

      // Sort by timestamp (oldest first) and remove excess
      cacheItems.sort((a, b) => a.timestamp - b.timestamp);
      const toRemove = cacheItems.slice(0, cacheItems.length - MAX_CACHE_SIZE);
      
      toRemove.forEach(item => {
        localStorage.removeItem(item.key);
      });

      console.log(`Removed ${toRemove.length} old cache entries to maintain size limit`);
    }
  }

  get(key: string): FoodItem | null {
    this.cleanupExpired();
    
    try {
      const cacheKey = this.getCacheKey(key);
      const data = localStorage.getItem(cacheKey);
      
      if (!data) {
        this.stats.misses++;
        this.saveStats();
        return null;
      }

      const cacheItem: CacheItem = JSON.parse(data);
      
      if (Date.now() > cacheItem.expiresAt) {
        localStorage.removeItem(cacheKey);
        this.stats.misses++;
        this.saveStats();
        return null;
      }

      this.stats.hits++;
      this.saveStats();
      return cacheItem.data;
    } catch (error) {
      console.warn('Cache get error:', error);
      this.stats.misses++;
      this.saveStats();
      return null;
    }
  }

  set(key: string, data: FoodItem, ttl: number = CACHE_EXPIRY): void {
    try {
      const cacheKey = this.getCacheKey(key);
      const cacheItem: CacheItem = {
        key: cacheKey,
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
      this.enforceSizeLimit();
      
      // Update size stat
      const keys = Object.keys(localStorage);
      this.stats.size = keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== `${CACHE_PREFIX}stats`).length;
      this.saveStats();
    } catch (error) {
      console.warn('Cache set error:', error);
    }
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      
      cacheKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      this.stats = { hits: 0, misses: 0, size: 0 };
      this.saveStats();
      console.log('Cache cleared');
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }

  getStats(): { size: number; hits: number; misses: number } {
    return { ...this.stats };
  }

  // Get cache hit rate
  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  // Get cache size in MB
  getSizeInMB(): number {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== `${CACHE_PREFIX}stats`);
      
      let totalSize = 0;
      cacheKeys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          totalSize += new Blob([data]).size;
        }
      });

      return totalSize / (1024 * 1024); // Convert to MB
    } catch (error) {
      return 0;
    }
  }
}
