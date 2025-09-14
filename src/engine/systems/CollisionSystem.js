/**
 * Collision System - Advanced Collision Detection and Response
 * 
 * Handles all collision detection using spatial partitioning, broad-phase
 * and narrow-phase collision detection with configurable collision layers.
 */

export class CollisionSystem {
  constructor(engine) {
    this.engine = engine;
    
    // Spatial partitioning for broad-phase collision detection
    this.spatialGrid = new SpatialHashGrid(64); // 64px cell size
    this.quadTree = null;
    
    // Collision layers and groups
    this.collisionLayers = new Map();
    this.collisionMatrix = new Map();
    
    // Active collisions tracking
    this.activeCollisions = new Map();
    this.collisionPairs = new Set();
    
    // Performance settings
    this.maxCollisionsPerFrame = 500;
    this.enableContinuousCollision = true;
    this.collisionTolerance = 0.1;
    
    // Debug rendering
    this.debugMode = false;
    this.debugCollisions = [];
    
    // Statistics
    this.stats = {
      broadPhaseChecks: 0,
      narrowPhaseChecks: 0,
      collisionsDetected: 0,
      frameTime: 0
    };
    
    console.log('💥 Collision System initialized');
  }

  initialize() {
    this.setupDefaultLayers();
    this.setupCollisionMatrix();
  }

  setupDefaultLayers() {
    // Define default collision layers
    this.addCollisionLayer('default', 0);
    this.addCollisionLayer('player', 1);
    this.addCollisionLayer('enemy', 2);
    this.addCollisionLayer('projectile', 3);
    this.addCollisionLayer('terrain', 4);
    this.addCollisionLayer('pickup', 5);
    this.addCollisionLayer('trigger', 6);
    this.addCollisionLayer('ui', 7);
  }

  setupCollisionMatrix() {
    // Define which layers can collide with each other
    this.setLayerCollision('player', 'enemy', true);
    this.setLayerCollision('player', 'terrain', true);
    this.setLayerCollision('player', 'pickup', true);
    this.setLayerCollision('player', 'trigger', true);
    
    this.setLayerCollision('enemy', 'terrain', true);
    this.setLayerCollision('enemy', 'projectile', true);
    
    this.setLayerCollision('projectile', 'terrain', true);
    this.setLayerCollision('projectile', 'player', true);
    
    // Terrain collides with most things
    this.setLayerCollision('terrain', 'default', true);
  }

  start() {
    // Collision system is always active
  }

  stop() {
    // Clean up collision data
    this.clearCollisions();
  }

  update(deltaTime) {
    const startTime = performance.now();
    
    // Reset statistics
    this.stats.broadPhaseChecks = 0;
    this.stats.narrowPhaseChecks = 0;
    this.stats.collisionsDetected = 0;
    
    // Clear previous frame data
    this.spatialGrid.clear();
    this.debugCollisions = [];
    
    // Get all entities with collision components
    const colliders = this.getCollisionEntities();
    
    if (colliders.length === 0) {
      this.stats.frameTime = performance.now() - startTime;
      return;
    }
    
    // Broad-phase collision detection
    this.broadPhaseDetection(colliders);
    
    // Narrow-phase collision detection and response
    this.narrowPhaseDetection();
    
    // Update collision tracking
    this.updateCollisionTracking();
    
    // Update performance stats
    this.stats.frameTime = performance.now() - startTime;
  }

  getCollisionEntities() {
    return this.engine.entityManager.getEntitiesWithComponents('transform', 'collider')
      .filter(entity => {
        const collider = this.engine.entityManager.getComponent(entity.id, 'collider');
        return collider && collider.enabled !== false;
      });
  }

  broadPhaseDetection(colliders) {
    // Insert all colliders into spatial grid
    colliders.forEach(entity => {
      const transform = entity.transform;
      const collider = this.engine.entityManager.getComponent(entity.id, 'collider');
      
      // Calculate collision bounds
      const bounds = this.getCollisionBounds(transform, collider);
      
      // Insert into spatial grid
      this.spatialGrid.insert(entity.id, bounds.x, bounds.y, bounds.width, bounds.height);
      
      this.stats.broadPhaseChecks++;
    });
    
    // Find potential collision pairs
    this.collisionPairs.clear();
    
    colliders.forEach(entityA => {
      const transformA = entityA.transform;
      const colliderA = this.engine.entityManager.getComponent(entityA.id, 'collider');
      const boundsA = this.getCollisionBounds(transformA, colliderA);
      
      // Get nearby entities from spatial grid
      const nearby = this.spatialGrid.query(boundsA.x, boundsA.y, boundsA.width, boundsA.height);
      
      nearby.forEach(entityBId => {
        if (entityBId === entityA.id) return;
        
        const entityB = this.engine.entityManager.getEntity(entityBId);
        if (!entityB) return;
        
        const colliderB = this.engine.entityManager.getComponent(entityBId, 'collider');
        if (!colliderB) return;
        
        // Check if these layers can collide
        if (!this.canLayersCollide(colliderA.layer, colliderB.layer)) return;
        
        // Create collision pair (avoid duplicates)
        const pairKey = entityA.id < entityBId ? `${entityA.id}-${entityBId}` : `${entityBId}-${entityA.id}`;
        this.collisionPairs.add(pairKey);
      });
    });
  }

  narrowPhaseDetection() {
    this.collisionPairs.forEach(pairKey => {
      const [entityAId, entityBId] = pairKey.split('-').map(Number);
      
      const entityA = this.engine.entityManager.getEntity(entityAId);
      const entityB = this.engine.entityManager.getEntity(entityBId);
      
      if (!entityA || !entityB) return;
      
      const transformA = entityA.transform;
      const transformB = entityB.transform;
      const colliderA = this.engine.entityManager.getComponent(entityAId, 'collider');
      const colliderB = this.engine.entityManager.getComponent(entityBId, 'collider');
      
      this.stats.narrowPhaseChecks++;
      
      // Perform detailed collision detection
      const collision = this.detectCollision(
        transformA, colliderA,
        transformB, colliderB
      );
      
      if (collision) {
        this.handleCollision(entityA, entityB, collision);
        this.stats.collisionsDetected++;
        
        // Store for debug rendering
        if (this.debugMode) {
          this.debugCollisions.push({
            entityA: entityAId,
            entityB: entityBId,
            point: collision.point,
            normal: collision.normal
          });
        }
      }
    });
  }

  getCollisionBounds(transform, collider) {
    // Calculate bounds based on collider type and offset
    const offsetX = collider.offsetX || 0;
    const offsetY = collider.offsetY || 0;
    const width = collider.width || transform.width;
    const height = collider.height || transform.height;
    
    return {
      x: transform.x + offsetX,
      y: transform.y + offsetY,
      width,
      height
    };
  }

  detectCollision(transformA, colliderA, transformB, colliderB) {
    const boundsA = this.getCollisionBounds(transformA, colliderA);
    const boundsB = this.getCollisionBounds(transformB, colliderB);
    
    // Choose detection method based on collider types
    if (colliderA.shape === 'circle' && colliderB.shape === 'circle') {
      return this.detectCircleCircleCollision(boundsA, boundsB);
    } else if (colliderA.shape === 'circle' || colliderB.shape === 'circle') {
      return this.detectCircleRectCollision(boundsA, boundsB, colliderA.shape === 'circle');
    } else {
      return this.detectRectRectCollision(boundsA, boundsB);
    }
  }

  detectRectRectCollision(boundsA, boundsB) {
    // AABB collision detection
    const overlapX = Math.min(boundsA.x + boundsA.width, boundsB.x + boundsB.width) - 
                    Math.max(boundsA.x, boundsB.x);
    const overlapY = Math.min(boundsA.y + boundsA.height, boundsB.y + boundsB.height) - 
                    Math.max(boundsA.y, boundsB.y);
    
    if (overlapX > 0 && overlapY > 0) {
      // Calculate collision normal and point
      const centerAX = boundsA.x + boundsA.width / 2;
      const centerAY = boundsA.y + boundsA.height / 2;
      const centerBX = boundsB.x + boundsB.width / 2;
      const centerBY = boundsB.y + boundsB.height / 2;
      
      const deltaX = centerBX - centerAX;
      const deltaY = centerBY - centerAY;
      
      // Determine collision direction
      let normal;
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        normal = { x: Math.sign(deltaX), y: 0 };
      } else {
        normal = { x: 0, y: Math.sign(deltaY) };
      }
      
      return {
        point: {
          x: Math.max(boundsA.x, boundsB.x) + overlapX / 2,
          y: Math.max(boundsA.y, boundsB.y) + overlapY / 2
        },
        normal,
        depth: Math.min(overlapX, overlapY),
        overlapX,
        overlapY
      };
    }
    
    return null;
  }

  detectCircleCircleCollision(boundsA, boundsB) {
    const radiusA = Math.min(boundsA.width, boundsA.height) / 2;
    const radiusB = Math.min(boundsB.width, boundsB.height) / 2;
    
    const centerAX = boundsA.x + boundsA.width / 2;
    const centerAY = boundsA.y + boundsA.height / 2;
    const centerBX = boundsB.x + boundsB.width / 2;
    const centerBY = boundsB.y + boundsB.height / 2;
    
    const deltaX = centerBX - centerAX;
    const deltaY = centerBY - centerAY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance < radiusA + radiusB) {
      const normal = distance > 0 ? 
        { x: deltaX / distance, y: deltaY / distance } :
        { x: 1, y: 0 };
      
      return {
        point: {
          x: centerAX + normal.x * radiusA,
          y: centerAY + normal.y * radiusA
        },
        normal,
        depth: radiusA + radiusB - distance
      };
    }
    
    return null;
  }

  detectCircleRectCollision(boundsA, boundsB, aIsCircle) {
    const circleBounds = aIsCircle ? boundsA : boundsB;
    const rectBounds = aIsCircle ? boundsB : boundsA;
    
    const radius = Math.min(circleBounds.width, circleBounds.height) / 2;
    const circleCenterX = circleBounds.x + circleBounds.width / 2;
    const circleCenterY = circleBounds.y + circleBounds.height / 2;
    
    // Find closest point on rectangle to circle center
    const closestX = Math.max(rectBounds.x, Math.min(circleCenterX, rectBounds.x + rectBounds.width));
    const closestY = Math.max(rectBounds.y, Math.min(circleCenterY, rectBounds.y + rectBounds.height));
    
    const deltaX = circleCenterX - closestX;
    const deltaY = circleCenterY - closestY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance < radius) {
      const normal = distance > 0 ? 
        { x: deltaX / distance, y: deltaY / distance } :
        { x: 0, y: -1 };
      
      // Flip normal if rectangle is the first entity
      if (!aIsCircle) {
        normal.x = -normal.x;
        normal.y = -normal.y;
      }
      
      return {
        point: { x: closestX, y: closestY },
        normal,
        depth: radius - distance
      };
    }
    
    return null;
  }

  handleCollision(entityA, entityB, collision) {
    const colliderA = this.engine.entityManager.getComponent(entityA.id, 'collider');
    const colliderB = this.engine.entityManager.getComponent(entityB.id, 'collider');
    
    // Create collision event data
    const collisionData = {
      entityA: entityA.id,
      entityB: entityB.id,
      collision,
      colliderA,
      colliderB
    };
    
    // Handle trigger collisions
    if (colliderA.isTrigger || colliderB.isTrigger) {
      this.handleTriggerCollision(collisionData);
    } else {
      // Handle physical collision response
      this.handlePhysicalCollision(collisionData);
    }
    
    // Emit collision events
    this.engine.emit('collision', collisionData);
    this.engine.emit(`collision:${colliderA.layer}`, collisionData);
    this.engine.emit(`collision:${colliderB.layer}`, collisionData);
  }

  handleTriggerCollision(collisionData) {
    // Triggers don't affect physics but can trigger events
    this.engine.emit('trigger', {
      trigger: collisionData.colliderA.isTrigger ? collisionData.entityA : collisionData.entityB,
      other: collisionData.colliderA.isTrigger ? collisionData.entityB : collisionData.entityA,
      collision: collisionData.collision
    });
  }

  handlePhysicalCollision(collisionData) {
    const physicsSystem = this.engine.getSystem('physics');
    if (!physicsSystem) return;
    
    const { entityA, entityB, collision } = collisionData;
    const physicsA = this.engine.entityManager.getComponent(entityA, 'physics');
    const physicsB = this.engine.entityManager.getComponent(entityB, 'physics');
    
    if (!physicsA && !physicsB) return;
    
    // Separate entities
    const separationForce = collision.depth * 0.5;
    
    if (physicsA) {
      const transformA = this.engine.entityManager.getEntity(entityA).transform;
      transformA.x -= collision.normal.x * separationForce;
      transformA.y -= collision.normal.y * separationForce;
      
      // Apply collision response
      this.applyCollisionResponse(physicsA, collision.normal, physicsB);
    }
    
    if (physicsB) {
      const transformB = this.engine.entityManager.getEntity(entityB).transform;
      transformB.x += collision.normal.x * separationForce;
      transformB.y += collision.normal.y * separationForce;
      
      // Apply collision response (reversed normal)
      this.applyCollisionResponse(physicsB, 
        { x: -collision.normal.x, y: -collision.normal.y }, 
        physicsA
      );
    }
  }

  applyCollisionResponse(physics, normal, otherPhysics) {
    const restitution = 0.5; // Bounciness
    const friction = 0.3;
    
    // Calculate relative velocity
    const relativeVelX = physics.velocity.x - (otherPhysics ? otherPhysics.velocity.x : 0);
    const relativeVelY = physics.velocity.y - (otherPhysics ? otherPhysics.velocity.y : 0);
    
    // Calculate velocity in collision normal direction
    const velAlongNormal = relativeVelX * normal.x + relativeVelY * normal.y;
    
    // Don't resolve if velocities are separating
    if (velAlongNormal > 0) return;
    
    // Calculate impulse scalar
    const impulseScalar = -(1 + restitution) * velAlongNormal;
    const impulse = {
      x: impulseScalar * normal.x,
      y: impulseScalar * normal.y
    };
    
    // Apply impulse
    physics.velocity.x += impulse.x;
    physics.velocity.y += impulse.y;
    
    // Apply friction
    const tangent = {
      x: relativeVelX - velAlongNormal * normal.x,
      y: relativeVelY - velAlongNormal * normal.y
    };
    
    const tangentLength = Math.sqrt(tangent.x * tangent.x + tangent.y * tangent.y);
    if (tangentLength > 0) {
      tangent.x /= tangentLength;
      tangent.y /= tangentLength;
      
      const frictionImpulse = Math.abs(impulseScalar) * friction;
      physics.velocity.x -= tangent.x * frictionImpulse;
      physics.velocity.y -= tangent.y * frictionImpulse;
    }
  }

  updateCollisionTracking() {
    // Update collision tracking for enter/exit events
    // This would be used for more advanced collision state management
  }

  // Layer management
  addCollisionLayer(name, id) {
    this.collisionLayers.set(name, id);
    this.collisionMatrix.set(id, new Set());
  }

  setLayerCollision(layerA, layerB, canCollide) {
    const idA = this.collisionLayers.get(layerA);
    const idB = this.collisionLayers.get(layerB);
    
    if (idA !== undefined && idB !== undefined) {
      if (canCollide) {
        this.collisionMatrix.get(idA).add(idB);
        this.collisionMatrix.get(idB).add(idA);
      } else {
        this.collisionMatrix.get(idA).delete(idB);
        this.collisionMatrix.get(idB).delete(idA);
      }
    }
  }

  canLayersCollide(layerA, layerB) {
    const idA = this.collisionLayers.get(layerA) || 0;
    const idB = this.collisionLayers.get(layerB) || 0;
    
    return this.collisionMatrix.get(idA)?.has(idB) || false;
  }

  // Debug methods
  enableDebugMode(enabled = true) {
    this.debugMode = enabled;
  }

  renderDebug(ctx) {
    if (!this.debugMode) return;
    
    ctx.save();
    
    // Render collision bounds
    const colliders = this.getCollisionEntities();
    colliders.forEach(entity => {
      const transform = entity.transform;
      const collider = this.engine.entityManager.getComponent(entity.id, 'collider');
      const bounds = this.getCollisionBounds(transform, collider);
      
      ctx.strokeStyle = collider.isTrigger ? '#00ff00' : '#ff0000';
      ctx.lineWidth = 2;
      
      if (collider.shape === 'circle') {
        const radius = Math.min(bounds.width, bounds.height) / 2;
        ctx.beginPath();
        ctx.arc(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
      }
    });
    
    // Render collision points and normals
    this.debugCollisions.forEach(collision => {
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(collision.point.x, collision.point.y, 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw normal
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(collision.point.x, collision.point.y);
      ctx.lineTo(
        collision.point.x + collision.normal.x * 20,
        collision.point.y + collision.normal.y * 20
      );
      ctx.stroke();
    });
    
    ctx.restore();
  }

  // Utility methods
  clearCollisions() {
    this.activeCollisions.clear();
    this.collisionPairs.clear();
    this.spatialGrid.clear();
  }

  getStats() {
    return { ...this.stats };
  }

  destroy() {
    this.clearCollisions();
    this.collisionLayers.clear();
    this.collisionMatrix.clear();
  }
}

// Spatial Hash Grid for efficient broad-phase collision detection
class SpatialHashGrid {
  constructor(cellSize) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  clear() {
    this.grid.clear();
  }

  insert(id, x, y, width, height) {
    const startX = Math.floor(x / this.cellSize);
    const startY = Math.floor(y / this.cellSize);
    const endX = Math.floor((x + width) / this.cellSize);
    const endY = Math.floor((y + height) / this.cellSize);

    for (let gx = startX; gx <= endX; gx++) {
      for (let gy = startY; gy <= endY; gy++) {
        const key = `${gx},${gy}`;
        if (!this.grid.has(key)) {
          this.grid.set(key, new Set());
        }
        this.grid.get(key).add(id);
      }
    }
  }

  query(x, y, width, height) {
    const results = new Set();
    const startX = Math.floor(x / this.cellSize);
    const startY = Math.floor(y / this.cellSize);
    const endX = Math.floor((x + width) / this.cellSize);
    const endY = Math.floor((y + height) / this.cellSize);

    for (let gx = startX; gx <= endX; gx++) {
      for (let gy = startY; gy <= endY; gy++) {
        const key = `${gx},${gy}`;
        const cell = this.grid.get(key);
        if (cell) {
          cell.forEach(id => results.add(id));
        }
      }
    }

    return Array.from(results);
  }
}

export default CollisionSystem;