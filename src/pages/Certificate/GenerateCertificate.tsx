import { FC, useCallback, useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'

import { Button } from '@mantine/core'
import { IconDownload } from '@tabler/icons-react'
import jsPDF from 'jspdf'

import CanvasPreview from '@/components/CanvasPreview'
import { CANVAS_PREVIEW_UNIQUE_ID } from '@/config/globalElementIds'
import { CanvasObject } from '@/config/types'
import { searchAttendees } from '@/services/api/attendeeService'
import { searchCertificates } from '@/services/api/certificateService'
import useCanvasObjects from '@/store/useCanvasObjects'
import generateUniqueId from '@/utils/generateUniqueId'
import getImageElementFromUrl from '@/utils/getImageElementFromUrl'
import notification from '@/utils/notification'

interface Attendee {
  _id: string
  eventId: {
    _id: string
    name?: string
  }
  organization?: string
  certificationHours?: number
  typeAttendee?: string
  memberId: {
    properties: Record<string, unknown>
  }
}

const GenerateCertificate: FC = (): JSX.Element => {
  const [attendee, setAttendee] = useState<Attendee | null>(null)
  const [certificateElements, setCertificateElements] = useState<CanvasObject[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const params = useParams()
  const { attendeeId, certificateId } = params

  // Este eventId podría venir de la ruta, de la ubicación actual, etc.
  // Por ejemplo:
  const location = useLocation()
  const { eventId: eventIdFromLocation } = location.state || {}

  // --------------------------------------------------------
  //   1) Determinar si certificateId es un evento o un certificado
  // --------------------------------------------------------
  const fetchAllData = async () => {
    if (!attendeeId || !certificateId) {
      return
    }

    setLoading(true)
    try {
      let finalEventId: string | null = eventIdFromLocation || null

      // Paso A: si no tenemos un eventId explícito, intentamos
      //         ver si certificateId corresponde a un "Certificate"
      if (!finalEventId) {
        const certificateRes = await searchCertificates({ _id: certificateId })
        if (certificateRes?.data?.length) {
          // Si existe un certificado con ese ID, tomamos su eventId
          finalEventId = certificateRes.data[0].eventId._id
        } else {
          // Si no existe, asumimos que certificateId es el eventId
          finalEventId = certificateId
        }
      }

      // Si por alguna razón seguimos sin eventId, mostramos mensaje y salimos
      if (!finalEventId) {
        notification.error({ message: 'No se pudo determinar el eventId' })
        return
      }

      // --------------------------------------------------------
      //   2) Buscar al asistente que cumpla con attended = true
      //      y coincida con el eventId final
      // --------------------------------------------------------
      let resultAttendee

      // Filtro principal para userId (o memberId) + eventId + attended
      const filtersByUserId = { userId: attendeeId, eventId: finalEventId, attended: true }
      resultAttendee = await searchAttendees(filtersByUserId)

      // Si no se encontró por userId, intentamos por memberId
      if (!resultAttendee || resultAttendee.message === 'No se encontraron asistentes') {
        const filtersByMemberId = { memberId: attendeeId, eventId: finalEventId, attended: true }
        resultAttendee = await searchAttendees(filtersByMemberId)
      }

      // Si no hay resultados, notificamos
      if (!resultAttendee || resultAttendee.message === 'No se encontraron asistentes') {
        notification.success({ message: 'No se encontró el usuario en este evento' })
        return
      }

      // Revisamos a los asistentes que devuelva
      const allAttendees = resultAttendee.data.items || []

      // Filtramos aquellos que coincidan con finalEventId
      const matchingAttendees = allAttendees.filter(
        (item: Attendee) => item.eventId._id === finalEventId,
      )

      if (matchingAttendees.length === 0) {
        notification.success({ message: 'No se encontró el usuario en este evento' })
        return
      }

      const foundAttendee = matchingAttendees[0]

      // Actualizamos los datos del asistente
      const updatedAttendeeData = {
        ...foundAttendee,
        memberId: {
          ...foundAttendee.memberId,
          properties: {
            ...foundAttendee.memberId.properties,
            certificationHours: foundAttendee.certificationHours,
            typeAttendee: foundAttendee.typeAttendee,
          },
        },
      }
      setAttendee(updatedAttendeeData)

      // --------------------------------------------------------
      //   3) Cargar el certificado (o certificados) del evento
      // --------------------------------------------------------
      const filtersByEventId = { eventId: updatedAttendeeData.eventId._id }
      const certificateData = await searchCertificates(filtersByEventId)
      setCertificateElements(certificateData.data[0]?.elements || [])
    } catch (error) {
      notification.error({ message: 'Error al obtener los datos' })
    } finally {
      setLoading(false)
    }
  }

  // Se dispara cada vez que cambien los params o location.state
  useEffect(() => {
    fetchAllData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attendeeId, certificateId, eventIdFromLocation])

  // -------------------------------------------
  // Lógica para renderizar en el canvas + descargar
  // -------------------------------------------
  const appendTextObject = useCanvasObjects((state) => state.appendTextObject)
  const appendAttributeObject = useCanvasObjects((state) => state.appendAttributeObject)
  const appendImageObject = useCanvasObjects((state) => state.appendImageObject)

  const pushImageObject = useCallback(
    async ({
      imageUrl,
      imageElement,
      element,
    }: {
      imageUrl: string
      imageElement: HTMLImageElement
      element: CanvasObject
    }) => {
      appendImageObject({
        id: element.id,
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        opacity: 100,
        imageUrl,
        imageElement,
      })
    },
    [appendImageObject],
  )

  const commonPushImageObject = useCallback(
    async (element: CanvasObject, url: string) => {
      const imageElement = await getImageElementFromUrl(url)
      await pushImageObject({ imageUrl: url, imageElement, element })
    },
    [pushImageObject],
  )

  const handleRenderCertificate = useCallback(async () => {
    for (const element of certificateElements) {
      switch (element.type) {
        case 'text':
          appendTextObject({ ...element })
          break
        case 'attribute':
          element.text = String(attendee?.memberId?.properties[element.text || ''] ?? '')
          appendAttributeObject({ ...element })
          break
        case 'image':
          if (element.imageUrl) {
            await commonPushImageObject(element, element.imageUrl)
          }
          break
        default:
          break
      }
    }
  }, [
    attendee,
    certificateElements,
    appendTextObject,
    appendAttributeObject,
    commonPushImageObject,
  ])

  useEffect(() => {
    if (certificateElements.length > 0 && attendeeId && certificateId) {
      handleRenderCertificate()
    }
  }, [certificateElements, attendeeId, certificateId, handleRenderCertificate])

  const downloadCanvas = (type: 'png' | 'jpg' | 'pdf') => {
    const canvas = document.getElementById(CANVAS_PREVIEW_UNIQUE_ID) as HTMLCanvasElement
    const image = canvas.toDataURL(`image/${type}`)

    if (type === 'pdf') {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height],
      })
      pdf.addImage(image, 'JPEG', 0, 0, canvas.width, canvas.height)
      pdf.save(`${generateUniqueId()}.pdf`)
    } else {
      const link = document.createElement('a')
      link.download = `${generateUniqueId()}.${type}`
      link.href = image
      link.click()
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        textAlign: 'center',
      }}
    >
      <h1 style={{ color: 'white', marginTop: '50px' }}>Descarga tu certificado</h1>
      <div
        style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBlock: '1rem' }}
      >
        {['png', 'jpg', 'pdf'].map((format) => (
          <Button
            key={format}
            size="xs"
            variant="default"
            onClick={() => downloadCanvas(format as 'png' | 'jpg' | 'pdf')}
            leftSection={<IconDownload />}
          >
            {format.toUpperCase()}
          </Button>
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          maxWidth: '80%',
          margin: '0 auto',
          paddingBottom: '15px',
          border: '1px solid rgb(55 55 55 / 20%)',
        }}
      >
        {!loading && <CanvasPreview />}
      </div>
    </div>
  )
}

export { GenerateCertificate }
