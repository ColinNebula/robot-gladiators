/**
 * Enhanced SideScroller Scene
 * 
 * A comprehensive side-scrolling game scene that integrates all enhanced
 * engine systems including ECS, combat, physics, AI, and visual effects.
 */

import { Scene } from '../core/SceneManager.js';

export class EnhancedSideScrollerScene extends Scene {
  constructor(engine, sceneManager) {
    super(engine, sceneManager);
    
    // Scene configuration
    this.config = {
      gravity: 0.8,
      groundY: 420,
      playerSpeed: 6,
      jumpPower: 15,
      worldWidth: 3000,
      worldHeight: 600,
      cameraSmoothing: 0.1,
      spawnRate: 3000, // Enemy spawn rate in ms
      difficultyScale: 1.0
    };
    
    // Game state
    this.gameState = {
      score: 0,
      level: 1,
      lives: 3,
      time: 0,
      paused: false,
      gameOver: false,
      playerEntity: null,
      enemies: new Set(),
      powerUps: new Set(),
      particles: new Set(),
      background: null
    };
    
    // Scene systems integration
    this.systems = {
      combat: null,
      powerups: null,
      achievements: null,
      visualEffects: null,
      enhancedAudio: null,
      performance: null
    };
    
    // Timers and counters
    this.timers = {
      enemySpawn: 0,
      powerUpSpawn: 0,
      difficultyIncrease: 0,
      backgroundUpdate: 0
    };
    
    // Input mappings
    this.inputMap = 'sidescroller';
    
    console.log('🎮 Enhanced SideScroller Scene created');
  }

  async init() {
    console.log('🚀 Initializing Enhanced SideScroller Scene...');
    
    // Initialize systems references
    this.initializeSystems();
    
    // Setup input controls
    this.setupInputControls();
    
    // Create game world
    await this.createGameWorld();
    
    // Setup camera
    this.setupCamera();
    
    // Initialize UI elements
    this.initializeUI();
    
    // Start background music
    this.startBackgroundMusic();
    
    // Initialize achievement tracking
    this.initializeAchievements();
    
    console.log('✅ Enhanced SideScroller Scene initialized');
  }

  initializeSystems() {
    this.systems.combat = this.engine.getSystem('combat');
    this.systems.powerups = this.engine.getSystem('powerups');
    this.systems.achievements = this.engine.getSystem('achievements');
    this.systems.visualEffects = this.engine.getSystem('visualEffects');
    this.systems.enhancedAudio = this.engine.getSystem('enhancedAudio');
    this.systems.performance = this.engine.getSystem('performance');
    
    // Initialize player progress if not exists
    if (this.systems.powerups) {
      this.systems.powerups.initializePlayerProgress('player1');
    }
    
    if (this.systems.achievements) {
      this.systems.achievements.initializePlayerProgress('player1');
    }
  }

  setupInputControls() {
    const inputSystem = this.engine.getSystem('input');
    if (!inputSystem) return;
    
    // Create comprehensive input mapping
    inputSystem.createInputMap(this.inputMap, {
      // Movement
      moveLeft: [
        { type: 'key', code: 'KeyA' },
        { type: 'key', code: 'ArrowLeft' },
        { type: 'gamepad', button: 14 } // D-pad left
      ],
      moveRight: [
        { type: 'key', code: 'KeyD' },
        { type: 'key', code: 'ArrowRight' },
        { type: 'gamepad', button: 15 } // D-pad right
      ],
      jump: [
        { type: 'key', code: 'Space' },
        { type: 'key', code: 'KeyW' },
        { type: 'key', code: 'ArrowUp' },
        { type: 'gamepad', button: 0 } // A button
      ],
      
      // Combat
      attack: [
        { type: 'key', code: 'KeyJ' },
        { type: 'gamepad', button: 1 } // B button
      ],
      heavyAttack: [
        { type: 'key', code: 'KeyK' },
        { type: 'gamepad', button: 2 } // X button
      ],
      block: [
        { type: 'key', code: 'KeyL' },
        { type: 'gamepad', button: 3 } // Y button
      ],
      dodge: [
        { type: 'key', code: 'KeyS' },
        { type: 'key', code: 'ArrowDown' },
        { type: 'gamepad', button: 13 } // D-pad down
      ],
      
      // Special abilities
      special1: [
        { type: 'key', code: 'KeyQ' },
        { type: 'gamepad', button: 4 } // LB
      ],
      special2: [
        { type: 'key', code: 'KeyE' },
        { type: 'gamepad', button: 5 } // RB
      ],
      
      // Game controls
      pause: [
        { type: 'key', code: 'Escape' },
        { type: 'key', code: 'KeyP' },
        { type: 'gamepad', button: 9 } // Menu button
      ]
    });
  }

  async createGameWorld() {
    const entityManager = this.engine.entityManager;
    
    // Create background
    this.createBackground();
    
    // Create player
    this.gameState.playerEntity = this.createPlayer();
    
    // Create initial enemies
    this.spawnInitialEnemies();
    
    // Create environmental elements
    this.createEnvironment();
    
    // Setup lighting
    this.setupWorldLighting();
  }

  createBackground() {
    const entityManager = this.engine.entityManager;
    
    // Create parallax background layers
    const backgroundLayers = [
      { depth: 0.1, color: '#1a1a2e', elements: [] }, // Far background
      { depth: 0.3, color: '#16213e', elements: [] }, // Middle background
      { depth: 0.6, color: '#0f1419', elements: [] }, // Near background
      { depth: 1.0, color: '#000000', elements: [] }  // Foreground elements
    ];
    
    this.gameState.background = {
      layers: backgroundLayers,
      scrollSpeed: 1,
      time: 0
    };
    
    // Create background entities for each layer
    backgroundLayers.forEach((layer, index) => {
      for (let i = 0; i < 5; i++) {
        const bgElement = entityManager.createEntity('background');
        bgElement.transform.x = i * 400;
        bgElement.transform.y = Math.random() * 200;
        bgElement.transform.width = 50 + Math.random() * 100;
        bgElement.transform.height = 50 + Math.random() * 100;
        
        entityManager.addComponent(bgElement.id, 'visual', {
          type: 'rectangle',
          color: layer.color,
          alpha: 0.3 + (index * 0.2),
          layer: index
        });
        
        entityManager.addComponent(bgElement.id, 'parallax', {
          depth: layer.depth,
          originalX: bgElement.transform.x
        });
        
        layer.elements.push(bgElement);
      }
    });
  }

  createPlayer() {
    const entityManager = this.engine.entityManager;
    const player = entityManager.createEntity('player');
    
    // Transform component
    player.transform.x = 100;
    player.transform.y = this.config.groundY - 60;
    player.transform.width = 40;
    player.transform.height = 60;
    
    // Physics component
    entityManager.addComponent(player.id, 'physics', {
      velocity: { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
      mass: 1,
      friction: 0.9,
      gravity: true,
      groundY: this.config.groundY - 60,
      maxSpeed: { x: this.config.playerSpeed, y: 20 }
    });
    
    // Visual component
    entityManager.addComponent(player.id, 'visual', {
      type: 'rectangle',
      color: '#00ff88',
      strokeColor: '#00cc66',
      strokeWidth: 2,
      glow: true,
      glowColor: '#00ff88',
      glowIntensity: 0.5
    });
    
    // Initialize combat system for player
    if (this.systems.combat) {
      this.systems.combat.initializeCombat(player.id, {
        maxHealth: 100,
        maxMana: 50,
        attack: 15,
        defense: 8,
        speed: 1.2,
        criticalChance: 0.15,
        abilities: ['fireball', 'heal', 'shield']
      });
    }
    
    // Initialize sprite animation system for player
    const spriteAnimationSystem = this.engine.getSystem('spriteAnimation');
    if (spriteAnimationSystem) {
      spriteAnimationSystem.initializeEntityAnimation(player.id, 'player');
      // Start with idle animation
      spriteAnimationSystem.playAnimation({
        entityId: player.id,
        animation: 'idle',
        options: { loop: true }
      });
    }
    
    // Animation component
    entityManager.addComponent(player.id, 'animation', {
      currentState: 'idle',
      states: {
        idle: { duration: 1000, loop: true },
        running: { duration: 500, loop: true },
        jumping: { duration: 800, loop: false },
        attacking: { duration: 400, loop: false },
        hurt: { duration: 300, loop: false }
      }
    });
    
    // Input component
    entityManager.addComponent(player.id, 'input', {
      inputMap: this.inputMap,
      controllable: true
    });
    
    // Collision component
    entityManager.addComponent(player.id, 'collision', {
      type: 'player',
      solid: true,
      callback: this.handlePlayerCollision.bind(this)
    });
    
    // Player-specific data
    entityManager.addComponent(player.id, 'player', {
      lives: this.gameState.lives,
      invulnerable: false,
      invulnerabilityTime: 0,
      lastGrounded: true,
      canDoubleJump: false,
      hasDoubleJumped: false
    });
    
    console.log('👤 Player created with enhanced systems');
    return player;
  }

  spawnInitialEnemies() {
    // Spawn a few initial enemies
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.spawnEnemy(800 + i * 300, 'basic');
      }, i * 1000);
    }
  }

  spawnEnemy(x, type = 'basic') {
    const entityManager = this.engine.entityManager;
    const enemy = entityManager.createEntity('enemy');
    
    // Position based on type
    const enemyConfig = this.getEnemyConfig(type);
    
    enemy.transform.x = x;
    enemy.transform.y = this.config.groundY - enemyConfig.height;
    enemy.transform.width = enemyConfig.width;
    enemy.transform.height = enemyConfig.height;
    
    // Physics
    entityManager.addComponent(enemy.id, 'physics', {
      velocity: { x: -enemyConfig.speed, y: 0 },
      acceleration: { x: 0, y: 0 },
      mass: enemyConfig.mass,
      friction: 0.8,
      gravity: true,
      groundY: this.config.groundY - enemyConfig.height
    });
    
    // Visual
    entityManager.addComponent(enemy.id, 'visual', {
      type: 'rectangle',
      color: enemyConfig.color,
      strokeColor: enemyConfig.strokeColor,
      strokeWidth: 2
    });
    
    // Combat
    if (this.systems.combat) {
      this.systems.combat.initializeCombat(enemy.id, {
        maxHealth: enemyConfig.health,
        attack: enemyConfig.attack,
        defense: enemyConfig.defense,
        speed: enemyConfig.speed,
        criticalChance: 0.05
      });
    }
    
    // Initialize sprite animation system for enemy
    const spriteAnimationSystem = this.engine.getSystem('spriteAnimation');
    if (spriteAnimationSystem) {
      spriteAnimationSystem.initializeEntityAnimation(enemy.id, 'enemy');
      // Start with idle animation
      spriteAnimationSystem.playAnimation({
        entityId: enemy.id,
        animation: 'idle',
        options: { loop: true }
      });
    }
    
    // AI
    entityManager.addComponent(enemy.id, 'ai', {
      type: enemyConfig.aiType,
      detectionRadius: 150,
      attackRange: 50,
      patrolSpeed: enemyConfig.speed,
      aggroRange: 200,
      target: null
    });
    
    // Collision
    entityManager.addComponent(enemy.id, 'collision', {
      type: 'enemy',
      solid: true,
      callback: this.handleEnemyCollision.bind(this)
    });
    
    // Enemy-specific data
    entityManager.addComponent(enemy.id, 'enemy', {
      type: type,
      scoreValue: enemyConfig.scoreValue,
      dropChance: enemyConfig.dropChance,
      experienceValue: enemyConfig.experienceValue
    });
    
    this.gameState.enemies.add(enemy);
    
    // Setup AI behavior
    const aiSystem = this.engine.getSystem('ai');
    if (aiSystem) {
      if (enemyConfig.aiType === 'aggressive') {
        aiSystem.makeAggressiveAI(enemy.id);
      } else {
        aiSystem.makeDefensiveAI(enemy.id);
      }
    }
    
    console.log(`👹 ${type} enemy spawned at x: ${x}`);
    return enemy;
  }

  getEnemyConfig(type) {
    const configs = {
      basic: {
        width: 35,
        height: 50,
        health: 30,
        attack: 8,
        defense: 3,
        speed: 1,
        mass: 0.8,
        color: '#ff6b6b',
        strokeColor: '#ee5a52',
        aiType: 'aggressive',
        scoreValue: 100,
        dropChance: 0.3,
        experienceValue: 25
      },
      heavy: {
        width: 50,
        height: 70,
        health: 80,
        attack: 15,
        defense: 8,
        speed: 0.5,
        mass: 1.5,
        color: '#ff4757',
        strokeColor: '#c44569',
        aiType: 'defensive',
        scoreValue: 250,
        dropChance: 0.5,
        experienceValue: 50
      },
      fast: {
        width: 30,
        height: 45,
        health: 20,
        attack: 12,
        defense: 2,
        speed: 2,
        mass: 0.6,
        color: '#ff9ff3',
        strokeColor: '#f368e0',
        aiType: 'aggressive',
        scoreValue: 150,
        dropChance: 0.2,
        experienceValue: 35
      }
    };
    
    return configs[type] || configs.basic;
  }

  createEnvironment() {
    const entityManager = this.engine.entityManager;
    
    // Create platforms
    this.createPlatforms();
    
    // Create decorative elements
    this.createDecorations();
    
    // Create interactive objects
    this.createInteractables();
  }

  createPlatforms() {
    const entityManager = this.engine.entityManager;
    const platformData = [
      { x: 300, y: 350, width: 120, height: 20 },
      { x: 500, y: 280, width: 100, height: 20 },
      { x: 750, y: 320, width: 140, height: 20 },
      { x: 1000, y: 250, width: 80, height: 20 },
      { x: 1300, y: 300, width: 120, height: 20 }
    ];
    
    platformData.forEach(data => {
      const platform = entityManager.createEntity('platform');
      platform.transform.x = data.x;
      platform.transform.y = data.y;
      platform.transform.width = data.width;
      platform.transform.height = data.height;
      
      entityManager.addComponent(platform.id, 'visual', {
        type: 'rectangle',
        color: '#4a90a4',
        strokeColor: '#2c5aa0',
        strokeWidth: 2
      });
      
      entityManager.addComponent(platform.id, 'collision', {
        type: 'platform',
        solid: true,
        oneWay: true // Can jump through from below
      });
      
      entityManager.addComponent(platform.id, 'static', true);
    });
  }

  createDecorations() {
    // Create background decorations like trees, rocks, etc.
    const entityManager = this.engine.entityManager;
    
    for (let i = 0; i < 20; i++) {
      const decoration = entityManager.createEntity('decoration');
      decoration.transform.x = i * 150 + Math.random() * 100;
      decoration.transform.y = this.config.groundY - 30;
      decoration.transform.width = 20 + Math.random() * 40;
      decoration.transform.height = 30 + Math.random() * 50;
      
      entityManager.addComponent(decoration.id, 'visual', {
        type: 'rectangle',
        color: `hsl(${120 + Math.random() * 60}, 40%, 30%)`,
        alpha: 0.6
      });
      
      entityManager.addComponent(decoration.id, 'static', true);
    }
  }

  createInteractables() {
    // Create chests, switches, and other interactive objects
    const entityManager = this.engine.entityManager;
    
    const interactableData = [
      { x: 400, y: this.config.groundY - 40, type: 'chest' },
      { x: 800, y: this.config.groundY - 30, type: 'switch' },
      { x: 1200, y: this.config.groundY - 40, type: 'chest' }
    ];
    
    interactableData.forEach(data => {
      const interactable = entityManager.createEntity('interactable');
      interactable.transform.x = data.x;
      interactable.transform.y = data.y;
      interactable.transform.width = 30;
      interactable.transform.height = 30;
      
      const colors = {
        chest: '#ffd700',
        switch: '#00ffff'
      };
      
      entityManager.addComponent(interactable.id, 'visual', {
        type: 'rectangle',
        color: colors[data.type],
        glow: true,
        glowColor: colors[data.type],
        glowIntensity: 0.3
      });
      
      entityManager.addComponent(interactable.id, 'collision', {
        type: 'interactable',
        callback: (entityId) => this.handleInteraction(interactable.id, entityId)
      });
      
      entityManager.addComponent(interactable.id, 'interactable', {
        type: data.type,
        activated: false,
        reward: data.type === 'chest' ? 'powerup' : 'secret'
      });
    });
  }

  setupWorldLighting() {
    const lightingSystem = this.engine.getSystem('lighting');
    if (!lightingSystem) return;
    
    // Set ambient lighting for day/night cycle
    lightingSystem.setAmbientLight(30, 30, 50, 0.4);
    
    // Add main sunlight
    lightingSystem.createDirectionalLight('sun', 
      Math.PI / 4, 300, { r: 255, g: 240, b: 200 }, 0.6
    );
    
    // Add atmospheric lights
    lightingSystem.createPointLight('atmosphere1', 
      200, 100, 400, { r: 100, g: 150, b: 255 }, 0.3
    );
    
    lightingSystem.createPointLight('atmosphere2', 
      800, 150, 350, { r: 255, g: 150, b: 100 }, 0.25
    );
  }

  setupCamera() {
    const visualEffects = this.systems.visualEffects;
    if (!visualEffects) return;
    
    // Setup camera to follow player
    visualEffects.setCameraTarget({
      entityId: this.gameState.playerEntity.id,
      smoothing: this.config.cameraSmoothing,
      offset: { x: -200, y: -100 }
    });
    
    // Set camera bounds
    const camera = visualEffects.camera;
    camera.bounds = {
      left: 0,
      right: this.config.worldWidth - 800,
      top: 0,
      bottom: this.config.worldHeight - 600
    };
  }

  initializeUI() {
    // UI will be handled by React components
    // This method can trigger UI events
    this.engine.eventBus.emit('ui:gameStarted', {
      playerHealth: 100,
      playerMana: 50,
      score: this.gameState.score,
      level: this.gameState.level,
      lives: this.gameState.lives
    });
  }

  startBackgroundMusic() {
    if (this.systems.enhancedAudio) {
      this.systems.enhancedAudio.playMusic({
        track: 'background_main',
        volume: 0.6,
        loop: true,
        fadeIn: 2
      });
      
      this.systems.enhancedAudio.playAmbient({
        track: 'wind_ambient',
        volume: 0.3,
        loop: true,
        fadeIn: 3
      });
    }
  }

  initializeAchievements() {
    if (this.systems.achievements) {
      this.systems.achievements.resetSession();
    }
  }

  update(deltaTime) {
    if (this.gameState.paused || this.gameState.gameOver) return;
    
    // Update game time
    this.gameState.time += deltaTime;
    
    // Update timers
    this.updateTimers(deltaTime);
    
    // Handle input
    this.handleInput();
    
    // Update background
    this.updateBackground(deltaTime);
    
    // Spawn enemies
    this.updateEnemySpawning(deltaTime);
    
    // Spawn power-ups
    this.updatePowerUpSpawning(deltaTime);
    
    // Update difficulty
    this.updateDifficulty(deltaTime);
    
    // Clean up off-screen entities
    this.cleanupEntities();
    
    // Update UI
    this.updateUI();
  }

  updateTimers(deltaTime) {
    this.timers.enemySpawn += deltaTime;
    this.timers.powerUpSpawn += deltaTime;
    this.timers.difficultyIncrease += deltaTime;
    this.timers.backgroundUpdate += deltaTime;
  }

  handleInput() {
    const inputSystem = this.engine.getSystem('input');
    const spriteAnimationSystem = this.engine.getSystem('spriteAnimation');
    if (!inputSystem) return;
    
    // Handle pause
    if (inputSystem.wasActionPressed(this.inputMap, 'pause')) {
      this.togglePause();
    }
    
    // Get player entity
    const player = this.gameState.playerEntity;
    if (!player) return;
    
    const physics = this.engine.entityManager.getComponent(player.id, 'physics');
    const combat = this.engine.entityManager.getComponent(player.id, 'combat');
    
    if (!physics) return;
    
    let currentAnimation = 'idle';
    let isMoving = false;
    
    // Movement handling with animations
    if (inputSystem.isActionPressed(this.inputMap, 'moveLeft')) {
      physics.velocity.x = -this.config.playerSpeed;
      player.transform.flipX = true;
      isMoving = true;
      currentAnimation = 'run';
    } else if (inputSystem.isActionPressed(this.inputMap, 'moveRight')) {
      physics.velocity.x = this.config.playerSpeed;
      player.transform.flipX = false;
      isMoving = true;
      currentAnimation = 'run';
    } else {
      physics.velocity.x *= 0.85; // Apply friction
    }
    
    // Jump with animation
    if (inputSystem.wasActionPressed(this.inputMap, 'jump') && physics.grounded) {
      physics.velocity.y = -15;
      physics.grounded = false;
      currentAnimation = 'jump';
      
      if (spriteAnimationSystem) {
        spriteAnimationSystem.playAnimation({
          entityId: player.id,
          animation: 'jump',
          options: { loop: false }
        });
      }
    }
    
    // Attack with animation and effects
    if (inputSystem.wasActionPressed(this.inputMap, 'attack') && combat) {
      if (combat.attackCooldown <= 0) {
        combat.attacking = true;
        combat.attackCooldown = 500; // 500ms cooldown
        
        // Determine attack type based on combo
        let attackAnim = 'attack';
        if (Date.now() - combat.lastAttackTime < 800) {
          combat.comboCount++;
          if (combat.comboCount >= 3) {
            attackAnim = 'heavy_attack';
            combat.comboCount = 0;
          }
        } else {
          combat.comboCount = 1;
        }
        
        combat.lastAttackTime = Date.now();
        
        if (spriteAnimationSystem) {
          spriteAnimationSystem.playAnimation({
            entityId: player.id,
            animation: attackAnim,
            options: { 
              loop: false,
              transition: 150
            }
          });
          
          // Queue return to appropriate animation
          spriteAnimationSystem.queueAnimation({
            entityId: player.id,
            animation: isMoving ? 'run' : 'idle',
            options: { loop: true }
          });
        }
        
        // Create attack area for collision detection
        this.createAttackArea(player);
      }
    }
    
    // Block with animation
    if (inputSystem.isActionPressed(this.inputMap, 'block') && combat) {
      combat.blocking = true;
      currentAnimation = 'block';
      
      if (spriteAnimationSystem && !spriteAnimationSystem.isAnimationPlaying(player.id, 'block')) {
        spriteAnimationSystem.playAnimation({
          entityId: player.id,
          animation: 'block',
          options: { loop: true }
        });
      }
    } else if (combat) {
      combat.blocking = false;
    }
    
    // Only update to idle/run if not attacking, jumping, or blocking
    if (spriteAnimationSystem && !combat?.attacking && physics?.grounded && !combat?.blocking) {
      const currentState = spriteAnimationSystem.getAnimationState(player.id);
      if (currentState && (currentAnimation !== currentState.currentAnimation || !currentState.playing)) {
        spriteAnimationSystem.playAnimation({
          entityId: player.id,
          animation: currentAnimation,
          options: { 
            loop: true,
            transition: 100
          }
        });
      }
    }
    
    // Player movement and combat handled by individual systems
  }

  updateBackground(deltaTime) {
    if (!this.gameState.background) return;
    
    this.gameState.background.time += deltaTime;
    
    // Update parallax scrolling
    const cameraX = this.systems.visualEffects?.getCameraPosition().x || 0;
    
    this.gameState.background.layers.forEach(layer => {
      layer.elements.forEach(element => {
        const parallax = this.engine.entityManager.getComponent(element.id, 'parallax');
        if (parallax) {
          element.transform.x = parallax.originalX - (cameraX * layer.depth);
        }
      });
    });
  }

  updateEnemySpawning(deltaTime) {
    if (this.timers.enemySpawn > this.config.spawnRate / this.config.difficultyScale) {
      this.timers.enemySpawn = 0;
      
      // Spawn enemy off-screen to the right
      const cameraX = this.systems.visualEffects?.getCameraPosition().x || 0;
      const spawnX = cameraX + 1000 + Math.random() * 200;
      
      // Choose enemy type based on level
      let enemyType = 'basic';
      if (this.gameState.level > 3) {
        const rand = Math.random();
        if (rand < 0.3) enemyType = 'heavy';
        else if (rand < 0.6) enemyType = 'fast';
      }
      
      this.spawnEnemy(spawnX, enemyType);
    }
  }

  updatePowerUpSpawning(deltaTime) {
    if (this.timers.powerUpSpawn > 8000) { // Every 8 seconds
      this.timers.powerUpSpawn = 0;
      
      const cameraX = this.systems.visualEffects?.getCameraPosition().x || 0;
      const spawnX = cameraX + 600 + Math.random() * 400;
      const spawnY = this.config.groundY - 100 - Math.random() * 200;
      
      // Choose random power-up type
      const powerUpTypes = ['speed', 'strength', 'defense', 'healthSmall', 'manaPotion'];
      const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
      
      if (this.systems.powerups) {
        this.systems.powerups.spawnPowerUp(spawnX, spawnY, randomType);
      }
    }
  }

  updateDifficulty(deltaTime) {
    if (this.timers.difficultyIncrease > 30000) { // Every 30 seconds
      this.timers.difficultyIncrease = 0;
      this.config.difficultyScale += 0.1;
      this.gameState.level++;
      
      // Trigger level up effects
      this.triggerLevelUp();
      
      console.log(`📈 Level ${this.gameState.level} - Difficulty: ${this.config.difficultyScale.toFixed(1)}`);
    }
  }

  triggerLevelUp() {
    // Visual effects
    if (this.systems.visualEffects) {
      this.systems.visualEffects.triggerScreenFlash({
        color: '#00ff88',
        intensity: 0.5,
        duration: 500
      });
    }
    
    // Audio feedback
    if (this.systems.enhancedAudio) {
      this.systems.enhancedAudio.eventBus.emit('audio:playSound', {
        sound: 'level_up',
        volume: 0.8
      });
    }
    
    // UI notification
    this.engine.eventBus.emit('ui:levelUp', {
      newLevel: this.gameState.level,
      difficulty: this.config.difficultyScale
    });
  }

  cleanupEntities() {
    const cameraX = this.systems.visualEffects?.getCameraPosition().x || 0;
    const despawnDistance = 200;
    
    // Clean up enemies that are too far behind the camera
    this.gameState.enemies.forEach(enemy => {
      if (enemy.transform.x < cameraX - despawnDistance) {
        this.engine.entityManager.removeEntity(enemy.id);
        this.gameState.enemies.delete(enemy);
      }
    });
  }

  updateUI() {
    // Update UI with current game state
    const playerCombat = this.systems.combat?.getCombatData(this.gameState.playerEntity?.id);
    
    if (playerCombat) {
      this.engine.eventBus.emit('ui:updateStats', {
        health: playerCombat.health,
        maxHealth: playerCombat.maxHealth,
        mana: playerCombat.mana,
        maxMana: playerCombat.maxMana,
        score: this.gameState.score,
        level: this.gameState.level,
        time: Math.floor(this.gameState.time / 1000)
      });
    }
  }

  // Event handlers
  handlePlayerCollision(playerEntity, otherEntity) {
    const otherType = this.engine.entityManager.getComponent(otherEntity.id, 'collision')?.type;
    
    switch (otherType) {
      case 'enemy':
        this.handlePlayerEnemyCollision(playerEntity, otherEntity);
        break;
      case 'powerup':
        this.handlePlayerPowerUpCollision(playerEntity, otherEntity);
        break;
      case 'interactable':
        this.handlePlayerInteractableCollision(playerEntity, otherEntity);
        break;
    }
  }

  handlePlayerEnemyCollision(player, enemy) {
    const playerData = this.engine.entityManager.getComponent(player.id, 'player');
    
    if (playerData && !playerData.invulnerable) {
      // Trigger combat
      this.engine.eventBus.emit('combat:attack', {
        attackerId: enemy.id,
        targetId: player.id,
        attackType: 'basic',
        damage: 10
      });
      
      // Knockback effect
      const playerPhysics = this.engine.entityManager.getComponent(player.id, 'physics');
      if (playerPhysics) {
        playerPhysics.velocity.x += (player.transform.x < enemy.transform.x) ? -5 : 5;
      }
      
      // Visual feedback
      if (this.systems.visualEffects) {
        this.systems.visualEffects.triggerScreenShake({
          intensity: 5,
          duration: 200
        });
      }
    }
  }

  handlePlayerPowerUpCollision(player, powerUp) {
    // Power-up collection handled by PowerUpSystem
    console.log('🎁 Power-up collected!');
  }

  handlePlayerInteractableCollision(player, interactable) {
    this.handleInteraction(interactable.id, player.id);
  }

  handleInteraction(interactableId, playerId) {
    const interactableData = this.engine.entityManager.getComponent(interactableId, 'interactable');
    
    if (interactableData && !interactableData.activated) {
      interactableData.activated = true;
      
      switch (interactableData.type) {
        case 'chest':
          this.openChest(interactableId);
          break;
        case 'switch':
          this.activateSwitch(interactableId);
          break;
      }
    }
  }

  openChest(chestId) {
    // Spawn reward
    const chest = this.engine.entityManager.getEntity(chestId);
    if (this.systems.powerups && chest) {
      // Spawn a rare power-up
      const rareTypes = ['invulnerability', 'doubleJump', 'maxHealthUp'];
      const rewardType = rareTypes[Math.floor(Math.random() * rareTypes.length)];
      
      this.systems.powerups.spawnPowerUp(
        chest.transform.x,
        chest.transform.y - 50,
        rewardType
      );
    }
    
    // Visual effects
    if (this.systems.visualEffects) {
      this.systems.visualEffects.createParticleEffect({
        x: chest.transform.x + chest.transform.width / 2,
        y: chest.transform.y,
        type: 'treasure',
        count: 20,
        color: '#ffd700'
      });
    }
    
    // Audio
    if (this.systems.enhancedAudio) {
      this.systems.enhancedAudio.eventBus.emit('audio:playSound', {
        sound: 'chest_open',
        volume: 0.7
      });
    }
    
    // Achievement
    if (this.systems.achievements) {
      this.systems.achievements.eventBus.emit('secret:found', { playerId: 'player1' });
    }
    
    console.log('📦 Chest opened!');
  }

  activateSwitch(switchId) {
    // Trigger some environmental change
    console.log('🔧 Switch activated!');
    
    // Could open doors, reveal platforms, etc.
    // For now, just give points
    this.addScore(500);
  }

  addScore(points) {
    this.gameState.score += points;
    
    // Trigger score event for achievements
    if (this.systems.achievements) {
      this.systems.achievements.eventBus.emit('score:add', {
        source: 'general',
        baseValue: points,
        playerId: 'player1'
      });
    }
    
    console.log(`💰 +${points} points! Total: ${this.gameState.score}`);
  }

  togglePause() {
    this.gameState.paused = !this.gameState.paused;
    
    if (this.gameState.paused) {
      // Pause audio
      if (this.systems.enhancedAudio) {
        // Would implement pause functionality
      }
      
      console.log('⏸️ Game paused');
    } else {
      console.log('▶️ Game resumed');
    }
    
    this.engine.eventBus.emit('ui:pauseToggled', {
      paused: this.gameState.paused
    });
  }

  gameOver() {
    this.gameState.gameOver = true;
    
    // Stop music
    if (this.systems.enhancedAudio) {
      this.systems.enhancedAudio.stopMusic({ fadeOut: 2 });
    }
    
    // Trigger game over effects
    if (this.systems.visualEffects) {
      this.systems.visualEffects.triggerFadeOut({ duration: 2000 });
    }
    
    // Save final score
    if (this.systems.achievements) {
      this.systems.achievements.eventBus.emit('game:gameOver', {
        playerId: 'player1',
        finalScore: this.gameState.score
      });
    }
    
    console.log('💀 Game Over! Final Score:', this.gameState.score);
    
    this.engine.eventBus.emit('ui:gameOver', {
      score: this.gameState.score,
      level: this.gameState.level,
      time: Math.floor(this.gameState.time / 1000)
    });
  }

  render(ctx) {
    // Additional scene-specific rendering can go here
    // Most rendering is handled by the render system
    
    if (this.gameState.paused) {
      // Render pause overlay
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', ctx.canvas.width / 2, ctx.canvas.height / 2);
      ctx.restore();
    }
  }

  createAttackArea(player) {
    const attackWidth = 60;
    const attackHeight = 40;
    const attackX = player.transform.flipX 
      ? player.transform.x - attackWidth 
      : player.transform.x + player.transform.width;
    const attackY = player.transform.y + 10;
    
    // Create temporary attack entity for collision detection
    const attackEntity = this.engine.entityManager.createEntity('attack');
    attackEntity.transform.x = attackX;
    attackEntity.transform.y = attackY;
    attackEntity.transform.width = attackWidth;
    attackEntity.transform.height = attackHeight;
    
    this.engine.entityManager.addComponent(attackEntity.id, 'collision', {
      type: 'attack',
      damage: 25,
      owner: player.id,
      temporary: true,
      duration: 200 // Remove after 200ms
    });
    
    // Create visual effect for attack
    const visualEffects = this.engine.getSystem('visualEffects');
    if (visualEffects) {
      visualEffects.createSlashEffect({
        x: attackX + attackWidth / 2,
        y: attackY + attackHeight / 2,
        direction: player.transform.flipX ? -1 : 1,
        color: '#00ff88'
      });
    }
    
    // Schedule attack entity removal
    setTimeout(() => {
      this.engine.entityManager.removeEntity(attackEntity.id);
    }, 200);
  }

  cleanup() {
    // Clean up scene resources
    console.log('🧹 Cleaning up Enhanced SideScroller Scene...');
    
    // Stop audio
    if (this.systems.enhancedAudio) {
      this.systems.enhancedAudio.stopAll({ fadeOut: 1 });
    }
    
    // Clear all entities
    this.gameState.enemies.clear();
    this.gameState.powerUps.clear();
    this.gameState.particles.clear();
    
    super.cleanup();
  }
}

export default EnhancedSideScrollerScene;