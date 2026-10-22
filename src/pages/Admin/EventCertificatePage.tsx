import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Alert, Anchor, Breadcrumbs, Group, Loader } from '@mantine/core'

import { CertificateEditor } from '@/features/certificates/editor/CertificateEditor'
import { fetchEventOverview } from '@/services/api/certificateAdminService'

type Overview = Awaited<ReturnType<typeof fetchEventOverview>>

export function EventCertificatePage() {
  const { organizationId, eventId } = useParams()
  const [overview, setOverview] = useState<Overview | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!eventId) return
    fetchEventOverview(eventId)
      .then(setOverview)
      .catch(() => setError(true))
  }, [eventId])

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Group px="md" py={8} bg="#fff" style={{ borderBottom: '1px solid #e5e7eb' }}>
        <Breadcrumbs>
          <Anchor component={Link} to={`/admin/org/${organizationId}/events`} size="sm" c="brand.7">
            Eventos
          </Anchor>
          <Anchor size="sm" c="dimmed">
            Diseño del certificado
          </Anchor>
          <Anchor
            component={Link}
            to={`/admin/org/${organizationId}/events/${eventId}/attendees`}
            size="sm"
            c="brand.7"
          >
            Asistentes
          </Anchor>
        </Breadcrumbs>
      </Group>
      {error && (
        <Alert color="red" m="md">
          No se pudo cargar el evento
        </Alert>
      )}
      {!overview && !error && (
        <Group justify="center" p="xl">
          <Loader color="brand" />
        </Group>
      )}
      {overview && eventId && (
        <div style={{ flex: 1, minHeight: 0 }}>
          <CertificateEditor
            eventId={eventId}
            eventName={overview.event.name}
            certificate={overview.certificate}
          />
        </div>
      )}
    </div>
  )
}
