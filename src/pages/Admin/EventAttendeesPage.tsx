import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import {
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Button,
  Card,
  Group,
  Loader,
  Modal,
  Pagination,
  Stack,
  Table,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconDownload,
  IconEdit,
  IconFileSpreadsheet,
  IconPalette,
  IconSearch,
  IconUser,
  IconUserPlus,
} from '@tabler/icons-react'

import { AdminPage } from '@/features/admin/AdminLayout'
import { EventNameLink, formatPersonName } from '@/features/admin/format'
import { EditAttendeeModal } from '@/features/certificates/EditAttendeeModal'
import { BulkUploadModal } from '@/features/certificates/bulk/BulkUploadModal'
import { downloadAttendeeCertificate } from '@/features/certificates/download'
import { DEFAULT_ATTENDEE_FIELDS, MEMBER_FIELDS } from '@/features/certificates/fields'
import {
  type CertificateField,
  type EventAttendee,
  type Paginated,
} from '@/features/certificates/types'
import {
  bulkUploadAttendees,
  fetchEventAttendees,
  fetchEventOverview,
} from '@/services/api/certificateAdminService'
import notification from '@/utils/notification'

type Overview = Awaited<ReturnType<typeof fetchEventOverview>>

const attributeOf = (attendee: EventAttendee, key: string) => {
  if (key === 'typeAttendee') return attendee.typeAttendee
  if (key === 'certificationHours') return attendee.certificationHours
  return attendee.properties?.[key]
}

export function EventAttendeesPage() {
  const { organizationId, eventId } = useParams()
  const [overview, setOverview] = useState<Overview | null>(null)
  const [data, setData] = useState<Paginated<EventAttendee> | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebouncedValue(search, 400)
  const [page, setPage] = useState(1)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)

  const fields: CertificateField[] = overview?.certificate?.fields?.length
    ? overview.certificate.fields
    : DEFAULT_ATTENDEE_FIELDS

  useEffect(() => {
    if (eventId)
      fetchEventOverview(eventId)
        .then(setOverview)
        .catch(() => null)
  }, [eventId])

  const load = useCallback(() => {
    if (!eventId) return
    fetchEventAttendees(eventId, { q: debouncedSearch, page, limit: 20 })
      .then(setData)
      .catch(() => setData({ items: [], totalItems: 0, totalPages: 0, currentPage: 1 }))
  }, [eventId, debouncedSearch, page])

  useEffect(load, [load])
  useEffect(() => setPage(1), [debouncedSearch])

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

  const eventName = overview?.event.name ?? ''

  return (
    <AdminPage
      title={
        eventId && eventName ? (
          <EventNameLink eventId={eventId} name={eventName} fw={800} />
        ) : (
          'Asistentes'
        )
      }
      description={
        <Anchor component={Link} to={`/admin/org/${organizationId}/events`} size="sm" c="brand.7">
          ← Eventos
        </Anchor>
      }
      actions={
        <>
          <Button
            component={Link}
            to={`/admin/org/${organizationId}/events/${eventId}/certificate`}
            variant="default"
            leftSection={<IconPalette size={16} />}
          >
            Diseño
          </Button>
          <Button
            variant="light"
            color="brand"
            leftSection={<IconUserPlus size={16} />}
            onClick={() => setAddOpen(true)}
          >
            Agregar persona
          </Button>
          <Button
            color="brand"
            leftSection={<IconFileSpreadsheet size={16} />}
            onClick={() => setBulkOpen(true)}
          >
            Carga masiva
          </Button>
        </>
      }
    >
      {overview && !overview.certificate && (
        <Alert color="orange" mb="md">
          Este evento todavía no tiene diseño de certificado. Puedes cargar asistentes, pero no
          podrán descargarlo hasta que lo crees.
        </Alert>
      )}

      <Card withBorder radius="md" padding="lg">
        <Group justify="space-between" mb="md">
          <TextInput
            placeholder="Buscar por nombre, correo o documento"
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            w={360}
            maw="100%"
          />
          <Text size="sm" c="dimmed">
            {data ? `${data.totalItems.toLocaleString('es-CO')} asistentes` : ''}
          </Text>
        </Group>

        {!data ? (
          <Loader color="brand" />
        ) : (
          <>
            <Table.ScrollContainer minWidth={900}>
              <Table highlightOnHover verticalSpacing="xs" fz="sm">
                <Table.Thead>
                  <Table.Tr>
                    {MEMBER_FIELDS.map((f) => (
                      <Table.Th key={f.key}>{f.label}</Table.Th>
                    ))}
                    {fields.map((f) => (
                      <Table.Th key={f.key}>{f.label}</Table.Th>
                    ))}
                    <Table.Th ta="right">Descargas</Table.Th>
                    <Table.Th />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {data.items.map((attendee) => (
                    <Table.Tr key={attendee._id} style={{ opacity: attendee.attended ? 1 : 0.5 }}>
                      {MEMBER_FIELDS.map((f) => (
                        <Table.Td key={f.key}>
                          {f.key === 'fullName'
                            ? formatPersonName(attendee.member?.properties?.fullName)
                            : attendee.member?.properties?.[f.key] ?? '—'}
                        </Table.Td>
                      ))}
                      {fields.map((f) => (
                        <Table.Td key={f.key}>{attributeOf(attendee, f.key) || '—'}</Table.Td>
                      ))}
                      <Table.Td ta="right">
                        <Badge
                          variant="light"
                          color={attendee.certificateDownloads ? 'brand' : 'gray'}
                        >
                          {attendee.certificateDownloads ?? 0}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4} justify="flex-end" wrap="nowrap">
                          <Tooltip label="Editar datos del certificado">
                            <ActionIcon
                              variant="subtle"
                              color="brand"
                              onClick={() => setEditing(attendee._id)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Descargar PNG">
                            <ActionIcon
                              variant="subtle"
                              color="brand"
                              loading={downloading === attendee._id}
                              disabled={!overview?.certificate}
                              onClick={() => download(attendee._id)}
                            >
                              <IconDownload size={16} />
                            </ActionIcon>
                          </Tooltip>
                          {attendee.memberId && (
                            <Tooltip label="Ver miembro">
                              <ActionIcon
                                component={Link}
                                to={`/admin/org/${organizationId}/members/${attendee.memberId}`}
                                variant="subtle"
                                color="gray"
                              >
                                <IconUser size={16} />
                              </ActionIcon>
                            </Tooltip>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {!data.items.length && (
                    <Table.Tr>
                      <Table.Td colSpan={MEMBER_FIELDS.length + fields.length + 2}>
                        <Text c="dimmed" ta="center" py="lg">
                          {debouncedSearch
                            ? 'Sin resultados'
                            : 'Aún no hay asistentes. Usa la carga masiva.'}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
            {data.totalPages > 1 && (
              <Group justify="center" mt="md">
                <Pagination total={data.totalPages} value={page} onChange={setPage} color="brand" />
              </Group>
            )}
          </>
        )}
      </Card>

      {eventId && (
        <BulkUploadModal
          opened={bulkOpen}
          onClose={() => setBulkOpen(false)}
          eventId={eventId}
          eventName={eventName}
          fields={fields}
          onDone={load}
        />
      )}
      {eventId && (
        <AddAttendeeModal
          opened={addOpen}
          onClose={() => setAddOpen(false)}
          eventId={eventId}
          fields={fields}
          onDone={load}
        />
      )}
      <EditAttendeeModal attendeeId={editing} onClose={() => setEditing(null)} onSaved={load} />
    </AdminPage>
  )
}

function AddAttendeeModal({
  opened,
  onClose,
  eventId,
  fields,
  onDone,
}: {
  opened: boolean
  onClose: () => void
  eventId: string
  fields: CertificateField[]
  onDone: () => void
}) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const set = (key: string, value: string) => setValues((prev) => ({ ...prev, [key]: value }))

  const submit = async () => {
    setSaving(true)
    try {
      const { fullName, idNumber, email, phone, ...attributes } = values
      const { results } = await bulkUploadAttendees(eventId, [
        { row: 1, fullName, idNumber, email, phone, attributes },
      ])
      const [result] = results
      if (result.status === 'error') {
        notification.error({ message: result.message || 'No se pudo agregar' })
        return
      }
      notification.success({
        message:
          result.status === 'skipped'
            ? 'La persona ya estaba inscrita en este evento'
            : result.memberStatus === 'created'
              ? 'Persona creada e inscrita'
              : 'Miembro existente inscrito en el evento',
      })
      result.warnings.forEach((warning) =>
        notifications.show({ color: 'yellow', title: 'Atención', message: warning }),
      )
      setValues({})
      onDone()
      onClose()
    } catch {
      notification.error({ message: 'No se pudo agregar' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title={<Text fw={700}>Agregar persona</Text>} centered>
      <Stack gap="sm">
        <Text size="xs" c="dimmed">
          Si ya existe un miembro con ese documento o correo se usa ese; si no, se crea con su
          usuario (contraseña = número de identificación).
        </Text>
        {[...MEMBER_FIELDS, ...fields].map((field) => (
          <TextInput
            key={field.key}
            label={field.label}
            value={values[field.key] ?? ''}
            onChange={(e) => set(field.key, e.currentTarget.value)}
            required={['fullName', 'idNumber', 'email'].includes(field.key)}
          />
        ))}
        <Group justify="flex-end" mt="sm">
          <Button variant="default" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            color="brand"
            onClick={submit}
            loading={saving}
            disabled={!values.fullName || (!values.email && !values.idNumber)}
          >
            Agregar
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
