import { type ReactNode } from 'react'

import { ActionIcon, Tooltip } from '@mantine/core'
import {
  IconCirclePlus2,
  IconCode,
  IconCursorText,
  IconIcons,
  IconPencil,
  IconPhoto,
  IconPointer,
  IconRectangle,
} from '@tabler/icons-react'

import { type UserMode } from '@/config/types'
import useActiveObjectId from '@/store/useActiveObjectId'
import useUserMode from '@/store/useUserMode'
import theme from '@/theme'

interface UserModeButton {
  mode: UserMode
  label: string
  icon: ReactNode
}

const userModeButtonsPrimary: UserModeButton[] = [
  {
    mode: 'select',
    label: 'Select mode',
    icon: <IconPointer />,
  },
]

const userModeButtonsSecondary: UserModeButton[] = [
  {
    mode: 'free-draw',
    label: 'Draw',
    icon: <IconPencil />,
  },
  {
    mode: 'rectangle',
    label: 'Rectangle',
    icon: <IconRectangle />,
  },
  {
    mode: 'ellipse',
    label: 'Ellipse',
    icon: <IconCirclePlus2 />,
  },
  {
    mode: 'text',
    label: 'Text',
    icon: <IconCursorText />,
  },
  {
    mode: 'icon',
    label: 'Icon',
    icon: <IconIcons />,
  },
  {
    mode: 'image',
    label: 'Image',
    icon: <IconPhoto />,
  },
  {
    mode: 'attribute',
    label: 'Attribute',
    icon: <IconCode />,
  },
]

export default function OverlayNavbar() {
  const setActiveObjectId = useActiveObjectId((state) => state.setActiveObjectId)
  const userMode = useUserMode((state) => state.userMode)
  const setUserMode = useUserMode((state) => state.setUserMode)

  const renderUserModeButtons = (buttons: UserModeButton[]) => (
    <div
      style={{
        pointerEvents: 'auto',
        background: 'var(--color-bgPrimary)',
        borderRadius: '0.2rem',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        border: '0.0625rem solid var(--color-borderPrimary)',
      }}
    >
      <ul
        style={{
          width: '100%',
          height: '100%',
          listStyle: 'none',
          padding: 0,
          display: 'grid',
          gridGap: '0.15rem',
          alignItems: 'center',
          gridTemplateColumns: `repeat(${buttons.length}, minmax(0, 1fr))`,
        }}
      >
        {buttons.map(({ mode, label, icon }) => {
          const isActive = userMode === mode
          return (
            <li key={mode} style={{ width: '100%', height: '100%' }}>
              <Tooltip
                position="bottom-start"
                label={`${label}${label.endsWith('mode') ? '' : ' tool'}${
                  isActive ? ` (active)` : ''
                }`}
                offset={16}
              >
                <ActionIcon
                  variant={isActive ? 'filled' : 'white'}
                  color={isActive ? 'blue' : 'dark'}
                  size="lg"
                  onClick={() => {
                    setUserMode(mode)
                    setActiveObjectId(null)
                  }}
                >
                  {icon}
                </ActionIcon>
              </Tooltip>
            </li>
          )
        })}
      </ul>
    </div>
  )

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.variables.overlayItemsGutter,
      }}
    >
      {renderUserModeButtons(userModeButtonsPrimary)}
      {renderUserModeButtons(userModeButtonsSecondary)}
    </div>
  )
}
