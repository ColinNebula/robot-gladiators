/**
 * Enhanced Audio System
 * 
 * Advanced audio management with spatial audio, dynamic music,
 * sound effects, audio ducking, reverb, and adaptive soundscape.
 */

export class EnhancedAudioSystem {
  constructor(engine) {
    this.engine = engine;
    this.eventBus = engine.eventBus;
    
    // Audio context setup
    this.audioContext = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.ambientGain = null;
    
    // Audio configuration
    this.config = {
      masterVolume: 1.0,
      musicVolume: 0.7,
      sfxVolume: 0.8,
      ambientVolume: 0.5,
      spatialAudioRange: 1000,
      dopplerFactor: 1.0,
      speedOfSound: 343.3,
      fadeInTime: 1.0,
      fadeOutTime: 1.0,
      crossfadeTime: 2.0
    };
    
    // Audio pools and caches
    this.audioBuffers = new Map();
    this.audioSources = new Map();
    this.musicTracks = new Map();
    this.ambientTracks = new Map();
    this.soundEffects = new Map();
    
    // Playback state
    this.currentMusic = null;
    this.currentAmbient = null;
    this.activeSounds = new Set();
    this.musicQueue = [];
    this.audioState = 'stopped'; // stopped, playing, paused, fading
    
    // Spatial audio
    this.listenerPosition = { x: 0, y: 0, z: 0 };
    this.listenerOrientation = { forward: { x: 0, y: 0, z: -1 }, up: { x: 0, y: 1, z: 0 } };
    
    // Dynamic music system
    this.musicLayers = new Map();
    this.adaptiveMusic = {
      enabled: false,
      currentIntensity: 0,
      targetIntensity: 0,
      transitionSpeed: 0.02,
      layers: []
    };
    
    // Audio effects
    this.audioEffects = {
      reverb: null,
      delay: null,
      filter: null,
      compressor: null,
      distortion: null
    };
    
    this.setupEventListeners();
    this.initializeAudioContext();
  }

  setupEventListeners() {
    this.eventBus.on('audio:playSound', this.playSound.bind(this));
    this.eventBus.on('audio:playMusic', this.playMusic.bind(this));
    this.eventBus.on('audio:playAmbient', this.playAmbient.bind(this));
    this.eventBus.on('audio:stopSound', this.stopSound.bind(this));
    this.eventBus.on('audio:stopMusic', this.stopMusic.bind(this));
    this.eventBus.on('audio:stopAll', this.stopAll.bind(this));
    this.eventBus.on('audio:setVolume', this.setVolume.bind(this));
    this.eventBus.on('audio:setIntensity', this.setMusicIntensity.bind(this));
    this.eventBus.on('audio:updateListener', this.updateListener.bind(this));
    this.eventBus.on('audio:enableEffect', this.enableEffect.bind(this));
    this.eventBus.on('audio:disableEffect', this.disableEffect.bind(this));
  }

  async initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create master gain nodes
      this.masterGain = this.audioContext.createGain();
      this.musicGain = this.audioContext.createGain();
      this.sfxGain = this.audioContext.createGain();
      this.ambientGain = this.audioContext.createGain();
      
      // Set initial volumes
      this.masterGain.gain.value = this.config.masterVolume;
      this.musicGain.gain.value = this.config.musicVolume;
      this.sfxGain.gain.value = this.config.sfxVolume;
      this.ambientGain.gain.value = this.config.ambientVolume;
      
      // Connect audio graph
      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.ambientGain.connect(this.masterGain);
      this.masterGain.connect(this.audioContext.destination);
      
      // Initialize audio effects
      this.initializeAudioEffects();
      
      // Initialize spatial audio
      this.initializeSpatialAudio();
      
      console.log('🔊 Enhanced Audio System initialized');
      
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }

  initializeAudioEffects() {
    if (!this.audioContext) return;
    
    // Create reverb effect
    this.audioEffects.reverb = this.createReverb();
    
    // Create delay effect
    this.audioEffects.delay = this.audioContext.createDelay(1.0);
    this.audioEffects.delay.delayTime.value = 0.3;
    
    // Create filter effect
    this.audioEffects.filter = this.audioContext.createBiquadFilter();
    this.audioEffects.filter.type = 'lowpass';
    this.audioEffects.filter.frequency.value = 2000;
    
    // Create compressor
    this.audioEffects.compressor = this.audioContext.createDynamicsCompressor();
    this.audioEffects.compressor.threshold.value = -24;
    this.audioEffects.compressor.knee.value = 30;
    this.audioEffects.compressor.ratio.value = 12;
    this.audioEffects.compressor.attack.value = 0.003;
    this.audioEffects.compressor.release.value = 0.25;
  }

  createReverb() {
    const convolver = this.audioContext.createConvolver();
    const length = this.audioContext.sampleRate * 2; // 2 seconds
    const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }
    
    convolver.buffer = impulse;
    return convolver;
  }

  initializeSpatialAudio() {
    if (!this.audioContext.listener) return;
    
    // Set up 3D audio listener
    if (this.audioContext.listener.setPosition) {
      this.audioContext.listener.setPosition(0, 0, 0);
      this.audioContext.listener.setOrientation(0, 0, -1, 0, 1, 0);
    } else {
      // Use newer API
      this.audioContext.listener.positionX.value = 0;
      this.audioContext.listener.positionY.value = 0;
      this.audioContext.listener.positionZ.value = 0;
      this.audioContext.listener.forwardX.value = 0;
      this.audioContext.listener.forwardY.value = 0;
      this.audioContext.listener.forwardZ.value = -1;
      this.audioContext.listener.upX.value = 0;
      this.audioContext.listener.upY.value = 1;
      this.audioContext.listener.upZ.value = 0;
    }
  }

  async loadAudio(name, url, type = 'sfx') {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      this.audioBuffers.set(name, audioBuffer);
      
      // Categorize audio
      switch (type) {
        case 'music':
          this.musicTracks.set(name, audioBuffer);
          break;
        case 'ambient':
          this.ambientTracks.set(name, audioBuffer);
          break;
        default:
          this.soundEffects.set(name, audioBuffer);
      }
      
      console.log(`🎵 Loaded audio: ${name} (${type})`);
      return audioBuffer;
      
    } catch (error) {
      console.error(`Failed to load audio: ${name}`, error);
      return null;
    }
  }

  playSound(data) {
    const { sound, volume = 1, pitch = 1, position, loop = false, fadeIn = 0 } = data;
    
    if (!this.audioContext || !this.audioBuffers.has(sound)) {
      console.warn(`Audio not found: ${sound}`);
      return null;
    }
    
    const buffer = this.audioBuffers.get(sound);
    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    
    source.buffer = buffer;
    source.loop = loop;
    source.playbackRate.value = pitch;
    
    // Set up audio graph
    let currentNode = source;
    
    // Add spatial audio if position is provided
    if (position && this.audioContext.createPanner) {
      const panner = this.audioContext.createPanner();
      this.setupSpatialAudio(panner, position);
      currentNode.connect(panner);
      currentNode = panner;
    }
    
    // Connect to gain and output
    currentNode.connect(gainNode);
    gainNode.connect(this.sfxGain);
    
    // Set volume
    gainNode.gain.value = fadeIn > 0 ? 0 : volume;
    
    // Fade in if requested
    if (fadeIn > 0) {
      gainNode.gain.exponentialRampToValueAtTime(volume, this.audioContext.currentTime + fadeIn);
    }
    
    // Start playback
    source.start();
    
    // Track active sound
    const audioId = this.generateAudioId();
    this.activeSounds.add({
      id: audioId,
      source,
      gainNode,
      type: 'sfx',
      name: sound
    });
    
    // Clean up when finished
    source.onended = () => {
      this.activeSounds.delete(audioId);
    };
    
    return audioId;
  }

  playMusic(data) {
    const { track, volume = 1, loop = true, fadeIn = 2, crossfade = true } = data;
    
    if (!this.audioContext || !this.musicTracks.has(track)) {
      console.warn(`Music track not found: ${track}`);
      return;
    }
    
    // Stop current music if crossfade is disabled
    if (this.currentMusic && !crossfade) {
      this.stopMusic({ fadeOut: fadeIn });
    }
    
    const buffer = this.musicTracks.get(track);
    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    
    source.buffer = buffer;
    source.loop = loop;
    
    // Connect audio graph
    source.connect(gainNode);
    gainNode.connect(this.musicGain);
    
    // Set initial volume
    gainNode.gain.value = 0;
    
    // Fade in
    gainNode.gain.exponentialRampToValueAtTime(volume, this.audioContext.currentTime + fadeIn);
    
    // Start playback
    source.start();
    
    // Update current music
    if (this.currentMusic && crossfade) {
      // Fade out previous track
      this.currentMusic.gainNode.gain.exponentialRampToValueAtTime(
        0.001, 
        this.audioContext.currentTime + this.config.crossfadeTime
      );
      
      setTimeout(() => {
        if (this.currentMusic) {
          this.currentMusic.source.stop();
        }
      }, this.config.crossfadeTime * 1000);
    }
    
    this.currentMusic = {
      source,
      gainNode,
      track,
      volume
    };
    
    this.audioState = 'playing';
    
    console.log(`🎵 Playing music: ${track}`);
  }

  playAmbient(data) {
    const { track, volume = 0.5, loop = true, fadeIn = 3 } = data;
    
    if (!this.audioContext || !this.ambientTracks.has(track)) {
      console.warn(`Ambient track not found: ${track}`);
      return;
    }
    
    // Stop current ambient
    if (this.currentAmbient) {
      this.currentAmbient.gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1);
      setTimeout(() => {
        if (this.currentAmbient) {
          this.currentAmbient.source.stop();
        }
      }, 1000);
    }
    
    const buffer = this.ambientTracks.get(track);
    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    
    source.buffer = buffer;
    source.loop = loop;
    
    source.connect(gainNode);
    gainNode.connect(this.ambientGain);
    
    gainNode.gain.value = 0;
    gainNode.gain.exponentialRampToValueAtTime(volume, this.audioContext.currentTime + fadeIn);
    
    source.start();
    
    this.currentAmbient = {
      source,
      gainNode,
      track,
      volume
    };
    
    console.log(`🌊 Playing ambient: ${track}`);
  }

  stopSound(data) {
    const { id, fadeOut = 0 } = data;
    
    for (const sound of this.activeSounds) {
      if (sound.id === id) {
        if (fadeOut > 0) {
          sound.gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + fadeOut);
          setTimeout(() => {
            sound.source.stop();
            this.activeSounds.delete(sound);
          }, fadeOut * 1000);
        } else {
          sound.source.stop();
          this.activeSounds.delete(sound);
        }
        break;
      }
    }
  }

  stopMusic(data = {}) {
    const { fadeOut = 2 } = data;
    
    if (!this.currentMusic) return;
    
    if (fadeOut > 0) {
      this.currentMusic.gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + fadeOut);
      setTimeout(() => {
        if (this.currentMusic) {
          this.currentMusic.source.stop();
          this.currentMusic = null;
        }
        this.audioState = 'stopped';
      }, fadeOut * 1000);
    } else {
      this.currentMusic.source.stop();
      this.currentMusic = null;
      this.audioState = 'stopped';
    }
  }

  stopAll(data = {}) {
    const { fadeOut = 1 } = data;
    
    // Stop all sound effects
    for (const sound of this.activeSounds) {
      if (fadeOut > 0) {
        sound.gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + fadeOut);
        setTimeout(() => sound.source.stop(), fadeOut * 1000);
      } else {
        sound.source.stop();
      }
    }
    this.activeSounds.clear();
    
    // Stop music
    this.stopMusic({ fadeOut });
    
    // Stop ambient
    if (this.currentAmbient) {
      if (fadeOut > 0) {
        this.currentAmbient.gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + fadeOut);
        setTimeout(() => {
          if (this.currentAmbient) {
            this.currentAmbient.source.stop();
            this.currentAmbient = null;
          }
        }, fadeOut * 1000);
      } else {
        this.currentAmbient.source.stop();
        this.currentAmbient = null;
      }
    }
  }

  setVolume(data) {
    const { type, volume } = data;
    
    if (!this.audioContext) return;
    
    switch (type) {
      case 'master':
        this.config.masterVolume = volume;
        this.masterGain.gain.value = volume;
        break;
      case 'music':
        this.config.musicVolume = volume;
        this.musicGain.gain.value = volume;
        break;
      case 'sfx':
        this.config.sfxVolume = volume;
        this.sfxGain.gain.value = volume;
        break;
      case 'ambient':
        this.config.ambientVolume = volume;
        this.ambientGain.gain.value = volume;
        break;
    }
  }

  setMusicIntensity(data) {
    const { intensity } = data;
    this.adaptiveMusic.targetIntensity = Math.max(0, Math.min(1, intensity));
  }

  updateListener(data) {
    const { position, orientation } = data;
    
    if (!this.audioContext.listener) return;
    
    if (position) {
      this.listenerPosition = position;
      
      if (this.audioContext.listener.setPosition) {
        this.audioContext.listener.setPosition(position.x, position.y, position.z || 0);
      } else {
        this.audioContext.listener.positionX.value = position.x;
        this.audioContext.listener.positionY.value = position.y;
        this.audioContext.listener.positionZ.value = position.z || 0;
      }
    }
    
    if (orientation) {
      this.listenerOrientation = orientation;
      
      if (this.audioContext.listener.setOrientation) {
        this.audioContext.listener.setOrientation(
          orientation.forward.x, orientation.forward.y, orientation.forward.z,
          orientation.up.x, orientation.up.y, orientation.up.z
        );
      } else {
        this.audioContext.listener.forwardX.value = orientation.forward.x;
        this.audioContext.listener.forwardY.value = orientation.forward.y;
        this.audioContext.listener.forwardZ.value = orientation.forward.z;
        this.audioContext.listener.upX.value = orientation.up.x;
        this.audioContext.listener.upY.value = orientation.up.y;
        this.audioContext.listener.upZ.value = orientation.up.z;
      }
    }
  }

  setupSpatialAudio(panner, position) {
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = this.config.spatialAudioRange;
    panner.rolloffFactor = 1;
    panner.coneInnerAngle = 360;
    panner.coneOuterAngle = 0;
    panner.coneOuterGain = 0;
    
    if (panner.setPosition) {
      panner.setPosition(position.x, position.y, position.z || 0);
    } else {
      panner.positionX.value = position.x;
      panner.positionY.value = position.y;
      panner.positionZ.value = position.z || 0;
    }
  }

  update(deltaTime) {
    if (!this.audioContext) return;
    
    // Update adaptive music
    if (this.adaptiveMusic.enabled) {
      this.updateAdaptiveMusic(deltaTime);
    }
    
    // Update spatial audio for moving sources
    this.updateSpatialAudio();
  }

  updateAdaptiveMusic(deltaTime) {
    const adaptive = this.adaptiveMusic;
    
    // Smooth intensity transition
    if (adaptive.currentIntensity !== adaptive.targetIntensity) {
      const diff = adaptive.targetIntensity - adaptive.currentIntensity;
      adaptive.currentIntensity += diff * adaptive.transitionSpeed;
      
      if (Math.abs(diff) < 0.01) {
        adaptive.currentIntensity = adaptive.targetIntensity;
      }
    }
    
    // Update layer volumes based on intensity
    for (const [layerName, layer] of this.musicLayers) {
      const targetVolume = this.calculateLayerVolume(layer, adaptive.currentIntensity);
      
      if (layer.gainNode && Math.abs(layer.gainNode.gain.value - targetVolume) > 0.01) {
        layer.gainNode.gain.exponentialRampToValueAtTime(
          Math.max(0.001, targetVolume),
          this.audioContext.currentTime + 0.1
        );
      }
    }
  }

  calculateLayerVolume(layer, intensity) {
    if (intensity < layer.minIntensity) return 0;
    if (intensity > layer.maxIntensity) return layer.volume;
    
    const range = layer.maxIntensity - layer.minIntensity;
    const normalizedIntensity = (intensity - layer.minIntensity) / range;
    
    return layer.volume * normalizedIntensity;
  }

  updateSpatialAudio() {
    // Update positions for moving sound sources if needed
    // This would be called for sounds attached to moving entities
  }

  enableEffect(data) {
    const { effect, settings = {} } = data;
    
    if (!this.audioEffects[effect]) return;
    
    // Apply effect settings
    switch (effect) {
      case 'reverb':
        // Reverb is always available, just control wet/dry mix
        break;
      case 'filter':
        if (settings.frequency) {
          this.audioEffects.filter.frequency.value = settings.frequency;
        }
        if (settings.type) {
          this.audioEffects.filter.type = settings.type;
        }
        break;
      case 'delay':
        if (settings.delayTime) {
          this.audioEffects.delay.delayTime.value = settings.delayTime;
        }
        break;
    }
  }

  disableEffect(data) {
    const { effect } = data;
    // Implementation to disable/bypass effects
  }

  // Utility methods
  generateAudioId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  isPlaying(type = 'any') {
    switch (type) {
      case 'music':
        return this.currentMusic !== null;
      case 'ambient':
        return this.currentAmbient !== null;
      case 'sfx':
        return this.activeSounds.size > 0;
      default:
        return this.currentMusic !== null || this.currentAmbient !== null || this.activeSounds.size > 0;
    }
  }

  getVolume(type) {
    switch (type) {
      case 'master': return this.config.masterVolume;
      case 'music': return this.config.musicVolume;
      case 'sfx': return this.config.sfxVolume;
      case 'ambient': return this.config.ambientVolume;
      default: return this.config.masterVolume;
    }
  }

  // Preset sound effects
  playHitSound(intensity = 1) {
    this.eventBus.emit('audio:playSound', {
      sound: 'hit',
      volume: 0.6 * intensity,
      pitch: 0.8 + Math.random() * 0.4
    });
  }

  playExplosionSound(size = 1) {
    this.eventBus.emit('audio:playSound', {
      sound: 'explosion',
      volume: 0.8 * size,
      pitch: 1.0 - (size - 1) * 0.2
    });
  }

  playFootstep(surface = 'default') {
    const sounds = {
      default: 'footstep',
      metal: 'footstep_metal',
      grass: 'footstep_grass',
      water: 'footstep_water'
    };
    
    this.eventBus.emit('audio:playSound', {
      sound: sounds[surface] || sounds.default,
      volume: 0.3,
      pitch: 0.9 + Math.random() * 0.2
    });
  }
}

export default EnhancedAudioSystem;