import React from 'react';

const GameTest = ({ character }) => {
  console.log('🧪 GameTest component loaded with character data:', character);
  
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #16213e 100%)',
      color: '#fff',
      padding: '2rem'
    }}>
      <h1>🧪 Game Test Component</h1>
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        padding: '2rem',
        borderRadius: '10px',
        marginTop: '2rem',
        maxWidth: '600px'
      }}>
        <h3>Character Data Received:</h3>
        <pre style={{
          background: 'rgba(0,0,0,0.3)',
          padding: '1rem',
          borderRadius: '5px',
          fontSize: '14px',
          overflow: 'auto'
        }}>
          {character ? JSON.stringify(character, null, 2) : 'No character data received'}
        </pre>
      </div>
      
      <div style={{
        marginTop: '2rem',
        display: 'flex',
        gap: '1rem'
      }}>
        <button
          onClick={() => window.location.href = '/'}
          style={{
            background: 'linear-gradient(45deg, #4facfe, #00f2fe)',
            border: 'none',
            color: '#fff',
            padding: '1rem 2rem',
            borderRadius: '10px',
            cursor: 'pointer'
          }}
        >
          🏠 Back to Home
        </button>
        
        <button
          onClick={() => {
            console.log('🔄 Trying to load actual SideScroller...');
            // This would be used to test switching to the real component
          }}
          style={{
            background: 'linear-gradient(45deg, #ff6b6b, #ee5a52)',
            border: 'none',
            color: '#fff',
            padding: '1rem 2rem',
            borderRadius: '10px',
            cursor: 'pointer'
          }}
        >
          🎮 Test Real Game
        </button>
      </div>
    </div>
  );
};

export default GameTest;