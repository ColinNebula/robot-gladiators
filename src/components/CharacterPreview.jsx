import React, { useState, useEffect } from 'react';
import AnimatedSprite from './AnimatedSprite';

const CharacterPreview = ({ character, isSelected = false, showDemo = false }) => {
  const [currentAnimation, setCurrentAnimation] = useState('idle');
  const [demoTimer, setDemoTimer] = useState(0);

  // Demo animation sequence
  const demoSequence = ['idle', 'punch', 'idle', 'kick', 'idle', 'celebrate'];

  useEffect(() => {
    if (!showDemo) {
      setCurrentAnimation(isSelected ? 'celebrate' : 'idle');
      return;
    }

    // Auto-cycle through animations for demo
    const interval = setInterval(() => {
      setDemoTimer(prev => {
        const newTimer = (prev + 1) % (demoSequence.length * 60); // 60 frames per animation
        const animIndex = Math.floor(newTimer / 60);
        setCurrentAnimation(demoSequence[animIndex]);
        return newTimer;
      });
    }, 50); // ~20 FPS

    return () => clearInterval(interval);
  }, [showDemo, isSelected]);

  const handlePreviewClick = () => {
    // Trigger a quick demo on click
    if (!showDemo) {
      setCurrentAnimation('punch');
      setTimeout(() => setCurrentAnimation('idle'), 500);
    }
  };

  return (
    <div 
      className="character-preview"
      onClick={handlePreviewClick}
      style={{
        position: 'relative',
        cursor: 'pointer',
        padding: '1rem',
        borderRadius: '12px',
        background: isSelected ? 'rgba(79, 172, 254, 0.2)' : 'transparent',
        border: isSelected ? '2px solid #4facfe' : '2px solid transparent',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minWidth: '120px'
      }}
    >
      <AnimatedSprite 
        character={character.spriteId || character.id}
        animation={currentAnimation}
        scale={2.5}
        showEffects={true}
        style={{
          filter: isSelected ? 'drop-shadow(0 0 10px #4facfe)' : 'none'
        }}
      />
      
      {/* Animation indicator */}
      {showDemo && (
        <div style={{
          marginTop: '0.5rem',
          fontSize: '0.8rem',
          color: '#4facfe',
          fontWeight: 'bold',
          textTransform: 'capitalize'
        }}>
          {currentAnimation}
        </div>
      )}
      
      {/* Character name */}
      <div style={{
        marginTop: '0.5rem',
        fontSize: '1rem',
        fontWeight: 'bold',
        color: isSelected ? '#4facfe' : '#ffffff'
      }}>
        {character.name}
      </div>

      {/* Selection glow effect */}
      {isSelected && (
        <div style={{
          position: 'absolute',
          top: '-2px',
          left: '-2px',
          right: '-2px',
          bottom: '-2px',
          borderRadius: '14px',
          background: 'linear-gradient(45deg, #4facfe, #00f2fe)',
          opacity: 0.3,
          zIndex: -1,
          animation: 'pulse 2s infinite'
        }} />
      )}
    </div>
  );
};

export default CharacterPreview;