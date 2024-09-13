import { ActionIcon, Text, Tooltip } from '@mantine/core'
import { IconTrash } from '@tabler/icons-react'
import startCase from 'lodash/startCase'

import useCanvasObjects from '@/store/useCanvasObjects'

export default function MenuTabLayers() {
  const canvasObjects = useCanvasObjects((state) => state.canvasObjects)
  const deleteCanvasObject = useCanvasObjects((state) => state.deleteCanvasObject)

  return (
    <>
      <h3>Layers</h3>
      {canvasObjects.length === 0 ? (
        <Text>No objects found.</Text>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            display: 'grid',
            gridTemplateColumns: '1fr',
            gridGap: '0.75rem',
            border: '1px solid white',
            borderRadius: '5px',
          }}
        >
          {[...canvasObjects].reverse().map((object) => (
            <Tooltip
              key={object.id}
              position="bottom-start"
              withArrow
              arrowSize={8}
              arrowOffset={20}
              label={
                <div>
                  <b>Position:</b> {Math.trunc(object.x)}, {Math.trunc(object.y)}
                  <br />
                  <b>Width:</b> {Math.trunc(object.width)} px
                  <br />
                  <b>Height:</b> {Math.trunc(object.height)} px
                  <br />
                  <b>Opacity:</b> {Math.trunc(object.opacity)}%
                  <br />
                  {(object.type === 'rectangle' ||
                    object.type === 'ellipse' ||
                    object.type === 'line' ||
                    object.type === 'arrow') && (
                    <>
                      {object.strokeWidth > 0 && (
                        <>
                          <b>Stroke Width:</b> {object.strokeWidth} px
                          <br />
                        </>
                      )}
                      {object.borderRadius > 0 && (
                        <>
                          <b>Border Radius:</b> {object.borderRadius} px
                          <br />
                        </>
                      )}
                    </>
                  )}
                  {object.type === 'text' && (
                    <>
                      <b>Font Family:</b> {object.fontFamily}
                      <br />
                      <b>Font Size:</b> {object.fontSize}px
                      <br />
                    </>
                  )}
                </div>
              }
            >
              <li
                style={{
                  border: '1px solid var(--color-borderPrimary)',
                  borderRadius: '5px',
                  overflow: 'hidden',
                  padding: '0.6rem 0.2rem 0.6rem 0.6rem',
                  display: 'grid',
                  gridTemplateColumns: '14px minmax(0, auto) minmax(0, 1fr) minmax(0, 30px)',
                  gridGap: '0.5rem',
                  alignItems: 'center',
                  cursor: 'help',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    width: '14px',
                    height: '14px',
                    background:
                      object.type === 'text'
                        ? object.fontColorHex
                        : object.type === 'free-draw' ||
                            object.type === 'line' ||
                            object.type === 'arrow'
                          ? object.strokeColorHex
                          : object.backgroundColorHex,
                  }}
                />
                <b style={{ fontSize: '0.8rem' }}>{startCase(object.type)}</b>
                <p style={{ marginBottom: '0', fontSize: '0.9rem' }}>{object.text}</p>
                <Tooltip label="Delete layer">
                  <ActionIcon
                    onClick={() => {
                      deleteCanvasObject(object.id)
                    }}
                  >
                    <IconTrash />
                  </ActionIcon>
                </Tooltip>
              </li>
            </Tooltip>
          ))}
        </ul>
      )}
    </>
  )
}
