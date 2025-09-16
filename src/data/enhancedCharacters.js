/**
 * Enhanced Character Data System
 * 
 * Comprehensive character database with stats, progression, abilities,
 * unlocks, backstories, and customization options.
 */

export const CHARACTER_RARITY = {
  COMMON: 'common',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary'
};

export const CHARACTER_ROLES = {
  BALANCED: 'balanced',
  ASSASSIN: 'assassin',
  TANK: 'tank',
  BERSERKER: 'berserker',
  SUPPORT: 'support'
};

export const ENHANCED_CHARACTERS = [
  {
    id: 'malice',
    name: 'Malice',
    title: 'The Balanced Warrior',
    avatar: '🤖',
    spriteId: 'malice',
    role: CHARACTER_ROLES.BALANCED,
    rarity: CHARACTER_RARITY.COMMON,
    
    // Basic Stats
    stats: {
      health: 100,
      attack: 10,
      defense: 8,
      speed: 7,
      agility: 6,
      energy: 50,
      criticalChance: 0.15,
      criticalDamage: 1.5
    },
    
    // Visual Theme
    theme: {
      primary: '#4facfe',
      secondary: '#00c4ff',
      accent: '#7c4dff',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00c4ff 100%)'
    },
    
    // Character Description
    description: 'A nimble scout robot with perfectly balanced combat capabilities.',
    backstory: 'Forged in the neutral zones between warring factions, Malice learned to adapt to any situation. Its balanced design makes it the perfect choice for beginners and veterans alike.',
    
    // Abilities and Skills
    abilities: [
      {
        name: 'Balanced Combat',
        description: 'No stat penalties, reliable performance',
        icon: '⚖️',
        type: 'passive'
      },
      {
        name: 'Quick Recovery',
        description: 'Faster health regeneration between rounds',
        icon: '💚',
        type: 'passive'
      },
      {
        name: 'Adaptive Strike',
        description: 'Damage adapts to enemy weaknesses',
        icon: '🎯',
        type: 'special',
        cooldown: 8
      }
    ],
    
    // Special Moves
    specialMoves: [
      {
        name: 'Equilibrium Blast',
        description: 'Balanced energy attack that scales with missing health',
        damage: '80-120',
        cost: 25,
        animation: 'equilibrium_blast'
      }
    ],
    
    // Progression System
    progression: {
      level: 1,
      experience: 0,
      experienceToNext: 100,
      maxLevel: 50,
      unlockLevel: 1,
      mastery: {
        wins: 0,
        kills: 0,
        damageDealt: 0,
        damageReceived: 0
      }
    },
    
    // Customization Options
    customization: {
      skins: [
        { id: 'default', name: 'Default', unlocked: true, rarity: 'common' },
        { id: 'chrome', name: 'Chrome Finish', unlocked: false, rarity: 'rare', requirement: 'Win 10 matches' },
        { id: 'neon', name: 'Neon Core', unlocked: false, rarity: 'epic', requirement: 'Reach level 15' }
      ],
      equipment: [
        { id: 'standard_core', name: 'Standard Core', stats: { health: 0, attack: 0 }, unlocked: true },
        { id: 'reinforced_core', name: 'Reinforced Core', stats: { health: 20, defense: 3 }, unlocked: false }
      ]
    },
    
    // Unlock Requirements
    unlockRequirements: {
      level: 1,
      currency: 0,
      achievements: []
    },
    
    // Performance Stats
    winRate: 0.52,
    popularity: 0.78,
    difficulty: 2, // 1-5 scale
    
    // Voice Lines
    voiceLines: {
      select: "Systems optimized. Ready for combat.",
      victory: "Balance achieved through superior strategy.",
      defeat: "Recalibrating for next engagement."
    }
  },
  
  {
    id: 'lugawu',
    name: 'Lugawu',
    title: 'The Shadow Assassin',
    avatar: '👾',
    spriteId: 'lugawu',
    role: CHARACTER_ROLES.ASSASSIN,
    rarity: CHARACTER_RARITY.RARE,
    
    stats: {
      health: 90,
      attack: 14,
      defense: 5,
      speed: 10,
      agility: 9,
      energy: 60,
      criticalChance: 0.25,
      criticalDamage: 2.0
    },
    
    theme: {
      primary: '#ff4757',
      secondary: '#ff3838',
      accent: '#ff6b7a',
      gradient: 'linear-gradient(135deg, #ff4757 0%, #ff3838 100%)'
    },
    
    description: 'An advanced ninja mech with devastating attack capabilities.',
    backstory: 'Born from the ancient warrior codes and cutting-edge technology, Lugawu strikes from the shadows with lethal precision. Its ninja heritage grants unmatched agility and deadly techniques.',
    
    abilities: [
      {
        name: 'High Damage Output',
        description: '+40% attack damage, critical hits more likely',
        icon: '⚔️',
        type: 'passive'
      },
      {
        name: 'Critical Hit Mastery',
        description: 'Critical hits reduce ability cooldowns',
        icon: '💥',
        type: 'passive'
      },
      {
        name: 'Shadow Step',
        description: 'Teleport behind enemy for guaranteed critical',
        icon: '👤',
        type: 'special',
        cooldown: 12
      }
    ],
    
    specialMoves: [
      {
        name: 'Thousand Cuts',
        description: 'Rapid-fire strikes with increasing damage',
        damage: '40x5',
        cost: 35,
        animation: 'thousand_cuts'
      },
      {
        name: 'Shadow Clone',
        description: 'Create decoy that explodes on contact',
        damage: '150',
        cost: 40,
        animation: 'shadow_clone'
      }
    ],
    
    progression: {
      level: 1,
      experience: 0,
      experienceToNext: 150,
      maxLevel: 50,
      unlockLevel: 5,
      mastery: {
        wins: 0,
        kills: 0,
        damageDealt: 0,
        criticalHits: 0
      }
    },
    
    customization: {
      skins: [
        { id: 'default', name: 'Shadow Black', unlocked: true, rarity: 'rare' },
        { id: 'crimson', name: 'Crimson Ninja', unlocked: false, rarity: 'epic', requirement: 'Land 100 critical hits' },
        { id: 'void', name: 'Void Walker', unlocked: false, rarity: 'legendary', requirement: 'Win 25 matches with 80%+ critical rate' }
      ],
      equipment: [
        { id: 'ninja_blade', name: 'Plasma Katana', stats: { attack: 8, criticalChance: 0.1 }, unlocked: true },
        { id: 'shadow_cloak', name: 'Phase Cloak', stats: { agility: 5, speed: 3 }, unlocked: false }
      ]
    },
    
    unlockRequirements: {
      level: 5,
      currency: 500,
      achievements: ['first_critical']
    },
    
    winRate: 0.48,
    popularity: 0.65,
    difficulty: 4,
    
    voiceLines: {
      select: "The shadows whisper of victory.",
      victory: "Another target eliminated with precision.",
      defeat: "I will return from the shadows stronger."
    }
  },
  
  {
    id: 'magnus',
    name: 'Magnus',
    title: 'The Iron Warlord',
    avatar: '🦾',
    spriteId: 'magnus',
    role: CHARACTER_ROLES.TANK,
    rarity: CHARACTER_RARITY.EPIC,
    
    stats: {
      health: 120,
      attack: 8,
      defense: 12,
      speed: 4,
      agility: 3,
      energy: 40,
      criticalChance: 0.05,
      criticalDamage: 1.2
    },
    
    theme: {
      primary: '#2ed573',
      secondary: '#20bf6b',
      accent: '#26de81',
      gradient: 'linear-gradient(135deg, #2ed573 0%, #20bf6b 100%)'
    },
    
    description: 'A heavily armored warlord mech built for endurance and protection.',
    backstory: 'Forged in the great furnaces of the Iron Citadel, Magnus stands as an immovable fortress on the battlefield. Its massive frame houses advanced defensive systems and devastating heavy weapons.',
    
    abilities: [
      {
        name: 'Fortified Armor',
        description: '+50% health and damage resistance',
        icon: '🛡️',
        type: 'passive'
      },
      {
        name: 'Damage Mitigation',
        description: 'Reduces incoming damage by 25%',
        icon: '🔰',
        type: 'passive'
      },
      {
        name: 'Fortress Mode',
        description: 'Become immobile but gain massive damage reduction',
        icon: '🏰',
        type: 'special',
        cooldown: 15
      }
    ],
    
    specialMoves: [
      {
        name: 'Seismic Slam',
        description: 'Ground pound that damages and stuns nearby enemies',
        damage: '100 + AoE stun',
        cost: 30,
        animation: 'seismic_slam'
      },
      {
        name: 'Iron Will',
        description: 'Become immune to debuffs and regenerate health',
        damage: 'Healing over time',
        cost: 25,
        animation: 'iron_will'
      }
    ],
    
    progression: {
      level: 1,
      experience: 0,
      experienceToNext: 200,
      maxLevel: 50,
      unlockLevel: 10,
      mastery: {
        wins: 0,
        damageBlocked: 0,
        timesSurvived: 0,
        heavyHits: 0
      }
    },
    
    customization: {
      skins: [
        { id: 'default', name: 'Battle Scarred', unlocked: true, rarity: 'epic' },
        { id: 'golden', name: 'Golden Warlord', unlocked: false, rarity: 'legendary', requirement: 'Block 10,000 damage' },
        { id: 'obsidian', name: 'Obsidian Fortress', unlocked: false, rarity: 'legendary', requirement: 'Survive 50 matches with <20% health' }
      ],
      equipment: [
        { id: 'heavy_plating', name: 'Reinforced Plating', stats: { health: 30, defense: 5 }, unlocked: true },
        { id: 'energy_shield', name: 'Energy Barrier', stats: { defense: 8, energy: 20 }, unlocked: false }
      ]
    },
    
    unlockRequirements: {
      level: 10,
      currency: 1000,
      achievements: ['tank_master', 'damage_sponge']
    },
    
    winRate: 0.55,
    popularity: 0.45,
    difficulty: 3,
    
    voiceLines: {
      select: "Armor plating engaged. No force can break me.",
      victory: "Victory through unwavering strength!",
      defeat: "My armor may break, but my spirit endures."
    }
  },
  
  {
    id: 'nova',
    name: 'Nova',
    title: 'The Lightning Striker',
    avatar: '⚡',
    spriteId: 'nova',
    role: CHARACTER_ROLES.BERSERKER,
    rarity: CHARACTER_RARITY.LEGENDARY,
    
    stats: {
      health: 85,
      attack: 12,
      defense: 6,
      speed: 12,
      agility: 10,
      energy: 70,
      criticalChance: 0.20,
      criticalDamage: 1.8
    },
    
    theme: {
      primary: '#ffd700',
      secondary: '#ffed4e',
      accent: '#fff200',
      gradient: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)'
    },
    
    description: 'A high-speed berserker powered by unstable energy cores.',
    backstory: 'Created from experimental lightning technology, Nova harnesses raw electrical energy to overwhelm opponents with blinding speed and devastating combos.',
    
    abilities: [
      {
        name: 'Lightning Speed',
        description: 'Attacks increase speed for short duration',
        icon: '⚡',
        type: 'passive'
      },
      {
        name: 'Energy Overload',
        description: 'Low health triggers berserk mode',
        icon: '🔥',
        type: 'passive'
      },
      {
        name: 'Chain Lightning',
        description: 'Attacks can chain to nearby enemies',
        icon: '🌩️',
        type: 'special',
        cooldown: 10
      }
    ],
    
    specialMoves: [
      {
        name: 'Thunder Strike',
        description: 'Devastating combo that builds with each hit',
        damage: '60 + scaling',
        cost: 45,
        animation: 'thunder_strike'
      }
    ],
    
    progression: {
      level: 1,
      experience: 0,
      experienceToNext: 300,
      maxLevel: 50,
      unlockLevel: 20,
      mastery: {
        wins: 0,
        combos: 0,
        speedKills: 0,
        energyUsed: 0
      }
    },
    
    customization: {
      skins: [
        { id: 'default', name: 'Electric Blue', unlocked: true, rarity: 'legendary' },
        { id: 'solar', name: 'Solar Flare', unlocked: false, rarity: 'legendary', requirement: 'Complete 100 combos' }
      ],
      equipment: [
        { id: 'plasma_core', name: 'Unstable Core', stats: { energy: 30, speed: 5 }, unlocked: true }
      ]
    },
    
    unlockRequirements: {
      level: 20,
      currency: 2500,
      achievements: ['speed_demon', 'combo_master', 'berserker_fury']
    },
    
    winRate: 0.42,
    popularity: 0.85,
    difficulty: 5,
    
    voiceLines: {
      select: "Energy levels critical. Let's light this up!",
      victory: "Speed and fury, nothing else matters!",
      defeat: "Too fast to live, too young to die..."
    }
  }
];

// Utility functions for character data
export const getCharacterById = (id) => {
  return ENHANCED_CHARACTERS.find(char => char.id === id);
};

export const getUnlockedCharacters = (playerLevel, unlockedAchievements = []) => {
  return ENHANCED_CHARACTERS.filter(char => {
    const meetsLevel = playerLevel >= char.unlockRequirements.level;
    const meetsAchievements = char.unlockRequirements.achievements.every(
      achievement => unlockedAchievements.includes(achievement)
    );
    return meetsLevel && meetsAchievements;
  });
};

export const getCharactersByRole = (role) => {
  return ENHANCED_CHARACTERS.filter(char => char.role === role);
};

export const getCharactersByRarity = (rarity) => {
  return ENHANCED_CHARACTERS.filter(char => char.rarity === rarity);
};

export const calculateCharacterPower = (character) => {
  const { stats } = character;
  return Math.round(
    stats.health * 0.3 +
    stats.attack * 0.4 +
    stats.defense * 0.2 +
    stats.speed * 0.1
  );
};

export const getCharacterProgression = (characterId) => {
  // This would normally come from a save system
  const saved = localStorage.getItem(`character_${characterId}_progress`);
  if (saved) {
    return JSON.parse(saved);
  }
  
  const character = getCharacterById(characterId);
  return character ? character.progression : null;
};

export const saveCharacterProgression = (characterId, progression) => {
  localStorage.setItem(`character_${characterId}_progress`, JSON.stringify(progression));
};

export default ENHANCED_CHARACTERS;