/**
 * AI System - Advanced Artificial Intelligence Engine
 * 
 * Provides behavioral AI, state machines, pathfinding, decision trees,
 * and advanced NPC behaviors for intelligent game entities.
 */

export class AISystem {
  constructor(engine) {
    this.engine = engine;
    
    // AI Components
    this.behaviors = new Map(); // Entity ID -> Behavior Tree
    this.stateMachines = new Map(); // Entity ID -> State Machine
    this.pathfinding = new PathfindingManager();
    this.decisionTrees = new Map(); // Entity ID -> Decision Tree
    
    // AI Performance
    this.aiUpdateRate = 60; // AI updates per second
    this.aiTimer = 0;
    this.maxAIUpdatesPerFrame = 10;
    
    // Prebuilt behaviors
    this.behaviorTemplates = new Map();
    this.registerDefaultBehaviors();
    
    console.log('🧠 AI System initialized');
  }

  initialize() {
    this.setupDefaultAIComponents();
  }

  start() {
    this.aiTimer = 0;
  }

  stop() {
    // Cleanup AI processes
  }

  update(deltaTime) {
    this.aiTimer += deltaTime;
    
    // Update AI at controlled rate for performance
    if (this.aiTimer >= 1 / this.aiUpdateRate) {
      this.updateAI(this.aiTimer);
      this.aiTimer = 0;
    }
  }

  updateAI(deltaTime) {
    const entityManager = this.engine.entityManager;
    let updatesThisFrame = 0;

    // Update behavior trees
    for (const [entityId, behavior] of this.behaviors) {
      if (updatesThisFrame >= this.maxAIUpdatesPerFrame) break;
      
      const entity = entityManager.getEntity(entityId);
      if (!entity || !entity.active) continue;

      this.updateBehaviorTree(entity, behavior, deltaTime);
      updatesThisFrame++;
    }

    // Update state machines
    for (const [entityId, stateMachine] of this.stateMachines) {
      if (updatesThisFrame >= this.maxAIUpdatesPerFrame) break;
      
      const entity = entityManager.getEntity(entityId);
      if (!entity || !entity.active) continue;

      this.updateStateMachine(entity, stateMachine, deltaTime);
      updatesThisFrame++;
    }

    // Update pathfinding
    this.pathfinding.update(deltaTime);
  }

  // Behavior Tree System
  createBehaviorTree(entityId, behaviorConfig) {
    const behavior = new BehaviorTree(behaviorConfig);
    this.behaviors.set(entityId, behavior);
    return behavior;
  }

  updateBehaviorTree(entity, behavior, deltaTime) {
    const context = this.createAIContext(entity);
    behavior.tick(context, deltaTime);
  }

  // State Machine System
  createStateMachine(entityId, states, initialState) {
    const stateMachine = new StateMachine(states, initialState);
    this.stateMachines.set(entityId, stateMachine);
    return stateMachine;
  }

  updateStateMachine(entity, stateMachine, deltaTime) {
    const context = this.createAIContext(entity);
    stateMachine.update(context, deltaTime);
  }

  // Pathfinding System
  requestPath(entityId, startPos, endPos, options = {}) {
    return this.pathfinding.requestPath(entityId, startPos, endPos, options);
  }

  // Decision Tree System
  createDecisionTree(entityId, treeConfig) {
    const tree = new DecisionTree(treeConfig);
    this.decisionTrees.set(entityId, tree);
    return tree;
  }

  // AI Context Creation
  createAIContext(entity) {
    const entityManager = this.engine.entityManager;
    
    return {
      entity,
      transform: entity.transform,
      physics: entityManager.getComponent(entity.id, 'physics'),
      health: entityManager.getComponent(entity.id, 'health'),
      ai: entityManager.getComponent(entity.id, 'ai'),
      
      // Utility functions
      getNearbyEntities: (radius, filter) => this.getNearbyEntities(entity, radius, filter),
      getClosestEntity: (filter) => this.getClosestEntity(entity, filter),
      canSeeEntity: (target) => this.hasLineOfSight(entity, target),
      getPathTo: (target) => this.requestPath(entity.id, entity.transform, target.transform),
      
      // Engine access
      engine: this.engine,
      deltaTime: this.engine.deltaTime
    };
  }

  // Utility Functions
  getNearbyEntities(entity, radius, filter = null) {
    const entityManager = this.engine.entityManager;
    const nearby = [];
    
    for (const other of entityManager.getAllEntities()) {
      if (other.id === entity.id || !other.active) continue;
      if (filter && !filter(other)) continue;
      
      const distance = this.getDistance(entity.transform, other.transform);
      if (distance <= radius) {
        nearby.push({ entity: other, distance });
      }
    }
    
    return nearby.sort((a, b) => a.distance - b.distance);
  }

  getClosestEntity(entity, filter = null) {
    const nearby = this.getNearbyEntities(entity, Infinity, filter);
    return nearby.length > 0 ? nearby[0].entity : null;
  }

  hasLineOfSight(entity, target) {
    // Simplified line of sight check
    // In a real implementation, this would check for obstacles
    const distance = this.getDistance(entity.transform, target.transform);
    return distance <= 300; // Arbitrary sight range
  }

  getDistance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Prebuilt Behaviors
  registerDefaultBehaviors() {
    // Aggressive Fighter AI
    this.behaviorTemplates.set('aggressiveFighter', {
      type: 'selector',
      children: [
        {
          type: 'sequence',
          children: [
            { type: 'condition', check: 'enemyInRange' },
            { type: 'action', name: 'attack' }
          ]
        },
        {
          type: 'sequence',
          children: [
            { type: 'condition', check: 'enemyVisible' },
            { type: 'action', name: 'moveToEnemy' }
          ]
        },
        { type: 'action', name: 'patrol' }
      ]
    });

    // Defensive Fighter AI
    this.behaviorTemplates.set('defensiveFighter', {
      type: 'selector',
      children: [
        {
          type: 'sequence',
          children: [
            { type: 'condition', check: 'healthLow' },
            { type: 'action', name: 'retreat' }
          ]
        },
        {
          type: 'sequence',
          children: [
            { type: 'condition', check: 'enemyInRange' },
            { type: 'action', name: 'defend' }
          ]
        },
        { type: 'action', name: 'idle' }
      ]
    });
  }

  // Quick AI Setup Functions
  makeAggressiveAI(entityId) {
    return this.createBehaviorTree(entityId, this.behaviorTemplates.get('aggressiveFighter'));
  }

  makeDefensiveAI(entityId) {
    return this.createBehaviorTree(entityId, this.behaviorTemplates.get('defensiveFighter'));
  }

  setupDefaultAIComponents() {
    // Setup default AI conditions and actions
    this.conditions = new Map([
      ['enemyInRange', (context) => {
        const enemy = this.getClosestEntity(context.entity, e => e.tag === 'player');
        return enemy && this.getDistance(context.entity.transform, enemy.transform) < 100;
      }],
      ['enemyVisible', (context) => {
        const enemy = this.getClosestEntity(context.entity, e => e.tag === 'player');
        return enemy && this.hasLineOfSight(context.entity, enemy);
      }],
      ['healthLow', (context) => {
        return context.health && context.health.currentHealth < context.health.maxHealth * 0.3;
      }]
    ]);

    this.actions = new Map([
      ['attack', (context) => this.performAttack(context)],
      ['moveToEnemy', (context) => this.moveToEnemy(context)],
      ['patrol', (context) => this.performPatrol(context)],
      ['retreat', (context) => this.performRetreat(context)],
      ['defend', (context) => this.performDefend(context)],
      ['idle', (context) => this.performIdle(context)]
    ]);
  }

  // AI Actions
  performAttack(context) {
    // Implement attack behavior
    const enemy = this.getClosestEntity(context.entity, e => e.tag === 'player');
    if (enemy) {
      // Face the enemy
      const dx = enemy.transform.x - context.entity.transform.x;
      if (context.physics) {
        context.physics.velocity.x = Math.sign(dx) * 100;
      }
      
      // Trigger attack animation/action
      this.engine.emit('ai:attack', { entity: context.entity, target: enemy });
    }
  }

  moveToEnemy(context) {
    const enemy = this.getClosestEntity(context.entity, e => e.tag === 'player');
    if (enemy && context.physics) {
      const dx = enemy.transform.x - context.entity.transform.x;
      const speed = 150;
      context.physics.velocity.x = Math.sign(dx) * speed;
    }
  }

  performPatrol(context) {
    // Simple patrol behavior
    if (context.physics) {
      if (!context.ai.patrolDirection) {
        context.ai.patrolDirection = Math.random() < 0.5 ? -1 : 1;
      }
      
      context.physics.velocity.x = context.ai.patrolDirection * 50;
      
      // Change direction occasionally
      if (Math.random() < 0.01) {
        context.ai.patrolDirection *= -1;
      }
    }
  }

  performRetreat(context) {
    const enemy = this.getClosestEntity(context.entity, e => e.tag === 'player');
    if (enemy && context.physics) {
      const dx = enemy.transform.x - context.entity.transform.x;
      const speed = 200;
      context.physics.velocity.x = -Math.sign(dx) * speed; // Move away from enemy
    }
  }

  performDefend(context) {
    // Stop moving and prepare to block
    if (context.physics) {
      context.physics.velocity.x = 0;
    }
    this.engine.emit('ai:defend', { entity: context.entity });
  }

  performIdle(context) {
    if (context.physics) {
      context.physics.velocity.x *= 0.9; // Slow down
    }
  }

  // Cleanup
  removeAI(entityId) {
    this.behaviors.delete(entityId);
    this.stateMachines.delete(entityId);
    this.decisionTrees.delete(entityId);
  }

  destroy() {
    this.behaviors.clear();
    this.stateMachines.clear();
    this.decisionTrees.clear();
    this.pathfinding.destroy();
  }
}

// Behavior Tree Implementation
class BehaviorTree {
  constructor(config) {
    this.root = this.buildNode(config);
  }

  buildNode(config) {
    switch (config.type) {
      case 'selector':
        return new SelectorNode(config.children?.map(child => this.buildNode(child)) || []);
      case 'sequence':
        return new SequenceNode(config.children?.map(child => this.buildNode(child)) || []);
      case 'condition':
        return new ConditionNode(config.check);
      case 'action':
        return new ActionNode(config.name);
      default:
        throw new Error(`Unknown behavior node type: ${config.type}`);
    }
  }

  tick(context, deltaTime) {
    return this.root.tick(context, deltaTime);
  }
}

// Behavior Tree Nodes
class BehaviorNode {
  tick(context, deltaTime) {
    throw new Error('tick method must be implemented');
  }
}

class SelectorNode extends BehaviorNode {
  constructor(children) {
    super();
    this.children = children;
  }

  tick(context, deltaTime) {
    for (const child of this.children) {
      const result = child.tick(context, deltaTime);
      if (result === 'success' || result === 'running') {
        return result;
      }
    }
    return 'failure';
  }
}

class SequenceNode extends BehaviorNode {
  constructor(children) {
    super();
    this.children = children;
  }

  tick(context, deltaTime) {
    for (const child of this.children) {
      const result = child.tick(context, deltaTime);
      if (result === 'failure' || result === 'running') {
        return result;
      }
    }
    return 'success';
  }
}

class ConditionNode extends BehaviorNode {
  constructor(conditionName) {
    super();
    this.conditionName = conditionName;
  }

  tick(context, deltaTime) {
    const aiSystem = context.engine.getSystem('ai');
    const condition = aiSystem.conditions.get(this.conditionName);
    return condition && condition(context) ? 'success' : 'failure';
  }
}

class ActionNode extends BehaviorNode {
  constructor(actionName) {
    super();
    this.actionName = actionName;
  }

  tick(context, deltaTime) {
    const aiSystem = context.engine.getSystem('ai');
    const action = aiSystem.actions.get(this.actionName);
    if (action) {
      action(context);
      return 'success';
    }
    return 'failure';
  }
}

// State Machine Implementation
class StateMachine {
  constructor(states, initialState) {
    this.states = states;
    this.currentState = initialState;
    this.stateTime = 0;
  }

  update(context, deltaTime) {
    this.stateTime += deltaTime;
    
    const state = this.states[this.currentState];
    if (state) {
      // Update current state
      if (state.update) {
        state.update(context, deltaTime, this.stateTime);
      }
      
      // Check transitions
      if (state.transitions) {
        for (const transition of state.transitions) {
          if (transition.condition(context)) {
            this.transitionTo(transition.target);
            break;
          }
        }
      }
    }
  }

  transitionTo(newState) {
    const oldState = this.states[this.currentState];
    const newStateObj = this.states[newState];
    
    if (oldState && oldState.exit) {
      oldState.exit();
    }
    
    this.currentState = newState;
    this.stateTime = 0;
    
    if (newStateObj && newStateObj.enter) {
      newStateObj.enter();
    }
  }
}

// Decision Tree Implementation
class DecisionTree {
  constructor(config) {
    this.root = config;
  }

  evaluate(context) {
    return this.evaluateNode(this.root, context);
  }

  evaluateNode(node, context) {
    if (node.type === 'condition') {
      const result = node.condition(context);
      return this.evaluateNode(result ? node.trueNode : node.falseNode, context);
    } else if (node.type === 'action') {
      return node.action;
    }
    return null;
  }
}

// Simple Pathfinding Manager
class PathfindingManager {
  constructor() {
    this.pathRequests = new Map();
    this.gridSize = 32;
  }

  requestPath(entityId, start, end, options = {}) {
    // Simplified pathfinding - in a real implementation, use A* or similar
    const path = [
      { x: start.x, y: start.y },
      { x: end.x, y: end.y }
    ];
    
    this.pathRequests.set(entityId, {
      path,
      currentIndex: 0,
      options
    });
    
    return path;
  }

  update(deltaTime) {
    // Update pathfinding for all entities
    for (const [entityId, pathData] of this.pathRequests) {
      // Clean up completed paths
      if (pathData.currentIndex >= pathData.path.length) {
        this.pathRequests.delete(entityId);
      }
    }
  }

  destroy() {
    this.pathRequests.clear();
  }
}

export default AISystem;