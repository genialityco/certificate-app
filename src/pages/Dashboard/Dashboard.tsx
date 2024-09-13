import { FC, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

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

import { ApiServices } from '@/services'

const Dashboard: FC = (): JSX.Element => {
  const [events, setEvents] = useState<MyEvent[]>([])
  const [certificates, setCertificates] = useState<Record<string, Certificate | null>>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const apiServices = new ApiServices()

  // Inicializar userProperties por defecto
  const defaultUserProperties: UserProperty[] = [
    { label: 'Numero Documento', name: 'numeroDocumento', type: 'text', mandatory: true },
    { label: 'Nombres Y Apellidos', name: 'names', type: 'text', mandatory: true },
    { label: 'Número de teléfono', name: 'numeroDeTelefono', type: 'text', mandatory: false },
    { label: 'Correo', name: 'email', type: 'email', mandatory: true },
  ]

  const [newEvent, setNewEvent] = useState<Partial<MyEvent>>({
    name: '',
    organization: '66d716d965613bac834484dd',
    userProperties: defaultUserProperties,
  })

  const navigate = useNavigate()

  useEffect(() => {
    fetchEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchEvents = async () => {
    const response = await apiServices.fetchAllEvents()
    setEvents(response as MyEvent[])
    response.forEach((event: MyEvent) => {
      checkCertificate(event._id)
    })
  }

  const checkCertificate = async (eventId: string) => {
    const filters = { event: eventId }
    const response = await apiServices.fetchFilteredGlobal('Certificate', filters)
    if (response && response.length > 0) {
      setCertificates((prevCertificates) => {
        const updatedCertificates: Record<string, Certificate | null> = {
          ...prevCertificates,
          [eventId]: response[0] as unknown as Certificate | null,
        }
        return updatedCertificates
      })
    } else {
      setCertificates((prevCertificates) => ({
        ...prevCertificates,
        [eventId]: null,
      }))
    }
  }

  const handleCreateCertificate = async () => {
    try {
      const event: Event = { ...newEvent } as Event
      await apiServices.createEvent(event)
      setIsModalOpen(false)
      fetchEvents()
    } catch (error) {
      throw new Error('Error creando evento:', error as ErrorOptions)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await apiServices.deleteEvent(eventId)
      fetchEvents()
    } catch (error) {
      throw new Error('Error eliminando evento:', error as ErrorOptions)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setNewEvent((prevEvent) => ({
      ...prevEvent,
      [field]: value,
    }))
  }

  const handleUserPropertyChange = (index: number, field: string, value: string | boolean) => {
    const updatedUserProperties = [...(newEvent.userProperties || [])]
    updatedUserProperties[index] = {
      ...updatedUserProperties[index],
      [field]: value,
    }
    setNewEvent({ ...newEvent, userProperties: updatedUserProperties })
  }

  const handleLabelChange = (index: number, value: string) => {
    const updatedUserProperties = [...(newEvent.userProperties || [])]

    updatedUserProperties[index].label = value
    updatedUserProperties[index].name = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ /g, '')
      .replace(/[^\w]/g, '')

    setNewEvent((prevEvent) => ({
      ...prevEvent,
      userProperties: updatedUserProperties,
    }))
  }

  const handleAddUserProperty = () => {
    const newProperty: UserProperty = {
      label: '',
      name: '',
      type: 'text',
      mandatory: false,
    }
    setNewEvent((prevEvent) => ({
      ...prevEvent,
      userProperties: [...(newEvent.userProperties || []), newProperty],
    }))
  }

  const handleRemoveUserProperty = (index: number) => {
    const updatedUserProperties = (newEvent.userProperties || []).filter((_, i) => i !== index)
    setNewEvent((prevEvent) => ({
      ...prevEvent,
      userProperties: updatedUserProperties,
    }))
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
                  navigate(`/design/${event._id}/?certificateId=${certificates[event._id]?._id}`)
                }
              >
                Editar certificado
              </Button>
            ) : (
              <Button mt="md" fullWidth onClick={() => navigate(`/design/${event._id}`)}>
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

          {newEvent.userProperties?.map((property, index) => (
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
