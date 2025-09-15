// Clean draw function to replace the problematic one
const cleanDrawFunction = `
    function draw() {
      console.log('🎨 === CLEAN DRAW FUNCTION ===');
      
      try {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Simple background
        ctx.fillStyle = '#2a2a4a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Ground
        ctx.fillStyle = '#444';
        ctx.fillRect(0, GROUND_Y, canvas.width, 40);
        
        // Player
        if (playerRef.current) {
          ctx.fillStyle = '#00ff00';
          ctx.fillRect(
            playerRef.current.x - CHARACTER_WIDTH/2,
            playerRef.current.y - CHARACTER_HEIGHT,
            CHARACTER_WIDTH,
            CHARACTER_HEIGHT
          );
        }
        
        // Enemy
        if (enemyRef.current) {
          ctx.fillStyle = '#ff0000';
          ctx.fillRect(
            enemyRef.current.x - CHARACTER_WIDTH/2,
            enemyRef.current.y - CHARACTER_HEIGHT,
            CHARACTER_WIDTH,
            CHARACTER_HEIGHT
          );
        }
        
        console.log('✅ Draw completed successfully');
        
      } catch (error) {
        console.error('❌ Draw error:', error);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(10, 10, 100, 100);
      }
    }
`;

console.log("This is the clean function to replace in SideScroller.jsx");