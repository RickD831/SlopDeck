import React, { useState, useCallback } from 'react'

const EMOJI_LIST = [
  '🔍','🐙','▶️','📝','🌐','💻','📁','⚙️','🎮','🎵','📷','🔧',
  '📦','🚀','⭐','❤️','🔥','💡','🎯','📊','🔒','🛠️','📌','🔔',
  '🌟','🎨','📱','🖥️','⌨️','🖱️','🔑','📋','✅','🗑️','📤','📥',
]

function ModalOverlay({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

export default function ButtonEditor({ button, onSave, onCancel, inline = false }) {
  const isEditing = !!button

  const [label, setLabel] = useState(button?.label || '')
  const [type, setType] = useState(button?.type || 'url')
  const [action, setAction] = useState(button?.action || '')
  const [icon, setIcon] = useState(button?.icon || '🔲')
  const [iconType, setIconType] = useState(button?.iconType || 'emoji')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const handlePickExe = useCallback(async () => {
    if (!window.electronAPI) return
    const result = await window.electronAPI.pickExeFile()
    if (result) setAction(result)
  }, [])

  const handlePickIcon = useCallback(async () => {
    if (!window.electronAPI) return
    const result = await window.electronAPI.pickIconImage()
    if (result) {
      setIcon(result)
      setIconType('image')
    }
  }, [])

  const handleSave = useCallback(() => {
    if (!label.trim()) return
    onSave({ label: label.trim(), type, action, icon, iconType })
  }, [label, type, action, icon, iconType, onSave])

  const inputStyle = {
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

  const labelStyle = {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-family)',
    marginBottom: '4px',
    display: 'block',
  }

  const btnStyle = (variant) => ({
    padding: '8px 20px',
    border: 'none',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: 'var(--font-family)',
    fontWeight: '500',
    ...(variant === 'primary' ? {
      background: 'var(--accent)',
      color: '#fff',
    } : {
      background: 'var(--bg-button)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border)',
    })
  })

  const panel = (
      <div
        style={{
          background: 'var(--bg-modal)',
          border: inline ? 'none' : '1px solid var(--border)',
          borderRadius: inline ? '0' : 'var(--radius-lg)',
          boxShadow: inline ? 'none' : 'var(--shadow)',
          padding: '24px',
          width: '380px',
          fontFamily: 'var(--font-family)',
        }}
      >
        <h2 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '20px', fontWeight: '600' }}>
          {isEditing ? 'Edit Button' : 'Add Button'}
        </h2>

        {/* Label */}
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Label</label>
          <input
            autoFocus
            type="text"
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Button label"
            style={inputStyle}
          />
        </div>

        {/* Type */}
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Type</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['url', 'app'].map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                style={{
                  flex: 1,
                  padding: '7px',
                  border: type === t ? '2px solid var(--accent)' : '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  background: type === t ? 'rgba(0,120,212,0.15)' : 'var(--bg-input)',
                  color: type === t ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontFamily: 'var(--font-family)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {t === 'url' ? '🌐 URL' : '💻 App'}
              </button>
            ))}
          </div>
        </div>

        {/* Action */}
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>{type === 'url' ? 'URL' : 'Application Path'}</label>
          {type === 'url' ? (
            <input
              type="text"
              value={action}
              onChange={e => setAction(e.target.value)}
              placeholder="https://example.com"
              style={inputStyle}
            />
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={action}
                onChange={e => setAction(e.target.value)}
                placeholder="C:\path\to\app.exe"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                onClick={handlePickExe}
                style={{
                  padding: '7px 12px',
                  background: 'var(--bg-button)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-family)',
                }}
              >
                Browse…
              </button>
            </div>
          )}
        </div>

        {/* Icon */}
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Icon</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Preview */}
            <div
              style={{
                width: '44px', height: '44px',
                background: 'var(--bg-button)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: iconType === 'emoji' ? '24px' : '10px',
              }}
            >
              {iconType === 'image' ? (
                <img src={icon} alt="icon" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
              ) : (
                icon || '🔲'
              )}
            </div>

            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              style={{
                padding: '7px 12px',
                background: 'var(--bg-button)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '12px',
                fontFamily: 'var(--font-family)',
              }}
            >
              Emoji
            </button>
            <button
              onClick={handlePickIcon}
              style={{
                padding: '7px 12px',
                background: 'var(--bg-button)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '12px',
                fontFamily: 'var(--font-family)',
              }}
            >
              Image…
            </button>
          </div>

          {/* Emoji picker */}
          {showEmojiPicker && (
            <div
              style={{
                marginTop: '8px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '8px',
                maxHeight: '120px',
                overflowY: 'auto',
              }}
            >
              {EMOJI_LIST.map(e => (
                <button
                  key={e}
                  onClick={() => { setIcon(e); setIconType('emoji'); setShowEmojiPicker(false) }}
                  style={{
                    width: '34px', height: '34px',
                    background: icon === e ? 'var(--bg-button-hover)' : 'transparent',
                    border: icon === e ? '1px solid var(--accent)' : '1px solid transparent',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '18px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  title={e}
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button onClick={onCancel} style={btnStyle('secondary')}>Cancel</button>
          <button
            onClick={handleSave}
            disabled={!label.trim()}
            style={{
              ...btnStyle('primary'),
              opacity: label.trim() ? 1 : 0.5,
              cursor: label.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            {isEditing ? 'Save Changes' : 'Add Button'}
          </button>
        </div>
      </div>
  )

  if (inline) return panel
  return <ModalOverlay onClose={onCancel}>{panel}</ModalOverlay>
}
