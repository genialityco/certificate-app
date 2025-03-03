/* eslint-disable react-hooks/exhaustive-deps */
import { type PointerEvent, type Touch, type TouchEvent, useEffect, useMemo, useRef } from 'react'
import { useLocation } from 'react-router-dom'

import { Button, Group } from '@mantine/core'

import { TRANSPARENT_BACKGROUND_IMAGE } from '@/config/constants'
import { APP_FIXED_MAIN_UNIQUE_ID, CANVAS_CONTROLS_OVERLAY } from '@/config/globalElementIds'
import { type ActionModeOption, type CanvasObject } from '@/config/types'
import useCanvasContext from '@/context/useCanvasContext'
import { ApiServices } from '@/services'
import {
  createCertificate,
  fetchCertificateById,
  updateCertificate,
} from '@/services/api/certificateService'
import useActionMode from '@/store/useActionMode'
import useActiveObjectId from '@/store/useActiveObjectId'
import useCanvasObjects from '@/store/useCanvasObjects'
import useCanvasWorkingSize from '@/store/useCanvasWorkingSize'
import useDefaultParams from '@/store/useDefaultParams'
import useScrollPosition from '@/store/useScrollPosition'
import useUserMode from '@/store/useUserMode'
import useWindowSize from '@/store/useWindowSize'
import useZoom from '@/store/useZoom'
import theme from '@/theme'
import generateUniqueId from '@/utils/generateUniqueId'
import getControlPoints from '@/utils/getControlPoints'
import getCursorFromModes from '@/utils/getCursorFromModes'
import getDimensionsFromFreeDraw from '@/utils/getDimensionsFromFreeDraw'
import getImageElementFromUrl from '@/utils/getImageElementFromUrl'
import getRelativeMousePositionOnCanvas from '@/utils/getRelativeMousePositionOnCanvas'
import isCursorWithinRectangle from '@/utils/isCursorWithinRectangle'

type PointerOrTouchEvent = PointerEvent<HTMLElement> | TouchEvent<HTMLElement>

export default function Canvas({ eventId }: { eventId: string }) {
  const { canvasRef, contextRef, drawEverything } = useCanvasContext()
  const location = useLocation()

  const queryParams = new URLSearchParams(location.search)
  const certificateId = queryParams.get('certificateId')

  const apiServices = useMemo(() => new ApiServices(), [])

  const previousTouchRef = useRef<Touch | null>(null)
  const distanceBetweenTouchesRef = useRef<number>(0)

  const windowSize = useWindowSize((state) => state.windowSize)

  const activeObjectId = useActiveObjectId((state) => state.activeObjectId)
  const setActiveObjectId = useActiveObjectId((state) => state.setActiveObjectId)

  const canvasObjects = useCanvasObjects((state) => state.canvasObjects)
  const appendRectangleObject = useCanvasObjects((state) => state.appendRectangleObject)
  const appendEllipseObject = useCanvasObjects((state) => state.appendEllipseObject)
  const appendFreeDrawObject = useCanvasObjects((state) => state.appendFreeDrawObject)
  const appendTextObject = useCanvasObjects((state) => state.appendTextObject)
  const appendImageObject = useCanvasObjects((state) => state.appendImageObject)
  const appendAttributeObject = useCanvasObjects((state) => state.appendAttributeObject)
  const updateCanvasObject = useCanvasObjects((state) => state.updateCanvasObject)
  const appendFreeDrawPointToCanvasObject = useCanvasObjects(
    (state) => state.appendFreeDrawPointToCanvasObject,
  )
  const moveCanvasObject = useCanvasObjects((state) => state.moveCanvasObject)
  const resizeCanvasObject = useCanvasObjects((state) => state.resizeCanvasObject)
  // const resetCanvasObjects = useCanvasObjects((state) => state.resetCanvasObjects);

  const canvasWorkingSize = useCanvasWorkingSize((state) => state.canvasWorkingSize)

  const defaultParams = useDefaultParams((state) => state.defaultParams)

  const incrementZoom = useZoom((state) => state.incrementZoom)
  const decrementZoom = useZoom((state) => state.decrementZoom)

  const scrollPosition = useScrollPosition((state) => state.scrollPosition)
  const updateScrollPosition = useScrollPosition((state) => state.updateScrollPosition)

  const userMode = useUserMode((state) => state.userMode)
  const setUserMode = useUserMode((state) => state.setUserMode)

  const actionMode = useActionMode((state) => state.actionMode)
  const setActionMode = useActionMode((state) => state.setActionMode)

  const zoom = useZoom((state) => state.zoom)

  const initialDrawingPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  const activeObject = canvasObjects.find((canvasObject) => canvasObject.id === activeObjectId)

  useEffect(() => {
    const getCertElements = async () => {
      try {
        const response = await fetchCertificateById(certificateId)

        // Asignar tamaño con valores predeterminados
        const { width = 1920, height = 1080 } = response?.data?.size || {}
        canvasWorkingSize.width = width
        canvasWorkingSize.height = height

        if (response && response.data) {
          const certificateData = response.data as { elements: CanvasObject[] }

          // Filtrar primero las imágenes de fondo
          const imageElements = certificateData.elements.filter(
            (element: { type: string }) => element.type === 'image',
          )
          const nonImageElements = certificateData.elements.filter(
            (element: { type: string }) => element.type !== 'image',
          )

          // Cargar todas las imágenes de fondo primero
          await Promise.all(
            imageElements.map(async (element: CanvasObject) => {
              const existingObject = canvasObjects.find((obj) => obj.id === element.id)
              if (!existingObject) {
                await loadImage(element, element.imageUrl)
              }
            }),
          )

          // Luego, cargar el resto de los elementos (textos, rectángulos, etc.)
          nonImageElements.forEach((element: CanvasObject) => {
            // Verificar si el objeto ya existe
            const existingObject = canvasObjects.find((obj) => obj.id === element.id)
            if (!existingObject) {
              switch (element.type) {
                case 'rectangle':
                  appendRectangleObject({
                    id: element.id,
                    x: element.x,
                    y: element.y,
                    width: element.width,
                    height: element.height,
                    backgroundColorHex: element.backgroundColorHex,
                    strokeColorHex: element.strokeColorHex,
                    strokeWidth: element.strokeWidth,
                    opacity: element.opacity,
                    borderRadius: element.borderRadius,
                  })
                  break
                case 'text':
                  appendTextObject({
                    id: element.id,
                    x: element.x,
                    y: element.y,
                    width: element.width,
                    height: element.height,
                    text: element.text,
                    fontColorHex: element.fontColorHex,
                    fontSize: element.fontSize,
                    fontFamily: element.fontFamily,
                    fontStyle: element.fontStyle,
                    fontWeight: element.fontWeight,
                    fontVariant: element.fontVariant,
                    textAlignHorizontal: element.textAlignHorizontal,
                    textAlignVertical: element.textAlignVertical,
                    textJustify: element.textJustify,
                    opacity: element.opacity,
                    fontLineHeightRatio: element.fontLineHeightRatio,
                  })
                  break
                case 'free-draw':
                  appendFreeDrawObject({
                    id: element.id,
                    x: element.x,
                    y: element.y,
                    width: element.width,
                    height: element.height,
                    strokeColorHex: element.strokeColorHex,
                    strokeWidth: element.strokeWidth,
                    opacity: element.opacity,
                    freeDrawPoints: element.freeDrawPoints,
                  })
                  break
                case 'attribute':
                  if (element) {
                    appendAttributeObject({
                      id: element.id,
                      x: element.x,
                      y: element.y,
                      width: element.width,
                      height: element.height,
                      text: element.text,
                      opacity: element.opacity || 100,
                      fontColorHex: element.fontColorHex || '#000000',
                      fontSize: element.fontSize || 16,
                      fontFamily: element.fontFamily || 'Arial',
                      fontStyle: element.fontStyle || 'normal',
                      fontVariant: element.fontVariant || 'normal',
                      fontWeight: element.fontWeight || 'normal',
                      fontLineHeightRatio: element.fontLineHeightRatio || 1.2,
                    })
                  }
                  break
                default:
                  throw new Error('Tipo de elemento no reconocido')
                  break
              }
            }
          })
        }
      } catch (error) {
        throw new Error(String(error))
      }
    }

    // Función para cargar una imagen
    const loadImage = async (element: CanvasObject, imageUrl: string) => {
      await commonPushImageObject(element, imageUrl)
    }

    // Para insertar una imagen
    const pushImageObject = async (
      element: CanvasObject,
      imageUrl: string,
      imageElement: HTMLImageElement,
    ) => {
      appendImageObject({
        id: element.id,
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        opacity: element.opacity,
        imageUrl,
        imageElement,
      })
    }

    const commonPushImageObject = async (element: CanvasObject, url: string) => {
      const imageElement = await getImageElementFromUrl(url)
      // const dimensions = await getDimensionsFromImage({
      //   context: contextRef?.current,
      //   imageObject: { x: 0, y: 0, imageElement },
      // });
      pushImageObject(element, url, imageElement)
    }

    if (certificateId) {
      getCertElements()
    }
  }, [
    apiServices,
    appendAttributeObject,
    appendFreeDrawObject,
    appendImageObject,
    appendRectangleObject,
    appendTextObject,
    canvasObjects,
    certificateId,
  ])

  // On pointer down
  const onPointerDown = (event: PointerOrTouchEvent) => {
    event.preventDefault()
    const canvas = canvasRef.current
    const context = contextRef.current
    if (!canvas || !context) return

    const clientX = 'clientX' in event ? event.clientX : event.touches[0]?.clientX
    const clientY = 'clientY' in event ? event.clientY : event.touches[0]?.clientY

    const relativeMousePosition = getRelativeMousePositionOnCanvas({
      windowMouseX: clientX,
      windowMouseY: clientY,
      canvasWorkingSize,
      scrollPosition,
      zoom,
    })

    initialDrawingPositionRef.current = {
      x: relativeMousePosition.relativeMouseX,
      y: relativeMousePosition.relativeMouseY,
    }
    const createdObjectId = generateUniqueId()

    switch (userMode) {
      case 'icon':
      case 'image':
      case 'select': {
        let isResizing = false
        // Resize object
        if (activeObject) {
          const { ...boxes } = getControlPoints({
            canvasObject: activeObject,
            zoom,
          })
          Object.entries(boxes).forEach(([boxName, box]) => {
            const isWithinBounds = isCursorWithinRectangle({
              x: box.x,
              y: box.y,
              width: box.width,
              height: box.height,
              relativeMouseX: initialDrawingPositionRef.current.x,
              relativeMouseY: initialDrawingPositionRef.current.y,
            })
            if (isWithinBounds) {
              isResizing = true
              setActionMode({
                type: 'isResizing',
                option: boxName.split('Box')[0] as ActionModeOption,
              })
            }
          })
        }
        if (!isResizing) {
          const clickedObjects = canvasObjects.filter((canvasObject) => {
            return isCursorWithinRectangle({
              x: canvasObject.x,
              y: canvasObject.y,
              width: canvasObject.width,
              height: canvasObject.height,
              relativeMouseX: initialDrawingPositionRef.current.x,
              relativeMouseY: initialDrawingPositionRef.current.y,
            })
          })
          const clickedObject = clickedObjects[clickedObjects.length - 1]
          const wasClickInsideWorkingCanvas = isCursorWithinRectangle({
            x: 0,
            y: 0,
            width: canvasWorkingSize.width,
            height: canvasWorkingSize.height,
            relativeMouseX: initialDrawingPositionRef.current.x,
            relativeMouseY: initialDrawingPositionRef.current.y,
          })
          const shouldClearSelection =
            !wasClickInsideWorkingCanvas && clickedObject?.id !== activeObjectId
          setActiveObjectId(shouldClearSelection ? null : clickedObject?.id || null)
          if (clickedObject) {
            setUserMode('select')
            setActionMode({ type: 'isMoving' })
          } else {
            setActionMode({ type: 'isPanning' })
          }
        }
        drawEverything()
        break
      }
      case 'free-draw': {
        appendFreeDrawObject({
          id: createdObjectId,
          x: initialDrawingPositionRef.current.x,
          y: initialDrawingPositionRef.current.y,
          width: 0,
          height: 0,
          strokeColorHex: defaultParams.strokeColorHex,
          strokeWidth: 1,
          opacity: 100,
          freeDrawPoints: [
            {
              x: initialDrawingPositionRef.current.x,
              y: initialDrawingPositionRef.current.y,
            },
          ],
        })
        setActiveObjectId(createdObjectId)
        setActionMode({ type: 'isDrawing' })
        break
      }
      case 'rectangle': {
        appendRectangleObject({
          id: createdObjectId,
          x: initialDrawingPositionRef.current.x,
          y: initialDrawingPositionRef.current.y,
          width: 0,
          height: 0,
          backgroundColorHex: defaultParams.backgroundColorHex,
          strokeColorHex: defaultParams.strokeColorHex,
          strokeWidth: 0,
          opacity: 100,
          borderRadius: 0,
        })
        setActiveObjectId(createdObjectId)
        setActionMode({ type: 'isDrawing' })
        break
      }
      case 'ellipse': {
        appendEllipseObject({
          id: createdObjectId,
          x: initialDrawingPositionRef.current.x,
          y: initialDrawingPositionRef.current.y,
          width: 0,
          height: 0,
          backgroundColorHex: defaultParams.backgroundColorHex,
          strokeColorHex: defaultParams.strokeColorHex,
          strokeWidth: 0,
          opacity: 100,
          borderRadius: 0,
        })
        setActiveObjectId(createdObjectId)
        setActionMode({ type: 'isDrawing' })
        break
      }
      case 'text': {
        appendTextObject({
          id: createdObjectId,
          x: initialDrawingPositionRef.current.x,
          y: initialDrawingPositionRef.current.y,
          width: 200,
          height: 100,
          text: 'Add text',
          textAlignHorizontal: 'center',
          textAlignVertical: 'middle',
          textJustify: false,
          fontColorHex: defaultParams.fontColorHex,
          fontSize: 44,
          fontFamily: 'sans-serif',
          fontStyle: 'normal',
          fontWeight: 'normal',
          fontVariant: 'normal',
          fontLineHeightRatio: 1,
          opacity: 100,
        })
        setActiveObjectId(createdObjectId)
        setUserMode('select')
        setActionMode(null)
        break
      }
      case 'attribute': {
        appendAttributeObject({
          id: createdObjectId,
          x: initialDrawingPositionRef.current.x,
          y: initialDrawingPositionRef.current.y,
          width: 200,
          height: 100,
          text: 'Attribute Text',
          fontColorHex: defaultParams.fontColorHex,
          fontSize: 44,
          fontFamily: 'sans-serif',
          fontStyle: 'normal',
          fontWeight: 'normal',
          fontVariant: 'normal',
          fontLineHeightRatio: 1,
          opacity: 100,
        })
        setActiveObjectId(createdObjectId)
        setUserMode('select')
        setActionMode(null)
        break
      }
      default:
        break
    }
  }

  // On pointer move
  const onPointerMove = (event: PointerOrTouchEvent) => {
    event.preventDefault()
    const canvas = canvasRef.current
    const context = contextRef.current
    if (!canvas || !context || !actionMode) return

    const clientX = 'clientX' in event ? event.clientX : event.touches[0]?.clientX
    const clientY = 'clientY' in event ? event.clientY : event.touches[0]?.clientY

    const finger0PageX = 'touches' in event ? event.touches[0]?.pageX : null
    const finger0PageY = 'touches' in event ? event.touches[0]?.pageY : null

    const finger1PageX = 'touches' in event ? event.touches[1]?.pageX : null
    const finger1PageY = 'touches' in event ? event.touches[1]?.pageY : null

    if (
      finger0PageX !== null &&
      finger0PageY !== null &&
      finger1PageX !== null &&
      finger1PageY !== null
    ) {
      const distanceBetweenTouches = Math.hypot(
        finger0PageX - finger1PageX,
        finger0PageY - finger1PageY,
      )

      if (distanceBetweenTouchesRef.current) {
        if (distanceBetweenTouches > distanceBetweenTouchesRef.current) {
          incrementZoom(1)
        } else if (distanceBetweenTouches < distanceBetweenTouchesRef.current) {
          decrementZoom(1)
        }
      }

      distanceBetweenTouchesRef.current = distanceBetweenTouches
    }

    const movementX =
      'movementX' in event
        ? event.movementX
        : previousTouchRef.current?.pageX
          ? event.touches[0].pageX - previousTouchRef.current.pageX
          : 0

    const movementY =
      'movementY' in event
        ? event.movementY
        : previousTouchRef.current?.pageY
          ? event.touches[0].pageY - previousTouchRef.current.pageY
          : 0

    if ('touches' in event) {
      previousTouchRef.current = event.touches[0]
    }

    const relativeMousePosition = getRelativeMousePositionOnCanvas({
      windowMouseX: clientX,
      windowMouseY: clientY,
      canvasWorkingSize,
      scrollPosition,
      zoom,
    })

    const finalX = relativeMousePosition.relativeMouseX
    const finalY = relativeMousePosition.relativeMouseY

    switch (userMode) {
      case 'select': {
        if (activeObjectId && actionMode.type === 'isMoving') {
          moveCanvasObject({
            id: activeObjectId,
            deltaPosition: {
              deltaX: movementX / (zoom / 100),
              deltaY: movementY / (zoom / 100),
            },
            canvasWorkingSize,
          })
        } else if (activeObjectId && actionMode.type === 'isResizing' && actionMode.option) {
          resizeCanvasObject({
            id: activeObjectId,
            actionModeOption: actionMode.option,
            delta: {
              deltaX: movementX / (zoom / 100),
              deltaY: movementY / (zoom / 100),
            },
            canvasWorkingSize,
          })
        } else if (actionMode.type === 'isPanning') {
          updateScrollPosition({
            deltaX: movementX,
            deltaY: movementY,
          })
        }
        break
      }
      case 'free-draw': {
        if (activeObjectId) {
          appendFreeDrawPointToCanvasObject(activeObjectId, {
            x: finalX,
            y: finalY,
          })
        }
        break
      }
      case 'rectangle':
      case 'ellipse': {
        if (activeObjectId) {
          const topLeftX = Math.min(initialDrawingPositionRef.current.x, finalX)
          const topLeftY = Math.min(initialDrawingPositionRef.current.y, finalY)

          const width = Math.abs(initialDrawingPositionRef.current.x - finalX)
          const height = Math.abs(initialDrawingPositionRef.current.y - finalY)

          updateCanvasObject(activeObjectId, {
            x: topLeftX,
            y: topLeftY,
            width,
            height,
          })
        }
        break
      }
      default: {
        break
      }
    }
  }

  // On pointer up
  const onPointerUp = (event: PointerOrTouchEvent) => {
    event.preventDefault()
    setActionMode(null)
    const canvas = canvasRef.current
    const context = contextRef.current
    if (!canvas || !context) return

    previousTouchRef.current = null
    if ('touches' in event) {
      distanceBetweenTouchesRef.current = 0
    }

    switch (userMode) {
      case 'select': {
        break
      }
      case 'text': {
        break
      }
      case 'free-draw': {
        context.closePath()
        if (activeObject) {
          const dimensions = getDimensionsFromFreeDraw({
            freeDrawObject: activeObject,
          })
          updateCanvasObject(activeObject.id, {
            width: dimensions.width,
            height: dimensions.height,
          })
        }
        setUserMode('select')
        drawEverything()
        break
      }
      case 'rectangle':
      case 'ellipse': {
        setUserMode('select')
        drawEverything()
        break
      }
      default: {
        break
      }
    }
  }

  //   await commonPushImageObject(imageUrl);

  //   const idCertificateName = generateUniqueId();
  //   const certificateName = 'Juan Felipe Mosquera Lasso';
  //   appendTextObject({
  //     id: idCertificateName,
  //     x: 356,
  //     y: 339,
  //     width: 1211,
  //     height: 100,
  //     text: certificateName,
  //     textAlignHorizontal: 'center',
  //     textAlignVertical: 'middle',
  //     textJustify: false,
  //     fontColorHex: '#000000',
  //     fontSize: 44,
  //     fontFamily: 'sans-serif',
  //     fontStyle: 'normal',
  //     fontWeight: 'normal',
  //     fontVariant: 'normal',
  //     fontLineHeightRatio: 1,
  //     opacity: 100,
  //   });

  //   const idCertificateNumber = generateUniqueId();
  //   const certificateNumber = '1003815193';
  //   appendTextObject({
  //     id: idCertificateNumber,
  //     x: 669,
  //     y: 471,
  //     width: 582,
  //     height: 100,
  //     text: certificateNumber,
  //     textAlignHorizontal: 'center',
  //     textAlignVertical: 'middle',
  //     textJustify: false,
  //     fontColorHex: '#000000',
  //     fontSize: 35,
  //     fontFamily: 'sans-serif',
  //     fontStyle: 'normal',
  //     fontWeight: 'normal',
  //     fontVariant: 'normal',
  //     fontLineHeightRatio: 1,
  //     opacity: 100,
  //   });
  // };

  const handleSave = async () => {
    const elementsToSave = canvasObjects.map((object) => ({
      ...object,
    }))

    try {
      if (certificateId) {
        await updateCertificate(certificateId, elementsToSave)
      } else {
        const dataCertificate = {
          eventId: eventId,
          elements: elementsToSave,
          size: canvasWorkingSize,
        }
        await createCertificate(dataCertificate)
      }
    } catch (error) {
      throw new Error(String(error))
    }
  }

  return (
    <main
      id={APP_FIXED_MAIN_UNIQUE_ID}
      style={{
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        height: '100%',
        zIndex: theme.layers.canvasApp,
        userSelect: 'none',
        cursor: getCursorFromModes({ userMode, actionMode }),
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onTouchStart={onPointerDown}
      onTouchMove={onPointerMove}
      onTouchEnd={onPointerUp}
    >
      <canvas
        id={CANVAS_CONTROLS_OVERLAY}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${windowSize.width}px`,
          height: `${windowSize.height}px`,
          zIndex: theme.layers.canvasElement + 1,
        }}
        width={windowSize.width}
        height={windowSize.height}
      />
      <Group justify="start" m="md" style={{ position: 'fixed', bottom: '0', zIndex: 9999 }}>
        <Button name="Save" value="" onClick={() => handleSave()}>
          Guardar
        </Button>
      </Group>
      <div
        style={{
          position: 'absolute',
          top: scrollPosition.y,
          left: scrollPosition.x,
          width: `${canvasWorkingSize.width}px`,
          height: `${canvasWorkingSize.height}px`,
          transform: `scale(${zoom / 100})`,
          zIndex: theme.layers.canvasElement,
          backgroundImage: `url(${TRANSPARENT_BACKGROUND_IMAGE})`,
          backgroundColor: 'gray',
          border: '1px solid black',
        }}
      >
        <h1
          style={{
            position: 'absolute',
            top: `${-38 / (zoom / 120)}px`,
            left: '0',
            width: `${Number.MAX_SAFE_INTEGER}px`,
            color: 'white',
            fontSize: `${20 / (zoom / 100)}px`,
          }}
        >
          {`${canvasWorkingSize.width} x ${canvasWorkingSize.height} px`}
        </h1>
        <canvas ref={canvasRef} width={canvasWorkingSize.width} height={canvasWorkingSize.height} />
      </div>
    </main>
  )
}
