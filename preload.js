// preload.js — runs in renderer context with Node access before page loads
// Currently kept minimal; add IPC bridges here if needed in the future.

const { contextBridge, ipcRenderer } = require('electron');

// Expose a safe API to the renderer (FloatFinder.html) if needed
contextBridge.exposeInMainWorld('electronAPI', {
  // App version info
  getVersion: () => process.versions.electron,
  // Platform info (useful for platform-specific UI tweaks)
  platform: process.platform,
});
