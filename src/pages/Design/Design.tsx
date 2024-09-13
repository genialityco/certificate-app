import { useEffect } from 'react'
import { useParams } from 'react-router-dom'

import { useMantineColorScheme } from '@mantine/core'

import Canvas from '@/components/Canvas'
import CanvasEventListeners from '@/components/CanvasEventListeners'
import Overlay from '@/components/Overlay/Overlay'
import useCanvasObjects from '@/store/useCanvasObjects'

const Design: React.FC = () => {
  const { eventId } = useParams()
  const { setColorScheme } = useMantineColorScheme()

  const resetCanvasObjects = useCanvasObjects((state) => state.resetCanvasObjects)

  useEffect(() => {
    const html = document.querySelector('html')
    if (html) {
      html.style.overflow = 'hidden'
    }
    setColorScheme('dark')

    return () => {
      setColorScheme('light')
      resetCanvasObjects()
      if (html) {
        html.style.overflow = 'auto'
      }
    }
  }, [resetCanvasObjects, setColorScheme])

  return (
    <>
      <Overlay eventId={eventId ? String(eventId) : ''} />
      <Canvas eventId={eventId ? String(eventId) : ''} />
      <CanvasEventListeners />
    </>
  )
}

export { Design }
