import {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react'

import { resolveElementText } from '../fields'
import { textAlignOf } from '../renderCertificate'
import { type CertificateElement } from '../types'
import { type EditorState } from './useEditorState'

type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

const HANDLES: Handle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']
const MIN_SIZE = 10
const SNAP_DISTANCE = 8

const handleStyle = (handle: Handle, scale: number): CSSProperties => {
  const size = 12 / scale
  const half = -size / 2
  const pos: CSSProperties = {
    position: 'absolute',
    width: size,
    height: size,
    background: '#fff',
    border: `${2 / scale}px solid #4d93d0`,
    borderRadius: 2 / scale,
    zIndex: 2,
  }
  if (handle.includes('n')) pos.top = half
  if (handle.includes('s')) pos.bottom = half
  if (handle.includes('w')) pos.left = half
  if (handle.includes('e')) pos.right = half
  if (handle === 'n' || handle === 's') pos.left = `calc(50% - ${size / 2}px)`
  if (handle === 'e' || handle === 'w') pos.top = `calc(50% - ${size / 2}px)`
  pos.cursor = `${handle}-resize`
  return pos
}

const verticalJustify = { top: 'flex-start', middle: 'center', bottom: 'flex-end' } as const

interface Props {
  state: EditorState
  size: { width: number; height: number }
  sampleValues: Record<string, string>
  fieldLabels: Record<string, string>
}

export function EditorStage({ state, size, sampleValues, fieldLabels }: Props) {
  const { elements, selectedId, setSelectedId, snapshot, live } = state
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.5)
  const [guides, setGuides] = useState<{ v: boolean; h: boolean }>({ v: false, h: false })

  // Ajustar el lienzo al espacio disponible
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const fit = () => {
      const { width, height } = container.getBoundingClientRect()
      const next = Math.min((width - 48) / size.width, (height - 48) / size.height, 1)
      setScale(Math.max(next, 0.05))
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(container)
    return () => observer.disconnect()
  }, [size.width, size.height])

  const startInteraction = (
    event: ReactPointerEvent,
    element: CertificateElement,
    handle: Handle | null,
  ) => {
    if (element.isBackground) {
      setSelectedId(null)
      return
    }
    event.stopPropagation()
    event.preventDefault()
    setSelectedId(element.id)
    snapshot()

    const start = { x: event.clientX, y: event.clientY }
    const origin = { x: element.x, y: element.y, width: element.width, height: element.height }

    const onMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - start.x) / scale
      const dy = (moveEvent.clientY - start.y) / scale
      let { x, y, width, height } = origin

      if (!handle) {
        x = origin.x + dx
        y = origin.y + dy
        // Imán al centro del certificado
        const centerX = x + width / 2
        const centerY = y + height / 2
        const snapV = Math.abs(centerX - size.width / 2) < SNAP_DISTANCE / scale
        const snapH = Math.abs(centerY - size.height / 2) < SNAP_DISTANCE / scale
        if (snapV && !moveEvent.altKey) x = size.width / 2 - width / 2
        if (snapH && !moveEvent.altKey) y = size.height / 2 - height / 2
        setGuides({ v: snapV, h: snapH })
      } else {
        if (handle.includes('e')) width = Math.max(origin.width + dx, MIN_SIZE)
        if (handle.includes('s')) height = Math.max(origin.height + dy, MIN_SIZE)
        if (handle.includes('w')) {
          width = Math.max(origin.width - dx, MIN_SIZE)
          x = origin.x + origin.width - width
        }
        if (handle.includes('n')) {
          height = Math.max(origin.height - dy, MIN_SIZE)
          y = origin.y + origin.height - height
        }
      }

      const patch = {
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(width),
        height: Math.round(height),
      }
      live((prev) => prev.map((el) => (el.id === element.id ? { ...el, ...patch } : el)))
    }

    const onUp = () => {
      setGuides({ v: false, h: false })
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={() => setSelectedId(null)}
      style={{
        flex: 1,
        minHeight: 0,
        overflow: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'repeating-conic-gradient(#eef0f4 0% 25%, #f7f8fa 0% 50%) 50% / 24px 24px',
      }}
    >
      <div style={{ width: size.width * scale, height: size.height * scale, flexShrink: 0 }}>
        <div
          style={{
            position: 'relative',
            width: size.width,
            height: size.height,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            background: '#fff',
            boxShadow: '0 10px 40px rgba(17, 24, 39, 0.18)',
          }}
        >
          {elements.map((element) => {
            const selected = element.id === selectedId
            const common: CSSProperties = {
              position: 'absolute',
              left: element.x,
              top: element.y,
              width: element.width,
              height: element.height,
              opacity: (element.opacity ?? 100) / 100,
              cursor: element.isBackground ? 'default' : 'move',
              outline: selected
                ? `${2 / scale}px solid #4d93d0`
                : element.isBackground
                  ? 'none'
                  : `${1 / scale}px dashed rgba(77, 147, 208, 0.35)`,
              userSelect: 'none',
              touchAction: 'none',
            }

            if (element.type === 'image') {
              return (
                <div
                  key={element.id}
                  style={common}
                  onPointerDown={(e) => startInteraction(e, element, null)}
                >
                  {element.imageUrl && (
                    <img
                      src={element.imageUrl}
                      alt=""
                      draggable={false}
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'block',
                        pointerEvents: 'none',
                      }}
                    />
                  )}
                  {selected &&
                    HANDLES.map((h) => (
                      <div
                        key={h}
                        style={handleStyle(h, scale)}
                        onPointerDown={(e) => startInteraction(e, element, h)}
                      />
                    ))}
                </div>
              )
            }

            if (element.type === 'rectangle') {
              return (
                <div
                  key={element.id}
                  style={{
                    ...common,
                    background: element.backgroundColorHex,
                    border: `${element.strokeWidth ?? 0}px solid ${element.strokeColorHex ?? 'transparent'}`,
                    borderRadius: element.borderRadius,
                    boxSizing: 'border-box',
                  }}
                  onPointerDown={(e) => startInteraction(e, element, null)}
                >
                  {selected &&
                    HANDLES.map((h) => (
                      <div
                        key={h}
                        style={handleStyle(h, scale)}
                        onPointerDown={(e) => startInteraction(e, element, h)}
                      />
                    ))}
                </div>
              )
            }

            if (element.type !== 'text' && element.type !== 'attribute') return null

            const align = textAlignOf(element)
            const fontSize = element.fontSize ?? 32
            const text =
              resolveElementText(element, sampleValues) ||
              (element.type === 'attribute'
                ? `{${fieldLabels[element.text ?? ''] ?? element.text}}`
                : '')

            return (
              <div
                key={element.id}
                style={{
                  ...common,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: verticalJustify[align.vertical],
                  textAlign: align.horizontal,
                  color: element.fontColorHex,
                  fontFamily: `"${element.fontFamily}", sans-serif`,
                  fontSize,
                  fontWeight: element.fontWeight as CSSProperties['fontWeight'],
                  fontStyle: element.fontStyle,
                  fontVariant: element.fontVariant,
                  lineHeight: `${(element.fontLineHeightRatio ?? 1.2) * fontSize}px`,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  background:
                    element.type === 'attribute' && !selected
                      ? 'rgba(77, 147, 208, 0.06)'
                      : undefined,
                }}
                onPointerDown={(e) => startInteraction(e, element, null)}
                onDoubleClick={() => setSelectedId(element.id)}
              >
                <span>{text}</span>
                {element.type === 'attribute' && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -22 / scale,
                      left: 0,
                      fontSize: 11 / scale,
                      lineHeight: 1,
                      padding: `${3 / scale}px ${6 / scale}px`,
                      borderRadius: 4 / scale,
                      background: selected ? '#4d93d0' : 'rgba(77, 147, 208, 0.75)',
                      color: '#fff',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 600,
                      fontStyle: 'normal',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                    }}
                  >
                    {fieldLabels[element.text ?? ''] ?? element.text}
                  </span>
                )}
                {selected &&
                  HANDLES.map((h) => (
                    <div
                      key={h}
                      style={handleStyle(h, scale)}
                      onPointerDown={(e) => startInteraction(e, element, h)}
                    />
                  ))}
              </div>
            )
          })}

          {guides.v && (
            <div
              style={{
                position: 'absolute',
                left: size.width / 2,
                top: 0,
                bottom: 0,
                width: 1 / scale,
                background: '#f39d52',
              }}
            />
          )}
          {guides.h && (
            <div
              style={{
                position: 'absolute',
                top: size.height / 2,
                left: 0,
                right: 0,
                height: 1 / scale,
                background: '#f39d52',
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
