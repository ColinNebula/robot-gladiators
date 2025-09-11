import React from 'react';

const EnemyInfo = ({ enemy, round }) => {
  if (!enemy) return null;

  const healthPercentage = (enemy.health / enemy.maxHealth) * 100;
  
  const getHealthBarClass = () => {
    if (healthPercentage <= 25) return 'health-fill low';
    if (healthPercentage <= 50) return 'health-fill medium';
    return 'health-fill';
  };

  return (
    <div className="enemy-info">
      <h3>Round {round} - Facing: {enemy.name}</h3>
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-label">Enemy Health</div>
          <div className="stat-value">{enemy.health}/{enemy.maxHealth}</div>
          <div className="health-bar">
            <div 
              className={getHealthBarClass()}
              style={{ width: `${healthPercentage}%` }}
            ></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Attack Power</div>
          <div className="stat-value">{enemy.attack}</div>
        </div>
      </div>
    </div>
  );
};

export default EnemyInfo;