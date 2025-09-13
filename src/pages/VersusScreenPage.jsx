import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VersusScreen from '../components/VersusScreen';

const VersusScreenPage = () => {
  const navigate = useNavigate();
  const [characters, setCharacters] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCharacters = () => {
      try {
        setIsLoading(true);
        // Get selected characters from sessionStorage with faster processing
        const selectedCharacters = sessionStorage.getItem('selectedCharacters');
        
        if (selectedCharacters) {
          const parsed = JSON.parse(selectedCharacters);
          setCharacters(parsed);
          console.log('✅ Characters loaded successfully:', parsed);
        } else {
          console.warn('⚠️ No character data found');
          navigate('/character-select');
        }
      } catch (error) {
        console.error('❌ Error loading character data:', error);
        navigate('/character-select');
      } finally {
        setIsLoading(false);
      }
    };

    loadCharacters();
  }, [navigate]);

  const handleContinue = () => {
    console.log('🎮 handleContinue called - Starting battle!');
    console.log('📍 Current location:', window.location.pathname);
    console.log('🎯 Navigating to: /game');
    console.log('📊 Characters data:', characters);
    
    // Validate character data before navigation
    if (!characters) {
      console.error('❌ No character data available for battle!');
      alert('Character data is missing. Please select characters again.');
      navigate('/character-select');
      return;
    }
    
    try {
      // Ensure character data is stored properly using sessionStorage
      sessionStorage.setItem('selectedCharacters', JSON.stringify(characters));
      console.log('💾 Character data stored successfully');
      
      // Navigate to game screen immediately
      navigate('/game');
      console.log('✅ Navigation to /game initiated successfully');
    } catch (error) {
      console.error('❌ Error during navigation:', error);
      console.error('❌ Error stack:', error.stack);
      alert(`Navigation error: ${error.message}`);
    }
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
        {isLoading ? 'Loading battle setup...' : 'Redirecting to character selection...'}
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