/**
 * Advanced Performance Optimization System
 * 
 * Comprehensive performance monitoring, optimization, and adaptive quality
 * management for maintaining smooth gameplay across different devices.
 */

export class PerformanceOptimizationSystem {
  constructor(engine) {
    this.engine = engine;
    this.eventBus = engine.eventBus;
    
    // Performance monitoring
    this.metrics = {
      fps: 60,
      frameTime: 16.67, // ms
      drawCalls: 0,
      particleCount: 0,
      entityCount: 0,
      memoryUsage: 0,
      gpuMemory: 0,
      
      // Performance history
      fpsHistory: [],
      frameTimeHistory: [],
      memoryHistory: [],
      
      // Thresholds
      targetFPS: 60,
      minFPS: 30,
      maxFrameTime: 33.33, // ms (30 FPS)
      memoryWarningThreshold: 100 * 1024 * 1024, // 100MB
      memoryCriticalThreshold: 200 * 1024 * 1024 // 200MB
    };
    
    // Quality settings
    this.qualitySettings = {
      current: 'high',
      available: ['low', 'medium', 'high', 'ultra'],
      adaptive: true,
      locked: false
    };
    
    // Quality configurations
    this.qualityConfigs = {
      low: {
        maxParticles: 50,
        particleQuality: 0.5,
        shadowQuality: 0,
        lightingQuality: 0.3,
        postProcessing: false,
        antiAliasing: false,
        textureQuality: 0.5,
        animationQuality: 0.7,
        maxDrawDistance: 500,
        cullDistance: 300,
        maxEntities: 50,
        targetFPS: 30
      },
      medium: {
        maxParticles: 150,
        particleQuality: 0.7,
        shadowQuality: 0.5,
        lightingQuality: 0.6,
        postProcessing: true,
        antiAliasing: false,
        textureQuality: 0.7,
        animationQuality: 0.8,
        maxDrawDistance: 750,
        cullDistance: 500,
        maxEntities: 100,
        targetFPS: 45
      },
      high: {
        maxParticles: 300,
        particleQuality: 0.9,
        shadowQuality: 0.8,
        lightingQuality: 0.9,
        postProcessing: true,
        antiAliasing: true,
        textureQuality: 0.9,
        animationQuality: 1.0,
        maxDrawDistance: 1000,
        cullDistance: 750,
        maxEntities: 200,
        targetFPS: 60
      },
      ultra: {
        maxParticles: 500,
        particleQuality: 1.0,
        shadowQuality: 1.0,
        lightingQuality: 1.0,
        postProcessing: true,
        antiAliasing: true,
        textureQuality: 1.0,
        animationQuality: 1.0,
        maxDrawDistance: 1500,
        cullDistance: 1000,
        maxEntities: 300,
        targetFPS: 60
      }
    };
    
    // Optimization features
    this.optimizations = {
      // Rendering optimizations
      frustumCulling: true,
      occlusionCulling: false,
      lodSystem: true,
      batchRendering: true,
      instancedRendering: false,
      
      // Entity optimizations
      spatialPartitioning: true,
      sleepingEntities: true,
      componentPooling: true,
      
      // Update optimizations
      adaptiveUpdateRate: true,
      priorityUpdates: true,
      deltaTimeSmoothing: true,
      
      // Memory optimizations
      garbageCollection: true,
      memoryPreallocation: true,
      assetStreaming: false,
      textureCompression: true
    };
    
    // Adaptive systems
    this.adaptiveState = {
      qualityAdjustments: 0,
      lastAdjustment: 0,
      adjustmentCooldown: 5000, // 5 seconds
      frameDropThreshold: 5, // consecutive frames below target
      frameDropCount: 0,
      performanceStable: true,
      emergencyMode: false
    };
    
    // Performance profiler
    this.profiler = {
      enabled: false,
      samples: new Map(),
      categories: ['update', 'render', 'physics', 'audio', 'ui'],
      currentFrame: {},
      frameData: []
    };
    
    // Resource management
    this.resources = {
      textures: new Map(),
      sounds: new Map(),
      meshes: new Map(),
      shaders: new Map(),
      loadedAssets: new Set(),
      assetQueue: [],
      memoryBudget: 150 * 1024 * 1024 // 150MB budget
    };
    
    this.initializeOptimizations();
    this.setupEventListeners();
    this.detectDeviceCapabilities();
  }

  setupEventListeners() {
    this.eventBus.on('performance:setQuality', this.setQuality.bind(this));
    this.eventBus.on('performance:toggleAdaptive', this.toggleAdaptiveQuality.bind(this));
    this.eventBus.on('performance:enableOptimization', this.enableOptimization.bind(this));
    this.eventBus.on('performance:disableOptimization', this.disableOptimization.bind(this));
    this.eventBus.on('performance:profile', this.toggleProfiler.bind(this));
    this.eventBus.on('performance:emergencyMode', this.enableEmergencyMode.bind(this));
  }

  initializeOptimizations() {
    // Set initial quality based on device capabilities
    this.autoDetectQuality();
    
    // Initialize object pools
    this.initializeObjectPools();
    
    // Setup memory monitoring
    this.setupMemoryMonitoring();
    
    // Initialize spatial partitioning
    if (this.optimizations.spatialPartitioning) {
      this.initializeSpatialPartitioning();
    }
    
    console.log('🚀 Performance optimization system initialized');
    console.log(`Initial quality: ${this.qualitySettings.current}`);
  }

  detectDeviceCapabilities() {
    const capabilities = {
      // Estimate device performance
      cores: navigator.hardwareConcurrency || 4,
      memory: navigator.deviceMemory || 4,
      pixelRatio: window.devicePixelRatio || 1,
      screenSize: window.innerWidth * window.innerHeight,
      
      // WebGL capabilities
      webglVersion: this.detectWebGLVersion(),
      maxTextureSize: this.getMaxTextureSize(),
      
      // Browser capabilities
      performance: !!window.performance,
      rafSupport: !!window.requestAnimationFrame,
      
      // Estimate performance tier
      performanceTier: 'medium'
    };
    
    // Calculate performance tier
    let score = 0;
    score += Math.min(capabilities.cores, 8) * 10;
    score += Math.min(capabilities.memory, 8) * 8;
    score += capabilities.webglVersion === 2 ? 20 : 10;
    score += capabilities.screenSize < 1920 * 1080 ? 10 : 5;
    
    if (score >= 70) capabilities.performanceTier = 'high';
    else if (score >= 40) capabilities.performanceTier = 'medium';
    else capabilities.performanceTier = 'low';
    
    this.deviceCapabilities = capabilities;
    console.log('Device capabilities detected:', capabilities);
  }

  detectWebGLVersion() {
    const canvas = document.createElement('canvas');
    if (canvas.getContext('webgl2')) return 2;
    if (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) return 1;
    return 0;
  }

  getMaxTextureSize() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : 2048;
    } catch (e) {
      return 2048;
    }
  }

  autoDetectQuality() {
    const tier = this.deviceCapabilities?.performanceTier || 'medium';
    
    switch (tier) {
      case 'low':
        this.setQuality({ quality: 'low', adaptive: true });
        break;
      case 'medium':
        this.setQuality({ quality: 'medium', adaptive: true });
        break;
      case 'high':
        this.setQuality({ quality: 'high', adaptive: true });
        break;
      default:
        this.setQuality({ quality: 'medium', adaptive: true });
    }
  }

  initializeObjectPools() {
    const memorySystem = this.engine.getSystem('memory');
    if (!memorySystem) return;
    
    // Pre-allocate common objects based on quality setting
    const config = this.qualityConfigs[this.qualitySettings.current];
    
    // Particle pools
    memorySystem.createPool('particle', config.maxParticles, () => ({
      x: 0, y: 0, vx: 0, vy: 0, life: 0, size: 1, color: '#ffffff', alpha: 1
    }));
    
    // Entity pools
    memorySystem.createPool('projectile', 50, () => ({
      x: 0, y: 0, vx: 0, vy: 0, damage: 0, lifetime: 0
    }));
    
    // Effect pools
    memorySystem.createPool('effect', 30, () => ({
      x: 0, y: 0, type: '', duration: 0, intensity: 1
    }));
  }

  setupMemoryMonitoring() {
    if (!window.performance || !window.performance.memory) return;
    
    setInterval(() => {
      const memory = window.performance.memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize;
      this.metrics.memoryHistory.push({
        timestamp: Date.now(),
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      });
      
      // Keep only last 100 entries
      if (this.metrics.memoryHistory.length > 100) {
        this.metrics.memoryHistory.shift();
      }
      
      // Check for memory warnings
      this.checkMemoryThresholds();
      
    }, 1000);
  }

  initializeSpatialPartitioning() {
    this.spatialGrid = {
      cellSize: 100,
      cells: new Map(),
      entities: new Map()
    };
  }

  update(deltaTime) {
    this.updateMetrics(deltaTime);
    this.updateAdaptiveQuality();
    
    if (this.optimizations.adaptiveUpdateRate) {
      this.updateAdaptiveUpdateRate();
    }
    
    if (this.optimizations.spatialPartitioning) {
      this.updateSpatialPartitioning();
    }
    
    if (this.profiler.enabled) {
      this.updateProfiler();
    }
  }

  updateMetrics(deltaTime) {
    // Update frame metrics
    this.metrics.frameTime = deltaTime;
    this.metrics.fps = 1000 / deltaTime;
    
    // Update history
    this.metrics.fpsHistory.push(this.metrics.fps);
    this.metrics.frameTimeHistory.push(deltaTime);
    
    // Keep history size manageable
    if (this.metrics.fpsHistory.length > 60) {
      this.metrics.fpsHistory.shift();
      this.metrics.frameTimeHistory.shift();
    }
    
    // Update entity count
    this.metrics.entityCount = this.engine.entityManager.getEntityCount();
    
    // Update particle count
    const particleSystem = this.engine.getSystem('particles');
    this.metrics.particleCount = particleSystem ? particleSystem.getParticleCount() : 0;
  }

  updateAdaptiveQuality() {
    if (!this.qualitySettings.adaptive || this.qualitySettings.locked) return;
    
    const now = Date.now();
    if (now - this.adaptiveState.lastAdjustment < this.adaptiveState.adjustmentCooldown) return;
    
    const avgFPS = this.getAverageFPS(30); // Last 30 frames
    const targetFPS = this.qualityConfigs[this.qualitySettings.current].targetFPS;
    
    // Check if performance is consistently below target
    if (avgFPS < targetFPS - 5) {
      this.adaptiveState.frameDropCount++;
      
      if (this.adaptiveState.frameDropCount >= this.adaptiveState.frameDropThreshold) {
        this.downgradeQuality();
        this.adaptiveState.frameDropCount = 0;
        this.adaptiveState.lastAdjustment = now;
      }
    } else if (avgFPS > targetFPS + 10) {
      // Performance is good, consider upgrading
      this.adaptiveState.frameDropCount = 0;
      
      if (this.canUpgradeQuality()) {
        this.upgradeQuality();
        this.adaptiveState.lastAdjustment = now;
      }
    } else {
      this.adaptiveState.frameDropCount = 0;
    }
  }

  updateAdaptiveUpdateRate() {
    const avgFPS = this.getAverageFPS(10);
    const targetFPS = this.metrics.targetFPS;
    
    if (avgFPS < targetFPS * 0.8) {
      // Reduce update frequency for non-critical systems
      this.engine.setTimeScale(0.9);
    } else if (avgFPS > targetFPS * 1.1) {
      // Restore normal update frequency
      this.engine.setTimeScale(1.0);
    }
  }

  updateSpatialPartitioning() {
    // Update spatial grid for efficient collision detection and culling
    this.spatialGrid.cells.clear();
    
    const entities = this.engine.entityManager.getAllEntities();
    
    for (const entity of entities) {
      if (!entity.transform) continue;
      
      const cellX = Math.floor(entity.transform.x / this.spatialGrid.cellSize);
      const cellY = Math.floor(entity.transform.y / this.spatialGrid.cellSize);
      const key = `${cellX},${cellY}`;
      
      if (!this.spatialGrid.cells.has(key)) {
        this.spatialGrid.cells.set(key, []);
      }
      
      this.spatialGrid.cells.get(key).push(entity);
    }
  }

  updateProfiler() {
    // Collect performance data for current frame
    this.profiler.currentFrame.timestamp = Date.now();
    this.profiler.frameData.push({ ...this.profiler.currentFrame });
    
    // Keep only recent frame data
    if (this.profiler.frameData.length > 300) { // 5 seconds at 60fps
      this.profiler.frameData.shift();
    }
    
    this.profiler.currentFrame = {};
  }

  // Quality management
  setQuality(data) {
    const { quality, adaptive = null } = data;
    
    if (!this.qualityConfigs[quality]) {
      console.warn(`Unknown quality setting: ${quality}`);
      return;
    }
    
    const oldQuality = this.qualitySettings.current;
    this.qualitySettings.current = quality;
    
    if (adaptive !== null) {
      this.qualitySettings.adaptive = adaptive;
    }
    
    // Apply quality settings to all systems
    this.applyQualitySettings();
    
    console.log(`Quality changed: ${oldQuality} → ${quality}`);
    
    this.eventBus.emit('performance:qualityChanged', {
      oldQuality,
      newQuality: quality,
      config: this.qualityConfigs[quality]
    });
  }

  applyQualitySettings() {
    const config = this.qualityConfigs[this.qualitySettings.current];
    
    // Apply to particle system
    const particleSystem = this.engine.getSystem('particles');
    if (particleSystem) {
      particleSystem.setMaxParticles(config.maxParticles);
      particleSystem.setQuality(config.particleQuality);
    }
    
    // Apply to lighting system
    const lightingSystem = this.engine.getSystem('lighting');
    if (lightingSystem) {
      lightingSystem.setQuality(config.lightingQuality);
      lightingSystem.setShadowQuality(config.shadowQuality);
    }
    
    // Apply to visual effects system
    const visualEffects = this.engine.getSystem('visualEffects');
    if (visualEffects) {
      visualEffects.enablePostEffect('blur', config.postProcessing);
      visualEffects.enablePostEffect('bloom', config.postProcessing);
    }
    
    // Apply to render system
    const renderSystem = this.engine.getSystem('render');
    if (renderSystem) {
      renderSystem.setDrawDistance(config.maxDrawDistance);
      renderSystem.setCullDistance(config.cullDistance);
      renderSystem.setAntiAliasing(config.antiAliasing);
    }
    
    // Update target FPS
    this.metrics.targetFPS = config.targetFPS;
  }

  downgradeQuality() {
    const qualities = this.qualitySettings.available;
    const currentIndex = qualities.indexOf(this.qualitySettings.current);
    
    if (currentIndex > 0) {
      const newQuality = qualities[currentIndex - 1];
      this.setQuality({ quality: newQuality });
      this.adaptiveState.qualityAdjustments++;
      
      console.log(`⬇️ Quality downgraded to ${newQuality} due to performance`);
    } else {
      // Already at lowest quality, enable emergency mode
      this.enableEmergencyMode();
    }
  }

  upgradeQuality() {
    const qualities = this.qualitySettings.available;
    const currentIndex = qualities.indexOf(this.qualitySettings.current);
    
    if (currentIndex < qualities.length - 1) {
      const newQuality = qualities[currentIndex + 1];
      this.setQuality({ quality: newQuality });
      
      console.log(`⬆️ Quality upgraded to ${newQuality}`);
    }
  }

  canUpgradeQuality() {
    const qualities = this.qualitySettings.available;
    const currentIndex = qualities.indexOf(this.qualitySettings.current);
    return currentIndex < qualities.length - 1;
  }

  enableEmergencyMode() {
    if (this.adaptiveState.emergencyMode) return;
    
    this.adaptiveState.emergencyMode = true;
    
    // Extreme performance measures
    const particleSystem = this.engine.getSystem('particles');
    if (particleSystem) {
      particleSystem.setMaxParticles(20);
      particleSystem.clearAllParticles();
    }
    
    // Disable non-essential systems temporarily
    const visualEffects = this.engine.getSystem('visualEffects');
    if (visualEffects) {
      visualEffects.disablePostEffect('bloom');
      visualEffects.disablePostEffect('blur');
      visualEffects.disablePostEffect('scanlines');
    }
    
    // Reduce update frequency
    this.engine.setTimeScale(0.8);
    
    console.warn('🚨 Emergency performance mode activated');
    
    // Try to recover after 10 seconds
    setTimeout(() => {
      this.disableEmergencyMode();
    }, 10000);
  }

  disableEmergencyMode() {
    if (!this.adaptiveState.emergencyMode) return;
    
    this.adaptiveState.emergencyMode = false;
    this.engine.setTimeScale(1.0);
    this.applyQualitySettings();
    
    console.log('✅ Emergency performance mode disabled');
  }

  // Memory management
  checkMemoryThresholds() {
    const usage = this.metrics.memoryUsage;
    
    if (usage > this.metrics.memoryCriticalThreshold) {
      this.triggerGarbageCollection();
      this.clearUnusedAssets();
      
      if (this.qualitySettings.adaptive) {
        this.downgradeQuality();
      }
    } else if (usage > this.metrics.memoryWarningThreshold) {
      this.clearParticles();
    }
  }

  triggerGarbageCollection() {
    if (!this.optimizations.garbageCollection) return;
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
    
    // Clear object pools
    const memorySystem = this.engine.getSystem('memory');
    if (memorySystem) {
      memorySystem.optimizeGarbageCollection();
    }
    
    console.log('🗑️ Garbage collection triggered');
  }

  clearUnusedAssets() {
    // Clear unused textures, sounds, etc.
    for (const [name, asset] of this.resources.textures) {
      if (!this.resources.loadedAssets.has(name)) {
        this.resources.textures.delete(name);
      }
    }
    
    console.log('🧹 Unused assets cleared');
  }

  clearParticles() {
    const particleSystem = this.engine.getSystem('particles');
    if (particleSystem) {
      particleSystem.clearOldParticles();
    }
  }

  // Profiling
  startProfile(category) {
    if (!this.profiler.enabled) return;
    
    this.profiler.currentFrame[category + '_start'] = performance.now();
  }

  endProfile(category) {
    if (!this.profiler.enabled) return;
    
    const start = this.profiler.currentFrame[category + '_start'];
    if (start) {
      this.profiler.currentFrame[category + '_time'] = performance.now() - start;
    }
  }

  toggleProfiler() {
    this.profiler.enabled = !this.profiler.enabled;
    console.log(`Profiler ${this.profiler.enabled ? 'enabled' : 'disabled'}`);
  }

  // Optimization controls
  enableOptimization(data) {
    const { optimization } = data;
    if (this.optimizations.hasOwnProperty(optimization)) {
      this.optimizations[optimization] = true;
      console.log(`Optimization enabled: ${optimization}`);
    }
  }

  disableOptimization(data) {
    const { optimization } = data;
    if (this.optimizations.hasOwnProperty(optimization)) {
      this.optimizations[optimization] = false;
      console.log(`Optimization disabled: ${optimization}`);
    }
  }

  // Utility methods
  getAverageFPS(frames = 60) {
    const history = this.metrics.fpsHistory.slice(-frames);
    if (history.length === 0) return this.metrics.fps;
    
    return history.reduce((sum, fps) => sum + fps, 0) / history.length;
  }

  getAverageFrameTime(frames = 60) {
    const history = this.metrics.frameTimeHistory.slice(-frames);
    if (history.length === 0) return this.metrics.frameTime;
    
    return history.reduce((sum, time) => sum + time, 0) / history.length;
  }

  getPerformanceGrade() {
    const avgFPS = this.getAverageFPS(120);
    const targetFPS = this.metrics.targetFPS;
    
    if (avgFPS >= targetFPS * 0.95) return 'A';
    if (avgFPS >= targetFPS * 0.85) return 'B';
    if (avgFPS >= targetFPS * 0.70) return 'C';
    if (avgFPS >= targetFPS * 0.50) return 'D';
    return 'F';
  }

  getOptimizationStats() {
    return {
      quality: this.qualitySettings.current,
      adaptive: this.qualitySettings.adaptive,
      avgFPS: this.getAverageFPS(),
      targetFPS: this.metrics.targetFPS,
      frameTime: this.getAverageFrameTime(),
      memoryUsage: this.metrics.memoryUsage,
      entityCount: this.metrics.entityCount,
      particleCount: this.metrics.particleCount,
      qualityAdjustments: this.adaptiveState.qualityAdjustments,
      emergencyMode: this.adaptiveState.emergencyMode,
      grade: this.getPerformanceGrade()
    };
  }

  // Spatial optimization methods
  getEntitiesInRadius(x, y, radius) {
    if (!this.optimizations.spatialPartitioning) {
      return this.engine.entityManager.getAllEntities();
    }
    
    const entities = [];
    const cellSize = this.spatialGrid.cellSize;
    const cellRadius = Math.ceil(radius / cellSize);
    const centerX = Math.floor(x / cellSize);
    const centerY = Math.floor(y / cellSize);
    
    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dy = -cellRadius; dy <= cellRadius; dy++) {
        const key = `${centerX + dx},${centerY + dy}`;
        const cellEntities = this.spatialGrid.cells.get(key);
        
        if (cellEntities) {
          entities.push(...cellEntities);
        }
      }
    }
    
    return entities;
  }

  toggleAdaptiveQuality() {
    this.qualitySettings.adaptive = !this.qualitySettings.adaptive;
    console.log(`Adaptive quality ${this.qualitySettings.adaptive ? 'enabled' : 'disabled'}`);
  }
}

export default PerformanceOptimizationSystem;