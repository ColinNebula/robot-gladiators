import React, { useState, useEffect } from 'react';
import useGamepadNavigation from '../hooks/useGamepadNavigation';

const VersusScreen = ({ character, onContinue }) => {
  const [showVersus, setShowVersus] = useState(false);
  const [showContinue, setShowContinue] = useState(false);

  // Define menu items for gamepad navigation
  const menuItems = ['START BATTLE', 'BACK'];

  // Gamepad navigation setup
  const {
    selectedIndex,
    isGamepadConnected,
    isSelected
  } = useGamepadNavigation(menuItems, {
    onSelect: (item, index) => {
      if (index === 0 || item === 'START BATTLE') {
        handleStartBattle();
      } else if (index === 1 || item === 'BACK') {
        window.history.back();
      }
    },
    onBack: () => {
      window.history.back();
    },
    onStart: () => {
      handleStartBattle();
    },
    enabled: showContinue, // Only enable when the continue button is shown
    wrapAround: true,
    initialIndex: 0
  });

  const handleStartBattle = () => {
    console.log('🚀 START BATTLE button clicked!');
    console.log('📊 Character data available:', character);
    console.log('🔧 onContinue function type:', typeof onContinue);
    
    // Validate data before proceeding
    if (!character || !character.player1 || !character.player2) {
      console.error('❌ Invalid character data:', character);
      alert('Character data is incomplete. Please select characters again.');
      return;
    }
    
    if (onContinue) {
      try {
        console.log('🎯 Calling onContinue() to navigate to game...');
        onContinue();
        console.log('✅ onContinue() called successfully');
      } catch (error) {
        console.error('❌ Error calling onContinue:', error);
        // Fallback: try direct navigation
        console.log('🔄 Attempting fallback navigation...');
        try {
          window.location.href = '/game';
        } catch (fallbackError) {
          console.error('❌ Fallback navigation also failed:', fallbackError);
          alert('Navigation failed. Please try refreshing the page.');
        }
      }
    } else {
      console.error('❌ onContinue function not available!');
      console.log('🔄 Attempting direct navigation fallback...');
      try {
        window.location.href = '/game';
      } catch (directNavError) {
        console.error('❌ Direct navigation failed:', directNavError);
        alert('Navigation function is not available. Please try refreshing the page.');
      }
    }
  };

  useEffect(() => {
    console.log('VersusScreen mounted with character:', character);
    console.log('onContinue function:', onContinue);
    
    // Animate the versus screen entrance - much faster loading
    const timer1 = setTimeout(() => {
      console.log('Setting showVersus to true');
      setShowVersus(true);
    }, 100); // Reduced from 500ms to 100ms
    const timer2 = setTimeout(() => {
      console.log('Setting showContinue to true');
      setShowContinue(true);
    }, 300); // Reduced from 1000ms to 300ms for much faster appearance
    
    // Auto-continue after shorter time
    const timer3 = setTimeout(() => {
      console.log('Auto-continuing to battle screen');
      onContinue();
    }, 8000); // Reduced from 10000ms to 8000ms

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onContinue]);

  const player1 = character?.player1;
  const player2 = character?.player2;

  return (
    <div className="versus-screen">
      <div className="versus-background">
        {/* Minimal effects for better performance */}
      </div>
      
      <div className={`versus-content ${showVersus ? 'show' : ''}`}>
        {/* Player 1 */}
        <div className="fighter fighter-left">
          <div className="fighter-avatar">
            {player1?.avatar || '🤖'}
          </div>
          <div className="fighter-info">
            <h2 className="fighter-name">{player1?.name || 'Player 1'}</h2>
            <div className="fighter-stats">
              <div className="stat">
                <span className="stat-label">❤️ Health:</span>
                <span className="stat-value">{player1?.health || 100}</span>
              </div>
              <div className="stat">
                <span className="stat-label">⚔️ Attack:</span>
                <span className="stat-value">{player1?.attack || 10}</span>
              </div>
              <div className="stat">
                <span className="stat-label">🔰 Class:</span>
                <span className="stat-value">{player1?.class || 'Warrior'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* VS Logo */}
        <div className="versus-logo">
          <div className="versus-text">VS</div>
          {/* Reduced sparks - only two instead of four */}
          <div className="versus-sparks">
            <div className="spark"></div>
            <div className="spark"></div>
          </div>
        </div>

        {/* Player 2 */}
        <div className="fighter fighter-right">
          <div className="fighter-avatar">
            {player2?.avatar || '👾'}
          </div>
          <div className="fighter-info">
            <h2 className="fighter-name">{player2?.name || 'Enemy'}</h2>
            <div className="fighter-stats">
              <div className="stat">
                <span className="stat-label">❤️ Health:</span>
                <span className="stat-value">{player2?.health || 100}</span>
              </div>
              <div className="stat">
                <span className="stat-label">⚔️ Attack:</span>
                <span className="stat-value">{player2?.attack || 10}</span>
              </div>
              <div className="stat">
                <span className="stat-label">🔰 Class:</span>
                <span className="stat-value">{player2?.class || 'Warrior'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ready message */}
      <div 
        className={`versus-ready ${showContinue ? 'show' : ''}`}
        style={{
          zIndex: 2000,
          position: 'fixed',
          bottom: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center'
        }}
      >
        <h1>PREPARE FOR BATTLE! {isGamepadConnected && '🎮'}</h1>
        <button 
          style={{
            background: 'linear-gradient(135deg, #ff4757 0%, #ff3742 100%)',
            color: 'white',
            border: isSelected(0) ? '3px solid #4facfe' : '3px solid #fff',
            padding: '20px 40px',
            borderRadius: '15px',
            fontSize: '1.6rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginTop: '2rem',
            boxShadow: isSelected(0) 
              ? '0 0 30px #4facfe, 0 12px 35px rgba(255, 71, 87, 0.8)'
              : '0 8px 25px rgba(255, 71, 87, 0.6)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease, border 0.2s ease',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            zIndex: 2001,
            position: 'relative',
            willChange: 'transform',
            transform: isSelected(0) ? 'scale(1.08)' : 'scale(1)'
          }}
          onMouseOver={(e) => {
            if (!isSelected(0)) {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = '0 12px 35px rgba(255, 71, 87, 0.8)';
            }
          }}
          onMouseOut={(e) => {
            if (!isSelected(0)) {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 8px 25px rgba(255, 71, 87, 0.6)';
            }
          }}
          onClick={handleStartBattle}
        >
          ⚔️ START BATTLE ⚔️ {isSelected(0) && isGamepadConnected && ' 🎮'}
        </button>
        <p style={{ 
          marginTop: '1rem', 
          color: '#fff', 
          fontSize: '1rem',
          fontWeight: 'bold',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)'
        }}>
          {isGamepadConnected 
            ? 'Use D-Pad/Sticks to navigate, A/X to select, B/○ to go back'
            : 'Click to start immediately or wait for auto-start'
          }
        </p>
      </div>

      {/* Optional: Remove click anywhere functionality to avoid conflicts */}
      {/*
      {showContinue && (
        <div className="versus-overlay" onClick={() => {
          console.log('Overlay clicked, calling onContinue');
          onContinue();
        }}></div>
      )}
      */}
    </div>
  );
};

export default VersusScreen;