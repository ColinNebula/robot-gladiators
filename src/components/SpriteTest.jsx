import React, { useRef, useEffect } from 'react';

const SpriteTest = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Test direct image loading and drawing
    const img = new Image();
    img.onload = () => {
      console.log('Test sprite loaded successfully!', img.width, 'x', img.height);
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background
      ctx.fillStyle = '#333';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw the sprite
      ctx.drawImage(img, 10, 10, 96, 96); // Draw at 2x size for visibility
      
      // Draw text
      ctx.fillStyle = '#fff';
      ctx.font = '16px Arial';
      ctx.fillText('Sprite Test - If you see a character here, sprites work!', 10, 130);
      
      // Try drawing a specific frame (assuming 48x48 frames)
      if (img.width >= 96) { // Make sure there are multiple frames
        ctx.fillText('Frame 0:', 10, 160);
        ctx.drawImage(img, 0, 0, 48, 48, 10, 170, 48, 48);
        
        ctx.fillText('Frame 1:', 70, 160);
        ctx.drawImage(img, 48, 0, 48, 48, 70, 170, 48, 48);
        
        ctx.fillText('Frame 2:', 130, 160);
        ctx.drawImage(img, 96, 0, 48, 48, 130, 170, 48, 48);
      }
    };
    
    img.onerror = (err) => {
      console.error('Test sprite failed to load:', err);
      ctx.fillStyle = '#333';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff0000';
      ctx.font = '16px Arial';
      ctx.fillText('SPRITE FAILED TO LOAD', 10, 50);
    };
    
    img.src = '/assets/sprites/SplitAnimations/Male_spritesheet_idle.png';
    
    console.log('Loading test sprite from:', img.src);
  }, []);

  return (
    <div style={{ margin: '20px' }}>
      <h3>Sprite Loading Test</h3>
      <canvas 
        ref={canvasRef} 
        width={400} 
        height={300} 
        style={{ 
          border: '2px solid #ccc', 
          background: '#000' 
        }} 
      />
    </div>
  );
};

export default SpriteTest;