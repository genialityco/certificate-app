/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import {
  Alert,
  Button,
  Card,
  Center,
  Container,
  Divider,
  Group,
  Loader,
  Text,
  Title,
} from '@mantine/core'
import { showNotification } from '@mantine/notifications'
import {
  IconAlertCircle,
  IconArrowLeft,
  IconCertificate,
  IconId,
  IconMail,
} from '@tabler/icons-react'

import { searchAttendees } from '@/services/api/attendeeService'
import { fetchMemberById } from '@/services/api/memberService'

const UserDetail: FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [certificates, setCertificates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const memberData = await fetchMemberById(id as string)
        if (memberData?.data) {
          setUser(memberData.data)
          const attendeeData = await searchAttendees({ memberId: id, attended: true })
          setCertificates(attendeeData?.data?.items ?? [])
        }
      } catch (error) {
        showNotification({
          title: 'Error',
          message: 'Error al obtener datos del usuario.',
          color: 'red',
        })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading)
    return (
      <Center style={{ height: '80vh' }}>
        <Loader size="lg" />
      </Center>
    )

  return (
    <Container size="sm" style={{ marginTop: 80 }}>
      {/* Botón de Volver */}
      <Button
        variant="outline"
        leftSection={<IconArrowLeft size={16} />}
        onClick={() => navigate(-1)}
        mb="lg"
      >
        Volver Atrás
      </Button>

      {user ? (
        <>
          {/* Tarjeta de Información del Usuario */}
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Title order={2}>{user.properties.fullName}</Title>
            <Divider my="sm" />
            <Group>
              <IconMail size={18} />
              <Text>Email: {user.properties.email}</Text>
            </Group>
            <Group>
              <IconId size={18} />
              <Text>Documento: {user.properties.idNumber}</Text>
            </Group>
          </Card>

          {/* Sección de Certificados */}
          <Title order={3} mt="lg">
            <IconCertificate size={24} style={{ marginRight: 5 }} />
            Certificados
          </Title>
          {certificates.length > 0 ? (
            certificates.map((cert) => (
              <Card
                key={cert._id}
                shadow="sm"
                p="lg"
                mt="md"
                radius="md"
                withBorder
                style={{ cursor: 'pointer' }}
                onClick={() => window.open(`/certificate/${cert.eventId._id}/${id}`, '_blank')}
              >
                <Text fw={500}>{cert.eventId.name}</Text>
                <Text size="sm" color="dimmed">
                  Horas: {cert.certificationHours}
                </Text>
              </Card>
            ))
          ) : (
            <Alert
              icon={<IconAlertCircle size={18} />}
              title="Sin certificados"
              color="red"
              mt="md"
            >
              No tienes certificados registrados. Si crees que es un error, comunícate con nuestras
              líneas de atención.
            </Alert>
          )}
        </>
      ) : (
        <Alert icon={<IconAlertCircle size={18} />} title="Usuario no encontrado" color="red">
          No se encontraron datos para este usuario.
        </Alert>
      )}
    </Container>
  )
}

export { UserDetail }
