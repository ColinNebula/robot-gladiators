/**
 * Entity Manager - Entity Component System (ECS) Implementation
 * 
 * Manages all game entities and their components using a high-performance
 * ECS architecture for better scalability and maintainability.
 */

export class EntityManager {
  constructor() {
    this.entities = new Map();
    this.components = new Map();
    this.systems = new Map();
    this.entityIdCounter = 1;
    this.entitiesByTag = new Map();
    this.entitiesToDestroy = new Set();
    
    console.log('🎯 Entity Manager initialized');
  }

  // Entity creation and management
  createEntity(tag = null) {
    const id = this.entityIdCounter++;
    const entity = {
      id,
      tag,
      active: true,
      components: new Set(),
      transform: {
        x: 0,
        y: 0,
        width: 32,
        height: 32,
        rotation: 0,
        scaleX: 1,
        scaleY: 1
      }
    };

    this.entities.set(id, entity);

    // Add to tag index
    if (tag) {
      if (!this.entitiesByTag.has(tag)) {
        this.entitiesByTag.set(tag, new Set());
      }
      this.entitiesByTag.get(tag).add(id);
    }

    return entity;
  }

  destroyEntity(entityId) {
    this.entitiesToDestroy.add(entityId);
  }

  getEntity(entityId) {
    return this.entities.get(entityId);
  }

  getAllEntities() {
    return Array.from(this.entities.values()).filter(entity => entity.active);
  }

  getEntitiesByTag(tag) {
    const entityIds = this.entitiesByTag.get(tag);
    if (!entityIds) return [];
    
    return Array.from(entityIds)
      .map(id => this.entities.get(id))
      .filter(entity => entity && entity.active);
  }

  getEntityCount() {
    return this.entities.size;
  }

  // Component management
  addComponent(entityId, componentType, componentData = {}) {
    const entity = this.entities.get(entityId);
    if (!entity) {
      console.warn(`Entity ${entityId} not found when adding component ${componentType}`);
      return;
    }

    // Initialize component type storage
    if (!this.components.has(componentType)) {
      this.components.set(componentType, new Map());
    }

    // Store component data
    this.components.get(componentType).set(entityId, {
      ...componentData,
      entityId,
      type: componentType
    });

    // Add to entity's component list
    entity.components.add(componentType);

    return this.components.get(componentType).get(entityId);
  }

  removeComponent(entityId, componentType) {
    const entity = this.entities.get(entityId);
    if (!entity) return;

    // Remove from component storage
    if (this.components.has(componentType)) {
      this.components.get(componentType).delete(entityId);
    }

    // Remove from entity's component list
    entity.components.delete(componentType);
  }

  getComponent(entityId, componentType) {
    const componentMap = this.components.get(componentType);
    return componentMap ? componentMap.get(entityId) : null;
  }

  hasComponent(entityId, componentType) {
    const entity = this.entities.get(entityId);
    return entity ? entity.components.has(componentType) : false;
  }

  getEntitiesWithComponent(componentType) {
    const componentMap = this.components.get(componentType);
    if (!componentMap) return [];

    return Array.from(componentMap.keys())
      .map(id => this.entities.get(id))
      .filter(entity => entity && entity.active);
  }

  getEntitiesWithComponents(...componentTypes) {
    return this.getAllEntities().filter(entity =>
      componentTypes.every(type => entity.components.has(type))
    );
  }

  // Update and cleanup
  update(deltaTime) {
    // Process entity destruction
    this.entitiesToDestroy.forEach(entityId => {
      this.performEntityDestruction(entityId);
    });
    this.entitiesToDestroy.clear();
  }

  performEntityDestruction(entityId) {
    const entity = this.entities.get(entityId);
    if (!entity) return;

    // Remove from tag index
    if (entity.tag && this.entitiesByTag.has(entity.tag)) {
      this.entitiesByTag.get(entity.tag).delete(entityId);
      if (this.entitiesByTag.get(entity.tag).size === 0) {
        this.entitiesByTag.delete(entity.tag);
      }
    }

    // Remove all components
    entity.components.forEach(componentType => {
      if (this.components.has(componentType)) {
        this.components.get(componentType).delete(entityId);
      }
    });

    // Remove entity
    this.entities.delete(entityId);
  }

  // Utility methods
  query(selector) {
    const { 
      withComponents = [], 
      withoutComponents = [], 
      withTag = null,
      where = null 
    } = selector;

    let entities = this.getAllEntities();

    // Filter by tag
    if (withTag) {
      entities = this.getEntitiesByTag(withTag);
    }

    // Filter by required components
    if (withComponents.length > 0) {
      entities = entities.filter(entity =>
        withComponents.every(comp => entity.components.has(comp))
      );
    }

    // Filter by excluded components
    if (withoutComponents.length > 0) {
      entities = entities.filter(entity =>
        withoutComponents.every(comp => !entity.components.has(comp))
      );
    }

    // Apply custom filter
    if (where && typeof where === 'function') {
      entities = entities.filter(where);
    }

    return entities;
  }

  // Performance optimized queries
  queryComponents(componentType, predicate = null) {
    const componentMap = this.components.get(componentType);
    if (!componentMap) return [];

    let components = Array.from(componentMap.values());
    
    if (predicate) {
      components = components.filter(predicate);
    }

    return components;
  }

  // Bulk operations
  createEntities(count, factory) {
    const entities = [];
    for (let i = 0; i < count; i++) {
      const entity = this.createEntity();
      if (factory) {
        factory(entity, i);
      }
      entities.push(entity);
    }
    return entities;
  }

  destroyEntitiesByTag(tag) {
    const entities = this.getEntitiesByTag(tag);
    entities.forEach(entity => this.destroyEntity(entity.id));
  }

  // Debug and introspection
  getComponentTypes() {
    return Array.from(this.components.keys());
  }

  getStats() {
    const componentCounts = {};
    this.components.forEach((componentMap, type) => {
      componentCounts[type] = componentMap.size;
    });

    return {
      totalEntities: this.entities.size,
      activeEntities: this.getAllEntities().length,
      componentTypes: this.components.size,
      componentCounts,
      pendingDestruction: this.entitiesToDestroy.size
    };
  }

  // Cleanup
  clear() {
    this.entities.clear();
    this.components.clear();
    this.entitiesByTag.clear();
    this.entitiesToDestroy.clear();
    this.entityIdCounter = 1;
    
    console.log('🧹 Entity Manager cleared');
  }
}

// Common component factories for ease of use
export class ComponentFactories {
  static transform(x = 0, y = 0, width = 32, height = 32, rotation = 0) {
    return { x, y, width, height, rotation, scaleX: 1, scaleY: 1 };
  }

  static physics(vx = 0, vy = 0, mass = 1, friction = 0.95, gravity = true) {
    return { 
      velocity: { x: vx, y: vy },
      acceleration: { x: 0, y: 0 },
      mass,
      friction,
      gravity,
      grounded: false
    };
  }

  static sprite(imagePath, frameWidth, frameHeight, animations = {}) {
    return {
      imagePath,
      frameWidth,
      frameHeight,
      currentFrame: 0,
      currentAnimation: 'idle',
      animations,
      animationTime: 0,
      flipX: false,
      flipY: false
    };
  }

  static health(maxHealth = 100, currentHealth = null) {
    return {
      maxHealth,
      currentHealth: currentHealth !== null ? currentHealth : maxHealth,
      invulnerable: false,
      invulnerabilityTime: 0
    };
  }

  static projectile(damage = 10, speed = 300, lifetime = 3, piercing = false) {
    return {
      damage,
      speed,
      lifetime,
      timeAlive: 0,
      piercing,
      hit: new Set()
    };
  }

  static collider(type = 'box', isTrigger = false, layer = 'default') {
    return {
      type,
      isTrigger,
      layer,
      bounds: { x: 0, y: 0, width: 32, height: 32 },
      colliding: new Set()
    };
  }

  static input(keys = {}, gamepadIndex = -1) {
    return {
      keys,
      gamepadIndex,
      previousKeys: {},
      keyPressed: {},
      keyReleased: {}
    };
  }
}

export default EntityManager;