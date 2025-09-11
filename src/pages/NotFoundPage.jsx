import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const NotFoundPage = () => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{
          maxWidth: '600px'
        }}
      >
        {/* 404 Animation */}
        <motion.div
          animate={{
            y: [0, -10, 0],
            rotate: [0, 2, -2, 0]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            fontSize: 'clamp(4rem, 15vw, 8rem)',
            fontWeight: 'bold',
            background: currentTheme.gradients.primary,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            marginBottom: '1rem',
            lineHeight: 1
          }}
        >
          404
        </motion.div>

        {/* Robot Icon */}
        <motion.div
          animate={{
            rotate: [0, 10, -10, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            fontSize: '4rem',
            marginBottom: '2rem'
          }}
        >
          🤖💥
        </motion.div>

        {/* Error Message */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: currentTheme.colors.text,
            marginBottom: '1rem'
          }}
        >
          Sector Not Found
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          style={{
            fontSize: '1.1rem',
            color: currentTheme.colors.textSecondary,
            marginBottom: '2rem',
            lineHeight: 1.6
          }}
        >
          The coordinates you're looking for seem to have drifted into the void. 
          Our navigation systems can't locate this sector of the nebula.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            style={{
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              background: currentTheme.gradients.primary,
              color: currentTheme.colors.background,
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: currentTheme.shadows.medium,
              transition: 'all 0.3s ease'
            }}
          >
            🏠 Return to Base
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/character-select')}
            style={{
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              background: 'transparent',
              color: currentTheme.colors.primary,
              border: `2px solid ${currentTheme.colors.primary}`,
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            ⚔️ Quick Battle
          </motion.button>
        </motion.div>

        {/* Fun Error Codes */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          style={{
            marginTop: '3rem',
            padding: '1.5rem',
            background: `${currentTheme.colors.surface}80`,
            borderRadius: '12px',
            border: `1px solid ${currentTheme.colors.primary}30`
          }}
        >
          <p style={{
            color: currentTheme.colors.textSecondary,
            fontSize: '0.9rem',
            fontFamily: 'monospace',
            margin: 0
          }}>
            ERROR_CODE: NEBULA_NAVIGATION_FAILURE <br />
            SYSTEM_STATUS: OPERATIONAL <br />
            SUGGESTION: RECALIBRATE_COORDINATES <br />
            TIME_TO_RECOVERY: IMMEDIATE_WITH_BUTTON_PRESS
          </p>
        </motion.div>

        {/* Easter Egg */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          style={{
            marginTop: '2rem'
          }}
        >
          <motion.p
            animate={{
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              color: currentTheme.colors.textSecondary,
              fontSize: '0.8rem',
              fontStyle: 'italic'
            }}
          >
            "In the vastness of space, even the best navigation systems can get lost..." 
            - Ancient Robot Proverb
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;