import React from 'react';
import { useNavigate } from 'react-router-dom';
import CharacterSelect from '../components/CharacterSelect';

const CharacterSelectPage = () => {
  const navigate = useNavigate();

  const handleCharacterSelection = (selection) => {
    console.log('Character selection made:', selection);
    
    try {
      // Store the selection in sessionStorage for other components to access
      sessionStorage.setItem('selectedCharacters', JSON.stringify(selection));
      console.log('✅ Characters saved successfully');
      console.log('Navigating to versus screen...');
      
      // Navigate to versus screen
      navigate('/versus');
    } catch (error) {
      console.error('❌ Failed to save character selection:', error);
      // Still navigate, but show warning
      alert('Warning: Character data may not persist. Please try again if you encounter issues.');
      navigate('/versus');
    }
  };

  return (
    <CharacterSelect onSelect={handleCharacterSelection} />
  );
};

export default CharacterSelectPage;