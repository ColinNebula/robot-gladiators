/**
 * Enhanced Visual Effects System
 * 
 * Advanced visual effects including screen shake, camera effects,
 * enhanced particles, dynamic lighting, post-processing effects,
 * and cinematic sequences.
 */

export class VisualEffectsSystem {
  constructor(engine) {
    this.engine = engine;
    this.eventBus = engine.eventBus;
    this.canvas = engine.canvas;
    this.ctx = engine.ctx;
    
    // Screen effects
    this.screenEffects = {
      shake: {
        intensity: 0,
        duration: 0,
        frequency: 60,
        dampening: 0.95,
        offset: { x: 0, y: 0 }
      },
      flash: {
        intensity: 0,
        color: '#ffffff',
        duration: 0,
        fadeSpeed: 0.05
      },
      fade: {
        alpha: 0,
        target: 0,
        speed: 0.02,
        color: '#000000'
      },
      zoom: {
        scale: 1,
        target: 1,
        speed: 0.05,
        center: { x: 0, y: 0 }
      },
      distortion: {
        enabled: false,
        type: 'wave',
        intensity: 0,
        frequency: 1,
        time: 0
      }
    };
    
    // Camera system
    this.camera = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      smoothing: 0.1,
      bounds: null,
      followTarget: null,
      offset: { x: 0, y: 0 }
    };
    
    // Post-processing effects
    this.postEffects = {
      blur: { enabled: false, amount: 0 },
      bloom: { enabled: false, threshold: 0.8, intensity: 1.5 },
      colorGrading: { 
        enabled: false, 
        brightness: 0, 
        contrast: 1, 
        saturation: 1,
        hue: 0,
        gamma: 1
      },
      scanlines: { enabled: false, intensity: 0.1, frequency: 4 },
      vignette: { enabled: false, intensity: 0.5, size: 0.8 },
      chromatic: { enabled: false, intensity: 2 },
      noise: { enabled: false, intensity: 0.1 }
    };
    
    // Particle pools for performance
    this.particlePools = {
      spark: [],
      smoke: [],
      fire: [],
      magic: [],
      blood: [],
      debris: []
    };
    
    // Active effect instances
    this.activeEffects = [];
    this.timedEffects = [];
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.eventBus.on('effects:screenShake', this.triggerScreenShake.bind(this));
    this.eventBus.on('effects:screenFlash', this.triggerScreenFlash.bind(this));
    this.eventBus.on('effects:fadeIn', this.triggerFadeIn.bind(this));
    this.eventBus.on('effects:fadeOut', this.triggerFadeOut.bind(this));
    this.eventBus.on('effects:zoom', this.triggerZoom.bind(this));
    this.eventBus.on('effects:particle', this.createParticleEffect.bind(this));
    this.eventBus.on('effects:explosion', this.createExplosion.bind(this));
    this.eventBus.on('effects:impact', this.createImpactEffect.bind(this));
    this.eventBus.on('effects:trail', this.createTrailEffect.bind(this));
    this.eventBus.on('effects:aura', this.createAuraEffect.bind(this));
    this.eventBus.on('camera:follow', this.setCameraTarget.bind(this));
    this.eventBus.on('camera:shake', this.cameraShake.bind(this));
  }

  update(deltaTime) {
    this.updateScreenEffects(deltaTime);
    this.updateCamera(deltaTime);
    this.updateParticleEffects(deltaTime);
    this.updateTimedEffects(deltaTime);
  }

  updateScreenEffects(deltaTime) {
    // Update screen shake
    if (this.screenEffects.shake.duration > 0) {
      this.screenEffects.shake.duration -= deltaTime;
      this.screenEffects.shake.intensity *= this.screenEffects.shake.dampening;
      
      const shake = this.screenEffects.shake;
      const angle = Math.random() * Math.PI * 2;
      shake.offset.x = Math.cos(angle) * shake.intensity;
      shake.offset.y = Math.sin(angle) * shake.intensity;
      
      if (this.screenEffects.shake.duration <= 0) {
        shake.offset.x = 0;
        shake.offset.y = 0;
        shake.intensity = 0;
      }
    }
    
    // Update screen flash
    if (this.screenEffects.flash.duration > 0) {
      this.screenEffects.flash.duration -= deltaTime;
      this.screenEffects.flash.intensity -= this.screenEffects.flash.fadeSpeed;
      
      if (this.screenEffects.flash.duration <= 0 || this.screenEffects.flash.intensity <= 0) {
        this.screenEffects.flash.intensity = 0;
        this.screenEffects.flash.duration = 0;
      }
    }
    
    // Update fade effect
    const fade = this.screenEffects.fade;
    if (fade.alpha !== fade.target) {
      if (fade.alpha < fade.target) {
        fade.alpha = Math.min(fade.target, fade.alpha + fade.speed);
      } else {
        fade.alpha = Math.max(fade.target, fade.alpha - fade.speed);
      }
    }
    
    // Update zoom
    const zoom = this.screenEffects.zoom;
    if (zoom.scale !== zoom.target) {
      zoom.scale += (zoom.target - zoom.scale) * zoom.speed;
      if (Math.abs(zoom.scale - zoom.target) < 0.01) {
        zoom.scale = zoom.target;
      }
    }
    
    // Update distortion
    if (this.screenEffects.distortion.enabled) {
      this.screenEffects.distortion.time += deltaTime * 0.001;
    }
  }

  updateCamera(deltaTime) {
    const camera = this.camera;
    
    // Follow target if set
    if (camera.followTarget) {
      const entity = this.engine.entityManager.getEntity(camera.followTarget);
      if (entity) {
        camera.targetX = entity.transform.x - this.canvas.width / 2 + camera.offset.x;
        camera.targetY = entity.transform.y - this.canvas.height / 2 + camera.offset.y;
      }
    }
    
    // Smooth camera movement
    camera.x += (camera.targetX - camera.x) * camera.smoothing;
    camera.y += (camera.targetY - camera.y) * camera.smoothing;
    
    // Apply camera bounds if set
    if (camera.bounds) {
      camera.x = Math.max(camera.bounds.left, Math.min(camera.bounds.right - this.canvas.width, camera.x));
      camera.y = Math.max(camera.bounds.top, Math.min(camera.bounds.bottom - this.canvas.height, camera.y));
    }
  }

  updateParticleEffects(deltaTime) {
    this.activeEffects = this.activeEffects.filter(effect => {
      effect.update(deltaTime);
      return effect.isAlive();
    });
  }

  updateTimedEffects(deltaTime) {
    this.timedEffects = this.timedEffects.filter(effect => {
      effect.duration -= deltaTime;
      if (effect.duration <= 0) {
        effect.onComplete?.();
        return false;
      }
      effect.onUpdate?.(effect.duration, deltaTime);
      return true;
    });
  }

  render() {
    this.ctx.save();
    
    // Apply camera transform
    this.applyCameraTransform();
    
    // Apply screen shake
    this.applyScreenShake();
    
    // Apply zoom
    this.applyZoom();
  }

  postRender() {
    // Render particle effects
    this.renderParticleEffects();
    
    // Apply post-processing effects
    this.applyPostProcessing();
    
    // Render screen effects
    this.renderScreenEffects();
    
    this.ctx.restore();
  }

  applyCameraTransform() {
    this.ctx.translate(-this.camera.x, -this.camera.y);
  }

  applyScreenShake() {
    const shake = this.screenEffects.shake;
    if (shake.intensity > 0) {
      this.ctx.translate(shake.offset.x, shake.offset.y);
    }
  }

  applyZoom() {
    const zoom = this.screenEffects.zoom;
    if (zoom.scale !== 1) {
      this.ctx.translate(zoom.center.x, zoom.center.y);
      this.ctx.scale(zoom.scale, zoom.scale);
      this.ctx.translate(-zoom.center.x, -zoom.center.y);
    }
  }

  renderParticleEffects() {
    for (const effect of this.activeEffects) {
      effect.render(this.ctx);
    }
  }

  renderScreenEffects() {
    // Render screen flash
    if (this.screenEffects.flash.intensity > 0) {
      this.ctx.save();
      this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
      this.ctx.globalAlpha = this.screenEffects.flash.intensity;
      this.ctx.fillStyle = this.screenEffects.flash.color;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.restore();
    }
    
    // Render fade overlay
    if (this.screenEffects.fade.alpha > 0) {
      this.ctx.save();
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.globalAlpha = this.screenEffects.fade.alpha;
      this.ctx.fillStyle = this.screenEffects.fade.color;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.restore();
    }
  }

  applyPostProcessing() {
    if (!this.hasActivePostEffects()) return;
    
    // Get image data for processing
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    
    // Apply color grading
    if (this.postEffects.colorGrading.enabled) {
      this.applyColorGrading(data);
    }
    
    // Apply noise
    if (this.postEffects.noise.enabled) {
      this.applyNoise(data);
    }
    
    // Put processed image data back
    this.ctx.putImageData(imageData, 0, 0);
    
    // Apply other effects that don't require pixel manipulation
    this.applyCanvasEffects();
  }

  applyColorGrading(data) {
    const grading = this.postEffects.colorGrading;
    
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      
      // Apply brightness
      r += grading.brightness;
      g += grading.brightness;
      b += grading.brightness;
      
      // Apply contrast
      r = ((r / 255 - 0.5) * grading.contrast + 0.5) * 255;
      g = ((g / 255 - 0.5) * grading.contrast + 0.5) * 255;
      b = ((b / 255 - 0.5) * grading.contrast + 0.5) * 255;
      
      // Apply saturation
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + (r - gray) * grading.saturation;
      g = gray + (g - gray) * grading.saturation;
      b = gray + (b - gray) * grading.saturation;
      
      // Clamp values
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }
  }

  applyNoise(data) {
    const noise = this.postEffects.noise;
    const intensity = noise.intensity * 255;
    
    for (let i = 0; i < data.length; i += 4) {
      const noiseValue = (Math.random() - 0.5) * intensity;
      data[i] += noiseValue;
      data[i + 1] += noiseValue;
      data[i + 2] += noiseValue;
      
      // Clamp values
      data[i] = Math.max(0, Math.min(255, data[i]));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1]));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2]));
    }
  }

  applyCanvasEffects() {
    // Apply vignette
    if (this.postEffects.vignette.enabled) {
      this.renderVignette();
    }
    
    // Apply scanlines
    if (this.postEffects.scanlines.enabled) {
      this.renderScanlines();
    }
  }

  renderVignette() {
    const vignette = this.postEffects.vignette;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const radius = Math.max(this.canvas.width, this.canvas.height) * vignette.size;
    
    const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, `rgba(0, 0, 0, 0)`);
    gradient.addColorStop(1, `rgba(0, 0, 0, ${vignette.intensity})`);
    
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  }

  renderScanlines() {
    const scanlines = this.postEffects.scanlines;
    
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.globalAlpha = scanlines.intensity;
    this.ctx.fillStyle = '#000000';
    
    for (let y = 0; y < this.canvas.height; y += scanlines.frequency) {
      this.ctx.fillRect(0, y, this.canvas.width, 1);
    }
    
    this.ctx.restore();
  }

  // Effect trigger methods
  triggerScreenShake(data) {
    const { intensity = 10, duration = 500, frequency = 60 } = data;
    
    this.screenEffects.shake.intensity = intensity;
    this.screenEffects.shake.duration = duration;
    this.screenEffects.shake.frequency = frequency;
  }

  triggerScreenFlash(data) {
    const { color = '#ffffff', intensity = 1, duration = 200 } = data;
    
    this.screenEffects.flash.color = color;
    this.screenEffects.flash.intensity = intensity;
    this.screenEffects.flash.duration = duration;
    this.screenEffects.flash.fadeSpeed = intensity / (duration / 16); // Assume 60fps
  }

  triggerFadeIn(data) {
    const { duration = 1000, color = '#000000' } = data;
    
    this.screenEffects.fade.target = 0;
    this.screenEffects.fade.speed = 1 / (duration / 16);
    this.screenEffects.fade.color = color;
  }

  triggerFadeOut(data) {
    const { duration = 1000, color = '#000000' } = data;
    
    this.screenEffects.fade.target = 1;
    this.screenEffects.fade.speed = 1 / (duration / 16);
    this.screenEffects.fade.color = color;
  }

  triggerZoom(data) {
    const { scale = 1, duration = 1000, centerX, centerY } = data;
    
    this.screenEffects.zoom.target = scale;
    this.screenEffects.zoom.speed = Math.abs(scale - this.screenEffects.zoom.scale) / (duration / 16);
    
    if (centerX !== undefined && centerY !== undefined) {
      this.screenEffects.zoom.center.x = centerX;
      this.screenEffects.zoom.center.y = centerY;
    } else {
      this.screenEffects.zoom.center.x = this.canvas.width / 2;
      this.screenEffects.zoom.center.y = this.canvas.height / 2;
    }
  }

  createParticleEffect(data) {
    const effect = new AdvancedParticleEffect(data);
    this.activeEffects.push(effect);
    return effect;
  }

  createExplosion(data) {
    const { x, y, size = 1, color = '#ff6600' } = data;
    
    // Core explosion
    this.createParticleEffect({
      x, y,
      type: 'explosion',
      count: Math.floor(20 * size),
      speed: { min: 50 * size, max: 150 * size },
      lifetime: { min: 300, max: 800 },
      color: color,
      size: { min: 2 * size, max: 8 * size },
      gravity: 30,
      fade: true
    });
    
    // Smoke ring
    this.createParticleEffect({
      x, y,
      type: 'smoke',
      count: Math.floor(15 * size),
      speed: { min: 20 * size, max: 60 * size },
      lifetime: { min: 1000, max: 2000 },
      color: '#666666',
      size: { min: 4 * size, max: 12 * size },
      fade: true,
      expand: true
    });
    
    // Screen shake
    this.triggerScreenShake({
      intensity: 8 * size,
      duration: 300 * size
    });
    
    // Flash effect
    this.triggerScreenFlash({
      color: color,
      intensity: 0.3 * size,
      duration: 150
    });
  }

  createImpactEffect(data) {
    const { x, y, direction = 0, intensity = 1 } = data;
    
    // Spark particles
    this.createParticleEffect({
      x, y,
      type: 'sparks',
      count: Math.floor(10 * intensity),
      speed: { min: 30, max: 80 },
      lifetime: { min: 200, max: 500 },
      color: '#ffff00',
      size: { min: 1, max: 3 },
      direction: direction,
      spread: Math.PI / 3,
      gravity: 50
    });
    
    // Dust cloud
    this.createParticleEffect({
      x, y,
      type: 'dust',
      count: Math.floor(8 * intensity),
      speed: { min: 10, max: 30 },
      lifetime: { min: 400, max: 800 },
      color: '#cccccc',
      size: { min: 2, max: 6 },
      fade: true
    });
  }

  createTrailEffect(data) {
    const { entityId, color = '#ffffff', duration = 1000 } = data;
    
    const trail = new TrailEffect(entityId, color, duration, this.engine);
    this.activeEffects.push(trail);
    return trail;
  }

  createAuraEffect(data) {
    const { entityId, color = '#ffffff', radius = 50, pulsing = true } = data;
    
    const aura = new AuraEffect(entityId, color, radius, pulsing, this.engine);
    this.activeEffects.push(aura);
    return aura;
  }

  setCameraTarget(data) {
    const { entityId, smoothing = 0.1, offset = { x: 0, y: 0 } } = data;
    
    this.camera.followTarget = entityId;
    this.camera.smoothing = smoothing;
    this.camera.offset = offset;
  }

  cameraShake(data) {
    this.triggerScreenShake(data);
  }

  // Utility methods
  hasActivePostEffects() {
    return Object.values(this.postEffects).some(effect => effect.enabled);
  }

  enablePostEffect(effectName, settings = {}) {
    if (this.postEffects[effectName]) {
      this.postEffects[effectName].enabled = true;
      Object.assign(this.postEffects[effectName], settings);
    }
  }

  disablePostEffect(effectName) {
    if (this.postEffects[effectName]) {
      this.postEffects[effectName].enabled = false;
    }
  }

  getCameraPosition() {
    return { x: this.camera.x, y: this.camera.y };
  }

  worldToScreen(worldX, worldY) {
    return {
      x: worldX - this.camera.x + this.screenEffects.shake.offset.x,
      y: worldY - this.camera.y + this.screenEffects.shake.offset.y
    };
  }

  screenToWorld(screenX, screenY) {
    return {
      x: screenX + this.camera.x - this.screenEffects.shake.offset.x,
      y: screenY + this.camera.y - this.screenEffects.shake.offset.y
    };
  }
}

// Advanced particle effect class
class AdvancedParticleEffect {
  constructor(config) {
    this.particles = [];
    this.config = config;
    this.alive = true;
    
    this.createParticles();
  }

  createParticles() {
    const count = this.config.count || 10;
    
    for (let i = 0; i < count; i++) {
      const particle = this.createParticle();
      this.particles.push(particle);
    }
  }

  createParticle() {
    const config = this.config;
    const angle = config.direction !== undefined 
      ? config.direction + (Math.random() - 0.5) * (config.spread || Math.PI * 2)
      : Math.random() * Math.PI * 2;
    
    const speed = config.speed 
      ? config.speed.min + Math.random() * (config.speed.max - config.speed.min)
      : 50;
    
    const lifetime = config.lifetime
      ? config.lifetime.min + Math.random() * (config.lifetime.max - config.lifetime.min)
      : 1000;
    
    const size = config.size
      ? config.size.min + Math.random() * (config.size.max - config.size.min)
      : 2;
    
    return {
      x: config.x,
      y: config.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: size,
      initialSize: size,
      lifetime: lifetime,
      maxLifetime: lifetime,
      color: config.color || '#ffffff',
      alpha: 1
    };
  }

  update(deltaTime) {
    const dt = deltaTime / 1000;
    
    this.particles = this.particles.filter(particle => {
      // Update position
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      
      // Apply gravity
      if (this.config.gravity) {
        particle.vy += this.config.gravity * dt;
      }
      
      // Update lifetime
      particle.lifetime -= deltaTime;
      
      // Update alpha for fading
      if (this.config.fade) {
        particle.alpha = particle.lifetime / particle.maxLifetime;
      }
      
      // Update size for expanding
      if (this.config.expand) {
        const progress = 1 - (particle.lifetime / particle.maxLifetime);
        particle.size = particle.initialSize * (1 + progress * 2);
      }
      
      return particle.lifetime > 0;
    });
    
    if (this.particles.length === 0) {
      this.alive = false;
    }
  }

  render(ctx) {
    for (const particle of this.particles) {
      ctx.save();
      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  isAlive() {
    return this.alive;
  }
}

// Trail effect class
class TrailEffect {
  constructor(entityId, color, duration, engine) {
    this.entityId = entityId;
    this.color = color;
    this.duration = duration;
    this.maxDuration = duration;
    this.engine = engine;
    this.points = [];
    this.maxPoints = 20;
  }

  update(deltaTime) {
    this.duration -= deltaTime;
    
    const entity = this.engine.entityManager.getEntity(this.entityId);
    if (entity) {
      this.points.push({
        x: entity.transform.x + entity.transform.width / 2,
        y: entity.transform.y + entity.transform.height / 2,
        time: Date.now()
      });
    }
    
    // Remove old points
    const now = Date.now();
    this.points = this.points.filter(point => now - point.time < 500);
    
    if (this.points.length > this.maxPoints) {
      this.points.shift();
    }
  }

  render(ctx) {
    if (this.points.length < 2) return;
    
    ctx.save();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    for (let i = 1; i < this.points.length; i++) {
      const alpha = i / this.points.length;
      ctx.globalAlpha = alpha * 0.8;
      
      ctx.beginPath();
      ctx.moveTo(this.points[i - 1].x, this.points[i - 1].y);
      ctx.lineTo(this.points[i].x, this.points[i].y);
      ctx.stroke();
    }
    
    ctx.restore();
  }

  isAlive() {
    return this.duration > 0 || this.points.length > 0;
  }
}

// Aura effect class
class AuraEffect {
  constructor(entityId, color, radius, pulsing, engine) {
    this.entityId = entityId;
    this.color = color;
    this.radius = radius;
    this.pulsing = pulsing;
    this.engine = engine;
    this.time = 0;
    this.alive = true;
  }

  update(deltaTime) {
    this.time += deltaTime;
    
    // Check if entity still exists
    const entity = this.engine.entityManager.getEntity(this.entityId);
    if (!entity) {
      this.alive = false;
    }
  }

  render(ctx) {
    const entity = this.engine.entityManager.getEntity(this.entityId);
    if (!entity) return;
    
    const centerX = entity.transform.x + entity.transform.width / 2;
    const centerY = entity.transform.y + entity.transform.height / 2;
    
    let currentRadius = this.radius;
    if (this.pulsing) {
      currentRadius *= 1 + Math.sin(this.time * 0.005) * 0.2;
    }
    
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, currentRadius);
    gradient.addColorStop(0, this.color + '40');
    gradient.addColorStop(0.7, this.color + '20');
    gradient.addColorStop(1, this.color + '00');
    
    ctx.save();
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  isAlive() {
    return this.alive;
  }
}

export default VisualEffectsSystem;