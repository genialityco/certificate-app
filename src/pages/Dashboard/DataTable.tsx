/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react'
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
  Progress,
  Select,
  Table,
  Text,
  TextInput,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { IconEdit, IconLockCancel } from '@tabler/icons-react'
import * as XLSX from 'xlsx'

import { createAttendee, searchAttendees, updateAttendee } from '@/services/api/attendeeService'
import { fetchEventById } from '@/services/api/eventService'
import { createMember, searchMembers, updateMember } from '@/services/api/memberService'
import { fetchOrganizationById } from '@/services/api/organizationService'
import notification from '@/utils/notification'

interface EventProperty {
  label: string
  organizationId: string
  fieldName: string
  required: boolean
}

interface OrganizationData {
  _id: string
  name: string
  propertiesDefinition: EventProperty[]
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
  eventId: Record<string, unknown>
  attended: boolean
  _id: string
  properties: Record<string, string | boolean>
  memberId: {
    [x: string]: unknown
    properties: Record<string, string | boolean>
  }
  certificationHours: string
  typeAttendee: string
}

const DataTable: React.FC = () => {
  const [users, setUsers] = useState<EventUser[]>([])
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
  const [newUserData, setNewUserData] = useState<Record<string, string | boolean>>({
    isAttendee: false,
  })
  const [editingUserData, setEditingUserData] = useState<Record<string, string | boolean>>({})
  const [loading, setLoading] = useState<boolean>(true)
  const [, setOrganization] = useState<OrganizationData | null>(null)
  const [event, setEvent] = useState<EventData | null>(null)
  const [isBulkUploadModalOpen, setBulkUploadModalOpen] = useState<boolean>(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const { eventId } = useParams()

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

      if (response.status === 'success') {
        setUsers(response.data.items as EventUser[])
        setTotalPages(response.data.totalPages)
        // No modifiques el page aquí
      } else if (
        response.status === 'error' &&
        response.message === 'No se encontraron asistentes'
      ) {
        setUsers([])
        setTotalPages(0)
      } else {
        throw new Error(response.message || 'Error inesperado')
      }
    } catch (error) {
      notification.error({
        message: 'No se pudo cargar la información de los asistentes',
      })
    }
  }

  const getEventProperties = async () => {
    setLoading(true)
    try {
      const responseEvent = await fetchEventById(eventId)
      const responseOrg = await fetchOrganizationById(responseEvent.data.organizationId)
      const result = responseOrg.data
      if (result) {
        setEvent(responseEvent.data as EventData)
        setOrganization(result)
        filterHeadTable(result.propertiesDefinition, responseEvent.data.organizationId)
      }
    } catch (error) {
      notification.error({
        message: 'Error al cargar las propiedades del evento',
      })
    } finally {
      setLoading(false)
    }
  }

  const filterHeadTable = (properties: EventProperty[], organizationId: string) => {
    if (!properties || !Array.isArray(properties)) {
      return
    }
    const headers = properties
      .filter((property) => property.fieldName !== 'password')
      .map((property) => ({
        label: property.label,
        fieldName: property.fieldName,
        required: property.required,
        organizationId,
      }))
    setPropertyHeadersApi(headers)
  }

  const handleInputChange = (fieldName: string, value: string | boolean) => {
    setNewUserData((prevState) => ({
      ...prevState,
      [fieldName]: value,
    }))
  }

  const handleEditInputChange = (fieldName: string, value: string | boolean) => {
    setEditingUserData((prevState) => ({
      ...prevState,
      [fieldName]: value,
    }))
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await createMember({
        properties: newUserData,
        organizationId: event?.organizationId || '',
      })
      if (newUserData.attended) {
        try {
          const attendeData = {
            userId: null,
            eventId: eventId,
            memberId: response.data._id,
            attended: true,
          }
          await createAttendee(attendeData)
        } catch (error) {
          notification.error({ message: 'Error añadiendo asistente' })
        }
      }
      await getEventUsersData()
      setModalState({ isOpen: false, mode: 'add' })
    } catch (error) {
      notification.error({ message: 'Error añadiendo usuario' })
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateMember(modalState.user?._id || '', {
        organizationId: event?.organizationId || '',
        properties: editingUserData,
      })
      await getEventUsersData()
      setModalState({ isOpen: false, mode: 'edit' })
    } catch (error) {
      notification.error({ message: 'Error actualizando usuario' })
    }
  }

  const handleDeleteUser = async (userId: string, userData: EventUser) => {
    try {
      // Extraer solo los _id de eventId y memberId
      const attendeeData = {
        ...userData,
        eventId: userData.eventId._id as string,
        memberId: userData.memberId._id,
      }

      // Realizar la actualización con los datos ajustados
      await updateAttendee(userId, attendeeData)

      // Actualizar la lista de usuarios
      await getEventUsersData()
    } catch (error) {
      notification.error({ message: 'Error eliminando usuario' })
    }
  }

  const openModal = (mode: 'add' | 'edit', user?: EventUser) => {
    if (mode === 'edit' && user) {
      const updatedData = propertyHeadersApi.reduce(
        (acc, header) => ({
          ...acc,
          [header.fieldName]: user.memberId.properties[header.fieldName] || '',
        }),
        {} as Record<string, string | boolean>,
      )

      updatedData.attended = user.attended || false

      setEditingUserData(updatedData)
    }

    setModalState({ isOpen: true, mode, user })
  }

  const handleDownloadTemplate = () => {
    // Generar el template dinámico
    const templateHeaders = propertyHeadersApi.map((header) => header.label)
    const worksheet = XLSX.utils.aoa_to_sheet([templateHeaders])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template')

    // Descargar el archivo
    XLSX.writeFile(workbook, 'template.xlsx')
  }

  const handleFileUpload = async (eventAction: React.ChangeEvent<HTMLInputElement>) => {
    const file = eventAction.target.files?.[0]
    if (!file) return

    setLoading(true)
    setUploadProgress(0)

    function normalizeHeader(str: string) {
      return (str || '')
        .toLowerCase()
        .replace(/[\s_]+/g, '')
        .replace(/[áäàâã]/g, 'a')
        .replace(/[éëèê]/g, 'e')
        .replace(/[íïìî]/g, 'i')
        .replace(/[óöòôõ]/g, 'o')
        .replace(/[úüùû]/g, 'u')
        .replace(/[ñ]/g, 'n')
    }

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const sheet = XLSX.utils.sheet_to_json<XLSX.WorkSheet>(workbook.Sheets[sheetName])
      const jsonData = Array.isArray(sheet) ? sheet : []

      const batchSize = 100
      const batches = []
      for (let i = 0; i < jsonData.length; i += batchSize) {
        batches.push(jsonData.slice(i, i + batchSize))
      }

      const totalBatches = batches.length

      for (const [index, batch] of batches.entries()) {
        const formattedData = batch.map((row: any) => {
          const properties = propertyHeadersApi.reduce((acc: Record<string, string>, header) => {
            const headerLabelNorm = normalizeHeader(header.label)
            const excelKey = Object.keys(row).find((k) => normalizeHeader(k) === headerLabelNorm)
            acc[header.fieldName] =
              excelKey && row[excelKey] !== undefined && row[excelKey] !== null
                ? String(row[excelKey])
                : ''
            return acc
          }, {})

          return {
            eventId: eventId || '',
            properties: {
              ...properties,
              idNumber: String(properties.idNumber || ''),
              certificationHours: properties.certificationHours
                ? Number(properties.certificationHours)
                : undefined,
              typeAttendee: properties.typeAttendee || undefined,
            },
            attended: true,
            isIncomplete: !properties.idNumber,
          }
        })

        const validUsers = formattedData.filter((user) => !!user.properties.idNumber)

        await Promise.all(
          validUsers.map(async (user) => {
            const { idNumber, certificationHours, typeAttendee } = user.properties

            // Buscar si ya existe un miembro con el idNumber
            const existingMembers = await searchMembers(
              { 'properties.idNumber': idNumber },
              { page: 1, limit: 1 },
            )

            let memberId = null
            if (existingMembers?.data?.items.length > 0) {
              // Actualiza member
              const existingMember = existingMembers.data.items[0]
              await updateMember(existingMember._id, {
                properties: user.properties,
                organizationId: event?.organizationId || '',
              })
              memberId = existingMember._id
            } else {
              // Crea member
              const memberResponse = await createMember({
                properties: user.properties,
                organizationId: event?.organizationId || '',
              })
              memberId = memberResponse.data?._id || memberResponse._id
            }

            // Crea attendee
            await createAttendee({
              eventId: user.eventId,
              memberId: memberId,
              attended: user.attended,
              certificationHours,
              typeAttendee,
            })
          }),
        )

        const progress = Math.round(((index + 1) / totalBatches) * 100)
        setUploadProgress(progress)
      }

      notification.success({ message: 'Usuarios cargados exitosamente' })
      setBulkUploadModalOpen(false)
      await getEventUsersData()
    } catch (error) {
      notification.error({ message: 'Error al procesar el archivo' })
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  return (
    <Container>
      {loading ? (
        <Flex justify="center" align="center" style={{ height: '100vh' }}>
          <Loader />
        </Flex>
      ) : (
        <Box style={{ overflowX: 'auto', minWidth: '100%', marginTop: '1rem' }}>
          <Grid align="center" gutter="sm" my="sm">
            <Grid.Col span={8}>
              <TextInput
                placeholder="Buscar usuario"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.currentTarget.value)}
                style={{ width: '100%' }}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <Button mr="md" onClick={() => openModal('add')}>
                Añadir
              </Button>
              <Button onClick={() => setBulkUploadModalOpen(true)}>Cargue masivo</Button>
            </Grid.Col>
          </Grid>

          {users.length > 0 ? (
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
                        {item.memberId.properties[header.fieldName] || ''}
                      </Table.Td>
                    ))}
                    <Table.Td>
                      <Group>
                        <Flex>
                          <ActionIcon onClick={() => openModal('edit', item)} mr="xs">
                            <IconEdit />
                          </ActionIcon>
                          <ActionIcon color="red" onClick={() => handleDeleteUser(item._id, item)}>
                            <IconLockCancel />
                          </ActionIcon>
                        </Flex>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          ) : (
            <Text ta="center" mt="md" c="dimmed">
              No hay asistentes registrados.
            </Text>
          )}

          <Group my="md" grow align="center">
            <Pagination value={page} onChange={setPage} total={totalPages} />
            <Select
              value={perPage.toString()}
              onChange={(value) => setPerPage(Number(value) || 10)}
              data={['10', '20', '50', '100', '200']}
              placeholder="Items per page"
            />
          </Group>
        </Box>
      )}

      <Modal
        opened={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, mode: 'add' })}
        title={modalState.mode === 'add' ? 'Añadir Asistente' : 'Editar Asistente'}
      >
        <form onSubmit={modalState.mode === 'add' ? handleAddUser : handleUpdateUser}>
          {propertyHeadersApi.map((property) => (
            <TextInput
              key={property.fieldName}
              label={property.label}
              value={
                modalState.mode === 'add'
                  ? (newUserData[property.fieldName] as string) || ''
                  : (editingUserData[property.fieldName] as string) || ''
              }
              onChange={(e) =>
                modalState.mode === 'add'
                  ? handleInputChange(property.fieldName, e.currentTarget.value)
                  : handleEditInputChange(property.fieldName, e.currentTarget.value)
              }
              required={property.required}
            />
          ))}

          <Checkbox
            my="md"
            labelPosition="right"
            label="¿Persona certificada?"
            checked={
              modalState.mode === 'add'
                ? (newUserData.attended as boolean) || false
                : (editingUserData.attended as boolean) || false
            }
            onChange={(e) =>
              modalState.mode === 'add'
                ? handleInputChange('attended', e.currentTarget.checked)
                : handleEditInputChange('attended', e.currentTarget.checked)
            }
          />

          <Group justify="flex-end" mt="md">
            <Button type="submit">
              {modalState.mode === 'add' ? 'Guardar' : 'Guardar Cambios'}
            </Button>
          </Group>
        </form>
      </Modal>

      <Modal
        opened={isBulkUploadModalOpen}
        onClose={() => setBulkUploadModalOpen(false)}
        title="Cargar Usuarios Masivamente"
      >
        <Flex direction="column" gap="md">
          <Button onClick={handleDownloadTemplate}>Descargar Template</Button>
          <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
        </Flex>
        {uploadProgress > 0 && (
          <Box mt="md">
            <Text size="sm">Progreso de carga: {uploadProgress}%</Text>
            <Progress value={uploadProgress} size="lg" />
          </Box>
        )}
      </Modal>
    </Container>
  )
}

export { DataTable }
