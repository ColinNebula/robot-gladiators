/**
 * Power-Up and Progression System
 * 
 * Manages collectible power-ups, character progression, experience points,
 * skill trees, and achievement systems.
 */

export class PowerUpSystem {
  constructor(engine) {
    this.engine = engine;
    this.eventBus = engine.eventBus;
    this.entityManager = engine.entityManager;
    
    // Power-up configuration
    this.powerUpTypes = {
      // Temporary boosts
      speed: {
        name: 'Speed Boost',
        duration: 10000,
        effect: { type: 'multiply', stat: 'speed', value: 1.5 },
        particle: 'speed',
        color: '#00ffff',
        rarity: 'common'
      },
      strength: {
        name: 'Strength Boost',
        duration: 15000,
        effect: { type: 'multiply', stat: 'attack', value: 1.8 },
        particle: 'power',
        color: '#ff4444',
        rarity: 'common'
      },
      defense: {
        name: 'Shield',
        duration: 12000,
        effect: { type: 'multiply', stat: 'defense', value: 2.0 },
        particle: 'shield',
        color: '#4444ff',
        rarity: 'common'
      },
      
      // Healing items
      healthSmall: {
        name: 'Health Potion',
        instant: true,
        effect: { type: 'heal', value: 25 },
        particle: 'heal',
        color: '#44ff44',
        rarity: 'common'
      },
      healthLarge: {
        name: 'Greater Health Potion',
        instant: true,
        effect: { type: 'heal', value: 75 },
        particle: 'heal',
        color: '#00ff88',
        rarity: 'uncommon'
      },
      manaPotion: {
        name: 'Mana Potion',
        instant: true,
        effect: { type: 'mana', value: 30 },
        particle: 'mana',
        color: '#8844ff',
        rarity: 'common'
      },
      
      // Special abilities
      invulnerability: {
        name: 'Invulnerability',
        duration: 5000,
        effect: { type: 'status', status: 'invulnerable', value: true },
        particle: 'divine',
        color: '#ffffff',
        rarity: 'rare'
      },
      doubleJump: {
        name: 'Double Jump',
        duration: 20000,
        effect: { type: 'ability', ability: 'doubleJump', value: true },
        particle: 'wind',
        color: '#88ffff',
        rarity: 'uncommon'
      },
      timeStop: {
        name: 'Time Stop',
        duration: 3000,
        effect: { type: 'global', effect: 'timeStop', value: 0.1 },
        particle: 'time',
        color: '#ff88ff',
        rarity: 'legendary'
      },
      
      // Permanent upgrades
      maxHealthUp: {
        name: 'Max Health Up',
        permanent: true,
        effect: { type: 'upgrade', stat: 'maxHealth', value: 20 },
        particle: 'upgrade',
        color: '#ffff44',
        rarity: 'rare'
      },
      criticalUp: {
        name: 'Critical Boost',
        permanent: true,
        effect: { type: 'upgrade', stat: 'criticalChance', value: 0.05 },
        particle: 'critical',
        color: '#ff8844',
        rarity: 'rare'
      }
    };
    
    // Experience and leveling
    this.experienceTable = this.generateExperienceTable();
    this.skillTrees = this.initializeSkillTrees();
    
    // Active power-ups tracking
    this.activePowerUps = new Map();
    this.playerProgress = new Map();
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.eventBus.on('powerup:collected', this.handlePowerUpCollection.bind(this));
    this.eventBus.on('experience:gained', this.handleExperienceGain.bind(this));
    this.eventBus.on('skill:unlock', this.handleSkillUnlock.bind(this));
    this.eventBus.on('achievement:unlock', this.handleAchievementUnlock.bind(this));
  }

  initializePlayerProgress(entityId) {
    const progress = {
      level: 1,
      experience: 0,
      skillPoints: 0,
      unlockedSkills: new Set(),
      achievements: new Set(),
      stats: {
        enemiesDefeated: 0,
        damageDealt: 0,
        damageTaken: 0,
        powerUpsCollected: 0,
        distanceTraveled: 0,
        timePlayed: 0,
        perfectDodges: 0,
        criticalHits: 0,
        combosPerformed: 0,
        maxCombo: 0
      },
      permanentUpgrades: {
        maxHealth: 0,
        maxMana: 0,
        attack: 0,
        defense: 0,
        speed: 0,
        criticalChance: 0,
        criticalMultiplier: 0
      }
    };
    
    this.playerProgress.set(entityId, progress);
    return progress;
  }

  spawnPowerUp(x, y, type, options = {}) {
    if (!this.powerUpTypes[type]) {
      console.warn(`Unknown power-up type: ${type}`);
      return null;
    }
    
    const powerUp = this.entityManager.createEntity('powerup');
    const config = this.powerUpTypes[type];
    
    // Set position and physics
    powerUp.transform.x = x;
    powerUp.transform.y = y;
    powerUp.transform.width = 20;
    powerUp.transform.height = 20;
    
    this.entityManager.addComponent(powerUp.id, 'physics', {
      velocity: { x: 0, y: -2 }, // Float upward slightly
      gravity: false,
      bounce: 0.3
    });
    
    // Visual components
    this.entityManager.addComponent(powerUp.id, 'visual', {
      type: 'powerup',
      color: config.color,
      rarity: config.rarity,
      glowIntensity: this.getRarityGlow(config.rarity),
      bobSpeed: 2 + Math.random() * 2,
      rotationSpeed: 1 + Math.random()
    });
    
    // Power-up data
    this.entityManager.addComponent(powerUp.id, 'powerup', {
      type: type,
      config: config,
      spawnTime: Date.now(),
      lifetime: options.lifetime || 30000, // 30 seconds default
      collected: false
    });
    
    // Collision detection
    this.entityManager.addComponent(powerUp.id, 'collision', {
      type: 'powerup',
      radius: 15,
      callback: (entityId) => this.handleCollision(powerUp.id, entityId)
    });
    
    // Particle effects
    if (config.particle) {
      this.spawnPowerUpParticles(x, y, config);
    }
    
    return powerUp;
  }

  handleCollision(powerUpId, collectorId) {
    const powerUpComponent = this.entityManager.getComponent(powerUpId, 'powerup');
    if (!powerUpComponent || powerUpComponent.collected) return;
    
    powerUpComponent.collected = true;
    
    this.eventBus.emit('powerup:collected', {
      powerUpId,
      collectorId,
      type: powerUpComponent.type,
      config: powerUpComponent.config
    });
    
    // Remove the power-up entity
    this.entityManager.removeEntity(powerUpId);
  }

  handlePowerUpCollection(data) {
    const { collectorId, type, config } = data;
    
    // Update statistics
    const progress = this.playerProgress.get(collectorId);
    if (progress) {
      progress.stats.powerUpsCollected++;
    }
    
    // Apply power-up effect
    if (config.instant) {
      this.applyInstantEffect(collectorId, config.effect);
    } else if (config.permanent) {
      this.applyPermanentUpgrade(collectorId, config.effect);
    } else {
      this.applyTemporaryEffect(collectorId, type, config);
    }
    
    // Visual and audio feedback
    this.eventBus.emit('ui:showPowerUpMessage', {
      name: config.name,
      rarity: config.rarity,
      duration: config.duration
    });
    
    this.eventBus.emit('audio:playSound', {
      sound: 'powerup_collect',
      volume: 0.7,
      pitch: this.getRarityPitch(config.rarity)
    });
    
    // Spawn collection particles
    const entity = this.entityManager.getEntity(collectorId);
    if (entity) {
      this.spawnCollectionParticles(entity.transform.x, entity.transform.y, config);
    }
  }

  applyInstantEffect(entityId, effect) {
    const combat = this.engine.getSystem('combat')?.getCombatData(entityId);
    if (!combat) return;
    
    switch (effect.type) {
      case 'heal':
        this.engine.getSystem('combat')?.heal(entityId, effect.value);
        break;
      case 'mana':
        combat.mana = Math.min(combat.maxMana, combat.mana + effect.value);
        this.eventBus.emit('combat:manaRestored', { entityId, amount: effect.value });
        break;
    }
  }

  applyTemporaryEffect(entityId, type, config) {
    const existingEffect = this.activePowerUps.get(entityId)?.get(type);
    
    if (!this.activePowerUps.has(entityId)) {
      this.activePowerUps.set(entityId, new Map());
    }
    
    const entityPowerUps = this.activePowerUps.get(entityId);
    
    // If effect already exists, refresh duration or stack if allowed
    if (existingEffect) {
      existingEffect.duration = config.duration;
      existingEffect.stackCount = Math.min(existingEffect.stackCount + 1, 3); // Max 3 stacks
    } else {
      entityPowerUps.set(type, {
        config,
        duration: config.duration,
        stackCount: 1,
        startTime: Date.now()
      });
    }
    
    this.updateEntityStats(entityId);
  }

  applyPermanentUpgrade(entityId, effect) {
    const progress = this.playerProgress.get(entityId);
    const combat = this.engine.getSystem('combat')?.getCombatData(entityId);
    
    if (!progress || !combat) return;
    
    switch (effect.stat) {
      case 'maxHealth':
        progress.permanentUpgrades.maxHealth += effect.value;
        combat.maxHealth += effect.value;
        combat.health += effect.value; // Also heal
        break;
      case 'maxMana':
        progress.permanentUpgrades.maxMana += effect.value;
        combat.maxMana += effect.value;
        combat.mana += effect.value;
        break;
      case 'attack':
        progress.permanentUpgrades.attack += effect.value;
        combat.attack += effect.value;
        break;
      case 'defense':
        progress.permanentUpgrades.defense += effect.value;
        combat.defense += effect.value;
        break;
      case 'criticalChance':
        progress.permanentUpgrades.criticalChance += effect.value;
        combat.criticalChance += effect.value;
        break;
    }
    
    this.eventBus.emit('progression:permanentUpgrade', {
      entityId,
      stat: effect.stat,
      value: effect.value
    });
  }

  update(deltaTime) {
    // Update active power-ups
    for (const [entityId, entityPowerUps] of this.activePowerUps) {
      const expiredEffects = [];
      
      for (const [type, effect] of entityPowerUps) {
        effect.duration -= deltaTime;
        
        if (effect.duration <= 0) {
          expiredEffects.push(type);
        }
      }
      
      // Remove expired effects
      expiredEffects.forEach(type => {
        entityPowerUps.delete(type);
        this.eventBus.emit('powerup:expired', { entityId, type });
      });
      
      if (expiredEffects.length > 0) {
        this.updateEntityStats(entityId);
      }
      
      // Clean up empty maps
      if (entityPowerUps.size === 0) {
        this.activePowerUps.delete(entityId);
      }
    }
    
    // Update player statistics
    for (const [entityId, progress] of this.playerProgress) {
      progress.stats.timePlayed += deltaTime;
    }
  }

  updateEntityStats(entityId) {
    const entityPowerUps = this.activePowerUps.get(entityId);
    const combat = this.engine.getSystem('combat')?.getCombatData(entityId);
    const progress = this.playerProgress.get(entityId);
    
    if (!combat || !progress) return;
    
    // Reset to base stats plus permanent upgrades
    combat.speed = 1 + progress.permanentUpgrades.speed;
    combat.attack = 10 + progress.permanentUpgrades.attack;
    combat.defense = 5 + progress.permanentUpgrades.defense;
    
    // Apply active power-up effects
    if (entityPowerUps) {
      for (const [type, effect] of entityPowerUps) {
        const config = effect.config;
        const stackMultiplier = effect.stackCount;
        
        if (config.effect.type === 'multiply') {
          const multiplier = 1 + (config.effect.value - 1) * stackMultiplier;
          switch (config.effect.stat) {
            case 'speed':
              combat.speed *= multiplier;
              break;
            case 'attack':
              combat.attack *= multiplier;
              break;
            case 'defense':
              combat.defense *= multiplier;
              break;
          }
        }
      }
    }
  }

  handleExperienceGain(data) {
    const { entityId, amount, source } = data;
    const progress = this.playerProgress.get(entityId);
    
    if (!progress) return;
    
    progress.experience += amount;
    
    // Check for level up
    const requiredExp = this.getRequiredExperience(progress.level);
    if (progress.experience >= requiredExp) {
      this.levelUp(entityId, progress);
    }
    
    this.eventBus.emit('ui:experienceGained', { entityId, amount, source });
  }

  levelUp(entityId, progress) {
    progress.level++;
    progress.skillPoints++;
    progress.experience -= this.getRequiredExperience(progress.level - 1);
    
    // Apply level-up bonuses
    const combat = this.engine.getSystem('combat')?.getCombatData(entityId);
    if (combat) {
      const healthIncrease = 10;
      const manaIncrease = 5;
      
      combat.maxHealth += healthIncrease;
      combat.health += healthIncrease;
      combat.maxMana += manaIncrease;
      combat.mana += manaIncrease;
    }
    
    this.eventBus.emit('progression:levelUp', {
      entityId,
      newLevel: progress.level,
      skillPoints: progress.skillPoints
    });
    
    this.eventBus.emit('audio:playSound', { sound: 'level_up', volume: 0.8 });
  }

  generateExperienceTable() {
    const table = [0]; // Level 0
    let baseExp = 100;
    
    for (let level = 1; level <= 100; level++) {
      table[level] = Math.floor(baseExp * Math.pow(1.15, level - 1));
    }
    
    return table;
  }

  getRequiredExperience(level) {
    return this.experienceTable[level] || this.experienceTable[this.experienceTable.length - 1];
  }

  initializeSkillTrees() {
    return {
      combat: {
        name: 'Combat Mastery',
        skills: {
          powerStrike: { name: 'Power Strike', cost: 1, maxLevel: 5, effect: 'attack', value: 2 },
          toughSkin: { name: 'Tough Skin', cost: 1, maxLevel: 5, effect: 'defense', value: 1 },
          criticalEye: { name: 'Critical Eye', cost: 2, maxLevel: 3, effect: 'criticalChance', value: 0.05 },
          berserker: { name: 'Berserker', cost: 3, maxLevel: 1, effect: 'special', value: 'berserkerMode' }
        }
      },
      mobility: {
        name: 'Agility',
        skills: {
          swiftness: { name: 'Swiftness', cost: 1, maxLevel: 5, effect: 'speed', value: 0.1 },
          doubleJump: { name: 'Double Jump', cost: 2, maxLevel: 1, effect: 'ability', value: 'doubleJump' },
          wallJump: { name: 'Wall Jump', cost: 2, maxLevel: 1, effect: 'ability', value: 'wallJump' },
          airDash: { name: 'Air Dash', cost: 3, maxLevel: 1, effect: 'ability', value: 'airDash' }
        }
      },
      survival: {
        name: 'Survival',
        skills: {
          vitality: { name: 'Vitality', cost: 1, maxLevel: 5, effect: 'maxHealth', value: 15 },
          regeneration: { name: 'Regeneration', cost: 2, maxLevel: 3, effect: 'special', value: 'healthRegen' },
          ironWill: { name: 'Iron Will', cost: 2, maxLevel: 3, effect: 'special', value: 'statusResistance' },
          secondWind: { name: 'Second Wind', cost: 3, maxLevel: 1, effect: 'special', value: 'revive' }
        }
      }
    };
  }

  getRarityGlow(rarity) {
    const glowIntensity = {
      common: 0.3,
      uncommon: 0.5,
      rare: 0.7,
      epic: 0.9,
      legendary: 1.2
    };
    return glowIntensity[rarity] || 0.3;
  }

  getRarityPitch(rarity) {
    const pitches = {
      common: 1.0,
      uncommon: 1.1,
      rare: 1.2,
      epic: 1.3,
      legendary: 1.5
    };
    return pitches[rarity] || 1.0;
  }

  spawnPowerUpParticles(x, y, config) {
    const particleSystem = this.engine.getSystem('particles');
    if (!particleSystem) return;
    
    particleSystem.createParticleEffect({
      x, y,
      type: 'powerup_spawn',
      color: config.color,
      count: 15,
      spread: Math.PI * 2,
      speed: { min: 20, max: 50 },
      lifetime: { min: 500, max: 1200 },
      fade: true
    });
  }

  spawnCollectionParticles(x, y, config) {
    const particleSystem = this.engine.getSystem('particles');
    if (!particleSystem) return;
    
    particleSystem.createParticleEffect({
      x, y,
      type: 'powerup_collect',
      color: config.color,
      count: 25,
      spread: Math.PI * 2,
      speed: { min: 30, max: 80 },
      lifetime: { min: 800, max: 1500 },
      fade: true,
      gravity: -50
    });
  }

  // Utility methods
  getActivePowerUps(entityId) {
    return this.activePowerUps.get(entityId) || new Map();
  }

  getPlayerProgress(entityId) {
    return this.playerProgress.get(entityId);
  }

  hasActivePowerUp(entityId, type) {
    const entityPowerUps = this.activePowerUps.get(entityId);
    return entityPowerUps && entityPowerUps.has(type);
  }

  getRemainingDuration(entityId, type) {
    const entityPowerUps = this.activePowerUps.get(entityId);
    const effect = entityPowerUps?.get(type);
    return effect ? effect.duration : 0;
  }
}

export default PowerUpSystem;