/**
 * Render System - High-Performance 2D Rendering Engine
 * 
 * Handles all rendering operations including sprites, animations, effects,
 * and UI elements with optimized batching and culling.
 */

export class RenderSystem {
  constructor(engine) {
    this.engine = engine;
    this.ctx = engine.getContext();
    this.canvas = engine.getCanvas();
    
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
    
    // Rendering statistics
    this.stats = {
      entitiesRendered: 0,
      entitiesCulled: 0,
      drawCalls: 0,
      frameTime: 0
    };
    
    // Asset cache
    this.imageCache = new Map();
    this.fontCache = new Map();
    
    console.log('🎨 Render System initialized');
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
    const image = this.loadImage(sprite.imagePath);
    if (!image || !image.complete) return;
    
    // Calculate frame position for sprite sheets
    const frameX = (sprite.currentFrame % sprite.framesPerRow || 1) * sprite.frameWidth;
    const frameY = Math.floor(sprite.currentFrame / (sprite.framesPerRow || 1)) * sprite.frameHeight;
    
    // Apply sprite flipping
    if (sprite.flipX || sprite.flipY) {
      ctx.save();
      ctx.scale(sprite.flipX ? -1 : 1, sprite.flipY ? -1 : 1);
      ctx.translate(
        sprite.flipX ? -transform.width : 0,
        sprite.flipY ? -transform.height : 0
      );
    }
    
    // Render sprite
    ctx.drawImage(
      image,
      frameX, frameY, sprite.frameWidth, sprite.frameHeight,
      0, 0, transform.width, transform.height
    );
    
    if (sprite.flipX || sprite.flipY) {
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

  // Utility methods
  updateStats() {
    // Statistics are updated during render calls
  }

  getStats() {
    return { ...this.stats };
  }

  getCamera() {
    return { ...this.camera };
  }

  // Cleanup
  destroy() {
    this.imageCache.clear();
    this.fontCache.clear();
    this.layers.clear();
  }
}

export default RenderSystem;