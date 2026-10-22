import { useCallback, useEffect, useState } from 'react'

import { type EventSummary } from '@/features/certificates/types'
import { fetchOrganizationEvents } from '@/services/api/certificateAdminService'

export function useOrganizationEvents(organizationId?: string) {
  const [events, setEvents] = useState<EventSummary[] | null>(null)
  const [error, setError] = useState(false)

  const reload = useCallback(() => {
    if (!organizationId) return
    setError(false)
    fetchOrganizationEvents(organizationId)
      .then(setEvents)
      .catch(() => {
        setEvents([])
        setError(true)
      })
  }, [organizationId])

  useEffect(() => {
    setEvents(null)
    reload()
  }, [reload])

  return { events, error, reload }
}

export const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—'
