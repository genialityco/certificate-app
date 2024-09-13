import { type ReactNode } from 'react'

import { ActionIcon, Tooltip } from '@mantine/core'
import {
  IconArrowDown,
  IconArrowDownLeft,
  IconArrowDownRight,
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
  IconArrowUpLeft,
  IconArrowUpRight,
  IconCircle,
} from '@tabler/icons-react'

import useActiveObjectId from '@/store/useActiveObjectId'
import useCanvasObjects from '@/store/useCanvasObjects'
import useCanvasWorkingSize from '@/store/useCanvasWorkingSize'
import theme from '@/theme'

import ControlHeader from './ControlHeader'

export default function AlignControl() {
  const activeObjectId = useActiveObjectId((state) => state.activeObjectId)

  const canvasWorkingSize = useCanvasWorkingSize((state) => state.canvasWorkingSize)

  const canvasObjects = useCanvasObjects((state) => state.canvasObjects)
  const updateCanvasObject = useCanvasObjects((state) => state.updateCanvasObject)

  const activeObject = canvasObjects.find((object) => object.id === activeObjectId)

  const objectAlignOptions: {
    label: string
    icon: ReactNode
    onClick: () => void
    isActive: boolean
  }[] = activeObject
    ? [
        {
          label: 'Top-left',
          icon: <IconArrowUpLeft />,
          onClick: () => {
            updateCanvasObject(activeObject.id, {
              x: 0,
              y: 0,
            })
          },
          isActive: activeObject.x === 0 && activeObject.y === 0,
        },
        {
          label: 'Top-center',
          icon: <IconArrowUp />,
          onClick: () => {
            updateCanvasObject(activeObject.id, {
              x: (canvasWorkingSize.width - activeObject.width) / 2,
              y: 0,
            })
          },
          isActive:
            activeObject.x === (canvasWorkingSize.width - activeObject.width) / 2 &&
            activeObject.y === 0,
        },
        {
          label: 'Top-right',
          icon: <IconArrowUpRight />,
          onClick: () => {
            updateCanvasObject(activeObject.id, {
              x: canvasWorkingSize.width - activeObject.width,
              y: 0,
            })
          },
          isActive:
            activeObject.x === canvasWorkingSize.width - activeObject.width && activeObject.y === 0,
        },
        {
          label: 'Center-left',
          icon: <IconArrowLeft />,
          onClick: () => {
            updateCanvasObject(activeObject.id, {
              x: 0,
              y: (canvasWorkingSize.height - activeObject.height) / 2,
            })
          },
          isActive:
            activeObject.x === 0 &&
            activeObject.y === (canvasWorkingSize.height - activeObject.height) / 2,
        },
        {
          label: 'Center',
          icon: <IconCircle />,
          onClick: () => {
            updateCanvasObject(activeObject.id, {
              x: (canvasWorkingSize.width - activeObject.width) / 2,
              y: (canvasWorkingSize.height - activeObject.height) / 2,
            })
          },
          isActive:
            activeObject.x === (canvasWorkingSize.width - activeObject.width) / 2 &&
            activeObject.y === (canvasWorkingSize.height - activeObject.height) / 2,
        },
        {
          label: 'Center-right',
          icon: <IconArrowRight />,
          onClick: () => {
            updateCanvasObject(activeObject.id, {
              x: canvasWorkingSize.width - activeObject.width,
              y: (canvasWorkingSize.height - activeObject.height) / 2,
            })
          },
          isActive:
            activeObject.x === canvasWorkingSize.width - activeObject.width &&
            activeObject.y === (canvasWorkingSize.height - activeObject.height) / 2,
        },
        {
          label: 'Bottom-left',
          icon: <IconArrowDownLeft />,
          onClick: () => {
            updateCanvasObject(activeObject.id, {
              x: 0,
              y: canvasWorkingSize.height - activeObject.height,
            })
          },
          isActive:
            activeObject.x === 0 &&
            activeObject.y === canvasWorkingSize.height - activeObject.height,
        },
        {
          label: 'Bottom-center',
          icon: <IconArrowDown />,
          onClick: () => {
            updateCanvasObject(activeObject.id, {
              x: (canvasWorkingSize.width - activeObject.width) / 2,
              y: canvasWorkingSize.height - activeObject.height,
            })
          },
          isActive:
            activeObject.x === (canvasWorkingSize.width - activeObject.width) / 2 &&
            activeObject.y === canvasWorkingSize.height - activeObject.height,
        },
        {
          label: 'Bottom-right',
          icon: <IconArrowDownRight />,
          onClick: () => {
            updateCanvasObject(activeObject.id, {
              x: canvasWorkingSize.width - activeObject.width,
              y: canvasWorkingSize.height - activeObject.height,
            })
          },
          isActive:
            activeObject.x === canvasWorkingSize.width - activeObject.width &&
            activeObject.y === canvasWorkingSize.height - activeObject.height,
        },
      ]
    : []

  return (
    <>
      <ControlHeader title="Align" />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gridGap: theme.variables.sidebarGutter,
        }}
      >
        {objectAlignOptions.map(({ label, icon, onClick, isActive }) => (
          <Tooltip key={label} position="top" label={label}>
            <ActionIcon
              size="md"
              variant={isActive ? 'outline' : 'default'}
              color="dark"
              onClick={onClick}
            >
              {icon}
            </ActionIcon>
          </Tooltip>
        ))}
      </div>
    </>
  )
}
