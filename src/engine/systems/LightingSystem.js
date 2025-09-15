/**
 * Advanced Lighting System - Dynamic Lighting and Shadows
 * 
 * Provides dynamic lighting, shadow casting, ambient lighting,
 * and advanced visual effects for enhanced graphics.
 */

export class LightingSystem {
  constructor(engine) {
    this.engine = engine;
    
    // Lighting State
    this.lights = new Map(); // Light ID -> Light Object
    this.ambientLight = { r: 0.2, g: 0.2, b: 0.2, intensity: 0.3 };
    this.globalLightingEnabled = true;
    
    // Lighting Buffers
    this.lightBuffer = null;
    this.shadowBuffer = null;
    this.normalBuffer = null;
    
    // Performance Settings
    this.maxLights = 32;
    this.shadowQuality = 'medium'; // 'low', 'medium', 'high'
    this.lightCulling = true;
    this.cullingDistance = 800;
    
    // Light Types
    this.lightTypes = new Set(['point', 'directional', 'spot', 'area']);
    
    // Advanced Features
    this.volumetricLightingEnabled = true;
    this.dynamicShadowsEnabled = true;
    this.lightBlending = true;
    
    this.initializeLightingBuffers();
    this.createDefaultLights();
    
    console.log('💡 Advanced Lighting System initialized');
  }

  initialize() {
    this.setupLightingComponents();
  }

  start() {
    // Start any lighting animations or effects
    this.updateLightAnimations = true;
  }

  stop() {
    this.updateLightAnimations = false;
  }

  update(deltaTime) {
    if (!this.globalLightingEnabled) return;
    
    // Update animated lights
    if (this.updateLightAnimations) {
      for (const light of this.lights.values()) {
        this.updateLight(light, deltaTime);
      }
    }
    
    // Update shadow casting
    if (this.dynamicShadowsEnabled) {
      this.updateShadows();
    }
    
    // Cull distant lights for performance
    if (this.lightCulling) {
      this.cullLights();
    }
  }

  // Light Management
  createLight(id, config) {
    const light = new Light(id, config);
    this.lights.set(id, light);
    
    this.engine.emit('lighting:lightCreated', { id, light });
    return light;
  }

  removeLight(id) {
    const light = this.lights.get(id);
    if (light) {
      this.lights.delete(id);
      this.engine.emit('lighting:lightRemoved', { id, light });
    }
  }

  getLight(id) {
    return this.lights.get(id);
  }

  updateLight(light, deltaTime) {
    // Update light animations
    if (light.animation) {
      this.updateLightAnimation(light, deltaTime);
    }
    
    // Update flickering
    if (light.flicker.enabled) {
      this.updateLightFlicker(light, deltaTime);
    }
    
    // Update pulsing
    if (light.pulse.enabled) {
      this.updateLightPulse(light, deltaTime);
    }
  }

  updateLightAnimation(light, deltaTime) {
    const anim = light.animation;
    anim.time += deltaTime;
    
    if (anim.time >= anim.duration) {
      if (anim.loop) {
        anim.time = 0;
      } else {
        light.animation = null;
        return;
      }
    }
    
    const progress = anim.time / anim.duration;
    
    // Apply animated properties
    if (anim.intensity) {
      light.intensity = this.interpolate(
        anim.intensity.start,
        anim.intensity.end,
        progress,
        anim.easing
      );
    }
    
    if (anim.color) {
      light.color = this.interpolateColor(
        anim.color.start,
        anim.color.end,
        progress,
        anim.easing
      );
    }
    
    if (anim.position) {
      light.position.x = this.interpolate(
        anim.position.start.x,
        anim.position.end.x,
        progress,
        anim.easing
      );
      light.position.y = this.interpolate(
        anim.position.start.y,
        anim.position.end.y,
        progress,
        anim.easing
      );
    }
  }

  updateLightFlicker(light, deltaTime) {
    const flicker = light.flicker;
    flicker.timer += deltaTime;
    
    if (flicker.timer >= flicker.interval) {
      const randomIntensity = light.baseIntensity * (1 - flicker.amount + Math.random() * flicker.amount * 2);
      light.intensity = Math.max(0, randomIntensity);
      flicker.timer = 0;
      flicker.interval = flicker.baseInterval * (0.5 + Math.random());
    }
  }

  updateLightPulse(light, deltaTime) {
    const pulse = light.pulse;
    pulse.time += deltaTime;
    
    const pulseValue = Math.sin(pulse.time * pulse.frequency) * pulse.amplitude;
    light.intensity = light.baseIntensity + pulseValue;
  }

  // Lighting Calculation
  calculateLighting(ctx, canvas) {
    if (!this.globalLightingEnabled) return;
    
    // Create lighting pass
    this.createLightingPass(ctx, canvas);
    
    // Apply lighting to scene
    this.applyLightingToScene(ctx, canvas);
  }

  createLightingPass(ctx, canvas) {
    // Create lighting buffer if needed
    if (!this.lightBuffer) {
      this.initializeLightingBuffers();
    }
    
    const lightCtx = this.lightBuffer.getContext('2d');
    lightCtx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Start with ambient lighting
    lightCtx.fillStyle = `rgba(${Math.floor(this.ambientLight.r * 255)}, ${Math.floor(this.ambientLight.g * 255)}, ${Math.floor(this.ambientLight.b * 255)}, ${this.ambientLight.intensity})`;
    lightCtx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Apply each light
    lightCtx.globalCompositeOperation = 'lighter';
    
    for (const light of this.lights.values()) {
      if (!light.enabled || light.intensity <= 0) continue;
      
      this.renderLight(lightCtx, light, canvas);
    }
    
    lightCtx.globalCompositeOperation = 'source-over';
  }

  renderLight(ctx, light, canvas) {
    const camera = this.engine.getSystem('render')?.camera || { x: 0, y: 0 };
    const screenX = light.position.x - camera.x;
    const screenY = light.position.y - camera.y;
    
    switch (light.type) {
      case 'point':
        this.renderPointLight(ctx, light, screenX, screenY);
        break;
      case 'directional':
        this.renderDirectionalLight(ctx, light, canvas);
        break;
      case 'spot':
        this.renderSpotLight(ctx, light, screenX, screenY);
        break;
      case 'area':
        this.renderAreaLight(ctx, light, screenX, screenY);
        break;
    }
  }

  renderPointLight(ctx, light, x, y) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, light.radius);
    
    const color = light.color;
    const intensity = light.intensity;
    
    gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity})`);
    gradient.addColorStop(0.7, `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity * 0.3})`);
    gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, light.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  renderDirectionalLight(ctx, light, canvas) {
    const gradient = ctx.createLinearGradient(
      0, 0,
      Math.cos(light.direction) * canvas.width,
      Math.sin(light.direction) * canvas.height
    );
    
    const color = light.color;
    const intensity = light.intensity;
    
    gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity})`);
    gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity * 0.5})`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  renderSpotLight(ctx, light, x, y) {
    ctx.save();
    
    // Create spotlight cone
    ctx.translate(x, y);
    ctx.rotate(light.direction);
    
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, light.radius);
    
    const color = light.color;
    const intensity = light.intensity;
    
    gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity})`);
    gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
    
    ctx.fillStyle = gradient;
    
    // Draw cone
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, light.radius, -light.angle / 2, light.angle / 2);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }

  renderAreaLight(ctx, light, x, y) {
    const gradient = ctx.createLinearGradient(
      x - light.width / 2, y - light.height / 2,
      x + light.width / 2, y + light.height / 2
    );
    
    const color = light.color;
    const intensity = light.intensity;
    
    gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity})`);
    gradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity * 0.8})`);
    gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(
      x - light.width / 2,
      y - light.height / 2,
      light.width,
      light.height
    );
  }

  applyLightingToScene(ctx, canvas) {
    // Apply lighting using blend modes
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(this.lightBuffer, 0, 0);
    ctx.restore();
  }

  // Shadow System
  updateShadows() {
    // Simple shadow implementation
    // In a full implementation, this would use raycasting
  }

  castShadow(light, occluder) {
    // Calculate shadow geometry based on light position and occluder
    const shadows = [];
    
    // Simple rectangular shadow casting
    if (occluder.shape === 'rectangle') {
      const corners = this.getRectangleCorners(occluder);
      
      for (const corner of corners) {
        const shadowRay = this.calculateShadowRay(light.position, corner);
        shadows.push(shadowRay);
      }
    }
    
    return shadows;
  }

  calculateShadowRay(lightPos, point) {
    const direction = {
      x: point.x - lightPos.x,
      y: point.y - lightPos.y
    };
    
    const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    
    return {
      start: point,
      direction: {
        x: direction.x / length,
        y: direction.y / length
      },
      length: 1000 // Maximum shadow length
    };
  }

  getRectangleCorners(rect) {
    return [
      { x: rect.x, y: rect.y },
      { x: rect.x + rect.width, y: rect.y },
      { x: rect.x + rect.width, y: rect.y + rect.height },
      { x: rect.x, y: rect.y + rect.height }
    ];
  }

  // Quick Light Creation Methods
  createPointLight(id, x, y, radius = 100, color = { r: 255, g: 255, b: 255 }, intensity = 0.8) {
    return this.createLight(id, {
      type: 'point',
      position: { x, y },
      radius,
      color,
      intensity
    });
  }

  createSpotLight(id, x, y, direction, angle, radius = 150, color = { r: 255, g: 255, b: 255 }, intensity = 0.9) {
    return this.createLight(id, {
      type: 'spot',
      position: { x, y },
      direction,
      angle,
      radius,
      color,
      intensity
    });
  }

  createDirectionalLight(id, direction, color = { r: 255, g: 255, b: 200 }, intensity = 0.6) {
    return this.createLight(id, {
      type: 'directional',
      direction,
      color,
      intensity
    });
  }

  // Light Effects
  flickerLight(lightId, amount = 0.3, interval = 100) {
    const light = this.getLight(lightId);
    if (light) {
      light.flicker = {
        enabled: true,
        amount,
        baseInterval: interval,
        interval,
        timer: 0
      };
    }
  }

  pulseLight(lightId, frequency = 2, amplitude = 0.2) {
    const light = this.getLight(lightId);
    if (light) {
      light.pulse = {
        enabled: true,
        frequency,
        amplitude,
        time: 0
      };
    }
  }

  animateLight(lightId, animation) {
    const light = this.getLight(lightId);
    if (light) {
      light.animation = {
        time: 0,
        duration: animation.duration || 1000,
        loop: animation.loop || false,
        easing: animation.easing || 'linear',
        ...animation
      };
    }
  }

  // Performance
  cullLights() {
    const camera = this.engine.getSystem('render')?.camera;
    if (!camera) return;
    
    for (const light of this.lights.values()) {
      const distance = Math.sqrt(
        Math.pow(light.position.x - camera.x, 2) +
        Math.pow(light.position.y - camera.y, 2)
      );
      
      light.culled = distance > this.cullingDistance;
    }
  }

  setAmbientLight(r, g, b, intensity) {
    this.ambientLight = { r: r / 255, g: g / 255, b: b / 255, intensity };
  }

  // Utility Functions
  interpolate(start, end, t, easing = 'linear') {
    // Apply easing
    switch (easing) {
      case 'easeIn':
        t = t * t;
        break;
      case 'easeOut':
        t = t * (2 - t);
        break;
      case 'easeInOut':
        t = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        break;
    }
    
    return start + (end - start) * t;
  }

  interpolateColor(startColor, endColor, t, easing = 'linear') {
    return {
      r: Math.floor(this.interpolate(startColor.r, endColor.r, t, easing)),
      g: Math.floor(this.interpolate(startColor.g, endColor.g, t, easing)),
      b: Math.floor(this.interpolate(startColor.b, endColor.b, t, easing))
    };
  }

  initializeLightingBuffers() {
    const canvas = this.engine.getCanvas();
    
    this.lightBuffer = document.createElement('canvas');
    this.lightBuffer.width = canvas.width;
    this.lightBuffer.height = canvas.height;
    
    this.shadowBuffer = document.createElement('canvas');
    this.shadowBuffer.width = canvas.width;
    this.shadowBuffer.height = canvas.height;
  }

  createDefaultLights() {
    // Create a default ambient setup
    this.setAmbientLight(50, 50, 80, 0.4);
  }

  setupLightingComponents() {
    // Register lighting component for entities
    this.engine.entityManager.registerComponentFactory('light', (config = {}) => ({
      type: config.type || 'point',
      enabled: config.enabled !== false,
      intensity: config.intensity || 1,
      color: config.color || { r: 255, g: 255, b: 255 },
      radius: config.radius || 100,
      castShadows: config.castShadows || false
    }));
  }

  // Global Controls
  setGlobalLightingEnabled(enabled) {
    this.globalLightingEnabled = enabled;
  }

  setLightingQuality(quality) {
    this.shadowQuality = quality;
    
    switch (quality) {
      case 'low':
        this.maxLights = 16;
        this.dynamicShadowsEnabled = false;
        break;
      case 'medium':
        this.maxLights = 32;
        this.dynamicShadowsEnabled = true;
        break;
      case 'high':
        this.maxLights = 64;
        this.dynamicShadowsEnabled = true;
        this.volumetricLightingEnabled = true;
        break;
    }
  }

  // Cleanup
  destroy() {
    this.lights.clear();
    
    if (this.lightBuffer) {
      this.lightBuffer = null;
    }
    if (this.shadowBuffer) {
      this.shadowBuffer = null;
    }
  }
}

// Light Class
class Light {
  constructor(id, config = {}) {
    this.id = id;
    this.type = config.type || 'point';
    this.enabled = config.enabled !== false;
    
    // Position and geometry
    this.position = config.position || { x: 0, y: 0 };
    this.radius = config.radius || 100;
    this.direction = config.direction || 0;
    this.angle = config.angle || Math.PI / 4; // For spot lights
    this.width = config.width || 100; // For area lights
    this.height = config.height || 100; // For area lights
    
    // Appearance
    this.color = config.color || { r: 255, g: 255, b: 255 };
    this.intensity = config.intensity || 1;
    this.baseIntensity = this.intensity;
    
    // Effects
    this.flicker = { enabled: false };
    this.pulse = { enabled: false };
    this.animation = null;
    
    // Shadows
    this.castShadows = config.castShadows || false;
    
    // Performance
    this.culled = false;
  }

  setPosition(x, y) {
    this.position.x = x;
    this.position.y = y;
  }

  setColor(r, g, b) {
    this.color = { r, g, b };
  }

  setIntensity(intensity) {
    this.intensity = intensity;
    this.baseIntensity = intensity;
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  toggle() {
    this.enabled = !this.enabled;
  }
}

export default LightingSystem;