import { useSyncExternalStore } from 'react'

import { notifications } from '@mantine/notifications'

import { isAdminLogged } from '@/features/admin/session'
import { renderCertificateToCanvas } from '@/features/certificates/renderCertificate'
import {
  type CertificateDoc,
  type CertificateEmailMode,
  type CertificateEmailResult,
} from '@/features/certificates/types'
import {
  fetchEmailConfig,
  fetchEventEmailRecipients,
  fetchRenderData,
  sendAttendeeEmail,
} from '@/services/api/certificateAdminService'

const certificateEmailError = (err: unknown, fallback: string) => {
  const response = (err as { response?: { data?: { message?: string } } })?.response
  return response?.data?.message || (err instanceof Error && !response && err.message) || fallback
}

async function renderCertificatePdf(
  certificate: Pick<CertificateDoc, 'elements' | 'size'>,
  values: Record<string, string>,
) {
  if (!certificate.elements.length) throw new Error('El certificado necesita un diseño')
  const { jsPDF } = await import('jspdf')
  const canvas = document.createElement('canvas')
  try {
    await renderCertificateToCanvas(canvas, certificate.elements, certificate.size, values, {
      requireImages: true,
    })
    const pdf = new jsPDF({
      orientation: canvas.width >= canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      hotfixes: ['px_scaling'],
      format: [canvas.width, canvas.height],
    })
    pdf.addImage(
      canvas.toDataURL('image/jpeg', 0.92),
      'JPEG',
      0,
      0,
      pdf.internal.pageSize.getWidth(),
      pdf.internal.pageSize.getHeight(),
    )
    const blob = pdf.output('blob')
    if (blob.size > 5 * 1024 * 1024) throw new Error('El certificado supera el límite de 5 MB')
    return blob
  } finally {
    canvas.width = 0
    canvas.height = 0
  }
}

async function emailAttendeeCertificate(
  attendeeId: string,
  mode: CertificateEmailMode = 'manual',
): Promise<CertificateEmailResult> {
  const data = await fetchRenderData(attendeeId)
  if (!data.attendee.attended) {
    return { status: 'skipped', reason: 'El asistente no está habilitado para el certificado' }
  }
  if (!data.member?.properties.email) {
    return { status: 'skipped', reason: 'El miembro no tiene un correo válido' }
  }
  const pdf = await renderCertificatePdf(data.certificate, data.values)
  return sendAttendeeEmail(attendeeId, data.attendee.memberId, pdf, mode)
}

const batches = new Map<string, Promise<void>>()
const batchListeners = new Set<() => void>()
const subscribeToBatches = (listener: () => void) => {
  batchListeners.add(listener)
  return () => batchListeners.delete(listener)
}

const useCertificateEmailBatch = (eventId?: string) =>
  useSyncExternalStore(subscribeToBatches, () => Boolean(eventId && batches.has(eventId)))

const warnOnClose = (event: BeforeUnloadEvent) => {
  event.preventDefault()
  event.returnValue = ''
}

function enqueueBatch(eventId: string, run: () => Promise<void>) {
  const previous = batches.get(eventId)
  if (!batches.size) window.addEventListener('beforeunload', warnOnClose)
  const batch: Promise<void> = (previous?.catch(() => undefined) ?? Promise.resolve())
    .then(run)
    .finally(() => {
      if (batches.get(eventId) === batch) batches.delete(eventId)
      if (!batches.size) window.removeEventListener('beforeunload', warnOnClose)
      batchListeners.forEach((listener) => listener())
    })
  batches.set(eventId, batch)
  batchListeners.forEach((listener) => listener())
  return batch
}

async function processBatch(
  eventId: string,
  mode: 'auto' | 'pending' | 'all',
  delayMs: number,
  attendeeIds?: string[],
) {
  const totals = { sent: 0, skipped: 0, failed: 0 }
  let firstError: string | undefined
  const progress = notifications.show({
    title: 'Enviando certificados',
    message: 'Mantén esta pestaña abierta mientras se procesan los correos.',
    loading: true,
    autoClose: false,
  })

  try {
    let after: string | undefined
    do {
      const page: { ids: string[]; next?: string } = attendeeIds
        ? { ids: [...new Set(attendeeIds)] }
        : await fetchEventEmailRecipients(eventId, mode === 'all' ? 'all' : 'pending', after)
      after = page.next
      for (const id of page.ids) {
        if (!isAdminLogged()) {
          throw new Error('La sesión expiró. Vuelve a ingresar y envía los pendientes.')
        }
        try {
          const result = await emailAttendeeCertificate(id, mode)
          totals[result.status]++
          if (result.status === 'failed') firstError ??= result.error
        } catch (error) {
          if ((error as { response?: { status?: number } }).response?.status === 401) throw error
          totals.failed++
          firstError ??= certificateEmailError(error, 'No se pudo enviar el certificado')
        }
        notifications.update({
          id: progress,
          title: 'Enviando certificados',
          message: `${totals.sent} enviados, ${totals.skipped} omitidos y ${totals.failed} con error.`,
          loading: true,
          autoClose: false,
        })
        if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    } while (after)

    notifications.update({
      id: progress,
      title: 'Envío de certificados finalizado',
      message: `${totals.sent} enviados, ${totals.skipped} omitidos y ${totals.failed} con error.${
        firstError ? ` El primer error fue «${firstError}».` : ''
      }`,
      color: totals.failed ? 'orange' : 'green',
      loading: false,
      autoClose: 8000,
    })
  } catch (error) {
    notifications.hide(progress)
    throw error
  }
}

function emailEventCertificates(eventId: string, scope: 'pending' | 'all', delayMs: number) {
  if (batches.has(eventId)) throw new Error('Ya hay un envío en curso para este evento')
  return enqueueBatch(eventId, () => processBatch(eventId, scope, delayMs))
}

function emailCertificatesAutomatically(eventId: string, attendeeIds?: string[]) {
  if (attendeeIds?.length === 0) return Promise.resolve()
  return enqueueBatch(eventId, async () => {
    const { settings, hasDesign, emailConfigured, stats, batchDelayMs } =
      await fetchEmailConfig(eventId)
    if (!hasDesign || !emailConfigured || !settings.enabled || !settings.autoSend || !stats.pending)
      return
    await processBatch(eventId, 'auto', batchDelayMs, attendeeIds)
  }).catch((error) => {
    notifications.show({
      title: 'No se completó el envío automático',
      message: certificateEmailError(
        error,
        'Puedes retomar el envío desde los pendientes del evento.',
      ),
      color: 'orange',
    })
  })
}

export {
  certificateEmailError,
  emailAttendeeCertificate,
  emailCertificatesAutomatically,
  emailEventCertificates,
  renderCertificatePdf,
  useCertificateEmailBatch,
}
