// Los elementos se guardan con el mismo formato que usaba el editor anterior
// (CanvasObject) para que los certificados existentes sigan funcionando.
export type CertificateElementType = 'text' | 'attribute' | 'image' | 'rectangle'

export interface CertificateElement {
  id: string
  type: CertificateElementType
  x: number
  y: number
  width: number
  height: number
  opacity: number
  // 2 = creado con el editor nuevo
  version?: number
  // text / attribute: en attribute, `text` es la clave del campo
  text?: string
  textJustify?: boolean
  textAlignHorizontal?: 'left' | 'center' | 'right'
  textAlignVertical?: 'top' | 'middle' | 'bottom'
  fontColorHex?: string
  fontSize?: number
  fontFamily?: string
  fontStyle?: 'normal' | 'italic' | 'oblique'
  fontVariant?: 'normal' | 'small-caps'
  fontWeight?: string
  fontLineHeightRatio?: number
  // image
  imageUrl?: string
  isBackground?: boolean
  // rectangle
  backgroundColorHex?: string
  strokeColorHex?: string
  strokeWidth?: number
  borderRadius?: number
}

export interface CertificateField {
  key: string
  label: string
}

export interface CertificateDoc {
  _id: string
  eventId: string
  elements: CertificateElement[]
  size?: { width: number; height: number }
  fields?: CertificateField[]
  updatedAt?: string
}

export interface EventSummary {
  _id: string
  name: string
  startDate?: string
  endDate?: string
  styles?: { eventImage?: string; miniatureImage?: string }
  certificateId?: string
  certificateUpdatedAt?: string
  attendees: number
  downloads: number
  downloaders: number
}

export interface MemberDoc {
  _id: string
  userId?: string
  organizationId: string
  memberActive?: boolean
  properties: Record<string, string>
  createdAt?: string
  certificatesCount?: number
}

export interface EventAttendee {
  _id: string
  eventId: string
  memberId: string
  userId?: string
  attended: boolean
  typeAttendee?: string
  certificationHours?: string
  certificateDownloads?: number
  properties?: Record<string, string>
  member?: MemberDoc
  certificateEmail?: CertificateEmailStatus
}

export interface CertificateEmailStatus {
  status?: 'sent' | 'failed'
  sentAt?: string
  attachmentSentAt?: string
  failedAt?: string
  to?: string
  error?: string
  count?: number
}

export interface MemberCertificate {
  _id: string
  eventId: string
  memberId: string
  attended: boolean
  typeAttendee?: string
  certificationHours?: string
  properties?: Record<string, string>
  certificateDownloads: number
  hasCertificate: boolean
  event?: { _id: string; name: string; startDate?: string; endDate?: string }
}

export interface Paginated<T> {
  items: T[]
  totalItems: number
  totalPages: number
  currentPage: number
}

export interface AttendeeRow {
  row?: number
  fullName?: string
  idNumber?: string
  email?: string
  phone?: string
  attributes?: Record<string, string>
}

export interface BulkRowResult {
  row: number
  status: 'created' | 'skipped' | 'error'
  memberStatus?: 'existing' | 'created'
  attendeeId?: string
  memberId?: string
  fullName?: string
  message?: string
  warnings: string[]
}

export interface BulkResult {
  results: BulkRowResult[]
  summary: { created: number; skipped: number; errors: number; newMembers: number }
}

export interface RenderData {
  // El miembro no tiene documento (o tiene uno de relleno): la landing del
  // correo lo pide antes de descargar
  missingIdNumber?: boolean
  attendee: {
    _id: string
    eventId: string
    memberId: string
    userId?: string
    attended: boolean
    typeAttendee: string
    certificationHours: string
    properties: Record<string, string>
    certificateDownloads: number
  }
  member: { _id: string; properties: Record<string, string> } | null
  event: { _id: string; name: string; startDate?: string; organizationId?: string } | null
  certificate: {
    _id: string
    elements: CertificateElement[]
    size?: { width: number; height: number }
    fields: CertificateField[]
  }
  values: Record<string, string>
}

export type PublicSearchResult =
  | { status: 'ambiguous'; count: number; message: string }
  | { status: 'not_found'; message: string }
  | {
      status: 'found'
      member: { fullName: string; email: string; idNumber: string }
      certificates: MemberCertificate[]
    }

// --- Correo del certificado -------------------------------------------------

export type EmailAlign = 'left' | 'center' | 'right'

export type EmailBlock =
  | { id: string; type: 'heading'; text: string; align?: EmailAlign; color?: string; size?: number }
  | { id: string; type: 'text'; text: string; align?: EmailAlign; color?: string; size?: number }
  | { id: string; type: 'image'; url: string; width?: number; align?: EmailAlign; alt?: string }
  | {
      id: string
      type: 'button'
      text: string
      align?: EmailAlign
      color?: string
      textColor?: string
    }
  | { id: string; type: 'divider'; color?: string }
  | { id: string; type: 'spacer'; height?: number }
  | { id: string; type: 'html'; html: string }

export type EmailBlockType = EmailBlock['type']

export interface CertificateEmailSettings {
  enabled: boolean
  autoSend: boolean
  subject: string
  preheader: string
  fromName: string
  replyTo: string
  backgroundColor: string
  contentBackgroundColor: string
  fontFamily: string
  blocks: EmailBlock[]
  linkBaseUrl: string
}

export interface CertificateEmailConfig {
  event: { _id: string; name: string }
  certificateId: string | null
  hasDesign: boolean
  emailConfigured: boolean
  batchDelayMs: number
  saved: boolean
  settings: CertificateEmailSettings
  variables: CertificateField[]
  stats: { total: number; sent: number; failed: number; pending: number }
}

export type CertificateEmailMode = 'manual' | 'auto' | 'pending' | 'all'

export type CertificateEmailResult =
  | { status: 'sent'; to: string }
  | { status: 'skipped'; reason: string }
  | { status: 'failed'; error: string }
