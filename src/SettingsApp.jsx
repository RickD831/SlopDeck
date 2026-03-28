import React, { useState, useEffect } from 'react'
import windows11 from './themes/windows11.js'
import atari2600 from './themes/atari2600.js'
import neonoir   from './themes/neonoir.js'

const THEMES = { windows11, atari2600, neonoir }

export default function SettingsApp() {
  const [opacity,  setOpacity]  = useState(() => parseFloat(localStorage.getItem('slopdeck-opacity') || '1.0'))
  const [bgImage,  setBgImage]  = useState(() => localStorage.getItem('slopdeck-bg') || null)
  const [origOpacity] = useState(() => parseFloat(localStorage.getItem('slopdeck-opacity') || '1.0'))

  // Match theme to main window
  useEffect(() => {
    const themeKey = localStorage.getItem('slopdeck-theme') || 'windows11'
    const theme = THEMES[themeKey] || windows11
    const root  = document.documentElement
    Object.entries(theme.variables).forEach(([k, v]) => root.style.setProperty(k, v))
  }, [])

  // Live-preview opacity while slider moves
  const handleOpacityChange = (val) => {
    setOpacity(val)
    window.electronAPI?.setWindowOpacity(val)
  }

  const handlePickBg = async () => {
    const result = await window.electronAPI?.pickIconImage()
    if (result) setBgImage(result)
  }

  const handleSave = () => {
    localStorage.setItem('slopdeck-opacity', opacity)
    if (bgImage) localStorage.setItem('slopdeck-bg', bgImage)
    else         localStorage.removeItem('slopdeck-bg')
    window.electronAPI?.settingsSave({ opacity, bgImage })
  }

  const handleCancel = () => {
    // Restore opacity to what it was before the slider moved
    window.electronAPI?.setWindowOpacity(origOpacity)
    window.electronAPI?.settingsCancel()
  }

  const input = {
    width: '100%',
    padding: '7px 10px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--text-primary)',
    fontSize: '13px',
    fontFamily: 'var(--font-family)',
    outline: 'none',
  }

  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'var(--bg-primary)',
      padding: '24px',
      fontFamily: 'var(--font-family)',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      boxSizing: 'border-box',
    }}>
      <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
        Settings
      </h2>

      {/* Opacity */}
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
          Window Opacity — <strong style={{ color: 'var(--text-primary)' }}>{Math.round(opacity * 100)}%</strong>
        </label>
        <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.05"
          value={opacity}
          onChange={e => handleOpacityChange(parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
          <span>10%</span><span>100%</span>
        </div>
      </div>

      {/* Background image */}
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
          Background Image
        </label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {bgImage && (
            <img
              src={bgImage}
              alt="background preview"
              style={{ width: '64px', height: '48px', objectFit: 'cover', borderRadius: 'var(--radius)', border: '1px solid var(--border)', flexShrink: 0 }}
            />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
            <button onClick={handlePickBg} style={btn()}>
              {bgImage ? 'Change Image…' : 'Browse Image…'}
            </button>
            {bgImage && (
              <button onClick={() => setBgImage(null)} style={btn('danger')}>
                Clear Background
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <button onClick={handleCancel} style={btn()}>Cancel</button>
        <button onClick={handleSave}   style={btn('primary')}>Save</button>
      </div>
    </div>
  )
}

function btn(variant) {
  return {
    padding: '7px 16px',
    border:  variant === 'primary' ? 'none' : '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    background: variant === 'primary' ? 'var(--accent)'
              : variant === 'danger'  ? 'rgba(255,68,68,0.12)'
              : 'var(--bg-button)',
    color: variant === 'primary' ? '#fff'
         : variant === 'danger'  ? '#ff4444'
         : 'var(--text-primary)',
    cursor:     'pointer',
    fontSize:   '12px',
    fontFamily: 'var(--font-family)',
    width:      '100%',
    textAlign:  'center',
  }
}
