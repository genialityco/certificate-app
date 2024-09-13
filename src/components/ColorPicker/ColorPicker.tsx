import { type CSSProperties, useRef, useState } from 'react'

import { type ColorPickerType } from '@/config/types'
import useOnClickOutside from '@/hooks/useOnClickOutside'
import useDefaultParams from '@/store/useDefaultParams'
import theme from '@/theme'

import ColorPickerElement from './ColorPickerElement'

const SIZE = '30px'

interface Props {
  color: string
  onChange: (color: string) => void
  disableAlpha?: boolean
  typeOverride?: ColorPickerType
  className?: string
  style?: CSSProperties
}

export default function ColorPicker({
  color,
  onChange,
  disableAlpha = true,
  typeOverride,
  className,
  style,
}: Props) {
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const defaultParams = useDefaultParams((state) => state.defaultParams)

  const wrapperRef = useRef<HTMLDivElement>(null)

  useOnClickOutside(wrapperRef, () => {
    setIsOpen(false)
  })

  return (
    <div ref={wrapperRef} className={className} style={{ position: 'relative', ...style }}>
      <button
        onClick={() => {
          setIsOpen(true)
        }}
        style={{
          display: 'grid',
          gridTemplateColumns: `minmax(0, ${SIZE}) minmax(0, 1fr)`,
          height: SIZE,
          border: '1px solid var(--color-borderPrimary)',
          borderRadius: '5px',
          overflow: 'hidden',
          width: '100%',
          background: 'var(--color-background-primary)',
          cursor: 'pointer',
          alignItems: 'center',
          textAlign: 'left',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            cursor: 'pointer',
            background: color,
          }}
        />
        <div
          style={{
            height: '100%',
            width: '100%',
            fontSize: '0.75rem',
            padding: '0.15rem 0.5rem 0',
            border: 'none',
            background: 'var(--color-background-primary)',
            color: 'var(--color-textPrimary)',
            borderLeft: '1px solid var(--color-borderPrimary)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {color?.toUpperCase()}
        </div>
      </button>
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: `calc(${SIZE} + 0.5rem)`,
            left: 0,
            zIndex: theme.layers.colorPickerPopover,
          }}
        >
          <ColorPickerElement
            type={typeOverride || defaultParams.activeColorPicker}
            disableAlpha={disableAlpha}
            color={color}
            onChange={(color) => {
              onChange(color.hex)
            }}
            onClose={() => {
              setIsOpen(false)
            }}
            style={{
              position: 'fixed',
              ...(theme.medias.gteMedium && {
                bottom: 'auto',
                top: `calc(${theme.variables.overlayGutter} + ${theme.variables.overlayGutter} + ${theme.variables.topNavbarHeight})`,
                left: `calc(${theme.variables.overlayGutter} + ${theme.variables.overlayGutter} + ${theme.variables.sidebarWidth})`,
                right: 'auto',
              }),
            }}
          />
        </div>
      )}
    </div>
  )
}
