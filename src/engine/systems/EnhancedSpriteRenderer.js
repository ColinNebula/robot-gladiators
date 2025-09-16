class EnhancedSpriteRenderer {
  constructor() {
    this.imageCache = new Map();
    this.renderQueue = [];
    this.batchSize = 50;
    this.textureAtlas = null;
    this.currentBatch = [];
  }

  // Initialize the enhanced sprite renderer
  initialize(canvas, context) {
    this.canvas = canvas;
    this.ctx = context;
    this.devicePixelRatio = window.devicePixelRatio || 1;
    
    // Set up high-quality rendering
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    
    console.log('Enhanced Sprite Renderer initialized');
  }

  // Enhanced image loading with preloading and error handling
  async loadSprite(src, options = {}) {
    const cacheKey = `${src}_${JSON.stringify(options)}`;
    
    if (this.imageCache.has(cacheKey)) {
      return this.imageCache.get(cacheKey);
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Process image if needed (tinting, filtering, etc.)
        const processedImage = this.processImage(img, options);
        this.imageCache.set(cacheKey, processedImage);
        resolve(processedImage);
      };
      
      img.onerror = () => {
        console.warn(`Failed to load sprite: ${src}`);
        // Create fallback sprite
        const fallback = this.createFallbackSprite(options);
        this.imageCache.set(cacheKey, fallback);
        resolve(fallback);
      };
      
      img.src = src;
    });
  }

  // Process image with filters and effects
  processImage(image, options) {
    if (!options.tint && !options.filter && !options.scale) {
      return image;
    }

    const canvas = document.createElement('canvas');
    canvas.width = image.width * (options.scale || 1);
    canvas.height = image.height * (options.scale || 1);
    const ctx = canvas.getContext('2d');

    // Apply scaling
    if (options.scale && options.scale !== 1) {
      ctx.imageSmoothingEnabled = false; // For pixel art
    }

    // Draw base image
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Apply tint
    if (options.tint) {
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = options.tint;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'destination-atop';
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';
    }

    // Apply filters
    if (options.filter) {
      ctx.filter = options.filter;
      ctx.drawImage(canvas, 0, 0);
      ctx.filter = 'none';
    }

    return canvas;
  }

  // Create fallback sprite for failed loads
  createFallbackSprite(options) {
    const canvas = document.createElement('canvas');
    canvas.width = options.width || 48;
    canvas.height = options.height || 48;
    const ctx = canvas.getContext('2d');

    // Create gradient background
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, canvas.width / 2
    );
    gradient.addColorStop(0, options.primaryColor || '#4facfe');
    gradient.addColorStop(1, options.secondaryColor || '#00c4ff');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add placeholder icon
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', canvas.width / 2, canvas.height / 2);

    return canvas;
  }

  // Enhanced sprite rendering with advanced features
  renderSprite(sprite, options = {}) {
    const {
      x = 0,
      y = 0,
      width = sprite.width,
      height = sprite.height,
      frameX = 0,
      frameY = 0,
      frameWidth = sprite.width,
      frameHeight = sprite.height,
      rotation = 0,
      flipX = false,
      flipY = false,
      alpha = 1,
      tint = null,
      scale = 1,
      anchor = { x: 0.5, y: 0.5 },
      effects = {},
      zIndex = 0
    } = options;

    // Add to render queue for batch processing
    this.renderQueue.push({
      sprite,
      x, y, width, height,
      frameX, frameY, frameWidth, frameHeight,
      rotation, flipX, flipY, alpha, tint, scale,
      anchor, effects, zIndex,
      timestamp: Date.now()
    });
  }

  // Batch render all queued sprites
  flushRenderQueue() {
    if (this.renderQueue.length === 0) return;

    // Sort by z-index for proper layering
    this.renderQueue.sort((a, b) => a.zIndex - b.zIndex);

    // Process in batches for better performance
    for (let i = 0; i < this.renderQueue.length; i += this.batchSize) {
      const batch = this.renderQueue.slice(i, i + this.batchSize);
      this.processBatch(batch);
    }

    this.renderQueue = [];
  }

  // Process a batch of sprites
  processBatch(batch) {
    for (const item of batch) {
      this.renderSpriteImmediate(item);
    }
  }

  // Immediate sprite rendering
  renderSpriteImmediate(item) {
    const {
      sprite, x, y, width, height,
      frameX, frameY, frameWidth, frameHeight,
      rotation, flipX, flipY, alpha, tint, scale,
      anchor, effects
    } = item;

    this.ctx.save();

    // Calculate anchor offset
    const anchorOffsetX = width * anchor.x * scale;
    const anchorOffsetY = height * anchor.y * scale;

    // Apply transformations
    this.ctx.translate(x, y);
    
    if (rotation !== 0) {
      this.ctx.rotate(rotation);
    }

    if (flipX || flipY) {
      this.ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    }

    this.ctx.translate(-anchorOffsetX, -anchorOffsetY);

    // Apply alpha
    this.ctx.globalAlpha = alpha;

    // Apply effects
    this.applyRenderEffects(effects);

    // Apply tint if specified
    if (tint) {
      this.ctx.globalCompositeOperation = 'multiply';
      this.ctx.fillStyle = tint;
      this.ctx.fillRect(-anchorOffsetX, -anchorOffsetY, width * scale, height * scale);
      this.ctx.globalCompositeOperation = 'destination-atop';
    }

    // Render the sprite
    this.ctx.drawImage(
      sprite,
      frameX, frameY, frameWidth, frameHeight,
      -anchorOffsetX, -anchorOffsetY, width * scale, height * scale
    );

    this.ctx.restore();
  }

  // Apply visual effects during rendering
  applyRenderEffects(effects) {
    if (!effects) return;

    // Glow effect
    if (effects.glow) {
      this.ctx.shadowColor = effects.glow.color || '#ffffff';
      this.ctx.shadowBlur = effects.glow.intensity || 10;
    }

    // Blur effect
    if (effects.blur) {
      this.ctx.filter = `blur(${effects.blur}px)`;
    }

    // Brightness effect
    if (effects.brightness) {
      this.ctx.filter = `brightness(${effects.brightness})`;
    }

    // Custom filter
    if (effects.filter) {
      this.ctx.filter = effects.filter;
    }
  }

  // Animated sprite rendering with frame management
  renderAnimatedSprite(animationData, timestamp) {
    const {
      spriteSheet,
      animations,
      currentAnimation,
      frameIndex,
      x, y, scale = 1,
      effects = {}
    } = animationData;

    const anim = animations[currentAnimation];
    if (!anim) return;

    const frameX = (frameIndex % anim.framesPerRow) * anim.frameWidth;
    const frameY = Math.floor(frameIndex / anim.framesPerRow) * anim.frameHeight;

    this.renderSprite(spriteSheet, {
      x, y,
      frameX, frameY,
      frameWidth: anim.frameWidth,
      frameHeight: anim.frameHeight,
      width: anim.frameWidth,
      height: anim.frameHeight,
      scale,
      effects
    });
  }

  // Particle system integration
  renderParticles(particles) {
    for (const particle of particles) {
      if (particle.sprite) {
        this.renderSprite(particle.sprite, {
          x: particle.x,
          y: particle.y,
          scale: particle.scale,
          rotation: particle.rotation,
          alpha: particle.alpha,
          tint: particle.color,
          effects: particle.effects
        });
      } else {
        // Render as colored particle
        this.ctx.save();
        this.ctx.globalAlpha = particle.alpha;
        this.ctx.fillStyle = particle.color;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }
    }
  }

  // Performance monitoring
  getPerformanceStats() {
    return {
      cachedSprites: this.imageCache.size,
      queuedSprites: this.renderQueue.length,
      lastBatchSize: this.currentBatch.length,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  // Estimate memory usage of cached sprites
  estimateMemoryUsage() {
    let totalBytes = 0;
    for (const [key, sprite] of this.imageCache) {
      if (sprite.width && sprite.height) {
        totalBytes += sprite.width * sprite.height * 4; // RGBA bytes
      }
    }
    return totalBytes;
  }

  // Clear cache to free memory
  clearCache() {
    this.imageCache.clear();
    console.log('Sprite cache cleared');
  }

  // Preload sprites for better performance
  async preloadSprites(spriteList) {
    const promises = spriteList.map(sprite => 
      this.loadSprite(sprite.src, sprite.options)
    );
    
    try {
      await Promise.all(promises);
      console.log(`Preloaded ${spriteList.length} sprites`);
    } catch (error) {
      console.warn('Some sprites failed to preload:', error);
    }
  }
}

export default EnhancedSpriteRenderer;