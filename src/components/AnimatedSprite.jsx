import React, { useRef, useEffect, useState, useCallback } from 'react';

const AnimatedSprite = ({ 
  character, 
  animation = 'idle', 
  scale = 1, 
  className = '', 
  style = {},
  showEffects = true,
  flipX = false,
  flipY = false,
  tint = null,
  alpha = 1,
  rotation = 0,
  pixelPerfect = true,
  smoothing = false,
  onFrameChange = null,
  onAnimationComplete = null
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const imageCache = useRef(new Map());
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const frameCounterRef = useRef(0);
  const bounceOffsetRef = useRef(0);
  const lastAnimationRef = useRef(animation);

  // Enhanced sprite configuration for each character
  const SPRITE_CONFIGS = {
    malice: {
      frameWidth: 48,
      frameHeight: 48,
      renderScale: 2.5,
      shadowEnabled: true,
      animations: {
        idle: { frames: 4, speed: 15, file: 'Male_spritesheet_idle.png', loop: true, effects: { bounce: true, glow: 'soft' } },
        run: { frames: 6, speed: 6, file: 'Male_spritesheet_run.png', loop: true, effects: { trail: 'speed' } },
        jump: { frames: 3, speed: 4, file: 'Male_spritesheet_run_jump.png', loop: false, effects: { easing: 'ease-out' } },
        attack: { frames: 4, speed: 3, file: 'Male_spritesheet_punch_1.png', loop: false, effects: { impact: true } },
        punch: { frames: 4, speed: 5, file: 'Male_spritesheet_punch_1.png', loop: false, effects: { shake: true } },
        kick: { frames: 4, speed: 5, file: 'Male_spritesheet_kick_high.png', loop: false, effects: { impact: true } },
        celebrate: { frames: 4, speed: 8, file: 'Male_spritesheet_interact.png', loop: true, effects: { sparkle: true } },
        defend: { frames: 2, speed: 8, file: 'Male_spritesheet_block.png', loop: true, effects: { shimmer: true } },
        hurt: { frames: 3, speed: 4, file: 'Male_spritesheet_hurt.png', loop: false, effects: { flash: 'red' } },
        victory: { frames: 4, speed: 10, file: 'Male_spritesheet_interact.png', loop: false, effects: { celebration: true } }
      },
      theme: {
        primary: '#4facfe',
        secondary: '#00c4ff',
        accent: '#7c4dff'
      }
    },
    lugawu: {
      frameWidth: 48,
      frameHeight: 48,
      renderScale: 2.5,
      shadowEnabled: true,
      animations: {
        idle: { frames: 4, speed: 15, file: 'Male_spritesheet_idle.png', loop: true, effects: { bounce: true, glow: 'soft' } },
        run: { frames: 6, speed: 5, file: 'Male_spritesheet_run.png', loop: true, effects: { trail: 'speed' } },
        jump: { frames: 3, speed: 3, file: 'Male_spritesheet_run_jump.png', loop: false, effects: { easing: 'ease-out' } },
        attack: { frames: 4, speed: 2, file: 'Male_spritesheet_punch_2.png', loop: false, effects: { impact: true, afterimage: true } },
        punch: { frames: 4, speed: 4, file: 'Male_spritesheet_punch_2.png', loop: false, effects: { critical: true } },
        kick: { frames: 6, speed: 4, file: 'Male_spritesheet_kick_spin_high.png', loop: false, effects: { spin: true } },
        celebrate: { frames: 4, speed: 8, file: 'Male_spritesheet_interact.png', loop: true, effects: { sparkle: true } },
        defend: { frames: 2, speed: 6, file: 'Male_spritesheet_block.png', loop: true, effects: { energy: true } },
        hurt: { frames: 3, speed: 4, file: 'Male_spritesheet_hurt.png', loop: false, effects: { flash: 'red' } },
        victory: { frames: 4, speed: 8, file: 'Male_spritesheet_interact.png', loop: false, effects: { celebration: true } }
      },
      theme: {
        primary: '#ff4757',
        secondary: '#ff3838',
        accent: '#ff6b7a'
      }
    },
    magnus: {
      frameWidth: 48,
      frameHeight: 48,
      renderScale: 2.5,
      shadowEnabled: true,
      animations: {
        idle: { frames: 4, speed: 18, file: 'Male_spritesheet_idle.png', loop: true, effects: { bounce: true, glow: 'soft' } },
        run: { frames: 6, speed: 8, file: 'Male_spritesheet_run.png', loop: true, effects: { heavy: true } },
        jump: { frames: 3, speed: 5, file: 'Male_spritesheet_run_jump.png', loop: false, effects: { easing: 'ease-out' } },
        attack: { frames: 4, speed: 4, file: 'Male_spritesheet_punch_3.png', loop: false, effects: { impact: true, shake: 'heavy' } },
        punch: { frames: 4, speed: 6, file: 'Male_spritesheet_punch_3.png', loop: false, effects: { power: true } },
        kick: { frames: 4, speed: 6, file: 'Male_spritesheet_kick_low.png', loop: false, effects: { ground: true } },
        celebrate: { frames: 4, speed: 8, file: 'Male_spritesheet_interact.png', loop: true, effects: { sparkle: true } },
        defend: { frames: 2, speed: 10, file: 'Male_spritesheet_block.png', loop: true, effects: { fortress: true } },
        hurt: { frames: 3, speed: 5, file: 'Male_spritesheet_hurt.png', loop: false, effects: { flash: 'red' } },
        victory: { frames: 4, speed: 12, file: 'Male_spritesheet_interact.png', loop: false, effects: { celebration: true } }
      },
      theme: {
        primary: '#2ed573',
        secondary: '#20bf6b',
        accent: '#26de81'
      }
    },
    nova: {
      frameWidth: 48,
      frameHeight: 48,
      renderScale: 2.5,
      shadowEnabled: true,
      animations: {
        idle: { frames: 4, speed: 12, file: 'Male_spritesheet_idle.png', loop: true, effects: { bounce: true, glow: 'electric' } },
        run: { frames: 6, speed: 4, file: 'Male_spritesheet_run.png', loop: true, effects: { lightning: true } },
        jump: { frames: 3, speed: 2, file: 'Male_spritesheet_run_jump.png', loop: false, effects: { burst: true } },
        attack: { frames: 4, speed: 1, file: 'Male_spritesheet_punch_1.png', loop: false, effects: { lightning: true, chain: true } },
        punch: { frames: 4, speed: 3, file: 'Male_spritesheet_punch_1.png', loop: false, effects: { electric: true } },
        kick: { frames: 4, speed: 3, file: 'Male_spritesheet_kick_high.png', loop: false, effects: { thunder: true } },
        celebrate: { frames: 4, speed: 6, file: 'Male_spritesheet_interact.png', loop: true, effects: { electric: true } },
        defend: { frames: 2, speed: 6, file: 'Male_spritesheet_block.png', loop: true, effects: { barrier: true } },
        hurt: { frames: 3, speed: 3, file: 'Male_spritesheet_hurt.png', loop: false, effects: { flash: 'blue' } },
        victory: { frames: 4, speed: 8, file: 'Male_spritesheet_interact.png', loop: false, effects: { celebration: true } }
      },
      theme: {
        primary: '#ffd700',
        secondary: '#ffed4e',
        accent: '#fff200'
      }
    }
  };

  const config = SPRITE_CONFIGS[character] || SPRITE_CONFIGS.malice;
  const currentAnim = config.animations[animation] || config.animations.idle;
  const theme = tint ? { primary: tint, secondary: tint, accent: tint } : config.theme;

  // Enhanced image loading with caching
  const loadImage = useCallback(async (src) => {
    if (imageCache.current.has(src)) {
      return imageCache.current.get(src);
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        imageCache.current.set(src, img);
        resolve(img);
      };
      
      img.onerror = () => {
        console.warn(`Failed to load sprite: ${src}, using fallback`);
        const canvas = document.createElement('canvas');
        canvas.width = config.frameWidth;
        canvas.height = config.frameHeight;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, theme.primary + '80');
        gradient.addColorStop(0.5, theme.secondary + '60');
        gradient.addColorStop(1, theme.accent + '40');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(character.charAt(0).toUpperCase(), canvas.width / 2, canvas.height / 2);
        
        const fallbackImg = new Image();
        fallbackImg.src = canvas.toDataURL();
        imageCache.current.set(src, fallbackImg);
        resolve(fallbackImg);
      };
      
      img.src = src;
    });
  }, [character, config.frameWidth, config.frameHeight, theme]);

  // Enhanced animation effects system
  const applyEffects = useCallback((ctx, effects) => {
    if (!showEffects || !effects) return;

    const canvas = ctx.canvas;

    // Bounce effect
    if (effects.bounce) {
      const bounceAmount = Math.sin(Date.now() * 0.005) * 2;
      bounceOffsetRef.current = bounceAmount;
    }

    // Glow effects
    if (effects.glow) {
      const glowIntensity = effects.glow === 'electric' ? 
        Math.sin(Date.now() * 0.01) * 0.5 + 0.5 : 0.3;
      
      ctx.shadowColor = theme.primary;
      ctx.shadowBlur = 10 + glowIntensity * 10;
    }

    // Trail effect
    if (effects.trail === 'speed' && animation === 'run') {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = theme.secondary + '40';
      ctx.fillRect(-5, 0, canvas.width + 10, canvas.height);
      ctx.globalAlpha = alpha;
    }

    // Lightning effects
    if (effects.lightning && Math.random() < 0.1) {
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 2;
      ctx.globalCompositeOperation = 'screen';
      
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvas.width, 0);
        ctx.lineTo(Math.random() * canvas.width, canvas.height);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    // Flash effects
    if (effects.flash && animation === 'hurt') {
      const flashColor = effects.flash === 'red' ? '#ff0000' : 
                        effects.flash === 'blue' ? '#0080ff' : '#ffffff';
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = flashColor + '60';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';
    }

    // Impact shake
    if (effects.shake || effects.impact) {
      const shakeIntensity = effects.shake === 'heavy' ? 3 : 1;
      const shakeX = (Math.random() - 0.5) * shakeIntensity;
      const shakeY = (Math.random() - 0.5) * shakeIntensity;
      ctx.translate(shakeX, shakeY);
    }

    // Sparkles
    if (effects.sparkle || effects.celebration) {
      const sparkleCount = effects.celebration ? 8 : 4;
      for (let i = 0; i < sparkleCount; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 3 + 1;
        
        ctx.fillStyle = theme.accent;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [showEffects, theme, alpha, animation]);

  // Enhanced rendering with advanced features
  const renderSprite = useCallback(async (frameIndex) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configure canvas for pixel-perfect rendering
    if (pixelPerfect) {
      ctx.imageSmoothingEnabled = false;
      ctx.webkitImageSmoothingEnabled = false;
      ctx.mozImageSmoothingEnabled = false;
      ctx.msImageSmoothingEnabled = false;
    } else {
      ctx.imageSmoothingEnabled = smoothing;
      ctx.imageSmoothingQuality = 'high';
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    
    // Apply transformations
    if (rotation !== 0) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rotation * Math.PI / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }
    
    if (flipX || flipY) {
      const scaleX = flipX ? -1 : 1;
      const scaleY = flipY ? -1 : 1;
      const translateX = flipX ? canvas.width : 0;
      const translateY = flipY ? canvas.height : 0;
      
      ctx.translate(translateX, translateY);
      ctx.scale(scaleX, scaleY);
    }

    ctx.globalAlpha = alpha;

    try {
      const spriteImage = await loadImage(`/assets/sprites/${currentAnim.file}`);
      
      const frameX = (frameIndex % Math.ceil(spriteImage.width / config.frameWidth)) * config.frameWidth;
      const frameY = Math.floor(frameIndex / Math.ceil(spriteImage.width / config.frameWidth)) * config.frameHeight;
      
      const renderScale = config.renderScale || 2;
      const renderWidth = config.frameWidth * renderScale * scale;
      const renderHeight = config.frameHeight * renderScale * scale;
      
      const x = (canvas.width - renderWidth) / 2;
      const y = (canvas.height - renderHeight) / 2 + (bounceOffsetRef.current || 0);

      applyEffects(ctx, currentAnim.effects);

      // Shadow
      if (config.shadowEnabled && showEffects) {
        ctx.save();
        ctx.globalAlpha = alpha * 0.3;
        ctx.fillStyle = '#00000040';
        ctx.fillRect(x + 5, y + renderHeight - 5, renderWidth, 8);
        ctx.restore();
        ctx.globalAlpha = alpha;
      }

      // Tint
      if (tint) {
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = tint;
        ctx.fillRect(x, y, renderWidth, renderHeight);
        ctx.globalCompositeOperation = 'destination-atop';
      }

      // Render sprite
      ctx.drawImage(
        spriteImage,
        frameX, frameY, config.frameWidth, config.frameHeight,
        x, y, renderWidth, renderHeight
      );

      ctx.globalCompositeOperation = 'source-over';

    } catch (error) {
      console.warn('Sprite rendering error:', error);
      
      // Enhanced fallback rendering
      const fallbackSize = 60 * scale;
      const x = (canvas.width - fallbackSize) / 2;
      const y = (canvas.height - fallbackSize) / 2;
      
      const gradient = ctx.createRadialGradient(
        x + fallbackSize / 2, y + fallbackSize / 2, 0,
        x + fallbackSize / 2, y + fallbackSize / 2, fallbackSize / 2
      );
      gradient.addColorStop(0, theme.primary + '80');
      gradient.addColorStop(0.7, theme.secondary + '60');
      gradient.addColorStop(1, theme.accent + '40');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, fallbackSize, fallbackSize);
      
      ctx.shadowColor = theme.primary;
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${fallbackSize / 3}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        character.charAt(0).toUpperCase(), 
        x + fallbackSize / 2, 
        y + fallbackSize / 2
      );
    }
    
    ctx.restore();
  }, [
    config, currentAnim, character, scale, loadImage, pixelPerfect, smoothing,
    flipX, flipY, tint, alpha, rotation, showEffects, theme, applyEffects
  ]);

  // Enhanced animation loop with callbacks
  const animate = useCallback(() => {
    frameCounterRef.current++;
    
    if (frameCounterRef.current >= currentAnim.speed) {
      frameCounterRef.current = 0;
      
      const newFrame = (currentFrame + 1) % currentAnim.frames;
      setCurrentFrame(newFrame);
      
      if (onFrameChange) {
        onFrameChange(newFrame, animation);
      }
      
      if (!currentAnim.loop && newFrame === 0 && currentFrame !== 0) {
        if (onAnimationComplete) {
          onAnimationComplete(animation);
        }
        return;
      }
    }
    
    renderSprite(currentFrame);
    animationRef.current = requestAnimationFrame(animate);
  }, [currentFrame, currentAnim, animation, renderSprite, onFrameChange, onAnimationComplete]);

  // Reset animation when animation type changes
  useEffect(() => {
    if (lastAnimationRef.current !== animation) {
      setCurrentFrame(0);
      frameCounterRef.current = 0;
      lastAnimationRef.current = animation;
    }
  }, [animation]);

  // Initialize and start animation
  useEffect(() => {
    setIsLoaded(true);
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  // Enhanced canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { frameWidth, frameHeight } = config;
    
    // Set canvas size with device pixel ratio for crisp rendering
    const devicePixelRatio = window.devicePixelRatio || 1;
    const renderScale = config.renderScale || 2;
    const canvasSize = Math.max(frameWidth, frameHeight) * renderScale * scale;
    
    canvas.width = canvasSize * devicePixelRatio;
    canvas.height = canvasSize * devicePixelRatio;
    canvas.style.width = `${canvasSize}px`;
    canvas.style.height = `${canvasSize}px`;
    
    ctx.scale(devicePixelRatio, devicePixelRatio);
    
    if (pixelPerfect) {
      ctx.imageSmoothingEnabled = false;
    } else {
      ctx.imageSmoothingEnabled = smoothing;
      ctx.imageSmoothingQuality = 'high';
    }
    
  }, [config, scale, pixelPerfect, smoothing]);

  return (
    <div className={`animated-sprite ${className}`} style={style}>
      <canvas 
        ref={canvasRef}
        className="sprite-canvas"
        style={{
          imageRendering: pixelPerfect ? 'pixelated' : 'auto',
          transition: 'all 0.3s ease'
        }}
      />
      {!isLoaded && (
        <div className="sprite-loading" style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: theme.primary,
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          Loading...
        </div>
      )}
    </div>
  );
};

export default AnimatedSprite;