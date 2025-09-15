import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import useGamepadNavigation from '../hooks/useGamepadNavigation';
import LoadingSpinner from '../components/LoadingSpinner';

const TwoPlayerPage = () => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState('versus');

  const gameModes = [
    {
      id: 'versus',
      name: 'Classic Versus',
      description: 'Traditional 1v1 battle. Best fighter wins!',
      icon: '⚔️',
      color: currentTheme.colors.primary,
      rounds: 'Best of 3'
    },
    {
      id: 'tournament',
      name: 'Mini Tournament',
      description: 'Multiple rounds with different characters.',
      icon: '🏆',
      color: currentTheme.colors.secondary,
      rounds: 'Best of 5'
    },
    {
      id: 'survival',
      name: 'Survival Mode',
      description: 'See who can last the longest in continuous battles.',
      icon: '💪',
      color: '#2ed573',
      rounds: 'Until KO'
    }
  ];

  const controlSchemes = [
    {
      id: 'scheme1',
      name: 'Keyboard Split',
      player1: 'WASD + QE (Punch/Kick)',
      player2: 'Arrow Keys + L; (Punch/Kick)',
      icon: '⌨️'
    },
    {
      id: 'scheme2',
      name: 'Mixed Controls',
      player1: 'Keyboard (WASD + QE)',
      player2: 'Gamepad (if connected)',
      icon: '🎮'
    }
  ];

  const handleStartGame = () => {
    setIsLoading(true);
    
    // Store game configuration
    sessionStorage.setItem('gameMode', 'two-player');
    sessionStorage.setItem('battleMode', selectedMode);
    sessionStorage.setItem('controlScheme', 'scheme1'); // Default to keyboard split
    
    // Navigate to character selection after brief loading
    setTimeout(() => {
      navigate('/character-select');
    }, 1500);
  };

  // Navigation items for gamepad
  const getNavigationItems = () => {
    const items = [];
    gameModes.forEach(mode => {
      items.push(`mode-${mode.id}`);
    });
    items.push('start-game', 'back-to-menu');
    return items;
  };

  // Gamepad navigation setup
  const {
    isGamepadConnected,
    isSelected
  } = useGamepadNavigation(getNavigationItems(), {
    onSelect: (item) => {
      if (item.startsWith('mode-')) {
        const modeId = item.replace('mode-', '');
        setSelectedMode(modeId);
      } else if (item === 'start-game') {
        handleStartGame();
      } else if (item === 'back-to-menu') {
        navigate('/play');
      }
    },
    onBack: () => {
      navigate('/play');
    },
    wrapAround: true,
    enabled: !isLoading
  });

  if (isLoading) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '2rem',
        textAlign: 'center'
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            animate={{
              rotate: [0, 360],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              fontSize: '4rem',
              marginBottom: '2rem'
            }}
          >
            👥⚔️
          </motion.div>

          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            background: currentTheme.gradients.primary,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            marginBottom: '1rem'
          }}>
            Preparing Local Battle
          </h1>

          <p style={{
            fontSize: '1.2rem',
            color: currentTheme.colors.textSecondary,
            marginBottom: '2rem'
          }}>
            Mode: {gameModes.find(m => m.id === selectedMode)?.name}
          </p>

          <LoadingSpinner size="large" />
        </motion.div>
      </div>
    );
  }

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
          👥
        </motion.div>

        <h1 style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          background: currentTheme.gradients.secondary,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          marginBottom: '1rem'
        }}>
          Two Player Local Battle
        </h1>

        <p style={{
          fontSize: '1.3rem',
          color: currentTheme.colors.textSecondary,
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          Challenge a friend to epic robot combat on the same device!
        </p>
      </motion.div>

      {/* Game Mode Selection */}
      <div style={{ marginBottom: '3rem', width: '100%', maxWidth: '900px' }}>
        <h2 style={{
          fontSize: '1.5rem',
          color: currentTheme.colors.text,
          marginBottom: '1.5rem'
        }}>
          Choose Battle Mode
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          {gameModes.map((mode, index) => (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedMode(mode.id)}
              style={{
                background: selectedMode === mode.id 
                  ? `linear-gradient(135deg, ${mode.color}20 0%, ${currentTheme.colors.surface} 100%)`
                  : currentTheme.colors.surface,
                border: selectedMode === mode.id 
                  ? `3px solid ${mode.color}`
                  : `2px solid ${currentTheme.colors.border}`,
                borderRadius: '16px',
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative'
              }}
            >
              {/* Selection Indicator */}
              {selectedMode === mode.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: mode.color,
                    color: '#fff',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}
                >
                  ✓
                </motion.div>
              )}

              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                {mode.icon}
              </div>

              <h3 style={{
                fontSize: '1.3rem',
                fontWeight: 'bold',
                color: selectedMode === mode.id ? mode.color : currentTheme.colors.text,
                marginBottom: '0.5rem'
              }}>
                {mode.name}
              </h3>

              <p style={{
                fontSize: '0.9rem',
                color: currentTheme.colors.textSecondary,
                lineHeight: '1.5',
                marginBottom: '1rem'
              }}>
                {mode.description}
              </p>

              <div style={{
                display: 'inline-block',
                background: `${mode.color}20`,
                color: mode.color,
                padding: '0.3rem 0.8rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 'bold'
              }}>
                {mode.rounds}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Controls Info */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{
          background: `${currentTheme.colors.surface}80`,
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
          maxWidth: '700px',
          width: '100%',
          border: `1px solid ${currentTheme.colors.border}`
        }}
      >
        <h3 style={{
          fontSize: '1.3rem',
          color: currentTheme.colors.text,
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          ⌨️ Control Setup
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.5rem',
          textAlign: 'left'
        }}>
          <div style={{
            background: `${currentTheme.colors.primary}20`,
            padding: '1rem',
            borderRadius: '12px',
            border: `2px solid ${currentTheme.colors.primary}30`
          }}>
            <h4 style={{
              color: currentTheme.colors.primary,
              fontSize: '1.1rem',
              marginBottom: '0.5rem'
            }}>
              👤 Player 1
            </h4>
            <div style={{ color: currentTheme.colors.textSecondary, fontSize: '0.9rem' }}>
              <div>• Move: WASD</div>
              <div>• Punch: Q</div>
              <div>• Kick: E</div>
              <div>• Jump: Spacebar</div>
            </div>
          </div>

          <div style={{
            background: `${currentTheme.colors.secondary}20`,
            padding: '1rem',
            borderRadius: '12px',
            border: `2px solid ${currentTheme.colors.secondary}30`
          }}>
            <h4 style={{
              color: currentTheme.colors.secondary,
              fontSize: '1.1rem',
              marginBottom: '0.5rem'
            }}>
              👤 Player 2
            </h4>
            <div style={{ color: currentTheme.colors.textSecondary, fontSize: '0.9rem' }}>
              <div>• Move: Arrow Keys</div>
              <div>• Punch: L</div>
              <div>• Kick: ; (Semicolon)</div>
              <div>• Jump: Enter</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleStartGame}
          style={{
            background: currentTheme.gradients.secondary,
            border: 'none',
            borderRadius: '12px',
            padding: '1rem 2rem',
            color: '#fff',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: `0 4px 15px ${currentTheme.colors.secondary}30`,
            transition: 'all 0.3s ease'
          }}
        >
          Start Local Battle →
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/play')}
          style={{
            background: 'transparent',
            border: `2px solid ${currentTheme.colors.textSecondary}50`,
            borderRadius: '12px',
            padding: '1rem 2rem',
            color: currentTheme.colors.textSecondary,
            fontSize: '1.1rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          ← Back
        </motion.button>
      </div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: `${currentTheme.colors.surface}80`,
          borderRadius: '12px',
          border: `1px solid ${currentTheme.colors.primary}30`,
          maxWidth: '600px'
        }}
      >
        <p style={{
          color: currentTheme.colors.textSecondary,
          fontSize: '0.9rem',
          fontStyle: 'italic',
          margin: 0,
          lineHeight: '1.5'
        }}>
          💡 <strong>Pro Tip:</strong> Make sure both players are comfortable with their controls before starting. 
          Practice the moves in the character selection screen!
        </p>
      </motion.div>
    </div>
  );
};

export default TwoPlayerPage;