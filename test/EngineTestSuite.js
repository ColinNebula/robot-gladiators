/**
 * Enhanced Engine Test Suite
 * 
 * Quick tests to verify the enhanced engine systems are working correctly
 */

import GameEngine from '../src/engine/GameEngine.js';

class EngineTestSuite {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async runTests() {
    console.log('🧪 Starting Enhanced Engine Test Suite...');
    
    // Create test canvas
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    
    try {
      // Initialize engine
      const engine = new GameEngine(canvas, { enableDebug: true });
      await engine.start();
      
      // Test 1: Engine Initialization
      this.test('Engine Initialization', () => {
        return engine && engine.isRunning();
      });
      
      // Test 2: System Loading
      this.test('System Loading', () => {
        const requiredSystems = ['memory', 'state', 'input', 'ai', 'physics', 'collision', 'animation', 'particles', 'lighting', 'audio', 'render'];
        return requiredSystems.every(system => engine.getSystem(system) !== null);
      });
      
      // Test 3: Memory System
      this.test('Memory System', () => {
        const memorySystem = engine.getSystem('memory');
        const pooledObject = memorySystem.acquire('vector2d');
        const stats = memorySystem.getMemoryStats();
        return pooledObject && stats && stats.totalPooledObjects > 0;
      });
      
      // Test 4: AI System
      this.test('AI System', () => {
        const aiSystem = engine.getSystem('ai');
        const entityManager = engine.entityManager;
        
        const entity = entityManager.createEntity('test');
        aiSystem.makeAggressiveAI(entity.id);
        
        return aiSystem.getAI(entity.id) !== null;
      });
      
      // Test 5: Animation System
      this.test('Animation System', () => {
        const animationSystem = engine.getSystem('animation');
        const timeline = animationSystem.createTimeline('test', { duration: 1000 });
        return timeline !== null;
      });
      
      // Test 6: Lighting System
      this.test('Lighting System', () => {
        const lightingSystem = engine.getSystem('lighting');
        const light = lightingSystem.createPointLight('test', 100, 100, 50, { r: 255, g: 255, b: 255 }, 1.0);
        return light !== null;
      });
      
      // Test 7: State System
      this.test('State System', () => {
        const stateSystem = engine.getSystem('state');
        stateSystem.setState('test', { value: 42 });
        return stateSystem.getState('test').value === 42;
      });
      
      // Cleanup
      engine.destroy();
      
    } catch (error) {
      console.error('Test suite failed:', error);
      this.results.failed += 7; // All tests failed
    }
    
    this.printResults();
    return this.results;
  }

  test(name, testFunction) {
    try {
      const result = testFunction();
      if (result) {
        console.log(`✅ ${name}: PASSED`);
        this.results.passed++;
        this.results.tests.push({ name, status: 'PASSED' });
      } else {
        console.log(`❌ ${name}: FAILED`);
        this.results.failed++;
        this.results.tests.push({ name, status: 'FAILED' });
      }
    } catch (error) {
      console.log(`❌ ${name}: ERROR - ${error.message}`);
      this.results.failed++;
      this.results.tests.push({ name, status: 'ERROR', error: error.message });
    }
  }

  printResults() {
    console.log('\n🏁 Test Suite Results:');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📊 Total: ${this.results.passed + this.results.failed}`);
    
    if (this.results.failed === 0) {
      console.log('🎉 All tests passed! Enhanced engine is working correctly.');
    } else {
      console.log('⚠️ Some tests failed. Check the enhanced engine implementation.');
    }
  }
}

// Export for testing
export default EngineTestSuite;

// Auto-run tests if in browser environment
if (typeof window !== 'undefined') {
  window.runEngineTests = async () => {
    const testSuite = new EngineTestSuite();
    return await testSuite.runTests();
  };
  
  console.log('🧪 Enhanced Engine Test Suite loaded. Run window.runEngineTests() to test.');
}