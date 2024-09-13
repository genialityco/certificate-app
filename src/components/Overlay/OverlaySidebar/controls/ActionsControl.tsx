import { Button } from '@mantine/core'
import { IconCopy, IconTrash } from '@tabler/icons-react'

import useActiveObjectId from '@/store/useActiveObjectId'
import useCanvasObjects from '@/store/useCanvasObjects'
import generateUniqueId from '@/utils/generateUniqueId'

import ControlHeader from './ControlHeader'

export default function ActionsControl() {
  const activeObjectId = useActiveObjectId((state) => state.activeObjectId)
  const setActiveObjectId = useActiveObjectId((state) => state.setActiveObjectId)

  const canvasObjects = useCanvasObjects((state) => state.canvasObjects)
  const appendRectangleObject = useCanvasObjects((state) => state.appendRectangleObject)
  const appendFreeDrawObject = useCanvasObjects((state) => state.appendFreeDrawObject)
  const appendTextObject = useCanvasObjects((state) => state.appendTextObject)

  const deleteCanvasObject = useCanvasObjects((state) => state.deleteCanvasObject)

  const activeObject = canvasObjects.find((object) => object.id === activeObjectId)

  if (!activeObject) {
    return null
  }

  return (
    <>
      <ControlHeader title="Actions" />
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          display: 'inline-grid',
          gridTemplateColumns: 'repeat(2, minmax(0, auto))',
          gridGap: '6px',
        }}
      >
        <li>
          <Button
            leftSection={<IconCopy />}
            variant="default"
            size="xs"
            onClick={() => {
              const newId = generateUniqueId()
              const duplicatedObject = {
                ...activeObject,
                id: newId,
                x: activeObject.x + 50,
                y: activeObject.y + 50,
              }
              switch (activeObject.type) {
                case 'free-draw':
                  appendFreeDrawObject(duplicatedObject)
                  break
                case 'text':
                  appendTextObject(duplicatedObject)
                  break
                case 'rectangle':
                default:
                  appendRectangleObject(duplicatedObject)
                  break
              }
              setActiveObjectId(newId)
            }}
          >
            Duplicate
          </Button>
        </li>
        <li>
          <Button
            leftSection={<IconTrash />}
            variant="default"
            size="xs"
            onClick={() => {
              deleteCanvasObject(activeObject.id)
              setActiveObjectId(null)
            }}
          >
            Delete
          </Button>
        </li>
      </ul>
    </>
  )
}
