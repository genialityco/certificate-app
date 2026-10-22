import { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Badge, Button, Card, Group, Loader, SimpleGrid, Table, Text } from '@mantine/core'
import {
  IconCalendarEvent,
  IconCertificate,
  IconDownload,
  IconUsers,
  IconWorld,
} from '@tabler/icons-react'

import { AdminPage } from '@/features/admin/AdminLayout'
import { EventNameLink } from '@/features/admin/format'

import { formatDate, useOrganizationEvents } from './useOrganizationEvents'

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: ReactNode
  icon: ReactNode
  color: string
}) {
  return (
    <Card withBorder radius="md" padding="md" style={{ borderTop: `4px solid ${color}` }}>
      <Group gap="md" wrap="nowrap">
        <div style={{ color }}>{icon}</div>
        <div>
          <Text fz={26} fw={800} lh={1.1}>
            {value}
          </Text>
          <Text size="sm" c="dimmed">
            {label}
          </Text>
        </div>
      </Group>
    </Card>
  )
}

export function OrganizationDashboard() {
  const { organizationId } = useParams()
  const { events } = useOrganizationEvents(organizationId)
  const base = `/admin/org/${organizationId}`

  const withCertificate = events?.filter((e) => e.certificateId) ?? []
  const totals = (events ?? []).reduce(
    (acc, e) => ({
      attendees: acc.attendees + e.attendees,
      downloads: acc.downloads + e.downloads,
      downloaders: acc.downloaders + e.downloaders,
    }),
    { attendees: 0, downloads: 0, downloaders: 0 },
  )
  const loading = events === null
  const show = (value: number) =>
    loading ? <Loader size="xs" color="brand" /> : value.toLocaleString('es-CO')

  return (
    <AdminPage title="Dashboard" description="Resumen de certificados de la organización">
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="lg">
        <StatCard
          label="Eventos"
          value={show(events?.length ?? 0)}
          icon={<IconCalendarEvent size={30} />}
          color="#4d93d0"
        />
        <StatCard
          label="Con certificado"
          value={show(withCertificate.length)}
          icon={<IconCertificate size={30} />}
          color="#86bae6"
        />
        <StatCard
          label="Asistentes certificables"
          value={show(totals.attendees)}
          icon={<IconUsers size={30} />}
          color="#f39d52"
        />
        <StatCard
          label={`Descargas (${totals.downloaders.toLocaleString('es-CO')} personas)`}
          value={show(totals.downloads)}
          icon={<IconDownload size={30} />}
          color="#fbc48e"
        />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, lg: 3 }} mb="lg">
        {[
          {
            title: 'Diseñar certificados',
            text: 'Sube la imagen del evento y ubica los textos y datos de las personas.',
            to: `${base}/events`,
            cta: 'Ir a eventos',
          },
          {
            title: 'Consultar miembros',
            text: 'Busca a una persona, revisa sus certificados y corrige sus datos.',
            to: `${base}/members`,
            cta: 'Ir a miembros',
          },
          {
            title: 'Página pública',
            text: 'Donde cada persona busca y descarga sus certificados.',
            to: `/consulta/${organizationId}`,
            cta: 'Abrir consulta',
            external: true,
          },
        ].map((action) => (
          <Card key={action.title} withBorder radius="md" padding="lg" bg="#fff">
            <Text fw={700} size="lg">
              {action.title}
            </Text>
            <Text c="dimmed" size="sm" mt={6} mb="md">
              {action.text}
            </Text>
            <Button
              component={Link}
              to={action.to}
              target={action.external ? '_blank' : undefined}
              color="brand"
              leftSection={action.external ? <IconWorld size={16} /> : undefined}
              w="fit-content"
            >
              {action.cta}
            </Button>
          </Card>
        ))}
      </SimpleGrid>

      <Card withBorder radius="md" padding="lg">
        <Text fw={700} size="lg" mb="sm">
          Eventos con más descargas
        </Text>
        {loading ? (
          <Loader color="brand" />
        ) : (
          <Table.ScrollContainer minWidth={600}>
            <Table highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Evento</Table.Th>
                  <Table.Th>Fecha</Table.Th>
                  <Table.Th>Certificado</Table.Th>
                  <Table.Th ta="right">Asistentes</Table.Th>
                  <Table.Th ta="right">Descargas</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {[...(events ?? [])]
                  .sort((a, b) => b.downloads - a.downloads)
                  .slice(0, 8)
                  .map((event) => (
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
                    </Table.Tr>
                  ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Card>
    </AdminPage>
  )
}
