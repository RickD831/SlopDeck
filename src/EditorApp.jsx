import React, { useState, useEffect } from 'react'
import ButtonEditor from './components/ButtonEditor.jsx'
import windows11 from './themes/windows11.js'
import atari2600 from './themes/atari2600.js'
import neonoir  from './themes/neonoir.js'

const THEMES = { windows11, atari2600, neonoir }

export default function EditorApp() {
  const [editorData, setEditorData] = useState(null)

  useEffect(() => {
    if (!window.electronAPI) return
    window.electronAPI.getEditorData().then((data) => {
      if (!data) return
      // Read theme from localStorage — always current regardless of how window was opened
      const themeKey = localStorage.getItem('slopdeck-theme') || 'windows11'
      const theme = THEMES[themeKey] || windows11
      const root  = document.documentElement
      Object.entries(theme.variables).forEach(([k, v]) => root.style.setProperty(k, v))
      setEditorData(data)
    })
  }, [])

  if (!editorData) return null

  const handleSave = (buttonData) => {
    window.electronAPI?.editorSave({
      ...buttonData,
      _originalId: editorData.button?.id ?? null,
    })
  }

  return (
    <div style={{
      width:      '100%',
      height:     '100%',
      background: 'var(--bg-primary)',
      display:    'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <ButtonEditor
        button={editorData.button}
        onSave={handleSave}
        onCancel={() => window.electronAPI?.editorCancel()}
        inline
      />
    </div>
  )
}
