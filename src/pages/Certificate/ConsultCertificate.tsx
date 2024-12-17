import { FC, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import {
  ActionIcon,
  Box,
  Card,
  Container,
  Group,
  Input,
  Select,
  Text,
  useMantineTheme,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { IconSearch } from '@tabler/icons-react'

import { searchAttendees } from '@/services/api/attendeeService'
import { fetchEventById } from '@/services/api/eventService'
import { searchMembers } from '@/services/api/memberService'
import notification from '@/utils/notification'

const ConsultCertificate: FC = (): JSX.Element => {
  const [inputValue, setInputValue] = useState<string>('')
  const [searchOption, setSearchOption] = useState<'idNumber' | 'fullName'>('idNumber')
  const [eventData, setEventData] = useState<MyEvent | null>(null)

  const params = useParams()
  const navigate = useNavigate()
  const { eventId, certificateId } = params
  const theme = useMantineTheme()

  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`)

  useEffect(() => {
    if (eventId) fetchEventData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  const fetchEventData = async () => {
    try {
      const response = await fetchEventById(eventId)
      setEventData(response.data)
    } catch (error) {
      notification.error({ message: 'Error al obtener los datos' })
    }
  }

  const handleSearch = async () => {
    if (!eventId) {
      notification.error({ message: 'No se ha seleccionado un evento' })
      return
    }

    // Filtro según la opción seleccionada
    const filtersMember =
      searchOption === 'idNumber'
        ? { 'properties.idNumber': inputValue }
        : { 'properties.fullName': { $regex: inputValue, $options: 'i' } }

    try {
      const memberData = await searchMembers(filtersMember)

      if (!memberData?.data?.items?.length) {
        notification.error({
          message: `No se encontró ningúna persona con ${
            searchOption === 'idNumber' ? 'ese número de identificación' : 'ese nombre'
          }.`,
        })
        return
      }

      const members = memberData.data.items

      for (const member of members) {
        const filtersAttendee = { memberId: member._id, eventId: eventId }
        const attendeeData = await searchAttendees(filtersAttendee)
        const attendee = attendeeData?.data?.items?.[0]

        if (attendee) {
          const userId = attendee?.userId?._id ? attendee.userId._id : member._id
          navigate(`/certificate/${certificateId}/${userId}`)
          return
        }
      }

      notification.error({
        message: 'No se encontró ningún certificado para los datos ingresados.',
      })
    } catch (error) {
      notification.error({ message: 'Error al buscar la información de la persona.' })
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
            Consulta tu certificado:
          </Text>
          <Group
            style={{
              flexDirection: isMobile ? 'column' : 'row',
            }}
          >
            <Select
              data={[
                { value: 'idNumber', label: 'Número de documento' },
                { value: 'fullName', label: 'Nombres y apellidos' },
              ]}
              placeholder="Selecciona una opción"
              value={searchOption}
              onChange={(value) => setSearchOption(value as 'idNumber' | 'fullName')}
              style={{ flex: '1', width: '100%' }}
            />
            <Input
              placeholder={searchOption === 'idNumber' ? 'Número de documento' : 'Nombre completo'}
              radius="md"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              style={{ flex: '3', width: '100%' }}
            />
            <ActionIcon
              variant="filled"
              color="blue"
              onClick={handleSearch}
              style={{ flex: '0.5', width: '100%' }}
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
