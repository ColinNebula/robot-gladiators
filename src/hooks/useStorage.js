import { useState, useEffect, useCallback } from 'react';
import { storage, STORAGE_TYPES } from '../utils/storageManager';

/**
 * Enhanced useStorage hook with automatic sync and error handling
 */
export function useStorage(key, defaultValue, options = {}) {
  const {
    type = STORAGE_TYPES.PERSISTENT,
    compress = false,
    autoSave = true,
    syncAcrossTabs = false
  } = options;

  const [value, setValue] = useState(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load initial value
  useEffect(() => {
    const loadValue = async () => {
      try {
        setLoading(true);
        const storedValue = await storage.loadGameData();
        setValue(storedValue !== null ? storedValue : defaultValue);
        setError(null);
      } catch (err) {
        console.error(`Failed to load storage key "${key}":`, err);
        setError(err);
        setValue(defaultValue);
      } finally {
        setLoading(false);
      }
    };

    loadValue();
  }, [key, defaultValue]);

  // Save value when it changes
  useEffect(() => {
    if (!autoSave || loading) return;

    const saveValue = async () => {
      try {
        await storage.saveGameData(value);
        setError(null);
      } catch (err) {
        console.error(`Failed to save storage key "${key}":`, err);
        setError(err);
      }
    };

    saveValue();
  }, [key, value, autoSave, loading, type, compress]);

  // Cross-tab synchronization
  useEffect(() => {
    if (!syncAcrossTabs || type !== STORAGE_TYPES.PERSISTENT) return;

    const handleStorageChange = (event) => {
      if (event.key === key && event.newValue !== null) {
        try {
          const newValue = JSON.parse(event.newValue);
          setValue(newValue.value);
        } catch (err) {
          console.error('Failed to sync storage across tabs:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, syncAcrossTabs, type]);

  const updateValue = useCallback((newValue) => {
    setValue(newValue);
  }, []);

  const clearValue = useCallback(async () => {
    try {
      await storage.clear(type);
      setValue(defaultValue);
      setError(null);
    } catch (err) {
      console.error(`Failed to clear storage key "${key}":`, err);
      setError(err);
    }
  }, [key, defaultValue, type]);

  return {
    value,
    setValue: updateValue,
    clearValue,
    loading,
    error,
    isReady: !loading && !error
  };
}

/**
 * Hook for character selection data
 */
export function useCharacterStorage() {
  return useStorage('selectedCharacters', null, {
    type: STORAGE_TYPES.SESSION,
    autoSave: true
  });
}

/**
 * Hook for game settings
 */
export function useGameSettings() {
  const defaultSettings = {
    difficulty: 'normal',
    soundEnabled: true,
    musicEnabled: true,
    volume: 0.7,
    controllerEnabled: true,
    autoSave: true
  };

  return useStorage('gameSettings', defaultSettings, {
    type: STORAGE_TYPES.PERSISTENT,
    compress: true,
    syncAcrossTabs: true
  });
}

/**
 * Hook for controller settings
 */
export function useControllerSettings() {
  const defaultSettings = {
    deadzone: 0.1,
    sensitivity: 1.0,
    buttonMapping: {},
    vibrationEnabled: true
  };

  return useStorage('controllerSettings', defaultSettings, {
    type: STORAGE_TYPES.PERSISTENT,
    syncAcrossTabs: true
  });
}

/**
 * Hook for high scores
 */
export function useHighScores() {
  return useStorage('highScores', [], {
    type: STORAGE_TYPES.PERSISTENT,
    compress: true,
    syncAcrossTabs: true
  });
}

/**
 * Hook for player statistics
 */
export function usePlayerStats() {
  const defaultStats = {
    gamesPlayed: 0,
    gamesWon: 0,
    totalScore: 0,
    bestTime: null,
    favoritCharacter: null,
    achievements: []
  };

  return useStorage('playerStats', defaultStats, {
    type: STORAGE_TYPES.PERSISTENT,
    compress: true,
    syncAcrossTabs: true
  });
}

/**
 * Hook for temporary cache data
 */
export function useCache(key, defaultValue, ttl = 60000) { // 1 minute default TTL
  const [value, setValue] = useState(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCachedValue = async () => {
      try {
        const cachedValue = await storage.getCache(key);
        setValue(cachedValue !== null ? cachedValue : defaultValue);
      } catch (err) {
        console.error(`Failed to load cache key "${key}":`, err);
        setValue(defaultValue);
      } finally {
        setLoading(false);
      }
    };

    loadCachedValue();
  }, [key, defaultValue]);

  const updateCache = useCallback(async (newValue) => {
    try {
      await storage.setCache(key, newValue, ttl);
      setValue(newValue);
    } catch (err) {
      console.error(`Failed to update cache key "${key}":`, err);
    }
  }, [key, ttl]);

  return {
    value,
    setValue: updateCache,
    loading,
    isReady: !loading
  };
}

/**
 * Hook for storage statistics and management
 */
export function useStorageManager() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshStats = useCallback(async () => {
    try {
      setLoading(true);
      const storageStats = storage.getStats();
      setStats(storageStats);
    } catch (err) {
      console.error('Failed to get storage stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  const exportData = useCallback(async () => {
    try {
      const data = await storage.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nebula-wars-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      return true;
    } catch (err) {
      console.error('Failed to export data:', err);
      return false;
    }
  }, []);

  const importData = useCallback(async (file) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const result = await storage.importData(data);
      await refreshStats();
      return result;
    } catch (err) {
      console.error('Failed to import data:', err);
      throw err;
    }
  }, [refreshStats]);

  const cleanup = useCallback(async () => {
    try {
      const removedCount = storage.cleanup();
      await refreshStats();
      return removedCount;
    } catch (err) {
      console.error('Failed to cleanup storage:', err);
      return 0;
    }
  }, [refreshStats]);

  const clearAll = useCallback(async () => {
    try {
      await storage.clear('all');
      await refreshStats();
      return true;
    } catch (err) {
      console.error('Failed to clear storage:', err);
      return false;
    }
  }, [refreshStats]);

  return {
    stats,
    loading,
    refreshStats,
    exportData,
    importData,
    cleanup,
    clearAll
  };
}