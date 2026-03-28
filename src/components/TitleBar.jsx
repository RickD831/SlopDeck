import React from 'react'

export default function TitleBar({ themeKey, dockSide }) {
  const isAtari  = themeKey === 'atari2600'
  const isNarrow = dockSide === 'left' || dockSide === 'right'
  const isFlat   = dockSide === 'top'  || dockSide === 'bottom'

  // In flat-dock mode the bar is very thin — just enough to be a drag target
  const height = isFlat ? '20px' : 'var(--titlebar-height)'

  return (
    <div
      style={{
        height,
        background:    'var(--bg-titlebar)',
        borderBottom:  '1px solid var(--border)',
        display:       'flex',
        alignItems:    'center',
        padding:       isNarrow ? '0 4px' : '0 10px',
        WebkitAppRegion: 'drag',
        flexShrink:    0,
        gap:           '6px',
        minWidth:      0,
      }}
    >
      {/* App name — hidden in narrow dock to save space */}
      {!isNarrow && !isFlat && (
        <span style={{
          fontFamily:    'var(--font-family)',
          fontSize:      isAtari ? '7px' : '12px',
          fontWeight:    isAtari ? '400' : '600',
          color:         'var(--text-secondary)',
          letterSpacing: isAtari ? '1px' : '0.3px',
          whiteSpace:    'nowrap',
          flexShrink:    0,
        }}>
          SlopDeck
        </span>
      )}

      <div style={{ flex: 1 }} />

      {/* Window controls */}
      <div style={{ WebkitAppRegion: 'no-drag', display: 'flex', gap: '2px', flexShrink: 0 }}>
        {!isFlat && (
          <WinBtn
            onClick={() => window.electronAPI?.minimize()}
            title="Hide to tray"
            hoverBg="rgba(255,255,255,0.1)"
            small={isNarrow}
          >
            ─
          </WinBtn>
        )}
        <WinBtn
          onClick={() => window.electronAPI?.close()}
          title="Hide to tray"
          hoverBg="#c42b1c"
          hoverColor="#fff"
          small={isNarrow || isFlat}
        >
          ✕
        </WinBtn>
      </div>
    </div>
  )
}

function WinBtn({ onClick, title, children, hoverBg, hoverColor, small }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width:        small ? '18px' : '24px',
        height:       small ? '16px' : '20px',
        background:   'transparent',
        border:       '1px solid transparent',
        borderRadius: '4px',
        color:        'var(--text-secondary)',
        cursor:       'pointer',
        fontSize:     small ? '10px' : '12px',
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'center',
        fontFamily:   'var(--font-family)',
        transition:   'all 0.1s',
        flexShrink:   0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = hoverBg || 'rgba(255,255,255,0.1)'
        if (hoverColor) e.currentTarget.style.color = hoverColor
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = 'var(--text-secondary)'
      }}
    >
      {children}
    </button>
  )
}
