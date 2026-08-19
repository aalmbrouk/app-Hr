// @ts-ignore
import path from 'path';
// @ts-ignore
import fs from 'fs';
import { setupStorageIPC } from './mainStorage';

// @ts-ignore
const electron = typeof require !== 'undefined' ? require('electron') : null;
const app = electron?.app;
const BrowserWindow = electron?.BrowserWindow;

let mainWindow: any = null;

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.cjs');
  console.log('[Main Process] Starting Electron Window...');
  console.log('[Main Process] Preload path resolved to:', preloadPath, 'exists:', fs.existsSync(preloadPath));

  if (!BrowserWindow) {
    console.error('[Main Process ERROR] BrowserWindow not available in current environment');
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'منظومة إدارة الموارد البشرية - مصرف الدم المركزي',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  // Setup IPC storage handlers
  setupStorageIPC(electron, fs, path);

  // Load production dist/index.html or dev server
  const indexPath = path.join(__dirname, '../dist/index.html');
  if (fs.existsSync(indexPath)) {
    console.log('[Main Process] Loading production build from:', indexPath);
    mainWindow.loadFile(indexPath);
  } else {
    console.log('[Main Process] Loading development server from http://localhost:3000');
    mainWindow.loadURL('http://localhost:3000');
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

if (app) {
  app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow && BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}

