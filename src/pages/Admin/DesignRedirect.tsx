import { useEffect, useState } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'

import { Alert, Center, Loader } from '@mantine/core'

import { fetchEventOverview } from '@/services/api/certificateAdminService'

// Enlaces antiguos /design/:eventId?organizationId=... al editor nuevo
export function DesignRedirect() {
  const { eventId } = useParams()
  const [searchParams] = useSearchParams()
  const [organizationId, setOrganizationId] = useState(searchParams.get('organizationId'))
  const [error, setError] = useState(false)

  useEffect(() => {
    if (organizationId || !eventId) return
    fetchEventOverview(eventId)
      .then(({ event }) => setOrganizationId(String(event.organizationId)))
      .catch(() => setError(true))
  }, [eventId, organizationId])

  if (organizationId) {
    return <Navigate to={`/admin/org/${organizationId}/events/${eventId}/certificate`} replace />
  }
  return (
    <Center h="100vh" w="100vw">
      {error ? <Alert color="red">No se encontró el evento</Alert> : <Loader color="brand" />}
    </Center>
  )
}
