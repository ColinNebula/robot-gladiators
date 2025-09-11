import React, { useState, useEffect } from 'react';

const VersusScreen = ({ character, onContinue }) => {
  const [showVersus, setShowVersus] = useState(false);
  const [showContinue, setShowContinue] = useState(false);

  useEffect(() => {
    console.log('VersusScreen mounted with character:', character);
    console.log('onContinue function:', onContinue);
    
    // Animate the versus screen entrance
    const timer1 = setTimeout(() => {
      console.log('Setting showVersus to true');
      setShowVersus(true);
    }, 500);
    const timer2 = setTimeout(() => {
      console.log('Setting showContinue to true');
      setShowContinue(true);
    }, 1000); // Reduced from 2500ms to 1000ms for faster appearance
    
    // Auto-continue after 4 seconds
    const timer3 = setTimeout(() => {
      console.log('Auto-continuing to battle screen');
      onContinue();
    }, 10000); // Increased to 10 seconds to give more time to click

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
        {/* Reduced lightning effects - only one instead of three */}
        <div className="versus-lightning"></div>
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
        <h1>PREPARE FOR BATTLE!</h1>
        <button 
          style={{
            background: 'linear-gradient(135deg, #ff4757 0%, #ff3742 100%)',
            color: 'white',
            border: '3px solid #fff',
            padding: '20px 40px',
            borderRadius: '15px',
            fontSize: '1.6rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginTop: '2rem',
            boxShadow: '0 8px 25px rgba(255, 71, 87, 0.6)',
            transition: 'all 0.3s ease',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            zIndex: 2001,
            position: 'relative'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'scale(1.1)';
            e.target.style.boxShadow = '0 12px 35px rgba(255, 71, 87, 0.8)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 8px 25px rgba(255, 71, 87, 0.6)';
          }}
          onClick={() => {
            console.log('Continue button clicked, calling onContinue');
            onContinue();
          }}
        >
          ⚔️ START BATTLE ⚔️
        </button>
        <p style={{ 
          marginTop: '1rem', 
          color: '#fff', 
          fontSize: '1rem',
          fontWeight: 'bold',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)'
        }}>
          Auto-battle starts in a few seconds, or click the button above
        </p>
        
        {/* Debug info */}
        <div style={{
          color: '#0ff',
          fontSize: '0.8rem',
          marginTop: '0.5rem'
        }}>
          Debug: showContinue = {showContinue.toString()}
        </div>
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