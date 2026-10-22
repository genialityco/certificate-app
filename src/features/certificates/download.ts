import { fetchRenderData, registerDownload } from '@/services/api/certificateAdminService'

import { certificateFileName, certificateToPngBlob, downloadBlob } from './renderCertificate'
import { type RenderData } from './types'

export const renderDataToBlob = (data: RenderData) =>
  certificateToPngBlob(data.certificate.elements, data.certificate.size, data.values)

// Genera el PNG del certificado de un asistente y lo descarga.
// `count` registra la descarga (solo en la consulta pública).
export async function downloadAttendeeCertificate(
  attendeeIdOrData: string | RenderData,
  { count }: { count: boolean },
) {
  const data =
    typeof attendeeIdOrData === 'string'
      ? await fetchRenderData(attendeeIdOrData)
      : attendeeIdOrData
  const blob = await renderDataToBlob(data)
  downloadBlob(blob, certificateFileName(data.event?.name, data.values.fullName))
  if (count) {
    // Si falla el contador no se bloquea la descarga
    await registerDownload(data.attendee._id).catch(() => null)
  }
  return data
}
