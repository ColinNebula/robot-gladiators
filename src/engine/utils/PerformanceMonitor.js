/**
 * Performance Monitor - Real-time Performance Tracking and Analysis
 * 
 * Monitors frame rate, memory usage, system performance, and provides
 * detailed profiling for game engine optimization.
 */

export class PerformanceMonitor {
  constructor() {
    this.enabled = true;
    this.detailed = false;
    
    // Frame rate tracking
    this.frameRate = {
      current: 0,
      average: 0,
      min: Infinity,
      max: 0,
      history: [],
      maxHistory: 120 // 2 seconds at 60fps
    };
    
    // Frame timing
    this.frameTiming = {
      lastFrameTime: 0,
      frameStartTime: 0,
      deltaTime: 0,
      frameNumber: 0
    };
    
    // Memory tracking
    this.memory = {
      used: 0,
      total: 0,
      limit: 0,
      history: []
    };
    
    // Performance profiles
    this.profiles = new Map();
    this.activeProfiles = new Map();
    
    // System metrics
    this.metrics = {
      drawCalls: 0,
      triangles: 0,
      textures: 0,
      buffers: 0,
      cpuTime: 0,
      gpuTime: 0
    };
    
    // Performance warnings
    this.warnings = {
      lowFPS: 30,
      highMemory: 0.8, // 80% of available memory
      longFrame: 33.33, // > 33.33ms (under 30fps)
      maxWarnings: 50
    };
    
    this.warningHistory = [];
    
    // Performance budget
    this.budget = {
      targetFPS: 60,
      targetFrameTime: 16.67, // 60fps target
      maxDrawCalls: 1000,
      maxMemoryMB: 512
    };
    
    console.log('📊 Performance Monitor initialized');
  }

  // Frame tracking
  startFrame() {
    if (!this.enabled) return;
    
    this.frameTiming.frameStartTime = performance.now();
    this.frameTiming.frameNumber++;
    
    // Reset per-frame metrics
    this.metrics.drawCalls = 0;
    this.metrics.triangles = 0;
  }

  endFrame() {
    if (!this.enabled) return;
    
    const frameEndTime = performance.now();
    const frameTime = frameEndTime - this.frameTiming.frameStartTime;
    const currentFPS = 1000 / frameTime;
    
    // Update frame timing
    this.frameTiming.deltaTime = frameTime;
    this.frameTiming.lastFrameTime = frameEndTime;
    
    // Update frame rate
    this.updateFrameRate(currentFPS, frameTime);
    
    // Update memory info
    this.updateMemoryInfo();
    
    // Check for performance issues
    this.checkPerformanceWarnings(currentFPS, frameTime);
    
    // Update metrics history
    this.updateHistory();
  }

  updateFrameRate(fps, frameTime) {
    this.frameRate.current = fps;
    
    // Update min/max
    this.frameRate.min = Math.min(this.frameRate.min, fps);
    this.frameRate.max = Math.max(this.frameRate.max, fps);
    
    // Add to history
    this.frameRate.history.push({
      fps,
      frameTime,
      timestamp: performance.now()
    });
    
    // Trim history
    if (this.frameRate.history.length > this.frameRate.maxHistory) {
      this.frameRate.history.shift();
    }
    
    // Calculate average
    if (this.frameRate.history.length > 0) {
      const sum = this.frameRate.history.reduce((acc, frame) => acc + frame.fps, 0);
      this.frameRate.average = sum / this.frameRate.history.length;
    }
  }

  updateMemoryInfo() {
    if (performance.memory) {
      this.memory.used = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
      this.memory.total = performance.memory.totalJSHeapSize / 1024 / 1024; // MB
      this.memory.limit = performance.memory.jsHeapSizeLimit / 1024 / 1024; // MB
      
      this.memory.history.push({
        used: this.memory.used,
        total: this.memory.total,
        timestamp: performance.now()
      });
      
      // Trim memory history (keep last 60 entries)
      if (this.memory.history.length > 60) {
        this.memory.history.shift();
      }
    }
  }

  checkPerformanceWarnings(fps, frameTime) {
    const warnings = [];
    
    // Low FPS warning
    if (fps < this.warnings.lowFPS) {
      warnings.push({
        type: 'low-fps',
        message: `Low FPS detected: ${fps.toFixed(1)} (target: ${this.budget.targetFPS})`,
        severity: 'high',
        value: fps,
        target: this.budget.targetFPS
      });
    }
    
    // Long frame time warning
    if (frameTime > this.warnings.longFrame) {
      warnings.push({
        type: 'long-frame',
        message: `Long frame time: ${frameTime.toFixed(2)}ms (target: ${this.budget.targetFrameTime}ms)`,
        severity: 'medium',
        value: frameTime,
        target: this.budget.targetFrameTime
      });
    }
    
    // High memory usage warning
    if (this.memory.used > 0 && this.memory.limit > 0) {
      const memoryPercent = this.memory.used / this.memory.limit;
      if (memoryPercent > this.warnings.highMemory) {
        warnings.push({
          type: 'high-memory',
          message: `High memory usage: ${(memoryPercent * 100).toFixed(1)}% (${this.memory.used.toFixed(1)}MB)`,
          severity: 'high',
          value: memoryPercent,
          target: this.warnings.highMemory
        });
      }
    }
    
    // Too many draw calls warning
    if (this.metrics.drawCalls > this.budget.maxDrawCalls) {
      warnings.push({
        type: 'high-drawcalls',
        message: `High draw calls: ${this.metrics.drawCalls} (target: ${this.budget.maxDrawCalls})`,
        severity: 'medium',
        value: this.metrics.drawCalls,
        target: this.budget.maxDrawCalls
      });
    }
    
    // Add warnings to history
    warnings.forEach(warning => {
      warning.timestamp = performance.now();
      warning.frame = this.frameTiming.frameNumber;
      
      this.warningHistory.push(warning);
      
      if (this.detailed) {
        console.warn(`📊 Performance Warning: ${warning.message}`);
      }
    });
    
    // Trim warning history
    if (this.warningHistory.length > this.warnings.maxWarnings) {
      this.warningHistory.splice(0, this.warningHistory.length - this.warnings.maxWarnings);
    }
  }

  updateHistory() {
    // This could update additional historical data if needed
  }

  // Profiling methods
  startProfile(name) {
    if (!this.enabled || !this.detailed) return;
    
    this.activeProfiles.set(name, {
      startTime: performance.now(),
      name
    });
  }

  endProfile(name) {
    if (!this.enabled || !this.detailed) return;
    
    const profile = this.activeProfiles.get(name);
    if (!profile) return;
    
    const endTime = performance.now();
    const duration = endTime - profile.startTime;
    
    // Store profile data
    if (!this.profiles.has(name)) {
      this.profiles.set(name, {
        name,
        totalTime: 0,
        callCount: 0,
        averageTime: 0,
        minTime: Infinity,
        maxTime: 0,
        history: []
      });
    }
    
    const profileData = this.profiles.get(name);
    profileData.totalTime += duration;
    profileData.callCount++;
    profileData.averageTime = profileData.totalTime / profileData.callCount;
    profileData.minTime = Math.min(profileData.minTime, duration);
    profileData.maxTime = Math.max(profileData.maxTime, duration);
    
    profileData.history.push({
      duration,
      timestamp: endTime,
      frame: this.frameTiming.frameNumber
    });
    
    // Trim history (keep last 100 entries)
    if (profileData.history.length > 100) {
      profileData.history.shift();
    }
    
    this.activeProfiles.delete(name);
  }

  // Metrics tracking
  addDrawCall(triangles = 0) {
    this.metrics.drawCalls++;
    this.metrics.triangles += triangles;
  }

  addTexture() {
    this.metrics.textures++;
  }

  addBuffer() {
    this.metrics.buffers++;
  }

  setCPUTime(time) {
    this.metrics.cpuTime = time;
  }

  setGPUTime(time) {
    this.metrics.gpuTime = time;
  }

  // Getters for current performance data
  getCurrentFPS() {
    return this.frameRate.current;
  }

  getAverageFPS() {
    return this.frameRate.average;
  }

  getFrameTime() {
    return this.frameTiming.deltaTime;
  }

  getMemoryUsage() {
    return {
      used: this.memory.used,
      total: this.memory.total,
      limit: this.memory.limit,
      percentage: this.memory.limit > 0 ? (this.memory.used / this.memory.limit) * 100 : 0
    };
  }

  getMetrics() {
    return { ...this.metrics };
  }

  getProfiles() {
    const profiles = {};
    this.profiles.forEach((data, name) => {
      profiles[name] = data.averageTime;
    });
    return profiles;
  }

  getDetailedProfiles() {
    const profiles = {};
    this.profiles.forEach((data, name) => {
      profiles[name] = { ...data };
    });
    return profiles;
  }

  getWarnings(type = null, limit = 10) {
    let warnings = this.warningHistory;
    
    if (type) {
      warnings = warnings.filter(w => w.type === type);
    }
    
    return warnings.slice(-limit);
  }

  // Performance analysis
  getPerformanceReport() {
    return {
      frameRate: {
        current: this.frameRate.current,
        average: this.frameRate.average,
        min: this.frameRate.min,
        max: this.frameRate.max
      },
      memory: this.getMemoryUsage(),
      metrics: this.getMetrics(),
      profiles: this.getDetailedProfiles(),
      warnings: this.getWarnings(),
      budget: {
        fpsScore: Math.min(1, this.frameRate.average / this.budget.targetFPS),
        memoryScore: this.memory.limit > 0 ? 
          Math.max(0, 1 - (this.memory.used / (this.memory.limit * this.warnings.highMemory))) : 1,
        drawCallScore: Math.max(0, 1 - (this.metrics.drawCalls / this.budget.maxDrawCalls))
      }
    };
  }

  getPerformanceScore() {
    const report = this.getPerformanceReport();
    const scores = report.budget;
    return (scores.fpsScore + scores.memoryScore + scores.drawCallScore) / 3;
  }

  // Configuration
  setBudget(budget) {
    this.budget = { ...this.budget, ...budget };
  }

  setWarningThresholds(thresholds) {
    this.warnings = { ...this.warnings, ...thresholds };
  }

  enableDetailed(enabled = true) {
    this.detailed = enabled;
    if (enabled) {
      console.log('📊 Detailed performance monitoring enabled');
    }
  }

  enable(enabled = true) {
    this.enabled = enabled;
    if (!enabled) {
      this.clearData();
    }
  }

  // Data management
  clearProfiles() {
    this.profiles.clear();
    this.activeProfiles.clear();
  }

  clearWarnings() {
    this.warningHistory = [];
  }

  clearHistory() {
    this.frameRate.history = [];
    this.memory.history = [];
    this.frameRate.min = Infinity;
    this.frameRate.max = 0;
  }

  clearData() {
    this.clearProfiles();
    this.clearWarnings();
    this.clearHistory();
  }

  // Export/Import data for analysis
  exportData() {
    return {
      frameRate: this.frameRate,
      memory: this.memory,
      profiles: Array.from(this.profiles.entries()),
      warnings: this.warningHistory,
      timestamp: Date.now(),
      budget: this.budget
    };
  }

  importData(data) {
    if (data.frameRate) this.frameRate = { ...this.frameRate, ...data.frameRate };
    if (data.memory) this.memory = { ...this.memory, ...data.memory };
    if (data.profiles) this.profiles = new Map(data.profiles);
    if (data.warnings) this.warningHistory = data.warnings;
    if (data.budget) this.budget = { ...this.budget, ...data.budget };
  }

  // Statistics
  getStats() {
    return {
      enabled: this.enabled,
      detailed: this.detailed,
      frameNumber: this.frameTiming.frameNumber,
      profileCount: this.profiles.size,
      warningCount: this.warningHistory.length,
      historyLength: this.frameRate.history.length,
      performanceScore: this.getPerformanceScore()
    };
  }

  // Utility methods
  formatTime(ms) {
    if (ms < 1) return `${(ms * 1000).toFixed(1)}μs`;
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  formatMemory(mb) {
    if (mb < 1) return `${(mb * 1024).toFixed(1)}KB`;
    if (mb < 1024) return `${mb.toFixed(1)}MB`;
    return `${(mb / 1024).toFixed(2)}GB`;
  }

  // Debug output
  logPerformanceReport() {
    const report = this.getPerformanceReport();
    
    console.group('📊 Performance Report');
    console.log(`FPS: ${report.frameRate.current.toFixed(1)} (avg: ${report.frameRate.average.toFixed(1)})`);
    console.log(`Memory: ${this.formatMemory(report.memory.used)} / ${this.formatMemory(report.memory.limit)} (${report.memory.percentage.toFixed(1)}%)`);
    console.log(`Draw Calls: ${report.metrics.drawCalls}`);
    console.log(`Performance Score: ${(this.getPerformanceScore() * 100).toFixed(1)}%`);
    
    if (report.warnings.length > 0) {
      console.group('⚠️ Warnings');
      report.warnings.forEach(warning => {
        console.warn(warning.message);
      });
      console.groupEnd();
    }
    
    console.groupEnd();
  }

  destroy() {
    this.clearData();
    console.log('📊 Performance Monitor destroyed');
  }
}

export default PerformanceMonitor;