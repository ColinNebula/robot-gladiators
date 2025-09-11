import React from 'react';

const Achievements = ({ achievements, unlockedAchievements }) => {
  return (
    <div className="achievements-panel">
      <h3>Achievements</h3>
      <div className="achievements-grid">
        {Object.entries(achievements).map(([key, achievement]) => {
          const isUnlocked = unlockedAchievements.includes(key);
          return (
            <div 
              key={key} 
              className={`achievement-item ${isUnlocked ? 'unlocked' : 'locked'}`}
            >
              <div className="achievement-icon">
                {isUnlocked ? '🏆' : '🔒'}
              </div>
              <div className="achievement-info">
                <h4>{achievement.name}</h4>
                <p>{achievement.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Achievements;