/**
 * Enhanced Game Page
 * 
 * Page wrapper for the enhanced game component with ECS architecture.
 */

import React from 'react';
import EnhancedGame from '../components/EnhancedGame';

const EnhancedGamePage = () => {
  return (
    <div style={{
      width: '100%',
      height: '100vh',
      background: '#000',
      overflow: 'hidden'
    }}>
      <EnhancedGame />
    </div>
  );
};

export default EnhancedGamePage;