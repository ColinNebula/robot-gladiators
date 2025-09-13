import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const SplashScreen = ({ onContinue }) => {
  const [showStartButton, setShowStartButton] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const navigate = useNavigate();

  useEffect(() => {
    // Show the start button after animation completes
    const buttonTimer = setTimeout(() => setShowStartButton(true), 2000);
    
    // Start countdown after 2 seconds
    const countdownStart = setTimeout(() => {
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            return 0; // This will trigger the navigation effect
          }
          return prev - 1;
        });
      }, 1000);
      
      // Store interval ID for cleanup
      window.splashCountdownInterval = countdownInterval;
    }, 2000);
    
    return () => {
      clearTimeout(buttonTimer);
      clearTimeout(countdownStart);
      if (window.splashCountdownInterval) {
        clearInterval(window.splashCountdownInterval);
      }
    };
  }, []);

  // Separate effect to handle navigation when countdown reaches 0
  useEffect(() => {
    if (countdown === 0) {
      const navigationTimer = setTimeout(() => {
        navigate('/');
        if (onContinue) onContinue();
      }, 100);
      
      return () => clearTimeout(navigationTimer);
    }
  }, [countdown, navigate, onContinue]);

  const handleStartGame = () => {
    navigate('/');
    if (onContinue) onContinue();
  };

  return (
    <motion.div 
      className="splash-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        overflow: 'hidden'
      }}
    >
      {/* Full screen mech4 background image */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: 'url(/assets/images/mech4.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        filter: 'brightness(0.4) contrast(1.2)',
        animation: 'subtle-zoom 20s ease-in-out infinite alternate'
      }} />

      {/* Dark overlay for better text readability */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, rgba(12, 12, 30, 0.7) 0%, rgba(26, 26, 58, 0.5) 50%, rgba(45, 45, 90, 0.7) 100%)',
        zIndex: 1
      }} />

      {/* Enhanced animated background effects */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        background: `
          radial-gradient(ellipse at 20% 20%, rgba(79, 172, 254, 0.2) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 80%, rgba(0, 242, 254, 0.2) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 10%, rgba(79, 172, 254, 0.1) 0%, transparent 60%)
        `,
        animation: 'fullscreen-glow 8s ease-in-out infinite alternate',
        zIndex: 2
      }} />

      {/* Content overlay - centered on full screen mech background */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        maxWidth: '1200px',
        padding: '2rem',
        zIndex: 3,
        textAlign: 'center'
      }}>
        <motion.h1 
          className="splash-title"
          initial={{ y: -50, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 1, type: "spring", stiffness: 100 }}
          style={{
            fontSize: 'clamp(4rem, 12vw, 8rem)',
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #4facfe, #00f2fe, #ffffff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '1.5rem',
            textShadow: '0 0 40px rgba(79, 172, 254, 0.8)',
            lineHeight: '1.1',
            letterSpacing: '0.05em',
            filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.3))'
          }}
        >
          Nebula Wars
        </motion.h1>

        <motion.p 
          className="splash-subtitle"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          style={{
            fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
            color: '#ffffff',
            marginBottom: '2rem',
            textShadow: '0 0 20px rgba(255, 255, 255, 0.5), 0 0 40px rgba(79, 172, 254, 0.6)',
            lineHeight: '1.4',
            fontWeight: '300',
            letterSpacing: '0.02em'
          }}
        >
          A Space Robot Battle Adventure
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.4rem)',
            color: '#e0e0ff',
            marginBottom: '3rem',
            textShadow: '0 0 15px rgba(224, 224, 255, 0.4)',
            lineHeight: '1.6',
            maxWidth: '600px'
          }}
        >
          • Epic mech battles in space<br/>
          • Advanced combat systems<br/>
          • Stunning visual effects<br/>
          • Controller support included
        </motion.div>

        {showStartButton && (
          <motion.button 
            className="btn splash-btn"
            onClick={handleStartGame}
            initial={{ opacity: 0, y: 30, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{ 
              scale: 1.05,
              boxShadow: '0 0 40px rgba(79, 172, 254, 1), 0 0 80px rgba(0, 242, 254, 0.6)'
            }}
            whileTap={{ scale: 0.95 }}
            transition={{ delay: 1.4, duration: 0.6, type: "spring", stiffness: 120 }}
            style={{
              fontSize: 'clamp(1.2rem, 3vw, 1.8rem)',
              padding: '20px 60px',
              background: 'linear-gradient(45deg, #4facfe, #00f2fe)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '15px',
              color: '#fff',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 0 30px rgba(79, 172, 254, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.2)',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)',
              textShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
            }}
          >
            Start Game
          </motion.button>
        )}

        {/* Auto-navigation indicator with countdown */}
        {showStartButton && countdown > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            style={{
              position: 'absolute',
              bottom: '2rem',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 'clamp(0.8rem, 2vw, 1rem)',
              color: 'rgba(255, 255, 255, 0.7)',
              textAlign: 'center',
              textShadow: '0 0 10px rgba(255, 255, 255, 0.3)'
            }}
          >
            Auto-loading in <motion.span
              key={countdown}
              initial={{ scale: 1.5, color: '#00f2fe' }}
              animate={{ scale: 1, color: '#4facfe' }}
              transition={{ duration: 0.3 }}
              style={{ fontWeight: 'bold', fontSize: '1.2em' }}
            >{countdown}</motion.span> second{countdown !== 1 ? 's' : ''}...
            <br />
            <span style={{ fontSize: '0.8em', opacity: 0.6 }}>
              Click "Start Game" to continue immediately
            </span>
          </motion.div>
        )}
      </div>

      <style>{`
        @keyframes subtle-zoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.05); }
        }
        
        @keyframes fullscreen-glow {
          0% { 
            opacity: 0.8;
            transform: translateX(-10px) translateY(-10px); 
          }
          100% { 
            opacity: 1;
            transform: translateX(10px) translateY(10px); 
          }
        }
        
        @keyframes glow-pulse {
          0% { filter: drop-shadow(0 0 40px rgba(79, 172, 254, 0.8)); }
          100% { filter: drop-shadow(0 0 60px rgba(0, 242, 254, 1.0)); }
        }
        
        @media (max-width: 768px) {
          .splash-content {
            padding: 1rem !important;
          }
          
          .splash-title {
            font-size: clamp(2.5rem, 10vw, 4rem) !important;
          }
          
          .splash-subtitle {
            font-size: clamp(1rem, 4vw, 1.5rem) !important;
          }
        }
        
        @media (min-width: 1600px) {
          .splash-content {
            max-width: 1400px !important;
            padding: 4rem !important;
          }
        }
        
        /* Fallback for browsers that don't support background-clip */
        @supports not (-webkit-background-clip: text) {
          .splash-title {
            color: #4facfe !important;
            background: none !important;
            -webkit-background-clip: initial !important;
            -webkit-text-fill-color: initial !important;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default SplashScreen;
