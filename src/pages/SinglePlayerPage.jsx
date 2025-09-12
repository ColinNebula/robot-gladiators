import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import LoadingSpinner from '../components/LoadingSpinner';

const SinglePlayerPage = () => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const [selectedDifficulty, setSelectedDifficulty] = useState('normal');
  const [isLoading, setIsLoading] = useState(false);

  const difficulties = [
    {
      id: 'easy',
      name: 'Rookie',
      description: 'Perfect for beginners. AI uses basic attacks and moves slowly.',
      icon: '🟢',
      color: '#2ed573',
      aiLevel: 1
    },
    {
      id: 'normal',
      name: 'Warrior',
      description: 'Balanced challenge. AI uses varied attacks and decent strategy.',
      icon: '🟡',
      color: '#ffa502',
      aiLevel: 2
    },
    {
      id: 'hard',
      name: 'Champion',
      description: 'Serious challenge. AI uses advanced combos and tactics.',
      icon: '🔴',
      color: '#ff4757',
      aiLevel: 3
    },
    {
      id: 'expert',
      name: 'Legend',
      description: 'Ultimate challenge. AI masters all techniques and counters.',
      icon: '🟣',
      color: '#9c88ff',
      aiLevel: 4
    }
  ];

  const handleStartGame = () => {
    setIsLoading(true);
    
    // Store game configuration
    sessionStorage.setItem('gameMode', 'single-player');
    sessionStorage.setItem('difficulty', selectedDifficulty);
    sessionStorage.setItem('aiLevel', difficulties.find(d => d.id === selectedDifficulty).aiLevel);
    
    // Navigate to character selection after brief loading
    setTimeout(() => {
      navigate('/character-select');
    }, 1500);
  };

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
            🤖⚔️
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
            Initializing AI Opponent
          </h1>

          <p style={{
            fontSize: '1.2rem',
            color: currentTheme.colors.textSecondary,
            marginBottom: '2rem'
          }}>
            Difficulty: {difficulties.find(d => d.id === selectedDifficulty)?.name}
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
            rotate: [0, 10, -10, 0]
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
          🤖
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
          Single Player Campaign
        </h1>

        <p style={{
          fontSize: '1.3rem',
          color: currentTheme.colors.textSecondary,
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          Test your skills against AI opponents. Choose your difficulty level:
        </p>
      </motion.div>

      {/* Difficulty Selection */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        maxWidth: '1000px',
        width: '100%',
        marginBottom: '3rem'
      }}>
        {difficulties.map((difficulty, index) => (
          <motion.div
            key={difficulty.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            whileHover={{ 
              scale: 1.05,
              y: -5
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedDifficulty(difficulty.id)}
            style={{
              background: selectedDifficulty === difficulty.id 
                ? `linear-gradient(135deg, ${difficulty.color}20 0%, ${currentTheme.colors.surface} 100%)`
                : currentTheme.colors.surface,
              border: selectedDifficulty === difficulty.id 
                ? `3px solid ${difficulty.color}`
                : `2px solid ${currentTheme.colors.border}`,
              borderRadius: '16px',
              padding: '1.5rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Selection Indicator */}
            {selectedDifficulty === difficulty.id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: difficulty.color,
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

            <div style={{
              fontSize: '2.5rem',
              marginBottom: '1rem'
            }}>
              {difficulty.icon}
            </div>

            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: selectedDifficulty === difficulty.id ? difficulty.color : currentTheme.colors.text,
              marginBottom: '0.5rem'
            }}>
              {difficulty.name}
            </h3>

            <p style={{
              fontSize: '0.9rem',
              color: currentTheme.colors.textSecondary,
              lineHeight: '1.5'
            }}>
              {difficulty.description}
            </p>

            <div style={{
              marginTop: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              <span style={{
                fontSize: '0.8rem',
                color: currentTheme.colors.textSecondary
              }}>
                AI Level:
              </span>
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: i < difficulty.aiLevel ? difficulty.color : `${currentTheme.colors.textSecondary}30`
                  }}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </div>

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
            background: currentTheme.gradients.primary,
            border: 'none',
            borderRadius: '12px',
            padding: '1rem 2rem',
            color: '#fff',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: `0 4px 15px ${currentTheme.colors.primary}30`,
            transition: 'all 0.3s ease'
          }}
        >
          Start Battle →
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

      {/* Info Box */}
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
          maxWidth: '500px'
        }}
      >
        <p style={{
          color: currentTheme.colors.textSecondary,
          fontSize: '0.9rem',
          fontStyle: 'italic',
          margin: 0,
          lineHeight: '1.5'
        }}>
          💡 <strong>Tip:</strong> Start with Rookie difficulty to learn the controls, 
          then work your way up to Legend for the ultimate challenge!
        </p>
      </motion.div>
    </div>
  );
};

export default SinglePlayerPage;