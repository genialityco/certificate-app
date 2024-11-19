import { FC, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import {
  ActionIcon,
  Box,
  Button,
  Card,
  Checkbox,
  Container,
  Divider,
  Flex,
  Group,
  Modal,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { IconAdFilled, IconTrash } from '@tabler/icons-react'

import { searchCertificates } from '@/services/api/certificateService'
import { Event, createEvent, deleteEvent, searchEvents } from '@/services/api/eventService'

const Dashboard: FC = (): JSX.Element => {
  const location = useLocation()
  const { propertiesDefinition } = location.state || {}
  const { organizationId } = useParams()
  const [events, setEvents] = useState<MyEvent[]>([])
  const [properties, setProperties] = useState<UserProperty[]>(
    propertiesDefinition ? propertiesDefinition : [],
  )
  const [certificates, setCertificates] = useState<Record<string, Certificate | null>>({})
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    name: '',
    organizationId,
  })

  const navigate = useNavigate()

  useEffect(() => {
    fetchEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchEvents = async () => {
    const filters = { organizationId }
    const response = await searchEvents(filters)
    const data = response.data.items
    setEvents(data as MyEvent[])
    data.forEach((event: MyEvent) => {
      checkCertificate(event._id)
    })
  }

  const checkCertificate = async (eventId: string) => {
    const filters = { eventId }
    const response = await searchCertificates(filters)
    if (response && response.data?.length > 0) {
      setCertificates((prevCertificates) => ({
        ...prevCertificates,
        [eventId]: response.data[0] as unknown as Certificate | null,
      }))
    } else {
      setCertificates((prevCertificates) => ({
        ...prevCertificates,
        [eventId]: null,
      }))
    }
  }

  const handleCreateCertificate = async () => {
    try {
      await createEvent(newEvent as Event)
      setIsModalOpen(false)
      fetchEvents()
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creando evento:', error)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId)
      fetchEvents()
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error eliminando evento:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setNewEvent((prevEvent) => ({
      ...prevEvent,
      [field]: value,
    }))
  }

  const handleUserPropertyChange = (index: number, field: string, value: string | boolean) => {
    const updatedProperties = [...properties]
    updatedProperties[index] = {
      ...updatedProperties[index],
      [field]: value,
    }
    setProperties(updatedProperties)
  }

  const handleLabelChange = (index: number, value: string) => {
    const updatedProperties = [...properties]
    updatedProperties[index].label = value
    updatedProperties[index].name = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ /g, '')
      .replace(/[^\w]/g, '')

    setProperties(updatedProperties)
  }

  const handleAddUserProperty = () => {
    const newProperty: UserProperty = {
      label: '',
      name: '',
      type: 'text',
      mandatory: false,
    }
    setProperties([...properties, newProperty])
  }

  const handleRemoveUserProperty = (index: number) => {
    const updatedProperties = properties.filter((_, i) => i !== index)
    setProperties(updatedProperties)
  }

  return (
    <Container>
      <Group justify="space-between" mt="md">
        <h1>Administrar certificados</h1>
        <Button onClick={() => setIsModalOpen(true)} leftSection={<IconAdFilled />}>
          Crear nuevo certificado
        </Button>
      </Group>

      <SimpleGrid cols={3} spacing="md" mt="md">
        {events.map((event) => (
          <Card
            key={event._id}
            shadow="md"
            padding="lg"
            withBorder
            style={{ position: 'relative' }}
          >
            <Text size="lg">{event.name}</Text>
            <Button
              mt="md"
              fullWidth
              onClick={() =>
                navigate(`/event/${event._id}/certificate/${certificates[event._id]?._id}`)
              }
            >
              Ir a la landing
            </Button>
            {certificates?.[event._id] ? (
              <Button
                mt="md"
                fullWidth
                onClick={() =>
                  navigate(
                    `/design/${event._id}/?certificateId=${certificates[event._id]?._id}&organizationId=${organizationId}`,
                  )
                }
              >
                Editar certificado
              </Button>
            ) : (
              <Button
                mt="md"
                fullWidth
                onClick={() => navigate(`/design/${event._id}?organizationId=${organizationId}`)}
              >
                Crear certificado
              </Button>
            )}
            <Button mt="md" fullWidth onClick={() => navigate(`/event/users/${event._id}`)}>
              Gestionar usuarios
            </Button>
            <ActionIcon
              c="red"
              variant="white"
              size="lg"
              style={{ position: 'absolute', top: '16px', right: '16px' }}
              onClick={() => handleDeleteEvent(event._id)}
            >
              <IconTrash size={18} />
            </ActionIcon>
          </Card>
        ))}
      </SimpleGrid>

      {/* Modal para crear un nuevo certificado */}
      <Modal
        opened={isModalOpen}
        size="lg"
        onClose={() => setIsModalOpen(false)}
        title="Crear nuevo certificado"
      >
        <Stack m="lg">
          <TextInput
            label="Nombre del certificado"
            placeholder="Certificado laboral, asistencia, etc."
            value={newEvent.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
          />

          <Divider label="Propiedades de usuario" />

          {properties?.map((property, index) => (
            <Flex key={index} gap="md" justify="space-between" align="center" wrap="nowrap">
              <Box style={{ flex: 3 }}>
                <TextInput
                  label="Label"
                  placeholder="Ej: Código Postal"
                  value={property.label}
                  onChange={(e) => handleLabelChange(index, e.target.value)}
                  withAsterisk
                />
              </Box>
              <Box style={{ flex: 3 }}>
                <TextInput
                  label="Name"
                  placeholder="Nombre autogenerado"
                  value={property.name}
                  disabled
                />
              </Box>
              <Box style={{ flex: 1 }}>
                <Checkbox
                  label="Obligatorio"
                  checked={property.mandatory}
                  onChange={(e) =>
                    handleUserPropertyChange(index, 'mandatory', e.currentTarget.checked)
                  }
                />
              </Box>
              <Box style={{ flex: 'none' }}>
                <ActionIcon c="red" variant="light" onClick={() => handleRemoveUserProperty(index)}>
                  <IconTrash size={18} />
                </ActionIcon>
              </Box>
            </Flex>
          ))}

          <Button
            onClick={handleAddUserProperty}
            leftSection={<IconAdFilled size={16} />}
            fullWidth
            variant="outline"
          >
            Añadir nueva propiedad
          </Button>

          <Group justify="flex-start" mt="md">
            <Button onClick={handleCreateCertificate}>Crear certificado</Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  )
}

export { Dashboard }
