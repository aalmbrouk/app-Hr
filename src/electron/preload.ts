/**
 * Electron Preload Script exposing storage API to the React window context
 */

// Helper to safely get ipcRenderer
function getIpcRenderer() {
  try {
    // @ts-ignore
    if (typeof require !== 'undefined') {
      // @ts-ignore
      const electron = require('electron');
      if (electron?.ipcRenderer) return electron.ipcRenderer;
    }
  } catch (e) {
    console.error('[Preload] require("electron") failed:', e);
  }
  return typeof window !== 'undefined' ? (window as any).ipcRenderer : null;
}

export const electronAPI = {
  loadData: () => {
    const ipc = getIpcRenderer();
    console.log('[Preload] loadData invoked. ipcRenderer found:', !!ipc);
    return ipc?.invoke('storage:loadData');
  },
  saveData: (data: any) => {
    const ipc = getIpcRenderer();
    return ipc?.invoke('storage:saveData', data);
  },
  exportBackup: (defaultFileName?: string, data?: any) => {
    const ipc = getIpcRenderer();
    console.log('[Preload DEBUG] exportBackup invoked in preload. defaultFileName:', defaultFileName, 'data present:', !!data, 'ipcRenderer available:', !!ipc);
    if (!ipc) {
      console.error('[Preload ERROR] ipcRenderer is not available in preload exportBackup!');
      return Promise.resolve({ success: false, error: 'ipcRenderer not available in preload' });
    }
    return ipc.invoke('storage:exportBackup', defaultFileName, data);
  },
  getAppInfo: () => {
    const ipc = getIpcRenderer();
    return ipc?.invoke('storage:getAppInfo');
  }
};

// Safely expose to renderer if in preload environment
if (typeof window !== 'undefined') {
  try {
    // @ts-ignore
    const contextBridge = typeof require !== 'undefined' ? require('electron')?.contextBridge : null;
    console.log('[Preload] Exposing electronAPI. contextBridge available:', !!contextBridge);
    if (contextBridge) {
      contextBridge.exposeInMainWorld('electronAPI', electronAPI);
    } else {
      (window as any).electronAPI = electronAPI;
    }
  } catch (error) {
    console.error('[Preload ERROR] contextBridge error:', error);
    (window as any).electronAPI = electronAPI;
  }
}

