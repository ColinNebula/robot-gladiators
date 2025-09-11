import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { toast } from 'react-hot-toast';

// Game State Structure
const initialState = {
  // Game Session
  isGameActive: false,
  gameMode: 'single', // 'single', 'multiplayer', 'tournament'
  difficulty: 'medium', // 'easy', 'medium', 'hard', 'nightmare'
  
  // Players
  player1: null,
  player2: null,
  selectedCharacter: null,
  
  // Game Progress
  currentScreen: 'menu', // 'menu', 'character-select', 'versus', 'battle', 'results'
  round: 1,
  maxRounds: 3,
  scores: { player1: 0, player2: 0 },
  
  // Settings
  settings: {
    soundEnabled: true,
    musicEnabled: true,
    hapticFeedback: true,
    autoSave: true,
    graphicsQuality: 'high', // 'low', 'medium', 'high', 'ultra'
  },
  
  // Statistics
  stats: {
    gamesPlayed: 0,
    gamesWon: 0,
    totalDamageDealt: 0,
    totalCombos: 0,
    highestCombo: 0,
    favoriteCharacter: null,
    achievementsUnlocked: [],
  },
  
  // Tournament Mode
  tournament: {
    active: false,
    bracket: [],
    currentMatch: 0,
    participants: [],
  },
  
  // Online Features (for future expansion)
  online: {
    connected: false,
    lobby: null,
    matchmaking: false,
    rank: 'Bronze',
    points: 1000,
  }
};

// Action Types
export const GAME_ACTIONS = {
  // Game Flow
  START_GAME: 'START_GAME',
  END_GAME: 'END_GAME',
  PAUSE_GAME: 'PAUSE_GAME',
  RESUME_GAME: 'RESUME_GAME',
  CHANGE_SCREEN: 'CHANGE_SCREEN',
  
  // Player Management
  SET_PLAYER1: 'SET_PLAYER1',
  SET_PLAYER2: 'SET_PLAYER2',
  SET_SELECTED_CHARACTER: 'SET_SELECTED_CHARACTER',
  UPDATE_PLAYER_HEALTH: 'UPDATE_PLAYER_HEALTH',
  
  // Game Progress
  SET_GAME_MODE: 'SET_GAME_MODE',
  SET_DIFFICULTY: 'SET_DIFFICULTY',
  UPDATE_SCORES: 'UPDATE_SCORES',
  NEXT_ROUND: 'NEXT_ROUND',
  RESET_GAME: 'RESET_GAME',
  
  // Settings
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  TOGGLE_SOUND: 'TOGGLE_SOUND',
  TOGGLE_MUSIC: 'TOGGLE_MUSIC',
  TOGGLE_HAPTIC: 'TOGGLE_HAPTIC',
  
  // Statistics
  UPDATE_STATS: 'UPDATE_STATS',
  UNLOCK_ACHIEVEMENT: 'UNLOCK_ACHIEVEMENT',
  
  // Tournament
  START_TOURNAMENT: 'START_TOURNAMENT',
  END_TOURNAMENT: 'END_TOURNAMENT',
  ADVANCE_TOURNAMENT: 'ADVANCE_TOURNAMENT',
  
  // Load/Save
  LOAD_GAME_DATA: 'LOAD_GAME_DATA',
  SAVE_GAME_DATA: 'SAVE_GAME_DATA',
};

// Reducer
function gameReducer(state, action) {
  switch (action.type) {
    case GAME_ACTIONS.START_GAME:
      return {
        ...state,
        isGameActive: true,
        currentScreen: 'character-select',
        round: 1,
        scores: { player1: 0, player2: 0 }
      };
      
    case GAME_ACTIONS.END_GAME:
      return {
        ...state,
        isGameActive: false,
        currentScreen: 'results',
        stats: {
          ...state.stats,
          gamesPlayed: state.stats.gamesPlayed + 1,
          gamesWon: action.payload?.winner === 'player1' ? state.stats.gamesWon + 1 : state.stats.gamesWon
        }
      };
      
    case GAME_ACTIONS.CHANGE_SCREEN:
      return {
        ...state,
        currentScreen: action.payload
      };
      
    case GAME_ACTIONS.SET_PLAYER1:
      return {
        ...state,
        player1: action.payload
      };
      
    case GAME_ACTIONS.SET_PLAYER2:
      return {
        ...state,
        player2: action.payload
      };
      
    case GAME_ACTIONS.SET_SELECTED_CHARACTER:
      return {
        ...state,
        selectedCharacter: action.payload
      };
      
    case GAME_ACTIONS.SET_GAME_MODE:
      return {
        ...state,
        gameMode: action.payload
      };
      
    case GAME_ACTIONS.SET_DIFFICULTY:
      return {
        ...state,
        difficulty: action.payload
      };
      
    case GAME_ACTIONS.UPDATE_SCORES:
      return {
        ...state,
        scores: {
          ...state.scores,
          ...action.payload
        }
      };
      
    case GAME_ACTIONS.NEXT_ROUND:
      return {
        ...state,
        round: state.round + 1
      };
      
    case GAME_ACTIONS.UPDATE_SETTINGS:
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload
        }
      };
      
    case GAME_ACTIONS.TOGGLE_SOUND:
      return {
        ...state,
        settings: {
          ...state.settings,
          soundEnabled: !state.settings.soundEnabled
        }
      };
      
    case GAME_ACTIONS.UPDATE_STATS:
      return {
        ...state,
        stats: {
          ...state.stats,
          ...action.payload
        }
      };
      
    case GAME_ACTIONS.UNLOCK_ACHIEVEMENT:
      if (!state.stats.achievementsUnlocked.includes(action.payload)) {
        return {
          ...state,
          stats: {
            ...state.stats,
            achievementsUnlocked: [...state.stats.achievementsUnlocked, action.payload]
          }
        };
      }
      return state;
      
    case GAME_ACTIONS.START_TOURNAMENT:
      return {
        ...state,
        tournament: {
          active: true,
          bracket: action.payload.bracket,
          currentMatch: 0,
          participants: action.payload.participants
        },
        gameMode: 'tournament',
        currentScreen: 'tournament'
      };
      
    case GAME_ACTIONS.LOAD_GAME_DATA:
      return {
        ...state,
        ...action.payload
      };
      
    case GAME_ACTIONS.RESET_GAME:
      return {
        ...initialState,
        settings: state.settings, // Preserve settings
        stats: state.stats // Preserve stats
      };
      
    default:
      return state;
  }
}

// Context
const GameContext = createContext();

// Provider Component
export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  
  // Load saved data on mount
  useEffect(() => {
    const savedData = localStorage.getItem('nebula-wars-data');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        dispatch({ type: GAME_ACTIONS.LOAD_GAME_DATA, payload: parsedData });
        toast.success('Game data loaded!');
      } catch (error) {
        console.error('Failed to load saved data:', error);
        toast.error('Failed to load saved data');
      }
    }
  }, []);
  
  // Auto-save when settings change
  useEffect(() => {
    if (state.settings.autoSave) {
      const dataToSave = {
        settings: state.settings,
        stats: state.stats
      };
      localStorage.setItem('nebula-wars-data', JSON.stringify(dataToSave));
    }
  }, [state.settings, state.stats]);
  
  // Game Actions
  const gameActions = {
    startGame: (mode = 'single') => {
      dispatch({ type: GAME_ACTIONS.START_GAME });
      dispatch({ type: GAME_ACTIONS.SET_GAME_MODE, payload: mode });
      toast.success(`Started ${mode} player game!`);
    },
    
    endGame: (winner) => {
      dispatch({ type: GAME_ACTIONS.END_GAME, payload: { winner } });
      toast.success('Game completed!');
    },
    
    changeScreen: (screen) => {
      dispatch({ type: GAME_ACTIONS.CHANGE_SCREEN, payload: screen });
    },
    
    selectCharacter: (character) => {
      dispatch({ type: GAME_ACTIONS.SET_SELECTED_CHARACTER, payload: character });
      toast.success(`Selected ${character.player1?.name || character.name}!`);
    },
    
    setPlayers: (player1, player2) => {
      dispatch({ type: GAME_ACTIONS.SET_PLAYER1, payload: player1 });
      dispatch({ type: GAME_ACTIONS.SET_PLAYER2, payload: player2 });
    },
    
    updateScores: (scores) => {
      dispatch({ type: GAME_ACTIONS.UPDATE_SCORES, payload: scores });
    },
    
    nextRound: () => {
      dispatch({ type: GAME_ACTIONS.NEXT_ROUND });
      toast.success(`Round ${state.round + 1}!`);
    },
    
    updateSettings: (newSettings) => {
      dispatch({ type: GAME_ACTIONS.UPDATE_SETTINGS, payload: newSettings });
      toast.success('Settings updated!');
    },
    
    toggleSound: () => {
      dispatch({ type: GAME_ACTIONS.TOGGLE_SOUND });
      toast.success(`Sound ${!state.settings.soundEnabled ? 'enabled' : 'disabled'}`);
    },
    
    updateStats: (newStats) => {
      dispatch({ type: GAME_ACTIONS.UPDATE_STATS, payload: newStats });
    },
    
    unlockAchievement: (achievement) => {
      dispatch({ type: GAME_ACTIONS.UNLOCK_ACHIEVEMENT, payload: achievement });
      toast.success(`🏆 Achievement Unlocked: ${achievement}!`, { duration: 6000 });
    },
    
    startTournament: (participants) => {
      const bracket = generateTournamentBracket(participants);
      dispatch({ 
        type: GAME_ACTIONS.START_TOURNAMENT, 
        payload: { bracket, participants } 
      });
      toast.success('Tournament started!');
    },
    
    resetGame: () => {
      dispatch({ type: GAME_ACTIONS.RESET_GAME });
      toast.success('Game reset!');
    },
    
    saveGameData: () => {
      const dataToSave = {
        settings: state.settings,
        stats: state.stats,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('nebula-wars-data', JSON.stringify(dataToSave));
      toast.success('Game data saved!');
    }
  };
  
  const value = {
    state,
    dispatch,
    ...gameActions
  };
  
  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

// Custom Hook
export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

// Utility Functions
function generateTournamentBracket(participants) {
  const shuffled = [...participants].sort(() => Math.random() - 0.5);
  const bracket = [];
  
  for (let i = 0; i < shuffled.length; i += 2) {
    bracket.push({
      player1: shuffled[i],
      player2: shuffled[i + 1] || null, // Handle odd number of participants
      winner: null,
      round: 1
    });
  }
  
  return bracket;
}

export default GameContext;