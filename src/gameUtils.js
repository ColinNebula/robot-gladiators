// Game utility functions converted from the original game.js

export const randomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min) + min);
};

export const getInitialPlayerInfo = (name) => ({
  name: name || "Unknown Robot",
  health: 100,
  maxHealth: 100,
  attack: 10,
  money: 10,
});

export const getInitialEnemyInfo = () => [
  {
    name: "Roborto",
    attack: randomNumber(10, 14),
    health: randomNumber(40, 60),
    maxHealth: 60,
    type: "scout",
    reward: 20,
    description: "A nimble scout robot with basic combat protocols"
  },
  {
    name: "Amy Android", 
    attack: randomNumber(12, 16),
    health: randomNumber(50, 70),
    maxHealth: 70,
    type: "warrior",
    reward: 25,
    description: "An advanced combat android with enhanced weaponry"
  },
  {
    name: "Robo Trumble",
    attack: randomNumber(15, 20),
    health: randomNumber(60, 80),
    maxHealth: 80,
    type: "boss",
    reward: 35,
    description: "The notorious nebula warlord with devastating attacks"
  }
];

export const calculateDamage = (attackValue) => {
  return randomNumber(attackValue - 3, attackValue);
};

export const getHighScore = () => {
  const highScore = localStorage.getItem("nebula-wars-highscore");
  return highScore ? parseInt(highScore) : 0;
};

export const getHighScoreName = () => {
  return localStorage.getItem("nebula-wars-name") || "Unknown";
};

export const setHighScore = (score, name) => {
  localStorage.setItem("nebula-wars-highscore", score.toString());
  localStorage.setItem("nebula-wars-name", name);
};

export const isNewHighScore = (score) => {
  return score > getHighScore();
};

export const POWER_UPS = {
  SHIELD: { name: 'Energy Shield', cost: 15, description: 'Absorbs 50% of next attack' },
  CRITICAL: { name: 'Critical Strike', cost: 12, description: 'Next attack deals double damage' },
  REGENERATION: { name: 'Nano Repair', cost: 20, description: 'Slowly regenerate health over time' }
};

export const ACHIEVEMENTS = {
  FIRST_WIN: { name: 'First Victory', description: 'Win your first battle' },
  PERFECT_GAME: { name: 'Flawless Victory', description: 'Complete game without taking damage' },
  SHOPPING_SPREE: { name: 'Big Spender', description: 'Spend 50+ coins in shop' },
  SPEED_RUNNER: { name: 'Lightning Fast', description: 'Complete game in under 10 rounds of combat' }
};

export const playSound = (type) => {
  // Simple audio feedback using Web Audio API
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  switch(type) {
    case 'attack':
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
      break;
    case 'victory':
      oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      break;
    case 'purchase':
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.05);
      break;
  }
};

export const getCriticalHitChance = (player) => {
  return Math.min(0.3, 0.1 + (player.attack - 10) * 0.01); // Max 30% crit chance
};

export const calculateCriticalDamage = (damage) => {
  return Math.floor(damage * 1.5);
};