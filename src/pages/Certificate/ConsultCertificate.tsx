/* eslint-disable @typescript-eslint/no-explicit-any */

/* eslint-disable react-hooks/exhaustive-deps */
import { FC, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import {
  ActionIcon,
  Box,
  Button,
  Card,
  Container,
  Group,
  Input,
  Text,
  useMantineTheme,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { IconCertificate, IconSearch } from '@tabler/icons-react'
import { debounce } from 'lodash'

import { searchAttendees } from '@/services/api/attendeeService'
import { fetchEventById } from '@/services/api/eventService'
import { searchMembers } from '@/services/api/memberService'
import notification from '@/utils/notification'

const ConsultCertificate: FC = (): JSX.Element => {
  const [inputValue, setInputValue] = useState<string>('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [eventData, setEventData] = useState<MyEvent | null>(null)
  const [loading, setLoading] = useState(false)

  const params = useParams()
  const navigate = useNavigate()
  const { eventId, certificateId } = params
  const theme = useMantineTheme()

  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`)

  useEffect(() => {
    if (eventId) fetchEventData()
  }, [eventId])

  const fetchEventData = async () => {
    try {
      const response = await fetchEventById(eventId)
      setEventData(response.data)
    } catch (error) {
      notification.error({ message: 'Error al obtener los datos' })
    }
  }

  const handleSearch = debounce(async (value: string) => {
    if (!eventId || value.length < 3) {
      setSearchResults([])
      return
    }

    const isNumeric = /^\d+$/.test(value)
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

    const filters = isNumeric
      ? { 'properties.idNumber': value, organizationId: eventData?.organizationId }
      : isEmail
        ? { 'properties.email': value, organizationId: eventData?.organizationId }
        : { 'properties.fullName': value, organizationId: eventData?.organizationId }

    setLoading(true)

    try {
      const memberData = await searchMembers(filters, { page: 1, limit: 5 })

      if (!memberData.data.items.length) {
        setSearchResults([])
        notification.error({ message: `No se encontraron resultados para "${value}"` })
        return
      }

      setSearchResults(memberData.data.items)
    } catch (error) {
      // notification.error({ message: 'Error al buscar los datos.' })
    } finally {
      setLoading(false)
    }
  }, 300)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    handleSearch(value)
  }

  const handleResultClick = async (memberId: string) => {
    try {
      const filtersAttendee = { memberId, eventId }
      const attendeeData = await searchAttendees(filtersAttendee)
      const attendee = attendeeData.data.items[0]

      if (attendee) {
        const userId = attendee.userId?._id || memberId
        navigate(`/certificate/${certificateId}/${userId}`, {
          state: { eventId },
        })
      } else {
        notification.error({
          message: 'No se encontró un certificado para el miembro seleccionado.',
        })
      }
    } catch (error) {
      notification.error({ message: 'Error al verificar el certificado.' })
    }
  }

  if (!eventData) return <Text>Cargando datos del evento...</Text>

  return (
    <Container
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: `url(${encodeURI(eventData.styles.eventImage)}) no-repeat center center`,
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
            Ingresa tu número de documento, nombre completo o correo electrónico para buscar tu
            certificado:
          </Text>
          <Group style={{ flexDirection: isMobile ? 'column' : 'row' }}>
            <Input
              placeholder="Número de documento, nombre o correo"
              radius="md"
              value={inputValue}
              onChange={handleInputChange}
              style={{ flex: '3', width: '100%' }}
            />
            <ActionIcon
              variant="filled"
              color="blue"
              onClick={() => handleSearch(inputValue)}
              style={{ flex: '0.5', width: '100%' }}
            >
              <IconSearch />
            </ActionIcon>
          </Group>
          {loading && (
            <Text size="sm" color="gray" mt="md">
              Cargando resultados...
            </Text>
          )}

          {searchResults.length > 0 && (
            <Box
              mt="md"
              style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '10px',
                maxWidth: 500, // para que en mobile no se "desborde"
                margin: '0 auto',
              }}
            >
              {searchResults.map((result) => (
                <Box
                  key={result._id}
                  style={{
                    padding: '10px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    gap: '1rem',
                  }}
                  onClick={() => handleResultClick(result._id)}
                >
                  <Box style={{ flex: 1 }}>
                    <Text fw={700}>{result.properties.fullName}</Text>
                    <Text size="xs" c="gray">
                      Documento: {result.properties.idNumber} | Correo: {result.properties.email}
                    </Text>
                  </Box>
                  <Button
                    size="xs"
                    color="blue"
                    leftSection={<IconCertificate size={16} />}
                    style={{ minWidth: isMobile ? '100%' : 140 }}
                    onClick={(e) => {
                      e.stopPropagation() // Evita doble navegación si hacen click al botón
                      handleResultClick(result._id)
                    }}
                  >
                    Ver mi certificado
                  </Button>
                </Box>
              ))}
            </Box>
          )}
        </Card>
      </Box>
    </Container>
  )
}

export { ConsultCertificate }
