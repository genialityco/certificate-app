import { Anchor, Tooltip } from '@mantine/core'

// Formatos de visualización del admin (no cambian los datos guardados)

export const EVENTS_ADMIN_URL = 'https://admingeneventos.netlify.app'

export const formatEventName = (name?: string | null) =>
  String(name ?? '')
    .trim()
    .toLocaleUpperCase('es')

// "Pedro Merchan" -> "Dr(a). Pedro Merchan"; sin nombre -> "-"
export const formatPersonName = (name?: string | null) => {
  const value = String(name ?? '').trim()
  if (!value) return '-'
  if (/^(dr|dra|dr\(a\))\.?\s/i.test(value)) return value
  return `Dr(a). ${value}`
}

export const eventAdminUrl = (eventId: string) => `${EVENTS_ADMIN_URL}/events/show/${eventId}`

// Nombre del evento en mayúsculas que abre el evento en el admin de eventos
export function EventNameLink({
  eventId,
  name,
  fw = 600,
  size,
}: {
  eventId?: string
  name?: string | null
  fw?: number
  size?: string
}) {
  const label = formatEventName(name) || 'EVENTO ELIMINADO'
  if (!eventId) return <span>{label}</span>
  return (
    <Tooltip label="Abrir en el admin de eventos" openDelay={300}>
      <Anchor
        href={eventAdminUrl(eventId)}
        target="_blank"
        rel="noopener noreferrer"
        fw={fw}
        size={size}
        c="inherit"
        underline="hover"
      >
        {label}
      </Anchor>
    </Tooltip>
  )
}
