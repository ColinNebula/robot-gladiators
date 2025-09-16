/**
 * Enhanced Game Component
 * 
 * React component that integrates the enhanced game engine with the
 * new ECS-based SideScroller scene for improved performance and features.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import GameEngine from '../engine/GameEngine.js';
import EnhancedSideScrollerScene from '../engine/scenes/EnhancedSideScrollerScene.js';

const EnhancedGame = () => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [gameState, setGameState] = useState({
    isLoading: true,
    isRunning: false,
    isPaused: false,
    gameOver: false,
    stats: {
      health: 100,
      maxHealth: 100,
      mana: 50,
      maxMana: 50,
      score: 0,
      level: 1,
      time: 0
    }
  });
  const [performanceStats, setPerformanceStats] = useState({
    fps: 60,
    frameTime: 16.67,
    entityCount: 0,
    memoryUsage: 0
  });

  // Initialize the enhanced game engine
  const initializeEngine = useCallback(async () => {
    if (!canvasRef.current) return;

    try {
      console.log('🚀 Initializing Enhanced Game Engine...');
      
      // Create engine with enhanced configuration
      const engine = new GameEngine(canvasRef.current, {
        targetFPS: 60,
        enableDebug: process.env.NODE_ENV === 'development',
        enableProfiling: true,
        pixelRatio: window.devicePixelRatio || 1
      });

      engineRef.current = engine;

      // Register the enhanced sidescroller scene
      engine.sceneManager.registerScene('enhancedSidescroller', EnhancedSideScrollerScene);

      // Setup event listeners for UI updates
      setupEventListeners(engine);

      // Start the engine
      await engine.start();
      
      // Change to the enhanced sidescroller scene
      await engine.sceneManager.changeScene('enhancedSidescroller');

      setGameState(prev => ({
        ...prev,
        isLoading: false,
        isRunning: true
      }));

      console.log('✅ Enhanced Game Engine initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize enhanced game engine:', error);
      setGameState(prev => ({
        ...prev,
        isLoading: false,
        isRunning: false
      }));
    }
  }, []);

  // Setup event listeners for game state updates
  const setupEventListeners = (engine) => {
    const eventBus = engine.eventBus;

    // Game state events
    eventBus.on('ui:gameStarted', (data) => {
      setGameState(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          health: data.playerHealth,
          mana: data.playerMana,
          score: data.score,
          level: data.level
        }
      }));
    });

    eventBus.on('ui:updateStats', (data) => {
      setGameState(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          ...data
        }
      }));
    });

    eventBus.on('ui:pauseToggled', (data) => {
      setGameState(prev => ({
        ...prev,
        isPaused: data.paused
      }));
    });

    eventBus.on('ui:gameOver', (data) => {
      setGameState(prev => ({
        ...prev,
        gameOver: true,
        isRunning: false,
        stats: {
          ...prev.stats,
          score: data.score,
          level: data.level,
          time: data.time
        }
      }));
    });

    eventBus.on('ui:levelUp', (data) => {
      setGameState(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          level: data.newLevel
        }
      }));
    });

    // Achievement notifications
    eventBus.on('achievement:unlocked', (data) => {
      console.log('🏆 Achievement unlocked:', data.achievement.name);
      // Could show toast notification here
    });

    // Score updates
    eventBus.on('ui:scoreUpdate', (data) => {
      setGameState(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          score: data.totalScore
        }
      }));
    });
  };

  // Performance monitoring
  useEffect(() => {
    if (!engineRef.current) return;

    const updatePerformanceStats = () => {
      const engine = engineRef.current;
      const performanceSystem = engine.getSystem('performance');
      
      if (performanceSystem) {
        const stats = performanceSystem.getOptimizationStats();
        setPerformanceStats({
          fps: Math.round(stats.avgFPS),
          frameTime: stats.frameTime.toFixed(2),
          entityCount: stats.entityCount,
          memoryUsage: (stats.memoryUsage / 1024 / 1024).toFixed(2)
        });
      }
    };

    const interval = setInterval(updatePerformanceStats, 1000);
    return () => clearInterval(interval);
  }, [gameState.isRunning]);

  // Initialize engine on mount
  useEffect(() => {
    initializeEngine();

    // Cleanup on unmount
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
      }
    };
  }, [initializeEngine]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const container = canvas.parentElement;
        
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        
        if (engineRef.current) {
          engineRef.current.setupCanvas();
        }
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial resize

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Game control functions
  const restartGame = () => {
    if (engineRef.current) {
      engineRef.current.sceneManager.changeScene('enhancedSidescroller');
      setGameState(prev => ({
        ...prev,
        gameOver: false,
        isRunning: true,
        isPaused: false,
        stats: {
          health: 100,
          maxHealth: 100,
          mana: 50,
          maxMana: 50,
          score: 0,
          level: 1,
          time: 0
        }
      }));
    }
  };

  const togglePause = () => {
    if (engineRef.current) {
      const currentScene = engineRef.current.sceneManager.getCurrentScene();
      if (currentScene && typeof currentScene.togglePause === 'function') {
        currentScene.togglePause();
      }
    }
  };

  // Render loading screen
  if (gameState.isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
        color: '#ffffff'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🚀</div>
        <div style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Loading Enhanced Game Engine...</div>
        <div style={{
          width: '200px',
          height: '4px',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, #00ff88, #64ffda)',
            animation: 'loading 2s ease-in-out infinite'
          }} />
        </div>
        <style jsx>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(0%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100vh',
      background: '#000',
      overflow: 'hidden'
    }}>
      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          imageRendering: 'pixelated'
        }}
        width={1200}
        height={600}
      />

      {/* Game UI Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 10
      }}>
        {/* Health and Mana Bars */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          pointerEvents: 'auto'
        }}>
          {/* Health Bar */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{
              fontSize: '14px',
              color: '#ffffff',
              marginBottom: '5px',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
            }}>
              Health: {gameState.stats.health}/{gameState.stats.maxHealth}
            </div>
            <div style={{
              width: '200px',
              height: '20px',
              background: 'rgba(0, 0, 0, 0.5)',
              border: '2px solid #ffffff',
              borderRadius: '10px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${(gameState.stats.health / gameState.stats.maxHealth) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #ff4757, #ff6b6b)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          {/* Mana Bar */}
          <div>
            <div style={{
              fontSize: '14px',
              color: '#ffffff',
              marginBottom: '5px',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
            }}>
              Mana: {gameState.stats.mana}/{gameState.stats.maxMana}
            </div>
            <div style={{
              width: '200px',
              height: '20px',
              background: 'rgba(0, 0, 0, 0.5)',
              border: '2px solid #ffffff',
              borderRadius: '10px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${(gameState.stats.mana / gameState.stats.maxMana) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #3742fa, #5352ed)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>

        {/* Score and Level */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          textAlign: 'right',
          color: '#ffffff',
          textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
            Score: {gameState.stats.score.toLocaleString()}
          </div>
          <div style={{ fontSize: '18px', marginBottom: '5px' }}>
            Level: {gameState.stats.level}
          </div>
          <div style={{ fontSize: '16px' }}>
            Time: {Math.floor(gameState.stats.time / 60)}:{(gameState.stats.time % 60).toString().padStart(2, '0')}
          </div>
        </div>

        {/* Performance Stats (Development) */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            background: 'rgba(0, 0, 0, 0.7)',
            color: '#ffffff',
            padding: '10px',
            borderRadius: '5px',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}>
            <div>FPS: {performanceStats.fps}</div>
            <div>Frame Time: {performanceStats.frameTime}ms</div>
            <div>Entities: {performanceStats.entityCount}</div>
            <div>Memory: {performanceStats.memoryUsage}MB</div>
          </div>
        )}

        {/* Controls Help */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: '#ffffff',
          padding: '15px',
          borderRadius: '5px',
          fontSize: '14px'
        }}>
          <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>Controls:</div>
          <div>WASD / Arrow Keys - Move</div>
          <div>Space - Jump</div>
          <div>J - Attack</div>
          <div>K - Heavy Attack</div>
          <div>L - Block</div>
          <div>Q/E - Special Abilities</div>
          <div>ESC/P - Pause</div>
        </div>

        {/* Pause Overlay */}
        {gameState.isPaused && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'auto'
          }}>
            <div style={{
              fontSize: '48px',
              color: '#ffffff',
              marginBottom: '20px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
            }}>
              PAUSED
            </div>
            <button
              onClick={togglePause}
              style={{
                padding: '15px 30px',
                fontSize: '18px',
                background: 'linear-gradient(45deg, #00ff88, #64ffda)',
                color: '#000',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Resume Game
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState.gameOver && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'auto'
          }}>
            <div style={{
              fontSize: '48px',
              color: '#ff4757',
              marginBottom: '20px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
            }}>
              GAME OVER
            </div>
            <div style={{
              fontSize: '24px',
              color: '#ffffff',
              marginBottom: '10px'
            }}>
              Final Score: {gameState.stats.score.toLocaleString()}
            </div>
            <div style={{
              fontSize: '18px',
              color: '#ffffff',
              marginBottom: '30px'
            }}>
              Level Reached: {gameState.stats.level}
            </div>
            <button
              onClick={restartGame}
              style={{
                padding: '15px 30px',
                fontSize: '18px',
                background: 'linear-gradient(45deg, #00ff88, #64ffda)',
                color: '#000',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedGame;