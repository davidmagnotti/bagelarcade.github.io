// Tidefarer — Electron main process (desktop / Steam shell).
//
// The game itself is 100% self-contained: procedural art, synthesized audio,
// no network, no external assets. This shell opens a window, serves the
// existing tidefarer/ folder from a tiny localhost HTTP server, and bridges the
// game's localStorage saves to a plain file that Steam Cloud can sync. No
// changes to the game code are required.
//
// Why a local HTTP server instead of loadFile()/file:// ? Chromium treats
// file:// pages as an *opaque origin* with restricted storage and, on some
// setups, aborts WebGL page loads outright (ERR_FAILED). Serving over
// http://127.0.0.1 gives the game a normal, stable web origin — exactly like
// the live site — which is far more robust.

const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

// A fixed app name gives us a deterministic userData folder ("Tidefarer") that
// we can point Steam Auto-Cloud at (see README for the per-OS paths).
app.setName('Tidefarer');

// Where the Cloud-syncable save mirror lives. See preload.js for the mirror
// logic and README.md for how to register this path in Steamworks Auto-Cloud.
const SAVE_DIR = path.join(app.getPath('userData'), 'steam_cloud');
const SAVE_FILE = path.join(SAVE_DIR, 'tidefarer-save.json');

function gameDir() {
  // In development the game lives one level up in the repo; when packaged we
  // ship the whole tidefarer/ folder as an extra resource (see the
  // "extraResources" entry in package.json's build config).
  return app.isPackaged
    ? path.join(process.resourcesPath, 'tidefarer')
    : path.join(__dirname, '..', 'tidefarer');
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.webp': 'image/webp',
};

// Serve the game folder over localhost. Returns a promise for the chosen port.
function startGameServer() {
  const root = gameDir();
  const server = http.createServer((req, res) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    } catch {
      res.writeHead(400).end();
      return;
    }
    if (pathname === '/') pathname = '/index.html';

    // The offline service worker is pointless in the desktop build (everything
    // is already local) and its cache-first behaviour would serve stale files
    // across updates — 404 it so the guarded registration silently no-ops.
    if (pathname === '/sw.js') {
      res.writeHead(404).end();
      return;
    }

    // Resolve within root; reject any path traversal.
    const filePath = path.normalize(path.join(root, pathname));
    if (filePath !== root && !filePath.startsWith(root + path.sep)) {
      res.writeHead(403).end();
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404).end();
        return;
      }
      const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type });
      res.end(data);
    });
  });

  return new Promise((resolve) => {
    // A fixed port keeps the origin (and thus localStorage) stable across
    // launches; if it's taken, fall back to an OS-assigned port — the file-based
    // save mirror in preload.js keeps saves intact regardless of origin.
    const onError = () => {
      server.removeListener('error', onError);
      server.listen(0, '127.0.0.1', () => resolve(server.address().port));
    };
    server.once('error', onError);
    server.listen(43917, '127.0.0.1', () => {
      server.removeListener('error', onError);
      resolve(server.address().port);
    });
  });
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

// The in-game pause menu's "Exit" button asks us to close the app.
ipcMain.on('app:quit', () => app.quit());

ipcMain.handle('cloud:write', (_event, blob) => {
  try {
    fs.mkdirSync(SAVE_DIR, { recursive: true });
    fs.writeFileSync(SAVE_FILE, blob);
    return true;
  } catch {
    return false;
  }
});

function createWindow(port) {
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

  // Diagnostics: if the page ever fails to load, print the exact reason instead
  // of a bare ERR_FAILED, so problems are actionable.
  win.webContents.on('did-fail-load', (_e, code, desc, url) => {
    console.error(`[Tidefarer] Page failed to load (${code} ${desc}): ${url}`);
  });
  win.webContents.on('render-process-gone', (_e, details) => {
    console.error(`[Tidefarer] Renderer gone: ${details.reason} (exit ${details.exitCode})`);
  });

  win.loadURL(`http://127.0.0.1:${port}/index.html`);

  // F11 toggles fullscreen; the game starts fullscreen to match its manifest.
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') {
      win.setFullScreen(!win.isFullScreen());
      event.preventDefault();
    }
  });

  return win;
}

// Surface GPU/child-process crashes (a common cause of a blank window).
app.on('child-process-gone', (_e, details) => {
  console.error(`[Tidefarer] ${details.type} process gone: ${details.reason}`);
});

app.whenReady().then(async () => {
  const port = await startGameServer();
  createWindow(port);
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(port);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
