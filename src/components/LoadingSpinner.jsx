import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const LoadingSpinner = ({ size = 'medium', message = 'Loading...' }) => {
  const { currentTheme } = useTheme();
  
  const sizes = {
    small: 24,
    medium: 48,
    large: 72
  };
  
  const spinnerSize = sizes[size];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '200px',
      gap: '1rem'
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          width: spinnerSize,
          height: spinnerSize,
          border: `3px solid ${currentTheme.colors.surfaceSecondary}`,
          borderTop: `3px solid ${currentTheme.colors.primary}`,
          borderRadius: '50%'
        }}
      />
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          color: currentTheme.colors.textSecondary,
          fontSize: '1rem',
          margin: 0
        }}
      >
        {message}
      </motion.p>
    </div>
  );
};

export default LoadingSpinner;