import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VersusScreen from '../components/VersusScreen';

const VersusScreenPage = () => {
  const navigate = useNavigate();
  const [characters, setCharacters] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get selected characters from sessionStorage with faster processing
    const selectedCharacters = sessionStorage.getItem('selectedCharacters');
    if (selectedCharacters) {
      try {
        const parsed = JSON.parse(selectedCharacters);
        setCharacters(parsed);
        setIsLoading(false);
      } catch (error) {
        console.error('Error parsing character data:', error);
        navigate('/character-select');
      }
    } else {
      // If no characters selected, redirect to character select
      navigate('/character-select');
    }
  }, [navigate]);

  const handleContinue = () => {
    console.log('handleContinue called, navigating to /game');
    // Navigate to game screen immediately
    navigate('/game');
  };

  if (isLoading || !characters) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontSize: '1.2rem',
        color: '#fff',
        background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #16213e 100%)'
      }}>
        Loading battle setup...
      </div>
    );
  }

  return (
    <VersusScreen 
      character={characters}
      onContinue={handleContinue} 
    />
  );
};

export default VersusScreenPage;