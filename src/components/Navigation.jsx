import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useGame } from '../context/GameContext';
import { useGamepad } from '../hooks/useGameHooks';

const Navigation = () => {
  const location = useLocation();
  const { currentTheme, toggleTheme, availableThemes } = useTheme();
  const { state: gameState } = useGame();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { gamepad, getButtonPressed } = useGamepad();

  // Provide fallback values if theme context is not ready
  const theme = currentTheme || {
    name: 'dark',
    colors: {
      surface: '#1a1a1a',
      primary: '#00d4ff',
      text: '#ffffff',
      background: '#000000'
    },
    shadows: {
      medium: '0 4px 6px rgba(0, 0, 0, 0.1)',
      large: '0 10px 15px rgba(0, 0, 0, 0.1)'
    }
  };

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/play', label: 'Play', icon: '🎮' },
    { path: '/character-select', label: 'Characters', icon: '👤' },
    { path: '/enhanced-demo', label: 'Engine Demo', icon: '🚀' },
    { path: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
    { path: '/about', label: 'About', icon: 'ℹ️' }
  ];

  // Gamepad navigation
  useEffect(() => {
    if (!gamepad) return;

    const handleGamepadInput = () => {
      if (getButtonPressed(12)) { // D-pad up
        setSelectedIndex(prev => Math.max(0, prev - 1));
      } else if (getButtonPressed(13)) { // D-pad down
        setSelectedIndex(prev => Math.min(navItems.length - 1, prev + 1));
      } else if (getButtonPressed(0)) { // A button
        const selectedItem = navItems[selectedIndex];
        if (selectedItem) {
          window.location.hash = selectedItem.path;
        }
      }
    };

    const interval = setInterval(handleGamepadInput, 100);
    return () => clearInterval(interval);
  }, [gamepad, selectedIndex, navItems]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % navItems.length);
      } else if (e.key === 'Enter' && document.activeElement.tagName === 'A') {
        document.activeElement.click();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navItems.length]);

  const handleThemeToggle = () => {
    if (!availableThemes || !theme?.name) return;
    const themeNames = Object.keys(availableThemes);
    if (!themeNames || themeNames.length === 0) return;
    const currentIndex = themeNames.indexOf(theme.name);
    const nextIndex = (currentIndex + 1) % themeNames.length;
    if (toggleTheme && themeNames[nextIndex]) {
      toggleTheme(themeNames[nextIndex]);
    }
  };

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '80px',
      background: `linear-gradient(135deg, ${theme.colors.surface}95, ${theme.colors.primary}15, ${theme.colors.surface}95)`,
      backdropFilter: 'blur(15px)',
      borderBottom: `2px solid ${theme.colors.primary}40`,
      borderImage: `linear-gradient(90deg, transparent, ${theme.colors.primary}, transparent) 1`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      zIndex: 1000,
      boxShadow: `${theme.shadows.medium}, 0 0 30px ${theme.colors.primary}20`,
      overflow: 'hidden'
    }}>
      {/* Animated Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 50%, ${theme.colors.primary}10 0%, transparent 50%),
          radial-gradient(circle at 80% 50%, ${theme.colors.primary}08 0%, transparent 50%),
          linear-gradient(90deg, transparent 0%, ${theme.colors.primary}05 50%, transparent 100%)
        `,
        opacity: 0.6,
        animation: 'pulse 4s ease-in-out infinite',
        pointerEvents: 'none'
      }} />

      {/* Floating Particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            width: '2px',
            height: '2px',
            background: theme.colors.primary,
            borderRadius: '50%',
            left: `${10 + (i * 12)}%`,
            top: `${30 + (i % 3) * 20}%`,
            boxShadow: `0 0 4px ${theme.colors.primary}`,
            pointerEvents: 'none'
          }}
          animate={{
            y: [0, -10, 0],
            opacity: [0.3, 1, 0.3],
            scale: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 3 + (i * 0.5),
            repeat: Infinity,
            delay: i * 0.4,
            ease: 'easeInOut'
          }}
        />
      ))}

      {/* Enhanced Logo */}
      <motion.div
        whileHover={{ scale: 1.08, rotateY: 5 }}
        whileTap={{ scale: 0.95 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: 'clamp(1.4rem, 3.5vw, 2.2rem)',
          fontWeight: '900',
          fontFamily: '"Orbitron", "Exo 2", monospace',
          background: `linear-gradient(135deg, ${theme.colors.primary}, #00f2fe, #764ba2)`,
          backgroundSize: '200% 100%',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          textDecoration: 'none',
          padding: 'clamp(0.6rem, 1.8vw, 1rem) clamp(1rem, 2.5vw, 1.8rem)',
          borderRadius: '12px',
          border: `2px solid ${theme.colors.primary}80`,
          backdropFilter: 'blur(10px)',
          boxShadow: `
            0 4px 15px ${theme.colors.primary}40,
            inset 0 1px 0 rgba(255, 255, 255, 0.15),
            0 0 0 1px ${theme.colors.primary}20
          `,
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer',
          letterSpacing: 'clamp(0.03em, 0.4vw, 0.08em)',
          minWidth: '180px'
        }}
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'linear'
        }}
      >
        {/* Logo Background Shimmer */}
        <motion.div
          style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: `linear-gradient(90deg, transparent, ${theme.colors.primary}40, transparent)`,
            pointerEvents: 'none'
          }}
          animate={{
            left: ['100%', '-100%']
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
        
        <motion.span
          style={{
            fontSize: 'clamp(1.8rem, 2.5vw, 2.5rem)',
            filter: 'drop-shadow(0 0 8px currentColor)',
            position: 'relative',
            zIndex: 2
          }}
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{
            rotate: { duration: 8, repeat: Infinity, ease: 'linear' },
            scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
          }}
        >
          ⚡
        </motion.span>
        <span 
          className="nav-logo"
          style={{
          background: `linear-gradient(135deg, ${theme.colors.primary}, #00f2fe, #764ba2)`,
          backgroundSize: '200% 100%',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          fontWeight: '900',
          position: 'relative',
          zIndex: 2,
          textShadow: `0 0 20px ${theme.colors.primary}60`,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
        }}>
          Nebula Wars
        </span>
      </motion.div>

      {/* Desktop Navigation */}
      <div 
        className="hide-mobile nav-desktop"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2rem'
        }}
      >
        <div 
          className="nav-items"
          style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center'
          }}
        >
          {navItems.map((item, index) => (
            <motion.div
              key={item.path}
              whileHover={{ y: -2, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <NavLink
                to={item.path}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                {({ isActive }) => (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.75rem 1.25rem',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      color: isActive ? theme.colors.background : theme.colors.text,
                      background: isActive 
                        ? `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primary}dd)` 
                        : selectedIndex === index 
                          ? `linear-gradient(135deg, ${theme.colors.primary}25, ${theme.colors.primary}15)` 
                          : 'rgba(255, 255, 255, 0.05)',
                      border: isActive 
                        ? `2px solid ${theme.colors.primary}` 
                        : selectedIndex === index 
                          ? `2px solid ${theme.colors.primary}80` 
                          : `1px solid ${theme.colors.primary}30`,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      fontSize: '0.95rem',
                      fontWeight: isActive ? '700' : '500',
                      fontFamily: '"Inter", "Segoe UI", sans-serif',
                      position: 'relative',
                      overflow: 'hidden',
                      backdropFilter: 'blur(10px)',
                      boxShadow: isActive 
                        ? `0 4px 20px ${theme.colors.primary}40, 0 0 0 1px ${theme.colors.primary}20`
                        : selectedIndex === index 
                          ? `0 2px 10px ${theme.colors.primary}20`
                          : '0 2px 4px rgba(0, 0, 0, 0.1)',
                      textShadow: isActive ? `0 0 8px ${theme.colors.primary}50` : 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {/* Navigation Item Shimmer Effect */}
                    {(isActive || selectedIndex === index) && (
                      <motion.div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '100%',
                          height: '100%',
                          background: `linear-gradient(90deg, transparent, ${theme.colors.primary}30, transparent)`,
                          pointerEvents: 'none'
                        }}
                        animate={{
                          left: ['100%', '-100%']
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'linear'
                        }}
                      />
                    )}
                    
                    <motion.span
                      style={{
                        fontSize: '1.1rem',
                        filter: isActive || selectedIndex === index ? 'drop-shadow(0 0 4px currentColor)' : 'none',
                        position: 'relative',
                        zIndex: 2
                      }}
                      animate={isActive || selectedIndex === index ? {
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, 0]
                      } : {}}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                    >
                      {item.icon}
                    </motion.span>
                    <span className="hide-mobile" style={{
                      position: 'relative',
                      zIndex: 2,
                      letterSpacing: '0.02em'
                    }}>
                      {item.label}
                    </span>

                    {/* Active indicator dot */}
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: theme.colors.background,
                          boxShadow: `0 0 8px ${theme.colors.background}`
                        }}
                      />
                    )}
                  </div>
                )}
              </NavLink>
            </motion.div>
          ))}
        </div>

        {/* Enhanced Theme Toggle */}
        <motion.button
          whileHover={{ scale: 1.15, rotateY: 180 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleThemeToggle}
          style={{
            background: `linear-gradient(135deg, ${theme.colors.primary}20, ${theme.colors.primary}10)`,
            border: `2px solid ${theme.colors.primary}60`,
            borderRadius: '50%',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '1.4rem',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            backdropFilter: 'blur(10px)',
            boxShadow: `
              0 4px 15px ${theme.colors.primary}25,
              inset 0 1px 0 rgba(255, 255, 255, 0.1),
              0 0 0 1px ${theme.colors.primary}10
            `,
            position: 'relative',
            overflow: 'hidden'
          }}
          title={availableThemes && theme ? `Switch to ${Object.keys(availableThemes).find(name => name !== theme.name)} theme` : 'Switch theme'}
        >
          {/* Theme Toggle Background Animation */}
          <motion.div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `conic-gradient(from 0deg, ${theme.colors.primary}30, transparent, ${theme.colors.primary}30)`,
              borderRadius: '50%',
              pointerEvents: 'none'
            }}
            animate={{
              rotate: [0, 360]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
          
          <motion.span
            style={{
              position: 'relative',
              zIndex: 2,
              filter: 'drop-shadow(0 0 8px currentColor)'
            }}
            animate={{
              rotate: [0, 360],
              scale: [1, 1.2, 1]
            }}
            transition={{
              rotate: { duration: 6, repeat: Infinity, ease: 'linear' },
              scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
            }}
          >
            {theme?.name === 'dark' && '🌙'}
            {theme?.name === 'light' && '☀️'}
            {theme?.name === 'neon' && '✨'}
            {theme?.name === 'retro' && '🕹️'}
          </motion.span>

          {/* Theme Toggle Pulse Effect */}
          <motion.div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: `2px solid ${theme.colors.primary}`,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none'
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.8, 0, 0.8]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        </motion.button>

        {/* Enhanced Mobile Menu Toggle */}
        <motion.button
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9, rotate: -5 }}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="hide-desktop"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.primary}20, ${theme.colors.primary}10)`,
            border: `2px solid ${theme.colors.primary}60`,
            borderRadius: '12px',
            width: 'clamp(44px, 8vw, 52px)',
            height: 'clamp(44px, 8vw, 52px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 'clamp(1.2rem, 4vw, 1.6rem)',
            color: theme.colors.primary,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            backdropFilter: 'blur(10px)',
            boxShadow: `0 4px 15px ${theme.colors.primary}25`,
            position: 'relative',
            overflow: 'hidden',
            minWidth: '44px',
            minHeight: '44px'
          }}
        >
          <motion.span
            animate={{ rotate: isMenuOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            style={{
              filter: 'drop-shadow(0 0 4px currentColor)'
            }}
          >
            {isMenuOpen ? '✕' : '☰'}
          </motion.span>
        </motion.button>
      </div>

      {/* Enhanced Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: `linear-gradient(135deg, ${theme.colors.surface}95, ${theme.colors.primary}10)`,
              backdropFilter: 'blur(15px)',
              borderBottom: `2px solid ${theme.colors.primary}40`,
              padding: 'clamp(1rem, 4vw, 2rem)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'clamp(0.5rem, 2vw, 1rem)',
              boxShadow: `${theme.shadows.large}, 0 0 30px ${theme.colors.primary}20`,
              borderRadius: '0 0 16px 16px',
              maxHeight: '70vh',
              overflowY: 'auto'
            }}
            className="hide-desktop mobile-menu"
          >
            {navItems.map((item, index) => (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <NavLink
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {({ isActive }) => (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem 1.5rem',
                        borderRadius: '12px',
                        textDecoration: 'none',
                        color: isActive ? theme.colors.background : theme.colors.text,
                        background: isActive 
                          ? `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primary}dd)` 
                          : `rgba(255, 255, 255, 0.05)`,
                        border: isActive 
                          ? `2px solid ${theme.colors.primary}` 
                          : `1px solid ${theme.colors.primary}30`,
                        transition: 'all 0.3s ease',
                        fontSize: '1.1rem',
                        fontWeight: isActive ? '700' : '500',
                        backdropFilter: 'blur(10px)',
                        boxShadow: isActive 
                          ? `0 4px 20px ${theme.colors.primary}40`
                          : '0 2px 8px rgba(0, 0, 0, 0.1)',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ fontSize: '1.3rem' }}>{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                  )}
                </NavLink>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Game Status Indicators */}
      <AnimatePresence>
        {gameState.isInGame && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
            style={{
              position: 'absolute',
              right: 'clamp(8px, 15vw, 140px)',
              top: '50%',
              transform: 'translateY(-50%)',
              background: `linear-gradient(135deg, ${theme.colors.success || theme.colors.primary}, ${theme.colors.success || theme.colors.primary}dd)`,
              color: theme.colors.background,
              padding: 'clamp(0.3rem, 1.5vw, 0.5rem) clamp(0.6rem, 2.5vw, 1rem)',
              borderRadius: '20px',
              fontSize: 'clamp(0.75rem, 2vw, 0.9rem)',
              fontWeight: '600',
              border: `2px solid ${theme.colors.success || theme.colors.primary}`,
              boxShadow: `0 4px 15px ${theme.colors.success || theme.colors.primary}40`,
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(0.25rem, 1vw, 0.5rem)',
              zIndex: 999
            }}
          >
            <motion.span
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, 0]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              🎮
            </motion.span>
            <span>In Game</span>
            
            {/* Pulsing indicator */}
            <motion.div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: theme.colors.background,
                marginLeft: '0.25rem'
              }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [1, 0.5, 1]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connection Status Indicator */}
      <motion.div
        style={{
          position: 'absolute',
          right: gameState.isInGame ? 'clamp(120px, 25vw, 280px)' : 'clamp(8px, 15vw, 140px)',
          top: '50%',
          transform: 'translateY(-50%)',
          background: `linear-gradient(135deg, ${theme.colors.primary}20, ${theme.colors.primary}10)`,
          color: theme.colors.primary,
          padding: 'clamp(0.25rem, 1vw, 0.4rem) clamp(0.5rem, 2vw, 0.8rem)',
          borderRadius: '16px',
          fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)',
          fontWeight: '500',
          border: `1px solid ${theme.colors.primary}30`,
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(0.2rem, 0.8vw, 0.4rem)',
          transition: 'all 0.3s ease',
          zIndex: 998
        }}
        whileHover={{ scale: 1.05 }}
      >
        <motion.div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#00ff88'
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.7, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
        <span>Online</span>
      </motion.div>
    </nav>
  );
};

export default Navigation;