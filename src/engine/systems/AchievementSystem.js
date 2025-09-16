/**
 * Achievement and Progression System
 * 
 * Manages player achievements, high scores, progression tracking,
 * leaderboards, and reward systems.
 */

export class AchievementSystem {
  constructor(engine) {
    this.engine = engine;
    this.eventBus = engine.eventBus;
    
    // Achievement definitions
    this.achievements = this.initializeAchievements();
    
    // Player progress tracking
    this.playerProgress = new Map();
    this.unlockedAchievements = new Set();
    this.leaderboards = new Map();
    
    // Session statistics
    this.sessionStats = {
      startTime: Date.now(),
      endTime: null,
      score: 0,
      enemiesDefeated: 0,
      damageDealt: 0,
      damageTaken: 0,
      powerUpsCollected: 0,
      perfectDodges: 0,
      criticalHits: 0,
      maxCombo: 0,
      distanceTraveled: 0,
      jumps: 0,
      deaths: 0,
      continues: 0,
      secretsFound: 0,
      timeInAir: 0,
      accuracyShots: 0,
      totalShots: 0
    };
    
    // Scoring system
    this.scoreMultipliers = {
      base: 1,
      combo: 1,
      difficulty: 1,
      perfect: 1,
      speed: 1
    };
    
    this.scoreValues = {
      enemyKill: 100,
      criticalHit: 50,
      perfectDodge: 25,
      powerUpCollect: 10,
      secretFound: 500,
      comboBonus: 10,
      timeBonus: 1,
      accuracyBonus: 5,
      noHitBonus: 1000,
      speedBonus: 2
    };
    
    this.setupEventListeners();
    this.loadProgress();
  }

  setupEventListeners() {
    // Combat events
    this.eventBus.on('combat:death', this.handleEnemyDeath.bind(this));
    this.eventBus.on('combat:damaged', this.handleDamage.bind(this));
    this.eventBus.on('combat:criticalHit', this.handleCriticalHit.bind(this));
    this.eventBus.on('combat:perfectTiming', this.handlePerfectTiming.bind(this));
    this.eventBus.on('combat:comboUpdated', this.handleCombo.bind(this));
    
    // Movement events
    this.eventBus.on('player:jump', this.handleJump.bind(this));
    this.eventBus.on('player:move', this.handleMovement.bind(this));
    this.eventBus.on('player:dodge', this.handleDodge.bind(this));
    
    // Collection events
    this.eventBus.on('powerup:collected', this.handlePowerUpCollection.bind(this));
    this.eventBus.on('secret:found', this.handleSecretFound.bind(this));
    
    // Game state events
    this.eventBus.on('game:levelComplete', this.handleLevelComplete.bind(this));
    this.eventBus.on('game:gameOver', this.handleGameOver.bind(this));
    this.eventBus.on('game:continue', this.handleContinue.bind(this));
    
    // Achievement events
    this.eventBus.on('achievement:check', this.checkAchievements.bind(this));
    this.eventBus.on('score:add', this.addScore.bind(this));
  }

  initializeAchievements() {
    return {
      // Combat achievements
      firstBlood: {
        id: 'firstBlood',
        name: 'First Blood',
        description: 'Defeat your first enemy',
        icon: '⚔️',
        rarity: 'common',
        condition: { type: 'enemiesDefeated', value: 1 },
        reward: { type: 'experience', value: 50 }
      },
      warrior: {
        id: 'warrior',
        name: 'Warrior',
        description: 'Defeat 50 enemies',
        icon: '🛡️',
        rarity: 'uncommon',
        condition: { type: 'enemiesDefeated', value: 50 },
        reward: { type: 'experience', value: 200 }
      },
      slayer: {
        id: 'slayer',
        name: 'Slayer',
        description: 'Defeat 200 enemies',
        icon: '⚡',
        rarity: 'rare',
        condition: { type: 'enemiesDefeated', value: 200 },
        reward: { type: 'skillPoint', value: 1 }
      },
      destroyer: {
        id: 'destroyer',
        name: 'Destroyer',
        description: 'Defeat 500 enemies',
        icon: '💀',
        rarity: 'epic',
        condition: { type: 'enemiesDefeated', value: 500 },
        reward: { type: 'permanentUpgrade', stat: 'attack', value: 5 }
      },
      
      // Combo achievements
      comboStarter: {
        id: 'comboStarter',
        name: 'Combo Starter',
        description: 'Achieve a 10-hit combo',
        icon: '🔥',
        rarity: 'common',
        condition: { type: 'maxCombo', value: 10 },
        reward: { type: 'experience', value: 75 }
      },
      comboMaster: {
        id: 'comboMaster',
        name: 'Combo Master',
        description: 'Achieve a 50-hit combo',
        icon: '💥',
        rarity: 'rare',
        condition: { type: 'maxCombo', value: 50 },
        reward: { type: 'skillPoint', value: 1 }
      },
      comboGod: {
        id: 'comboGod',
        name: 'Combo God',
        description: 'Achieve a 100-hit combo',
        icon: '⚡',
        rarity: 'legendary',
        condition: { type: 'maxCombo', value: 100 },
        reward: { type: 'title', value: 'Combo God' }
      },
      
      // Survival achievements
      survivor: {
        id: 'survivor',
        name: 'Survivor',
        description: 'Survive for 10 minutes',
        icon: '🏃',
        rarity: 'uncommon',
        condition: { type: 'timePlayed', value: 600000 }, // 10 minutes in ms
        reward: { type: 'experience', value: 150 }
      },
      ironMan: {
        id: 'ironMan',
        name: 'Iron Man',
        description: 'Complete a level without taking damage',
        icon: '🛡️',
        rarity: 'rare',
        condition: { type: 'noDamageLevel', value: true },
        reward: { type: 'permanentUpgrade', stat: 'defense', value: 3 }
      },
      untouchable: {
        id: 'untouchable',
        name: 'Untouchable',
        description: 'Perform 25 perfect dodges',
        icon: '👻',
        rarity: 'uncommon',
        condition: { type: 'perfectDodges', value: 25 },
        reward: { type: 'ability', value: 'shadowStep' }
      },
      
      // Collection achievements
      collector: {
        id: 'collector',
        name: 'Collector',
        description: 'Collect 50 power-ups',
        icon: '💎',
        rarity: 'common',
        condition: { type: 'powerUpsCollected', value: 50 },
        reward: { type: 'experience', value: 100 }
      },
      hoarder: {
        id: 'hoarder',
        name: 'Hoarder',
        description: 'Collect 200 power-ups',
        icon: '👑',
        rarity: 'rare',
        condition: { type: 'powerUpsCollected', value: 200 },
        reward: { type: 'permanentUpgrade', stat: 'luck', value: 10 }
      },
      
      // Exploration achievements
      explorer: {
        id: 'explorer',
        name: 'Explorer',
        description: 'Find 5 secret areas',
        icon: '🔍',
        rarity: 'uncommon',
        condition: { type: 'secretsFound', value: 5 },
        reward: { type: 'map', value: 'secretLocations' }
      },
      
      // Skill achievements
      sharpshooter: {
        id: 'sharpshooter',
        name: 'Sharpshooter',
        description: 'Achieve 90% accuracy',
        icon: '🎯',
        rarity: 'rare',
        condition: { type: 'accuracy', value: 0.9 },
        reward: { type: 'permanentUpgrade', stat: 'criticalChance', value: 0.1 }
      },
      speedDemon: {
        id: 'speedDemon',
        name: 'Speed Demon',
        description: 'Complete a level in under 2 minutes',
        icon: '⚡',
        rarity: 'epic',
        condition: { type: 'levelTimeUnder', value: 120000 },
        reward: { type: 'permanentUpgrade', stat: 'speed', value: 0.2 }
      },
      
      // Special achievements
      phoenix: {
        id: 'phoenix',
        name: 'Phoenix',
        description: 'Use 10 continues in a single game',
        icon: '🔥',
        rarity: 'uncommon',
        condition: { type: 'continues', value: 10 },
        reward: { type: 'ability', value: 'resurrection' }
      },
      perfectionist: {
        id: 'perfectionist',
        name: 'Perfectionist',
        description: 'Get perfect scores on 5 levels',
        icon: '⭐',
        rarity: 'legendary',
        condition: { type: 'perfectScores', value: 5 },
        reward: { type: 'title', value: 'The Perfect' }
      }
    };
  }

  initializePlayerProgress(playerId) {
    const progress = {
      totalScore: 0,
      highScore: 0,
      totalPlayTime: 0,
      gamesPlayed: 0,
      gamesCompleted: 0,
      
      // Cumulative stats
      totalEnemiesDefeated: 0,
      totalDamageDealt: 0,
      totalDamageTaken: 0,
      totalPowerUpsCollected: 0,
      totalPerfectDodges: 0,
      totalCriticalHits: 0,
      totalSecretsFound: 0,
      totalJumps: 0,
      totalDistanceTraveled: 0,
      
      // Best records
      bestCombo: 0,
      bestAccuracy: 0,
      fastestLevelTime: Infinity,
      longestSurvivalTime: 0,
      
      // Achievement progress
      achievementProgress: new Map(),
      unlockedAchievements: new Set(),
      
      // Unlocked content
      unlockedLevels: new Set(['level1']),
      unlockedCharacters: new Set(['default']),
      unlockedAbilities: new Set(),
      
      // Preferences
      preferredDifficulty: 'normal',
      favoriteCharacter: 'default'
    };
    
    this.playerProgress.set(playerId, progress);
    return progress;
  }

  // Event handlers
  handleEnemyDeath(data) {
    const { entityId, attackerId } = data;
    
    if (this.isPlayer(attackerId)) {
      this.sessionStats.enemiesDefeated++;
      this.addScore({ 
        source: 'enemyKill', 
        baseValue: this.scoreValues.enemyKill,
        playerId: attackerId 
      });
      
      // Check for achievements
      this.checkAchievement('firstBlood');
      this.checkAchievement('warrior');
      this.checkAchievement('slayer');
      this.checkAchievement('destroyer');
    }
  }

  handleDamage(data) {
    const { entityId, damage, attackerId } = data;
    
    if (this.isPlayer(attackerId)) {
      this.sessionStats.damageDealt += damage;
    }
    
    if (this.isPlayer(entityId)) {
      this.sessionStats.damageTaken += damage;
    }
  }

  handleCriticalHit(data) {
    const { attackerId } = data;
    
    if (this.isPlayer(attackerId)) {
      this.sessionStats.criticalHits++;
      this.addScore({ 
        source: 'criticalHit', 
        baseValue: this.scoreValues.criticalHit,
        playerId: attackerId 
      });
    }
  }

  handlePerfectTiming(data) {
    const { attackerId } = data;
    
    if (this.isPlayer(attackerId)) {
      // Perfect timing counts as perfect dodge for achievements
      this.sessionStats.perfectDodges++;
      this.addScore({ 
        source: 'perfectDodge', 
        baseValue: this.scoreValues.perfectDodge,
        playerId: attackerId 
      });
      
      this.checkAchievement('untouchable');
    }
  }

  handleCombo(data) {
    const { entityId, comboCount } = data;
    
    if (this.isPlayer(entityId)) {
      this.sessionStats.maxCombo = Math.max(this.sessionStats.maxCombo, comboCount);
      
      // Add combo bonus score
      this.addScore({ 
        source: 'comboBonus', 
        baseValue: this.scoreValues.comboBonus * comboCount,
        playerId: entityId 
      });
      
      // Check combo achievements
      this.checkAchievement('comboStarter');
      this.checkAchievement('comboMaster');
      this.checkAchievement('comboGod');
    }
  }

  handleJump(data) {
    const { entityId } = data;
    
    if (this.isPlayer(entityId)) {
      this.sessionStats.jumps++;
    }
  }

  handleMovement(data) {
    const { entityId, distance } = data;
    
    if (this.isPlayer(entityId)) {
      this.sessionStats.distanceTraveled += distance;
    }
  }

  handleDodge(data) {
    const { entityId, perfect } = data;
    
    if (this.isPlayer(entityId) && perfect) {
      this.sessionStats.perfectDodges++;
      this.addScore({ 
        source: 'perfectDodge', 
        baseValue: this.scoreValues.perfectDodge,
        playerId: entityId 
      });
    }
  }

  handlePowerUpCollection(data) {
    const { collectorId } = data;
    
    if (this.isPlayer(collectorId)) {
      this.sessionStats.powerUpsCollected++;
      this.addScore({ 
        source: 'powerUpCollect', 
        baseValue: this.scoreValues.powerUpCollect,
        playerId: collectorId 
      });
      
      this.checkAchievement('collector');
      this.checkAchievement('hoarder');
    }
  }

  handleSecretFound(data) {
    const { playerId } = data;
    
    this.sessionStats.secretsFound++;
    this.addScore({ 
      source: 'secretFound', 
      baseValue: this.scoreValues.secretFound,
      playerId 
    });
    
    this.checkAchievement('explorer');
  }

  handleLevelComplete(data) {
    const { playerId, levelTime, perfect } = data;
    
    // Calculate time bonus
    const timeBonus = Math.max(0, (300000 - levelTime) / 1000); // 5 minute baseline
    this.addScore({ 
      source: 'timeBonus', 
      baseValue: timeBonus,
      playerId 
    });
    
    // Check for no damage bonus
    if (this.sessionStats.damageTaken === 0) {
      this.addScore({ 
        source: 'noHitBonus', 
        baseValue: this.scoreValues.noHitBonus,
        playerId 
      });
      
      this.checkAchievement('ironMan');
    }
    
    // Check speed achievements
    if (levelTime < 120000) { // Under 2 minutes
      this.checkAchievement('speedDemon');
    }
    
    // Check accuracy
    const accuracy = this.sessionStats.totalShots > 0 
      ? this.sessionStats.accuracyShots / this.sessionStats.totalShots 
      : 1;
    
    if (accuracy >= 0.9) {
      this.checkAchievement('sharpshooter');
    }
  }

  handleGameOver(data) {
    const { playerId, finalScore } = data;
    
    this.sessionStats.endTime = Date.now();
    this.sessionStats.score = finalScore;
    
    // Update player progress
    this.updatePlayerProgress(playerId);
    
    // Check survival achievements
    const playTime = this.sessionStats.endTime - this.sessionStats.startTime;
    if (playTime >= 600000) { // 10 minutes
      this.checkAchievement('survivor');
    }
    
    // Save progress
    this.saveProgress();
    
    // Submit to leaderboards
    this.submitToLeaderboard(playerId, finalScore);
  }

  handleContinue(data) {
    const { playerId } = data;
    
    this.sessionStats.continues++;
    this.checkAchievement('phoenix');
  }

  // Scoring system
  addScore(data) {
    const { source, baseValue, playerId, multiplier = 1 } = data;
    
    let finalScore = baseValue;
    
    // Apply multipliers
    finalScore *= this.scoreMultipliers.base;
    finalScore *= this.scoreMultipliers.combo;
    finalScore *= this.scoreMultipliers.difficulty;
    finalScore *= multiplier;
    
    this.sessionStats.score += Math.round(finalScore);
    
    this.eventBus.emit('ui:scoreUpdate', {
      playerId,
      points: Math.round(finalScore),
      source,
      totalScore: this.sessionStats.score
    });
  }

  // Achievement checking
  checkAchievement(achievementId) {
    if (this.unlockedAchievements.has(achievementId)) return;
    
    const achievement = this.achievements[achievementId];
    if (!achievement) return;
    
    let conditionMet = false;
    
    switch (achievement.condition.type) {
      case 'enemiesDefeated':
        conditionMet = this.sessionStats.enemiesDefeated >= achievement.condition.value;
        break;
      case 'maxCombo':
        conditionMet = this.sessionStats.maxCombo >= achievement.condition.value;
        break;
      case 'powerUpsCollected':
        conditionMet = this.sessionStats.powerUpsCollected >= achievement.condition.value;
        break;
      case 'perfectDodges':
        conditionMet = this.sessionStats.perfectDodges >= achievement.condition.value;
        break;
      case 'secretsFound':
        conditionMet = this.sessionStats.secretsFound >= achievement.condition.value;
        break;
      case 'timePlayed':
        const playTime = Date.now() - this.sessionStats.startTime;
        conditionMet = playTime >= achievement.condition.value;
        break;
      case 'continues':
        conditionMet = this.sessionStats.continues >= achievement.condition.value;
        break;
      case 'noDamageLevel':
        conditionMet = this.sessionStats.damageTaken === 0;
        break;
      case 'accuracy':
        const accuracy = this.sessionStats.totalShots > 0 
          ? this.sessionStats.accuracyShots / this.sessionStats.totalShots 
          : 1;
        conditionMet = accuracy >= achievement.condition.value;
        break;
    }
    
    if (conditionMet) {
      this.unlockAchievement(achievementId);
    }
  }

  checkAchievements() {
    for (const achievementId of Object.keys(this.achievements)) {
      this.checkAchievement(achievementId);
    }
  }

  unlockAchievement(achievementId) {
    if (this.unlockedAchievements.has(achievementId)) return;
    
    const achievement = this.achievements[achievementId];
    this.unlockedAchievements.add(achievementId);
    
    // Apply rewards
    this.applyAchievementReward(achievement.reward);
    
    // Notify UI
    this.eventBus.emit('achievement:unlocked', {
      achievement,
      timestamp: Date.now()
    });
    
    // Audio feedback
    this.eventBus.emit('audio:playSound', {
      sound: 'achievement_unlock',
      volume: 0.7
    });
    
    console.log(`🏆 Achievement unlocked: ${achievement.name}`);
  }

  applyAchievementReward(reward) {
    switch (reward.type) {
      case 'experience':
        this.eventBus.emit('experience:gained', {
          amount: reward.value,
          source: 'achievement'
        });
        break;
      case 'skillPoint':
        this.eventBus.emit('progression:skillPoint', {
          amount: reward.value
        });
        break;
      case 'permanentUpgrade':
        this.eventBus.emit('progression:permanentUpgrade', {
          stat: reward.stat,
          value: reward.value
        });
        break;
      case 'ability':
        this.eventBus.emit('progression:abilityUnlocked', {
          ability: reward.value
        });
        break;
      case 'title':
        this.eventBus.emit('progression:titleUnlocked', {
          title: reward.value
        });
        break;
    }
  }

  // Leaderboard management
  submitToLeaderboard(playerId, score) {
    const leaderboardData = {
      playerId,
      score,
      timestamp: Date.now(),
      stats: { ...this.sessionStats }
    };
    
    // Daily leaderboard
    const today = new Date().toDateString();
    this.addToLeaderboard('daily', today, leaderboardData);
    
    // Weekly leaderboard
    const weekStart = this.getWeekStart(new Date()).toDateString();
    this.addToLeaderboard('weekly', weekStart, leaderboardData);
    
    // All-time leaderboard
    this.addToLeaderboard('allTime', 'global', leaderboardData);
  }

  addToLeaderboard(type, period, data) {
    const key = `${type}_${period}`;
    
    if (!this.leaderboards.has(key)) {
      this.leaderboards.set(key, []);
    }
    
    const leaderboard = this.leaderboards.get(key);
    leaderboard.push(data);
    
    // Sort by score (descending)
    leaderboard.sort((a, b) => b.score - a.score);
    
    // Keep only top 100
    if (leaderboard.length > 100) {
      leaderboard.splice(100);
    }
  }

  getLeaderboard(type, period = 'global') {
    const key = `${type}_${period}`;
    return this.leaderboards.get(key) || [];
  }

  updatePlayerProgress(playerId) {
    const progress = this.playerProgress.get(playerId) || this.initializePlayerProgress(playerId);
    
    // Update cumulative stats
    progress.totalScore += this.sessionStats.score;
    progress.highScore = Math.max(progress.highScore, this.sessionStats.score);
    progress.totalPlayTime += Date.now() - this.sessionStats.startTime;
    progress.gamesPlayed++;
    
    progress.totalEnemiesDefeated += this.sessionStats.enemiesDefeated;
    progress.totalDamageDealt += this.sessionStats.damageDealt;
    progress.totalDamageTaken += this.sessionStats.damageTaken;
    progress.totalPowerUpsCollected += this.sessionStats.powerUpsCollected;
    progress.totalPerfectDodges += this.sessionStats.perfectDodges;
    progress.totalCriticalHits += this.sessionStats.criticalHits;
    progress.totalSecretsFound += this.sessionStats.secretsFound;
    progress.totalJumps += this.sessionStats.jumps;
    progress.totalDistanceTraveled += this.sessionStats.distanceTraveled;
    
    // Update best records
    progress.bestCombo = Math.max(progress.bestCombo, this.sessionStats.maxCombo);
    
    const sessionAccuracy = this.sessionStats.totalShots > 0 
      ? this.sessionStats.accuracyShots / this.sessionStats.totalShots 
      : 0;
    progress.bestAccuracy = Math.max(progress.bestAccuracy, sessionAccuracy);
    
    // Update unlocked achievements
    progress.unlockedAchievements = new Set([...progress.unlockedAchievements, ...this.unlockedAchievements]);
  }

  // Utility methods
  isPlayer(entityId) {
    // Check if entity is a player - implementation depends on game setup
    const entity = this.engine.entityManager.getEntity(entityId);
    return entity && entity.tag === 'player';
  }

  getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  getRarityColor(rarity) {
    const colors = {
      common: '#ffffff',
      uncommon: '#00ff00',
      rare: '#0080ff',
      epic: '#8000ff',
      legendary: '#ff8000'
    };
    return colors[rarity] || colors.common;
  }

  // Save/Load system
  saveProgress() {
    try {
      const saveData = {
        playerProgress: Array.from(this.playerProgress.entries()),
        unlockedAchievements: Array.from(this.unlockedAchievements),
        leaderboards: Array.from(this.leaderboards.entries())
      };
      
      localStorage.setItem('nebulaWars_progress', JSON.stringify(saveData));
      console.log('Progress saved successfully');
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }

  loadProgress() {
    try {
      const saveData = localStorage.getItem('nebulaWars_progress');
      if (!saveData) return;
      
      const data = JSON.parse(saveData);
      
      this.playerProgress = new Map(data.playerProgress || []);
      this.unlockedAchievements = new Set(data.unlockedAchievements || []);
      this.leaderboards = new Map(data.leaderboards || []);
      
      console.log('Progress loaded successfully');
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  }

  // API methods
  getPlayerStats(playerId) {
    return this.playerProgress.get(playerId);
  }

  getSessionStats() {
    return { ...this.sessionStats };
  }

  getUnlockedAchievements() {
    return Array.from(this.unlockedAchievements);
  }

  getAchievementProgress(achievementId) {
    const achievement = this.achievements[achievementId];
    if (!achievement) return null;
    
    let current = 0;
    const target = achievement.condition.value;
    
    switch (achievement.condition.type) {
      case 'enemiesDefeated':
        current = this.sessionStats.enemiesDefeated;
        break;
      case 'maxCombo':
        current = this.sessionStats.maxCombo;
        break;
      case 'powerUpsCollected':
        current = this.sessionStats.powerUpsCollected;
        break;
      // Add other cases as needed
    }
    
    return {
      current,
      target,
      percentage: Math.min(100, (current / target) * 100),
      completed: this.unlockedAchievements.has(achievementId)
    };
  }

  resetSession() {
    this.sessionStats = {
      startTime: Date.now(),
      endTime: null,
      score: 0,
      enemiesDefeated: 0,
      damageDealt: 0,
      damageTaken: 0,
      powerUpsCollected: 0,
      perfectDodges: 0,
      criticalHits: 0,
      maxCombo: 0,
      distanceTraveled: 0,
      jumps: 0,
      deaths: 0,
      continues: 0,
      secretsFound: 0,
      timeInAir: 0,
      accuracyShots: 0,
      totalShots: 0
    };
  }
}

export default AchievementSystem;