import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { statisticsService } from '../services/StatisticsService';

const CharacterProgression = ({ isVisible, onClose }) => {
  const [progression, setProgression] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStat, setSelectedStat] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (isVisible) {
      loadProgression();
    }
  }, [isVisible]);

  useEffect(() => {
    // Listen for level up and ability unlock events
    const handleLevelUp = (event) => {
      loadProgression();
      addNotification(`Level Up! Now Level ${event.detail.newLevel}`, 'success');
    };

    const handleAbilityUnlocked = (event) => {
      loadProgression();
      addNotification(`New Ability Unlocked: ${event.detail.ability}`, 'ability');
    };

    window.addEventListener('levelUp', handleLevelUp);
    window.addEventListener('abilityUnlocked', handleAbilityUnlocked);
    
    return () => {
      window.removeEventListener('levelUp', handleLevelUp);
      window.removeEventListener('abilityUnlocked', handleAbilityUnlocked);
    };
  }, []);

  const loadProgression = () => {
    const data = statisticsService.getCharacterProgression();
    setProgression(data);
  };

  const addNotification = (message, type) => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: Date.now()
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 3000);
  };

  const upgradeStatHandler = (statName, points = 1) => {
    const result = statisticsService.upgradeStats(statName, points);
    
    if (result.success) {
      loadProgression();
      addNotification(result.message, 'success');
    } else {
      addNotification(result.message, 'error');
    }
  };

  const equipAbilityHandler = (ability, slot) => {
    const result = statisticsService.equipAbility(ability, slot);
    
    if (result.success) {
      loadProgression();
      addNotification(result.message, 'success');
    } else {
      addNotification(result.message, 'error');
    }
  };

  if (!isVisible || !progression) return null;

  const getStatUpgradeCost = (statName) => {
    const statCosts = {
      health: 1,
      attack: 2,
      defense: 2,
      speed: 3,
      accuracy: 1,
      criticalChance: 3
    };
    return statCosts[statName] || 1;
  };

  const getStatColor = (statName) => {
    const colors = {
      health: '#e74c3c',
      attack: '#f39c12',
      defense: '#3498db',
      speed: '#2ecc71',
      accuracy: '#9b59b6',
      criticalChance: '#e67e22'
    };
    return colors[statName] || '#fff';
  };

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
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
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
            borderRadius: '20px',
            padding: '30px',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '2px solid #4facfe',
            boxShadow: '0 20px 60px rgba(79, 172, 254, 0.3)',
            position: 'relative'
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
            <div>
              <h2 style={{
                color: '#4facfe',
                margin: 0,
                fontSize: '28px',
                fontWeight: 'bold'
              }}>
                ⚡ Character Progression
              </h2>
              <div style={{
                color: '#ccc',
                fontSize: '16px',
                marginTop: '5px'
              }}>
                Level {progression.level} • Power Level: {progression.powerLevel}
              </div>
            </div>
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

          {/* Experience Bar */}
          <div style={{
            background: '#0f0f23',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '25px',
            border: '1px solid #333'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px'
            }}>
              <span style={{ color: '#4facfe', fontWeight: 'bold' }}>
                Experience Progress
              </span>
              <span style={{ color: '#ccc' }}>
                {progression.experience} / {progression.experienceToNextLevel} XP
              </span>
            </div>
            <div style={{
              background: '#333',
              borderRadius: '8px',
              height: '12px',
              overflow: 'hidden'
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progression.experienceProgress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
                  borderRadius: '8px'
                }}
              />
            </div>
          </div>

          {/* Tab Navigation */}
          <div style={{
            display: 'flex',
            marginBottom: '25px',
            borderBottom: '1px solid #333'
          }}>
            {[
              { id: 'overview', label: '📊 Overview' },
              { id: 'stats', label: '💪 Stats' },
              { id: 'abilities', label: '⚡ Abilities' },
              { id: 'customization', label: '🎨 Customize' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: activeTab === tab.id ? '#4facfe' : 'transparent',
                  border: 'none',
                  color: activeTab === tab.id ? '#000' : '#fff',
                  padding: '12px 20px',
                  cursor: 'pointer',
                  borderRadius: '8px 8px 0 0',
                  fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                  transition: 'all 0.3s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ minHeight: '400px' }}>
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}
              >
                <div style={{
                  background: '#0f0f23',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid #333'
                }}>
                  <h4 style={{ color: '#4facfe', marginBottom: '15px' }}>Character Info</h4>
                  <div style={{ color: '#fff', lineHeight: '1.8' }}>
                    <div>Level: <strong>{progression.level}</strong></div>
                    <div>Power Level: <strong>{progression.powerLevel}</strong></div>
                    <div>Skill Points: <strong style={{ color: '#ffd700' }}>{progression.skillPoints}</strong></div>
                    <div>Abilities Unlocked: <strong>{progression.unlockedAbilities.length}</strong></div>
                  </div>
                </div>

                <div style={{
                  background: '#0f0f23',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid #333'
                }}>
                  <h4 style={{ color: '#4facfe', marginBottom: '15px' }}>Current Stats</h4>
                  <div style={{ color: '#fff', lineHeight: '1.8' }}>
                    {Object.entries(progression.stats).map(([stat, value]) => (
                      <div key={stat} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ textTransform: 'capitalize' }}>{stat}:</span>
                        <strong style={{ color: getStatColor(stat) }}>{value}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{
                  background: '#0f0f23',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid #333'
                }}>
                  <h4 style={{ color: '#4facfe', marginBottom: '15px' }}>Equipped Abilities</h4>
                  <div style={{ color: '#fff', lineHeight: '1.8' }}>
                    {progression.equippedAbilities.map(({ slot, ability }) => (
                      <div key={slot} style={{ marginBottom: '8px' }}>
                        <div style={{ color: '#ccc', fontSize: '12px', textTransform: 'uppercase' }}>
                          {slot.replace('slot', 'Slot ')}
                        </div>
                        <div style={{ color: ability ? '#4facfe' : '#666' }}>
                          {ability ? ability.name : 'Empty'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'stats' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}
              >
                {Object.entries(progression.stats).map(([statName, value]) => (
                  <div
                    key={statName}
                    style={{
                      background: '#0f0f23',
                      padding: '20px',
                      borderRadius: '12px',
                      border: `2px solid ${getStatColor(statName)}30`
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '15px'
                    }}>
                      <h4 style={{ color: getStatColor(statName), margin: 0, textTransform: 'capitalize' }}>
                        {statName}
                      </h4>
                      <span style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold' }}>
                        {value}
                      </span>
                    </div>
                    
                    <div style={{ marginBottom: '15px', color: '#ccc', fontSize: '14px' }}>
                      {statName === 'health' && 'Increases maximum health points'}
                      {statName === 'attack' && 'Increases damage dealt'}
                      {statName === 'defense' && 'Reduces damage taken'}
                      {statName === 'speed' && 'Increases movement and attack speed'}
                      {statName === 'accuracy' && 'Improves projectile accuracy'}
                      {statName === 'criticalChance' && 'Chance for critical hits'}
                    </div>

                    <button
                      onClick={() => upgradeStatHandler(statName)}
                      disabled={progression.skillPoints < getStatUpgradeCost(statName)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: progression.skillPoints >= getStatUpgradeCost(statName) 
                          ? getStatColor(statName) : '#333',
                        color: progression.skillPoints >= getStatUpgradeCost(statName) ? '#fff' : '#666',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: progression.skillPoints >= getStatUpgradeCost(statName) ? 'pointer' : 'not-allowed',
                        fontWeight: 'bold'
                      }}
                    >
                      Upgrade ({getStatUpgradeCost(statName)} SP)
                    </button>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'abilities' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}
              >
                {progression.unlockedAbilities.map((ability) => (
                  <div
                    key={ability.id}
                    style={{
                      background: '#0f0f23',
                      padding: '20px',
                      borderRadius: '12px',
                      border: '1px solid #333'
                    }}
                  >
                    <h4 style={{ color: '#4facfe', marginBottom: '10px' }}>
                      {ability.name}
                    </h4>
                    <p style={{ color: '#ccc', fontSize: '14px', marginBottom: '15px' }}>
                      {ability.description}
                    </p>
                    <div style={{ 
                      background: ability.category === 'legendary' ? '#ffd700' : 
                                 ability.category === 'ultimate' ? '#e74c3c' : '#4facfe',
                      color: '#000',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      marginBottom: '15px',
                      display: 'inline-block'
                    }}>
                      {ability.category}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      {['slot1', 'slot2', 'slot3', 'slot4'].map((slot) => (
                        <button
                          key={slot}
                          onClick={() => equipAbilityHandler(ability.id, slot)}
                          style={{
                            padding: '5px 10px',
                            background: progression.equippedAbilities.find(eq => eq.slot === slot && eq.ability?.id === ability.id)
                              ? '#2ecc71' : '#333',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          {slot.replace('slot', 'Slot ')}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'customization' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center', padding: '50px' }}
              >
                <h3 style={{ color: '#4facfe', marginBottom: '20px' }}>🚧 Customization System</h3>
                <p style={{ color: '#ccc', fontSize: '16px' }}>
                  Character customization features coming soon!<br/>
                  Unlock new skins, weapons, and visual effects as you progress.
                </p>
                <div style={{
                  background: '#0f0f23',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid #333',
                  marginTop: '20px'
                }}>
                  <h4 style={{ color: '#ffd700' }}>Current Customization</h4>
                  {Object.entries(progression.customization).map(([type, option]) => (
                    <div key={type} style={{ color: '#ccc', marginBottom: '10px' }}>
                      <span style={{ textTransform: 'capitalize' }}>{type}: </span>
                      <strong style={{ color: '#4facfe' }}>{option}</strong>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Notifications */}
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 1001
          }}>
            <AnimatePresence>
              {notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                  style={{
                    background: notification.type === 'error' ? '#e74c3c' : 
                               notification.type === 'ability' ? '#9b59b6' : '#2ecc71',
                    color: '#fff',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  {notification.message}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CharacterProgression;