/**
 * OmniAI v4 — Electron Desktop App Entry Point
 * File: templates/electron-main.js
 *
 * This file creates a desktop application wrapper for OmniAI v4.
 * Use this if you want a native desktop app instead of (or in addition to) the web interface.
 *
 * SETUP:
 * 1. Copy this to your project root as: electron-main.js
 * 2. Install Electron: npm install --save-dev electron
 * 3. Add to package.json scripts: "desktop": "electron electron-main.js"
 * 4. Run: npm run desktop
 */

'use strict';

const { app, BrowserWindow, Menu, Tray, shell, dialog, ipcMain } = require('electron');
const path  = require('path');
const fs    = require('fs');

// Load environment variables
require('dotenv').config();

// ── Configuration ─────────────────────────────────────────────────────────────
const CONFIG = {
  // The URL to load — use localhost for dev, your Vercel URL for production
  url:   process.env.OMNI_AI_URL
      || process.env.DEPLOY_URL
      || (fs.existsSync('.deploy-url') ? fs.readFileSync('.deploy-url', 'utf8').trim() : null)
      || 'http://localhost:3000',
  title:  'OmniAI v4',
  width:  1200,
  height: 800,
  icon:   path.join(__dirname, 'assets', 'icon.png'), // Add your icon here
};

// ── State ─────────────────────────────────────────────────────────────────────
let mainWindow = null;
let tray       = null;

// ── App Lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();
  createTrayIcon();
  setupMenu();

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // On macOS, keep app running even with all windows closed (tray icon stays)
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ── Window Creation ───────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width:  CONFIG.width,
    height: CONFIG.height,
    minWidth:  800,
    minHeight: 600,
    title:  CONFIG.title,
    icon:   fs.existsSync(CONFIG.icon) ? CONFIG.icon : undefined,
    webPreferences: {
      nodeIntegration:     false,
      contextIsolation:    true,
      webSecurity:         true,
      allowRunningInsecureContent: false,
      preload: path.join(__dirname, 'electron-preload.js'),
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false, // Show only after content loads (prevents flash)
  });

  // Show window gracefully after page loads
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load the OmniAI interface
  mainWindow.loadURL(CONFIG.url).catch(() => {
    // If the URL fails, show a helpful error page
    mainWindow.loadURL(`data:text/html,
      <html>
        <body style="font-family: sans-serif; padding: 40px; text-align: center;">
          <h1>🤖 OmniAI v4</h1>
          <p>Could not connect to: <code>${CONFIG.url}</code></p>
          <p>Make sure OmniAI is running, then restart the app.</p>
          <p><small>To run locally: <code>npm run dev</code></small></p>
        </body>
      </html>
    `);
  });

  // Open external links in the default browser (not in Electron)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ── Tray Icon ─────────────────────────────────────────────────────────────────
function createTrayIcon() {
  // Skip tray if no icon file exists
  if (!fs.existsSync(CONFIG.icon)) return;

  tray = new Tray(CONFIG.icon);
  tray.setToolTip('OmniAI v4 — Click to open');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open OmniAI',        click: () => { if (mainWindow) mainWindow.show(); else createWindow(); } },
    { label: 'Open in Browser',    click: () => shell.openExternal(CONFIG.url) },
    { type: 'separator' },
    { label: 'Check for Updates',  click: checkForUpdates },
    { label: 'Settings',           click: openSettings },
    { type: 'separator' },
    { label: 'Quit OmniAI',        click: () => app.quit() },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    } else {
      createWindow();
    }
  });
}

// ── Menu ──────────────────────────────────────────────────────────────────────
function setupMenu() {
  const template = [
    ...(process.platform === 'darwin' ? [{
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    }] : []),
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        {
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
          click: () => { mainWindow && mainWindow.webContents.toggleDevTools(); },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        { label: 'Open Implementation Guide', click: () => shell.openPath(path.join(__dirname, 'IMPLEMENTATION_GUIDE.md')) },
        { label: 'Report an Issue', click: () => shell.openExternal('https://github.com/paulglasow/omni-ai-automation/issues') },
        { label: 'GitHub Repository', click: () => shell.openExternal('https://github.com/paulglasow/omni-ai-automation') },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function checkForUpdates() {
  shell.openExternal('https://github.com/paulglasow/omni-ai-automation/releases');
}

function openSettings() {
  // Open the settings page within OmniAI
  if (mainWindow) {
    mainWindow.show();
    mainWindow.loadURL(`${CONFIG.url}/settings`).catch(() => {});
  }
}

// ── IPC Handlers ──────────────────────────────────────────────────────────────
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('open-external', (_, url) => shell.openExternal(url));
ipcMain.handle('show-save-dialog', async (_, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});
