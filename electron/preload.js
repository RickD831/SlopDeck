const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  close:    () => ipcRenderer.send('window-close'),

  // Buttons persistence
  loadButtons:  ()        => ipcRenderer.invoke('load-buttons'),
  saveButtons:  (buttons) => ipcRenderer.invoke('save-buttons', buttons),

  // Actions
  launchUrl: (url)      => ipcRenderer.invoke('launch-url', url),
  launchApp: (exePath)  => ipcRenderer.invoke('launch-app', exePath),

  // Dialogs
  pickExeFile:   () => ipcRenderer.invoke('pick-exe-file'),
  pickIconImage: () => ipcRenderer.invoke('pick-icon-image'),

  // Docking
  dockWindow:    (side) => ipcRenderer.invoke('dock-window', side),
  getWorkArea:   ()     => ipcRenderer.invoke('get-work-area'),
  expandForMenu: (side) => ipcRenderer.invoke('expand-for-menu', side),
  collapseMenu:  (side) => ipcRenderer.invoke('collapse-menu', side),

  // Tray state sync — renderer tells main what state it's in
  updateTrayState: (state) => ipcRenderer.invoke('update-tray-state', state),

  // Tray commands — main tells renderer what the user picked
  onTrayCommand: (callback) => {
    ipcRenderer.on('tray-command', (_event, cmd) => callback(cmd))
  },

  // Editor window
  openEditorWindow: (data)   => ipcRenderer.invoke('open-editor-window', data),
  getEditorData:    ()       => ipcRenderer.invoke('get-editor-data'),
  editorSave:       (result) => ipcRenderer.invoke('editor-save', result),
  editorCancel:     ()       => ipcRenderer.invoke('editor-cancel'),
  onEditorResult:   (callback) => {
    ipcRenderer.on('editor-result', (_event, result) => callback(result))
  },

  // Settings window
  openSettingsWindow: ()       => ipcRenderer.invoke('open-settings-window'),
  settingsSave:       (data)   => ipcRenderer.invoke('settings-save', data),
  settingsCancel:     ()       => ipcRenderer.invoke('settings-cancel'),
  setWindowOpacity:   (val)    => ipcRenderer.invoke('set-window-opacity', val),
  onSettingsResult:   (callback) => {
    ipcRenderer.on('settings-result', (_event, data) => callback(data))
  },
})
