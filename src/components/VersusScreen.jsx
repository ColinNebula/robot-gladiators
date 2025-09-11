import React, { useState, useEffect } from 'react';

const VersusScreen = ({ character, onContinue }) => {
  const [showVersus, setShowVersus] = useState(false);
  const [showContinue, setShowContinue] = useState(false);

  useEffect(() => {
    // Animate the versus screen entrance
    const timer1 = setTimeout(() => setShowVersus(true), 500);
    const timer2 = setTimeout(() => setShowContinue(true), 2500);
    
    // Auto-continue after 4 seconds
    const timer3 = setTimeout(() => {
      onContinue();
    }, 4000);

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
        <div className="versus-lightning"></div>
        <div className="versus-lightning"></div>
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
          <div className="versus-sparks">
            <div className="spark"></div>
            <div className="spark"></div>
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
      <div className={`versus-ready ${showContinue ? 'show' : ''}`}>
        <h1>PREPARE FOR BATTLE!</h1>
        <p>Click anywhere to continue</p>
      </div>

      {/* Click to continue overlay */}
      {showContinue && (
        <div className="versus-overlay" onClick={onContinue}></div>
      )}
    </div>
  );
};

export default VersusScreen;