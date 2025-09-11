import React, { useRef, useEffect, useState } from 'react';

const PLAYER_SPEED = 5;
const JUMP_POWER = 12;
const GRAVITY = 0.7;
const GROUND_Y = 320;
const CHARACTER_WIDTH = 120; // Reduced from 200 for smaller collision boxes
const CHARACTER_HEIGHT = 140; // Reduced from 200 for smaller collision boxes

// Sprite animation configuration
const SPRITE_CONFIG = {
  frameWidth: 48,
  frameHeight: 48,
  animations: {
    idle: { frames: 4, speed: 8, file: 'Male_spritesheet_idle.png' },
    run: { frames: 6, speed: 6, file: 'Male_spritesheet_run.png' },
    jump: { frames: 3, speed: 4, file: 'Male_spritesheet_run_jump.png' },
    punch1: { frames: 4, speed: 3, file: 'Male_spritesheet_punch_1.png' },
    punch2: { frames: 4, speed: 3, file: 'Male_spritesheet_punch_2.png' },
    falling: { frames: 2, speed: 8, file: 'Male_spritesheet_falling_idle.png' },
    landing: { frames: 3, speed: 4, file: 'Male_spritesheet_falling_landing.png' }
  }
};

// Sprite Animation Class
class SpriteAnimation {
  constructor(imagePath, config, onLoad) {
    this.image = new Image();
    this.image.src = imagePath;
    this.config = config;
    this.currentFrame = 0;
    this.frameCounter = 0;
    this.currentAnimation = 'idle';
    this.loaded = false;
    this.onLoad = onLoad;
    
    this.image.onload = () => {
      this.loaded = true;
      console.log('Sprite loaded successfully:', imagePath);
      if (this.onLoad) this.onLoad();
    };
    
    this.image.onerror = () => {
      console.error('Failed to load sprite:', imagePath);
    };
  }
  
  setAnimation(animationName) {
    if (this.currentAnimation !== animationName) {
      this.currentAnimation = animationName;
      this.currentFrame = 0;
      this.frameCounter = 0;
    }
  }
  
  update() {
    if (!this.loaded) return;
    
    const anim = this.config.animations[this.currentAnimation];
    if (!anim) return;
    
    this.frameCounter++;
    if (this.frameCounter >= anim.speed) {
      this.currentFrame = (this.currentFrame + 1) % anim.frames;
      this.frameCounter = 0;
    }
  }
  
  draw(ctx, x, y, flipX = false) {
    console.log('=== SPRITE DRAW START ===');
    console.log('Loaded:', this.loaded);
    console.log('Image.src:', this.image.src);
    console.log('Image.complete:', this.image.complete);
    console.log('Image.naturalWidth:', this.image.naturalWidth);
    console.log('Image.naturalHeight:', this.image.naturalHeight);
    console.log('Position x:', x, 'y:', y);
    
    // Always try to draw the image if it exists, even if loaded flag is false
    if (this.image.complete && this.image.naturalWidth > 0) {
      console.log('Image is complete, attempting to draw...');
      
      const spriteSize = 96;
      
      ctx.save();
      if (flipX) {
        ctx.scale(-1, 1);
        x = -x;
      }
      
      try {
        console.log('Drawing sprite at:', x - spriteSize/2, y - spriteSize, 'size:', spriteSize);
        
        // Draw debug rectangle to show where sprite should be
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - spriteSize/2, y - spriteSize, spriteSize, spriteSize);
        
        // Draw the entire image (not just first frame for now)
        ctx.drawImage(
          this.image,
          0, 0, this.image.naturalWidth, this.image.naturalHeight, // Source: entire image
          x - spriteSize/2, y - spriteSize, spriteSize, spriteSize // Destination
        );
        console.log('Successfully drew sprite');
      } catch (error) {
        console.error('Error drawing sprite:', error);
        this.drawFallback(ctx, x, y);
      }
      
      ctx.restore();
    } else {
      console.log('Image not ready - drawing emoji fallback');
      this.drawFallback(ctx, x, y);
    }
    
    console.log('=== SPRITE DRAW END ===');
  }
  
  drawFallback(ctx, x, y) {
    ctx.font = '48px serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.fillText('🤖', x, y);
  }
}

const SideScroller = ({ character }) => {
  const canvasRef = useRef(null);
  const playerSpriteRef = useRef(null);
  const enemySpriteRef = useRef(null);
  
  const playerRef = useRef({
    x: 100,
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
    x: 700,
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

  // Initialize sprites
  useEffect(() => {
    console.log('Initializing sprites...');
    
    // Simple image loading - no complex animation system
    const playerImg = new Image();
    playerImg.onload = () => {
      console.log('Player image loaded:', playerImg.naturalWidth, 'x', playerImg.naturalHeight);
      playerSpriteRef.current = { image: playerImg, loaded: true };
    };
    playerImg.onerror = (err) => {
      console.error('Player image failed to load:', err);
      playerSpriteRef.current = { image: null, loaded: false };
    };
    playerImg.src = '/assets/sprites/SplitAnimations/Male_spritesheet_idle.png';
    
    const enemyImg = new Image();
    enemyImg.onload = () => {
      console.log('Enemy image loaded:', enemyImg.naturalWidth, 'x', enemyImg.naturalHeight);
      enemySpriteRef.current = { image: enemyImg, loaded: true };
    };
    enemyImg.onerror = (err) => {
      console.error('Enemy image failed to load:', err);
      enemySpriteRef.current = { image: null, loaded: false };
    };
    enemyImg.src = '/assets/sprites/SplitAnimations/Male_spritesheet_idle.png';
    
    console.log('Sprite refs created:', {
      player: !!playerSpriteRef.current,
      enemy: !!enemySpriteRef.current
    });
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
      
      // TEST: Draw some static particles to verify rendering works - ENHANCED
      ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
      ctx.shadowColor = '#ffff00';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(100, 100, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(200, 150, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
      ctx.shadowColor = '#00ff00';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(300, 200, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Update and draw player sprite - SIMPLIFIED
      console.log('Drawing player - sprite loaded:', !!playerSpriteRef.current?.loaded);
      if (playerSpriteRef.current?.loaded && playerSpriteRef.current.image) {
        const spriteSize = 200; // Much larger size
        const img = playerSpriteRef.current.image;
        
        console.log('Player sprite details:');
        console.log('- Image complete:', img.complete);
        console.log('- Image naturalWidth:', img.naturalWidth);
        console.log('- Image naturalHeight:', img.naturalHeight);
        console.log('- Image src:', img.src);
        console.log('- Canvas context:', !!ctx);
        console.log('- Player position:', playerRef.current.x, playerRef.current.y);
        console.log('- Sprite size:', spriteSize);
        console.log('- Draw position will be:', playerRef.current.x - spriteSize/2, playerRef.current.y - spriteSize);
        
        try {
          console.log('Drawing player sprite at:', playerRef.current.x, playerRef.current.y);
          
          // Draw green debug rectangle
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 2;
          ctx.strokeRect(playerRef.current.x - spriteSize/2, playerRef.current.y - spriteSize, spriteSize, spriteSize);
          console.log('Debug rectangle drawn successfully');
          
          // Test if we can draw the image at all - try drawing it smaller first
          console.log('Attempting to draw image...');
          
          // Calculate frame size for 18-frame sprite sheet (6x3 grid)
          const framesPerRow = 6;
          const framesPerColumn = 3;
          const frameWidth = img.naturalWidth / framesPerRow; 
          const frameHeight = img.naturalHeight / framesPerColumn;
          
          // Get current frame based on animation - limit to first frame for now
          let currentFrame = 0; // Always use first frame
          const animSpeed = 10; // Frames between animation changes
          
          // For now, just show the first frame (top-left)
          // Later we can add proper animation cycling
          
          // Calculate source position for first frame only
          const frameX = 0; // Always first column
          const frameY = 0; // Always first row
          
          console.log('Player sprite animation:');
          console.log('- Animation:', playerRef.current.currentAnimation);
          console.log('- Using frame 0 (first frame)');
          console.log('- Frame size:', frameWidth, 'x', frameHeight);
          console.log('- Frame position:', frameX, frameY);
          
          // Draw only the first frame
          ctx.drawImage(
            img,
            frameX, frameY, frameWidth, frameHeight, // Source: first frame only
            playerRef.current.x - spriteSize/2, playerRef.current.y - spriteSize, // Position
            spriteSize, spriteSize // Size (200x200)
          );
          console.log('Drew first frame from 4x1 layout');
          
        } catch (error) {
          console.error('Error drawing player sprite:', error);
          console.error('Error stack:', error.stack);
        }
      } else {
        console.log('Player sprite not loaded - drawing emoji');
        // Fallback emoji
        ctx.font = '96px serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#4facfe';
        ctx.fillText(playerRef.current.avatar, playerRef.current.x, playerRef.current.y);
      }
      
      // Update and draw enemy sprite - FULL SPRITE SHEET
      if (enemySpriteRef.current?.loaded && enemySpriteRef.current.image) {
        const spriteSize = 200; // Much larger size
        
        try {
          console.log('Drawing enemy sprite sheet - size:', enemySpriteRef.current.image.naturalWidth, 'x', enemySpriteRef.current.image.naturalHeight);
          
          // Draw red debug rectangle
          ctx.strokeStyle = '#ff0000';
          ctx.lineWidth = 2;
          ctx.strokeRect(enemyRef.current.x - spriteSize/2, enemyRef.current.y - spriteSize, spriteSize, spriteSize);
          
          // Calculate frame size for 18-frame sprite sheet (6x3 grid)
          const framesPerRow = 6;
          const framesPerColumn = 3;
          const frameWidth = enemySpriteRef.current.image.naturalWidth / framesPerRow;
          const frameHeight = enemySpriteRef.current.image.naturalHeight / framesPerColumn;
          
          // Get current frame based on animation - limit to first frame for now
          let currentFrame = 0; // Always use first frame
          const animSpeed = 12; // Slightly different speed for enemy
          
          // For now, just show the first frame (top-left)
          // Later we can add proper animation cycling
          
          // Calculate source position for first frame only
          const frameX = 0; // Always first column
          const frameY = 0; // Always first row
          
          console.log('Enemy sprite animation:');
          console.log('- Animation:', enemyRef.current.currentAnimation);
          console.log('- Using frame 0 (first frame)');
          console.log('- Frame size:', frameWidth, 'x', frameHeight);
          
          // Draw only the first frame (flipped for enemy)
          ctx.save();
          ctx.scale(-1, 1);
          ctx.drawImage(
            enemySpriteRef.current.image,
            frameX, frameY, frameWidth, frameHeight, // Source: first frame only
            -enemyRef.current.x - spriteSize/2, enemyRef.current.y - spriteSize, // Position (flipped)
            spriteSize, spriteSize // Size (200x200)
          );
          ctx.restore();
          console.log('Drew enemy first frame from 4x1 layout');
        } catch (error) {
          console.error('Error drawing enemy sprite:', error);
        }
      } else {
        console.log('Enemy sprite not loaded - drawing emoji');
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
      
      // Draw health bars
      const drawHealthBar = (x, y, health, maxHealth, name, isPlayer = true) => {
        const barWidth = 150;
        const barHeight = 12;
        const barX = x - barWidth / 2;
        const barY = y - CHARACTER_HEIGHT - 30;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
        
        // Health bar background
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Health bar fill
        const healthPercent = health / maxHealth;
        const healthWidth = barWidth * healthPercent;
        
        // Color based on health percentage
        if (healthPercent > 0.6) {
          ctx.fillStyle = '#2ed573'; // Green
        } else if (healthPercent > 0.3) {
          ctx.fillStyle = '#ffa502'; // Orange
        } else {
          ctx.fillStyle = '#ff4757'; // Red
        }
        
        ctx.fillRect(barX, barY, healthWidth, barHeight);
        
        // Health bar border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Name and health text
        ctx.font = '14px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(name, x, barY - 8);
        ctx.fillText(`${Math.max(0, Math.floor(health))}/${maxHealth}`, x, barY + barHeight + 16);
        
        // Combo indicator
        const comboCount = isPlayer ? combo.player : combo.enemy;
        if (comboCount > 0) {
          ctx.font = 'bold 12px Arial';
          ctx.fillStyle = '#ffd700';
          ctx.fillText(`${comboCount}x COMBO!`, x, barY + barHeight + 30);
        }
        
        // Special meter for player
        if (isPlayer) {
          const meterWidth = 100;
          const meterHeight = 6;
          const meterX = x - meterWidth / 2;
          const meterY = barY + barHeight + (comboCount > 0 ? 45 : 35);
          
          // Special meter background
          ctx.fillStyle = '#333';
          ctx.fillRect(meterX, meterY, meterWidth, meterHeight);
          
          // Special meter fill
          const specialPercent = specialMeter.player / 100;
          const specialWidth = meterWidth * specialPercent;
          
          if (specialPercent >= 1) {
            ctx.fillStyle = '#ffd700'; // Gold when full
          } else {
            ctx.fillStyle = '#4facfe'; // Blue when building
          }
          
          ctx.fillRect(meterX, meterY, specialWidth, meterHeight);
          
          // Special meter border
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;
          ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);
          
          // Special meter label
          ctx.font = '10px Arial';
          ctx.fillStyle = '#fff';
          ctx.textAlign = 'center';
          const specialText = specialPercent >= 1 ? 'SPECIAL READY!' : 'Special';
          ctx.fillText(specialText, x, meterY - 3);
        }
      };
      
      // Draw health bars for both characters
      drawHealthBar(playerRef.current.x, playerRef.current.y, playerRef.current.health, playerRef.current.maxHealth, playerRef.current.name, true);
      drawHealthBar(enemyRef.current.x, enemyRef.current.y, enemyRef.current.health, enemyRef.current.maxHealth, enemyRef.current.name, false);
      
      // Draw collision boxes (for debugging - make them less prominent)
      if (true) { // Enable collision boxes to see the new smaller size
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)'; // More transparent green boxes
        ctx.lineWidth = 1;
        ctx.strokeRect(playerRef.current.x - CHARACTER_WIDTH/2, playerRef.current.y - CHARACTER_HEIGHT, CHARACTER_WIDTH, CHARACTER_HEIGHT);
        ctx.strokeRect(enemyRef.current.x - CHARACTER_WIDTH/2, enemyRef.current.y - CHARACTER_HEIGHT, CHARACTER_WIDTH, CHARACTER_HEIGHT);
      }
      
      // Draw and update particles - ENHANCED PARTICLE SYSTEM
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
        
        // AUTO TEST: Disabled to reduce particle spam
        // if (Math.floor(gameTime / 180) !== Math.floor((gameTime - 1) / 180)) { // Every 3 seconds (180 frames)
        //   console.log('=== AUTO PARTICLE TEST ===');
        //   createParticles(400, 200, '#ffff00', 8, 'explosion');
        //   createParticles(400, 200, '#ffffff', 6, 'spark');
        //   createParticles(400, 200, '#ff8800', 2, 'shockwave');
        //   createParticles(450, 200, '#ff0000', 5, 'debris');
        //   console.log('Auto-created test particles at center of screen');
        // }
        
        // Enhanced particle rendering with better visibility
        ctx.save(); // Save context state
        
        updatedParticles.forEach((particle, index) => {
          const alpha = Math.max(0.4, particle.life / particle.maxLife); // Higher minimum alpha
          
          if (particle.type === 'explosion') {
            // Explosive particles with glow and rotation
            ctx.save();
            ctx.translate(particle.x, particle.y);
            ctx.rotate(particle.rotation);
            
            // Outer glow
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = 25;
            ctx.fillStyle = `rgba(255, 200, 0, ${alpha * 0.6})`;
            ctx.beginPath();
            ctx.arc(0, 0, particle.size * 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Main particle
            ctx.fillStyle = `rgba(255, 200, 0, ${alpha})`;
            ctx.beginPath();
            ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Inner bright core
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
            ctx.beginPath();
            ctx.arc(0, 0, particle.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.shadowBlur = 0;
            ctx.restore();
            
          } else if (particle.type === 'spark') {
            // Electric spark with trail
            ctx.strokeStyle = `rgba(255, 255, 200, ${alpha})`;
            ctx.lineWidth = 4;
            ctx.shadowColor = '#ffff00';
            ctx.shadowBlur = 15;
            
            // Draw trail
            if (particle.trail && particle.trail.length > 1) {
              ctx.beginPath();
              ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
              for (let i = 1; i < particle.trail.length; i++) {
                const trailAlpha = (i / particle.trail.length) * alpha;
                ctx.strokeStyle = `rgba(255, 255, 200, ${trailAlpha})`;
                ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
              }
              ctx.stroke();
            }
            
            // Main spark
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.shadowBlur = 0;
            
          } else if (particle.type === 'shockwave') {
            // Expanding ring shockwave
            const ringAlpha = alpha * 0.8;
            ctx.strokeStyle = `rgba(255, 255, 255, ${ringAlpha})`;
            ctx.lineWidth = 6;
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 20;
            
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.stroke();
            
            // Inner ring
            ctx.strokeStyle = `rgba(100, 200, 255, ${ringAlpha})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * 0.7, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.shadowBlur = 0;
            
          } else if (particle.type === 'debris') {
            // Heavy debris chunks
            let fillColor;
            if (particle.color === '#ff6b6b' || particle.color === '#ff0000' || particle.color === '#ff4444') {
              fillColor = `rgba(255, 100, 100, ${alpha})`;
            } else if (particle.color === '#888888') {
              fillColor = `rgba(200, 200, 200, ${alpha})`;
            } else {
              fillColor = `rgba(200, 160, 120, ${alpha})`; // Brown debris
            }
            
            ctx.fillStyle = fillColor;
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Dark outline for debris
            ctx.strokeStyle = `rgba(0, 0, 0, ${alpha * 0.7})`;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.shadowBlur = 0;
            
          } else {
            // Enhanced normal particles
            let fillColor;
            if (particle.color === '#ffff00' || particle.color === '#ffd700') {
              fillColor = `rgba(255, 255, 0, ${alpha})`;
            } else if (particle.color === '#ff6b6b' || particle.color === '#ff0000' || particle.color === '#ff4444') {
              fillColor = `rgba(255, 100, 100, ${alpha})`;
            } else if (particle.color === '#ffffff') {
              fillColor = `rgba(255, 255, 255, ${alpha})`;
            } else if (particle.color === '#00ff00' || particle.color === '#88ff88') {
              fillColor = `rgba(100, 255, 100, ${alpha})`;
            } else {
              fillColor = `rgba(255, 255, 100, ${alpha})`;
            }
            
            ctx.fillStyle = fillColor;
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = 15;
            
            ctx.beginPath();
            const size = Math.max(12, particle.size * 1.2);
            ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
            ctx.fill();
            
            // Bright white border for maximum visibility
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        });
        
        ctx.restore(); // Restore context state
        
        // Debug info with more details
        if (updatedParticles.length > 0) {
          const explosionCount = updatedParticles.filter(p => p.type === 'explosion').length;
          const sparkCount = updatedParticles.filter(p => p.type === 'spark').length;
          const shockwaveCount = updatedParticles.filter(p => p.type === 'shockwave').length;
          const debrisCount = updatedParticles.filter(p => p.type === 'debris').length;
          const normalCount = updatedParticles.filter(p => p.type === 'normal').length;
          
          console.log(`Rendering ${updatedParticles.length} particles: ${explosionCount} explosion, ${sparkCount} spark, ${shockwaveCount} shockwave, ${debrisCount} debris, ${normalCount} normal`);
        }
        
        return updatedParticles;
      });
    }

    function createParticles(x, y, color, count = 10, type = 'normal') {
      console.log(`=== CREATING PARTICLES ===`);
      console.log(`Position: (${x}, ${y}), Color: ${color}, Count: ${count}, Type: ${type}`);
      
      const newParticles = [];
      
      for (let i = 0; i < count; i++) {
        let particle;
        
        if (type === 'explosion') {
          // Explosive burst particles - radial spread
          const angle = (i / count) * Math.PI * 2;
          const speed = 3 + Math.random() * 8;
          const life = 60 + Math.random() * 40; // Shorter life
          
          particle = {
            x: x + (Math.random() - 0.5) * 20,
            y: y + (Math.random() - 0.5) * 20,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: life,
            maxLife: life,
            color: color,
            size: 8 + Math.random() * 12, // Larger size
            type: 'explosion',
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.3
          };
        } else if (type === 'spark') {
          // Electric spark particles - fast moving
          const angle = Math.random() * Math.PI * 2;
          const speed = 8 + Math.random() * 12;
          const life = 30 + Math.random() * 40; // Shorter life
          
          particle = {
            x: x + (Math.random() - 0.5) * 15,
            y: y + (Math.random() - 0.5) * 15,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: life,
            maxLife: life,
            color: color,
            size: 4 + Math.random() * 8, // Larger size
            type: 'spark',
            trail: [], // For spark trails
            trailLength: 8
          };
        } else if (type === 'shockwave') {
          // Expanding shockwave rings
          const life = 40 + Math.random() * 20; // Shorter life
          
          particle = {
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            life: life,
            maxLife: life,
            color: color,
            size: 10 + Math.random() * 15, // Larger initial size
            type: 'shockwave',
            expansion: 3 + Math.random() * 5 // Faster expansion
          };
        } else if (type === 'debris') {
          // Heavy debris particles - affected by gravity
          const life = 60 + Math.random() * 40; // Shorter life
          
          particle = {
            x: x + (Math.random() - 0.5) * 30,
            y: y + (Math.random() - 0.5) * 30,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6 - 3,
            life: life,
            maxLife: life,
            color: color,
            size: 6 + Math.random() * 10, // Larger size
            type: 'debris',
            bounce: 0.3 + Math.random() * 0.4
          };
        } else {
          // Normal particles - improved default
          const life = 50 + Math.random() * 30; // Shorter life
          
          particle = {
            x: x + (Math.random() - 0.5) * 35,
            y: y + (Math.random() - 0.5) * 35,
            vx: (Math.random() - 0.5) * 7,
            vy: (Math.random() - 0.5) * 7 - 2,
            life: life,
            maxLife: life,
            color: color,
            size: 8 + Math.random() * 12, // Larger size
            type: 'normal'
          };
        }
        
        newParticles.push(particle);
        console.log(`Created particle ${i}: type=${particle.type}, life=${particle.life}, size=${particle.size}`);
      }
      
      console.log(`Adding ${newParticles.length} particles to state`);
      setParticles(prev => {
        const updated = [...prev, ...newParticles];
        console.log(`Total particles after adding: ${updated.length}`);
        return updated;
      });
      
      // Debug log to confirm particles are being created
      console.log(`=== PARTICLES CREATED: ${count} ${type} particles at (${x}, ${y}) ===`);
    }

    function triggerCollisionAnimation(x, y) {
      setCollisionAnimation({ active: true, x, y, timer: 30 });
      setScreenShake({ active: true, intensity: 8, timer: 20 });
      
      // REDUCED COLLISION PARTICLE EFFECTS
      
      // 1. Main explosion burst (reduced)
      createParticles(x, y, '#ffff00', 5, 'explosion'); // Yellow explosion
      createParticles(x, y, '#ff8800', 3, 'explosion'); // Orange explosion
      
      // 2. Electric sparks (reduced)
      createParticles(x, y, '#ffffff', 6, 'spark'); // White electric sparks
      
      // 3. Shockwave rings (reduced)
      createParticles(x, y, '#ffffff', 1, 'shockwave'); // White shockwaves
      
      // 4. Impact debris (reduced)
      createParticles(x, y, '#888888', 4, 'debris'); // Gray debris
      
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

    function update() {
      // Check for game over conditions first
      if (playerRef.current.health <= 0 && !gameOver.active) {
        setGameOver({ 
          active: true, 
          winner: 'enemy', 
          message: `${enemyRef.current.name} Wins! You Lose!` 
        });
        return; // Stop updating game
      }
      
      if (enemyRef.current.health <= 0 && !gameOver.active) {
        setGameOver({ 
          active: true, 
          winner: 'player', 
          message: `${playerRef.current.name} Wins! Victory!` 
        });
        return; // Stop updating game
      }
      
      // Don't update game if game is over
      if (gameOver.active) return;
      
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
        
        // Build enemy special meter
        setSpecialMeter(prev => ({ ...prev, enemy: Math.min(100, prev.enemy + 10) }));
        
        // Create damage particles for enemy attacks (reduced)
        createParticles(playerRef.current.x, playerRef.current.y - 50, '#ff0000', 3, 'explosion');
        createParticles(playerRef.current.x, playerRef.current.y - 50, '#ffffff', 2, 'spark');
        
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
      } else if ((e.key === 'x' || e.key === 'X') && !playerRef.current.isAttacking && playerRef.current.attackCooldown === 0) {
        // Attack
        console.log('=== PLAYER ATTACK ===');
        console.log('Player position:', playerRef.current.x);
        console.log('Enemy position:', enemyRef.current.x);
        console.log('Player attack power:', playerRef.current.attack);
        console.log('Enemy health before:', enemyRef.current.health);
        
        playerRef.current.isAttacking = true;
        playerRef.current.currentAnimation = Math.random() < 0.5 ? 'punch1' : 'punch2';
        playerRef.current.attackCooldown = 30;
        
        // Check if attack hits enemy
        const distance = Math.abs(playerRef.current.x - enemyRef.current.x);
        console.log('Attack distance:', distance, 'Required distance:', CHARACTER_WIDTH + 20);
        
        if (distance < CHARACTER_WIDTH + 20) {
          console.log('ATTACK HIT! Dealing', playerRef.current.attack, 'damage');
          // Deal damage
          let damage = playerRef.current.attack;
          
          // Combo damage bonus
          if (combo.player > 0) {
            damage += Math.floor(combo.player * 2);
            setCombo(prev => ({ ...prev, player: prev.player + 1, timer: 180 }));
          } else {
            setCombo(prev => ({ ...prev, player: 1, timer: 180 }));
          }
          
          enemyRef.current.health = Math.max(0, enemyRef.current.health - damage);
          console.log('Enemy health after:', enemyRef.current.health);
          
          // Build special meter
          setSpecialMeter(prev => ({ ...prev, player: Math.min(100, prev.player + 15) }));
          
          // Create damage particles (reduced)
          createParticles(enemyRef.current.x, enemyRef.current.y - 50, '#ff0000', 4, 'explosion');
          createParticles(enemyRef.current.x, enemyRef.current.y - 50, '#ffffff', 3, 'spark');
          
          // Trigger collision animation for attack hit
          const collisionX = (playerRef.current.x + enemyRef.current.x) / 2;
          const collisionY = Math.min(playerRef.current.y, enemyRef.current.y) - 20;
          triggerCollisionAnimation(collisionX, collisionY);
        } else {
          console.log('ATTACK MISSED - too far away');
        }
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
          createParticles(enemyRef.current.x, enemyRef.current.y - 50, '#ffd700', 8, 'explosion'); // Gold explosion
          createParticles(enemyRef.current.x, enemyRef.current.y - 50, '#ffffff', 6, 'spark'); // White lightning
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
        createParticles(400, 200, '#ffff00', 15, 'explosion');
        createParticles(400, 200, '#ffffff', 10, 'spark');
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
      // Don't process gamepad input when paused or game over
      if (isPaused || gameOver.active) return;
      
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads[0];
      
      if (gp) {
        const gamepadType = detectGamepadType(gp);
        
        // PS5 DualSense specific mappings
        const buttonMap = {
          PS5: {
            jump: [0, 1], // X (Cross) and Circle
            attack: [2, 3], // Square and Triangle
            special: [4, 5], // L1 and R1
            pause: [9], // Options button
            heavy: [6, 7] // L2 and R2 triggers
          },
          Xbox: {
            jump: [0, 1], // A and B
            attack: [2, 3], // X and Y
            special: [4, 5], // LB and RB
            pause: [7], // Menu button
            heavy: [6, 7] // LT and RT triggers
          },
          Generic: {
            jump: [0, 1], // Button 0 and 1
            attack: [2, 3], // Button 2 and 3
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
        
        // Jump (multiple button support)
        const jumpPressed = controls.jump.some(btn => gp.buttons[btn]?.pressed);
        if (jumpPressed && playerRef.current.onGround) {
          playerRef.current.vy = -JUMP_POWER;
          playerRef.current.onGround = false;
          console.log(`${gamepadType} controller: Jump activated`);
        }
        
        // Attack (multiple button support with enhanced feedback)
        const attackPressed = controls.attack.some(btn => gp.buttons[btn]?.pressed);
        const lastAttackPressed = controls.attack.some(btn => lastGamepadState.buttons[btn]);
        
        if (attackPressed && !lastAttackPressed && !playerRef.current.isAttacking && playerRef.current.attackCooldown === 0) {
          console.log(`${gamepadType} controller: Attack activated`);
          playerRef.current.isAttacking = true;
          playerRef.current.currentAnimation = Math.random() < 0.5 ? 'punch1' : 'punch2';
          playerRef.current.attackCooldown = 30;
          
          // Check if attack hits enemy
          const distance = Math.abs(playerRef.current.x - enemyRef.current.x);
          if (distance < CHARACTER_WIDTH + 20) {
            let damage = playerRef.current.attack;
            
            // Combo damage bonus
            if (combo.player > 0) {
              damage += Math.floor(combo.player * 2);
              setCombo(prev => ({ ...prev, player: prev.player + 1, timer: 180 }));
            } else {
              setCombo(prev => ({ ...prev, player: 1, timer: 180 }));
            }
            
            enemyRef.current.health = Math.max(0, enemyRef.current.health - damage);
            
            // Build special meter
            setSpecialMeter(prev => ({ ...prev, player: Math.min(100, prev.player + 15) }));
            
            // Create damage particles
            createParticles(enemyRef.current.x, enemyRef.current.y - 50, '#ff0000', 4, 'explosion');
            createParticles(enemyRef.current.x, enemyRef.current.y - 50, '#ffffff', 3, 'spark');
            
            // Trigger collision animation
            const collisionX = (playerRef.current.x + enemyRef.current.x) / 2;
            const collisionY = Math.min(playerRef.current.y, enemyRef.current.y) - 20;
            triggerCollisionAnimation(collisionX, collisionY);
            
            // PS5 Haptic feedback simulation (if supported)
            if (gamepadType === 'PS5' && gp.vibrationActuator) {
              gp.vibrationActuator.playEffect('dual-rumble', {
                duration: 200,
                strongMagnitude: 0.8,
                weakMagnitude: 0.4
              }).catch(() => {
                console.log('Haptic feedback not supported');
              });
            }
          }
        }
        
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
      <canvas ref={canvasRef} width={800} height={400} style={{ background: 'linear-gradient(180deg, #1a1a3a 60%, #222 100%)', borderRadius: '12px', boxShadow: '0 2px 16px #0008' }} />
      
      {/* Pause Overlay */}
      {isPaused && !gameOver.active && (
        <div style={{
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
          color: '#fff'
        }}>
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '3rem', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>⏸️ PAUSED</h2>
          <p style={{ margin: '0 0 2rem 0', fontSize: '1.2rem', opacity: 0.9 }}>Press ESC or P to resume</p>
          <button
            onClick={() => setIsPaused(false)}
            style={{
              padding: '12px 24px',
              fontSize: '1.1rem',
              backgroundColor: '#4facfe',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(79, 172, 254, 0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#357abd'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#4facfe'}
          >
            Resume Game
          </button>
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
            margin: '0 0 3rem 0', 
            fontSize: '1.5rem', 
            opacity: 0.9,
            textAlign: 'center'
          }}>
            {gameOver.message}
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => {
                // Reset game state
                playerRef.current.health = playerRef.current.maxHealth;
                enemyRef.current.health = enemyRef.current.maxHealth;
                playerRef.current.x = 100;
                enemyRef.current.x = 700;
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
                backgroundColor: '#2ed573',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(46, 213, 115, 0.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#20bf6b'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#2ed573'}
            >
              🔄 Play Again
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                fontSize: '1.1rem',
                backgroundColor: '#ff4757',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(255, 71, 87, 0.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#ff3838'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#ff4757'}
            >
              🏠 Main Menu
            </button>
          </div>
        </div>
      )}
      
      <div style={{ marginTop: '1rem', color: '#fff', lineHeight: '1.6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'left' }}>
            <div><strong>🎮 Controls:</strong></div>
            <div>Move: ← → / A D / Left Stick</div>
            <div>Jump: ↑ W Space / ❌ ⭕ (PS5) / A B (Xbox)</div>
            <div>Attack: X / 🔲 🔺 (PS5) / X Y (Xbox)</div>
            <div>Heavy: L2 R2 (PS5) / LT RT (Xbox)</div>
            <div>Special: Z / L1 R1 (PS5) / LB RB (Xbox)</div>
            <div>Pause: ESC P / Options (PS5) / Menu (Xbox)</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div><strong>💡 Tips:</strong></div>
            <div>Build combos for bonus damage!</div>
            <div>Special moves deal 3x damage</div>
            <div>Heavy attacks build special meter faster</div>
            <div>PS5 haptic feedback on hits!</div>
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
          <span>Sprites: {playerSpriteRef.current?.loaded ? '✅' : '⏳'} / {enemySpriteRef.current?.loaded ? '✅' : '⏳'}</span>
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
