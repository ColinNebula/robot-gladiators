import React from 'react';
import { AnimatedNumber } from './Animations';

const PlayerStats = ({ player, previousStats }) => {
  const healthPercentage = (player.health / player.maxHealth) * 100;
  
  const getHealthBarClass = () => {
    if (healthPercentage <= 25) return 'health-fill low';
    if (healthPercentage <= 50) return 'health-fill medium';
    return 'health-fill';
  };

  return (
    <div className="stats-container">
      <div className="stat-card">
        <div className="stat-label">Robot Name</div>
        <div className="stat-value">{player.name}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Health</div>
        <div className="stat-value">
          <AnimatedNumber 
            value={player.health} 
            previousValue={previousStats?.health || player.health}
          />
          /{player.maxHealth}
        </div>
        <div className="health-bar">
          <div 
            className={getHealthBarClass()}
            style={{ width: `${healthPercentage}%` }}
          ></div>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Attack Power</div>
        <div className="stat-value">
          <AnimatedNumber 
            value={player.attack} 
            previousValue={previousStats?.attack || player.attack}
          />
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Money</div>
        <div className="stat-value">
          $<AnimatedNumber 
            value={player.money} 
            previousValue={previousStats?.money || player.money}
          />
        </div>
      </div>
    </div>
  );
};

export default PlayerStats;