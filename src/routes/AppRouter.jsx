import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import LoadingSpinner from '../components/LoadingSpinner';

// Lazy load pages for better performance
const HomePage = lazy(() => import('../pages/HomePage'));
const PlayPage = lazy(() => import('../pages/PlayPage'));
const CharacterSelectPage = lazy(() => import('../pages/CharacterSelectPage'));
const VersusScreenPage = lazy(() => import('../pages/VersusScreenPage'));
const SideScrollerPage = lazy(() => import('../pages/SideScrollerPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const LeaderboardPage = lazy(() => import('../pages/LeaderboardPage'));
const AboutPage = lazy(() => import('../pages/AboutPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

// Page transition animations
const pageVariants = {
  initial: { opacity: 0, x: -20 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: 20 }
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.3
};

// Wrapper component for page animations
const AnimatedRoute = ({ children }) => (
  <motion.div
    initial="initial"
    animate="in"
    exit="out"
    variants={pageVariants}
    transition={pageTransition}
    style={{ width: '100%', minHeight: '80vh' }}
  >
    {children}
  </motion.div>
);

// Route definitions
export const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomePage,
    exact: true,
    showInNav: true,
    icon: '🏠'
  },
  {
    path: '/play',
    name: 'Play',
    component: PlayPage,
    showInNav: true,
    icon: '�'
  },
  {
    path: '/character-select',
    name: 'Character Select',
    component: CharacterSelectPage,
    showInNav: false
  },
  {
    path: '/versus',
    name: 'Versus Screen',
    component: VersusScreenPage,
    showInNav: false
  },
  {
    path: '/battle',
    name: 'Battle',
    component: SideScrollerPage,
    showInNav: false
  },
  {
    path: '/settings',
    name: 'Settings',
    component: SettingsPage,
    showInNav: true,
    icon: '⚙️'
  },
  {
    path: '/leaderboard',
    name: 'Leaderboard',
    component: LeaderboardPage,
    showInNav: true,
    icon: '🏆'
  },
  {
    path: '/about',
    name: 'About',
    component: AboutPage,
    showInNav: true,
    icon: 'ℹ️'
  }
];

// Main router component
export default function AppRouter() {
  return (
    <Suspense 
      fallback={
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh'
        }}>
          <LoadingSpinner size="large" />
        </div>
      }
    >
      <Routes>
        {routes.map(({ path, component: Component, exact }) => (
          <Route
            key={path}
            path={path}
            element={
              <AnimatedRoute>
                <Component />
              </AnimatedRoute>
            }
            exact={exact}
          />
        ))}
        
        {/* 404 Not Found */}
        <Route 
          path="*" 
          element={
            <AnimatedRoute>
              <NotFoundPage />
            </AnimatedRoute>
          } 
        />
      </Routes>
    </Suspense>
  );
}