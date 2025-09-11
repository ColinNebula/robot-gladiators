import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VersusScreen from '../components/VersusScreen';

const VersusScreenPage = () => {
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

  const handleContinue = () => {
    console.log('handleContinue called, navigating to /battle');
    // Navigate to battle screen
    navigate('/battle');
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
        Loading characters...
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