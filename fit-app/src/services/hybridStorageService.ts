// Hybrid storage service for both local and cloud storage
export interface StorageConfig {
  useCloud: boolean;
  autoSync: boolean;
  encryptData: boolean;
}

export interface StoredData {
  id: string;
  type: 'workout' | 'user' | 'settings' | 'progress';
  data: any;
  timestamp: number;
  synced: boolean;
}

class HybridStorageService {
  private config: StorageConfig = {
    useCloud: false,
    autoSync: true,
    encryptData: false
  };

  private dbName = 'FitnessAppDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  constructor() {
    this.initializeDB();
  }

  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('workouts')) {
          db.createObjectStore('workouts', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('progress')) {
          db.createObjectStore('progress', { keyPath: 'id' });
        }
      };
    });
  }

  async store(type: StoredData['type'], id: string, data: any): Promise<boolean> {
    try {
      if (!this.db) await this.initializeDB();

      const storedData: StoredData = {
        id,
        type,
        data: this.config.encryptData ? this.encrypt(data) : data,
        timestamp: Date.now(),
        synced: false
      };

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([type + 's'], 'readwrite');
        const store = transaction.objectStore(type + 's');
        const request = store.put(storedData);

        request.onsuccess = () => {
          if (this.config.autoSync && this.config.useCloud) {
            this.syncToCloud(storedData);
          }
          resolve(true);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Storage error:', error);
      return false;
    }
  }

  async retrieve(type: StoredData['type'], id: string): Promise<any | null> {
    try {
      if (!this.db) await this.initializeDB();

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([type + 's'], 'readonly');
        const store = transaction.objectStore(type + 's');
        const request = store.get(id);

        request.onsuccess = () => {
          const result = request.result;
          if (result) {
            const data = this.config.encryptData ? this.decrypt(result.data) : result.data;
            resolve(data);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Retrieval error:', error);
      return null;
    }
  }

  async getAll(type: StoredData['type']): Promise<StoredData[]> {
    try {
      if (!this.db) await this.initializeDB();

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([type + 's'], 'readonly');
        const store = transaction.objectStore(type + 's');
        const request = store.getAll();

        request.onsuccess = () => {
          const results = request.result.map((item: StoredData) => ({
            ...item,
            data: this.config.encryptData ? this.decrypt(item.data) : item.data
          }));
          resolve(results);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('GetAll error:', error);
      return [];
    }
  }

  async delete(type: StoredData['type'], id: string): Promise<boolean> {
    try {
      if (!this.db) await this.initializeDB();

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([type + 's'], 'readwrite');
        const store = transaction.objectStore(type + 's');
        const request = store.delete(id);

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  }

  async clear(type?: StoredData['type']): Promise<boolean> {
    try {
      if (!this.db) await this.initializeDB();

      if (type) {
        return new Promise((resolve, reject) => {
          const transaction = this.db!.transaction([type + 's'], 'readwrite');
          const store = transaction.objectStore(type + 's');
          const request = store.clear();

          request.onsuccess = () => resolve(true);
          request.onerror = () => reject(request.error);
        });
      } else {
        // Clear all stores
        const types: StoredData['type'][] = ['workout', 'user', 'settings', 'progress'];
        const promises = types.map(t => this.clear(t));
        const results = await Promise.all(promises);
        return results.every(result => result);
      }
    } catch (error) {
      console.error('Clear error:', error);
      return false;
    }
  }

  private encrypt(data: any): string {
    // Simple base64 encoding (in production, use proper encryption)
    return btoa(JSON.stringify(data));
  }

  private decrypt(encryptedData: string): any {
    // Simple base64 decoding (in production, use proper decryption)
    try {
      return JSON.parse(atob(encryptedData));
    } catch {
      return encryptedData; // Return as-is if not encrypted
    }
  }

  private async syncToCloud(data: StoredData): Promise<void> {
    // Mock cloud sync - implement actual cloud storage integration
    console.log('Syncing to cloud:', data.id);
    // In real implementation, sync with Supabase, Firebase, etc.
  }

  async exportData(): Promise<string> {
    const types: StoredData['type'][] = ['workout', 'user', 'settings', 'progress'];
    const exportData: Record<string, StoredData[]> = {};

    for (const type of types) {
      exportData[type] = await this.getAll(type);
    }

    return JSON.stringify(exportData, null, 2);
  }

  async importData(jsonData: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonData);
      
      for (const [type, items] of Object.entries(data)) {
        if (Array.isArray(items)) {
          for (const item of items) {
            await this.store(type as StoredData['type'], item.id, item.data);
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Import error:', error);
      return false;
    }
  }

  updateConfig(newConfig: Partial<StorageConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): StorageConfig {
    return { ...this.config };
  }

  isUsingSupabase(): boolean {
    // For now, return false since we're using local storage
    // In a real implementation, this would check if Supabase is configured and connected
    return false;
  }

  async signOut(): Promise<void> {
    // Clear user session data
    await this.delete('user', 'currentUser');
    console.log('User signed out');
  }

  async getStorageStats() {
    const types: StoredData['type'][] = ['workout', 'user', 'settings', 'progress'];
    const stats: Record<string, number> = {};

    for (const type of types) {
      const items = await this.getAll(type);
      stats[type] = items.length;
    }

    return stats;
  }
}

// Export singleton instance
export const hybridStorageService = new HybridStorageService();
