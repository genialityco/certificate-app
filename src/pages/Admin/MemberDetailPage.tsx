import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import {
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Button,
  Card,
  Grid,
  Group,
  Loader,
  Stack,
  Table,
  Text,
  Tooltip,
} from '@mantine/core'
import { IconDownload, IconEdit, IconPencil } from '@tabler/icons-react'

import { AdminPage } from '@/features/admin/AdminLayout'
import { EditMemberModal } from '@/features/admin/EditMemberModal'
import { ListPager, usePagedList } from '@/features/admin/ListPager'
import { EventNameLink, formatPersonName } from '@/features/admin/format'
import { EditAttendeeModal } from '@/features/certificates/EditAttendeeModal'
import { downloadAttendeeCertificate } from '@/features/certificates/download'
import { MEMBER_FIELDS } from '@/features/certificates/fields'
import { fetchMemberDetail } from '@/services/api/certificateAdminService'
import notification from '@/utils/notification'

import { formatDate } from './useOrganizationEvents'

type Detail = Awaited<ReturnType<typeof fetchMemberDetail>>

const NO_CERTIFICATES: Detail['certificates'] = []

export function MemberDetailPage() {
  const { organizationId, memberId } = useParams()
  const [detail, setDetail] = useState<Detail | null>(null)
  const [error, setError] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [editingMember, setEditingMember] = useState(false)
  const pager = usePagedList(detail?.certificates ?? NO_CERTIFICATES, 10)

  const load = useCallback(() => {
    if (!memberId) return
    fetchMemberDetail(memberId)
      .then(setDetail)
      .catch(() => setError(true))
  }, [memberId])

  useEffect(load, [load])

  const download = async (attendeeId: string) => {
    setDownloading(attendeeId)
    try {
      await downloadAttendeeCertificate(attendeeId, { count: false })
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message
      notification.error({ message: message || 'No se pudo generar el certificado' })
    } finally {
      setDownloading(null)
    }
  }

  const props = detail?.member.properties ?? {}
  const extraProps = Object.entries(props).filter(
    ([key, value]) =>
      !MEMBER_FIELDS.some((f) => f.key === key) && key !== 'password' && typeof value !== 'object',
  )

  return (
    <AdminPage
      title={formatPersonName(props.fullName)}
      description={
        <Anchor component={Link} to={`/admin/org/${organizationId}/members`} size="sm" c="brand.7">
          ← Miembros
        </Anchor>
      }
    >
      {error && <Alert color="red">No se pudo cargar el miembro</Alert>}
      {!detail && !error && <Loader color="brand" />}
      {detail && (
        <Grid gutter="lg">
          <Grid.Col span={{ base: 12, lg: 4 }}>
            <Card withBorder radius="md" padding="lg">
              <Group justify="space-between" mb="sm">
                <Text fw={700}>Datos</Text>
                <Button
                  size="xs"
                  variant="light"
                  color="brand"
                  leftSection={<IconPencil size={14} />}
                  onClick={() => setEditingMember(true)}
                >
                  Editar
                </Button>
              </Group>
              <Stack gap={10}>
                {MEMBER_FIELDS.map((field) => (
                  <div key={field.key}>
                    <Text size="xs" c="dimmed">
                      {field.label}
                    </Text>
                    <Text>{props[field.key] || '—'}</Text>
                  </div>
                ))}
                {extraProps.map(([key, value]) => (
                  <div key={key}>
                    <Text size="xs" c="dimmed">
                      {key}
                    </Text>
                    <Text>
                      {typeof value === 'boolean' ? (value ? 'Sí' : 'No') : String(value) || '—'}
                    </Text>
                  </div>
                ))}
                <Group gap="xs" mt="xs">
                  <Badge color={detail.user ? 'green' : 'red'} variant="light">
                    {detail.user ? 'Usuario vinculado' : 'Sin usuario'}
                  </Badge>
                  <Badge
                    color={detail.member.memberActive === false ? 'gray' : 'brand'}
                    variant="light"
                  >
                    {detail.member.memberActive === false ? 'Inactivo' : 'Activo'}
                  </Badge>
                </Group>
              </Stack>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, lg: 8 }}>
            <Card withBorder radius="md" padding="lg">
              <Text fw={700} mb="sm">
                Certificados ({detail.certificates.length})
              </Text>
              <Table.ScrollContainer minWidth={600}>
                <Table highlightOnHover verticalSpacing="sm" fz="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Evento</Table.Th>
                      <Table.Th>Fecha</Table.Th>
                      <Table.Th>Tipo</Table.Th>
                      <Table.Th>Horas</Table.Th>
                      <Table.Th ta="right">Descargas</Table.Th>
                      <Table.Th />
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {pager.visible.map((cert) => (
                      <Table.Tr key={cert._id} style={{ opacity: cert.attended ? 1 : 0.5 }}>
                        <Table.Td>
                          <Text fw={600} size="sm">
                            <EventNameLink eventId={cert.event?._id} name={cert.event?.name} />
                          </Text>
                          {!cert.hasCertificate && (
                            <Badge size="xs" color="gray" variant="light">
                              Sin diseño
                            </Badge>
                          )}
                        </Table.Td>
                        <Table.Td>{formatDate(cert.event?.startDate)}</Table.Td>
                        <Table.Td>{cert.typeAttendee || '—'}</Table.Td>
                        <Table.Td>{cert.certificationHours || '—'}</Table.Td>
                        <Table.Td ta="right">{cert.certificateDownloads}</Table.Td>
                        <Table.Td>
                          <Group gap={4} justify="flex-end" wrap="nowrap">
                            <Tooltip label="Editar este certificado">
                              <ActionIcon
                                variant="subtle"
                                color="brand"
                                disabled={!cert.hasCertificate}
                                onClick={() => setEditing(cert._id)}
                              >
                                <IconEdit size={16} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Descargar PNG">
                              <ActionIcon
                                variant="subtle"
                                color="brand"
                                disabled={!cert.hasCertificate}
                                loading={downloading === cert._id}
                                onClick={() => download(cert._id)}
                              >
                                <IconDownload size={16} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                    {!detail.certificates.length && (
                      <Table.Tr>
                        <Table.Td colSpan={6}>
                          <Text c="dimmed" ta="center" py="lg">
                            No está inscrito en ningún evento
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
              <ListPager {...pager} noun="certificados" />
            </Card>
          </Grid.Col>
        </Grid>
      )}
      <EditMemberModal
        member={detail?.member ?? null}
        opened={editingMember}
        onClose={() => setEditingMember(false)}
        onSaved={setDetail}
      />
      <EditAttendeeModal attendeeId={editing} onClose={() => setEditing(null)} onSaved={load} />
    </AdminPage>
  )
}
