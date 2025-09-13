import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SideScroller from '../components/SideScroller';
import GameTest from '../components/GameTest';

const SideScrollerPage = () => {
  const navigate = useNavigate();
  const [characters, setCharacters] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🎮 SideScrollerPage mounting...');
    const loadCharacters = () => {
      try {
        setLoading(true);
        console.log('📋 Loading character data from sessionStorage...');
        
        // Get selected characters from sessionStorage
        const selectedCharacters = sessionStorage.getItem('selectedCharacters');
        console.log('📊 Raw sessionStorage data:', selectedCharacters);
        
        if (selectedCharacters) {
          const parsed = JSON.parse(selectedCharacters);
          console.log('✅ Parsed character data:', parsed);
          setCharacters(parsed);
          console.log('✅ Game characters loaded:', parsed);
        } else {
          console.warn('⚠️ No character data found, using default characters for testing');
          // Provide default characters for testing
          const defaultCharacters = {
            player1: {
              name: 'Test Fighter 1',
              avatar: '/assets/images/mech2.png',
              health: 100,
              attack: 20,
              defense: 15,
              speed: 18
            },
            player2: {
              name: 'Test Fighter 2', 
              avatar: '/assets/images/mech3.png',
              health: 100,
              attack: 18,
              defense: 20,
              speed: 15
            }
          };
          setCharacters(defaultCharacters);
          console.log('🧪 Using default test characters:', defaultCharacters);
        }
      } catch (error) {
        console.error('❌ Failed to load characters for game:', error);
        alert(`Failed to load character data: ${error.message}`);
        navigate('/character-select');
      } finally {
        setLoading(false);
        console.log('🏁 Character loading process completed');
      }
    };

    loadCharacters();
  }, [navigate]);

  // Add a debug/test mode toggle
  const isTestMode = new URLSearchParams(window.location.search).get('test') === 'true';
  
  const handleGameEnd = (result) => {
    console.log('Game ended with result:', result);
    
    // Navigate back to home or show results
    navigate('/', { 
      state: { 
        gameResult: result,
        characters: characters 
      }
    });
  };

  const handleBackToMenu = () => {
    console.log('handleBackToMenu called - navigating to home');
    navigate('/');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #16213e 100%)'
    }}>
      {loading ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontSize: '1.2rem',
          color: '#fff',
          gap: '1rem'
        }}>
          <div>🎮 Loading game...</div>
          <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
            Preparing battle arena...
          </div>
        </div>
      ) : !characters ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontSize: '1.2rem',
          color: '#fff',
          gap: '1rem'
        }}>
          <div>❌ Character data not available</div>
          <button
            onClick={() => navigate('/character-select')}
            style={{
              background: 'linear-gradient(45deg, #4facfe, #00f2fe)',
              border: 'none',
              color: '#fff',
              padding: '1rem 2rem',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            🔄 Select Characters
          </button>
        </div>
      ) : (
        isTestMode ? (
          <GameTest 
            character={characters}
          />
        ) : (
          <SideScroller 
            character={characters}
            onBackToMenu={handleBackToMenu}
            onGameEnd={handleGameEnd}
          />
        )
      )}
    </div>
  );
};

export default SideScrollerPage;