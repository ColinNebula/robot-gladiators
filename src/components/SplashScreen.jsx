import React from 'react';

const SplashScreen = ({ onContinue }) => {
  return (
    <div className="splash-screen">
      <div className="splash-content">
        <h1 className="splash-title">Nebula Wars</h1>
        <p className="splash-subtitle">A Space Robot Battle Adventure</p>
        <div className="splash-logo">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="55" fill="#1a1a3a" stroke="#4facfe" strokeWidth="6" />
            <circle cx="60" cy="60" r="40" fill="#2d2d5a" />
            <text x="60" y="70" textAnchor="middle" fontSize="32" fill="#00f2fe" fontFamily="monospace">🤖</text>
          </svg>
        </div>
        <button className="btn splash-btn" onClick={onContinue}>
          Start Game
        </button>
      </div>
    </div>
  );
};

export default SplashScreen;
