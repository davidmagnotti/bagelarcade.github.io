# Tidefarer — Desktop / Steam build

An [Electron](https://www.electronjs.org/) shell that wraps the existing web
game in `../tidefarer` for distribution on Steam. The game code is **not**
modified — this folder only adds a native window and a Steam Cloud save bridge.

Why Electron (vs. Tauri/NW.js): Tidefarer renders through WebGL/canvas, and
Electron bundles its own Chromium, so the desktop build renders **identically**
to what you test in Chrome, on Windows, macOS, and Linux alike. Tauri would use
each OS's native webview (WebKit on macOS/Linux), adding rendering/QA risk.

## Run it locally

```bash
cd electron
npm install
npm start
```

This loads `../tidefarer/index.html` in a fullscreen window. Press **F11** to
toggle fullscreen, Alt+F4 / Cmd+Q to quit.

## Build distributables

```bash
npm run dist:win     # -> dist/win-unpacked/
npm run dist:mac     # -> dist/mac/
npm run dist:linux   # -> dist/linux-unpacked/
```

The targets are intentionally **unpacked directories**, not installers — that's
exactly what you upload to a Steam depot (Steam handles installation itself). To
build for a given OS you generally need to run on that OS (or a CI matrix);
macOS builds in particular must be produced on macOS.

> Icons: `build/icon.png` is a copy of the 1024px game icon and electron-builder
> auto-converts it. For crisper platform icons, add a real `build/icon.ico`
> (Windows) and `build/icon.icns` (macOS) later.

## Steam packaging checklist

1. **Join Steamworks** (steamworks.com), pay the $100 Direct fee, and get your
   **App ID**.
2. **Replace the App ID placeholder.** `steam_appid.txt` currently contains
   `480` (Valve's public "Spacewar" test app, so the shell launches while the
   Steam client is running during development). Put your real App ID there
   before shipping. It is copied next to the executable in every build.
3. **Create depots** (typically one per OS) in the Steamworks partner site and
   set each build's launch executable:
   - Windows: `Tidefarer.exe`
   - Linux:   `tidefarer`
   - macOS:   `Tidefarer.app`
4. **Upload builds** with the Steamworks SDK's ContentBuilder (`steamcmd` +
   an app/depot VDF script), pointing each depot's content root at the matching
   `dist/<os>-unpacked/` directory.
5. **Store assets:** capsule images, a trailer, and screenshots. You already
   have screenshots under `app-assets/tidefarer/` — Steam wants specific sizes
   (e.g. 1920×1080), so re-export as needed.

## Steam Cloud saves (already wired)

The game saves to `localStorage`. `preload.js` mirrors all of localStorage to a
plain JSON file that Steam Auto-Cloud can sync, and restores it on launch when
the synced copy is newer (the new-PC case). Register this in **Steamworks →
your app → Cloud → Auto-Cloud** by pointing at the `steam_cloud` subfolder of
Electron's per-user data directory:

| OS      | Path to the file Steam should sync                                             | Steam root variable    |
|---------|--------------------------------------------------------------------------------|------------------------|
| Windows | `%APPDATA%\Tidefarer\steam_cloud\tidefarer-save.json`                          | `WinAppDataRoaming`    |
| macOS   | `~/Library/Application Support/Tidefarer/steam_cloud/tidefarer-save.json`       | `MacHome` + subpath    |
| Linux   | `~/.config/Tidefarer/steam_cloud/tidefarer-save.json`                          | `LinuxHome` + subpath  |

Use root variable `steam_cloud/tidefarer-save.json` as the path pattern under
the appropriate root for each OS. (The folder name is `Tidefarer` because
`main.js` calls `app.setName('Tidefarer')`.)

## Not included yet

Achievements, the Steam overlay, and rich presence require linking the
Steamworks SDK — add [`steamworks.js`](https://github.com/ceifa/steamworks.js)
in `main.js` when you're ready. Steam Input gives controller support with no
code changes, configured from the partner site.
