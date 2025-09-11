import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Theme definitions
const themes = {
  dark: {
    name: 'Dark',
    colors: {
      primary: '#4facfe',
      secondary: '#00f2fe',
      accent: '#ffd700',
      background: '#0a0a0a',
      surface: '#1a1a3a',
      surfaceSecondary: '#2a2a4a',
      text: '#ffffff',
      textSecondary: '#b0b0b0',
      success: '#2ed573',
      warning: '#ffa502',
      error: '#ff4757',
      info: '#3742fa',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      surface: 'linear-gradient(180deg, #1a1a3a 60%, #222 100%)',
      button: 'linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)',
    },
    shadows: {
      small: '0 2px 4px rgba(0,0,0,0.3)',
      medium: '0 4px 12px rgba(0,0,0,0.4)',
      large: '0 8px 24px rgba(0,0,0,0.5)',
      glow: '0 0 20px rgba(79, 172, 254, 0.3)',
    }
  },
  
  light: {
    name: 'Light',
    colors: {
      primary: '#3b82f6',
      secondary: '#06b6d4',
      accent: '#f59e0b',
      background: '#ffffff',
      surface: '#f8fafc',
      surfaceSecondary: '#e2e8f0',
      text: '#1e293b',
      textSecondary: '#64748b',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      secondary: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      surface: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
      button: 'linear-gradient(45deg, #3b82f6 0%, #06b6d4 100%)',
    },
    shadows: {
      small: '0 2px 4px rgba(0,0,0,0.1)',
      medium: '0 4px 12px rgba(0,0,0,0.15)',
      large: '0 8px 24px rgba(0,0,0,0.2)',
      glow: '0 0 20px rgba(59, 130, 246, 0.3)',
    }
  },
  
  neon: {
    name: 'Neon',
    colors: {
      primary: '#ff0080',
      secondary: '#00ff80',
      accent: '#ffff00',
      background: '#000010',
      surface: '#1a0040',
      surfaceSecondary: '#2a0060',
      text: '#ffffff',
      textSecondary: '#c0c0c0',
      success: '#00ff80',
      warning: '#ff8000',
      error: '#ff0040',
      info: '#0080ff',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #ff0080 0%, #ff8000 100%)',
      secondary: 'linear-gradient(135deg, #00ff80 0%, #0080ff 100%)',
      surface: 'linear-gradient(180deg, #1a0040 60%, #000010 100%)',
      button: 'linear-gradient(45deg, #ff0080 0%, #00ff80 100%)',
    },
    shadows: {
      small: '0 2px 4px rgba(255,0,128,0.3)',
      medium: '0 4px 12px rgba(255,0,128,0.4)',
      large: '0 8px 24px rgba(255,0,128,0.5)',
      glow: '0 0 20px rgba(255, 0, 128, 0.6)',
    }
  },
  
  retro: {
    name: 'Retro',
    colors: {
      primary: '#ff6b35',
      secondary: '#f7931e',
      accent: '#ffe135',
      background: '#2c1810',
      surface: '#4a2c20',
      surfaceSecondary: '#6b4030',
      text: '#fff8e1',
      textSecondary: '#d4c4a0',
      success: '#8bc34a',
      warning: '#ff9800',
      error: '#f44336',
      info: '#2196f3',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
      secondary: 'linear-gradient(135deg, #ffe135 0%, #ff6b35 100%)',
      surface: 'linear-gradient(180deg, #4a2c20 60%, #2c1810 100%)',
      button: 'linear-gradient(45deg, #ff6b35 0%, #ffe135 100%)',
    },
    shadows: {
      small: '0 2px 4px rgba(255,107,53,0.3)',
      medium: '0 4px 12px rgba(255,107,53,0.4)',
      large: '0 8px 24px rgba(255,107,53,0.5)',
      glow: '0 0 20px rgba(255, 107, 53, 0.4)',
    }
  }
};

// Initial state
const initialState = {
  currentTheme: 'dark',
  themes,
  animations: {
    enabled: true,
    reducedMotion: false,
    particleEffects: true,
    screenShake: true,
  },
  accessibility: {
    highContrast: false,
    largeFonts: false,
    colorBlindMode: 'none', // 'none', 'protanopia', 'deuteranopia', 'tritanopia'
  },
  performance: {
    quality: 'high', // 'low', 'medium', 'high', 'ultra'
    vsync: true,
    particleCount: 'high', // 'low', 'medium', 'high'
  }
};

// Action types
export const THEME_ACTIONS = {
  SET_THEME: 'SET_THEME',
  TOGGLE_ANIMATIONS: 'TOGGLE_ANIMATIONS',
  SET_REDUCED_MOTION: 'SET_REDUCED_MOTION',
  UPDATE_ACCESSIBILITY: 'UPDATE_ACCESSIBILITY',
  UPDATE_PERFORMANCE: 'UPDATE_PERFORMANCE',
  RESET_THEME: 'RESET_THEME',
};

// Reducer
function themeReducer(state, action) {
  switch (action.type) {
    case THEME_ACTIONS.SET_THEME:
      return {
        ...state,
        currentTheme: action.payload
      };
      
    case THEME_ACTIONS.TOGGLE_ANIMATIONS:
      return {
        ...state,
        animations: {
          ...state.animations,
          enabled: !state.animations.enabled
        }
      };
      
    case THEME_ACTIONS.SET_REDUCED_MOTION:
      return {
        ...state,
        animations: {
          ...state.animations,
          reducedMotion: action.payload
        }
      };
      
    case THEME_ACTIONS.UPDATE_ACCESSIBILITY:
      return {
        ...state,
        accessibility: {
          ...state.accessibility,
          ...action.payload
        }
      };
      
    case THEME_ACTIONS.UPDATE_PERFORMANCE:
      return {
        ...state,
        performance: {
          ...state.performance,
          ...action.payload
        }
      };
      
    case THEME_ACTIONS.RESET_THEME:
      return initialState;
      
    default:
      return state;
  }
}

// Context
const ThemeContext = createContext();

// Provider Component
export function ThemeProvider({ children }) {
  const [state, dispatch] = useReducer(themeReducer, initialState);
  
  // Get current theme object
  const currentTheme = themes[state.currentTheme];
  
  // Load saved theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('nebula-wars-theme');
    if (savedTheme) {
      try {
        const parsedTheme = JSON.parse(savedTheme);
        dispatch({ type: THEME_ACTIONS.SET_THEME, payload: parsedTheme.currentTheme });
        if (parsedTheme.accessibility) {
          dispatch({ type: THEME_ACTIONS.UPDATE_ACCESSIBILITY, payload: parsedTheme.accessibility });
        }
        if (parsedTheme.performance) {
          dispatch({ type: THEME_ACTIONS.UPDATE_PERFORMANCE, payload: parsedTheme.performance });
        }
        if (parsedTheme.animations) {
          dispatch({ type: THEME_ACTIONS.SET_REDUCED_MOTION, payload: parsedTheme.animations.reducedMotion });
        }
      } catch (error) {
        console.error('Failed to load saved theme:', error);
      }
    }
    
    // Check for system preference for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      dispatch({ type: THEME_ACTIONS.SET_REDUCED_MOTION, payload: true });
    }
  }, []);
  
  // Apply theme to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const theme = currentTheme;
    
    // Set CSS custom properties
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    
    Object.entries(theme.gradients).forEach(([key, value]) => {
      root.style.setProperty(`--gradient-${key}`, value);
    });
    
    Object.entries(theme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value);
    });
    
    // Apply accessibility settings
    if (state.accessibility.highContrast) {
      root.style.setProperty('--contrast-multiplier', '1.5');
    } else {
      root.style.setProperty('--contrast-multiplier', '1');
    }
    
    if (state.accessibility.largeFonts) {
      root.style.setProperty('--font-scale', '1.2');
    } else {
      root.style.setProperty('--font-scale', '1');
    }
    
    // Save theme settings
    const themeData = {
      currentTheme: state.currentTheme,
      accessibility: state.accessibility,
      performance: state.performance,
      animations: state.animations
    };
    localStorage.setItem('nebula-wars-theme', JSON.stringify(themeData));
  }, [currentTheme, state.accessibility, state.performance, state.animations]);
  
  // Theme actions
  const themeActions = {
    setTheme: (themeName) => {
      if (themes[themeName]) {
        dispatch({ type: THEME_ACTIONS.SET_THEME, payload: themeName });
      }
    },
    
    toggleAnimations: () => {
      dispatch({ type: THEME_ACTIONS.TOGGLE_ANIMATIONS });
    },
    
    setReducedMotion: (enabled) => {
      dispatch({ type: THEME_ACTIONS.SET_REDUCED_MOTION, payload: enabled });
    },
    
    updateAccessibility: (settings) => {
      dispatch({ type: THEME_ACTIONS.UPDATE_ACCESSIBILITY, payload: settings });
    },
    
    updatePerformance: (settings) => {
      dispatch({ type: THEME_ACTIONS.UPDATE_PERFORMANCE, payload: settings });
    },
    
    resetTheme: () => {
      dispatch({ type: THEME_ACTIONS.RESET_THEME });
    },
    
    // Utility functions
    getColor: (colorName) => currentTheme.colors[colorName],
    getGradient: (gradientName) => currentTheme.gradients[gradientName],
    getShadow: (shadowName) => currentTheme.shadows[shadowName],
  };
  
  const value = {
    state,
    currentTheme,
    themes,
    dispatch,
    ...themeActions
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom Hook
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Utility function to create themed styles
export function createThemedStyles(theme) {
  return {
    container: {
      backgroundColor: theme.colors.background,
      color: theme.colors.text,
    },
    card: {
      background: theme.gradients.surface,
      boxShadow: theme.shadows.medium,
      border: `1px solid ${theme.colors.surfaceSecondary}`,
    },
    button: {
      primary: {
        background: theme.gradients.button,
        color: theme.colors.text,
        boxShadow: theme.shadows.glow,
      },
      secondary: {
        backgroundColor: theme.colors.surfaceSecondary,
        color: theme.colors.text,
        border: `1px solid ${theme.colors.primary}`,
      }
    }
  };
}

export default ThemeContext;