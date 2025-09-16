/**
 * Enhanced Sprite Animation System
 * 
 * Advanced sprite animation system that integrates with the ECS architecture
 * and provides smooth transitions, state management, and visual effects.
 */

export class EnhancedSpriteAnimationSystem {
  constructor(engine) {
    this.engine = engine;
    this.eventBus = engine.eventBus;
    this.entityManager = engine.entityManager;
    
    // Sprite configurations
    this.spriteConfigs = {
      frameWidth: 48,
      frameHeight: 48,
      renderScale: 2.5,
      smoothing: true,
      shadowEnabled: true
    };
    
    // Animation state management
    this.animationStates = new Map();
    this.loadedSprites = new Map();
    this.animationQueues = new Map();
    
    // Enhanced animation definitions
    this.animations = {
      // Player animations
      player: {
        idle: { 
          frames: 4, 
          speed: 15, 
          file: 'Male_spritesheet_idle.png', 
          loop: true, 
          effects: { bounce: true, glow: 'soft' }
        },
        run: { 
          frames: 6, 
          speed: 6, 
          file: 'Male_spritesheet_run.png', 
          loop: true, 
          effects: { trail: 'speed', intensity: 'high' }
        },
        jump: { 
          frames: 3, 
          speed: 4, 
          file: 'Male_spritesheet_run_jump.png', 
          loop: false, 
          effects: { easing: 'ease-out', glow: 'soft' }
        },
        attack: { 
          frames: 4, 
          speed: 3, 
          file: 'Male_spritesheet_punch_1.png', 
          loop: false, 
          effects: { impact: true, shake: true }
        },
        heavy_attack: { 
          frames: 4, 
          speed: 2, 
          file: 'Male_spritesheet_punch_quad.png', 
          loop: false, 
          effects: { impact: true, shake: 'heavy', afterimage: true }
        },
        block: { 
          frames: 2, 
          speed: 8, 
          file: 'Male_spritesheet_block.png', 
          loop: true, 
          effects: { shimmer: true }
        },
        hurt: { 
          frames: 3, 
          speed: 4, 
          file: 'Male_spritesheet_hurt.png', 
          loop: false, 
          effects: { flash: 'red', shake: 'light' }
        },
        death: { 
          frames: 4, 
          speed: 10, 
          file: 'Male_spritesheet_death_1.png', 
          loop: false, 
          effects: { fade: true, shake: 'heavy' }
        }
      },
      
      // Enemy animations
      enemy: {
        idle: { 
          frames: 2, 
          speed: 20, 
          file: 'Enemy_idle.png', 
          loop: true 
        },
        walk: { 
          frames: 4, 
          speed: 8, 
          file: 'Enemy_walk.png', 
          loop: true 
        },
        attack: { 
          frames: 3, 
          speed: 5, 
          file: 'Enemy_attack.png', 
          loop: false, 
          effects: { impact: true }
        },
        hurt: { 
          frames: 2, 
          speed: 6, 
          file: 'Enemy_hurt.png', 
          loop: false, 
          effects: { flash: 'white' }
        },
        death: { 
          frames: 3, 
          speed: 8, 
          file: 'Enemy_death.png', 
          loop: false, 
          effects: { fade: true }
        }
      }
    };
    
    // Visual effects for animations
    this.effects = {
      shadows: true,
      afterimages: true,
      particles: true,
      screenShake: true,
      colorFlash: true,
      scaleEffects: true
    };
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.eventBus.on('animation:play', this.playAnimation.bind(this));
    this.eventBus.on('animation:stop', this.stopAnimation.bind(this));
    this.eventBus.on('animation:queue', this.queueAnimation.bind(this));
    this.eventBus.on('animation:setEffect', this.setAnimationEffect.bind(this));
    this.eventBus.on('sprite:load', this.loadSprite.bind(this));
  }

  initialize() {
    console.log('🎬 Enhanced Sprite Animation System initialized');
    this.preloadSprites();
  }

  async preloadSprites() {
    // Preload common sprite sheets
    const commonSprites = [
      'Male_spritesheet_idle.png',
      'Male_spritesheet_run.png',
      'Male_spritesheet_run_jump.png',
      'Male_spritesheet_punch_1.png',
      'Male_spritesheet_punch_quad.png'
    ];

    for (const sprite of commonSprites) {
      await this.loadSprite({ name: sprite, path: `/assets/sprites/${sprite}` });
    }
  }

  async loadSprite(data) {
    const { name, path } = data;
    
    if (this.loadedSprites.has(name)) {
      return this.loadedSprites.get(name);
    }

    try {
      const img = new Image();
      img.src = path;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      this.loadedSprites.set(name, img);
      console.log(`🖼️ Sprite loaded: ${name}`);
      return img;
    } catch (error) {
      console.warn(`Failed to load sprite: ${name}`, error);
      return this.createFallbackSprite(name);
    }
  }

  createFallbackSprite(name) {
    // Create a simple colored rectangle as fallback
    const canvas = document.createElement('canvas');
    canvas.width = this.spriteConfigs.frameWidth;
    canvas.height = this.spriteConfigs.frameHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = this.getFallbackColor(name);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    this.loadedSprites.set(name, canvas);
    return canvas;
  }

  getFallbackColor(name) {
    if (name.includes('Male') || name.includes('player')) return '#00ff88';
    if (name.includes('Enemy')) return '#ff6b6b';
    return '#ffffff';
  }

  initializeEntityAnimation(entityId, entityType) {
    const animationState = {
      entityType,
      currentAnimation: 'idle',
      frame: 0,
      frameTime: 0,
      playing: true,
      loop: true,
      queue: [],
      effects: {
        position: { x: 0, y: 0 },
        scale: { x: 1, y: 1 },
        rotation: 0,
        alpha: 1,
        tint: { r: 255, g: 255, b: 255 },
        glow: { enabled: false, color: '#ffffff', intensity: 0 },
        afterimage: { enabled: false, positions: [], maxLength: 5 },
        shake: { enabled: false, intensity: 0, duration: 0 }
      },
      transitions: {
        enabled: false,
        from: null,
        to: null,
        progress: 0,
        duration: 200
      }
    };

    this.animationStates.set(entityId, animationState);
    
    // Add animation component to entity
    this.entityManager.addComponent(entityId, 'spriteAnimation', {
      entityType,
      currentAnimation: 'idle',
      frame: 0,
      playing: true,
      effects: animationState.effects
    });

    return animationState;
  }

  playAnimation(data) {
    const { entityId, animation, options = {} } = data;
    const state = this.animationStates.get(entityId);
    
    if (!state) {
      console.warn(`Animation state not found for entity: ${entityId}`);
      return;
    }

    const animConfig = this.animations[state.entityType]?.[animation];
    if (!animConfig) {
      console.warn(`Animation not found: ${state.entityType}.${animation}`);
      return;
    }

    // Handle animation transitions
    if (options.transition && state.currentAnimation !== animation) {
      this.startTransition(entityId, state.currentAnimation, animation, options.transition);
    } else {
      this.setAnimation(entityId, animation, options);
    }

    // Trigger animation effects
    if (animConfig.effects) {
      this.applyAnimationEffects(entityId, animConfig.effects);
    }

    console.log(`🎬 Playing animation: ${state.entityType}.${animation}`);
  }

  setAnimation(entityId, animation, options = {}) {
    const state = this.animationStates.get(entityId);
    if (!state) return;

    const animConfig = this.animations[state.entityType]?.[animation];
    if (!animConfig) return;

    state.currentAnimation = animation;
    state.frame = 0;
    state.frameTime = 0;
    state.playing = true;
    state.loop = options.loop !== undefined ? options.loop : animConfig.loop;

    // Update entity component
    const component = this.entityManager.getComponent(entityId, 'spriteAnimation');
    if (component) {
      component.currentAnimation = animation;
      component.frame = 0;
      component.playing = true;
    }
  }

  startTransition(entityId, fromAnim, toAnim, duration = 200) {
    const state = this.animationStates.get(entityId);
    if (!state) return;

    state.transitions = {
      enabled: true,
      from: fromAnim,
      to: toAnim,
      progress: 0,
      duration
    };
  }

  queueAnimation(data) {
    const { entityId, animation, options = {} } = data;
    const state = this.animationStates.get(entityId);
    
    if (!state) return;

    state.queue.push({ animation, options });
  }

  stopAnimation(data) {
    const { entityId } = data;
    const state = this.animationStates.get(entityId);
    
    if (!state) return;

    state.playing = false;
    
    const component = this.entityManager.getComponent(entityId, 'spriteAnimation');
    if (component) {
      component.playing = false;
    }
  }

  update(deltaTime) {
    for (const [entityId, state] of this.animationStates) {
      if (!state.playing && state.queue.length === 0) continue;

      this.updateAnimation(entityId, state, deltaTime);
      this.updateEffects(entityId, state, deltaTime);
      this.updateTransitions(entityId, state, deltaTime);
    }
  }

  updateAnimation(entityId, state, deltaTime) {
    const animConfig = this.animations[state.entityType]?.[state.currentAnimation];
    if (!animConfig) return;

    if (state.playing) {
      state.frameTime += deltaTime;

      if (state.frameTime >= animConfig.speed * 16.67) { // Convert to ms
        state.frameTime = 0;
        state.frame++;

        if (state.frame >= animConfig.frames) {
          if (state.loop) {
            state.frame = 0;
          } else {
            state.frame = animConfig.frames - 1;
            state.playing = false;
            
            // Process queue
            this.processAnimationQueue(entityId, state);
            
            // Trigger animation complete event
            this.eventBus.emit('animation:complete', {
              entityId,
              animation: state.currentAnimation
            });
          }
        }

        // Update component
        const component = this.entityManager.getComponent(entityId, 'spriteAnimation');
        if (component) {
          component.frame = state.frame;
          component.playing = state.playing;
        }
      }
    }
  }

  processAnimationQueue(entityId, state) {
    if (state.queue.length > 0) {
      const next = state.queue.shift();
      this.setAnimation(entityId, next.animation, next.options);
    }
  }

  updateEffects(entityId, state, deltaTime) {
    const effects = state.effects;

    // Update shake effect
    if (effects.shake.enabled) {
      effects.shake.duration -= deltaTime;
      if (effects.shake.duration <= 0) {
        effects.shake.enabled = false;
        effects.position.x = 0;
        effects.position.y = 0;
      } else {
        const intensity = effects.shake.intensity;
        effects.position.x = (Math.random() - 0.5) * intensity;
        effects.position.y = (Math.random() - 0.5) * intensity;
      }
    }

    // Update afterimage effect
    if (effects.afterimage.enabled) {
      const entity = this.entityManager.getEntity(entityId);
      if (entity) {
        effects.afterimage.positions.push({
          x: entity.transform.x,
          y: entity.transform.y,
          alpha: 0.6,
          timestamp: Date.now()
        });

        // Remove old positions
        const maxAge = 500; // ms
        const now = Date.now();
        effects.afterimage.positions = effects.afterimage.positions.filter(
          pos => now - pos.timestamp < maxAge
        );

        if (effects.afterimage.positions.length > effects.afterimage.maxLength) {
          effects.afterimage.positions.shift();
        }
      }
    }

    // Update glow effect
    if (effects.glow.enabled) {
      effects.glow.intensity = 0.5 + Math.sin(Date.now() * 0.005) * 0.3;
    }
  }

  updateTransitions(entityId, state, deltaTime) {
    if (!state.transitions.enabled) return;

    state.transitions.progress += deltaTime;
    
    if (state.transitions.progress >= state.transitions.duration) {
      // Complete transition
      this.setAnimation(entityId, state.transitions.to);
      state.transitions.enabled = false;
    }
  }

  applyAnimationEffects(entityId, effects) {
    const state = this.animationStates.get(entityId);
    if (!state) return;

    // Apply visual effects based on animation config
    if (effects.shake) {
      const intensity = typeof effects.shake === 'string' 
        ? (effects.shake === 'heavy' ? 8 : effects.shake === 'light' ? 3 : 5)
        : 5;
      
      state.effects.shake = {
        enabled: true,
        intensity,
        duration: 300
      };

      // Also trigger screen shake
      const visualEffects = this.engine.getSystem('visualEffects');
      if (visualEffects) {
        visualEffects.triggerScreenShake({
          intensity: intensity * 0.5,
          duration: 200
        });
      }
    }

    if (effects.afterimage) {
      state.effects.afterimage.enabled = true;
    }

    if (effects.glow) {
      state.effects.glow = {
        enabled: true,
        color: effects.glow === 'soft' ? '#ffffff' : '#00ff88',
        intensity: 0.5
      };
    }

    if (effects.flash) {
      // Trigger screen flash
      const visualEffects = this.engine.getSystem('visualEffects');
      if (visualEffects) {
        const color = effects.flash === 'red' ? '#ff4757' : 
                     effects.flash === 'white' ? '#ffffff' : effects.flash;
        
        visualEffects.triggerScreenFlash({
          color,
          intensity: 0.3,
          duration: 150
        });
      }
    }

    if (effects.impact) {
      // Create impact particles
      const entity = this.entityManager.getEntity(entityId);
      if (entity) {
        const visualEffects = this.engine.getSystem('visualEffects');
        if (visualEffects) {
          visualEffects.createImpactEffect({
            x: entity.transform.x + entity.transform.width / 2,
            y: entity.transform.y + entity.transform.height / 2,
            intensity: 1.2
          });
        }
      }
    }
  }

  render(ctx) {
    for (const [entityId, state] of this.animationStates) {
      this.renderEntityAnimation(ctx, entityId, state);
    }
  }

  renderEntityAnimation(ctx, entityId, state) {
    const entity = this.entityManager.getEntity(entityId);
    if (!entity) return;

    const animConfig = this.animations[state.entityType]?.[state.currentAnimation];
    if (!animConfig) return;

    const sprite = this.loadedSprites.get(animConfig.file);
    if (!sprite) return;

    ctx.save();

    // Apply camera transform
    const visualEffects = this.engine.getSystem('visualEffects');
    const cameraPos = visualEffects?.getCameraPosition() || { x: 0, y: 0 };

    // Calculate render position
    const renderX = entity.transform.x - cameraPos.x + state.effects.position.x;
    const renderY = entity.transform.y - cameraPos.y + state.effects.position.y;

    // Render afterimages
    if (state.effects.afterimage.enabled) {
      this.renderAfterimages(ctx, state.effects.afterimage, animConfig, sprite, state.frame, cameraPos);
    }

    // Apply effects
    ctx.globalAlpha = state.effects.alpha;

    if (state.effects.glow.enabled) {
      ctx.shadowColor = state.effects.glow.color;
      ctx.shadowBlur = 20 * state.effects.glow.intensity;
    }

    // Render shadow
    if (this.spriteConfigs.shadowEnabled) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#000000';
      ctx.fillRect(
        renderX + 5,
        renderY + entity.transform.height + 3,
        entity.transform.width,
        8
      );
      ctx.restore();
    }

    // Calculate sprite source position
    const frameX = (state.frame % (sprite.width / this.spriteConfigs.frameWidth)) * this.spriteConfigs.frameWidth;
    const frameY = Math.floor(state.frame / (sprite.width / this.spriteConfigs.frameWidth)) * this.spriteConfigs.frameHeight;

    // Render sprite
    if (sprite instanceof HTMLCanvasElement) {
      // Fallback sprite
      ctx.fillStyle = this.getFallbackColor(animConfig.file);
      ctx.fillRect(renderX, renderY, entity.transform.width, entity.transform.height);
    } else {
      // Actual sprite
      ctx.drawImage(
        sprite,
        frameX, frameY,
        this.spriteConfigs.frameWidth, this.spriteConfigs.frameHeight,
        renderX, renderY,
        entity.transform.width, entity.transform.height
      );
    }

    ctx.restore();
  }

  renderAfterimages(ctx, afterimageData, animConfig, sprite, currentFrame, cameraPos) {
    afterimageData.positions.forEach((pos, index) => {
      const alpha = (index / afterimageData.positions.length) * 0.4;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      
      const renderX = pos.x - cameraPos.x;
      const renderY = pos.y - cameraPos.y;
      
      if (sprite instanceof HTMLCanvasElement) {
        ctx.fillStyle = this.getFallbackColor(animConfig.file);
        ctx.fillRect(renderX, renderY, 40, 60);
      } else {
        const frameX = (currentFrame % (sprite.width / this.spriteConfigs.frameWidth)) * this.spriteConfigs.frameWidth;
        const frameY = Math.floor(currentFrame / (sprite.width / this.spriteConfigs.frameWidth)) * this.spriteConfigs.frameHeight;
        
        ctx.drawImage(
          sprite,
          frameX, frameY,
          this.spriteConfigs.frameWidth, this.spriteConfigs.frameHeight,
          renderX, renderY,
          40, 60
        );
      }
      
      ctx.restore();
    });
  }

  // Utility methods
  getAnimationState(entityId) {
    return this.animationStates.get(entityId);
  }

  isAnimationPlaying(entityId, animation) {
    const state = this.animationStates.get(entityId);
    return state && state.currentAnimation === animation && state.playing;
  }

  setAnimationEffect(data) {
    const { entityId, effect, value } = data;
    const state = this.animationStates.get(entityId);
    
    if (!state) return;

    switch (effect) {
      case 'glow':
        state.effects.glow = { enabled: true, color: value.color || '#ffffff', intensity: value.intensity || 0.5 };
        break;
      case 'afterimage':
        state.effects.afterimage.enabled = value;
        break;
      case 'alpha':
        state.effects.alpha = value;
        break;
    }
  }

  cleanup() {
    this.animationStates.clear();
    this.loadedSprites.clear();
    this.animationQueues.clear();
  }
}

export default EnhancedSpriteAnimationSystem;