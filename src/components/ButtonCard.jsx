import React, { useState, useRef, useCallback, useEffect } from 'react'

export default function ButtonCard({
  button, index, isDragging, isDragOver,
  onDragStart, onDragOver, onDrop, onDragEnd,
  onEdit, onDelete, themeKey, size,
}) {
  const [contextMenu, setContextMenu] = useState(null)
  const [isHovered, setIsHovered]     = useState(false)
  const [isPressed, setIsPressed]     = useState(false)
  const menuRef = useRef(null)

  const isAtari   = themeKey === 'atari2600'
  const isNeoNoir = themeKey === 'neonoir'
  const w = size?.w ?? 120
  const h = size?.h ?? 90
  const compact = w < 90

  const handleContextMenu = useCallback((e) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }, [])

  const closeMenu = useCallback(() => setContextMenu(null), [])

  useEffect(() => {
    if (!contextMenu) return
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) closeMenu() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [contextMenu, closeMenu])

  const handleClick = useCallback(async () => {
    if (!window.electronAPI) return
    if (button.type === 'url') await window.electronAPI.launchUrl(button.action)
    else if (button.type === 'app') await window.electronAPI.launchApp(button.action)
  }, [button])

  const getStyle = () => {
    const base = {
      width: `${w}px`,
      height: `${h}px`,
      borderRadius: 'var(--radius)',
      border: '1px solid var(--border)',
      background: 'var(--bg-button)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      gap: compact ? '3px' : '6px',
      transition: 'all var(--transition)',
      opacity: isDragging ? 0.4 : 1,
      outline: isDragOver ? '2px solid var(--accent)' : 'none',
      outlineOffset: '2px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'var(--font-family)',
      userSelect: 'none',
    }

    if (isAtari) {
      return {
        ...base,
        background: isPressed ? 'var(--bg-button-active)' : isHovered ? 'var(--bg-button-hover)' : 'var(--bg-button)',
        boxShadow: isPressed
          ? 'inset 0 4px 8px rgba(0,0,0,0.8), inset 0 -1px 2px rgba(255,102,0,0.1)'
          : 'inset 0 -4px 8px rgba(0,0,0,0.5), 0 3px 6px rgba(0,0,0,0.5)',
        border: `2px solid ${isHovered ? '#ff6600' : '#8b4513'}`,
        color: isHovered ? '#ff6600' : '#ffcc00',
        textShadow: isHovered ? '0 0 8px #ff6600, 0 0 16px #ff6600' : 'none',
      }
    }

    if (isNeoNoir) {
      return {
        ...base,
        background: isPressed ? 'var(--bg-button-active)' : isHovered ? 'var(--bg-button-hover)' : 'var(--bg-button)',
        border: `1px solid ${isHovered ? '#ff006e' : 'rgba(255,0,110,0.22)'}`,
        boxShadow: isHovered
          ? '0 0 12px rgba(255,0,110,0.5), 0 0 24px rgba(0,212,255,0.15), inset 0 0 8px rgba(255,0,110,0.08)'
          : 'none',
        transform: isHovered && !isPressed ? 'scale(1.04)' : 'scale(1)',
        color: isHovered ? '#ff006e' : 'var(--text-primary)',
        textShadow: isHovered ? '0 0 8px #ff006e, 0 0 16px #00d4ff' : 'none',
      }
    }

    return {
      ...base,
      background: isPressed ? 'var(--bg-button-active)' : isHovered ? 'var(--bg-button-hover)' : 'var(--bg-button)',
      boxShadow: isHovered ? 'var(--shadow-button)' : 'none',
      transform: isHovered && !isPressed ? 'var(--button-scale-hover)' : 'scale(1)',
      backdropFilter: 'var(--backdrop-filter)',
    }
  }

  const iconSize = compact ? (isAtari ? 16 : 18) : (isAtari ? 24 : 28)
  const imgSize  = compact ? 20 : (isAtari ? 28 : 32)
  const labelSize = compact ? (isAtari ? '5px' : '9px') : (isAtari ? '6px' : '11px')

  const labelColor = () => {
    if (isAtari && isHovered) return '#ff6600'
    if (isNeoNoir && isHovered) return '#ff006e'
    return 'var(--text-primary)'
  }

  const labelShadow = () => {
    if (isAtari && isHovered) return '0 0 6px #ff6600'
    if (isNeoNoir && isHovered) return '0 0 6px #ff006e'
    return 'none'
  }

  return (
    <>
      <div
        draggable
        onDragStart={e => onDragStart(e, index)}
        onDragOver={e => onDragOver(e, index)}
        onDrop={e => onDrop(e, index)}
        onDragEnd={onDragEnd}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setIsPressed(false) }}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        style={getStyle()}
        title={button.label}
      >
        <div style={{ fontSize: `${iconSize}px`, lineHeight: 1 }}>
          {button.iconType === 'image' ? (
            <img
              src={button.icon}
              alt={button.label}
              style={{ width: `${imgSize}px`, height: `${imgSize}px`, objectFit: 'contain', imageRendering: isAtari ? 'pixelated' : 'auto' }}
              draggable={false}
            />
          ) : (
            <span role="img" aria-label={button.label}>{button.icon || '🔲'}</span>
          )}
        </div>

        {!compact && (
          <span style={{
            fontSize: labelSize,
            color: labelColor(),
            textAlign: 'center',
            maxWidth: `${w - 12}px`,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textShadow: labelShadow(),
            fontFamily: 'var(--font-family)',
            letterSpacing: isAtari ? '0.5px' : 'normal',
          }}>
            {button.label}
          </span>
        )}
      </div>

      {contextMenu && (
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow)',
            zIndex: 9999,
            minWidth: '140px',
            overflow: 'hidden',
            fontFamily: 'var(--font-family)',
          }}
        >
          <button
            onClick={() => { onEdit(button); closeMenu() }}
            style={ctxItemStyle(isAtari)}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-button-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            ✏️ Edit
          </button>
          <div style={{ height: '1px', background: 'var(--border)' }} />
          <button
            onClick={() => { onDelete(button.id); closeMenu() }}
            style={{ ...ctxItemStyle(isAtari), color: '#ff4444' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,68,68,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            🗑️ Delete
          </button>
        </div>
      )}
    </>
  )
}

function ctxItemStyle(isAtari) {
  return {
    width: '100%',
    padding: isAtari ? '10px 14px' : '8px 14px',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: isAtari ? '7px' : '12px',
    fontFamily: 'var(--font-family)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  }
}
