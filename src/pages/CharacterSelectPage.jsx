import React from 'react';
import { useNavigate } from 'react-router-dom';
import CharacterSelect from '../components/CharacterSelect';

const CharacterSelectPage = () => {
  const navigate = useNavigate();

  const handleCharacterSelection = (selection) => {
    console.log('Character selection made:', selection);
    // Store the selection in sessionStorage for other components to access
    sessionStorage.setItem('selectedCharacters', JSON.stringify(selection));
    console.log('Navigating to versus screen...');
    
    // Navigate to versus screen
    navigate('/versus');
  };

  return (
    <CharacterSelect onSelect={handleCharacterSelection} />
  );
};

export default CharacterSelectPage;