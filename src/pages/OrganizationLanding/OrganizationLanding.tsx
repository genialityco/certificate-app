/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  Box,
  Button,
  Card,
  Center,
  Container,
  Flex,
  Group,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import { debounce } from 'lodash'

import { searchMembers } from '@/services/api/memberService'

const OrganizationLanding: FC = () => {
  const [attended, setAttended] = useState('')
  const [membersResults, setMembersResults] = useState<any[]>([])
  const [searchError, setSearchError] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [countdown, setCountdown] = useState(5)

  const navigate = useNavigate()

  useEffect(() => {
    if (membersResults.length === 1) {
      const interval = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)

      if (countdown === 0) {
        navigate(`/user-detail/${membersResults[0]._id}`)
      }

      return () => clearInterval(interval)
    }
  }, [countdown, membersResults, navigate])

  const handleSearch = debounce(async () => {
    try {
      setIsSearching(true)
      setSearchError('')
      setMembersResults([])

      const isNumeric = /^\d+$/.test(attended)
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(attended)

      const filters = isNumeric
        ? { 'properties.idNumber': attended }
        : isEmail
          ? { 'properties.email': attended }
          : { 'properties.fullName': attended }

      const memberData = await searchMembers(filters, { page: 1, limit: 5 })
      const items = memberData?.data?.items ?? []

      if (items.length === 0) {
        setSearchError('No se encontró ningún registro.')
      } else {
        setMembersResults(items)
        if (items.length === 1) {
          setCountdown(3)
        }
      }
    } catch (error) {
      setSearchError('Ha ocurrido un error al buscar miembros.')
    } finally {
      setIsSearching(false)
    }
  }, 300)

  return (
    <>
      <div
        style={{
          width: '100%',
          padding: '15px 0',
          backgroundColor: '#f8f9fa',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 1000,
          borderBottom: '1px solid #ddd',
        }}
      >
        <Container size="xl">
          <Group justify="space-between">
            <Group>
              <img
                src="https://ik.imagekit.io/6cx9tc1kx/LOGOSIMBOLO_ASOCIACION.png?updatedAt=1727378755557"
                height={40}
                alt="Logo de la organización"
              />
              <Title order={3} style={{ margin: 0 }}>
                Asociación Colombiana de Hematología y Oncología (ACHO)
              </Title>
            </Group>
          </Group>
        </Container>
      </div>

      <Container size="sm" style={{ marginTop: 180 }}>
        <Center>
          <Title order={2}>Busca tu Certificado</Title>
        </Center>
        <Center mt="md">
          <Text size="sm" c="dimmed" ta="center">
            Ingresa tu cédula, correo o nombre para buscar tu certificado.
          </Text>
        </Center>

        <Center mt="xl">
          <Box style={{ width: '100%', maxWidth: 400 }}>
            <TextInput
              label="Cédula, Email o Nombre"
              placeholder="Ej: 12345678, usuario@correo.com o Pedro Perez"
              value={attended}
              onChange={(e) => setAttended(e.currentTarget.value)}
              mb="md"
            />
            <Button
              fullWidth
              onClick={handleSearch}
              leftSection={<IconSearch size={16} />}
              loading={isSearching}
            >
              Buscar
            </Button>
          </Box>
        </Center>

        {searchError && (
          <Center mt="xl">
            <Text color="red">{searchError}</Text>
          </Center>
        )}

        {membersResults.length === 1 && (
          <Center mt="xl">
            <Text>Redirigiendo en {countdown} segundos...</Text>
          </Center>
        )}

        {membersResults.length > 1 && (
          <Container mt="xl">
            <Title order={4} mb="sm">
              Selecciona tu nombre:
            </Title>
            {membersResults.map((member) => {
              const { _id, properties } = member
              return (
                <Card
                  key={_id}
                  shadow="sm"
                  p="lg"
                  mb="md"
                  onClick={() => navigate(`/user-detail/${_id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <Text size="sm" fw={500}>
                    {properties?.fullName}
                  </Text>
                  <Text size="xs" color="dimmed">
                    Documento: {properties?.idNumber} | Correo: {properties?.email}
                  </Text>
                </Card>
              )
            })}
          </Container>
        )}
      </Container>

      <footer
        style={{
          backgroundColor: '#f8f9fa',
          padding: '20px 0',
          marginTop: '50px',
          borderTop: '1px solid #ddd',
        }}
      >
        <Container size="xl">
          <Flex justify="space-around">
            <Box>
              <Title order={5} mb="xs">
                Líneas de atención móviles
              </Title>
              <Text size="sm">Asistente Gerencia: 317 427 0640</Text>
              <Text size="sm">Recertificación: 316 473 4021</Text>
              <Text size="sm">Eventos: 318 351 4415</Text>
              <Text size="sm">Contabilidad: 315 359 9597</Text>
            </Box>

            <Box>
              <Title order={5} mb="xs">
                Información de contacto
              </Title>
              <Text size="sm">Tel: +57 (601) 745 0664</Text>
              <Text size="sm">Cra 7A No. 123-25, Piso 3</Text>
              <Text size="sm">Bogotá D.C – Colombia</Text>
              <Text size="sm">Correo: info@acho.com.co</Text>
              <Text size="sm">lineaetica@acho.com.co</Text>
            </Box>
          </Flex>

          <Center mt="lg">
            <Flex align="center" gap="5px">
              <img
                src="https://ik.imagekit.io/6cx9tc1kx/LOGOS_GEN.iality_web-15.svg?updatedAt=1727378741215"
                alt="Geniality"
                style={{ height: 20 }}
              />
              <Text size="sm" c="dimmed">
                Geniality
              </Text>
            </Flex>
          </Center>
        </Container>
      </footer>
    </>
  )
}

export { OrganizationLanding }
