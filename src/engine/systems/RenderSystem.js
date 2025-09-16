/**
 * Render System - High-Performance 2D Rendering Engine with Enhanced Sprite Rendering
 * 
 * Handles all rendering operations including sprites, animations, effects,
 * and UI elements with optimized batching and culling.
 */

import EnhancedSpriteRenderer from './EnhancedSpriteRenderer.js';

export class RenderSystem {
  constructor(engine) {
    this.engine = engine;
    this.ctx = engine.getContext();
    this.canvas = engine.getCanvas();
    
    // Initialize enhanced sprite renderer
    this.spriteRenderer = new EnhancedSpriteRenderer();
    this.spriteRenderer.initialize(this.canvas, this.ctx);
    
    // Rendering state
    this.camera = {
      x: 0,
      y: 0,
      zoom: 1,
      shake: { x: 0, y: 0, intensity: 0, duration: 0 }
    };
    
    // Render layers for depth sorting
    this.layers = new Map([
      ['background', { zIndex: -100, entities: [] }],
      ['terrain', { zIndex: -50, entities: [] }],
      ['default', { zIndex: 0, entities: [] }],
      ['projectiles', { zIndex: 50, entities: [] }],
      ['effects', { zIndex: 100, entities: [] }],
      ['ui', { zIndex: 200, entities: [] }]
    ]);
    
    // Enhanced rendering statistics
    this.stats = {
      entitiesRendered: 0,
      entitiesCulled: 0,
      drawCalls: 0,
      frameTime: 0,
      spritesInCache: 0,
      memoryUsage: 0,
      batchedSprites: 0
    };
    
    // Asset cache
    this.imageCache = new Map();
    this.fontCache = new Map();
    
    console.log('🎨 Enhanced Render System initialized with sprite batching');
  }

  initialize() {
    // Setup default fonts
    this.loadFont('default', '16px Arial');
    this.loadFont('large', '24px Arial');
    this.loadFont('small', '12px Arial');
    
    // Setup canvas context optimizations
    this.optimizeContext();
  }

  start() {
    // Preload common assets
    this.preloadAssets();
  }

  stop() {
    // Cleanup resources
  }

  optimizeContext() {
    // Optimize context for better performance
    this.ctx.imageSmoothingQuality = 'high';
    this.ctx.textBaseline = 'top';
  }

  preloadAssets() {
    // Preload commonly used images
    const commonAssets = [
      '/assets/sprites/player.png',
      '/assets/sprites/enemy.png',
      '/assets/sprites/projectile.png'
    ];

    commonAssets.forEach(path => this.loadImage(path));
  }

  update(deltaTime) {
    // Update camera shake
    this.updateCameraShake(deltaTime);
    
    // Clear layer entities
    this.layers.forEach(layer => {
      layer.entities = [];
    });
    
    // Sort entities into render layers
    this.sortEntitiesIntoLayers();
    
    // Update render statistics
    this.updateStats();
  }

  updateCameraShake(deltaTime) {
    if (this.camera.shake.duration > 0) {
      this.camera.shake.duration -= deltaTime;
      
      const intensity = this.camera.shake.intensity * (this.camera.shake.duration / this.camera.shake.intensity);
      this.camera.shake.x = (Math.random() - 0.5) * intensity;
      this.camera.shake.y = (Math.random() - 0.5) * intensity;
      
      if (this.camera.shake.duration <= 0) {
        this.camera.shake.x = 0;
        this.camera.shake.y = 0;
        this.camera.shake.intensity = 0;
      }
    }
  }

  sortEntitiesIntoLayers() {
    const entityManager = this.engine.entityManager;
    const renderableEntities = entityManager.getEntitiesWithComponents('transform');
    
    renderableEntities.forEach(entity => {
      const render = entityManager.getComponent(entity.id, 'render') || { layer: 'default' };
      const layerName = render.layer || 'default';
      
      if (this.layers.has(layerName)) {
        this.layers.get(layerName).entities.push(entity);
      }
    });
  }

  render(ctx = this.ctx) {
    const startTime = performance.now();
    this.stats.drawCalls = 0;
    this.stats.entitiesRendered = 0;
    this.stats.entitiesCulled = 0;

    // Save context state
    ctx.save();
    
    // Apply camera transform
    this.applyCameraTransform(ctx);
    
    // Render layers in order
    const sortedLayers = Array.from(this.layers.entries())
      .sort((a, b) => a[1].zIndex - b[1].zIndex);
    
    sortedLayers.forEach(([layerName, layer]) => {
      this.renderLayer(ctx, layerName, layer);
    });
    
    // Flush all batched sprites at once for better performance
    this.spriteRenderer.flushRenderQueue();
    
    // Update enhanced statistics
    const spriteStats = this.spriteRenderer.getPerformanceStats();
    this.stats.spritesInCache = spriteStats.cachedSprites;
    this.stats.memoryUsage = spriteStats.memoryUsage;
    this.stats.batchedSprites = spriteStats.queuedSprites;
    
    // Restore context state
    ctx.restore();
    
    // Update frame time
    this.stats.frameTime = performance.now() - startTime;
  }

  applyCameraTransform(ctx) {
    // Apply camera position and shake
    ctx.translate(
      -this.camera.x + this.camera.shake.x,
      -this.camera.y + this.camera.shake.y
    );
    
    // Apply zoom
    if (this.camera.zoom !== 1) {
      ctx.scale(this.camera.zoom, this.camera.zoom);
    }
  }

  renderLayer(ctx, layerName, layer) {
    layer.entities.forEach(entity => {
      if (this.isEntityVisible(entity)) {
        this.renderEntity(ctx, entity);
        this.stats.entitiesRendered++;
      } else {
        this.stats.entitiesCulled++;
      }
    });
  }

  isEntityVisible(entity) {
    const transform = entity.transform;
    const viewBounds = this.getViewBounds();
    
    // Simple frustum culling
    return !(
      transform.x + transform.width < viewBounds.left ||
      transform.x > viewBounds.right ||
      transform.y + transform.height < viewBounds.top ||
      transform.y > viewBounds.bottom
    );
  }

  getViewBounds() {
    const padding = 100; // Extra padding for smooth culling
    return {
      left: this.camera.x - padding,
      right: this.camera.x + (this.canvas.width / this.engine.options.pixelRatio) + padding,
      top: this.camera.y - padding,
      bottom: this.camera.y + (this.canvas.height / this.engine.options.pixelRatio) + padding
    };
  }

  renderEntity(ctx, entity) {
    const entityManager = this.engine.entityManager;
    const transform = entity.transform;
    
    ctx.save();
    
    // Apply entity transform
    ctx.translate(transform.x + transform.width / 2, transform.y + transform.height / 2);
    
    if (transform.rotation) {
      ctx.rotate(transform.rotation);
    }
    
    if (transform.scaleX !== 1 || transform.scaleY !== 1) {
      ctx.scale(transform.scaleX, transform.scaleY);
    }
    
    ctx.translate(-transform.width / 2, -transform.height / 2);
    
    // Render sprite component
    const sprite = entityManager.getComponent(entity.id, 'sprite');
    if (sprite) {
      this.renderSprite(ctx, sprite, transform);
    }
    
    // Render shape component (fallback)
    const shape = entityManager.getComponent(entity.id, 'shape');
    if (shape && !sprite) {
      this.renderShape(ctx, shape, transform);
    }
    
    // Render text component
    const text = entityManager.getComponent(entity.id, 'text');
    if (text) {
      this.renderText(ctx, text, transform);
    }
    
    // Render health bar
    const health = entityManager.getComponent(entity.id, 'health');
    if (health && health.showHealthBar) {
      this.renderHealthBar(ctx, health, transform);
    }
    
    ctx.restore();
    this.stats.drawCalls++;
  }

  renderSprite(ctx, sprite, transform) {
    // Use enhanced sprite renderer for better performance and effects
    const renderOptions = {
      x: transform.x,
      y: transform.y,
      width: transform.width,
      height: transform.height,
      frameX: (sprite.currentFrame % (sprite.framesPerRow || 1)) * sprite.frameWidth,
      frameY: Math.floor(sprite.currentFrame / (sprite.framesPerRow || 1)) * sprite.frameHeight,
      frameWidth: sprite.frameWidth,
      frameHeight: sprite.frameHeight,
      rotation: transform.rotation || 0,
      flipX: sprite.flipX || false,
      flipY: sprite.flipY || false,
      alpha: sprite.alpha !== undefined ? sprite.alpha : 1,
      tint: sprite.tint || null,
      scale: sprite.scale || 1,
      anchor: sprite.anchor || { x: 0.5, y: 0.5 },
      effects: sprite.effects || {},
      zIndex: sprite.zIndex || 0
    };

    // Load sprite if not cached
    if (!this.spriteRenderer.imageCache.has(sprite.imagePath)) {
      this.spriteRenderer.loadSprite(sprite.imagePath, {
        tint: sprite.tint,
        filter: sprite.filter,
        scale: sprite.preScale || 1
      }).then(loadedSprite => {
        this.spriteRenderer.renderSprite(loadedSprite, renderOptions);
      });
    } else {
      const loadedSprite = this.spriteRenderer.imageCache.get(sprite.imagePath);
      this.spriteRenderer.renderSprite(loadedSprite, renderOptions);
    }

    // Apply animation effects
    if (sprite.effects) {
      this.applyAdvancedSpriteEffects(ctx, sprite, transform);
    }
  }

  // Enhanced sprite effects system
  applyAdvancedSpriteEffects(ctx, sprite, transform) {
    const effects = sprite.effects;
    
    // Glow effect
    if (effects.glow) {
      ctx.save();
      ctx.shadowColor = effects.glow.color || sprite.tint || '#ffffff';
      ctx.shadowBlur = effects.glow.intensity || 20;
      ctx.globalCompositeOperation = 'source-atop';
      ctx.restore();
    }

    // Trail effect for moving sprites
    if (effects.trail && sprite.velocity) {
      this.renderSpriteTrail(ctx, sprite, transform);
    }

    // Pulse effect
    if (effects.pulse) {
      const pulseScale = 1 + Math.sin(Date.now() * 0.01) * effects.pulse.amplitude;
      ctx.scale(pulseScale, pulseScale);
    }

    // Shake effect
    if (effects.shake) {
      const shakeX = (Math.random() - 0.5) * effects.shake.intensity;
      const shakeY = (Math.random() - 0.5) * effects.shake.intensity;
      ctx.translate(shakeX, shakeY);
    }

    // Afterimage effect
    if (effects.afterimage && sprite.previousPositions) {
      this.renderAfterimage(ctx, sprite, transform);
    }
  }

  // Render sprite trail effect
  renderSpriteTrail(ctx, sprite, transform) {
    if (!sprite.trailPositions) sprite.trailPositions = [];
    
    // Add current position to trail
    sprite.trailPositions.push({ x: transform.x, y: transform.y, time: Date.now() });
    
    // Remove old trail points
    const trailLifetime = sprite.effects.trail.lifetime || 500;
    sprite.trailPositions = sprite.trailPositions.filter(
      pos => Date.now() - pos.time < trailLifetime
    );

    // Render trail
    ctx.save();
    sprite.trailPositions.forEach((pos, index) => {
      const age = Date.now() - pos.time;
      const alpha = 1 - (age / trailLifetime);
      const scale = 0.5 + (alpha * 0.5);
      
      ctx.globalAlpha = alpha * 0.3;
      this.spriteRenderer.renderSprite(sprite.image, {
        x: pos.x,
        y: pos.y,
        width: transform.width * scale,
        height: transform.height * scale,
        alpha: alpha * 0.3,
        tint: sprite.effects.trail.color || sprite.tint
      });
    });
    ctx.restore();
  }

  // Render afterimage effect
  renderAfterimage(ctx, sprite, transform) {
    const afterimageCount = sprite.effects.afterimage.count || 3;
    const spacing = sprite.effects.afterimage.spacing || 10;
    
    for (let i = 1; i <= afterimageCount; i++) {
      const alpha = 1 - (i / afterimageCount);
      const offset = i * spacing;
      
      ctx.save();
      ctx.globalAlpha = alpha * 0.5;
      this.spriteRenderer.renderSprite(sprite.image, {
        x: transform.x - offset,
        y: transform.y,
        width: transform.width,
        height: transform.height,
        alpha: alpha * 0.5,
        tint: sprite.effects.afterimage.color || '#ffffff'
      });
      ctx.restore();
    }
  }

  renderShape(ctx, shape, transform) {
    ctx.fillStyle = shape.fillColor || '#ffffff';
    ctx.strokeStyle = shape.strokeColor || '#000000';
    ctx.lineWidth = shape.strokeWidth || 1;
    
    switch (shape.type) {
      case 'rectangle':
        ctx.fillRect(0, 0, transform.width, transform.height);
        if (shape.strokeWidth > 0) {
          ctx.strokeRect(0, 0, transform.width, transform.height);
        }
        break;
        
      case 'circle':
        const radius = Math.min(transform.width, transform.height) / 2;
        ctx.beginPath();
        ctx.arc(transform.width / 2, transform.height / 2, radius, 0, Math.PI * 2);
        ctx.fill();
        if (shape.strokeWidth > 0) {
          ctx.stroke();
        }
        break;
        
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(transform.width / 2, 0);
        ctx.lineTo(0, transform.height);
        ctx.lineTo(transform.width, transform.height);
        ctx.closePath();
        ctx.fill();
        if (shape.strokeWidth > 0) {
          ctx.stroke();
        }
        break;
    }
  }

  renderText(ctx, text, transform) {
    ctx.fillStyle = text.color || '#ffffff';
    ctx.font = text.font || this.fontCache.get('default');
    ctx.textAlign = text.align || 'left';
    ctx.textBaseline = text.baseline || 'top';
    
    // Handle multi-line text
    const lines = text.content.split('\n');
    const lineHeight = text.lineHeight || 20;
    
    lines.forEach((line, index) => {
      ctx.fillText(line, text.offsetX || 0, (text.offsetY || 0) + index * lineHeight);
    });
  }

  renderHealthBar(ctx, health, transform) {
    const barWidth = transform.width;
    const barHeight = 4;
    const barY = -10;
    
    // Background
    ctx.fillStyle = '#333333';
    ctx.fillRect(0, barY, barWidth, barHeight);
    
    // Health bar
    const healthPercent = health.currentHealth / health.maxHealth;
    const healthColor = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
    
    ctx.fillStyle = healthColor;
    ctx.fillRect(0, barY, barWidth * healthPercent, barHeight);
    
    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, barY, barWidth, barHeight);
  }

  // Asset loading methods
  loadImage(path) {
    if (this.imageCache.has(path)) {
      return this.imageCache.get(path);
    }
    
    const image = new Image();
    image.src = path;
    
    image.onload = () => {
      console.log(`✅ Image loaded: ${path}`);
    };
    
    image.onerror = () => {
      console.warn(`⚠️ Failed to load image: ${path}`);
    };
    
    this.imageCache.set(path, image);
    return image;
  }

  loadFont(name, fontString) {
    this.fontCache.set(name, fontString);
  }

  // Camera control methods
  setCamera(x, y, zoom = 1) {
    this.camera.x = x;
    this.camera.y = y;
    this.camera.zoom = zoom;
  }

  moveCamera(deltaX, deltaY) {
    this.camera.x += deltaX;
    this.camera.y += deltaY;
  }

  followEntity(entityId, smoothing = 0.1) {
    const entity = this.engine.entityManager.getEntity(entityId);
    if (!entity) return;
    
    const transform = entity.transform;
    const targetX = transform.x - (this.canvas.width / this.engine.options.pixelRatio) / 2;
    const targetY = transform.y - (this.canvas.height / this.engine.options.pixelRatio) / 2;
    
    this.camera.x += (targetX - this.camera.x) * smoothing;
    this.camera.y += (targetY - this.camera.y) * smoothing;
  }

  shakeCamera(intensity, duration) {
    this.camera.shake.intensity = intensity;
    this.camera.shake.duration = duration;
  }

  // Effect methods
  drawLine(startX, startY, endX, endY, color = '#ffffff', width = 1) {
    this.ctx.save();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawCircle(x, y, radius, color = '#ffffff', fill = true) {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    
    if (fill) {
      this.ctx.fillStyle = color;
      this.ctx.fill();
    } else {
      this.ctx.strokeStyle = color;
      this.ctx.stroke();
    }
    
    this.ctx.restore();
  }

  drawRectangle(x, y, width, height, color = '#ffffff', fill = true) {
    this.ctx.save();
    
    if (fill) {
      this.ctx.fillStyle = color;
      this.ctx.fillRect(x, y, width, height);
    } else {
      this.ctx.strokeStyle = color;
      this.ctx.strokeRect(x, y, width, height);
    }
    
    this.ctx.restore();
  }

  // Enhanced utility methods
  updateStats() {
    // Statistics are updated during render calls
  }

  getStats() {
    return { ...this.stats };
  }

  getCamera() {
    return { ...this.camera };
  }

  // Preload sprites for better performance
  async preloadSprites(spriteList) {
    console.log(`🖼️ Preloading ${spriteList.length} sprites...`);
    return this.spriteRenderer.preloadSprites(spriteList);
  }

  // Get enhanced rendering statistics
  getEnhancedStats() {
    const baseStats = this.getStats();
    const spriteStats = this.spriteRenderer.getPerformanceStats();
    
    return {
      ...baseStats,
      spriteRenderer: spriteStats,
      memoryUsage: this.formatBytes(spriteStats.memoryUsage),
      cacheEfficiency: spriteStats.cachedSprites > 0 ? 
        (baseStats.entitiesRendered / spriteStats.cachedSprites * 100).toFixed(1) + '%' : '0%'
    };
  }

  // Format bytes for display
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Clear sprite cache to free memory
  clearSpriteCache() {
    this.spriteRenderer.clearCache();
    console.log('🧹 Sprite cache cleared');
  }

  // Cleanup
  destroy() {
    this.imageCache.clear();
    this.fontCache.clear();
    this.layers.clear();
    this.spriteRenderer.clearCache();
    console.log('🗑️ Render System destroyed');
  }
}

export default RenderSystem;