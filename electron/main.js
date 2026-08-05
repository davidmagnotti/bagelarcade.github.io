// Tidefarer — Electron main process (desktop / Steam shell).
//
// The game itself is 100% self-contained: procedural art, synthesized audio,
// no network, no external assets. So all this shell does is open a window,
// load the existing tidefarer/index.html straight off disk (file://), and
// bridge the game's localStorage saves to a plain file that Steam Cloud can
// sync. No changes to the game code are required.

const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// A fixed app name gives us a deterministic userData folder ("Tidefarer") that
// we can point Steam Auto-Cloud at (see README for the per-OS paths).
app.setName('Tidefarer');

// Where the Cloud-syncable save mirror lives. See preload.js for the mirror
// logic and README.md for how to register this path in Steamworks Auto-Cloud.
const SAVE_DIR = path.join(app.getPath('userData'), 'steam_cloud');
const SAVE_FILE = path.join(SAVE_DIR, 'tidefarer-save.json');

function gameIndexPath() {
  // In development the game lives one level up in the repo; when packaged we
  // ship the whole tidefarer/ folder as an extra resource (see the
  // "extraResources" entry in package.json's build config).
  return app.isPackaged
    ? path.join(process.resourcesPath, 'tidefarer', 'index.html')
    : path.join(__dirname, '..', 'tidefarer', 'index.html');
}

function readSave() {
  try {
    return fs.readFileSync(SAVE_FILE, 'utf8');
  } catch {
    return null;
  }
}

// Synchronous read: the preload restores the save BEFORE the game's scripts
// parse and read localStorage, so it has to block for this tiny local file.
ipcMain.on('cloud:read-sync', (event) => {
  event.returnValue = readSave();
});

ipcMain.handle('cloud:write', (_event, blob) => {
  try {
    fs.mkdirSync(SAVE_DIR, { recursive: true });
    fs.writeFileSync(SAVE_FILE, blob);
    return true;
  } catch {
    return false;
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: '#0c0c0d',
    fullscreen: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // Keep the game's animation loop running at full rate even when the
      // window loses focus / is occluded (matters for a real-time game).
      backgroundThrottling: false,
    },
  });

  Menu.setApplicationMenu(null);
  win.loadFile(gameIndexPath());

  // F11 toggles fullscreen; the game starts fullscreen to match its manifest.
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') {
      win.setFullScreen(!win.isFullScreen());
      event.preventDefault();
    }
  });

  return win;
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
