import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AppRouter from './routes/AppRouter';
import Navigation from './components/Navigation';
import SplashScreen from './components/SplashScreen';
import { useGame } from './context/GameContext';
import { useTheme } from './context/ThemeContext';
import { usePerformance, useResponsive } from './hooks/useGameHooks';

function App() {
  const location = useLocation();
  const { state: gameState } = useGame();
  const { currentTheme } = useTheme();
  const { fps, isPerformanceGood } = usePerformance();
  const { isMobile } = useResponsive();
  const [showSplash, setShowSplash] = useState(true);

  // Pages where navigation should be hidden
  const hideNavOnPages = ['/battle', '/versus', '/character-select', '/game', '/test-game'];
  const showNavigation = !hideNavOnPages.includes(location.pathname);

  const handleSplashContinue = () => {
    setShowSplash(false);
  };

  // Show splash screen initially
  if (showSplash) {
    return <SplashScreen onContinue={handleSplashContinue} />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: currentTheme.colors.background,
      color: currentTheme.colors.text,
      fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Pattern */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.03,
        backgroundImage: `radial-gradient(circle at 25% 25%, ${currentTheme.colors.primary} 0%, transparent 50%), radial-gradient(circle at 75% 75%, ${currentTheme.colors.secondary} 0%, transparent 50%)`,
        backgroundSize: '400px 400px',
        animation: 'float 20s ease-in-out infinite',
        pointerEvents: 'none'
      }} />

      {/* Navigation */}
      <AnimatePresence>
        {showNavigation && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Navigation />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main style={{
        paddingTop: showNavigation ? '80px' : '0',
        minHeight: '100vh',
        position: 'relative',
        zIndex: 1
      }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <AppRouter />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Performance Monitor (Development) */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          bottom: '1rem',
          right: '1rem',
          background: 'rgba(0, 0, 0, 0.8)',
          color: '#fff',
          padding: '0.5rem',
          borderRadius: '4px',
          fontSize: '0.8rem',
          fontFamily: 'monospace',
          zIndex: 9999,
          pointerEvents: 'none'
        }}>
          <div style={{ 
            color: isPerformanceGood ? '#2ed573' : '#ff4757' 
          }}>
            FPS: {fps}
          </div>
          <div>Screen: {isMobile ? 'Mobile' : 'Desktop'}</div>
          <div>Game: {gameState.currentScreen}</div>
        </div>
      )}

      {/* Global Styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(180deg); }
        }
        
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          padding: 0;
          font-family: "Inter", "Segoe UI", "Roboto", sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        /* Scrollbar styles */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: ${currentTheme.colors.surface};
        }
        
        ::-webkit-scrollbar-thumb {
          background: ${currentTheme.colors.primary};
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: ${currentTheme.colors.secondary};
        }
        
        /* Focus styles */
        button:focus,
        input:focus,
        select:focus,
        textarea:focus {
          outline: 2px solid ${currentTheme.colors.primary};
          outline-offset: 2px;
        }
        
        /* Animation classes */
        .fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .slide-up {
          animation: slideUp 0.3s ease-out;
        }
        
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        /* Utility classes */
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        
        .flex { display: flex; }
        .flex-col { flex-direction: column; }
        .items-center { align-items: center; }
        .justify-center { justify-content: center; }
        .justify-between { justify-content: space-between; }
        
        .w-full { width: 100%; }
        .h-full { height: 100%; }
        .min-h-screen { min-height: 100vh; }
        
        .p-4 { padding: 1rem; }
        .m-4 { margin: 1rem; }
        .mt-4 { margin-top: 1rem; }
        .mb-4 { margin-bottom: 1rem; }
        
        /* Responsive */
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
        }
        
        @media (min-width: 769px) {
          .hide-desktop { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export default App;