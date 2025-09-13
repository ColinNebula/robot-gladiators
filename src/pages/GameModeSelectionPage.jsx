import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import useGamepadNavigation from '../hooks/useGamepadNavigation';

const GameModeSelectionPage = () => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  const gameModes = [
    {
      id: 'single-player',
      title: 'Single Player',
      description: 'Fight against AI opponents in epic battles',
      icon: '🤖',
      color: currentTheme.colors.primary,
      gradient: currentTheme.gradients.primary,
      path: '/single-player'
    },
    {
      id: 'two-player',
      title: 'Two Player (Local)',
      description: 'Battle against a friend on the same device',
      icon: '👥',
      color: currentTheme.colors.secondary,
      gradient: currentTheme.gradients.secondary,
      path: '/two-player'
    }
  ];

  // Gamepad navigation setup
  const {
    selectedIndex,
    isGamepadConnected,
    isSelected
  } = useGamepadNavigation(gameModes, {
    onSelect: (mode) => {
      if (mode && mode.path) {
        handleModeSelect(mode);
      }
    },
    onBack: () => {
      navigate('/');
    },
    onStart: () => {
      // Start button selects current mode
      const selectedMode = gameModes[selectedIndex];
      if (selectedMode) {
        handleModeSelect(selectedMode);
      }
    },
    enabled: true,
    wrapAround: true,
    initialIndex: 0
  });

  const handleModeSelect = (mode) => {
    // Store the selected game mode in sessionStorage
    sessionStorage.setItem('selectedGameMode', mode.id);
    navigate(mode.path);
  };

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      padding: '2rem',
      textAlign: 'center'
    }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{ marginBottom: '3rem' }}
      >
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            fontSize: '4rem',
            marginBottom: '1rem'
          }}
        >
          ⚔️
        </motion.div>

        <h1 style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          background: currentTheme.gradients.primary,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          marginBottom: '1rem'
        }}>
          Choose Your Battle Mode {isGamepadConnected && <span style={{ color: currentTheme.colors.primary }}>🎮</span>}
        </h1>

        <p style={{
          fontSize: '1.3rem',
          color: currentTheme.colors.textSecondary,
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          Select how you want to experience the ultimate robot combat arena
        </p>
      </motion.div>

      {/* Game Mode Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
        maxWidth: '800px',
        width: '100%'
      }}>
        {gameModes.map((mode, index) => (
          <motion.div
            key={mode.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.2 }}
            whileHover={{ 
              scale: 1.05,
              y: -10,
              boxShadow: `0 20px 40px ${mode.color}30`
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleModeSelect(mode)}
            style={{
              background: isSelected(index) 
                ? `linear-gradient(135deg, ${currentTheme.colors.surface} 0%, ${mode.color}40 100%)`
                : `linear-gradient(135deg, ${currentTheme.colors.surface} 0%, ${mode.color}20 100%)`,
              border: isSelected(index)
                ? `3px solid ${mode.color}`
                : `2px solid ${mode.color}40`,
              borderRadius: '20px',
              padding: '2.5rem',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              boxShadow: isSelected(index) 
                ? `0 0 30px ${mode.color}50`
                : '0 4px 15px rgba(0,0,0,0.1)',
              transform: isSelected(index) ? 'translateY(-5px)' : 'translateY(0)'
            }}
          >
            {/* Background Pattern */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `radial-gradient(circle at 80% 20%, ${mode.color}20 0%, transparent 50%)`,
              pointerEvents: 'none'
            }} />

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              {isSelected(index) && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  style={{
                    position: 'absolute',
                    top: '15px',
                    right: '15px',
                    background: mode.color,
                    color: '#fff',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    boxShadow: `0 0 15px ${mode.color}80`
                  }}
                >
                  {isGamepadConnected ? '🎮' : '✓'}
                </motion.div>
              )}
              
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.5
                }}
                style={{
                  fontSize: '3.5rem',
                  marginBottom: '1.5rem'
                }}
              >
                {mode.icon}
              </motion.div>

              <h3 style={{
                fontSize: '1.8rem',
                fontWeight: 'bold',
                background: mode.gradient,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                marginBottom: '1rem'
              }}>
                {mode.title}
              </h3>

              <p style={{
                fontSize: '1.1rem',
                color: currentTheme.colors.textSecondary,
                lineHeight: '1.6',
                marginBottom: '1.5rem'
              }}>
                {mode.description}
              </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  background: mode.gradient,
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.8rem 1.5rem',
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: `0 4px 15px ${mode.color}30`,
                  transition: 'all 0.3s ease'
                }}
              >
                Select Mode
              </motion.button>
            </div>

            {/* Hover Effect Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `linear-gradient(45deg, ${mode.color}10, transparent)`,
                pointerEvents: 'none'
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/')}
        style={{
          marginTop: '3rem',
          background: 'transparent',
          border: `2px solid ${currentTheme.colors.textSecondary}50`,
          borderRadius: '12px',
          padding: '0.8rem 1.5rem',
          color: currentTheme.colors.textSecondary,
          fontSize: '1rem',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
      >
        ← Back to Main Menu
      </motion.button>
    </div>
  );
};

export default GameModeSelectionPage;