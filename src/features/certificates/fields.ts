import { type CertificateElement, type CertificateField } from './types'

// Datos que siempre tiene un miembro (member.properties)
export const MEMBER_FIELDS: CertificateField[] = [
  { key: 'fullName', label: 'Nombre completo' },
  { key: 'idNumber', label: 'Número de identificación' },
  { key: 'email', label: 'Correo' },
  { key: 'phone', label: 'Celular' },
]

// Datos del evento disponibles para cualquier certificado
export const EVENT_FIELDS: CertificateField[] = [{ key: 'eventName', label: 'Nombre del evento' }]

// Sugerencias para los atributos del asistente en un certificado nuevo
export const DEFAULT_ATTENDEE_FIELDS: CertificateField[] = [
  { key: 'typeAttendee', label: 'Tipo de asistente' },
  { key: 'certificationHours', label: 'Horas certificadas' },
]

export const allFields = (attendeeFields: CertificateField[]) => [
  ...MEMBER_FIELDS,
  ...EVENT_FIELDS,
  ...attendeeFields,
]

const stripAccents = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '')

// "Horas certificadas" -> "horasCertificadas"
export const labelToKey = (label: string) => {
  const words = stripAccents(label)
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  return words
    .map((word, index) =>
      index === 0 ? word.toLowerCase() : word[0].toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join('')
}

export const normalizeHeader = (value: string) =>
  stripAccents(String(value ?? ''))
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

// Texto final de un elemento con los datos de una persona
export const resolveElementText = (
  element: CertificateElement,
  values: Record<string, string>,
): string => {
  if (element.type === 'text') return element.text ?? ''
  if (element.type !== 'attribute') return ''
  const key = element.text ?? ''
  const value = values[key]
  if (value !== undefined && value !== null) return String(value)
  // Certificados antiguos guardaban el nombre del evento literal
  if (values.eventName && key === values.eventName) return values.eventName
  return ''
}

export const fieldLabel = (key: string, attendeeFields: CertificateField[]) =>
  allFields(attendeeFields).find((field) => field.key === key)?.label ?? key
