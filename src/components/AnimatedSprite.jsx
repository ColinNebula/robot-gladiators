import React, { useRef, useEffect, useState } from 'react';

const AnimatedSprite = ({ 
  character, 
  animation = 'idle', 
  scale = 1, 
  className = '', 
  style = {},
  showEffects = true 
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Sprite configuration for each character
  const SPRITE_CONFIGS = {
    malice: {
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: 4, speed: 15, file: 'Male_spritesheet_idle.png' },
        punch: { frames: 4, speed: 5, file: 'Male_spritesheet_punch_1.png' },
        kick: { frames: 4, speed: 5, file: 'Male_spritesheet_kick_high.png' },
        celebrate: { frames: 4, speed: 8, file: 'Male_spritesheet_interact.png' }
      },
      tint: '#4facfe'
    },
    lugawu: {
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: 4, speed: 15, file: 'Male_spritesheet_idle.png' },
        punch: { frames: 4, speed: 4, file: 'Male_spritesheet_punch_2.png' },
        kick: { frames: 6, speed: 4, file: 'Male_spritesheet_kick_spin_high.png' },
        celebrate: { frames: 4, speed: 8, file: 'Male_spritesheet_interact.png' }
      },
      tint: '#ff4757'
    },
    magnus: {
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: 4, speed: 15, file: 'Male_spritesheet_idle.png' },
        punch: { frames: 4, speed: 6, file: 'Male_spritesheet_punch_3.png' },
        kick: { frames: 4, speed: 6, file: 'Male_spritesheet_kick_low.png' },
        celebrate: { frames: 4, speed: 8, file: 'Male_spritesheet_interact.png' }
      },
      tint: '#2ed573'
    }
  };

  const config = SPRITE_CONFIGS[character] || SPRITE_CONFIGS.malice;
  const currentAnim = config.animations[animation] || config.animations.idle;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { frameWidth, frameHeight } = config;
    
    // Set canvas size
    canvas.width = frameWidth * scale;
    canvas.height = frameHeight * scale;

    let currentFrame = 0;
    let frameCounter = 0;
    let sprite = null;
    let bounceOffset = 0;

    // Load sprite image
    const loadSprite = () => {
      sprite = new Image();
      sprite.src = `/assets/sprites/Split animations/${currentAnim.file}`;
      
      sprite.onload = () => {
        setIsLoaded(true);
        animate();
      };
      
      sprite.onerror = () => {
        console.error(`Failed to load sprite: ${currentAnim.file}`);
        // Fallback to a simple colored rectangle
        setIsLoaded(true);
        animate();
      };
    };

    const animate = () => {
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Apply visual effects
      if (showEffects) {
        // Bounce effect for idle animation
        if (animation === 'idle') {
          bounceOffset = Math.sin(Date.now() * 0.003) * 2;
        }

        // Add subtle glow effect
        ctx.shadowColor = config.tint;
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      if (sprite && sprite.complete) {
        // Calculate source rectangle
        const srcX = currentFrame * frameWidth;
        const srcY = 0;

        // Apply tint effect
        if (showEffects && config.tint) {
          ctx.globalCompositeOperation = 'source-over';
        }

        // Draw sprite with bounce offset
        ctx.drawImage(
          sprite,
          srcX, srcY, frameWidth, frameHeight,
          0, bounceOffset, frameWidth * scale, frameHeight * scale
        );

        // Apply color tint overlay
        if (showEffects && config.tint) {
          ctx.globalCompositeOperation = 'overlay';
          ctx.fillStyle = config.tint + '40'; // 25% opacity
          ctx.fillRect(0, bounceOffset, frameWidth * scale, frameHeight * scale);
          ctx.globalCompositeOperation = 'source-over';
        }
      } else {
        // Fallback: draw colored rectangle with character initial
        ctx.fillStyle = config.tint;
        ctx.fillRect(10, 10 + bounceOffset, (frameWidth * scale) - 20, (frameHeight * scale) - 20);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = `${16 * scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(
          character.charAt(0).toUpperCase(), 
          (frameWidth * scale) / 2, 
          (frameHeight * scale) / 2 + bounceOffset
        );
      }

      // Reset shadow
      ctx.shadowBlur = 0;

      // Update animation frame
      frameCounter++;
      if (frameCounter >= currentAnim.speed) {
        currentFrame = (currentFrame + 1) % currentAnim.frames;
        frameCounter = 0;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    loadSprite();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [character, animation, scale, showEffects]);

  return (
    <canvas
      ref={canvasRef}
      className={`animated-sprite ${className}`}
      style={{
        imageRendering: 'pixelated',
        ...style
      }}
    />
  );
};

export default AnimatedSprite;