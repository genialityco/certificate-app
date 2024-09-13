import { ActionIcon, Tooltip } from '@mantine/core'
import { IconCrosshair, IconMinus, IconPlus } from '@tabler/icons-react'

// Reemplazo de react-icons
import useCanvasContext from '@/context/useCanvasContext'
// Reemplazo de ~ por @
import useZoom from '@/store/useZoom'
// Reemplazo de ~ por @
import theme from '@/theme'

// Reemplazo de ~ por @

export default function OverlayZoom() {
  const { setCenter } = useCanvasContext()

  const zoom = useZoom((state) => state.zoom)
  const incrementZoom = useZoom((state) => state.incrementZoom)
  const decrementZoom = useZoom((state) => state.decrementZoom)

  return (
    <ul
      style={{
        pointerEvents: 'auto',
        width: '100%',
        listStyle: 'none',
        padding: 0,
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, auto))',
        alignItems: 'center',
        gridGap: theme.variables.overlayItemsGutter,
      }}
    >
      <li
        style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Tooltip position="top" label="Reset position" offset={8}>
          <ActionIcon
            size="lg"
            variant="default"
            onClick={() => {
              setCenter()
            }}
          >
            <IconCrosshair />
          </ActionIcon>
        </Tooltip>
      </li>
      <li
        style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Tooltip position="top" label="Decrement zoom" offset={8}>
          <ActionIcon
            size="lg"
            variant="default"
            onClick={() => {
              decrementZoom(5)
            }}
          >
            <IconMinus />
          </ActionIcon>
        </Tooltip>
      </li>
      <li
        style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Tooltip position="top" label="Set default zoom" offset={8}>
          <ActionIcon
            size="lg"
            variant="default"
            onClick={() => {
              setCenter()
            }}
          >
            {`${Math.trunc(Math.abs(zoom))}%`}
          </ActionIcon>
        </Tooltip>
      </li>
      <li
        style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Tooltip position="top" label="Increment zoom" offset={8}>
          <ActionIcon
            size="lg"
            variant="default"
            onClick={() => {
              incrementZoom(5)
            }}
          >
            <IconPlus />
          </ActionIcon>
        </Tooltip>
      </li>
    </ul>
  )
}
