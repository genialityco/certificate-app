import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import {
  Badge,
  Button,
  Card,
  Group,
  Loader,
  Modal,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core'
import { IconPalette, IconPlus, IconSearch, IconUsers } from '@tabler/icons-react'

import { AdminPage } from '@/features/admin/AdminLayout'
import { ListPager, usePagedList } from '@/features/admin/ListPager'
import { EventNameLink } from '@/features/admin/format'
import { createEvent } from '@/services/api/certificateAdminService'
import notification from '@/utils/notification'

import { formatDate, useOrganizationEvents } from './useOrganizationEvents'

const normalize = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function EventsPage() {
  const { organizationId } = useParams()
  const { events } = useOrganizationEvents(organizationId)
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const base = `/admin/org/${organizationId}/events`

  const filtered = useMemo(
    () => (events ?? []).filter((event) => normalize(event.name).includes(normalize(search))),
    [events, search],
  )
  const pager = usePagedList(filtered, 10)
  const visible = pager.visible

  return (
    <AdminPage
      title="Eventos"
      description="Cada evento tiene un único certificado. Diseñalo y carga a las personas que pueden descargarlo."
      actions={
        <Button
          color="brand"
          leftSection={<IconPlus size={16} />}
          onClick={() => setCreateOpen(true)}
        >
          Crear evento
        </Button>
      }
    >
      <Card withBorder radius="md" padding="lg">
        <TextInput
          placeholder="Buscar evento"
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          mb="md"
          maw={360}
        />
        {events === null ? (
          <Loader color="brand" />
        ) : (
          <>
            <Table.ScrollContainer minWidth={760}>
              <Table highlightOnHover verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Evento</Table.Th>
                    <Table.Th>Fecha</Table.Th>
                    <Table.Th>Certificado</Table.Th>
                    <Table.Th ta="right">Asistentes</Table.Th>
                    <Table.Th ta="right">Descargas</Table.Th>
                    <Table.Th />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {visible.map((event) => (
                    <Table.Tr key={event._id}>
                      <Table.Td>
                        <EventNameLink eventId={event._id} name={event.name} />
                      </Table.Td>
                      <Table.Td>{formatDate(event.startDate)}</Table.Td>
                      <Table.Td>
                        {event.certificateId ? (
                          <Badge color="green" variant="light">
                            Listo
                          </Badge>
                        ) : (
                          <Badge color="gray" variant="light">
                            Sin diseño
                          </Badge>
                        )}
                      </Table.Td>
                      <Table.Td ta="right">{event.attendees.toLocaleString('es-CO')}</Table.Td>
                      <Table.Td ta="right">{event.downloads.toLocaleString('es-CO')}</Table.Td>
                      <Table.Td>
                        <Group gap="xs" justify="flex-end" wrap="nowrap">
                          <Button
                            component={Link}
                            to={`${base}/${event._id}/certificate`}
                            size="xs"
                            variant={event.certificateId ? 'default' : 'filled'}
                            color="brand"
                            leftSection={<IconPalette size={14} />}
                          >
                            {event.certificateId ? 'Editar diseño' : 'Crear certificado'}
                          </Button>
                          <Button
                            component={Link}
                            to={`${base}/${event._id}/attendees`}
                            size="xs"
                            variant="light"
                            color="brand"
                            leftSection={<IconUsers size={14} />}
                          >
                            Asistentes
                          </Button>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {!visible.length && (
                    <Table.Tr>
                      <Table.Td colSpan={6}>
                        <Text c="dimmed" ta="center" py="lg">
                          No hay eventos
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>

            <ListPager {...pager} noun="eventos" />
          </>
        )}
      </Card>

      {organizationId && (
        <CreateEventModal
          opened={createOpen}
          onClose={() => setCreateOpen(false)}
          organizationId={organizationId}
        />
      )}
    </AdminPage>
  )
}

const today = () => new Date().toISOString().slice(0, 10)

function CreateEventModal({
  opened,
  onClose,
  organizationId,
}: {
  opened: boolean
  onClose: () => void
  organizationId: string
}) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState(today())
  const [endDate, setEndDate] = useState(today())
  const [saving, setSaving] = useState(false)

  const datesInvalid = !startDate || !endDate || endDate < startDate

  const submit = async () => {
    setSaving(true)
    try {
      const event = await createEvent({
        organizationId,
        name: name.trim(),
        description: description.trim() || undefined,
        // Mediodía para que la zona horaria no cambie el día
        startDate: `${startDate}T12:00:00`,
        endDate: `${endDate}T12:00:00`,
      })
      notification.success({ message: 'Evento creado. Ahora diseña su certificado.' })
      onClose()
      navigate(`/admin/org/${organizationId}/events/${event._id}/certificate`)
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message
      notification.error({ message: message || 'No se pudo crear el evento' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title={<Text fw={700}>Crear evento</Text>} centered>
      <Stack gap="sm">
        <TextInput
          label="Nombre del evento"
          required
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
        />
        <Textarea
          label="Descripción"
          autosize
          minRows={2}
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
        />
        <Group grow>
          <TextInput
            type="date"
            label="Fecha de inicio"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.currentTarget.value)}
          />
          <TextInput
            type="date"
            label="Fecha de fin"
            required
            value={endDate}
            onChange={(e) => setEndDate(e.currentTarget.value)}
            error={endDate && startDate && endDate < startDate ? 'Antes del inicio' : undefined}
          />
        </Group>
        <Text size="xs" c="dimmed">
          Después de crearlo pasas al diseño del certificado y luego a cargar los asistentes.
        </Text>
        <Group justify="flex-end" mt="sm">
          <Button variant="default" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            color="brand"
            onClick={submit}
            loading={saving}
            disabled={!name.trim() || datesInvalid}
          >
            Crear y diseñar certificado
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
