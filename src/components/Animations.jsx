import React from 'react';

const ParticleEffect = ({ type, trigger }) => {
  if (!trigger) return null;

  const getParticleClass = () => {
    switch(type) {
      case 'attack': return 'particles attack-particles';
      case 'critical': return 'particles critical-particles';
      case 'victory': return 'particles victory-particles';
      default: return 'particles';
    }
  };

  return (
    <div className={getParticleClass()}>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="particle" style={{
          '--delay': `${i * 0.1}s`,
          '--angle': `${i * 60}deg`
        }} />
      ))}
    </div>
  );
};

const AnimatedNumber = ({ value, previousValue, className = '' }) => {
  const isIncreasing = value > previousValue;
  const isDecreasing = value < previousValue;
  
  return (
    <span className={`animated-number ${className} ${
      isIncreasing ? 'increase' : isDecreasing ? 'decrease' : ''
    }`}>
      {value}
    </span>
  );
};

export { ParticleEffect, AnimatedNumber };