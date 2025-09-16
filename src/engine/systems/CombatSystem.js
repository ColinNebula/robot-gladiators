/**
 * Advanced Combat System
 * 
 * Handles complex combat mechanics including combos, special abilities,
 * damage calculation, status effects, and combat state management.
 */

export class CombatSystem {
  constructor(engine) {
    this.engine = engine;
    this.eventBus = engine.eventBus;
    this.entityManager = engine.entityManager;
    
    // Combat configuration
    this.config = {
      comboWindow: 800, // ms to continue combo
      perfectTimingWindow: 150, // ms for perfect timing bonuses
      blockWindow: 300, // ms block window after input
      counterWindow: 200, // ms counter-attack window
      stunDuration: 1000, // ms stun duration
      invulnerabilityFrames: 500, // ms of invulnerability after hit
      
      // Damage multipliers
      comboMultiplier: 1.2,
      perfectTimingMultiplier: 1.5,
      counterMultiplier: 2.0,
      criticalMultiplier: 1.8,
      
      // Status effect durations
      statusEffectDurations: {
        burning: 3000,
        frozen: 2000,
        poisoned: 5000,
        stunned: 1000,
        empowered: 4000,
        shielded: 3000
      }
    };
    
    // Active combat states
    this.combatStates = new Map();
    this.activeEffects = new Map();
    this.combos = new Map();
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.eventBus.on('combat:attack', this.handleAttack.bind(this));
    this.eventBus.on('combat:block', this.handleBlock.bind(this));
    this.eventBus.on('combat:dodge', this.handleDodge.bind(this));
    this.eventBus.on('combat:special', this.handleSpecialAbility.bind(this));
  }

  // Initialize combat component for entity
  initializeCombat(entityId, combatData = {}) {
    const combat = {
      health: combatData.maxHealth || 100,
      maxHealth: combatData.maxHealth || 100,
      mana: combatData.maxMana || 50,
      maxMana: combatData.maxMana || 50,
      
      // Combat stats
      attack: combatData.attack || 10,
      defense: combatData.defense || 5,
      speed: combatData.speed || 1,
      criticalChance: combatData.criticalChance || 0.1,
      
      // Combat state
      isBlocking: false,
      isDodging: false,
      isStunned: false,
      isInvulnerable: false,
      
      // Combo system
      comboCount: 0,
      comboTimer: 0,
      lastAttackTime: 0,
      
      // Status effects
      statusEffects: new Map(),
      
      // Special abilities
      abilities: combatData.abilities || [],
      abilityCooldowns: new Map()
    };
    
    this.entityManager.addComponent(entityId, 'combat', combat);
    this.combatStates.set(entityId, combat);
    
    return combat;
  }

  update(deltaTime) {
    for (const [entityId, combat] of this.combatStates) {
      this.updateCombatState(entityId, combat, deltaTime);
      this.updateStatusEffects(entityId, combat, deltaTime);
      this.updateCooldowns(entityId, combat, deltaTime);
      this.updateCombo(entityId, combat, deltaTime);
    }
  }

  updateCombatState(entityId, combat, deltaTime) {
    // Update invulnerability frames
    if (combat.isInvulnerable) {
      combat.invulnerabilityTimer = (combat.invulnerabilityTimer || 0) - deltaTime;
      if (combat.invulnerabilityTimer <= 0) {
        combat.isInvulnerable = false;
        this.eventBus.emit('combat:invulnerabilityEnd', { entityId });
      }
    }
    
    // Update block state
    if (combat.isBlocking) {
      combat.blockTimer = (combat.blockTimer || 0) - deltaTime;
      if (combat.blockTimer <= 0) {
        combat.isBlocking = false;
        this.eventBus.emit('combat:blockEnd', { entityId });
      }
    }
    
    // Update dodge state
    if (combat.isDodging) {
      combat.dodgeTimer = (combat.dodgeTimer || 0) - deltaTime;
      if (combat.dodgeTimer <= 0) {
        combat.isDodging = false;
        this.eventBus.emit('combat:dodgeEnd', { entityId });
      }
    }
    
    // Regenerate mana
    if (combat.mana < combat.maxMana) {
      combat.mana = Math.min(combat.maxMana, combat.mana + (deltaTime * 0.01));
    }
  }

  updateStatusEffects(entityId, combat, deltaTime) {
    const toRemove = [];
    
    for (const [effect, data] of combat.statusEffects) {
      data.duration -= deltaTime;
      
      // Apply continuous effects
      switch (effect) {
        case 'burning':
          this.applyDamage(entityId, 2 * (deltaTime / 1000), { type: 'fire', overTime: true });
          break;
        case 'poisoned':
          this.applyDamage(entityId, 1 * (deltaTime / 1000), { type: 'poison', overTime: true });
          break;
        case 'frozen':
          // Reduce movement speed (handled by movement system)
          break;
      }
      
      if (data.duration <= 0) {
        toRemove.push(effect);
      }
    }
    
    // Remove expired effects
    toRemove.forEach(effect => {
      combat.statusEffects.delete(effect);
      this.eventBus.emit('combat:statusEffectRemoved', { entityId, effect });
    });
  }

  updateCooldowns(entityId, combat, deltaTime) {
    for (const [ability, cooldown] of combat.abilityCooldowns) {
      combat.abilityCooldowns.set(ability, Math.max(0, cooldown - deltaTime));
    }
  }

  updateCombo(entityId, combat, deltaTime) {
    if (combat.comboTimer > 0) {
      combat.comboTimer -= deltaTime;
      if (combat.comboTimer <= 0) {
        this.resetCombo(entityId, combat);
      }
    }
  }

  handleAttack(data) {
    const { attackerId, targetId, attackType, damage, timing } = data;
    const attackerCombat = this.combatStates.get(attackerId);
    const targetCombat = this.combatStates.get(targetId);
    
    if (!attackerCombat || !targetCombat) return;
    
    // Check if target is invulnerable
    if (targetCombat.isInvulnerable) {
      this.eventBus.emit('combat:attackMissed', { attackerId, targetId, reason: 'invulnerable' });
      return;
    }
    
    // Check if target is blocking
    if (targetCombat.isBlocking) {
      const blockSuccess = this.calculateBlockSuccess(attackerCombat, targetCombat, attackType);
      if (blockSuccess) {
        this.eventBus.emit('combat:attackBlocked', { attackerId, targetId, damage: damage * 0.2 });
        this.applyDamage(targetId, damage * 0.2); // Chip damage
        return;
      }
    }
    
    // Check if target is dodging
    if (targetCombat.isDodging) {
      this.eventBus.emit('combat:attackDodged', { attackerId, targetId });
      return;
    }
    
    // Calculate final damage
    let finalDamage = this.calculateDamage(attackerCombat, targetCombat, damage, attackType);
    
    // Apply combo multiplier
    if (attackerCombat.comboCount > 0) {
      finalDamage *= Math.pow(this.config.comboMultiplier, attackerCombat.comboCount);
    }
    
    // Check for perfect timing
    if (timing && timing < this.config.perfectTimingWindow) {
      finalDamage *= this.config.perfectTimingMultiplier;
      this.eventBus.emit('combat:perfectTiming', { attackerId, bonus: this.config.perfectTimingMultiplier });
    }
    
    // Check for critical hit
    if (Math.random() < attackerCombat.criticalChance) {
      finalDamage *= this.config.criticalMultiplier;
      this.eventBus.emit('combat:criticalHit', { attackerId, targetId, damage: finalDamage });
    }
    
    // Apply damage
    this.applyDamage(targetId, finalDamage, { attackerId, type: attackType });
    
    // Update combo
    this.updateCombo(attackerId, attackerCombat, attackType);
    
    // Apply status effects
    this.applyAttackEffects(attackerId, targetId, attackType);
  }

  calculateDamage(attackerCombat, targetCombat, baseDamage, attackType) {
    let damage = baseDamage + (attackerCombat.attack * 0.5);
    damage = Math.max(1, damage - (targetCombat.defense * 0.3));
    
    // Type-specific calculations
    switch (attackType) {
      case 'heavy':
        damage *= 1.5;
        break;
      case 'quick':
        damage *= 0.8;
        break;
      case 'special':
        damage *= 2.0;
        break;
    }
    
    return Math.round(damage);
  }

  calculateBlockSuccess(attackerCombat, targetCombat, attackType) {
    let blockChance = 0.7; // Base block chance
    
    // Adjust based on relative stats
    const statDifference = (targetCombat.defense - attackerCombat.attack) * 0.05;
    blockChance += statDifference;
    
    // Heavy attacks are harder to block
    if (attackType === 'heavy') {
      blockChance *= 0.6;
    }
    
    return Math.random() < blockChance;
  }

  applyDamage(entityId, damage, options = {}) {
    const combat = this.combatStates.get(entityId);
    if (!combat) return;
    
    // Apply damage reduction from status effects
    if (combat.statusEffects.has('shielded')) {
      damage *= 0.5;
    }
    
    combat.health = Math.max(0, combat.health - damage);
    
    // Set invulnerability frames if not damage over time
    if (!options.overTime) {
      combat.isInvulnerable = true;
      combat.invulnerabilityTimer = this.config.invulnerabilityFrames;
    }
    
    this.eventBus.emit('combat:damaged', { 
      entityId, 
      damage, 
      health: combat.health, 
      maxHealth: combat.maxHealth,
      ...options 
    });
    
    // Check for death
    if (combat.health <= 0) {
      this.handleDeath(entityId);
    }
  }

  handleBlock(data) {
    const { entityId, duration } = data;
    const combat = this.combatStates.get(entityId);
    
    if (!combat || combat.isStunned) return;
    
    combat.isBlocking = true;
    combat.blockTimer = duration || this.config.blockWindow;
    
    this.eventBus.emit('combat:blockStarted', { entityId });
  }

  handleDodge(data) {
    const { entityId, duration, direction } = data;
    const combat = this.combatStates.get(entityId);
    
    if (!combat || combat.isStunned) return;
    
    combat.isDodging = true;
    combat.dodgeTimer = duration || 300; // Default dodge duration
    combat.isInvulnerable = true;
    combat.invulnerabilityTimer = duration || 300;
    
    this.eventBus.emit('combat:dodgeStarted', { entityId, direction });
  }

  handleSpecialAbility(data) {
    const { entityId, abilityName, targetId } = data;
    const combat = this.combatStates.get(entityId);
    
    if (!combat) return;
    
    const ability = this.getAbility(abilityName);
    if (!ability) return;
    
    // Check cooldown
    const cooldown = combat.abilityCooldowns.get(abilityName) || 0;
    if (cooldown > 0) {
      this.eventBus.emit('combat:abilityCooldown', { entityId, abilityName, remainingTime: cooldown });
      return;
    }
    
    // Check mana cost
    if (combat.mana < ability.manaCost) {
      this.eventBus.emit('combat:insufficientMana', { entityId, required: ability.manaCost, current: combat.mana });
      return;
    }
    
    // Use ability
    combat.mana -= ability.manaCost;
    combat.abilityCooldowns.set(abilityName, ability.cooldown);
    
    this.executeAbility(entityId, ability, targetId);
  }

  executeAbility(entityId, ability, targetId) {
    switch (ability.type) {
      case 'damage':
        if (targetId) {
          this.applyDamage(targetId, ability.damage, { 
            attackerId: entityId, 
            type: 'special',
            abilityName: ability.name 
          });
        }
        break;
        
      case 'heal':
        this.heal(entityId, ability.healAmount);
        break;
        
      case 'buff':
        this.applyStatusEffect(entityId, ability.effectType, ability.duration, ability.effectData);
        break;
        
      case 'debuff':
        if (targetId) {
          this.applyStatusEffect(targetId, ability.effectType, ability.duration, ability.effectData);
        }
        break;
        
      case 'area':
        this.executeAreaAbility(entityId, ability);
        break;
    }
    
    this.eventBus.emit('combat:abilityUsed', { entityId, ability, targetId });
  }

  applyStatusEffect(entityId, effectType, duration, effectData = {}) {
    const combat = this.combatStates.get(entityId);
    if (!combat) return;
    
    combat.statusEffects.set(effectType, {
      duration: duration,
      data: effectData,
      startTime: Date.now()
    });
    
    this.eventBus.emit('combat:statusEffectApplied', { entityId, effectType, duration, effectData });
  }

  heal(entityId, amount) {
    const combat = this.combatStates.get(entityId);
    if (!combat) return;
    
    const oldHealth = combat.health;
    combat.health = Math.min(combat.maxHealth, combat.health + amount);
    const actualHealing = combat.health - oldHealth;
    
    this.eventBus.emit('combat:healed', { entityId, amount: actualHealing, health: combat.health });
  }

  updateCombo(entityId, combat, attackType) {
    const now = Date.now();
    const timeSinceLastAttack = now - combat.lastAttackTime;
    
    if (timeSinceLastAttack <= this.config.comboWindow) {
      combat.comboCount++;
      combat.comboTimer = this.config.comboWindow;
    } else {
      combat.comboCount = 1;
    }
    
    combat.lastAttackTime = now;
    
    this.eventBus.emit('combat:comboUpdated', { 
      entityId, 
      comboCount: combat.comboCount,
      multiplier: Math.pow(this.config.comboMultiplier, combat.comboCount)
    });
  }

  resetCombo(entityId, combat) {
    const oldCombo = combat.comboCount;
    combat.comboCount = 0;
    combat.comboTimer = 0;
    
    if (oldCombo > 0) {
      this.eventBus.emit('combat:comboEnded', { entityId, finalCombo: oldCombo });
    }
  }

  handleDeath(entityId) {
    const combat = this.combatStates.get(entityId);
    if (!combat) return;
    
    this.eventBus.emit('combat:death', { entityId });
    this.combatStates.delete(entityId);
  }

  // Predefined abilities
  getAbility(name) {
    const abilities = {
      fireball: {
        name: 'Fireball',
        type: 'damage',
        damage: 25,
        manaCost: 15,
        cooldown: 2000,
        effects: ['burning']
      },
      heal: {
        name: 'Heal',
        type: 'heal',
        healAmount: 30,
        manaCost: 20,
        cooldown: 3000
      },
      shield: {
        name: 'Shield',
        type: 'buff',
        effectType: 'shielded',
        duration: 3000,
        manaCost: 10,
        cooldown: 5000
      },
      stun: {
        name: 'Stun',
        type: 'debuff',
        effectType: 'stunned',
        duration: 1000,
        manaCost: 12,
        cooldown: 4000
      }
    };
    
    return abilities[name];
  }

  // Utility methods
  getCombatData(entityId) {
    return this.combatStates.get(entityId);
  }

  isAlive(entityId) {
    const combat = this.combatStates.get(entityId);
    return combat && combat.health > 0;
  }

  getHealthPercentage(entityId) {
    const combat = this.combatStates.get(entityId);
    return combat ? (combat.health / combat.maxHealth) : 0;
  }

  getManaPercentage(entityId) {
    const combat = this.combatStates.get(entityId);
    return combat ? (combat.mana / combat.maxMana) : 0;
  }
}

export default CombatSystem;