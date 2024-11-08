import { FC, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import {
  ActionIcon,
  Box,
  Card,
  Container,
  Group,
  Input,
  Text,
  useMantineTheme,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { IconSearch } from '@tabler/icons-react'

import { ApiServices } from '@/services'
import notification from '@/utils/notification'

const ConsultCertificate: FC = (): JSX.Element => {
  const [inputValue, setInputValue] = useState<string>('')
  const [eventData, setEventData] = useState<MyEvent | null>(null)
  const params = useParams()
  const navigate = useNavigate()
  const { eventId, certificateId } = params
  const apiServices = useMemo(() => new ApiServices(), [])
  const theme = useMantineTheme()

  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`)

  useEffect(() => {
    if (eventId) {
      apiServices.fetchEventById(eventId as string).then((data: MyEvent) => {
        setEventData(data)
      })
    }
  }, [apiServices, eventId])

  const handleSearch = async () => {
    if (!eventId) {
      notification.error({ message: 'No se ha seleccionado un evento' })
      return
    }

    const filters = { 'properties.numeroDocumento': inputValue, event: eventId }
    const data = await apiServices.fetchFilteredGlobal('Attendee', filters)
    const user = data[0]
    if (user) {
      navigate(`/certificate/${certificateId}/${user._id}`)
    } else {
      notification.error({ message: 'No se encontró el usuario' })
    }
  }

  if (!eventData) {
    return <Text>Cargando datos del evento...</Text>
  }

  return (
    <Container
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: `url(${eventData.styles.eventImage}) no-repeat center center`,
        backgroundSize: 'cover',
        backgroundPosition: 'top',
      }}
      fluid
    >
      <Box
        px="xl"
        py="lg"
        style={{
          width: isMobile ? '100%' : '80%',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          borderRadius: '10px',
        }}
      >
        <Group justify="center">
          <Text size="xl" c="white" mt="lg">
            ¡Bienvenido! Consulta y descarga tu certificado del evento: {eventData.name}
          </Text>
        </Group>

        <Card withBorder shadow="sm" mt="xl" padding="lg">
          <Text size="md" mb="md">
            Para consultar, ingresa tu número de documento
          </Text>
          <Group>
            <Input
              placeholder="Número de documento"
              radius="md"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              style={{ width: '80%' }}
            />
            <ActionIcon
              variant="filled"
              color="blue"
              onClick={handleSearch}
              style={{ width: '10%' }}
            >
              <IconSearch />
            </ActionIcon>
          </Group>
        </Card>
      </Box>
    </Container>
  )
}

export { ConsultCertificate }
