/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import {
  Alert,
  Badge,
  Button,
  Card,
  Code,
  Container,
  CopyButton,
  Group,
  List,
  Loader,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { IconAlertTriangle, IconCheck, IconCopy, IconPlugConnected } from '@tabler/icons-react'

import { searchCertificates } from '@/services/api/certificateService'
import { fetchEventById } from '@/services/api/eventService'
import { fetchOrganizationById } from '@/services/api/organizationService'

interface OrgProperty {
  name: string
  label: string
  type?: string
  required?: boolean
  show?: boolean
}

// URL pública de integración del evento. Es la propia URL de esta página: lleva
// embebidos organizationId y eventId, que es exactamente lo que Gen Live
// necesita para apuntar sus certificados a ESTE evento (en vez de aprovisionar
// uno nuevo automáticamente) y para montar aquí a los inscritos.
const buildIntegrationUrl = (organizationId: string, eventId: string) =>
  `${window.location.origin}/integracion/${organizationId}/${eventId}`

const EventIntegration: FC = (): JSX.Element => {
  const { organizationId, eventId } = useParams()

  const [event, setEvent] = useState<any>(null)
  const [organization, setOrganization] = useState<any>(null)
  const [certificate, setCertificate] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!organizationId || !eventId) return

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [eventRes, orgRes, certRes] = await Promise.all([
          fetchEventById(eventId),
          fetchOrganizationById(organizationId),
          searchCertificates({ eventId }).catch(() => null),
        ])
        setEvent(eventRes?.data ?? null)
        setOrganization(orgRes?.data ?? null)
        setCertificate(certRes?.data?.length ? certRes.data[0] : null)
      } catch (err) {
        setError('No se pudo cargar el evento. Verifica que la URL sea correcta.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [organizationId, eventId])

  if (!organizationId || !eventId) {
    return (
      <Container py="xl">
        <Alert color="red" title="URL incompleta">
          La URL de integración debe tener la forma /integracion/:organizationId/:eventId
        </Alert>
      </Container>
    )
  }

  const integrationUrl = buildIntegrationUrl(organizationId, eventId)
  const properties: OrgProperty[] = organization?.propertiesDefinition ?? []

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Group gap="xs">
          <IconPlugConnected size={28} />
          <Title order={2}>Integración con Gen Live</Title>
        </Group>

        {loading && (
          <Group gap="xs">
            <Loader size="sm" />
            <Text c="dimmed">Cargando datos del evento…</Text>
          </Group>
        )}

        {error && (
          <Alert color="red" title="Error" icon={<IconAlertTriangle size={18} />}>
            {error}
          </Alert>
        )}

        {!loading && !error && (
          <>
            <Card withBorder radius="md" padding="lg">
              <Stack gap="xs">
                <Text size="sm" c="dimmed">
                  Evento
                </Text>
                <Title order={3}>{event?.name ?? '(evento sin nombre)'}</Title>
                <Text size="sm" c="dimmed">
                  Organización: {organization?.name ?? '(sin nombre)'}
                </Text>
                <Group gap="xs" mt="xs">
                  {certificate ? (
                    <Badge color="green" leftSection={<IconCheck size={12} />}>
                      Diseño de certificado listo
                    </Badge>
                  ) : (
                    <Badge color="yellow">Sin diseño de certificado</Badge>
                  )}
                </Group>
              </Stack>
            </Card>

            <Card withBorder radius="md" padding="lg">
              <Stack gap="sm">
                <div>
                  <Title order={4}>URL pública para Gen Live</Title>
                  <Text size="sm" c="dimmed">
                    Cópiala y pégala en Gen Live, en el panel del evento →{' '}
                    <b>
                      Control → Certificados de asistencia → Vincular evento de Gen Certificados
                    </b>
                    . A partir de ahí los inscritos de ese evento en vivo se montan en este evento
                    de certificados.
                  </Text>
                </div>

                <Group align="flex-end" gap="xs" wrap="nowrap">
                  <TextInput
                    readOnly
                    value={integrationUrl}
                    style={{ flex: 1 }}
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <CopyButton value={integrationUrl} timeout={2000}>
                    {({ copied, copy }) => (
                      <Button
                        color={copied ? 'teal' : 'blue'}
                        onClick={copy}
                        leftSection={copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                      >
                        {copied ? 'Copiada' : 'Copiar'}
                      </Button>
                    )}
                  </CopyButton>
                </Group>

                <Text size="xs" c="dimmed">
                  organizationId: <Code>{organizationId}</Code> · eventId: <Code>{eventId}</Code>
                </Text>
              </Stack>
            </Card>

            {!certificate && (
              <Alert
                color="yellow"
                title="Este evento todavía no tiene diseño de certificado"
                icon={<IconAlertTriangle size={18} />}
              >
                Los inscritos se montarán igual, pero no podrán descargar nada hasta que crees el
                diseño desde el panel de la organización.
              </Alert>
            )}

            <Card withBorder radius="md" padding="lg">
              <Stack gap="sm">
                <div>
                  <Title order={4}>Atributos disponibles en el diseño</Title>
                  <Text size="sm" c="dimmed">
                    Son las propiedades de la organización que el editor puede insertar en el
                    certificado. Gen Live envía siempre <Code>fullName</Code> y <Code>email</Code>,
                    más los campos del formulario de inscripción tal como estén nombrados allá — si
                    quieres usar alguno más en el diseño, agrégalo aquí con el mismo nombre.
                  </Text>
                </div>

                {properties.length > 0 ? (
                  <Table striped withTableBorder>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Nombre (clave)</Table.Th>
                        <Table.Th>Etiqueta</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {properties.map((property) => (
                        <Table.Tr key={property.name}>
                          <Table.Td>
                            <Code>{property.name}</Code>
                          </Table.Td>
                          <Table.Td>{property.label}</Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                ) : (
                  <Text size="sm" c="dimmed">
                    Esta organización aún no tiene propiedades definidas.
                  </Text>
                )}
              </Stack>
            </Card>

            <Card withBorder radius="md" padding="lg">
              <Stack gap="xs">
                <Title order={4}>Cómo funciona</Title>
                <List size="sm" spacing="xs">
                  <List.Item>Copia la URL de arriba.</List.Item>
                  <List.Item>
                    En Gen Live, abre el evento → pestaña Control → Certificados de asistencia,
                    activa el switch y pega la URL.
                  </List.Item>
                  <List.Item>
                    Usa <b>Montar inscritos en Gen Certificados</b> para insertar aquí a todos los
                    inscritos del evento en vivo.
                  </List.Item>
                  <List.Item>
                    Los asistentes aparecerán en <b>Gestionar asistentes</b> de este evento y podrán
                    descargar su certificado.
                  </List.Item>
                </List>
              </Stack>
            </Card>
          </>
        )}
      </Stack>
    </Container>
  )
}

export { EventIntegration }
