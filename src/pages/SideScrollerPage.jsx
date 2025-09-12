import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SideScroller from '../components/SideScroller';

const SideScrollerPage = () => {
  const navigate = useNavigate();
  const [characters, setCharacters] = useState(null);

  useEffect(() => {
    // Get selected characters from sessionStorage
    const selectedCharacters = sessionStorage.getItem('selectedCharacters');
    if (selectedCharacters) {
      setCharacters(JSON.parse(selectedCharacters));
    } else {
      // If no characters selected, redirect to character select
      navigate('/character-select');
    }
  }, [navigate]);

  const handleGameEnd = (result) => {
    // Handle game end (win/lose)
    console.log('Game ended with result:', result);
    
    // Navigate back to home or show results
    navigate('/', { 
      state: { 
        gameResult: result,
        characters: characters 
      }
    });
  };

  const handleBackToMenu = () => {
    // Navigate back to main menu
    console.log('handleBackToMenu called - navigating to home');
    navigate('/');
  };

  if (!characters) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontSize: '1.2rem',
        color: '#fff'
      }}>
        Loading game...
      </div>
    );
  }

  return (
    <SideScroller 
      character={characters}
      onBackToMenu={handleBackToMenu}
    />
  );
};

export default SideScrollerPage;