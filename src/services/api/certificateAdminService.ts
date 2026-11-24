import { adminAuthorization } from '@/features/admin/session'
import {
  type AttendeeRow,
  type BulkResult,
  type CertificateDoc,
  type CertificateEmailConfig,
  type CertificateEmailMode,
  type CertificateEmailResult,
  type CertificateEmailSettings,
  type CertificateField,
  type EventAttendee,
  type EventSummary,
  type MemberCertificate,
  type MemberDoc,
  type Paginated,
  type PublicSearchResult,
  type RenderData,
} from '@/features/certificates/types'

import api from './api'

const BASE = '/certificate-admin'

// --- Administración ---------------------------------------------------------

// /organizations pagina de a 10 por defecto
export const fetchAllOrganizations = async () => {
  const { data } = await api.get('/organizations', { params: { limit: 500 } })
  return (data?.data?.items ?? []) as { _id: string; name: string }[]
}

export const fetchOrganizationEvents = async (organizationId: string) => {
  const { data } = await api.get(`${BASE}/organizations/${organizationId}/events`)
  return data.data.items as EventSummary[]
}

export const createEvent = async (payload: {
  organizationId: string
  name: string
  description?: string
  startDate: string
  endDate: string
}) => {
  const { data } = await api.post('/events', payload)
  return data.data as { _id: string; name: string }
}

export const fetchEventOverview = async (eventId: string) => {
  const { data } = await api.get(`${BASE}/events/${eventId}`)
  return data.data as {
    event: { _id: string; name: string; organizationId: string; startDate?: string }
    certificate: CertificateDoc | null
    attendees: number
  }
}

export const fetchEventAttendees = async (
  eventId: string,
  params: { q?: string; page?: number; limit?: number },
) => {
  const { data } = await api.get(`${BASE}/events/${eventId}/attendees`, { params })
  return data.data as Paginated<EventAttendee>
}

export const bulkUploadAttendees = async (eventId: string, rows: AttendeeRow[]) => {
  const { data } = await api.post(`${BASE}/events/${eventId}/attendees/bulk`, { rows })
  return data.data as BulkResult
}

export type MemberSort = 'name' | 'certificates_desc' | 'certificates_asc'

export const searchOrganizationMembers = async (
  organizationId: string,
  params: { q?: string; page?: number; limit?: number; sort?: MemberSort },
) => {
  const { data } = await api.get(`${BASE}/organizations/${organizationId}/members`, { params })
  return data.data as Paginated<MemberDoc>
}

export const fetchMemberDetail = async (memberId: string) => {
  const { data } = await api.get(`${BASE}/members/${memberId}`)
  return data.data as {
    member: MemberDoc
    user: { _id: string; firebaseUid: string } | null
    certificates: MemberCertificate[]
  }
}

export const updateMemberProperties = async (
  memberId: string,
  payload: { set?: Record<string, string | number | boolean>; unset?: string[] },
) => {
  const { data } = await api.put(`${BASE}/members/${memberId}`, payload)
  return data.data as Awaited<ReturnType<typeof fetchMemberDetail>>
}

export const updateAttendeeData = async (
  attendeeId: string,
  payload: {
    member?: Partial<Record<'fullName' | 'idNumber' | 'email' | 'phone', string>>
    attributes?: Record<string, string>
    attended?: boolean
  },
) => {
  const { data } = await api.put(`${BASE}/attendees/${attendeeId}`, payload)
  return data.data as RenderData
}

// Guarda el certificado del evento. El backend mantiene uno solo por evento,
// así que si no tenemos id igual se actualiza el existente.
export const saveEventCertificate = async (
  certificateId: string | null,
  payload: {
    eventId: string
    elements: unknown[]
    size: { width: number; height: number }
    fields: CertificateField[]
  },
) => {
  const { data } = certificateId
    ? await api.put(`/certificates/${certificateId}`, payload)
    : await api.post('/certificates', payload)
  return data.data as CertificateDoc
}

export const uploadImage = async (file: File) => {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post('/upload/image', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return (data.imageUrl ?? data.url ?? data.data?.url ?? data.data?.imageUrl) as string
}

// --- Correo del certificado -------------------------------------------------

export const fetchEmailConfig = async (eventId: string) => {
  const { data } = await api.get(`${BASE}/events/${eventId}/email`)
  return data.data as CertificateEmailConfig
}

export const saveEmailSettings = async (eventId: string, settings: CertificateEmailSettings) => {
  const { data } = await api.put(`${BASE}/events/${eventId}/email`, { settings }, {
    headers: adminAuthorization(),
  })
  return data.data as CertificateEmailConfig
}

export const previewEmail = async (eventId: string, settings: CertificateEmailSettings) => {
  const { data } = await api.post(`${BASE}/events/${eventId}/email/preview`, { settings })
  return data.data as { subject: string; html: string; text: string }
}

export const sendTestEmail = async (
  eventId: string,
  to: string,
  settings: CertificateEmailSettings,
  pdf: Blob,
) => {
  const form = new FormData()
  form.append('to', to)
  form.append('settings', JSON.stringify(settings))
  form.append('certificate', pdf, 'Certificado.pdf')
  const { data } = await api.post(`${BASE}/events/${eventId}/email/test`, form, {
    headers: { ...adminAuthorization(), 'Content-Type': 'multipart/form-data' },
  })
  return data.data as { to: string }
}

export const fetchEventEmailRecipients = async (
  eventId: string,
  scope: 'pending' | 'all',
  after?: string,
) => {
  const { data } = await api.get(`${BASE}/events/${eventId}/email/recipients`, {
    headers: adminAuthorization(),
    params: { scope, after },
  })
  return data.data as { ids: string[]; next?: string }
}

export const sendAttendeeEmail = async (
  attendeeId: string,
  memberId: string,
  pdf: Blob,
  mode: CertificateEmailMode,
) => {
  const form = new FormData()
  form.append('memberId', memberId)
  form.append('mode', mode)
  form.append('certificate', pdf, 'Certificado.pdf')
  const { data } = await api.post(`${BASE}/attendees/${attendeeId}/email`, form, {
    headers: { ...adminAuthorization(), 'Content-Type': 'multipart/form-data' },
  })
  return data.data as CertificateEmailResult
}

// --- Público ----------------------------------------------------------------

export const completeIdNumber = async (attendeeId: string, idNumber: string) => {
  const { data } = await api.put(`${BASE}/public/attendees/${attendeeId}/id-number`, { idNumber })
  return data.data as RenderData
}

export const publicSearch = async (organizationId: string, q: string) => {
  const { data } = await api.get(`${BASE}/public/organizations/${organizationId}/search`, {
    params: { q },
  })
  return data.data as PublicSearchResult
}

export const fetchRenderData = async (attendeeId: string) => {
  const { data } = await api.get(`${BASE}/public/render/${attendeeId}`)
  return data.data as RenderData
}

export const fetchLegacyRenderData = async (
  eventOrCertificateId: string,
  userOrMemberId: string,
) => {
  const { data } = await api.get(`${BASE}/public/render/${eventOrCertificateId}/${userOrMemberId}`)
  return data.data as RenderData
}

export const registerDownload = async (attendeeId: string) => {
  await api.put('/attendees/certificate-download', { attendeeId })
}
