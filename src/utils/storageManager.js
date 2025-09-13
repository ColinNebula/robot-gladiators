/**
 * Enhanced Storage Manager for Nebula Wars
 * Provides unified, optimized, and reliable storage across the game
 */

// Storage types and configurations
const STORAGE_TYPES = {
  PERSISTENT: 'localStorage',    // Game settings, progress, high scores
  SESSION: 'sessionStorage',     // Temporary game state, character selection
  MEMORY: 'memory'              // Runtime cache, temporary data
};

const STORAGE_KEYS = {
  // Game Data
  GAME_DATA: 'nebula-wars-data',
  GAME_SETTINGS: 'nebula-wars-settings',
  GAME_PROGRESS: 'nebula-wars-progress',
  
  // Character & Battle Data
  SELECTED_CHARACTERS: 'nebula-wars-characters',
  GAME_MODE: 'nebula-wars-mode',
  BATTLE_CONFIG: 'nebula-wars-battle-config',
  
  // Player Data
  PLAYER_PROFILE: 'nebula-wars-profile',
  HIGH_SCORES: 'nebula-wars-scores',
  STATS: 'nebula-wars-stats',
  
  // Controller & Input
  CONTROLLER_SETTINGS: 'nebula-wars-controller',
  INPUT_CONFIG: 'nebula-wars-input',
  
  // UI & Theme
  THEME: 'nebula-wars-theme',
  UI_PREFERENCES: 'nebula-wars-ui',
  
  // Cache
  SPRITE_CACHE: 'nebula-wars-sprites',
  API_CACHE: 'nebula-wars-api',
  TEMP_DATA: 'nebula-wars-temp'
};

class StorageManager {
  constructor() {
    this.memoryStore = new Map();
    this.compressionEnabled = this.isCompressionSupported();
    this.maxStorageSize = 5 * 1024 * 1024; // 5MB limit
    this.storageQuota = this.checkStorageQuota();
  }

  /**
   * Check if compression is supported
   */
  isCompressionSupported() {
    return typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';
  }

  /**
   * Check available storage quota
   */
  async checkStorageQuota() {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          quota: estimate.quota,
          usage: estimate.usage,
          available: estimate.quota - estimate.usage
        };
      }
    } catch (error) {
      console.warn('Could not check storage quota:', error);
    }
    return null;
  }

  /**
   * Compress data if compression is enabled
   */
  async compressData(data) {
    if (!this.compressionEnabled) return data;
    
    try {
      const jsonString = JSON.stringify(data);
      const stream = new CompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();
      
      writer.write(new TextEncoder().encode(jsonString));
      writer.close();
      
      const chunks = [];
      let done = false;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) chunks.push(value);
      }
      
      const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
      let offset = 0;
      chunks.forEach(chunk => {
        compressed.set(chunk, offset);
        offset += chunk.length;
      });
      
      return Array.from(compressed);
    } catch (error) {
      console.warn('Compression failed, using raw data:', error);
      return data;
    }
  }

  /**
   * Decompress data if it was compressed
   */
  async decompressData(data) {
    if (!this.compressionEnabled || !Array.isArray(data)) return data;
    
    try {
      const compressed = new Uint8Array(data);
      const stream = new DecompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();
      
      writer.write(compressed);
      writer.close();
      
      const chunks = [];
      let done = false;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) chunks.push(value);
      }
      
      const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
      let offset = 0;
      chunks.forEach(chunk => {
        decompressed.set(chunk, offset);
        offset += chunk.length;
      });
      
      const jsonString = new TextDecoder().decode(decompressed);
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn('Decompression failed, treating as raw data:', error);
      return data;
    }
  }

  /**
   * Get storage size usage
   */
  getStorageSize(type = STORAGE_TYPES.PERSISTENT) {
    let total = 0;
    const storage = type === STORAGE_TYPES.SESSION ? sessionStorage : localStorage;
    
    for (let key in storage) {
      if (storage.hasOwnProperty(key)) {
        total += storage[key].length + key.length;
      }
    }
    
    return total;
  }

  /**
   * Clean up old cache entries
   */
  cleanupCache(maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
    const now = Date.now();
    const keysToRemove = [];
    
    [localStorage, sessionStorage].forEach(storage => {
      for (let key in storage) {
        if (key.includes('cache') || key.includes('temp')) {
          try {
            const data = JSON.parse(storage[key]);
            if (data.timestamp && (now - data.timestamp) > maxAge) {
              keysToRemove.push({ storage, key });
            }
          } catch (error) {
            // If we can't parse it, it might be old data to remove
            keysToRemove.push({ storage, key });
          }
        }
      }
    });
    
    keysToRemove.forEach(({ storage, key }) => {
      try {
        storage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove cache key ${key}:`, error);
      }
    });
    
    return keysToRemove.length;
  }

  /**
   * Set data with automatic compression and error handling
   */
  async set(key, value, options = {}) {
    const {
      type = STORAGE_TYPES.PERSISTENT,
      compress = false,
      expiry = null,
      priority = 'normal'
    } = options;

    try {
      // Prepare data with metadata
      const dataToStore = {
        value: compress ? await this.compressData(value) : value,
        timestamp: Date.now(),
        expiry,
        compressed: compress,
        priority,
        version: '1.0'
      };

      const serializedData = JSON.stringify(dataToStore);

      // Check size limits
      if (serializedData.length > this.maxStorageSize) {
        throw new Error(`Data size (${serializedData.length}) exceeds maximum (${this.maxStorageSize})`);
      }

      // Store based on type
      switch (type) {
        case STORAGE_TYPES.PERSISTENT:
          localStorage.setItem(key, serializedData);
          break;
        case STORAGE_TYPES.SESSION:
          sessionStorage.setItem(key, serializedData);
          break;
        case STORAGE_TYPES.MEMORY:
          this.memoryStore.set(key, dataToStore);
          break;
        default:
          throw new Error(`Unknown storage type: ${type}`);
      }

      return true;
    } catch (error) {
      console.error(`Storage set failed for key "${key}":`, error);
      
      // Try fallback storage if main storage fails
      if (type === STORAGE_TYPES.PERSISTENT) {
        try {
          return await this.set(key, value, { ...options, type: STORAGE_TYPES.SESSION });
        } catch (fallbackError) {
          console.error('Fallback storage also failed:', fallbackError);
        }
      }
      
      return false;
    }
  }

  /**
   * Get data with automatic decompression and expiry checking
   */
  async get(key, options = {}) {
    const {
      type = STORAGE_TYPES.PERSISTENT,
      defaultValue = null,
      ignoreExpiry = false
    } = options;

    try {
      let rawData;

      // Retrieve based on type
      switch (type) {
        case STORAGE_TYPES.PERSISTENT:
          rawData = localStorage.getItem(key);
          break;
        case STORAGE_TYPES.SESSION:
          rawData = sessionStorage.getItem(key);
          break;
        case STORAGE_TYPES.MEMORY:
          rawData = this.memoryStore.get(key);
          break;
        default:
          throw new Error(`Unknown storage type: ${type}`);
      }

      if (!rawData) return defaultValue;

      // Parse data
      const parsedData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

      // Check expiry
      if (!ignoreExpiry && parsedData.expiry && Date.now() > parsedData.expiry) {
        await this.remove(key, { type });
        return defaultValue;
      }

      // Decompress if needed
      const value = parsedData.compressed 
        ? await this.decompressData(parsedData.value)
        : parsedData.value;

      return value;
    } catch (error) {
      console.error(`Storage get failed for key "${key}":`, error);
      
      // Try fallback storage
      if (type === STORAGE_TYPES.PERSISTENT) {
        try {
          return await this.get(key, { ...options, type: STORAGE_TYPES.SESSION });
        } catch (fallbackError) {
          console.error('Fallback get also failed:', fallbackError);
        }
      }
      
      return defaultValue;
    }
  }

  /**
   * Remove data from storage
   */
  async remove(key, options = {}) {
    const { type = STORAGE_TYPES.PERSISTENT } = options;

    try {
      switch (type) {
        case STORAGE_TYPES.PERSISTENT:
          localStorage.removeItem(key);
          break;
        case STORAGE_TYPES.SESSION:
          sessionStorage.removeItem(key);
          break;
        case STORAGE_TYPES.MEMORY:
          this.memoryStore.delete(key);
          break;
      }
      return true;
    } catch (error) {
      console.error(`Storage remove failed for key "${key}":`, error);
      return false;
    }
  }

  /**
   * Clear all data of a specific type
   */
  async clear(type = STORAGE_TYPES.PERSISTENT) {
    try {
      switch (type) {
        case STORAGE_TYPES.PERSISTENT:
          localStorage.clear();
          break;
        case STORAGE_TYPES.SESSION:
          sessionStorage.clear();
          break;
        case STORAGE_TYPES.MEMORY:
          this.memoryStore.clear();
          break;
        case 'all':
          localStorage.clear();
          sessionStorage.clear();
          this.memoryStore.clear();
          break;
      }
      return true;
    } catch (error) {
      console.error(`Storage clear failed for type "${type}":`, error);
      return false;
    }
  }

  /**
   * Get storage statistics
   */
  getStats() {
    return {
      localStorage: {
        size: this.getStorageSize(STORAGE_TYPES.PERSISTENT),
        count: Object.keys(localStorage).length
      },
      sessionStorage: {
        size: this.getStorageSize(STORAGE_TYPES.SESSION),
        count: Object.keys(sessionStorage).length
      },
      memoryStorage: {
        size: this.memoryStore.size,
        count: this.memoryStore.size
      },
      quota: this.storageQuota,
      compressionEnabled: this.compressionEnabled
    };
  }

  /**
   * Export all game data for backup
   */
  async exportData() {
    const exportData = {
      timestamp: Date.now(),
      version: '1.0',
      data: {}
    };

    // Export from localStorage
    for (let key in localStorage) {
      if (key.startsWith('nebula-wars-')) {
        try {
          exportData.data[key] = await this.get(key, { type: STORAGE_TYPES.PERSISTENT });
        } catch (error) {
          console.warn(`Failed to export key ${key}:`, error);
        }
      }
    }

    return exportData;
  }

  /**
   * Import data from backup
   */
  async importData(importData) {
    if (!importData || !importData.data) {
      throw new Error('Invalid import data format');
    }

    const imported = [];
    const failed = [];

    for (let [key, value] of Object.entries(importData.data)) {
      try {
        await this.set(key, value, { type: STORAGE_TYPES.PERSISTENT });
        imported.push(key);
      } catch (error) {
        console.error(`Failed to import key ${key}:`, error);
        failed.push(key);
      }
    }

    return { imported, failed };
  }
}

// Create singleton instance
const storageManager = new StorageManager();

// Helper functions for common operations
export const storage = {
  // Game data helpers
  saveGameData: (data) => storageManager.set(STORAGE_KEYS.GAME_DATA, data, { compress: true }),
  loadGameData: () => storageManager.get(STORAGE_KEYS.GAME_DATA),
  
  // Character selection helpers
  saveCharacters: (characters) => storageManager.set(STORAGE_KEYS.SELECTED_CHARACTERS, characters, { type: STORAGE_TYPES.SESSION }),
  loadCharacters: () => storageManager.get(STORAGE_KEYS.SELECTED_CHARACTERS, { type: STORAGE_TYPES.SESSION }),
  
  // Settings helpers
  saveSettings: (settings) => storageManager.set(STORAGE_KEYS.GAME_SETTINGS, settings),
  loadSettings: () => storageManager.get(STORAGE_KEYS.GAME_SETTINGS, { defaultValue: {} }),
  
  // High scores helpers
  saveHighScores: (scores) => storageManager.set(STORAGE_KEYS.HIGH_SCORES, scores),
  loadHighScores: () => storageManager.get(STORAGE_KEYS.HIGH_SCORES, { defaultValue: [] }),
  
  // Controller settings helpers
  saveControllerSettings: (settings) => storageManager.set(STORAGE_KEYS.CONTROLLER_SETTINGS, settings),
  loadControllerSettings: () => storageManager.get(STORAGE_KEYS.CONTROLLER_SETTINGS, { defaultValue: {} }),
  
  // Theme helpers
  saveTheme: (theme) => storageManager.set(STORAGE_KEYS.THEME, theme),
  loadTheme: () => storageManager.get(STORAGE_KEYS.THEME),
  
  // Cache helpers
  setCache: (key, data, expiry = 24 * 60 * 60 * 1000) => storageManager.set(key, data, { 
    type: STORAGE_TYPES.MEMORY, 
    expiry: Date.now() + expiry 
  }),
  getCache: (key) => storageManager.get(key, { type: STORAGE_TYPES.MEMORY }),
  
  // Utility functions
  cleanup: () => storageManager.cleanupCache(),
  getStats: () => storageManager.getStats(),
  exportData: () => storageManager.exportData(),
  importData: (data) => storageManager.importData(data),
  clear: (type) => storageManager.clear(type)
};

export { STORAGE_TYPES, STORAGE_KEYS, StorageManager };
export default storageManager;