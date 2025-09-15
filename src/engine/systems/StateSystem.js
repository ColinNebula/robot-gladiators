/**
 * State Management System - Advanced Game State and Save System
 * 
 * Provides comprehensive state management, save/load functionality,
 * game settings persistence, and state synchronization.
 */

export class StateSystem {
  constructor(engine) {
    this.engine = engine;
    
    // State Management
    this.gameState = new Map();
    this.persistentState = new Map();
    this.sessionState = new Map();
    this.undoStack = [];
    this.redoStack = [];
    this.maxUndoSteps = 50;
    
    // Save System
    this.saveSlots = new Map();
    this.autoSaveInterval = 30000; // 30 seconds
    this.autoSaveTimer = 0;
    this.saveVersion = '1.0.0';
    
    // Settings Management
    this.settings = new Map();
    this.defaultSettings = this.createDefaultSettings();
    
    // State Watchers
    this.watchers = new Map();
    this.stateHistory = new Map();
    
    // Compression for large saves
    this.compressionEnabled = true;
    
    console.log('💾 State Management System initialized');
  }

  initialize() {
    this.loadSettings();
    this.loadPersistentState();
    this.setupDefaultState();
  }

  start() {
    this.autoSaveTimer = 0;
  }

  stop() {
    this.saveSettings();
    this.savePersistentState();
  }

  update(deltaTime) {
    // Auto-save functionality
    this.autoSaveTimer += deltaTime * 1000;
    if (this.autoSaveTimer >= this.autoSaveInterval) {
      this.performAutoSave();
      this.autoSaveTimer = 0;
    }
    
    // Update state watchers
    this.updateWatchers();
  }

  // Core State Management
  setState(key, value, persistent = false) {
    const oldValue = this.getState(key);
    
    // Store in appropriate state container
    if (persistent) {
      this.persistentState.set(key, value);
    } else {
      this.gameState.set(key, value);
    }
    
    // Add to undo stack
    this.addToUndoStack({
      type: 'setState',
      key,
      oldValue,
      newValue: value,
      persistent,
      timestamp: Date.now()
    });
    
    // Trigger watchers
    this.triggerWatchers(key, value, oldValue);
    
    // Emit state change event
    this.engine.emit('state:changed', { key, value, oldValue, persistent });
  }

  getState(key, defaultValue = null) {
    if (this.gameState.has(key)) {
      return this.gameState.get(key);
    }
    if (this.persistentState.has(key)) {
      return this.persistentState.get(key);
    }
    return defaultValue;
  }

  deleteState(key) {
    const oldValue = this.getState(key);
    const wasPersistent = this.persistentState.has(key);
    
    this.gameState.delete(key);
    this.persistentState.delete(key);
    
    // Add to undo stack
    this.addToUndoStack({
      type: 'deleteState',
      key,
      oldValue,
      persistent: wasPersistent,
      timestamp: Date.now()
    });
    
    this.engine.emit('state:deleted', { key, oldValue });
  }

  // Batch Operations
  setMultipleStates(stateMap, persistent = false) {
    const changes = [];
    
    for (const [key, value] of stateMap) {
      const oldValue = this.getState(key);
      changes.push({ key, oldValue, newValue: value });
      
      if (persistent) {
        this.persistentState.set(key, value);
      } else {
        this.gameState.set(key, value);
      }
    }
    
    // Add batch operation to undo stack
    this.addToUndoStack({
      type: 'batchSet',
      changes,
      persistent,
      timestamp: Date.now()
    });
    
    // Trigger all watchers
    changes.forEach(change => {
      this.triggerWatchers(change.key, change.newValue, change.oldValue);
    });
    
    this.engine.emit('state:batchChanged', { changes, persistent });
  }

  // Undo/Redo System
  undo() {
    if (this.undoStack.length === 0) return false;
    
    const operation = this.undoStack.pop();
    this.redoStack.push(operation);
    
    this.revertOperation(operation);
    this.engine.emit('state:undone', operation);
    return true;
  }

  redo() {
    if (this.redoStack.length === 0) return false;
    
    const operation = this.redoStack.pop();
    this.undoStack.push(operation);
    
    this.applyOperation(operation);
    this.engine.emit('state:redone', operation);
    return true;
  }

  addToUndoStack(operation) {
    this.undoStack.push(operation);
    
    // Limit undo stack size
    if (this.undoStack.length > this.maxUndoSteps) {
      this.undoStack.shift();
    }
    
    // Clear redo stack on new operation
    this.redoStack = [];
  }

  revertOperation(operation) {
    switch (operation.type) {
      case 'setState':
        if (operation.oldValue !== undefined) {
          if (operation.persistent) {
            this.persistentState.set(operation.key, operation.oldValue);
          } else {
            this.gameState.set(operation.key, operation.oldValue);
          }
        } else {
          this.gameState.delete(operation.key);
          this.persistentState.delete(operation.key);
        }
        break;
        
      case 'deleteState':
        if (operation.persistent) {
          this.persistentState.set(operation.key, operation.oldValue);
        } else {
          this.gameState.set(operation.key, operation.oldValue);
        }
        break;
        
      case 'batchSet':
        operation.changes.forEach(change => {
          if (change.oldValue !== undefined) {
            if (operation.persistent) {
              this.persistentState.set(change.key, change.oldValue);
            } else {
              this.gameState.set(change.key, change.oldValue);
            }
          }
        });
        break;
    }
  }

  applyOperation(operation) {
    switch (operation.type) {
      case 'setState':
        if (operation.persistent) {
          this.persistentState.set(operation.key, operation.newValue);
        } else {
          this.gameState.set(operation.key, operation.newValue);
        }
        break;
        
      case 'deleteState':
        this.gameState.delete(operation.key);
        this.persistentState.delete(operation.key);
        break;
        
      case 'batchSet':
        operation.changes.forEach(change => {
          if (operation.persistent) {
            this.persistentState.set(change.key, change.newValue);
          } else {
            this.gameState.set(change.key, change.newValue);
          }
        });
        break;
    }
  }

  // Save/Load System
  createSaveData(slotName = 'default') {
    const entityManager = this.engine.entityManager;
    
    return {
      version: this.saveVersion,
      timestamp: Date.now(),
      slotName,
      
      // Game State
      gameState: Object.fromEntries(this.gameState),
      persistentState: Object.fromEntries(this.persistentState),
      
      // Entity Data
      entities: entityManager.serializeEntities(),
      
      // Engine State
      engineState: {
        currentScene: this.engine.sceneManager.getCurrentSceneName(),
        timeScale: this.engine.timeScale,
        frameCount: this.engine.frameCount
      },
      
      // Player Progress
      playerData: this.getPlayerData(),
      
      // Statistics
      statistics: this.getGameStatistics()
    };
  }

  saveGame(slotName = 'default') {
    try {
      const saveData = this.createSaveData(slotName);
      const serializedData = JSON.stringify(saveData);
      
      // Compress if enabled
      const finalData = this.compressionEnabled ? 
        this.compressData(serializedData) : serializedData;
      
      // Save to localStorage
      localStorage.setItem(`nebula_save_${slotName}`, finalData);
      this.saveSlots.set(slotName, {
        timestamp: saveData.timestamp,
        compressed: this.compressionEnabled,
        size: finalData.length
      });
      
      this.engine.emit('state:gameSaved', { slotName, saveData });
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      this.engine.emit('state:saveError', { slotName, error });
      return false;
    }
  }

  loadGame(slotName = 'default') {
    try {
      const rawData = localStorage.getItem(`nebula_save_${slotName}`);
      if (!rawData) {
        throw new Error(`Save slot '${slotName}' not found`);
      }
      
      // Decompress if needed
      const slotInfo = this.saveSlots.get(slotName);
      const jsonData = slotInfo?.compressed ? 
        this.decompressData(rawData) : rawData;
      
      const saveData = JSON.parse(jsonData);
      
      // Validate save version
      if (saveData.version !== this.saveVersion) {
        console.warn(`Save version mismatch: ${saveData.version} vs ${this.saveVersion}`);
      }
      
      // Restore game state
      this.gameState = new Map(Object.entries(saveData.gameState || {}));
      this.persistentState = new Map(Object.entries(saveData.persistentState || {}));
      
      // Restore entities
      if (saveData.entities) {
        this.engine.entityManager.deserializeEntities(saveData.entities);
      }
      
      // Restore engine state
      if (saveData.engineState) {
        this.engine.setTimeScale(saveData.engineState.timeScale || 1);
        if (saveData.engineState.currentScene) {
          this.engine.sceneManager.changeScene(saveData.engineState.currentScene);
        }
      }
      
      this.engine.emit('state:gameLoaded', { slotName, saveData });
      return true;
    } catch (error) {
      console.error('Failed to load game:', error);
      this.engine.emit('state:loadError', { slotName, error });
      return false;
    }
  }

  deleteSave(slotName) {
    localStorage.removeItem(`nebula_save_${slotName}`);
    this.saveSlots.delete(slotName);
    this.engine.emit('state:saveDeleted', { slotName });
  }

  getSaveSlots() {
    return Array.from(this.saveSlots.entries()).map(([name, info]) => ({
      name,
      ...info
    }));
  }

  // Auto-save
  performAutoSave() {
    if (this.getState('autoSaveEnabled', true)) {
      this.saveGame('autosave');
    }
  }

  // Settings Management
  createDefaultSettings() {
    return new Map([
      ['masterVolume', 1.0],
      ['musicVolume', 0.8],
      ['sfxVolume', 1.0],
      ['graphicsQuality', 'high'],
      ['fullscreen', false],
      ['vsync', true],
      ['autoSaveEnabled', true],
      ['showFPS', false],
      ['difficulty', 'normal'],
      ['language', 'en'],
      ['controlScheme', 'default']
    ]);
  }

  setSetting(key, value) {
    this.settings.set(key, value);
    this.saveSettings();
    this.engine.emit('state:settingChanged', { key, value });
  }

  getSetting(key, defaultValue = null) {
    if (this.settings.has(key)) {
      return this.settings.get(key);
    }
    return this.defaultSettings.get(key) || defaultValue;
  }

  saveSettings() {
    try {
      const settingsObj = Object.fromEntries(this.settings);
      localStorage.setItem('nebula_settings', JSON.stringify(settingsObj));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  loadSettings() {
    try {
      const settingsData = localStorage.getItem('nebula_settings');
      if (settingsData) {
        const settingsObj = JSON.parse(settingsData);
        this.settings = new Map(Object.entries(settingsObj));
      } else {
        this.settings = new Map(this.defaultSettings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.settings = new Map(this.defaultSettings);
    }
  }

  // State Watchers
  watch(key, callback) {
    if (!this.watchers.has(key)) {
      this.watchers.set(key, new Set());
    }
    this.watchers.get(key).add(callback);
    
    return () => {
      const callbacks = this.watchers.get(key);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  triggerWatchers(key, newValue, oldValue) {
    const callbacks = this.watchers.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(newValue, oldValue, key);
        } catch (error) {
          console.error('State watcher error:', error);
        }
      });
    }
  }

  updateWatchers() {
    // Update state history for change detection
    // This could be expanded for more sophisticated watching
  }

  // Utility Functions
  getPlayerData() {
    return {
      level: this.getState('playerLevel', 1),
      experience: this.getState('playerExperience', 0),
      achievements: this.getState('achievements', []),
      unlockedContent: this.getState('unlockedContent', []),
      preferences: this.getState('playerPreferences', {})
    };
  }

  getGameStatistics() {
    return {
      gamesPlayed: this.getState('gamesPlayed', 0),
      totalPlayTime: this.getState('totalPlayTime', 0),
      highScore: this.getState('highScore', 0),
      favoriteMode: this.getState('favoriteMode', 'classic')
    };
  }

  setupDefaultState() {
    // Initialize default game state if not present
    if (!this.getState('gameInitialized')) {
      this.setMultipleStates(new Map([
        ['gameInitialized', true],
        ['firstLaunch', true],
        ['tutorialCompleted', false],
        ['playerLevel', 1],
        ['playerExperience', 0],
        ['gamesPlayed', 0],
        ['totalPlayTime', 0]
      ]), true);
    }
  }

  savePersistentState() {
    try {
      const persistentObj = Object.fromEntries(this.persistentState);
      localStorage.setItem('nebula_persistent', JSON.stringify(persistentObj));
    } catch (error) {
      console.error('Failed to save persistent state:', error);
    }
  }

  loadPersistentState() {
    try {
      const persistentData = localStorage.getItem('nebula_persistent');
      if (persistentData) {
        const persistentObj = JSON.parse(persistentData);
        this.persistentState = new Map(Object.entries(persistentObj));
      }
    } catch (error) {
      console.error('Failed to load persistent state:', error);
    }
  }

  // Compression utilities (simplified)
  compressData(data) {
    // In a real implementation, you might use a proper compression library
    return btoa(data);
  }

  decompressData(data) {
    return atob(data);
  }

  // State Export/Import
  exportState() {
    return {
      gameState: Object.fromEntries(this.gameState),
      persistentState: Object.fromEntries(this.persistentState),
      settings: Object.fromEntries(this.settings),
      timestamp: Date.now()
    };
  }

  importState(stateData) {
    if (stateData.gameState) {
      this.gameState = new Map(Object.entries(stateData.gameState));
    }
    if (stateData.persistentState) {
      this.persistentState = new Map(Object.entries(stateData.persistentState));
    }
    if (stateData.settings) {
      this.settings = new Map(Object.entries(stateData.settings));
    }
    
    this.saveSettings();
    this.savePersistentState();
    this.engine.emit('state:imported', stateData);
  }

  // Cleanup
  destroy() {
    this.saveSettings();
    this.savePersistentState();
    this.gameState.clear();
    this.sessionState.clear();
    this.watchers.clear();
    this.undoStack = [];
    this.redoStack = [];
  }
}

export default StateSystem;