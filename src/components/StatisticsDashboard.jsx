import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { statisticsService } from '../services/StatisticsService';

const StatisticsDashboard = ({ isVisible, onClose }) => {
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    if (isVisible) {
      loadStatistics();
    }
  }, [isVisible]);

  useEffect(() => {
    // Listen for achievement unlocks
    const handleAchievementUnlocked = (event) => {
      loadStatistics(); // Refresh stats when achievement is unlocked
    };

    window.addEventListener('achievementUnlocked', handleAchievementUnlocked);
    
    return () => {
      window.removeEventListener('achievementUnlocked', handleAchievementUnlocked);
    };
  }, []);

  const loadStatistics = () => {
    const rawStats = statisticsService.getStatistics();
    const formattedStats = statisticsService.getFormattedStatistics();
    setStats(formattedStats);
    
    // Convert achievements object to array for display
    const achievementsList = Object.entries(rawStats.achievements).map(([id, data]) => ({
      id,
      name: getAchievementName(id),
      description: getAchievementDescription(id),
      unlocked: data.unlocked,
      unlockedAt: data.unlockedAt,
      icon: getAchievementIcon(id)
    }));
    
    setAchievements(achievementsList);
  };

  const getAchievementName = (id) => {
    const names = {
      'first-victory': 'First Victory',
      'marksman': 'Marksman',
      'survivor': 'Survivor',
      'speed-demon': 'Speed Demon',
      'champion': 'Champion',
      'completionist': 'Completionist',
      'master-warrior': 'Master Warrior',
      'projectile-master': 'Projectile Master',
      'damage-dealer': 'Damage Dealer',
      'veteran': 'Veteran'
    };
    return names[id] || id;
  };

  const getAchievementDescription = (id) => {
    const descriptions = {
      'first-victory': 'Win your first battle',
      'marksman': 'Achieve 90% accuracy in a game',
      'survivor': 'Win without taking damage',
      'speed-demon': 'Win a game in under 30 seconds',
      'champion': 'Win 10 games in a row',
      'completionist': 'Complete all campaign chapters',
      'master-warrior': 'Get 3 stars on all campaigns',
      'projectile-master': 'Fire 1000 projectiles',
      'damage-dealer': 'Deal 10000 total damage',
      'veteran': 'Play for 60 minutes total'
    };
    return descriptions[id] || 'Unknown achievement';
  };

  const getAchievementIcon = (id) => {
    const icons = {
      'first-victory': '🏆',
      'marksman': '🎯',
      'survivor': '🛡️',
      'speed-demon': '⚡',
      'champion': '👑',
      'completionist': '✅',
      'master-warrior': '⭐',
      'projectile-master': '🚀',
      'damage-dealer': '💥',
      'veteran': '🎖️'
    };
    return icons[id] || '🏅';
  };

  const resetStatistics = () => {
    if (confirm('Are you sure you want to reset all statistics? This cannot be undone.')) {
      statisticsService.resetStatistics();
      loadStatistics();
    }
  };

  const exportStatistics = () => {
    const exportData = statisticsService.exportStatistics();
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nebula-wars-stats-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isVisible || !stats) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          style={{
            backgroundColor: '#1a1a2e',
            borderRadius: '16px',
            padding: '30px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
            border: '2px solid #4facfe',
            boxShadow: '0 10px 40px rgba(79, 172, 254, 0.3)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px',
            borderBottom: '2px solid #333',
            paddingBottom: '20px'
          }}>
            <h2 style={{
              color: '#4facfe',
              margin: 0,
              fontSize: '28px',
              fontWeight: 'bold'
            }}>
              📊 Player Statistics
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '5px'
              }}
            >
              ✕
            </button>
          </div>

          {/* Tab Navigation */}
          <div style={{
            display: 'flex',
            marginBottom: '25px',
            borderBottom: '1px solid #333'
          }}>
            {['basic', 'time', 'combat', 'achievements'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: activeTab === tab ? '#4facfe' : 'transparent',
                  border: 'none',
                  color: activeTab === tab ? '#000' : '#fff',
                  padding: '12px 20px',
                  cursor: 'pointer',
                  borderRadius: '8px 8px 0 0',
                  textTransform: 'capitalize',
                  fontWeight: activeTab === tab ? 'bold' : 'normal',
                  transition: 'all 0.3s ease'
                }}
              >
                {tab === 'achievements' ? '🏆 Achievements' : 
                 tab === 'basic' ? '📈 Overview' :
                 tab === 'time' ? '⏱️ Time Stats' : '⚔️ Combat'}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ minHeight: '300px' }}>
            {activeTab === 'basic' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}
              >
                {Object.entries(stats.basic).map(([key, value]) => (
                  <div key={key} style={{
                    backgroundColor: '#0f0f23',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #333',
                    textAlign: 'center'
                  }}>
                    <div style={{ color: '#4facfe', fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
                      {value}
                    </div>
                    <div style={{ color: '#ccc', fontSize: '14px' }}>
                      {key}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'time' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}
              >
                {Object.entries(stats.time).map(([key, value]) => (
                  <div key={key} style={{
                    backgroundColor: '#0f0f23',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #333',
                    textAlign: 'center'
                  }}>
                    <div style={{ color: '#4facfe', fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
                      {value}
                    </div>
                    <div style={{ color: '#ccc', fontSize: '14px' }}>
                      {key}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'combat' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}
              >
                {Object.entries(stats.combat).map(([key, value]) => (
                  <div key={key} style={{
                    backgroundColor: '#0f0f23',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #333',
                    textAlign: 'center'
                  }}>
                    <div style={{ color: '#4facfe', fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
                      {value}
                    </div>
                    <div style={{ color: '#ccc', fontSize: '14px' }}>
                      {key}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'achievements' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}
              >
                {achievements.map((achievement) => (
                  <div key={achievement.id} style={{
                    backgroundColor: achievement.unlocked ? '#0f2315' : '#0f0f23',
                    padding: '20px',
                    borderRadius: '12px',
                    border: `2px solid ${achievement.unlocked ? '#4ade80' : '#333'}`,
                    opacity: achievement.unlocked ? 1 : 0.6,
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {achievement.unlocked && (
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        color: '#4ade80',
                        fontSize: '18px'
                      }}>
                        ✓
                      </div>
                    )}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '10px'
                    }}>
                      <span style={{ fontSize: '24px', marginRight: '12px' }}>
                        {achievement.icon}
                      </span>
                      <div>
                        <div style={{
                          color: achievement.unlocked ? '#4ade80' : '#4facfe',
                          fontSize: '16px',
                          fontWeight: 'bold'
                        }}>
                          {achievement.name}
                        </div>
                        <div style={{
                          color: '#ccc',
                          fontSize: '14px'
                        }}>
                          {achievement.description}
                        </div>
                      </div>
                    </div>
                    {achievement.unlocked && achievement.unlockedAt && (
                      <div style={{
                        color: '#888',
                        fontSize: '12px',
                        textAlign: 'right'
                      }}>
                        Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '30px',
            paddingTop: '20px',
            borderTop: '1px solid #333'
          }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={exportStatistics}
                style={{
                  backgroundColor: '#4facfe',
                  color: '#000',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                📥 Export Stats
              </button>
              <button
                onClick={resetStatistics}
                style={{
                  backgroundColor: '#ff4757',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                🗑️ Reset Stats
              </button>
            </div>
            
            <div style={{
              backgroundColor: '#0f0f23',
              padding: '10px 15px',
              borderRadius: '8px',
              border: '1px solid #333'
            }}>
              <span style={{ color: '#4facfe', fontWeight: 'bold' }}>
                Achievements: {stats.achievements.Completion}
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StatisticsDashboard;