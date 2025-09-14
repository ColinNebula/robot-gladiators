/**
 * Particle System - High-Performance Particle Effects Engine
 * 
 * Manages and renders thousands of particles efficiently with various
 * emitter types, forces, and visual effects for explosions, trails, etc.
 */

export class ParticleSystem {
  constructor(engine) {
    this.engine = engine;
    
    // Particle pools for performance
    this.particlePool = [];
    this.activeParticles = [];
    this.emitters = new Map();
    
    // Performance settings
    this.maxParticles = 2000;
    this.poolSize = 2500;
    this.batchSize = 50; // Particles to process per frame
    
    // Global forces
    this.globalForces = {
      gravity: { x: 0, y: 150 },
      wind: { x: 0, y: 0 }
    };
    
    // Rendering optimization
    this.useWebGL = false;
    this.renderBounds = { x: 0, y: 0, width: 1200, height: 500 };
    
    // Statistics
    this.stats = {
      particlesActive: 0,
      particlesPooled: 0,
      emittersActive: 0,
      frameTime: 0
    };
    
    console.log('✨ Particle System initialized');
  }

  initialize() {
    // Pre-populate particle pool
    this.initializeParticlePool();
    
    // Setup default emitter types
    this.registerDefaultEmitters();
  }

  initializeParticlePool() {
    for (let i = 0; i < this.poolSize; i++) {
      this.particlePool.push(this.createParticle());
    }
    console.log(`🏊 Particle pool initialized with ${this.poolSize} particles`);
  }

  createParticle() {
    return {
      // Position and movement
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      ax: 0,
      ay: 0,
      
      // Visual properties
      size: 1,
      color: '#ffffff',
      alpha: 1,
      rotation: 0,
      rotationSpeed: 0,
      
      // Lifecycle
      life: 1,
      maxLife: 1,
      age: 0,
      
      // Behavior
      mass: 1,
      drag: 0.99,
      bounce: 0.5,
      
      // Visual effects
      trail: false,
      glow: false,
      blend: 'normal',
      
      // Animation
      scaleStart: 1,
      scaleEnd: 1,
      alphaStart: 1,
      alphaEnd: 0,
      
      // State
      active: false,
      emitterId: null
    };
  }

  registerDefaultEmitters() {
    // Explosion emitter
    this.registerEmitterType('explosion', {
      particleCount: 30,
      duration: 0.1,
      spread: Math.PI * 2,
      speed: { min: 100, max: 300 },
      life: { min: 0.5, max: 1.5 },
      size: { min: 2, max: 8 },
      colors: ['#ff4444', '#ff8844', '#ffaa44', '#ffffff'],
      gravity: true,
      drag: 0.95
    });
    
    // Fire emitter
    this.registerEmitterType('fire', {
      particleCount: 20,
      duration: -1, // Continuous
      rate: 15, // Particles per second
      spread: Math.PI / 4,
      direction: -Math.PI / 2, // Upward
      speed: { min: 50, max: 120 },
      life: { min: 0.8, max: 1.2 },
      size: { min: 3, max: 6 },
      colors: ['#ff2222', '#ff6622', '#ffaa22', '#ffdd44'],
      scaleEnd: 0.1,
      alphaEnd: 0,
      gravity: false,
      wind: true
    });
    
    // Smoke emitter
    this.registerEmitterType('smoke', {
      particleCount: 15,
      duration: -1,
      rate: 8,
      spread: Math.PI / 6,
      direction: -Math.PI / 2,
      speed: { min: 20, max: 80 },
      life: { min: 2, max: 4 },
      size: { min: 4, max: 12 },
      colors: ['#666666', '#888888', '#aaaaaa'],
      scaleEnd: 2,
      alphaEnd: 0,
      gravity: false,
      wind: true,
      drag: 0.98
    });
    
    // Spark emitter
    this.registerEmitterType('sparks', {
      particleCount: 25,
      duration: 0.2,
      spread: Math.PI * 2,
      speed: { min: 150, max: 400 },
      life: { min: 0.3, max: 0.8 },
      size: { min: 1, max: 3 },
      colors: ['#ffffff', '#ffff88', '#ffaa44'],
      gravity: true,
      bounce: 0.3,
      trail: true
    });
    
    // Magic emitter
    this.registerEmitterType('magic', {
      particleCount: 40,
      duration: 1,
      spread: Math.PI * 2,
      speed: { min: 30, max: 100 },
      life: { min: 1, max: 2 },
      size: { min: 2, max: 5 },
      colors: ['#8844ff', '#4488ff', '#44ffff', '#ffffff'],
      scaleEnd: 0,
      alphaEnd: 0,
      gravity: false,
      glow: true
    });
  }

  registerEmitterType(name, config) {
    this.emitterTypes = this.emitterTypes || new Map();
    this.emitterTypes.set(name, config);
  }

  start() {
    // Particle system is always active
  }

  stop() {
    // Clear all particles and emitters
    this.clearAll();
  }

  update(deltaTime) {
    const startTime = performance.now();
    
    // Update emitters
    this.updateEmitters(deltaTime);
    
    // Update particles in batches for performance
    this.updateParticles(deltaTime);
    
    // Clean up dead particles
    this.cleanupParticles();
    
    // Update statistics
    this.updateStats(startTime);
  }

  updateEmitters(deltaTime) {
    this.emitters.forEach((emitter, id) => {
      if (!emitter.active) return;
      
      // Update emitter lifetime
      if (emitter.duration > 0) {
        emitter.age += deltaTime;
        if (emitter.age >= emitter.duration) {
          emitter.active = false;
          return;
        }
      }
      
      // Emit particles based on rate
      if (emitter.rate > 0) {
        emitter.emitTimer += deltaTime;
        const emitInterval = 1 / emitter.rate;
        
        while (emitter.emitTimer >= emitInterval) {
          this.emitParticle(emitter);
          emitter.emitTimer -= emitInterval;
        }
      }
    });
  }

  updateParticles(deltaTime) {
    const batchEnd = Math.min(this.activeParticles.length, this.batchSize);
    
    for (let i = 0; i < batchEnd; i++) {
      const particle = this.activeParticles[i];
      if (!particle.active) continue;
      
      // Update age and life
      particle.age += deltaTime;
      particle.life = 1 - (particle.age / particle.maxLife);
      
      // Check if particle should die
      if (particle.life <= 0) {
        this.killParticle(particle);
        continue;
      }
      
      // Apply global forces
      if (particle.gravity) {
        particle.ax += this.globalForces.gravity.x;
        particle.ay += this.globalForces.gravity.y;
      }
      
      if (particle.wind) {
        particle.ax += this.globalForces.wind.x;
        particle.ay += this.globalForces.wind.y;
      }
      
      // Update velocity
      particle.vx += particle.ax * deltaTime;
      particle.vy += particle.ay * deltaTime;
      
      // Apply drag
      particle.vx *= Math.pow(particle.drag, deltaTime);
      particle.vy *= Math.pow(particle.drag, deltaTime);
      
      // Update position
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;
      
      // Update rotation
      particle.rotation += particle.rotationSpeed * deltaTime;
      
      // Update visual properties based on life
      const lifeProgress = 1 - particle.life;
      particle.alpha = this.lerp(particle.alphaStart, particle.alphaEnd, lifeProgress);
      particle.size = this.lerp(particle.scaleStart, particle.scaleEnd, lifeProgress) * particle.baseSize;
      
      // World bounds collision
      this.handleWorldCollision(particle);
      
      // Reset acceleration
      particle.ax = 0;
      particle.ay = 0;
    }
  }

  handleWorldCollision(particle) {
    const bounds = this.renderBounds;
    
    // Horizontal bounds
    if (particle.x < bounds.x) {
      particle.x = bounds.x;
      particle.vx *= -particle.bounce;
    } else if (particle.x > bounds.x + bounds.width) {
      particle.x = bounds.x + bounds.width;
      particle.vx *= -particle.bounce;
    }
    
    // Vertical bounds
    if (particle.y < bounds.y) {
      particle.y = bounds.y;
      particle.vy *= -particle.bounce;
    } else if (particle.y > bounds.y + bounds.height) {
      particle.y = bounds.y + bounds.height;
      particle.vy *= -particle.bounce;
    }
  }

  cleanupParticles() {
    // Remove dead particles and return to pool
    this.activeParticles = this.activeParticles.filter(particle => {
      if (!particle.active) {
        this.returnParticleToPool(particle);
        return false;
      }
      return true;
    });
  }

  // Emitter management
  createEmitter(type, x, y, options = {}) {
    const config = this.emitterTypes.get(type);
    if (!config) {
      console.warn(`Unknown emitter type: ${type}`);
      return null;
    }
    
    const emitterId = this.generateEmitterId();
    const emitter = {
      id: emitterId,
      type,
      x,
      y,
      active: true,
      age: 0,
      emitTimer: 0,
      particlesEmitted: 0,
      ...config,
      ...options
    };
    
    // Emit initial burst if specified
    if (emitter.particleCount > 0 && emitter.duration !== -1) {
      for (let i = 0; i < emitter.particleCount; i++) {
        this.emitParticle(emitter);
      }
    }
    
    this.emitters.set(emitterId, emitter);
    return emitterId;
  }

  emitParticle(emitter) {
    if (this.activeParticles.length >= this.maxParticles) return;
    
    const particle = this.getParticleFromPool();
    if (!particle) return;
    
    // Reset particle
    this.resetParticle(particle);
    
    // Set emitter properties
    particle.emitterId = emitter.id;
    particle.x = emitter.x + (Math.random() - 0.5) * (emitter.spawnRadius || 0);
    particle.y = emitter.y + (Math.random() - 0.5) * (emitter.spawnRadius || 0);
    
    // Set velocity
    const angle = (emitter.direction || 0) + (Math.random() - 0.5) * emitter.spread;
    const speed = this.randomBetween(emitter.speed.min, emitter.speed.max);
    particle.vx = Math.cos(angle) * speed;
    particle.vy = Math.sin(angle) * speed;
    
    // Set visual properties
    particle.maxLife = this.randomBetween(emitter.life.min, emitter.life.max);
    particle.life = 1;
    particle.age = 0;
    particle.baseSize = this.randomBetween(emitter.size.min, emitter.size.max);
    particle.size = particle.baseSize;
    
    // Set color
    if (Array.isArray(emitter.colors)) {
      particle.color = emitter.colors[Math.floor(Math.random() * emitter.colors.length)];
    } else {
      particle.color = emitter.colors || '#ffffff';
    }
    
    // Set behavior properties
    particle.mass = emitter.mass || 1;
    particle.drag = emitter.drag || 0.99;
    particle.bounce = emitter.bounce || 0.5;
    particle.gravity = emitter.gravity || false;
    particle.wind = emitter.wind || false;
    
    // Set visual effects
    particle.trail = emitter.trail || false;
    particle.glow = emitter.glow || false;
    particle.blend = emitter.blend || 'normal';
    
    // Set animation properties
    particle.scaleStart = emitter.scaleStart || 1;
    particle.scaleEnd = emitter.scaleEnd || 1;
    particle.alphaStart = emitter.alphaStart || 1;
    particle.alphaEnd = emitter.alphaEnd || 0;
    
    // Set rotation
    particle.rotation = Math.random() * Math.PI * 2;
    particle.rotationSpeed = (Math.random() - 0.5) * (emitter.rotationSpeed || 0);
    
    particle.active = true;
    this.activeParticles.push(particle);
    emitter.particlesEmitted++;
  }

  // Particle pool management
  getParticleFromPool() {
    return this.particlePool.pop() || null;
  }

  returnParticleToPool(particle) {
    if (this.particlePool.length < this.poolSize) {
      this.particlePool.push(particle);
    }
  }

  resetParticle(particle) {
    particle.x = 0;
    particle.y = 0;
    particle.vx = 0;
    particle.vy = 0;
    particle.ax = 0;
    particle.ay = 0;
    particle.size = 1;
    particle.color = '#ffffff';
    particle.alpha = 1;
    particle.rotation = 0;
    particle.rotationSpeed = 0;
    particle.life = 1;
    particle.maxLife = 1;
    particle.age = 0;
    particle.active = false;
    particle.emitterId = null;
  }

  killParticle(particle) {
    particle.active = false;
  }

  // Rendering (called by RenderSystem)
  render(ctx) {
    if (this.activeParticles.length === 0) return;
    
    ctx.save();
    
    // Group particles by blend mode for efficiency
    const particlesByBlend = new Map();
    
    this.activeParticles.forEach(particle => {
      if (!particle.active) return;
      
      const blend = particle.blend || 'normal';
      if (!particlesByBlend.has(blend)) {
        particlesByBlend.set(blend, []);
      }
      particlesByBlend.get(blend).push(particle);
    });
    
    // Render each blend group
    particlesByBlend.forEach((particles, blendMode) => {
      ctx.globalCompositeOperation = blendMode;
      particles.forEach(particle => this.renderParticle(ctx, particle));
    });
    
    ctx.restore();
  }

  renderParticle(ctx, particle) {
    ctx.save();
    
    // Apply particle transform
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.rotation);
    ctx.globalAlpha = particle.alpha;
    
    // Render glow effect
    if (particle.glow) {
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = particle.size * 2;
    }
    
    // Render particle
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }

  // Public API methods
  createExplosion(x, y, intensity = 1) {
    return this.createEmitter('explosion', x, y, {
      particleCount: Math.floor(30 * intensity),
      speed: { min: 100 * intensity, max: 300 * intensity }
    });
  }

  createFire(x, y, size = 1) {
    return this.createEmitter('fire', x, y, {
      rate: 15 * size,
      size: { min: 3 * size, max: 6 * size }
    });
  }

  createSparks(x, y, count = 25) {
    return this.createEmitter('sparks', x, y, {
      particleCount: count
    });
  }

  createTrail(x, y, color = '#ffffff') {
    return this.createEmitter('magic', x, y, {
      particleCount: 5,
      colors: [color],
      duration: 0.1
    });
  }

  // Emitter control
  stopEmitter(emitterId) {
    const emitter = this.emitters.get(emitterId);
    if (emitter) {
      emitter.active = false;
    }
  }

  removeEmitter(emitterId) {
    this.emitters.delete(emitterId);
  }

  moveEmitter(emitterId, x, y) {
    const emitter = this.emitters.get(emitterId);
    if (emitter) {
      emitter.x = x;
      emitter.y = y;
    }
  }

  // Global settings
  setGlobalForces(gravity, wind) {
    this.globalForces.gravity = gravity;
    this.globalForces.wind = wind;
  }

  setMaxParticles(max) {
    this.maxParticles = max;
  }

  // Utility methods
  randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  lerp(a, b, t) {
    return a + (b - a) * t;
  }

  generateEmitterId() {
    return `emitter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  updateStats(startTime) {
    this.stats.particlesActive = this.activeParticles.length;
    this.stats.particlesPooled = this.particlePool.length;
    this.stats.emittersActive = Array.from(this.emitters.values()).filter(e => e.active).length;
    this.stats.frameTime = performance.now() - startTime;
  }

  getStats() {
    return { ...this.stats };
  }

  // Cleanup methods
  clearAll() {
    this.activeParticles.forEach(particle => this.returnParticleToPool(particle));
    this.activeParticles = [];
    this.emitters.clear();
  }

  clearParticles() {
    this.activeParticles.forEach(particle => this.returnParticleToPool(particle));
    this.activeParticles = [];
  }

  destroy() {
    this.clearAll();
    this.particlePool = [];
    this.emitterTypes.clear();
  }
}

export default ParticleSystem;