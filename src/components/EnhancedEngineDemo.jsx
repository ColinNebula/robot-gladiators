/**
 * Enhanced Game Engine Demo
 * 
 * Demonstrates the advanced capabilities of the Nebula Wars engine
 * including AI, advanced animations, lighting, state management, and memory pooling.
 */

import React, { useEffect, useRef, useState } from 'react';
import GameEngine from '../engine/GameEngine.js';
import { Scene } from '../engine/core/SceneManager.js';

// Enhanced Demo Scene
class EnhancedDemoScene extends Scene {
  constructor(engine, sceneManager) {
    super(engine, sceneManager);
    this.entities = [];
    this.lightDemo = false;
    this.aiDemo = false;
    this.animationDemo = false;
  }

  async init() {
    console.log('🚀 Enhanced Demo Scene initializing...');
    
    // Setup enhanced demo
    this.setupDemoEntities();
    this.setupLightingDemo();
    this.setupAIDemo();
    this.setupAnimationDemo();
    this.setupInputHandling();
    
    // Start demonstrations
    this.startDemoCycle();
  }

  setupDemoEntities() {
    const entityManager = this.engine.entityManager;
    const memorySystem = this.engine.getSystem('memory');
    
    // Create player entity with enhanced components
    const player = entityManager.createEntity('player');
    player.transform.x = 200;
    player.transform.y = 300;
    player.transform.width = 40;
    player.transform.height = 60;
    
    // Add enhanced components
    entityManager.addComponent(player.id, 'physics', {
      velocity: { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
      mass: 1,
      friction: 0.9,
      gravity: true
    });
    
    entityManager.addComponent(player.id, 'shape', {
      type: 'rectangle',
      fillColor: '#00ff88',
      strokeColor: '#00cc66',
      strokeWidth: 2
    });
    
    entityManager.addComponent(player.id, 'light', {
      type: 'point',
      radius: 120,
      intensity: 0.8,
      color: { r: 0, g: 255, b: 136 }
    });
    
    entityManager.addComponent(player.id, 'animator', {
      currentAnimation: 'idle',
      speed: 1,
      loop: true
    });
    
    this.entities.push(player);
    
    // Create AI enemies
    for (let i = 0; i < 3; i++) {
      const enemy = this.createAIEnemy(400 + i * 150, 250 + Math.random() * 100);
      this.entities.push(enemy);
    }
    
    // Create interactive objects
    for (let i = 0; i < 5; i++) {
      const object = this.createInteractiveObject(
        100 + i * 200,
        400,
        ['particle', 'light', 'animation'][i % 3]
      );
      this.entities.push(object);
    }
  }

  createAIEnemy(x, y) {
    const entityManager = this.engine.entityManager;
    const aiSystem = this.engine.getSystem('ai');
    
    const enemy = entityManager.createEntity('enemy');
    enemy.transform.x = x;
    enemy.transform.y = y;
    enemy.transform.width = 35;
    enemy.transform.height = 55;
    
    entityManager.addComponent(enemy.id, 'physics', {
      velocity: { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
      mass: 0.8,
      friction: 0.85,
      gravity: true
    });
    
    entityManager.addComponent(enemy.id, 'shape', {
      type: 'rectangle',
      fillColor: '#ff6b6b',
      strokeColor: '#ee5a52',
      strokeWidth: 2
    });
    
    entityManager.addComponent(enemy.id, 'ai', {
      type: 'aggressive',
      detectionRadius: 150,
      attackRange: 50,
      patrolDirection: 1
    });
    
    entityManager.addComponent(enemy.id, 'health', {
      maxHealth: 100,
      currentHealth: 100
    });
    
    // Setup AI behavior
    aiSystem.makeAggressiveAI(enemy.id);
    
    return enemy;
  }

  createInteractiveObject(x, y, type) {
    const entityManager = this.engine.entityManager;
    
    const obj = entityManager.createEntity('interactive');
    obj.transform.x = x;
    obj.transform.y = y;
    obj.transform.width = 30;
    obj.transform.height = 30;
    obj.tag = type;
    
    entityManager.addComponent(obj.id, 'shape', {
      type: 'circle',
      fillColor: this.getColorForType(type),
      strokeColor: '#ffffff',
      strokeWidth: 1
    });
    
    // Add type-specific components
    switch (type) {
      case 'particle':
        entityManager.addComponent(obj.id, 'particleEmitter', {
          rate: 20,
          color: '#ffff00',
          lifetime: 2000
        });
        break;
        
      case 'light':
        entityManager.addComponent(obj.id, 'light', {
          type: 'point',
          radius: 80,
          intensity: 0.6,
          color: { r: 255, g: 200, b: 100 }
        });
        break;
        
      case 'animation':
        entityManager.addComponent(obj.id, 'animator', {
          currentAnimation: 'pulse',
          speed: 2,
          loop: true
        });
        break;
    }
    
    return obj;
  }

  getColorForType(type) {
    const colors = {
      particle: '#ffff00',
      light: '#ffc864',
      animation: '#64ffda'
    };
    return colors[type] || '#ffffff';
  }

  setupLightingDemo() {
    const lightingSystem = this.engine.getSystem('lighting');
    
    // Setup ambient lighting
    lightingSystem.setAmbientLight(20, 20, 40, 0.3);
    
    // Create dynamic lights
    const mainLight = lightingSystem.createPointLight(
      'main', 400, 200, 200, { r: 255, g: 240, b: 200 }, 0.7
    );
    
    const accentLight = lightingSystem.createSpotLight(
      'accent', 800, 150, Math.PI / 4, Math.PI / 3, 150, { r: 100, g: 200, b: 255 }, 0.8
    );
    
    // Add lighting effects
    lightingSystem.pulseLight('main', 1.5, 0.2);
    lightingSystem.flickerLight('accent', 0.1, 150);
    
    // Animate accent light
    lightingSystem.animateLight('accent', {
      duration: 4000,
      loop: true,
      position: {
        start: { x: 800, y: 150 },
        end: { x: 1000, y: 250 }
      },
      direction: {
        start: Math.PI / 4,
        end: Math.PI / 2
      }
    });
  }

  setupAIDemo() {
    const aiSystem = this.engine.getSystem('ai');
    
    // Setup enhanced AI behaviors
    this.aiDemoTimer = 0;
    this.aiDemoState = 'patrol';
  }

  setupAnimationDemo() {
    const animationSystem = this.engine.getSystem('animation');
    
    // Create demo timeline
    const timeline = animationSystem.createTimeline('demo', {
      duration: 8000,
      loop: true
    });
    
    // Add animation tracks for entities
    this.entities.forEach((entity, index) => {
      if (entity.tag === 'animation') {
        timeline.addTrack({
          target: { type: 'entity', id: entity.id },
          property: 'position.y',
          keyframes: [
            { time: 0, value: entity.transform.y },
            { time: 2000 + index * 500, value: entity.transform.y - 50 },
            { time: 4000 + index * 500, value: entity.transform.y },
            { time: 6000 + index * 500, value: entity.transform.y + 30 },
            { time: 8000, value: entity.transform.y }
          ]
        });
      }
    });
    
    timeline.play();
  }

  setupInputHandling() {
    const inputSystem = this.engine.getSystem('input');
    
    // Create input mappings for demo control
    inputSystem.createInputMap('demo', {
      toggleLighting: [{ type: 'key', code: 'KeyL' }],
      toggleAI: [{ type: 'key', code: 'KeyA' }],
      toggleAnimation: [{ type: 'key', code: 'KeyN' }],
      spawnParticles: [{ type: 'key', code: 'KeyP' }],
      combatDemo: [{ type: 'key', code: 'KeyC' }],
      explosionEffect: [{ type: 'key', code: 'KeyE' }],
      soundDemo: [{ type: 'key', code: 'KeyS' }],
      resetDemo: [{ type: 'key', code: 'KeyR' }]
    });
  }

  update(deltaTime) {
    this.handleDemoInputs();
    this.updateDemoEffects(deltaTime);
    this.updateAIDemo(deltaTime);
    this.updateMemoryDemo();
  }

  handleDemoInputs() {
    const inputSystem = this.engine.getSystem('input');
    
    if (inputSystem.wasActionPressed('demo', 'toggleLighting')) {
      this.toggleLightingDemo();
    }
    
    if (inputSystem.wasActionPressed('demo', 'toggleAI')) {
      this.toggleAIDemo();
    }
    
    if (inputSystem.wasActionPressed('demo', 'toggleAnimation')) {
      this.toggleAnimationDemo();
    }
    
    if (inputSystem.wasActionPressed('demo', 'spawnParticles')) {
      this.spawnDemoParticles();
    }
    
    if (inputSystem.wasActionPressed('demo', 'combatDemo')) {
      this.runCombatDemo();
    }
    
    if (inputSystem.wasActionPressed('demo', 'explosionEffect')) {
      this.createExplosionDemo();
    }
    
    if (inputSystem.wasActionPressed('demo', 'soundDemo')) {
      this.runSoundDemo();
    }
    
    if (inputSystem.wasActionPressed('demo', 'resetDemo')) {
      this.resetDemo();
    }
  }

  toggleLightingDemo() {
    const lightingSystem = this.engine.getSystem('lighting');
    this.lightDemo = !this.lightDemo;
    
    if (this.lightDemo) {
      // Enhanced lighting mode
      lightingSystem.setAmbientLight(10, 10, 20, 0.2);
      
      // Create additional atmospheric lights
      lightingSystem.createPointLight(
        'atmosphere1', 100, 100, 300, { r: 50, g: 100, b: 200 }, 0.4
      );
      lightingSystem.createPointLight(
        'atmosphere2', 1100, 400, 250, { r: 200, g: 50, b: 100 }, 0.3
      );
    } else {
      // Normal lighting mode
      lightingSystem.removeLight('atmosphere1');
      lightingSystem.removeLight('atmosphere2');
      lightingSystem.setAmbientLight(40, 40, 60, 0.5);
    }
    
    console.log(`🔆 Lighting demo: ${this.lightDemo ? 'Enhanced' : 'Normal'}`);
  }

  toggleAIDemo() {
    const aiSystem = this.engine.getSystem('ai');
    this.aiDemo = !this.aiDemo;
    
    this.entities.forEach(entity => {
      if (entity.tag === 'enemy') {
        if (this.aiDemo) {
          // Switch to defensive AI
          aiSystem.removeAI(entity.id);
          aiSystem.makeDefensiveAI(entity.id);
        } else {
          // Switch back to aggressive AI
          aiSystem.removeAI(entity.id);
          aiSystem.makeAggressiveAI(entity.id);
        }
      }
    });
    
    console.log(`🤖 AI demo: ${this.aiDemo ? 'Defensive' : 'Aggressive'} behavior`);
  }

  toggleAnimationDemo() {
    const animationSystem = this.engine.getSystem('animation');
    this.animationDemo = !this.animationDemo;
    
    this.entities.forEach(entity => {
      if (entity.tag === 'interactive') {
        const controller = animationSystem.getAnimationController(entity.id);
        if (controller) {
          if (this.animationDemo) {
            controller.stop();
            animationSystem.shake(entity.id, 8, 800);
          } else {
            controller.stop();
            animationSystem.pulse(entity.id, 1.5, 1200);
          }
        }
      }
    });
    
    console.log(`✨ Animation demo: ${this.animationDemo ? 'Shake' : 'Pulse'} mode`);
  }

  spawnDemoParticles() {
    const particleSystem = this.engine.getSystem('particles');
    const memorySystem = this.engine.getSystem('memory');
    
    // Spawn particles at random locations
    for (let i = 0; i < 3; i++) {
      const x = 100 + Math.random() * 1000;
      const y = 100 + Math.random() * 300;
      
      particleSystem.createExplosion(x, y, 2.0);
      
      // Use memory pool for efficient particle creation
      const particleData = memorySystem.acquire('particle');
      if (particleData) {
        particleData.x = x;
        particleData.y = y;
        particleData.life = 3000;
        particleData.color = `hsl(${Math.random() * 360}, 70%, 60%)`;
        
        // Auto-release after particle lifetime
        memorySystem.autoRelease(particleData, 3000);
      }
    }
    
    console.log('💥 Demo particles spawned!');
  }

  runCombatDemo() {
    const combatSystem = this.engine.getSystem('combat');
    const visualEffects = this.engine.getSystem('visualEffects');
    
    if (!combatSystem || !visualEffects) return;
    
    // Find player and enemy entities
    const player = this.entities.find(e => e.tag === 'player');
    const enemy = this.entities.find(e => e.tag === 'enemy');
    
    if (player && enemy) {
      // Initialize combat for both entities if not already done
      if (!combatSystem.getCombatData(player.id)) {
        combatSystem.initializeCombat(player.id, {
          maxHealth: 100,
          attack: 15,
          defense: 8,
          criticalChance: 0.2
        });
      }
      
      if (!combatSystem.getCombatData(enemy.id)) {
        combatSystem.initializeCombat(enemy.id, {
          maxHealth: 80,
          attack: 12,
          defense: 5,
          criticalChance: 0.1
        });
      }
      
      // Trigger combat sequence
      this.engine.eventBus.emit('combat:attack', {
        attackerId: player.id,
        targetId: enemy.id,
        attackType: 'heavy',
        damage: 25,
        timing: Math.random() * 200
      });
      
      // Add visual effects
      visualEffects.createImpactEffect({
        x: enemy.transform.x + enemy.transform.width / 2,
        y: enemy.transform.y + enemy.transform.height / 2,
        intensity: 1.5
      });
      
      // Screen shake
      visualEffects.triggerScreenShake({
        intensity: 8,
        duration: 400
      });
      
      console.log('⚔️ Combat demo executed!');
    }
  }

  createExplosionDemo() {
    const visualEffects = this.engine.getSystem('visualEffects');
    const enhancedAudio = this.engine.getSystem('enhancedAudio');
    
    if (!visualEffects) return;
    
    // Create explosion at random location
    const x = 200 + Math.random() * 800;
    const y = 200 + Math.random() * 200;
    
    visualEffects.createExplosion({
      x, y,
      size: 1.5,
      color: '#ff6600'
    });
    
    // Play explosion sound if enhanced audio is available
    if (enhancedAudio) {
      enhancedAudio.playExplosionSound(1.5);
    }
    
    console.log('💥 Explosion demo created!');
  }

  runSoundDemo() {
    const enhancedAudio = this.engine.getSystem('enhancedAudio');
    
    if (!enhancedAudio) {
      console.log('Enhanced audio system not available');
      return;
    }
    
    // Play various demo sounds
    const sounds = [
      { type: 'hit', intensity: 1.2 },
      { type: 'footstep', surface: 'metal' },
      { type: 'explosion', size: 0.8 }
    ];
    
    sounds.forEach((sound, index) => {
      setTimeout(() => {
        switch (sound.type) {
          case 'hit':
            enhancedAudio.playHitSound(sound.intensity);
            break;
          case 'footstep':
            enhancedAudio.playFootstep(sound.surface);
            break;
          case 'explosion':
            enhancedAudio.playExplosionSound(sound.size);
            break;
        }
      }, index * 500);
    });
    
    console.log('🔊 Sound demo playing!');
  }

  updateDemoEffects(deltaTime) {
    // Update demo-specific effects
    this.demoTimer = (this.demoTimer || 0) + deltaTime;
    
    // Periodic lighting changes
    if (this.lightDemo && Math.floor(this.demoTimer) % 5 === 0) {
      const lightingSystem = this.engine.getSystem('lighting');
      const randomColor = {
        r: 100 + Math.random() * 155,
        g: 100 + Math.random() * 155,
        b: 100 + Math.random() * 155
      };
      
      const light = lightingSystem.getLight('main');
      if (light) {
        light.setColor(randomColor.r, randomColor.g, randomColor.b);
      }
    }
  }

  updateAIDemo(deltaTime) {
    if (!this.aiDemo) return;
    
    this.aiDemoTimer += deltaTime;
    
    // Switch AI behaviors periodically
    if (this.aiDemoTimer > 3000) {
      this.aiDemoTimer = 0;
      
      const aiSystem = this.engine.getSystem('ai');
      const states = ['patrol', 'aggressive', 'defensive'];
      this.aiDemoState = states[(states.indexOf(this.aiDemoState) + 1) % states.length];
      
      console.log(`🧠 AI Demo: Switching to ${this.aiDemoState} behavior`);
    }
  }

  updateMemoryDemo() {
    const memorySystem = this.engine.getSystem('memory');
    const stats = memorySystem.getMemoryStats();
    
    // Log memory stats periodically for demonstration
    if (Math.floor(Date.now() / 1000) % 10 === 0 && !this.lastMemoryLog) {
      console.log('📊 Memory Stats:', {
        pooledObjects: stats.totalPooledObjects,
        activeObjects: stats.totalActiveObjects,
        memoryUsage: `${(stats.memoryUsage / 1024 / 1024).toFixed(2)}MB`
      });
      this.lastMemoryLog = true;
    } else if (Math.floor(Date.now() / 1000) % 10 !== 0) {
      this.lastMemoryLog = false;
    }
  }

  resetDemo() {
    console.log('🔄 Resetting enhanced demo...');
    
    // Reset all systems to default state
    const lightingSystem = this.engine.getSystem('lighting');
    const animationSystem = this.engine.getSystem('animation');
    const memorySystem = this.engine.getSystem('memory');
    
    // Reset lighting
    lightingSystem.removeLight('atmosphere1');
    lightingSystem.removeLight('atmosphere2');
    lightingSystem.setAmbientLight(20, 20, 40, 0.3);
    
    // Reset animations
    animationSystem.stopAll();
    
    // Force memory cleanup
    memorySystem.optimizeGarbageCollection();
    
    // Reset demo flags
    this.lightDemo = false;
    this.aiDemo = false;
    this.animationDemo = false;
    this.demoTimer = 0;
    this.aiDemoTimer = 0;
    
    // Restart demo cycle
    this.startDemoCycle();
  }

  startDemoCycle() {
    // Start automatic demo cycle
    setTimeout(() => this.toggleLightingDemo(), 2000);
    setTimeout(() => this.toggleAIDemo(), 5000);
    setTimeout(() => this.toggleAnimationDemo(), 8000);
    setTimeout(() => this.spawnDemoParticles(), 10000);
  }

  render(ctx) {
    // Custom rendering for demo scene
    ctx.save();
    
    // Draw demo info
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 300, 200);
    
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('🚀 Enhanced Engine Demo', 20, 30);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.fillText('Controls:', 20, 50);
    ctx.fillText('L - Toggle Advanced Lighting', 20, 70);
    ctx.fillText('A - Toggle AI Behavior', 20, 90);
    ctx.fillText('N - Toggle Animations', 20, 110);
    ctx.fillText('P - Spawn Particles', 20, 130);
    ctx.fillText('C - Combat Demo', 20, 150);
    ctx.fillText('E - Explosion Effect', 20, 170);
    ctx.fillText('S - Sound Demo', 20, 190);
    ctx.fillText('R - Reset Demo', 20, 210);
    
    ctx.restore();
  }
}

// React Component for Enhanced Demo
export const EnhancedEngineDemo = () => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [engineReady, setEngineReady] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const initializeEngine = async () => {
      try {
        // Create enhanced engine instance
        const engine = new GameEngine(canvasRef.current, {
          targetFPS: 60,
          enableDebug: true,
          enableProfiling: true
        });

        engineRef.current = engine;

        // Register enhanced demo scene
        engine.sceneManager.registerScene('enhancedDemo', EnhancedDemoScene);

        // Start engine
        await engine.start();
        
        // Change to demo scene
        engine.sceneManager.changeScene('enhancedDemo');

        setEngineReady(true);

        // Setup stats monitoring
        const statsInterval = setInterval(() => {
          const engineStats = engine.getPerformanceStats();
          const memoryStats = engine.getSystem('memory')?.getMemoryStats();
          
          setStats({
            fps: engineStats.getCurrentFPS(),
            frameTime: engineStats.getFrameTime(),
            entities: engine.entityManager.getEntityCount(),
            memory: memoryStats
          });
        }, 1000);

        return () => {
          clearInterval(statsInterval);
          engine.destroy();
        };
      } catch (error) {
        console.error('Failed to initialize enhanced engine:', error);
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
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      padding: '20px',
      background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
      minHeight: '100vh',
      color: '#ffffff'
    }}>
      <h1 style={{
        fontSize: '2.5rem',
        marginBottom: '1rem',
        background: 'linear-gradient(45deg, #00ff88, #64ffda)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        color: 'transparent'
      }}>
        🚀 Enhanced Nebula Wars Engine
      </h1>
      
      <p style={{ marginBottom: '2rem', textAlign: 'center', maxWidth: '600px' }}>
        Experience the advanced features of our enhanced game engine including AI systems, 
        dynamic lighting, advanced animations, state management, and memory optimization.
      </p>

      <canvas
        ref={canvasRef}
        width={1200}
        height={500}
        style={{
          border: '2px solid #64ffda',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(100, 255, 218, 0.3)',
          backgroundColor: '#000'
        }}
      />

      {/* Enhanced Stats Display */}
      {engineReady && stats && (
        <div style={{
          marginTop: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          width: '100%',
          maxWidth: '1200px'
        }}>
          <div style={{
            background: 'rgba(0, 255, 136, 0.1)',
            border: '1px solid rgba(0, 255, 136, 0.3)',
            borderRadius: '8px',
            padding: '15px'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#00ff88' }}>🎮 Engine Performance</h3>
            <p>FPS: {stats.fps?.toFixed(1) || 'N/A'}</p>
            <p>Frame Time: {stats.frameTime?.toFixed(2) || 'N/A'}ms</p>
            <p>Entities: {stats.entities || 0}</p>
          </div>
          
          <div style={{
            background: 'rgba(100, 255, 218, 0.1)',
            border: '1px solid rgba(100, 255, 218, 0.3)',
            borderRadius: '8px',
            padding: '15px'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#64ffda' }}>🧠 Memory System</h3>
            <p>Pooled Objects: {stats.memory?.totalPooledObjects || 0}</p>
            <p>Active Objects: {stats.memory?.totalActiveObjects || 0}</p>
            <p>Memory Usage: {((stats.memory?.memoryUsage || 0) / 1024 / 1024).toFixed(2)}MB</p>
          </div>
          
          <div style={{
            background: 'rgba(255, 107, 107, 0.1)',
            border: '1px solid rgba(255, 107, 107, 0.3)',
            borderRadius: '8px',
            padding: '15px'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#ff6b6b' }}>✨ Enhanced Features</h3>
            <p>🤖 AI System: Active</p>
            <p>💡 Dynamic Lighting: Enabled</p>
            <p>🎬 Advanced Animations: Running</p>
          </div>
        </div>
      )}

      <div style={{ 
        marginTop: '30px', 
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '20px',
        borderRadius: '8px',
        maxWidth: '800px'
      }}>
        <h3 style={{ color: '#64ffda', marginBottom: '15px' }}>🎯 Engine Enhancements</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '15px',
          textAlign: 'left'
        }}>
          <div>
            <h4 style={{ color: '#00ff88' }}>🧠 AI System</h4>
            <ul style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
              <li>Behavior Trees</li>
              <li>State Machines</li>
              <li>Pathfinding</li>
              <li>Decision Trees</li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: '#00ff88' }}>💡 Lighting System</h4>
            <ul style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
              <li>Dynamic Lighting</li>
              <li>Shadow Casting</li>
              <li>Multiple Light Types</li>
              <li>Light Animations</li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: '#00ff88' }}>🎬 Animation System</h4>
            <ul style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
              <li>Timeline Management</li>
              <li>Keyframe Interpolation</li>
              <li>Easing Functions</li>
              <li>Animation Blending</li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: '#00ff88' }}>💾 Memory System</h4>
            <ul style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
              <li>Object Pooling</li>
              <li>Memory Optimization</li>
              <li>Garbage Collection</li>
              <li>Performance Monitoring</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedEngineDemo;