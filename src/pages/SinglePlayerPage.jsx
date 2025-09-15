import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import useGamepadNavigation from '../hooks/useGamepadNavigation';

const SinglePlayerPage = () => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const [selectedDifficulty, setSelectedDifficulty] = useState('normal');
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('campaigns');

  const playerProgress = {
    completedChapters: [1],
    totalWins: 12,
    totalLosses: 2,
    currentLevel: 5,
    experience: 750
  };

  const campaignChapters = [
    {
      id: 1,
      name: "Training Grounds",
      description: "Master the basics of combat in a safe environment",
      icon: "🛡️",
      unlocked: true,
      completed: playerProgress.completedChapters.includes(1),
      levels: 5,
      difficulty: "Beginner",
      theme: {
        primary: "#4CAF50",
        background: "linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)"
      }
    },
    {
      id: 2,
      name: "Underground Arena",
      description: "Fight in the shadows where only the strongest survive",
      icon: "⚔️",
      unlocked: playerProgress.completedChapters.includes(1),
      completed: playerProgress.completedChapters.includes(2),
      levels: 8,
      difficulty: "Intermediate",
      theme: {
        primary: "#FF5722",
        background: "linear-gradient(135deg, #FF5722 0%, #FF9800 100%)"
      }
    },
    {
      id: 3,
      name: "Neon Nexus",
      description: "Battle in a cyber world of endless possibilities",
      icon: "🌐",
      unlocked: playerProgress.completedChapters.includes(2),
      completed: playerProgress.completedChapters.includes(3),
      levels: 12,
      difficulty: "Advanced",
      theme: {
        primary: "#E91E63",
        background: "linear-gradient(135deg, #E91E63 0%, #9C27B0 100%)"
      }
    },
    {
      id: 4,
      name: "Cosmic Battleground",
      description: "Face the ultimate challenge among the stars",
      icon: "🌟",
      unlocked: playerProgress.completedChapters.includes(3),
      completed: playerProgress.completedChapters.includes(4),
      levels: 15,
      difficulty: "Master",
      theme: {
        primary: "#3F51B5",
        background: "linear-gradient(135deg, #3F51B5 0%, #2196F3 100%)"
      }
    }
  ];

  const difficulties = [
    { 
      id: 'rookie', 
      name: 'Rookie', 
      icon: '🥉',
      description: 'Perfect for beginners learning the ropes',
      aiLevel: 2,
      xpMultiplier: 1.0
    },
    { 
      id: 'normal', 
      name: 'Warrior', 
      icon: '🥈',
      description: 'Balanced challenge for skilled pilots',
      aiLevel: 5,
      xpMultiplier: 1.5
    },
    { 
      id: 'hard', 
      name: 'Veteran', 
      icon: '🥇',
      description: 'Intense battles for experienced fighters',
      aiLevel: 7,
      xpMultiplier: 2.0
    },
    { 
      id: 'expert', 
      name: 'Legend', 
      icon: '💎',
      description: 'Ultimate test of skill and strategy',
      aiLevel: 10,
      xpMultiplier: 3.0
    }
  ];

  const selectedChapterData = campaignChapters.find(chapter => chapter.id === selectedChapter);

  // Create navigation items based on current view mode
  const getNavigationItems = () => {
    const items = [];
    
    // View mode toggles
    items.push('campaigns', 'difficulty');
    
    if (viewMode === 'campaigns') {
      // Add unlocked chapters
      campaignChapters.forEach(chapter => {
        if (chapter.unlocked) {
          items.push(`chapter-${chapter.id}`);
        }
      });
    } else {
      // Add difficulty options
      difficultyLevels.forEach(diff => {
        items.push(`difficulty-${diff.id}`);
      });
    }
    
    // Always add start and back buttons
    items.push('start-game', 'back-to-menu');
    
    return items;
  };

  // Gamepad navigation setup
  const {
    selectedIndex,
    isGamepadConnected,
    isSelected
  } = useGamepadNavigation(getNavigationItems(), {
    onSelect: (item) => {
      if (item === 'campaigns') {
        setViewMode('campaigns');
      } else if (item === 'difficulty') {
        setViewMode('difficulty');
      } else if (item.startsWith('chapter-')) {
        const chapterId = parseInt(item.replace('chapter-', ''));
        const chapter = campaignChapters.find(c => c.id === chapterId);
        if (chapter && chapter.unlocked) {
          setSelectedChapter(chapterId);
        }
      } else if (item.startsWith('difficulty-')) {
        const diffId = item.replace('difficulty-', '');
        setSelectedDifficulty(diffId);
      } else if (item === 'start-game') {
        handleStartGame();
      } else if (item === 'back-to-menu') {
        navigate('/');
      }
    },
    onBack: () => {
      navigate('/');
    },
    wrapAround: true,
    enabled: !isLoading
  });

  const handleStartGame = () => {
    setIsLoading(true);
    
    const gameConfig = {
      mode: 'singlePlayer',
      difficulty: selectedDifficulty,
      chapter: viewMode === 'campaigns' ? selectedChapterData : null
    };
    
    localStorage.setItem('gameConfig', JSON.stringify(gameConfig));
    
    setTimeout(() => {
      navigate('/game');
    }, 3000);
  };

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '2rem',
      background: `
        radial-gradient(circle at 20% 80%, ${currentTheme.colors.primary}20 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, ${currentTheme.colors.primary}15 0%, transparent 50%),
        linear-gradient(135deg, ${currentTheme.colors.background} 0%, ${currentTheme.colors.surface} 100%)
      `,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Floating Background Elements */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            width: `${6 + (i % 4) * 2}px`,
            height: `${6 + (i % 4) * 2}px`,
            background: currentTheme.colors.primary,
            borderRadius: '50%',
            left: `${5 + (i * 6)}%`,
            top: `${10 + (i % 5) * 15}%`,
            opacity: 0.4,
            boxShadow: `0 0 15px ${currentTheme.colors.primary}`,
            pointerEvents: 'none'
          }}
          animate={{
            y: [0, -25, 0],
            opacity: [0.2, 0.6, 0.2],
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{
            duration: 5 + (i * 0.3),
            repeat: Infinity,
            delay: i * 0.4,
            ease: 'easeInOut'
          }}
        />
      ))}

      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          textAlign: 'center',
          marginBottom: '3rem',
          position: 'relative',
          zIndex: 2
        }}
      >
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            rotate: [0, 8, -8, 0]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            fontSize: '5rem',
            marginBottom: '1.5rem',
            filter: `drop-shadow(0 0 25px ${currentTheme.colors.primary})`
          }}
        >
          🌟
        </motion.div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 6vw, 4rem)',
          fontWeight: '900',
          background: currentTheme.gradients.primary,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          marginBottom: '1rem',
          letterSpacing: '0.02em',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem'
        }}>
          Campaign Mode
          {isGamepadConnected && (
            <motion.span
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                fontSize: '2rem',
                filter: `drop-shadow(0 0 15px ${currentTheme.colors.primary})`
              }}
            >
              🎮
            </motion.span>
          )}
        </h1>

        <p style={{
          fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
          color: currentTheme.colors.textSecondary,
          maxWidth: '700px',
          margin: '0 auto 2rem',
          lineHeight: '1.6'
        }}>
          Embark on an epic journey through challenging worlds and prove your worth
        </p>

        {/* Player Progress Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '2rem',
            flexWrap: 'wrap',
            marginBottom: '2rem'
          }}
        >
          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            style={{
              background: `${currentTheme.colors.surface}90`,
              padding: '1rem 2rem',
              borderRadius: '30px',
              border: `3px solid ${currentTheme.colors.primary}40`,
              backdropFilter: 'blur(15px)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: `0 8px 25px ${currentTheme.colors.primary}20`
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>⭐</span>
            <div>
              <div style={{ color: currentTheme.colors.text, fontWeight: 'bold', fontSize: '1.1rem' }}>
                Level {playerProgress.currentLevel}
              </div>
              <div style={{ color: currentTheme.colors.textSecondary, fontSize: '0.9rem' }}>
                {playerProgress.experience} XP
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            style={{
              background: `${currentTheme.colors.surface}90`,
              padding: '1rem 2rem',
              borderRadius: '30px',
              border: `3px solid ${currentTheme.colors.primary}40`,
              backdropFilter: 'blur(15px)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: `0 8px 25px ${currentTheme.colors.primary}20`
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>🏆</span>
            <div>
              <div style={{ color: currentTheme.colors.text, fontWeight: 'bold', fontSize: '1.1rem' }}>
                {playerProgress.totalWins}W / {playerProgress.totalLosses}L
              </div>
              <div style={{ color: currentTheme.colors.textSecondary, fontSize: '0.9rem' }}>
                Win Rate: {Math.round((playerProgress.totalWins / (playerProgress.totalWins + playerProgress.totalLosses)) * 100)}%
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Mode Toggle */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          marginBottom: '3rem'
        }}>
          {[
            { id: 'campaigns', label: 'Campaign', icon: '🗺️' },
            { id: 'difficulty', label: 'Difficulty', icon: '⚙️' }
          ].map(mode => (
            <motion.button
              key={mode.id}
              whileHover={{ scale: 1.08, y: -3 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode(mode.id)}
              style={{
                background: viewMode === mode.id 
                  ? currentTheme.gradients.primary 
                  : `${currentTheme.colors.surface}80`,
                border: viewMode === mode.id 
                  ? 'none' 
                  : isSelected(getNavigationItems().indexOf(mode.id))
                    ? `3px solid ${currentTheme.colors.primary}`
                    : `3px solid ${currentTheme.colors.primary}30`,
                borderRadius: '18px',
                padding: '1rem 2rem',
                color: viewMode === mode.id ? '#fff' : currentTheme.colors.text,
                fontSize: '1rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                backdropFilter: 'blur(15px)',
                boxShadow: viewMode === mode.id 
                  ? `0 8px 25px ${currentTheme.colors.primary}40` 
                  : isSelected(getNavigationItems().indexOf(mode.id))
                    ? `0 0 20px ${currentTheme.colors.primary}60`
                    : '0 4px 15px rgba(0, 0, 0, 0.1)',
                transform: isSelected(getNavigationItems().indexOf(mode.id)) ? 'scale(1.05)' : 'scale(1)'
              }}
            >
              <span style={{ fontSize: '1.3rem' }}>{mode.icon}</span>
              {mode.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: '1400px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 2
      }}>
        <AnimatePresence mode="wait">
          {/* Campaign Selection */}
          {viewMode === 'campaigns' && (
            <motion.div
              key="campaigns"
              initial={{ opacity: 0, x: -60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 60 }}
              transition={{ duration: 0.6 }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '2rem',
                width: '100%',
                marginBottom: '3rem'
              }}
            >
              {campaignChapters.map((chapter, index) => (
                <motion.div
                  key={chapter.id}
                  initial={{ opacity: 0, y: 60 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: index * 0.15 }}
                  whileHover={chapter.unlocked ? { 
                    scale: 1.03,
                    y: -12,
                    boxShadow: `0 20px 40px ${chapter.theme.primary}30`
                  } : {}}
                  whileTap={chapter.unlocked ? { scale: 0.98 } : {}}
                  onClick={() => chapter.unlocked && setSelectedChapter(chapter.id)}
                  style={{
                    background: selectedChapter === chapter.id && chapter.unlocked
                      ? `linear-gradient(135deg, ${chapter.theme.primary}25 0%, ${currentTheme.colors.surface}95 100%)`
                      : chapter.unlocked
                      ? `${currentTheme.colors.surface}90`
                      : `${currentTheme.colors.surface}50`,
                    border: selectedChapter === chapter.id && chapter.unlocked
                      ? `4px solid ${chapter.theme.primary}`
                      : isSelected(getNavigationItems().indexOf(`chapter-${chapter.id}`))
                      ? `4px solid ${currentTheme.colors.primary}`
                      : chapter.unlocked
                      ? `3px solid ${currentTheme.colors.border}30`
                      : `2px solid ${currentTheme.colors.border}15`,
                    borderRadius: '25px',
                    padding: '2.5rem',
                    cursor: chapter.unlocked ? 'pointer' : 'not-allowed',
                    transition: 'all 0.4s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    backdropFilter: 'blur(20px)',
                    opacity: chapter.unlocked ? 1 : 0.6,
                    boxShadow: selectedChapter === chapter.id && chapter.unlocked
                      ? `0 15px 35px ${chapter.theme.primary}25`
                      : isSelected(getNavigationItems().indexOf(`chapter-${chapter.id}`))
                      ? `0 0 25px ${currentTheme.colors.primary}50`
                      : '0 8px 20px rgba(0, 0, 0, 0.15)',
                    transform: isSelected(getNavigationItems().indexOf(`chapter-${chapter.id}`)) ? 'scale(1.02) translateY(-8px)' : 'scale(1) translateY(0)'
                  }}
                >
                  {/* Background Gradient Overlay */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: chapter.theme.background,
                    opacity: selectedChapter === chapter.id && chapter.unlocked ? 0.15 : 0.08,
                    transition: 'opacity 0.4s ease'
                  }} />

                  {/* Status Indicators */}
                  {chapter.completed && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      style={{
                        position: 'absolute',
                        top: '1.5rem',
                        right: '1.5rem',
                        background: '#2ed573',
                        color: '#fff',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 15px rgba(46, 213, 115, 0.4)'
                      }}
                    >
                      ✓
                    </motion.div>
                  )}

                  {!chapter.unlocked && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      style={{
                        position: 'absolute',
                        top: '1.5rem',
                        right: '1.5rem',
                        background: currentTheme.colors.surface,
                        border: `3px solid ${currentTheme.colors.textSecondary}`,
                        borderRadius: '50%',
                        width: '45px',
                        height: '45px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.3rem'
                      }}
                    >
                      🔒
                    </motion.div>
                  )}

                  {selectedChapter === chapter.id && chapter.unlocked && !chapter.completed && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      style={{
                        position: 'absolute',
                        top: '1.5rem',
                        right: '1.5rem',
                        background: chapter.theme.primary,
                        color: '#fff',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        boxShadow: `0 4px 15px ${chapter.theme.primary}40`
                      }}
                    >
                      ⚡
                    </motion.div>
                  )}

                  <motion.div
                    animate={selectedChapter === chapter.id && chapter.unlocked ? {
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    } : {}}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                    style={{
                      fontSize: '4rem',
                      marginBottom: '1.5rem',
                      position: 'relative',
                      zIndex: 2,
                      filter: selectedChapter === chapter.id && chapter.unlocked 
                        ? `drop-shadow(0 0 20px ${chapter.theme.primary})` 
                        : 'none'
                    }}
                  >
                    {chapter.icon}
                  </motion.div>

                  <h3 style={{
                    fontSize: '1.6rem',
                    fontWeight: 'bold',
                    color: selectedChapter === chapter.id && chapter.unlocked 
                      ? chapter.theme.primary 
                      : currentTheme.colors.text,
                    marginBottom: '0.75rem',
                    position: 'relative',
                    zIndex: 2
                  }}>
                    {chapter.name}
                  </h3>

                  <p style={{
                    fontSize: '1rem',
                    color: currentTheme.colors.textSecondary,
                    lineHeight: '1.6',
                    marginBottom: '2rem',
                    position: 'relative',
                    zIndex: 2
                  }}>
                    {chapter.description}
                  </p>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    position: 'relative',
                    zIndex: 2
                  }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}>
                      <span style={{
                        fontSize: '0.9rem',
                        color: currentTheme.colors.textSecondary,
                        fontWeight: '600'
                      }}>
                        📊 {chapter.levels} Levels
                      </span>
                      <span style={{
                        fontSize: '0.9rem',
                        color: chapter.theme.primary,
                        fontWeight: 'bold'
                      }}>
                        🎯 {chapter.difficulty}
                      </span>
                    </div>

                    {chapter.unlocked && (
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        style={{
                          background: chapter.theme.background,
                          borderRadius: '12px',
                          padding: '0.5rem 1rem',
                          color: '#fff',
                          fontSize: '0.85rem',
                          fontWeight: 'bold',
                          textAlign: 'center'
                        }}
                      >
                        {selectedChapter === chapter.id ? 'SELECTED' : 'SELECT'}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Difficulty Selection Mode */}
          {viewMode === 'difficulty' && (
            <motion.div
              key="difficulty"
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.6 }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '2rem',
                width: '100%',
                marginBottom: '3rem'
              }}
            >
              {difficulties.map((diff, index) => (
                <motion.div
                  key={diff.id}
                  initial={{ opacity: 0, y: 60 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: index * 0.12 }}
                  whileHover={{ 
                    scale: 1.05,
                    y: -10,
                    boxShadow: `0 15px 35px ${currentTheme.colors.primary}25`
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedDifficulty(diff.id)}
                  style={{
                    background: selectedDifficulty === diff.id
                      ? `linear-gradient(135deg, ${currentTheme.colors.primary}20 0%, ${currentTheme.colors.surface}95 100%)`
                      : `${currentTheme.colors.surface}90`,
                    border: selectedDifficulty === diff.id
                      ? `4px solid ${currentTheme.colors.primary}`
                      : isSelected(getNavigationItems().indexOf(`difficulty-${diff.id}`))
                      ? `4px solid ${currentTheme.colors.primary}`
                      : `3px solid ${currentTheme.colors.border}30`,
                    borderRadius: '20px',
                    padding: '2.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.4s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    backdropFilter: 'blur(15px)',
                    boxShadow: selectedDifficulty === diff.id
                      ? `0 12px 30px ${currentTheme.colors.primary}20`
                      : isSelected(getNavigationItems().indexOf(`difficulty-${diff.id}`))
                      ? `0 0 25px ${currentTheme.colors.primary}40`
                      : '0 6px 20px rgba(0, 0, 0, 0.1)',
                    transform: isSelected(getNavigationItems().indexOf(`difficulty-${diff.id}`)) ? 'scale(1.02) translateY(-5px)' : 'scale(1) translateY(0)'
                  }}
                >
                  <motion.div
                    animate={selectedDifficulty === diff.id ? {
                      scale: [1, 1.15, 1],
                      rotate: [0, 10, -10, 0]
                    } : {}}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                    style={{
                      fontSize: '3.5rem',
                      marginBottom: '1.5rem',
                      position: 'relative',
                      zIndex: 2,
                      filter: selectedDifficulty === diff.id 
                        ? `drop-shadow(0 0 15px ${currentTheme.colors.primary})` 
                        : 'none'
                    }}
                  >
                    {diff.icon}
                  </motion.div>

                  <h3 style={{
                    fontSize: '1.8rem',
                    fontWeight: 'bold',
                    color: selectedDifficulty === diff.id 
                      ? currentTheme.colors.primary 
                      : currentTheme.colors.text,
                    marginBottom: '1rem',
                    position: 'relative',
                    zIndex: 2
                  }}>
                    {diff.name}
                  </h3>

                  <p style={{
                    fontSize: '1rem',
                    color: currentTheme.colors.textSecondary,
                    lineHeight: '1.6',
                    marginBottom: '2rem',
                    position: 'relative',
                    zIndex: 2
                  }}>
                    {diff.description}
                  </p>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem',
                    position: 'relative',
                    zIndex: 2
                  }}>
                    <span style={{
                      fontSize: '0.9rem',
                      color: currentTheme.colors.textSecondary,
                      fontWeight: '600'
                    }}>
                      AI Level: {diff.aiLevel}
                    </span>
                    <span style={{
                      background: `${currentTheme.colors.primary}20`,
                      color: currentTheme.colors.primary,
                      padding: '0.4rem 0.8rem',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: 'bold'
                    }}>
                      {diff.xpMultiplier}x XP
                    </span>
                  </div>

                  {selectedDifficulty === diff.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{
                        background: currentTheme.gradients.primary,
                        color: '#fff',
                        padding: '0.8rem',
                        borderRadius: '15px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '0.95rem',
                        position: 'relative',
                        zIndex: 2,
                        boxShadow: `0 6px 20px ${currentTheme.colors.primary}30`
                      }}
                    >
                      SELECTED
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          style={{
            display: 'flex',
            gap: '2rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginTop: '2rem'
          }}
        >
          <motion.button
            whileHover={{ 
              scale: 1.08, 
              y: -5,
              boxShadow: `0 15px 35px ${currentTheme.colors.primary}40`
            }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartGame}
            disabled={!selectedDifficulty || (viewMode === 'campaigns' && !selectedChapter)}
            style={{
              background: selectedDifficulty && (viewMode !== 'campaigns' || selectedChapter)
                ? currentTheme.gradients.primary
                : `${currentTheme.colors.surface}60`,
              border: isSelected(getNavigationItems().indexOf('start-game'))
                ? `3px solid ${currentTheme.colors.primary}`
                : 'none',
              borderRadius: '20px',
              padding: '1.2rem 3rem',
              color: selectedDifficulty && (viewMode !== 'campaigns' || selectedChapter) 
                ? '#fff' 
                : currentTheme.colors.textSecondary,
              fontSize: '1.2rem',
              fontWeight: 'bold',
              cursor: selectedDifficulty && (viewMode !== 'campaigns' || selectedChapter) 
                ? 'pointer' 
                : 'not-allowed',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.8rem',
              opacity: selectedDifficulty && (viewMode !== 'campaigns' || selectedChapter) ? 1 : 0.5,
              boxShadow: selectedDifficulty && (viewMode !== 'campaigns' || selectedChapter)
                ? isSelected(getNavigationItems().indexOf('start-game'))
                  ? `0 0 25px ${currentTheme.colors.primary}60`
                  : `0 8px 25px ${currentTheme.colors.primary}30`
                : '0 4px 15px rgba(0, 0, 0, 0.1)',
              transform: isSelected(getNavigationItems().indexOf('start-game')) ? 'scale(1.05) translateY(-3px)' : 'scale(1) translateY(0)'
            }}
          >
            <span style={{ fontSize: '1.4rem' }}>🚀</span>
            {isLoading ? 'Preparing Battle...' : 'Start Campaign'}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, y: -3 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            style={{
              background: 'transparent',
              border: isSelected(getNavigationItems().indexOf('back-to-menu'))
                ? `3px solid ${currentTheme.colors.primary}`
                : `3px solid ${currentTheme.colors.primary}40`,
              borderRadius: '18px',
              padding: '1.2rem 2.5rem',
              color: currentTheme.colors.text,
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              backdropFilter: 'blur(10px)',
              boxShadow: isSelected(getNavigationItems().indexOf('back-to-menu'))
                ? `0 0 20px ${currentTheme.colors.primary}50`
                : '0 4px 15px rgba(0, 0, 0, 0.1)',
              transform: isSelected(getNavigationItems().indexOf('back-to-menu')) ? 'scale(1.05) translateY(-3px)' : 'scale(1) translateY(0)'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>🏠</span>
            Back to Menu
          </motion.button>
        </motion.div>
      </div>

      {/* Enhanced Loading Screen */}
      <AnimatePresence>
        {isLoading && (
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
              background: `
                radial-gradient(circle at 30% 70%, ${selectedChapterData?.theme?.primary || currentTheme.colors.primary}40 0%, transparent 50%),
                radial-gradient(circle at 70% 30%, ${selectedChapterData?.theme?.primary || currentTheme.colors.primary}30 0%, transparent 50%),
                linear-gradient(135deg, ${currentTheme.colors.background}95 0%, ${currentTheme.colors.surface}95 100%)
              `,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              backdropFilter: 'blur(25px)'
            }}
          >
            {/* Animated Particles */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                style={{
                  position: 'absolute',
                  width: `${4 + (i % 3) * 2}px`,
                  height: `${4 + (i % 3) * 2}px`,
                  background: selectedChapterData?.theme?.primary || currentTheme.colors.primary,
                  borderRadius: '50%',
                  left: `${10 + (i * 4)}%`,
                  top: `${15 + (i % 4) * 20}%`,
                  boxShadow: `0 0 20px ${selectedChapterData?.theme?.primary || currentTheme.colors.primary}`
                }}
                animate={{
                  y: [0, -40, 0],
                  opacity: [0.3, 0.8, 0.3],
                  scale: [0.8, 1.4, 0.8]
                }}
                transition={{
                  duration: 3 + (i * 0.2),
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: 'easeInOut'
                }}
              />
            ))}

            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                rotate: [0, 360]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              style={{
                fontSize: '6rem',
                marginBottom: '2rem',
                filter: `drop-shadow(0 0 30px ${selectedChapterData?.theme?.primary || currentTheme.colors.primary})`
              }}
            >
              {selectedChapterData?.icon || '⚔️'}
            </motion.div>

            <motion.h2
              animate={{
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                background: selectedChapterData?.theme?.background || currentTheme.gradients.primary,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                marginBottom: '1rem',
                textAlign: 'center'
              }}
            >
              {selectedChapterData ? selectedChapterData.name : 'Preparing Campaign'}
            </motion.h2>

            <p style={{
              fontSize: '1.3rem',
              color: currentTheme.colors.textSecondary,
              textAlign: 'center',
              maxWidth: '500px',
              lineHeight: '1.6',
              marginBottom: '3rem'
            }}>
              {selectedChapterData ? selectedChapterData.description : 'Initializing battle systems...'}
            </p>

            {/* Enhanced Loading Animation */}
            <div style={{
              display: 'flex',
              gap: '0.8rem',
              alignItems: 'center'
            }}>
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  style={{
                    width: '12px',
                    height: '12px',
                    background: selectedChapterData?.theme?.primary || currentTheme.colors.primary,
                    borderRadius: '50%',
                    boxShadow: `0 0 15px ${selectedChapterData?.theme?.primary || currentTheme.colors.primary}`
                  }}
                  animate={{
                    scale: [0.8, 1.5, 0.8],
                    opacity: [0.4, 1, 0.4]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: 'easeInOut'
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SinglePlayerPage;