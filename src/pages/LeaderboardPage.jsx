import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useGame } from '../context/GameContext';
import LoadingSpinner from '../components/LoadingSpinner';

const LeaderboardPage = () => {
  const { currentTheme } = useTheme();
  const { state: gameState } = useGame();
  const [selectedCategory, setSelectedCategory] = useState('score');
  const [isLoading, setIsLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState([]);

  const categories = [
    { id: 'score', label: 'High Scores', icon: '💰' },
    { id: 'battles', label: 'Most Battles', icon: '⚔️' },
    { id: 'damage', label: 'Total Damage', icon: '💥' },
    { id: 'achievements', label: 'Achievements', icon: '🏆' }
  ];

  useEffect(() => {
    // Simulate loading leaderboard data
    const loadLeaderboard = async () => {
      setIsLoading(true);
      
      // Generate mock leaderboard data
      const mockData = {
        score: [
          { rank: 1, name: 'CyberChampion', value: 15750, avatar: '🤖' },
          { rank: 2, name: 'NebulaWarrior', value: 12300, avatar: '⚡' },
          { rank: 3, name: 'RobotMaster', value: 11850, avatar: '🔧' },
          { rank: 4, name: 'GalacticHero', value: 10200, avatar: '🚀' },
          { rank: 5, name: 'MechPilot', value: 9750, avatar: '🛡️' },
          { rank: 6, name: 'You', value: gameState?.highScore || 0, avatar: '🎮', isPlayer: true },
          { rank: 7, name: 'StarFighter', value: 8400, avatar: '⭐' },
          { rank: 8, name: 'VoidSeeker', value: 7650, avatar: '🌌' },
          { rank: 9, name: 'IronGuardian', value: 6900, avatar: '🛡️' },
          { rank: 10, name: 'NeonBlade', value: 6100, avatar: '⚔️' }
        ],
        battles: [
          { rank: 1, name: 'BattleVet', value: 1250, avatar: '👨‍💼' },
          { rank: 2, name: 'WarMachine', value: 1180, avatar: '🔥' },
          { rank: 3, name: 'You', value: gameState?.statistics?.battlesPlayed || 0, avatar: '🎮', isPlayer: true },
          { rank: 4, name: 'FightClub', value: 980, avatar: '🥊' },
          { rank: 5, name: 'Gladiator', value: 890, avatar: '⚔️' }
        ],
        damage: [
          { rank: 1, name: 'Destroyer', value: 2500000, avatar: '💀' },
          { rank: 2, name: 'Annihilator', value: 2100000, avatar: '💥' },
          { rank: 3, name: 'You', value: gameState?.statistics?.totalDamageDealt || 0, avatar: '🎮', isPlayer: true },
          { rank: 4, name: 'Obliterator', value: 1800000, avatar: '⚡' },
          { rank: 5, name: 'Pulverizer', value: 1600000, avatar: '🔨' }
        ],
        achievements: [
          { rank: 1, name: 'CompletionMaster', value: 25, avatar: '🏅' },
          { rank: 2, name: 'AchievementHunter', value: 23, avatar: '🎯' },
          { rank: 3, name: 'You', value: gameState?.statistics?.achievementsUnlocked || 0, avatar: '🎮', isPlayer: true },
          { rank: 4, name: 'TrophyCollector', value: 19, avatar: '🏆' },
          { rank: 5, name: 'LegendSeeker', value: 17, avatar: '⭐' }
        ]
      };

      // Sort and update rankings
      Object.keys(mockData).forEach(category => {
        mockData[category].sort((a, b) => b.value - a.value);
        mockData[category].forEach((entry, index) => {
          entry.rank = index + 1;
        });
      });

      setLeaderboardData(mockData);
      setIsLoading(false);
    };

    loadLeaderboard();
  }, [gameState]);

  const formatValue = (value, category) => {
    switch (category) {
      case 'score':
        return `$${value.toLocaleString()}`;
      case 'battles':
        return value.toLocaleString();
      case 'damage':
        return value.toLocaleString();
      case 'achievements':
        return value;
      default:
        return value;
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return '#FFD700'; // Gold
      case 2: return '#C0C0C0'; // Silver
      case 3: return '#CD7F32'; // Bronze
      default: return currentTheme.colors.textSecondary;
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return rank;
    }
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        flexDirection: 'column',
        gap: '2rem'
      }}>
        <LoadingSpinner size="large" />
        <p style={{ color: currentTheme.colors.textSecondary }}>
          Loading galactic leaderboards...
        </p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '80vh',
      padding: '2rem',
      maxWidth: '1000px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          textAlign: 'center',
          marginBottom: '3rem'
        }}
      >
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          background: currentTheme.gradients.primary,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          marginBottom: '1rem'
        }}>
          Galactic Leaderboards
        </h1>
        
        <p style={{
          color: currentTheme.colors.textSecondary,
          fontSize: '1.1rem'
        }}>
          See how you rank among the greatest warriors in the nebula
        </p>
      </motion.div>

      {/* Category Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}
      >
        {categories.map((category) => (
          <motion.button
            key={category.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCategory(category.id)}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              border: 'none',
              background: selectedCategory === category.id 
                ? currentTheme.colors.primary 
                : 'transparent',
              color: selectedCategory === category.id 
                ? currentTheme.colors.background 
                : currentTheme.colors.text,
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease',
              boxShadow: selectedCategory === category.id 
                ? currentTheme.shadows.medium 
                : 'none'
            }}
          >
            <span>{category.icon}</span>
            <span className="hide-mobile">{category.label}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Leaderboard */}
      <motion.div
        key={selectedCategory}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          background: currentTheme.colors.surface,
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: currentTheme.shadows.large
        }}
      >
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: currentTheme.colors.text,
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>{categories.find(c => c.id === selectedCategory)?.icon}</span>
          {categories.find(c => c.id === selectedCategory)?.label}
        </h2>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {leaderboardData[selectedCategory]?.map((entry, index) => (
            <motion.div
              key={`${entry.name}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ 
                scale: 1.02,
                boxShadow: currentTheme.shadows.medium
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1rem 1.5rem',
                borderRadius: '12px',
                background: entry.isPlayer 
                  ? `linear-gradient(135deg, ${currentTheme.colors.primary}20, ${currentTheme.colors.secondary}20)`
                  : entry.rank <= 3 
                    ? `linear-gradient(135deg, ${getRankColor(entry.rank)}20, ${currentTheme.colors.surface})`
                    : currentTheme.colors.background,
                border: entry.isPlayer 
                  ? `2px solid ${currentTheme.colors.primary}`
                  : entry.rank <= 3 
                    ? `2px solid ${getRankColor(entry.rank)}50`
                    : `1px solid ${currentTheme.colors.primary}20`,
                transition: 'all 0.3s ease'
              }}
            >
              {/* Rank */}
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: getRankColor(entry.rank),
                minWidth: '60px',
                textAlign: 'center'
              }}>
                {getRankIcon(entry.rank)}
              </div>

              {/* Avatar */}
              <div style={{
                fontSize: '2rem',
                marginRight: '1rem'
              }}>
                {entry.avatar}
              </div>

              {/* Name */}
              <div style={{
                flex: 1,
                fontSize: '1.1rem',
                fontWeight: entry.isPlayer ? 'bold' : '600',
                color: entry.isPlayer 
                  ? currentTheme.colors.primary 
                  : currentTheme.colors.text
              }}>
                {entry.name}
                {entry.isPlayer && ' (You)'}
              </div>

              {/* Value */}
              <div style={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: entry.rank <= 3 
                  ? getRankColor(entry.rank)
                  : currentTheme.colors.primary
              }}>
                {formatValue(entry.value, selectedCategory)}
              </div>

              {/* Trend indicator for top 3 */}
              {entry.rank <= 3 && (
                <div style={{
                  marginLeft: '1rem',
                  fontSize: '1.5rem'
                }}>
                  {entry.rank === 1 && '👑'}
                  {entry.rank === 2 && '⭐'}
                  {entry.rank === 3 && '🔥'}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Player Stats Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            marginTop: '2rem',
            padding: '1.5rem',
            background: `linear-gradient(135deg, ${currentTheme.colors.primary}10, ${currentTheme.colors.secondary}10)`,
            borderRadius: '12px',
            border: `1px solid ${currentTheme.colors.primary}30`
          }}
        >
          <h3 style={{
            fontSize: '1.2rem',
            fontWeight: 'bold',
            color: currentTheme.colors.text,
            marginBottom: '1rem'
          }}>
            Your Performance Summary
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            {categories.map((category) => {
              const playerEntry = leaderboardData[category.id]?.find(entry => entry.isPlayer);
              return (
                <div key={category.id} style={{
                  textAlign: 'center',
                  padding: '1rem',
                  background: currentTheme.colors.surface,
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                    {category.icon}
                  </div>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: currentTheme.colors.primary,
                    marginBottom: '0.25rem'
                  }}>
                    #{playerEntry?.rank || 'N/A'}
                  </div>
                  <div style={{
                    fontSize: '0.9rem',
                    color: currentTheme.colors.textSecondary
                  }}>
                    {category.label}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LeaderboardPage;