/**
 * Input System - Comprehensive Input Handling
 * 
 * Handles keyboard, mouse, gamepad input with mapping, binding,
 * and state management for responsive game controls.
 */

export class InputSystem {
  constructor(engine) {
    this.engine = engine;
    
    // Input state
    this.keyboard = {
      keys: new Set(),
      keysPressed: new Set(),
      keysReleased: new Set(),
      previousKeys: new Set()
    };
    
    this.mouse = {
      x: 0,
      y: 0,
      worldX: 0,
      worldY: 0,
      buttons: new Set(),
      buttonsPressed: new Set(),
      buttonsReleased: new Set(),
      previousButtons: new Set(),
      wheel: { deltaX: 0, deltaY: 0, deltaZ: 0 }
    };
    
    this.gamepads = new Map();
    this.gamepadConfig = {
      deadzone: 0.15,
      buttonRepeatDelay: 0.5,
      buttonRepeatRate: 0.1
    };
    
    // Input mapping
    this.inputMaps = new Map();
    this.actionStates = new Map();
    
    // Event listeners
    this.boundEventHandlers = new Map();
    
    console.log('🎮 Input System initialized');
  }

  initialize() {
    this.setupEventListeners();
    this.createDefaultInputMaps();
  }

  start() {
    this.startGamepadPolling();
  }

  stop() {
    this.removeEventListeners();
    this.stopGamepadPolling();
  }

  setupEventListeners() {
    const canvas = this.engine.getCanvas();
    
    // Keyboard events
    const keyDownHandler = (e) => this.handleKeyDown(e);
    const keyUpHandler = (e) => this.handleKeyUp(e);
    
    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);
    
    this.boundEventHandlers.set('keydown', keyDownHandler);
    this.boundEventHandlers.set('keyup', keyUpHandler);
    
    // Mouse events
    const mouseDownHandler = (e) => this.handleMouseDown(e);
    const mouseUpHandler = (e) => this.handleMouseUp(e);
    const mouseMoveHandler = (e) => this.handleMouseMove(e);
    const mouseWheelHandler = (e) => this.handleMouseWheel(e);
    
    canvas.addEventListener('mousedown', mouseDownHandler);
    canvas.addEventListener('mouseup', mouseUpHandler);
    canvas.addEventListener('mousemove', mouseMoveHandler);
    canvas.addEventListener('wheel', mouseWheelHandler);
    
    this.boundEventHandlers.set('mousedown', mouseDownHandler);
    this.boundEventHandlers.set('mouseup', mouseUpHandler);
    this.boundEventHandlers.set('mousemove', mouseMoveHandler);
    this.boundEventHandlers.set('wheel', mouseWheelHandler);
    
    // Prevent context menu on canvas
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  removeEventListeners() {
    const canvas = this.engine.getCanvas();
    
    // Remove keyboard events
    document.removeEventListener('keydown', this.boundEventHandlers.get('keydown'));
    document.removeEventListener('keyup', this.boundEventHandlers.get('keyup'));
    
    // Remove mouse events
    canvas.removeEventListener('mousedown', this.boundEventHandlers.get('mousedown'));
    canvas.removeEventListener('mouseup', this.boundEventHandlers.get('mouseup'));
    canvas.removeEventListener('mousemove', this.boundEventHandlers.get('mousemove'));
    canvas.removeEventListener('wheel', this.boundEventHandlers.get('wheel'));
    
    this.boundEventHandlers.clear();
  }

  createDefaultInputMaps() {
    // Default keyboard map
    this.createInputMap('default', {
      'move-left': ['ArrowLeft', 'a', 'A'],
      'move-right': ['ArrowRight', 'd', 'D'],
      'move-up': ['ArrowUp', 'w', 'W'],
      'move-down': ['ArrowDown', 's', 'S'],
      'jump': ['Space', 'z', 'Z'],
      'attack': ['x', 'X'],
      'special': ['c', 'C'],
      'pause': ['Escape', 'p', 'P'],
      'select': ['Enter'],
      'back': ['Escape', 'Backspace']
    });
    
    // Gamepad button mapping
    this.gamepadButtonMap = {
      0: 'attack',      // A/X button
      1: 'back',        // B/Circle button  
      2: 'jump',        // X/Square button
      3: 'special',     // Y/Triangle button
      8: 'select',      // Share/Back button
      9: 'pause',       // Options/Start button
      12: 'move-up',    // D-pad up
      13: 'move-down',  // D-pad down
      14: 'move-left',  // D-pad left
      15: 'move-right'  // D-pad right
    };
  }

  update(deltaTime) {
    this.updateKeyboardState();
    this.updateMouseState();
    this.updateGamepadState(deltaTime);
    this.updateActionStates();
  }

  updateKeyboardState() {
    // Update pressed/released states
    this.keyboard.keysPressed.clear();
    this.keyboard.keysReleased.clear();
    
    // Check for newly pressed keys
    this.keyboard.keys.forEach(key => {
      if (!this.keyboard.previousKeys.has(key)) {
        this.keyboard.keysPressed.add(key);
      }
    });
    
    // Check for newly released keys
    this.keyboard.previousKeys.forEach(key => {
      if (!this.keyboard.keys.has(key)) {
        this.keyboard.keysReleased.add(key);
      }
    });
    
    // Update previous state
    this.keyboard.previousKeys = new Set(this.keyboard.keys);
  }

  updateMouseState() {
    // Update pressed/released states
    this.mouse.buttonsPressed.clear();
    this.mouse.buttonsReleased.clear();
    
    // Check for newly pressed buttons
    this.mouse.buttons.forEach(button => {
      if (!this.mouse.previousButtons.has(button)) {
        this.mouse.buttonsPressed.add(button);
      }
    });
    
    // Check for newly released buttons
    this.mouse.previousButtons.forEach(button => {
      if (!this.mouse.buttons.has(button)) {
        this.mouse.buttonsReleased.add(button);
      }
    });
    
    // Update previous state
    this.mouse.previousButtons = new Set(this.mouse.buttons);
    
    // Clear wheel delta
    this.mouse.wheel = { deltaX: 0, deltaY: 0, deltaZ: 0 };
    
    // Update world coordinates based on camera
    this.updateMouseWorldCoordinates();
  }

  updateMouseWorldCoordinates() {
    const renderSystem = this.engine.getSystem('render');
    if (renderSystem) {
      const camera = renderSystem.getCamera();
      this.mouse.worldX = this.mouse.x + camera.x;
      this.mouse.worldY = this.mouse.y + camera.y;
    } else {
      this.mouse.worldX = this.mouse.x;
      this.mouse.worldY = this.mouse.y;
    }
  }

  updateGamepadState(deltaTime) {
    const gamepads = navigator.getGamepads();
    
    for (let i = 0; i < gamepads.length; i++) {
      const gamepad = gamepads[i];
      if (!gamepad) continue;
      
      if (!this.gamepads.has(i)) {
        this.initializeGamepad(i, gamepad);
      }
      
      this.updateGamepad(i, gamepad, deltaTime);
    }
  }

  initializeGamepad(index, gamepad) {
    const gamepadState = {
      id: gamepad.id,
      buttons: new Array(gamepad.buttons.length).fill(false),
      previousButtons: new Array(gamepad.buttons.length).fill(false),
      buttonTimers: new Array(gamepad.buttons.length).fill(0),
      axes: new Array(gamepad.axes.length).fill(0),
      leftStick: { x: 0, y: 0 },
      rightStick: { x: 0, y: 0 }
    };
    
    this.gamepads.set(index, gamepadState);
    console.log(`🎮 Gamepad ${index} connected: ${gamepad.id}`);
  }

  updateGamepad(index, gamepad, deltaTime) {
    const state = this.gamepads.get(index);
    if (!state) return;
    
    // Update button states
    for (let i = 0; i < gamepad.buttons.length; i++) {
      const button = gamepad.buttons[i];
      const pressed = typeof button === 'object' ? button.pressed : button > 0.5;
      
      state.previousButtons[i] = state.buttons[i];
      state.buttons[i] = pressed;
      
      // Update button timers for repeat
      if (pressed) {
        state.buttonTimers[i] += deltaTime;
      } else {
        state.buttonTimers[i] = 0;
      }
    }
    
    // Update axes with deadzone
    for (let i = 0; i < gamepad.axes.length; i++) {
      let value = gamepad.axes[i];
      if (Math.abs(value) < this.gamepadConfig.deadzone) {
        value = 0;
      }
      state.axes[i] = value;
    }
    
    // Update stick states
    if (state.axes.length >= 2) {
      state.leftStick.x = state.axes[0];
      state.leftStick.y = state.axes[1];
    }
    
    if (state.axes.length >= 4) {
      state.rightStick.x = state.axes[2];
      state.rightStick.y = state.axes[3];
    }
  }

  updateActionStates() {
    // Clear previous action states
    this.actionStates.clear();
    
    // Check all input maps
    this.inputMaps.forEach((map, mapName) => {
      Object.entries(map).forEach(([action, inputs]) => {
        const isActive = this.isActionActive(inputs);
        const wasPressed = this.wasActionPressed(inputs);
        const wasReleased = this.wasActionReleased(inputs);
        
        this.actionStates.set(action, {
          active: isActive,
          pressed: wasPressed,
          released: wasReleased
        });
      });
    });
  }

  isActionActive(inputs) {
    // Check keyboard inputs
    for (const input of inputs) {
      if (this.keyboard.keys.has(input)) {
        return true;
      }
    }
    
    // Check gamepad inputs
    for (const [gamepadIndex, gamepadState] of this.gamepads) {
      // Check buttons
      Object.entries(this.gamepadButtonMap).forEach(([buttonIndex, action]) => {
        if (inputs.includes(action) && gamepadState.buttons[parseInt(buttonIndex)]) {
          return true;
        }
      });
      
      // Check analog sticks for directional inputs
      if (inputs.includes('move-left') && gamepadState.leftStick.x < -0.5) return true;
      if (inputs.includes('move-right') && gamepadState.leftStick.x > 0.5) return true;
      if (inputs.includes('move-up') && gamepadState.leftStick.y < -0.5) return true;
      if (inputs.includes('move-down') && gamepadState.leftStick.y > 0.5) return true;
    }
    
    return false;
  }

  wasActionPressed(inputs) {
    // Check keyboard inputs
    for (const input of inputs) {
      if (this.keyboard.keysPressed.has(input)) {
        return true;
      }
    }
    
    // Check gamepad inputs
    for (const [gamepadIndex, gamepadState] of this.gamepads) {
      Object.entries(this.gamepadButtonMap).forEach(([buttonIndex, action]) => {
        const index = parseInt(buttonIndex);
        if (inputs.includes(action) && 
            gamepadState.buttons[index] && 
            !gamepadState.previousButtons[index]) {
          return true;
        }
      });
    }
    
    return false;
  }

  wasActionReleased(inputs) {
    // Check keyboard inputs
    for (const input of inputs) {
      if (this.keyboard.keysReleased.has(input)) {
        return true;
      }
    }
    
    // Check gamepad inputs
    for (const [gamepadIndex, gamepadState] of this.gamepads) {
      Object.entries(this.gamepadButtonMap).forEach(([buttonIndex, action]) => {
        const index = parseInt(buttonIndex);
        if (inputs.includes(action) && 
            !gamepadState.buttons[index] && 
            gamepadState.previousButtons[index]) {
          return true;
        }
      });
    }
    
    return false;
  }

  // Event handlers
  handleKeyDown(event) {
    this.keyboard.keys.add(event.code);
    this.engine.emit('input:keydown', { code: event.code, key: event.key });
  }

  handleKeyUp(event) {
    this.keyboard.keys.delete(event.code);
    this.engine.emit('input:keyup', { code: event.code, key: event.key });
  }

  handleMouseDown(event) {
    this.mouse.buttons.add(event.button);
    this.engine.emit('input:mousedown', { 
      button: event.button, 
      x: this.mouse.x, 
      y: this.mouse.y,
      worldX: this.mouse.worldX,
      worldY: this.mouse.worldY
    });
  }

  handleMouseUp(event) {
    this.mouse.buttons.delete(event.button);
    this.engine.emit('input:mouseup', { 
      button: event.button, 
      x: this.mouse.x, 
      y: this.mouse.y,
      worldX: this.mouse.worldX,
      worldY: this.mouse.worldY
    });
  }

  handleMouseMove(event) {
    const canvas = this.engine.getCanvas();
    const rect = canvas.getBoundingClientRect();
    
    this.mouse.x = (event.clientX - rect.left) * (canvas.width / rect.width);
    this.mouse.y = (event.clientY - rect.top) * (canvas.height / rect.height);
    
    this.engine.emit('input:mousemove', { 
      x: this.mouse.x, 
      y: this.mouse.y,
      worldX: this.mouse.worldX,
      worldY: this.mouse.worldY
    });
  }

  handleMouseWheel(event) {
    this.mouse.wheel.deltaX = event.deltaX;
    this.mouse.wheel.deltaY = event.deltaY;
    this.mouse.wheel.deltaZ = event.deltaZ;
    
    this.engine.emit('input:wheel', { 
      deltaX: event.deltaX, 
      deltaY: event.deltaY, 
      deltaZ: event.deltaZ 
    });
    
    event.preventDefault();
  }

  // Public API methods
  createInputMap(name, mappings) {
    this.inputMaps.set(name, mappings);
  }

  isActionActive(action) {
    const state = this.actionStates.get(action);
    return state ? state.active : false;
  }

  wasActionPressed(action) {
    const state = this.actionStates.get(action);
    return state ? state.pressed : false;
  }

  wasActionReleased(action) {
    const state = this.actionStates.get(action);
    return state ? state.released : false;
  }

  isKeyPressed(key) {
    return this.keyboard.keys.has(key);
  }

  wasKeyPressed(key) {
    return this.keyboard.keysPressed.has(key);
  }

  wasKeyReleased(key) {
    return this.keyboard.keysReleased.has(key);
  }

  isMouseButtonPressed(button) {
    return this.mouse.buttons.has(button);
  }

  getMousePosition() {
    return { x: this.mouse.x, y: this.mouse.y };
  }

  getMouseWorldPosition() {
    return { x: this.mouse.worldX, y: this.mouse.worldY };
  }

  getGamepadState(index) {
    return this.gamepads.get(index);
  }

  startGamepadPolling() {
    // Gamepad polling is handled in update loop
  }

  stopGamepadPolling() {
    this.gamepads.clear();
  }

  // Cleanup
  destroy() {
    this.removeEventListeners();
    this.stopGamepadPolling();
    this.inputMaps.clear();
    this.actionStates.clear();
  }
}

export default InputSystem;