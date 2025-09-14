/**
 * Event Bus - Centralized Event Management System
 * 
 * Provides a decoupled event system for communication between
 * engine systems, game objects, and UI components.
 */

export class EventBus {
  constructor() {
    this.listeners = new Map();
    this.onceListeners = new Map();
    this.wildcardListeners = new Set();
    
    // Event history for debugging
    this.eventHistory = [];
    this.maxHistorySize = 1000;
    this.debugMode = false;
    
    console.log('📡 Event Bus initialized');
  }

  // Add event listener
  on(event, callback, context = null) {
    if (typeof callback !== 'function') {
      console.warn('EventBus: Callback must be a function');
      return;
    }

    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    const listener = {
      callback,
      context,
      id: this.generateListenerId()
    };

    this.listeners.get(event).push(listener);

    if (this.debugMode) {
      console.log(`📡 Event listener added: ${event}`);
    }

    // Return unsubscribe function
    return () => this.off(event, callback, context);
  }

  // Add one-time event listener
  once(event, callback, context = null) {
    if (typeof callback !== 'function') {
      console.warn('EventBus: Callback must be a function');
      return;
    }

    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, []);
    }

    const listener = {
      callback,
      context,
      id: this.generateListenerId()
    };

    this.onceListeners.get(event).push(listener);

    if (this.debugMode) {
      console.log(`📡 One-time event listener added: ${event}`);
    }

    // Return unsubscribe function
    return () => this.offOnce(event, callback, context);
  }

  // Remove event listener
  off(event, callback = null, context = null) {
    if (!this.listeners.has(event)) return;

    const listeners = this.listeners.get(event);
    
    if (callback === null) {
      // Remove all listeners for this event
      this.listeners.delete(event);
      if (this.debugMode) {
        console.log(`📡 All listeners removed for event: ${event}`);
      }
      return;
    }

    // Remove specific listener
    const index = listeners.findIndex(listener => 
      listener.callback === callback && 
      (context === null || listener.context === context)
    );

    if (index !== -1) {
      listeners.splice(index, 1);
      if (listeners.length === 0) {
        this.listeners.delete(event);
      }
      
      if (this.debugMode) {
        console.log(`📡 Event listener removed: ${event}`);
      }
    }
  }

  // Remove one-time event listener
  offOnce(event, callback = null, context = null) {
    if (!this.onceListeners.has(event)) return;

    const listeners = this.onceListeners.get(event);
    
    if (callback === null) {
      this.onceListeners.delete(event);
      return;
    }

    const index = listeners.findIndex(listener => 
      listener.callback === callback && 
      (context === null || listener.context === context)
    );

    if (index !== -1) {
      listeners.splice(index, 1);
      if (listeners.length === 0) {
        this.onceListeners.delete(event);
      }
    }
  }

  // Emit event
  emit(event, data = null) {
    const eventData = {
      type: event,
      data,
      timestamp: performance.now(),
      propagationStopped: false
    };

    // Add to event history
    if (this.debugMode) {
      this.addToHistory(eventData);
      console.log(`📡 Event emitted: ${event}`, data);
    }

    // Call regular listeners
    this.callListeners(event, eventData);

    // Call one-time listeners
    this.callOnceListeners(event, eventData);

    // Call wildcard listeners
    this.callWildcardListeners(eventData);

    return eventData;
  }

  // Emit event asynchronously
  async emitAsync(event, data = null) {
    const eventData = {
      type: event,
      data,
      timestamp: performance.now(),
      propagationStopped: false
    };

    if (this.debugMode) {
      this.addToHistory(eventData);
      console.log(`📡 Async event emitted: ${event}`, data);
    }

    // Call listeners asynchronously
    const promises = [];
    
    // Regular listeners
    if (this.listeners.has(event)) {
      const listeners = [...this.listeners.get(event)];
      listeners.forEach(listener => {
        if (eventData.propagationStopped) return;
        
        try {
          const result = listener.context ? 
            listener.callback.call(listener.context, eventData) :
            listener.callback(eventData);
          
          if (result instanceof Promise) {
            promises.push(result);
          }
        } catch (error) {
          console.error(`📡 Error in async event listener for ${event}:`, error);
        }
      });
    }

    // One-time listeners
    if (this.onceListeners.has(event)) {
      const listeners = [...this.onceListeners.get(event)];
      this.onceListeners.delete(event);
      
      listeners.forEach(listener => {
        if (eventData.propagationStopped) return;
        
        try {
          const result = listener.context ? 
            listener.callback.call(listener.context, eventData) :
            listener.callback(eventData);
          
          if (result instanceof Promise) {
            promises.push(result);
          }
        } catch (error) {
          console.error(`📡 Error in async one-time event listener for ${event}:`, error);
        }
      });
    }

    // Wait for all async operations to complete
    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }

    return eventData;
  }

  callListeners(event, eventData) {
    if (!this.listeners.has(event)) return;

    const listeners = [...this.listeners.get(event)];
    
    listeners.forEach(listener => {
      if (eventData.propagationStopped) return;
      
      try {
        if (listener.context) {
          listener.callback.call(listener.context, eventData);
        } else {
          listener.callback(eventData);
        }
      } catch (error) {
        console.error(`📡 Error in event listener for ${event}:`, error);
      }
    });
  }

  callOnceListeners(event, eventData) {
    if (!this.onceListeners.has(event)) return;

    const listeners = [...this.onceListeners.get(event)];
    this.onceListeners.delete(event);
    
    listeners.forEach(listener => {
      if (eventData.propagationStopped) return;
      
      try {
        if (listener.context) {
          listener.callback.call(listener.context, eventData);
        } else {
          listener.callback(eventData);
        }
      } catch (error) {
        console.error(`📡 Error in one-time event listener for ${event}:`, error);
      }
    });
  }

  callWildcardListeners(eventData) {
    this.wildcardListeners.forEach(listener => {
      if (eventData.propagationStopped) return;
      
      try {
        if (listener.context) {
          listener.callback.call(listener.context, eventData);
        } else {
          listener.callback(eventData);
        }
      } catch (error) {
        console.error('📡 Error in wildcard event listener:', error);
      }
    });
  }

  // Add wildcard listener (listens to all events)
  onAny(callback, context = null) {
    const listener = {
      callback,
      context,
      id: this.generateListenerId()
    };

    this.wildcardListeners.add(listener);

    return () => this.offAny(callback, context);
  }

  // Remove wildcard listener
  offAny(callback = null, context = null) {
    if (callback === null) {
      this.wildcardListeners.clear();
      return;
    }

    const listener = Array.from(this.wildcardListeners).find(l => 
      l.callback === callback && (context === null || l.context === context)
    );

    if (listener) {
      this.wildcardListeners.delete(listener);
    }
  }

  // Stop event propagation
  stopPropagation(eventData) {
    eventData.propagationStopped = true;
  }

  // Event history and debugging
  addToHistory(eventData) {
    this.eventHistory.push({
      type: eventData.type,
      data: eventData.data,
      timestamp: eventData.timestamp
    });

    // Trim history if it gets too large
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.splice(0, this.eventHistory.length - this.maxHistorySize);
    }
  }

  // Get event history
  getHistory(eventType = null, limit = 100) {
    let history = this.eventHistory;
    
    if (eventType) {
      history = history.filter(event => event.type === eventType);
    }

    return history.slice(-limit);
  }

  // Clear event history
  clearHistory() {
    this.eventHistory = [];
  }

  // Enable/disable debug mode
  setDebugMode(enabled) {
    this.debugMode = enabled;
    if (enabled) {
      console.log('📡 Event Bus debug mode enabled');
    }
  }

  // Get listener count for an event
  getListenerCount(event) {
    const regularCount = this.listeners.has(event) ? this.listeners.get(event).length : 0;
    const onceCount = this.onceListeners.has(event) ? this.onceListeners.get(event).length : 0;
    return regularCount + onceCount;
  }

  // Get all events that have listeners
  getEvents() {
    const events = new Set();
    
    this.listeners.forEach((_, event) => events.add(event));
    this.onceListeners.forEach((_, event) => events.add(event));
    
    return Array.from(events);
  }

  // Remove all listeners
  removeAllListeners() {
    this.listeners.clear();
    this.onceListeners.clear();
    this.wildcardListeners.clear();
    
    if (this.debugMode) {
      console.log('📡 All event listeners removed');
    }
  }

  // Create a namespaced event bus
  namespace(prefix) {
    return {
      on: (event, callback, context) => this.on(`${prefix}:${event}`, callback, context),
      once: (event, callback, context) => this.once(`${prefix}:${event}`, callback, context),
      off: (event, callback, context) => this.off(`${prefix}:${event}`, callback, context),
      emit: (event, data) => this.emit(`${prefix}:${event}`, data),
      emitAsync: (event, data) => this.emitAsync(`${prefix}:${event}`, data)
    };
  }

  // Event pipe - connect two events
  pipe(sourceEvent, targetEvent, transform = null) {
    return this.on(sourceEvent, (eventData) => {
      const data = transform ? transform(eventData.data) : eventData.data;
      this.emit(targetEvent, data);
    });
  }

  // Event filter - only emit if condition is met
  filter(sourceEvent, targetEvent, predicate) {
    return this.on(sourceEvent, (eventData) => {
      if (predicate(eventData.data)) {
        this.emit(targetEvent, eventData.data);
      }
    });
  }

  // Event throttle - limit emission rate
  throttle(sourceEvent, targetEvent, delay) {
    let lastEmitTime = 0;
    
    return this.on(sourceEvent, (eventData) => {
      const now = performance.now();
      if (now - lastEmitTime >= delay) {
        this.emit(targetEvent, eventData.data);
        lastEmitTime = now;
      }
    });
  }

  // Event debounce - only emit after delay with no new events
  debounce(sourceEvent, targetEvent, delay) {
    let timeoutId = null;
    
    return this.on(sourceEvent, (eventData) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        this.emit(targetEvent, eventData.data);
        timeoutId = null;
      }, delay);
    });
  }

  // Utility methods
  generateListenerId() {
    return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get statistics
  getStats() {
    return {
      totalListeners: Array.from(this.listeners.values()).reduce((sum, arr) => sum + arr.length, 0),
      totalOnceListeners: Array.from(this.onceListeners.values()).reduce((sum, arr) => sum + arr.length, 0),
      wildcardListeners: this.wildcardListeners.size,
      totalEvents: this.getEvents().length,
      historySize: this.eventHistory.length
    };
  }

  // Cleanup
  destroy() {
    this.removeAllListeners();
    this.clearHistory();
    console.log('📡 Event Bus destroyed');
  }
}

export default EventBus;