import { FormEvent, useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { Alert, Button, Card, Image, Loader, Stack, Text, TextInput, Title } from '@mantine/core'
import { IconDownload, IconId } from '@tabler/icons-react'

import { formatEventName, formatPersonName } from '@/features/admin/format'
import { downloadAttendeeCertificate } from '@/features/certificates/download'
import { renderCertificateToCanvas } from '@/features/certificates/renderCertificate'
import { type RenderData } from '@/features/certificates/types'
import { completeIdNumber, fetchRenderData } from '@/services/api/certificateAdminService'
import { palette } from '@/styles/palette'
import notification from '@/utils/notification'

const errorMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback

// Página a la que lleva el enlace del correo: /descarga/:attendeeId
// Si a la persona le falta el documento, lo pide antes de dejarla descargar.
export function DownloadLanding() {
  const { attendeeId } = useParams()
  const [data, setData] = useState<RenderData | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  const show = useCallback(async (result: RenderData) => {
    setData(result)
    if (result.missingIdNumber) return
    const canvas = document.createElement('canvas')
    await renderCertificateToCanvas(
      canvas,
      result.certificate.elements,
      result.certificate.size,
      result.values,
    )
    setPreview(canvas.toDataURL('image/png'))
  }, [])

  useEffect(() => {
    if (!attendeeId) return
    fetchRenderData(attendeeId)
      .then(show)
      .catch((err) => setError(errorMessage(err, 'No encontramos este certificado')))
  }, [attendeeId, show])

  const download = async () => {
    if (!data || data.missingIdNumber) return
    setDownloading(true)
    try {
      await downloadAttendeeCertificate(data, { count: true })
    } catch {
      notification.error({ message: 'No se pudo descargar el certificado' })
    } finally {
      setDownloading(false)
    }
  }

  const name = formatPersonName(data?.values.fullName)

  return (
    <Stack
      align="center"
      gap="md"
      px={16}
      py={40}
      style={{
        width: '100%',
        minHeight: '100vh',
        background: `linear-gradient(180deg, ${palette.primarySoft} 0%, ${palette.surface} 70%)`,
        color: palette.text,
      }}
    >
      <Title order={2} ta="center">
        {name ? `Hola, ${name}` : 'Descarga tu certificado'}
      </Title>
      {data?.event?.name && (
        <Text c="dimmed" ta="center">
          {formatEventName(data.event.name)}
        </Text>
      )}
      {error && <Alert color="red">{error}</Alert>}
      {!error && !data && <Loader color="brand" size="lg" />}

      {data?.missingIdNumber && attendeeId && (
        <IdNumberForm attendeeId={attendeeId} onCompleted={show} />
      )}

      {data && !data.missingIdNumber && !preview && <Loader color="brand" size="lg" />}
      {preview && (
        <>
          <Button
            color="brand"
            size="md"
            leftSection={<IconDownload size={18} />}
            onClick={download}
            loading={downloading}
          >
            Descargar certificado
          </Button>
          <Image
            src={preview}
            alt="Certificado"
            maw={1000}
            w="100%"
            radius="md"
            style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}
          />
        </>
      )}
    </Stack>
  )
}

function IdNumberForm({
  attendeeId,
  onCompleted,
}: {
  attendeeId: string
  onCompleted: (data: RenderData) => void
}) {
  const [idNumber, setIdNumber] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clean = (value: string) => value.replace(/[.\s,-]/g, '')
  const mismatch = Boolean(confirm) && clean(confirm) !== clean(idNumber)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (clean(idNumber).length < 5) {
      setError('Escribe tu número de identificación completo')
      return
    }
    if (mismatch) return
    setSaving(true)
    setError(null)
    try {
      onCompleted(await completeIdNumber(attendeeId, idNumber))
      notification.success({ message: 'Datos guardados. Ya puedes descargar tu certificado.' })
    } catch (err) {
      setError(errorMessage(err, 'No se pudo guardar tu documento'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card withBorder radius="md" padding="lg" w="100%" maw={440}>
      <form onSubmit={submit}>
        <Stack gap="sm">
          <Stack gap={4} align="center">
            <IconId size={36} color={palette.primary} />
            <Text fw={700} ta="center">
              Completa tus datos para continuar
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              Tu certificado necesita tu número de identificación. Escríbelo para poder descargarlo.
            </Text>
          </Stack>
          <TextInput
            label="Número de identificación"
            value={idNumber}
            onChange={(e) => setIdNumber(e.currentTarget.value)}
            inputMode="numeric"
            autoComplete="off"
            required
          />
          <TextInput
            label="Confirma tu número de identificación"
            value={confirm}
            onChange={(e) => setConfirm(e.currentTarget.value)}
            inputMode="numeric"
            autoComplete="off"
            error={mismatch ? 'Los números no coinciden' : undefined}
            required
          />
          {error && <Alert color="red">{error}</Alert>}
          <Button
            type="submit"
            color="brand"
            loading={saving}
            disabled={!idNumber || !confirm || mismatch}
          >
            Continuar con la descarga
          </Button>
        </Stack>
      </form>
    </Card>
  )
}
