/**
 * Audio System - 3D Spatial Audio Engine
 * 
 * Handles all audio playback including sound effects, music, and spatial audio
 * with advanced features like volume control, looping, and audio pools.
 */

export class AudioSystem {
  constructor(engine) {
    this.engine = engine;
    
    // Audio context
    this.audioContext = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    
    // Audio state
    this.isInitialized = false;
    this.isMuted = false;
    this.masterVolume = 1.0;
    this.musicVolume = 0.7;
    this.sfxVolume = 0.8;
    
    // Audio pools for efficient sound management
    this.audioBuffers = new Map();
    this.audioSources = new Map();
    this.audioInstances = new Map();
    this.audioQueue = [];
    
    // Currently playing sounds
    this.activeSounds = new Set();
    this.backgroundMusic = null;
    
    // Spatial audio settings
    this.listenerPosition = { x: 0, y: 0, z: 0 };
    this.spatialAudioEnabled = true;
    
    console.log('🔊 Audio System initialized');
  }

  async initialize() {
    try {
      // Initialize Web Audio API
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create gain nodes for volume control
      this.masterGain = this.audioContext.createGain();
      this.musicGain = this.audioContext.createGain();
      this.sfxGain = this.audioContext.createGain();
      
      // Connect gain nodes
      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.audioContext.destination);
      
      // Set initial volumes
      this.updateVolumes();
      
      this.isInitialized = true;
      console.log('✅ Audio System Web Audio API initialized');
      
      // Preload common audio files
      this.preloadAudio();
      
    } catch (error) {
      console.warn('⚠️ Audio System failed to initialize Web Audio API:', error);
      this.fallbackToHTMLAudio();
    }
  }

  fallbackToHTMLAudio() {
    console.log('📻 Falling back to HTML Audio');
    this.isInitialized = true;
  }

  async preloadAudio() {
    const commonSounds = [
      '/assets/audio/jump.wav',
      '/assets/audio/attack.wav',
      '/assets/audio/hit.wav',
      '/assets/audio/powerup.wav',
      '/assets/audio/explosion.wav'
    ];

    const commonMusic = [
      '/assets/audio/menu-music.mp3',
      '/assets/audio/game-music.mp3',
      '/assets/audio/victory.mp3'
    ];

    // Load sound effects
    for (const soundPath of commonSounds) {
      await this.loadAudio(soundPath, 'sfx');
    }

    // Load music
    for (const musicPath of commonMusic) {
      await this.loadAudio(musicPath, 'music');
    }
  }

  start() {
    // Resume audio context if suspended
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  stop() {
    // Stop all active sounds
    this.stopAllSounds();
    
    // Suspend audio context
    if (this.audioContext && this.audioContext.state === 'running') {
      this.audioContext.suspend();
    }
  }

  update(deltaTime) {
    // Update spatial audio listener position
    this.updateListenerPosition();
    
    // Clean up finished audio instances
    this.cleanupFinishedAudio();
    
    // Process audio queue
    this.processAudioQueue();
  }

  updateListenerPosition() {
    if (!this.audioContext || !this.spatialAudioEnabled) return;
    
    // Update listener position based on camera or player position
    const renderSystem = this.engine.getSystem('render');
    if (renderSystem) {
      const camera = renderSystem.getCamera();
      this.listenerPosition.x = camera.x;
      this.listenerPosition.y = camera.y;
      
      // Update Web Audio API listener
      if (this.audioContext.listener.positionX) {
        this.audioContext.listener.positionX.value = this.listenerPosition.x;
        this.audioContext.listener.positionY.value = this.listenerPosition.y;
        this.audioContext.listener.positionZ.value = this.listenerPosition.z;
      } else {
        // Fallback for older browsers
        this.audioContext.listener.setPosition(
          this.listenerPosition.x,
          this.listenerPosition.y,
          this.listenerPosition.z
        );
      }
    }
  }

  cleanupFinishedAudio() {
    // Remove finished audio instances
    this.activeSounds.forEach(soundId => {
      const instance = this.audioInstances.get(soundId);
      if (instance && instance.hasEnded) {
        this.activeSounds.delete(soundId);
        this.audioInstances.delete(soundId);
      }
    });
  }

  processAudioQueue() {
    // Process queued audio requests
    while (this.audioQueue.length > 0) {
      const request = this.audioQueue.shift();
      this.playAudioInternal(request);
    }
  }

  // Audio loading
  async loadAudio(url, type = 'sfx') {
    if (this.audioBuffers.has(url)) {
      return this.audioBuffers.get(url);
    }

    try {
      if (this.audioContext) {
        // Load with Web Audio API
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        
        this.audioBuffers.set(url, {
          buffer: audioBuffer,
          type,
          url
        });
        
        console.log(`✅ Audio loaded: ${url}`);
        return this.audioBuffers.get(url);
        
      } else {
        // Load with HTML Audio
        const audio = new Audio(url);
        audio.preload = 'auto';
        
        return new Promise((resolve, reject) => {
          audio.addEventListener('canplaythrough', () => {
            this.audioBuffers.set(url, {
              element: audio,
              type,
              url
            });
            resolve(this.audioBuffers.get(url));
          });
          
          audio.addEventListener('error', reject);
        });
      }
      
    } catch (error) {
      console.warn(`⚠️ Failed to load audio: ${url}`, error);
      return null;
    }
  }

  // Audio playback
  playSound(url, options = {}) {
    const {
      volume = 1.0,
      loop = false,
      pitch = 1.0,
      position = null,
      fadeIn = 0,
      delay = 0
    } = options;

    // Queue the audio request
    this.audioQueue.push({
      url,
      type: 'sfx',
      volume,
      loop,
      pitch,
      position,
      fadeIn,
      delay
    });

    return this.generateAudioId();
  }

  playMusic(url, options = {}) {
    // Stop current background music
    if (this.backgroundMusic) {
      this.stopSound(this.backgroundMusic);
    }

    const {
      volume = this.musicVolume,
      loop = true,
      fadeIn = 1.0,
      crossfade = true
    } = options;

    this.backgroundMusic = this.playSound(url, {
      volume,
      loop,
      fadeIn: crossfade ? fadeIn : 0
    });

    return this.backgroundMusic;
  }

  playAudioInternal(request) {
    const { url, type, volume, loop, pitch, position, fadeIn, delay } = request;
    
    // Load audio if not already loaded
    if (!this.audioBuffers.has(url)) {
      this.loadAudio(url, type).then(() => {
        this.playAudioInternal(request);
      });
      return;
    }

    const audioData = this.audioBuffers.get(url);
    const audioId = this.generateAudioId();

    if (this.audioContext && audioData.buffer) {
      // Play with Web Audio API
      this.playWithWebAudio(audioId, audioData, request);
    } else if (audioData.element) {
      // Play with HTML Audio
      this.playWithHTMLAudio(audioId, audioData, request);
    }

    return audioId;
  }

  playWithWebAudio(audioId, audioData, request) {
    const { volume, loop, pitch, position, fadeIn } = request;
    
    // Create audio nodes
    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    let pannerNode = null;
    
    // Setup source
    source.buffer = audioData.buffer;
    source.loop = loop;
    source.playbackRate.value = pitch;
    
    // Setup gain
    const finalVolume = volume * (audioData.type === 'music' ? this.musicVolume : this.sfxVolume);
    gainNode.gain.value = fadeIn > 0 ? 0 : finalVolume;
    
    // Setup spatial audio
    if (position && this.spatialAudioEnabled) {
      pannerNode = this.audioContext.createPanner();
      pannerNode.panningModel = 'HRTF';
      pannerNode.distanceModel = 'inverse';
      pannerNode.refDistance = 100;
      pannerNode.maxDistance = 1000;
      pannerNode.rolloffFactor = 1;
      
      if (pannerNode.positionX) {
        pannerNode.positionX.value = position.x;
        pannerNode.positionY.value = position.y;
        pannerNode.positionZ.value = position.z || 0;
      } else {
        pannerNode.setPosition(position.x, position.y, position.z || 0);
      }
    }
    
    // Connect audio graph
    source.connect(gainNode);
    if (pannerNode) {
      gainNode.connect(pannerNode);
      pannerNode.connect(audioData.type === 'music' ? this.musicGain : this.sfxGain);
    } else {
      gainNode.connect(audioData.type === 'music' ? this.musicGain : this.sfxGain);
    }
    
    // Handle fade in
    if (fadeIn > 0) {
      gainNode.gain.linearRampToValueAtTime(finalVolume, this.audioContext.currentTime + fadeIn);
    }
    
    // Store instance
    const instance = {
      source,
      gainNode,
      pannerNode,
      hasEnded: false,
      volume: finalVolume,
      type: audioData.type
    };
    
    this.audioInstances.set(audioId, instance);
    this.activeSounds.add(audioId);
    
    // Setup ended callback
    source.onended = () => {
      instance.hasEnded = true;
    };
    
    // Start playback
    source.start(this.audioContext.currentTime + (request.delay || 0));
  }

  playWithHTMLAudio(audioId, audioData, request) {
    const { volume, loop } = request;
    
    // Clone audio element for multiple simultaneous playback
    const audio = audioData.element.cloneNode();
    audio.volume = volume * (audioData.type === 'music' ? this.musicVolume : this.sfxVolume) * this.masterVolume;
    audio.loop = loop;
    
    // Store instance
    const instance = {
      element: audio,
      hasEnded: false,
      volume: audio.volume,
      type: audioData.type
    };
    
    this.audioInstances.set(audioId, instance);
    this.activeSounds.add(audioId);
    
    // Setup ended callback
    audio.onended = () => {
      instance.hasEnded = true;
    };
    
    // Start playback
    audio.play().catch(error => {
      console.warn('Failed to play audio:', error);
      instance.hasEnded = true;
    });
  }

  // Audio control
  stopSound(audioId) {
    const instance = this.audioInstances.get(audioId);
    if (!instance) return;

    if (instance.source) {
      // Web Audio API
      instance.source.stop();
    } else if (instance.element) {
      // HTML Audio
      instance.element.pause();
      instance.element.currentTime = 0;
    }

    instance.hasEnded = true;
    this.activeSounds.delete(audioId);
    this.audioInstances.delete(audioId);
  }

  stopAllSounds() {
    this.activeSounds.forEach(audioId => {
      this.stopSound(audioId);
    });
  }

  pauseSound(audioId) {
    const instance = this.audioInstances.get(audioId);
    if (!instance) return;

    if (instance.element) {
      instance.element.pause();
    }
    // Note: Web Audio API doesn't support pause, only stop
  }

  resumeSound(audioId) {
    const instance = this.audioInstances.get(audioId);
    if (!instance || !instance.element) return;

    instance.element.play();
  }

  setSoundVolume(audioId, volume) {
    const instance = this.audioInstances.get(audioId);
    if (!instance) return;

    if (instance.gainNode) {
      instance.gainNode.gain.value = volume * (instance.type === 'music' ? this.musicVolume : this.sfxVolume);
    } else if (instance.element) {
      instance.element.volume = volume * (instance.type === 'music' ? this.musicVolume : this.sfxVolume) * this.masterVolume;
    }
  }

  // Volume control
  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
  }

  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
  }

  setSFXVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
  }

  updateVolumes() {
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : this.masterVolume;
    }
    
    if (this.musicGain) {
      this.musicGain.gain.value = this.musicVolume;
    }
    
    if (this.sfxGain) {
      this.sfxGain.gain.value = this.sfxVolume;
    }
  }

  mute() {
    this.isMuted = true;
    this.updateVolumes();
  }

  unmute() {
    this.isMuted = false;
    this.updateVolumes();
  }

  toggleMute() {
    if (this.isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
  }

  // Utility methods
  generateAudioId() {
    return `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getVolume() {
    return {
      master: this.masterVolume,
      music: this.musicVolume,
      sfx: this.sfxVolume,
      muted: this.isMuted
    };
  }

  getActiveSounds() {
    return Array.from(this.activeSounds);
  }

  isAudioSupported() {
    return this.isInitialized;
  }

  // Cleanup
  destroy() {
    this.stopAllSounds();
    
    if (this.audioContext) {
      this.audioContext.close();
    }
    
    this.audioBuffers.clear();
    this.audioInstances.clear();
    this.activeSounds.clear();
    this.audioQueue = [];
  }
}

export default AudioSystem;