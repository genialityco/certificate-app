import { Button } from '@mantine/core'
import { IconArrowBackUp, IconArrowForwardUp } from '@tabler/icons-react'

// Nuevos íconos de Tabler
import useActiveObjectId from '@/store/useActiveObjectId'
import useCanvasObjects from '@/store/useCanvasObjects'

import ControlHeader from './ControlHeader'

export default function LayerControl() {
  const activeObjectId = useActiveObjectId((state) => state.activeObjectId)

  const canvasObjects = useCanvasObjects((state) => state.canvasObjects)
  const setCanvasObjectLayerIndex = useCanvasObjects((state) => state.setCanvasObjectLayerIndex)

  const activeObject = canvasObjects.find((object) => object.id === activeObjectId)

  if (!activeObject) {
    return null
  }

  const activeObjectLayerIndex = canvasObjects.findIndex((object) => object.id === activeObject?.id)
  const totalLayers = canvasObjects.length

  return (
    <>
      <ControlHeader title="Layer" subtitle={`(${activeObjectLayerIndex + 1}/${totalLayers})`} />
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
            title="Send backward"
            disabled={canvasObjects.findIndex((object) => object.id === activeObject.id) === 0}
            leftSection={<IconArrowBackUp />} // Ícono cambiado
            variant="default"
            size="xs"
            onClick={() => {
              setCanvasObjectLayerIndex(activeObject.id, activeObjectLayerIndex - 1)
            }}
          >
            Backward
          </Button>
        </li>
        <li>
          <Button
            title="Bring forward"
            disabled={
              canvasObjects.findIndex((object) => object.id === activeObject.id) ===
              canvasObjects.length - 1
            }
            leftSection={<IconArrowForwardUp />} // Ícono cambiado
            variant="default"
            size="xs"
            onClick={() => {
              setCanvasObjectLayerIndex(activeObject.id, activeObjectLayerIndex + 1)
            }}
          >
            Forward
          </Button>
        </li>
      </ul>
    </>
  )
}
