/**
 * Particle System Integration Test
 * 
 * This test verifies that the refactored particle systems work correctly
 * and that the VisualEffectsSystem properly delegates to ParticleSystem.
 */

// Test the integrated particle system
export class ParticleSystemTest {
  constructor(engine) {
    this.engine = engine;
    this.particleSystem = engine.getSystem('particles');
    this.visualEffects = engine.getSystem('visualEffects');
    this.results = [];
  }

  async runTests() {
    console.log('🧪 Running Particle System Integration Tests...');
    
    // Test 1: Verify ParticleSystem is available
    this.test('ParticleSystem availability', () => {
      return this.particleSystem !== null && this.particleSystem !== undefined;
    });

    // Test 2: Verify VisualEffectsSystem has ParticleSystem reference
    this.test('VisualEffectsSystem integration', () => {
      return this.visualEffects.particleSystem === this.particleSystem;
    });

    // Test 3: Test explosion effects
    this.test('Explosion effect creation', () => {
      const emitterId = this.particleSystem.createExplosion(100, 100, 1);
      return emitterId !== null;
    });

    // Test 4: Test visual effects delegation
    this.test('Visual effects particle delegation', () => {
      try {
        this.visualEffects.createExplosion({ x: 200, y: 200, size: 0.5 });
        return true;
      } catch (error) {
        console.error('Visual effects delegation failed:', error);
        return false;
      }
    });

    // Test 5: Test particle emitter types
    this.test('Particle emitter types', () => {
      const types = ['explosion', 'fire', 'smoke', 'sparks', 'magic', 'dust', 'energy'];
      return types.every(type => {
        const emitterId = this.particleSystem.createEmitter(type, 300, 300);
        return emitterId !== null;
      });
    });

    // Test 6: Test particle system performance
    this.test('Particle system performance', () => {
      const startTime = performance.now();
      
      // Create multiple effects
      for (let i = 0; i < 10; i++) {
        this.particleSystem.createExplosion(50 + i * 10, 50, 0.5);
      }
      
      // Update particles
      this.particleSystem.update(16.67); // ~60fps
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      return duration < 10; // Should complete in less than 10ms
    });

    // Test 7: Test memory management
    this.test('Memory pool management', () => {
      const initialStats = this.particleSystem.getStats();
      
      // Create and clear particles
      for (let i = 0; i < 50; i++) {
        this.particleSystem.createSparks(100, 100, 5);
      }
      
      this.particleSystem.clearParticles();
      const afterStats = this.particleSystem.getStats();
      
      return afterStats.particlesActive === 0;
    });

    // Test 8: Test enhanced visual effects methods
    this.test('Enhanced visual effects methods', () => {
      try {
        this.particleSystem.createImpactSparks(150, 150, 1);
        this.particleSystem.createDustCloud(160, 160, 1);
        this.particleSystem.createEnergyBurst(170, 170, '#00ffff');
        return true;
      } catch (error) {
        console.error('Enhanced methods failed:', error);
        return false;
      }
    });

    this.printResults();
    return this.results;
  }

  test(name, testFunction) {
    try {
      const result = testFunction();
      this.results.push({
        name,
        passed: result,
        error: null
      });
      console.log(`${result ? '✅' : '❌'} ${name}`);
    } catch (error) {
      this.results.push({
        name,
        passed: false,
        error: error.message
      });
      console.log(`❌ ${name}: ${error.message}`);
    }
  }

  printResults() {
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    
    console.log(`\n🧪 Particle System Tests Complete: ${passed}/${total} passed`);
    
    if (passed === total) {
      console.log('🎉 All particle system integration tests passed!');
    } else {
      console.log('⚠️ Some tests failed. Check the results above.');
    }
  }
}

// Usage example:
// const test = new ParticleSystemTest(gameEngine);
// test.runTests();