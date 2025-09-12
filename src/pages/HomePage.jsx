import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useGame } from '../context/GameContext';
import { useGamepad } from '../hooks/useGameHooks';
import LoadingSpinner from '../components/LoadingSpinner';

const HomePage = () => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { state: gameState, dispatch } = useGame();
  const { gamepad, getButtonPressed } = useGamepad();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const quickActions = [
    { 
      label: 'Quick Battle', 
      icon: '⚔️', 
      path: '/play',
      description: 'Jump into battle immediately'
    },
    { 
      label: 'Tournament', 
      icon: '🏆', 
      path: '/tournament',
      description: 'Compete in the galactic championship'
    },
    { 
      label: 'Multiplayer', 
      icon: '👥', 
      path: '/multiplayer',
      description: 'Battle against other players'
    },
    { 
      label: 'Training', 
      icon: '🎯', 
      path: '/training',
      description: 'Practice your combat skills'
    }
  ];

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Gamepad navigation
  useEffect(() => {
    if (!gamepad) return;

    const handleGamepadInput = () => {
      if (getButtonPressed(12)) { // D-pad up
        setSelectedIndex(prev => Math.max(0, prev - 1));
      } else if (getButtonPressed(13)) { // D-pad down
        setSelectedIndex(prev => Math.min(quickActions.length - 1, prev + 1));
      } else if (getButtonPressed(0)) { // A button
        const selectedAction = quickActions[selectedIndex];
        if (selectedAction) {
          navigate(selectedAction.path);
        }
      }
    };

    const interval = setInterval(handleGamepadInput, 100);
    return () => clearInterval(interval);
  }, [gamepad, selectedIndex, quickActions, navigate]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        flexDirection: 'column',
        gap: '2rem'
      }}>
        <LoadingSpinner size="large" />
        <p style={{ color: currentTheme.colors.textSecondary }}>
          Initializing Nebula Wars...
        </p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      padding: '2rem 1rem',
      position: 'relative',
      background: `linear-gradient(135deg, ${currentTheme.colors.background}, ${currentTheme.colors.surface})`,
      backgroundImage: `
        linear-gradient(rgba(10, 10, 30, 0.85), rgba(26, 26, 58, 0.85)),
        url('/assets/images/mech3.png')
      `,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed'
    }}>
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          textAlign: 'center',
          marginBottom: '4rem',
          position: 'relative',
          zIndex: 2,
          background: 'rgba(10, 10, 30, 0.6)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '3rem 2rem',
          border: '1px solid rgba(79, 172, 254, 0.2)'
        }}
      >
        <motion.h1
          style={{
            fontSize: 'clamp(2.5rem, 8vw, 6rem)',
            fontWeight: 'bold',
            background: currentTheme.gradients.primary,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            marginBottom: '1rem',
            lineHeight: 1.2
          }}
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'linear'
          }}
        >
          NEBULA WARS
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          style={{
            fontSize: '1.25rem',
            color: currentTheme.colors.textSecondary,
            maxWidth: '600px',
            margin: '0 auto 2rem',
            lineHeight: 1.6
          }}
        >
          Enter the ultimate robot gladiator arena. Customize your fighter, 
          master devastating combos, and claim victory in the cosmic battlegrounds.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/play')}
            style={{
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              background: currentTheme.gradients.primary,
              color: currentTheme.colors.background,
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: currentTheme.shadows.medium,
              transition: 'all 0.3s ease'
            }}
          >
            Start Battle 🚀
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/leaderboard')}
            style={{
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              background: 'transparent',
              color: currentTheme.colors.primary,
              border: `2px solid ${currentTheme.colors.primary}`,
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            View Leaderboard 🏆
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        style={{
          maxWidth: '1600px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 2,
          background: 'rgba(10, 10, 30, 0.5)',
          backdropFilter: 'blur(8px)',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid rgba(79, 172, 254, 0.15)'
        }}
      >
        <h2 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: currentTheme.colors.text,
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          Choose Your Path
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          padding: '0 1rem'
        }}>
          {quickActions.map((action, index) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1, duration: 0.6 }}
              whileHover={{ 
                scale: 1.05,
                y: -5,
                boxShadow: currentTheme.shadows.large
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(action.path)}
              onMouseEnter={() => setSelectedIndex(index)}
              style={{
                background: selectedIndex === index 
                  ? `linear-gradient(135deg, ${currentTheme.colors.primary}20, ${currentTheme.colors.secondary}20)`
                  : currentTheme.colors.surface,
                border: selectedIndex === index 
                  ? `2px solid ${currentTheme.colors.primary}`
                  : `1px solid ${currentTheme.colors.primary}30`,
                borderRadius: '16px',
                padding: '2rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'center',
                boxShadow: currentTheme.shadows.medium
              }}
            >
              <div style={{
                fontSize: '3rem',
                marginBottom: '1rem'
              }}>
                {action.icon}
              </div>
              
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: currentTheme.colors.text,
                marginBottom: '0.5rem'
              }}>
                {action.label}
              </h3>
              
              <p style={{
                color: currentTheme.colors.textSecondary,
                fontSize: '0.9rem',
                lineHeight: 1.5,
                margin: 0
              }}>
                {action.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Stats Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        style={{
          marginTop: '4rem',
          padding: '2rem',
          background: 'rgba(26, 26, 58, 0.7)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          textAlign: 'center',
          maxWidth: '1000px',
          margin: '4rem auto 0',
          position: 'relative',
          zIndex: 2,
          border: '1px solid rgba(79, 172, 254, 0.2)'
        }}
      >
        <h3 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: currentTheme.colors.text,
          marginBottom: '1.5rem'
        }}>
          Your Combat Record
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1.5rem'
        }}>
          <div>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: currentTheme.colors.primary
            }}>
              {gameState?.statistics?.battlesWon || 0}
            </div>
            <div style={{
              color: currentTheme.colors.textSecondary,
              fontSize: '0.9rem'
            }}>
              Battles Won
            </div>
          </div>
          
          <div>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: currentTheme.colors.secondary
            }}>
              {(gameState?.statistics?.totalDamageDealt || 0).toLocaleString()}
            </div>
            <div style={{
              color: currentTheme.colors.textSecondary,
              fontSize: '0.9rem'
            }}>
              Total Damage
            </div>
          </div>
          
          <div>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: currentTheme.colors.success || currentTheme.colors.primary
            }}>
              {gameState?.statistics?.achievementsUnlocked || 0}
            </div>
            <div style={{
              color: currentTheme.colors.textSecondary,
              fontSize: '0.9rem'
            }}>
              Achievements
            </div>
          </div>
          
          <div>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: currentTheme.colors.warning || currentTheme.colors.secondary
            }}>
              ${(gameState?.highScore || 0).toLocaleString()}
            </div>
            <div style={{
              color: currentTheme.colors.textSecondary,
              fontSize: '0.9rem'
            }}>
              High Score
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default HomePage;