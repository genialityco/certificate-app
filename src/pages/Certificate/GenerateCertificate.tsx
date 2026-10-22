import { FC, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { Alert, Button, Image, Loader, Stack, Text, Title } from '@mantine/core'
import { IconDownload } from '@tabler/icons-react'

import { downloadAttendeeCertificate } from '@/features/certificates/download'
import { renderCertificateToCanvas } from '@/features/certificates/renderCertificate'
import { type RenderData } from '@/features/certificates/types'
import { fetchLegacyRenderData } from '@/services/api/certificateAdminService'
import { palette } from '@/styles/palette'
import notification from '@/utils/notification'

// Enlace que usa la app: /certificate/:eventId (o certificateId)/:userId (o memberId)
const GenerateCertificate: FC = (): JSX.Element => {
  const { certificateId, attendeeId } = useParams()
  const [data, setData] = useState<RenderData | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!certificateId || !attendeeId) return
    fetchLegacyRenderData(certificateId, attendeeId)
      .then(async (result) => {
        setData(result)
        const canvas = document.createElement('canvas')
        await renderCertificateToCanvas(
          canvas,
          result.certificate.elements,
          result.certificate.size,
          result.values,
        )
        setPreview(canvas.toDataURL('image/png'))
      })
      .catch((err) =>
        setError(err?.response?.data?.message || 'No se encontró el certificado para este usuario'),
      )
  }, [certificateId, attendeeId])

  const download = async () => {
    if (!data) return
    setDownloading(true)
    try {
      await downloadAttendeeCertificate(data, { count: true })
    } catch {
      notification.error({ message: 'No se pudo descargar el certificado' })
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Stack
      align="center"
      gap="md"
      px={16}
      py={40}
      style={{
        width: '100vw',
        minHeight: '100vh',
        background: `linear-gradient(180deg, ${palette.primarySoft} 0%, ${palette.surface} 70%)`,
        color: palette.text,
      }}
    >
      <Title order={2}>Descarga tu certificado</Title>
      {data?.event?.name && <Text c="dimmed">{data.event.name}</Text>}
      {error && <Alert color="red">{error}</Alert>}
      {!error && !preview && <Loader color="brand" size="lg" />}
      {preview && (
        <>
          <Button
            color="brand"
            size="md"
            leftSection={<IconDownload size={18} />}
            onClick={download}
            loading={downloading}
          >
            Descargar PNG
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

export { GenerateCertificate }
