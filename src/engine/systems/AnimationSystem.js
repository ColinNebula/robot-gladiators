/**
 * Advanced Animation System - Enhanced Animation Control
 * 
 * Provides sophisticated animation control, timeline management,
 * keyframe interpolation, and advanced animation features.
 */

export class AnimationSystem {
  constructor(engine) {
    this.engine = engine;
    
    // Animation Management
    this.animations = new Map(); // Entity ID -> Animation Controller
    this.timelines = new Map(); // Timeline ID -> Timeline
    this.animationTemplates = new Map(); // Template Name -> Template
    
    // Animation State
    this.globalTimeScale = 1;
    this.paused = false;
    
    // Advanced Features
    this.blendingEnabled = true;
    this.interpolationMethods = new Map();
    this.easingFunctions = new Map();
    
    // Performance
    this.maxAnimationsPerFrame = 100;
    this.animationCulling = true;
    this.cullingDistance = 1000;
    
    this.setupInterpolationMethods();
    this.setupEasingFunctions();
    this.loadDefaultAnimations();
    
    console.log('🎬 Advanced Animation System initialized');
  }

  initialize() {
    this.setupDefaultComponents();
  }

  start() {
    this.paused = false;
  }

  stop() {
    this.paused = true;
  }

  update(deltaTime) {
    if (this.paused) return;
    
    const adjustedDeltaTime = deltaTime * this.globalTimeScale;
    let animationsUpdated = 0;
    
    // Update entity animations
    for (const [entityId, controller] of this.animations) {
      if (animationsUpdated >= this.maxAnimationsPerFrame) break;
      
      const entity = this.engine.entityManager.getEntity(entityId);
      if (!entity || !entity.active) continue;
      
      // Animation culling
      if (this.animationCulling && this.shouldCullAnimation(entity)) {
        continue;
      }
      
      this.updateAnimationController(controller, adjustedDeltaTime);
      animationsUpdated++;
    }
    
    // Update timelines
    for (const timeline of this.timelines.values()) {
      this.updateTimeline(timeline, adjustedDeltaTime);
    }
  }

  // Animation Controller Management
  createAnimationController(entityId, config = {}) {
    const controller = new AnimationController(entityId, config);
    this.animations.set(entityId, controller);
    return controller;
  }

  getAnimationController(entityId) {
    return this.animations.get(entityId);
  }

  removeAnimationController(entityId) {
    this.animations.delete(entityId);
  }

  updateAnimationController(controller, deltaTime) {
    controller.update(deltaTime);
    
    // Apply animation to entity
    const entity = this.engine.entityManager.getEntity(controller.entityId);
    if (entity) {
      this.applyAnimationToEntity(entity, controller);
    }
  }

  applyAnimationToEntity(entity, controller) {
    const currentState = controller.getCurrentState();
    
    if (currentState.position) {
      entity.transform.x = currentState.position.x;
      entity.transform.y = currentState.position.y;
    }
    
    if (currentState.rotation !== undefined) {
      entity.transform.rotation = currentState.rotation;
    }
    
    if (currentState.scale) {
      entity.transform.scaleX = currentState.scale.x;
      entity.transform.scaleY = currentState.scale.y;
    }
    
    if (currentState.color) {
      const shape = this.engine.entityManager.getComponent(entity.id, 'shape');
      if (shape) {
        shape.fillColor = currentState.color;
      }
    }
    
    if (currentState.opacity !== undefined) {
      const shape = this.engine.entityManager.getComponent(entity.id, 'shape');
      if (shape) {
        shape.opacity = currentState.opacity;
      }
    }
  }

  // Timeline System
  createTimeline(id, config = {}) {
    const timeline = new AnimationTimeline(id, config);
    this.timelines.set(id, timeline);
    return timeline;
  }

  getTimeline(id) {
    return this.timelines.get(id);
  }

  updateTimeline(timeline, deltaTime) {
    timeline.update(deltaTime);
    
    // Apply timeline effects
    for (const track of timeline.tracks) {
      if (track.target && track.target.type === 'entity') {
        const entity = this.engine.entityManager.getEntity(track.target.id);
        if (entity) {
          this.applyTrackToEntity(entity, track, timeline.currentTime);
        }
      }
    }
  }

  applyTrackToEntity(entity, track, time) {
    const value = track.getValueAtTime(time);
    
    switch (track.property) {
      case 'position.x':
        entity.transform.x = value;
        break;
      case 'position.y':
        entity.transform.y = value;
        break;
      case 'rotation':
        entity.transform.rotation = value;
        break;
      case 'scale.x':
        entity.transform.scaleX = value;
        break;
      case 'scale.y':
        entity.transform.scaleY = value;
        break;
      default:
        // Custom property handling
        if (track.customApplier) {
          track.customApplier(entity, value);
        }
    }
  }

  // Animation Templates
  registerAnimationTemplate(name, template) {
    this.animationTemplates.set(name, template);
  }

  createAnimationFromTemplate(entityId, templateName, parameters = {}) {
    const template = this.animationTemplates.get(templateName);
    if (!template) {
      console.warn(`Animation template '${templateName}' not found`);
      return null;
    }
    
    const controller = this.createAnimationController(entityId);
    const animation = template.create(parameters);
    controller.addAnimation(animation);
    controller.play(animation.name);
    
    return controller;
  }

  loadDefaultAnimations() {
    // Fade In
    this.registerAnimationTemplate('fadeIn', {
      create: (params = {}) => ({
        name: 'fadeIn',
        duration: params.duration || 1000,
        keyframes: [
          { time: 0, opacity: 0 },
          { time: 1, opacity: 1 }
        ],
        easing: params.easing || 'easeOut'
      })
    });
    
    // Fade Out
    this.registerAnimationTemplate('fadeOut', {
      create: (params = {}) => ({
        name: 'fadeOut',
        duration: params.duration || 1000,
        keyframes: [
          { time: 0, opacity: 1 },
          { time: 1, opacity: 0 }
        ],
        easing: params.easing || 'easeIn'
      })
    });
    
    // Slide In
    this.registerAnimationTemplate('slideIn', {
      create: (params = {}) => ({
        name: 'slideIn',
        duration: params.duration || 800,
        keyframes: [
          { time: 0, position: { x: params.fromX || -100, y: params.fromY || 0 } },
          { time: 1, position: { x: params.toX || 0, y: params.toY || 0 } }
        ],
        easing: params.easing || 'easeOutBack'
      })
    });
    
    // Pulse
    this.registerAnimationTemplate('pulse', {
      create: (params = {}) => ({
        name: 'pulse',
        duration: params.duration || 1000,
        loop: true,
        keyframes: [
          { time: 0, scale: { x: 1, y: 1 } },
          { time: 0.5, scale: { x: params.scale || 1.2, y: params.scale || 1.2 } },
          { time: 1, scale: { x: 1, y: 1 } }
        ],
        easing: 'easeInOut'
      })
    });
    
    // Shake
    this.registerAnimationTemplate('shake', {
      create: (params = {}) => ({
        name: 'shake',
        duration: params.duration || 500,
        keyframes: this.generateShakeKeyframes(params.intensity || 5, params.frequency || 10),
        easing: 'linear'
      })
    });
    
    // Bounce
    this.registerAnimationTemplate('bounce', {
      create: (params = {}) => ({
        name: 'bounce',
        duration: params.duration || 600,
        keyframes: [
          { time: 0, position: { x: 0, y: 0 } },
          { time: 0.2, position: { x: 0, y: -30 } },
          { time: 0.4, position: { x: 0, y: 0 } },
          { time: 0.6, position: { x: 0, y: -15 } },
          { time: 0.8, position: { x: 0, y: 0 } },
          { time: 0.9, position: { x: 0, y: -5 } },
          { time: 1, position: { x: 0, y: 0 } }
        ],
        easing: 'linear'
      })
    });
  }

  generateShakeKeyframes(intensity, frequency) {
    const keyframes = [];
    const steps = frequency;
    
    for (let i = 0; i <= steps; i++) {
      const time = i / steps;
      const x = (Math.random() - 0.5) * intensity * 2;
      const y = (Math.random() - 0.5) * intensity * 2;
      keyframes.push({ time, position: { x, y } });
    }
    
    return keyframes;
  }

  // Quick Animation Methods
  fadeIn(entityId, duration = 1000, easing = 'easeOut') {
    return this.createAnimationFromTemplate(entityId, 'fadeIn', { duration, easing });
  }

  fadeOut(entityId, duration = 1000, easing = 'easeIn') {
    return this.createAnimationFromTemplate(entityId, 'fadeOut', { duration, easing });
  }

  slideIn(entityId, fromX, fromY, toX, toY, duration = 800) {
    return this.createAnimationFromTemplate(entityId, 'slideIn', {
      fromX, fromY, toX, toY, duration
    });
  }

  pulse(entityId, scale = 1.2, duration = 1000) {
    return this.createAnimationFromTemplate(entityId, 'pulse', { scale, duration });
  }

  shake(entityId, intensity = 5, duration = 500) {
    return this.createAnimationFromTemplate(entityId, 'shake', { intensity, duration });
  }

  bounce(entityId, duration = 600) {
    return this.createAnimationFromTemplate(entityId, 'bounce', { duration });
  }

  // Interpolation Methods
  setupInterpolationMethods() {
    this.interpolationMethods.set('linear', (a, b, t) => a + (b - a) * t);
    
    this.interpolationMethods.set('smoothstep', (a, b, t) => {
      const smooth = t * t * (3 - 2 * t);
      return a + (b - a) * smooth;
    });
    
    this.interpolationMethods.set('smootherstep', (a, b, t) => {
      const smooth = t * t * t * (t * (t * 6 - 15) + 10);
      return a + (b - a) * smooth;
    });
  }

  // Easing Functions
  setupEasingFunctions() {
    const easing = {
      linear: t => t,
      easeIn: t => t * t,
      easeOut: t => t * (2 - t),
      easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
      easeInCubic: t => t * t * t,
      easeOutCubic: t => (--t) * t * t + 1,
      easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
      easeInBack: t => t * t * (2.7 * t - 1.7),
      easeOutBack: t => 1 + (--t) * t * (2.7 * t + 1.7),
      easeInBounce: t => 1 - easing.easeOutBounce(1 - t),
      easeOutBounce: t => {
        if (t < 1 / 2.75) return 7.5625 * t * t;
        if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
        if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
        return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
      }
    };
    
    for (const [name, func] of Object.entries(easing)) {
      this.easingFunctions.set(name, func);
    }
  }

  // Animation Culling
  shouldCullAnimation(entity) {
    // Simple distance-based culling
    const camera = this.engine.getSystem('render')?.camera;
    if (!camera) return false;
    
    const dx = entity.transform.x - camera.x;
    const dy = entity.transform.y - camera.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance > this.cullingDistance;
  }

  // Global Controls
  setGlobalTimeScale(scale) {
    this.globalTimeScale = scale;
  }

  pauseAll() {
    this.paused = true;
  }

  resumeAll() {
    this.paused = false;
  }

  stopAll() {
    for (const controller of this.animations.values()) {
      controller.stopAll();
    }
  }

  setupDefaultComponents() {
    // Setup default animation component factory
    this.engine.entityManager.registerComponentFactory('animator', (config = {}) => ({
      enabled: config.enabled !== false,
      currentAnimation: config.currentAnimation || null,
      speed: config.speed || 1,
      loop: config.loop !== false,
      autoPlay: config.autoPlay !== false
    }));
  }

  // Cleanup
  destroy() {
    this.animations.clear();
    this.timelines.clear();
    this.animationTemplates.clear();
  }
}

// Animation Controller Class
class AnimationController {
  constructor(entityId, config = {}) {
    this.entityId = entityId;
    this.animations = new Map();
    this.currentAnimation = null;
    this.currentState = {};
    this.blending = config.blending || false;
    this.blendDuration = config.blendDuration || 200;
    this.blendProgress = 0;
    this.previousState = {};
  }

  addAnimation(animation) {
    this.animations.set(animation.name, new Animation(animation));
  }

  play(animationName, options = {}) {
    const animation = this.animations.get(animationName);
    if (!animation) {
      console.warn(`Animation '${animationName}' not found`);
      return;
    }

    if (this.blending && this.currentAnimation) {
      this.previousState = { ...this.currentState };
      this.blendProgress = 0;
    }

    this.currentAnimation = animation;
    animation.play(options);
  }

  stop() {
    if (this.currentAnimation) {
      this.currentAnimation.stop();
    }
  }

  pause() {
    if (this.currentAnimation) {
      this.currentAnimation.pause();
    }
  }

  resume() {
    if (this.currentAnimation) {
      this.currentAnimation.resume();
    }
  }

  stopAll() {
    for (const animation of this.animations.values()) {
      animation.stop();
    }
    this.currentAnimation = null;
  }

  update(deltaTime) {
    if (!this.currentAnimation) return;

    this.currentAnimation.update(deltaTime);
    this.currentState = this.currentAnimation.getCurrentState();

    // Handle blending
    if (this.blending && this.blendProgress < 1) {
      this.blendProgress = Math.min(1, this.blendProgress + deltaTime / this.blendDuration);
      this.currentState = this.blendStates(this.previousState, this.currentState, this.blendProgress);
    }
  }

  blendStates(state1, state2, t) {
    const blended = {};

    // Blend position
    if (state1.position && state2.position) {
      blended.position = {
        x: state1.position.x + (state2.position.x - state1.position.x) * t,
        y: state1.position.y + (state2.position.y - state1.position.y) * t
      };
    } else {
      blended.position = state2.position || state1.position;
    }

    // Blend rotation
    if (state1.rotation !== undefined && state2.rotation !== undefined) {
      blended.rotation = state1.rotation + (state2.rotation - state1.rotation) * t;
    } else {
      blended.rotation = state2.rotation !== undefined ? state2.rotation : state1.rotation;
    }

    // Blend scale
    if (state1.scale && state2.scale) {
      blended.scale = {
        x: state1.scale.x + (state2.scale.x - state1.scale.x) * t,
        y: state1.scale.y + (state2.scale.y - state1.scale.y) * t
      };
    } else {
      blended.scale = state2.scale || state1.scale;
    }

    // Blend opacity
    if (state1.opacity !== undefined && state2.opacity !== undefined) {
      blended.opacity = state1.opacity + (state2.opacity - state1.opacity) * t;
    } else {
      blended.opacity = state2.opacity !== undefined ? state2.opacity : state1.opacity;
    }

    return blended;
  }

  getCurrentState() {
    return this.currentState;
  }

  isPlaying() {
    return this.currentAnimation && this.currentAnimation.isPlaying();
  }
}

// Animation Class
class Animation {
  constructor(config) {
    this.name = config.name;
    this.duration = config.duration;
    this.keyframes = config.keyframes || [];
    this.easing = config.easing || 'linear';
    this.loop = config.loop || false;
    this.yoyo = config.yoyo || false;
    
    this.currentTime = 0;
    this.isPlaying = false;
    this.isPaused = false;
    this.direction = 1; // 1 for forward, -1 for reverse
  }

  play(options = {}) {
    this.currentTime = options.startTime || 0;
    this.isPlaying = true;
    this.isPaused = false;
  }

  stop() {
    this.isPlaying = false;
    this.currentTime = 0;
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  update(deltaTime) {
    if (!this.isPlaying || this.isPaused) return;

    this.currentTime += deltaTime * this.direction;

    if (this.currentTime >= this.duration) {
      if (this.loop) {
        if (this.yoyo) {
          this.direction = -1;
          this.currentTime = this.duration;
        } else {
          this.currentTime = 0;
        }
      } else {
        this.currentTime = this.duration;
        this.isPlaying = false;
      }
    } else if (this.currentTime <= 0 && this.direction === -1) {
      if (this.yoyo) {
        this.direction = 1;
        this.currentTime = 0;
      }
    }
  }

  getCurrentState() {
    const progress = Math.max(0, Math.min(1, this.currentTime / this.duration));
    return this.interpolateKeyframes(progress);
  }

  interpolateKeyframes(progress) {
    if (this.keyframes.length === 0) return {};
    if (this.keyframes.length === 1) return { ...this.keyframes[0] };

    // Find surrounding keyframes
    let prevFrame = this.keyframes[0];
    let nextFrame = this.keyframes[this.keyframes.length - 1];

    for (let i = 0; i < this.keyframes.length - 1; i++) {
      if (progress >= this.keyframes[i].time && progress <= this.keyframes[i + 1].time) {
        prevFrame = this.keyframes[i];
        nextFrame = this.keyframes[i + 1];
        break;
      }
    }

    // Calculate local progress between keyframes
    const timeRange = nextFrame.time - prevFrame.time;
    const localProgress = timeRange > 0 ? (progress - prevFrame.time) / timeRange : 0;

    return this.interpolateFrames(prevFrame, nextFrame, localProgress);
  }

  interpolateFrames(frame1, frame2, t) {
    const result = {};

    // Interpolate position
    if (frame1.position && frame2.position) {
      result.position = {
        x: this.lerp(frame1.position.x, frame2.position.x, t),
        y: this.lerp(frame1.position.y, frame2.position.y, t)
      };
    } else {
      result.position = frame2.position || frame1.position;
    }

    // Interpolate rotation
    if (frame1.rotation !== undefined && frame2.rotation !== undefined) {
      result.rotation = this.lerp(frame1.rotation, frame2.rotation, t);
    } else {
      result.rotation = frame2.rotation !== undefined ? frame2.rotation : frame1.rotation;
    }

    // Interpolate scale
    if (frame1.scale && frame2.scale) {
      result.scale = {
        x: this.lerp(frame1.scale.x, frame2.scale.x, t),
        y: this.lerp(frame1.scale.y, frame2.scale.y, t)
      };
    } else {
      result.scale = frame2.scale || frame1.scale;
    }

    // Interpolate opacity
    if (frame1.opacity !== undefined && frame2.opacity !== undefined) {
      result.opacity = this.lerp(frame1.opacity, frame2.opacity, t);
    } else {
      result.opacity = frame2.opacity !== undefined ? frame2.opacity : frame1.opacity;
    }

    return result;
  }

  lerp(a, b, t) {
    return a + (b - a) * t;
  }
}

// Timeline Class
class AnimationTimeline {
  constructor(id, config = {}) {
    this.id = id;
    this.duration = config.duration || 0;
    this.currentTime = 0;
    this.tracks = [];
    this.isPlaying = false;
    this.loop = config.loop || false;
  }

  addTrack(config) {
    const track = new AnimationTrack(config);
    this.tracks.push(track);
    this.duration = Math.max(this.duration, track.duration);
    return track;
  }

  play() {
    this.isPlaying = true;
    this.currentTime = 0;
  }

  stop() {
    this.isPlaying = false;
    this.currentTime = 0;
  }

  update(deltaTime) {
    if (!this.isPlaying) return;

    this.currentTime += deltaTime;

    if (this.currentTime >= this.duration) {
      if (this.loop) {
        this.currentTime = 0;
      } else {
        this.currentTime = this.duration;
        this.isPlaying = false;
      }
    }
  }
}

// Track Class
class AnimationTrack {
  constructor(config) {
    this.property = config.property;
    this.target = config.target;
    this.keyframes = config.keyframes || [];
    this.duration = config.duration || 0;
    this.customApplier = config.customApplier;
  }

  getValueAtTime(time) {
    if (this.keyframes.length === 0) return 0;
    if (this.keyframes.length === 1) return this.keyframes[0].value;

    // Find surrounding keyframes
    let prevFrame = this.keyframes[0];
    let nextFrame = this.keyframes[this.keyframes.length - 1];

    for (let i = 0; i < this.keyframes.length - 1; i++) {
      if (time >= this.keyframes[i].time && time <= this.keyframes[i + 1].time) {
        prevFrame = this.keyframes[i];
        nextFrame = this.keyframes[i + 1];
        break;
      }
    }

    // Interpolate
    const timeRange = nextFrame.time - prevFrame.time;
    const t = timeRange > 0 ? (time - prevFrame.time) / timeRange : 0;
    
    return prevFrame.value + (nextFrame.value - prevFrame.value) * t;
  }
}

export default AnimationSystem;