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
      height: '70px',
      background: `linear-gradient(135deg, ${theme.colors.surface}95, ${theme.colors.primary}20)`,
      backdropFilter: 'blur(10px)',
      borderBottom: `1px solid ${theme.colors.primary}30`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      zIndex: 1000,
      boxShadow: theme.shadows.medium
    }}>
      {/* Logo */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: theme.colors.primary,
          textDecoration: 'none'
        }}
      >
        <span>⚡</span>
        <span>Nebula Wars</span>
      </motion.div>

      {/* Desktop Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2rem'
      }}>
        <div style={{
          display: 'flex',
          gap: '1rem'
        }}>
          {navItems.map((item, index) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                textDecoration: 'none',
                color: isActive ? theme.colors.background : theme.colors.text,
                background: isActive 
                  ? theme.colors.primary 
                  : selectedIndex === index 
                    ? `${theme.colors.primary}20` 
                    : 'transparent',
                border: selectedIndex === index ? `2px solid ${theme.colors.primary}` : '2px solid transparent',
                transition: 'all 0.3s ease',
                fontSize: '0.9rem',
                fontWeight: isActive ? '600' : '400'
              })}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span>{item.icon}</span>
              <span className="hide-mobile">{item.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Theme Toggle */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleThemeToggle}
          style={{
            background: 'none',
            border: `2px solid ${theme.colors.primary}`,
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '1.2rem',
            transition: 'all 0.3s ease'
          }}
          title={availableThemes && theme ? `Switch to ${Object.keys(availableThemes).find(name => name !== theme.name)} theme` : 'Switch theme'}
        >
          {theme?.name === 'dark' && '🌙'}
          {theme?.name === 'light' && '☀️'}
          {theme?.name === 'neon' && '✨'}
          {theme?.name === 'retro' && '🕹️'}
        </motion.button>

        {/* Mobile Menu Toggle */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="hide-desktop"
          style={{
            background: 'none',
            border: `2px solid ${theme.colors.primary}`,
            borderRadius: '8px',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '1.2rem',
            color: theme.colors.primary
          }}
        >
          {isMenuOpen ? '✕' : '☰'}
        </motion.button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: theme.colors.surface,
              borderBottom: `1px solid ${theme.colors.primary}30`,
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              boxShadow: theme.shadows.large
            }}
            className="hide-desktop"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: isActive ? theme.colors.background : theme.colors.text,
                  background: isActive ? theme.colors.primary : 'transparent',
                  transition: 'all 0.3s ease',
                  fontSize: '1rem',
                  fontWeight: isActive ? '600' : '400'
                })}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Status Indicator */}
      {gameState.isInGame && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            position: 'absolute',
            right: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            background: theme.colors.success || theme.colors.primary,
            color: theme.colors.background,
            padding: '0.25rem 0.5rem',
            borderRadius: '12px',
            fontSize: '0.8rem',
            fontWeight: 'bold'
          }}
        >
          🎮 In Game
        </motion.div>
      )}
    </nav>
  );
};

export default Navigation;