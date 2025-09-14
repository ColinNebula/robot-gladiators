/**
 * Asset Manager - Comprehensive Asset Loading and Management
 * 
 * Handles loading, caching, and management of all game assets including
 * images, audio, fonts, and data files with progress tracking and optimization.
 */

export class AssetManager {
  constructor() {
    // Asset storage
    this.assets = new Map();
    this.loadingAssets = new Map();
    this.failedAssets = new Set();
    
    // Asset types
    this.assetTypes = {
      image: { extensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp'], loader: 'loadImage' },
      audio: { extensions: ['.mp3', '.wav', '.ogg', '.m4a'], loader: 'loadAudio' },
      font: { extensions: ['.ttf', '.otf', '.woff', '.woff2'], loader: 'loadFont' },
      json: { extensions: ['.json'], loader: 'loadJSON' },
      text: { extensions: ['.txt', '.xml', '.csv'], loader: 'loadText' },
      binary: { extensions: ['.bin', '.dat'], loader: 'loadBinary' }
    };
    
    // Loading state
    this.loadingQueue = [];
    this.totalAssets = 0;
    this.loadedAssets = 0;
    this.isLoading = false;
    
    // Configuration
    this.config = {
      baseURL: '',
      maxConcurrent: 6,
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      enableCache: true,
      enableCompression: false
    };
    
    // Progress tracking
    this.progress = {
      loaded: 0,
      total: 0,
      percentage: 0,
      currentAsset: null,
      timeStarted: 0,
      timeEstimated: 0
    };
    
    // Event callbacks
    this.callbacks = {
      onProgress: null,
      onComplete: null,
      onError: null,
      onAssetLoaded: null
    };
    
    // Statistics
    this.stats = {
      totalLoaded: 0,
      totalFailed: 0,
      totalSize: 0,
      averageLoadTime: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
    
    console.log('📦 Asset Manager initialized');
  }

  // Asset loading methods
  async load(path, type = null, options = {}) {
    // Determine asset type if not provided
    if (!type) {
      type = this.detectAssetType(path);
    }
    
    // Check cache first
    if (this.config.enableCache && this.assets.has(path)) {
      this.stats.cacheHits++;
      return this.assets.get(path);
    }
    
    this.stats.cacheMisses++;
    
    // Check if already loading
    if (this.loadingAssets.has(path)) {
      return this.loadingAssets.get(path);
    }
    
    // Create loading promise
    const loadingPromise = this.loadAsset(path, type, options);
    this.loadingAssets.set(path, loadingPromise);
    
    try {
      const asset = await loadingPromise;
      this.loadingAssets.delete(path);
      
      // Store in cache
      if (this.config.enableCache) {
        this.assets.set(path, asset);
      }
      
      // Update statistics
      this.stats.totalLoaded++;
      this.updateLoadTime(asset.loadTime);
      
      // Callback
      if (this.callbacks.onAssetLoaded) {
        this.callbacks.onAssetLoaded(path, asset);
      }
      
      return asset;
      
    } catch (error) {
      this.loadingAssets.delete(path);
      this.failedAssets.add(path);
      this.stats.totalFailed++;
      
      if (this.callbacks.onError) {
        this.callbacks.onError(path, error);
      }
      
      throw error;
    }
  }

  async loadAsset(path, type, options) {
    const startTime = performance.now();
    const fullPath = this.resolvePath(path);
    
    // Get appropriate loader
    const loaderMethod = this.assetTypes[type]?.loader;
    if (!loaderMethod || !this[loaderMethod]) {
      throw new Error(`Unknown asset type: ${type}`);
    }
    
    // Load with retries
    let lastError;
    for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const data = await this[loaderMethod](fullPath, options);
        const loadTime = performance.now() - startTime;
        
        return {
          path,
          type,
          data,
          loadTime,
          size: this.estimateAssetSize(data),
          timestamp: Date.now()
        };
        
      } catch (error) {
        lastError = error;
        
        if (attempt < this.config.retryAttempts) {
          console.warn(`📦 Asset load failed (attempt ${attempt + 1}/${this.config.retryAttempts + 1}): ${path}`);
          await this.delay(this.config.retryDelay * (attempt + 1));
        }
      }
    }
    
    throw lastError;
  }

  // Specific asset loaders
  async loadImage(path, options = {}) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const timeout = setTimeout(() => {
        reject(new Error(`Image load timeout: ${path}`));
      }, this.config.timeout);
      
      img.onload = () => {
        clearTimeout(timeout);
        resolve(img);
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error(`Failed to load image: ${path}`));
      };
      
      if (options.crossOrigin) {
        img.crossOrigin = options.crossOrigin;
      }
      
      img.src = path;
    });
  }

  async loadAudio(path, options = {}) {
    if (window.AudioContext || window.webkitAudioContext) {
      // Load with Web Audio API
      try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const arrayBuffer = await response.arrayBuffer();
        return { arrayBuffer, url: path };
      } catch (error) {
        // Fallback to HTML Audio
        console.warn('📦 Web Audio loading failed, falling back to HTML Audio');
      }
    }
    
    // HTML Audio fallback
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const timeout = setTimeout(() => {
        reject(new Error(`Audio load timeout: ${path}`));
      }, this.config.timeout);
      
      audio.addEventListener('canplaythrough', () => {
        clearTimeout(timeout);
        resolve(audio);
      });
      
      audio.addEventListener('error', () => {
        clearTimeout(timeout);
        reject(new Error(`Failed to load audio: ${path}`));
      });
      
      if (options.crossOrigin) {
        audio.crossOrigin = options.crossOrigin;
      }
      
      audio.src = path;
      audio.load();
    });
  }

  async loadFont(path, options = {}) {
    const fontName = options.fontName || this.extractFileName(path);
    
    if ('FontFace' in window) {
      // Modern font loading
      const response = await fetch(path);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const fontData = await response.arrayBuffer();
      const fontFace = new FontFace(fontName, fontData);
      
      await fontFace.load();
      document.fonts.add(fontFace);
      
      return { fontFace, fontName };
    } else {
      // Fallback font loading
      return new Promise((resolve, reject) => {
        const style = document.createElement('style');
        style.textContent = `
          @font-face {
            font-family: '${fontName}';
            src: url('${path}');
          }
        `;
        
        document.head.appendChild(style);
        
        // Simple font load detection
        setTimeout(() => {
          resolve({ fontName });
        }, 1000);
      });
    }
  }

  async loadJSON(path, options = {}) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    
    return await response.json();
  }

  async loadText(path, options = {}) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    
    return await response.text();
  }

  async loadBinary(path, options = {}) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    
    return await response.arrayBuffer();
  }

  // Batch loading
  async loadBatch(assetList, options = {}) {
    this.isLoading = true;
    this.progress.timeStarted = performance.now();
    this.progress.total = assetList.length;
    this.progress.loaded = 0;
    
    const results = new Map();
    const errors = new Map();
    
    // Process assets in batches
    const batches = this.createBatches(assetList, this.config.maxConcurrent);
    
    for (const batch of batches) {
      const promises = batch.map(async (asset) => {
        const { path, type, options: assetOptions } = this.normalizeAssetConfig(asset);
        
        try {
          this.progress.currentAsset = path;
          if (this.callbacks.onProgress) {
            this.callbacks.onProgress(this.progress);
          }
          
          const result = await this.load(path, type, assetOptions);
          results.set(path, result);
          
          this.progress.loaded++;
          this.progress.percentage = (this.progress.loaded / this.progress.total) * 100;
          
          if (this.callbacks.onProgress) {
            this.callbacks.onProgress(this.progress);
          }
          
        } catch (error) {
          errors.set(path, error);
          console.error(`📦 Failed to load asset: ${path}`, error);
        }
      });
      
      await Promise.allSettled(promises);
    }
    
    this.isLoading = false;
    this.progress.currentAsset = null;
    
    const result = {
      assets: results,
      errors,
      totalLoaded: results.size,
      totalFailed: errors.size,
      loadTime: performance.now() - this.progress.timeStarted
    };
    
    if (this.callbacks.onComplete) {
      this.callbacks.onComplete(result);
    }
    
    return result;
  }

  // Asset manifest loading
  async loadManifest(manifestPath, baseURL = '') {
    const manifest = await this.load(manifestPath, 'json');
    const assetList = [];
    
    // Parse manifest
    if (Array.isArray(manifest.data)) {
      manifest.data.forEach(asset => {
        if (typeof asset === 'string') {
          assetList.push({ path: baseURL + asset });
        } else {
          assetList.push({
            ...asset,
            path: baseURL + asset.path
          });
        }
      });
    } else if (manifest.data.assets) {
      Object.entries(manifest.data.assets).forEach(([key, asset]) => {
        if (typeof asset === 'string') {
          assetList.push({ path: baseURL + asset, key });
        } else {
          assetList.push({
            ...asset,
            path: baseURL + asset.path,
            key
          });
        }
      });
    }
    
    return this.loadBatch(assetList);
  }

  // Asset management
  get(path) {
    const asset = this.assets.get(path);
    return asset ? asset.data : null;
  }

  has(path) {
    return this.assets.has(path);
  }

  remove(path) {
    const removed = this.assets.delete(path);
    this.failedAssets.delete(path);
    return removed;
  }

  clear() {
    this.assets.clear();
    this.loadingAssets.clear();
    this.failedAssets.clear();
    this.resetProgress();
  }

  // Utility methods
  detectAssetType(path) {
    const extension = this.getFileExtension(path).toLowerCase();
    
    for (const [type, config] of Object.entries(this.assetTypes)) {
      if (config.extensions.includes(extension)) {
        return type;
      }
    }
    
    return 'binary'; // Default fallback
  }

  getFileExtension(path) {
    const lastDot = path.lastIndexOf('.');
    return lastDot !== -1 ? path.substring(lastDot) : '';
  }

  extractFileName(path) {
    const parts = path.split('/');
    const fileName = parts[parts.length - 1];
    const dotIndex = fileName.lastIndexOf('.');
    return dotIndex !== -1 ? fileName.substring(0, dotIndex) : fileName;
  }

  resolvePath(path) {
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
      return path;
    }
    return this.config.baseURL + path;
  }

  normalizeAssetConfig(asset) {
    if (typeof asset === 'string') {
      return { path: asset, type: null, options: {} };
    }
    return {
      path: asset.path,
      type: asset.type || null,
      options: asset.options || {}
    };
  }

  createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  estimateAssetSize(data) {
    if (data instanceof Image) {
      return data.width * data.height * 4; // Estimate RGBA bytes
    } else if (data instanceof ArrayBuffer) {
      return data.byteLength;
    } else if (typeof data === 'string') {
      return data.length * 2; // Estimate UTF-16 bytes
    } else if (data instanceof HTMLAudioElement) {
      return 0; // Cannot reliably estimate
    }
    return 0;
  }

  updateLoadTime(loadTime) {
    const total = this.stats.averageLoadTime * this.stats.totalLoaded;
    this.stats.averageLoadTime = (total + loadTime) / (this.stats.totalLoaded + 1);
  }

  resetProgress() {
    this.progress = {
      loaded: 0,
      total: 0,
      percentage: 0,
      currentAsset: null,
      timeStarted: 0,
      timeEstimated: 0
    };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Configuration
  setConfig(config) {
    this.config = { ...this.config, ...config };
  }

  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  setBaseURL(baseURL) {
    this.config.baseURL = baseURL.endsWith('/') ? baseURL : baseURL + '/';
  }

  // Statistics and debugging
  getStats() {
    return {
      ...this.stats,
      cached: this.assets.size,
      loading: this.loadingAssets.size,
      failed: this.failedAssets.size,
      totalSize: this.getTotalSize()
    };
  }

  getTotalSize() {
    let totalSize = 0;
    this.assets.forEach(asset => {
      totalSize += asset.size || 0;
    });
    return totalSize;
  }

  getLoadedAssets() {
    return Array.from(this.assets.keys());
  }

  getFailedAssets() {
    return Array.from(this.failedAssets);
  }

  getLoadingAssets() {
    return Array.from(this.loadingAssets.keys());
  }

  getProgress() {
    return { ...this.progress };
  }

  // Memory management
  unloadUnused(keepList = []) {
    const keepSet = new Set(keepList);
    const toRemove = [];
    
    this.assets.forEach((asset, path) => {
      if (!keepSet.has(path)) {
        toRemove.push(path);
      }
    });
    
    toRemove.forEach(path => this.remove(path));
    
    return toRemove.length;
  }

  preload(assetList) {
    // Start loading assets in background without blocking
    this.loadBatch(assetList).catch(error => {
      console.warn('📦 Preload failed:', error);
    });
  }

  // Cleanup
  destroy() {
    this.clear();
    this.callbacks = {};
    console.log('📦 Asset Manager destroyed');
  }
}

export default AssetManager;