import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { Box, Container, Loader, Table, Text, Title } from '@mantine/core'

import { searchAttendees } from '@/services/api/attendeeService'

interface EventUser {
  _id: string
  memberId: {
    _id: string
    properties: Record<string, string | boolean>
  }
  certificateDownloads?: number
}

const CertificateDownloadsTable: React.FC = () => {
  const { eventId } = useParams()
  const [loading, setLoading] = useState(true)
  const [filteredUsers, setFilteredUsers] = useState<EventUser[]>([])
  const [totalWithDownloads, setTotalWithDownloads] = useState(0)

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      try {
        const filters = { eventId, page: 1, limit: 1000 } // puedes ajustar el límite si es necesario
        const response = await searchAttendees(filters)

        if (response.status === 'success') {
          const allUsers: EventUser[] = response.data.items

          const downloadedUsers = allUsers.filter(
            (user) =>
              typeof user.certificateDownloads === 'number' && user.certificateDownloads > 0,
          )

          setFilteredUsers(downloadedUsers)
          setTotalWithDownloads(downloadedUsers.length)
        } else {
          setFilteredUsers([])
          setTotalWithDownloads(0)
        }
      } catch (err) {
        setFilteredUsers([])
      } finally {
        setLoading(false)
      }
    }

    if (eventId) {
      fetchUsers()
    }
  }, [eventId])

  if (loading) {
    return (
      <Box mt="xl" style={{ textAlign: 'center' }}>
        <Loader />
      </Box>
    )
  }

  return (
    <Container mt="lg">
      <Title order={3}>Descargas de certificados</Title>
      <Text mb="sm">Usuarios que han descargado su certificado: {totalWithDownloads}</Text>

      {filteredUsers.length > 0 ? (
        <Table withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nombre</Table.Th>
              <Table.Th>Cédula</Table.Th>
              <Table.Th>Descargas</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredUsers.map((user) => (
              <Table.Tr key={user._id}>
                <Table.Td>{user.memberId.properties.fullName || '—'}</Table.Td>
                <Table.Td>{user.memberId.properties.idNumber || '—'}</Table.Td>
                <Table.Td>{user.certificateDownloads}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : (
        <Text>No hay usuarios con descargas registradas.</Text>
      )}
    </Container>
  )
}

export { CertificateDownloadsTable }
