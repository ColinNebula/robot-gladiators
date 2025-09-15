/**
 * Player Statistics Service
 * Manages persistent player statistics, achievements, and progress tracking
 */

export class StatisticsService {
  constructor() {
    this.storageKey = 'nebula-wars-statistics';
    this.defaultStats = {
      // Basic Statistics
      totalGamesPlayed: 0,
      totalWins: 0,
      totalLosses: 0,
      totalRoundsWon: 0,
      totalRoundsLost: 0,
      winStreak: 0,
      bestWinStreak: 0,
      
      // Time Statistics
      totalPlayTime: 0, // in seconds
      averageGameDuration: 0,
      shortestGame: null,
      longestGame: null,
      
      // Combat Statistics
      totalProjectilesFired: 0,
      totalHits: 0,
      totalDamageDealt: 0,
      totalDamageTaken: 0,
      accuracy: 0,
      
      // Campaign Progress
      campaignProgress: {
        'training-grounds': { completed: false, bestTime: null, stars: 0 },
        'underground-arena': { completed: false, bestTime: null, stars: 0 },
        'neon-nexus': { completed: false, bestTime: null, stars: 0 },
        'cosmic-battleground': { completed: false, bestTime: null, stars: 0 }
      },
      
      // Achievements
      achievements: {
        'first-victory': { unlocked: false, unlockedAt: null },
        'marksman': { unlocked: false, unlockedAt: null }, // 90% accuracy in a game
        'survivor': { unlocked: false, unlockedAt: null }, // Win without taking damage
        'speed-demon': { unlocked: false, unlockedAt: null }, // Win a game in under 30 seconds
        'champion': { unlocked: false, unlockedAt: null }, // Win 10 games in a row
        'completionist': { unlocked: false, unlockedAt: null }, // Complete all campaigns
        'master-warrior': { unlocked: false, unlockedAt: null }, // Get 3 stars on all campaigns
        'projectile-master': { unlocked: false, unlockedAt: null }, // Fire 1000 projectiles
        'damage-dealer': { unlocked: false, unlockedAt: null }, // Deal 10000 total damage
        'veteran': { unlocked: false, unlockedAt: null } // Play for 60 minutes total
      },
      
      // Character Progression System
      characterProgression: {
        level: 1,
        experience: 0,
        experienceToNextLevel: 100,
        skillPoints: 0,
        unlockedAbilities: ['basic-punch', 'basic-kick', 'basic-projectile'],
        equippedAbilities: {
          slot1: 'basic-punch',
          slot2: 'basic-kick',
          slot3: 'basic-projectile',
          slot4: null
        },
        characterCustomization: {
          skin: 'default',
          weapon: 'default',
          effects: 'default',
          animations: 'default'
        },
        stats: {
          health: 100,
          attack: 10,
          defense: 5,
          speed: 8,
          accuracy: 50,
          criticalChance: 5
        }
      },
      
      // Session Statistics (reset each session)
      session: {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        startTime: Date.now()
      }
    };
  }

  /**
   * Load statistics from localStorage
   */
  loadStatistics() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all properties exist
        return { ...this.defaultStats, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load statistics:', error);
    }
    return { ...this.defaultStats };
  }

  /**
   * Save statistics to localStorage
   */
  saveStatistics(stats) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(stats));
      return true;
    } catch (error) {
      console.error('Failed to save statistics:', error);
      return false;
    }
  }

  /**
   * Get current statistics
   */
  getStatistics() {
    return this.loadStatistics();
  }

  /**
   * Record a game result
   */
  recordGameResult(result) {
    const stats = this.loadStatistics();
    const gameStartTime = result.startTime || Date.now();
    const gameEndTime = result.endTime || Date.now();
    const gameDuration = (gameEndTime - gameStartTime) / 1000; // in seconds

    // Update basic statistics
    stats.totalGamesPlayed++;
    stats.session.gamesPlayed++;
    
    if (result.won) {
      stats.totalWins++;
      stats.session.wins++;
      stats.winStreak++;
      stats.bestWinStreak = Math.max(stats.bestWinStreak, stats.winStreak);
      
      // Check for first victory achievement
      if (!stats.achievements['first-victory'].unlocked) {
        this.unlockAchievement(stats, 'first-victory');
      }
      
      // Check for champion achievement (10 wins in a row)
      if (stats.winStreak >= 10 && !stats.achievements['champion'].unlocked) {
        this.unlockAchievement(stats, 'champion');
      }
    } else {
      stats.totalLosses++;
      stats.session.losses++;
      stats.winStreak = 0;
    }

    // Update time statistics
    stats.totalPlayTime += gameDuration;
    stats.averageGameDuration = stats.totalPlayTime / stats.totalGamesPlayed;
    
    if (!stats.shortestGame || gameDuration < stats.shortestGame) {
      stats.shortestGame = gameDuration;
    }
    
    if (!stats.longestGame || gameDuration > stats.longestGame) {
      stats.longestGame = gameDuration;
    }

    // Update combat statistics if provided
    if (result.combat) {
      stats.totalProjectilesFired += result.combat.projectilesFired || 0;
      stats.totalHits += result.combat.hits || 0;
      stats.totalDamageDealt += result.combat.damageDealt || 0;
      stats.totalDamageTaken += result.combat.damageTaken || 0;
      
      // Calculate accuracy
      if (stats.totalProjectilesFired > 0) {
        stats.accuracy = (stats.totalHits / stats.totalProjectilesFired) * 100;
      }

      // Check achievements
      if (result.combat.accuracy >= 90 && !stats.achievements['marksman'].unlocked) {
        this.unlockAchievement(stats, 'marksman');
      }

      if (result.combat.damageTaken === 0 && result.won && !stats.achievements['survivor'].unlocked) {
        this.unlockAchievement(stats, 'survivor');
      }

      if (gameDuration < 30 && result.won && !stats.achievements['speed-demon'].unlocked) {
        this.unlockAchievement(stats, 'speed-demon');
      }

      if (stats.totalProjectilesFired >= 1000 && !stats.achievements['projectile-master'].unlocked) {
        this.unlockAchievement(stats, 'projectile-master');
      }

      if (stats.totalDamageDealt >= 10000 && !stats.achievements['damage-dealer'].unlocked) {
        this.unlockAchievement(stats, 'damage-dealer');
      }
    }

    // Check veteran achievement (60 minutes total play time)
    if (stats.totalPlayTime >= 3600 && !stats.achievements['veteran'].unlocked) {
      this.unlockAchievement(stats, 'veteran');
    }

    this.saveStatistics(stats);
    return stats;
  }

  /**
   * Record campaign completion
   */
  recordCampaignCompletion(campaignId, result) {
    const stats = this.loadStatistics();
    
    if (stats.campaignProgress[campaignId]) {
      stats.campaignProgress[campaignId].completed = true;
      
      // Update best time if better
      if (!stats.campaignProgress[campaignId].bestTime || result.time < stats.campaignProgress[campaignId].bestTime) {
        stats.campaignProgress[campaignId].bestTime = result.time;
      }
      
      // Update stars (based on performance criteria)
      const stars = this.calculateStars(result);
      stats.campaignProgress[campaignId].stars = Math.max(stats.campaignProgress[campaignId].stars, stars);
    }

    // Check for completionist achievement
    const allCompleted = Object.values(stats.campaignProgress).every(campaign => campaign.completed);
    if (allCompleted && !stats.achievements['completionist'].unlocked) {
      this.unlockAchievement(stats, 'completionist');
    }

    // Check for master warrior achievement (3 stars on all)
    const allThreeStars = Object.values(stats.campaignProgress).every(campaign => campaign.stars >= 3);
    if (allThreeStars && !stats.achievements['master-warrior'].unlocked) {
      this.unlockAchievement(stats, 'master-warrior');
    }

    this.saveStatistics(stats);
    return stats;
  }

  /**
   * Calculate stars based on performance
   */
  calculateStars(result) {
    let stars = 1; // Base star for completion
    
    // Second star: Complete under target time or with good accuracy
    if (result.time < result.targetTime || result.accuracy > 75) {
      stars = 2;
    }
    
    // Third star: Complete under target time AND good accuracy AND no damage taken
    if (result.time < result.targetTime && result.accuracy > 85 && result.damageTaken === 0) {
      stars = 3;
    }
    
    return stars;
  }

  /**
   * Unlock an achievement
   */
  unlockAchievement(stats, achievementId) {
    if (stats.achievements[achievementId] && !stats.achievements[achievementId].unlocked) {
      stats.achievements[achievementId].unlocked = true;
      stats.achievements[achievementId].unlockedAt = new Date().toISOString();
      
      // Trigger achievement notification (if available)
      this.triggerAchievementNotification(achievementId);
    }
  }

  /**
   * Trigger achievement notification
   */
  triggerAchievementNotification(achievementId) {
    const achievementNames = {
      'first-victory': 'First Victory',
      'marksman': 'Marksman',
      'survivor': 'Survivor',
      'speed-demon': 'Speed Demon',
      'champion': 'Champion',
      'completionist': 'Completionist',
      'master-warrior': 'Master Warrior',
      'projectile-master': 'Projectile Master',
      'damage-dealer': 'Damage Dealer',
      'veteran': 'Veteran'
    };

    const achievementName = achievementNames[achievementId] || achievementId;
    
    // Create a custom event for achievement unlocked
    window.dispatchEvent(new CustomEvent('achievementUnlocked', {
      detail: {
        id: achievementId,
        name: achievementName,
        timestamp: Date.now()
      }
    }));

    console.log(`🏆 Achievement Unlocked: ${achievementName}`);
  }

  /**
   * Get formatted statistics for display
   */
  getFormattedStatistics() {
    const stats = this.getStatistics();
    
    return {
      basic: {
        'Games Played': stats.totalGamesPlayed,
        'Wins': stats.totalWins,
        'Losses': stats.totalLosses,
        'Win Rate': stats.totalGamesPlayed > 0 ? `${((stats.totalWins / stats.totalGamesPlayed) * 100).toFixed(1)}%` : '0%',
        'Win Streak': stats.winStreak,
        'Best Win Streak': stats.bestWinStreak
      },
      time: {
        'Total Play Time': this.formatTime(stats.totalPlayTime),
        'Average Game Duration': this.formatTime(stats.averageGameDuration),
        'Shortest Game': stats.shortestGame ? this.formatTime(stats.shortestGame) : 'N/A',
        'Longest Game': stats.longestGame ? this.formatTime(stats.longestGame) : 'N/A'
      },
      combat: {
        'Projectiles Fired': stats.totalProjectilesFired,
        'Total Hits': stats.totalHits,
        'Accuracy': `${stats.accuracy.toFixed(1)}%`,
        'Damage Dealt': Math.floor(stats.totalDamageDealt),
        'Damage Taken': Math.floor(stats.totalDamageTaken)
      },
      achievements: {
        'Unlocked': Object.values(stats.achievements).filter(a => a.unlocked).length,
        'Total': Object.keys(stats.achievements).length,
        'Completion': `${((Object.values(stats.achievements).filter(a => a.unlocked).length / Object.keys(stats.achievements).length) * 100).toFixed(0)}%`
      }
    };
  }

  /**
   * Format time in a human-readable format
   */
  formatTime(seconds) {
    if (!seconds) return '0s';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  /**
   * Reset all statistics (for testing or user request)
   */
  resetStatistics() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error('Failed to reset statistics:', error);
      return false;
    }
  }

  /**
   * Export statistics as JSON
   */
  exportStatistics() {
    const stats = this.getStatistics();
    return {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      data: stats
    };
  }

  /**
   * Import statistics from JSON
   */
  importStatistics(data) {
    try {
      if (data.data && typeof data.data === 'object') {
        const mergedStats = { ...this.defaultStats, ...data.data };
        this.saveStatistics(mergedStats);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import statistics:', error);
      return false;
    }
  }

  /**
   * Add experience points and handle level progression
   */
  addExperience(amount) {
    const stats = this.loadStatistics();
    const progression = stats.characterProgression;
    
    progression.experience += amount;
    
    // Check for level up
    while (progression.experience >= progression.experienceToNextLevel) {
      progression.experience -= progression.experienceToNextLevel;
      progression.level++;
      progression.skillPoints += 2; // Gain 2 skill points per level
      
      // Increase experience requirement for next level (exponential growth)
      progression.experienceToNextLevel = Math.floor(100 * Math.pow(1.2, progression.level - 1));
      
      // Unlock new abilities based on level
      this.checkAbilityUnlocks(stats, progression.level);
      
      // Auto-improve stats slightly each level
      progression.stats.health += 5;
      progression.stats.attack += 1;
      progression.stats.defense += 1;
      progression.stats.speed += 0.5;
      
      // Trigger level up notification
      window.dispatchEvent(new CustomEvent('levelUp', {
        detail: {
          newLevel: progression.level,
          skillPoints: progression.skillPoints,
          timestamp: Date.now()
        }
      }));
    }
    
    this.saveStatistics(stats);
    return stats.characterProgression;
  }

  /**
   * Check and unlock abilities based on level
   */
  checkAbilityUnlocks(stats, level) {
    const abilityUnlocks = {
      5: 'power-punch',
      10: 'rapid-fire',
      15: 'combo-master',
      20: 'energy-shield',
      25: 'berserker-mode',
      30: 'elemental-mastery',
      35: 'time-slow',
      40: 'ultimate-strike',
      50: 'legendary-warrior'
    };

    if (abilityUnlocks[level] && !stats.characterProgression.unlockedAbilities.includes(abilityUnlocks[level])) {
      stats.characterProgression.unlockedAbilities.push(abilityUnlocks[level]);
      
      // Trigger ability unlock notification
      window.dispatchEvent(new CustomEvent('abilityUnlocked', {
        detail: {
          ability: abilityUnlocks[level],
          level: level,
          timestamp: Date.now()
        }
      }));
    }
  }

  /**
   * Spend skill points to upgrade stats
   */
  upgradeStats(statName, points) {
    const stats = this.loadStatistics();
    const progression = stats.characterProgression;
    
    if (progression.skillPoints < points) {
      return { success: false, message: 'Not enough skill points' };
    }

    const maxUpgrades = {
      health: 50,  // +250 max health
      attack: 20,  // +20 attack
      defense: 15, // +15 defense
      speed: 10,   // +10 speed
      accuracy: 20, // +20% accuracy
      criticalChance: 15 // +15% crit chance
    };

    const currentUpgrades = progression.stats[statName] - this.defaultStats.characterProgression.stats[statName];
    
    if (currentUpgrades >= maxUpgrades[statName]) {
      return { success: false, message: 'Stat already at maximum level' };
    }

    // Apply upgrade
    progression.skillPoints -= points;
    
    const upgradeAmounts = {
      health: 5,
      attack: 1,
      defense: 1,
      speed: 1,
      accuracy: 2,
      criticalChance: 1
    };

    progression.stats[statName] += upgradeAmounts[statName] * points;
    
    this.saveStatistics(stats);
    return { success: true, message: `${statName} upgraded!`, newValue: progression.stats[statName] };
  }

  /**
   * Equip an ability to a slot
   */
  equipAbility(ability, slot) {
    const stats = this.loadStatistics();
    const progression = stats.characterProgression;
    
    if (!progression.unlockedAbilities.includes(ability)) {
      return { success: false, message: 'Ability not unlocked' };
    }

    if (!['slot1', 'slot2', 'slot3', 'slot4'].includes(slot)) {
      return { success: false, message: 'Invalid slot' };
    }

    progression.equippedAbilities[slot] = ability;
    this.saveStatistics(stats);
    
    return { success: true, message: `${ability} equipped to ${slot}` };
  }

  /**
   * Customize character appearance
   */
  customizeCharacter(customizationType, option) {
    const stats = this.loadStatistics();
    const progression = stats.characterProgression;
    
    const validTypes = ['skin', 'weapon', 'effects', 'animations'];
    if (!validTypes.includes(customizationType)) {
      return { success: false, message: 'Invalid customization type' };
    }

    progression.characterCustomization[customizationType] = option;
    this.saveStatistics(stats);
    
    return { success: true, message: `${customizationType} changed to ${option}` };
  }

  /**
   * Get available abilities with descriptions
   */
  getAvailableAbilities() {
    return {
      'basic-punch': { name: 'Basic Punch', description: 'Standard melee attack', category: 'basic' },
      'basic-kick': { name: 'Basic Kick', description: 'Standard kick attack', category: 'basic' },
      'basic-projectile': { name: 'Basic Projectile', description: 'Standard ranged attack', category: 'basic' },
      'power-punch': { name: 'Power Punch', description: 'Devastating melee strike', category: 'combat', requiredLevel: 5 },
      'rapid-fire': { name: 'Rapid Fire', description: 'Fast consecutive projectiles', category: 'ranged', requiredLevel: 10 },
      'combo-master': { name: 'Combo Master', description: 'Enhanced combo damage', category: 'combat', requiredLevel: 15 },
      'energy-shield': { name: 'Energy Shield', description: 'Temporary damage reduction', category: 'defense', requiredLevel: 20 },
      'berserker-mode': { name: 'Berserker Mode', description: 'Increased attack speed and damage', category: 'ultimate', requiredLevel: 25 },
      'elemental-mastery': { name: 'Elemental Mastery', description: 'Access to fire, ice, and ember projectiles', category: 'ranged', requiredLevel: 30 },
      'time-slow': { name: 'Time Slow', description: 'Briefly slow down time', category: 'ultimate', requiredLevel: 35 },
      'ultimate-strike': { name: 'Ultimate Strike', description: 'Massive damage finishing move', category: 'ultimate', requiredLevel: 40 },
      'legendary-warrior': { name: 'Legendary Warrior', description: 'Master of all combat arts', category: 'legendary', requiredLevel: 50 }
    };
  }

  /**
   * Get character progression summary
   */
  getCharacterProgression() {
    const stats = this.getStatistics();
    const progression = stats.characterProgression;
    const abilities = this.getAvailableAbilities();
    
    return {
      level: progression.level,
      experience: progression.experience,
      experienceToNextLevel: progression.experienceToNextLevel,
      experienceProgress: (progression.experience / progression.experienceToNextLevel) * 100,
      skillPoints: progression.skillPoints,
      stats: progression.stats,
      unlockedAbilities: progression.unlockedAbilities.map(id => ({
        id,
        ...abilities[id]
      })),
      equippedAbilities: Object.entries(progression.equippedAbilities).map(([slot, abilityId]) => ({
        slot,
        ability: abilityId ? { id: abilityId, ...abilities[abilityId] } : null
      })),
      customization: progression.characterCustomization,
      powerLevel: this.calculatePowerLevel(progression.stats)
    };
  }

  /**
   * Calculate overall power level based on stats
   */
  calculatePowerLevel(stats) {
    return Math.floor(
      (stats.health * 0.5) +
      (stats.attack * 5) +
      (stats.defense * 3) +
      (stats.speed * 2) +
      (stats.accuracy * 1) +
      (stats.criticalChance * 2)
    );
  }
}

// Create and export a singleton instance
export const statisticsService = new StatisticsService();