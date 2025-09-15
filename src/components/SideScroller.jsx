import React, { useRef, useEffect, useState } from 'react';

const PLAYER_SPEED = 5;
const JUMP_POWER = 12;
const GRAVITY = 0.7;
const GROUND_Y = 420; // Updated for 500px height canvas
const CHARACTER_WIDTH = 120; // Reduced from 200 for smaller collision boxes
const CHARACTER_HEIGHT = 140; // Reduced from 200 for smaller collision boxes

// Enhanced Sprite animation configuration with improved timing and effects
const SPRITE_CONFIG = {
  frameWidth: 48,  // Width of each frame in the spritesheet
  frameHeight: 48, // Height of each frame in the spritesheet
  renderScale: 2.5,  // Increased scale for better visibility
  smoothing: true,   // Enable smooth animation transitions
  shadowEnabled: true, // Enable sprite shadows
  animations: {
    // Basic Movement
    idle: { frames: 4, speed: 15, file: 'Male_spritesheet_idle.png', loop: true, bounce: true },
    run: { frames: 6, speed: 6, file: 'Male_spritesheet_run.png', loop: true, intensity: 'high', trail: 'speed' },
    run_back: { frames: 6, speed: 6, file: 'Male_spritesheet_run_back.png', loop: true, intensity: 'medium' },
    jump: { frames: 3, speed: 4, file: 'Male_spritesheet_run_jump.png', loop: false, easing: 'ease-out', glow: 'soft' },
    wall_jump: { frames: 4, speed: 4, file: 'Male_spritesheet_wall_jump.png', loop: false, trail: true, glow: 'energy' },
    
    // Combat - Punches
    punch1: { frames: 4, speed: 3, file: 'Male_spritesheet_punch_1.png', loop: false, impact: true, shake: true },
    punch2: { frames: 4, speed: 3, file: 'Male_spritesheet_punch_2.png', loop: false, impact: true, shake: true },
    punch3: { frames: 4, speed: 3, file: 'Male_spritesheet_punch_3.png', loop: false, impact: true, shake: 'heavy', screenFlash: 'white' },
    punch_quad: { frames: 4, speed: 2, file: 'Male_spritesheet_punch_quad.png', loop: false, impact: true, shake: 'heavy', trail: true, glow: 'power', afterimage: true },
    punch_straight: { frames: 4, speed: 3, file: 'Male_spritesheet_punch_straight.png', loop: false, impact: true, shake: true, blur: 'motion' },
    
    // Combat - Kicks  
    kick: { frames: 4, speed: 3, file: 'Male_spritesheet_kick_high.png', loop: false, impact: true, shake: true, aura: 'combat' },
    kick_low: { frames: 4, speed: 3, file: 'Male_spritesheet_kick_low.png', loop: false, impact: true },
    kick_spin: { frames: 6, speed: 2, file: 'Male_spritesheet_kick_spin_high.png', loop: false, impact: true, shake: 'heavy', trail: true, glow: 'energy', blur: 'spin', afterimage: true, distortion: 'spin' },
    
    // Defensive Moves
    dodge: { frames: 3, speed: 3, file: 'Male_spritesheet_dodge_back.png', loop: false, blur: true, fade: 'quick' },
    dodge_fwd: { frames: 4, speed: 4, file: 'Male_spritesheet_dodge_fwd.png', loop: false, blur: true, trail: 'dash' },
    dodge_roll: { frames: 6, speed: 3, file: 'Male_spritesheet_dodge_roll.png', loop: false, blur: 'heavy', trail: true },
    
    // Environmental States
    falling: { frames: 2, speed: 12, file: 'Male_spritesheet_falling_idle.png', loop: true, sway: true },
    landing: { frames: 3, speed: 4, file: 'Male_spritesheet_falling_landing.png', loop: false, impact: true, dust: true, shake: 'light' },
    crouch: { frames: 3, speed: 8, file: 'Male_spritesheet_crouch_idle.png', loop: true },
    crouch_walk: { frames: 4, speed: 8, file: 'Male_spritesheet_crouch_walk.png', loop: true },
    
    // Death States
    death: { frames: 4, speed: 10, file: 'Male_spritesheet_death_1.png', loop: false, fade: true, shake: 'heavy' },
    death_2: { frames: 6, speed: 8, file: 'Male_spritesheet_death_2.png', loop: false, fade: 'slow', tint: 'dark' },
    
    // Special Interactions
    interact: { frames: 4, speed: 6, file: 'Male_spritesheet_interact.png', loop: false, glow: true, bounce: 'soft' },
    find_item: { frames: 4, speed: 8, file: 'Male_spritesheet_find_item.png', loop: false, glow: 'treasure', bounce: true },
    push: { frames: 4, speed: 6, file: 'Male_spritesheet_push.png', loop: true, shake: 'light' },
    pull_heavy: { frames: 4, speed: 6, file: 'Male_spritesheet_pull_heavy.png', loop: true, shake: 'medium' },
    
    // Climbing & Hanging
    climb_rope: { frames: 6, speed: 8, file: 'Male_spritesheet_climb_rope.png', loop: true },
    rope_hang: { frames: 2, speed: 15, file: 'Male_spritesheet_rope_hang.png', loop: true, sway: true },
    wall_hang: { frames: 2, speed: 15, file: 'Male_spritesheet_wall_hang.png', loop: true },
    edge_hang: { frames: 2, speed: 15, file: 'Male_spritesheet_edge_hang.png', loop: true, sway: 'light' }
  }
};

// Enhanced Sprite Animation Class with Visual Effects
class SpriteAnimation {
  constructor(imagePath, config, onLoad) {
    this.image = new Image();
    this.image.src = imagePath;
    this.config = config;
    this.currentFrame = 0;
    this.frameCounter = 0;
    this.currentAnimation = 'idle';
    this.previousAnimation = null;
    this.animationComplete = false;
    this.loaded = false;
    this.onLoad = onLoad;
    this.loadedImages = new Map(); // Cache for different animation images
    
    // Enhanced visual effects
    this.effects = {
      shadow: { enabled: true, offsetX: 2, offsetY: 2, blur: 4, alpha: 0.3 },
      glow: { enabled: true, color: '#ffffff', blur: 15, alpha: 0.4 },
      shake: { enabled: false, intensity: 0, duration: 0, timer: 0 },
      bounce: { enabled: false, amplitude: 2, frequency: 0.1, offset: 0 },
      trail: { enabled: false, positions: [], maxLength: 5, fadeRate: 0.2 },
      fade: { enabled: false, alpha: 1.0, fadeSpeed: 0.02, rate: 0.1 },
      blur: { enabled: false, amount: 0 },
      scale: { current: 1.0, target: 1.0, speed: 0.1 },
      rotation: { current: 0, target: 0, speed: 0.1 },
      tint: { enabled: false, color: '#ffffff', intensity: 0 },
      
      // New advanced effects
      afterimage: { enabled: false, positions: [], maxLength: 3, opacity: 0.3 },
      screenFlash: { enabled: false, color: '#ffffff', intensity: 0, duration: 0 },
      aura: { enabled: true, color: '#00ffff', radius: 60, pulse: true, intensity: 0.3 },
      distortion: { enabled: false, amount: 0, type: 'wave' }
    };
    
    // Animation timing enhancements with transition system
    this.timing = {
      frameInterpolation: 0,
      easingFunction: 'linear',
      transitionSpeed: 0.15,
      
      // Animation transition system
      transitionActive: false,
      transitionProgress: 0,
      transitionDuration: 0.3,
      previousAnimation: null,
      previousFrame: 0,
      blendMode: 'crossfade'
    };
    
    this.image.onload = () => {
      this.loaded = true;
      this.loadedImages.set('idle', this.image);
      console.log('Base sprite loaded successfully:', imagePath);
      if (this.onLoad) this.onLoad();
    };
    
    this.image.onerror = () => {
      console.error('Failed to load sprite:', imagePath);
    };
  }
  
  setAnimation(animationName, forceRestart = false, enableTransition = true) {
    if (this.currentAnimation !== animationName || forceRestart) {
      // Store previous animation data for smooth transitions
      if (enableTransition && this.currentAnimation !== animationName) {
        this.timing.previousAnimation = this.currentAnimation;
        this.timing.previousFrame = this.currentFrame;
        this.timing.transitionActive = true;
        this.timing.transitionProgress = 0;
      }
      
      this.previousAnimation = this.currentAnimation;
      this.currentAnimation = animationName;
      this.currentFrame = 0;
      this.frameCounter = 0;
      this.animationComplete = false;
      
      // Apply animation-specific effects
      this.applyAnimationEffects(animationName);
      
      // Load the specific animation image if not already loaded
      this.loadAnimationImage(animationName);
      
      console.log(`🎭 Animation changed: ${this.previousAnimation} → ${animationName}${this.timing.transitionActive ? ' (with transition)' : ''}`);
    }
  }
  
  applyAnimationEffects(animationName) {
    const anim = this.config.animations[animationName];
    if (!anim) return;
    
    // Reset all effects
    this.resetEffects();
    
    // Apply specific effects based on animation properties
    if (anim.bounce) {
      this.effects.bounce.enabled = true;
    }
    
    if (anim.shake) {
      this.effects.shake.enabled = true;
      this.effects.shake.intensity = anim.shake === 'heavy' ? 3 : 1;
      this.effects.shake.duration = 15;
      this.effects.shake.timer = this.effects.shake.duration;
    }
    
    if (anim.trail) {
      this.effects.trail.enabled = true;
      this.effects.trail.positions = [];
      
      // Enhanced trail types
      switch (anim.trail) {
        case 'speed':
          this.effects.trail.maxLength = 8;
          this.effects.trail.fadeRate = 0.15;
          break;
        case 'dash':
          this.effects.trail.maxLength = 12;
          this.effects.trail.fadeRate = 0.2;
          break;
        case 'spin':
          this.effects.trail.maxLength = 15;
          this.effects.trail.fadeRate = 0.1;
          break;
        case true:
        default:
          this.effects.trail.maxLength = 5;
          this.effects.trail.fadeRate = 0.2;
          break;
      }
    }
    
    if (anim.glow) {
      this.effects.glow.enabled = true;
      
      // Enhanced glow types with different colors and intensities
      switch (anim.glow) {
        case 'soft':
          this.effects.glow.color = '#87ceeb';
          this.effects.glow.blur = 8;
          this.effects.glow.alpha = 0.4;
          break;
        case 'energy':
          this.effects.glow.color = '#00ffff';
          this.effects.glow.blur = 12;
          this.effects.glow.alpha = 0.7;
          break;
        case 'power':
          this.effects.glow.color = '#ff4500';
          this.effects.glow.blur = 15;
          this.effects.glow.alpha = 0.8;
          break;
        case 'treasure':
          this.effects.glow.color = '#ffd700';
          this.effects.glow.blur = 10;
          this.effects.glow.alpha = 0.6;
          break;
        case true:
        default:
          this.effects.glow.color = anim.glowColor || '#4facfe';
          this.effects.glow.blur = 10;
          this.effects.glow.alpha = 0.6;
          break;
      }
    }
    
    if (anim.blur) {
      this.effects.blur.enabled = true;
      
      // Enhanced blur types  
      switch (anim.blur) {
        case 'motion':
          this.effects.blur.amount = 3;
          break;
        case 'spin':
          this.effects.blur.amount = 4;
          break;
        case 'heavy':
          this.effects.blur.amount = 5;
          break;
        case true:
        default:
          this.effects.blur.amount = 2;
          break;
      }
    }
    
    if (anim.fade) {
      this.effects.fade.enabled = true;
      this.effects.fade.alpha = 1.0;
      
      // Enhanced fade types
      switch (anim.fade) {
        case 'quick':
          this.effects.fade.rate = 0.15;
          break;
        case 'slow':
          this.effects.fade.rate = 0.05;
          break;
        case true:
        default:
          this.effects.fade.rate = 0.1;
          break;
      }
    }
    
    if (anim.bounce) {
      this.effects.bounce.enabled = true;
      
      // Enhanced bounce types
      switch (anim.bounce) {
        case 'soft':
          this.effects.bounce.amount = 0.05;
          this.effects.bounce.speed = 0.15;
          break;
        case true:
        default:
          this.effects.bounce.amount = 0.1;
          this.effects.bounce.speed = 0.2;
          break;
      }
    }
    
    if (anim.afterimage) {
      this.effects.afterimage.enabled = true;
      this.effects.afterimage.positions = [];
      this.effects.afterimage.maxLength = 3;
      this.effects.afterimage.opacity = 0.3;
    }
    
    if (anim.screenFlash) {
      this.effects.screenFlash.enabled = true;
      switch (anim.screenFlash) {
        case 'white':
          this.effects.screenFlash.color = '#ffffff';
          this.effects.screenFlash.intensity = 0.8;
          break;
        case 'red':
          this.effects.screenFlash.color = '#ff0000';
          this.effects.screenFlash.intensity = 0.6;
          break;
        default:
          this.effects.screenFlash.color = '#ffffff';
          this.effects.screenFlash.intensity = 0.5;
          break;
      }
      this.effects.screenFlash.duration = 0.2;
    }
    
    if (anim.aura) {
      this.effects.aura.enabled = true;
      switch (anim.aura) {
        case 'combat':
          this.effects.aura.color = '#ff4500';
          this.effects.aura.radius = 40;
          break;
        case 'energy':
          this.effects.aura.color = '#00ffff';
          this.effects.aura.radius = 60;
          break;
        default:
          this.effects.aura.color = '#ffffff';
          this.effects.aura.radius = 50;
          break;
      }
    }
    
    if (anim.distortion) {
      this.effects.distortion.enabled = true;
      switch (anim.distortion) {
        case 'spin':
          this.effects.distortion.type = 'spin';
          this.effects.distortion.amount = 2;
          break;
        case 'wave':
          this.effects.distortion.type = 'wave';
          this.effects.distortion.amount = 1;
          break;
        default:
          this.effects.distortion.amount = 1;
          break;
      }
    }
    
    if (anim.intensity === 'high') {
      this.effects.scale.target = 1.1;
    }
  }
  
  resetEffects() {
    this.effects.shake.enabled = false;
    this.effects.bounce.enabled = false;
    this.effects.trail.enabled = false;
    this.effects.glow.enabled = false;
    this.effects.blur.enabled = false;
    this.effects.fade.enabled = false;
    this.effects.scale.target = 1.0;
    this.effects.rotation.target = 0;
    
    // Reset new advanced effects
    this.effects.afterimage.enabled = false;
    this.effects.screenFlash.enabled = false;
    this.effects.aura.enabled = false;
    this.effects.distortion.enabled = false;
  }
  
  loadAnimationImage(animationName) {
    const anim = this.config.animations[animationName];
    if (!anim || this.loadedImages.has(animationName)) return;
    
    const fullPath = `/assets/sprites/SplitAnimations/${anim.file}`;
    console.log(`🔄 Loading animation image: ${animationName} from ${fullPath}`);
    
    const img = new Image();
    img.src = fullPath;
    img.onload = () => {
      this.loadedImages.set(animationName, img);
      console.log(`✅ Animation image loaded successfully: ${animationName} (${img.naturalWidth}x${img.naturalHeight})`);
    };
    img.onerror = (error) => {
      console.error(`❌ Failed to load animation: ${animationName} from ${fullPath}`, error);
      console.error('Check if file exists at:', fullPath);
    };
  }
  
  update() {
    if (!this.loaded) return;
    
    const anim = this.config.animations[this.currentAnimation];
    if (!anim) return;
    
    // Update visual effects
    this.updateEffects();
    
    // Skip frame updates if animation is complete and not looping
    if (this.animationComplete && !anim.loop) return;
    
    this.frameCounter++;
    if (this.frameCounter >= anim.speed) {
      this.currentFrame++;
      this.frameCounter = 0;
      
      // Trigger sprite-based particles on frame updates
      if (this.particleCallback && this.lastX !== undefined && this.lastY !== undefined) {
        this.triggerParticles(this.particleCallback, this.lastX, this.lastY);
      }
      
      // Handle animation completion
      if (this.currentFrame >= anim.frames) {
        if (anim.loop) {
          this.currentFrame = 0; // Loop back to start
        } else {
          this.currentFrame = anim.frames - 1; // Stay on last frame
          this.animationComplete = true;
          // Auto-return to idle for non-looping animations with smooth transition
          setTimeout(() => {
            if (!anim.loop && this.currentAnimation !== 'idle' && this.currentAnimation !== 'death') {
              this.setAnimation('idle');
            }
          }, 200);
        }
      }
    }
    
    // Update frame interpolation for smoother animations
    if (this.config.smoothing) {
      this.timing.frameInterpolation = this.frameCounter / anim.speed;
    }
  }
  
  updateEffects() {
    // Update shake effect
    if (this.effects.shake.enabled) {
      this.effects.shake.timer--;
      if (this.effects.shake.timer <= 0) {
        this.effects.shake.enabled = false;
      }
    }
    
    // Update bounce effect
    if (this.effects.bounce.enabled) {
      this.effects.bounce.offset += this.effects.bounce.frequency;
    }
    
    // Update scale animation
    this.effects.scale.current += (this.effects.scale.target - this.effects.scale.current) * this.effects.scale.speed;
    
    // Update rotation animation
    this.effects.rotation.current += (this.effects.rotation.target - this.effects.rotation.current) * this.effects.rotation.speed;
    
    // Update fade effect
    if (this.effects.fade.enabled) {
      this.effects.fade.alpha -= this.effects.fade.fadeSpeed;
      if (this.effects.fade.alpha <= 0) {
        this.effects.fade.alpha = 0;
        this.effects.fade.enabled = false;
      }
    }
    
    // Update trail effect
    if (this.effects.trail.enabled) {
      // Trail positions will be updated in draw method
    }
    
    // Update afterimage effect
    if (this.effects.afterimage.enabled) {
      // Afterimage positions will be updated in draw method similar to trails
    }
    
    // Update screen flash effect
    if (this.effects.screenFlash.enabled) {
      this.effects.screenFlash.duration -= 0.016; // Assuming 60fps
      if (this.effects.screenFlash.duration <= 0) {
        this.effects.screenFlash.enabled = false;
      }
    }
    
    // Update aura effect (pulse animation handled in draw)
    if (this.effects.aura.enabled) {
      // Aura pulse is handled in draw method using time-based calculation
    }
    
    // Update distortion effect
    if (this.effects.distortion.enabled) {
      // Distortion effects will be applied during rendering
    }
    
    // Update animation transitions
    if (this.timing.transitionActive) {
      this.timing.transitionProgress += 1 / (this.timing.transitionDuration * 60); // Assuming 60fps
      if (this.timing.transitionProgress >= 1) {
        this.timing.transitionActive = false;
        this.timing.transitionProgress = 1;
        this.timing.previousAnimation = null;
      }
    }
  }
  
  isAnimationComplete() {
    return this.animationComplete;
  }
  
  draw(ctx, x, y, flipX = false) {
    // Store position for particle triggering
    this.lastX = x;
    this.lastY = y;
    
    const currentImage = this.loadedImages.get(this.currentAnimation) || this.image;
    
    // Enhanced debugging for sprite drawing issues
    if (!currentImage || !currentImage.complete || currentImage.naturalWidth === 0) {
      console.log('🐛 Sprite draw fallback triggered:', {
        currentAnimation: this.currentAnimation,
        hasCurrentImage: !!currentImage,
        imageComplete: currentImage?.complete,
        naturalWidth: currentImage?.naturalWidth,
        loadedImagesKeys: Array.from(this.loadedImages.keys()),
        hasBaseImage: !!this.image
      });
      this.drawFallback(ctx, x, y);
      return;
    }
    
    const anim = this.config.animations[this.currentAnimation];
    if (!anim) {
      this.drawFallback(ctx, x, y);
      return;
    }
    
    const frameWidth = this.config.frameWidth;
    const frameHeight = this.config.frameHeight;
    const baseScale = this.config.renderScale;
    const effectScale = this.effects.scale.current;
    const finalScale = baseScale * effectScale;
    const renderWidth = frameWidth * finalScale;
    const renderHeight = frameHeight * finalScale;
    
    // Calculate position with effects
    let effectX = x;
    let effectY = y;
    
    // Apply shake effect
    if (this.effects.shake.enabled) {
      effectX += (Math.random() - 0.5) * this.effects.shake.intensity * 2;
      effectY += (Math.random() - 0.5) * this.effects.shake.intensity * 2;
    }
    
    // Apply bounce effect
    if (this.effects.bounce.enabled) {
      effectY += Math.sin(this.effects.bounce.offset) * this.effects.bounce.amplitude;
    }
    
    // Update trail positions
    if (this.effects.trail.enabled) {
      this.effects.trail.positions.push({ x: effectX, y: effectY, alpha: 1.0 });
      if (this.effects.trail.positions.length > this.effects.trail.maxLength) {
        this.effects.trail.positions.shift();
      }
      // Fade trail positions using enhanced fade rate
      this.effects.trail.positions.forEach((pos, index) => {
        const baseAlpha = (index + 1) / this.effects.trail.positions.length;
        pos.alpha = baseAlpha * (1 - this.effects.trail.fadeRate);
      });
    }
    
    // Update afterimage positions
    if (this.effects.afterimage.enabled) {
      // Only add new position every few frames to create distinct afterimages
      if (this.frameTimer % 3 === 0) {
        this.effects.afterimage.positions.push({ 
          x: effectX, 
          y: effectY, 
          frame: this.currentFrame,
          alpha: this.effects.afterimage.opacity 
        });
        if (this.effects.afterimage.positions.length > this.effects.afterimage.maxLength) {
          this.effects.afterimage.positions.shift();
        }
      }
    }
    
    // Calculate source coordinates for current frame
    const sourceX = this.currentFrame * frameWidth;
    const sourceY = 0;
    
    ctx.save();
    
    // Set global alpha for fade effect
    if (this.effects.fade.enabled) {
      ctx.globalAlpha = this.effects.fade.alpha;
    }
    
    // Apply blur effect
    if (this.effects.blur.enabled) {
      ctx.filter = `blur(${this.effects.blur.amount}px)`;
    }
    
    // Handle flipping
    if (flipX) {
      ctx.scale(-1, 1);
      effectX = -effectX - renderWidth;
    }
    
    // Apply rotation
    if (this.effects.rotation.current !== 0) {
      ctx.translate(effectX + renderWidth/2, effectY - renderHeight/2);
      ctx.rotate(this.effects.rotation.current);
      ctx.translate(-renderWidth/2, renderHeight/2);
      effectX = -renderWidth/2;
      effectY = renderHeight/2;
    }
    
    try {
      // Draw trail effect
      if (this.effects.trail.enabled) {
        this.effects.trail.positions.forEach((pos, index) => {
          if (index < this.effects.trail.positions.length - 1) {
            ctx.save();
            ctx.globalAlpha = pos.alpha;
            ctx.drawImage(
              currentImage,
              sourceX, sourceY, frameWidth, frameHeight,
              pos.x, pos.y - renderHeight, renderWidth, renderHeight
            );
            ctx.restore();
          }
        });
      }
      
      // Draw shadow
      if (this.config.shadowEnabled && this.effects.shadow.enabled) {
        ctx.save();
        ctx.globalAlpha = this.effects.shadow.alpha;
        ctx.filter = `blur(${this.effects.shadow.blur}px)`;
        ctx.drawImage(
          currentImage,
          sourceX, sourceY, frameWidth, frameHeight,
          effectX + this.effects.shadow.offsetX, effectY - renderHeight + this.effects.shadow.offsetY,
          renderWidth, renderHeight
        );
        ctx.restore();
      }
      
      // Draw glow effect
      if (this.effects.glow.enabled) {
        ctx.save();
        ctx.globalAlpha = this.effects.glow.alpha;
        ctx.shadowColor = this.effects.glow.color;
        ctx.shadowBlur = this.effects.glow.blur;
        ctx.drawImage(
          currentImage,
          sourceX, sourceY, frameWidth, frameHeight,
          effectX, effectY - renderHeight, renderWidth, renderHeight
        );
        ctx.restore();
      }
      
      // Draw afterimage effect
      if (this.effects.afterimage.enabled) {
        this.effects.afterimage.positions.forEach((pos, index) => {
          if (index < this.effects.afterimage.positions.length - 1) {
            ctx.save();
            ctx.globalAlpha = this.effects.afterimage.opacity * (index + 1) / this.effects.afterimage.positions.length;
            ctx.filter = 'blur(1px)';
            ctx.drawImage(
              currentImage,
              sourceX, sourceY, frameWidth, frameHeight,
              pos.x, pos.y - renderHeight, renderWidth, renderHeight
            );
            ctx.restore();
          }
        });
      }
      
      // Draw aura effect
      if (this.effects.aura.enabled) {
        ctx.save();
        const pulseIntensity = this.effects.aura.pulse ? 
          0.5 + 0.5 * Math.sin(Date.now() * 0.01) : 1;
        const gradient = ctx.createRadialGradient(
          effectX + renderWidth/2, effectY - renderHeight/2, 0,
          effectX + renderWidth/2, effectY - renderHeight/2, this.effects.aura.radius
        );
        gradient.addColorStop(0, this.effects.aura.color + Math.floor(this.effects.aura.intensity * pulseIntensity * 255).toString(16).padStart(2, '0'));
        gradient.addColorStop(1, this.effects.aura.color + '00');
        ctx.fillStyle = gradient;
        ctx.fillRect(
          effectX - this.effects.aura.radius/2, 
          effectY - renderHeight - this.effects.aura.radius/2,
          renderWidth + this.effects.aura.radius,
          renderHeight + this.effects.aura.radius
        );
        ctx.restore();
      }
      
      // Draw main sprite with transition blending
      if (this.timing.transitionActive && this.timing.previousAnimation) {
        // Draw previous animation frame with decreasing alpha
        const previousImage = this.loadedImages.get(this.timing.previousAnimation);
        if (previousImage && previousImage.complete) {
          const prevAnim = this.config.animations[this.timing.previousAnimation];
          if (prevAnim) {
            ctx.save();
            ctx.globalAlpha = 1 - this.timing.transitionProgress;
            const prevSourceX = this.timing.previousFrame * frameWidth;
            ctx.drawImage(
              previousImage,
              prevSourceX, sourceY, frameWidth, frameHeight,
              effectX, effectY - renderHeight, renderWidth, renderHeight
            );
            ctx.restore();
          }
        }
        
        // Draw current animation frame with increasing alpha
        ctx.save();
        ctx.globalAlpha = this.timing.transitionProgress;
        ctx.drawImage(
          currentImage,
          sourceX, sourceY, frameWidth, frameHeight,
          effectX, effectY - renderHeight, renderWidth, renderHeight
        );
        ctx.restore();
      } else {
        // Normal drawing without transition
        ctx.drawImage(
          currentImage,
          sourceX, sourceY, frameWidth, frameHeight,
          effectX, effectY - renderHeight, renderWidth, renderHeight
        );
      }
      
      // Draw debug info
      if (window.DEBUG_SPRITES) {
        ctx.strokeStyle = this.effects.glow.enabled ? '#00ffff' : '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(effectX, effectY - renderHeight, renderWidth, renderHeight);
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`${this.currentAnimation}:${this.currentFrame}`, effectX, effectY + 25);
        
        // Show active effects with enhanced visibility
        const activeEffects = [];
        if (this.effects.shake.enabled) activeEffects.push(`SHAKE:${this.effects.shake.intensity}`);
        if (this.effects.bounce.enabled) activeEffects.push('BOUNCE');
        if (this.effects.trail.enabled) activeEffects.push('TRAIL');
        if (this.effects.glow.enabled) activeEffects.push(`GLOW:${this.effects.glow.color}`);
        if (this.effects.scale.current > 1.1) activeEffects.push(`SCALE:${this.effects.scale.current.toFixed(1)}`);
        
        if (activeEffects.length > 0) {
          ctx.fillStyle = '#ffff00';
          ctx.font = 'bold 12px Arial';
          ctx.fillText(activeEffects.join('|'), effectX, effectY + 45);
          console.log(`🎭 Active effects on ${this.currentAnimation}:`, activeEffects.join(', '));
        }
      }
      
    } catch (error) {
      console.error('❌ Error drawing enhanced sprite:', error);
      this.drawFallback(ctx, effectX, effectY);
    }
    
    ctx.restore();
  }
  
  drawFallback(ctx, x, y) {
    const scale = this.config.renderScale;
    const size = this.config.frameWidth * scale;
    
    // Draw enhanced fallback with glow effect
    ctx.save();
    
    // Add glow effect for fallback
    ctx.shadowColor = '#4facfe';
    ctx.shadowBlur = 15;
    
    ctx.font = `bold ${size * 0.9}px serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    
    // Add animation-specific emoji or effect
    let fallbackChar = '🤖'; // Robot emoji
    switch(this.currentAnimation) {
      case 'punch1':
      case 'punch2':
      case 'punch3':
      case 'punch_quad':
        fallbackChar = '👊'; // Punch emoji
        break;
      case 'kick':
      case 'kick_low':
      case 'kick_spin':
        fallbackChar = '🦵'; // Leg emoji
        break;
      case 'run':
        fallbackChar = '🏃'; // Running person
        break;
      case 'jump':
        fallbackChar = '🤸'; // Person doing cartwheel
        break;
      case 'death':
        fallbackChar = '💀'; // Skull
        break;
      case 'dodge':
        fallbackChar = '💨'; // Dash
        break;
    }
    
    ctx.fillText(fallbackChar, x + size/2, y - size/4);
    
    // Add a subtle outline
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeText(fallbackChar, x + size/2, y - size/4);
    
    ctx.restore();
  }
  
  // Special animation methods for enhanced effects
  playImpactAnimation() {
    this.effects.shake.enabled = true;
    this.effects.shake.intensity = 5; // Increased from 2
    this.effects.shake.duration = 20; // Increased from 10
    this.effects.shake.timer = 20;
    
    this.effects.scale.target = 1.4; // Increased from 1.2
    this.effects.glow.enabled = true;
    this.effects.glow.color = '#ffffff';
    this.effects.glow.alpha = 0.8;
    
    console.log('💥 IMPACT ANIMATION TRIGGERED - Shake:', this.effects.shake.intensity, 'Scale:', this.effects.scale.target);
    
    setTimeout(() => {
      this.effects.scale.target = 1.0;
      this.effects.glow.enabled = false;
    }, 300); // Increased duration
  }
  
  playSpecialEffect(effectType) {
    switch(effectType) {
      case 'powerup':
        this.effects.glow.enabled = true;
        this.effects.glow.color = '#ffd700';
        this.effects.scale.target = 1.3;
        setTimeout(() => {
          this.effects.glow.enabled = false;
          this.effects.scale.target = 1.0;
        }, 1000);
        break;
        
      case 'damage':
        this.effects.tint.enabled = true;
        this.effects.tint.color = '#ff0000';
        this.effects.shake.enabled = true;
        this.effects.shake.intensity = 6; // Increased from 3
        this.effects.shake.duration = 30; // Increased from 20
        this.effects.shake.timer = 30;
        
        // Add red glow for damage
        this.effects.glow.enabled = true;
        this.effects.glow.color = '#ff0000';
        this.effects.glow.alpha = 0.7;
        
        console.log('💔 DAMAGE EFFECT TRIGGERED - Red glow and shake active');
        
        setTimeout(() => {
          this.effects.tint.enabled = false;
          this.effects.glow.enabled = false;
        }, 500); // Increased duration
        break;
        
      case 'victory':
        this.effects.bounce.enabled = true;
        this.effects.glow.enabled = true;
        this.effects.glow.color = '#00ff00';
        break;
        
      case 'charging':
        this.effects.glow.enabled = true;
        this.effects.glow.color = '#4facfe';
        this.effects.scale.target = 1.1;
        break;
    }
  }
  
  getScreenFlashData() {
    if (this.effects.screenFlash.enabled) {
      return {
        color: this.effects.screenFlash.color,
        intensity: this.effects.screenFlash.intensity,
        duration: this.effects.screenFlash.duration
      };
    }
    return null;
  }
  
  triggerScreenFlash(color = '#ffffff', intensity = 0.5, duration = 0.2) {
    this.effects.screenFlash.enabled = true;
    this.effects.screenFlash.color = color;
    this.effects.screenFlash.intensity = intensity;
    this.effects.screenFlash.duration = duration;
  }
  
  // Dynamic scaling effects for different game states
  setDynamicScaling(scalingType, intensity = 1.0, duration = 1000) {
    switch(scalingType) {
      case 'powerup':
        this.effects.scale.target = 1.0 + (0.3 * intensity);
        this.effects.glow.enabled = true;
        this.effects.glow.color = '#ffd700';
        this.effects.glow.alpha = 0.8 * intensity;
        setTimeout(() => {
          this.effects.scale.target = 1.0;
          this.effects.glow.enabled = false;
        }, duration);
        break;
        
      case 'damage_reduction':
        this.effects.scale.target = 0.8 + (0.2 * (1 - intensity));
        this.effects.tint.enabled = true;
        this.effects.tint.color = '#4169e1';
        setTimeout(() => {
          this.effects.scale.target = 1.0;
          this.effects.tint.enabled = false;
        }, duration);
        break;
        
      case 'berserker_mode':
        this.effects.scale.target = 1.2 + (0.3 * intensity);
        this.effects.glow.enabled = true;
        this.effects.glow.color = '#ff0000';
        this.effects.shake.enabled = true;
        this.effects.shake.intensity = 2 * intensity;
        this.effects.shake.duration = duration / 16; // Convert to frames
        this.effects.shake.timer = duration / 16;
        break;
        
      case 'stealth_mode':
        this.effects.scale.target = 0.9;
        this.effects.fade.enabled = true;
        this.effects.fade.alpha = 0.5 + (0.3 * (1 - intensity));
        break;
        
      case 'giant_mode':
        this.effects.scale.target = 1.5 + (0.5 * intensity);
        this.effects.glow.enabled = true;
        this.effects.glow.color = '#00ff00';
        this.effects.shake.enabled = true;
        this.effects.shake.intensity = 3;
        break;
        
      case 'mini_mode':
        this.effects.scale.target = 0.5 + (0.3 * intensity);
        this.effects.bounce.enabled = true;
        this.effects.bounce.amount = 0.15;
        break;
        
      case 'critical_hit':
        // Temporary scaling pulse for critical hits
        const originalScale = this.effects.scale.target;
        this.effects.scale.target = originalScale + 0.4;
        this.effects.glow.enabled = true;
        this.effects.glow.color = '#ffff00';
        this.triggerScreenFlash('#ffff00', 0.6, 0.15);
        setTimeout(() => {
          this.effects.scale.target = originalScale;
          this.effects.glow.enabled = false;
        }, 200);
        break;
    }
  }
  
  // Contextual scaling based on health/state
  updateContextualScaling(health, maxHealth, specialStates = {}) {
    const healthRatio = health / maxHealth;
    
    // Scale down as health decreases
    if (healthRatio < 0.3) {
      this.effects.scale.target = 0.85 + (healthRatio * 0.15);
      if (!this.effects.tint.enabled) {
        this.effects.tint.enabled = true;
        this.effects.tint.color = '#ff6666';
        this.effects.tint.intensity = 1 - healthRatio;
      }
    } else {
      this.effects.scale.target = 1.0;
      if (this.effects.tint.enabled && this.effects.tint.color === '#ff6666') {
        this.effects.tint.enabled = false;
      }
    }
    
    // Apply special state modifications
    if (specialStates.invulnerable) {
      this.effects.scale.target = Math.max(this.effects.scale.target, 1.1);
      this.effects.glow.enabled = true;
      this.effects.glow.color = '#ffffff';
    }
    
    if (specialStates.charging) {
      this.effects.scale.target += 0.1 * Math.sin(Date.now() * 0.01);
    }
    
    if (specialStates.stunned) {
      this.effects.scale.target *= 0.9;
      this.effects.shake.enabled = true;
      this.effects.shake.intensity = 1;
    }
  }
  
  // Sprite-triggered particle effects
  triggerParticles(particleCallback, x, y) {
    if (!particleCallback) return;
    
    const anim = this.config.animations[this.currentAnimation];
    if (!anim) return;
    
    // Trigger particles based on animation type and current frame
    switch(this.currentAnimation) {
      case 'punch1':
      case 'punch2':
      case 'punch3':
        if (this.currentFrame === 2) { // Impact frame
          particleCallback('impact', x + 40, y - 60, { 
            count: 8, 
            color: '#ffaa00',
            spread: 45 
          });
        }
        break;
        
      case 'punch_quad':
        if (this.currentFrame === 1 || this.currentFrame === 3) {
          particleCallback('energy', x + 30, y - 50, { 
            count: 12, 
            color: '#ff4500',
            spread: 60,
            intensity: 'high'
          });
        }
        break;
        
      case 'kick':
      case 'kick_low':
        if (this.currentFrame === 2) {
          particleCallback('impact', x + 35, y - 40, { 
            count: 6, 
            color: '#00aaff',
            spread: 30 
          });
        }
        break;
        
      case 'kick_spin':
        if (this.currentFrame >= 2 && this.currentFrame <= 4) {
          particleCallback('spiral', x + 25, y - 50, { 
            count: 4, 
            color: '#00ffff',
            rotationSpeed: 5
          });
        }
        break;
        
      case 'run':
        if (this.currentFrame === 0 || this.currentFrame === 3) {
          particleCallback('dust', x, y, { 
            count: 2, 
            color: '#cccccc',
            spread: 15 
          });
        }
        break;
        
      case 'jump':
        if (this.currentFrame === 0) {
          particleCallback('dust', x, y + 10, { 
            count: 5, 
            color: '#dddddd',
            spread: 25,
            velocity: { x: 0, y: 1 }
          });
        }
        break;
        
      case 'landing':
        if (this.currentFrame === 0) {
          particleCallback('impact', x, y, { 
            count: 8, 
            color: '#aaaaaa',
            spread: 50,
            intensity: 'medium'
          });
        }
        break;
        
      case 'dodge_roll':
        particleCallback('trail', x, y - 30, { 
          count: 2, 
          color: '#ffffff',
          alpha: 0.3,
          speed: 'fast'
        });
        break;
        
      case 'find_item':
        if (this.currentFrame === 2) {
          particleCallback('sparkle', x, y - 40, { 
            count: 10, 
            color: '#ffd700',
            spread: 30,
            twinkle: true
          });
        }
        break;
        
      case 'death_1':
      case 'death_2':
        if (this.currentFrame === 1) {
          particleCallback('explosion', x, y - 30, { 
            count: 15, 
            color: '#ff0000',
            spread: 90,
            intensity: 'high'
          });
        }
        break;
    }
    
    // Special effect-based particles
    if (this.effects.glow.enabled && this.currentFrame % 2 === 0) {
      particleCallback('glow', x, y - 30, { 
        count: 3, 
        color: this.effects.glow.color,
        alpha: 0.4,
        size: 'small'
      });
    }
    
    if (this.effects.aura.enabled) {
      particleCallback('aura', x, y - 30, { 
        count: 2, 
        color: this.effects.aura.color,
        radius: this.effects.aura.radius,
        pulse: this.effects.aura.pulse
      });
    }
  }
  
  // Register particle callback for automatic triggering
  setParticleCallback(callback) {
    this.particleCallback = callback;
  }
  
  stopAllEffects() {
    this.resetEffects();
  }
  
  // Preload all animation images
  preloadAnimations() {
    Object.keys(this.config.animations).forEach(animName => {
      this.loadAnimationImage(animName);
    });
  }
}

const SideScroller = ({ character, onBackToMenu }) => {
  console.log('🎮 SideScroller component mounting with props:', { character, onBackToMenu });
  console.log('📊 Character data received:', character);
  
  const canvasRef = useRef(null);
  const playerSpriteRef = useRef(null);
  const enemySpriteRef = useRef(null);
  const backgroundStars = useRef([]);
  const backgroundClouds = useRef([]);
  const backgroundDebris = useRef([]);
  const backgroundBuildings = useRef([]);
  const backgroundLights = useRef([]);
  const lightingSystem = useRef({ lightning: { active: false, intensity: 0 } });
  const foregroundElements = useRef([]);
  const weatherEffects = useRef({ rain: [], fog: [], wind: 0 });
  const atmosphericLayers = useRef({ near: [], far: [], particles: [] });
  
  // Particle creation function - moved to component level for accessibility
  const createParticles = React.useCallback((x, y, color, count = 4, type = 'normal') => {
    // Only log if particles exceed reasonable limit
    if (particlesRef.current.length > 100) {
      console.warn(`⚠️ High particle count: ${particlesRef.current.length} - Creating ${count} more ${type} particles`);
    }
    
    // Limit total particle count to prevent performance issues
    if (particlesRef.current.length > 200) {
      console.warn('🚫 Particle limit reached - skipping creation');
      return;
    }
    
    const newParticles = [];
    
    for (let i = 0; i < count; i++) {
      let particle;
      
      if (type === 'explosion') {
        // Explosive burst particles - radial spread
        const angle = (i / count) * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        const life = 30 + Math.random() * 20; // Optimized shorter life
        
        particle = {
          x: x + (Math.random() - 0.5) * 15,
          y: y + (Math.random() - 0.5) * 15,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: life,
          maxLife: life,
          color: color || '#ff4444',
          size: 4 + Math.random() * 4,
          type: 'explosion'
        };
      } else if (type === 'hit') {
        // Impact particles - directional spray
        const baseAngle = Math.random() * Math.PI * 2;
        const spread = Math.PI / 3; // 60 degree spread
        const angle = baseAngle + (Math.random() - 0.5) * spread;
        const speed = 1.5 + Math.random() * 3;
        const life = 20 + Math.random() * 15;
        
        particle = {
          x: x + (Math.random() - 0.5) * 8,
          y: y + (Math.random() - 0.5) * 8,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: life,
          maxLife: life,
          color: color || '#ffaa00',
          size: 2 + Math.random() * 3,
          type: 'hit'
        };
      } else if (type === 'smoke') {
        // Smoke particles - rising effect
        const angle = (Math.random() - 0.5) * Math.PI / 4; // 45 degree spread
        const speed = 0.5 + Math.random() * 1.5;
        const life = 40 + Math.random() * 20;
        
        particle = {
          x: x + (Math.random() - 0.5) * 12,
          y: y + (Math.random() - 0.5) * 12,
          vx: Math.cos(angle) * speed * 0.5,
          vy: -Math.abs(Math.sin(angle) * speed), // Always rise
          life: life,
          maxLife: life,
          color: color || '#666666',
          size: 3 + Math.random() * 4,
          type: 'smoke'
        };
      } else if (type === 'fire') {
        // Fire particles - rising flames with flicker
        const angle = (Math.random() - 0.5) * Math.PI / 6; // 30 degree spread
        const speed = 1 + Math.random() * 2.5;
        const life = 35 + Math.random() * 25;
        
        particle = {
          x: x + (Math.random() - 0.5) * 8,
          y: y + (Math.random() - 0.5) * 6,
          vx: Math.cos(angle) * speed * 0.3,
          vy: -Math.abs(Math.sin(angle) * speed), // Always rise
          life: life,
          maxLife: life,
          color: ['#ff4444', '#ff6600', '#ffaa00', '#ff8800', '#ff2200'][Math.floor(Math.random() * 5)],
          size: 2 + Math.random() * 3,
          type: 'fire',
          flicker: true,
          heat: 1.0,
          gravity: -0.02 // Slight upward pull
        };
      } else if (type === 'ice') {
        // Ice particles - crystalline shards with shimmer
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.8 + Math.random() * 2;
        const life = 45 + Math.random() * 30;
        
        particle = {
          x: x + (Math.random() - 0.5) * 10,
          y: y + (Math.random() - 0.5) * 8,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: life,
          maxLife: life,
          color: ['#88ddff', '#aaeeff', '#ccf5ff', '#ffffff', '#77ccee'][Math.floor(Math.random() * 5)],
          size: 1 + Math.random() * 2.5,
          type: 'ice',
          shimmer: true,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.1,
          gravity: 0.015 // Slight downward pull
        };
      } else if (type === 'frost') {
        // Frost particles - slow floating crystals
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.3 + Math.random() * 1;
        const life = 60 + Math.random() * 40;
        
        particle = {
          x: x + (Math.random() - 0.5) * 15,
          y: y + (Math.random() - 0.5) * 12,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed * 0.5,
          life: life,
          maxLife: life,
          color: ['#e6f3ff', '#ffffff', '#cce7ff', '#b3d9ff'][Math.floor(Math.random() * 4)],
          size: 0.5 + Math.random() * 1.5,
          type: 'frost',
          drift: true,
          twinkle: Math.random() > 0.5,
          gravity: -0.005 // Very slight upward drift
        };
      } else if (type === 'ember') {
        // Ember particles - glowing sparks
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 3;
        const life = 30 + Math.random() * 20;
        
        particle = {
          x: x + (Math.random() - 0.5) * 6,
          y: y + (Math.random() - 0.5) * 6,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: life,
          maxLife: life,
          color: ['#ff6600', '#ff4400', '#ff8800', '#ffaa00'][Math.floor(Math.random() * 4)],
          size: 1 + Math.random() * 2,
          type: 'ember',
          glow: true,
          sparkle: true,
          gravity: 0.01
        };
      } else {
        // Default particles - standard behavior
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 2;
        const life = 25 + Math.random() * 15;
        
        particle = {
          x: x + (Math.random() - 0.5) * 10,
          y: y + (Math.random() - 0.5) * 10,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: life,
          maxLife: life,
          color: color || '#ffffff',
          size: 2 + Math.random() * 2,
          type: 'normal'
        };
      }
      
      newParticles.push(particle);
    }
    
    // Add new particles to the ref array
    particlesRef.current = [...particlesRef.current, ...newParticles];
    
    console.log(`✨ Created ${newParticles.length} ${type} particles at (${x}, ${y}) - Total: ${particlesRef.current.length}`);
  }, []);

  // Enable sprite debugging via console: window.DEBUG_SPRITES = true
  useEffect(() => {
    window.DEBUG_SPRITES = true; // Temporarily enabled for debugging sprites
    console.log('🐛 Sprite debugging is ENABLED - you should see green outlines around sprites');
    
    // Initialize background elements
    initializeBackgroundElements();
  }, []);
  
  // Initialize realistic atmospheric background elements
  function initializeBackgroundElements() {
    // Initialize realistic background systems
    initializeWeatherEffects();
    initializeLightingSystem();
    initializeForegroundElements();
    
    // Create enhanced starfield
    backgroundStars.current = [];
    for (let i = 0; i < 200; i++) {
      backgroundStars.current.push({
        x: Math.random() * 1200,
        y: Math.random() * 300,
        size: Math.random() * 3 + 0.3,
        brightness: Math.random() * 1.0 + 0.1,
        twinkleSpeed: Math.random() * 0.03 + 0.005,
        twinkleOffset: Math.random() * Math.PI * 2,
        color: ['#ffffff', '#fff8dc', '#fffacd', '#e6e6fa', '#f0f8ff'][Math.floor(Math.random() * 5)],
        layer: Math.random() * 3 // Depth layers
      });
    }
    
    // Create realistic city buildings
    backgroundBuildings.current = [];
    for (let i = 0; i < 25; i++) {
      const height = Math.random() * 200 + 80;
      const width = Math.random() * 60 + 40;
      backgroundBuildings.current.push({
        x: i * 50 - 100,
        y: 500 - height,
        width: width,
        height: height,
        type: ['residential', 'office', 'industrial', 'skyscraper'][Math.floor(Math.random() * 4)],
        windows: generateBuildingWindows(width, height),
        color: ['#1a1a2e', '#16213e', '#0f3460', '#533483'][Math.floor(Math.random() * 4)],
        lights: Math.random() > 0.3,
        antenna: Math.random() > 0.7,
        layer: Math.floor(Math.random() * 3) + 1 // 1-3 depth layers
      });
    }
    
    // Create atmospheric clouds with weather
    backgroundClouds.current = [];
    for (let i = 0; i < 12; i++) {
      backgroundClouds.current.push({
        x: Math.random() * 1600 - 200,
        y: Math.random() * 150 + 30,
        width: Math.random() * 300 + 150,
        height: Math.random() * 80 + 40,
        speed: Math.random() * 0.3 + 0.1,
        opacity: Math.random() * 0.4 + 0.1,
        layer: Math.floor(Math.random() * 3),
        type: ['cumulus', 'stratus', 'storm'][Math.floor(Math.random() * 3)],
        density: Math.random() * 0.8 + 0.2
      });
    }
    
    // Create detailed floating debris and particles
    backgroundDebris.current = [];
    for (let i = 0; i < 35; i++) {
      backgroundDebris.current.push({
        x: Math.random() * 1200,
        y: Math.random() * 400,
        size: Math.random() * 4 + 0.5,
        speedX: (Math.random() - 0.5) * 0.8,
        speedY: (Math.random() - 0.5) * 0.4,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.03,
        opacity: Math.random() * 0.6 + 0.1,
        type: ['metal', 'paper', 'plastic', 'dust', 'spark'][Math.floor(Math.random() * 5)],
        color: getDebrisColor(),
        layer: Math.floor(Math.random() * 3)
      });
    }
    
    // Initialize weather effects
    initializeWeatherEffects();
    
    // Initialize atmospheric lighting
    initializeLightingSystem();
  }
  
  // Generate realistic building windows
  function generateBuildingWindows(width, height) {
    const windows = [];
    const windowWidth = 8;
    const windowHeight = 12;
    const spacing = 4;
    
    for (let y = spacing; y < height - windowHeight; y += windowHeight + spacing) {
      for (let x = spacing; x < width - windowWidth; x += windowWidth + spacing) {
        windows.push({
          x: x,
          y: y,
          width: windowWidth,
          height: windowHeight,
          lit: Math.random() > 0.4,
          brightness: Math.random() * 0.8 + 0.2,
          color: ['#ffeb3b', '#ff9800', '#2196f3', '#4caf50'][Math.floor(Math.random() * 4)]
        });
      }
    }
    return windows;
  }
  
  // Get appropriate debris color based on type
  function getDebrisColor() {
    const colors = {
      metal: ['#707070', '#808080', '#606060', '#909090'],
      paper: ['#f5f5f5', '#e8e8e8', '#fafafa', '#f0f0f0'],
      plastic: ['#ff5722', '#2196f3', '#4caf50', '#9c27b0'],
      dust: ['#8d6e63', '#6d4c41', '#5d4037', '#4e342e'],
      spark: ['#ffeb3b', '#ffc107', '#ff9800', '#ff5722']
    };
    const types = Object.keys(colors);
    const type = types[Math.floor(Math.random() * types.length)];
    const colorArray = colors[type];
    return colorArray[Math.floor(Math.random() * colorArray.length)];
  }
  
  // Initialize dynamic weather system
  function initializeWeatherEffects() {
    weatherEffects.current = {
      rain: [],
      fog: [],
      wind: Math.random() * 2 - 1,
      intensity: Math.random() * 0.3,
      type: ['clear', 'light_rain', 'fog', 'storm'][Math.floor(Math.random() * 4)]
    };
    
    // Create rain particles
    for (let i = 0; i < 100; i++) {
      weatherEffects.current.rain.push({
        x: Math.random() * 1400,
        y: Math.random() * 600,
        speed: Math.random() * 5 + 3,
        length: Math.random() * 15 + 5,
        opacity: Math.random() * 0.6 + 0.2
      });
    }
    
    // Create fog layers
    for (let i = 0; i < 8; i++) {
      weatherEffects.current.fog.push({
        x: Math.random() * 1400 - 200,
        y: Math.random() * 200 + 300,
        width: Math.random() * 400 + 200,
        height: Math.random() * 100 + 50,
        speed: Math.random() * 0.2 + 0.05,
        opacity: Math.random() * 0.3 + 0.1
      });
    }
  }
  
  // Initialize dynamic lighting system
  function initializeLightingSystem() {
    backgroundLights.current = {
      lights: [],
      lightning: {
        active: false,
        intensity: 0
      }
    };
    
    // Initialize lighting system
    lightingSystem.current = {
      lightning: {
        active: false,
        intensity: 0
      }
    };
    
    // Street lights and city glow
    for (let i = 0; i < 15; i++) {
      backgroundLights.current.lights.push({
        x: Math.random() * 1200,
        y: Math.random() * 100 + 400,
        radius: Math.random() * 50 + 30,
        intensity: Math.random() * 0.6 + 0.2,
        color: ['#ffeb3b', '#ff9800', '#2196f3'][Math.floor(Math.random() * 3)],
        flicker: Math.random() > 0.8,
        type: ['street', 'neon', 'window'][Math.floor(Math.random() * 3)]
      });
    }
  }
  
  // Initialize realistic foreground elements
  function initializeForegroundElements() {
    foregroundElements.current = [];
    
    // Street details and urban elements
    const streetElements = [
      // Manholes
      { type: 'manhole', x: 200, y: GROUND_Y + 10, width: 40, height: 8, color: '#333' },
      { type: 'manhole', x: 600, y: GROUND_Y + 10, width: 40, height: 8, color: '#333' },
      { type: 'manhole', x: 1000, y: GROUND_Y + 10, width: 40, height: 8, color: '#333' },
      
      // Street pipes and vents
      { type: 'pipe', x: 100, y: GROUND_Y - 20, width: 15, height: 30, color: '#555', steam: true },
      { type: 'pipe', x: 450, y: GROUND_Y - 35, width: 20, height: 45, color: '#444', steam: true },
      { type: 'pipe', x: 800, y: GROUND_Y - 25, width: 18, height: 35, color: '#666', steam: false },
      
      // Trash and debris
      { type: 'trash', x: 320, y: GROUND_Y - 8, width: 12, height: 8, color: '#8B4513' },
      { type: 'trash', x: 720, y: GROUND_Y - 6, width: 8, height: 6, color: '#654321' },
      
      // Street lights (foreground)
      { type: 'streetlight', x: 50, y: GROUND_Y - 120, width: 8, height: 120, color: '#333', light: true },
      { type: 'streetlight', x: 400, y: GROUND_Y - 130, width: 8, height: 130, color: '#333', light: true },
      { type: 'streetlight', x: 750, y: GROUND_Y - 125, width: 8, height: 125, color: '#333', light: true },
      
      // Industrial elements
      { type: 'vent', x: 280, y: GROUND_Y - 15, width: 25, height: 15, color: '#444', glow: true },
      { type: 'vent', x: 680, y: GROUND_Y - 18, width: 30, height: 18, color: '#555', glow: true },
      
      // Puddles (reflective)
      { type: 'puddle', x: 150, y: GROUND_Y + 2, width: 60, height: 4, color: '#001122', reflective: true },
      { type: 'puddle', x: 520, y: GROUND_Y + 2, width: 80, height: 3, color: '#001133', reflective: true },
      
      // Atmospheric particles (floating debris)
      ...Array.from({ length: 12 }, (_, i) => ({
        type: 'floating_debris',
        x: Math.random() * 1200,
        y: Math.random() * 200 + 100,
        size: Math.random() * 3 + 1,
        speedX: Math.random() * 0.5 - 0.25,
        speedY: Math.random() * 0.3 - 0.15,
        opacity: Math.random() * 0.6 + 0.2,
        color: ['#666', '#777', '#555', '#888'][Math.floor(Math.random() * 4)]
      }))
    ];
    
    foregroundElements.current = streetElements;
  }

  const playerRef = useRef({
    x: 150, // Moved further from edge for wider screen
    y: GROUND_Y,
    vx: 0,
    vy: 0,
    onGround: true,
    facing: 'right',
    avatar: character?.player1?.avatar || '🤖',
    name: character?.player1?.name || 'Player',
    health: character?.player1?.health || 100,
    maxHealth: character?.player1?.health || 100,
    attack: character?.player1?.attack || 10,
    currentAnimation: 'idle',
    isAttacking: false,
    attackCooldown: 0
  });
  
  const enemyRef = useRef({
    x: 1050, // Moved further to the right for wider screen (1200px canvas)
    y: GROUND_Y,
    vx: 0,
    vy: 0,
    onGround: true,
    facing: 'left',
    avatar: character?.player2?.avatar || '👾',
    name: character?.player2?.name || 'Enemy',
    health: character?.player2?.health || 100,
    maxHealth: character?.player2?.health || 100,
    attack: character?.player2?.attack || 10,
    currentAnimation: 'idle',
    isAttacking: false,
    attackCooldown: 0
  });
  
  const [player, setPlayer] = useState(playerRef.current);
  const [enemy, setEnemy] = useState(enemyRef.current);
  const [projectiles, setProjectiles] = useState([]);
  const [collisionAnimation, setCollisionAnimation] = useState({ active: false, x: 0, y: 0, timer: 0 });
  const [screenShake, setScreenShake] = useState({ active: false, intensity: 0, timer: 0 });
  const [isPaused, setIsPaused] = useState(false);
  const [spritesLoaded, setSpritesLoaded] = useState({ player: false, enemy: false });
  const [gameOver, setGameOver] = useState({ active: false, winner: null, message: '' });
  const particlesRef = useRef([]);
  const [combo, setCombo] = useState({ player: 0, enemy: 0, timer: 0 });
  const [specialMeter, setSpecialMeter] = useState({ player: 0, enemy: 0 });
  const [powerUps, setPowerUps] = useState([]);
  const [gameTime, setGameTime] = useState(3600); // 60 seconds at 60 FPS
  const [roundNumber, setRoundNumber] = useState(1);
  const [roundActive, setRoundActive] = useState(false); // Start with round inactive for announcement
  const [matchScore, setMatchScore] = useState({ player: 0, enemy: 0 }); // Rounds won
  const [matchComplete, setMatchComplete] = useState(false);
  const [lastRoundWinner, setLastRoundWinner] = useState(null);
  const [connectedGamepad, setConnectedGamepad] = useState({ type: null, name: null });
  
  // Round announcement system
  const [roundAnnouncement, setRoundAnnouncement] = useState({
    active: true, // Start with announcement for round 1
    phase: 'announcing', // 'announcing', 'fight', 'none'
    timer: 180, // 3 seconds at 60 FPS for announcement
    roundToShow: 1
  });

  // Game state refs for tracking
  const gameStateRef = useRef({
    frameCount: 0,
    particleCreationCount: 0,
    fps: 60,
    frameTime: 16.67,
    performanceMode: 'auto'
  });

  // Frame timing variables for optimization
  let lastFrameTime = 0;
  let frameCount = 0;

  // Enhanced Combat System State
  const [activeKeys, setActiveKeys] = useState(new Set());
  const [combatState, setCombatState] = useState({
    leftPunchPressed: false,
    rightPunchPressed: false,
    leftKickPressed: false,
    rightKickPressed: false,
    comboWindow: 0, // Frames remaining for combo input
    lastAttackType: null,
    comboPower: 1.0
  });

  // Menu Navigation State for Gamepad
  const [menuNavigation, setMenuNavigation] = useState({
    pauseMenuFocus: 0, // 0 = Resume, 1 = Main Menu
    gameOverMenuFocus: 0, // 0 = Play Again, 1 = Main Menu
    lastDpadInput: { x: 0, y: 0 },
    navigationCooldown: 0
  });

  // Pause menu handlers
  const handleResumeGame = () => {
    setIsPaused(false);
  };

  const handleMainMenu = () => {
    try {
      if (onBackToMenu && typeof onBackToMenu === 'function') {
        onBackToMenu();
      } else {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error in main menu navigation:', error);
      window.location.reload();
    }
  };

  // Initialize enhanced sprite animations
  useEffect(() => {
    console.log('Initializing enhanced sprite animations...');
    
    // Create player sprite animation
    playerSpriteRef.current = new SpriteAnimation(
      '/assets/sprites/SplitAnimations/Male_spritesheet_idle.png',
      SPRITE_CONFIG,
      () => {
        console.log('✅ Player sprite animation loaded successfully!');
        setSpritesLoaded(prev => ({ ...prev, player: true }));
      }
    );
    
    // Create enemy sprite animation  
    enemySpriteRef.current = new SpriteAnimation(
      '/assets/sprites/SplitAnimations/Male_spritesheet_idle.png',
      SPRITE_CONFIG,
      () => {
        console.log('✅ Enemy sprite animation loaded successfully!');
        setSpritesLoaded(prev => ({ ...prev, enemy: true }));
      }
    );
    
    // Preload all animations
    console.log('Preloading all animations...');
    playerSpriteRef.current.preloadAnimations();
    enemySpriteRef.current.preloadAnimations();
    
    // Set up particle callbacks for sprite-triggered effects
    const createParticleCallback = (isPlayer = true) => (type, x, y, options = {}) => {
      const defaultOptions = {
        count: 5,
        color: '#ffffff',
        spread: 30,
        intensity: 'medium',
        ...options
      };
      
      console.log(`🎨 Sprite-triggered particles: ${type} at (${x}, ${y}) for ${isPlayer ? 'player' : 'enemy'}`);
      
      // Call createParticles with correct parameter order: (x, y, color, count, type)
      createParticles(x, y, defaultOptions.color, defaultOptions.count, type);
    };
    
    playerSpriteRef.current.setParticleCallback(createParticleCallback(true));
    enemySpriteRef.current.setParticleCallback(createParticleCallback(false));
    
    // Add debugging to check what images are being requested
    console.log('Sprite paths being loaded:');
    console.log('- Base path:', '/assets/sprites/SplitAnimations/Male_spritesheet_idle.png');
    Object.keys(SPRITE_CONFIG.animations).forEach(animName => {
      const animConfig = SPRITE_CONFIG.animations[animName];
      console.log(`- ${animName}:`, `/assets/sprites/SplitAnimations/${animConfig.file}`);
    });
    
    console.log('Enhanced sprite animations initialized');
    
    // Initialize game state to ensure UI elements appear immediately
    console.log('🎬 Initializing game UI elements...');
    
    // Create some initial atmospheric particles for visual feedback
    setTimeout(() => {
      if (particlesRef.current.length === 0) {
        console.log('🌟 Creating initial atmospheric particles...');
        createParticles(200, 300, '#4facfe', 3, 'sparkle');
        createParticles(800, 250, '#ff6600', 2, 'ember');
        createParticles(600, 200, '#88ddff', 4, 'frost');
      }
    }, 100);
    
  }, [createParticles]);

  // Force initial state visibility
  useEffect(() => {
    console.log('🎯 Ensuring round announcement visibility...');
    
    // Make sure round announcement is properly initialized and visible
    setTimeout(() => {
      setRoundAnnouncement(prev => {
        console.log('Round announcement current state:', prev);
        if (!prev.active) {
          console.log('🔄 Reactivating round announcement for visibility');
          return {
            ...prev,
            active: true,
            phase: 'announcing',
            timer: 180,
            roundToShow: 1
          };
        }
        return prev;
      });
    }, 50);
  }, []);

  // Main game loop useEffect
  useEffect(() => {
    console.log('🔄 Starting main game loop useEffect...');
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    // Ensure canvas and context are available
    if (!canvas || !ctx) {
      console.warn('⚠️ Canvas or context not available, skipping frame');
      return;
    }
    
    console.log('✅ Canvas and context ready, starting game loop...');
    let animationFrameId;

    function draw() {
      try {
        // Enhanced rendering with performance optimizations
        
        // Debug logging for initial frames
        if (gameStateRef.current.frameCount < 5) {
          console.log(`🎨 Draw called - Frame ${gameStateRef.current.frameCount}, Round announcement active: ${roundAnnouncement.active}, Particles: ${particlesRef.current.length}`);
        }
        
        // Optimized canvas clearing
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set optimal rendering settings for performance
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium'; // Balance between quality and performance
        
        // Draw atmospheric background elements
        drawAtmosphericBackground(ctx, canvas);
        
        // Draw simple ground for now
        ctx.fillStyle = '#333';
        ctx.fillRect(0, GROUND_Y, canvas.width, 40);
        
        // Draw realistic foreground elements
        const time = Date.now() * 0.001;
        drawRealisticForeground(ctx, canvas, time);
        
        // Draw basic player rectangle if sprites not loaded
        if (!spritesLoaded.player) {
          ctx.fillStyle = '#00ff00';
          ctx.fillRect(playerRef.current.x, playerRef.current.y, CHARACTER_WIDTH, CHARACTER_HEIGHT);
        }
        
        // Draw basic enemy rectangle if sprites not loaded
        if (!spritesLoaded.enemy) {
          ctx.fillStyle = '#ff0000';
          ctx.fillRect(enemyRef.current.x, enemyRef.current.y, CHARACTER_WIDTH, CHARACTER_HEIGHT);
        }
        
        console.log('✅ Frame drawn successfully');
        
      } catch (error) {
        console.error('❌ Error in draw function:', error);
        throw error; // Re-throw so the loop can catch it
      }
      
      // TODO: Add back complex drawing features once basic rendering works
      /*
      // Apply screen shake - SIMPLIFIED FOR DEBUGGING
      let shakeX = 0, shakeY = 0;
      /*
      if (screenShake.active) {
        shakeX = (Math.random() - 0.5) * screenShake.intensity;
        shakeY = (Math.random() - 0.5) * screenShake.intensity;
      }
      */
      
      // Draw enhanced atmospheric background
      drawAtmosphericBackground(ctx, canvas);
      
      // Draw enhanced futuristic ground platform
      const time = Date.now() * 0.001;
      
      // Main ground platform
      const groundGradient = ctx.createLinearGradient(0, GROUND_Y, 0, GROUND_Y + 40);
      groundGradient.addColorStop(0, '#6a6a8a');
      groundGradient.addColorStop(0.3, '#555575');
      groundGradient.addColorStop(0.7, '#4a4a5a');
      groundGradient.addColorStop(1, '#3a3a4a');
      ctx.fillStyle = groundGradient;
      ctx.fillRect(0, GROUND_Y, canvas.width, 40);
      
      // Ground edge highlight
      ctx.save();
      ctx.strokeStyle = '#4facfe';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.6 + Math.sin(time * 2) * 0.2;
      ctx.shadowColor = '#4facfe';
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(canvas.width, GROUND_Y);
      ctx.stroke();
      ctx.restore();
      
      // Futuristic grid pattern
      ctx.save();
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.4;
      
      // Vertical grid lines
      for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, GROUND_Y + 5);
        ctx.lineTo(i, GROUND_Y + 35);
        ctx.stroke();
      }
      
      // Horizontal grid lines
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(0, GROUND_Y + 10 + (i * 10));
        ctx.lineTo(canvas.width, GROUND_Y + 10 + (i * 10));
        ctx.stroke();
      }
      
      // Glowing energy conduits
      ctx.strokeStyle = '#4facfe';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.3 + Math.sin(time * 3) * 0.2;
      ctx.shadowColor = '#4facfe';
      ctx.shadowBlur = 3;
      
      for (let i = 0; i < canvas.width; i += 120) {
        const offset = Math.sin(time * 2 + i * 0.01) * 2;
        ctx.beginPath();
        ctx.moveTo(i + offset, GROUND_Y + 15);
        ctx.lineTo(i + 80 + offset, GROUND_Y + 25);
        ctx.stroke();
      }
      
      ctx.restore();
      
      // TEST: Draw current particle count (small display)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '12px Arial';
      ctx.fillText(`Particles: ${particlesRef.current.length}`, 20, 25);
      
      // Draw player using enhanced sprite animation with glow effects
      ctx.save();
      
      // Add glow effect for special states
      if (playerRef.current.isAttacking || specialMeter.player > 80) {
        ctx.shadowColor = '#4facfe';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
      
      if (playerSpriteRef.current && spritesLoaded.player) {
        try {
          const flipX = playerRef.current.facing === 'left';
          playerSpriteRef.current.draw(ctx, playerRef.current.x, playerRef.current.y, flipX);
        } catch (error) {
          console.error('❌ Error drawing player sprite, falling back to rectangle:', error);
          // Fall through to draw fallback rectangle
          drawPlayerFallback();
        }
      } else {
        drawPlayerFallback();
      }
      
      function drawPlayerFallback() {
        // Debug info when sprites are not loaded
        if (isPaused) {
          console.log('⚠️ Player sprite not available during pause - spritesLoaded.player:', spritesLoaded.player, 'playerSpriteRef.current:', !!playerSpriteRef.current);
        }
        // Enhanced fallback with gradient design
        const playerGradient = ctx.createLinearGradient(
          playerRef.current.x - 40, playerRef.current.y - 80,
          playerRef.current.x + 40, playerRef.current.y
        );
        playerGradient.addColorStop(0, '#00ff88');
        playerGradient.addColorStop(1, '#00cc66');
        ctx.fillStyle = playerGradient;
        
        // Rounded rectangle body
        const x = playerRef.current.x - 40;
        const y = playerRef.current.y - 80;
        ctx.beginPath();
        ctx.roundRect(x, y, 80, 80, 10);
        ctx.fill();
        
        // Enhanced text
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeText('P1', playerRef.current.x, playerRef.current.y - 40);
        ctx.fillText('P1', playerRef.current.x, playerRef.current.y - 40);
      }
      
      ctx.restore();
      
      // Draw enemy using enhanced sprite animation with glow effects
      ctx.save();
      
      // Add glow effect for special states
      if (enemyRef.current.isAttacking || specialMeter.enemy > 80) {
        ctx.shadowColor = '#ff4757';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
      
      if (enemySpriteRef.current && spritesLoaded.enemy) {
        try {
          const flipX = enemyRef.current.facing === 'left';
          enemySpriteRef.current.draw(ctx, enemyRef.current.x, enemyRef.current.y, flipX);
        } catch (error) {
          console.error('❌ Error drawing enemy sprite, falling back to rectangle:', error);
          // Fall through to draw fallback rectangle
          drawEnemyFallback();
        }
      } else {
        drawEnemyFallback();
      }
      
      function drawEnemyFallback() {
        // Debug info when sprites are not loaded
        if (isPaused) {
          console.log('⚠️ Enemy sprite not available during pause - spritesLoaded.enemy:', spritesLoaded.enemy, 'enemySpriteRef.current:', !!enemySpriteRef.current);
        }
        // Enhanced fallback with gradient design
        const enemyGradient = ctx.createLinearGradient(
          enemyRef.current.x - 40, enemyRef.current.y - 80,
          enemyRef.current.x + 40, enemyRef.current.y
        );
        enemyGradient.addColorStop(0, '#ff6b6b');
        enemyGradient.addColorStop(1, '#ee5a52');
        ctx.fillStyle = enemyGradient;
        
        // Rounded rectangle body
        const x = enemyRef.current.x - 40;
        const y = enemyRef.current.y - 80;
        ctx.beginPath();
        ctx.roundRect(x, y, 80, 80, 10);
        ctx.fill();
        
        // Enhanced text
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeText('P2', enemyRef.current.x, enemyRef.current.y - 40);
        ctx.fillText('P2', enemyRef.current.x, enemyRef.current.y - 40);
      }
      
      ctx.restore();
      
      // Draw collision impact effect
      if (collisionAnimation.active) {
        const progress = 1 - (collisionAnimation.timer / 30);
        const size = progress * 30;
        const alpha = 1 - progress;
        
        // Impact burst
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(collisionAnimation.x, collisionAnimation.y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Impact sparks
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const sparkSize = size * 0.3;
          const sparkX = collisionAnimation.x + Math.cos(angle) * size;
          const sparkY = collisionAnimation.y + Math.sin(angle) * size;
          
          ctx.fillStyle = `rgba(255, 255, 0, ${alpha * 0.8})`;
          ctx.beginPath();
          ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Impact text
        ctx.font = '24px Arial';
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.textAlign = 'center';
        ctx.fillText('COLLISION!', collisionAnimation.x, collisionAnimation.y - 40);
      }
      
      // Draw enhanced health bars at top of screen
      const drawTopHealthBar = (screenX, health, maxHealth, name, isPlayer = true, isLeft = true) => {
        const barWidth = 300; // Much wider bars for better visibility
        const barHeight = 24; // Much taller bars
        const topMargin = 15; // Distance from top of screen
        const borderRadius = 12; // Rounded corners
        
        // Position bars on left and right sides of screen
        const barX = isLeft ? 40 : canvas.width - barWidth - 40;
        const barY = topMargin;
        
        // Enhanced background with multiple layers
        ctx.save();
        
        // Outer glow
        ctx.shadowColor = isPlayer ? '#4facfe' : '#ff4757';
        ctx.shadowBlur = 15;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(barX - 6, barY - 6, barWidth + 12, barHeight + 12);
        
        // Main background with gradient
        ctx.shadowBlur = 0;
        const bgGradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
        bgGradient.addColorStop(0, 'rgba(60, 60, 60, 0.95)');
        bgGradient.addColorStop(1, 'rgba(30, 30, 30, 0.95)');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(barX - 3, barY - 3, barWidth + 6, barHeight + 6);
        
        // Health bar background with inner shadow effect
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Inner border for depth
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX + 1, barY + 1, barWidth - 2, barHeight - 2);
        
        // Health bar fill with enhanced gradient
        const healthPercent = health / maxHealth;
        const healthWidth = barWidth * healthPercent;
        
        let healthGradient;
        if (healthPercent > 0.6) {
          // Green gradient for healthy
          healthGradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
          healthGradient.addColorStop(0, '#4caf50');
          healthGradient.addColorStop(0.5, '#2ed573');
          healthGradient.addColorStop(1, '#27ae60');
        } else if (healthPercent > 0.3) {
          // Orange gradient for warning
          healthGradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
          healthGradient.addColorStop(0, '#ff9800');
          healthGradient.addColorStop(0.5, '#ffa502');
          healthGradient.addColorStop(1, '#f39c12');
        } else {
          // Red gradient for critical
          healthGradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
          healthGradient.addColorStop(0, '#f44336');
          healthGradient.addColorStop(0.5, '#ff4757');
          healthGradient.addColorStop(1, '#e74c3c');
        }
        
        ctx.fillStyle = healthGradient;
        
        // For enemy (right side), fill from right to left
        if (!isLeft) {
          ctx.fillRect(barX + barWidth - healthWidth, barY, healthWidth, barHeight);
        } else {
          ctx.fillRect(barX, barY, healthWidth, barHeight);
        }
        
        // Health bar shine effect
        const shineGradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight/3);
        shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = shineGradient;
        
        if (!isLeft) {
          ctx.fillRect(barX + barWidth - healthWidth, barY, healthWidth, barHeight/3);
        } else {
          ctx.fillRect(barX, barY, healthWidth, barHeight/3);
        }
        
        // Enhanced border with multiple layers
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.shadowColor = isPlayer ? '#4facfe' : '#ff4757';
        ctx.shadowBlur = 8;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Inner highlight
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
        ctx.strokeRect(barX + 2, barY + 2, barWidth - 4, barHeight - 4);
        
        ctx.restore();
        
        // Enhanced character name with styling
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.textAlign = isLeft ? 'left' : 'right';
        const nameX = isLeft ? barX : barX + barWidth;
        const nameY = barY - 10;
        
        // Text shadow for better readability
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 3;
        ctx.strokeText(name, nameX, nameY);
        ctx.fillText(name, nameX, nameY);
        ctx.shadowBlur = 0;
        
        // Enhanced health numbers with background
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.textAlign = 'center';
        const healthText = `${Math.max(0, Math.floor(health))}/${maxHealth}`;
        const healthTextX = barX + barWidth/2;
        const healthTextY = barY + barHeight + 20;
        
        // Background for health text
        const textMetrics = ctx.measureText(healthText);
        const textBgX = healthTextX - textMetrics.width/2 - 4;
        const textBgY = healthTextY - 12;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(textBgX, textBgY, textMetrics.width + 8, 16);
        
        // Health text
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 2;
        ctx.strokeText(healthText, healthTextX, healthTextY);
        ctx.fillText(healthText, healthTextX, healthTextY);
        ctx.shadowBlur = 0;
        
        // Enhanced combo indicator with glow
        const comboCount = isPlayer ? combo.player : combo.enemy;
        if (comboCount > 0) {
          ctx.font = 'bold 16px Arial';
          ctx.fillStyle = '#ffd700';
          ctx.strokeStyle = '#b8860b';
          ctx.lineWidth = 2;
          ctx.textAlign = isLeft ? 'left' : 'right';
          const comboX = isLeft ? barX : barX + barWidth;
          const comboY = barY + barHeight + 45;
          
          // Combo glow effect
          ctx.shadowColor = '#ffd700';
          ctx.shadowBlur = 10;
          const comboText = `${comboCount}x COMBO!`;
          ctx.strokeText(comboText, comboX, comboY);
          ctx.fillText(comboText, comboX, comboY);
          ctx.shadowBlur = 0;
        }
        
        // Enhanced special meter (for both players)
        const meterWidth = 180; // Wider special meter
        const meterHeight = 12; // Taller special meter
        const meterX = barX + (barWidth - meterWidth) / 2;
        const meterY = barY + barHeight + (comboCount > 0 ? 65 : 35);
        
        // Special meter background with depth
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(meterX - 2, meterY - 2, meterWidth + 4, meterHeight + 4);
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(meterX, meterY, meterWidth, meterHeight);
        
        // Special meter fill with enhanced gradient
        const specialPercent = isPlayer ? specialMeter.player / 100 : specialMeter.enemy / 100;
        const specialWidth = meterWidth * specialPercent;
        
        let specialGradient;
        if (specialPercent >= 1) {
          // Gold gradient when full
          specialGradient = ctx.createLinearGradient(meterX, meterY, meterX, meterY + meterHeight);
          specialGradient.addColorStop(0, '#ffeb3b');
          specialGradient.addColorStop(0.5, '#ffd700');
          specialGradient.addColorStop(1, '#ff8f00');
        } else {
          // Color-coded gradient for each player
          specialGradient = ctx.createLinearGradient(meterX, meterY, meterX, meterY + meterHeight);
          if (isPlayer) {
            specialGradient.addColorStop(0, '#64b5f6');
            specialGradient.addColorStop(0.5, '#4facfe');
            specialGradient.addColorStop(1, '#2196f3');
          } else {
            specialGradient.addColorStop(0, '#ef5350');
            specialGradient.addColorStop(0.5, '#ff4757');
            specialGradient.addColorStop(1, '#f44336');
          }
        }
        
        ctx.fillStyle = specialGradient;
        ctx.fillRect(meterX, meterY, specialWidth, meterHeight);
        
        // Special meter shine effect
        const specialShine = ctx.createLinearGradient(meterX, meterY, meterX, meterY + meterHeight/3);
        specialShine.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        specialShine.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = specialShine;
        ctx.fillRect(meterX, meterY, specialWidth, meterHeight/3);
        
        // Special meter border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.shadowColor = specialPercent >= 1 ? '#ffd700' : (isPlayer ? '#4facfe' : '#ff4757');
        ctx.shadowBlur = specialPercent >= 1 ? 8 : 4;
        ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);
        ctx.shadowBlur = 0;
        
        // Special meter label with enhanced styling
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.textAlign = 'center';
        const specialText = specialPercent >= 1 ? 'SPECIAL READY!' : 'Special';
        const labelY = meterY - 4;
        
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 2;
        ctx.strokeText(specialText, meterX + meterWidth/2, labelY);
        ctx.fillText(specialText, meterX + meterWidth/2, labelY);
        ctx.shadowBlur = 0;
      };
      
      // Draw health bars at top of screen for both characters
      drawTopHealthBar(0, playerRef.current.health, playerRef.current.maxHealth, playerRef.current.name, true, true); // Player on left
      drawTopHealthBar(0, enemyRef.current.health, enemyRef.current.maxHealth, enemyRef.current.name, false, false); // Enemy on right
      
      // Draw game timer and VS indicator in center top
      const centerX = canvas.width / 2;
      const topY = 30;
      
      // Game timer (countdown)
      const remainingSeconds = Math.max(0, Math.ceil(gameTime / 60)); // Convert frames to seconds
      const minutes = Math.floor(remainingSeconds / 60);
      const seconds = remainingSeconds % 60;
      const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      // Timer color changes based on remaining time
      let timerColor = '#fff';
      if (remainingSeconds <= 10) {
        timerColor = '#ff4444'; // Red when 10 seconds or less
      } else if (remainingSeconds <= 30) {
        timerColor = '#ffaa00'; // Orange when 30 seconds or less
      }
      
      // Enhanced timer with much larger size
      ctx.font = 'bold 56px Orbitron, Arial';
      ctx.fillStyle = timerColor;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 4;
      
      // Add outline stroke for better visibility
      ctx.strokeStyle = '#000';
      ctx.strokeText(timeString, centerX, topY + 15);
      
      // Add pulsing effect when time is low
      if (remainingSeconds <= 10 && remainingSeconds > 0) {
        const pulse = 1 + Math.sin(Date.now() * 0.015) * 0.2;
        ctx.save();
        ctx.scale(pulse, pulse);
        ctx.fillText(timeString, centerX / pulse, (topY + 15) / pulse);
        ctx.restore();
        
        // Add intense glowing effect when critical
        if (remainingSeconds <= 5) {
          ctx.shadowColor = timerColor;
          ctx.shadowBlur = 25;
          ctx.fillText(timeString, centerX, topY + 15);
        }
      } else {
        ctx.fillText(timeString, centerX, topY + 15);
      }
      
      ctx.shadowBlur = 0;
      
      // Round Announcement Display - appears before each round
      if (roundAnnouncement.active) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Create dramatic announcement overlay
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (roundAnnouncement.phase === 'announcing') {
          // Animated entrance for "Round X"
          const progress = (180 - roundAnnouncement.timer) / 60; // First second for entrance
          const scale = Math.min(1, progress * 2);
          const alpha = Math.min(1, progress * 3);
          
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.translate(centerX, centerY - 60);
          ctx.scale(scale, scale);
          
          // Glowing round number
          ctx.font = 'bold 120px Arial';
          ctx.fillStyle = '#fff';
          ctx.shadowColor = '#4facfe';
          ctx.shadowBlur = 30;
          ctx.textAlign = 'center';
          ctx.fillText(`ROUND ${roundAnnouncement.roundToShow}`, 0, 0);
          
          ctx.restore();
          
          // "FIGHT!" appears after 1 second
          if (roundAnnouncement.timer <= 120) {
            const fightProgress = (120 - roundAnnouncement.timer) / 60;
            const fightScale = Math.min(1, fightProgress * 3);
            const flash = Math.sin(Date.now() * 0.02) > 0;
            
            ctx.save();
            ctx.globalAlpha = Math.min(1, fightProgress * 2);
            ctx.translate(centerX, centerY + 80);
            ctx.scale(fightScale, fightScale);
            
            ctx.font = 'bold 80px Arial';
            ctx.fillStyle = flash ? '#ff4757' : '#ffd700';
            ctx.shadowColor = flash ? '#ff4757' : '#ffd700';
            ctx.shadowBlur = 40;
            ctx.textAlign = 'center';
            ctx.fillText('FIGHT!', 0, 0);
            
            ctx.restore();
          }
        }
        
        ctx.restore();
      }
      
      // Match info: Round and Score display (always 3 rounds)
      ctx.font = 'bold 22px Arial';
      if (matchComplete) {
        // Show final match result after all 3 rounds
        const flash = Math.sin(Date.now() * 0.008) > 0;
        ctx.fillStyle = flash ? '#ffd700' : '#ffaa00';
        
        if (matchScore.player > matchScore.enemy) {
          const matchWinner = playerRef.current.name || 'Player';
          ctx.fillText(`🏆 ${matchWinner} WINS THE MATCH!`, centerX, topY + 80);
        } else if (matchScore.enemy > matchScore.player) {
          const matchWinner = enemyRef.current.name || 'Enemy';
          ctx.fillText(`🏆 ${matchWinner} WINS THE MATCH!`, centerX, topY + 80);
        } else {
          ctx.fillText(`🤝 MATCH DRAW!`, centerX, topY + 80);
        }
        
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#fff';
        ctx.fillText(`Final Score: ${matchScore.player} - ${matchScore.enemy} (Best of 3)`, centerX, topY + 105);
      } else if (roundActive) {
        ctx.fillStyle = '#4facfe';
        ctx.fillText(`Round ${roundNumber} (Best of 3)`, centerX, topY + 80);
        
        // Show current standings if past round 1
        if (roundNumber > 1) {
          ctx.font = 'bold 14px Arial';
          ctx.fillStyle = '#aaa';
          ctx.fillText(`Current: ${matchScore.player} - ${matchScore.enemy} (Need 2 to win)`, centerX, topY + 100);
        }
      } else {
        // Flashing text when round is over
        const flash = Math.sin(Date.now() * 0.01) > 0;
        ctx.fillStyle = flash ? '#ff6600' : '#ffaa00';
        ctx.fillText(`Round ${roundNumber} - ENDED`, centerX, topY + 80);
        
        if (lastRoundWinner && lastRoundWinner !== 'Draw') {
          ctx.font = 'bold 16px Arial';
          ctx.fillStyle = '#4facfe';
          ctx.fillText(`Winner: ${lastRoundWinner}`, centerX, topY + 105);
        }
        
        // Always show next round info (unless match complete)
        if (!matchComplete && matchScore.player < 2 && matchScore.enemy < 2) {
          ctx.font = 'bold 14px Arial';
          ctx.fillStyle = '#fff';
          ctx.fillText(`Round ${roundNumber + 1} starting soon...`, centerX, topY + 125);
        } else if (!matchComplete) {
          ctx.font = 'bold 14px Arial';
          ctx.fillStyle = '#ffd700';
          ctx.fillText('Match complete!', centerX, topY + 125);
        }
      }
      
      // Enhanced score display with round indicators
      ctx.font = 'bold 20px Arial';
      ctx.fillStyle = '#fff';
      const playerName = (playerRef.current.name || 'Player').substring(0, 10);
      const enemyName = (enemyRef.current.name || 'Enemy').substring(0, 10);
      
      // Left side - Player score
      ctx.textAlign = 'left';
      ctx.fillText(`${playerName}`, 25, topY + 80);
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = matchScore.player > matchScore.enemy ? '#4facfe' : '#fff';
      ctx.fillText(`${matchScore.player}`, 25, topY + 105);
      
      // Right side - Enemy score  
      ctx.textAlign = 'right';
      ctx.font = 'bold 20px Arial';
      ctx.fillStyle = '#fff';
      ctx.fillText(`${enemyName}`, canvas.width - 25, topY + 80);
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = matchScore.enemy > matchScore.player ? '#4facfe' : '#fff';
      ctx.fillText(`${matchScore.enemy}`, canvas.width - 25, topY + 105);
      
      // Draw round indicators (dots)
      ctx.fillStyle = '#666';
      for (let i = 1; i <= 3; i++) {
        const dotX = centerX - 30 + (i - 1) * 30;
        ctx.beginPath();
        ctx.arc(dotX, topY + 110, 6, 0, Math.PI * 2);
        if (i <= roundNumber && !matchComplete) {
          ctx.fillStyle = i === roundNumber ? '#4facfe' : '#888';
        } else if (matchComplete) {
          ctx.fillStyle = '#ffd700';
        } else {
          ctx.fillStyle = '#444';
        }
        ctx.fill();
      }
      
      ctx.textAlign = 'center';
      
      // VS indicator (positioned below the larger timer)
      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = '#ffd700';
      ctx.textAlign = 'center';
      const vsY = roundActive ? topY + 100 : topY + 120;
      ctx.fillText('VS', centerX, vsY);
      
      // Draw collision boxes (for debugging - make them less prominent)
      if (true) { // Enable collision boxes to see the new smaller size
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)'; // More transparent green boxes
        ctx.lineWidth = 1;
        ctx.strokeRect(playerRef.current.x - CHARACTER_WIDTH/2, playerRef.current.y - CHARACTER_HEIGHT, CHARACTER_WIDTH, CHARACTER_HEIGHT);
        ctx.strokeRect(enemyRef.current.x - CHARACTER_WIDTH/2, enemyRef.current.y - CHARACTER_HEIGHT, CHARACTER_WIDTH, CHARACTER_HEIGHT);
      }
      
      // Render particles - FIXED SYSTEM WITH PROPER ERROR HANDLING
      if (particlesRef.current.length > 0) {
        // Reduced logging frequency - only log every 60 frames (1 second)
        if (gameStateRef.current.frameCount % 60 === 0) {
          console.log(`🎨 RENDERING ${particlesRef.current.length} PARTICLES (Frame: ${gameStateRef.current.frameCount})`);
        }
        
        try {
          ctx.save(); // Save context state
          
          particlesRef.current.forEach((particle, index) => {
            try {
              const alpha = Math.max(0.8, particle.life / particle.maxLife);
              
              if (particle.type === 'explosion') {
                // Explosive particles with bright glow
                ctx.save();
                ctx.translate(particle.x, particle.y);
                ctx.rotate(particle.rotation || 0);
                
                ctx.shadowColor = '#ffff00';
                ctx.shadowBlur = 15;
                ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
                ctx.beginPath();
                ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.beginPath();
                ctx.arc(0, 0, particle.size * 0.6, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.shadowBlur = 0;
                ctx.restore();
                
              } else if (particle.type === 'spark') {
                // Bright spark particles
                ctx.save();
                ctx.translate(particle.x, particle.y);
                ctx.rotate(particle.rotation || 0);
                
                ctx.shadowColor = '#ff4400';
                ctx.shadowBlur = 12;
                ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`;
                ctx.beginPath();
                ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.beginPath();
                ctx.arc(0, 0, particle.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.shadowBlur = 0;
                ctx.restore();
                
              } else if (particle.type === 'shockwave') {
                // Enhanced expanding rings
                ctx.save();
                
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur = 15;
                ctx.strokeStyle = `rgba(0, 255, 255, ${alpha * 0.8})`;
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.stroke();
                
                ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size * 0.7, 0, Math.PI * 2);
                ctx.stroke();
                
                ctx.restore();
                
              } else if (particle.type === 'debris') {
                // Debris particles
                let fillColor = `rgba(200, 160, 120, ${alpha})`;
                if (particle.color === '#ff6b6b' || particle.color === '#ff0000') {
                  fillColor = `rgba(255, 100, 100, ${alpha})`;
                } else if (particle.color === '#888888') {
                  fillColor = `rgba(200, 200, 200, ${alpha})`;
                }
                
                ctx.fillStyle = fillColor;
                ctx.shadowColor = particle.color;
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.strokeStyle = `rgba(0, 0, 0, ${alpha * 0.7})`;
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.shadowBlur = 0;
                
              } else if (particle.type === 'fire') {
                // Fire particles with dynamic flames
                ctx.save();
                ctx.translate(particle.x, particle.y);
                
                // Parse color from particle
                const fireColors = ['#ff4444', '#ff6600', '#ffaa00', '#ff8800', '#ff2200'];
                const baseColor = particle.color || '#ff6600';
                
                // Outer flame glow
                ctx.shadowColor = '#ff4400';
                ctx.shadowBlur = 20;
                ctx.fillStyle = baseColor.replace('rgb', 'rgba').replace(')', ', 0.8)');
                ctx.beginPath();
                ctx.arc(0, 0, particle.size * 1.2, 0, Math.PI * 2);
                ctx.fill();
                
                // Inner flame core
                ctx.shadowBlur = 10;
                ctx.fillStyle = '#ffaa00';
                ctx.beginPath();
                ctx.arc(0, 0, particle.size * 0.7, 0, Math.PI * 2);
                ctx.fill();
                
                // Hot center
                ctx.shadowBlur = 5;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(0, 0, particle.size * 0.3, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.shadowBlur = 0;
                ctx.restore();
                
              } else if (particle.type === 'ember') {
                // Ember particles with glow and sparkle
                ctx.save();
                ctx.translate(particle.x, particle.y);
                
                const emberAlpha = alpha * 0.9;
                
                // Ember glow
                ctx.shadowColor = '#ff6600';
                ctx.shadowBlur = 15;
                ctx.fillStyle = `rgba(255, 102, 0, ${emberAlpha})`;
                ctx.beginPath();
                ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
                ctx.fill();
                
                // Sparkle effect
                if (particle.sparkle && Math.random() > 0.7) {
                  ctx.shadowBlur = 20;
                  ctx.fillStyle = `rgba(255, 255, 255, ${emberAlpha})`;
                  ctx.beginPath();
                  ctx.arc(0, 0, particle.size * 0.5, 0, Math.PI * 2);
                  ctx.fill();
                }
                
                ctx.shadowBlur = 0;
                ctx.restore();
                
              } else if (particle.type === 'ice') {
                // Ice particles with crystalline effects
                ctx.save();
                ctx.translate(particle.x, particle.y);
                ctx.rotate(particle.rotation || 0);
                
                const iceAlpha = alpha * 0.8;
                
                // Ice crystal glow
                ctx.shadowColor = '#88ddff';
                ctx.shadowBlur = 12;
                ctx.fillStyle = `rgba(136, 221, 255, ${iceAlpha})`;
                ctx.beginPath();
                ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
                ctx.fill();
                
                // Crystalline structure
                ctx.strokeStyle = `rgba(255, 255, 255, ${iceAlpha})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(-particle.size, 0);
                ctx.lineTo(particle.size, 0);
                ctx.moveTo(0, -particle.size);
                ctx.lineTo(0, particle.size);
                ctx.stroke();
                
                // Shimmer effect
                if (particle.shimmer && Math.random() > 0.6) {
                  ctx.shadowBlur = 15;
                  ctx.fillStyle = `rgba(255, 255, 255, ${iceAlpha * 0.7})`;
                  ctx.beginPath();
                  ctx.arc(0, 0, particle.size * 0.4, 0, Math.PI * 2);
                  ctx.fill();
                }
                
                ctx.shadowBlur = 0;
                ctx.restore();
                
              } else if (particle.type === 'frost') {
                // Frost particles with subtle effects
                ctx.save();
                
                const frostAlpha = alpha * 0.6;
                
                // Soft frost glow
                ctx.shadowColor = '#e6f3ff';
                ctx.shadowBlur = 8;
                ctx.fillStyle = `rgba(230, 243, 255, ${frostAlpha})`;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
                
                // Twinkle effect
                if (particle.twinkle && Math.random() > 0.8) {
                  ctx.shadowBlur = 12;
                  ctx.fillStyle = `rgba(255, 255, 255, ${frostAlpha})`;
                  ctx.beginPath();
                  ctx.arc(particle.x, particle.y, particle.size * 0.3, 0, Math.PI * 2);
                  ctx.fill();
                }
                
                ctx.shadowBlur = 0;
                ctx.restore();
                
              } else {
                // Normal particles with enhanced visibility
                let fillColor = `rgba(255, 255, 100, ${alpha})`;
                if (particle.color === '#ffff00' || particle.color === '#ffd700') {
                  fillColor = `rgba(255, 255, 0, ${alpha})`;
                } else if (particle.color === '#ff6b6b' || particle.color === '#ff0000') {
                  fillColor = `rgba(255, 100, 100, ${alpha})`;
                } else if (particle.color === '#ffffff') {
                  fillColor = `rgba(255, 255, 255, ${alpha})`;
                } else if (particle.color === '#00ff00') {
                  fillColor = `rgba(100, 255, 100, ${alpha})`;
                }
                
                ctx.fillStyle = fillColor;
                ctx.shadowColor = particle.color;
                ctx.shadowBlur = 15;
                
                ctx.beginPath();
                const size = Math.max(12, particle.size * 1.2);
                ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
                ctx.lineWidth = 3;
                ctx.stroke();
                ctx.shadowBlur = 0;
              }
              
            } catch (particleError) {
              console.error(`❌ Error rendering particle ${index}:`, particleError, particle);
            }
          });
          
          ctx.restore(); // Restore context state
          
        } catch (renderError) {
          console.error('❌ Error in particle rendering system:', renderError);
          ctx.restore(); // Ensure context is restored even on error
        }
        
        // Debug info with reduced frequency
        if (particlesRef.current.length > 0 && gameStateRef.current.frameCount % 120 === 0) {
          const explosionCount = particlesRef.current.filter(p => p.type === 'explosion').length;
          const sparkCount = particlesRef.current.filter(p => p.type === 'spark').length;
          const shockwaveCount = particlesRef.current.filter(p => p.type === 'shockwave').length;
          const debrisCount = particlesRef.current.filter(p => p.type === 'debris').length;
          const normalCount = particlesRef.current.filter(p => p.type === 'normal').length;
          
          console.log(`Particle breakdown: ${explosionCount} explosion, ${sparkCount} spark, ${shockwaveCount} shockwave, ${debrisCount} debris, ${normalCount} normal`);
        }
      }
      
      // Draw enhanced projectiles with type-specific effects
      // Projectiles rendered silently for performance
      projectiles.forEach((projectile, index) => {
        ctx.save();
        
        // Draw motion trail first (behind projectile)
        if (projectile.trail && projectile.trail.length > 0) {
          for (let i = 0; i < projectile.trail.length; i++) {
            const trailPoint = projectile.trail[i];
            const alpha = (i + 1) / projectile.trail.length * 0.6;
            const size = projectile.size * (0.3 + alpha * 0.7);
            
            ctx.globalAlpha = alpha;
            ctx.fillStyle = projectile.color;
            ctx.beginPath();
            ctx.arc(trailPoint.x, trailPoint.y, size, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        }
        
        // Type-specific rendering effects
        if (projectile.type === 'power') {
          // Power projectiles have electric arcs
          ctx.strokeStyle = projectile.color;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.7;
          for (let i = 0; i < 3; i++) {
            const angle = (Date.now() * 0.01 + i * Math.PI * 2 / 3) % (Math.PI * 2);
            const radius = projectile.size + 5;
            ctx.beginPath();
            ctx.moveTo(projectile.x, projectile.y);
            ctx.lineTo(
              projectile.x + Math.cos(angle) * radius,
              projectile.y + Math.sin(angle) * radius
            );
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
        } else if (projectile.type === 'plasma') {
          // Plasma projectiles have energy waves
          ctx.strokeStyle = projectile.color;
          ctx.lineWidth = 3;
          ctx.globalAlpha = 0.4;
          for (let r = projectile.size; r < projectile.size + 15; r += 5) {
            ctx.beginPath();
            ctx.arc(projectile.x, projectile.y, r, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
        } else if (projectile.type === 'homing') {
          // Homing projectiles have guidance indicators
          ctx.strokeStyle = projectile.color;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.8;
          ctx.save();
          ctx.translate(projectile.x, projectile.y);
          ctx.rotate(projectile.rotation);
          
          // Draw guidance fins
          for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(projectile.size + 8, 0);
            ctx.stroke();
            ctx.rotate(Math.PI / 2);
          }
          ctx.restore();
          ctx.globalAlpha = 1;
        }
        
        // Enhanced glow effect based on projectile type
        const glowIntensity = projectile.type === 'power' ? 25 : 
                            projectile.type === 'plasma' ? 20 : 15;
        ctx.shadowColor = projectile.color;
        ctx.shadowBlur = glowIntensity;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Create dynamic gradient based on projectile color
        const projectileGradient = ctx.createRadialGradient(
          projectile.x, projectile.y, 0,
          projectile.x, projectile.y, projectile.size + 5
        );
        
        projectileGradient.addColorStop(0, '#ffffff');
        projectileGradient.addColorStop(0.3, projectile.color);
        projectileGradient.addColorStop(1, projectile.color + '88'); // Add transparency
        
        ctx.fillStyle = projectileGradient;
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Projectile core with pulsing effect
        ctx.shadowBlur = 0;
        const pulseIntensity = 0.8 + Math.sin(Date.now() * 0.01) * 0.2;
        ctx.fillStyle = `rgba(255, 255, 255, ${pulseIntensity})`;
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Type indicator for special projectiles
        if (projectile.type !== 'normal') {
          ctx.font = '10px Arial';
          ctx.fillStyle = projectile.color;
          ctx.textAlign = 'center';
          ctx.fillText(projectile.type.charAt(0).toUpperCase(), projectile.x, projectile.y - projectile.size - 5);
        }
        
        ctx.restore();
      });
      
      // Enhanced debug overlay with projectile and knockback info
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(canvas.width - 300, 10, 290, 220);
      
      ctx.fillStyle = '#00ff00';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(`ENHANCED COMBAT SYSTEM`, canvas.width - 290, 30);
      
      ctx.fillStyle = '#ffff00';
      ctx.font = '14px Arial';
      ctx.fillText(`Active Particles: ${particlesRef.current.length}`, canvas.width - 290, 50);
      ctx.fillText(`Active Projectiles: ${projectiles.length}`, canvas.width - 290, 70);
      ctx.fillText(`Frame: ${gameStateRef.current.frameCount || 0}`, canvas.width - 290, 90);
      
      // Performance information
      ctx.fillStyle = '#00ffff';
      ctx.font = '12px Arial';
      ctx.fillText(`FPS: ${gameStateRef.current.fps || 60}`, canvas.width - 290, 110);
      ctx.fillText(`Frame Time: ${(gameStateRef.current.frameTime || 16.67).toFixed(1)}ms`, canvas.width - 290, 125);
      
      // Knockback information
      ctx.fillStyle = '#ff88ff';
      ctx.font = '12px Arial';
      ctx.fillText(`KNOCKBACK STATUS:`, canvas.width - 290, 145);
      ctx.fillText(`Player velocity: ${playerRef.current.vx.toFixed(1)}`, canvas.width - 290, 160);
      ctx.fillText(`Enemy velocity: ${enemyRef.current.vx.toFixed(1)}`, canvas.width - 290, 175);
      
      // Projectile type controls
      ctx.fillStyle = '#88ffff';
      ctx.font = '12px Arial';
      ctx.fillText(`PROJECTILE CONTROLS:`, canvas.width - 290, 160);
      ctx.fillText(`Q - Normal (KB: 4)`, canvas.width - 290, 175);
      ctx.fillText(`R - Rapid (KB: 2)`, canvas.width - 290, 190);
      ctx.fillText(`1 - Power (KB: 8)`, canvas.width - 290, 205);
      ctx.fillText(`2 - Plasma (KB: 5)`, canvas.width - 290, 220);
      ctx.fillText(`3 - Homing (KB: 6)`, canvas.width - 290, 235);
      
      if (particlesRef.current.length > 0) {
        const types = particlesRef.current.reduce((acc, p) => {
          acc[p.type] = (acc[p.type] || 0) + 1;
          return acc;
        }, {});
        const typeStr = Object.entries(types).map(([type, count]) => `${type}:${count}`).join(' ');
        ctx.fillText(`Particles: ${typeStr}`, canvas.width - 290, 255);
      } else {
        ctx.fillStyle = '#ff0000';
        ctx.fillText(`NO PARTICLES VISIBLE!`, canvas.width - 270, 110);
      }
      ctx.restore();
      
      // Apply cinematic vignette effect
      const vignetteCenterX = canvas.width / 2;
      const vignetteCenterY = canvas.height / 2;
      const vignetteRadius = Math.max(canvas.width, canvas.height) * 0.8;
      
      const vignetteGradient = ctx.createRadialGradient(
        vignetteCenterX, vignetteCenterY, 0,
        vignetteCenterX, vignetteCenterY, vignetteRadius
      );
      vignetteGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignetteGradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
      
      ctx.fillStyle = vignetteGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Enhanced realistic atmospheric background drawing
    function drawAtmosphericBackground(ctx, canvas) {
      const time = Date.now() * 0.001;
      
      // 1. Enhanced dynamic sky with more dramatic color transitions
      const timeOfDay = (Math.sin(time * 0.05) + 1) * 0.5; // Slower, more realistic cycle
      const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.8);
      
      if (timeOfDay < 0.2) { // Deep Night
        skyGradient.addColorStop(0, `hsl(220, 60%, ${2 + timeOfDay * 6}%)`);
        skyGradient.addColorStop(0.2, `hsl(235, 55%, ${4 + timeOfDay * 8}%)`);
        skyGradient.addColorStop(0.6, `hsl(245, 50%, ${6 + timeOfDay * 10}%)`);
        skyGradient.addColorStop(1, `hsl(255, 45%, ${8 + timeOfDay * 12}%)`);
      } else if (timeOfDay < 0.4) { // Late Night to Dawn
        const dawnIntensity = (timeOfDay - 0.2) * 5;
        skyGradient.addColorStop(0, `hsl(${220 + dawnIntensity * 10}, ${60 + dawnIntensity * 5}%, ${4 + dawnIntensity * 8}%)`);
        skyGradient.addColorStop(0.3, `hsl(${30 + dawnIntensity * 15}, ${50 + dawnIntensity * 10}%, ${10 + dawnIntensity * 12}%)`);
        skyGradient.addColorStop(0.7, `hsl(${45 + dawnIntensity * 5}, ${45 + dawnIntensity * 15}%, ${15 + dawnIntensity * 18}%)`);
        skyGradient.addColorStop(1, `hsl(${210 + dawnIntensity * 8}, ${40 + dawnIntensity * 10}%, ${20 + dawnIntensity * 20}%)`);
      } else if (timeOfDay < 0.7) { // Dawn to Day
        const dayIntensity = (timeOfDay - 0.4) / 0.3;
        skyGradient.addColorStop(0, `hsl(${195 + dayIntensity * 10}, ${70 + dayIntensity * 5}%, ${25 + dayIntensity * 20}%)`);
        skyGradient.addColorStop(0.4, `hsl(${205 + dayIntensity * 5}, ${65 + dayIntensity * 10}%, ${35 + dayIntensity * 25}%)`);
        skyGradient.addColorStop(0.8, `hsl(${215 + dayIntensity * 3}, ${60 + dayIntensity * 15}%, ${45 + dayIntensity * 30}%)`);
        skyGradient.addColorStop(1, `hsl(${190 + dayIntensity * 5}, ${55 + dayIntensity * 20}%, ${55 + dayIntensity * 35}%)`);
      } else { // Full Day
        skyGradient.addColorStop(0, `hsl(210, 80%, ${50 + timeOfDay * 15}%)`);
        skyGradient.addColorStop(0.3, `hsl(200, 75%, ${60 + timeOfDay * 12}%)`);
        skyGradient.addColorStop(0.7, `hsl(190, 70%, ${70 + timeOfDay * 10}%)`);
        skyGradient.addColorStop(1, `hsl(180, 65%, ${80 + timeOfDay * 8}%)`);
      }
      
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height * 0.8);
      
      // 1.5. Add sun/moon based on time of day
      const celestialX = canvas.width * 0.75;
      const celestialY = canvas.height * 0.15 + Math.sin(time * 0.2) * 20;
      
      if (timeOfDay > 0.3) {
        // Sun
        const sunSize = 25 + Math.sin(time * 0.3) * 3;
        
        // Sun halo
        const haloGradient = ctx.createRadialGradient(celestialX, celestialY, 0, celestialX, celestialY, sunSize * 2.5);
        haloGradient.addColorStop(0, 'hsla(50, 100%, 70%, 0.4)');
        haloGradient.addColorStop(0.5, 'hsla(45, 90%, 60%, 0.2)');
        haloGradient.addColorStop(1, 'hsla(40, 80%, 50%, 0)');
        
        ctx.fillStyle = haloGradient;
        ctx.beginPath();
        ctx.arc(celestialX, celestialY, sunSize * 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Sun body
        ctx.fillStyle = '#ffeb3b';
        ctx.shadowColor = '#ffeb3b';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(celestialX, celestialY, sunSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        // Moon
        const moonSize = 20;
        
        // Moon glow
        const moonGlow = ctx.createRadialGradient(celestialX, celestialY, 0, celestialX, celestialY, moonSize * 1.8);
        moonGlow.addColorStop(0, 'hsla(220, 50%, 80%, 0.3)');
        moonGlow.addColorStop(1, 'hsla(220, 50%, 80%, 0)');
        
        ctx.fillStyle = moonGlow;
        ctx.beginPath();
        ctx.arc(celestialX, celestialY, moonSize * 1.8, 0, Math.PI * 2);
        ctx.fill();
        
        // Moon body
        ctx.fillStyle = '#e3f2fd';
        ctx.shadowColor = '#e3f2fd';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(celestialX, celestialY, moonSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Moon craters
        ctx.fillStyle = '#bbdefb';
        ctx.beginPath();
        ctx.arc(celestialX - 6, celestialY - 4, 2.5, 0, Math.PI * 2);
        ctx.arc(celestialX + 4, celestialY + 2, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // 2. Enhanced city skyline with dynamic lighting
      drawCityscape(ctx, canvas, time, timeOfDay);
      
      // 3. Enhanced starfield with atmospheric effects
      if (timeOfDay < 0.6) { // Show stars during night/twilight
        backgroundStars.current.forEach(star => {
          const depth = star.layer;
          const parallax = depth * 0.15;
          const adjustedX = star.x + Math.sin(time * 0.08) * parallax;
          
          const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.5 + 0.5;
          const atmosphericDimming = Math.max(0, 1 - timeOfDay * 1.8);
          
          ctx.save();
          ctx.globalAlpha = star.brightness * twinkle * atmosphericDimming * (0.7 + depth * 0.3);
          
          // Enhanced star rendering with glow
          ctx.shadowColor = star.color;
          ctx.shadowBlur = star.size * (3 + depth * 2);
          ctx.fillStyle = star.color;
          
          if (star.size > 2.5) {
            // Bright stars with enhanced cross pattern
            const crossSize = star.size * 5;
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = star.color;
            ctx.beginPath();
            ctx.moveTo(adjustedX - crossSize, star.y);
            ctx.lineTo(adjustedX + crossSize, star.y);
            ctx.moveTo(adjustedX, star.y - crossSize);
            ctx.lineTo(adjustedX, star.y + crossSize);
            ctx.stroke();
          }
          
          // Star core
          ctx.beginPath();
          ctx.arc(adjustedX, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
        
        // Add nebula effect during deep night
        if (timeOfDay < 0.3) {
          ctx.save();
          ctx.globalAlpha = (0.3 - timeOfDay) * 1.2;
          const nebulaGradient = ctx.createRadialGradient(
            canvas.width * 0.7, canvas.height * 0.3, 0,
            canvas.width * 0.7, canvas.height * 0.3, canvas.width * 0.4
          );
          nebulaGradient.addColorStop(0, 'hsla(270, 60%, 40%, 0.3)');
          nebulaGradient.addColorStop(0.5, 'hsla(290, 50%, 30%, 0.15)');
          nebulaGradient.addColorStop(1, 'hsla(320, 40%, 20%, 0)');
          
          ctx.fillStyle = nebulaGradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.restore();
        }
      }
      
      // 4. Dynamic weather effects
      drawWeatherEffects(ctx, canvas, time);
      
      // 5. Atmospheric clouds with realistic movement
      backgroundClouds.current.forEach(cloud => {
        cloud.x += cloud.speed + weatherEffects.current.wind * 0.1;
        if (cloud.x > canvas.width + cloud.width) {
          cloud.x = -cloud.width;
          cloud.y = Math.random() * 150 + 30;
        }
        
        const layerAlpha = (3 - cloud.layer) / 3; // Further clouds are more transparent
        ctx.save();
        ctx.globalAlpha = cloud.opacity * layerAlpha;
        
        // Different cloud rendering based on type
        if (cloud.type === 'storm') {
          ctx.fillStyle = '#2c2c54';
          ctx.shadowColor = '#2c2c54';
          ctx.shadowBlur = 10;
        } else if (cloud.type === 'stratus') {
          ctx.fillStyle = '#404066';
        } else {
          ctx.fillStyle = '#505080';
        }
        
        // Realistic cloud shape with multiple layers
        for (let i = 0; i < 7; i++) {
          const offsetX = (i - 3) * cloud.width * 0.12;
          const offsetY = Math.sin(i + time * 0.3) * 8;
          const radius = cloud.height * (0.3 + i * 0.05);
          
          ctx.beginPath();
          ctx.arc(
            cloud.x + offsetX + cloud.width * 0.5, 
            cloud.y + offsetY + cloud.height * 0.5, 
            radius, 
            0, Math.PI * 2
          );
          ctx.fill();
        }
        ctx.restore();
      });
      
      // 5.5. Volumetric atmospheric fog layers for depth
      const fogLayers = [
        { y: canvas.height * 0.6, opacity: 0.08, color: 'hsl(220, 30%, 60%)' },
        { y: canvas.height * 0.7, opacity: 0.12, color: 'hsl(210, 25%, 55%)' },
        { y: canvas.height * 0.8, opacity: 0.15, color: 'hsl(200, 20%, 50%)' }
      ];
      
      fogLayers.forEach((layer, index) => {
        ctx.save();
        const waveOffset = Math.sin(time * 0.25 + index) * 15;
        const fogGradient = ctx.createLinearGradient(0, layer.y, 0, layer.y + 40);
        fogGradient.addColorStop(0, layer.color.replace(')', `, ${layer.opacity})`).replace('hsl', 'hsla'));
        fogGradient.addColorStop(1, layer.color.replace(')', ', 0)').replace('hsl', 'hsla'));
        
        ctx.fillStyle = fogGradient;
        ctx.fillRect(0, layer.y + waveOffset, canvas.width, 40);
        ctx.restore();
      });
      
      // 6. Enhanced floating debris with realistic physics
      backgroundDebris.current.forEach(debris => {
        // Wind effect
        debris.speedX += weatherEffects.current.wind * 0.02;
        debris.x += debris.speedX;
        debris.y += debris.speedY;
        debris.rotation += debris.rotationSpeed;
        
        // Add gravity and air resistance
        if (debris.type === 'dust' || debris.type === 'paper') {
          debris.speedY += 0.02; // Light gravity
          debris.speedX *= 0.995; // Air resistance
        } else {
          debris.speedY += 0.05; // Heavier objects
          debris.speedX *= 0.98;
        }
        
        // Wrap around screen with some randomization
        if (debris.x > canvas.width + 20) {
          debris.x = -20;
          debris.speedX = (Math.random() - 0.5) * 0.8;
        }
        if (debris.x < -20) debris.x = canvas.width + 20;
        if (debris.y > canvas.height + 20) {
          debris.y = -20;
          debris.speedY = Math.random() * 0.5;
        }
        if (debris.y < -20) debris.y = canvas.height + 20;
        
        const layerAlpha = (3 - debris.layer) / 3;
        ctx.save();
        ctx.translate(debris.x, debris.y);
        ctx.rotate(debris.rotation);
        ctx.globalAlpha = debris.opacity * layerAlpha;
        
        // Different debris rendering based on type
        ctx.fillStyle = debris.color;
        
        switch (debris.type) {
          case 'metal':
            ctx.shadowColor = debris.color;
            ctx.shadowBlur = 2;
            ctx.fillRect(-debris.size, -debris.size, debris.size * 2, debris.size * 2);
            break;
          case 'paper':
            ctx.beginPath();
            ctx.moveTo(-debris.size, -debris.size);
            ctx.lineTo(debris.size, -debris.size * 0.7);
            ctx.lineTo(debris.size * 0.8, debris.size);
            ctx.lineTo(-debris.size * 0.9, debris.size * 0.8);
            ctx.fill();
            break;
          case 'spark':
            ctx.shadowColor = debris.color;
            ctx.shadowBlur = debris.size * 2;
            ctx.beginPath();
            ctx.arc(0, 0, debris.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
            break;
          default:
            ctx.beginPath();
            ctx.arc(0, 0, debris.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
      });
      
      // 7. Dynamic lighting system
      drawAtmosphericLighting(ctx, canvas, time, timeOfDay);
    }

    // Realistic cityscape drawing function
    function drawCityscape(ctx, canvas, time, timeOfDay) {
      const buildings = backgroundBuildings.current;
      
      ctx.save();
      buildings.forEach(building => {
        // Building base color changes with time of day
        const baseColor = timeOfDay < 0.3 ? building.color : 
                         timeOfDay < 0.7 ? '#2a3550' : '#3a4560';
        
        ctx.fillStyle = baseColor;
        ctx.fillRect(building.x, building.y, building.width, building.height);
        
        // Building windows
        building.windows.forEach(window => {
          if (window.lit) {
            const flicker = Math.sin(time * 2 + window.id) * 0.1 + 0.9;
            ctx.globalAlpha = flicker * 0.8;
            ctx.fillStyle = window.color;
            ctx.fillRect(
              building.x + window.x, 
              building.y + window.y, 
              window.width, 
              window.height
            );
            
            // Window glow effect
            if (timeOfDay < 0.5) {
              ctx.shadowColor = window.color;
              ctx.shadowBlur = 3;
              ctx.fillRect(
                building.x + window.x, 
                building.y + window.y, 
                window.width, 
                window.height
              );
              ctx.shadowBlur = 0;
            }
          }
        });
        
        // Building details (antennas, spires)
        if (building.hasAntenna) {
          ctx.strokeStyle = '#4a90e2';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(building.x + building.width * 0.5, building.y);
          ctx.lineTo(building.x + building.width * 0.5, building.y - 20);
          ctx.stroke();
          
          // Blinking antenna light
          if (Math.sin(time * 3) > 0.5) {
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.arc(building.x + building.width * 0.5, building.y - 20, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });
      ctx.restore();
    }
    
    // Weather effects drawing function
    function drawWeatherEffects(ctx, canvas, time) {
      const weather = weatherEffects.current;
      
      // Rain effect
      if (weather.rainIntensity > 0) {
        ctx.save();
        ctx.globalAlpha = weather.rainIntensity * 0.3;
        ctx.strokeStyle = '#a0a0c0';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < 50 * weather.rainIntensity; i++) {
          const x = (i * 23 + time * 100) % (canvas.width + 50);
          const y = (i * 17 + time * 200) % (canvas.height + 50);
          
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - 3, y + 15);
          ctx.stroke();
        }
        ctx.restore();
      }
      
      // Fog effect
      if (weather.fogDensity > 0) {
        ctx.save();
        ctx.globalAlpha = weather.fogDensity * 0.2;
        
        const fogGradient = ctx.createLinearGradient(0, canvas.height * 0.6, 0, canvas.height);
        fogGradient.addColorStop(0, 'rgba(150, 150, 180, 0)');
        fogGradient.addColorStop(1, 'rgba(150, 150, 180, 0.8)');
        
        ctx.fillStyle = fogGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
    }
    
    // Atmospheric lighting effects
    function drawAtmosphericLighting(ctx, canvas, time, timeOfDay) {
      const lighting = backgroundLights.current;
      
      // City glow effect
      ctx.save();
      ctx.globalAlpha = 0.3 * (1 - timeOfDay);
      
      const cityGlow = ctx.createRadialGradient(
        canvas.width * 0.5, canvas.height * 0.8, 0,
        canvas.width * 0.5, canvas.height * 0.8, canvas.width * 0.6
      );
      cityGlow.addColorStop(0, 'rgba(255, 200, 100, 0.2)');
      cityGlow.addColorStop(1, 'rgba(255, 200, 100, 0)');
      
      ctx.fillStyle = cityGlow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Lightning flashes
      if (lighting.lightning.active) {
        ctx.globalAlpha = lighting.lightning.intensity;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Decrease lightning intensity
        lighting.lightning.intensity *= 0.7;
        if (lighting.lightning.intensity < 0.1) {
          lighting.lightning.active = false;
        }
      }
      
      // Random lightning trigger
      if (Math.random() < 0.001) {
        lighting.lightning.active = true;
        lighting.lightning.intensity = 0.3 + Math.random() * 0.4;
      }
      
      ctx.restore();
    }

    // Realistic foreground drawing function
    function drawRealisticForeground(ctx, canvas, time) {
      const elements = foregroundElements.current;
      
      elements.forEach(element => {
        ctx.save();
        
        switch (element.type) {
          case 'manhole':
            // Draw manhole cover
            ctx.fillStyle = element.color;
            ctx.fillRect(element.x, element.y, element.width, element.height);
            
            // Manhole details
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 1;
            ctx.strokeRect(element.x + 2, element.y + 1, element.width - 4, element.height - 2);
            
            // Center dot pattern
            ctx.fillStyle = '#222';
            for (let i = 0; i < 3; i++) {
              for (let j = 0; j < 8; j++) {
                ctx.fillRect(element.x + 6 + j * 4, element.y + 2 + i * 2, 1, 1);
              }
            }
            break;
            
          case 'pipe':
            // Draw industrial pipe
            ctx.fillStyle = element.color;
            ctx.fillRect(element.x, element.y, element.width, element.height);
            
            // Pipe highlights and shadows
            ctx.fillStyle = '#888';
            ctx.fillRect(element.x, element.y, 2, element.height);
            ctx.fillStyle = '#222';
            ctx.fillRect(element.x + element.width - 2, element.y, 2, element.height);
            
            // Steam effect
            if (element.steam) {
              const steamOpacity = 0.3 + Math.sin(time * 3 + element.x * 0.01) * 0.2;
              ctx.globalAlpha = steamOpacity;
              ctx.fillStyle = '#ffffff';
              
              for (let i = 0; i < 3; i++) {
                const steamY = element.y - 10 - i * 8 + Math.sin(time * 2 + i) * 3;
                const steamSize = 4 + i * 2;
                ctx.fillRect(element.x + element.width/2 - steamSize/2, steamY, steamSize, 2);
              }
            }
            break;
            
          case 'trash':
            // Draw trash/debris
            ctx.fillStyle = element.color;
            ctx.fillRect(element.x, element.y, element.width, element.height);
            
            // Add some texture
            ctx.fillStyle = '#654321';
            ctx.fillRect(element.x + 1, element.y + 1, element.width - 2, 2);
            break;
            
          case 'streetlight':
            // Draw streetlight pole
            ctx.fillStyle = element.color;
            ctx.fillRect(element.x, element.y, element.width, element.height);
            
            // Light at top
            if (element.light) {
              const lightOpacity = 0.6 + Math.sin(time * 1.5 + element.x * 0.01) * 0.2;
              ctx.globalAlpha = lightOpacity;
              
              // Light glow
              const gradient = ctx.createRadialGradient(
                element.x + element.width/2, element.y - 5, 0,
                element.x + element.width/2, element.y - 5, 40
              );
              gradient.addColorStop(0, 'rgba(255, 255, 150, 0.8)');
              gradient.addColorStop(1, 'rgba(255, 255, 150, 0)');
              
              ctx.fillStyle = gradient;
              ctx.fillRect(element.x - 35, element.y - 40, 80, 80);
              
              // Light fixture
              ctx.globalAlpha = 1;
              ctx.fillStyle = '#444';
              ctx.fillRect(element.x - 8, element.y - 8, element.width + 16, 8);
            }
            break;
            
          case 'vent':
            // Draw vent grate
            ctx.fillStyle = element.color;
            ctx.fillRect(element.x, element.y, element.width, element.height);
            
            // Vent slats
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            for (let i = 1; i < element.height - 1; i += 3) {
              ctx.beginPath();
              ctx.moveTo(element.x + 2, element.y + i);
              ctx.lineTo(element.x + element.width - 2, element.y + i);
              ctx.stroke();
            }
            
            // Glow effect
            if (element.glow) {
              const glowOpacity = 0.3 + Math.sin(time * 2 + element.x * 0.02) * 0.2;
              ctx.globalAlpha = glowOpacity;
              ctx.fillStyle = '#ff6600';
              ctx.fillRect(element.x + 2, element.y + 2, element.width - 4, element.height - 4);
            }
            break;
            
          case 'puddle':
            // Draw reflective puddle
            ctx.fillStyle = element.color;
            ctx.fillRect(element.x, element.y, element.width, element.height);
            
            // Reflection shimmer
            if (element.reflective) {
              const shimmer = 0.2 + Math.sin(time * 4 + element.x * 0.03) * 0.1;
              ctx.globalAlpha = shimmer;
              ctx.fillStyle = '#4facfe';
              ctx.fillRect(element.x + 5, element.y, element.width - 10, 1);
            }
            break;
            
          case 'floating_debris':
            // Update position
            element.x += element.speedX;
            element.y += element.speedY;
            
            // Wrap around screen
            if (element.x > canvas.width + 10) element.x = -10;
            if (element.x < -10) element.x = canvas.width + 10;
            if (element.y > canvas.height + 10) element.y = -10;
            if (element.y < -10) element.y = canvas.height + 10;
            
            // Draw floating debris
            ctx.globalAlpha = element.opacity;
            ctx.fillStyle = element.color;
            ctx.fillRect(element.x, element.y, element.size, element.size);
            break;
        }
        
        ctx.restore();
      });
    }

    // Atmospheric background functions would go here if needed
    
    // Enhanced projectile system with multiple types
    function fireProjectile(shooter, direction, type = 'normal') {
          const speed = 2 + Math.random() * 4;
          const life = 30 + Math.random() * 20; // Optimized shorter life
          
          particle = {
            x: x + (Math.random() - 0.5) * 15,
            y: y + (Math.random() - 0.5) * 15,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: life,
            maxLife: life,
            color: color,
            size: 3 + Math.random() * 5, // Reduced from 8-20 to 3-8
            type: 'explosion',
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.2
          };
        // CORRUPTED CODE REMOVED FROM HERE
        // } else if (type === 'spark') {
        //   // Electric spark particles - fast moving
        //   const angle = Math.random() * Math.PI * 2;
          // const speed = 4 + Math.random() * 6;
          // const life = 25 + Math.random() * 15; // Optimized shorter life
          
          particle = {
            x: x + (Math.random() - 0.5) * 10,
            y: y + (Math.random() - 0.5) * 10,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: life,
            maxLife: life,
            color: color,
            size: 2 + Math.random() * 3,
            type: 'spark',
            trail: [], // For spark trails
            trailLength: 3 // Reduced trail length
          };
        // } else if (type === 'shockwave') {
          // Expanding shockwave rings
          // const life = 15 + Math.random() * 10; // Shorter life
          
          particle = {
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            life: life,
            maxLife: life,
            color: color,
            size: 2 + Math.random() * 3,
            type: 'shockwave',
            expansion: 2 + Math.random() * 3
          };
        // } else if (type === 'debris') {
          // Heavy debris particles - affected by gravity
          // const life = 25 + Math.random() * 15; // Shorter life
          
          // particle = {
            // x: x + (Math.random() - 0.5) * 20,
            // y: y + (Math.random() - 0.5) * 20,
            // vx: (Math.random() - 0.5) * 4,
            // vy: (Math.random() - 0.5) * 4 - 2,
            // life: life,
            // maxLife: life,
            // color: color,
            // size: 3 + Math.random() * 5, // Smaller size
            // type: 'debris',
            // bounce: 0.3 + Math.random() * 0.4
          // };
        // } else if (type === 'impact') {
          // Impact particles for combat hits
          // const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
          // const speed = 1 + Math.random() * 3;
          // const life = 20 + Math.random() * 10;
          
          // particle = {
            // x: x + (Math.random() - 0.5) * 10,
            // y: y + (Math.random() - 0.5) * 10,
            // vx: Math.cos(angle) * speed,
            // vy: Math.sin(angle) * speed,
            // life: life,
            // maxLife: life,
            // color: color,
            // size: 2 + Math.random() * 4,
            // type: 'impact'
          // };
        // } else if (type === 'energy') {
          // Energy particles for special moves
          // const angle = Math.random() * Math.PI * 2;
          // const speed = 2 + Math.random() * 4;
          // const life = 30 + Math.random() * 20;
          
          // particle = {
            // x: x + (Math.random() - 0.5) * 15,
            // y: y + (Math.random() - 0.5) * 15,
            // vx: Math.cos(angle) * speed,
            // vy: Math.sin(angle) * speed,
            // life: life,
            // maxLife: life,
            // color: color,
            // size: 3 + Math.random() * 4,
            // type: 'energy',
            // glow: true,
            // pulseRate: 0.1 + Math.random() * 0.1
          // };
        // } else if (type === 'dust') {
          // Dust particles for movement
          // const life = 15 + Math.random() * 10;
          
          // particle = {
            // x: x + (Math.random() - 0.5) * 25,
            // y: y + (Math.random() - 0.5) * 8,
            // vx: (Math.random() - 0.5) * 2,
            // vy: -(Math.random() * 1.5),
            // life: life,
            // maxLife: life,
            // color: color,
            // size: 1 + Math.random() * 3,
            // type: 'dust',
            // drift: true
          // };
        // } else if (type === 'trail') {
          // Trail particles for fast movement
          // const life = 12 + Math.random() * 8;
          
          // particle = {
            // x: x + (Math.random() - 0.5) * 8,
            // y: y + (Math.random() - 0.5) * 8,
            // vx: (Math.random() - 0.5) * 1,
            // vy: (Math.random() - 0.5) * 1,
            // life: life,
            // maxLife: life,
            // color: color,
            // size: 1 + Math.random() * 2,
            // type: 'trail',
            // fadeRate: 0.15
          // };
        // } else if (type === 'sparkle') {
          // Sparkle particles for special items/effects
          // const life = 40 + Math.random() * 20;
          
          // particle = {
            // x: x + (Math.random() - 0.5) * 20,
            // y: y + (Math.random() - 0.5) * 20,
            // vx: (Math.random() - 0.5) * 1,
            // vy: -(Math.random() * 2),
            // life: life,
            // maxLife: life,
            // color: color,
            // size: 2 + Math.random() * 3,
            // type: 'sparkle',
            // twinkle: true,
            // twinkleRate: 0.2
          // };
        // } else if (type === 'spiral') {
          // Spiral particles for spinning attacks
          // const angle = (i / count) * Math.PI * 2;
          // const radius = 10 + Math.random() * 15;
          // const life = 25 + Math.random() * 15;
          
          // particle = {
            // x: x + Math.cos(angle) * radius,
            // y: y + Math.sin(angle) * radius,
            // vx: Math.cos(angle + Math.PI/2) * 2,
            // vy: Math.sin(angle + Math.PI/2) * 2,
            // life: life,
            // maxLife: life,
            // color: color,
            // size: 2 + Math.random() * 3,
            // type: 'spiral',
            // spiralSpeed: 0.1 + Math.random() * 0.1
          // };
        // } else if (type === 'glow') {
          // Glowing particles for aura effects
          // const life = 20 + Math.random() * 15;
          
          // particle = {
            // x: x + (Math.random() - 0.5) * 30,
            // y: y + (Math.random() - 0.5) * 30,
            // vx: (Math.random() - 0.5) * 0.5,
            // vy: (Math.random() - 0.5) * 0.5,
            // life: life,
            // maxLife: life,
            // color: color,
            // size: 3 + Math.random() * 4,
            // type: 'glow',
            // glow: true,
            // alpha: 0.4 + Math.random() * 0.4
          // };
        // } else if (type === 'aura') {
          // Aura particles that orbit around a point
          // const angle = (i / count) * Math.PI * 2;
          // const radius = 20 + Math.random() * 20;
          // const life = 60 + Math.random() * 30;
          
          // particle = {
            // x: x + Math.cos(angle) * radius,
            // y: y + Math.sin(angle) * radius,
            // vx: 0,
            // vy: 0,
            // life: life,
            // maxLife: life,
            // color: color,
            // size: 2 + Math.random() * 2,
            // type: 'aura',
            // centerX: x,
            // centerY: y,
            // angle: angle,
            // radius: radius,
            // orbitSpeed: 0.02 + Math.random() * 0.03
          // };
        // } else {
          // Normal particles - improved default
          // const life = 20 + Math.random() * 15; // Shorter life
          
          // particle = {
            // x: x + (Math.random() - 0.5) * 20,
            // y: y + (Math.random() - 0.5) * 20,
            // vx: (Math.random() - 0.5) * 4,
            // vy: (Math.random() - 0.5) * 4 - 1,
            // life: life,
            // maxLife: life,
            // color: color,
            // size: 3 + Math.random() * 5,
            // type: 'normal'
          // };
        // }
        
        // newParticles.push(particle);
      // }
      
      // const previousCount = particlesRef.current.length;
      // particlesRef.current.push(...newParticles);
      
      // Only log significant particle additions
      // if (particlesRef.current.length > previousCount + 5) {
        // console.log(`✅ PARTICLES ADDED: ${previousCount} -> ${particlesRef.current.length}`);
      // }
    }

    // Enhanced projectile system with multiple types
    function fireProjectile(shooter, direction, type = 'normal') {
      // Projectile type configurations
      const projectileTypes = {
        normal: {
          speed: 8,
          size: 6,
          damage: 0.7,
          life: 120,
          color: shooter === playerRef.current ? '#4facfe' : '#ff4757',
          gravity: 0,
          bounce: false,
          piercing: false,
          homing: false
        },
        power: {
          speed: 6,
          size: 10,
          damage: 1.2,
          life: 150,
          color: shooter === playerRef.current ? '#00ff88' : '#ff8800',
          gravity: 0,
          bounce: false,
          piercing: true,
          homing: false
        },
        rapid: {
          speed: 12,
          size: 4,
          damage: 0.4,
          life: 90,
          color: shooter === playerRef.current ? '#ffff00' : '#ff0088',
          gravity: 0,
          bounce: false,
          piercing: false,
          homing: false
        },
        plasma: {
          speed: 7,
          size: 8,
          damage: 0.9,
          life: 100,
          color: shooter === playerRef.current ? '#88ffff' : '#ff4400',
          gravity: 0.02,
          bounce: true,
          piercing: false,
          homing: false
        },
        homing: {
          speed: 5,
          size: 7,
          damage: 0.8,
          life: 180,
          color: shooter === playerRef.current ? '#ff00ff' : '#00ffff',
          gravity: 0,
          bounce: false,
          piercing: false,
          homing: true
        },
        fire: {
          speed: 6,
          size: 7,
          damage: 1.0,
          life: 110,
          color: shooter === playerRef.current ? '#ff6600' : '#ff4444',
          gravity: -0.01, // Slight upward drift like flames
          bounce: false,
          piercing: false,
          homing: false,
          particleType: 'fire',
          trailEffect: true
        },
        ice: {
          speed: 5,
          size: 6,
          damage: 0.8,
          life: 140,
          color: shooter === playerRef.current ? '#88ddff' : '#aaeeff',
          gravity: 0.03, // Falls like ice
          bounce: false,
          piercing: false,
          homing: false,
          particleType: 'ice',
          freezeEffect: true
        },
        ember: {
          speed: 4,
          size: 5,
          damage: 0.6,
          life: 90,
          color: shooter === playerRef.current ? '#ff8800' : '#ff6600',
          gravity: 0.01,
          bounce: true,
          piercing: false,
          homing: false,
          particleType: 'ember',
          sparkleTrail: true
        }
      };
      
      const config = projectileTypes[type] || projectileTypes.normal;
      const isPlayer = shooter === playerRef.current;
      
      const newProjectile = {
        x: shooter.x + (direction === 'right' ? 40 : -40),
        y: shooter.y - 40,
        vx: direction === 'right' ? config.speed : -config.speed,
        vy: 0,
        size: config.size,
        type: type,
        owner: isPlayer ? 'player' : 'enemy',
        damage: Math.floor(shooter.attack * config.damage),
        life: config.life,
        maxLife: config.life,
        color: config.color,
        gravity: config.gravity,
        bounce: config.bounce,
        piercing: config.piercing,
        homing: config.homing,
        bounceCount: 0,
        maxBounces: 3,
        trail: [],
        trailLength: type === 'plasma' ? 8 : 5,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.3
      };
      
      setProjectiles(prev => [...prev, newProjectile]);
      // Reduced logging for performance
      
      // Muzzle flash particles removed - now only show on character hits
    }

    function triggerCollisionAnimation(x, y) {
      setCollisionAnimation({ active: true, x, y, timer: 30 });
      setScreenShake({ active: true, intensity: 8, timer: 20 });
      
      // Add immediate sprite impact effects
      if (playerSpriteRef.current) {
        playerSpriteRef.current.playImpactAnimation();
        console.log('🤝 Player collision effect triggered!');
      }
      
      if (enemySpriteRef.current) {
        enemySpriteRef.current.playImpactAnimation();
        console.log('🤝 Enemy collision effect triggered!');
      }
      
      // OPTIMIZED COLLISION PARTICLE EFFECTS
      
      // 1. Main explosion burst (minimal)
      createParticles(x, y, '#ffff00', 1, 'explosion');
      createParticles(x, y, '#ff8800', 1, 'explosion'); // Orange explosion
      
      // 2. Electric sparks (minimal)  
      createParticles(x, y, '#ffffff', 1, 'spark');
      
      // 3. Shockwave rings (minimal)
      createParticles(x, y, '#ffffff', 1, 'shockwave'); // White shockwaves
      
      // Reduced logging frequency
      if (gameStateRef.current.frameCount % 30 === 0) {
        console.log(`Collision animation at (${x}, ${y}) - optimized particles created`);
      }
      
      // Apply stronger repelling force for more dramatic effect
      const playerX = playerRef.current.x;
      const enemyX = enemyRef.current.x;
      const repelForce = 12; // Increased from 8
      
      if (playerX < enemyX) {
        // Player is on the left, push left; enemy push right
        playerRef.current.vx = -repelForce;
        enemyRef.current.vx = repelForce;
      } else {
        // Player is on the right, push right; enemy push left
        playerRef.current.vx = repelForce;
        enemyRef.current.vx = -repelForce;
      }
      
      // Add more dramatic upward bounce
      if (playerRef.current.onGround) {
        playerRef.current.vy = -5; // Increased from -3
        playerRef.current.onGround = false;
      }
      if (enemyRef.current.onGround) {
        enemyRef.current.vy = -5; // Increased from -3
        enemyRef.current.onGround = false;
      }
    }

    function checkCollision(rect1, rect2) {
      return rect1.x < rect2.x + rect2.width &&
             rect1.x + rect1.width > rect2.x &&
             rect1.y < rect2.y + rect2.height &&
             rect1.y + rect1.height > rect2.y;
    }

    // Enhanced Combat System Functions
    function performCombatAttack(attackType, comboPower = 1.0) {
      console.log(`=== ENHANCED COMBAT: ${attackType.toUpperCase()} ===`);
      console.log(`Combo Power: ${comboPower}x`);
      
      if (playerRef.current.isAttacking || playerRef.current.attackCooldown > 0) {
        console.log('Attack blocked - player still in attack state');
        return;
      }

      playerRef.current.isAttacking = true;
      playerRef.current.attackCooldown = Math.floor(30 / comboPower); // Faster cooldown for combos
      
      // Set animation based on attack type with enhanced effects
      const animations = {
        'left-punch': 'punch1',
        'right-punch': 'punch2', 
        'left-kick': 'kick',
        'right-kick': 'kick_low',
        'double-punch': 'punch3',
        'double-kick': 'punch_quad' // Using enhanced quad animation
      };
      
      const selectedAnimation = animations[attackType] || 'punch1';
      playerRef.current.currentAnimation = selectedAnimation;
      
      // Apply special effects based on attack type
      if (playerSpriteRef.current) {
        playerSpriteRef.current.setAnimation(selectedAnimation);
        
        // Immediate charging effect for all attacks
        playerSpriteRef.current.playSpecialEffect('charging');
        console.log(`🔥 Attack effects triggered for ${attackType}`);
        
        // Add special effects for powerful attacks
        if (attackType === 'double-punch' || attackType === 'double-kick') {
          setTimeout(() => {
            if (playerSpriteRef.current) {
              playerSpriteRef.current.effects.glow.color = '#ffd700';
              playerSpriteRef.current.effects.scale.target = 1.3;
              console.log('⚡ Enhanced combo effect applied!');
            }
          }, 50);
        }
      }
      
      // Check if attack hits enemy
      const distance = Math.abs(playerRef.current.x - enemyRef.current.x);
      console.log('Attack distance:', distance, 'Required distance:', CHARACTER_WIDTH + 20);
      
      if (distance < CHARACTER_WIDTH + 20) {
        console.log('ENHANCED ATTACK HIT!');
        
        // Immediate impact effects on both sprites
        if (playerSpriteRef.current) {
          playerSpriteRef.current.playImpactAnimation();
          console.log('🥊 Player impact effect triggered!');
        }
        
        if (enemySpriteRef.current) {
          enemySpriteRef.current.playSpecialEffect('damage');
          console.log('💥 Enemy damage effect triggered!');
        }
        
        // Calculate damage based on attack type and combo power
        let baseDamage = playerRef.current.attack;
        let damageMultiplier = 1.0;
        
        switch(attackType) {
          case 'left-punch':
          case 'right-punch':
            damageMultiplier = 1.0;
            break;
          case 'left-kick':
          case 'right-kick':
            damageMultiplier = 1.2; // Kicks are stronger
            break;
          case 'double-punch':
            damageMultiplier = 1.8; // Strong combo
            break;
          case 'double-kick':
            damageMultiplier = 2.2; // Strongest combo
            break;
        }
        
        let totalDamage = Math.floor(baseDamage * damageMultiplier * comboPower);
        
        // Apply existing combo system bonus
        if (combo.player > 0) {
          totalDamage += Math.floor(combo.player * 2);
          setCombo(prev => ({ ...prev, player: prev.player + 1, timer: 180 }));
        } else {
          setCombo(prev => ({ ...prev, player: 1, timer: 180 }));
        }
        
        console.log(`Total damage: ${totalDamage} (base: ${baseDamage}, multiplier: ${damageMultiplier}, combo: ${comboPower})`);
        
        enemyRef.current.health = Math.max(0, enemyRef.current.health - totalDamage);
        
        // Add damage effect to enemy sprite
        if (enemySpriteRef.current) {
          enemySpriteRef.current.playSpecialEffect('damage');
        }
        
        // Build special meter (more for stronger attacks)
        const meterGain = Math.floor(15 * damageMultiplier);
        setSpecialMeter(prev => ({ ...prev, player: Math.min(100, prev.player + meterGain) }));
        
        // Minimal particle effects for different attack types
        const particleColors = {
          'left-punch': '#ff6b6b',
          'right-punch': '#4facfe', 
          'left-kick': '#ffa502',
          'right-kick': '#2ed573',
          'double-punch': '#ffd700',
          'double-kick': '#e056fd'
        };
        
        // Reduced particle count by 60%
        const particleCount = Math.max(1, Math.floor((1 + damageMultiplier) * 0.4));
        createParticles(enemyRef.current.x, enemyRef.current.y - 50, particleColors[attackType] || '#ff0000', particleCount, 'explosion');
        createParticles(enemyRef.current.x, enemyRef.current.y - 50, '#ffffff', Math.floor(particleCount * 0.5), 'spark');
        
        // Enhanced screen shake for stronger attacks
        const shakeIntensity = Math.floor(8 * damageMultiplier);
        setScreenShake({ active: true, intensity: shakeIntensity, timer: 20 });
        
        // Trigger collision animation
        const collisionX = (playerRef.current.x + enemyRef.current.x) / 2;
        const collisionY = Math.min(playerRef.current.y, enemyRef.current.y) - 20;
        triggerCollisionAnimation(collisionX, collisionY);
        
        // Display damage number (visual feedback)
        console.log(`💥 ${attackType}: ${totalDamage} damage dealt!`);
        
      } else {
        console.log('ENHANCED ATTACK MISSED - too far away');
      }
    }

    function updateParticles() {
      // Performance optimization: only log every 60 frames
      if (particlesRef.current.length > 0 && gameStateRef.current.frameCount % 60 === 0) {
        console.log(`⚡ UPDATING ${particlesRef.current.length} PARTICLES`);
      }
      
      // Batch particle updates for better performance
      const updatedParticles = [];
      const maxParticles = 200; // Limit total particles for performance
      
      // Process particles with performance optimization
      for (let i = 0; i < Math.min(particlesRef.current.length, maxParticles); i++) {
        const particle = particlesRef.current[i];
        
        // Skip dead particles early
        if (particle.life <= 0) continue;
        
        const newParticle = { ...particle };
        
        // Update based on particle type with optimized calculations
        switch (particle.type) {
          case 'explosion':
            newParticle.x += particle.vx;
            newParticle.y += particle.vy;
            newParticle.vx *= 0.96;
            newParticle.vy = newParticle.vy * 0.96 + 0.05; // Combined operations
            if (particle.rotationSpeed !== undefined) {
              newParticle.rotation += particle.rotationSpeed;
            }
            break;
            
          case 'spark':
            // Optimized trail management
            if (particle.trail) {
              newParticle.trail = [...particle.trail, { x: particle.x, y: particle.y }];
              if (newParticle.trail.length > 5) { // Limit trail length
                newParticle.trail.shift();
              }
            }
            newParticle.x += particle.vx;
            newParticle.y += particle.vy;
            newParticle.vx *= 0.92;
            newParticle.vy *= 0.92;
            break;
            
          case 'shockwave':
            newParticle.size += particle.expansion;
            break;
            
          case 'debris':
            newParticle.x += particle.vx;
            newParticle.y += particle.vy;
            newParticle.vx *= 0.98;
            newParticle.vy += 0.15;
            
            // Ground collision check
            if (newParticle.y > GROUND_Y - 10) {
              newParticle.y = GROUND_Y - 10;
              newParticle.vy *= -0.5; // Bounce factor
              newParticle.vx *= 0.8;
            }
            break;
            
          case 'fire':
            // Fire particles rise and flicker
            newParticle.x += particle.vx;
            newParticle.y += particle.vy;
            newParticle.vy += particle.gravity || -0.02; // Rise upward
            newParticle.vx *= 0.95;
            // Add flickering effect
            if (particle.flicker) {
              newParticle.size = Math.max(0.5, particle.size + (Math.random() - 0.5) * 0.8);
            }
            break;
            
          case 'ember':
            // Ember particles with gravity and sparkle
            newParticle.x += particle.vx;
            newParticle.y += particle.vy;
            newParticle.vy += particle.gravity || 0.01;
            newParticle.vx *= 0.97;
            break;
            
          case 'ice':
            // Ice particles with rotation and shimmer
            newParticle.x += particle.vx;
            newParticle.y += particle.vy;
            newParticle.vy += particle.gravity || 0.015;
            newParticle.vx *= 0.98;
            if (particle.rotationSpeed !== undefined) {
              newParticle.rotation += particle.rotationSpeed;
            }
            break;
            
          case 'frost':
            // Frost particles drift slowly
            newParticle.x += particle.vx;
            newParticle.y += particle.vy;
            newParticle.vy += particle.gravity || -0.005; // Slight upward drift
            newParticle.vx *= 0.99;
            // Add drifting motion
            if (particle.drift) {
              newParticle.vx += (Math.random() - 0.5) * 0.02;
              newParticle.vy += (Math.random() - 0.5) * 0.01;
            }
            break;
            
          default:
            // Standard particle physics
            newParticle.x += particle.vx;
            newParticle.y += particle.vy;
            newParticle.vy += 0.08;
            newParticle.vx *= 0.99;
        }
        
        // Decrease life for all particles
        newParticle.life--;
        
        // Keep particle if still alive
        if (newParticle.life > 0) {
          updatedParticles.push(newParticle);
        }
      }
      
      // Update particles reference
      particlesRef.current = updatedParticles;
    }

    function updateCombatSystem() {
      // Update combo window timer
      if (combatState.comboWindow > 0) {
        setCombatState(prev => ({ ...prev, comboWindow: prev.comboWindow - 1 }));
      } else {
        // Reset combat state when combo window expires
        setCombatState(prev => ({
          ...prev,
          leftPunchPressed: false,
          rightPunchPressed: false,
          leftKickPressed: false,
          rightKickPressed: false,
          comboPower: 1.0
        }));
      }
    }

    function update() {
      // Increment frame counter for debugging
      gameStateRef.current.frameCount++;
      
      // Individual round victories are handled by round system, not game over
      // Game over only triggers when match is complete (someone wins 2 rounds)
      
      // Don't update game if game is over
      if (gameOver.active) return;
      
      // Update enhanced combat system
      updateCombatSystem();
      
      // Update particles
      updateParticles();
      
      // Test particles removed - now only show on character hits
      
      // Attack particles removed - now only show on character hits
      
      // Update sprite animations with enhanced effects
      if (playerSpriteRef.current) {
        // Set player animation based on state with enhanced effects
        if (playerRef.current.isAttacking) {
          const attacks = ['punch1', 'punch2', 'punch3'];
          const attackAnim = attacks[Math.floor(Math.random() * attacks.length)];
          playerSpriteRef.current.setAnimation(attackAnim);
          
          // Add continuous shake effect during attacks
          if (playerRef.current.attackCooldown > 0) {
            playerSpriteRef.current.effects.shake.enabled = true;
            playerSpriteRef.current.effects.shake.intensity = 1;
            playerSpriteRef.current.effects.shake.timer = 5;
          }
        } else if (!playerRef.current.onGround) {
          if (playerRef.current.vy < 0) {
            playerSpriteRef.current.setAnimation('jump');
          } else {
            playerSpriteRef.current.setAnimation('falling');
          }
        } else if (Math.abs(playerRef.current.vx) > 0.1) {
          playerSpriteRef.current.setAnimation('run');
        } else {
          playerSpriteRef.current.setAnimation('idle');
        }
        playerSpriteRef.current.update();
      }
      
      if (enemySpriteRef.current) {
        // Set enemy animation based on state with enhanced effects
        if (enemyRef.current.isAttacking) {
          enemySpriteRef.current.setAnimation('punch1');
          // Add continuous attack effects
          if (enemyRef.current.attackCooldown > 25) {
            enemySpriteRef.current.effects.glow.enabled = true;
            enemySpriteRef.current.effects.glow.color = '#ff4757';
            enemySpriteRef.current.effects.shake.enabled = true;
            enemySpriteRef.current.effects.shake.intensity = 2;
          }
        } else if (Math.abs(enemyRef.current.vx) > 0.1) {
          enemySpriteRef.current.setAnimation('run');
        } else {
          enemySpriteRef.current.setAnimation('idle');
        }
        enemySpriteRef.current.update();
      }
      
      // Update game timer (countdown)
      if (roundActive && gameTime > 0) {
        setGameTime(prev => prev - 1);
        
        // Timer warning sounds/effects
        const remainingSeconds = Math.ceil(gameTime / 60);
        if (remainingSeconds === 10) {
          console.log('⏰ 10 seconds remaining!');
          // Could trigger warning sound here
        } else if (remainingSeconds === 5) {
          console.log('🚨 5 seconds remaining!');
          // Could trigger urgent sound here
        }
      }
      
      // Handle round end when timer reaches zero
      if (gameTime === 0 && roundActive) {
        handleRoundEnd('Time Up');
      }
      
      // Check for knockout victory
      if (roundActive) {
        const playerHealth = playerRef.current.health;
        const enemyHealth = enemyRef.current.health;
        
        if (playerHealth <= 0) {
          handleRoundEnd('Knockout', enemyRef.current.name || 'Enemy');
        } else if (enemyHealth <= 0) {
          handleRoundEnd('Knockout', playerRef.current.name || 'Player');
        }
      }
      
      // Function to handle round end
      function handleRoundEnd(endType, winner = null) {
        setRoundActive(false);
        
        let roundWinner = winner;
        let endMessage = '';
        
        if (endType === 'Time Up') {
          // Determine winner based on health when time runs out
          const playerHealth = playerRef.current.health;
          const enemyHealth = enemyRef.current.health;
          
          if (playerHealth > enemyHealth) {
            roundWinner = playerRef.current.name || 'Player';
            endMessage = `${roundWinner} wins by decision!`;
          } else if (enemyHealth > playerHealth) {
            roundWinner = enemyRef.current.name || 'Enemy';
            endMessage = `${roundWinner} wins by decision!`;
          } else {
            roundWinner = 'Draw';
            endMessage = 'Round ends in a draw!';
          }
        } else if (endType === 'Knockout') {
          endMessage = `${roundWinner} wins by knockout!`;
        }
        
        // Update match score (no points for draws)
        if (roundWinner !== 'Draw') {
          setLastRoundWinner(roundWinner);
          if (roundWinner === (playerRef.current.name || 'Player')) {
            setMatchScore(prev => ({ ...prev, player: prev.player + 1 }));
          } else {
            setMatchScore(prev => ({ ...prev, enemy: prev.enemy + 1 }));
          }
        }
        
        console.log(`🥊 Round ${roundNumber}: ${endMessage}`);
        
        // Check if match is complete (best of 3 - first to win 2 rounds)
        setTimeout(() => {
          const newPlayerScore = roundWinner === (playerRef.current.name || 'Player') ? 
            matchScore.player + 1 : matchScore.player;
          const newEnemyScore = roundWinner === (enemyRef.current.name || 'Enemy') ? 
            matchScore.enemy + 1 : matchScore.enemy;
          
          // Check for match victory (first to 2 rounds wins)
          if (newPlayerScore >= 2 || newEnemyScore >= 2) {
            // Match complete - someone won 2 rounds
            setMatchComplete(true);
            let finalMessage = '';
            let gameOverWinner = '';
            
            if (newPlayerScore >= 2) {
              const matchWinner = playerRef.current.name || 'Player';
              finalMessage = `🏆 MATCH COMPLETE! ${matchWinner} wins ${newPlayerScore}-${newEnemyScore}!`;
              gameOverWinner = 'player';
            } else {
              const matchWinner = enemyRef.current.name || 'Enemy';
              finalMessage = `🏆 MATCH COMPLETE! ${matchWinner} wins ${newEnemyScore}-${newPlayerScore}!`;
              gameOverWinner = 'enemy';
            }
            
            console.log(finalMessage);
            
            // Show victory screen after match completion
            setTimeout(() => {
              setGameOver({ 
                active: true, 
                winner: gameOverWinner, 
                message: finalMessage 
              });
            }, 1000); // Show victory screen after 1 second
            
            // Option to restart match after victory screen
            setTimeout(() => {
              restartMatch();
            }, 8000); // Extended time to see victory screen
          } else if (roundNumber >= 3) {
            // All 3 rounds completed but no clear winner (shouldn't happen with best-of-3)
            setMatchComplete(true);
            const finalMessage = `🤝 MATCH COMPLETE! It's a draw ${newPlayerScore}-${newEnemyScore}!`;
            console.log(finalMessage);
            
            // Show draw screen
            setTimeout(() => {
              setGameOver({ 
                active: true, 
                winner: 'draw', 
                message: finalMessage 
              });
            }, 1000);
            
            setTimeout(() => {
              restartMatch();
            }, 8000);
          } else {
            // Continue to next round
            console.log(`📊 Current match score: ${newPlayerScore}-${newEnemyScore} (need 2 to win)`);
            startNextRound();
          }
        }, 3000);
      }
      
      // Function to restart the entire match
      function restartMatch() {
        setRoundNumber(1);
        setMatchScore({ player: 0, enemy: 0 });
        setMatchComplete(false);
        setLastRoundWinner(null);
        setGameOver({ active: false, winner: null, message: '' }); // Clear game over state
        
        // Start with Round 1 announcement
        setRoundAnnouncement({
          active: true,
          phase: 'announcing',
          timer: 180, // 3 seconds for announcement
          roundToShow: 1
        });
        setRoundActive(false); // Keep round inactive during announcement
        
        // Reset everything
        playerRef.current.health = playerRef.current.maxHealth;
        enemyRef.current.health = enemyRef.current.maxHealth;
        playerRef.current.x = 150;
        playerRef.current.y = GROUND_Y;
        enemyRef.current.x = 650;
        enemyRef.current.y = GROUND_Y;
        
        console.log('🆕 NEW MATCH STARTED! Best-of-3 - First to win 2 rounds wins!');
      }
      
      // Function to start next round
      function startNextRound() {
        const nextRoundNumber = roundNumber + 1;
        setRoundNumber(nextRoundNumber);
        
        // Start with announcement, round inactive
        setRoundAnnouncement({
          active: true,
          phase: 'announcing',
          timer: 180, // 3 seconds for announcement
          roundToShow: nextRoundNumber
        });
        setRoundActive(false); // Keep round inactive during announcement
        
        // Reset player and enemy health for new round
        playerRef.current.health = playerRef.current.maxHealth;
        enemyRef.current.health = enemyRef.current.maxHealth;
        
        // Reset positions
        playerRef.current.x = 150;
        playerRef.current.y = GROUND_Y;
        enemyRef.current.x = 650;
        enemyRef.current.y = GROUND_Y;
        
        // Reset any combat states
        playerRef.current.isAttacking = false;
        playerRef.current.attackCooldown = 0;
        enemyRef.current.isAttacking = false;
        enemyRef.current.attackCooldown = 0;
        
        console.log(`🥊 Round ${nextRoundNumber} - Announcement Starting!`);
      }
      
      // Handle round announcement timer
      if (roundAnnouncement.active) {
        setRoundAnnouncement(prev => {
          const newTimer = prev.timer - 1;
          
          if (newTimer <= 0) {
            // Announcement finished, start the round
            setRoundActive(true);
            setGameTime(3600); // Reset timer to 60 seconds
            console.log(`🥊 Round ${prev.roundToShow} - FIGHT!`);
            return { active: false, phase: 'none', timer: 0, roundToShow: prev.roundToShow };
          }
          
          return { ...prev, timer: newTimer };
        });
      }
      
      // Update combo timer
      if (combo.timer > 0) {
        setCombo(prev => ({ ...prev, timer: prev.timer - 1 }));
      } else if (combo.player > 0 || combo.enemy > 0) {
        setCombo({ player: 0, enemy: 0, timer: 0 });
      }
      
      // Update player
      let { x, y, vx, vy, onGround, currentAnimation, attackCooldown } = playerRef.current;
      let newX = x + vx;
      let newY = y + vy;
      
      // Handle attack cooldown
      if (attackCooldown > 0) {
        attackCooldown--;
        if (attackCooldown === 0) {
          playerRef.current.isAttacking = false;
        }
      }
      
      // Determine player animation
      if (playerRef.current.isAttacking) {
        // Keep attack animation
      } else if (!onGround && vy > 0) {
        currentAnimation = 'falling';
      } else if (!onGround && vy < 0) {
        currentAnimation = 'jump';
      } else if (Math.abs(vx) > 0) {
        currentAnimation = 'run';
      } else {
        currentAnimation = 'idle';
      }
      
      // Enhanced friction system for knockback and normal movement
      if (Math.abs(vx) > PLAYER_SPEED) {
        // Apply stronger friction to knockback forces
        vx *= 0.85; // Gradual slowdown for knockback
        if (Math.abs(vx) < 0.5) {
          vx = 0; // Stop small residual velocities
        }
      } else if (Math.abs(vx) > 0.1) {
        // Normal movement friction
        vx *= 0.95;
      } else {
        vx = 0; // Stop very small movements
      }
      
      if (newY < GROUND_Y) {
        vy += GRAVITY;
        onGround = false;
      } else {
        newY = GROUND_Y;
        vy = 0;
        onGround = true;
        if (currentAnimation === 'falling' && !playerRef.current.isAttacking) {
          currentAnimation = 'landing';
          // Add landing effect
          if (playerSpriteRef.current && vy > 5) { // Only for significant falls
            playerSpriteRef.current.setAnimation('landing');
            playerSpriteRef.current.playImpactAnimation();
          }
        }
      }
      
      // Check collision with enemy before moving
      const playerRect = { x: newX - CHARACTER_WIDTH/2, y: newY - CHARACTER_HEIGHT, width: CHARACTER_WIDTH, height: CHARACTER_HEIGHT };
      const enemyRect = { x: enemyRef.current.x - CHARACTER_WIDTH/2, y: enemyRef.current.y - CHARACTER_HEIGHT, width: CHARACTER_WIDTH, height: CHARACTER_HEIGHT };
      
      if (!checkCollision(playerRect, enemyRect)) {
        x = newX;
        y = newY;
      } else {
        // Handle collision with different behavior for knockback vs normal movement
        if (Math.abs(vx) > PLAYER_SPEED) {
          // Knockback collision - allow partial movement and reduce velocity
          const knockbackReduction = 0.6;
          x = x + (vx * knockbackReduction); // Allow some knockback movement through collision
          vx *= knockbackReduction; // Reduce knockback velocity
          
          // Trigger enhanced collision effects for knockback
          const collisionX = (playerRef.current.x + enemyRef.current.x) / 2;
          const collisionY = Math.min(playerRef.current.y, enemyRef.current.y) - 20;
          triggerCollisionAnimation(collisionX, collisionY);
          
          console.log(`💥 Knockback collision - velocity reduced to ${vx.toFixed(2)}`);
        } else if (Math.abs(vx) > 0 && Math.abs(vx) <= PLAYER_SPEED) {
          // Normal movement collision - stop completely
          const collisionX = (playerRef.current.x + enemyRef.current.x) / 2;
          const collisionY = Math.min(playerRef.current.y, enemyRef.current.y) - 20;
          triggerCollisionAnimation(collisionX, collisionY);
          vx = 0;
        }
        y = newY; // Always allow vertical movement (gravity/jump)
      }
      
      // Enhanced bounds checking with knockback consideration
      const minX = CHARACTER_WIDTH/2;
      const maxX = canvas.width - CHARACTER_WIDTH/2;
      
      if (x < minX) {
        x = minX;
        if (vx < 0) vx = 0; // Stop leftward knockback at left edge
      } else if (x > maxX) {
        x = maxX;
        if (vx > 0) vx = 0; // Stop rightward knockback at right edge
      }
      
      playerRef.current = { ...playerRef.current, x, y, vx, vy, onGround, currentAnimation, attackCooldown };
      setPlayer({ ...playerRef.current });
      
      // Update enemy (simple AI - move towards player but respect collisions)
      let enemyData = { ...enemyRef.current };
      const distance = Math.abs(enemyData.x - playerRef.current.x);
      
      // Handle enemy attack cooldown
      if (enemyData.attackCooldown > 0) {
        enemyData.attackCooldown--;
        if (enemyData.attackCooldown === 0) {
          enemyData.isAttacking = false;
        }
      }
      
      // Determine enemy animation
      if (enemyData.isAttacking) {
        // Keep attack animation
      } else if (!enemyData.onGround && enemyData.vy > 0) {
        enemyData.currentAnimation = 'falling';
      } else if (!enemyData.onGround && enemyData.vy < 0) {
        enemyData.currentAnimation = 'jump';
      } else if (Math.abs(enemyData.vx) > 0) {
        enemyData.currentAnimation = 'run';
      } else {
        enemyData.currentAnimation = 'idle';
      }
      
      // Enhanced friction system for enemy knockback
      if (Math.abs(enemyData.vx) > 1) {
        // Apply stronger friction to knockback forces
        enemyData.vx *= 0.85; // Gradual slowdown for knockback
        if (Math.abs(enemyData.vx) < 0.5) {
          enemyData.vx = 0; // Stop small residual velocities
        }
      }
      
      // Only apply AI movement if not being repelled
      if (Math.abs(enemyData.vx) <= 1 && distance > CHARACTER_WIDTH + 10) {
        if (enemyData.x > playerRef.current.x) {
          enemyData.vx = -1;
          enemyData.facing = 'left';
        } else {
          enemyData.vx = 1;
          enemyData.facing = 'right';
        }
      } else if (Math.abs(enemyData.vx) <= 1) {
        enemyData.vx = 0;
      }
      
      // Enemy AI: Randomly attack when close
      if (distance < CHARACTER_WIDTH + 20 && !enemyData.isAttacking && enemyData.attackCooldown === 0 && Math.random() < 0.02) {
        enemyData.isAttacking = true;
        enemyData.currentAnimation = Math.random() < 0.5 ? 'punch1' : 'punch2';
        enemyData.attackCooldown = 30; // Attack duration
        
        // Deal damage to player with combo
        let damage = enemyData.attack;
        
        // Combo damage bonus
        if (combo.enemy > 0) {
          damage += Math.floor(combo.enemy * 2);
          setCombo(prev => ({ ...prev, enemy: prev.enemy + 1, timer: 180 }));
        } else {
          setCombo(prev => ({ ...prev, enemy: 1, timer: 180 }));
        }
        
        playerRef.current.health = Math.max(0, playerRef.current.health - damage);
        
        // Add damage effect to player sprite
        if (playerSpriteRef.current) {
          playerSpriteRef.current.playSpecialEffect('damage');
          console.log('💔 Player damage effect triggered!');
        }
        
        // Add attack effect to enemy sprite
        if (enemySpriteRef.current) {
          enemySpriteRef.current.playImpactAnimation();
          console.log('👊 Enemy attack effect triggered!');
        }
        
        // Build enemy special meter
        setSpecialMeter(prev => ({ ...prev, enemy: Math.min(100, prev.enemy + 10) }));
        
        // Create damage particles for enemy attacks (reduced)
        createParticles(playerRef.current.x, playerRef.current.y - 50, '#ff0000', 1, 'explosion');
        createParticles(playerRef.current.x, playerRef.current.y - 50, '#ffffff', 1, 'spark');
        
        // Trigger collision animation for enemy attack
        const collisionX = (playerRef.current.x + enemyData.x) / 2;
        const collisionY = Math.min(playerRef.current.y, enemyData.y) - 20;
        triggerCollisionAnimation(collisionX, collisionY);
      }
      
      let enemyNewX = enemyData.x + enemyData.vx;
      let enemyNewY = enemyData.y + enemyData.vy;
      
      if (enemyNewY < GROUND_Y) {
        enemyData.vy += GRAVITY;
        enemyData.onGround = false;
      } else {
        enemyNewY = GROUND_Y;
        enemyData.vy = 0;
        enemyData.onGround = true;
        if (enemyData.currentAnimation === 'falling' && !enemyData.isAttacking) {
          enemyData.currentAnimation = 'landing';
        }
      }
      
      // Check collision with player before enemy moves
      const newEnemyRect = { x: enemyNewX - CHARACTER_WIDTH/2, y: enemyNewY - CHARACTER_HEIGHT, width: CHARACTER_WIDTH, height: CHARACTER_HEIGHT };
      const currentPlayerRect = { x: playerRef.current.x - CHARACTER_WIDTH/2, y: playerRef.current.y - CHARACTER_HEIGHT, width: CHARACTER_WIDTH, height: CHARACTER_HEIGHT };
      
      if (!checkCollision(newEnemyRect, currentPlayerRect)) {
        enemyData.x = enemyNewX;
        enemyData.y = enemyNewY;
      } else {
        // Handle collision with different behavior for knockback vs normal movement
        if (Math.abs(enemyData.vx) > 1) {
          // Knockback collision - allow partial movement and reduce velocity
          const knockbackReduction = 0.6;
          enemyData.x = enemyData.x + (enemyData.vx * knockbackReduction);
          enemyData.vx *= knockbackReduction;
          
          // Trigger enhanced collision effects for knockback
          const collisionX = (playerRef.current.x + enemyData.x) / 2;
          const collisionY = Math.min(playerRef.current.y, enemyData.y) - 20;
          triggerCollisionAnimation(collisionX, collisionY);
          
          console.log(`💥 Enemy knockback collision - velocity reduced to ${enemyData.vx.toFixed(2)}`);
        } else if (Math.abs(enemyData.vx) > 0 && Math.abs(enemyData.vx) <= 1) {
          // Normal movement collision - stop completely
          const collisionX = (playerRef.current.x + enemyData.x) / 2;
          const collisionY = Math.min(playerRef.current.y, enemyData.y) - 20;
          triggerCollisionAnimation(collisionX, collisionY);
          enemyData.vx = 0;
        }
        enemyData.y = enemyNewY; // Always allow vertical movement
      }
      
      // Enhanced bounds checking with knockback consideration for enemy
      const enemyMinX = CHARACTER_WIDTH/2;
      const enemyMaxX = canvas.width - CHARACTER_WIDTH/2;
      
      if (enemyData.x < enemyMinX) {
        enemyData.x = enemyMinX;
        if (enemyData.vx < 0) enemyData.vx = 0; // Stop leftward knockback at left edge
      } else if (enemyData.x > enemyMaxX) {
        enemyData.x = enemyMaxX;
        if (enemyData.vx > 0) enemyData.vx = 0; // Stop rightward knockback at right edge
      }
      
      enemyRef.current = enemyData;
      setEnemy({ ...enemyData });
      
      // Enhanced projectile update system with physics and homing
      setProjectiles(prev => {
        // Removed excessive logging for performance
        const updatedProjectiles = [];
        
        for (let i = 0; i < prev.length; i++) {
          const projectile = prev[i];
          
          // Update trail
          if (projectile.trail) {
            projectile.trail.push({ x: projectile.x, y: projectile.y });
            if (projectile.trail.length > projectile.trailLength) {
              projectile.trail.shift();
            }
          }
          
          // Homing behavior
          if (projectile.homing) {
            const target = projectile.owner === 'player' ? enemyRef.current : playerRef.current;
            if (target && target.health > 0) {
              const dx = target.x - projectile.x;
              const dy = (target.y - CHARACTER_HEIGHT/2) - projectile.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance > 0) {
                const homingForce = 0.3;
                projectile.vx += (dx / distance) * homingForce;
                projectile.vy += (dy / distance) * homingForce;
                
                // Limit max speed
                const maxSpeed = projectile.type === 'homing' ? 10 : 8;
                const currentSpeed = Math.sqrt(projectile.vx * projectile.vx + projectile.vy * projectile.vy);
                if (currentSpeed > maxSpeed) {
                  projectile.vx = (projectile.vx / currentSpeed) * maxSpeed;
                  projectile.vy = (projectile.vy / currentSpeed) * maxSpeed;
                }
                
                // Update rotation for visual effect
                projectile.rotation = Math.atan2(projectile.vy, projectile.vx);
              }
            }
          }
          
          // Apply gravity
          if (projectile.gravity > 0) {
            projectile.vy += projectile.gravity;
          }
          
          // Update position
          projectile.x += projectile.vx;
          projectile.y += projectile.vy;
          projectile.life--;
          projectile.rotation += projectile.rotationSpeed;
          
          // Bouncing physics
          if (projectile.bounce && projectile.bounceCount < projectile.maxBounces) {
            // Ground bounce
            if (projectile.y > GROUND_Y - projectile.size) {
              projectile.y = GROUND_Y - projectile.size;
              projectile.vy *= -0.7; // Energy loss on bounce
              projectile.vx *= 0.9; // Friction
              projectile.bounceCount++;
              
              // Create bounce particles
              createParticles(projectile.x, projectile.y, projectile.color, 3, 'spark');
            }
            
            // Wall bounce
            if (projectile.x < projectile.size || projectile.x > canvas.width - projectile.size) {
              projectile.vx *= -0.8;
              projectile.x = projectile.x < projectile.size ? projectile.size : canvas.width - projectile.size;
              projectile.bounceCount++;
              
              createParticles(projectile.x, projectile.y, projectile.color, 2, 'spark');
            }
          }
          
          // Check bounds and life (improved bounds checking)
          if (projectile.life <= 0 || 
              (!projectile.bounce && (projectile.x < -50 || projectile.x > canvas.width + 50 || 
               projectile.y < -50 || projectile.y > canvas.height + 50))) {
            // Create expiration particles for certain types
            if (projectile.type === 'plasma' || projectile.type === 'power') {
              createParticles(projectile.x, projectile.y, projectile.color, 2, 'explosion');
            }
            continue; // Remove projectile
          }
          
          // Enhanced collision detection with pixel-perfect accuracy
          let hitTarget = false;
          
          if (projectile.owner === 'player') {
            // Player projectile hitting enemy
            const enemyRect = {
              x: enemyRef.current.x - CHARACTER_WIDTH/2,
              y: enemyRef.current.y - CHARACTER_HEIGHT,
              width: CHARACTER_WIDTH,
              height: CHARACTER_HEIGHT
            };
            const projectileRect = {
              x: projectile.x - projectile.size,
              y: projectile.y - projectile.size,
              width: projectile.size * 2,
              height: projectile.size * 2
            };
            
            if (checkCollision(projectileRect, enemyRect)) {
              hitTarget = true;
              const actualDamage = Math.max(1, projectile.damage);
              enemyRef.current.health = Math.max(0, enemyRef.current.health - actualDamage);
              
              // Calculate knockback force based on projectile type and direction
              const knockbackForces = {
                normal: 4,
                power: 8,
                rapid: 2,
                plasma: 5,
                homing: 6
              };
              
              const baseKnockback = knockbackForces[projectile.type] || 4;
              const knockbackDirection = projectile.vx > 0 ? 1 : -1; // Direction projectile was traveling
              
              // Apply horizontal knockback
              enemyRef.current.vx += knockbackDirection * baseKnockback;
              
              // Apply vertical knockback (slight upward force)
              if (enemyRef.current.onGround) {
                enemyRef.current.vy = -3 - (baseKnockback * 0.3); // Stronger projectiles lift more
                enemyRef.current.onGround = false;
              } else {
                enemyRef.current.vy -= 1 + (baseKnockback * 0.2); // Air knockback
              }
              
              // Reduced knockback logging for performance
              
              // Enhanced impact effects based on projectile type
              const impactParticleCount = projectile.type === 'power' ? 6 : 
                                        projectile.type === 'plasma' ? 4 : 3;
              createParticles(projectile.x, projectile.y, projectile.color, impactParticleCount, 'explosion');
              createParticles(projectile.x, projectile.y, '#ffffff', Math.ceil(impactParticleCount/2), 'spark');
              
              // Special effects for different types
              if (projectile.type === 'power') {
                createParticles(projectile.x, projectile.y, '#ffff00', 2, 'shockwave');
                setScreenShake({ active: true, intensity: 12 + baseKnockback, timer: 15 });
                // Extra knockback particles for power shots
                createParticles(projectile.x, projectile.y, '#ff8800', 3, 'debris');
              } else if (projectile.type === 'plasma') {
                createParticles(projectile.x, projectile.y, projectile.color, 3, 'debris');
              } else if (projectile.type === 'fire') {
                // Fire projectile creates burning effects
                createParticles(projectile.x, projectile.y, '#ff6600', 5, 'fire');
                createParticles(projectile.x, projectile.y, '#ff8800', 3, 'ember');
                createParticles(projectile.x, projectile.y, '#ff4444', 2, 'smoke');
                setScreenShake({ active: true, intensity: 8 + baseKnockback, timer: 12 });
              } else if (projectile.type === 'ice') {
                // Ice projectile creates freezing effects
                createParticles(projectile.x, projectile.y, '#88ddff', 4, 'ice');
                createParticles(projectile.x, projectile.y, '#aaeeff', 6, 'frost');
                createParticles(projectile.x, projectile.y, '#ffffff', 2, 'sparkle');
              } else if (projectile.type === 'ember') {
                // Ember projectile creates scattered burning particles
                createParticles(projectile.x, projectile.y, '#ff8800', 4, 'ember');
                createParticles(projectile.x, projectile.y, '#ff6600', 2, 'fire');
              } else if (projectile.type === 'homing') {
                // Homing projectiles create directional knockback particles
                createParticles(projectile.x + knockbackDirection * 20, projectile.y, projectile.color, 4, 'spark');
              }
              
              // Build player special meter based on damage dealt
              const meterGain = Math.min(10, Math.floor(actualDamage / 2) + 3);
              setSpecialMeter(prev => ({ ...prev, player: Math.min(100, prev.player + meterGain) }));
            }
          } else {
            // Enemy projectile hitting player
            const playerRect = {
              x: playerRef.current.x - CHARACTER_WIDTH/2,
              y: playerRef.current.y - CHARACTER_HEIGHT,
              width: CHARACTER_WIDTH,
              height: CHARACTER_HEIGHT
            };
            const projectileRect = {
              x: projectile.x - projectile.size,
              y: projectile.y - projectile.size,
              width: projectile.size * 2,
              height: projectile.size * 2
            };
            
            if (checkCollision(projectileRect, playerRect)) {
              hitTarget = true;
              const actualDamage = Math.max(1, projectile.damage);
              playerRef.current.health = Math.max(0, playerRef.current.health - actualDamage);
              
              // Calculate knockback force based on projectile type and direction
              const knockbackForces = {
                normal: 4,
                power: 8,
                rapid: 2,
                plasma: 5,
                homing: 6
              };
              
              const baseKnockback = knockbackForces[projectile.type] || 4;
              const knockbackDirection = projectile.vx > 0 ? 1 : -1; // Direction projectile was traveling
              
              // Apply horizontal knockback
              playerRef.current.vx += knockbackDirection * baseKnockback;
              
              // Apply vertical knockback (slight upward force)
              if (playerRef.current.onGround) {
                playerRef.current.vy = -3 - (baseKnockback * 0.3); // Stronger projectiles lift more
                playerRef.current.onGround = false;
              } else {
                playerRef.current.vy -= 1 + (baseKnockback * 0.2); // Air knockback
              }
              
              // Add knockback visual feedback
              console.log(`💥 Player knocked back by ${projectile.type} projectile (force: ${baseKnockback})`);
              
              // Enhanced impact effects
              const impactParticleCount = projectile.type === 'power' ? 6 : 
                                        projectile.type === 'plasma' ? 4 : 3;
              createParticles(projectile.x, projectile.y, projectile.color, impactParticleCount, 'explosion');
              createParticles(projectile.x, projectile.y, '#ffffff', Math.ceil(impactParticleCount/2), 'spark');
              
              if (projectile.type === 'power') {
                createParticles(projectile.x, projectile.y, '#ff4400', 2, 'shockwave');
                setScreenShake({ active: true, intensity: 10 + baseKnockback, timer: 12 });
                // Extra knockback particles for power shots
                createParticles(projectile.x, projectile.y, '#ff4400', 3, 'debris');
              } else if (projectile.type === 'plasma') {
                createParticles(projectile.x, projectile.y, projectile.color, 3, 'debris');
              } else if (projectile.type === 'homing') {
                // Homing projectiles create directional knockback particles
                createParticles(projectile.x + knockbackDirection * 20, projectile.y, projectile.color, 4, 'spark');
              }
              
              // Build enemy special meter
              const meterGain = Math.min(10, Math.floor(actualDamage / 2) + 3);
              setSpecialMeter(prev => ({ ...prev, enemy: Math.min(100, prev.enemy + meterGain) }));
            }
          }
          
          // Keep projectile if it hasn't hit (or if it's piercing)
          if (!hitTarget || projectile.piercing) {
            updatedProjectiles.push(projectile);
          }
        }
        
        return updatedProjectiles;
      });
      
      // Update collision animation
      if (collisionAnimation.active) {
        setCollisionAnimation(prev => ({
          ...prev,
          timer: prev.timer - 1,
          active: prev.timer > 1
        }));
      }
      
      // Update screen shake
      if (screenShake.active) {
        setScreenShake(prev => ({
          ...prev,
          timer: prev.timer - 1,
          active: prev.timer > 1,
          intensity: prev.intensity * 0.9 // Gradually reduce shake
        }));
      }
    }

    // Update only sprite animations when game is paused
    function updateSpritesOnly() {
      // Update sprite animations to maintain visual continuity during pause
      // This keeps sprites visible and their effects running smoothly
      if (playerSpriteRef.current) {
        playerSpriteRef.current.update();
      }
      
      if (enemySpriteRef.current) {
        enemySpriteRef.current.update();
      }
      
      // Keep particles visible during pause by updating their visual effects
      // but don't update physics (position, velocity, etc.)
      // Note: Particles are managed via particlesRef, not state
      // During pause, we maintain particle visual state without physics updates
      
      // Keep projectiles visible during pause by preserving their trails
      // Don't update physics, just maintain visual state
      setProjectiles(prev => {
        return prev.map(projectile => {
          return {
            ...projectile,
            // Preserve projectile state during pause
            // Trails and visual effects can continue
          };
        });
      });
    }

    function loop(currentTime = 0) {
      try {
        // Enhanced frame rate optimization
        const deltaTime = currentTime - (lastFrameTime || currentTime);
        lastFrameTime = currentTime;
        
        // Skip frame if running too fast (frame rate limiting)
        if (deltaTime < 16.67) { // Limit to 60 FPS max
          animationFrameId = requestAnimationFrame(loop);
          return;
        }
        
        // Update frame counter for performance monitoring
        frameCount++;
        
        if (!isPaused && !gameOver.active) {
          // Always run the game, use fallback rendering if sprites not loaded
          update(deltaTime);
          draw();
        } else {
          // Game is paused or over, still update sprite animations and draw current state
          updateSpritesOnly();
          draw();
        }
        
        // ALWAYS ensure critical UI elements are visible
        // This fixes the issue where elements only appear after pause
        if (frameCount < 10) {
          // Force draw on first few frames to ensure everything is visible
          console.log(`🎨 Force draw frame ${frameCount} to ensure UI visibility`);
          draw();
        }
        
        // Performance monitoring - calculate FPS every 60 frames
        if (frameCount % 60 === 0) {
          const fps = Math.round(1000 / deltaTime);
          gameStateRef.current.fps = fps;
          gameStateRef.current.frameTime = deltaTime;
        }
        
      } catch (error) {
        console.error('❌ Error in game loop:', error);
        console.error('❌ Error stack:', error.stack);
        
        // Draw error state
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ff0000';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('❌ Game Error - Check Console', canvas.width / 2, canvas.height / 2);
      }
      
      animationFrameId = requestAnimationFrame(loop);
    }
    console.log('🚀 Starting game loop...');
    
    // Force an initial draw to ensure UI elements appear immediately
    try {
      console.log('🎨 Forcing initial draw...');
      draw();
    } catch (initialDrawError) {
      console.warn('⚠️ Initial draw failed, will retry in game loop:', initialDrawError);
    }
    
    loop();

    return () => {
      console.log('🛑 Cleaning up game loop...');
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPaused, gameOver.active]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.repeat) return;
      
      // Pause/unpause functionality
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        setIsPaused(prev => !prev);
        return;
      }
      
      // Don't process game controls when paused or game over
      if (isPaused || gameOver.active) return;
      
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        playerRef.current.vx = -PLAYER_SPEED;
        playerRef.current.facing = 'left';
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        playerRef.current.vx = PLAYER_SPEED;
        playerRef.current.facing = 'right';
      } else if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') && playerRef.current.onGround) {
        playerRef.current.vy = -JUMP_POWER;
        playerRef.current.onGround = false;
      
      // Enhanced Combat Controls
      } else if (e.key === 'q' || e.key === 'Q') {
        // Left Punch
        if (!combatState.leftPunchPressed) {
          setCombatState(prev => ({ ...prev, leftPunchPressed: true, comboWindow: 30 }));
          
          // Check for double punch combo
          if (combatState.rightPunchPressed && combatState.comboWindow > 0) {
            console.log('🥊 DOUBLE PUNCH COMBO!');
            performCombatAttack('double-punch', 1.5);
            setCombatState(prev => ({ 
              ...prev, 
              leftPunchPressed: false, 
              rightPunchPressed: false,
              comboWindow: 0,
              comboPower: 1.5
            }));
          } else {
            performCombatAttack('left-punch');
          }
        }
      
      } else if (e.key === 'e' || e.key === 'E') {
        // Right Punch
        if (!combatState.rightPunchPressed) {
          setCombatState(prev => ({ ...prev, rightPunchPressed: true, comboWindow: 30 }));
          
          // Check for double punch combo
          if (combatState.leftPunchPressed && combatState.comboWindow > 0) {
            console.log('🥊 DOUBLE PUNCH COMBO!');
            performCombatAttack('double-punch', 1.5);
            setCombatState(prev => ({ 
              ...prev, 
              leftPunchPressed: false, 
              rightPunchPressed: false,
              comboWindow: 0,
              comboPower: 1.5
            }));
          } else {
            performCombatAttack('right-punch');
          }
        }
      
      } else if (e.key === 'f' || e.key === 'F') {
        // Left Kick
        if (!combatState.leftKickPressed) {
          setCombatState(prev => ({ ...prev, leftKickPressed: true, comboWindow: 30 }));
          
          // Check for double kick combo
          if (combatState.rightKickPressed && combatState.comboWindow > 0) {
            console.log('🦵 DOUBLE KICK COMBO!');
            performCombatAttack('double-kick', 2.0);
            setCombatState(prev => ({ 
              ...prev, 
              leftKickPressed: false, 
              rightKickPressed: false,
              comboWindow: 0,
              comboPower: 2.0
            }));
          } else {
            performCombatAttack('left-kick');
          }
        }
      
      } else if (e.key === 'g' || e.key === 'G') {
        // Right Kick
        if (!combatState.rightKickPressed) {
          setCombatState(prev => ({ ...prev, rightKickPressed: true, comboWindow: 30 }));
          
          // Check for double kick combo
          if (combatState.leftKickPressed && combatState.comboWindow > 0) {
            console.log('🦵 DOUBLE KICK COMBO!');
            performCombatAttack('double-kick', 2.0);
            setCombatState(prev => ({ 
              ...prev, 
              leftKickPressed: false, 
              rightKickPressed: false,
              comboWindow: 0,
              comboPower: 2.0
            }));
          } else {
            performCombatAttack('right-kick');
          }
        }
      
      // Legacy single attack (X key for backwards compatibility)
      } else if (e.key === 'x' || e.key === 'X') {
        performCombatAttack('right-punch');
        
      } else if ((e.key === 'z' || e.key === 'Z') && specialMeter.player >= 100 && !playerRef.current.isAttacking) {
        // Special Move
        console.log('=== SPECIAL MOVE ===');
        playerRef.current.isAttacking = true;
        playerRef.current.currentAnimation = 'punch_quad';
        playerRef.current.attackCooldown = 45; // Longer special move
        
        // Consume special meter
        setSpecialMeter(prev => ({ ...prev, player: 0 }));
        
        // Enhanced screen shake for special
        setScreenShake({ active: true, intensity: 12, timer: 30 });
        
        // Check if special hits enemy (longer range)
        const distance = Math.abs(playerRef.current.x - enemyRef.current.x);
        if (distance < CHARACTER_WIDTH + 50) {
          console.log('SPECIAL MOVE HIT! Dealing massive damage');
          // Deal massive damage
          const specialDamage = playerRef.current.attack * 3;
          enemyRef.current.health = Math.max(0, enemyRef.current.health - specialDamage);
          
          // Create special move particle explosion (reduced)
          createParticles(enemyRef.current.x, enemyRef.current.y - 50, '#ffd700', 3, 'explosion'); // Reduced from 8
          createParticles(enemyRef.current.x, enemyRef.current.y - 50, '#ffffff', 2, 'spark'); // Reduced from 6
          createParticles(enemyRef.current.x, enemyRef.current.y - 50, '#ffaa00', 2, 'shockwave'); // Orange shockwaves
          
          // Massive knockback
          const knockbackForce = 15;
          if (playerRef.current.x < enemyRef.current.x) {
            enemyRef.current.vx = knockbackForce;
          } else {
            enemyRef.current.vx = -knockbackForce;
          }
          enemyRef.current.vy = -8;
          enemyRef.current.onGround = false;
          
          // Reset combo for massive hit
          setCombo(prev => ({ ...prev, player: 10, timer: 300 }));
        }
      } else if ((e.key === 'c' || e.key === 'C')) {
        // TEST: Optimized particle creation test
        createParticles(400, 200, '#ffff00', 2, 'explosion'); // Reduced from 6 to 2
        createParticles(400, 200, '#ffffff', 2, 'spark'); // Reduced from 4 to 2
        createParticles(400, 200, '#ff8800', 1, 'shockwave'); // Reduced from 3 to 1
        createParticles(450, 200, '#ff0000', 3, 'debris'); // Reduced from 8 to 3
        
      } else if ((e.key === 'q' || e.key === 'Q') && playerRef.current.attackCooldown === 0) {
        // Normal projectile (Q key)
        console.log('Keyboard: Normal projectile fired');
        fireProjectile(playerRef.current, playerRef.current.facing, 'normal');
        playerRef.current.attackCooldown = 20;
      } else if ((e.key === 'q' || e.key === 'Q') && playerRef.current.attackCooldown > 0) {
        console.log(`❌ Projectile blocked - Attack cooldown: ${playerRef.current.attackCooldown}`);
        
      } else if ((e.key === 'r' || e.key === 'R') && playerRef.current.attackCooldown === 0) {
        // Rapid projectile (R key)
        console.log('Keyboard: Rapid projectile fired');
        fireProjectile(playerRef.current, playerRef.current.facing, 'rapid');
        playerRef.current.attackCooldown = 15;
        
      } else if ((e.key === '1') && playerRef.current.attackCooldown === 0) {
        // Power projectile (1 key)
        console.log('Keyboard: Power projectile fired');
        fireProjectile(playerRef.current, playerRef.current.facing, 'power');
        playerRef.current.attackCooldown = 45;
        
      } else if ((e.key === '2') && playerRef.current.attackCooldown === 0) {
        // Plasma projectile (2 key)
        console.log('Keyboard: Plasma projectile fired');
        fireProjectile(playerRef.current, playerRef.current.facing, 'plasma');
        playerRef.current.attackCooldown = 35;
        
      } else if ((e.key === '3') && playerRef.current.attackCooldown === 0) {
        // Homing projectile (3 key)
        console.log('Keyboard: Homing projectile fired');
        fireProjectile(playerRef.current, playerRef.current.facing, 'homing');
        playerRef.current.attackCooldown = 60;
        
      } else if ((e.key === '4') && playerRef.current.attackCooldown === 0) {
        // Fire projectile (4 key)
        console.log('Keyboard: Fire projectile fired');
        fireProjectile(playerRef.current, playerRef.current.facing, 'fire');
        playerRef.current.attackCooldown = 30;
        
      } else if ((e.key === '5') && playerRef.current.attackCooldown === 0) {
        // Ice projectile (5 key)
        console.log('Keyboard: Ice projectile fired');
        fireProjectile(playerRef.current, playerRef.current.facing, 'ice');
        playerRef.current.attackCooldown = 40;
        
      } else if ((e.key === '6') && playerRef.current.attackCooldown === 0) {
        // Ember projectile (6 key)
        console.log('Keyboard: Ember projectile fired');
        fireProjectile(playerRef.current, playerRef.current.facing, 'ember');
        playerRef.current.attackCooldown = 25;
      
      } else if (e.key === 't' || e.key === 'T') {
        // Manual particle test (T key) - simulates character hit effects
        console.log('🎆 MANUAL PARTICLE TEST - Simulating character hit effects');
        const x = playerRef.current.x;
        const y = playerRef.current.y - 50;
        createParticles(x, y, '#ff0000', 5, 'explosion');
        createParticles(x + 30, y, '#00ff00', 3, 'spark');
        createParticles(x - 30, y, '#0000ff', 2, 'shockwave');
        createParticles(x, y + 20, '#ffff00', 4, 'debris');
        createParticles(x, y - 20, '#ffffff', 6, 'normal');
      
      } else if (e.key === 'y' || e.key === 'Y') {
        // Manual projectile test (Y key)
        console.log('🚀 MANUAL PROJECTILE TEST - Firing all projectile types');
        console.log('📍 Player position:', playerRef.current.x, playerRef.current.y);
        console.log('📍 Player facing:', playerRef.current.facing);
        console.log('🎯 Canvas dimensions:', canvasRef.current?.width, canvasRef.current?.height);
        fireProjectile(playerRef.current, playerRef.current.facing, 'normal');
        setTimeout(() => fireProjectile(playerRef.current, playerRef.current.facing, 'rapid'), 200);
        setTimeout(() => fireProjectile(playerRef.current, playerRef.current.facing, 'power'), 400);
        setTimeout(() => fireProjectile(playerRef.current, playerRef.current.facing, 'plasma'), 600);
        setTimeout(() => fireProjectile(playerRef.current, playerRef.current.facing, 'homing'), 800);
      }
    }
    
    function handleKeyUp(e) {
      // Don't process game controls when paused or game over
      if (isPaused || gameOver.active) return;
      
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'ArrowRight' || e.key === 'd') {
        playerRef.current.vx = 0;
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Enhanced PS5/Gamepad support
    let gamepadInterval;
    let lastGamepadState = { buttons: [], axes: [] };
    
    function detectGamepadType(gamepad) {
      const id = gamepad.id.toLowerCase();
      if (id.includes('dualsense') || id.includes('ps5') || id.includes('054c')) {
        return 'PS5';
      } else if (id.includes('xbox') || id.includes('xinput') || id.includes('045e')) {
        return 'Xbox';
      } else if (id.includes('nintendo') || id.includes('switch') || id.includes('057e')) {
        return 'Nintendo';
      }
      return 'Generic';
    }
    
    function pollGamepad() {
      // Handle gamepad menu navigation when paused or game over
      if (isPaused || gameOver.active) {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        const gp = gamepads[0];
        if (gp) {
          const gamepadType = detectGamepadType(gp);
          
          // Update navigation cooldown
          if (menuNavigation.navigationCooldown > 0) {
            setMenuNavigation(prev => ({ ...prev, navigationCooldown: prev.navigationCooldown - 1 }));
          }

          // D-pad and analog stick navigation
          const dpadLeft = gp.buttons[14] && gp.buttons[14].pressed;
          const dpadRight = gp.buttons[15] && gp.buttons[15].pressed;
          const analogX = gp.axes[0] || 0;
          
          const leftPressed = dpadLeft || analogX < -0.5;
          const rightPressed = dpadRight || analogX > 0.5;
          
          // Navigate between menu options with cooldown
          if (menuNavigation.navigationCooldown === 0) {
            if (leftPressed && !menuNavigation.lastDpadInput.x) {
              if (isPaused) {
                setMenuNavigation(prev => ({ 
                  ...prev, 
                  pauseMenuFocus: Math.max(0, prev.pauseMenuFocus - 1),
                  navigationCooldown: 10
                }));
              } else if (gameOver.active) {
                setMenuNavigation(prev => ({ 
                  ...prev, 
                  gameOverMenuFocus: Math.max(0, prev.gameOverMenuFocus - 1),
                  navigationCooldown: 10
                }));
              }
            } else if (rightPressed && !menuNavigation.lastDpadInput.x) {
              if (isPaused) {
                setMenuNavigation(prev => ({ 
                  ...prev, 
                  pauseMenuFocus: Math.min(1, prev.pauseMenuFocus + 1),
                  navigationCooldown: 10
                }));
              } else if (gameOver.active) {
                setMenuNavigation(prev => ({ 
                  ...prev, 
                  gameOverMenuFocus: Math.min(1, prev.gameOverMenuFocus + 1),
                  navigationCooldown: 10
                }));
              }
            }
          }

          // Update last input state
          setMenuNavigation(prev => ({
            ...prev,
            lastDpadInput: { x: leftPressed || rightPressed ? (leftPressed ? -1 : 1) : 0, y: 0 }
          }));
          
          // Action buttons (X/Cross and Circle for PS4/PS5)
          const actionButton = gp.buttons[0] && gp.buttons[0].pressed; // X/Cross
          const backButton = gp.buttons[1] && gp.buttons[1].pressed; // Circle
          
          // Use a ref to debounce presses
          if (!pollGamepad.lastMenuState) pollGamepad.lastMenuState = { x: false, circle: false };
          
          if (actionButton && !pollGamepad.lastMenuState.x) {
            if (isPaused) {
              if (menuNavigation.pauseMenuFocus === 0) {
                setIsPaused(false); // Resume game
              } else {
                onBackToMenu ? onBackToMenu() : window.location.reload(); // Main menu
              }
            } else if (gameOver.active) {
              if (menuNavigation.gameOverMenuFocus === 0) {
                // Play Again
                playerRef.current.health = playerRef.current.maxHealth;
                enemyRef.current.health = enemyRef.current.maxHealth;
                playerRef.current.x = 150;
                enemyRef.current.x = 1050;
                playerRef.current.y = GROUND_Y;
                enemyRef.current.y = GROUND_Y;
                playerRef.current.vx = 0;
                playerRef.current.vy = 0;
                enemyRef.current.vx = 0;
                enemyRef.current.vy = 0;
                playerRef.current.currentAnimation = 'idle';
                enemyRef.current.currentAnimation = 'idle';
                playerRef.current.isAttacking = false;
                enemyRef.current.isAttacking = false;
                playerRef.current.attackCooldown = 0;
                enemyRef.current.attackCooldown = 0;
                setGameOver({ active: false, winner: null, message: '' });
                setPlayer({ ...playerRef.current });
                setEnemy({ ...enemyRef.current });
              } else {
                onBackToMenu ? onBackToMenu() : window.location.reload(); // Main menu
              }
            }
          }
          
          // Back button (Circle) to resume from pause
          if (backButton && !pollGamepad.lastMenuState.circle) {
            if (isPaused && !gameOver.active) {
              setIsPaused(false);
            }
          }
          
          pollGamepad.lastMenuState.x = actionButton;
          pollGamepad.lastMenuState.circle = backButton;
        }
        return; // Don't process normal game controls
      }
      
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads[0];
      
      if (gp) {
        const gamepadType = detectGamepadType(gp);
        
        // PS5 DualSense specific mappings
        const buttonMap = {
          PS5: {
            leftPunch: [2], // Square 🔲
            rightPunch: [3], // Triangle 🔺  
            leftKick: [0], // X/Cross ❌
            rightKick: [1], // Circle ⭕
            special: [4, 5], // L1 and R1
            pause: [9], // Options button
            leftProjectile: [6], // L2 trigger
            rightProjectile: [7], // R2 trigger
            heavy: [4, 5] // L1 and R1 (changed from L2/R2)
          },
          Xbox: {
            leftPunch: [2], // X button
            rightPunch: [3], // Y button
            leftKick: [0], // A button  
            rightKick: [1], // B button
            special: [4, 5], // LB and RB
            pause: [9], // Menu button (was incorrectly set to 7)
            leftProjectile: [6], // LT trigger
            rightProjectile: [7], // RT trigger (now free from pause conflict)
            heavy: [4, 5] // LB and RB
          },
          Generic: {
            leftPunch: [2], // Button 2
            rightPunch: [3], // Button 3
            leftKick: [0], // Button 0
            rightKick: [1], // Button 1
            special: [4, 5], // Button 4 and 5
            pause: [8, 9], // Button 8 and 9
            leftProjectile: [6], // Button 6
            rightProjectile: [7], // Button 7
            heavy: [4, 5] // Button 4 and 5
          }
        };
        
        const controls = buttonMap[gamepadType] || buttonMap.Generic;
        
        // Analog stick movement (with deadzone)
        const leftStickX = gp.axes[0];
        const leftStickY = gp.axes[1];
        const rightStickX = gp.axes[2];
        const rightStickY = gp.axes[3];
        
        // D-pad support (axes 4-7 or buttons 12-15 depending on controller)
        let dpadX = 0, dpadY = 0;
        if (gp.axes.length > 6) {
          dpadX = gp.axes[6];
          dpadY = gp.axes[7];
        } else {
          // D-pad as buttons
          if (gp.buttons[14]?.pressed) dpadX = -1; // Left
          if (gp.buttons[15]?.pressed) dpadX = 1;  // Right
          if (gp.buttons[12]?.pressed) dpadY = -1; // Up
          if (gp.buttons[13]?.pressed) dpadY = 1;  // Down
        }
        
        // Movement (analog stick + d-pad)
        const moveX = Math.abs(leftStickX) > 0.15 ? leftStickX : dpadX;
        
        if (moveX < -0.15) {
          playerRef.current.vx = -PLAYER_SPEED * Math.abs(moveX); // Variable speed based on stick position
          playerRef.current.facing = 'left';
        } else if (moveX > 0.15) {
          playerRef.current.vx = PLAYER_SPEED * Math.abs(moveX);
          playerRef.current.facing = 'right';
        } else {
          playerRef.current.vx = 0;
        }
        
        // Jump using D-pad up or left analog stick up
        const dpadUpPressed = dpadY < -0.5; // D-pad up
        const analogUpPressed = leftStickY < -0.5; // Left analog stick up
        const jumpPressed = dpadUpPressed || analogUpPressed;
        
        if (jumpPressed && playerRef.current.onGround) {
          playerRef.current.vy = -JUMP_POWER;
          playerRef.current.onGround = false;
          console.log(`${gamepadType} controller: Jump activated via D-pad/analog stick`);
        }
        
        // Enhanced Combat Controls (PS4/PS5 Controller Mapping)
        let newActiveKeys = { ...activeKeys };
        
        // Left Punch - Square 🔲
        const leftPunchPressed = controls.leftPunch?.some(btn => gp.buttons[btn]?.pressed);
        const lastLeftPunchPressed = controls.leftPunch?.some(btn => lastGamepadState.buttons[btn]);
        if (leftPunchPressed && !lastLeftPunchPressed) {
          performCombatAttack('left-punch');
          newActiveKeys.q = true;
          console.log(`${gamepadType} controller: Left Punch (Square) activated`);
        } else if (!leftPunchPressed) {
          newActiveKeys.q = false;
        }

        // Right Punch - Triangle 🔺
        const rightPunchPressed = controls.rightPunch?.some(btn => gp.buttons[btn]?.pressed);
        const lastRightPunchPressed = controls.rightPunch?.some(btn => lastGamepadState.buttons[btn]);
        if (rightPunchPressed && !lastRightPunchPressed) {
          performCombatAttack('right-punch');
          newActiveKeys.e = true;
          console.log(`${gamepadType} controller: Right Punch (Triangle) activated`);
        } else if (!rightPunchPressed) {
          newActiveKeys.e = false;
        }

        // Left Kick - X/Cross ❌
        const leftKickPressed = controls.leftKick?.some(btn => gp.buttons[btn]?.pressed);
        const lastLeftKickPressed = controls.leftKick?.some(btn => lastGamepadState.buttons[btn]);
        if (leftKickPressed && !lastLeftKickPressed) {
          performCombatAttack('left-kick');
          newActiveKeys.f = true;
          console.log(`${gamepadType} controller: Left Kick (X/Cross) activated`);
        } else if (!leftKickPressed) {
          newActiveKeys.f = false;
        }

        // Right Kick - Circle ⭕ (Note: Circle is also used for jump, but different timing)
        const rightKickPressed = controls.rightKick?.some(btn => gp.buttons[btn]?.pressed);
        const lastRightKickPressed = controls.rightKick?.some(btn => lastGamepadState.buttons[btn]);
        if (rightKickPressed && !lastRightKickPressed && !jumpPressed) { // Prevent conflict with jump
          performCombatAttack('right-kick');
          newActiveKeys.g = true;
          console.log(`${gamepadType} controller: Right Kick (Circle) activated`);
        } else if (!rightKickPressed) {
          newActiveKeys.g = false;
        }

        setActiveKeys(newActiveKeys);

        // Special Move (shoulder buttons)
        const specialPressed = controls.special.some(btn => gp.buttons[btn]?.pressed);
        const lastSpecialPressed = controls.special.some(btn => lastGamepadState.buttons[btn]);
        
        if (specialPressed && !lastSpecialPressed && specialMeter.player >= 100 && !playerRef.current.isAttacking) {
          console.log(`${gamepadType} controller: Special move activated`);
          playerRef.current.isAttacking = true;
          playerRef.current.currentAnimation = 'punch_quad';
          playerRef.current.attackCooldown = 45;
          
          // Consume special meter
          setSpecialMeter(prev => ({ ...prev, player: 0 }));
          
          // Enhanced screen shake for special
          setScreenShake({ active: true, intensity: 12, timer: 30 });
          
          // Check if special hits enemy (longer range)
          const distance = Math.abs(playerRef.current.x - enemyRef.current.x);
          if (distance < CHARACTER_WIDTH + 50) {
            const specialDamage = playerRef.current.attack * 3;
            enemyRef.current.health = Math.max(0, enemyRef.current.health - specialDamage);
            
            // Create special move particles
            createParticles(enemyRef.current.x, enemyRef.current.y - 50, '#ffd700', 8, 'explosion');
            createParticles(enemyRef.current.x, enemyRef.current.y - 50, '#ffffff', 6, 'spark');
            createParticles(enemyRef.current.x, enemyRef.current.y - 50, '#ffaa00', 2, 'shockwave');
            
            // Massive knockback
            const knockbackForce = 15;
            if (playerRef.current.x < enemyRef.current.x) {
              enemyRef.current.vx = knockbackForce;
            } else {
              enemyRef.current.vx = -knockbackForce;
            }
            enemyRef.current.vy = -8;
            enemyRef.current.onGround = false;
            
            // Reset combo for massive hit
            setCombo(prev => ({ ...prev, player: 10, timer: 300 }));
            
            // Enhanced PS5 haptic feedback for special moves
            if (gamepadType === 'PS5' && gp.vibrationActuator) {
              gp.vibrationActuator.playEffect('dual-rumble', {
                duration: 500,
                strongMagnitude: 1.0,
                weakMagnitude: 0.8
              }).catch(() => {
                console.log('Enhanced haptic feedback not supported');
              });
            }
          }
        }
        
        // Heavy Attack (trigger buttons)
        const heavyPressed = controls.heavy.some(btn => gp.buttons[btn]?.pressed);
        const lastHeavyPressed = controls.heavy.some(btn => lastGamepadState.buttons[btn]);
        
        if (heavyPressed && !lastHeavyPressed && !playerRef.current.isAttacking && playerRef.current.attackCooldown === 0) {
          console.log(`${gamepadType} controller: Heavy attack activated`);
          playerRef.current.isAttacking = true;
          playerRef.current.currentAnimation = 'punch_quad';
          playerRef.current.attackCooldown = 40;
          
          // Check if heavy attack hits enemy
          const distance = Math.abs(playerRef.current.x - enemyRef.current.x);
          if (distance < CHARACTER_WIDTH + 30) {
            const heavyDamage = Math.floor(playerRef.current.attack * 1.5);
            enemyRef.current.health = Math.max(0, enemyRef.current.health - heavyDamage);
            
            // Build special meter faster for heavy attacks
            setSpecialMeter(prev => ({ ...prev, player: Math.min(100, prev.player + 20) }));
            
            // Create heavy attack particles
            createParticles(enemyRef.current.x, enemyRef.current.y - 50, '#ff8800', 6, 'explosion');
            createParticles(enemyRef.current.x, enemyRef.current.y - 50, '#ffff00', 4, 'spark');
            
            // Trigger collision animation
            const collisionX = (playerRef.current.x + enemyRef.current.x) / 2;
            const collisionY = Math.min(playerRef.current.y, enemyRef.current.y) - 20;
            triggerCollisionAnimation(collisionX, collisionY);
          }
        }
        
        // Enhanced projectile controls with different types
        const leftProjectilePressed = controls.leftProjectile?.some(btn => gp.buttons[btn]?.pressed);
        const lastLeftProjectilePressed = controls.leftProjectile?.some(btn => lastGamepadState.buttons[btn]);
        const rightProjectilePressed = controls.rightProjectile?.some(btn => gp.buttons[btn]?.pressed);
        const lastRightProjectilePressed = controls.rightProjectile?.some(btn => lastGamepadState.buttons[btn]);
        
        if (leftProjectilePressed && !lastLeftProjectilePressed && playerRef.current.attackCooldown === 0) {
          console.log(`${gamepadType} controller: Normal projectile fired`);
          fireProjectile(playerRef.current, playerRef.current.facing, 'normal');
          playerRef.current.attackCooldown = 20;
        }
        
        // Face buttons for different projectile types
        const trianglePressed = gp.buttons[3]?.pressed; // Triangle/Y
        const lastTrianglePressed = lastGamepadState.buttons[3];
        
        if (trianglePressed && !lastTrianglePressed && playerRef.current.attackCooldown === 0) {
          console.log(`${gamepadType} controller: Rapid projectile fired`);
          fireProjectile(playerRef.current, playerRef.current.facing, 'rapid');
          playerRef.current.attackCooldown = 15;
        }
        
        const squarePressed = gp.buttons[2]?.pressed; // Square/X
        const lastSquarePressed = lastGamepadState.buttons[2];
        
        if (squarePressed && !lastSquarePressed && playerRef.current.attackCooldown === 0) {
          console.log(`${gamepadType} controller: Plasma projectile fired`);
          fireProjectile(playerRef.current, playerRef.current.facing, 'plasma');
          playerRef.current.attackCooldown = 35;
        }
        
        const circlePressed = gp.buttons[1]?.pressed; // Circle/B
        const lastCirclePressed = lastGamepadState.buttons[1];
        
        if (circlePressed && !lastCirclePressed && playerRef.current.attackCooldown === 0) {
          console.log(`${gamepadType} controller: Homing projectile fired`);
          fireProjectile(playerRef.current, playerRef.current.facing, 'homing');
          playerRef.current.attackCooldown = 60;
        }
        
        // Enhanced Fire & Ice projectiles using D-pad + trigger combinations
        const dpadDown = gp.buttons[13]?.pressed; // D-pad down
        const dpadUp = gp.buttons[12]?.pressed; // D-pad up
        const dpadLeft = gp.buttons[14]?.pressed; // D-pad left
        
        // Fire projectile: D-pad Down + R2/RT
        if (rightProjectilePressed && dpadDown && !lastRightProjectilePressed && playerRef.current.attackCooldown === 0) {
          console.log(`${gamepadType} controller: 🔥 Fire projectile fired (D-pad Down + R2)`);
          fireProjectile(playerRef.current, playerRef.current.facing, 'fire');
          playerRef.current.attackCooldown = 30;
        }
        // Ice projectile: D-pad Up + R2/RT  
        else if (rightProjectilePressed && dpadUp && !lastRightProjectilePressed && playerRef.current.attackCooldown === 0) {
          console.log(`${gamepadType} controller: ❄️ Ice projectile fired (D-pad Up + R2)`);
          fireProjectile(playerRef.current, playerRef.current.facing, 'ice');
          playerRef.current.attackCooldown = 40;
        }
        // Ember projectile: D-pad Left + R2/RT
        else if (rightProjectilePressed && dpadLeft && !lastRightProjectilePressed && playerRef.current.attackCooldown === 0) {
          console.log(`${gamepadType} controller: ✨ Ember projectile fired (D-pad Left + R2)`);
          fireProjectile(playerRef.current, playerRef.current.facing, 'ember');
          playerRef.current.attackCooldown = 25;
        }
        // Standard power projectile: R2/RT alone
        else if (rightProjectilePressed && !lastRightProjectilePressed && playerRef.current.attackCooldown === 0) {
          console.log(`${gamepadType} controller: Power projectile fired`);
          fireProjectile(playerRef.current, playerRef.current.facing, 'power');
          playerRef.current.attackCooldown = 45;
        }

        // Pause (Options/Menu button)
        const pausePressed = controls.pause.some(btn => gp.buttons[btn]?.pressed);
        const lastPausePressed = controls.pause.some(btn => lastGamepadState.buttons[btn]);
        
        if (pausePressed && !lastPausePressed) {
          console.log(`${gamepadType} controller: Pause toggled`);
          setIsPaused(prev => !prev);
        }
        
        // Store current state for next frame comparison
        lastGamepadState = {
          buttons: gp.buttons.map(btn => btn?.pressed || false),
          axes: [...gp.axes]
        };
        
        // Update connected gamepad info
        if (connectedGamepad.type !== gamepadType) {
          setConnectedGamepad({ type: gamepadType, name: gp.id });
          console.log(`🎮 ${gamepadType} Controller Connected: ${gp.id}`);
        }
        
        // Log controller info (only occasionally to avoid spam)
        if (Math.random() < 0.001) { // Very rare logging
          console.log(`Connected: ${gamepadType} Controller (${gp.id})`);
        }
      } else if (connectedGamepad.type) {
        // Controller disconnected
        setConnectedGamepad({ type: null, name: null });
        console.log('🎮 Controller Disconnected');
      }
    }
    gamepadInterval = setInterval(pollGamepad, 16);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(gamepadInterval);
    };
  }, [isPaused, gameOver.active]);

  // OVERRIDE: Correct fireProjectile function (this will override the corrupted one above)
  function fireProjectile(shooter, direction, type = 'normal') {
    // Projectile type configurations
    const projectileTypes = {
      normal: {
        speed: 3,
        size: 8,
        damage: 0.7,
        life: 240,
        color: shooter === playerRef.current ? '#4facfe' : '#ff4757',
        gravity: 0,
        bounce: false,
        piercing: false,
        homing: false
      },
      power: {
        speed: 2,
        size: 12,
        damage: 1.2,
        life: 300,
        color: shooter === playerRef.current ? '#00ff88' : '#ff8800',
        gravity: 0,
        bounce: false,
        piercing: true,
        homing: false
      },
      rapid: {
        speed: 4,
        size: 6,
        damage: 0.4,
        life: 180,
        color: shooter === playerRef.current ? '#ffff00' : '#ff0088',
        gravity: 0,
        bounce: false,
        piercing: false,
        homing: false
      },
      plasma: {
        speed: 7,
        size: 8,
        damage: 0.9,
        life: 100,
        color: shooter === playerRef.current ? '#88ffff' : '#ff4400',
        gravity: 0.02,
        bounce: true,
        piercing: false,
        homing: false
      },
      homing: {
        speed: 5,
        size: 7,
        damage: 0.8,
        life: 180,
        color: shooter === playerRef.current ? '#ff00ff' : '#00ffff',
        gravity: 0,
        bounce: false,
        piercing: false,
        homing: true
      }
    };
    
    const config = projectileTypes[type] || projectileTypes.normal;
    const isPlayer = shooter === playerRef.current;
    
    const newProjectile = {
      x: shooter.x + (direction === 'right' ? 40 : -40),
      y: shooter.y - 40,
      vx: direction === 'right' ? config.speed : -config.speed,
      vy: 0,
      size: config.size,
      type: type,
      owner: isPlayer ? 'player' : 'enemy',
      damage: Math.floor(shooter.attack * config.damage),
      life: config.life,
      maxLife: config.life,
      color: config.color,
      gravity: config.gravity,
      bounce: config.bounce,
      piercing: config.piercing,
      homing: config.homing,
      bounceCount: 0,
      maxBounces: 3,
      trail: [],
      trailLength: type === 'plasma' ? 8 : 5,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.3
    };
    
    setProjectiles(prev => [...prev, newProjectile]);
    console.log(`🚀 Projectile fired: ${type} at (${newProjectile.x}, ${newProjectile.y}) with speed ${config.speed}`);
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '2rem', position: 'relative' }}>
      <canvas ref={canvasRef} width={1200} height={500} style={{ background: 'linear-gradient(180deg, #3a3a5a 60%, #444 100%)', borderRadius: '12px', boxShadow: '0 2px 16px #0008', maxWidth: '100%' }} />
      
      {/* Enhanced Particle System Controls */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: '10px',
        borderRadius: '8px',
        color: '#fff',
        fontSize: '0.9rem',
        fontFamily: 'monospace',
        pointerEvents: 'none'
      }}>
        <div style={{ marginBottom: '5px', color: '#4facfe', fontWeight: 'bold' }}>🔥❄️ Enhanced Particle System</div>
        <div><strong>Keyboard:</strong></div>
        <div>Q: Normal | R: Rapid | 1: Power</div>
        <div>2: Plasma | 3: Homing</div>
        <div style={{ color: '#ff6600' }}>4: 🔥 Fire | 5: ❄️ Ice | 6: ✨ Ember</div>
        <div style={{ marginTop: '8px' }}><strong>🎮 Gamepad:</strong></div>
        <div style={{ fontSize: '0.85rem' }}>L2: Normal | R2: Power</div>
        <div style={{ fontSize: '0.85rem', color: '#ff6600' }}>
          D-pad ⬇️+R2: 🔥 Fire | D-pad ⬆️+R2: ❄️ Ice | D-pad ⬅️+R2: ✨ Ember
        </div>
        <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '5px' }}>
          Fire: Rising flames + burning effects<br/>
          Ice: Crystalline shards + frost trails<br/>
          Ember: Sparkling projectiles + glowing particles
        </div>
      </div>
      
      {/* Pause Overlay */}
      {isPaused && !gameOver.active && (
        <div 
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            borderRadius: '12px',
            color: '#fff',
            pointerEvents: 'auto',
            paddingLeft: '40px'
          }}
          onClick={(e) => {
            console.log('Pause overlay clicked');
            e.stopPropagation();
          }}
        >
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '3rem', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>⏸️ PAUSED</h2>
          <p style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', opacity: 0.9 }}>Press ESC or P to resume</p>
          <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column', alignItems: 'flex-start' }}>
            <button
              onClick={handleResumeGame}
              style={{
                padding: '12px 24px',
                fontSize: '1.1rem',
                backgroundColor: 'transparent',
                color: '#4facfe',
                border: '2px solid #4facfe',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(79, 172, 254, 0.3)',
                transition: 'all 0.2s ease',
                transform: 'scale(1)',
                minWidth: '200px'
              }}
            >
              ▶️ Resume Game
            </button>
            <button
              onClick={handleMainMenu}
              style={{
                padding: '12px 24px',
                fontSize: '1.1rem',
                backgroundColor: 'transparent',
                color: '#ff4757',
                border: '2px solid #ff4757',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(255, 71, 87, 0.3)',
                transition: 'all 0.2s ease',
                transform: 'scale(1)',
                zIndex: 1000,
                minWidth: '200px'
              }}
            >
              🏠 Main Menu
            </button>
          </div>
        </div>
      )}
      
      {/* Game Over Overlay */}
      {gameOver.active && (
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: '12px',
          color: '#fff'
        }}>
          <h1 style={{ 
            margin: '0 0 1rem 0', 
            fontSize: '4rem', 
            textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
            color: gameOver.winner === 'player' ? '#2ed573' : gameOver.winner === 'draw' ? '#ffd700' : '#ff4757'
          }}>
            {gameOver.winner === 'player' ? '🎉 VICTORY!' : gameOver.winner === 'draw' ? '🤝 DRAW!' : '💀 YOU LOSE!'}
          </h1>
          <p style={{ 
            margin: '0 0 2rem 0', 
            fontSize: '1.5rem', 
            opacity: 0.9,
            textAlign: 'center'
          }}>
            {gameOver.message}
          </p>
          <p style={{ margin: '0 0 2rem 0', fontSize: '1rem', opacity: 0.7, textAlign: 'center' }}>🎮 Use D-pad/Left Stick ← → and ❌ X to navigate</p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => {
                // Reset game state
                playerRef.current.health = playerRef.current.maxHealth;
                enemyRef.current.health = enemyRef.current.maxHealth;
                playerRef.current.x = 150;
                enemyRef.current.x = 1050;
                playerRef.current.y = GROUND_Y;
                enemyRef.current.y = GROUND_Y;
                playerRef.current.vx = 0;
                playerRef.current.vy = 0;
                enemyRef.current.vx = 0;
                enemyRef.current.vy = 0;
                playerRef.current.currentAnimation = 'idle';
                enemyRef.current.currentAnimation = 'idle';
                playerRef.current.isAttacking = false;
                enemyRef.current.isAttacking = false;
                playerRef.current.attackCooldown = 0;
                enemyRef.current.attackCooldown = 0;
                setGameOver({ active: false, winner: null, message: '' });
                setPlayer({ ...playerRef.current });
                setEnemy({ ...enemyRef.current });
              }}
              style={{
                padding: '12px 24px',
                fontSize: '1.1rem',
                backgroundColor: menuNavigation.gameOverMenuFocus === 0 ? '#20bf6b' : '#2ed573',
                color: '#fff',
                border: menuNavigation.gameOverMenuFocus === 0 ? '3px solid #fff' : 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: menuNavigation.gameOverMenuFocus === 0 ? '0 6px 16px rgba(46, 213, 115, 0.5)' : '0 4px 12px rgba(46, 213, 115, 0.3)',
                transition: 'all 0.2s ease',
                transform: menuNavigation.gameOverMenuFocus === 0 ? 'scale(1.05)' : 'scale(1)'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#20bf6b';
                setMenuNavigation(prev => ({ ...prev, gameOverMenuFocus: 0 }));
              }}
              onMouseOut={(e) => {
                if (menuNavigation.gameOverMenuFocus !== 0) e.target.style.backgroundColor = '#2ed573';
              }}
            >
              🔄 Play Again
            </button>
            <button
              onClick={(e) => {
                console.log('Game Over Main Menu button clicked!');
                console.log('onBackToMenu function:', onBackToMenu);
                e.preventDefault();
                e.stopPropagation();
                
                try {
                  if (onBackToMenu && typeof onBackToMenu === 'function') {
                    console.log('Calling onBackToMenu from game over...');
                    onBackToMenu();
                  } else {
                    console.log('onBackToMenu not available from game over, trying fallback navigation...');
                    // Try using window.location as a fallback
                    window.location.href = '/';
                  }
                } catch (error) {
                  console.error('Error in game over main menu navigation:', error);
                  // Last resort fallback
                  window.location.reload();
                }
              }}
              style={{
                padding: '12px 24px',
                fontSize: '1.1rem',
                backgroundColor: menuNavigation.gameOverMenuFocus === 1 ? '#ff3838' : '#ff4757',
                color: '#fff',
                border: menuNavigation.gameOverMenuFocus === 1 ? '3px solid #fff' : 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: menuNavigation.gameOverMenuFocus === 1 ? '0 6px 16px rgba(255, 71, 87, 0.5)' : '0 4px 12px rgba(255, 71, 87, 0.3)',
                transition: 'all 0.2s ease',
                transform: menuNavigation.gameOverMenuFocus === 1 ? 'scale(1.05)' : 'scale(1)',
                zIndex: 1000
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#ff3838';
                setMenuNavigation(prev => ({ ...prev, gameOverMenuFocus: 1 }));
              }}
              onMouseOut={(e) => {
                if (menuNavigation.gameOverMenuFocus !== 1) e.target.style.backgroundColor = '#ff4757';
              }}
            >
              🏠 Main Menu
            </button>
          </div>
        </div>
      )}
      
      <div style={{ marginTop: '1rem', color: '#fff', lineHeight: '1.6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', maxWidth: '1200px', margin: '0 auto', gap: '2rem' }}>
          <div style={{ textAlign: 'left', flex: 1 }}>
            <div><strong>🎮 Basic Controls:</strong></div>
            <div>Move: ← → / A D / Left Stick</div>
            <div>Jump: ↑ W Space / D-pad ↑ / Left Stick ↑</div>
            <div>Pause: ESC P / Options (PS5) / Menu (Xbox)</div>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div><strong>🥊 Enhanced Combat:</strong></div>
            <div>Left Punch: Q / 🔲 Square (PS4/PS5)</div>
            <div>Right Punch: E / 🔺 Triangle (PS4/PS5)</div>
            <div>Left Kick: F / ❌ X/Cross (PS4/PS5)</div>
            <div>Right Kick: G / ⭕ Circle (PS4/PS5)</div>
            <div style={{ color: '#ffd700', marginTop: '0.3rem' }}>💥 Combo: Press both punches/kicks together!</div>
          </div>
          <div style={{ textAlign: 'right', flex: 1 }}>
            <div><strong>💡 Combat Tips:</strong></div>
            <div>🥊 Double Punch: 1.8x damage</div>
            <div>🦵 Double Kick: 2.2x damage</div>
            <div>⚡ Kicks are stronger than punches</div>
            <div>🔥 Build combos for bonus damage!</div>
            <div>⭐ Special: Z (when meter full)</div>
          </div>
        </div>
        <div style={{ 
          marginTop: '0.5rem', 
          fontSize: '0.9rem', 
          opacity: 0.8,
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem'
        }}>
          <span>Player: {player.name} vs Enemy: {enemy.name}</span>
          <span>Sprites: {spritesLoaded.player ? '✅' : '⏳'} / {spritesLoaded.enemy ? '✅' : '⏳'}</span>
          <span>Particles: {particlesRef.current.length}</span>
          {connectedGamepad.type && (
            <span style={{ color: '#4facfe' }}>
              🎮 {connectedGamepad.type} Controller
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SideScroller;
