// Tidefarer — Steam Cloud save bridge (no game-code changes required).
//
// The game saves to localStorage. Steam Cloud can't reliably sync Chromium's
// LevelDB store, so we mirror the whole localStorage to a plain JSON file that
// Steam Auto-Cloud CAN sync, and restore that file when it's newer than the
// local copy (e.g. the first launch on a new PC after Cloud pulls it down).
//
// Timing matters: the game reads localStorage synchronously as its <script>
// tags parse — before the window 'load' event — so the restore has to run at
// the TOP of this preload (which executes before any page script) using a
// synchronous IPC read. Writes happen later and can be async.

const { ipcRenderer } = require('electron');

// A localStorage key that records when we last mirrored, so we only restore
// from the file when the file is genuinely newer than what's on this machine.
const STAMP_KEY = '__steamCloudSavedAt';

function snapshot() {
  const keys = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    keys[k] = localStorage.getItem(k);
  }
  return keys;
}

// --- Restore (runs immediately, before the game's scripts execute) ----------
try {
  const raw = ipcRenderer.sendSync('cloud:read-sync');
  if (raw) {
    const blob = JSON.parse(raw);
    const localStamp = Number(localStorage.getItem(STAMP_KEY) || 0);
    // Only overwrite local state when the synced file is strictly newer.
    if (blob && blob.savedAt > localStamp && blob.keys) {
      for (const [k, v] of Object.entries(blob.keys)) {
        localStorage.setItem(k, v);
      }
      localStorage.setItem(STAMP_KEY, String(blob.savedAt));
    }
  }
} catch {
  // A missing/corrupt mirror must never block the game from booting.
}

// --- Persist (mirror localStorage back out for Steam to upload) -------------
function persist() {
  try {
    const savedAt = Date.now();
    localStorage.setItem(STAMP_KEY, String(savedAt));
    ipcRenderer.invoke('cloud:write', JSON.stringify({ savedAt, keys: snapshot() }));
  } catch {
    // ignore — a failed mirror just means Cloud has a slightly older save
  }
}

window.addEventListener('load', persist);
// Periodic mirror plus one on hide/close, so Steam has the latest save to
// upload whenever the game exits.
setInterval(persist, 15000);
window.addEventListener('pagehide', persist);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') persist();
});
