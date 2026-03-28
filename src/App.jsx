import React, { useState, useEffect, useCallback } from 'react'
import TitleBar from './components/TitleBar.jsx'
import ButtonGrid from './components/ButtonGrid.jsx'
import windows11 from './themes/windows11.js'
import atari2600 from './themes/atari2600.js'
import neonoir from './themes/neonoir.js'

const THEMES = { windows11, atari2600, neonoir }

const DEFAULT_BUTTONS = [
  { id: '1', label: 'Google',  type: 'url', action: 'https://www.google.com',  icon: '🔍', iconType: 'emoji' },
  { id: '2', label: 'GitHub',  type: 'url', action: 'https://github.com',      icon: '🐙', iconType: 'emoji' },
  { id: '3', label: 'YouTube', type: 'url', action: 'https://www.youtube.com', icon: '▶️', iconType: 'emoji' },
  { id: '4', label: 'Notepad', type: 'app', action: 'C:\\Windows\\System32\\notepad.exe', icon: '📝', iconType: 'emoji' },
]

function applyTheme(theme) {
  const root = document.documentElement
  Object.entries(theme.variables).forEach(([key, value]) => root.style.setProperty(key, value))
}

export default function App() {
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem('slopdeck-theme') || 'windows11')
  const [miniMode, setMiniMode] = useState(() => localStorage.getItem('slopdeck-mini') === 'true')
  const [dockSide, setDockSide] = useState(() => localStorage.getItem('slopdeck-dock') || 'free')
  const [opacity,  setOpacity]  = useState(() => parseFloat(localStorage.getItem('slopdeck-opacity') || '1.0'))
  const [bgImage,  setBgImage]  = useState(() => localStorage.getItem('slopdeck-bg') || null)
  const [buttons, setButtons] = useState([])
  const [loaded, setLoaded]   = useState(false)

  // Apply theme
  useEffect(() => {
    applyTheme(THEMES[themeKey] || windows11)
    localStorage.setItem('slopdeck-theme', themeKey)
  }, [themeKey])

  // Persist mini mode
  useEffect(() => {
    localStorage.setItem('slopdeck-mini', miniMode)
  }, [miniMode])

  // Apply opacity on mount
  useEffect(() => {
    window.electronAPI?.setWindowOpacity(opacity)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Apply dock
  useEffect(() => {
    localStorage.setItem('slopdeck-dock', dockSide)
    window.electronAPI?.dockWindow(dockSide)
  }, [dockSide])

  // Sync state to tray menu whenever anything changes
  useEffect(() => {
    window.electronAPI?.updateTrayState({ theme: themeKey, miniMode, dockSide })
  }, [themeKey, miniMode, dockSide])

  // Listen for commands from the tray menu
  useEffect(() => {
    if (!window.electronAPI) return
    window.electronAPI.onTrayCommand((cmd) => {
      switch (cmd.type) {
        case 'add-button':    window.electronAPI.openEditorWindow({ button: null, themeKey }); break
        case 'set-theme':     setThemeKey(cmd.value); break
        case 'set-mini':      setMiniMode(cmd.value); break
        case 'set-dock':      setDockSide(cmd.value); break
        case 'open-settings': window.electronAPI.openSettingsWindow(); break
      }
    })
    // Listen for results coming back from the settings window
    window.electronAPI.onSettingsResult((data) => {
      if (data.opacity !== undefined) {
        setOpacity(data.opacity)
        localStorage.setItem('slopdeck-opacity', data.opacity)
      }
      if (data.bgImage !== undefined) {
        setBgImage(data.bgImage)
        if (data.bgImage) localStorage.setItem('slopdeck-bg', data.bgImage)
        else              localStorage.removeItem('slopdeck-bg')
      }
    })
    // Listen for results coming back from the editor window
    window.electronAPI.onEditorResult((result) => {
      const { _originalId, ...buttonData } = result
      if (_originalId) {
        setButtons(prev => {
          const next = prev.map(b => b.id === _originalId ? { ...buttonData, id: _originalId } : b)
          window.electronAPI?.saveButtons(next).catch(() => {})
          return next
        })
      } else {
        setButtons(prev => {
          const next = [...prev, { ...buttonData, id: Date.now().toString() }]
          window.electronAPI?.saveButtons(next).catch(() => {})
          return next
        })
      }
    })
  }, []) // intentionally empty — registered once on mount

  // Load buttons
  useEffect(() => {
    const load = async () => {
      try {
        if (window.electronAPI) {
          const saved = await window.electronAPI.loadButtons()
          setButtons(saved && saved.length > 0 ? saved : DEFAULT_BUTTONS)
          if (!saved || saved.length === 0) await window.electronAPI.saveButtons(DEFAULT_BUTTONS)
        } else {
          setButtons(DEFAULT_BUTTONS)
        }
      } catch { setButtons(DEFAULT_BUTTONS) }
      setLoaded(true)
    }
    load()
  }, [])

  const saveButtons = useCallback(async (b) => {
    window.electronAPI?.saveButtons(b).catch(() => {})
  }, [])

  const handleButtonsChange = useCallback((b) => { setButtons(b); saveButtons(b) }, [saveButtons])
  const handleAddButton    = useCallback(() => {
    window.electronAPI?.openEditorWindow({ button: null, themeKey })
  }, [themeKey])
  const handleEditButton   = useCallback((btn) => {
    window.electronAPI?.openEditorWindow({ button: btn, themeKey })
  }, [themeKey])
  const handleDeleteButton = useCallback((id) => {
    handleButtonsChange(buttons.filter(b => b.id !== id))
  }, [buttons, handleButtonsChange])

  if (!loaded) return null

  const isDocked = dockSide !== 'free'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      <TitleBar themeKey={themeKey} dockSide={dockSide} />
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {themeKey === 'atari2600' && (
          <div aria-hidden="true" style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'var(--scanlines)',
            pointerEvents: 'none', zIndex: 100,
          }} />
        )}
        <ButtonGrid
          buttons={buttons}
          onButtonsChange={handleButtonsChange}
          onEditButton={handleEditButton}
          onDeleteButton={handleDeleteButton}
          themeKey={themeKey}
          miniMode={miniMode || isDocked}
          dockSide={dockSide}
          bgImage={bgImage}
        />
      </div>
    </div>
  )
}
