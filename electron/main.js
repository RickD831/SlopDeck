const { app, BrowserWindow, ipcMain, shell, dialog, screen, Tray, Menu, nativeImage } = require('electron')
const path = require('path')
const fs   = require('fs')
const zlib = require('zlib')

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow
let editorWindow    = null
let pendingEditData = null
let settingsWindow  = null
let tray
let savedFreeBounds  = null
let currentDockSide  = 'free'
app.isQuitting = false

// Tracks current app state so tray menu can reflect it
let appState = {
  theme:         'windows11',
  miniMode:      false,
  dockSide:      'free',
  windowVisible: true,
}

// ─── Programmatic tray icon (16×16 PNG, 2×2 blue button grid) ─────────────────

function crc32(buf) {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    table[i] = c
  }
  let crc = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function pngChunk(type, data) {
  const t = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, crcBuf])
}

function makeIconPNG() {
  const S = 16
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(S, 0); ihdr.writeUInt32BE(S, 4)
  ihdr[8] = 8; ihdr[9] = 6  // 8-bit RGBA

  const raw = []
  for (let y = 0; y < S; y++) {
    raw.push(0) // filter none
    for (let x = 0; x < S; x++) {
      // 2×2 grid of blue buttons, 1px margin, 5px button, 2px gap
      const margin = 1, btn = 5, gap = 2, step = btn + gap
      const lx = x - margin, ly = y - margin
      const col = Math.floor(lx / step), row = Math.floor(ly / step)
      const inBtn = lx >= 0 && ly >= 0 && col < 2 && row < 2
                 && (lx % step) < btn && (ly % step) < btn
      if (inBtn) raw.push(0x00, 0x78, 0xD4, 0xFF)   // #0078d4 blue
      else       raw.push(0x20, 0x20, 0x20, 0x00)   // transparent bg
    }
  }

  return Buffer.concat([
    Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(Buffer.from(raw))),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

function getTrayImage() {
  const iconPath = isDev
    ? path.join(__dirname, '../public/slopdeck_icon_16.png')
    : path.join(__dirname, '../dist/slopdeck_icon_16.png')
  if (fs.existsSync(iconPath)) return nativeImage.createFromPath(iconPath)
  return nativeImage.createFromBuffer(makeIconPNG())
}

// ─── Tray ──────────────────────────────────────────────────────────────────────

function sendToRenderer(channel, data) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data)
  }
}

function toggleWindow() {
  if (mainWindow.isVisible() && !mainWindow.isMinimized()) {
    mainWindow.hide()
    appState.windowVisible = false
  } else {
    mainWindow.show()
    mainWindow.focus()
    appState.windowVisible = true
  }
  buildTrayMenu()
}

function setTheme(theme) {
  appState.theme = theme
  sendToRenderer('tray-command', { type: 'set-theme', value: theme })
  buildTrayMenu()
}

function setDock(side) {
  appState.dockSide = side
  sendToRenderer('tray-command', { type: 'set-dock', value: side })
  buildTrayMenu()
}

function buildTrayMenu() {
  const menu = Menu.buildFromTemplate([
    { label: 'SlopDeck', enabled: false },
    { type: 'separator' },
    {
      label: appState.windowVisible ? 'Hide Window' : 'Show Window',
      click: toggleWindow,
    },
    { type: 'separator' },
    {
      label: 'Add Button',
      click: () => {
        if (!mainWindow.isVisible()) { mainWindow.show(); appState.windowVisible = true }
        sendToRenderer('tray-command', { type: 'add-button' })
      },
    },
    { type: 'separator' },
    {
      label:   'Mini Mode',
      type:    'checkbox',
      checked: appState.miniMode,
      click: (item) => {
        appState.miniMode = item.checked
        sendToRenderer('tray-command', { type: 'set-mini', value: item.checked })
      },
    },
    { type: 'separator' },
    {
      label: 'Theme',
      submenu: [
        { label: 'Windows 11', type: 'radio', checked: appState.theme === 'windows11', click: () => setTheme('windows11') },
        { label: 'Atari 2600', type: 'radio', checked: appState.theme === 'atari2600', click: () => setTheme('atari2600') },
        { label: 'Neo-Noir',   type: 'radio', checked: appState.theme === 'neonoir',   click: () => setTheme('neonoir')   },
      ],
    },
    {
      label: 'Dock',
      submenu: [
        { label: 'Float Free',  type: 'radio', checked: appState.dockSide === 'free',   click: () => setDock('free')   },
        { label: 'Left Edge',   type: 'radio', checked: appState.dockSide === 'left',   click: () => setDock('left')   },
        { label: 'Right Edge',  type: 'radio', checked: appState.dockSide === 'right',  click: () => setDock('right')  },
        { label: 'Top Edge',    type: 'radio', checked: appState.dockSide === 'top',    click: () => setDock('top')    },
        { label: 'Bottom Edge', type: 'radio', checked: appState.dockSide === 'bottom', click: () => setDock('bottom') },
      ],
    },
    { type: 'separator' },
    {
      label: 'Settings…',
      click: () => {
        if (!mainWindow.isVisible()) { mainWindow.show(); appState.windowVisible = true }
        sendToRenderer('tray-command', { type: 'open-settings' })
      },
    },
    { type: 'separator' },
    {
      label: 'Quit SlopDeck',
      click: () => { app.isQuitting = true; app.quit() },
    },
  ])
  tray.setContextMenu(menu)
}

function createTray() {
  tray = new Tray(getTrayImage())
  tray.setToolTip('SlopDeck')
  buildTrayMenu()
  // Left-click toggles window; right-click shows context menu (automatic on Windows)
  tray.on('click', toggleWindow)
}

// ─── Window ────────────────────────────────────────────────────────────────────

function getButtonsFilePath() {
  return path.join(app.getPath('userData'), 'buttons.json')
}

function createWindow() {
  const winIcon = isDev
    ? path.join(__dirname, '../public/slopdeck_icon_256.png')
    : path.join(__dirname, '../dist/slopdeck_icon_256.png')

  mainWindow = new BrowserWindow({
    width:        820,
    height:       520,
    minWidth:     100,
    minHeight:    60,
    frame:        false,
    transparent:  false,
    backgroundColor: '#202020',
    skipTaskbar:  true,
    icon:         fs.existsSync(winIcon) ? winIcon : undefined,
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Intercept close → hide to tray (only real quit comes from tray menu)
  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault()
      mainWindow.hide()
      appState.windowVisible = false
      buildTrayMenu()
    }
  })
}

// ─── App lifecycle ─────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  createWindow()
  createTray()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => { app.isQuitting = true })

// ─── IPC: Window controls ──────────────────────────────────────────────────────

ipcMain.on('window-minimize', () => {
  mainWindow.hide()
  appState.windowVisible = false
  buildTrayMenu()
})

ipcMain.on('window-close', () => {
  mainWindow.hide()
  appState.windowVisible = false
  buildTrayMenu()
})

// ─── IPC: Tray state sync ──────────────────────────────────────────────────────

ipcMain.handle('update-tray-state', async (event, state) => {
  Object.assign(appState, state)
  buildTrayMenu()
})

// ─── IPC: Buttons ─────────────────────────────────────────────────────────────

ipcMain.handle('load-buttons', async () => {
  const filePath = getButtonsFilePath()
  try {
    if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    return []
  } catch { return [] }
})

ipcMain.handle('save-buttons', async (event, buttons) => {
  try {
    fs.writeFileSync(getButtonsFilePath(), JSON.stringify(buttons, null, 2), 'utf-8')
    return { success: true }
  } catch (err) { return { success: false, error: err.message } }
})

// ─── IPC: Actions ─────────────────────────────────────────────────────────────

ipcMain.handle('launch-url', async (event, url) => {
  try { await shell.openExternal(url); return { success: true } }
  catch (err) { return { success: false, error: err.message } }
})

ipcMain.handle('launch-app', async (event, exePath) => {
  try { await shell.openPath(exePath); return { success: true } }
  catch (err) { return { success: false, error: err.message } }
})

// ─── IPC: File dialogs ────────────────────────────────────────────────────────

ipcMain.handle('pick-exe-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Application',
    filters: [
      { name: 'Executables', extensions: ['exe', 'bat', 'cmd', 'lnk'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
})

ipcMain.handle('pick-icon-image', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Icon Image',
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico'] }],
    properties: ['openFile'],
  })
  if (result.canceled || result.filePaths.length === 0) return null
  const filePath = result.filePaths[0]
  const data = fs.readFileSync(filePath)
  const ext  = path.extname(filePath).slice(1).toLowerCase()
  const mimeMap = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', ico: 'image/x-icon' }
  return `data:${mimeMap[ext] || 'image/png'};base64,${data.toString('base64')}`
})

// ─── IPC: Docking ─────────────────────────────────────────────────────────────

ipcMain.handle('dock-window', async (event, side) => {
  const { workArea } = screen.getPrimaryDisplay()

  if (side === 'free') {
    currentDockSide = 'free'
    mainWindow.setAlwaysOnTop(false)
    if (savedFreeBounds) {
      mainWindow.setBounds(savedFreeBounds)
      savedFreeBounds = null
    } else {
      const cx = Math.round(workArea.x + (workArea.width  - 820) / 2)
      const cy = Math.round(workArea.y + (workArea.height - 520) / 2)
      mainWindow.setBounds({ x: cx, y: cy, width: 820, height: 520 })
    }
    if (!mainWindow.isVisible()) { mainWindow.show(); appState.windowVisible = true }
    return
  }

  // Only capture free-mode bounds when leaving free — not when switching between dock sides
  if (currentDockSide === 'free') {
    savedFreeBounds = mainWindow.getBounds()
  }
  currentDockSide = side
  mainWindow.setAlwaysOnTop(true)
  if (!mainWindow.isVisible()) { mainWindow.show(); appState.windowVisible = true }

  if      (side === 'left')   mainWindow.setBounds({ x: workArea.x, y: workArea.y, width: 220, height: workArea.height })
  else if (side === 'right')  mainWindow.setBounds({ x: workArea.x + workArea.width - 220, y: workArea.y, width: 220, height: workArea.height })
  else if (side === 'top')    mainWindow.setBounds({ x: workArea.x, y: workArea.y, width: workArea.width, height: 108 })
  else if (side === 'bottom') mainWindow.setBounds({ x: workArea.x, y: workArea.y + workArea.height - 108, width: workArea.width, height: 108 })
})

// ─── IPC: Editor window ───────────────────────────────────────────────────────

ipcMain.handle('open-editor-window', async (event, data) => {
  pendingEditData = data  // { button: buttonObj | null, themeKey: string }

  if (editorWindow && !editorWindow.isDestroyed()) {
    editorWindow.focus()
    return
  }

  editorWindow = new BrowserWindow({
    width:  440,
    height: 560,
    resizable: false,
    frame: true,
    autoHideMenuBar: true,
    title: data.button ? 'Edit Button — SlopDeck' : 'Add Button — SlopDeck',
    parent: mainWindow,
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
    },
  })

  if (isDev) {
    editorWindow.loadURL('http://localhost:5173/#editor')
  } else {
    editorWindow.loadFile(path.join(__dirname, '../dist/index.html'), { hash: 'editor' })
  }

  editorWindow.on('closed', () => { editorWindow = null; pendingEditData = null })
})

ipcMain.handle('get-editor-data', async () => pendingEditData)

ipcMain.handle('editor-save', async (event, result) => {
  sendToRenderer('editor-result', result)
  if (editorWindow && !editorWindow.isDestroyed()) editorWindow.close()
  pendingEditData = null
})

ipcMain.handle('editor-cancel', async () => {
  if (editorWindow && !editorWindow.isDestroyed()) editorWindow.close()
  pendingEditData = null
})

ipcMain.handle('expand-for-menu', async (event, side) => {
  const { workArea } = screen.getPrimaryDisplay()
  const b = mainWindow.getBounds(), expanded = 340
  if      (side === 'top')    mainWindow.setBounds({ x: b.x, y: workArea.y, width: b.width, height: expanded })
  else if (side === 'bottom') mainWindow.setBounds({ x: b.x, y: workArea.y + workArea.height - expanded, width: b.width, height: expanded })
})

ipcMain.handle('collapse-menu', async (event, side) => {
  const { workArea } = screen.getPrimaryDisplay()
  const b = mainWindow.getBounds(), collapsed = 108
  if      (side === 'top')    mainWindow.setBounds({ x: b.x, y: workArea.y, width: b.width, height: collapsed })
  else if (side === 'bottom') mainWindow.setBounds({ x: b.x, y: workArea.y + workArea.height - collapsed, width: b.width, height: collapsed })
})

ipcMain.handle('get-work-area', async () => screen.getPrimaryDisplay().workArea)

// ─── IPC: Settings window ─────────────────────────────────────────────────────

ipcMain.handle('open-settings-window', async () => {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus()
    return
  }

  settingsWindow = new BrowserWindow({
    width:  360,
    height: 420,
    resizable: false,
    frame: true,
    autoHideMenuBar: true,
    title: 'Settings — SlopDeck',
    parent: mainWindow,
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
    },
  })

  if (isDev) {
    settingsWindow.loadURL('http://localhost:5173/#settings')
  } else {
    settingsWindow.loadFile(path.join(__dirname, '../dist/index.html'), { hash: 'settings' })
  }

  settingsWindow.on('closed', () => { settingsWindow = null })
})

ipcMain.handle('settings-save', async (event, data) => {
  if (data.opacity !== undefined) mainWindow.setOpacity(data.opacity)
  sendToRenderer('settings-result', data)
  if (settingsWindow && !settingsWindow.isDestroyed()) settingsWindow.close()
})

ipcMain.handle('settings-cancel', async () => {
  if (settingsWindow && !settingsWindow.isDestroyed()) settingsWindow.close()
})

ipcMain.handle('set-window-opacity', async (event, val) => {
  mainWindow.setOpacity(val)
})
