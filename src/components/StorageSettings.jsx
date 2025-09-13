import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useStorageManager, useGameSettings } from '../hooks/useStorage';

const StorageSettings = () => {
  const { 
    stats, 
    loading, 
    refreshStats, 
    exportData, 
    importData, 
    cleanup, 
    clearAll 
  } = useStorageManager();
  
  const { value: settings, setValue: setSettings } = useGameSettings();
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const success = await exportData();
      if (success) {
        alert('Game data exported successfully!');
      } else {
        alert('Failed to export game data.');
      }
    } catch (error) {
      alert(`Export failed: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImporting(true);
    try {
      const result = await importData(file);
      alert(`Import completed! Successfully imported ${result.imported.length} items. ${result.failed.length} items failed.`);
    } catch (error) {
      alert(`Import failed: ${error.message}`);
    } finally {
      setImporting(false);
      event.target.value = ''; // Reset file input
    }
  };

  const handleCleanup = async () => {
    if (!confirm('Clean up old cache data? This will remove temporary files and expired cache.')) {
      return;
    }

    setCleaning(true);
    try {
      const removedCount = await cleanup();
      alert(`Cleanup completed! Removed ${removedCount} expired items.`);
    } catch (error) {
      alert(`Cleanup failed: ${error.message}`);
    } finally {
      setCleaning(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('⚠️ This will delete ALL game data including settings, progress, and high scores. Are you sure?')) {
      return;
    }

    if (!confirm('This action cannot be undone. Please confirm you want to delete everything.')) {
      return;
    }

    try {
      const success = await clearAll();
      if (success) {
        alert('All data cleared successfully. The page will reload.');
        window.location.reload();
      } else {
        alert('Failed to clear all data.');
      }
    } catch (error) {
      alert(`Clear all failed: ${error.message}`);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStoragePercentage = (used, total) => {
    if (!total) return 0;
    return Math.round((used / total) * 100);
  };

  if (loading && !stats) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '200px',
        color: '#fff'
      }}>
        Loading storage information...
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2rem',
        color: '#fff'
      }}
    >
      <h2 style={{
        fontSize: '2rem',
        marginBottom: '2rem',
        textAlign: 'center',
        background: 'linear-gradient(45deg, #4facfe, #00f2fe)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        Storage Management
      </h2>

      {/* Storage Statistics */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '15px',
          padding: '1.5rem',
          marginBottom: '2rem',
          border: '1px solid rgba(79, 172, 254, 0.3)'
        }}
      >
        <h3 style={{ marginBottom: '1rem', color: '#4facfe' }}>📊 Storage Statistics</h3>
        
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {/* Local Storage */}
            <div style={{
              background: 'rgba(79, 172, 254, 0.1)',
              padding: '1rem',
              borderRadius: '10px',
              border: '1px solid rgba(79, 172, 254, 0.3)'
            }}>
              <h4 style={{ color: '#4facfe', marginBottom: '0.5rem' }}>💾 Persistent Storage</h4>
              <p>Size: {formatBytes(stats.localStorage.size)}</p>
              <p>Items: {stats.localStorage.count}</p>
              {stats.quota && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '10px',
                    height: '8px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      background: 'linear-gradient(90deg, #4facfe, #00f2fe)',
                      height: '100%',
                      width: `${getStoragePercentage(stats.localStorage.size, stats.quota.quota)}%`,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <small style={{ color: '#ccc' }}>
                    {getStoragePercentage(stats.localStorage.size, stats.quota.quota)}% of available quota
                  </small>
                </div>
              )}
            </div>

            {/* Session Storage */}
            <div style={{
              background: 'rgba(255, 193, 7, 0.1)',
              padding: '1rem',
              borderRadius: '10px',
              border: '1px solid rgba(255, 193, 7, 0.3)'
            }}>
              <h4 style={{ color: '#ffc107', marginBottom: '0.5rem' }}>⏳ Session Storage</h4>
              <p>Size: {formatBytes(stats.sessionStorage.size)}</p>
              <p>Items: {stats.sessionStorage.count}</p>
            </div>

            {/* Memory Storage */}
            <div style={{
              background: 'rgba(40, 167, 69, 0.1)',
              padding: '1rem',
              borderRadius: '10px',
              border: '1px solid rgba(40, 167, 69, 0.3)'
            }}>
              <h4 style={{ color: '#28a745', marginBottom: '0.5rem' }}>🧠 Memory Cache</h4>
              <p>Items: {stats.memoryStorage.count}</p>
              <p>Compression: {stats.compressionEnabled ? '✅ Enabled' : '❌ Disabled'}</p>
            </div>
          </div>
        )}

        <button
          onClick={refreshStats}
          disabled={loading}
          style={{
            background: 'linear-gradient(45deg, #4facfe, #00f2fe)',
            border: 'none',
            color: '#fff',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            cursor: 'pointer',
            marginTop: '1rem',
            fontSize: '0.9rem'
          }}
        >
          🔄 Refresh Stats
        </button>
      </motion.div>

      {/* Storage Settings */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '15px',
          padding: '1.5rem',
          marginBottom: '2rem',
          border: '1px solid rgba(79, 172, 254, 0.3)'
        }}
      >
        <h3 style={{ marginBottom: '1rem', color: '#4facfe' }}>⚙️ Storage Settings</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={settings?.autoSave ?? true}
              onChange={(e) => setSettings({ ...settings, autoSave: e.target.checked })}
              style={{ transform: 'scale(1.2)' }}
            />
            <span>Auto-save game data</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={settings?.compressData ?? false}
              onChange={(e) => setSettings({ ...settings, compressData: e.target.checked })}
              style={{ transform: 'scale(1.2)' }}
            />
            <span>Compress large data (requires modern browser)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={settings?.syncAcrossTabs ?? true}
              onChange={(e) => setSettings({ ...settings, syncAcrossTabs: e.target.checked })}
              style={{ transform: 'scale(1.2)' }}
            />
            <span>Sync settings across browser tabs</span>
          </label>
        </div>
      </motion.div>

      {/* Storage Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '15px',
          padding: '1.5rem',
          border: '1px solid rgba(79, 172, 254, 0.3)'
        }}
      >
        <h3 style={{ marginBottom: '1rem', color: '#4facfe' }}>🔧 Storage Actions</h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem' 
        }}>
          <button
            onClick={handleExport}
            disabled={exporting}
            style={{
              background: 'linear-gradient(45deg, #28a745, #20c997)',
              border: 'none',
              color: '#fff',
              padding: '1rem',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            {exporting ? '📤 Exporting...' : '📥 Export Data'}
          </button>

          <label style={{
            background: 'linear-gradient(45deg, #17a2b8, #138496)',
            border: 'none',
            color: '#fff',
            padding: '1rem',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
            textAlign: 'center',
            display: 'block'
          }}>
            {importing ? '📥 Importing...' : '📤 Import Data'}
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={importing}
              style={{ display: 'none' }}
            />
          </label>

          <button
            onClick={handleCleanup}
            disabled={cleaning}
            style={{
              background: 'linear-gradient(45deg, #ffc107, #e0a800)',
              border: 'none',
              color: '#fff',
              padding: '1rem',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            {cleaning ? '🧹 Cleaning...' : '🧹 Clean Cache'}
          </button>

          <button
            onClick={handleClearAll}
            style={{
              background: 'linear-gradient(45deg, #dc3545, #c82333)',
              border: 'none',
              color: '#fff',
              padding: '1rem',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            🗑️ Clear All Data
          </button>
        </div>

        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          background: 'rgba(255, 193, 7, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 193, 7, 0.3)'
        }}>
          <h4 style={{ color: '#ffc107', marginBottom: '0.5rem' }}>💡 Tips:</h4>
          <ul style={{ color: '#ccc', fontSize: '0.9rem', lineHeight: '1.5' }}>
            <li>Export your data regularly to back up your progress</li>
            <li>Clean cache periodically to free up storage space</li>
            <li>Enable compression for better storage efficiency</li>
            <li>Session storage is cleared when you close the browser</li>
          </ul>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default StorageSettings;