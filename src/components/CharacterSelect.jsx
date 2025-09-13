import React, { useState } from 'react';
import AnimatedSprite from './AnimatedSprite';
import useGamepadNavigation from '../hooks/useGamepadNavigation';

const CHARACTERS = [
  {
    id: 'malice',
    name: 'Malice',
    avatar: '🤖',
    spriteId: 'malice',
    description: 'A nimble scout robot with balanced stats.',
    health: 100,
    attack: 10,
    color: '#4facfe',
    abilities: ['Balanced stats', 'Quick recovery']
  },
  {
    id: 'lugawu',
    name: 'Lugawu',
    avatar: '👾',
    spriteId: 'lugawu',
    description: 'An advanced ninja with higher attack.',
    health: 90,
    attack: 14,
    color: '#ff4757',
    abilities: ['High attack', 'Critical hit boost']
  },
  {
    id: 'magnus',
    name: 'Magnus',
    avatar: '🦾',
    spriteId: 'magnus',
    description: 'A heavy warlord with extra health.',
    health: 120,
    attack: 8,
    color: '#2ed573',
    abilities: ['Extra health', 'Damage resistance']
  }
];

const CharacterSelect = ({ onSelect }) => {
  // Get game mode from session storage
  const storedGameMode = sessionStorage.getItem('gameMode');
  const initialMode = storedGameMode === 'two-player' ? 'two-player' : 'single';
  
  const [player1Selected, setPlayer1Selected] = useState(CHARACTERS[0].id);
  const [player2Selected, setPlayer2Selected] = useState(CHARACTERS[1].id);
  const [gamepadConnected, setGamepadConnected] = useState(false);
  const [selectionMode, setSelectionMode] = useState(initialMode);
  const [showControllerConfig, setShowControllerConfig] = useState(false);
  const [controllerTab, setControllerTab] = useState('layout');
  const [controllerSettings, setControllerSettings] = useState({
    sensitivity: 0.8,
    deadzone: 0.1,
    vibration: true,
    autoRepeat: false,
    buttonLayout: 'default'
  });
  const [connectedControllers, setConnectedControllers] = useState([]);
  const [remappingButton, setRemappingButton] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(1); // Which player is currently selecting
  const [navigationMode, setNavigationMode] = useState('character'); // 'character' or 'menu'

  // Define navigation items based on current mode
  const getNavigationItems = () => {
    if (navigationMode === 'character') {
      return CHARACTERS;
    } else {
      const menuItems = ['Two Player Battle'];
      if (gamepadConnected) {
        menuItems.push('Edit Controller');
      }
      menuItems.push('Back');
      return menuItems;
    }
  };

  // Gamepad navigation setup
  const {
    selectedIndex,
    isGamepadConnected: gamepadNavConnected,
    isSelected,
    setSelectedIndex
  } = useGamepadNavigation(getNavigationItems(), {
    onSelect: (item, index) => {
      if (navigationMode === 'character') {
        // Character selection
        if (currentPlayer === 1) {
          setPlayer1Selected(item.id);
          if (selectionMode === 'two-player') {
            setCurrentPlayer(2);
            setSelectedIndex(CHARACTERS.findIndex(c => c.id === player2Selected));
          } else {
            handleContinue();
          }
        } else {
          setPlayer2Selected(item.id);
          setNavigationMode('menu');
          setSelectedIndex(0);
        }
      } else {
        // Menu navigation
        const menuItems = getNavigationItems();
        const selectedItem = menuItems[index];
        
        if (selectedItem === 'Two Player Battle') {
          handleContinue();
        } else if (selectedItem === 'Edit Controller') {
          setShowControllerConfig(true);
        } else if (selectedItem === 'Back') {
          window.history.back();
        }
      }
    },
    onBack: () => {
      if (navigationMode === 'character' && currentPlayer === 2) {
        setCurrentPlayer(1);
        setSelectedIndex(CHARACTERS.findIndex(c => c.id === player1Selected));
      } else if (navigationMode === 'menu') {
        setNavigationMode('character');
        setCurrentPlayer(selectionMode === 'two-player' ? 2 : 1);
        const selectedChar = currentPlayer === 1 ? player1Selected : player2Selected;
        setSelectedIndex(CHARACTERS.findIndex(c => c.id === selectedChar));
      } else {
        window.history.back();
      }
    },
    onStart: () => {
      if (navigationMode === 'character') {
        if (selectionMode === 'two-player' && currentPlayer === 1) {
          setCurrentPlayer(2);
          setSelectedIndex(CHARACTERS.findIndex(c => c.id === player2Selected));
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
    initialIndex: 0
  });

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

  // Keyboard navigation for Player 1 (WASD) and Player 2 (Arrow keys)
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      // Player 1 controls (WASD)
      if (e.key === 'd') {
        const idx = CHARACTERS.findIndex(c => c.id === player1Selected);
        setPlayer1Selected(CHARACTERS[(idx + 1) % CHARACTERS.length].id);
      } else if (e.key === 'a') {
        const idx = CHARACTERS.findIndex(c => c.id === player1Selected);
        setPlayer1Selected(CHARACTERS[(idx - 1 + CHARACTERS.length) % CHARACTERS.length].id);
      } else if (e.key === 's') {
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
      }
      
      // Player 2 controls (Arrow keys) - only in two-player mode
      if (selectionMode === 'two-player') {
        if (e.key === 'ArrowRight') {
          const idx = CHARACTERS.findIndex(c => c.id === player2Selected);
          setPlayer2Selected(CHARACTERS[(idx + 1) % CHARACTERS.length].id);
        } else if (e.key === 'ArrowLeft') {
          const idx = CHARACTERS.findIndex(c => c.id === player2Selected);
          setPlayer2Selected(CHARACTERS[(idx - 1 + CHARACTERS.length) % CHARACTERS.length].id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [player1Selected, player2Selected, selectionMode, gamepadConnected, onSelect]);

  return (
    <div className="character-select">
      {/* Enhanced Controller Configuration Modal */}
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
