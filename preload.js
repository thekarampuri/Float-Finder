// preload.js — runs in renderer context with Node access before page loads
// Currently kept minimal; add IPC bridges here if needed in the future.

const { contextBridge, ipcRenderer } = require('electron');

// Expose a safe API to the renderer (FloatFinder.html) if needed
contextBridge.exposeInMainWorld('electronAPI', {
  // App version info
  getVersion: () => process.versions.electron,
  // Platform info (useful for platform-specific UI tweaks)
  platform: process.platform,
  // File operations
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  saveFile: (filePath, dataBuffer) => ipcRenderer.invoke('save-file', filePath, dataBuffer),
  // Licensing
  getMachineId: () => ipcRenderer.invoke('get-machine-id'),
  submitLicense: (key) => ipcRenderer.invoke('submit-license', key),
  quitApp: () => ipcRenderer.send('quit-app')
});
