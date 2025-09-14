/**
 * Scene Manager - Game Scene and State Management
 * 
 * Manages different game scenes (menus, gameplay, etc.) with smooth
 * transitions, state persistence, and resource management.
 */

export class SceneManager {
  constructor(engine) {
    this.engine = engine;
    
    // Scene management
    this.scenes = new Map();
    this.currentScene = null;
    this.previousScene = null;
    this.targetScene = null;
    
    // Transition state
    this.isTransitioning = false;
    this.transitionType = 'fade';
    this.transitionDuration = 1000; // ms
    this.transitionProgress = 0;
    this.transitionStartTime = 0;
    
    // Scene stack for nested scenes
    this.sceneStack = [];
    this.maxStackSize = 10;
    
    // Global scene data
    this.globalData = new Map();
    this.persistentData = new Map();
    
    // Preloading
    this.preloadQueue = new Set();
    this.preloadedScenes = new Set();
    
    // Configuration
    this.config = {
      enableTransitions: true,
      enablePreloading: true,
      enableSceneStack: true,
      autoGarbageCollect: true,
      debugMode: false
    };
    
    // Built-in transition effects
    this.transitionEffects = {
      fade: this.fadeTransition.bind(this),
      slide: this.slideTransition.bind(this),
      zoom: this.zoomTransition.bind(this),
      pixelate: this.pixelateTransition.bind(this),
      none: this.noTransition.bind(this)
    };
    
    console.log('🎬 Scene Manager initialized');
  }

  // Scene registration and management
  registerScene(name, sceneClass, options = {}) {
    if (this.scenes.has(name)) {
      console.warn(`🎬 Scene '${name}' already registered, overwriting`);
    }
    
    const sceneConfig = {
      name,
      sceneClass,
      instance: null,
      isLoaded: false,
      preloadAssets: options.preloadAssets || [],
      persistent: options.persistent || false,
      stackable: options.stackable !== false,
      metadata: options.metadata || {}
    };
    
    this.scenes.set(name, sceneConfig);
    
    if (this.config.debugMode) {
      console.log(`🎬 Scene registered: ${name}`);
    }
    
    return sceneConfig;
  }

  unregisterScene(name) {
    const sceneConfig = this.scenes.get(name);
    if (!sceneConfig) return false;
    
    // Destroy instance if exists
    if (sceneConfig.instance) {
      this.destroySceneInstance(sceneConfig);
    }
    
    this.scenes.delete(name);
    this.preloadedScenes.delete(name);
    
    if (this.config.debugMode) {
      console.log(`🎬 Scene unregistered: ${name}`);
    }
    
    return true;
  }

  // Scene transitions
  async changeScene(sceneName, transitionType = null, data = null) {
    if (this.isTransitioning) {
      console.warn('🎬 Scene transition already in progress');
      return false;
    }
    
    const sceneConfig = this.scenes.get(sceneName);
    if (!sceneConfig) {
      console.error(`🎬 Scene '${sceneName}' not found`);
      return false;
    }
    
    if (this.currentScene === sceneName) {
      console.warn(`🎬 Already in scene '${sceneName}'`);
      return false;
    }
    
    this.isTransitioning = true;
    this.targetScene = sceneName;
    this.transitionType = transitionType || this.transitionType;
    this.transitionProgress = 0;
    this.transitionStartTime = performance.now();
    
    try {
      // Preload target scene if needed
      if (!sceneConfig.isLoaded) {
        await this.loadScene(sceneName);
      }
      
      // Start transition
      await this.executeTransition(data);
      
      if (this.config.debugMode) {
        console.log(`🎬 Scene changed to: ${sceneName}`);
      }
      
      return true;
      
    } catch (error) {
      console.error('🎬 Scene transition failed:', error);
      this.isTransitioning = false;
      this.targetScene = null;
      return false;
    }
  }

  async executeTransition(data) {
    const transitionEffect = this.transitionEffects[this.transitionType] || this.transitionEffects.fade;
    
    if (this.config.enableTransitions && transitionEffect !== this.noTransition) {
      // Multi-phase transition: out -> change -> in
      await this.runTransitionPhase('out', transitionEffect, data);
      await this.performSceneChange(data);
      await this.runTransitionPhase('in', transitionEffect, data);
    } else {
      // Instant transition
      await this.performSceneChange(data);
    }
    
    this.isTransitioning = false;
    this.targetScene = null;
  }

  async runTransitionPhase(phase, transitionEffect, data) {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const halfDuration = this.transitionDuration / 2;
      
      const updateTransition = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / halfDuration, 1);
        
        this.transitionProgress = phase === 'out' ? progress : 1 - progress;
        
        transitionEffect(this.transitionProgress, phase, data);
        
        if (progress >= 1) {
          resolve();
        } else {
          requestAnimationFrame(updateTransition);
        }
      };
      
      updateTransition();
    });
  }

  async performSceneChange(data) {
    const targetConfig = this.scenes.get(this.targetScene);
    
    // Exit current scene
    if (this.currentScene) {
      const currentConfig = this.scenes.get(this.currentScene);
      if (currentConfig?.instance) {
        await this.exitScene(currentConfig, data);
      }
    }
    
    // Update scene references
    this.previousScene = this.currentScene;
    this.currentScene = this.targetScene;
    
    // Enter new scene
    await this.enterScene(targetConfig, data);
    
    // Add to scene stack if stackable
    if (this.config.enableSceneStack && targetConfig.stackable) {
      this.addToSceneStack(this.currentScene);
    }
    
    // Emit scene change event
    this.engine.emit('scene:changed', {
      from: this.previousScene,
      to: this.currentScene,
      data
    });
  }

  // Scene loading and lifecycle
  async loadScene(sceneName) {
    const sceneConfig = this.scenes.get(sceneName);
    if (!sceneConfig || sceneConfig.isLoaded) return;
    
    try {
      // Load scene assets
      if (sceneConfig.preloadAssets.length > 0) {
        const assetManager = this.engine.assetManager;
        await assetManager.loadBatch(sceneConfig.preloadAssets);
      }
      
      // Create scene instance
      if (!sceneConfig.instance) {
        sceneConfig.instance = new sceneConfig.sceneClass(this.engine, this);
        
        // Initialize scene if it has an init method
        if (sceneConfig.instance.init) {
          await sceneConfig.instance.init();
        }
      }
      
      sceneConfig.isLoaded = true;
      this.preloadedScenes.add(sceneName);
      
      if (this.config.debugMode) {
        console.log(`🎬 Scene loaded: ${sceneName}`);
      }
      
    } catch (error) {
      console.error(`🎬 Failed to load scene '${sceneName}':`, error);
      throw error;
    }
  }

  async enterScene(sceneConfig, data) {
    if (!sceneConfig.instance) {
      await this.loadScene(sceneConfig.name);
    }
    
    const scene = sceneConfig.instance;
    
    // Call scene enter method
    if (scene.enter) {
      await scene.enter(data, this.previousScene);
    }
    
    // Emit scene enter event
    this.engine.emit('scene:entered', {
      scene: sceneConfig.name,
      data
    });
  }

  async exitScene(sceneConfig, data) {
    const scene = sceneConfig.instance;
    
    if (scene.exit) {
      await scene.exit(data, this.targetScene);
    }
    
    // Destroy non-persistent scenes
    if (!sceneConfig.persistent) {
      this.destroySceneInstance(sceneConfig);
    }
    
    // Emit scene exit event
    this.engine.emit('scene:exited', {
      scene: sceneConfig.name,
      data
    });
  }

  destroySceneInstance(sceneConfig) {
    const scene = sceneConfig.instance;
    
    if (scene && scene.destroy) {
      scene.destroy();
    }
    
    sceneConfig.instance = null;
    sceneConfig.isLoaded = false;
    this.preloadedScenes.delete(sceneConfig.name);
  }

  // Scene stack management
  addToSceneStack(sceneName) {
    // Remove if already in stack
    const index = this.sceneStack.indexOf(sceneName);
    if (index !== -1) {
      this.sceneStack.splice(index, 1);
    }
    
    // Add to top of stack
    this.sceneStack.push(sceneName);
    
    // Trim stack if too large
    if (this.sceneStack.length > this.maxStackSize) {
      this.sceneStack.shift();
    }
  }

  popScene(transitionType = null, data = null) {
    if (this.sceneStack.length < 2) {
      console.warn('🎬 Cannot pop scene: stack too small');
      return false;
    }
    
    // Remove current scene from stack
    this.sceneStack.pop();
    
    // Get previous scene
    const previousScene = this.sceneStack[this.sceneStack.length - 1];
    
    return this.changeScene(previousScene, transitionType, data);
  }

  clearSceneStack() {
    this.sceneStack = [];
  }

  // Transition effects
  fadeTransition(progress, phase, data) {
    const ctx = this.engine.getContext();
    const canvas = this.engine.getCanvas();
    
    ctx.save();
    ctx.globalAlpha = progress;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  slideTransition(progress, phase, data) {
    const ctx = this.engine.getContext();
    const canvas = this.engine.getCanvas();
    const slideDistance = canvas.width;
    
    ctx.save();
    
    if (phase === 'out') {
      ctx.translate(-slideDistance * progress, 0);
    } else {
      ctx.translate(slideDistance * (1 - progress), 0);
    }
    
    ctx.restore();
  }

  zoomTransition(progress, phase, data) {
    const ctx = this.engine.getContext();
    const canvas = this.engine.getCanvas();
    
    ctx.save();
    
    const scale = phase === 'out' ? 1 - progress : progress;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);
    ctx.translate(-centerX, -centerY);
    
    ctx.restore();
  }

  pixelateTransition(progress, phase, data) {
    const ctx = this.engine.getContext();
    const canvas = this.engine.getCanvas();
    
    // Create pixelation effect
    const pixelSize = Math.floor(progress * 20) + 1;
    
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    
    // Scale down and back up to create pixelation
    const scaledWidth = Math.floor(canvas.width / pixelSize);
    const scaledHeight = Math.floor(canvas.height / pixelSize);
    
    ctx.scale(pixelSize, pixelSize);
    
    ctx.restore();
  }

  noTransition(progress, phase, data) {
    // No visual effect
  }

  // Data management
  setGlobalData(key, value) {
    this.globalData.set(key, value);
  }

  getGlobalData(key, defaultValue = null) {
    return this.globalData.get(key) ?? defaultValue;
  }

  setPersistentData(key, value) {
    this.persistentData.set(key, value);
  }

  getPersistentData(key, defaultValue = null) {
    return this.persistentData.get(key) ?? defaultValue;
  }

  clearGlobalData() {
    this.globalData.clear();
  }

  // Preloading
  preloadScene(sceneName) {
    if (this.preloadedScenes.has(sceneName)) return;
    
    this.preloadQueue.add(sceneName);
    
    // Start preloading in background
    this.loadScene(sceneName).catch(error => {
      console.warn(`🎬 Scene preload failed: ${sceneName}`, error);
      this.preloadQueue.delete(sceneName);
    });
  }

  preloadScenes(sceneNames) {
    sceneNames.forEach(name => this.preloadScene(name));
  }

  // Update and render
  update(deltaTime) {
    // Update current scene
    if (this.currentScene) {
      const sceneConfig = this.scenes.get(this.currentScene);
      if (sceneConfig?.instance?.update) {
        sceneConfig.instance.update(deltaTime);
      }
    }
    
    // Process preload queue
    this.processPreloadQueue();
  }

  render(ctx) {
    // Render current scene
    if (this.currentScene) {
      const sceneConfig = this.scenes.get(this.currentScene);
      if (sceneConfig?.instance?.render) {
        sceneConfig.instance.render(ctx);
      }
    }
    
    // Render transition overlay
    if (this.isTransitioning) {
      const transitionEffect = this.transitionEffects[this.transitionType];
      if (transitionEffect) {
        transitionEffect(this.transitionProgress, 'overlay', null);
      }
    }
  }

  processPreloadQueue() {
    // Process preload queue with rate limiting
    if (this.preloadQueue.size > 0 && !this.isTransitioning) {
      // Implementation for background preloading
    }
  }

  // Getters
  getCurrentScene() {
    return this.currentScene;
  }

  getPreviousScene() {
    return this.previousScene;
  }

  getSceneStack() {
    return [...this.sceneStack];
  }

  isSceneLoaded(sceneName) {
    return this.preloadedScenes.has(sceneName);
  }

  getLoadedScenes() {
    return Array.from(this.preloadedScenes);
  }

  // Configuration
  setConfig(config) {
    this.config = { ...this.config, ...config };
  }

  setTransitionDuration(duration) {
    this.transitionDuration = duration;
  }

  addTransitionEffect(name, effectFunction) {
    this.transitionEffects[name] = effectFunction;
  }

  // Debug and utilities
  getStats() {
    return {
      totalScenes: this.scenes.size,
      loadedScenes: this.preloadedScenes.size,
      currentScene: this.currentScene,
      previousScene: this.previousScene,
      isTransitioning: this.isTransitioning,
      sceneStackSize: this.sceneStack.length,
      preloadQueue: this.preloadQueue.size
    };
  }

  logSceneInfo() {
    console.group('🎬 Scene Manager Info');
    console.log('Current Scene:', this.currentScene);
    console.log('Previous Scene:', this.previousScene);
    console.log('Scene Stack:', this.sceneStack);
    console.log('Loaded Scenes:', Array.from(this.preloadedScenes));
    console.log('Is Transitioning:', this.isTransitioning);
    console.groupEnd();
  }

  // Cleanup
  clear() {
    // Destroy all scene instances
    this.scenes.forEach(sceneConfig => {
      if (sceneConfig.instance) {
        this.destroySceneInstance(sceneConfig);
      }
    });
    
    this.scenes.clear();
    this.preloadedScenes.clear();
    this.preloadQueue.clear();
    this.sceneStack = [];
    this.currentScene = null;
    this.previousScene = null;
    this.isTransitioning = false;
  }

  destroy() {
    this.clear();
    this.globalData.clear();
    this.persistentData.clear();
    console.log('🎬 Scene Manager destroyed');
  }
}

// Base Scene class for inheritance
export class Scene {
  constructor(engine, sceneManager) {
    this.engine = engine;
    this.sceneManager = sceneManager;
    this.isActive = false;
  }

  // Lifecycle methods (to be overridden)
  async init() {
    // Called once when scene is first created
  }

  async enter(data, fromScene) {
    // Called when entering this scene
    this.isActive = true;
  }

  async exit(data, toScene) {
    // Called when leaving this scene
    this.isActive = false;
  }

  update(deltaTime) {
    // Called every frame while scene is active
  }

  render(ctx) {
    // Called every frame to render the scene
  }

  destroy() {
    // Called when scene is destroyed
    this.isActive = false;
  }

  // Utility methods
  changeScene(sceneName, transitionType = null, data = null) {
    return this.sceneManager.changeScene(sceneName, transitionType, data);
  }

  setGlobalData(key, value) {
    this.sceneManager.setGlobalData(key, value);
  }

  getGlobalData(key, defaultValue = null) {
    return this.sceneManager.getGlobalData(key, defaultValue);
  }
}

export default SceneManager;