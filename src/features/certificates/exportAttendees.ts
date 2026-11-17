import * as XLSX from 'xlsx'

import { formatPersonName } from '@/features/admin/format'
import { fetchEventAttendees } from '@/services/api/certificateAdminService'

import { MEMBER_FIELDS } from './fields'
import { type CertificateField, type EventAttendee } from './types'

// El backend limita listEventAttendees a 200 por página
const PAGE_SIZE = 200

const attributeOf = (attendee: EventAttendee, key: string) => {
  if (key === 'typeAttendee') return attendee.typeAttendee
  if (key === 'certificationHours') return attendee.certificationHours
  return attendee.properties?.[key]
}

const fetchAllAttendees = async (eventId: string, q: string) => {
  const items: EventAttendee[] = []
  let page = 1
  let totalPages = 1
  do {
    const result = await fetchEventAttendees(eventId, { q, page, limit: PAGE_SIZE })
    items.push(...result.items)
    totalPages = result.totalPages
    page += 1
  } while (page <= totalPages)
  return items
}

/** Descarga en .xlsx los asistentes del evento (los que coinciden con `q` si hay búsqueda). */
export const exportEventAttendees = async (
  eventId: string,
  eventName: string,
  fields: CertificateField[],
  q = '',
) => {
  const attendees = await fetchAllAttendees(eventId, q)
  const memberKeys = new Set(MEMBER_FIELDS.map((f) => f.key))
  const eventFields = fields.filter((f) => !memberKeys.has(f.key))

  const headers = [
    ...MEMBER_FIELDS.map((f) => f.label),
    ...eventFields.map((f) => f.label),
    'Asistió',
    'Descargas',
  ]
  const rows = attendees.map((attendee) => [
    ...MEMBER_FIELDS.map((f) =>
      f.key === 'fullName'
        ? formatPersonName(attendee.member?.properties?.fullName)
        : attendee.member?.properties?.[f.key] ?? '',
    ),
    ...eventFields.map((f) => attributeOf(attendee, f.key) ?? ''),
    attendee.attended ? 'Sí' : 'No',
    attendee.certificateDownloads ?? 0,
  ])

  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
  sheet['!cols'] = headers.map((h) => ({ wch: Math.max(h.length + 2, 18) }))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Asistentes')
  XLSX.writeFile(workbook, `Asistentes - ${eventName || eventId}.xlsx`.replace(/[\\/:*?"<>|]/g, ''))
  return attendees.length
}
