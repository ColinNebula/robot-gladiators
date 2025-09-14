/**
 * Game Integration Layer - Bridge between React and Nebula Engine
 * 
 * This component demonstrates how to integrate the new modular game engine
 * with the existing React application structure.
 */

import React, { useEffect, useRef, useState } from 'react';
import GameEngine from '../engine/GameEngine.js';

// Game scenes
class GameplayScene extends Scene {
  constructor(engine, sceneManager) {
    super(engine, sceneManager);
    this.players = [];
    this.projectiles = [];
    this.particles = [];
  }

  async init() {
    console.log('🎮 Gameplay scene initializing...');
    
    // Create player entities using the new ECS system
    this.createPlayers();
    
    // Setup game world
    this.setupWorld();
    
    // Setup input mappings
    this.setupInput();
  }

  createPlayers() {
    const entityManager = this.engine.entityManager;
    
    // Create player 1
    const player1 = entityManager.createEntity('player');
    player1.transform.x = 100;
    player1.transform.y = 300;
    player1.transform.width = 40;
    player1.transform.height = 60;
    
    // Add components
    entityManager.addComponent(player1.id, 'physics', {
      velocity: { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
      mass: 1,
      friction: 0.9,
      gravity: true
    });
    
    entityManager.addComponent(player1.id, 'sprite', {
      imagePath: '/assets/sprites/player1.png',
      frameWidth: 40,
      frameHeight: 60,
      currentFrame: 0
    });
    
    entityManager.addComponent(player1.id, 'collider', {
      layer: 'player',
      shape: 'rectangle',
      isTrigger: false
    });
    
    entityManager.addComponent(player1.id, 'health', {
      maxHealth: 100,
      currentHealth: 100
    });
    
    entityManager.addComponent(player1.id, 'input', {
      gamepadIndex: 0
    });
    
    this.players.push(player1);
    
    // Create player 2 (similar setup)
    const player2 = entityManager.createEntity('player');
    player2.transform.x = 200;
    player2.transform.y = 300;
    player2.transform.width = 40;
    player2.transform.height = 60;
    
    // Add similar components for player 2
    entityManager.addComponent(player2.id, 'physics', {
      velocity: { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
      mass: 1,
      friction: 0.9,
      gravity: true
    });
    
    entityManager.addComponent(player2.id, 'sprite', {
      imagePath: '/assets/sprites/player2.png',
      frameWidth: 40,
      frameHeight: 60,
      currentFrame: 0
    });
    
    entityManager.addComponent(player2.id, 'collider', {
      layer: 'player',
      shape: 'rectangle',
      isTrigger: false
    });
    
    entityManager.addComponent(player2.id, 'health', {
      maxHealth: 100,
      currentHealth: 100
    });
    
    entityManager.addComponent(player2.id, 'input', {
      gamepadIndex: 1
    });
    
    this.players.push(player2);
  }

  setupWorld() {
    // Create world bounds and platforms
    const entityManager = this.engine.entityManager;
    
    // Ground platform
    const ground = entityManager.createEntity('terrain');
    ground.transform.x = 0;
    ground.transform.y = 450;
    ground.transform.width = 1200;
    ground.transform.height = 50;
    
    entityManager.addComponent(ground.id, 'collider', {
      layer: 'terrain',
      shape: 'rectangle',
      isTrigger: false
    });
    
    entityManager.addComponent(ground.id, 'shape', {
      type: 'rectangle',
      fillColor: '#444444',
      strokeColor: '#666666',
      strokeWidth: 2
    });
  }

  setupInput() {
    const inputSystem = this.engine.getSystem('input');
    
    // Listen for input events
    this.engine.on('input:keydown', (event) => {
      this.handleInput(event.data);
    });
  }

  handleInput(inputData) {
    const { code } = inputData;
    const physicsSystem = this.engine.getSystem('physics');
    
    // Handle player movement
    this.players.forEach((player, index) => {
      const physics = this.engine.entityManager.getComponent(player.id, 'physics');
      
      if (index === 0) { // Player 1 controls
        switch (code) {
          case 'KeyA':
          case 'ArrowLeft':
            physicsSystem.applyForce(player.id, -500, 0);
            break;
          case 'KeyD':
          case 'ArrowRight':
            physicsSystem.applyForce(player.id, 500, 0);
            break;
          case 'KeyW':
          case 'ArrowUp':
            if (physics.grounded) {
              physicsSystem.applyImpulse(player.id, 0, -300);
            }
            break;
          case 'Space':
            this.createProjectile(player);
            break;
        }
      }
    });
  }

  createProjectile(player) {
    const entityManager = this.engine.entityManager;
    const particleSystem = this.engine.getSystem('particles');
    
    // Create projectile entity
    const projectile = entityManager.createEntity('projectile');
    projectile.transform.x = player.transform.x + player.transform.width / 2;
    projectile.transform.y = player.transform.y + player.transform.height / 2;
    projectile.transform.width = 8;
    projectile.transform.height = 8;
    
    entityManager.addComponent(projectile.id, 'physics', {
      velocity: { x: 400, y: -100 },
      acceleration: { x: 0, y: 0 },
      mass: 0.1,
      friction: 0.99,
      gravity: true
    });
    
    entityManager.addComponent(projectile.id, 'shape', {
      type: 'circle',
      fillColor: '#ffff00',
      strokeColor: '#ffaa00',
      strokeWidth: 1
    });
    
    entityManager.addComponent(projectile.id, 'collider', {
      layer: 'projectile',
      shape: 'circle',
      isTrigger: false
    });
    
    entityManager.addComponent(projectile.id, 'projectile', {
      damage: 10,
      lifetime: 3,
      knockbackForce: 200
    });
    
    // Create muzzle flash effect
    particleSystem.createSparks(
      projectile.transform.x,
      projectile.transform.y,
      15
    );
    
    // Play sound effect
    const audioSystem = this.engine.getSystem('audio');
    audioSystem.playSound('/assets/audio/shoot.wav', { volume: 0.5 });
  }

  update(deltaTime) {
    // Handle projectile collisions
    this.handleProjectileCollisions();
    
    // Update game logic
    this.updateGameLogic(deltaTime);
  }

  handleProjectileCollisions() {
    // Listen for collision events
    this.engine.on('collision', (event) => {
      const { entityA, entityB, collision } = event.data;
      
      const entityManagerr = this.engine.entityManager;
      const entityAObj = entityManagerr.getEntity(entityA);
      const entityBObj = entityManagerr.getEntity(entityB);
      
      // Check if projectile hit player
      if (entityAObj?.tag === 'projectile' && entityBObj?.tag === 'player') {
        this.handleProjectileHit(entityAObj, entityBObj, collision);
      } else if (entityBObj?.tag === 'projectile' && entityAObj?.tag === 'player') {
        this.handleProjectileHit(entityBObj, entityAObj, collision);
      }
    });
  }

  handleProjectileHit(projectile, player, collision) {
    const entityManager = this.engine.entityManager;
    const physicsSystem = this.engine.getSystem('physics');
    const particleSystem = this.engine.getSystem('particles');
    const audioSystem = this.engine.getSystem('audio');
    
    // Get components
    const projectileData = entityManager.getComponent(projectile.id, 'projectile');
    const playerHealth = entityManager.getComponent(player.id, 'health');
    
    if (!projectileData || !playerHealth) return;
    
    // Apply damage
    playerHealth.currentHealth -= projectileData.damage;
    
    // Apply knockback
    const direction = Math.atan2(
      player.transform.y - projectile.transform.y,
      player.transform.x - projectile.transform.x
    );
    
    physicsSystem.applyKnockback(player.id, projectileData.knockbackForce, direction);
    
    // Create hit effect
    particleSystem.createExplosion(
      collision.point.x,
      collision.point.y,
      0.5
    );
    
    // Play hit sound
    audioSystem.playSound('/assets/audio/hit.wav', { volume: 0.7 });
    
    // Destroy projectile
    entityManager.destroyEntity(projectile.id);
    
    // Check for player defeat
    if (playerHealth.currentHealth <= 0) {
      this.handlePlayerDefeated(player);
    }
  }

  handlePlayerDefeated(player) {
    const particleSystem = this.engine.getSystem('particles');
    const audioSystem = this.engine.getSystem('audio');
    
    // Create defeat effect
    particleSystem.createExplosion(
      player.transform.x + player.transform.width / 2,
      player.transform.y + player.transform.height / 2,
      1.5
    );
    
    // Play defeat sound
    audioSystem.playSound('/assets/audio/defeat.wav', { volume: 0.8 });
    
    // Transition to game over scene
    setTimeout(() => {
      this.changeScene('gameOver', 'fade', { winner: player.tag === 'player' ? 'Player 2' : 'Player 1' });
    }, 2000);
  }

  updateGameLogic(deltaTime) {
    // Update projectile lifetimes
    const projectiles = this.engine.entityManager.getEntitiesByTag('projectile');
    
    projectiles.forEach(projectile => {
      const projectileData = this.engine.entityManager.getComponent(projectile.id, 'projectile');
      if (projectileData) {
        projectileData.timeAlive += deltaTime;
        
        if (projectileData.timeAlive >= projectileData.lifetime) {
          this.engine.entityManager.destroyEntity(projectile.id);
        }
      }
    });
  }

  render(ctx) {
    // Background rendering
    ctx.fillStyle = '#001122';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // The engine systems will handle entity rendering automatically
    
    // Render UI elements
    this.renderUI(ctx);
  }

  renderUI(ctx) {
    // Render health bars
    this.players.forEach((player, index) => {
      const health = this.engine.entityManager.getComponent(player.id, 'health');
      if (health) {
        const x = index === 0 ? 50 : ctx.canvas.width - 250;
        const y = 50;
        
        // Health bar background
        ctx.fillStyle = '#333333';
        ctx.fillRect(x, y, 200, 20);
        
        // Health bar fill
        const healthPercent = health.currentHealth / health.maxHealth;
        const barColor = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        
        ctx.fillStyle = barColor;
        ctx.fillRect(x, y, 200 * healthPercent, 20);
        
        // Health bar border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, 200, 20);
        
        // Player name
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.fillText(`Player ${index + 1}`, x, y - 5);
      }
    });
  }
}

// React component for the new engine integration
export const NebulaGameEngine = ({ gameMode, player1Character, player2Character }) => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [engineReady, setEngineReady] = useState(false);
  const [engineStats, setEngineStats] = useState(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize the game engine
    const initializeEngine = async () => {
      try {
        // Create engine instance
        const engine = new GameEngine(canvasRef.current, {
          targetFPS: 60,
          enableDebug: true,
          enableProfiling: true
        });

        // Register game scenes
        engine.sceneManager.registerScene('gameplay', GameplayScene, {
          preloadAssets: [
            '/assets/sprites/player1.png',
            '/assets/sprites/player2.png',
            '/assets/audio/shoot.wav',
            '/assets/audio/hit.wav',
            '/assets/audio/defeat.wav'
          ]
        });

        // Store engine reference
        engineRef.current = engine;

        // Start the engine
        await engine.start();

        // Start the gameplay scene
        await engine.sceneManager.changeScene('gameplay', 'fade');

        setEngineReady(true);

        // Setup performance monitoring
        const updateStats = () => {
          if (engine) {
            setEngineStats(engine.getPerformanceStats());
          }
        };

        const statsInterval = setInterval(updateStats, 1000);

        return () => {
          clearInterval(statsInterval);
          if (engine) {
            engine.destroy();
          }
        };

      } catch (error) {
        console.error('Failed to initialize game engine:', error);
      }
    };

    const cleanup = initializeEngine();

    return () => {
      if (cleanup && typeof cleanup.then === 'function') {
        cleanup.then(cleanupFn => cleanupFn && cleanupFn());
      }
    };
  }, []);

  return (
    <div className="nebula-game-container">
      <canvas
        ref={canvasRef}
        width={1200}
        height={500}
        style={{
          border: '2px solid #333',
          background: '#000',
          display: 'block',
          margin: '0 auto'
        }}
      />
      
      {/* Debug Information */}
      {engineReady && engineStats && (
        <div className="engine-debug" style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: '#00ff00',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          <div>FPS: {engineStats.getCurrentFPS().toFixed(1)}</div>
          <div>Frame Time: {engineStats.getFrameTime().toFixed(2)}ms</div>
          <div>Memory: {(engineStats.getMemoryUsage().used || 0).toFixed(1)}MB</div>
          <div>Entities: {engineRef.current?.entityManager.getEntityCount() || 0}</div>
        </div>
      )}

      {/* Game Instructions */}
      <div className="game-instructions" style={{
        marginTop: '20px',
        textAlign: 'center',
        color: '#ffffff'
      }}>
        <h3>🎮 Controls</h3>
        <p><strong>Player 1:</strong> Arrow Keys (Move), Space (Shoot)</p>
        <p><strong>Player 2:</strong> WASD (Move), Shift (Shoot)</p>
        <p><strong>Gamepad Support:</strong> Xbox and PlayStation controllers supported!</p>
      </div>
    </div>
  );
};

export default NebulaGameEngine;