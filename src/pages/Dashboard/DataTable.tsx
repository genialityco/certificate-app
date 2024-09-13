import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

import {
  ActionIcon,
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Group,
  Loader,
  Modal,
  Pagination,
  Select,
  Table,
  TextInput,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { IconEdit, IconTrash } from '@tabler/icons-react'

import { ApiServices } from '@/services'

interface EventProperty {
  label: string
  name: string
  mandatory: boolean
}

interface EventData {
  _id: string
  name: string
  organization: string
  userProperties: Record<string, unknown>
  styles: {
    eventImage: string
  }
}

interface EventUser {
  _id: string
  properties: Record<string, unknown>
}

const DataTable: React.FC = () => {
  const [users, setUsers] = useState<EventUser[]>([])
  const [displayedData, setDisplayedData] = useState<EventUser[]>([])
  const [page, setPage] = useState<number>(1)
  const [perPage, setPerPage] = useState<number>(10)
  const [propertyHeadersApi, setPropertyHeadersApi] = useState<EventProperty[]>([])
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 300)
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    mode: 'add' | 'edit'
    user?: EventUser
  }>({
    isOpen: false,
    mode: 'add',
  })
  const [newUserData, setNewUserData] = useState<Record<string, string>>({})
  const [editingUserData, setEditingUserData] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<boolean>(true)
  const [event, setEvent] = useState<EventData | null>(null)
  const { eventId } = useParams()
  const apiServices = new ApiServices()

  useEffect(() => {
    if (eventId) {
      getEventProperties()
      getEventUsersData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  const getEventUsersData = async () => {
    setLoading(true)
    try {
      const filters = { event: eventId }
      const response = await apiServices.fetchFilteredGlobal('Attendee', filters)
      setUsers(response as unknown as EventUser[])
    } finally {
      setLoading(false)
    }
  }

  const getEventProperties = async () => {
    setLoading(true)
    try {
      const response = await apiServices.fetchFilteredGlobal('Event', { _id: eventId })
      const result = response[0]
      if (result) {
        setEvent(result as unknown as EventData)
        filterHeadTable(result.userProperties)
      }
    } catch (error) {
      throw new Error('Error fetching event properties:', error as ErrorOptions)
    } finally {
      setLoading(false)
    }
  }

  const filterHeadTable = (userProperties: unknown) => {
    if (!userProperties || !Array.isArray(userProperties)) {
      return
    }
    const headers = userProperties.map((property) => ({
      label: property.label,
      name: property.name,
      mandatory: property.mandatory,
    }))
    setPropertyHeadersApi(headers)
  }

  const filteredData = useMemo(() => {
    return users.filter((item) =>
      propertyHeadersApi.some((header) =>
        item.properties[header.name]
          ?.toString()
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase()),
      ),
    )
  }, [users, debouncedSearchTerm, propertyHeadersApi])

  useEffect(() => {
    setDisplayedData(paginateData(filteredData, page, perPage))
  }, [filteredData, page, perPage])

  const paginateData = (data: EventUser[], page: number, perPage: number) => {
    const start = (page - 1) * perPage
    const end = start + perPage
    return data.slice(start, end)
  }

  const handlePerPageChange = (value: string | null) => {
    if (value !== null) {
      setPerPage(parseInt(value, 10))
      setPage(1)
    }
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const cleanedValue = event.currentTarget.value.replace(/[.,]/g, '') // Eliminar puntos y comas
    setSearchTerm(cleanedValue)
  }

  const handleAddUser = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    try {
      await apiServices.addAttendee({
        properties: newUserData,
        eventId: eventId || '',
        organization: event?.organization || '',
      })
      await getEventUsersData()
      setModalState({ isOpen: false, mode: 'add' })
    } catch (error) {
      throw new Error('Error adding user:', error as ErrorOptions)
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const updatedData = {
        eventId: eventId || '',
        organization: event?.organization || '',
        properties: editingUserData,
      }
      await apiServices.updateAttendee(modalState.user?._id || '', updatedData)
      await getEventUsersData() // Refrescar la lista de asistentes después de editar
      setModalState({ isOpen: false, mode: 'edit' })
    } catch (error) {
      throw new Error('Error updating user:', error as ErrorOptions)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      await apiServices.deleteAttendee(userId)
      await getEventUsersData() // Refrescar la lista después de la eliminación
    } catch (error) {
      throw new Error('Error deleting user:', error as ErrorOptions)
    }
  }

  const handleInputChange = (name: string, value: string) => {
    setNewUserData((prevData) => ({
      ...prevData,
      [name]: value,
    }))
  }

  const handleEditInputChange = (name: string, value: string) => {
    setEditingUserData((prevData) => ({
      ...prevData,
      [name]: value,
    }))
  }

  const openModal = (mode: 'add' | 'edit', user?: EventUser) => {
    if (mode === 'edit' && user) {
      setEditingUserData(
        propertyHeadersApi.reduce(
          (acc, header) => ({
            ...acc,
            [header.name]: String(user.properties[header.name] || ''),
          }),
          {},
        ),
      )
    }
    setModalState({ isOpen: true, mode, user })
  }

  const generateUniqueEmail = (fullName: string) => {
    const randomString = Math.random().toString(36).substring(2, 8)
    const namePart = fullName
      .toLowerCase()
      .replace(/\s+/g, '.')
      .replace(/[^a-z.]/g, '')
    return `${namePart}.${randomString}@geniality.com.co`
  }

  return (
    <Container>
      {loading ? (
        <Flex justify="center" align="center" style={{ height: '100vh' }}>
          <Loader />
        </Flex>
      ) : (
        <Box fs={{ overflowX: 'auto', minWidth: '100%', marginTop: '1rem' }}>
          <Box>
            <Grid align="center" gutter="sm" my="sm">
              <Grid.Col span={8}>
                <TextInput
                  placeholder="Buscar usuario"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  fs={{ width: '100%' }}
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <Button fullWidth onClick={() => openModal('add')}>
                  Añadir
                </Button>
              </Grid.Col>
            </Grid>
          </Box>
          <Table withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                {propertyHeadersApi.map((header) => (
                  <Table.Th key={header.name}>{header.label}</Table.Th>
                ))}
                <Table.Th>Acciones</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {displayedData.map((item) => (
                <Table.Tr key={item._id}>
                  {propertyHeadersApi.map((header) => (
                    <Table.Td key={`${item._id}-${header.name}`}>
                      {String(item.properties[header.name] || '')}
                    </Table.Td>
                  ))}
                  <Table.Td>
                    <Group>
                      <Flex>
                        <ActionIcon onClick={() => openModal('edit', item)} mr="xs">
                          <IconEdit />
                        </ActionIcon>
                        <ActionIcon color="red" onClick={() => handleDeleteUser(item._id)}>
                          <IconTrash />
                        </ActionIcon>
                      </Flex>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          <Group my="md" justify="flex-start" grow align="center">
            <Pagination
              value={page}
              onChange={setPage}
              total={Math.ceil(filteredData.length / perPage)}
            />
            <Select
              value={perPage.toString()}
              onChange={handlePerPageChange}
              data={['10', '20', '50', '100']}
              placeholder="Items per page"
              fs={{ width: '100%' }}
            />
          </Group>
        </Box>
      )}

      <Modal
        opened={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, mode: 'add' })}
        title={modalState.mode === 'add' ? 'Añadir Usuario' : 'Editar Usuario'}
      >
        {modalState.mode === 'add' ? (
          <form onSubmit={handleAddUser}>
            {propertyHeadersApi.map((header) => (
              <TextInput
                key={header.name}
                label={header.label}
                value={newUserData[header.name] || ''}
                onChange={(e) => handleInputChange(header.name, e.target.value)}
                required={header.mandatory}
              />
            ))}
            <Button
              variant="white"
              onClick={() =>
                handleInputChange('email', generateUniqueEmail(newUserData['names'] || ''))
              }
            >
              Generar Correo Único
            </Button>
            <Group justify="flex-end" mt="md">
              <Button type="submit">Guardar</Button>
            </Group>
          </form>
        ) : (
          <form onSubmit={handleUpdateUser}>
            {propertyHeadersApi.map((header) => (
              <TextInput
                key={header.name}
                label={header.label}
                value={editingUserData[header.name] || ''}
                onChange={(e) => handleEditInputChange(header.name, e.target.value)}
                required={header.mandatory}
              />
            ))}
            <Group justify="flex-end" mt="md">
              <Button type="submit">Guardar Cambios</Button>
            </Group>
          </form>
        )}
      </Modal>
    </Container>
  )
}

export { DataTable }
