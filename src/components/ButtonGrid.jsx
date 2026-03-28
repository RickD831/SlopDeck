import React, { useState, useRef, useCallback } from 'react'
import ButtonCard from './ButtonCard.jsx'

// Button sizes per mode
function getButtonSize(miniMode, dockSide) {
  if (dockSide === 'left' || dockSide === 'right') return { w: 62, h: 68 }
  if (dockSide === 'top'  || dockSide === 'bottom') return { w: 72, h: 58 }
  if (miniMode) return { w: 84, h: 64 }
  return { w: 120, h: 90 }
}

function getGridCols(dockSide, buttonCount) {
  if (dockSide === 'left' || dockSide === 'right') return 2
  if (dockSide === 'top'  || dockSide === 'bottom') return Math.max(buttonCount, 1)
  return 4
}

function getGap(dockSide, miniMode) {
  if (dockSide === 'left' || dockSide === 'right') return '6px'
  if (dockSide === 'top'  || dockSide === 'bottom') return '6px'
  return miniMode ? '8px' : '12px'
}

function getPadding(dockSide, miniMode, isAtari) {
  if (dockSide === 'left' || dockSide === 'right') return '6px 4px'
  if (dockSide === 'top'  || dockSide === 'bottom') return '4px 8px'
  if (isAtari) return '8px'
  return miniMode ? '16px' : '24px'
}

export default function ButtonGrid({
  buttons, onButtonsChange,
  onEditButton, onDeleteButton,
  themeKey, miniMode, dockSide, bgImage,
}) {
  const [dragIndex, setDragIndex]     = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const dragData = useRef(null)

  const handleDragStart = useCallback((e, index) => {
    setDragIndex(index)
    dragData.current = index
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }, [])

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (index !== dragOverIndex) setDragOverIndex(index)
  }, [dragOverIndex])

  const handleDrop = useCallback((e, dropIndex) => {
    e.preventDefault()
    const fromIndex = dragData.current
    if (fromIndex === null || fromIndex === dropIndex) {
      setDragIndex(null); setDragOverIndex(null); return
    }
    const next = [...buttons]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(dropIndex, 0, moved)
    onButtonsChange(next)
    setDragIndex(null); setDragOverIndex(null); dragData.current = null
  }, [buttons, onButtonsChange])

  const handleDragEnd = useCallback(() => {
    setDragIndex(null); setDragOverIndex(null); dragData.current = null
  }, [])

  const isAtari     = themeKey === 'atari2600'
  const isSideDock  = dockSide === 'left' || dockSide === 'right'
  const isFlatDock  = dockSide === 'top'  || dockSide === 'bottom'
  const btnSize     = getButtonSize(miniMode, dockSide)
  const cols        = getGridCols(dockSide, buttons.length)
  const gap         = getGap(dockSide, miniMode)
  const padding     = getPadding(dockSide, miniMode, isAtari)

  const wrapStyle = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: isFlatDock ? 'center' : isSideDock ? 'flex-start' : 'center',
    justifyContent: isFlatDock ? 'flex-start' : 'center',
    overflowX: isFlatDock ? 'auto' : 'hidden',
    overflowY: isSideDock ? 'auto' : 'hidden',
    background: isAtari ? 'var(--bezel-bg)' : (bgImage && dockSide === 'free') ? `url("${bgImage}") center/auto no-repeat` : 'transparent',
    padding: isAtari && !isSideDock && !isFlatDock ? '16px' : '0',
  }

  const innerStyle = {
    border:      isAtari && !isSideDock && !isFlatDock ? 'var(--bezel-border)' : 'none',
    borderRadius: isAtari ? '4px' : '0',
    background:  isAtari && !isSideDock && !isFlatDock ? 'var(--bg-primary)' : 'transparent',
    padding:     isAtari && !isSideDock && !isFlatDock ? '12px' : '0',
    boxShadow:   isAtari && !isSideDock && !isFlatDock ? 'inset 0 0 20px rgba(0,0,0,0.8)' : 'none',
    flexShrink: 0,
  }

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, ${btnSize.w}px)`,
    gridAutoRows: `${btnSize.h}px`,
    gap,
    padding,
  }

  return (
    <div style={wrapStyle}>
      <div style={innerStyle}>
        <div style={gridStyle}>
          {buttons.map((button, index) => (
            <ButtonCard
              key={button.id}
              button={button}
              index={index}
              isDragging={dragIndex === index}
              isDragOver={dragOverIndex === index}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              onEdit={onEditButton}
              onDelete={onDeleteButton}
              themeKey={themeKey}
              size={btnSize}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
