import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useGame } from '../context/GameContext';
import { useGamepad, useAudio } from '../hooks/useGameHooks';
import useGamepadNavigation from '../hooks/useGamepadNavigation';
// import StorageSettings from '../components/StorageSettings';

const SettingsPage = () => {
  const { 
    currentTheme, 
    toggleTheme, 
    availableThemes,
    accessibility,
    updateAccessibility,
    performance,
    updatePerformance
  } = useTheme();
  
  const { state: gameState, dispatch } = useGame();
  const { gamepad, connectedControllers } = useGamepad();
  const { volume, setVolume, isMuted, toggleMute } = useAudio();
  
  const [selectedSection, setSelectedSection] = useState(0);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const sections = [
    { id: 'display', label: 'Display & Theme', icon: '🎨' },
    { id: 'audio', label: 'Audio', icon: '🔊' },
    { id: 'controls', label: 'Controls', icon: '🎮' },
    { id: 'accessibility', label: 'Accessibility', icon: '♿' },
    { id: 'performance', label: 'Performance', icon: '⚡' },
    { id: 'storage', label: 'Storage', icon: '💾' },
    { id: 'data', label: 'Data & Privacy', icon: '🔒' }
  ];

  const navigate = useNavigate();

  // Create navigation items for gamepad
  const getNavigationItems = () => {
    const items = [];
    // Add section navigation
    sections.forEach((section, index) => {
      items.push(`section-${index}`);
    });
    // Add theme options
    availableThemes.forEach(theme => {
      items.push(`theme-${theme}`);
    });
    // Add other controls
    items.push('toggle-mute', 'volume-up', 'volume-down', 'back-to-menu');
    return items;
  };

  // Gamepad navigation setup
  const {
    selectedIndex,
    isGamepadConnected,
    isSelected
  } = useGamepadNavigation(getNavigationItems(), {
    onSelect: (item) => {
      if (item.startsWith('section-')) {
        const sectionIndex = parseInt(item.replace('section-', ''));
        setSelectedSection(sectionIndex);
      } else if (item.startsWith('theme-')) {
        const themeName = item.replace('theme-', '');
        handleThemeChange(themeName);
      } else if (item === 'toggle-mute') {
        toggleMute();
      } else if (item === 'volume-up') {
        setVolume(Math.min(100, volume + 10));
      } else if (item === 'volume-down') {
        setVolume(Math.max(0, volume - 10));
      } else if (item === 'back-to-menu') {
        navigate('/');
      }
    },
    onBack: () => {
      navigate('/');
    },
    wrapAround: true
  });

  const handleThemeChange = (themeName) => {
    toggleTheme(themeName);
  };

  const handleResetData = () => {
    if (showResetConfirm) {
      dispatch({ type: 'RESET_ALL_DATA' });
      localStorage.clear();
      setShowResetConfirm(false);
      alert('All data has been reset successfully!');
    } else {
      setShowResetConfirm(true);
      setTimeout(() => setShowResetConfirm(false), 5000);
    }
  };

  const renderDisplaySettings = () => (
    <div className="settings-section">
      <h3>Theme Selection</h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {Object.entries(availableThemes).map(([name, theme]) => (
          <motion.div
            key={name}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleThemeChange(name)}
            style={{
              padding: '1rem',
              borderRadius: '12px',
              border: currentTheme.name === name 
                ? `3px solid ${theme.colors.primary}` 
                : `2px solid ${theme.colors.primary}30`,
              background: `linear-gradient(135deg, ${theme.colors.surface}, ${theme.colors.primary}20)`,
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: theme.colors.primary
              }} />
              <h4 style={{
                color: theme.colors.text,
                margin: 0,
                textTransform: 'capitalize'
              }}>
                {name}
              </h4>
              {currentTheme.name === name && <span>✓</span>}
            </div>
            <div style={{
              display: 'flex',
              gap: '0.25rem'
            }}>
              {[theme.colors.primary, theme.colors.secondary, theme.colors.surface].map((color, i) => (
                <div
                  key={i}
                  style={{
                    width: '30px',
                    height: '15px',
                    background: color,
                    borderRadius: '3px'
                  }}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="setting-group">
        <h4>Display Options</h4>
        <label className="setting-item">
          <input
            type="checkbox"
            checked={performance.reducedMotion}
            onChange={(e) => updatePerformance({ reducedMotion: e.target.checked })}
          />
          <span>Reduce motion effects</span>
        </label>
        
        <label className="setting-item">
          <input
            type="checkbox"
            checked={performance.showFPS}
            onChange={(e) => updatePerformance({ showFPS: e.target.checked })}
          />
          <span>Show FPS counter</span>
        </label>
      </div>
    </div>
  );

  const renderAudioSettings = () => (
    <div className="settings-section">
      <div className="setting-group">
        <h4>Volume Controls</h4>
        
        <div className="setting-item">
          <label>Master Volume: {Math.round(volume * 100)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            style={{
              width: '100%',
              margin: '0.5rem 0'
            }}
          />
        </div>

        <label className="setting-item">
          <input
            type="checkbox"
            checked={isMuted}
            onChange={toggleMute}
          />
          <span>Mute all sounds</span>
        </label>
      </div>

      <div className="setting-group">
        <h4>Sound Effects</h4>
        <label className="setting-item">
          <input
            type="checkbox"
            checked={gameState.settings.soundEnabled}
            onChange={(e) => dispatch({ 
              type: 'UPDATE_SETTINGS', 
              payload: { soundEnabled: e.target.checked }
            })}
          />
          <span>Enable sound effects</span>
        </label>
        
        <label className="setting-item">
          <input
            type="checkbox"
            checked={gameState.settings.musicEnabled}
            onChange={(e) => dispatch({ 
              type: 'UPDATE_SETTINGS', 
              payload: { musicEnabled: e.target.checked }
            })}
          />
          <span>Enable background music</span>
        </label>
      </div>
    </div>
  );

  const renderControlsSettings = () => (
    <div className="settings-section">
      <div className="setting-group">
        <h4>Gamepad Status</h4>
        {connectedControllers.length > 0 ? (
          <div>
            <p>✅ {connectedControllers.length} controller(s) connected</p>
            {connectedControllers.map((controller, index) => (
              <div key={index} style={{
                padding: '0.5rem',
                background: currentTheme.colors.surface,
                borderRadius: '8px',
                marginBottom: '0.5rem'
              }}>
                <strong>Player {index + 1}:</strong> {controller.id}
              </div>
            ))}
          </div>
        ) : (
          <p>❌ No controllers connected</p>
        )}
      </div>

      <div className="setting-group">
        <h4>Input Settings</h4>
        <label className="setting-item">
          <input
            type="checkbox"
            checked={gameState.settings.vibrationEnabled}
            onChange={(e) => dispatch({ 
              type: 'UPDATE_SETTINGS', 
              payload: { vibrationEnabled: e.target.checked }
            })}
          />
          <span>Controller vibration</span>
        </label>
        
        <label className="setting-item">
          <input
            type="checkbox"
            checked={gameState.settings.keyboardEnabled}
            onChange={(e) => dispatch({ 
              type: 'UPDATE_SETTINGS', 
              payload: { keyboardEnabled: e.target.checked }
            })}
          />
          <span>Keyboard controls</span>
        </label>
      </div>
    </div>
  );

  const renderAccessibilitySettings = () => (
    <div className="settings-section">
      <div className="setting-group">
        <h4>Visual Accessibility</h4>
        
        <label className="setting-item">
          <input
            type="checkbox"
            checked={accessibility.highContrast}
            onChange={(e) => updateAccessibility({ highContrast: e.target.checked })}
          />
          <span>High contrast mode</span>
        </label>
        
        <label className="setting-item">
          <input
            type="checkbox"
            checked={accessibility.reducedMotion}
            onChange={(e) => updateAccessibility({ reducedMotion: e.target.checked })}
          />
          <span>Reduce motion</span>
        </label>
        
        <div className="setting-item">
          <label>Text Size: {accessibility.fontSize}px</label>
          <input
            type="range"
            min="12"
            max="24"
            value={accessibility.fontSize}
            onChange={(e) => updateAccessibility({ fontSize: parseInt(e.target.value) })}
            style={{ width: '100%', margin: '0.5rem 0' }}
          />
        </div>
      </div>

      <div className="setting-group">
        <h4>Audio Accessibility</h4>
        <label className="setting-item">
          <input
            type="checkbox"
            checked={accessibility.screenReader}
            onChange={(e) => updateAccessibility({ screenReader: e.target.checked })}
          />
          <span>Screen reader support</span>
        </label>
        
        <label className="setting-item">
          <input
            type="checkbox"
            checked={accessibility.visualIndicators}
            onChange={(e) => updateAccessibility({ visualIndicators: e.target.checked })}
          />
          <span>Visual sound indicators</span>
        </label>
      </div>
    </div>
  );

  const renderPerformanceSettings = () => (
    <div className="settings-section">
      <div className="setting-group">
        <h4>Graphics Quality</h4>
        
        <div className="setting-item">
          <label>Graphics Quality</label>
          <select
            value={performance.quality}
            onChange={(e) => updatePerformance({ quality: e.target.value })}
            style={{
              padding: '0.5rem',
              borderRadius: '8px',
              border: `1px solid ${currentTheme.colors.primary}`,
              background: currentTheme.colors.surface,
              color: currentTheme.colors.text,
              width: '100%',
              marginTop: '0.5rem'
            }}
          >
            <option value="low">Low (Better Performance)</option>
            <option value="medium">Medium</option>
            <option value="high">High (Better Quality)</option>
          </select>
        </div>
        
        <label className="setting-item">
          <input
            type="checkbox"
            checked={performance.particles}
            onChange={(e) => updatePerformance({ particles: e.target.checked })}
          />
          <span>Enable particle effects</span>
        </label>
        
        <label className="setting-item">
          <input
            type="checkbox"
            checked={performance.shadows}
            onChange={(e) => updatePerformance({ shadows: e.target.checked })}
          />
          <span>Enable shadows</span>
        </label>
      </div>

      <div className="setting-group">
        <h4>Advanced Settings</h4>
        <div className="setting-item">
          <label>Target FPS</label>
          <select
            value={performance.targetFPS}
            onChange={(e) => updatePerformance({ targetFPS: parseInt(e.target.value) })}
            style={{
              padding: '0.5rem',
              borderRadius: '8px',
              border: `1px solid ${currentTheme.colors.primary}`,
              background: currentTheme.colors.surface,
              color: currentTheme.colors.text,
              width: '100%',
              marginTop: '0.5rem'
            }}
          >
            <option value="30">30 FPS</option>
            <option value="60">60 FPS</option>
            <option value="120">120 FPS</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderDataSettings = () => (
    <div className="settings-section">
      <div className="setting-group">
        <h4>Game Data</h4>
        <p>Total battles: {gameState?.statistics?.battlesPlayed || 0}</p>
        <p>Achievements unlocked: {gameState?.statistics?.achievementsUnlocked || 0}</p>
        <p>High score: {(gameState?.highScore || 0).toLocaleString()}</p>
      </div>

      <div className="setting-group">
        <h4>Data Management</h4>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => dispatch({ type: 'EXPORT_DATA' })}
          style={{
            padding: '0.75rem 1.5rem',
            background: currentTheme.colors.primary,
            color: currentTheme.colors.background,
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            marginRight: '1rem',
            marginBottom: '1rem'
          }}
        >
          Export Data
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleResetData}
          style={{
            padding: '0.75rem 1.5rem',
            background: showResetConfirm ? '#ff4757' : 'transparent',
            color: showResetConfirm ? '#fff' : '#ff4757',
            border: `2px solid #ff4757`,
            borderRadius: '8px',
            cursor: 'pointer',
            marginBottom: '1rem'
          }}
        >
          {showResetConfirm ? 'Click Again to Confirm' : 'Reset All Data'}
        </motion.button>
        
        {showResetConfirm && (
          <p style={{ color: '#ff4757', fontSize: '0.9rem' }}>
            ⚠️ This will permanently delete all your progress, achievements, and high scores!
          </p>
        )}
      </div>
    </div>
  );

  const renderCurrentSection = () => {
    switch (sections[selectedSection].id) {
      case 'display': return renderDisplaySettings();
      case 'audio': return renderAudioSettings();
      case 'controls': return renderControlsSettings();
      case 'accessibility': return renderAccessibilitySettings();
      case 'performance': return renderPerformanceSettings();
      case 'storage': return (
        <div>
          <h3>Storage Management</h3>
          <p>Storage management features will be available in a future update.</p>
          <p>Current storage: {JSON.stringify(Object.keys(sessionStorage)).length} session items</p>
        </div>
      );
      case 'data': return renderDataSettings();
      default: return renderDisplaySettings();
    }
  };

  return (
    <div style={{
      minHeight: '80vh',
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          color: currentTheme.colors.text,
          marginBottom: '2rem',
          textAlign: 'center'
        }}
      >
        Settings ⚙️
      </motion.h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gap: '2rem',
        minHeight: '600px'
      }}>
        {/* Settings Navigation */}
        <div style={{
          minWidth: '200px',
          background: currentTheme.colors.surface,
          borderRadius: '12px',
          padding: '1rem',
          height: 'fit-content'
        }}>
          {sections.map((section, index) => (
            <motion.div
              key={section.id}
              whileHover={{ x: 5 }}
              onClick={() => setSelectedSection(index)}
              style={{
                padding: '1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                background: selectedSection === index 
                  ? currentTheme.colors.primary 
                  : 'transparent',
                color: selectedSection === index 
                  ? currentTheme.colors.background 
                  : currentTheme.colors.text,
                marginBottom: '0.5rem',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span>{section.icon}</span>
              <span className="hide-mobile">{section.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Settings Content */}
        <motion.div
          key={selectedSection}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            background: currentTheme.colors.surface,
            borderRadius: '12px',
            padding: '2rem'
          }}
        >
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: currentTheme.colors.text,
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>{sections[selectedSection].icon}</span>
            {sections[selectedSection].label}
          </h2>
          
          {renderCurrentSection()}
        </motion.div>
      </div>

      {/* Global Styles for Settings */}
      <style>{`
        .settings-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .setting-group {
          padding: 1rem;
          background: ${currentTheme.colors.background}50;
          border-radius: 8px;
          border: 1px solid ${currentTheme.colors.primary}30;
        }
        
        .setting-group h4 {
          margin: 0 0 1rem 0;
          color: ${currentTheme.colors.text};
          font-size: 1.1rem;
          font-weight: 600;
        }
        
        .setting-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
          cursor: pointer;
          color: ${currentTheme.colors.text};
        }
        
        .setting-item:last-child {
          margin-bottom: 0;
        }
        
        .setting-item input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: ${currentTheme.colors.primary};
        }
        
        .setting-item input[type="range"] {
          accent-color: ${currentTheme.colors.primary};
        }
        
        @media (max-width: 768px) {
          .settings-container {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SettingsPage;