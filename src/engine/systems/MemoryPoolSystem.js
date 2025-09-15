/**
 * Memory Pool System - Advanced Memory Management
 * 
 * Provides object pooling, memory optimization, and garbage collection
 * management for high-performance gaming applications.
 */

export class MemoryPoolSystem {
  constructor(engine) {
    this.engine = engine;
    
    // Object Pools
    this.pools = new Map(); // Pool Name -> Pool Object
    this.activeObjects = new Map(); // Pool Name -> Set of Active Objects
    this.recycleBin = new Map(); // Pool Name -> Array of Objects to Recycle
    
    // Memory Statistics
    this.stats = {
      totalPooledObjects: 0,
      totalActiveObjects: 0,
      totalRecycledObjects: 0,
      memoryUsage: 0,
      allocationsPerSecond: 0,
      recyclingRate: 0
    };
    
    // Performance Settings
    this.maxPoolSize = 1000;
    this.preallocationEnabled = true;
    this.autoRecycling = true;
    this.recycleThreshold = 100; // Recycle when this many objects are in bin
    
    // Garbage Collection
    this.gcOptimization = true;
    this.gcInterval = 5000; // 5 seconds
    this.gcTimer = 0;
    
    // Common object pools
    this.createDefaultPools();
    
    console.log('🧠 Memory Pool System initialized');
  }

  initialize() {
    this.setupMemoryTracking();
    this.preAllocateCommonObjects();
  }

  start() {
    this.gcTimer = 0;
    this.startMemoryMonitoring();
  }

  stop() {
    this.stopMemoryMonitoring();
  }

  update(deltaTime) {
    // Update memory statistics
    this.updateStats(deltaTime);
    
    // Handle auto-recycling
    if (this.autoRecycling) {
      this.processRecycleBins();
    }
    
    // Garbage collection optimization
    if (this.gcOptimization) {
      this.gcTimer += deltaTime * 1000;
      if (this.gcTimer >= this.gcInterval) {
        this.optimizeGarbageCollection();
        this.gcTimer = 0;
      }
    }
  }

  // Pool Management
  createPool(name, factory, config = {}) {
    const pool = new ObjectPool(name, factory, {
      initialSize: config.initialSize || 10,
      maxSize: config.maxSize || this.maxPoolSize,
      autoGrow: config.autoGrow !== false,
      resetFunction: config.resetFunction || null,
      validateFunction: config.validateFunction || null
    });
    
    this.pools.set(name, pool);
    this.activeObjects.set(name, new Set());
    this.recycleBin.set(name, []);
    
    this.engine.emit('memory:poolCreated', { name, pool });
    return pool;
  }

  getPool(name) {
    return this.pools.get(name);
  }

  removePool(name) {
    const pool = this.pools.get(name);
    if (pool) {
      pool.destroy();
      this.pools.delete(name);
      this.activeObjects.delete(name);
      this.recycleBin.delete(name);
      
      this.engine.emit('memory:poolRemoved', { name });
    }
  }

  // Object Acquisition and Release
  acquire(poolName, ...args) {
    const pool = this.pools.get(poolName);
    if (!pool) {
      console.warn(`Pool '${poolName}' not found`);
      return null;
    }
    
    const obj = pool.acquire(...args);
    if (obj) {
      this.activeObjects.get(poolName).add(obj);
      this.stats.totalActiveObjects++;
      
      // Track object for auto-recycling
      if (obj && typeof obj === 'object') {
        obj._poolName = poolName;
        obj._acquiredTime = performance.now();
      }
    }
    
    return obj;
  }

  release(poolName, obj) {
    const pool = this.pools.get(poolName);
    if (!pool || !obj) return false;
    
    // Remove from active tracking
    const activeSet = this.activeObjects.get(poolName);
    if (activeSet && activeSet.has(obj)) {
      activeSet.delete(obj);
      this.stats.totalActiveObjects--;
    }
    
    // Add to recycle bin or return immediately
    if (this.autoRecycling) {
      this.recycleBin.get(poolName).push(obj);
    } else {
      pool.release(obj);
    }
    
    return true;
  }

  releaseAll(poolName) {
    const activeSet = this.activeObjects.get(poolName);
    if (!activeSet) return 0;
    
    let released = 0;
    for (const obj of activeSet) {
      if (this.release(poolName, obj)) {
        released++;
      }
    }
    
    return released;
  }

  // Auto Object Management
  autoRelease(obj, delay = 0) {
    if (!obj || !obj._poolName) return;
    
    if (delay > 0) {
      setTimeout(() => this.release(obj._poolName, obj), delay);
    } else {
      this.release(obj._poolName, obj);
    }
  }

  processRecycleBins() {
    for (const [poolName, recycleBin] of this.recycleBin) {
      if (recycleBin.length >= this.recycleThreshold) {
        this.recycleObjects(poolName);
      }
    }
  }

  recycleObjects(poolName) {
    const pool = this.pools.get(poolName);
    const recycleBin = this.recycleBin.get(poolName);
    
    if (!pool || !recycleBin) return 0;
    
    let recycled = 0;
    while (recycleBin.length > 0) {
      const obj = recycleBin.pop();
      if (pool.release(obj)) {
        recycled++;
        this.stats.totalRecycledObjects++;
      }
    }
    
    return recycled;
  }

  // Default Pool Creation
  createDefaultPools() {
    // Vector2D Pool
    this.createPool('vector2d', () => ({ x: 0, y: 0 }), {
      initialSize: 50,
      resetFunction: (obj) => { obj.x = 0; obj.y = 0; }
    });
    
    // Particle Pool
    this.createPool('particle', () => ({
      x: 0, y: 0, vx: 0, vy: 0,
      life: 1, maxLife: 1,
      size: 1, color: '#ffffff',
      alpha: 1, rotation: 0
    }), {
      initialSize: 100,
      resetFunction: (particle) => {
        particle.x = 0; particle.y = 0;
        particle.vx = 0; particle.vy = 0;
        particle.life = 1; particle.maxLife = 1;
        particle.size = 1; particle.color = '#ffffff';
        particle.alpha = 1; particle.rotation = 0;
      }
    });
    
    // Rectangle Pool
    this.createPool('rectangle', () => ({
      x: 0, y: 0, width: 0, height: 0
    }), {
      initialSize: 30,
      resetFunction: (rect) => {
        rect.x = 0; rect.y = 0;
        rect.width = 0; rect.height = 0;
      }
    });
    
    // Collision Info Pool
    this.createPool('collision', () => ({
      entityA: null, entityB: null,
      point: { x: 0, y: 0 },
      normal: { x: 0, y: 0 },
      penetration: 0,
      timestamp: 0
    }), {
      initialSize: 20,
      resetFunction: (collision) => {
        collision.entityA = null; collision.entityB = null;
        collision.point.x = 0; collision.point.y = 0;
        collision.normal.x = 0; collision.normal.y = 0;
        collision.penetration = 0; collision.timestamp = 0;
      }
    });
    
    // Audio Instance Pool
    this.createPool('audioInstance', () => ({
      audio: null, volume: 1, loop: false,
      playing: false, startTime: 0
    }), {
      initialSize: 15,
      resetFunction: (instance) => {
        if (instance.audio) {
          instance.audio.pause();
          instance.audio.currentTime = 0;
        }
        instance.audio = null; instance.volume = 1;
        instance.loop = false; instance.playing = false;
        instance.startTime = 0;
      }
    });
  }

  preAllocateCommonObjects() {
    if (!this.preallocationEnabled) return;
    
    // Pre-allocate common objects for better performance
    const preAllocations = {
      vector2d: 50,
      particle: 100,
      rectangle: 30,
      collision: 20,
      audioInstance: 15
    };
    
    for (const [poolName, count] of Object.entries(preAllocations)) {
      const pool = this.pools.get(poolName);
      if (pool) {
        pool.preAllocate(count);
      }
    }
  }

  // Memory Optimization
  optimizeGarbageCollection() {
    // Force garbage collection of unused pooled objects
    for (const pool of this.pools.values()) {
      pool.trimToSize();
    }
    
    // Clear recycle bins
    for (const recycleBin of this.recycleBin.values()) {
      recycleBin.length = 0;
    }
    
    // Suggest garbage collection (browser dependent)
    if (window.gc && typeof window.gc === 'function') {
      window.gc();
    }
    
    this.engine.emit('memory:gcOptimized');
  }

  // Statistics and Monitoring
  updateStats(deltaTime) {
    this.stats.totalPooledObjects = 0;
    this.stats.totalActiveObjects = 0;
    
    for (const pool of this.pools.values()) {
      this.stats.totalPooledObjects += pool.getTotalCount();
    }
    
    for (const activeSet of this.activeObjects.values()) {
      this.stats.totalActiveObjects += activeSet.size;
    }
    
    // Update memory usage estimate
    this.updateMemoryUsage();
  }

  updateMemoryUsage() {
    // Rough estimate of memory usage
    const estimatedObjectSize = 64; // bytes per object average
    this.stats.memoryUsage = this.stats.totalPooledObjects * estimatedObjectSize;
  }

  startMemoryMonitoring() {
    if (performance.memory) {
      this.memoryMonitorInterval = setInterval(() => {
        this.stats.memoryUsage = performance.memory.usedJSHeapSize;
      }, 1000);
    }
  }

  stopMemoryMonitoring() {
    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval);
    }
  }

  getMemoryStats() {
    return { ...this.stats };
  }

  // Utility Functions
  getPoolStats(poolName) {
    const pool = this.pools.get(poolName);
    const activeSet = this.activeObjects.get(poolName);
    const recycleBin = this.recycleBin.get(poolName);
    
    if (!pool) return null;
    
    return {
      name: poolName,
      total: pool.getTotalCount(),
      available: pool.getAvailableCount(),
      active: activeSet ? activeSet.size : 0,
      recycling: recycleBin ? recycleBin.length : 0,
      maxSize: pool.maxSize
    };
  }

  getAllPoolStats() {
    const stats = [];
    for (const poolName of this.pools.keys()) {
      stats.push(this.getPoolStats(poolName));
    }
    return stats;
  }

  setupMemoryTracking() {
    // Track memory-related events
    this.engine.on('entity:created', () => this.stats.allocationsPerSecond++);
    this.engine.on('entity:destroyed', () => this.stats.recyclingRate++);
    
    // Reset counters every second
    setInterval(() => {
      this.stats.allocationsPerSecond = 0;
      this.stats.recyclingRate = 0;
    }, 1000);
  }

  // Configuration
  setMaxPoolSize(size) {
    this.maxPoolSize = size;
    for (const pool of this.pools.values()) {
      pool.setMaxSize(size);
    }
  }

  setAutoRecycling(enabled) {
    this.autoRecycling = enabled;
    if (enabled) {
      this.processRecycleBins();
    }
  }

  setGCOptimization(enabled) {
    this.gcOptimization = enabled;
  }

  // Cleanup
  destroy() {
    this.stopMemoryMonitoring();
    
    for (const pool of this.pools.values()) {
      pool.destroy();
    }
    
    this.pools.clear();
    this.activeObjects.clear();
    this.recycleBin.clear();
  }
}

// Object Pool Implementation
class ObjectPool {
  constructor(name, factory, config = {}) {
    this.name = name;
    this.factory = factory;
    this.resetFunction = config.resetFunction;
    this.validateFunction = config.validateFunction;
    
    this.objects = [];
    this.availableObjects = [];
    this.maxSize = config.maxSize || 1000;
    this.autoGrow = config.autoGrow !== false;
    
    // Pre-allocate initial objects
    const initialSize = config.initialSize || 0;
    this.preAllocate(initialSize);
  }

  preAllocate(count) {
    for (let i = 0; i < count; i++) {
      const obj = this.createObject();
      this.objects.push(obj);
      this.availableObjects.push(obj);
    }
  }

  createObject() {
    const obj = this.factory();
    
    // Add pool metadata
    if (obj && typeof obj === 'object') {
      obj._pooled = true;
      obj._poolName = this.name;
    }
    
    return obj;
  }

  acquire(...args) {
    let obj;
    
    if (this.availableObjects.length > 0) {
      obj = this.availableObjects.pop();
    } else if (this.autoGrow && this.objects.length < this.maxSize) {
      obj = this.createObject();
      this.objects.push(obj);
    } else {
      // Pool exhausted
      return null;
    }
    
    // Reset object state
    if (this.resetFunction && obj) {
      this.resetFunction(obj, ...args);
    }
    
    return obj;
  }

  release(obj) {
    if (!obj || !obj._pooled || obj._poolName !== this.name) {
      return false;
    }
    
    // Validate object before returning to pool
    if (this.validateFunction && !this.validateFunction(obj)) {
      return false;
    }
    
    // Return to available objects if not already there
    if (!this.availableObjects.includes(obj)) {
      this.availableObjects.push(obj);
      return true;
    }
    
    return false;
  }

  getTotalCount() {
    return this.objects.length;
  }

  getAvailableCount() {
    return this.availableObjects.length;
  }

  getActiveCount() {
    return this.objects.length - this.availableObjects.length;
  }

  trimToSize(targetSize = null) {
    const target = targetSize || Math.floor(this.maxSize * 0.8);
    
    while (this.availableObjects.length > target) {
      this.availableObjects.pop();
    }
    
    // Remove from main objects array too
    this.objects = this.objects.filter(obj => 
      this.availableObjects.includes(obj) || 
      !this.availableObjects.includes(obj)
    );
  }

  setMaxSize(size) {
    this.maxSize = size;
    if (this.objects.length > size) {
      this.trimToSize(size);
    }
  }

  clear() {
    this.availableObjects = [...this.objects];
  }

  destroy() {
    this.objects = [];
    this.availableObjects = [];
  }
}

export default MemoryPoolSystem;