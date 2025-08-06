import { useEffect, useRef, useState } from 'react'

import { TRANSPARENT_BACKGROUND_IMAGE } from '@/config/constants'
import { CANVAS_PREVIEW_UNIQUE_ID } from '@/config/globalElementIds'
import canvasDrawEverything from '@/context/useCanvasContext/utils/canvasDrawEverything'
import canvasInit from '@/context/useCanvasContext/utils/canvasInit'
import useColorSchemeContext from '@/context/useColorSchemeContext'
import useActionMode from '@/store/useActionMode'
import useActiveObjectId from '@/store/useActiveObjectId'
import useCanvasBackgroundColor from '@/store/useCanvasBackgroundColor'
import useCanvasObjects from '@/store/useCanvasObjects'
// Eliminamos la importación de useCanvasWorkingSize ya que ahora las dimensiones vienen por props
// import useCanvasWorkingSize from '@/store/useCanvasWorkingSize'
import useScrollPosition from '@/store/useScrollPosition'
import useWindowSize from '@/store/useWindowSize'

// Definimos los tipos para las props que recibirá CanvasPreview
type CanvasPreviewProps = {
  width: number
  height: number
}

// El componente ahora acepta 'width' y 'height' como props
export default function CanvasPreview({ width, height }: CanvasPreviewProps) {
  const [canvasImageSrc, setCanvasImageSrc] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)

  const { colorScheme } = useColorSchemeContext()

  const activeObjectId = useActiveObjectId((state) => state.activeObjectId)

  const windowSize = useWindowSize((state) => state.windowSize)

  const scrollPosition = useScrollPosition((state) => state.scrollPosition)

  const canvasObjects = useCanvasObjects((state) => state.canvasObjects)

  // Ya no necesitamos esta línea, las dimensiones vienen por props
  // const canvasWorkingSize = useCanvasWorkingSize((state) => state.canvasWorkingSize)

  const actionMode = useActionMode((state) => state.actionMode)

  const canvasBackgroundColor = useCanvasBackgroundColor((state) => state.canvasBackgroundColor)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return
    contextRef.current = context

    // Usamos las props 'width' y 'height' para inicializar el canvas
    canvasInit({
      canvas,
      context,
      canvasWidth: width, // Usamos la prop width
      canvasHeight: height, // Usamos la prop height
    })

    canvasDrawEverything({
      canvas,
      context,
      // Creamos un objeto canvasWorkingSize a partir de las props para mantener la compatibilidad con la función
      canvasWorkingSize: { width, height },
      canvasBackgroundColor,
      canvasObjects,
      activeObjectId,
      actionMode,
      zoom: 100, // En el preview, el zoom es fijo a 100%
      scrollPosition,
      windowSize,
    })

    setCanvasImageSrc(canvas.toDataURL())
  }, [
    // Agregamos 'width' y 'height' a las dependencias para que el efecto se re-ejecute si cambian
    width,
    height,
    actionMode,
    activeObjectId,
    canvasObjects,
    canvasBackgroundColor,
    colorScheme,
    scrollPosition,
    windowSize,
  ])

  return (
    <>
      {canvasImageSrc && (
        <img
          style={{
            width: 'auto',
            maxWidth: '100%',
            border: '1px solid var(--color-borderPrimary)',
            backgroundImage: `url(${TRANSPARENT_BACKGROUND_IMAGE})`,
            backgroundColor: 'white',
          }}
          src={canvasImageSrc}
          alt="Download preview"
        />
      )}
      {/* El canvas oculto también debe recibir los atributos width y height de las props */}
      <canvas
        style={{ display: 'none' }}
        id={CANVAS_PREVIEW_UNIQUE_ID}
        ref={canvasRef}
        width={width} // Atributo width del canvas
        height={height} // Atributo height del canvas
      ></canvas>
    </>
  )
}
