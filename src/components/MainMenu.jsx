import React, { useEffect } from 'react';

const MainMenu = ({ onContinue }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        onContinue();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onContinue]);

  return (
    <div className="main-menu">
      <h2>Welcome to Nebula Wars</h2>
      <p>Press <strong>Enter</strong> or click below to begin character selection.</p>
      <button className="btn" onClick={onContinue} style={{ marginTop: '2rem' }}>
        Continue
      </button>
    </div>
  );
};

export default MainMenu;
