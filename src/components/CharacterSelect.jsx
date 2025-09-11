import React, { useState } from 'react';

const CHARACTERS = [
  {
    id: 'malice',
    name: 'Malice',
    avatar: '🤖',
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
    description: 'A heavy warlord with extra health.',
    health: 120,
    attack: 8,
    color: '#2ed573',
    abilities: ['Extra health', 'Damage resistance']
  }
];

const CharacterSelect = ({ onSelect }) => {
  const [player1Selected, setPlayer1Selected] = useState(CHARACTERS[0].id);
  const [player2Selected, setPlayer2Selected] = useState(CHARACTERS[1].id);
  const [gamepadConnected, setGamepadConnected] = useState(false);
  const [selectionMode, setSelectionMode] = useState('single'); // 'single' or 'two-player'

  // Check for gamepad connection
  React.useEffect(() => {
    function checkGamepads() {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const hasGamepad = Array.from(gamepads).some(gp => gp && gp.connected);
      setGamepadConnected(hasGamepad);
    }
    
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
        >
          Two Player Battle
        </button>
      </div>

      {gamepadConnected && selectionMode === 'two-player' && (
        <div style={{ color: '#4facfe', marginBottom: '1rem' }}>
          🎮 Gamepad detected! Player 2 can use controller.
        </div>
      )}

      {/* Player 1 Selection */}
      <div style={{ marginBottom: selectionMode === 'two-player' ? '2rem' : '0' }}>
        {selectionMode === 'two-player' && <h3 style={{ color: '#4facfe' }}>Player 1 (WASD)</h3>}
        <div className="character-list">
          {CHARACTERS.map(char => (
            <div
              key={`p1-${char.id}`}
              className={`character-card${player1Selected === char.id ? ' selected' : ''}`}
              style={{ 
                borderColor: player1Selected === char.id ? '#4facfe' : char.color,
                outline: player1Selected === char.id ? '3px solid #4facfe' : 'none', 
                cursor: 'pointer' 
              }}
              tabIndex={0}
              aria-selected={player1Selected === char.id}
              onClick={() => setPlayer1Selected(char.id)}
              onDoubleClick={() => {
                if (selectionMode === 'single') {
                  const availableEnemies = CHARACTERS.filter(c => c.id !== char.id);
                  const randomEnemy = availableEnemies[Math.floor(Math.random() * availableEnemies.length)];
                  onSelect({ player1: char, player2: randomEnemy });
                }
              }}
            >
              <div className="character-avatar" style={{ color: char.color, fontSize: '5rem' }}>{char.avatar}</div>
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
          ))}
        </div>
      </div>

      {/* Player 2 Selection */}
      {selectionMode === 'two-player' && (
        <div>
          <h3 style={{ color: '#ff4757' }}>Player 2 {gamepadConnected ? '(Controller)' : '(CPU)'}</h3>
          <div className="character-list">
            {CHARACTERS.map(char => (
              <div
                key={`p2-${char.id}`}
                className={`character-card${player2Selected === char.id ? ' selected' : ''}`}
                style={{ 
                  borderColor: player2Selected === char.id ? '#ff4757' : char.color,
                  outline: player2Selected === char.id ? '3px solid #ff4757' : 'none', 
                  cursor: gamepadConnected ? 'pointer' : 'default',
                  opacity: gamepadConnected ? 1 : 0.7
                }}
                tabIndex={0}
                aria-selected={player2Selected === char.id}
                onClick={() => gamepadConnected && setPlayer2Selected(char.id)}
              >
                <div className="character-avatar" style={{ color: char.color, fontSize: '5rem' }}>{char.avatar}</div>
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
            ))}
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
