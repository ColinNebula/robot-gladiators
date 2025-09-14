import { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../context/GameContext';

// Custom hook for gamepad/controller input
export function useGamepad() {
  const [gamepad, setGamepad] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [buttonState, setButtonState] = useState({});
  const [axes, setAxes] = useState([]);
  const intervalRef = useRef();

  // Detect gamepad type
  const detectGamepadType = useCallback((gamepad) => {
    const id = gamepad.id.toLowerCase();
    if (id.includes('dualsense') || id.includes('ps5') || id.includes('054c')) {
      return 'PS5';
    } else if (id.includes('xbox') || id.includes('xinput') || id.includes('045e')) {
      return 'Xbox';
    } else if (id.includes('nintendo') || id.includes('switch') || id.includes('057e')) {
      return 'Nintendo';
    }
    return 'Generic';
  }, []);

  // Poll gamepad state
  const pollGamepad = useCallback(() => {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const connectedGamepad = gamepads[0];
    
    if (connectedGamepad) {
      setGamepad(connectedGamepad);
      setIsConnected(true);
      
      // Update button states
      const newButtonState = {};
      connectedGamepad.buttons.forEach((button, index) => {
        newButtonState[index] = {
          pressed: button.pressed,
          value: button.value
        };
      });
      setButtonState(newButtonState);
      
      // Update axes
      setAxes([...connectedGamepad.axes]);
    } else {
      setIsConnected(false);
      setGamepad(null);
    }
  }, []);

  useEffect(() => {
    // Start polling
    intervalRef.current = setInterval(pollGamepad, 16); // ~60 FPS
    
    // Event listeners for gamepad connection
    const handleGamepadConnected = (e) => {
      console.log('Gamepad connected:', e.gamepad.id);
      setIsConnected(true);
    };
    
    const handleGamepadDisconnected = (e) => {
      console.log('Gamepad disconnected:', e.gamepad.id);
      setIsConnected(false);
      setGamepad(null);
    };
    
    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);
    
    return () => {
      clearInterval(intervalRef.current);
      window.removeEventListener('gamepadconnected', handleGamepadConnected);
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);
    };
  }, [pollGamepad]);

  return {
    gamepad,
    isConnected,
    buttonState,
    axes,
    gamepadType: gamepad ? detectGamepadType(gamepad) : null,
    getButtonPressed: (buttonIndex) => buttonState[buttonIndex]?.pressed || false
  };
}

// Custom hook for keyboard input
export function useKeyboard() {
  const [pressedKeys, setPressedKeys] = useState(new Set());
  const [keyEvents, setKeyEvents] = useState([]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      setPressedKeys(prev => new Set([...prev, e.code]));
      setKeyEvents(prev => [...prev.slice(-9), { type: 'keydown', code: e.code, timestamp: Date.now() }]);
    };

    const handleKeyUp = (e) => {
      setPressedKeys(prev => {
        const next = new Set(prev);
        next.delete(e.code);
        return next;
      });
      setKeyEvents(prev => [...prev.slice(-9), { type: 'keyup', code: e.code, timestamp: Date.now() }]);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const isPressed = useCallback((key) => pressedKeys.has(key), [pressedKeys]);
  
  const isCombo = useCallback((keys) => {
    return keys.every(key => pressedKeys.has(key));
  }, [pressedKeys]);

  return {
    pressedKeys,
    keyEvents,
    isPressed,
    isCombo
  };
}

// Custom hook for audio management
export function useAudio() {
  const [audioContext, setAudioContext] = useState(null);
  const [sounds, setSounds] = useState({});
  const [music, setMusic] = useState(null);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const { state } = useGame();

  useEffect(() => {
    // Initialize Web Audio API
    const context = new (window.AudioContext || window.webkitAudioContext)();
    setAudioContext(context);

    return () => {
      context.close();
    };
  }, []);

  const loadSound = useCallback(async (name, url) => {
    if (!audioContext) return;

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      setSounds(prev => ({
        ...prev,
        [name]: audioBuffer
      }));
    } catch (error) {
      console.error(`Failed to load sound ${name}:`, error);
    }
  }, [audioContext]);

  const playSound = useCallback((name, options = {}) => {
    if (!audioContext || !sounds[name] || !state.settings.soundEnabled || muted) return;

    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    
    source.buffer = sounds[name];
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    gainNode.gain.value = (options.volume || 1) * volume;
    source.playbackRate.value = options.playbackRate || 1;
    
    source.start(0);
    
    return source;
  }, [audioContext, sounds, volume, muted, state.settings.soundEnabled]);

  const playMusic = useCallback((url, loop = true) => {
    if (!state.settings.musicEnabled || muted) return;

    if (music) {
      music.pause();
    }

    const audio = new Audio(url);
    audio.loop = loop;
    audio.volume = volume * 0.5; // Music should be quieter than SFX
    audio.play().catch(console.error);
    
    setMusic(audio);
  }, [music, volume, muted, state.settings.musicEnabled]);

  const stopMusic = useCallback(() => {
    if (music) {
      music.pause();
      music.currentTime = 0;
    }
  }, [music]);

  const toggleMute = useCallback(() => {
    setMuted(prev => !prev);
  }, []);

  return {
    loadSound,
    playSound,
    playMusic,
    stopMusic,
    setVolume,
    toggleMute,
    volume,
    muted,
    isSupported: !!audioContext
  };
}

// Custom hook for local storage with serialization
export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  const setStoredValue = useCallback((newValue) => {
    try {
      setValue(newValue);
      window.localStorage.setItem(key, JSON.stringify(newValue));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  const removeValue = useCallback(() => {
    try {
      setValue(defaultValue);
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, defaultValue]);

  return [value, setStoredValue, removeValue];
}

// Custom hook for performance monitoring
export function usePerformance() {
  const [fps, setFps] = useState(60);
  const [frameTime, setFrameTime] = useState(0);
  const [memory, setMemory] = useState(null);
  const frameRef = useRef();
  const lastTimeRef = useRef(performance.now());
  const frameCountRef = useRef(0);

  useEffect(() => {
    let animationFrame;

    const measurePerformance = () => {
      const now = performance.now();
      const delta = now - lastTimeRef.current;
      
      frameCountRef.current++;
      
      if (frameCountRef.current % 60 === 0) { // Update every 60 frames
        setFps(Math.round(1000 / delta));
        setFrameTime(delta);
        
        // Memory usage (if available)
        if (performance.memory) {
          setMemory({
            used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
            total: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
            limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) // MB
          });
        }
      }
      
      lastTimeRef.current = now;
      animationFrame = requestAnimationFrame(measurePerformance);
    };

    animationFrame = requestAnimationFrame(measurePerformance);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  return {
    fps,
    frameTime,
    memory,
    isPerformanceGood: fps >= 55 && frameTime <= 20
  };
}

// Custom hook for responsive design
export function useResponsive() {
  const [screenSize, setScreenSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  
  const [device, setDevice] = useState('desktop');
  const [orientation, setOrientation] = useState('landscape');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({ width, height });
      
      // Determine device type
      if (width < 768) {
        setDevice('mobile');
      } else if (width < 1024) {
        setDevice('tablet');
      } else {
        setDevice('desktop');
      }
      
      // Determine orientation
      setOrientation(width > height ? 'landscape' : 'portrait');
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    screenSize,
    device,
    orientation,
    isMobile: device === 'mobile',
    isTablet: device === 'tablet',
    isDesktop: device === 'desktop',
    isLandscape: orientation === 'landscape',
    isPortrait: orientation === 'portrait'
  };
}

// Custom hook for animation state
export function useAnimation() {
  const [isAnimating, setIsAnimating] = useState(false);
  const [queue, setQueue] = useState([]);
  const timeoutRef = useRef();

  const startAnimation = useCallback((duration = 1000) => {
    setIsAnimating(true);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
    }, duration);
  }, []);

  const queueAnimation = useCallback((animation, delay = 0) => {
    setQueue(prev => [...prev, { animation, delay, id: Date.now() }]);
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isAnimating,
    queue,
    startAnimation,
    queueAnimation,
    clearQueue
  };
}