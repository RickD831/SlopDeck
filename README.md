# SlopDeck

A Stream Deck-style button launcher for Windows built with Electron + React + Vite. Assign URLs and applications to one-click buttons, arrange them in a grid, and launch anything instantly.

---

## Features

- **Button types** — URL launcher (opens in default browser) or App launcher (runs any `.exe`)
- **Icon support** — emoji picker or custom image upload per button
- **Drag-and-drop** reordering of buttons
- **Right-click context menu** — Edit or Delete any button
- **System tray icon** — lives in the Windows notification area; left-click toggles the window, right-click opens the full control menu
- **Tray control menu** — Add Button, Mini Mode toggle, Theme submenu, Dock submenu, Show/Hide Window, Quit
- **Mini Mode** — compact button layout for a smaller footprint
- **Edge docking** — snap the window to any screen edge (left, right, top, bottom) with always-on-top; undock to restore free-floating position
- **Three built-in themes** with instant switching and persistence:
  - **Windows 11** — Fluent Design, frosted acrylic, Segoe UI
  - **Atari 2600** — retro woodgrain, rubber dome buttons, CRT scanlines, Press Start 2P font
  - **Neo-Noir** — Miami Vice dark, hot pink + cyan neon glow
- **Settings window** — separate child window for opacity slider (10–100%) and custom background image
- **Window opacity** — live-preview slider; persisted across sessions
- **Background image** — upload any image as the button grid backdrop; clearable
- **Auto-save** — button config written to `%AppData%\slopdeck\buttons.json` on every change
- **Minimal title bar** — thin drag strip with hide and close buttons only; all controls live in the tray
- Closing or minimizing the window **hides to tray** rather than quitting; use *Quit SlopDeck* in the tray menu to exit

---

## Tech Stack

| Layer | Technology |
|---|---|
| Shell | Electron 29 |
| UI | React 18 + hooks |
| Build | Vite 5 + vite-plugin-electron |
| Packaging | electron-builder (NSIS installer) |
| Styling | CSS custom properties, no component libraries |

---

## Project Structure

```
SlopDeck/
├── electron/
│   ├── main.js          # BrowserWindow, tray, IPC handlers, docking logic, editor window
│   └── preload.js       # contextBridge API surface
├── public/
│   ├── slopdeck_icon.ico      # App / installer icon (all sizes)
│   ├── slopdeck_icon_16.png   # Tray icon
│   ├── slopdeck_icon_64.png   # Mid-res icon
│   └── slopdeck_icon_256.png  # BrowserWindow icon
├── src/
│   ├── main.jsx         # React entry — routes to App, EditorApp, or SettingsApp based on URL hash
│   ├── index.css        # Global reset
│   ├── App.jsx          # Main window — theme engine, state, tray sync, persistence
│   ├── EditorApp.jsx    # Editor window — standalone add/edit button UI
│   ├── SettingsApp.jsx  # Settings window — opacity slider + background image picker
│   ├── themes/
│   │   ├── windows11.js # CSS variable values for Windows 11 theme
│   │   ├── atari2600.js # CSS variable values for Atari 2600 theme
│   │   └── neonoir.js   # CSS variable values for Neo-Noir theme
│   └── components/
│       ├── TitleBar.jsx     # Minimal drag strip — app name + hide/close buttons
│       ├── ButtonGrid.jsx   # Grid layout, drag-and-drop, dock-aware
│       ├── ButtonCard.jsx   # Individual button with context menu
│       └── ButtonEditor.jsx # Add/edit form — used inline in EditorApp
├── index.html
├── vite.config.js
└── package.json         # electron-builder config included
```

---

## IPC Channels

| Channel | Direction | Description |
|---|---|---|
| `load-buttons` | renderer → main | Read `buttons.json` from userData |
| `save-buttons` | renderer → main | Write `buttons.json` to userData |
| `launch-url` | renderer → main | `shell.openExternal(url)` |
| `launch-app` | renderer → main | `shell.openPath(exePath)` |
| `pick-exe-file` | renderer → main | Open file dialog filtered to executables |
| `pick-icon-image` | renderer → main | Open file dialog for images, returns base64 |
| `dock-window` | renderer → main | Snap/restore window to a screen edge |
| `expand-for-menu` | renderer → main | Temporarily expand flat-docked window to fit gear menu |
| `collapse-menu` | renderer → main | Collapse flat-docked window back to bar height |
| `get-work-area` | renderer → main | Return primary display work area bounds |
| `update-tray-state` | renderer → main | Push current theme/miniMode/dockSide to main so tray menu reflects it |
| `tray-command` | main → renderer | Deliver a user action from the tray menu (set-theme, set-mini, set-dock, add-button) |
| `open-editor-window` | renderer → main | Open the editor BrowserWindow with button data + themeKey |
| `get-editor-data` | editor → main | Editor window fetches the button data it should display |
| `editor-save` | editor → main | Editor sends completed button data back; main relays to main window |
| `editor-cancel` | editor → main | Editor cancelled; main closes the editor window |
| `editor-result` | main → renderer | Main window receives the saved button data from the editor |
| `open-settings-window` | renderer → main | Open the settings BrowserWindow |
| `get-settings-data` | settings → main | (reserved for future use) |
| `settings-save` | settings → main | Settings sends opacity + bgImage back; main applies opacity and relays to main window |
| `settings-cancel` | settings → main | Settings cancelled; main closes the settings window |
| `settings-result` | main → renderer | Main window receives the saved settings data |
| `set-window-opacity` | renderer → main | Live-preview opacity change while slider moves |
| `window-minimize` | renderer → main | Hide window to tray |
| `window-close` | renderer → main | Hide window to tray |

---

## Development

```bash
npm install
npm run electron:dev
```

Starts Vite on `localhost:5173` and launches Electron concurrently. DevTools open automatically in dev mode.

---

## Building

```bash
npm run electron:build
```

Produces two artifacts in `dist-electron/`:

| File | Description |
|---|---|
| `SlopDeck Setup 1.0.0.exe` | NSIS installer — standard Windows setup wizard |
| `win-unpacked/` | Portable build — run `SlopDeck.exe` directly, no install needed |

### Installing on another machine

**Option A — Installer:** Copy `SlopDeck Setup 1.0.0.exe` and run it. Creates Start Menu + optional desktop shortcut, includes uninstaller.

**Option B — Portable:** Copy the `win-unpacked/` folder anywhere and run `SlopDeck.exe`. Nothing written to the registry.

> **Note:** Windows SmartScreen may show an "Unknown publisher" warning on first run since the binary is not code-signed. Click *More info → Run anyway*. This is expected for unsigned builds.

---

## Data Storage

Button configuration is stored at:
```
C:\Users\<you>\AppData\Roaming\slopdeck\buttons.json
```

Theme and UI preferences (theme, mini mode, dock side, opacity, background image) are stored in the app's `localStorage`.

---

## Adding a New Theme

1. Create `src/themes/mytheme.js` exporting an object with `name` and `variables` (CSS custom property map). Use `windows11.js` as a reference.
2. Import it in `src/App.jsx` and add it to the `THEMES` object.
3. If the theme needs special hover effects (like Atari's dome buttons or Neo-Noir's neon glow), add a `themeKey === 'mytheme'` branch in `ButtonCard.jsx`.

---

## Dock Modes

| Mode | Window Size | Grid Layout |
|---|---|---|
| Free | 820 × 520 (resizable) | 4 columns |
| Left / Right | 220px wide × full height | 2 columns, vertical scroll |
| Top / Bottom | Full width × 108px | 1 row, horizontal scroll |

Docked windows are always-on-top and remain resizable. Undocking restores the previous free-floating position. Free-mode bounds are captured once when first docking and are not overwritten when switching between dock sides.

---

## Editor Window

Add Button and Edit Button open a separate `440×560` child window rather than an overlay inside the main window. This keeps the launcher unobstructed, especially when docked to an edge.

The editor window loads the same `index.html` with `#editor` in the URL hash. `src/main.jsx` detects this and renders `EditorApp` instead of `App`. When the user saves or cancels, the window closes and the result is relayed to the main window via IPC.

---

## Icons

Place icon files in `public/` before building:

| File | Used for |
|---|---|
| `slopdeck_icon.ico` | NSIS installer + `.exe` file icon |
| `slopdeck_icon_16.png` | System tray |
| `slopdeck_icon_256.png` | BrowserWindow (alt-tab, taskbar preview) |

If `slopdeck_icon_16.png` is not found at runtime, a programmatic fallback icon (blue 2×2 button grid, generated via zlib PNG in `main.js`) is used instead.
