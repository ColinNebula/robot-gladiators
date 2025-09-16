import React, { useState, useEffect, useRef } from 'react';
import AnimatedSprite from './AnimatedSprite';
import useGamepadNavigation from '../hooks/useGamepadNavigation';
import { 
  ENHANCED_CHARACTERS, 
  getUnlockedCharacters, 
  calculateCharacterPower,
  getCharacterProgression,
  CHARACTER_RARITY,
  CHARACTER_ROLES
} from '../data/enhancedCharacters';
import '../styles/CharacterSelect.css';

// Legacy characters for backwards compatibility
const CHARACTERS = ENHANCED_CHARACTERS.map(char => ({
  id: char.id,
  name: char.name,
  avatar: char.avatar,
  spriteId: char.spriteId,
  description: char.description,
  health: char.stats.health,
  attack: char.stats.attack,
  color: char.theme.primary,
  abilities: char.abilities.map(ability => ability.description)
}));

const CharacterSelect = ({ onSelect }) => {
  // Get game mode from session storage
  const storedGameMode = sessionStorage.getItem('gameMode');
  const initialMode = storedGameMode === 'two-player' ? 'two-player' : 'single';
  
  // Enhanced state management
  const [player1Selected, setPlayer1Selected] = useState(CHARACTERS[0].id);
  const [player2Selected, setPlayer2Selected] = useState(CHARACTERS[1].id);
  const [gamepadConnected, setGamepadConnected] = useState(false);
  const [selectionMode, setSelectionMode] = useState(initialMode);
  const [showControllerConfig, setShowControllerConfig] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [navigationMode, setNavigationMode] = useState('character');
  
  // New enhanced features
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'detailed', 'stats'
  const [filterRole, setFilterRole] = useState('all');
  const [filterRarity, setFilterRarity] = useState('all');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);
  const [selectedCharacterDetails, setSelectedCharacterDetails] = useState(null);
  const [animationPreview, setAnimationPreview] = useState('idle');
  const [playerLevel] = useState(25); // Mock player level
  const [unlockedAchievements] = useState(['first_critical', 'tank_master', 'speed_demon']);
  const [hoveredCharacter, setHoveredCharacter] = useState(null);
  const [characterProgression, setCharacterProgression] = useState({});
  const [showHelpOverlay, setShowHelpOverlay] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const audioRef = useRef(null);

  // Controller settings
  const [controllerSettings, setControllerSettings] = useState({
    sensitivity: 0.8,
    deadzone: 0.1,
    vibration: true,
    autoRepeat: false,
    buttonLayout: 'default'
  });
  const [connectedControllers, setConnectedControllers] = useState([]);

  // Get filtered characters based on current filters
  const getFilteredCharacters = () => {
    let characters = showUnlockedOnly 
      ? getUnlockedCharacters(playerLevel, unlockedAchievements)
      : ENHANCED_CHARACTERS;
    
    if (filterRole !== 'all') {
      characters = characters.filter(char => char.role === filterRole);
    }
    
    if (filterRarity !== 'all') {
      characters = characters.filter(char => char.rarity === filterRarity);
    }
    
    return characters;
  };

  // Load character progression data
  useEffect(() => {
    const progression = {};
    ENHANCED_CHARACTERS.forEach(char => {
      progression[char.id] = getCharacterProgression(char.id) || char.progression;
    });
    setCharacterProgression(progression);
  }, []);

  // Sound effects
  const playSound = (soundType) => {
    if (!audioRef.current) return;
    
    const sounds = {
      hover: '/assets/audio/ui_hover.mp3',
      select: '/assets/audio/ui_select.mp3',
      confirm: '/assets/audio/ui_confirm.mp3',
      error: '/assets/audio/ui_error.mp3'
    };
    
    if (sounds[soundType]) {
      audioRef.current.src = sounds[soundType];
      audioRef.current.volume = 0.3;
      audioRef.current.play().catch(() => {}); // Ignore audio play errors
    }
  };

  // Function to handle proceeding to battle
  const handleContinue = () => {
    const player1Char = CHARACTERS.find(c => c.id === player1Selected);
    
    if (selectionMode === 'single') {
      const availableEnemies = CHARACTERS.filter(c => c.id !== player1Selected);
      const randomEnemy = availableEnemies[Math.floor(Math.random() * availableEnemies.length)];
      onSelect({ player1: player1Char, player2: randomEnemy });
    } else {
      const player2Char = CHARACTERS.find(c => c.id === player2Selected);
      onSelect({ player1: player1Char, player2: player2Char });
    }
  };

  // Check for gamepad connection
  useEffect(() => {
    function checkGamepads() {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const connected = Array.from(gamepads)
        .filter(gp => gp && gp.connected)
        .map((gp, index) => ({
          id: gp.index,
          name: gp.id,
          type: gp.id.toLowerCase().includes('dualsense') || gp.id.toLowerCase().includes('ps5') ? 'PS5' :
                gp.id.toLowerCase().includes('ps4') || gp.id.toLowerCase().includes('dualshock') ? 'PS4' :
                gp.id.toLowerCase().includes('xbox') ? 'Xbox' : 'Generic',
          buttons: gp.buttons.length,
          axes: gp.axes.length
        }));
      
      setConnectedControllers(connected);
      setGamepadConnected(connected.length > 0);
    }
    
    checkGamepads();
    const interval = setInterval(checkGamepads, 1000);
    window.addEventListener('gamepadconnected', checkGamepads);
    window.addEventListener('gamepaddisconnected', checkGamepads);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('gamepadconnected', checkGamepads);
      window.removeEventListener('gamepaddisconnected', checkGamepads);
    };
  }, []);

  // Enhanced keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showControllerConfig || showHelpOverlay || showCustomization) return;
      
      if (e.key === 'd' || e.key === 'ArrowRight') {
        e.preventDefault();
        const characters = getFilteredCharacters();
        const idx = characters.findIndex(c => c.id === player1Selected);
        const newChar = characters[(idx + 1) % characters.length];
        setPlayer1Selected(newChar.id);
        setHoveredCharacter(newChar.id);
        playSound('hover');
      } else if (e.key === 'a' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const characters = getFilteredCharacters();
        const idx = characters.findIndex(c => c.id === player1Selected);
        const newChar = characters[(idx - 1 + characters.length) % characters.length];
        setPlayer1Selected(newChar.id);
        setHoveredCharacter(newChar.id);
        playSound('hover');
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleContinue();
        playSound('confirm');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (selectedCharacterDetails) {
          setSelectedCharacterDetails(null);
        } else {
          window.history.back();
        }
        playSound('select');
      } else if (e.key === 'F1') {
        e.preventDefault();
        setShowHelpOverlay(true);
        playSound('select');
      }
      
      // Filter shortcuts
      if (e.key === '1') setFilterRole(CHARACTER_ROLES.BALANCED);
      if (e.key === '2') setFilterRole(CHARACTER_ROLES.ASSASSIN);
      if (e.key === '3') setFilterRole(CHARACTER_ROLES.TANK);
      if (e.key === '4') setFilterRole(CHARACTER_ROLES.BERSERKER);
      if (e.key === '0') setFilterRole('all');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    player1Selected, 
    selectionMode, 
    showControllerConfig,
    showHelpOverlay,
    showCustomization,
    selectedCharacterDetails,
    filterRole
  ]);

  return (
    <div className="enhanced-character-select" style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f1419 100%)',
      color: '#fff',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      overflow: 'hidden'
    }}>
      {/* Audio element for sound effects */}
      <audio ref={audioRef} preload="metadata" />
      
      {/* Enhanced Header */}
      <div style={{
        textAlign: 'center',
        padding: '2rem 1rem',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        marginBottom: '2rem'
      }}>
        <h1 style={{
          fontSize: '3rem',
          margin: '0 0 0.5rem 0',
          background: 'linear-gradient(135deg, #4facfe, #00c4ff, #ff4757)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: '700',
          letterSpacing: '-0.02em'
        }}>
          🤖 Select Your Robot{selectionMode === 'two-player' ? 's' : ''}
        </h1>
        
        <p style={{
          fontSize: '1.1rem',
          opacity: 0.8,
          margin: 0,
          maxWidth: '600px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          Choose your mechanical warrior and dominate the battlefield
        </p>
      </div>

      {/* Enhanced Character Display */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2rem',
        padding: '0 2rem',
        maxWidth: '1400px',
        margin: '0 auto 3rem'
      }}>
        {getFilteredCharacters().map((char, index) => {
          const isUnlocked = getUnlockedCharacters(playerLevel, unlockedAchievements).includes(char);
          const isP1Selected = player1Selected === char.id;
          const isP2Selected = player2Selected === char.id;
          const isHovered = hoveredCharacter === char.id;
          const progression = characterProgression[char.id] || char.progression;
          const powerLevel = calculateCharacterPower(char);
          
          return (
            <div
              key={char.id}
              onMouseEnter={() => {
                setHoveredCharacter(char.id);
                playSound('hover');
              }}
              onMouseLeave={() => setHoveredCharacter(null)}
              onClick={() => {
                if (isUnlocked) {
                  setPlayer1Selected(char.id);
                  playSound('select');
                } else {
                  playSound('error');
                }
              }}
              style={{
                position: 'relative',
                background: isUnlocked 
                  ? `linear-gradient(135deg, ${char.theme.primary}15, ${char.theme.secondary}15)`
                  : 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(15px)',
                borderRadius: '20px',
                border: `2px solid ${isP1Selected ? '#4facfe' : isP2Selected ? '#ff4757' : char.theme.primary}40`,
                padding: '1.5rem',
                cursor: isUnlocked ? 'pointer' : 'not-allowed',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                transform: `scale(${isHovered ? 1.05 : isP1Selected || isP2Selected ? 1.02 : 1})`,
                boxShadow: isHovered 
                  ? `0 20px 40px ${char.theme.primary}30, 0 0 0 1px ${char.theme.primary}40` 
                  : `0 8px 25px rgba(0, 0, 0, 0.3)`,
                opacity: isUnlocked ? 1 : 0.4,
                overflow: 'hidden'
              }}
            >
              {/* Character Avatar */}
              <div style={{
                textAlign: 'center',
                marginBottom: '1rem'
              }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  margin: '0 auto 1rem',
                  borderRadius: '50%',
                  background: char.theme.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '3rem',
                  boxShadow: `0 8px 25px ${char.theme.primary}40`,
                  transform: `scale(${isHovered ? 1.1 : 1})`,
                  transition: 'all 0.3s ease'
                }}>
                  <AnimatedSprite 
                    character={char.spriteId}
                    animation={isP1Selected ? 'celebrate' : isHovered ? 'attack' : 'idle'}
                    scale={2.5}
                    showEffects={true}
                  />
                </div>
                
                <h3 style={{
                  fontSize: '1.5rem',
                  margin: '0 0 0.25rem 0',
                  fontWeight: '700',
                  background: char.theme.gradient,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  {char.name}
                </h3>
                
                <p style={{
                  fontSize: '0.9rem',
                  margin: '0 0 1rem 0',
                  opacity: 0.8
                }}>
                  {char.description}
                </p>
              </div>

              {/* Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#ff6b6b' }}>
                    {char.stats.health}
                  </div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Health</div>
                </div>
                
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#4facfe' }}>
                    {char.stats.attack}
                  </div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Attack</div>
                </div>
              </div>

              {/* Abilities */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.25rem',
                marginBottom: '1rem'
              }}>
                {char.abilities.slice(0, 2).map((ability, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '0.7rem',
                      background: `${char.theme.primary}20`,
                      color: char.theme.primary,
                      borderRadius: '12px',
                      padding: '0.25rem 0.5rem',
                      fontWeight: '500'
                    }}
                  >
                    {ability.icon} {ability.name}
                  </span>
                ))}
              </div>

              {/* Selection indicator */}
              {isP1Selected && (
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: '#4facfe',
                  color: '#fff',
                  borderRadius: '20px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.8rem',
                  fontWeight: '600'
                }}>
                  ✓ Selected
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem',
        padding: '2rem',
        marginTop: '2rem'
      }}>
        <button
          onClick={handleContinue}
          style={{
            padding: '1rem 3rem',
            fontSize: '1.2rem',
            fontWeight: '700',
            borderRadius: '15px',
            border: 'none',
            background: 'linear-gradient(135deg, #4facfe, #00c4ff)',
            color: '#fff',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 8px 25px rgba(79, 172, 254, 0.3)',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
        >
          {selectionMode === 'single' ? 
            `🚀 Deploy ${ENHANCED_CHARACTERS.find(c => c.id === player1Selected)?.name}` : 
            '⚔️ Begin Battle!'
          }
        </button>
        
        <button
          onClick={() => {
            setShowHelpOverlay(true);
            playSound('select');
          }}
          style={{
            padding: '1rem 2rem',
            fontSize: '1rem',
            fontWeight: '600',
            borderRadius: '15px',
            border: '2px solid rgba(255, 215, 0, 0.5)',
            background: 'rgba(255, 215, 0, 0.1)',
            color: '#ffd700',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          ❓ Help (F1)
        </button>
      </div>

      {/* Help Overlay */}
      {showHelpOverlay && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000,
          padding: '2rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
            borderRadius: '20px',
            padding: '2rem',
            maxWidth: '600px',
            width: '100%',
            border: '2px solid #4facfe',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem'
            }}>
              <h2 style={{
                margin: 0,
                background: 'linear-gradient(135deg, #4facfe, #00c4ff)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                ⌨️ Keyboard Shortcuts
              </h2>
              <button
                onClick={() => setShowHelpOverlay(false)}
                style={{
                  background: 'none',
                  border: '2px solid #ff4757',
                  color: '#ff4757',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  cursor: 'pointer',
                  fontSize: '18px'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '2rem',
              fontSize: '0.9rem'
            }}>
              <div>
                <h3 style={{ color: '#4facfe', marginBottom: '1rem' }}>🎮 Navigation</h3>
                <div style={{ lineHeight: '1.8' }}>
                  <div><strong>A/D or ←/→</strong> - Navigate characters</div>
                  <div><strong>Space/Enter</strong> - Select & continue</div>
                  <div><strong>Escape</strong> - Go back</div>
                </div>
              </div>

              <div>
                <h3 style={{ color: '#ff4757', marginBottom: '1rem' }}>🔧 Quick Actions</h3>
                <div style={{ lineHeight: '1.8' }}>
                  <div><strong>1-4</strong> - Filter by role</div>
                  <div><strong>0</strong> - Show all roles</div>
                  <div><strong>F1</strong> - Show this help</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{
        textAlign: 'center',
        padding: '1rem 2rem',
        fontSize: '0.9rem',
        opacity: 0.7,
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '10px',
        margin: '0 2rem 2rem',
        maxWidth: '800px',
        marginLeft: 'auto',
        marginRight: 'auto'
      }}>
        <div style={{ marginBottom: '0.5rem' }}>
          🎯 Navigate with A/D or Arrow Keys • Space/Enter to Deploy • Press F1 for help
        </div>
        <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>
          {gamepadConnected ? '🎮 Controller detected and ready' : '⌨️ Keyboard controls active'}
        </div>
      </div>
    </div>
  );
};

export default CharacterSelect;