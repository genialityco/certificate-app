import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

import {
  ActionIcon,
  Box,
  Button,
  Checkbox,
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
import { searchAttendees } from '@/services/api/attendeeService'
import { fetchEventById } from '@/services/api/eventService'
import { fetchOrganizationById } from '@/services/api/organizationService'
import notification from '@/utils/notification'

interface EventProperty {
  label: string
  fieldName: string
  required: boolean
}

interface OrganizationData {
  _id: string
  name: string
  properties: Record<string, unknown>
  styles: {
    eventImage: string
  }
}

interface EventData {
  name: string
  organizationId: string
  styles: {
    eventImage: string
    miniatureImage: string
  }
}

interface EventUser {
  _id: string
  properties: Record<string, unknown>
  memberId: {
    properties: Record<string, unknown>
  }
}

const DataTable: React.FC = () => {
  const [users, setUsers] = useState<EventUser[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [, setDisplayedData] = useState<EventUser[]>([])
  const [page, setPage] = useState<number>(1)
  const [perPage, setPerPage] = useState<number>(10)
  const [totalPages, setTotalPages] = useState<number>(1)
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
  const [, setOrganization] = useState<OrganizationData | null>(null)
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

  useEffect(() => {
    getEventUsersData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, debouncedSearchTerm])

  const getEventUsersData = async () => {
    try {
      const filters = {
        eventId: eventId,
        page: page,
        limit: perPage,
      }
      const response = await searchAttendees(filters)

      // Asegúrate de que `response.data.currentPage` esté correctamente definido.
      setUsers(response.data.items as unknown as EventUser[])
      setTotalPages(response.data.totalPages)

      // Aquí, verifica que el servidor devuelve el `currentPage` correcto.
      if (response.data.currentPage !== page) {
        setPage(response.data.currentPage)
      }
    } catch {
      notification.error({ message: 'Ocurrió un error' })
    }
  }

  const getEventProperties = async () => {
    setLoading(true)
    try {
      const responseEvent = await fetchEventById(eventId)
      const responseOrg = await fetchOrganizationById(responseEvent.data.organizationId)
      const result = responseOrg.data
      if (result) {
        setEvent(responseEvent.data as unknown as EventData)
        setOrganization(result)
        filterHeadTable(result.propertiesDefinition)
      }
    } catch (error) {
      throw new Error('Error fetching event properties:', error as ErrorOptions)
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filterHeadTable = (properties: any[]) => {
    if (!properties || !Array.isArray(properties)) {
      return
    }
    const headers = properties
      .filter((property) => property.fieldName !== 'password')
      .map((property) => ({
        label: property.label,
        fieldName: property.fieldName,
        required: property.required,
      }))
    setPropertyHeadersApi(headers)
  }

  const filteredData = useMemo(() => {
    return users.filter((item) =>
      propertyHeadersApi.some((header) =>
        item.memberId.properties[header.fieldName]
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
    const cleanedValue = event.currentTarget.value.replace(/[.,]/g, '')
    setSearchTerm(cleanedValue) // Se usa con debounce para minimizar solicitudes
  }

  const handleAddUser = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    try {
      await apiServices.addAttendee({
        properties: newUserData,
        eventId: eventId || '',
        organization: event?.organizationId || '',
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
        organization: event?.organizationId || '',
        properties: editingUserData,
      }
      await apiServices.updateAttendee(modalState.user?._id || '', updatedData)
      await getEventUsersData()
      setModalState({ isOpen: false, mode: 'edit' })
    } catch (error) {
      throw new Error('Error updating user:', error as ErrorOptions)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      await apiServices.deleteAttendee(userId)
      await getEventUsersData()
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
            [header.fieldName]: String(user.properties[header.fieldName] || ''),
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
        <Box style={{ overflowX: 'auto', minWidth: '100%', marginTop: '1rem' }}>
          <Box>
            <Grid align="center" gutter="sm" my="sm">
              <Grid.Col span={8}>
                <TextInput
                  placeholder="Buscar usuario"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  style={{ width: '100%' }}
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
                  <th key={header.fieldName}>{header.label}</th>
                ))}
                <th>Acciones</th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {users.map((item) => (
                <Table.Tr key={item._id}>
                  {propertyHeadersApi.map((header) => (
                    <Table.Td key={`${item._id}-${header.fieldName}`}>
                      {header.fieldName === 'certificationHours' ||
                      header.fieldName === 'typeAttendee'
                        ? String(item[header.fieldName] || '')
                        : String(item.memberId.properties[header.fieldName] || '')}
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
          <Group my="md" grow align="center">
            <Pagination value={page} onChange={(newPage) => setPage(newPage)} total={totalPages} />
            <Select
              value={perPage.toString()}
              onChange={handlePerPageChange}
              data={['10', '20', '50', '100']}
              placeholder="Items per page"
              style={{ width: '100%' }}
            />
          </Group>
        </Box>
      )}

      <Modal
        opened={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, mode: 'add' })}
        title={modalState.mode === 'add' ? 'Añadir Asistente' : 'Editar Asistente'}
      >
        {modalState.mode === 'add' ? (
          <form onSubmit={handleAddUser}>
            {/* {propertyHeadersApi.map((header) => (
              <TextInput
                key={header.fieldName}
                label={header.label}
                value={newUserData[header.fieldName] || ''}
                onChange={(e) => handleInputChange(header.fieldName, e.target.value)}
                required={header.required}
              />
            ))} */}
            <TextInput label="Documento del asistente" />
            <TextInput label="Tipo de asistente" />
            <TextInput label="Horas certificadas" />
            <Checkbox my="md" defaultChecked labelPosition="right" label="Marcar como asistente" />
            {/* <Button
              variant="white"
              onClick={() =>
                handleInputChange('email', generateUniqueEmail(newUserData['names'] || ''))
              }
            >
              Generar Correo Único
            </Button> */}
            <Group justify="flex-end" mt="md">
              <Button type="submit">Guardar</Button>
            </Group>
          </form>
        ) : (
          <form onSubmit={handleUpdateUser}>
            {propertyHeadersApi.map((header) => (
              <TextInput
                key={header.fieldName}
                label={header.label}
                value={editingUserData[header.fieldName] || ''}
                onChange={(e) => handleEditInputChange(header.fieldName, e.target.value)}
                required={header.required}
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
