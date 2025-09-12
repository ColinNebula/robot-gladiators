import React, { useRef, useEffect, useState } from 'react';

const PLAYER_SPEED = 5;
const JUMP_POWER = 12;
const GRAVITY = 0.7;
const GROUND_Y = 420; // Updated for 500px height canvas
const CHARACTER_WIDTH = 120; // Reduced from 200 for smaller collision boxes
const CHARACTER_HEIGHT = 140; // Reduced from 200 for smaller collision boxes

// Enhanced Sprite animation configuration with improved timing and effects
const SPRITE_CONFIG = {
  frameWidth: 48,  // Width of each frame in the spritesheet
  frameHeight: 48, // Height of each frame in the spritesheet
  renderScale: 2.5,  // Increased scale for better visibility
  smoothing: true,   // Enable smooth animation transitions
  shadowEnabled: true, // Enable sprite shadows
  animations: {
    idle: { frames: 4, speed: 15, file: 'Male_spritesheet_idle.png', loop: true, bounce: true },
    run: { frames: 6, speed: 6, file: 'Male_spritesheet_run.png', loop: true, intensity: 'high' },
    jump: { frames: 3, speed: 4, file: 'Male_spritesheet_run_jump.png', loop: false, easing: 'ease-out' },
    punch1: { frames: 4, speed: 3, file: 'Male_spritesheet_punch_1.png', loop: false, impact: true, shake: true },
    punch2: { frames: 4, speed: 3, file: 'Male_spritesheet_punch_2.png', loop: false, impact: true, shake: true },
    punch3: { frames: 4, speed: 3, file: 'Male_spritesheet_punch_3.png', loop: false, impact: true, shake: 'heavy' },
    punch_quad: { frames: 4, speed: 2, file: 'Male_spritesheet_punch_quad.png', loop: false, impact: true, shake: 'heavy', trail: true },
    kick: { frames: 4, speed: 3, file: 'Male_spritesheet_kick_high.png', loop: false, impact: true, shake: true },
    kick_low: { frames: 4, speed: 3, file: 'Male_spritesheet_kick_low.png', loop: false, impact: true },
    kick_spin: { frames: 6, speed: 2, file: 'Male_spritesheet_kick_spin_high.png', loop: false, impact: true, shake: 'heavy', trail: true },
    falling: { frames: 2, speed: 12, file: 'Male_spritesheet_falling_idle.png', loop: true, sway: true },
    landing: { frames: 3, speed: 4, file: 'Male_spritesheet_falling_landing.png', loop: false, impact: true, dust: true },
    death: { frames: 4, speed: 10, file: 'Male_spritesheet_death_1.png', loop: false, fade: true },
    dodge: { frames: 3, speed: 3, file: 'Male_spritesheet_dodge_back.png', loop: false, blur: true },
    crouch: { frames: 3, speed: 8, file: 'Male_spritesheet_crouch_idle.png', loop: true },
    interact: { frames: 4, speed: 6, file: 'Male_spritesheet_interact.png', loop: false, glow: true }
  }
};

// Enhanced Sprite Animation Class with Visual Effects
class SpriteAnimation {
  constructor(imagePath, config, onLoad) {
    this.image = new Image();
    this.image.src = imagePath;
    this.config = config;
    this.currentFrame = 0;
    this.frameCounter = 0;
    this.currentAnimation = 'idle';
    this.previousAnimation = null;
    this.animationComplete = false;
    this.loaded = false;
    this.onLoad = onLoad;
    this.loadedImages = new Map(); // Cache for different animation images
    
    // Enhanced visual effects
    this.effects = {
      shadow: { enabled: true, offsetX: 2, offsetY: 2, blur: 4, alpha: 0.3 },
      glow: { enabled: false, color: '#ffffff', blur: 10, alpha: 0.6 },
      shake: { enabled: false, intensity: 0, duration: 0, timer: 0 },
      bounce: { enabled: false, amplitude: 2, frequency: 0.1, offset: 0 },
      trail: { enabled: false, positions: [], maxLength: 5 },
      fade: { enabled: false, alpha: 1.0, fadeSpeed: 0.02 },
      blur: { enabled: false, amount: 0 },
      scale: { current: 1.0, target: 1.0, speed: 0.1 },
      rotation: { current: 0, target: 0, speed: 0.1 },
      tint: { enabled: false, color: '#ffffff', intensity: 0 }
    };
    
    // Animation timing enhancements
    this.timing = {
      frameInterpolation: 0,
      easingFunction: 'linear',
      transitionSpeed: 0.15
    };
    
    this.image.onload = () => {
      this.loaded = true;
      this.loadedImages.set('idle', this.image);
      console.log('Base sprite loaded successfully:', imagePath);
      if (this.onLoad) this.onLoad();
    };
    
    this.image.onerror = () => {
      console.error('Failed to load sprite:', imagePath);
    };
  }
  
  setAnimation(animationName, forceRestart = false) {
    if (this.currentAnimation !== animationName || forceRestart) {
      this.previousAnimation = this.currentAnimation;
      this.currentAnimation = animationName;
      this.currentFrame = 0;
      this.frameCounter = 0;
      this.animationComplete = false;
      
      // Apply animation-specific effects
      this.applyAnimationEffects(animationName);
      
      // Load the specific animation image if not already loaded
      this.loadAnimationImage(animationName);
      
      console.log(`🎭 Animation changed: ${this.previousAnimation} → ${animationName}`);
    }
  }
  
  applyAnimationEffects(animationName) {
    const anim = this.config.animations[animationName];
    if (!anim) return;
    
    // Reset all effects
    this.resetEffects();
    
    // Apply specific effects based on animation properties
    if (anim.bounce) {
      this.effects.bounce.enabled = true;
    }
    
    if (anim.shake) {
      this.effects.shake.enabled = true;
      this.effects.shake.intensity = anim.shake === 'heavy' ? 3 : 1;
      this.effects.shake.duration = 15;
      this.effects.shake.timer = this.effects.shake.duration;
    }
    
    if (anim.trail) {
      this.effects.trail.enabled = true;
      this.effects.trail.positions = [];
    }
    
    if (anim.glow) {
      this.effects.glow.enabled = true;
      this.effects.glow.color = anim.glowColor || '#4facfe';
    }
    
    if (anim.blur) {
      this.effects.blur.enabled = true;
      this.effects.blur.amount = 2;
    }
    
    if (anim.fade) {
      this.effects.fade.enabled = true;
      this.effects.fade.alpha = 1.0;
    }
    
    if (anim.intensity === 'high') {
      this.effects.scale.target = 1.1;
    }
  }
  
  resetEffects() {
    this.effects.shake.enabled = false;
    this.effects.bounce.enabled = false;
    this.effects.trail.enabled = false;
    this.effects.glow.enabled = false;
    this.effects.blur.enabled = false;
    this.effects.fade.enabled = false;
    this.effects.scale.target = 1.0;
    this.effects.rotation.target = 0;
  }
  
  loadAnimationImage(animationName) {
    const anim = this.config.animations[animationName];
    if (!anim || this.loadedImages.has(animationName)) return;
    
    const fullPath = `/assets/sprites/SplitAnimations/${anim.file}`;
    console.log(`🔄 Loading animation image: ${animationName} from ${fullPath}`);
    
    const img = new Image();
    img.src = fullPath;
    img.onload = () => {
      this.loadedImages.set(animationName, img);
      console.log(`✅ Animation image loaded successfully: ${animationName} (${img.naturalWidth}x${img.naturalHeight})`);
    };
    img.onerror = (error) => {
      console.error(`❌ Failed to load animation: ${animationName} from ${fullPath}`, error);
      console.error('Check if file exists at:', fullPath);
    };
  }
  
  update() {
    if (!this.loaded) return;
    
    const anim = this.config.animations[this.currentAnimation];
    if (!anim) return;
    
    // Update visual effects
    this.updateEffects();
    
    // Skip frame updates if animation is complete and not looping
    if (this.animationComplete && !anim.loop) return;
    
    this.frameCounter++;
    if (this.frameCounter >= anim.speed) {
      this.currentFrame++;
      this.frameCounter = 0;
      
      // Handle animation completion
      if (this.currentFrame >= anim.frames) {
        if (anim.loop) {
          this.currentFrame = 0; // Loop back to start
        } else {
          this.currentFrame = anim.frames - 1; // Stay on last frame
          this.animationComplete = true;
          // Auto-return to idle for non-looping animations with smooth transition
          setTimeout(() => {
            if (!anim.loop && this.currentAnimation !== 'idle' && this.currentAnimation !== 'death') {
              this.setAnimation('idle');
            }
          }, 200);
        }
      }
    }
    
    // Update frame interpolation for smoother animations
    if (this.config.smoothing) {
      this.timing.frameInterpolation = this.frameCounter / anim.speed;
    }
  }
  
  updateEffects() {
    // Update shake effect
    if (this.effects.shake.enabled) {
      this.effects.shake.timer--;
      if (this.effects.shake.timer <= 0) {
        this.effects.shake.enabled = false;
      }
    }
    
    // Update bounce effect
    if (this.effects.bounce.enabled) {
      this.effects.bounce.offset += this.effects.bounce.frequency;
    }
    
    // Update scale animation
    this.effects.scale.current += (this.effects.scale.target - this.effects.scale.current) * this.effects.scale.speed;
    
    // Update rotation animation
    this.effects.rotation.current += (this.effects.rotation.target - this.effects.rotation.current) * this.effects.rotation.speed;
    
    // Update fade effect
    if (this.effects.fade.enabled) {
      this.effects.fade.alpha -= this.effects.fade.fadeSpeed;
      if (this.effects.fade.alpha <= 0) {
        this.effects.fade.alpha = 0;
        this.effects.fade.enabled = false;
      }
    }
    
    // Update trail effect
    if (this.effects.trail.enabled) {
      // Trail positions will be updated in draw method
    }
  }
  
  isAnimationComplete() {
    return this.animationComplete;
  }
  
  draw(ctx, x, y, flipX = false) {
    const currentImage = this.loadedImages.get(this.currentAnimation) || this.image;
    
    if (!currentImage || !currentImage.complete || currentImage.naturalWidth === 0) {
      this.drawFallback(ctx, x, y);
      return;
    }
    
    const anim = this.config.animations[this.currentAnimation];
    if (!anim) {
      this.drawFallback(ctx, x, y);
      return;
    }
    
    const frameWidth = this.config.frameWidth;
    const frameHeight = this.config.frameHeight;
    const baseScale = this.config.renderScale;
    const effectScale = this.effects.scale.current;
    const finalScale = baseScale * effectScale;
    const renderWidth = frameWidth * finalScale;
    const renderHeight = frameHeight * finalScale;
    
    // Calculate position with effects
    let effectX = x;
    let effectY = y;
    
    // Apply shake effect
    if (this.effects.shake.enabled) {
      effectX += (Math.random() - 0.5) * this.effects.shake.intensity * 2;
      effectY += (Math.random() - 0.5) * this.effects.shake.intensity * 2;
    }
    
    // Apply bounce effect
    if (this.effects.bounce.enabled) {
      effectY += Math.sin(this.effects.bounce.offset) * this.effects.bounce.amplitude;
    }
    
    // Update trail positions
    if (this.effects.trail.enabled) {
      this.effects.trail.positions.push({ x: effectX, y: effectY, alpha: 1.0 });
      if (this.effects.trail.positions.length > this.effects.trail.maxLength) {
        this.effects.trail.positions.shift();
      }
      // Fade trail positions
      this.effects.trail.positions.forEach((pos, index) => {
        pos.alpha = (index + 1) / this.effects.trail.positions.length * 0.5;
      });
    }
    
    // Calculate source coordinates for current frame
    const sourceX = this.currentFrame * frameWidth;
    const sourceY = 0;
    
    ctx.save();
    
    // Set global alpha for fade effect
    if (this.effects.fade.enabled) {
      ctx.globalAlpha = this.effects.fade.alpha;
    }
    
    // Apply blur effect
    if (this.effects.blur.enabled) {
      ctx.filter = `blur(${this.effects.blur.amount}px)`;
    }
    
    // Handle flipping
    if (flipX) {
      ctx.scale(-1, 1);
      effectX = -effectX - renderWidth;
    }
    
    // Apply rotation
    if (this.effects.rotation.current !== 0) {
      ctx.translate(effectX + renderWidth/2, effectY - renderHeight/2);
      ctx.rotate(this.effects.rotation.current);
      ctx.translate(-renderWidth/2, renderHeight/2);
      effectX = -renderWidth/2;
      effectY = renderHeight/2;
    }
    
    try {
      // Draw trail effect
      if (this.effects.trail.enabled) {
        this.effects.trail.positions.forEach((pos, index) => {
          if (index < this.effects.trail.positions.length - 1) {
            ctx.save();
            ctx.globalAlpha = pos.alpha;
            ctx.drawImage(
              currentImage,
              sourceX, sourceY, frameWidth, frameHeight,
              pos.x, pos.y - renderHeight, renderWidth, renderHeight
            );
            ctx.restore();
          }
        });
      }
      
      // Draw shadow
      if (this.config.shadowEnabled && this.effects.shadow.enabled) {
        ctx.save();
        ctx.globalAlpha = this.effects.shadow.alpha;
        ctx.filter = `blur(${this.effects.shadow.blur}px)`;
        ctx.drawImage(
          currentImage,
          sourceX, sourceY, frameWidth, frameHeight,
          effectX + this.effects.shadow.offsetX, effectY - renderHeight + this.effects.shadow.offsetY,
          renderWidth, renderHeight
        );
        ctx.restore();
      }
      
      // Draw glow effect
      if (this.effects.glow.enabled) {
        ctx.save();
        ctx.globalAlpha = this.effects.glow.alpha;
        ctx.shadowColor = this.effects.glow.color;
        ctx.shadowBlur = this.effects.glow.blur;
        ctx.drawImage(
          currentImage,
          sourceX, sourceY, frameWidth, frameHeight,
          effectX, effectY - renderHeight, renderWidth, renderHeight
        );
        ctx.restore();
      }
      
      // Draw main sprite
      ctx.drawImage(
        currentImage,
        sourceX, sourceY, frameWidth, frameHeight,
        effectX, effectY - renderHeight, renderWidth, renderHeight
      );
      
      // Draw debug info
      if (window.DEBUG_SPRITES) {
        ctx.strokeStyle = this.effects.glow.enabled ? '#00ffff' : '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(effectX, effectY - renderHeight, renderWidth, renderHeight);
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`${this.currentAnimation}:${this.currentFrame}`, effectX, effectY + 25);
        
        // Show active effects with enhanced visibility
        const activeEffects = [];
        if (this.effects.shake.enabled) activeEffects.push(`SHAKE:${this.effects.shake.intensity}`);
        if (this.effects.bounce.enabled) activeEffects.push('BOUNCE');
        if (this.effects.trail.enabled) activeEffects.push('TRAIL');
        if (this.effects.glow.enabled) activeEffects.push(`GLOW:${this.effects.glow.color}`);
        if (this.effects.scale.current > 1.1) activeEffects.push(`SCALE:${this.effects.scale.current.toFixed(1)}`);
        
        if (activeEffects.length > 0) {
          ctx.fillStyle = '#ffff00';
          ctx.font = 'bold 12px Arial';
          ctx.fillText(activeEffects.join('|'), effectX, effectY + 45);
          console.log(`🎭 Active effects on ${this.currentAnimation}:`, activeEffects.join(', '));
        }
      }
      
    } catch (error) {
      console.error('❌ Error drawing enhanced sprite:', error);
      this.drawFallback(ctx, effectX, effectY);
    }
    
    ctx.restore();
  }
  
  drawFallback(ctx, x, y) {
    const scale = this.config.renderScale;
    const size = this.config.frameWidth * scale;
    
    // Draw enhanced fallback with glow effect
    ctx.save();
    
    // Add glow effect for fallback
    ctx.shadowColor = '#4facfe';
    ctx.shadowBlur = 15;
    
    ctx.font = `bold ${size * 0.9}px serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    
    // Add animation-specific emoji or effect
    let fallbackChar = '🤖'; // Robot emoji
    switch(this.currentAnimation) {
      case 'punch1':
      case 'punch2':
      case 'punch3':
      case 'punch_quad':
        fallbackChar = '👊'; // Punch emoji
        break;
      case 'kick':
      case 'kick_low':
      case 'kick_spin':
        fallbackChar = '🦵'; // Leg emoji
        break;
      case 'run':
        fallbackChar = '🏃'; // Running person
        break;
      case 'jump':
        fallbackChar = '🤸'; // Person doing cartwheel
        break;
      case 'death':
        fallbackChar = '💀'; // Skull
        break;
      case 'dodge':
        fallbackChar = '💨'; // Dash
        break;
    }
    
    ctx.fillText(fallbackChar, x + size/2, y - size/4);
    
    // Add a subtle outline
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeText(fallbackChar, x + size/2, y - size/4);
    
    ctx.restore();
  }
  
  // Special animation methods for enhanced effects
  playImpactAnimation() {
    this.effects.shake.enabled = true;
    this.effects.shake.intensity = 5; // Increased from 2
    this.effects.shake.duration = 20; // Increased from 10
    this.effects.shake.timer = 20;
    
    this.effects.scale.target = 1.4; // Increased from 1.2
    this.effects.glow.enabled = true;
    this.effects.glow.color = '#ffffff';
    this.effects.glow.alpha = 0.8;
    
    console.log('💥 IMPACT ANIMATION TRIGGERED - Shake:', this.effects.shake.intensity, 'Scale:', this.effects.scale.target);
    
    setTimeout(() => {
      this.effects.scale.target = 1.0;
      this.effects.glow.enabled = false;
    }, 300); // Increased duration
  }
  
  playSpecialEffect(effectType) {
    switch(effectType) {
      case 'powerup':
        this.effects.glow.enabled = true;
        this.effects.glow.color = '#ffd700';
        this.effects.scale.target = 1.3;
        setTimeout(() => {
          this.effects.glow.enabled = false;
          this.effects.scale.target = 1.0;
        }, 1000);
        break;
        
      case 'damage':
        this.effects.tint.enabled = true;
        this.effects.tint.color = '#ff0000';
        this.effects.shake.enabled = true;
        this.effects.shake.intensity = 6; // Increased from 3
        this.effects.shake.duration = 30; // Increased from 20
        this.effects.shake.timer = 30;
        
        // Add red glow for damage
        this.effects.glow.enabled = true;
        this.effects.glow.color = '#ff0000';
        this.effects.glow.alpha = 0.7;
        
        console.log('💔 DAMAGE EFFECT TRIGGERED - Red glow and shake active');
        
        setTimeout(() => {
          this.effects.tint.enabled = false;
          this.effects.glow.enabled = false;
        }, 500); // Increased duration
        break;
        
      case 'victory':
        this.effects.bounce.enabled = true;
        this.effects.glow.enabled = true;
        this.effects.glow.color = '#00ff00';
        break;
        
      case 'charging':
        this.effects.glow.enabled = true;
        this.effects.glow.color = '#4facfe';
        this.effects.scale.target = 1.1;
        break;
    }
  }
  
  stopAllEffects() {
    this.resetEffects();
  }
  
  // Preload all animation images
  preloadAnimations() {
    Object.keys(this.config.animations).forEach(animName => {
      this.loadAnimationImage(animName);
    });
  }
}

const SideScroller = ({ character, onBackToMenu }) => {
  const canvasRef = useRef(null);
  const playerSpriteRef = useRef(null);
  const enemySpriteRef = useRef(null);
  
  // Enable sprite debugging via console: window.DEBUG_SPRITES = true
  useEffect(() => {
    window.DEBUG_SPRITES = true; // Temporarily enabled for debugging sprites
    console.log('🐛 Sprite debugging is ENABLED - you should see green outlines around sprites');
  }, []);
  
  const playerRef = useRef({
    x: 150, // Moved further from edge for wider screen
    y: GROUND_Y,
    vx: 0,
    vy: 0,
    onGround: true,
    facing: 'right',
    avatar: character?.player1?.avatar || '🤖',
    name: character?.player1?.name || 'Player',
    health: character?.player1?.health || 100,
    maxHealth: character?.player1?.health || 100,
    attack: character?.player1?.attack || 10,
    currentAnimation: 'idle',
    isAttacking: false,
    attackCooldown: 0
  });
  
  const enemyRef = useRef({
    x: 1050, // Moved further to the right for wider screen (1200px canvas)
    y: GROUND_Y,
    vx: 0,
    vy: 0,
    onGround: true,
    facing: 'left',
    avatar: character?.player2?.avatar || '👾',
    name: character?.player2?.name || 'Enemy',
    health: character?.player2?.health || 100,
    maxHealth: character?.player2?.health || 100,
    attack: character?.player2?.attack || 10,
    currentAnimation: 'idle',
    isAttacking: false,
    attackCooldown: 0
  });
  
  const [player, setPlayer] = useState(playerRef.current);
  const [enemy, setEnemy] = useState(enemyRef.current);
  const [collisionAnimation, setCollisionAnimation] = useState({ active: false, x: 0, y: 0, timer: 0 });
  const [screenShake, setScreenShake] = useState({ active: false, intensity: 0, timer: 0 });
  const [isPaused, setIsPaused] = useState(false);
  const [spritesLoaded, setSpritesLoaded] = useState({ player: false, enemy: false });
  const [gameOver, setGameOver] = useState({ active: false, winner: null, message: '' });
  const [particles, setParticles] = useState([]);
  const [combo, setCombo] = useState({ player: 0, enemy: 0, timer: 0 });
  const [specialMeter, setSpecialMeter] = useState({ player: 0, enemy: 0 });
  const [powerUps, setPowerUps] = useState([]);
  const [gameTime, setGameTime] = useState(0);
  const [connectedGamepad, setConnectedGamepad] = useState({ type: null, name: null });

  // Game state refs for tracking
  const gameStateRef = useRef({
    frameCount: 0,
    particleCreationCount: 0
  });

  // Enhanced Combat System State
  const [activeKeys, setActiveKeys] = useState(new Set());
  const [combatState, setCombatState] = useState({
    leftPunchPressed: false,
    rightPunchPressed: false,
    leftKickPressed: false,
    rightKickPressed: false,
    comboWindow: 0, // Frames remaining for combo input
    lastAttackType: null,
    comboPower: 1.0
  });

  // Menu Navigation State for Gamepad
  const [menuNavigation, setMenuNavigation] = useState({
    pauseMenuFocus: 0, // 0 = Resume, 1 = Main Menu
    gameOverMenuFocus: 0, // 0 = Play Again, 1 = Main Menu
    lastDpadInput: { x: 0, y: 0 },
    navigationCooldown: 0
  });

  // Initialize enhanced sprite animations
  useEffect(() => {
    console.log('Initializing enhanced sprite animations...');
    
    // Create player sprite animation
    playerSpriteRef.current = new SpriteAnimation(
      '/assets/sprites/SplitAnimations/Male_spritesheet_idle.png',
      SPRITE_CONFIG,
      () => {
        console.log('✅ Player sprite animation loaded successfully!');
        setSpritesLoaded(prev => ({ ...prev, player: true }));
      }
    );
    
    // Create enemy sprite animation  
    enemySpriteRef.current = new SpriteAnimation(
      '/assets/sprites/SplitAnimations/Male_spritesheet_idle.png',
      SPRITE_CONFIG,
      () => {
        console.log('✅ Enemy sprite animation loaded successfully!');
        setSpritesLoaded(prev => ({ ...prev, enemy: true }));
      }
    );
    
    // Preload all animations
    console.log('Preloading all animations...');
    playerSpriteRef.current.preloadAnimations();
    enemySpriteRef.current.preloadAnimations();
    
    // Add debugging to check what images are being requested
    console.log('Sprite paths being loaded:');
    console.log('- Base path:', '/assets/sprites/SplitAnimations/Male_spritesheet_idle.png');
    Object.keys(SPRITE_CONFIG.animations).forEach(animName => {
      const animConfig = SPRITE_CONFIG.animations[animName];
      console.log(`- ${animName}:`, `/assets/sprites/SplitAnimations/${animConfig.file}`);
    });
    
    console.log('Enhanced sprite animations initialized');
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    function draw() {
      // Apply screen shake - SIMPLIFIED FOR DEBUGGING
      let shakeX = 0, shakeY = 0;
      /*
      if (screenShake.active) {
        shakeX = (Math.random() - 0.5) * screenShake.intensity;
        shakeY = (Math.random() - 0.5) * screenShake.intensity;
      }
      */
      
      // Clear canvas normally without transformation
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw ground
      ctx.fillStyle = '#222';
      ctx.fillRect(0, GROUND_Y + 40, canvas.width, 40);
      
      // TEST: Draw current particle count (small display)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '12px Arial';
      ctx.fillText(`Particles: ${particles.length}`, 20, 25);
      
      // Draw player using enhanced sprite animation
      if (playerSpriteRef.current && spritesLoaded.player) {
        const flipX = playerRef.current.facing === 'left';
        playerSpriteRef.current.draw(ctx, playerRef.current.x, playerRef.current.y, flipX);
      } else {
        // Fallback emoji
        ctx.font = '96px serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#4facfe';
        ctx.fillText(playerRef.current.avatar, playerRef.current.x, playerRef.current.y);
      }
      
      // Draw enemy using enhanced sprite animation
      if (enemySpriteRef.current && spritesLoaded.enemy) {
        const flipX = enemyRef.current.facing === 'left';
        enemySpriteRef.current.draw(ctx, enemyRef.current.x, enemyRef.current.y, flipX);
      } else {
        // Fallback emoji
        ctx.font = '96px serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff4757';
        ctx.fillText(enemyRef.current.avatar, enemyRef.current.x, enemyRef.current.y);
      }
      
      // Draw collision impact effect
      if (collisionAnimation.active) {
        const progress = 1 - (collisionAnimation.timer / 30);
        const size = progress * 30;
        const alpha = 1 - progress;
        
        // Impact burst
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(collisionAnimation.x, collisionAnimation.y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Impact sparks
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const sparkSize = size * 0.3;
          const sparkX = collisionAnimation.x + Math.cos(angle) * size;
          const sparkY = collisionAnimation.y + Math.sin(angle) * size;
          
          ctx.fillStyle = `rgba(255, 255, 0, ${alpha * 0.8})`;
          ctx.beginPath();
          ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Impact text
        ctx.font = '24px Arial';
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.textAlign = 'center';
        ctx.fillText('COLLISION!', collisionAnimation.x, collisionAnimation.y - 40);
      }
      
      // Draw enhanced health bars at top of screen
      const drawTopHealthBar = (screenX, health, maxHealth, name, isPlayer = true, isLeft = true) => {
        const barWidth = 300; // Much wider bars for better visibility
        const barHeight = 24; // Much taller bars
        const topMargin = 15; // Distance from top of screen
        const borderRadius = 12; // Rounded corners
        
        // Position bars on left and right sides of screen
        const barX = isLeft ? 40 : canvas.width - barWidth - 40;
        const barY = topMargin;
        
        // Enhanced background with multiple layers
        ctx.save();
        
        // Outer glow
        ctx.shadowColor = isPlayer ? '#4facfe' : '#ff4757';
        ctx.shadowBlur = 15;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(barX - 6, barY - 6, barWidth + 12, barHeight + 12);
        
        // Main background with gradient
        ctx.shadowBlur = 0;
        const bgGradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
        bgGradient.addColorStop(0, 'rgba(60, 60, 60, 0.95)');
        bgGradient.addColorStop(1, 'rgba(30, 30, 30, 0.95)');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(barX - 3, barY - 3, barWidth + 6, barHeight + 6);
        
        // Health bar background with inner shadow effect
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Inner border for depth
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX + 1, barY + 1, barWidth - 2, barHeight - 2);
        
        // Health bar fill with enhanced gradient
        const healthPercent = health / maxHealth;
        const healthWidth = barWidth * healthPercent;
        
        let healthGradient;
        if (healthPercent > 0.6) {
          // Green gradient for healthy
          healthGradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
          healthGradient.addColorStop(0, '#4caf50');
          healthGradient.addColorStop(0.5, '#2ed573');
          healthGradient.addColorStop(1, '#27ae60');
        } else if (healthPercent > 0.3) {
          // Orange gradient for warning
          healthGradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
          healthGradient.addColorStop(0, '#ff9800');
          healthGradient.addColorStop(0.5, '#ffa502');
          healthGradient.addColorStop(1, '#f39c12');
        } else {
          // Red gradient for critical
          healthGradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
          healthGradient.addColorStop(0, '#f44336');
          healthGradient.addColorStop(0.5, '#ff4757');
          healthGradient.addColorStop(1, '#e74c3c');
        }
        
        ctx.fillStyle = healthGradient;
        
        // For enemy (right side), fill from right to left
        if (!isLeft) {
          ctx.fillRect(barX + barWidth - healthWidth, barY, healthWidth, barHeight);
        } else {
          ctx.fillRect(barX, barY, healthWidth, barHeight);
        }
        
        // Health bar shine effect
        const shineGradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight/3);
        shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = shineGradient;
        
        if (!isLeft) {
          ctx.fillRect(barX + barWidth - healthWidth, barY, healthWidth, barHeight/3);
        } else {
          ctx.fillRect(barX, barY, healthWidth, barHeight/3);
        }
        
        // Enhanced border with multiple layers
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.shadowColor = isPlayer ? '#4facfe' : '#ff4757';
        ctx.shadowBlur = 8;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Inner highlight
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
        ctx.strokeRect(barX + 2, barY + 2, barWidth - 4, barHeight - 4);
        
        ctx.restore();
        
        // Enhanced character name with styling
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.textAlign = isLeft ? 'left' : 'right';
        const nameX = isLeft ? barX : barX + barWidth;
        const nameY = barY - 10;
        
        // Text shadow for better readability
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 3;
        ctx.strokeText(name, nameX, nameY);
        ctx.fillText(name, nameX, nameY);
        ctx.shadowBlur = 0;
        
        // Enhanced health numbers with background
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.textAlign = 'center';
        const healthText = `${Math.max(0, Math.floor(health))}/${maxHealth}`;
        const healthTextX = barX + barWidth/2;
        const healthTextY = barY + barHeight + 20;
        
        // Background for health text
        const textMetrics = ctx.measureText(healthText);
        const textBgX = healthTextX - textMetrics.width/2 - 4;
        const textBgY = healthTextY - 12;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(textBgX, textBgY, textMetrics.width + 8, 16);
        
        // Health text
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 2;
        ctx.strokeText(healthText, healthTextX, healthTextY);
        ctx.fillText(healthText, healthTextX, healthTextY);
        ctx.shadowBlur = 0;
        
        // Enhanced combo indicator with glow
        const comboCount = isPlayer ? combo.player : combo.enemy;
        if (comboCount > 0) {
          ctx.font = 'bold 16px Arial';
          ctx.fillStyle = '#ffd700';
          ctx.strokeStyle = '#b8860b';
          ctx.lineWidth = 2;
          ctx.textAlign = isLeft ? 'left' : 'right';
          const comboX = isLeft ? barX : barX + barWidth;
          const comboY = barY + barHeight + 45;
          
          // Combo glow effect
          ctx.shadowColor = '#ffd700';
          ctx.shadowBlur = 10;
          const comboText = `${comboCount}x COMBO!`;
          ctx.strokeText(comboText, comboX, comboY);
          ctx.fillText(comboText, comboX, comboY);
          ctx.shadowBlur = 0;
        }
        
        // Enhanced special meter (for both players)
        const meterWidth = 180; // Wider special meter
        const meterHeight = 12; // Taller special meter
        const meterX = barX + (barWidth - meterWidth) / 2;
        const meterY = barY + barHeight + (comboCount > 0 ? 65 : 35);
        
        // Special meter background with depth
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(meterX - 2, meterY - 2, meterWidth + 4, meterHeight + 4);
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(meterX, meterY, meterWidth, meterHeight);
        
        // Special meter fill with enhanced gradient
        const specialPercent = isPlayer ? specialMeter.player / 100 : specialMeter.enemy / 100;
        const specialWidth = meterWidth * specialPercent;
        
        let specialGradient;
        if (specialPercent >= 1) {
          // Gold gradient when full
          specialGradient = ctx.createLinearGradient(meterX, meterY, meterX, meterY + meterHeight);
          specialGradient.addColorStop(0, '#ffeb3b');
          specialGradient.addColorStop(0.5, '#ffd700');
          specialGradient.addColorStop(1, '#ff8f00');
        } else {
          // Color-coded gradient for each player
          specialGradient = ctx.createLinearGradient(meterX, meterY, meterX, meterY + meterHeight);
          if (isPlayer) {
            specialGradient.addColorStop(0, '#64b5f6');
            specialGradient.addColorStop(0.5, '#4facfe');
            specialGradient.addColorStop(1, '#2196f3');
          } else {
            specialGradient.addColorStop(0, '#ef5350');
            specialGradient.addColorStop(0.5, '#ff4757');
            specialGradient.addColorStop(1, '#f44336');
          }
        }
        
        ctx.fillStyle = specialGradient;
        ctx.fillRect(meterX, meterY, specialWidth, meterHeight);
        
        // Special meter shine effect
        const specialShine = ctx.createLinearGradient(meterX, meterY, meterX, meterY + meterHeight/3);
        specialShine.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        specialShine.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = specialShine;
        ctx.fillRect(meterX, meterY, specialWidth, meterHeight/3);
        
        // Special meter border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.shadowColor = specialPercent >= 1 ? '#ffd700' : (isPlayer ? '#4facfe' : '#ff4757');
        ctx.shadowBlur = specialPercent >= 1 ? 8 : 4;
        ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);
        ctx.shadowBlur = 0;
        
        // Special meter label with enhanced styling
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.textAlign = 'center';
        const specialText = specialPercent >= 1 ? 'SPECIAL READY!' : 'Special';
        const labelY = meterY - 4;
        
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 2;
        ctx.strokeText(specialText, meterX + meterWidth/2, labelY);
        ctx.fillText(specialText, meterX + meterWidth/2, labelY);
        ctx.shadowBlur = 0;
      };
      
      // Draw health bars at top of screen for both characters
      drawTopHealthBar(0, playerRef.current.health, playerRef.current.maxHealth, playerRef.current.name, true, true); // Player on left
      drawTopHealthBar(0, enemyRef.current.health, enemyRef.current.maxHealth, enemyRef.current.name, false, false); // Enemy on right
      
      // Draw game timer and VS indicator in center top
      const centerX = canvas.width / 2;
      const topY = 30;
      
      // Game timer
      const gameTimeSeconds = Math.floor(gameTime / 60); // Assuming 60 FPS
      const minutes = Math.floor(gameTimeSeconds / 60);
      const seconds = gameTimeSeconds % 60;
      const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      ctx.font = 'bold 20px Arial';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 3;
      ctx.fillText(timeString, centerX, topY);
      ctx.shadowBlur = 0;
      
      // VS indicator
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = '#ffd700';
      ctx.textAlign = 'center';
      ctx.fillText('VS', centerX, topY + 25);
      
      // Draw collision boxes (for debugging - make them less prominent)
      if (true) { // Enable collision boxes to see the new smaller size
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)'; // More transparent green boxes
        ctx.lineWidth = 1;
        ctx.strokeRect(playerRef.current.x - CHARACTER_WIDTH/2, playerRef.current.y - CHARACTER_HEIGHT, CHARACTER_WIDTH, CHARACTER_HEIGHT);
        ctx.strokeRect(enemyRef.current.x - CHARACTER_WIDTH/2, enemyRef.current.y - CHARACTER_HEIGHT, CHARACTER_WIDTH, CHARACTER_HEIGHT);
      }
      
      // Render particles - FIXED SYSTEM WITH PROPER ERROR HANDLING
      if (particles.length > 0) {
        console.log(`🎨 RENDERING ${particles.length} PARTICLES`);
        
        try {
          ctx.save(); // Save context state
          
          particles.forEach((particle, index) => {
            try {
              const alpha = Math.max(0.8, particle.life / particle.maxLife);
              
              if (particle.type === 'explosion') {
                // Explosive particles with bright glow
                ctx.save();
                ctx.translate(particle.x, particle.y);
                ctx.rotate(particle.rotation || 0);
                
                ctx.shadowColor = '#ffff00';
                ctx.shadowBlur = 15;
                ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
                ctx.beginPath();
                ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.beginPath();
                ctx.arc(0, 0, particle.size * 0.6, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.shadowBlur = 0;
                ctx.restore();
                
              } else if (particle.type === 'spark') {
                // Bright spark particles
                ctx.save();
                ctx.translate(particle.x, particle.y);
                ctx.rotate(particle.rotation || 0);
                
                ctx.shadowColor = '#ff4400';
                ctx.shadowBlur = 12;
                ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`;
                ctx.beginPath();
                ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.beginPath();
                ctx.arc(0, 0, particle.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.shadowBlur = 0;
                ctx.restore();
                
              } else if (particle.type === 'shockwave') {
                // Enhanced expanding rings
                ctx.save();
                
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur = 15;
                ctx.strokeStyle = `rgba(0, 255, 255, ${alpha * 0.8})`;
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.stroke();
                
                ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size * 0.7, 0, Math.PI * 2);
                ctx.stroke();
                
                ctx.restore();
                
              } else if (particle.type === 'debris') {
                // Debris particles
                let fillColor = `rgba(200, 160, 120, ${alpha})`;
                if (particle.color === '#ff6b6b' || particle.color === '#ff0000') {
                  fillColor = `rgba(255, 100, 100, ${alpha})`;
                } else if (particle.color === '#888888') {
                  fillColor = `rgba(200, 200, 200, ${alpha})`;
                }
                
                ctx.fillStyle = fillColor;
                ctx.shadowColor = particle.color;
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.strokeStyle = `rgba(0, 0, 0, ${alpha * 0.7})`;
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.shadowBlur = 0;
                
              } else {
                // Normal particles with enhanced visibility
                let fillColor = `rgba(255, 255, 100, ${alpha})`;
                if (particle.color === '#ffff00' || particle.color === '#ffd700') {
                  fillColor = `rgba(255, 255, 0, ${alpha})`;
                } else if (particle.color === '#ff6b6b' || particle.color === '#ff0000') {
                  fillColor = `rgba(255, 100, 100, ${alpha})`;
                } else if (particle.color === '#ffffff') {
                  fillColor = `rgba(255, 255, 255, ${alpha})`;
                } else if (particle.color === '#00ff00') {
                  fillColor = `rgba(100, 255, 100, ${alpha})`;
                }
                
                ctx.fillStyle = fillColor;
                ctx.shadowColor = particle.color;
                ctx.shadowBlur = 15;
                
                ctx.beginPath();
                const size = Math.max(12, particle.size * 1.2);
                ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
                ctx.lineWidth = 3;
                ctx.stroke();
                ctx.shadowBlur = 0;
              }
              
            } catch (particleError) {
              console.error(`❌ Error rendering particle ${index}:`, particleError, particle);
            }
          });
          
          ctx.restore(); // Restore context state
          
        } catch (renderError) {
          console.error('❌ Error in particle rendering system:', renderError);
          ctx.restore(); // Ensure context is restored even on error
        }
        
        // Debug info with more details
        if (particles.length > 0) {
          const explosionCount = particles.filter(p => p.type === 'explosion').length;
          const sparkCount = particles.filter(p => p.type === 'spark').length;
          const shockwaveCount = particles.filter(p => p.type === 'shockwave').length;
          const debrisCount = particles.filter(p => p.type === 'debris').length;
          const normalCount = particles.filter(p => p.type === 'normal').length;
          
          console.log(`Rendering ${particles.length} particles: ${explosionCount} explosion, ${sparkCount} spark, ${shockwaveCount} shockwave, ${debrisCount} debris, ${normalCount} normal`);
        }
      }
      
      // GLOBAL DEBUG OVERLAY - Show particle system status ALWAYS
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(canvas.width - 280, 10, 270, 120);
      
      ctx.fillStyle = '#00ff00';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(`PARTICLE DEBUG SYSTEM`, canvas.width - 270, 30);
      
      ctx.fillStyle = '#ffff00';
      ctx.font = '14px Arial';
      ctx.fillText(`Active Particles: ${particles.length}`, canvas.width - 270, 50);
      ctx.fillText(`Total Created: ${gameStateRef.current.particleCreationCount || 0}`, canvas.width - 270, 70);
      ctx.fillText(`Frame: ${gameStateRef.current.frameCount || 0}`, canvas.width - 270, 90);
      
      if (particles.length > 0) {
        const types = particles.reduce((acc, p) => {
          acc[p.type] = (acc[p.type] || 0) + 1;
          return acc;
        }, {});
        const typeStr = Object.entries(types).map(([type, count]) => `${type}:${count}`).join(' ');
        ctx.fillText(`Types: ${typeStr}`, canvas.width - 270, 110);
      } else {
        ctx.fillStyle = '#ff0000';
        ctx.fillText(`NO PARTICLES VISIBLE!`, canvas.width - 270, 110);
      }
      ctx.restore();
    }

    function createParticles(x, y, color, count = 4, type = 'normal') {
      console.log(`🎨 CREATING ${count} ${type} PARTICLES at (${x}, ${y}) with color ${color}`);
      
      // Increment creation counter for debugging
      if (!gameStateRef.current.particleCreationCount) gameStateRef.current.particleCreationCount = 0;
      gameStateRef.current.particleCreationCount += count;
      
      const newParticles = [];
      
      for (let i = 0; i < count; i++) {
        let particle;
        
        if (type === 'explosion') {
          // Explosive burst particles - radial spread
          const angle = (i / count) * Math.PI * 2;
          const speed = 2 + Math.random() * 4;
          const life = 120 + Math.random() * 60; // Much longer life for debugging
          
          particle = {
            x: x + (Math.random() - 0.5) * 15,
            y: y + (Math.random() - 0.5) * 15,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: life,
            maxLife: life,
            color: color,
            size: 3 + Math.random() * 5, // Reduced from 8-20 to 3-8
            type: 'explosion',
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.2
          };
        } else if (type === 'spark') {
          // Electric spark particles - fast moving
          const angle = Math.random() * Math.PI * 2;
          const speed = 4 + Math.random() * 6;
          const life = 100 + Math.random() * 50; // Much longer life for debugging
          
          particle = {
            x: x + (Math.random() - 0.5) * 10,
            y: y + (Math.random() - 0.5) * 10,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: life,
            maxLife: life,
            color: color,
            size: 2 + Math.random() * 3, // Reduced from 6-14 to 2-5
            type: 'spark',
            trail: [], // For spark trails
            trailLength: 4
          };
        } else if (type === 'shockwave') {
          // Expanding shockwave rings
          const life = 25 + Math.random() * 15; // Shorter life
          
          particle = {
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            life: life,
            maxLife: life,
            color: color,
            size: 2 + Math.random() * 3, // Reduced from 5-13 to 2-5
            type: 'shockwave',
            expansion: 2 + Math.random() * 3 // Slower expansion
          };
        } else if (type === 'debris') {
          // Heavy debris particles - affected by gravity
          const life = 40 + Math.random() * 20; // Shorter life
          
          particle = {
            x: x + (Math.random() - 0.5) * 20,
            y: y + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4 - 2,
            life: life,
            maxLife: life,
            color: color,
            size: 3 + Math.random() * 5, // Smaller size
            type: 'debris',
            bounce: 0.3 + Math.random() * 0.4
          };
        } else {
          // Normal particles - improved default
          const life = 30 + Math.random() * 20; // Shorter life
          
          particle = {
            x: x + (Math.random() - 0.5) * 20,
            y: y + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4 - 1,
            life: life,
            maxLife: life,
            color: color,
            size: 3 + Math.random() * 5, // Smaller size
            type: 'normal'
          };
        }
        
        newParticles.push(particle);
      }
      
      setParticles(prev => {
        const updated = [...prev, ...newParticles];
        console.log(`✅ PARTICLES ADDED: ${prev.length} -> ${updated.length}`);
        return updated;
      });
    }

    function triggerCollisionAnimation(x, y) {
      setCollisionAnimation({ active: true, x, y, timer: 30 });
      setScreenShake({ active: true, intensity: 8, timer: 20 });
      
      // Add immediate sprite impact effects
      if (playerSpriteRef.current) {
        playerSpriteRef.current.playImpactAnimation();
        console.log('🤝 Player collision effect triggered!');
      }
      
      if (enemySpriteRef.current) {
        enemySpriteRef.current.playImpactAnimation();
        console.log('🤝 Enemy collision effect triggered!');
      }
      
      // MINIMAL COLLISION PARTICLE EFFECTS
      
      // 1. Main explosion burst (minimal)
      createParticles(x, y, '#ffff00', 1, 'explosion'); // Reduced from 2
      createParticles(x, y, '#ff8800', 1, 'explosion'); // Orange explosion
      
      // 2. Electric sparks (minimal)
      createParticles(x, y, '#ffffff', 1, 'spark'); // Reduced from 3
      
      // 3. Shockwave rings (minimal)
      createParticles(x, y, '#ffffff', 1, 'shockwave'); // White shockwaves
      
      console.log(`ENHANCED collision animation triggered at (${x}, ${y}) - multiple particle types created!`);
      
      // Apply stronger repelling force for more dramatic effect
      const playerX = playerRef.current.x;
      const enemyX = enemyRef.current.x;
      const repelForce = 12; // Increased from 8
      
      if (playerX < enemyX) {
        // Player is on the left, push left; enemy push right
        playerRef.current.vx = -repelForce;
        enemyRef.current.vx = repelForce;
      } else {
        // Player is on the right, push right; enemy push left
        playerRef.current.vx = repelForce;
        enemyRef.current.vx = -repelForce;
      }
      
      // Add more dramatic upward bounce
      if (playerRef.current.onGround) {
        playerRef.current.vy = -5; // Increased from -3
        playerRef.current.onGround = false;
      }
      if (enemyRef.current.onGround) {
        enemyRef.current.vy = -5; // Increased from -3
        enemyRef.current.onGround = false;
      }
    }

    function checkCollision(rect1, rect2) {
      return rect1.x < rect2.x + rect2.width &&
             rect1.x + rect1.width > rect2.x &&
             rect1.y < rect2.y + rect2.height &&
             rect1.y + rect1.height > rect2.y;
    }

    // Enhanced Combat System Functions
    function performCombatAttack(attackType, comboPower = 1.0) {
      console.log(`=== ENHANCED COMBAT: ${attackType.toUpperCase()} ===`);
      console.log(`Combo Power: ${comboPower}x`);
      
      if (playerRef.current.isAttacking || playerRef.current.attackCooldown > 0) {
        console.log('Attack blocked - player still in attack state');
        return;
      }

      playerRef.current.isAttacking = true;
      playerRef.current.attackCooldown = Math.floor(30 / comboPower); // Faster cooldown for combos
      
      // Set animation based on attack type with enhanced effects
      const animations = {
        'left-punch': 'punch1',
        'right-punch': 'punch2', 
        'left-kick': 'kick',
        'right-kick': 'kick_low',
        'double-punch': 'punch3',
        'double-kick': 'punch_quad' // Using enhanced quad animation
      };
      
      const selectedAnimation = animations[attackType] || 'punch1';
      playerRef.current.currentAnimation = selectedAnimation;
      
      // Apply special effects based on attack type
      if (playerSpriteRef.current) {
        playerSpriteRef.current.setAnimation(selectedAnimation);
        
        // Immediate charging effect for all attacks
        playerSpriteRef.current.playSpecialEffect('charging');
        console.log(`🔥 Attack effects triggered for ${attackType}`);
        
        // Add special effects for powerful attacks
        if (attackType === 'double-punch' || attackType === 'double-kick') {
          setTimeout(() => {
            if (playerSpriteRef.current) {
              playerSpriteRef.current.effects.glow.color = '#ffd700';
              playerSpriteRef.current.effects.scale.target = 1.3;
              console.log('⚡ Enhanced combo effect applied!');
            }
          }, 50);
        }
      }
      
      // Check if attack hits enemy
      const distance = Math.abs(playerRef.current.x - enemyRef.current.x);
      console.log('Attack distance:', distance, 'Required distance:', CHARACTER_WIDTH + 20);
      
      if (distance < CHARACTER_WIDTH + 20) {
        console.log('ENHANCED ATTACK HIT!');
        
        // Immediate impact effects on both sprites
        if (playerSpriteRef.current) {
          playerSpriteRef.current.playImpactAnimation();
          console.log('🥊 Player impact effect triggered!');
        }
        
        if (enemySpriteRef.current) {
          enemySpriteRef.current.playSpecialEffect('damage');
          console.log('💥 Enemy damage effect triggered!');
        }
        
        // Calculate damage based on attack type and combo power
        let baseDamage = playerRef.current.attack;
        let damageMultiplier = 1.0;
        
        switch(attackType) {
          case 'left-punch':
          case 'right-punch':
            damageMultiplier = 1.0;
            break;
          case 'left-kick':
          case 'right-kick':
            damageMultiplier = 1.2; // Kicks are stronger
            break;
          case 'double-punch':
            damageMultiplier = 1.8; // Strong combo
            break;
          case 'double-kick':
            damageMultiplier = 2.2; // Strongest combo
            break;
        }
        
        let totalDamage = Math.floor(baseDamage * damageMultiplier * comboPower);
        
        // Apply existing combo system bonus
        if (combo.player > 0) {
          totalDamage += Math.floor(combo.player * 2);
          setCombo(prev => ({ ...prev, player: prev.player + 1, timer: 180 }));
        } else {
          setCombo(prev => ({ ...prev, player: 1, timer: 180 }));
        }
        
        console.log(`Total damage: ${totalDamage} (base: ${baseDamage}, multiplier: ${damageMultiplier}, combo: ${comboPower})`);
        
        enemyRef.current.health = Math.max(0, enemyRef.current.health - totalDamage);
        
        // Add damage effect to enemy sprite
        if (enemySpriteRef.current) {
          enemySpriteRef.current.playSpecialEffect('damage');
        }
        
        // Build special meter (more for stronger attacks)
        const meterGain = Math.floor(15 * damageMultiplier);
        setSpecialMeter(prev => ({ ...prev, player: Math.min(100, prev.player + meterGain) }));
        
        // Minimal particle effects for different attack types
        const particleColors = {
          'left-punch': '#ff6b6b',
          'right-punch': '#4facfe', 
          'left-kick': '#ffa502',
          'right-kick': '#2ed573',
          'double-punch': '#ffd700',
          'double-kick': '#e056fd'
        };
        
        // Reduced particle count by 60%
        const particleCount = Math.max(1, Math.floor((1 + damageMultiplier) * 0.4));
        createParticles(enemyRef.current.x, enemyRef.current.y - 50, particleColors[attackType] || '#ff0000', particleCount, 'explosion');
        createParticles(enemyRef.current.x, enemyRef.current.y - 50, '#ffffff', Math.floor(particleCount * 0.5), 'spark');
        
        // Enhanced screen shake for stronger attacks
        const shakeIntensity = Math.floor(8 * damageMultiplier);
        setScreenShake({ active: true, intensity: shakeIntensity, timer: 20 });
        
        // Trigger collision animation
        const collisionX = (playerRef.current.x + enemyRef.current.x) / 2;
        const collisionY = Math.min(playerRef.current.y, enemyRef.current.y) - 20;
        triggerCollisionAnimation(collisionX, collisionY);
        
        // Display damage number (visual feedback)
        console.log(`💥 ${attackType}: ${totalDamage} damage dealt!`);
        
      } else {
        console.log('ENHANCED ATTACK MISSED - too far away');
      }
    }

    function updateParticles() {
      setParticles(prevParticles => {
        const updatedParticles = prevParticles.map(particle => {
          let newParticle = { ...particle };
          
          // Update based on particle type
          if (particle.type === 'explosion') {
            newParticle.x += particle.vx;
            newParticle.y += particle.vy;
            newParticle.vx *= 0.96; // Slow down over time
            newParticle.vy *= 0.96;
            newParticle.vy += 0.05; // Light gravity
            newParticle.rotation += particle.rotationSpeed;
            newParticle.life -= 1;
          } else if (particle.type === 'spark') {
            // Update trail
            newParticle.trail = [...(particle.trail || []), { x: particle.x, y: particle.y }];
            if (newParticle.trail.length > particle.trailLength) {
              newParticle.trail.shift();
            }
            
            newParticle.x += particle.vx;
            newParticle.y += particle.vy;
            newParticle.vx *= 0.92; // Fast deceleration
            newParticle.vy *= 0.92;
            newParticle.life -= 1;
          } else if (particle.type === 'shockwave') {
            newParticle.size += particle.expansion;
            newParticle.life -= 1;
          } else if (particle.type === 'debris') {
            newParticle.x += particle.vx;
            newParticle.y += particle.vy;
            newParticle.vx *= 0.98; // Air resistance
            newParticle.vy += 0.15; // Stronger gravity for debris
            
            // Bounce off ground
            if (newParticle.y > GROUND_Y - 10) {
              newParticle.y = GROUND_Y - 10;
              newParticle.vy *= -particle.bounce;
              newParticle.vx *= 0.8; // Friction on bounce
            }
            
            newParticle.life -= 1;
          } else {
            // Normal particle physics
            newParticle.x += particle.vx;
            newParticle.y += particle.vy;
            newParticle.vy += 0.08; // Light gravity
            newParticle.vx *= 0.99; // Air resistance
            newParticle.life -= 1;
          }
          
          return newParticle;
        }).filter(particle => particle.life > 0);
        
        return updatedParticles;
      });
    }

    function updateCombatSystem() {
      // Update combo window timer
      if (combatState.comboWindow > 0) {
        setCombatState(prev => ({ ...prev, comboWindow: prev.comboWindow - 1 }));
      } else {
        // Reset combat state when combo window expires
        setCombatState(prev => ({
          ...prev,
          leftPunchPressed: false,
          rightPunchPressed: false,
          leftKickPressed: false,
          rightKickPressed: false,
          comboPower: 1.0
        }));
      }
    }

    function update() {
      // Increment frame counter for debugging
      gameStateRef.current.frameCount++;
      
      // Check for game over conditions first
      if (playerRef.current.health <= 0 && !gameOver.active) {
        setGameOver({ 
          active: true, 
          winner: 'enemy', 
          message: `${enemyRef.current.name} Wins! You Lose!` 
        });
        
        // Add death effect to loser and victory effect to winner
        if (playerSpriteRef.current) {
          playerSpriteRef.current.setAnimation('death');
        }
        if (enemySpriteRef.current) {
          enemySpriteRef.current.playSpecialEffect('victory');
        }
        
        return; // Stop updating game
      }
      
      if (enemyRef.current.health <= 0 && !gameOver.active) {
        setGameOver({ 
          active: true, 
          winner: 'player', 
          message: `${playerRef.current.name} Wins! Victory!` 
        });
        
        // Add victory effect to winner and death effect to loser
        if (playerSpriteRef.current) {
          playerSpriteRef.current.playSpecialEffect('victory');
        }
        if (enemySpriteRef.current) {
          enemySpriteRef.current.setAnimation('death');
        }
        
        return; // Stop updating game
      }
      
      // Don't update game if game is over
      if (gameOver.active) return;
      
      // Update enhanced combat system
      updateCombatSystem();
      
      // Update particles
      updateParticles();
      
      // Test particles removed - particles now optimized for performance
      
      // FORCE TEST PARTICLES: Create visible particles every few seconds for debugging
      if (gameTime % 120 === 0) { // Every 2 seconds for more frequent testing
        console.log('🧪 FORCE CREATING VISIBLE TEST PARTICLES');
        createParticles(600, 300, '#ff0000', 4, 'explosion');
        createParticles(700, 250, '#00ff00', 3, 'spark');
        createParticles(500, 350, '#0000ff', 2, 'shockwave');
        createParticles(650, 200, '#ffff00', 2, 'debris');
        createParticles(550, 400, '#ffffff', 5, 'normal');
      }
      
      // ADD TEST: Create particles on every attack for debugging
      if (playerRef.current.isAttacking) {
        console.log('🧪 PLAYER ATTACKING - Creating test particles');
        createParticles(playerRef.current.x + 50, playerRef.current.y - 50, '#ff0000', 1, 'explosion');
        createParticles(playerRef.current.x + 50, playerRef.current.y - 30, '#ffffff', 1, 'spark');
      }
      
      // Update sprite animations with enhanced effects
      if (playerSpriteRef.current) {
        // Set player animation based on state with enhanced effects
        if (playerRef.current.isAttacking) {
          const attacks = ['punch1', 'punch2', 'punch3'];
          const attackAnim = attacks[Math.floor(Math.random() * attacks.length)];
          playerSpriteRef.current.setAnimation(attackAnim);
          
          // Add continuous shake effect during attacks
          if (playerRef.current.attackCooldown > 0) {
            playerSpriteRef.current.effects.shake.enabled = true;
            playerSpriteRef.current.effects.shake.intensity = 1;
            playerSpriteRef.current.effects.shake.timer = 5;
          }
        } else if (!playerRef.current.onGround) {
          if (playerRef.current.vy < 0) {
            playerSpriteRef.current.setAnimation('jump');
          } else {
            playerSpriteRef.current.setAnimation('falling');
          }
        } else if (Math.abs(playerRef.current.vx) > 0.1) {
          playerSpriteRef.current.setAnimation('run');
        } else {
          playerSpriteRef.current.setAnimation('idle');
        }
        playerSpriteRef.current.update();
      }
      
      if (enemySpriteRef.current) {
        // Set enemy animation based on state with enhanced effects
        if (enemyRef.current.isAttacking) {
          enemySpriteRef.current.setAnimation('punch1');
          // Add continuous attack effects
          if (enemyRef.current.attackCooldown > 25) {
            enemySpriteRef.current.effects.glow.enabled = true;
            enemySpriteRef.current.effects.glow.color = '#ff4757';
            enemySpriteRef.current.effects.shake.enabled = true;
            enemySpriteRef.current.effects.shake.intensity = 2;
          }
        } else if (Math.abs(enemyRef.current.vx) > 0.1) {
          enemySpriteRef.current.setAnimation('run');
        } else {
          enemySpriteRef.current.setAnimation('idle');
        }
        enemySpriteRef.current.update();
      }
      
      // Update game timer
      setGameTime(prev => prev + 1);
      
      // Update combo timer
      if (combo.timer > 0) {
        setCombo(prev => ({ ...prev, timer: prev.timer - 1 }));
      } else if (combo.player > 0 || combo.enemy > 0) {
        setCombo({ player: 0, enemy: 0, timer: 0 });
      }
      
      // Update player
      let { x, y, vx, vy, onGround, currentAnimation, attackCooldown } = playerRef.current;
      let newX = x + vx;
      let newY = y + vy;
      
      // Handle attack cooldown
      if (attackCooldown > 0) {
        attackCooldown--;
        if (attackCooldown === 0) {
          playerRef.current.isAttacking = false;
        }
      }
      
      // Determine player animation
      if (playerRef.current.isAttacking) {
        // Keep attack animation
      } else if (!onGround && vy > 0) {
        currentAnimation = 'falling';
      } else if (!onGround && vy < 0) {
        currentAnimation = 'jump';
      } else if (Math.abs(vx) > 0) {
        currentAnimation = 'run';
      } else {
        currentAnimation = 'idle';
      }
      
      // Apply friction to repel force
      if (Math.abs(vx) > PLAYER_SPEED) {
        vx *= 0.9; // Gradually slow down repel force
      }
      
      if (newY < GROUND_Y) {
        vy += GRAVITY;
        onGround = false;
      } else {
        newY = GROUND_Y;
        vy = 0;
        onGround = true;
        if (currentAnimation === 'falling' && !playerRef.current.isAttacking) {
          currentAnimation = 'landing';
          // Add landing effect
          if (playerSpriteRef.current && vy > 5) { // Only for significant falls
            playerSpriteRef.current.setAnimation('landing');
            playerSpriteRef.current.playImpactAnimation();
          }
        }
      }
      
      // Check collision with enemy before moving
      const playerRect = { x: newX - CHARACTER_WIDTH/2, y: newY - CHARACTER_HEIGHT, width: CHARACTER_WIDTH, height: CHARACTER_HEIGHT };
      const enemyRect = { x: enemyRef.current.x - CHARACTER_WIDTH/2, y: enemyRef.current.y - CHARACTER_HEIGHT, width: CHARACTER_WIDTH, height: CHARACTER_HEIGHT };
      
      if (!checkCollision(playerRect, enemyRect)) {
        x = newX;
        y = newY;
      } else {
        // Stop movement if collision detected and trigger animation
        if (Math.abs(vx) > 0 && Math.abs(vx) <= PLAYER_SPEED) { // Only trigger for normal movement, not repel
          const collisionX = (playerRef.current.x + enemyRef.current.x) / 2;
          const collisionY = Math.min(playerRef.current.y, enemyRef.current.y) - 20;
          triggerCollisionAnimation(collisionX, collisionY);
        }
        if (Math.abs(vx) <= PLAYER_SPEED) { // Don't stop repel force
          vx = 0;
        }
        y = newY; // Allow vertical movement (gravity/jump)
      }
      
      // Prevent going off screen
      x = Math.max(CHARACTER_WIDTH/2, Math.min(canvas.width - CHARACTER_WIDTH/2, x));
      
      playerRef.current = { ...playerRef.current, x, y, vx, vy, onGround, currentAnimation, attackCooldown };
      setPlayer({ ...playerRef.current });
      
      // Update enemy (simple AI - move towards player but respect collisions)
      let enemyData = { ...enemyRef.current };
      const distance = Math.abs(enemyData.x - playerRef.current.x);
      
      // Handle enemy attack cooldown
      if (enemyData.attackCooldown > 0) {
        enemyData.attackCooldown--;
        if (enemyData.attackCooldown === 0) {
          enemyData.isAttacking = false;
        }
      }
      
      // Determine enemy animation
      if (enemyData.isAttacking) {
        // Keep attack animation
      } else if (!enemyData.onGround && enemyData.vy > 0) {
        enemyData.currentAnimation = 'falling';
      } else if (!enemyData.onGround && enemyData.vy < 0) {
        enemyData.currentAnimation = 'jump';
      } else if (Math.abs(enemyData.vx) > 0) {
        enemyData.currentAnimation = 'run';
      } else {
        enemyData.currentAnimation = 'idle';
      }
      
      // Apply friction to enemy repel force
      if (Math.abs(enemyData.vx) > 1) {
        enemyData.vx *= 0.9;
      }
      
      // Only apply AI movement if not being repelled
      if (Math.abs(enemyData.vx) <= 1 && distance > CHARACTER_WIDTH + 10) {
        if (enemyData.x > playerRef.current.x) {
          enemyData.vx = -1;
          enemyData.facing = 'left';
        } else {
          enemyData.vx = 1;
          enemyData.facing = 'right';
        }
      } else if (Math.abs(enemyData.vx) <= 1) {
        enemyData.vx = 0;
      }
      
      // Enemy AI: Randomly attack when close
      if (distance < CHARACTER_WIDTH + 20 && !enemyData.isAttacking && enemyData.attackCooldown === 0 && Math.random() < 0.02) {
        enemyData.isAttacking = true;
        enemyData.currentAnimation = Math.random() < 0.5 ? 'punch1' : 'punch2';
        enemyData.attackCooldown = 30; // Attack duration
        
        // Deal damage to player with combo
        let damage = enemyData.attack;
        
        // Combo damage bonus
        if (combo.enemy > 0) {
          damage += Math.floor(combo.enemy * 2);
          setCombo(prev => ({ ...prev, enemy: prev.enemy + 1, timer: 180 }));
        } else {
          setCombo(prev => ({ ...prev, enemy: 1, timer: 180 }));
        }
        
        playerRef.current.health = Math.max(0, playerRef.current.health - damage);
        
        // Add damage effect to player sprite
        if (playerSpriteRef.current) {
          playerSpriteRef.current.playSpecialEffect('damage');
          console.log('💔 Player damage effect triggered!');
        }
        
        // Add attack effect to enemy sprite
        if (enemySpriteRef.current) {
          enemySpriteRef.current.playImpactAnimation();
          console.log('👊 Enemy attack effect triggered!');
        }
        
        // Build enemy special meter
        setSpecialMeter(prev => ({ ...prev, enemy: Math.min(100, prev.enemy + 10) }));
        
        // Create damage particles for enemy attacks (reduced)
        createParticles(playerRef.current.x, playerRef.current.y - 50, '#ff0000', 1, 'explosion');
        createParticles(playerRef.current.x, playerRef.current.y - 50, '#ffffff', 1, 'spark');
        
        // Trigger collision animation for enemy attack
        const collisionX = (playerRef.current.x + enemyData.x) / 2;
        const collisionY = Math.min(playerRef.current.y, enemyData.y) - 20;
        triggerCollisionAnimation(collisionX, collisionY);
      }
      
      let enemyNewX = enemyData.x + enemyData.vx;
      let enemyNewY = enemyData.y + enemyData.vy;
      
      if (enemyNewY < GROUND_Y) {
        enemyData.vy += GRAVITY;
        enemyData.onGround = false;
      } else {
        enemyNewY = GROUND_Y;
        enemyData.vy = 0;
        enemyData.onGround = true;
        if (enemyData.currentAnimation === 'falling' && !enemyData.isAttacking) {
          enemyData.currentAnimation = 'landing';
        }
      }
      
      // Check collision with player before enemy moves
      const newEnemyRect = { x: enemyNewX - CHARACTER_WIDTH/2, y: enemyNewY - CHARACTER_HEIGHT, width: CHARACTER_WIDTH, height: CHARACTER_HEIGHT };
      const currentPlayerRect = { x: playerRef.current.x - CHARACTER_WIDTH/2, y: playerRef.current.y - CHARACTER_HEIGHT, width: CHARACTER_WIDTH, height: CHARACTER_HEIGHT };
      
      if (!checkCollision(newEnemyRect, currentPlayerRect)) {
        enemyData.x = enemyNewX;
        enemyData.y = enemyNewY;
      } else {
        // Trigger collision animation if enemy was moving (normal movement, not repel)
        if (Math.abs(enemyData.vx) > 0 && Math.abs(enemyData.vx) <= 1) {
          const collisionX = (playerRef.current.x + enemyData.x) / 2;
          const collisionY = Math.min(playerRef.current.y, enemyData.y) - 20;
          triggerCollisionAnimation(collisionX, collisionY);
        }
        if (Math.abs(enemyData.vx) <= 1) { // Don't stop repel force
          enemyData.vx = 0;
        }
        enemyData.y = enemyNewY; // Allow vertical movement
      }
      
      // Prevent enemy going off screen
      enemyData.x = Math.max(CHARACTER_WIDTH/2, Math.min(canvas.width - CHARACTER_WIDTH/2, enemyData.x));
      
      enemyRef.current = enemyData;
      setEnemy({ ...enemyData });
      
      // Update collision animation
      if (collisionAnimation.active) {
        setCollisionAnimation(prev => ({
          ...prev,
          timer: prev.timer - 1,
          active: prev.timer > 1
        }));
      }
      
      // Update screen shake
      if (screenShake.active) {
        setScreenShake(prev => ({
          ...prev,
          timer: prev.timer - 1,
          active: prev.timer > 1,
          intensity: prev.intensity * 0.9 // Gradually reduce shake
        }));
      }
    }

    function loop() {
      if (!isPaused && !gameOver.active) {
        update();
        draw();
      }
      animationFrameId = requestAnimationFrame(loop);
    }
    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused, gameOver.active]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.repeat) return;
      
      // Pause/unpause functionality
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        setIsPaused(prev => !prev);
        return;
      }
      
      // Don't process game controls when paused or game over
      if (isPaused || gameOver.active) return;
      
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        playerRef.current.vx = -PLAYER_SPEED;
        playerRef.current.facing = 'left';
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        playerRef.current.vx = PLAYER_SPEED;
        playerRef.current.facing = 'right';
      } else if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') && playerRef.current.onGround) {
        playerRef.current.vy = -JUMP_POWER;
        playerRef.current.onGround = false;
      
      // Enhanced Combat Controls
      } else if (e.key === 'q' || e.key === 'Q') {
        // Left Punch
        if (!combatState.leftPunchPressed) {
          setCombatState(prev => ({ ...prev, leftPunchPressed: true, comboWindow: 30 }));
          
          // Check for double punch combo
          if (combatState.rightPunchPressed && combatState.comboWindow > 0) {
            console.log('🥊 DOUBLE PUNCH COMBO!');
            performCombatAttack('double-punch', 1.5);
            setCombatState(prev => ({ 
              ...prev, 
              leftPunchPressed: false, 
              rightPunchPressed: false,
              comboWindow: 0,
              comboPower: 1.5
            }));
          } else {
            performCombatAttack('left-punch');
          }
        }
      
      } else if (e.key === 'e' || e.key === 'E') {
        // Right Punch
        if (!combatState.rightPunchPressed) {
          setCombatState(prev => ({ ...prev, rightPunchPressed: true, comboWindow: 30 }));
          
          // Check for double punch combo
          if (combatState.leftPunchPressed && combatState.comboWindow > 0) {
            console.log('🥊 DOUBLE PUNCH COMBO!');
            performCombatAttack('double-punch', 1.5);
            setCombatState(prev => ({ 
              ...prev, 
              leftPunchPressed: false, 
              rightPunchPressed: false,
              comboWindow: 0,
              comboPower: 1.5
            }));
          } else {
            performCombatAttack('right-punch');
          }
        }
      
      } else if (e.key === 'f' || e.key === 'F') {
        // Left Kick
        if (!combatState.leftKickPressed) {
          setCombatState(prev => ({ ...prev, leftKickPressed: true, comboWindow: 30 }));
          
          // Check for double kick combo
          if (combatState.rightKickPressed && combatState.comboWindow > 0) {
            console.log('🦵 DOUBLE KICK COMBO!');
            performCombatAttack('double-kick', 2.0);
            setCombatState(prev => ({ 
              ...prev, 
              leftKickPressed: false, 
              rightKickPressed: false,
              comboWindow: 0,
              comboPower: 2.0
            }));
          } else {
            performCombatAttack('left-kick');
          }
        }
      
      } else if (e.key === 'g' || e.key === 'G') {
        // Right Kick
        if (!combatState.rightKickPressed) {
          setCombatState(prev => ({ ...prev, rightKickPressed: true, comboWindow: 30 }));
          
          // Check for double kick combo
          if (combatState.leftKickPressed && combatState.comboWindow > 0) {
            console.log('🦵 DOUBLE KICK COMBO!');
            performCombatAttack('double-kick', 2.0);
            setCombatState(prev => ({ 
              ...prev, 
              leftKickPressed: false, 
              rightKickPressed: false,
              comboWindow: 0,
              comboPower: 2.0
            }));
          } else {
            performCombatAttack('right-kick');
          }
        }
      
      // Legacy single attack (X key for backwards compatibility)
      } else if (e.key === 'x' || e.key === 'X') {
        performCombatAttack('right-punch');
        
      } else if ((e.key === 'z' || e.key === 'Z') && specialMeter.player >= 100 && !playerRef.current.isAttacking) {
        // Special Move
        console.log('=== SPECIAL MOVE ===');
        playerRef.current.isAttacking = true;
        playerRef.current.currentAnimation = 'punch_quad';
        playerRef.current.attackCooldown = 45; // Longer special move
        
        // Consume special meter
        setSpecialMeter(prev => ({ ...prev, player: 0 }));
        
        // Enhanced screen shake for special
        setScreenShake({ active: true, intensity: 12, timer: 30 });
        
        // Check if special hits enemy (longer range)
        const distance = Math.abs(playerRef.current.x - enemyRef.current.x);
        if (distance < CHARACTER_WIDTH + 50) {
          console.log('SPECIAL MOVE HIT! Dealing massive damage');
          // Deal massive damage
          const specialDamage = playerRef.current.attack * 3;
          enemyRef.current.health = Math.max(0, enemyRef.current.health - specialDamage);
          
          // Create special move particle explosion (reduced)
          createParticles(enemyRef.current.x, enemyRef.current.y - 50, '#ffd700', 3, 'explosion'); // Reduced from 8
          createParticles(enemyRef.current.x, enemyRef.current.y - 50, '#ffffff', 2, 'spark'); // Reduced from 6
          createParticles(enemyRef.current.x, enemyRef.current.y - 50, '#ffaa00', 2, 'shockwave'); // Orange shockwaves
          
          // Massive knockback
          const knockbackForce = 15;
          if (playerRef.current.x < enemyRef.current.x) {
            enemyRef.current.vx = knockbackForce;
          } else {
            enemyRef.current.vx = -knockbackForce;
          }
          enemyRef.current.vy = -8;
          enemyRef.current.onGround = false;
          
          // Reset combo for massive hit
          setCombo(prev => ({ ...prev, player: 10, timer: 300 }));
        }
      } else if ((e.key === 'c' || e.key === 'C')) {
        // TEST: Manual enhanced particle creation
        console.log('=== MANUAL ENHANCED PARTICLE TEST ===');
        createParticles(400, 200, '#ffff00', 6, 'explosion');
        createParticles(400, 200, '#ffffff', 4, 'spark');
        createParticles(400, 200, '#ff8800', 3, 'shockwave');
        createParticles(450, 200, '#ff0000', 8, 'debris');
        console.log('Created enhanced test particles at center of screen');
      }
    }
    
    function handleKeyUp(e) {
      // Don't process game controls when paused or game over
      if (isPaused || gameOver.active) return;
      
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'ArrowRight' || e.key === 'd') {
        playerRef.current.vx = 0;
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Enhanced PS5/Gamepad support
    let gamepadInterval;
    let lastGamepadState = { buttons: [], axes: [] };
    
    function detectGamepadType(gamepad) {
      const id = gamepad.id.toLowerCase();
      if (id.includes('dualsense') || id.includes('ps5') || id.includes('054c')) {
        return 'PS5';
      } else if (id.includes('xbox') || id.includes('xinput') || id.includes('045e')) {
        return 'Xbox';
      } else if (id.includes('nintendo') || id.includes('switch') || id.includes('057e')) {
        return 'Nintendo';
      }
      return 'Generic';
    }
    
    function pollGamepad() {
      // Handle gamepad menu navigation when paused or game over
      if (isPaused || gameOver.active) {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        const gp = gamepads[0];
        if (gp) {
          const gamepadType = detectGamepadType(gp);
          
          // Update navigation cooldown
          if (menuNavigation.navigationCooldown > 0) {
            setMenuNavigation(prev => ({ ...prev, navigationCooldown: prev.navigationCooldown - 1 }));
          }

          // D-pad and analog stick navigation
          const dpadLeft = gp.buttons[14] && gp.buttons[14].pressed;
          const dpadRight = gp.buttons[15] && gp.buttons[15].pressed;
          const analogX = gp.axes[0] || 0;
          
          const leftPressed = dpadLeft || analogX < -0.5;
          const rightPressed = dpadRight || analogX > 0.5;
          
          // Navigate between menu options with cooldown
          if (menuNavigation.navigationCooldown === 0) {
            if (leftPressed && !menuNavigation.lastDpadInput.x) {
              if (isPaused) {
                setMenuNavigation(prev => ({ 
                  ...prev, 
                  pauseMenuFocus: Math.max(0, prev.pauseMenuFocus - 1),
                  navigationCooldown: 10
                }));
              } else if (gameOver.active) {
                setMenuNavigation(prev => ({ 
                  ...prev, 
                  gameOverMenuFocus: Math.max(0, prev.gameOverMenuFocus - 1),
                  navigationCooldown: 10
                }));
              }
            } else if (rightPressed && !menuNavigation.lastDpadInput.x) {
              if (isPaused) {
                setMenuNavigation(prev => ({ 
                  ...prev, 
                  pauseMenuFocus: Math.min(1, prev.pauseMenuFocus + 1),
                  navigationCooldown: 10
                }));
              } else if (gameOver.active) {
                setMenuNavigation(prev => ({ 
                  ...prev, 
                  gameOverMenuFocus: Math.min(1, prev.gameOverMenuFocus + 1),
                  navigationCooldown: 10
                }));
              }
            }
          }

          // Update last input state
          setMenuNavigation(prev => ({
            ...prev,
            lastDpadInput: { x: leftPressed || rightPressed ? (leftPressed ? -1 : 1) : 0, y: 0 }
          }));
          
          // Action buttons (X/Cross and Circle for PS4/PS5)
          const actionButton = gp.buttons[0] && gp.buttons[0].pressed; // X/Cross
          const backButton = gp.buttons[1] && gp.buttons[1].pressed; // Circle
          
          // Use a ref to debounce presses
          if (!pollGamepad.lastMenuState) pollGamepad.lastMenuState = { x: false, circle: false };
          
          if (actionButton && !pollGamepad.lastMenuState.x) {
            if (isPaused) {
              if (menuNavigation.pauseMenuFocus === 0) {
                setIsPaused(false); // Resume game
              } else {
                onBackToMenu ? onBackToMenu() : window.location.reload(); // Main menu
              }
            } else if (gameOver.active) {
              if (menuNavigation.gameOverMenuFocus === 0) {
                // Play Again
                playerRef.current.health = playerRef.current.maxHealth;
                enemyRef.current.health = enemyRef.current.maxHealth;
                playerRef.current.x = 150;
                enemyRef.current.x = 1050;
                playerRef.current.y = GROUND_Y;
                enemyRef.current.y = GROUND_Y;
                playerRef.current.vx = 0;
                playerRef.current.vy = 0;
                enemyRef.current.vx = 0;
                enemyRef.current.vy = 0;
                playerRef.current.currentAnimation = 'idle';
                enemyRef.current.currentAnimation = 'idle';
                playerRef.current.isAttacking = false;
                enemyRef.current.isAttacking = false;
                playerRef.current.attackCooldown = 0;
                enemyRef.current.attackCooldown = 0;
                setGameOver({ active: false, winner: null, message: '' });
                setPlayer({ ...playerRef.current });
                setEnemy({ ...enemyRef.current });
              } else {
                onBackToMenu ? onBackToMenu() : window.location.reload(); // Main menu
              }
            }
          }
          
          // Back button (Circle) to resume from pause
          if (backButton && !pollGamepad.lastMenuState.circle) {
            if (isPaused && !gameOver.active) {
              setIsPaused(false);
            }
          }
          
          pollGamepad.lastMenuState.x = actionButton;
          pollGamepad.lastMenuState.circle = backButton;
        }
        return; // Don't process normal game controls
      }
      
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads[0];
      
      if (gp) {
        const gamepadType = detectGamepadType(gp);
        
        // PS5 DualSense specific mappings
        const buttonMap = {
          PS5: {
            leftPunch: [2], // Square 🔲
            rightPunch: [3], // Triangle 🔺  
            leftKick: [0], // X/Cross ❌
            rightKick: [1], // Circle ⭕
            special: [4, 5], // L1 and R1
            pause: [9], // Options button
            heavy: [6, 7] // L2 and R2 triggers
          },
          Xbox: {
            leftPunch: [2], // X button
            rightPunch: [3], // Y button
            leftKick: [0], // A button  
            rightKick: [1], // B button
            special: [4, 5], // LB and RB
            pause: [7], // Menu button
            heavy: [6, 7] // LT and RT triggers
          },
          Generic: {
            leftPunch: [2], // Button 2
            rightPunch: [3], // Button 3
            leftKick: [0], // Button 0
            rightKick: [1], // Button 1
            special: [4, 5], // Button 4 and 5
            pause: [8, 9], // Button 8 and 9
            heavy: [6, 7] // Button 6 and 7
          }
        };
        
        const controls = buttonMap[gamepadType] || buttonMap.Generic;
        
        // Analog stick movement (with deadzone)
        const leftStickX = gp.axes[0];
        const leftStickY = gp.axes[1];
        const rightStickX = gp.axes[2];
        const rightStickY = gp.axes[3];
        
        // D-pad support (axes 4-7 or buttons 12-15 depending on controller)
        let dpadX = 0, dpadY = 0;
        if (gp.axes.length > 6) {
          dpadX = gp.axes[6];
          dpadY = gp.axes[7];
        } else {
          // D-pad as buttons
          if (gp.buttons[14]?.pressed) dpadX = -1; // Left
          if (gp.buttons[15]?.pressed) dpadX = 1;  // Right
          if (gp.buttons[12]?.pressed) dpadY = -1; // Up
          if (gp.buttons[13]?.pressed) dpadY = 1;  // Down
        }
        
        // Movement (analog stick + d-pad)
        const moveX = Math.abs(leftStickX) > 0.15 ? leftStickX : dpadX;
        
        if (moveX < -0.15) {
          playerRef.current.vx = -PLAYER_SPEED * Math.abs(moveX); // Variable speed based on stick position
          playerRef.current.facing = 'left';
        } else if (moveX > 0.15) {
          playerRef.current.vx = PLAYER_SPEED * Math.abs(moveX);
          playerRef.current.facing = 'right';
        } else {
          playerRef.current.vx = 0;
        }
        
        // Jump using D-pad up or left analog stick up
        const dpadUpPressed = dpadY < -0.5; // D-pad up
        const analogUpPressed = leftStickY < -0.5; // Left analog stick up
        const jumpPressed = dpadUpPressed || analogUpPressed;
        
        if (jumpPressed && playerRef.current.onGround) {
          playerRef.current.vy = -JUMP_POWER;
          playerRef.current.onGround = false;
          console.log(`${gamepadType} controller: Jump activated via D-pad/analog stick`);
        }
        
        // Enhanced Combat Controls (PS4/PS5 Controller Mapping)
        let newActiveKeys = { ...activeKeys };
        
        // Left Punch - Square 🔲
        const leftPunchPressed = controls.leftPunch?.some(btn => gp.buttons[btn]?.pressed);
        const lastLeftPunchPressed = controls.leftPunch?.some(btn => lastGamepadState.buttons[btn]);
        if (leftPunchPressed && !lastLeftPunchPressed) {
          performCombatAttack('left-punch');
          newActiveKeys.q = true;
          console.log(`${gamepadType} controller: Left Punch (Square) activated`);
        } else if (!leftPunchPressed) {
          newActiveKeys.q = false;
        }

        // Right Punch - Triangle 🔺
        const rightPunchPressed = controls.rightPunch?.some(btn => gp.buttons[btn]?.pressed);
        const lastRightPunchPressed = controls.rightPunch?.some(btn => lastGamepadState.buttons[btn]);
        if (rightPunchPressed && !lastRightPunchPressed) {
          performCombatAttack('right-punch');
          newActiveKeys.e = true;
          console.log(`${gamepadType} controller: Right Punch (Triangle) activated`);
        } else if (!rightPunchPressed) {
          newActiveKeys.e = false;
        }

        // Left Kick - X/Cross ❌
        const leftKickPressed = controls.leftKick?.some(btn => gp.buttons[btn]?.pressed);
        const lastLeftKickPressed = controls.leftKick?.some(btn => lastGamepadState.buttons[btn]);
        if (leftKickPressed && !lastLeftKickPressed) {
          performCombatAttack('left-kick');
          newActiveKeys.f = true;
          console.log(`${gamepadType} controller: Left Kick (X/Cross) activated`);
        } else if (!leftKickPressed) {
          newActiveKeys.f = false;
        }

        // Right Kick - Circle ⭕ (Note: Circle is also used for jump, but different timing)
        const rightKickPressed = controls.rightKick?.some(btn => gp.buttons[btn]?.pressed);
        const lastRightKickPressed = controls.rightKick?.some(btn => lastGamepadState.buttons[btn]);
        if (rightKickPressed && !lastRightKickPressed && !jumpPressed) { // Prevent conflict with jump
          performCombatAttack('right-kick');
          newActiveKeys.g = true;
          console.log(`${gamepadType} controller: Right Kick (Circle) activated`);
        } else if (!rightKickPressed) {
          newActiveKeys.g = false;
        }

        setActiveKeys(newActiveKeys);

        // Special Move (shoulder buttons)
        const specialPressed = controls.special.some(btn => gp.buttons[btn]?.pressed);
        const lastSpecialPressed = controls.special.some(btn => lastGamepadState.buttons[btn]);
        
        if (specialPressed && !lastSpecialPressed && specialMeter.player >= 100 && !playerRef.current.isAttacking) {
          console.log(`${gamepadType} controller: Special move activated`);
          playerRef.current.isAttacking = true;
          playerRef.current.currentAnimation = 'punch_quad';
          playerRef.current.attackCooldown = 45;
          
          // Consume special meter
          setSpecialMeter(prev => ({ ...prev, player: 0 }));
          
          // Enhanced screen shake for special
          setScreenShake({ active: true, intensity: 12, timer: 30 });
          
          // Check if special hits enemy (longer range)
          const distance = Math.abs(playerRef.current.x - enemyRef.current.x);
          if (distance < CHARACTER_WIDTH + 50) {
            const specialDamage = playerRef.current.attack * 3;
            enemyRef.current.health = Math.max(0, enemyRef.current.health - specialDamage);
            
            // Create special move particles
            createParticles(enemyRef.current.x, enemyRef.current.y - 50, '#ffd700', 8, 'explosion');
            createParticles(enemyRef.current.x, enemyRef.current.y - 50, '#ffffff', 6, 'spark');
            createParticles(enemyRef.current.x, enemyRef.current.y - 50, '#ffaa00', 2, 'shockwave');
            
            // Massive knockback
            const knockbackForce = 15;
            if (playerRef.current.x < enemyRef.current.x) {
              enemyRef.current.vx = knockbackForce;
            } else {
              enemyRef.current.vx = -knockbackForce;
            }
            enemyRef.current.vy = -8;
            enemyRef.current.onGround = false;
            
            // Reset combo for massive hit
            setCombo(prev => ({ ...prev, player: 10, timer: 300 }));
            
            // Enhanced PS5 haptic feedback for special moves
            if (gamepadType === 'PS5' && gp.vibrationActuator) {
              gp.vibrationActuator.playEffect('dual-rumble', {
                duration: 500,
                strongMagnitude: 1.0,
                weakMagnitude: 0.8
              }).catch(() => {
                console.log('Enhanced haptic feedback not supported');
              });
            }
          }
        }
        
        // Heavy Attack (trigger buttons)
        const heavyPressed = controls.heavy.some(btn => gp.buttons[btn]?.pressed);
        const lastHeavyPressed = controls.heavy.some(btn => lastGamepadState.buttons[btn]);
        
        if (heavyPressed && !lastHeavyPressed && !playerRef.current.isAttacking && playerRef.current.attackCooldown === 0) {
          console.log(`${gamepadType} controller: Heavy attack activated`);
          playerRef.current.isAttacking = true;
          playerRef.current.currentAnimation = 'punch_quad';
          playerRef.current.attackCooldown = 40;
          
          // Check if heavy attack hits enemy
          const distance = Math.abs(playerRef.current.x - enemyRef.current.x);
          if (distance < CHARACTER_WIDTH + 30) {
            const heavyDamage = Math.floor(playerRef.current.attack * 1.5);
            enemyRef.current.health = Math.max(0, enemyRef.current.health - heavyDamage);
            
            // Build special meter faster for heavy attacks
            setSpecialMeter(prev => ({ ...prev, player: Math.min(100, prev.player + 20) }));
            
            // Create heavy attack particles
            createParticles(enemyRef.current.x, enemyRef.current.y - 50, '#ff8800', 6, 'explosion');
            createParticles(enemyRef.current.x, enemyRef.current.y - 50, '#ffff00', 4, 'spark');
            
            // Trigger collision animation
            const collisionX = (playerRef.current.x + enemyRef.current.x) / 2;
            const collisionY = Math.min(playerRef.current.y, enemyRef.current.y) - 20;
            triggerCollisionAnimation(collisionX, collisionY);
          }
        }
        
        // Pause (Options/Menu button)
        const pausePressed = controls.pause.some(btn => gp.buttons[btn]?.pressed);
        const lastPausePressed = controls.pause.some(btn => lastGamepadState.buttons[btn]);
        
        if (pausePressed && !lastPausePressed) {
          console.log(`${gamepadType} controller: Pause toggled`);
          setIsPaused(prev => !prev);
        }
        
        // Store current state for next frame comparison
        lastGamepadState = {
          buttons: gp.buttons.map(btn => btn?.pressed || false),
          axes: [...gp.axes]
        };
        
        // Update connected gamepad info
        if (connectedGamepad.type !== gamepadType) {
          setConnectedGamepad({ type: gamepadType, name: gp.id });
          console.log(`🎮 ${gamepadType} Controller Connected: ${gp.id}`);
        }
        
        // Log controller info (only occasionally to avoid spam)
        if (Math.random() < 0.001) { // Very rare logging
          console.log(`Connected: ${gamepadType} Controller (${gp.id})`);
        }
      } else if (connectedGamepad.type) {
        // Controller disconnected
        setConnectedGamepad({ type: null, name: null });
        console.log('🎮 Controller Disconnected');
      }
    }
    gamepadInterval = setInterval(pollGamepad, 16);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(gamepadInterval);
    };
  }, [isPaused, gameOver.active]);

  return (
    <div style={{ textAlign: 'center', marginTop: '2rem', position: 'relative' }}>
      <canvas ref={canvasRef} width={1200} height={500} style={{ background: 'linear-gradient(180deg, #1a1a3a 60%, #222 100%)', borderRadius: '12px', boxShadow: '0 2px 16px #0008', maxWidth: '100%' }} />
      
      {/* Pause Overlay */}
      {isPaused && !gameOver.active && (
        <div 
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '12px',
            color: '#fff',
            pointerEvents: 'auto'
          }}
          onClick={(e) => {
            console.log('Pause overlay clicked');
            e.stopPropagation();
          }}
        >
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '3rem', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>⏸️ PAUSED</h2>
          <p style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', opacity: 0.9 }}>Press ESC or P to resume</p>
          <p style={{ margin: '0 0 2rem 0', fontSize: '1rem', opacity: 0.7 }}>🎮 Use D-pad/Left Stick ← → and ❌ X to navigate</p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => setIsPaused(false)}
              style={{
                padding: '12px 24px',
                fontSize: '1.1rem',
                backgroundColor: menuNavigation.pauseMenuFocus === 0 ? '#357abd' : '#4facfe',
                color: '#fff',
                border: menuNavigation.pauseMenuFocus === 0 ? '3px solid #fff' : 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: menuNavigation.pauseMenuFocus === 0 ? '0 6px 16px rgba(79, 172, 254, 0.5)' : '0 4px 12px rgba(79, 172, 254, 0.3)',
                transition: 'all 0.2s ease',
                transform: menuNavigation.pauseMenuFocus === 0 ? 'scale(1.05)' : 'scale(1)'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#357abd';
                setMenuNavigation(prev => ({ ...prev, pauseMenuFocus: 0 }));
              }}
              onMouseOut={(e) => {
                if (menuNavigation.pauseMenuFocus !== 0) e.target.style.backgroundColor = '#4facfe';
              }}
            >
              ▶️ Resume Game
            </button>
            <button
              onClick={(e) => {
                console.log('Main Menu button clicked!');
                console.log('onBackToMenu function:', onBackToMenu);
                e.preventDefault();
                e.stopPropagation();
                
                try {
                  if (onBackToMenu && typeof onBackToMenu === 'function') {
                    console.log('Calling onBackToMenu...');
                    onBackToMenu();
                  } else {
                    console.log('onBackToMenu not available or not a function, trying fallback navigation...');
                    // Try using window.location as a fallback
                    window.location.href = '/';
                  }
                } catch (error) {
                  console.error('Error in main menu navigation:', error);
                  // Last resort fallback
                  window.location.reload();
                }
              }}
              style={{
                padding: '12px 24px',
                fontSize: '1.1rem',
                backgroundColor: menuNavigation.pauseMenuFocus === 1 ? '#ff3838' : '#ff4757',
                color: '#fff',
                border: menuNavigation.pauseMenuFocus === 1 ? '3px solid #fff' : 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: menuNavigation.pauseMenuFocus === 1 ? '0 6px 16px rgba(255, 71, 87, 0.5)' : '0 4px 12px rgba(255, 71, 87, 0.3)',
                transition: 'all 0.2s ease',
                transform: menuNavigation.pauseMenuFocus === 1 ? 'scale(1.05)' : 'scale(1)',
                zIndex: 1000
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#ff3838';
                setMenuNavigation(prev => ({ ...prev, pauseMenuFocus: 1 }));
              }}
              onMouseOut={(e) => {
                if (menuNavigation.pauseMenuFocus !== 1) e.target.style.backgroundColor = '#ff4757';
              }}
            >
              🏠 Main Menu
            </button>
          </div>
        </div>
      )}
      
      {/* Game Over Overlay */}
      {gameOver.active && (
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: '12px',
          color: '#fff'
        }}>
          <h1 style={{ 
            margin: '0 0 1rem 0', 
            fontSize: '4rem', 
            textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
            color: gameOver.winner === 'player' ? '#2ed573' : '#ff4757'
          }}>
            {gameOver.winner === 'player' ? '🎉 VICTORY!' : '💀 YOU LOSE!'}
          </h1>
          <p style={{ 
            margin: '0 0 2rem 0', 
            fontSize: '1.5rem', 
            opacity: 0.9,
            textAlign: 'center'
          }}>
            {gameOver.message}
          </p>
          <p style={{ margin: '0 0 2rem 0', fontSize: '1rem', opacity: 0.7, textAlign: 'center' }}>🎮 Use D-pad/Left Stick ← → and ❌ X to navigate</p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => {
                // Reset game state
                playerRef.current.health = playerRef.current.maxHealth;
                enemyRef.current.health = enemyRef.current.maxHealth;
                playerRef.current.x = 150;
                enemyRef.current.x = 1050;
                playerRef.current.y = GROUND_Y;
                enemyRef.current.y = GROUND_Y;
                playerRef.current.vx = 0;
                playerRef.current.vy = 0;
                enemyRef.current.vx = 0;
                enemyRef.current.vy = 0;
                playerRef.current.currentAnimation = 'idle';
                enemyRef.current.currentAnimation = 'idle';
                playerRef.current.isAttacking = false;
                enemyRef.current.isAttacking = false;
                playerRef.current.attackCooldown = 0;
                enemyRef.current.attackCooldown = 0;
                setGameOver({ active: false, winner: null, message: '' });
                setPlayer({ ...playerRef.current });
                setEnemy({ ...enemyRef.current });
              }}
              style={{
                padding: '12px 24px',
                fontSize: '1.1rem',
                backgroundColor: menuNavigation.gameOverMenuFocus === 0 ? '#20bf6b' : '#2ed573',
                color: '#fff',
                border: menuNavigation.gameOverMenuFocus === 0 ? '3px solid #fff' : 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: menuNavigation.gameOverMenuFocus === 0 ? '0 6px 16px rgba(46, 213, 115, 0.5)' : '0 4px 12px rgba(46, 213, 115, 0.3)',
                transition: 'all 0.2s ease',
                transform: menuNavigation.gameOverMenuFocus === 0 ? 'scale(1.05)' : 'scale(1)'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#20bf6b';
                setMenuNavigation(prev => ({ ...prev, gameOverMenuFocus: 0 }));
              }}
              onMouseOut={(e) => {
                if (menuNavigation.gameOverMenuFocus !== 0) e.target.style.backgroundColor = '#2ed573';
              }}
            >
              🔄 Play Again
            </button>
            <button
              onClick={(e) => {
                console.log('Game Over Main Menu button clicked!');
                console.log('onBackToMenu function:', onBackToMenu);
                e.preventDefault();
                e.stopPropagation();
                
                try {
                  if (onBackToMenu && typeof onBackToMenu === 'function') {
                    console.log('Calling onBackToMenu from game over...');
                    onBackToMenu();
                  } else {
                    console.log('onBackToMenu not available from game over, trying fallback navigation...');
                    // Try using window.location as a fallback
                    window.location.href = '/';
                  }
                } catch (error) {
                  console.error('Error in game over main menu navigation:', error);
                  // Last resort fallback
                  window.location.reload();
                }
              }}
              style={{
                padding: '12px 24px',
                fontSize: '1.1rem',
                backgroundColor: menuNavigation.gameOverMenuFocus === 1 ? '#ff3838' : '#ff4757',
                color: '#fff',
                border: menuNavigation.gameOverMenuFocus === 1 ? '3px solid #fff' : 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: menuNavigation.gameOverMenuFocus === 1 ? '0 6px 16px rgba(255, 71, 87, 0.5)' : '0 4px 12px rgba(255, 71, 87, 0.3)',
                transition: 'all 0.2s ease',
                transform: menuNavigation.gameOverMenuFocus === 1 ? 'scale(1.05)' : 'scale(1)',
                zIndex: 1000
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#ff3838';
                setMenuNavigation(prev => ({ ...prev, gameOverMenuFocus: 1 }));
              }}
              onMouseOut={(e) => {
                if (menuNavigation.gameOverMenuFocus !== 1) e.target.style.backgroundColor = '#ff4757';
              }}
            >
              🏠 Main Menu
            </button>
          </div>
        </div>
      )}
      
      <div style={{ marginTop: '1rem', color: '#fff', lineHeight: '1.6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', maxWidth: '1200px', margin: '0 auto', gap: '2rem' }}>
          <div style={{ textAlign: 'left', flex: 1 }}>
            <div><strong>🎮 Basic Controls:</strong></div>
            <div>Move: ← → / A D / Left Stick</div>
            <div>Jump: ↑ W Space / D-pad ↑ / Left Stick ↑</div>
            <div>Pause: ESC P / Options (PS5) / Menu (Xbox)</div>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div><strong>🥊 Enhanced Combat:</strong></div>
            <div>Left Punch: Q / 🔲 Square (PS4/PS5)</div>
            <div>Right Punch: E / 🔺 Triangle (PS4/PS5)</div>
            <div>Left Kick: F / ❌ X/Cross (PS4/PS5)</div>
            <div>Right Kick: G / ⭕ Circle (PS4/PS5)</div>
            <div style={{ color: '#ffd700', marginTop: '0.3rem' }}>💥 Combo: Press both punches/kicks together!</div>
          </div>
          <div style={{ textAlign: 'right', flex: 1 }}>
            <div><strong>💡 Combat Tips:</strong></div>
            <div>🥊 Double Punch: 1.8x damage</div>
            <div>🦵 Double Kick: 2.2x damage</div>
            <div>⚡ Kicks are stronger than punches</div>
            <div>🔥 Build combos for bonus damage!</div>
            <div>⭐ Special: Z (when meter full)</div>
          </div>
        </div>
        <div style={{ 
          marginTop: '0.5rem', 
          fontSize: '0.9rem', 
          opacity: 0.8,
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem'
        }}>
          <span>Player: {player.name} vs Enemy: {enemy.name}</span>
          <span>Sprites: {spritesLoaded.player ? '✅' : '⏳'} / {spritesLoaded.enemy ? '✅' : '⏳'}</span>
          <span>Particles: {particles.length}</span>
          {connectedGamepad.type && (
            <span style={{ color: '#4facfe' }}>
              🎮 {connectedGamepad.type} Controller
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SideScroller;
