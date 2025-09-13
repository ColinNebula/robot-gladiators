import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for gamepad menu navigation
 * Supports PS4/PS5 DualShock and Xbox controllers
 * 
 * @param {Array} menuItems - Array of menu items (strings or objects with id)
 * @param {Object} options - Configuration options
 * @param {Function} options.onSelect - Callback when A/X button is pressed
 * @param {Function} options.onBack - Callback when B/Circle button is pressed
 * @param {Function} options.onStart - Callback when Start button is pressed
 * @param {boolean} options.enabled - Whether gamepad navigation is enabled
 * @param {boolean} options.wrapAround - Whether to wrap around at list edges
 * @param {number} options.initialIndex - Initial selected index
 * @returns {Object} Navigation state and controls
 */
const useGamepadNavigation = (menuItems, options = {}) => {
  const {
    onSelect,
    onBack,
    onStart,
    enabled = true,
    wrapAround = true,
    initialIndex = 0,
    hapticFeedback = true
  } = options;

  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const [isGamepadConnected, setIsGamepadConnected] = useState(false);
  const [connectedGamepads, setConnectedGamepads] = useState([]);
  const lastPressTimeRef = useRef({});
  const animationFrameRef = useRef();

  // Gamepad button mappings for different controller types
  const BUTTON_MAPPINGS = {
    // Standard Gamepad API mappings
    SELECT: 0,     // A (Xbox) / X (PlayStation)
    BACK: 1,       // B (Xbox) / Circle (PlayStation)
    SPECIAL: 2,    // X (Xbox) / Square (PlayStation)
    MENU: 3,       // Y (Xbox) / Triangle (PlayStation)
    L1: 4,         // LB (Xbox) / L1 (PlayStation)
    R1: 5,         // RB (Xbox) / R1 (PlayStation)
    L2: 6,         // LT (Xbox) / L2 (PlayStation)
    R2: 7,         // RT (Xbox) / R2 (PlayStation)
    SELECT_BTN: 8, // Back/View (Xbox) / Share (PlayStation)
    START: 9,      // Menu/Start (Xbox) / Options (PlayStation)
    L3: 10,        // Left stick press
    R3: 11,        // Right stick press
    DPAD_UP: 12,
    DPAD_DOWN: 13,
    DPAD_LEFT: 14,
    DPAD_RIGHT: 15,
    HOME: 16       // Xbox/PlayStation button
  };

  // Input debouncing to prevent rapid repeated inputs
  const DEBOUNCE_TIME = 200; // milliseconds

  const isButtonPressed = useCallback((button, threshold = 0.5) => {
    if (!button) return false;
    return typeof button === 'object' ? button.pressed || button.value > threshold : button > threshold;
  }, []);

  const shouldProcessInput = useCallback((buttonName) => {
    const now = Date.now();
    const lastTime = lastPressTimeRef.current[buttonName] || 0;
    if (now - lastTime < DEBOUNCE_TIME) {
      return false;
    }
    lastPressTimeRef.current[buttonName] = now;
    return true;
  }, []);

  // Haptic feedback for supported controllers
  const triggerHapticFeedback = useCallback((type = 'light') => {
    if (!hapticFeedback) return;

    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
      const gamepad = gamepads[i];
      if (gamepad && gamepad.hapticActuators && gamepad.hapticActuators.length > 0) {
        const intensity = type === 'light' ? 0.1 : type === 'medium' ? 0.3 : 0.5;
        const duration = type === 'light' ? 50 : type === 'medium' ? 100 : 150;
        
        try {
          gamepad.hapticActuators[0].pulse(intensity, duration);
        } catch (error) {
          // Haptic feedback not supported, ignore silently
        }
      }
    }
  }, [hapticFeedback]);

  // Navigation functions
  const navigateUp = useCallback(() => {
    if (!enabled || menuItems.length === 0) return;
    
    setSelectedIndex(prevIndex => {
      const newIndex = prevIndex > 0 ? prevIndex - 1 : (wrapAround ? menuItems.length - 1 : 0);
      if (newIndex !== prevIndex) {
        triggerHapticFeedback('light');
      }
      return newIndex;
    });
  }, [enabled, menuItems.length, wrapAround, triggerHapticFeedback]);

  const navigateDown = useCallback(() => {
    if (!enabled || menuItems.length === 0) return;
    
    setSelectedIndex(prevIndex => {
      const newIndex = prevIndex < menuItems.length - 1 ? prevIndex + 1 : (wrapAround ? 0 : menuItems.length - 1);
      if (newIndex !== prevIndex) {
        triggerHapticFeedback('light');
      }
      return newIndex;
    });
  }, [enabled, menuItems.length, wrapAround, triggerHapticFeedback]);

  const navigateLeft = useCallback(() => {
    if (!enabled || menuItems.length === 0) return;
    
    setSelectedIndex(prevIndex => {
      const newIndex = prevIndex > 0 ? prevIndex - 1 : (wrapAround ? menuItems.length - 1 : 0);
      if (newIndex !== prevIndex) {
        triggerHapticFeedback('light');
      }
      return newIndex;
    });
  }, [enabled, menuItems.length, wrapAround, triggerHapticFeedback]);

  const navigateRight = useCallback(() => {
    if (!enabled || menuItems.length === 0) return;
    
    setSelectedIndex(prevIndex => {
      const newIndex = prevIndex < menuItems.length - 1 ? prevIndex + 1 : (wrapAround ? 0 : menuItems.length - 1);
      if (newIndex !== prevIndex) {
        triggerHapticFeedback('light');
      }
      return newIndex;
    });
  }, [enabled, menuItems.length, wrapAround, triggerHapticFeedback]);

  const handleSelect = useCallback(() => {
    if (!enabled) return;
    
    triggerHapticFeedback('medium');
    if (onSelect) {
      const selectedItem = menuItems[selectedIndex];
      onSelect(selectedItem, selectedIndex);
    }
  }, [enabled, onSelect, menuItems, selectedIndex, triggerHapticFeedback]);

  const handleBack = useCallback(() => {
    if (!enabled) return;
    
    triggerHapticFeedback('light');
    if (onBack) {
      onBack();
    }
  }, [enabled, onBack, triggerHapticFeedback]);

  const handleStart = useCallback(() => {
    if (!enabled) return;
    
    triggerHapticFeedback('medium');
    if (onStart) {
      onStart();
    }
  }, [enabled, onStart, triggerHapticFeedback]);

  // Gamepad polling and input handling
  const pollGamepad = useCallback(() => {
    if (!enabled) {
      animationFrameRef.current = requestAnimationFrame(pollGamepad);
      return;
    }

    const gamepads = navigator.getGamepads();
    const connectedPads = [];

    for (let i = 0; i < gamepads.length; i++) {
      const gamepad = gamepads[i];
      if (gamepad) {
        connectedPads.push({
          index: i,
          id: gamepad.id,
          connected: gamepad.connected
        });

        const buttons = gamepad.buttons;
        const axes = gamepad.axes;

        // D-Pad navigation
        if (isButtonPressed(buttons[BUTTON_MAPPINGS.DPAD_UP]) && shouldProcessInput('dpad_up')) {
          navigateUp();
        }
        if (isButtonPressed(buttons[BUTTON_MAPPINGS.DPAD_DOWN]) && shouldProcessInput('dpad_down')) {
          navigateDown();
        }
        if (isButtonPressed(buttons[BUTTON_MAPPINGS.DPAD_LEFT]) && shouldProcessInput('dpad_left')) {
          navigateLeft();
        }
        if (isButtonPressed(buttons[BUTTON_MAPPINGS.DPAD_RIGHT]) && shouldProcessInput('dpad_right')) {
          navigateRight();
        }

        // Left analog stick navigation (with deadzone)
        const STICK_DEADZONE = 0.3;
        if (axes[1] < -STICK_DEADZONE && shouldProcessInput('stick_up')) {
          navigateUp();
        }
        if (axes[1] > STICK_DEADZONE && shouldProcessInput('stick_down')) {
          navigateDown();
        }
        if (axes[0] < -STICK_DEADZONE && shouldProcessInput('stick_left')) {
          navigateLeft();
        }
        if (axes[0] > STICK_DEADZONE && shouldProcessInput('stick_right')) {
          navigateRight();
        }

        // Action buttons
        if (isButtonPressed(buttons[BUTTON_MAPPINGS.SELECT]) && shouldProcessInput('select')) {
          handleSelect();
        }
        if (isButtonPressed(buttons[BUTTON_MAPPINGS.BACK]) && shouldProcessInput('back')) {
          handleBack();
        }
        if (isButtonPressed(buttons[BUTTON_MAPPINGS.START]) && shouldProcessInput('start')) {
          handleStart();
        }
      }
    }

    setConnectedGamepads(connectedPads);
    setIsGamepadConnected(connectedPads.length > 0);

    animationFrameRef.current = requestAnimationFrame(pollGamepad);
  }, [enabled, navigateUp, navigateDown, navigateLeft, navigateRight, handleSelect, handleBack, handleStart, isButtonPressed, shouldProcessInput]);

  // Gamepad connection events
  useEffect(() => {
    const handleGamepadConnected = (e) => {
      console.log('🎮 Gamepad connected:', e.gamepad.id);
      triggerHapticFeedback('medium');
    };

    const handleGamepadDisconnected = (e) => {
      console.log('🎮 Gamepad disconnected:', e.gamepad.id);
    };

    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);

    return () => {
      window.removeEventListener('gamepadconnected', handleGamepadConnected);
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);
    };
  }, [triggerHapticFeedback]);

  // Start/stop gamepad polling
  useEffect(() => {
    if (enabled) {
      animationFrameRef.current = requestAnimationFrame(pollGamepad);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enabled, pollGamepad]);

  // Update selected index when menu items change
  useEffect(() => {
    if (selectedIndex >= menuItems.length && menuItems.length > 0) {
      setSelectedIndex(Math.min(selectedIndex, menuItems.length - 1));
    }
  }, [menuItems.length, selectedIndex]);

  // Public API
  return {
    selectedIndex,
    setSelectedIndex,
    isGamepadConnected,
    connectedGamepads,
    selectedItem: menuItems[selectedIndex],
    
    // Manual navigation functions
    navigateUp,
    navigateDown,
    navigateLeft,
    navigateRight,
    handleSelect,
    handleBack,
    handleStart,
    
    // Utility functions
    isSelected: (index) => index === selectedIndex,
    getButtonMappings: () => BUTTON_MAPPINGS,
    
    // Haptic feedback
    triggerHapticFeedback,
    
    // Debug info
    debug: {
      lastPressTime: lastPressTimeRef.current,
      enabled,
      menuItemsLength: menuItems.length
    }
  };
};

export default useGamepadNavigation;