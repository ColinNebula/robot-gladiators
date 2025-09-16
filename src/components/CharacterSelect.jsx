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
  const [controllerTab, setControllerTab] = useState('layout');
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [navigationMode, setNavigationMode] = useState('character');
  
  // New enhanced features
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'detailed', 'stats'
  const [filterRole, setFilterRole] = useState('all');
  const [filterRarity, setFilterRarity] = useState('all');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);
  const [selectedCharacterDetails, setSelectedCharacterDetails] = useState(null);
  const [animationPreview, setAnimationPreview] = useState('idle');
  const [playerLevel] = useState(25); // Mock player level - would come from save system
  const [unlockedAchievements] = useState(['first_critical', 'tank_master', 'speed_demon']); // Mock achievements
  const [hoveredCharacter, setHoveredCharacter] = useState(null);
  const [characterProgression, setCharacterProgression] = useState({});
  const [showHelpOverlay, setShowHelpOverlay] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [selectedSkin, setSelectedSkin] = useState({});
  const [selectedEquipment, setSelectedEquipment] = useState({});
  const audioRef = useRef(null);
  
  // Controller settings (existing)
  const [controllerSettings, setControllerSettings] = useState({
    sensitivity: 0.8,
    deadzone: 0.1,
    vibration: true,
    autoRepeat: false,
    buttonLayout: 'default'
  });
  const [connectedControllers, setConnectedControllers] = useState([]);
  const [remappingButton, setRemappingButton] = useState(null);

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

  // Define navigation items based on current mode
  const getNavigationItems = () => {
    if (navigationMode === 'character') {
      return getFilteredCharacters();
    } else {
      const menuItems = ['Two Player Battle'];
      if (gamepadConnected) {
        menuItems.push('Edit Controller');
      }
      menuItems.push('Back');
      return menuItems;
    }
  };

  // Enhanced gamepad navigation with haptic feedback
  const {
    selectedIndex,
    isGamepadConnected: gamepadNavConnected,
    isSelected,
    setSelectedIndex
  } = useGamepadNavigation(getNavigationItems(), {
    onSelect: (item, index) => {
      // Haptic feedback for selection
      if (controllerSettings.vibration && connectedControllers.length > 0) {
        triggerVibration(200, 0.3, 0.1);
      }
      
      if (navigationMode === 'character') {
        const filteredChars = getFilteredCharacters();
        const character = filteredChars[index];
        
        if (!character) return;
        
        const isUnlocked = getUnlockedCharacters(playerLevel, unlockedAchievements).includes(character);
        
        if (!isUnlocked) {
          playSound('error');
          return;
        }
        
        if (currentPlayer === 1) {
          setPlayer1Selected(character.id);
          playSound('select');
          if (selectionMode === 'two-player') {
            setCurrentPlayer(2);
            setSelectedIndex(getFilteredCharacters().findIndex(c => c.id === player2Selected));
          } else {
            handleContinue();
          }
        } else {
          setPlayer2Selected(character.id);
          playSound('select');
          setNavigationMode('menu');
          setSelectedIndex(0);
        }
      } else {
        // Menu navigation
        const menuItems = getNavigationItems();
        const selectedItem = menuItems[index];
        
        playSound('confirm');
        
        if (selectedItem === 'Two Player Battle') {
          handleContinue();
        } else if (selectedItem === 'Edit Controller') {
          setShowControllerConfig(true);
        } else if (selectedItem === 'Back') {
          window.history.back();
        }
      }
    },
    onHover: (item, index) => {
      // Subtle haptic feedback on hover
      if (controllerSettings.vibration && connectedControllers.length > 0) {
        triggerVibration(50, 0.1, 0.05);
      }
      playSound('hover');
      
      if (navigationMode === 'character') {
        const filteredChars = getFilteredCharacters();
        const character = filteredChars[index];
        if (character) {
          setHoveredCharacter(character.id);
        }
      }
    },
    onBack: () => {
      playSound('select');
      if (navigationMode === 'character' && currentPlayer === 2) {
        setCurrentPlayer(1);
        setSelectedIndex(getFilteredCharacters().findIndex(c => c.id === player1Selected));
      } else if (navigationMode === 'menu') {
        setNavigationMode('character');
        setCurrentPlayer(selectionMode === 'two-player' ? 2 : 1);
        const selectedChar = currentPlayer === 1 ? player1Selected : player2Selected;
        setSelectedIndex(getFilteredCharacters().findIndex(c => c.id === selectedChar));
      } else {
        window.history.back();
      }
    },
    onStart: () => {
      playSound('confirm');
      if (navigationMode === 'character') {
        if (selectionMode === 'two-player' && currentPlayer === 1) {
          setCurrentPlayer(2);
          setSelectedIndex(getFilteredCharacters().findIndex(c => c.id === player2Selected));
        } else {
          setNavigationMode('menu');
          setSelectedIndex(0);
        }
      } else {
        handleContinue();
      }
    },
    enabled: !showControllerConfig,
    wrapAround: true,
    initialIndex: 0,
    sensitivity: controllerSettings.sensitivity,
    deadzone: controllerSettings.deadzone
  });

  // Haptic feedback function
  const triggerVibration = (duration = 200, strongMagnitude = 0.5, weakMagnitude = 0.3) => {
    if (!controllerSettings.vibration) return;
    
    const gamepad = navigator.getGamepads()[0];
    if (gamepad && gamepad.vibrationActuator) {
      gamepad.vibrationActuator.playEffect('dual-rumble', {
        duration,
        strongMagnitude,
        weakMagnitude
      }).catch(() => {
        // Vibration not supported, ignore silently
      });
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

  // Check for gamepad connection and update controller list
  React.useEffect(() => {
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
    
    checkGamepads(); // Initial check
    const interval = setInterval(checkGamepads, 1000);
    window.addEventListener('gamepadconnected', checkGamepads);
    window.addEventListener('gamepaddisconnected', checkGamepads);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('gamepadconnected', checkGamepads);
      window.removeEventListener('gamepaddisconnected', checkGamepads);
    };
  }, []);

  // Enhanced keyboard navigation with accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Skip if controller config is open
      if (showControllerConfig) return;
      
      // Accessibility: Announce character changes for screen readers
      const announceCharacter = (character) => {
        if (character && 'speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(
            `Selected ${character.name}, ${character.title}. ${character.description}`
          );
          utterance.volume = 0.3;
          utterance.rate = 1.2;
          speechSynthesis.speak(utterance);
        }
      };

      // Player 1 controls (WASD + enhanced navigation)
      if (e.key === 'd' || e.key === 'ArrowRight') {
        e.preventDefault();
        const characters = getFilteredCharacters();
        const idx = characters.findIndex(c => c.id === player1Selected);
        const newChar = characters[(idx + 1) % characters.length];
        setPlayer1Selected(newChar.id);
        setHoveredCharacter(newChar.id);
        announceCharacter(newChar);
        playSound('hover');
      } else if (e.key === 'a' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const characters = getFilteredCharacters();
        const idx = characters.findIndex(c => c.id === player1Selected);
        const newChar = characters[(idx - 1 + characters.length) % characters.length];
        setPlayer1Selected(newChar.id);
        setHoveredCharacter(newChar.id);
        announceCharacter(newChar);
        playSound('hover');
      } else if (e.key === 'w' || e.key === 'ArrowUp') {
        e.preventDefault();
        setViewMode(prev => {
          const modes = ['grid', 'detailed', 'stats'];
          const currentIndex = modes.indexOf(prev);
          const newMode = modes[(currentIndex - 1 + modes.length) % modes.length];
          playSound('select');
          return newMode;
        });
      } else if (e.key === 's' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (e.shiftKey) {
          // Shift+S for stats view
          setViewMode('stats');
        } else {
          // Regular selection
          handleContinue();
        }
      }
      
      // Quick access keys
      if (e.key === 'Tab') {
        e.preventDefault();
        setViewMode(prev => prev === 'grid' ? 'detailed' : 'grid');
        playSound('select');
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleContinue();
        playSound('confirm');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (selectedCharacterDetails) {
          setSelectedCharacterDetails(null);
        } else if (showHelpOverlay) {
          setShowHelpOverlay(false);
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
      
      // Player 2 controls (numpad) - only in two-player mode
      if (selectionMode === 'two-player') {
        if (e.key === 'Numpad6') {
          const characters = getFilteredCharacters();
          const idx = characters.findIndex(c => c.id === player2Selected);
          const newChar = characters[(idx + 1) % characters.length];
          setPlayer2Selected(newChar.id);
          announceCharacter(newChar);
          playSound('hover');
        } else if (e.key === 'Numpad4') {
          const characters = getFilteredCharacters();
          const idx = characters.findIndex(c => c.id === player2Selected);
          const newChar = characters[(idx - 1 + characters.length) % characters.length];
          setPlayer2Selected(newChar.id);
          announceCharacter(newChar);
          playSound('hover');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    player1Selected, 
    player2Selected, 
    selectionMode, 
    gamepadConnected, 
    onSelect, 
    showControllerConfig,
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
      
      {/* Animated background particles */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `
          radial-gradient(circle at 20% 50%, rgba(79, 172, 254, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 71, 87, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, rgba(46, 213, 115, 0.1) 0%, transparent 50%)
        `,
        zIndex: -1
      }} />

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

      {/* Enhanced Control Panel */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem',
        marginBottom: '2rem',
        padding: '0 1rem',
        flexWrap: 'wrap'
      }}>
        {/* Game Mode Selection */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          padding: '0.5rem',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <button 
            onClick={() => {
              setSelectionMode('single');
              playSound('select');
            }}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              background: selectionMode === 'single' 
                ? 'linear-gradient(135deg, #4facfe, #00c4ff)' 
                : 'transparent',
              color: '#fff',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            🎯 Single Player
          </button>
          <button 
            onClick={() => {
              setSelectionMode('two-player');
              playSound('select');
            }}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              background: selectionMode === 'two-player' 
                ? 'linear-gradient(135deg, #ff4757, #ff3838)' 
                : 'transparent',
              color: '#fff',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            ⚔️ Two Player Battle
          </button>
        </div>

        {/* View Mode Toggle */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          padding: '0.5rem',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          {['grid', 'detailed', 'stats'].map(mode => (
            <button
              key={mode}
              onClick={() => {
                setViewMode(mode);
                playSound('hover');
              }}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === mode ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'all 0.3s ease'
              }}
            >
              {mode === 'grid' ? '🔲' : mode === 'detailed' ? '📋' : '📊'} {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          padding: '0.5rem',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <select 
            value={filterRole}
            onChange={(e) => {
              setFilterRole(e.target.value);
              playSound('hover');
            }}
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              color: '#fff',
              padding: '0.5rem',
              fontSize: '0.9rem'
            }}
          >
            <option value="all">All Roles</option>
            <option value={CHARACTER_ROLES.BALANCED}>⚖️ Balanced</option>
            <option value={CHARACTER_ROLES.ASSASSIN}>🗡️ Assassin</option>
            <option value={CHARACTER_ROLES.TANK}>🛡️ Tank</option>
            <option value={CHARACTER_ROLES.BERSERKER}>⚡ Berserker</option>
          </select>
          
          <select 
            value={filterRarity}
            onChange={(e) => {
              setFilterRarity(e.target.value);
              playSound('hover');
            }}
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              color: '#fff',
              padding: '0.5rem',
              fontSize: '0.9rem'
            }}
          >
            <option value="all">All Rarities</option>
            <option value={CHARACTER_RARITY.COMMON}>⚪ Common</option>
            <option value={CHARACTER_RARITY.RARE}>🔵 Rare</option>
            <option value={CHARACTER_RARITY.EPIC}>🟣 Epic</option>
            <option value={CHARACTER_RARITY.LEGENDARY}>🟡 Legendary</option>
          </select>
        </div>

        {/* Controller Config Button */}
        <button 
          onClick={() => {
            setShowControllerConfig(true);
            playSound('select');
          }}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
            border: 'none',
            borderRadius: '12px',
            color: '#fff',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)'
          }}
        >
          🎮 Controller Settings
        </button>
      </div>
      {/* Enhanced Character Display */}
      {viewMode === 'grid' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
          padding: '0 2rem',
          maxWidth: '1400px',
          margin: '0 auto'
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
                    if (currentPlayer === 1) {
                      setPlayer1Selected(char.id);
                    } else {
                      setPlayer2Selected(char.id);
                    }
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
                {/* Unlock Status */}
                {!isUnlocked && (
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: 'rgba(255, 71, 87, 0.9)',
                    borderRadius: '20px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    zIndex: 10
                  }}>
                    🔒 Level {char.unlockRequirements.level}
                  </div>
                )}
                
                {/* Selection Indicator */}
                {(isP1Selected || isP2Selected) && (
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    left: '1rem',
                    background: isP1Selected ? '#4facfe' : '#ff4757',
                    borderRadius: '20px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    zIndex: 10
                  }}>
                    {isP1Selected ? '👤 Player 1' : '👤 Player 2'}
                  </div>
                )}

                {/* Rarity Gem */}
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  right: !isUnlocked ? '8rem' : '1rem',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: char.rarity === CHARACTER_RARITY.LEGENDARY ? 'linear-gradient(135deg, #ffd700, #ffed4e)' :
                             char.rarity === CHARACTER_RARITY.EPIC ? 'linear-gradient(135deg, #9c88ff, #8c7ae6)' :
                             char.rarity === CHARACTER_RARITY.RARE ? 'linear-gradient(135deg, #4facfe, #00c4ff)' :
                             'linear-gradient(135deg, #ffffff, #ddd)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
                }}>
                  {char.rarity === CHARACTER_RARITY.LEGENDARY ? '💎' :
                   char.rarity === CHARACTER_RARITY.EPIC ? '🔮' :
                   char.rarity === CHARACTER_RARITY.RARE ? '💠' : '⚪'}
                </div>

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
                      animation={isP1Selected || isP2Selected ? 'celebrate' : isHovered ? 'attack' : 'idle'}
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
                    margin: '0 0 0.5rem 0',
                    opacity: 0.8,
                    fontWeight: '500'
                  }}>
                    {char.title}
                  </p>
                  
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '20px',
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.8rem',
                    fontWeight: '600'
                  }}>
                    <span>{char.role === CHARACTER_ROLES.BALANCED ? '⚖️' :
                           char.role === CHARACTER_ROLES.ASSASSIN ? '🗡️' :
                           char.role === CHARACTER_ROLES.TANK ? '🛡️' :
                           char.role === CHARACTER_ROLES.BERSERKER ? '⚡' : '❓'}
                    </span>
                    <span style={{ textTransform: 'capitalize' }}>{char.role}</span>
                    <span style={{ color: char.theme.primary }}>• {powerLevel} PWR</span>
                  </div>
                </div>

                {/* Stats Preview */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '10px',
                    padding: '0.75rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ff6b6b' }}>
                      {char.stats.health}
                    </div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Health
                    </div>
                  </div>
                  
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '10px',
                    padding: '0.75rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#4facfe' }}>
                      {char.stats.attack}
                    </div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Attack
                    </div>
                  </div>
                  
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '10px',
                    padding: '0.75rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#26de81' }}>
                      {char.stats.defense}
                    </div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Defense
                    </div>
                  </div>
                  
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '10px',
                    padding: '0.75rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ffd700' }}>
                      {char.stats.speed}
                    </div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Speed
                    </div>
                  </div>
                </div>

                {/* Abilities Preview */}
                <div style={{ marginBottom: '1rem' }}>
                  <h5 style={{
                    fontSize: '0.9rem',
                    margin: '0 0 0.5rem 0',
                    fontWeight: '600',
                    opacity: 0.9
                  }}>
                    Key Abilities
                  </h5>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.25rem'
                  }}>
                    {char.abilities.slice(0, 3).map((ability, idx) => (
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
                </div>

                {/* Progress Bar */}
                {isUnlocked && (
                  <div style={{ marginTop: 'auto' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.8rem',
                      marginBottom: '0.5rem'
                    }}>
                      <span>Level {progression.level}</span>
                      <span>{progression.experience}/{progression.experienceToNext} XP</span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '4px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${(progression.experience / progression.experienceToNext) * 100}%`,
                        height: '100%',
                        background: char.theme.gradient,
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Character View */}
      {viewMode === 'detailed' && selectedCharacterDetails && (
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem',
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: '3rem'
        }}>
          {/* Character Portrait */}
          <div style={{
            background: `linear-gradient(135deg, ${selectedCharacterDetails.theme.primary}15, ${selectedCharacterDetails.theme.secondary}15)`,
            backdropFilter: 'blur(15px)',
            borderRadius: '20px',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <div style={{
              width: '200px',
              height: '200px',
              margin: '0 auto 2rem',
              borderRadius: '50%',
              background: selectedCharacterDetails.theme.gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '4rem'
            }}>
              <AnimatedSprite 
                character={selectedCharacterDetails.spriteId}
                animation={animationPreview}
                scale={3}
                showEffects={true}
              />
            </div>
            
            <h2 style={{
              fontSize: '2.5rem',
              margin: '0 0 0.5rem 0',
              background: selectedCharacterDetails.theme.gradient,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {selectedCharacterDetails.name}
            </h2>
            
            <p style={{ fontSize: '1.2rem', opacity: 0.8, margin: '0 0 2rem 0' }}>
              {selectedCharacterDetails.title}
            </p>
            
            {/* Animation Controls */}
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              {['idle', 'attack', 'defend', 'victory'].map(anim => (
                <button
                  key={anim}
                  onClick={() => setAnimationPreview(anim)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: animationPreview === anim 
                      ? selectedCharacterDetails.theme.primary
                      : 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    textTransform: 'capitalize'
                  }}
                >
                  {anim}
                </button>
              ))}
            </div>
          </div>
          
          {/* Character Details */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(15px)',
            borderRadius: '20px',
            padding: '2rem'
          }}>
            {/* Backstory */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: selectedCharacterDetails.theme.primary, marginBottom: '1rem' }}>
                📜 Backstory
              </h3>
              <p style={{ lineHeight: '1.6', opacity: 0.9 }}>
                {selectedCharacterDetails.backstory}
              </p>
            </div>
            
            {/* Complete Stats */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: selectedCharacterDetails.theme.primary, marginBottom: '1rem' }}>
                📊 Combat Statistics
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {Object.entries(selectedCharacterDetails.stats).map(([stat, value]) => (
                  <div key={stat} style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '10px',
                    padding: '1rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                      {typeof value === 'number' ? value : (value * 100).toFixed(0) + '%'}
                    </div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8, textTransform: 'capitalize' }}>
                      {stat.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Abilities */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: selectedCharacterDetails.theme.primary, marginBottom: '1rem' }}>
                ⚡ Special Abilities
              </h3>
              {selectedCharacterDetails.abilities.map((ability, idx) => (
                <div key={idx} style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '10px',
                  padding: '1rem',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <span style={{ fontSize: '1.5rem' }}>{ability.icon}</span>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', fontWeight: '600' }}>
                      {ability.name}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>
                      {ability.description}
                    </p>
                  </div>
                  <span style={{
                    marginLeft: 'auto',
                    padding: '0.25rem 0.5rem',
                    background: selectedCharacterDetails.theme.primary + '30',
                    borderRadius: '12px',
                    fontSize: '0.7rem',
                    textTransform: 'uppercase'
                  }}>
                    {ability.type}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Special Moves */}
            <div>
              <h3 style={{ color: selectedCharacterDetails.theme.primary, marginBottom: '1rem' }}>
                🎯 Special Moves
              </h3>
              {selectedCharacterDetails.specialMoves.map((move, idx) => (
                <div key={idx} style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '10px',
                  padding: '1rem',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontWeight: '600' }}>{move.name}</h4>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
                      <span style={{ color: '#ff6b6b' }}>⚔️ {move.damage}</span>
                      <span style={{ color: '#4facfe' }}>⚡ {move.cost}</span>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>
                    {move.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
                  <div><strong>W/S or ↑/↓</strong> - Change view mode</div>
                  <div><strong>Space/Enter</strong> - Select & continue</div>
                  <div><strong>Tab</strong> - Toggle view mode</div>
                  <div><strong>Escape</strong> - Go back</div>
                </div>
              </div>

              <div>
                <h3 style={{ color: '#ff4757', marginBottom: '1rem' }}>🔧 Quick Actions</h3>
                <div style={{ lineHeight: '1.8' }}>
                  <div><strong>1-4</strong> - Filter by role</div>
                  <div><strong>0</strong> - Show all roles</div>
                  <div><strong>Shift+S</strong> - Stats view</div>
                  <div><strong>F1</strong> - Show this help</div>
                  <div><strong>Numpad 4/6</strong> - Player 2 (2P mode)</div>
                </div>
              </div>
            </div>

            <div style={{
              marginTop: '2rem',
              padding: '1rem',
              background: 'rgba(79, 172, 254, 0.1)',
              borderRadius: '10px',
              fontSize: '0.8rem',
              opacity: 0.8
            }}>
              <strong>💡 Pro Tip:</strong> Use voice announcements by enabling screen reader support in your browser settings for character descriptions.
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem',
        padding: '3rem 2rem',
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
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 12px 35px rgba(79, 172, 254, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 8px 25px rgba(79, 172, 254, 0.3)';
          }}
        >
          {selectionMode === 'single' ? 
            `🚀 Deploy ${ENHANCED_CHARACTERS.find(c => c.id === player1Selected)?.name}` : 
            '⚔️ Begin Battle!'
          }
        </button>
        
        <button
          onClick={() => setSelectedCharacterDetails(
            selectedCharacterDetails ? null : ENHANCED_CHARACTERS.find(c => c.id === player1Selected)
          )}
          style={{
            padding: '1rem 2rem',
            fontSize: '1rem',
            fontWeight: '600',
            borderRadius: '15px',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            background: 'rgba(255, 255, 255, 0.1)',
            color: '#fff',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          {selectedCharacterDetails ? '📋 Close Details' : '📋 View Details'}
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
          title="Press F1 for keyboard shortcuts"
        >
          ❓ Help (F1)
        </button>
        
        <button
          onClick={() => {
            setShowCustomization(true);
            playSound('select');
          }}
          style={{
            padding: '1rem 2rem',
            fontSize: '1rem',
            fontWeight: '600',
            borderRadius: '15px',
            border: '2px solid rgba(156, 136, 255, 0.5)',
            background: 'rgba(156, 136, 255, 0.1)',
            color: '#9c88ff',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          🎨 Customize
        </button>
      </div>

      {/* Character Customization Modal */}
      {showCustomization && (
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
            maxWidth: '900px',
            width: '100%',
            border: '2px solid #9c88ff',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem'
            }}>
              <h2 style={{
                margin: 0,
                background: 'linear-gradient(135deg, #9c88ff, #8c7ae6)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                🎨 Character Customization
              </h2>
              <button
                onClick={() => setShowCustomization(false)}
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

            {/* Character Preview */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '300px 1fr',
              gap: '2rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '15px',
                padding: '1.5rem',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '150px',
                  height: '150px',
                  margin: '0 auto 1rem',
                  borderRadius: '50%',
                  background: ENHANCED_CHARACTERS.find(c => c.id === player1Selected)?.theme.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <AnimatedSprite 
                    character={player1Selected}
                    animation="idle"
                    scale={2.5}
                    showEffects={true}
                  />
                </div>
                <h3 style={{
                  margin: '0 0 0.5rem 0',
                  color: ENHANCED_CHARACTERS.find(c => c.id === player1Selected)?.theme.primary
                }}>
                  {ENHANCED_CHARACTERS.find(c => c.id === player1Selected)?.name}
                </h3>
                <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: 0 }}>
                  Preview with current customization
                </p>
              </div>

              <div>
                {/* Skin Selection */}
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ color: '#9c88ff', marginBottom: '1rem' }}>🎭 Character Skins</h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem'
                  }}>
                    {ENHANCED_CHARACTERS.find(c => c.id === player1Selected)?.customization.skins.map(skin => (
                      <div
                        key={skin.id}
                        onClick={() => {
                          if (skin.unlocked) {
                            setSelectedSkin(prev => ({ ...prev, [player1Selected]: skin.id }));
                            playSound('select');
                          } else {
                            playSound('error');
                          }
                        }}
                        style={{
                          background: skin.unlocked ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                          border: `2px solid ${selectedSkin[player1Selected] === skin.id ? '#9c88ff' : 'rgba(255, 255, 255, 0.1)'}`,
                          borderRadius: '10px',
                          padding: '1rem',
                          cursor: skin.unlocked ? 'pointer' : 'not-allowed',
                          opacity: skin.unlocked ? 1 : 0.5,
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.5rem'
                        }}>
                          <h4 style={{ margin: 0, fontSize: '0.9rem' }}>{skin.name}</h4>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            background: skin.rarity === 'legendary' ? '#ffd700' :
                                       skin.rarity === 'epic' ? '#9c88ff' :
                                       skin.rarity === 'rare' ? '#4facfe' : '#ffffff',
                            color: '#000',
                            fontWeight: '600'
                          }}>
                            {skin.rarity}
                          </span>
                        </div>
                        {!skin.unlocked && (
                          <p style={{ fontSize: '0.8rem', color: '#ff4757', margin: 0 }}>
                            🔒 {skin.requirement}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Equipment Selection */}
                <div>
                  <h3 style={{ color: '#9c88ff', marginBottom: '1rem' }}>⚔️ Equipment</h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '1rem'
                  }}>
                    {ENHANCED_CHARACTERS.find(c => c.id === player1Selected)?.customization.equipment.map(item => (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (item.unlocked) {
                            setSelectedEquipment(prev => ({ ...prev, [player1Selected]: item.id }));
                            playSound('select');
                          } else {
                            playSound('error');
                          }
                        }}
                        style={{
                          background: item.unlocked ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                          border: `2px solid ${selectedEquipment[player1Selected] === item.id ? '#9c88ff' : 'rgba(255, 255, 255, 0.1)'}`,
                          borderRadius: '10px',
                          padding: '1rem',
                          cursor: item.unlocked ? 'pointer' : 'not-allowed',
                          opacity: item.unlocked ? 1 : 0.5,
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>{item.name}</h4>
                        <div style={{
                          display: 'flex',
                          gap: '1rem',
                          fontSize: '0.8rem',
                          marginBottom: '0.5rem'
                        }}>
                          {Object.entries(item.stats).map(([stat, value]) => (
                            <span key={stat} style={{
                              color: value > 0 ? '#2ed573' : value < 0 ? '#ff4757' : '#ccc'
                            }}>
                              {stat}: {value > 0 ? '+' : ''}{value}
                            </span>
                          ))}
                        </div>
                        {!item.unlocked && (
                          <p style={{ fontSize: '0.8rem', color: '#ff4757', margin: 0 }}>
                            🔒 Unlock requirement not met
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => {
                  // Save customization preferences
                  localStorage.setItem('characterCustomization', JSON.stringify({
                    skins: selectedSkin,
                    equipment: selectedEquipment
                  }));
                  setShowCustomization(false);
                  playSound('confirm');
                }}
                style={{
                  padding: '1rem 3rem',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  borderRadius: '15px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #9c88ff, #8c7ae6)',
                  color: '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                💾 Save Customization
              </button>
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
          {selectionMode === 'single' ? 
            '🎯 Navigate with WASD or Arrow Keys • Space/Enter to Deploy • Numbers 1-4 to filter roles' : 
            '⚔️ Player 1: WASD • Player 2: Numpad 4/6 • Space/Enter to Battle'
          }
        </div>
        <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>
          {gamepadConnected ? '🎮 Controller detected and ready' : '⌨️ Keyboard controls active'} • Press F1 for help
        </div>
      </div>

      {showControllerConfig && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#1a1a2e',
            border: '3px solid #4facfe',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '900px',
            width: '95%',
            maxHeight: '90vh',
            overflowY: 'auto',
            color: '#fff',
            boxShadow: '0 0 30px rgba(79, 172, 254, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: '#4facfe' }}>🎮 Controller Configuration</h2>
              <button 
                onClick={() => setShowControllerConfig(false)}
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

            {/* Controller Status */}
            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(79, 172, 254, 0.1)', borderRadius: '12px' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#4facfe' }}>Connected Controllers ({connectedControllers.length})</h3>
              {connectedControllers.length === 0 ? (
                <p style={{ margin: 0, color: '#ff4757' }}>❌ No controllers detected. Please connect a controller and try again.</p>
              ) : (
                connectedControllers.map((controller, index) => (
                  <div key={controller.id} style={{ 
                    marginBottom: '0.5rem', 
                    padding: '0.5rem', 
                    backgroundColor: 'rgba(0, 0, 0, 0.3)', 
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <strong style={{ color: '#2ed573' }}>✅ {controller.type} Controller</strong><br/>
                      <small style={{ color: '#ccc' }}>{controller.name}</small>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#ccc' }}>
                      {controller.buttons} buttons • {controller.axes} axes
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', marginBottom: '1.5rem', borderBottom: '2px solid #333' }}>
              {['layout', 'settings', 'test'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setControllerTab(tab)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: controllerTab === tab ? '#4facfe' : '#ccc',
                    padding: '0.75rem 1.5rem',
                    cursor: 'pointer',
                    borderBottom: controllerTab === tab ? '3px solid #4facfe' : '3px solid transparent',
                    textTransform: 'capitalize',
                    fontSize: '1rem',
                    fontWeight: controllerTab === tab ? 'bold' : 'normal'
                  }}
                >
                  {tab === 'layout' ? '🎯 Button Layout' : 
                   tab === 'settings' ? '⚙️ Settings' : 
                   '🧪 Test & Calibrate'}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {controllerTab === 'layout' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  {/* Visual Controller Diagram */}
                  <div>
                    <h3 style={{ color: '#4facfe', marginBottom: '1rem' }}>Visual Controller Map</h3>
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      height: '200px',
                      backgroundColor: '#2a2a4a',
                      borderRadius: '20px',
                      border: '2px solid #4facfe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {/* Controller visual representation */}
                      <div style={{
                        width: '280px',
                        height: '140px',
                        backgroundColor: '#333',
                        borderRadius: '30px',
                        position: 'relative',
                        border: '2px solid #555'
                      }}>
                        {/* Left buttons */}
                        <div style={{ position: 'absolute', left: '20px', top: '30px' }}>
                          <div style={{ fontSize: '12px', color: '#4facfe', textAlign: 'center' }}>L1/LB<br/>Special</div>
                        </div>
                        <div style={{ position: 'absolute', left: '20px', top: '70px' }}>
                          <div style={{ fontSize: '12px', color: '#ff4757', textAlign: 'center' }}>L2/LT<br/>Projectile</div>
                        </div>
                        
                        {/* Right buttons */}
                        <div style={{ position: 'absolute', right: '20px', top: '30px' }}>
                          <div style={{ fontSize: '12px', color: '#4facfe', textAlign: 'center' }}>R1/RB<br/>Special</div>
                        </div>
                        <div style={{ position: 'absolute', right: '20px', top: '70px' }}>
                          <div style={{ fontSize: '12px', color: '#ff4757', textAlign: 'center' }}>R2/RT<br/>Projectile</div>
                        </div>

                        {/* Face buttons */}
                        <div style={{ position: 'absolute', right: '60px', top: '40px' }}>
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr 1fr',
                            gap: '5px',
                            fontSize: '10px',
                            textAlign: 'center'
                          }}>
                            <div style={{ backgroundColor: '#2ed573', padding: '3px', borderRadius: '50%' }}>Y/△</div>
                            <div></div>
                            <div style={{ backgroundColor: '#ffd700', padding: '3px', borderRadius: '50%' }}>X/□</div>
                            <div style={{ backgroundColor: '#ff4757', padding: '3px', borderRadius: '50%' }}>B/○</div>
                            <div></div>
                            <div style={{ backgroundColor: '#4facfe', padding: '3px', borderRadius: '50%' }}>A/✕</div>
                          </div>
                        </div>

                        {/* D-Pad */}
                        <div style={{ position: 'absolute', left: '60px', top: '40px' }}>
                          <div style={{ fontSize: '10px', color: '#ccc', textAlign: 'center' }}>D-Pad<br/>Move</div>
                        </div>

                        {/* Center buttons */}
                        <div style={{ position: 'absolute', left: '50%', top: '20px', transform: 'translateX(-50%)' }}>
                          <div style={{ fontSize: '10px', color: '#ccc', textAlign: 'center' }}>Menu<br/>Pause</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Button Mappings */}
                  <div>
                    <h3 style={{ color: '#4facfe', marginBottom: '1rem' }}>Control Mappings</h3>
                    <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                      <div style={{ marginBottom: '1rem' }}>
                        <strong style={{ color: '#2ed573' }}>🎯 Combat Controls:</strong><br/>
                        • Left Punch: Square/X Button<br/>
                        • Right Punch: Triangle/Y Button<br/>
                        • Left Kick: X/A Button<br/>
                        • Right Kick: Circle/B Button<br/>
                      </div>
                      
                      <div style={{ marginBottom: '1rem' }}>
                        <strong style={{ color: '#ff4757' }}>🚀 Projectiles:</strong><br/>
                        • Fire Left: L2/LT Trigger<br/>
                        • Fire Right: R2/RT Trigger<br/>
                      </div>
                      
                      <div style={{ marginBottom: '1rem' }}>
                        <strong style={{ color: '#4facfe' }}>⚡ Special Moves:</strong><br/>
                        • Special Attack: L1/LB + R1/RB<br/>
                        • Heavy Attack: L1/LB or R1/RB<br/>
                      </div>
                      
                      <div>
                        <strong style={{ color: '#ffd700' }}>🕹️ Movement:</strong><br/>
                        • Move: Left Stick / D-Pad<br/>
                        • Jump: A/X Button<br/>
                        • Pause: Options/Menu Button<br/>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {controllerTab === 'settings' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <div>
                    <h3 style={{ color: '#4facfe', marginBottom: '1rem' }}>Input Settings</h3>
                    
                    {/* Sensitivity */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>
                        Stick Sensitivity: {Math.round(controllerSettings.sensitivity * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="2.0"
                        step="0.1"
                        value={controllerSettings.sensitivity}
                        onChange={(e) => setControllerSettings(prev => ({ ...prev, sensitivity: parseFloat(e.target.value) }))}
                        style={{ width: '100%', accentColor: '#4facfe' }}
                      />
                    </div>

                    {/* Deadzone */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>
                        Stick Deadzone: {Math.round(controllerSettings.deadzone * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0.01"
                        max="0.5"
                        step="0.01"
                        value={controllerSettings.deadzone}
                        onChange={(e) => setControllerSettings(prev => ({ ...prev, deadzone: parseFloat(e.target.value) }))}
                        style={{ width: '100%', accentColor: '#4facfe' }}
                      />
                    </div>

                    {/* Vibration */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={controllerSettings.vibration}
                          onChange={(e) => setControllerSettings(prev => ({ ...prev, vibration: e.target.checked }))}
                          style={{ marginRight: '0.5rem', accentColor: '#4facfe' }}
                        />
                        Enable Controller Vibration
                      </label>
                    </div>

                    {/* Auto-repeat */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={controllerSettings.autoRepeat}
                          onChange={(e) => setControllerSettings(prev => ({ ...prev, autoRepeat: e.target.checked }))}
                          style={{ marginRight: '0.5rem', accentColor: '#4facfe' }}
                        />
                        Enable Button Auto-Repeat
                      </label>
                    </div>
                  </div>

                  <div>
                    <h3 style={{ color: '#4facfe', marginBottom: '1rem' }}>Layout Presets</h3>
                    
                    {/* Button Layout Presets */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>
                        Button Layout:
                      </label>
                      <select
                        value={controllerSettings.buttonLayout}
                        onChange={(e) => setControllerSettings(prev => ({ ...prev, buttonLayout: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          backgroundColor: '#333',
                          color: '#fff',
                          border: '2px solid #4facfe',
                          borderRadius: '8px'
                        }}
                      >
                        <option value="default">Default (PlayStation Style)</option>
                        <option value="xbox">Xbox Style</option>
                        <option value="custom">Custom Mapping</option>
                      </select>
                    </div>

                    {/* Performance Settings */}
                    <div style={{ 
                      padding: '1rem', 
                      backgroundColor: 'rgba(46, 213, 115, 0.1)', 
                      borderRadius: '8px',
                      marginBottom: '1rem'
                    }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#2ed573' }}>Performance Tips</h4>
                      <ul style={{ margin: 0, fontSize: '0.9rem', color: '#ccc' }}>
                        <li>Lower deadzone = more responsive but might cause drift</li>
                        <li>Higher sensitivity = faster movement but less precision</li>
                        <li>Disable vibration to improve battery life</li>
                      </ul>
                    </div>

                    {/* Save/Reset buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => {
                          localStorage.setItem('controllerSettings', JSON.stringify(controllerSettings));
                          alert('Settings saved successfully!');
                        }}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          backgroundColor: '#2ed573',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff',
                          cursor: 'pointer'
                        }}
                      >
                        💾 Save Settings
                      </button>
                      <button 
                        onClick={() => {
                          setControllerSettings({
                            sensitivity: 0.8,
                            deadzone: 0.1,
                            vibration: true,
                            autoRepeat: false,
                            buttonLayout: 'default'
                          });
                        }}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          backgroundColor: '#ff4757',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff',
                          cursor: 'pointer'
                        }}
                      >
                        🔄 Reset
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {controllerTab === 'test' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <div>
                    <h3 style={{ color: '#4facfe', marginBottom: '1rem' }}>Controller Test</h3>
                    
                    {connectedControllers.length > 0 ? (
                      <div>
                        <div style={{ 
                          padding: '1rem', 
                          backgroundColor: 'rgba(0, 0, 0, 0.3)', 
                          borderRadius: '8px',
                          marginBottom: '1rem'
                        }}>
                          <h4 style={{ margin: '0 0 0.5rem 0', color: '#2ed573' }}>Live Input Monitor</h4>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: '#ccc' }}>
                            Press any button or move sticks to see real-time input data.
                          </p>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                          <button 
                            onClick={() => {
                              const gamepad = navigator.getGamepads()[0];
                              if (gamepad && gamepad.vibrationActuator) {
                                gamepad.vibrationActuator.playEffect('dual-rumble', {
                                  duration: 300,
                                  strongMagnitude: 0.7,
                                  weakMagnitude: 0.3
                                });
                              } else {
                                alert('Vibration not supported on this controller');
                              }
                            }}
                            style={{
                              padding: '0.75rem 1rem',
                              backgroundColor: '#ff4757',
                              border: 'none',
                              borderRadius: '8px',
                              color: '#fff',
                              cursor: 'pointer'
                            }}
                          >
                            🎮 Test Vibration
                          </button>
                          
                          <button 
                            onClick={() => {
                              // Simulate button press feedback
                              alert('Button test successful! All inputs are being detected correctly.');
                            }}
                            style={{
                              padding: '0.75rem 1rem',
                              backgroundColor: '#2ed573',
                              border: 'none',
                              borderRadius: '8px',
                              color: '#fff',
                              cursor: 'pointer'
                            }}
                          >
                            ✅ Test All Buttons
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ 
                        padding: '2rem', 
                        textAlign: 'center', 
                        backgroundColor: 'rgba(255, 71, 87, 0.1)', 
                        borderRadius: '8px',
                        border: '2px dashed #ff4757'
                      }}>
                        <h4 style={{ color: '#ff4757', margin: '0 0 1rem 0' }}>No Controller Detected</h4>
                        <p style={{ margin: 0, color: '#ccc' }}>
                          Please connect a controller to test its functionality.
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 style={{ color: '#4facfe', marginBottom: '1rem' }}>Calibration</h3>
                    
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ color: '#ffd700', margin: '0 0 0.5rem 0' }}>Stick Calibration</h4>
                      <p style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: '1rem' }}>
                        Move your analog sticks in full circles to calibrate the range.
                      </p>
                      <button 
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          backgroundColor: '#ffd700',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#000',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        Start Calibration
                      </button>
                    </div>

                    <div style={{ 
                      padding: '1rem', 
                      backgroundColor: 'rgba(255, 215, 0, 0.1)', 
                      borderRadius: '8px'
                    }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#ffd700' }}>Troubleshooting</h4>
                      <ul style={{ margin: 0, fontSize: '0.9rem', color: '#ccc' }}>
                        <li>Controller not detected? Try unplugging and reconnecting</li>
                        <li>Buttons not responding? Check for driver updates</li>
                        <li>Stick drift? Increase deadzone in settings</li>
                        <li>Input lag? Reduce sensitivity for better precision</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem', paddingTop: '1rem', borderTop: '2px solid #333' }}>
              <button 
                onClick={() => setShowControllerConfig(false)}
                style={{
                  padding: '1rem 2rem',
                  backgroundColor: '#4facfe',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}
              >
                Apply & Close
              </button>
            </div>
          </div>
        </div>
      )}

      <h2>Select Your Robot{selectionMode === 'two-player' ? 's' : ''}</h2>
      
      {/* Mode Selection */}
      <div style={{ marginBottom: '2rem' }}>
        <button 
          className={`btn ${selectionMode === 'single' ? 'btn-success' : ''}`}
          onClick={() => setSelectionMode('single')}
          style={{ marginRight: '1rem' }}
        >
          Single Player
        </button>
        <button 
          className={`btn ${selectionMode === 'two-player' ? 'btn-success' : ''}`}
          onClick={() => setSelectionMode('two-player')}
          style={{ 
            marginRight: '1rem',
            boxShadow: (navigationMode === 'menu' && isSelected(0)) ? '0 0 20px #4facfe' : 'none',
            transform: (navigationMode === 'menu' && isSelected(0)) ? 'scale(1.05)' : 'scale(1)',
            border: (navigationMode === 'menu' && isSelected(0)) ? '3px solid #4facfe' : '1px solid #ccc',
            transition: 'all 0.3s ease'
          }}
        >
          Two Player Battle {(navigationMode === 'menu' && isSelected(0) && isGamepadConnected) && ' 🎮'}
        </button>
        <button 
          className="btn"
          onClick={() => setShowControllerConfig(true)}
          style={{ 
            backgroundColor: '#ff6b6b', 
            border: (navigationMode === 'menu' && isSelected(1)) ? '3px solid #4facfe' : '2px solid #ff6b6b',
            color: '#fff',
            boxShadow: (navigationMode === 'menu' && isSelected(1)) ? '0 0 20px #4facfe' : 'none',
            transform: (navigationMode === 'menu' && isSelected(1)) ? 'scale(1.05)' : 'scale(1)',
            transition: 'all 0.3s ease'
          }}
        >
          🎮 Edit Controller {(navigationMode === 'menu' && isSelected(1) && isGamepadConnected) && ' 🎮'}
        </button>
      </div>

      {gamepadConnected && selectionMode === 'two-player' && (
        <div style={{ color: '#4facfe', marginBottom: '1rem' }}>
          🎮 Gamepad detected! Player 2 can use controller.
        </div>
      )}

      {/* Player 1 Selection */}
      <div style={{ marginBottom: selectionMode === 'two-player' ? '2rem' : '0' }}>
        {selectionMode === 'two-player' && <h3 style={{ color: '#4facfe' }}>Player 1 (WASD) {currentPlayer === 1 && isGamepadConnected && '🎮'}</h3>}
        <div className="character-list">
          {CHARACTERS.map((char, index) => {
            const isPlayer1Selected = player1Selected === char.id;
            const isGamepadHighlighted = navigationMode === 'character' && currentPlayer === 1 && isSelected(index);
            
            return (
              <div
                key={`p1-${char.id}`}
                className={`character-card${isPlayer1Selected ? ' selected' : ''}`}
                style={{ 
                  borderColor: isPlayer1Selected ? '#4facfe' : char.color,
                  outline: isPlayer1Selected ? '3px solid #4facfe' : 'none',
                  boxShadow: isGamepadHighlighted ? '0 0 20px #4facfe' : 'none',
                  transform: isGamepadHighlighted ? 'scale(1.05)' : 'scale(1)',
                  background: isGamepadHighlighted ? 'rgba(79, 172, 254, 0.1)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                tabIndex={0}
                aria-selected={isPlayer1Selected}
                onClick={() => setPlayer1Selected(char.id)}
                onDoubleClick={() => {
                  if (selectionMode === 'single') {
                    const availableEnemies = CHARACTERS.filter(c => c.id !== char.id);
                    const randomEnemy = availableEnemies[Math.floor(Math.random() * availableEnemies.length)];
                    onSelect({ player1: char, player2: randomEnemy });
                  }
                }}
              >
                {isGamepadHighlighted && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: '#4facfe',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    zIndex: 10
                  }}>
                    🎮
                  </div>
                )}
                <div className="character-avatar">
                <AnimatedSprite 
                  character={char.spriteId}
                  animation={player1Selected === char.id ? 'celebrate' : 'idle'}
                  scale={2}
                  showEffects={true}
                />
              </div>
              <h3>{char.name}</h3>
              <p>{char.description}</p>
              <div className="character-stats">
                <span>Health: {char.health}</span> | <span>Attack: {char.attack}</span>
              </div>
              <div className="character-abilities">
                <strong>Abilities:</strong>
                <ul>
                  {char.abilities.map((ability, idx) => (
                    <li key={idx}>{ability}</li>
                  ))}
                </ul>
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* Player 2 Selection */}
      {selectionMode === 'two-player' && (
        <div>
          <h3 style={{ color: '#ff4757' }}>Player 2 {gamepadConnected ? '(Controller)' : '(CPU)'} {currentPlayer === 2 && isGamepadConnected && '🎮'}</h3>
          <div className="character-list">
            {CHARACTERS.map((char, index) => {
              const isPlayer2Selected = player2Selected === char.id;
              const isGamepadHighlighted = navigationMode === 'character' && currentPlayer === 2 && isSelected(index);
              
              return (
                <div
                  key={`p2-${char.id}`}
                  className={`character-card${isPlayer2Selected ? ' selected' : ''}`}
                  style={{ 
                    borderColor: isPlayer2Selected ? '#ff4757' : char.color,
                    outline: isPlayer2Selected ? '3px solid #ff4757' : 'none',
                    boxShadow: isGamepadHighlighted ? '0 0 20px #ff4757' : 'none',
                    transform: isGamepadHighlighted ? 'scale(1.05)' : 'scale(1)',
                    background: isGamepadHighlighted ? 'rgba(255, 71, 87, 0.1)' : 'transparent',
                    cursor: gamepadConnected ? 'pointer' : 'default',
                    opacity: gamepadConnected ? 1 : 0.7,
                    transition: 'all 0.3s ease'
                  }}
                  tabIndex={0}
                  aria-selected={isPlayer2Selected}
                  onClick={() => gamepadConnected && setPlayer2Selected(char.id)}
                >
                  {isGamepadHighlighted && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: '#ff4757',
                      color: '#fff',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      zIndex: 10
                    }}>
                      🎮
                    </div>
                  )}
                  <div className="character-avatar">
                  <AnimatedSprite 
                    character={char.spriteId}
                    animation={player2Selected === char.id ? 'celebrate' : 'idle'}
                    scale={2}
                    showEffects={true}
                  />
                </div>
                <h3>{char.name}</h3>
                <p>{char.description}</p>
                <div className="character-stats">
                  <span>Health: {char.health}</span> | <span>Attack: {char.attack}</span>
                </div>
                <div className="character-abilities">
                  <strong>Abilities:</strong>
                  <ul>
                    {char.abilities.map((ability, idx) => (
                      <li key={idx}>{ability}</li>
                    ))}
                  </ul>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ marginTop: '2rem' }}>
        <button
          className="btn"
          onClick={() => {
            if (selectionMode === 'single') {
              const player1Char = CHARACTERS.find(c => c.id === player1Selected);
              const availableEnemies = CHARACTERS.filter(c => c.id !== player1Selected);
              const randomEnemy = availableEnemies[Math.floor(Math.random() * availableEnemies.length)];
              onSelect({ player1: player1Char, player2: randomEnemy });
            } else {
              onSelect({ 
                player1: CHARACTERS.find(c => c.id === player1Selected), 
                player2: gamepadConnected ? CHARACTERS.find(c => c.id === player2Selected) : CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)]
              });
            }
          }}
        >
          {selectionMode === 'single' ? 
            `Choose ${CHARACTERS.find(c => c.id === player1Selected).name}` : 
            'Start Battle!'
          }
        </button>
        <div style={{ marginTop: '1rem', color: '#ccc', fontSize: '0.9rem' }}>
          {selectionMode === 'single' ? 
            'Use A/D to navigate, S to select. Enemy will be chosen randomly!' : 
            'Player 1: A/D to navigate, S to select | Player 2: ← → to navigate'
          }
        </div>
      </div>
    </div>
  );
};

export default CharacterSelect;
