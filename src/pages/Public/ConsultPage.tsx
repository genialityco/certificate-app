import { FormEvent, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import {
  Alert,
  Box,
  Button,
  Card,
  Container,
  Group,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { IconAlertCircle, IconCertificate, IconDownload, IconSearch } from '@tabler/icons-react'

import { ListPager, usePagedList } from '@/features/admin/ListPager'
import { downloadAttendeeCertificate } from '@/features/certificates/download'
import { type MemberCertificate, type PublicSearchResult } from '@/features/certificates/types'
import { publicSearch } from '@/services/api/certificateAdminService'
import { fetchOrganizationById } from '@/services/api/organizationService'
import { palette } from '@/styles/palette'
import notification from '@/utils/notification'

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : ''

const EMPTY: MemberCertificate[] = []

export function ConsultPage() {
  const { organizationId } = useParams()
  const [organizationName, setOrganizationName] = useState('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PublicSearchResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)
  const pager = usePagedList(result?.status === 'found' ? result.certificates : EMPTY, 10)

  useEffect(() => {
    if (!organizationId) return
    fetchOrganizationById(organizationId)
      .then((response) => setOrganizationName(response?.data?.name ?? ''))
      .catch(() => null)
  }, [organizationId])

  const search = async (event: FormEvent) => {
    event.preventDefault()
    if (!organizationId) return
    const q = query.trim()
    if (q.length < 3) {
      setError('Escribe al menos 3 caracteres')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      setResult(await publicSearch(organizationId, q))
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message
      setError(message || 'No pudimos hacer la búsqueda. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const download = async (attendeeId: string) => {
    setDownloading(attendeeId)
    try {
      await downloadAttendeeCertificate(attendeeId, { count: true })
      setResult((prev) =>
        prev?.status === 'found'
          ? {
              ...prev,
              certificates: prev.certificates.map((c) =>
                c._id === attendeeId
                  ? { ...c, certificateDownloads: c.certificateDownloads + 1 }
                  : c,
              ),
            }
          : prev,
      )
    } catch {
      notification.error({ message: 'No se pudo generar el certificado. Intenta de nuevo.' })
    } finally {
      setDownloading(null)
    }
  }

  return (
    <Box
      style={{
        width: '100vw',
        minHeight: '100vh',
        background: `linear-gradient(180deg, ${palette.primarySoft} 0%, ${palette.surface} 70%)`,
        color: palette.text,
        colorScheme: 'light',
        textAlign: 'left',
      }}
      py={{ base: 32, md: 64 }}
    >
      <Container size="md" px={16}>
        <Stack align="center" gap={6} mb="xl">
          <Box
            style={{
              display: 'grid',
              placeItems: 'center',
              width: 64,
              height: 64,
              borderRadius: 18,
              background: palette.surface,
              color: palette.primary,
              boxShadow: '0 6px 20px rgba(77, 147, 208, 0.15)',
            }}
          >
            <IconCertificate size={34} />
          </Box>
          <Title order={1} c={palette.text} ta="center" fz={{ base: 28, md: 38 }} mt="xs">
            Consulta tus certificados
          </Title>
          <Box w={56} h={3} style={{ borderRadius: 2, background: palette.accent }} />
          {organizationName && (
            <Text c={palette.muted} ta="center" size="lg">
              {organizationName}
            </Text>
          )}
        </Stack>

        <Card
          radius="lg"
          padding="xl"
          withBorder
          style={{ borderColor: palette.border, boxShadow: '0 10px 30px rgba(31, 45, 61, 0.06)' }}
        >
          <form onSubmit={search}>
            <Text fw={600} mb={8}>
              Escribe tu número de identificación, tu correo o tu nombre completo
            </Text>
            <Group gap="sm" align="flex-start" wrap="nowrap">
              <TextInput
                size="md"
                placeholder="Ej: 1234567890"
                value={query}
                onChange={(e) => setQuery(e.currentTarget.value)}
                leftSection={<IconSearch size={18} />}
                style={{ flex: 1 }}
                autoFocus
              />
              <Button type="submit" size="md" color="brand" loading={loading}>
                Buscar
              </Button>
            </Group>
          </form>

          {error && (
            <Alert color="red" mt="md" icon={<IconAlertCircle size={18} />}>
              {error}
            </Alert>
          )}
          {result?.status === 'ambiguous' && (
            <Alert color="orange" mt="md" icon={<IconAlertCircle size={18} />}>
              {result.message}
            </Alert>
          )}
          {result?.status === 'not_found' && (
            <Alert color="gray" mt="md" icon={<IconAlertCircle size={18} />}>
              {result.message}. Revisa que esté bien escrito o prueba con otro dato.
            </Alert>
          )}

          {result?.status === 'found' && (
            <Stack mt="xl" gap="md">
              <div style={{ background: '#f0f7fd', borderRadius: 12, padding: 16 }}>
                <Text fw={800} size="xl">
                  {result.member.fullName}
                </Text>
                <Group gap="lg" mt={4}>
                  {result.member.idNumber && (
                    <Text size="sm" c="dimmed">
                      Documento: {result.member.idNumber}
                    </Text>
                  )}
                  {result.member.email && (
                    <Text size="sm" c="dimmed">
                      Correo: {result.member.email}
                    </Text>
                  )}
                </Group>
              </div>

              {result.certificates.length === 0 ? (
                <Alert color="gray">Todavía no tienes certificados disponibles.</Alert>
              ) : (
                <div>
                  <Table.ScrollContainer minWidth={480}>
                    <Table verticalSpacing="md" highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Evento</Table.Th>
                          <Table.Th>Fecha</Table.Th>
                          <Table.Th />
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {pager.visible.map((cert) => (
                          <Table.Tr key={cert._id}>
                            <Table.Td>
                              <Text fw={600}>{cert.event?.name}</Text>
                              {cert.certificationHours && (
                                <Text size="xs" c="dimmed">
                                  {cert.certificationHours} horas
                                </Text>
                              )}
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm">{formatDate(cert.event?.startDate)}</Text>
                            </Table.Td>
                            <Table.Td ta="right">
                              <Button
                                color="brand"
                                leftSection={<IconDownload size={16} />}
                                loading={downloading === cert._id}
                                onClick={() => download(cert._id)}
                              >
                                Descargar
                              </Button>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>
                  <ListPager {...pager} noun="certificados" sizes={[5, 10, 20, 50]} />
                </div>
              )}
            </Stack>
          )}
        </Card>
      </Container>
    </Box>
  )
}
