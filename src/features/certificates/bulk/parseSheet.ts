import * as XLSX from 'xlsx'

import { MEMBER_FIELDS, normalizeHeader } from '../fields'
import { type AttendeeRow, type CertificateField } from '../types'

// Encabezados que se reconocen para los datos base del miembro
const MEMBER_ALIASES: Record<string, string[]> = {
  fullName: [
    'nombrecompleto',
    'nombre',
    'nombres',
    'nombreyapellido',
    'nombresyapellidos',
    'fullname',
    'name',
  ],
  idNumber: [
    'numerodeidentificacion',
    'numeroidentificacion',
    'identificacion',
    'documento',
    'numerodedocumento',
    'numerodocumento',
    'nodocumento',
    'cedula',
    'cc',
    'idnumber',
  ],
  email: ['correo', 'correoelectronico', 'email', 'mail', 'emailaddress'],
  phone: ['celular', 'telefono', 'movil', 'whatsapp', 'phone', 'numerodecelular', 'numerocelular'],
}

export interface ParsedSheet {
  rows: AttendeeRow[]
  // encabezado del archivo -> clave del campo
  mapping: Record<string, string | null>
  missingRequired: string[]
  totalRows: number
}

const cellToString = (value: unknown) => {
  if (value === undefined || value === null) return ''
  if (value instanceof Date) return value.toLocaleDateString('es-CO')
  return String(value).trim()
}

export async function parseAttendeesFile(
  file: File,
  fields: CertificateField[],
): Promise<ParsedSheet> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: false })
  const headers = raw.length ? Object.keys(raw[0]) : []

  const mapping: Record<string, string | null> = {}
  for (const header of headers) {
    const normalized = normalizeHeader(header)
    const memberKey = Object.entries(MEMBER_ALIASES).find(([, aliases]) =>
      aliases.includes(normalized),
    )?.[0]
    const field = fields.find(
      (f) => normalizeHeader(f.label) === normalized || normalizeHeader(f.key) === normalized,
    )
    mapping[header] = memberKey ?? field?.key ?? null
  }

  const mappedKeys = Object.values(mapping)
  const missingRequired = MEMBER_FIELDS.filter(
    (f) => ['fullName', 'email', 'idNumber'].includes(f.key) && !mappedKeys.includes(f.key),
  ).map((f) => f.label)

  const rows: AttendeeRow[] = []
  raw.forEach((record, index) => {
    const row: AttendeeRow = { row: index + 2, attributes: {} }
    for (const [header, key] of Object.entries(mapping)) {
      if (!key) continue
      const value = cellToString(record[header])
      if (key in MEMBER_ALIASES) {
        ;(row as Record<string, unknown>)[key] = value
      } else {
        row.attributes![key] = value
      }
    }
    // Filas vacías del Excel
    const hasData = [row.fullName, row.email, row.idNumber].some((v) => v && String(v).trim())
    if (hasData) rows.push(row)
  })

  return { rows, mapping, missingRequired, totalRows: rows.length }
}

export function downloadTemplate(fields: CertificateField[], eventName: string) {
  const headers = [...MEMBER_FIELDS.map((f) => f.label), ...fields.map((f) => f.label)]
  const example = [
    'María Fernanda Gómez',
    '1234567890',
    'maria.gomez@correo.com',
    '3001234567',
    ...fields.map((f) =>
      f.key === 'certificationHours' ? '20' : f.key === 'typeAttendee' ? 'Asistente' : '',
    ),
  ]
  const sheet = XLSX.utils.aoa_to_sheet([headers, example])
  sheet['!cols'] = headers.map((h) => ({ wch: Math.max(h.length + 4, 18) }))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Asistentes')
  XLSX.writeFile(workbook, `Plantilla asistentes - ${eventName}.xlsx`.replace(/[\\/:*?"<>|]/g, ''))
}
