/* eslint-disable @typescript-eslint/no-explicit-any */

/* eslint-disable react-hooks/exhaustive-deps */
import { FC, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Box, Button, Card, Container, Group, Input, Text, useMantineTheme } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { IconCertificate } from '@tabler/icons-react'
import { debounce } from 'lodash'

import { searchAttendees } from '@/services/api/attendeeService'
import { fetchEventById } from '@/services/api/eventService'
import notification from '@/utils/notification'

interface Attendee {
  _id: string
  memberId: {
    _id: string
    properties: {
      fullName: string
      idNumber: string
      email: string
    }
  }
}

interface MyEvent {
  _id: string
  name: string
  styles: {
    eventImage: string
  }
}

const ConsultCertificate: FC = (): JSX.Element => {
  const [inputValue, setInputValue] = useState<string>('')
  const [searchResults, setSearchResults] = useState<Attendee[]>([])
  const [eventData, setEventData] = useState<MyEvent | null>(null)
  const [loading, setLoading] = useState(false)
  const [showFullResults, setShowFullResults] = useState(false)

  const params = useParams()
  const navigate = useNavigate()
  const { eventId } = params
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

  const handleSearch = debounce(async (value: string, isFromButton = false) => {
    if (!eventId || value.length < 3) {
      setSearchResults([])
      setShowFullResults(false)
      return
    }

    const isNumeric = /^\d+$/.test(value)
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

    let filters: any = {}

    if (isNumeric) {
      filters = {
        'filters[0][field]': 'memberId.properties.idNumber',
        'filters[0][operator]': 'eq',
        'filters[0][value]': value,
      }
    } else if (isEmail) {
      filters = {
        'filters[0][field]': 'memberId.properties.email',
        'filters[0][operator]': 'contains',
        'filters[0][value]': value,
      }
    } else {
      filters = {
        'filters[0][field]': 'memberId.properties.fullName',
        'filters[0][operator]': 'contains',
        'filters[0][value]': value,
      }
    }

    setLoading(true)

    try {
      const memberData = await searchAttendees(
        Object.assign(filters, { eventId: eventId, page: 1, limit: 20 }),
      )
      //console.log("memberData", memberData.data.items)
      setSearchResults(memberData.data.items)
      setShowFullResults(isFromButton)
    } catch (error) {
      notification.error({ message: 'Error al buscar los datos.' })
    } finally {
      setLoading(false)
    }
  }, 300)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    setShowFullResults(false)
    handleSearch(value, false)
  }

  const handleResultClick = async (atendee: any) => {
    try {
      console.log('member', atendee)
      navigate(`/certificate/${atendee._id}/${atendee.memberId._id}`, {
        state: { eventId },
      })
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
            {/* <ActionIcon
              variant="filled"
              color="blue"
              onClick={() => handleSearch(inputValue, true)}
              style={{ flex: '0.5', width: '100%' }}
              disabled={searchResults.length < 7 && searchResults.length > 0}
            >
              <IconSearch />
            </ActionIcon> */}
          </Group>
          {loading && (
            <Text size="sm" color="gray" mt="md">
              Cargando resultados...
            </Text>
          )}
          {inputValue.length >= 3 && searchResults.length === 0 && !loading && (
            <Text size="sm" color="gray" mt="md">
              No se encontraron resultados para "{inputValue}"
            </Text>
          )}

          {/* Lista de sugerencias cuando hay 3 o más caracteres - solo al escribir */}
          {inputValue.length >= 3 && searchResults.length > 0 && !showFullResults && (
            <Box
              mt="lg"
              style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '10px',
                border: '1px solid #ddd',
                maxHeight: '500px',
                overflowY: 'auto',
              }}
            >
              {searchResults.slice(0, 7).map((result) => (
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
                    transition: 'background-color 0.2s',
                  }}
                  onClick={() => handleResultClick(result)}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                >
                  <Box style={{ flex: 1 }}>
                    <Text fw={700}>{result.memberId.properties.fullName}</Text>
                    <Text size="xs" c="gray">
                      Documento: {result.memberId.properties.idNumber} | Correo:{' '}
                      {result.memberId.properties.email}
                    </Text>
                  </Box>
                  <Button
                    size="xs"
                    color="blue"
                    leftSection={<IconCertificate size={16} />}
                    style={{ minWidth: isMobile ? '100%' : 140 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleResultClick(result)
                    }}
                  >
                    Ver mi certificado
                  </Button>
                </Box>
              ))}
            </Box>
          )}

          {/* Lista completa de resultados - solo cuando se hace click en buscar */}
          {/* {searchResults.length > 0 && inputValue.length >= 3 && showFullResults && (
            <Box
              mt="lg"
              style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '10px',
                overflowX: 'scroll',
                maxHeight: 500,
              }}
            >
              <Text fw={600} mb="sm">
                Todos los resultados encontrados:
              </Text>
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
                  onClick={() => handleResultClick(result)}
                >
                  <Box style={{ flex: 1 }}>
                    <Text fw={700}>{result.memberId.properties.fullName}</Text>
                    <Text size="xs" c="gray">
                      Documento: {result.memberId.properties.idNumber} | Correo:{' '}
                      {result.memberId.properties.email}
                    </Text>
                  </Box>
                  <Button
                    size="xs"
                    color="blue"
                    leftSection={<IconCertificate size={16} />}
                    style={{ minWidth: isMobile ? '100%' : 140 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleResultClick(result)
                    }}
                  >
                    Ver mi certificado
                  </Button>
                </Box>
              ))}
            </Box>
          )} */}
        </Card>
      </Box>
    </Container>
  )
}

export { ConsultCertificate }
