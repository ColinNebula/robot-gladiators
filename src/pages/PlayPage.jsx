import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import LoadingSpinner from '../components/LoadingSpinner';

const PlayPage = () => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  useEffect(() => {
    // Redirect to character selection after a brief loading screen
    const timer = setTimeout(() => {
      navigate('/character-select');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '2rem',
      textAlign: 'center'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            fontSize: '4rem',
            marginBottom: '2rem'
          }}
        >
          ⚔️🤖
        </motion.div>

        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          background: currentTheme.gradients.primary,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          marginBottom: '1rem'
        }}>
          Preparing for Battle
        </h1>

        <p style={{
          fontSize: '1.2rem',
          color: currentTheme.colors.textSecondary,
          marginBottom: '2rem',
          maxWidth: '500px'
        }}>
          Initializing combat systems and loading the arena...
        </p>

        <LoadingSpinner size="large" />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          style={{
            marginTop: '2rem',
            padding: '1rem',
            background: `${currentTheme.colors.surface}80`,
            borderRadius: '12px',
            border: `1px solid ${currentTheme.colors.primary}30`
          }}
        >
          <p style={{
            color: currentTheme.colors.textSecondary,
            fontSize: '0.9rem',
            fontStyle: 'italic',
            margin: 0
          }}>
            "Every warrior's journey begins with a single choice..." <br />
            Redirecting to character selection...
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PlayPage;