/**
 * Nebula Wars Game Engine Core
 * 
 * A modular, high-performance game engine built for browser-based games.
 * Features entity-component system, modular architecture, and optimized rendering.
 */

import { PhysicsSystem } from './systems/PhysicsSystem.js';
import { RenderSystem } from './systems/RenderSystem.js';
import { InputSystem } from './systems/InputSystem.js';
import { AudioSystem } from './systems/AudioSystem.js';
import { ParticleSystem } from './systems/ParticleSystem.js';
import { CollisionSystem } from './systems/CollisionSystem.js';
import { AISystem } from './systems/AISystem.js';
import { StateSystem } from './systems/StateSystem.js';
import { AnimationSystem } from './systems/AnimationSystem.js';
import { EnhancedSpriteAnimationSystem } from './systems/EnhancedSpriteAnimationSystem.js';
import { LightingSystem } from './systems/LightingSystem.js';
import { MemoryPoolSystem } from './systems/MemoryPoolSystem.js';
import { CombatSystem } from './systems/CombatSystem.js';
import { PowerUpSystem } from './systems/PowerUpSystem.js';
import { VisualEffectsSystem } from './systems/VisualEffectsSystem.js';
import { EnhancedAudioSystem } from './systems/EnhancedAudioSystem.js';
import { AchievementSystem } from './systems/AchievementSystem.js';
import { PerformanceOptimizationSystem } from './systems/PerformanceOptimizationSystem.js';
import { EntityManager } from './core/EntityManager.js';
import { SceneManager } from './core/SceneManager.js';
import { AssetManager } from './core/AssetManager.js';
import { PerformanceMonitor } from './utils/PerformanceMonitor.js';
import { EventBus } from './utils/EventBus.js';

export class GameEngine {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.options = {
      targetFPS: 60,
      enableDebug: false,
      enableProfiling: false,
      pixelRatio: window.devicePixelRatio || 1,
      ...options
    };

    // Core engine state
    this.isRunning = false;
    this.isPaused = false;
    this.lastTime = 0;
    this.deltaTime = 0;
    this.frameCount = 0;
    this.timeScale = 1;

    // Initialize core systems
    this.eventBus = new EventBus();
    this.performanceMonitor = new PerformanceMonitor();
    this.entityManager = new EntityManager();
    this.sceneManager = new SceneManager(this);
    this.assetManager = new AssetManager();

    // Initialize game systems
    this.initializeSystems();

    // Setup canvas
    this.setupCanvas();

    // Bind methods
    this.gameLoop = this.gameLoop.bind(this);
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.pause = this.pause.bind(this);
    this.resume = this.resume.bind(this);

    console.log('🚀 Nebula Wars Game Engine initialized');
  }

  initializeSystems() {
    // Initialize all engine systems
    this.systems = {
      memory: new MemoryPoolSystem(this),
      performance: new PerformanceOptimizationSystem(this),
      state: new StateSystem(this),
      input: new InputSystem(this),
      ai: new AISystem(this),
      physics: new PhysicsSystem(this),
      collision: new CollisionSystem(this),
      animation: new AnimationSystem(this),
      spriteAnimation: new EnhancedSpriteAnimationSystem(this),
      particles: new ParticleSystem(this),
      lighting: new LightingSystem(this),
      audio: new AudioSystem(this),
      enhancedAudio: new EnhancedAudioSystem(this),
      combat: new CombatSystem(this),
      powerups: new PowerUpSystem(this),
      visualEffects: new VisualEffectsSystem(this),
      achievements: new AchievementSystem(this),
      render: new RenderSystem(this)
    };

    // System initialization order matters - memory and performance first, render last
    this.systemOrder = ['memory', 'performance', 'state', 'input', 'ai', 'physics', 'collision', 'animation', 'spriteAnimation', 'particles', 'lighting', 'audio', 'enhancedAudio', 'combat', 'powerups', 'visualEffects', 'achievements', 'render'];

    // Initialize each system
    this.systemOrder.forEach(systemName => {
      const system = this.systems[systemName];
      if (system && system.initialize) {
        system.initialize();
        console.log(`✅ ${systemName} system initialized`);
      }
    });
  }

  setupCanvas() {
    const { pixelRatio } = this.options;
    
    // Set up high-DPI canvas
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * pixelRatio;
    this.canvas.height = rect.height * pixelRatio;
    this.ctx.scale(pixelRatio, pixelRatio);
    
    // Configure canvas context
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';

    console.log(`🖼️ Canvas configured: ${this.canvas.width}x${this.canvas.height} (${pixelRatio}x DPI)`);
  }

  // Engine lifecycle methods
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    
    // Start all systems
    this.systemOrder.forEach(systemName => {
      const system = this.systems[systemName];
      if (system && system.start) {
        system.start();
      }
    });

    // Start the game loop
    this.gameLoop();
    
    this.eventBus.emit('engine:started');
    console.log('🎮 Game engine started');
  }

  stop() {
    this.isRunning = false;
    
    // Stop all systems
    this.systemOrder.forEach(systemName => {
      const system = this.systems[systemName];
      if (system && system.stop) {
        system.stop();
      }
    });

    this.eventBus.emit('engine:stopped');
    console.log('🛑 Game engine stopped');
  }

  pause() {
    this.isPaused = true;
    this.eventBus.emit('engine:paused');
    console.log('⏸️ Game engine paused');
  }

  resume() {
    this.isPaused = false;
    this.lastTime = performance.now();
    this.eventBus.emit('engine:resumed');
    console.log('▶️ Game engine resumed');
  }

  // Main game loop
  gameLoop() {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    this.deltaTime = (currentTime - this.lastTime) / 1000 * this.timeScale;
    this.lastTime = currentTime;
    this.frameCount++;

    // Performance monitoring
    if (this.options.enableProfiling) {
      this.performanceMonitor.startFrame();
    }

    try {
      if (!this.isPaused) {
        this.update(this.deltaTime);
      }
      this.render();
    } catch (error) {
      console.error('💥 Game loop error:', error);
      this.handleError(error);
    }

    // Performance monitoring
    if (this.options.enableProfiling) {
      this.performanceMonitor.endFrame();
    }

    // Schedule next frame
    requestAnimationFrame(this.gameLoop);
  }

  // Update all systems
  update(deltaTime) {
    // Update current scene
    this.sceneManager.update(deltaTime);

    // Update systems in order
    this.systemOrder.forEach(systemName => {
      if (systemName === 'render') return; // Skip render in update
      
      const system = this.systems[systemName];
      if (system && system.update) {
        if (this.options.enableProfiling) {
          this.performanceMonitor.startProfile(systemName);
        }
        
        system.update(deltaTime);
        
        if (this.options.enableProfiling) {
          this.performanceMonitor.endProfile(systemName);
        }
      }
    });

    // Update entity manager
    this.entityManager.update(deltaTime);
  }

  // Render current frame
  render() {
    if (this.options.enableProfiling) {
      this.performanceMonitor.startProfile('render');
    }

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width / this.options.pixelRatio, this.canvas.height / this.options.pixelRatio);

    // Render current scene
    this.sceneManager.render(this.ctx);

    // Render systems
    if (this.systems.render) {
      this.systems.render.render(this.ctx);
    }

    // Debug rendering
    if (this.options.enableDebug) {
      this.renderDebug();
    }

    if (this.options.enableProfiling) {
      this.performanceMonitor.endProfile('render');
    }
  }

  // Debug rendering
  renderDebug() {
    const ctx = this.ctx;
    const monitor = this.performanceMonitor;
    
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(10, 10, 250, 120);
    
    ctx.fillStyle = '#00ff00';
    ctx.font = '12px monospace';
    ctx.fillText(`FPS: ${monitor.getCurrentFPS().toFixed(1)}`, 20, 30);
    ctx.fillText(`Frame: ${this.frameCount}`, 20, 45);
    ctx.fillText(`Entities: ${this.entityManager.getEntityCount()}`, 20, 60);
    ctx.fillText(`Delta: ${(this.deltaTime * 1000).toFixed(2)}ms`, 20, 75);
    
    if (this.options.enableProfiling) {
      const profiles = monitor.getProfiles();
      let y = 90;
      Object.entries(profiles).forEach(([name, time]) => {
        ctx.fillText(`${name}: ${time.toFixed(2)}ms`, 20, y);
        y += 15;
      });
    }
    
    ctx.restore();
  }

  // Error handling
  handleError(error) {
    console.error('🚨 Engine Error:', error);
    
    // Try to recover by clearing problematic state
    try {
      this.ctx.save();
      this.ctx.fillStyle = '#ff0000';
      this.ctx.font = '20px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('⚠️ Engine Error - Check Console', 
        this.canvas.width / (2 * this.options.pixelRatio), 
        this.canvas.height / (2 * this.options.pixelRatio)
      );
      this.ctx.restore();
    } catch (renderError) {
      console.error('💥 Failed to render error message:', renderError);
    }

    this.eventBus.emit('engine:error', error);
  }

  // Utility methods
  setTimeScale(scale) {
    this.timeScale = Math.max(0, scale);
    this.eventBus.emit('engine:timescale-changed', scale);
  }

  getSystem(name) {
    return this.systems[name];
  }

  getCanvas() {
    return this.canvas;
  }

  getContext() {
    return this.ctx;
  }

  getPerformanceStats() {
    return this.performanceMonitor.getStats();
  }

  // Event system
  on(event, callback) {
    this.eventBus.on(event, callback);
  }

  off(event, callback) {
    this.eventBus.off(event, callback);
  }

  emit(event, data) {
    this.eventBus.emit(event, data);
  }

  // Cleanup
  destroy() {
    this.stop();
    
    // Destroy all systems
    Object.values(this.systems).forEach(system => {
      if (system && system.destroy) {
        system.destroy();
      }
    });

    // Clear managers
    this.entityManager.clear();
    this.sceneManager.clear();
    this.assetManager.clear();
    
    console.log('🗑️ Game engine destroyed');
  }
}

export default GameEngine;