import React, { Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import LoadingSpinner from '../components/LoadingSpinner';

// Lazy load components for better performance
const HomePage = lazy(() => import('../pages/HomePage'));
const CharacterSelectPage = lazy(() => import('../pages/CharacterSelectPage'));
const GameModeSelectionPage = lazy(() => import('../pages/GameModeSelectionPage'));
const SinglePlayerPage = lazy(() => import('../pages/SinglePlayerPage'));
const TwoPlayerPage = lazy(() => import('../pages/TwoPlayerPage'));
const VersusScreenPage = lazy(() => import('../pages/VersusScreenPage'));
const SideScrollerPage = lazy(() => import('../pages/SideScrollerPage'));
const EnhancedGamePage = lazy(() => import('../pages/EnhancedGamePage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const AboutPage = lazy(() => import('../pages/AboutPage'));
const LeaderboardPage = lazy(() => import('../pages/LeaderboardPage'));

// Route configurations
const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomePage,
    exact: true
  },
  {
    path: '/play',
    name: 'Play',
    component: GameModeSelectionPage
  },
  {
    path: '/single-player',
    name: 'Single Player',
    component: SinglePlayerPage
  },
  {
    path: '/two-player',
    name: 'Two Player',
    component: TwoPlayerPage
  },
  {
    path: '/character-select',
    name: 'Character Selection',
    component: CharacterSelectPage
  },
  {
    path: '/versus',
    name: 'Versus Screen',
    component: VersusScreenPage
  },
  {
    path: '/game',
    name: 'Game',
    component: SideScrollerPage
  },
  {
    path: '/test-game',
    name: 'Test Game',
    component: SideScrollerPage
  },
  {
    path: '/enhanced-game',
    name: 'Enhanced Game',
    component: EnhancedGamePage
  },
  {
    path: '/settings',
    name: 'Settings',
    component: SettingsPage
  },
  {
    path: '/about',
    name: 'About',
    component: AboutPage
  },
  {
    path: '/leaderboard',
    name: 'Leaderboard',
    component: LeaderboardPage
  }
];

// Animated Route wrapper
const AnimatedRoute = ({ children }) => {
  const pageVariants = {
    initial: {
      opacity: 0,
      x: -100,
      scale: 0.9
    },
    in: {
      opacity: 1,
      x: 0,
      scale: 1
    },
    out: {
      opacity: 0,
      x: 100,
      scale: 0.9
    }
  };

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.4
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      style={{ width: '100%', height: '100%' }}
    >
      {children}
    </motion.div>
  );
};

const AppRouter = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {routes.map((route) => {
          const Component = route.component;
          return (
            <Route
              key={route.path}
              path={route.path}
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <AnimatedRoute>
                    <Component />
                  </AnimatedRoute>
                </Suspense>
              }
            />
          );
        })}
      </Routes>
    </AnimatePresence>
  );
};

export default AppRouter;
export { routes };
