import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { useAudio, useGamepad, useResponsive } from '../hooks/useGameHooks';
import { toast } from 'react-hot-toast';

const MainMenu = () => {
  const navigate = useNavigate();
  const { state: gameState, startGame, changeScreen } = useGame();
  const { currentTheme } = useTheme();
  const { playSound } = useAudio();
  const { isConnected: gamepadConnected, gamepadType } = useGamepad();
  const { isMobile } = useResponsive();
  
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showStats, setShowStats] = useState(false);

  const menuItems = [
    {
      title: 'Quick Battle',
      description: 'Jump into action with a single player battle',
      icon: '⚔️',
      action: () => {
        startGame('single');
        navigate('/character-select');
      },
      gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)'
    },
    {
      title: 'Multiplayer',
      description: 'Challenge friends or players online',
      icon: '🌐',
      action: () => navigate('/multiplayer'),
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      title: 'Tournament',
      description: 'Compete in structured tournaments',
      icon: '🏆',
      action: () => navigate('/tournament'),
      gradient: 'linear-gradient(135deg, #ffd700 0%, #ffb700 100%)'
    },
    {
      title: 'Practice',
      description: 'Train against AI opponents',
      icon: '🎯',
      action: () => {
        startGame('practice');
        navigate('/character-select');
      },
      gradient: 'linear-gradient(135deg, #2ed573 0%, #17c0eb 100%)'
    },
    {
      title: 'Leaderboard',
      description: 'View global rankings and statistics',
      icon: '📊',
      action: () => navigate('/leaderboard'),
      gradient: 'linear-gradient(135deg, #a55eea 0%, #26de81 100%)'
    },
    {
      title: 'Settings',
      description: 'Customize game preferences',
      icon: '⚙️',
      action: () => navigate('/settings'),
      gradient: 'linear-gradient(135deg, #778ca3 0%, #2c2c54 100%)'
    }
  ];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : menuItems.length - 1);
          // playSound('navigate');
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => prev < menuItems.length - 1 ? prev + 1 : 0);
          // playSound('navigate');
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          menuItems[selectedIndex].action();
          // playSound('select');
          break;
        case 'Escape':
          setShowStats(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, menuItems]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 10
      }
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Animation */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.1,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        animation: 'float 20s ease-in-out infinite',
      }} />

      {/* Main Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          width: '100%',
          maxWidth: '1200px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Title */}
        <motion.div
          variants={itemVariants}
          style={{ marginBottom: '3rem' }}
        >
          <h1 style={{
            fontSize: isMobile ? '3rem' : '5rem',
            fontWeight: 'bold',
            margin: 0,
            background: 'linear-gradient(45deg, #ffffff, #4facfe)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            marginBottom: '0.5rem'
          }}>
            NEBULA WARS
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              color: '#b0b0b0',
              fontSize: '1.2rem',
              margin: 0
            }}
          >
            Epic Robot Gladiator Combat
          </motion.p>
        </motion.div>

        {/* Menu Grid */}
        <motion.div
          variants={containerVariants}
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}
        >
          {menuItems.map((item, index) => (
            <motion.div
              key={item.title}
              variants={itemVariants}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={item.action}
              style={{
                background: selectedIndex === index 
                  ? (item.title === 'Quick Battle' ? 'transparent' : item.gradient)
                  : (item.title === 'Quick Battle' ? 'transparent' : '#1a1a3a'),
                border: selectedIndex === index 
                  ? (item.title === 'Quick Battle' ? '2px solid #ffd700' : '2px solid #ffd700')
                  : (item.title === 'Quick Battle' ? '2px solid #ff6b6b' : '1px solid #2a2a4a'),
                borderRadius: '16px',
                padding: '2rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: selectedIndex === index 
                  ? '0 0 20px rgba(255, 215, 0, 0.3)' 
                  : (item.title === 'Quick Battle' ? '0 0 15px rgba(255, 107, 107, 0.2)' : '0 4px 12px rgba(0,0,0,0.4)'),
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={() => {
                setSelectedIndex(index);
                // playSound('hover');
              }}
            >
              {/* Icon */}
              <div style={{
                fontSize: '3rem',
                marginBottom: '1rem',
                filter: selectedIndex === index ? 'drop-shadow(0 0 10px rgba(255,255,255,0.8))' : 'none'
              }}>
                {item.icon}
              </div>
              
              {/* Title */}
              <h3 style={{
                color: selectedIndex === index ? '#ffffff' : '#ffffff',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                margin: '0 0 0.5rem 0'
              }}>
                {item.title}
              </h3>
              
              {/* Description */}
              <p style={{
                color: selectedIndex === index ? 'rgba(255,255,255,0.9)' : '#b0b0b0',
                fontSize: '1rem',
                margin: 0,
                lineHeight: '1.4'
              }}>
                {item.description}
              </p>

              {/* Shine effect */}
              {selectedIndex === index && (
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    pointerEvents: 'none'
                  }}
                />
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Status Bar */}
        <motion.div
          variants={itemVariants}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '12px',
            padding: '1rem 2rem',
            marginTop: '2rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: '#b0b0b0' }}>
              Games Played: <strong style={{ color: '#ffd700' }}>
                {gameState.stats.gamesPlayed}
              </strong>
            </span>
            <span style={{ color: '#b0b0b0' }}>
              Wins: <strong style={{ color: '#2ed573' }}>
                {gameState.stats.gamesWon}
              </strong>
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {gamepadConnected && (
              <span style={{ 
                color: '#4facfe',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                🎮 {gamepadType} Connected
              </span>
            )}
            
            <button
              onClick={() => setShowStats(!showStats)}
              style={{
                background: 'transparent',
                border: '1px solid #4facfe',
                color: '#4facfe',
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              {showStats ? 'Hide' : 'Show'} Stats
            </button>
          </div>
        </motion.div>

        {/* Stats Panel */}
        {showStats && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: '#1a1a3a',
              borderRadius: '12px',
              padding: '2rem',
              marginTop: '1rem',
              border: '1px solid #2a2a4a'
            }}
          >
            <h3 style={{ color: '#ffffff', marginBottom: '1rem' }}>
              Player Statistics
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <div>
                <p style={{ color: '#b0b0b0', margin: '0.5rem 0' }}>
                  Total Damage: <strong>{gameState.stats.totalDamageDealt}</strong>
                </p>
                <p style={{ color: '#b0b0b0', margin: '0.5rem 0' }}>
                  Total Combos: <strong>{gameState.stats.totalCombos}</strong>
                </p>
              </div>
              <div>
                <p style={{ color: '#b0b0b0', margin: '0.5rem 0' }}>
                  Highest Combo: <strong>{gameState.stats.highestCombo}</strong>
                </p>
                <p style={{ color: '#b0b0b0', margin: '0.5rem 0' }}>
                  Achievements: <strong>{gameState.stats.achievementsUnlocked.length}</strong>
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Controls Info */}
        <motion.div
          variants={itemVariants}
          style={{
            marginTop: '2rem',
            padding: '1rem',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '8px',
            fontSize: '0.9rem',
            color: '#b0b0b0'
          }}
        >
          <p style={{ margin: 0 }}>
            🎮 Use ↑↓ arrow keys or controller to navigate • Enter/Space to select • ESC for stats
          </p>
        </motion.div>
      </motion.div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
      `}</style>
    </div>
  );
};

export default MainMenu;
