import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useGame } from '../context/GameContext';
import useGamepadNavigation from '../hooks/useGamepadNavigation';
import LoadingSpinner from '../components/LoadingSpinner';

const HomePage = () => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { state: gameState, dispatch } = useGame();
  const [isLoading, setIsLoading] = useState(true);

  const menuItems = [
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
      label: 'Settings', 
      icon: '⚙️', 
      path: '/settings',
      description: 'Configure your experience'
    },
    { 
      label: 'Leaderboard', 
      icon: '🏆', 
      path: '/leaderboard',
      description: 'View top players'
    },
    { 
      label: 'About', 
      icon: 'ℹ️', 
      path: '/about',
      description: 'Game information'
    }
  ];

  // Gamepad navigation setup
  const {
    selectedIndex,
    isGamepadConnected,
    selectedItem,
    isSelected
  } = useGamepadNavigation(menuItems, {
    onSelect: (item) => {
      if (item && item.path) {
        navigate(item.path);
      }
    },
    onBack: () => {
      // On home page, back could close game or show exit dialog
      console.log('Back pressed on home page');
    },
    onStart: () => {
      // Start button on home page could open quick menu
      navigate('/play');
    },
    enabled: !isLoading,
    wrapAround: true,
    initialIndex: 0
  });

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

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
        {/* Enhanced Title with Particle Background */}
        <motion.div
          style={{
            position: 'relative',
            display: 'inline-block',
            marginBottom: '1rem'
          }}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          {/* Animated Stars/Particles Background */}
          <motion.div
            style={{
              position: 'absolute',
              top: '-20px',
              left: '-20px',
              right: '-20px',
              bottom: '-20px',
              pointerEvents: 'none',
              overflow: 'hidden',
              borderRadius: '20px'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                style={{
                  position: 'absolute',
                  width: '2px',
                  height: '2px',
                  background: `hsl(${200 + (i * 20)}, 80%, 70%)`,
                  borderRadius: '50%',
                  boxShadow: `0 0 6px hsl(${200 + (i * 20)}, 80%, 70%)`,
                  left: `${10 + (i * 7)}%`,
                  top: `${20 + (i * 5)}%`
                }}
                animate={{
                  scale: [0.5, 1.5, 0.5],
                  opacity: [0.3, 1, 0.3],
                  y: [0, -10, 0]
                }}
                transition={{
                  duration: 2 + (i * 0.3),
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'easeInOut'
                }}
              />
            ))}
          </motion.div>

          {/* Main Title with Enhanced Effects */}
          <motion.h1
            className="enhanced-title animated-element"
            style={{
              fontSize: 'clamp(2.5rem, 8vw, 6rem)',
              fontWeight: '900',
              fontFamily: '"Orbitron", "Exo 2", "Roboto", sans-serif',
              background: `linear-gradient(
                45deg,
                #4facfe 0%,
                #00f2fe 20%,
                #764ba2 40%,
                #667eea 60%,
                #f093fb 80%,
                #4facfe 100%
              )`,
              backgroundSize: '400% 100%',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              lineHeight: 1.1,
              letterSpacing: '0.1em',
              textShadow: `
                0 0 20px rgba(79, 172, 254, 0.5),
                0 0 40px rgba(79, 172, 254, 0.3),
                0 0 60px rgba(79, 172, 254, 0.2)
              `,
              filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5))',
              position: 'relative',
              zIndex: 2,
              textTransform: 'uppercase',
              WebkitTextStroke: '1px rgba(79, 172, 254, 0.1)'
            }}
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'linear'
            }}
            whileHover={{
              scale: 1.05,
              textShadow: `
                0 0 30px rgba(79, 172, 254, 0.8),
                0 0 60px rgba(79, 172, 254, 0.6),
                0 0 90px rgba(79, 172, 254, 0.4)
              `
            }}
          >
            NEBULA WARS
          </motion.h1>

          {/* Glowing Underline Effect */}
          <motion.div
            style={{
              position: 'absolute',
              bottom: '-10px',
              left: '50%',
              width: '80%',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #4facfe, #00f2fe, #4facfe, transparent)',
              borderRadius: '2px',
              transform: 'translateX(-50%)'
            }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
          />

          {/* Pulsing Glow Background */}
          <motion.div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '120%',
              height: '120%',
              background: 'radial-gradient(circle, rgba(79, 172, 254, 0.1), transparent)',
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1,
              pointerEvents: 'none'
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        </motion.div>
        
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
              padding: '1.5rem 3rem',
              fontSize: '1.3rem',
              fontWeight: 'bold',
              background: 'transparent',
              color: currentTheme.colors.primary,
              border: `2px solid ${currentTheme.colors.primary}`,
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: currentTheme.shadows.medium,
              transition: 'all 0.3s ease'
            }}
          >
            Start Battle 🚀
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
          Choose Your Path {isGamepadConnected && <span style={{ color: currentTheme.colors.primary }}>🎮</span>}
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          padding: '0 1rem'
        }}>
          {menuItems.map((action, index) => (
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
              style={{
                background: isSelected(index)
                  ? `linear-gradient(135deg, ${currentTheme.colors.primary}30, ${currentTheme.colors.secondary}30)`
                  : currentTheme.colors.surface,
                border: isSelected(index)
                  ? `3px solid ${currentTheme.colors.primary}`
                  : `1px solid ${currentTheme.colors.primary}30`,
                borderRadius: '16px',
                padding: '2rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'center',
                boxShadow: isSelected(index) 
                  ? `0 0 20px ${currentTheme.colors.primary}40`
                  : currentTheme.shadows.medium,
                transform: isSelected(index) ? 'translateY(-2px)' : 'translateY(0)',
                position: 'relative'
              }}
            >
              {isSelected(index) && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: currentTheme.colors.primary,
                    color: currentTheme.colors.background,
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  {isGamepadConnected ? '🎮' : '👆'}
                </motion.div>
              )}
              
              <div style={{
                fontSize: '3rem',
                marginBottom: '1rem',
                filter: isSelected(index) ? 'brightness(1.2)' : 'brightness(1)'
              }}>
                {action.icon}
              </div>
              
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: isSelected(index) ? currentTheme.colors.primary : currentTheme.colors.text,
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