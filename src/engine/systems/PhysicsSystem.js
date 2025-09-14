/**
 * Physics System - Advanced 2D Physics Engine
 * 
 * Handles all physics calculations including movement, collision response,
 * forces, and environmental effects like gravity and friction.
 */

export class PhysicsSystem {
  constructor(engine) {
    this.engine = engine;
    this.gravity = { x: 0, y: 980 }; // pixels/second²
    this.worldBounds = { x: 0, y: 0, width: 1200, height: 500 };
    this.spatialGrid = new SpatialGrid(64); // 64px grid cells for optimization
    
    // Physics constants
    this.constants = {
      maxVelocity: 1000,
      minVelocity: 0.1,
      airResistance: 0.99,
      bounceThreshold: 0.1,
      collisionPadding: 1
    };

    console.log('⚡ Physics System initialized');
  }

  initialize() {
    // Setup physics world
    this.updateWorldBounds();
  }

  start() {
    // Physics system is always active
  }

  stop() {
    // Cleanup if needed
  }

  update(deltaTime) {
    const entityManager = this.engine.entityManager;
    
    // Get all entities with physics components
    const physicsEntities = entityManager.getEntitiesWithComponents('physics', 'transform');
    
    // Clear spatial grid
    this.spatialGrid.clear();
    
    // Update physics for each entity
    physicsEntities.forEach(entity => {
      this.updateEntityPhysics(entity, deltaTime);
      
      // Add to spatial grid for collision detection
      const transform = entity.transform;
      this.spatialGrid.insert(entity.id, transform.x, transform.y, transform.width, transform.height);
    });

    // Handle collision detection and response
    this.handleCollisions(physicsEntities);
  }

  updateEntityPhysics(entity, deltaTime) {
    const physics = this.engine.entityManager.getComponent(entity.id, 'physics');
    const transform = entity.transform;

    if (!physics || !transform) return;

    // Apply gravity
    if (physics.gravity) {
      physics.acceleration.x += this.gravity.x;
      physics.acceleration.y += this.gravity.y;
    }

    // Apply acceleration to velocity
    physics.velocity.x += physics.acceleration.x * deltaTime;
    physics.velocity.y += physics.acceleration.y * deltaTime;

    // Apply friction/air resistance
    physics.velocity.x *= Math.pow(physics.friction, deltaTime);
    physics.velocity.y *= Math.pow(this.constants.airResistance, deltaTime);

    // Clamp velocity
    physics.velocity.x = this.clampVelocity(physics.velocity.x);
    physics.velocity.y = this.clampVelocity(physics.velocity.y);

    // Apply velocity to position
    const newX = transform.x + physics.velocity.x * deltaTime;
    const newY = transform.y + physics.velocity.y * deltaTime;

    // World bounds collision
    this.handleWorldBounds(entity, newX, newY, physics, transform);

    // Reset acceleration for next frame
    physics.acceleration.x = 0;
    physics.acceleration.y = 0;

    // Update grounded state
    this.updateGroundedState(entity, physics, transform);
  }

  clampVelocity(velocity) {
    const abs = Math.abs(velocity);
    if (abs > this.constants.maxVelocity) {
      return Math.sign(velocity) * this.constants.maxVelocity;
    }
    if (abs < this.constants.minVelocity) {
      return 0;
    }
    return velocity;
  }

  handleWorldBounds(entity, newX, newY, physics, transform) {
    const bounds = this.worldBounds;
    let constrainedX = newX;
    let constrainedY = newY;

    // Left/Right bounds
    if (newX < bounds.x) {
      constrainedX = bounds.x;
      physics.velocity.x = Math.abs(physics.velocity.x) * 0.5; // Bounce
    } else if (newX + transform.width > bounds.x + bounds.width) {
      constrainedX = bounds.x + bounds.width - transform.width;
      physics.velocity.x = -Math.abs(physics.velocity.x) * 0.5; // Bounce
    }

    // Top/Bottom bounds
    if (newY < bounds.y) {
      constrainedY = bounds.y;
      physics.velocity.y = Math.abs(physics.velocity.y) * 0.5; // Bounce
    } else if (newY + transform.height > bounds.y + bounds.height) {
      constrainedY = bounds.y + bounds.height - transform.height;
      physics.velocity.y = 0;
      physics.grounded = true;
    }

    transform.x = constrainedX;
    transform.y = constrainedY;
  }

  updateGroundedState(entity, physics, transform) {
    const groundY = this.worldBounds.y + this.worldBounds.height - transform.height;
    physics.grounded = Math.abs(transform.y - groundY) < 2 && Math.abs(physics.velocity.y) < 10;
  }

  handleCollisions(entities) {
    const entityManager = this.engine.entityManager;
    
    // Get entities with colliders
    const colliderEntities = entities.filter(entity => 
      entityManager.hasComponent(entity.id, 'collider')
    );

    // Check collisions using spatial grid
    colliderEntities.forEach(entityA => {
      const transformA = entityA.transform;
      const colliderA = entityManager.getComponent(entityA.id, 'collider');
      
      // Get nearby entities from spatial grid
      const nearby = this.spatialGrid.getNearby(
        transformA.x, transformA.y, 
        transformA.width, transformA.height
      );

      nearby.forEach(entityBId => {
        if (entityBId === entityA.id) return;
        
        const entityB = entityManager.getEntity(entityBId);
        if (!entityB || !entityManager.hasComponent(entityBId, 'collider')) return;

        const transformB = entityB.transform;
        const colliderB = entityManager.getComponent(entityBId, 'collider');

        // Check collision
        if (this.checkCollision(transformA, transformB)) {
          this.handleCollisionResponse(entityA, entityB, colliderA, colliderB);
        }
      });
    });
  }

  checkCollision(transformA, transformB) {
    return (
      transformA.x < transformB.x + transformB.width &&
      transformA.x + transformA.width > transformB.x &&
      transformA.y < transformB.y + transformB.height &&
      transformA.y + transformA.height > transformB.y
    );
  }

  handleCollisionResponse(entityA, entityB, colliderA, colliderB) {
    const entityManager = this.engine.entityManager;
    
    // Emit collision events
    this.engine.emit('collision', {
      entityA: entityA.id,
      entityB: entityB.id,
      colliderA,
      colliderB
    });

    // Handle trigger collisions
    if (colliderA.isTrigger || colliderB.isTrigger) {
      this.handleTriggerCollision(entityA, entityB);
      return;
    }

    // Physical collision response
    this.resolvePhysicalCollision(entityA, entityB);
  }

  handleTriggerCollision(entityA, entityB) {
    // Trigger collisions don't affect physics but can trigger events
    this.engine.emit('trigger', {
      trigger: entityA.id,
      other: entityB.id
    });
  }

  resolvePhysicalCollision(entityA, entityB) {
    const physicsA = this.engine.entityManager.getComponent(entityA.id, 'physics');
    const physicsB = this.engine.entityManager.getComponent(entityB.id, 'physics');
    
    if (!physicsA && !physicsB) return;

    const transformA = entityA.transform;
    const transformB = entityB.transform;

    // Calculate collision normal and overlap
    const overlap = this.calculateOverlap(transformA, transformB);
    
    if (overlap.x !== 0 || overlap.y !== 0) {
      // Separate entities
      if (physicsA) {
        transformA.x -= overlap.x * 0.5;
        transformA.y -= overlap.y * 0.5;
      }
      if (physicsB) {
        transformB.x += overlap.x * 0.5;
        transformB.y += overlap.y * 0.5;
      }

      // Apply collision response
      this.applyCollisionResponse(physicsA, physicsB, overlap);
    }
  }

  calculateOverlap(transformA, transformB) {
    const overlapX = Math.min(
      transformA.x + transformA.width - transformB.x,
      transformB.x + transformB.width - transformA.x
    );
    
    const overlapY = Math.min(
      transformA.y + transformA.height - transformB.y,
      transformB.y + transformB.height - transformA.y
    );

    // Determine collision direction
    if (overlapX < overlapY) {
      const direction = transformA.x < transformB.x ? -1 : 1;
      return { x: overlapX * direction, y: 0 };
    } else {
      const direction = transformA.y < transformB.y ? -1 : 1;
      return { x: 0, y: overlapY * direction };
    }
  }

  applyCollisionResponse(physicsA, physicsB, overlap) {
    if (!physicsA && !physicsB) return;

    const restitution = 0.5; // Bounciness

    if (overlap.x !== 0) {
      // Horizontal collision
      if (physicsA) physicsA.velocity.x *= -restitution;
      if (physicsB) physicsB.velocity.x *= -restitution;
    }

    if (overlap.y !== 0) {
      // Vertical collision
      if (physicsA) {
        physicsA.velocity.y *= -restitution;
        if (overlap.y < 0) physicsA.grounded = true;
      }
      if (physicsB) {
        physicsB.velocity.y *= -restitution;
        if (overlap.y > 0) physicsB.grounded = true;
      }
    }
  }

  // Force application methods
  applyForce(entityId, forceX, forceY) {
    const physics = this.engine.entityManager.getComponent(entityId, 'physics');
    if (!physics) return;

    physics.acceleration.x += forceX / physics.mass;
    physics.acceleration.y += forceY / physics.mass;
  }

  applyImpulse(entityId, impulseX, impulseY) {
    const physics = this.engine.entityManager.getComponent(entityId, 'physics');
    if (!physics) return;

    physics.velocity.x += impulseX / physics.mass;
    physics.velocity.y += impulseY / physics.mass;
  }

  applyKnockback(entityId, knockbackForce, direction) {
    const physics = this.engine.entityManager.getComponent(entityId, 'physics');
    if (!physics) return;

    const forceX = Math.cos(direction) * knockbackForce;
    const forceY = Math.sin(direction) * knockbackForce;
    
    this.applyImpulse(entityId, forceX, forceY);
  }

  // Utility methods
  updateWorldBounds() {
    if (this.engine.canvas) {
      this.worldBounds = {
        x: 0,
        y: 0,
        width: this.engine.canvas.width / this.engine.options.pixelRatio,
        height: this.engine.canvas.height / this.engine.options.pixelRatio
      };
    }
  }

  setGravity(x, y) {
    this.gravity.x = x;
    this.gravity.y = y;
  }

  getGravity() {
    return { ...this.gravity };
  }

  destroy() {
    this.spatialGrid.clear();
  }
}

// Spatial Grid for efficient collision detection
class SpatialGrid {
  constructor(cellSize) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  clear() {
    this.grid.clear();
  }

  insert(entityId, x, y, width, height) {
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
        this.grid.get(key).add(entityId);
      }
    }
  }

  getNearby(x, y, width, height) {
    const nearby = new Set();
    const startX = Math.floor(x / this.cellSize);
    const startY = Math.floor(y / this.cellSize);
    const endX = Math.floor((x + width) / this.cellSize);
    const endY = Math.floor((y + height) / this.cellSize);

    for (let gx = startX; gx <= endX; gx++) {
      for (let gy = startY; gy <= endY; gy++) {
        const key = `${gx},${gy}`;
        const cell = this.grid.get(key);
        if (cell) {
          cell.forEach(entityId => nearby.add(entityId));
        }
      }
    }

    return Array.from(nearby);
  }
}

export default PhysicsSystem;