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

import {
  addOrCreateAttendee,
  searchAttendees,
  updateAttendee,
} from '@/services/api/attendeeService'
import { fetchEventById } from '@/services/api/eventService'
import { updateMember } from '@/services/api/memberService'
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
  styles: { eventImage: string }
}

interface EventData {
  name: string
  organizationId: string
  styles: { eventImage: string; miniatureImage: string }
}

interface EventUser {
  eventId: Record<string, unknown>
  attended: boolean
  _id: string
  properties: Record<string, string | boolean>
  memberId: { [x: string]: unknown; properties: Record<string, string | boolean> }
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
  }>({ isOpen: false, mode: 'add' })
  const [newUserData, setNewUserData] = useState<Record<string, string | boolean>>({
    isAttendee: false,
  })
  const [editingUserData, setEditingUserData] = useState<Record<string, string | boolean>>({})
  const [loading, setLoading] = useState<boolean>(true)
  const [, setOrganization] = useState<OrganizationData | null>(null)
  const [event, setEvent] = useState<EventData | null>(null)
  const [isBulkUploadModalOpen, setBulkUploadModalOpen] = useState<boolean>(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [uploadSummary, setUploadSummary] = useState<{
    total: number
    successful: number
    errors: number
    updated: number
    created: number
    errorDetails: { row: number; email: string; error: string }[]
  } | null>(null)
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

  // Resetear página cuando cambie el término de búsqueda
  useEffect(() => {
    if (debouncedSearchTerm) {
      setPage(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm])

  const getEventUsersData = async () => {
    try {
      setLoading(true)

      // Si hay término de búsqueda, queremos filtrar sobre todos los registros disponibles.
      // Para ello descargamos todas las páginas del backend en lotes y aplicamos el filtro
      // en el cliente, luego paginamos localmente.
      if (debouncedSearchTerm && String(debouncedSearchTerm).trim() !== '') {
        const term = String(debouncedSearchTerm).toLowerCase().trim()
        const pageSize = 100
        let current = 1
        let allItems: EventUser[] = []

        while (true) {
          const resp = await searchAttendees({ eventId: eventId, page: current, limit: pageSize })
          if (resp.status === 'success' && Array.isArray(resp.data.items)) {
            allItems = allItems.concat(resp.data.items as EventUser[])
            const totalPagesFromResp = resp.data.totalPages || 1
            if (current >= totalPagesFromResp) break
            current += 1
          } else if (resp.status === 'error' && resp.message === 'No se encontraron asistentes') {
            allItems = []
            break
          } else {
            throw new Error(resp.message || 'Error inesperado al descargar asistentes')
          }
        }

        // Aplicar filtro por nombre/correo sobre todos los registros
        const matched = allItems.filter((it) => {
          try {
            const props = it?.memberId?.properties || {}
            const combined = Object.values(props)
              .filter((v) => typeof v === 'string' || typeof v === 'number')
              .map((v) => String(v).toLowerCase())
              .join(' ')

            const email = (props.email as string) || ''
            const name = (props.fullName as string) || ''

            return (
              combined.includes(term) ||
              email.toLowerCase().includes(term) ||
              name.toLowerCase().includes(term)
            )
          } catch (e) {
            return false
          }
        })

        // Paginar localmente
        const total = matched.length
        const totalPagesLocal = total > 0 ? Math.max(1, Math.ceil(total / perPage)) : 0
        const start = (page - 1) * perPage
        const pageItems = matched.slice(start, start + perPage)

        setUsers(pageItems)
        setTotalPages(totalPagesLocal)
      } else {
        // Comportamiento por defecto: pedir al servidor la página solicitada
        const filters: any = { eventId: eventId, page: page, limit: perPage }
        const response = await searchAttendees(filters)

        if (response.status === 'success') {
          setUsers(response.data.items as EventUser[])
          setTotalPages(response.data.totalPages)
        } else if (
          response.status === 'error' &&
          response.message === 'No se encontraron asistentes'
        ) {
          setUsers([])
          setTotalPages(0)
        } else {
          throw new Error(response.message || 'Error inesperado')
        }
      }
    } catch (error) {
      notification.error({ message: 'No se pudo cargar la información de los asistentes' })
    } finally {
      setLoading(false)
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
      notification.error({ message: 'Error al cargar las propiedades del evento' })
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
    setNewUserData((prevState) => ({ ...prevState, [fieldName]: value }))
  }

  const handleEditInputChange = (fieldName: string, value: string | boolean) => {
    setEditingUserData((prevState) => ({ ...prevState, [fieldName]: value }))
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // 1. Obtener y validar datos
      const email = (newUserData.email as string)?.trim().toLowerCase()
      const password = String(newUserData.idNumber || newUserData.password || 'achoapp')

      if (!email) {
        notification.error({ message: 'El email es requerido' })
        return
      }

      console.log('=== INICIANDO CREACIÓN DE USUARIO ===')
      console.log('Email:', email)

      // 2. Preparar el payload para addOrCreateAttendee
      const payload = [
        {
          user: { email: email, password: password },
          attendee: {
            eventId: eventId || '',
            attended: newUserData.attended || false,
            certificationHours: String(newUserData.certificationHours || '0'),
            typeAttendee: String(newUserData.typeAttendee || ''),
            certificateDownloads: 0,
          },
          member: {
            organizationId: event?.organizationId || '',
            memberActive: true,
            properties: { ...newUserData, email, password },
          },
        },
      ]

      console.log('Payload a enviar:', payload)

      // 3. Llamar al servicio que maneja todo el flujo
      const response = await addOrCreateAttendee(payload)

      console.log('Respuesta del servicio:', response)

      if (response.status === 'success') {
        console.log('=== USUARIO CREADO/ACTUALIZADO EXITOSAMENTE ===')

        notification.success({ message: 'Usuario procesado exitosamente' })

        await getEventUsersData()
        setModalState({ isOpen: false, mode: 'add' })
        setNewUserData({ isAttendee: false })
      } else {
        throw new Error(response.message || 'Error procesando usuario')
      }
    } catch (error: any) {
      console.error('=== ERROR AÑADIENDO USUARIO ===', error)
      const errMsg = error?.response?.data?.message || error?.message || 'Error desconocido'
      notification.error({ message: `Error añadiendo usuario: ${errMsg}` })
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // modalState.user is the EventUser (attendee). The member ID is in user.memberId._id
      const memberId = (modalState.user as EventUser | undefined)?.memberId?._id as
        | string
        | undefined
      await updateMember(memberId || '', {
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
      const attendeeData = {
        ...userData,
        eventId: userData.eventId._id as string,
        memberId: userData.memberId._id,
      }

      await updateAttendee(userId, attendeeData)
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
          [header.fieldName]: user?.memberId.properties[header.fieldName] || '',
        }),
        {} as Record<string, string | boolean>,
      )

      updatedData.attended = user.attended || false

      setEditingUserData(updatedData)
    } else {
      // Limpiar datos para nuevo usuario
      setNewUserData({ isAttendee: false })
    }

    setModalState({ isOpen: true, mode, user })
  }

  const handleDownloadTemplate = () => {
    const templateHeaders = propertyHeadersApi.map((header) => header.label)
    const worksheet = XLSX.utils.aoa_to_sheet([templateHeaders])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template')
    XLSX.writeFile(workbook, 'template.xlsx')
  }

  const readExcelFile = async (file: File): Promise<any[]> => {
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]

      const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 })

      let headerRowIndex = -1
      let headers: string[] = []

      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i] as any[]
        if (
          row &&
          row.length > 0 &&
          row.some((cell) => cell !== null && cell !== undefined && cell !== '')
        ) {
          headers = row.map((cell) => String(cell || '').trim())
          headerRowIndex = i
          break
        }
      }

      if (headerRowIndex === -1 || headers.length === 0) {
        throw new Error('No se encontraron headers válidos en el archivo')
      }

      const jsonData = []
      for (let i = headerRowIndex + 1; i < rawData.length; i++) {
        const row = rawData[i] as any[]
        if (!row || !row.some((cell) => cell !== null && cell !== undefined && cell !== '')) {
          continue
        }

        const rowObject: any = {}
        headers.forEach((header, index) => {
          if (header) {
            rowObject[header] = row[index] !== null && row[index] !== undefined ? row[index] : ''
          }
        })
        jsonData.push(rowObject)
      }

      return Array.isArray(jsonData) ? jsonData : []
    } catch (error) {
      console.error('Error leyendo archivo Excel:', error)
      throw error
    }
  }

  // Normaliza un nombre de columna: quita acentos, pasa a minúsculas y normaliza espacios
  const normalizeColumnName = (columnName: string): string => {
    return String(columnName)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  // Busca el valor en una fila usando nombres posibles (p. ej. ['EMAIL','CORREO']),
  // apoyándose en un mapa de headers normalizados -> headerOriginal
  const findColumnValueFromRow = (
    row: any,
    possibleNames: string[],
    normalizedHeadersMap: Record<string, string>,
  ): string => {
    for (const name of possibleNames) {
      const norm = normalizeColumnName(name)
      const actualHeader = normalizedHeadersMap[norm]
      if (
        actualHeader &&
        row[actualHeader] !== undefined &&
        row[actualHeader] !== null &&
        row[actualHeader] !== ''
      ) {
        return String(row[actualHeader]).trim()
      }
    }
    return ''
  }

  const handleFileUpload = async (eventAction: React.ChangeEvent<HTMLInputElement>) => {
    const file = eventAction.target.files?.[0]
    if (!file) return

    setLoading(true)
    setUploadProgress(0)
    setUploadSummary(null)

    // Inicializar resumen
    const summary = {
      total: 0,
      successful: 0,
      errors: 0,
      updated: 0,
      created: 0,
      errorDetails: [] as { row: number; email: string; error: string }[],
    }

    try {
      console.log('=== INICIANDO CARGA MASIVA ===')
      const jsonData = await readExcelFile(file)
      summary.total = jsonData.length
      console.log(`Total de registros a procesar: ${jsonData.length}`)

      // Construir mapa de headers normalizados -> header original (para búsquedas tolerantes)
      const normalizedHeaders: Record<string, string> = {}
      if (jsonData.length > 0) {
        Object.keys(jsonData[0]).forEach((header) => {
          normalizedHeaders[normalizeColumnName(header)] = header
        })
      }

      const batchSize = 50
      const batches = []
      for (let i = 0; i < jsonData.length; i += batchSize) {
        batches.push(jsonData.slice(i, i + batchSize))
      }

      const totalBatches = batches.length
      let processedCount = 0
      const totalRecords = jsonData.length
      let currentRowIndex = 0

      for (const [index, batch] of batches.entries()) {
        console.log(`\n=== Procesando batch ${index + 1}/${totalBatches} ===`)

        // Formatear datos del batch para el servicio addOrCreateAttendee
        const formattedData = batch.map((row: any, batchIndex: number) => {
          const globalRowIndex = currentRowIndex + batchIndex

          // Definir nombres posibles para cada columna
          const idNumberPossibleNames = [
            'CEDULA',
            'CÉDULA',
            'CEDULA O NUMERO DE DOCUMENTO',
            'CÉDULA O NÚMERO DE DOCUMENTO',
            'NUMERO DE DOCUMENTO',
            'NÚMERO DE DOCUMENTO',
            'ID',
            'IDENTIFICACION',
            'IDENTIFICACIÓN',
          ]

          const namesPossibleNames = ['NOMBRES', 'NOMBRE', 'PRIMER NOMBRE', 'NOMBRE COMPLETO']
          const lastNamesPossibleNames = ['APELLIDOS', 'APELLIDO', 'PRIMER APELLIDO']
          const emailPossibleNames = [
            'EMAIL',
            'CORREO',
            'CORREO ELECTRONICO',
            'CORREO ELECTRÓNICO',
            'E-MAIL',
            'MAIL',
          ]
          const phonePossibleNames = ['CELULAR', 'TELEFONO', 'TELÉFONO', 'PHONE', 'MOVIL', 'MÓVIL']
          const categoryMemberPossibleNames = [
            'CATEGORIA MIEMBRO',
            'CATEGORÍA MIEMBRO',
            'SPECIALTY',
            'ESPECIALIDAD',
          ]
          const typePossibleNames = ['CATEGORIA', 'CATEGORÍA', 'TIPO', 'TYPE', 'TIPO ASISTENTE']
          const hoursPossibleNames = [
            'TIEMPO \nCERTIFICADO',
            'TIEMPO CERTIFICADO',
            'HORAS',
            'HORAS A CERTIFICAR',
            'HORAS CERTIFICACION',
            'HORAS CERTIFICACIÓN',
            'CERTIFICATION HOURS',
            'Horas certificadas',
          ]
          const certificatePossibleNames = [
            'CERTIFICADO \nREALIZADO',
            'CERTIFICADO REALIZADO',
            'CERTIFICADO',
            'ATTENDED',
            'ASISTIO',
            'ASISTIÓ',
          ]

          // Extraer valores (usando headers normalizados)
          const idNumber = findColumnValueFromRow(row, idNumberPossibleNames, normalizedHeaders)
          let fullName = findColumnValueFromRow(row, ['NOMBRE COMPLETO'], normalizedHeaders)

          if (!fullName) {
            const nombres = findColumnValueFromRow(row, namesPossibleNames, normalizedHeaders)
            const apellidos = findColumnValueFromRow(row, lastNamesPossibleNames, normalizedHeaders)
            fullName = `${nombres} ${apellidos}`.trim()
          }

          const email =
            findColumnValueFromRow(row, emailPossibleNames, normalizedHeaders) ||
            `${fullName.replace(/\s+/g, '').toLowerCase()}@acho.com.co`

          const phone = findColumnValueFromRow(row, phonePossibleNames, normalizedHeaders)
          const categoryMember = findColumnValueFromRow(
            row,
            categoryMemberPossibleNames,
            normalizedHeaders,
          )
          const typeAttendee = findColumnValueFromRow(row, typePossibleNames, normalizedHeaders)
          const certificationHours =
            findColumnValueFromRow(row, hoursPossibleNames, normalizedHeaders) || '0'

          const certificateValue = findColumnValueFromRow(
            row,
            certificatePossibleNames,
            normalizedHeaders,
          )
          const attended = certificateValue !== '' && certificateValue.toLowerCase() !== 'no'

          const cleanEmail = email.split(',')[0].trim().toLowerCase()
          const password = String(idNumber || 'achoapp')

          // Formato esperado por addOrCreateAttendee
          // Construir propiedades del miembro mapeando a los fieldName que provee la API
          const memberPropsBasic: Record<string, any> = {
            idNumber,
            fullName,
            phone,
            email: cleanEmail,
            password,
            specialty: categoryMember,
          }

          const memberProperties: Record<string, any> = {}

          if (propertyHeadersApi && propertyHeadersApi.length > 0) {
            propertyHeadersApi.forEach((ph) => {
              // Intentar obtener valor directo desde el header del excel usando la etiqueta
              const valFromHeader = findColumnValueFromRow(
                row,
                [ph.label, ph.fieldName],
                normalizedHeaders,
              )
              if (valFromHeader !== '') {
                memberProperties[ph.fieldName] = valFromHeader
                return
              }

              // Heurística: asignar según el nombre del campo
              const key = ph.fieldName.toLowerCase()
              if (key.includes('id') || key.includes('cedula') || key.includes('ident')) {
                memberProperties[ph.fieldName] = idNumber || ''
              } else if (key.includes('name') || key.includes('nombre')) {
                memberProperties[ph.fieldName] = fullName || ''
              } else if (key.includes('email')) {
                memberProperties[ph.fieldName] = cleanEmail || ''
              } else if (
                key.includes('phone') ||
                key.includes('cel') ||
                key.includes('movil') ||
                key.includes('telefono')
              ) {
                memberProperties[ph.fieldName] = phone || ''
              } else if (
                key.includes('special') ||
                key.includes('especial') ||
                key.includes('category') ||
                key.includes('tipo')
              ) {
                memberProperties[ph.fieldName] = categoryMember || ''
              } else {
                // Fallback: empty
                memberProperties[ph.fieldName] = ''
              }
            })
          } else {
            // Si no tenemos definitions, enviar un set básico
            Object.assign(memberProperties, memberPropsBasic)
          }

          // Asegurar que email y password siempre existan en properties
          memberProperties.email = memberProperties.email || cleanEmail
          memberProperties.password = memberProperties.password || password

          return {
            rowIndex: globalRowIndex + 2, // +2 porque Excel empieza en 1 y tiene header
            user: { email: cleanEmail, password: password },
            attendee: {
              eventId: eventId || '',
              attended: attended,
              certificationHours: certificationHours,
              typeAttendee: typeAttendee,
              certificateDownloads: 0,
            },
            member: {
              organizationId: event?.organizationId || '',
              memberActive: true,
              properties: memberProperties,
            },
          }
        })

        console.log(`Registros formateados en batch: ${formattedData.length}`)

        // Enviar el batch al servicio
        try {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const dataToSend = formattedData.map(({ rowIndex, ...data }) => data)
          const response = await addOrCreateAttendee(dataToSend)

          console.log(`✓ Batch ${index + 1} procesado exitosamente`)
          console.log('Respuesta:', response)

          // Analizar respuesta para el resumen
          if (response.status === 'success' && Array.isArray(response.data)) {
            response.data.forEach((result: any, idx: number) => {
              const rowData = formattedData[idx]
              if (result && !result.error) {
                summary.successful++
                // Determinar si fue creado o actualizado basado en la respuesta
                if (result.attendee && result.attendee._id) {
                  // Si hay información del attendee, asumimos que fue procesado correctamente
                  if (result.member && result.member.createdAt === result.member.updatedAt) {
                    summary.created++
                  } else {
                    summary.updated++
                  }
                }
              } else {
                summary.errors++
                summary.errorDetails.push({
                  row: rowData.rowIndex,
                  email: rowData.user.email,
                  error: result?.error || 'Error desconocido',
                })
              }
            })
          } else {
            // Si la respuesta no es un array, contar como exitosos
            summary.successful += formattedData.length
            summary.created += formattedData.length
          }
        } catch (error: any) {
          console.error(`✗ Error en batch ${index + 1}:`, error)
          // Registrar error para todo el batch
          formattedData.forEach((rowData) => {
            summary.errors++
            summary.errorDetails.push({
              row: rowData.rowIndex,
              email: rowData.user.email,
              error:
                error?.response?.data?.message || error?.message || 'Error al procesar el batch',
            })
          })
        }

        currentRowIndex += batch.length
        processedCount += batch.length
        const progress = Math.round((processedCount / totalRecords) * 100)
        setUploadProgress(progress)
      }

      console.log('=== CARGA MASIVA COMPLETADA ===')
      console.log('Resumen:', summary)

      setUploadSummary(summary)

      if (summary.errors === 0) {
        notification.success({
          message: `Carga completada exitosamente: ${summary.successful} registros procesados correctamente`,
        })
      } else if (summary.successful > 0) {
        // No hay 'warning' en el helper de notificaciones; usar error para indicar fallos parciales.
        notification.error({
          message: `Carga completada con errores: ${summary.successful} exitosos, ${summary.errors} errores`,
        })
      } else {
        notification.error({ message: 'Error en la carga: todos los registros fallaron' })
      }

      await getEventUsersData()
    } catch (error) {
      console.error('Error en carga masiva:', error)
      notification.error({ message: 'Error al procesar el archivo' })
      setUploadSummary(summary)
    } finally {
      setLoading(false)
      setUploadProgress(0)
      // Limpiar el input file para permitir recargar el mismo archivo
      if (eventAction.target) {
        eventAction.target.value = ''
      }
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
                    <Table.Th
                      key={header.fieldName}
                      style={{
                        maxWidth: '150px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {header.label}
                    </Table.Th>
                  ))}
                  <th>Acciones</th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {users.map((item) => (
                  <Table.Tr key={item._id}>
                    {propertyHeadersApi.map((header) => (
                      <Table.Td key={`${item._id}-${header.fieldName}`}>
                        {item?.memberId?.properties[header.fieldName] || ''}
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
        onClose={() => {
          setBulkUploadModalOpen(false)
          setUploadSummary(null)
        }}
        title="Cargar Usuarios Masivamente"
        size="lg"
      >
        <Flex direction="column" gap="md">
          <Button onClick={handleDownloadTemplate}>Descargar Template</Button>
          <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
        </Flex>

        {uploadProgress > 0 && !uploadSummary && (
          <Box mt="md">
            <Text size="sm">Progreso de carga: {uploadProgress}%</Text>
            <Progress value={uploadProgress} size="lg" />
          </Box>
        )}

        {uploadSummary && (
          <Box mt="md" p="md" style={{ border: '1px solid #e0e0e0', borderRadius: '8px' }}>
            <Text size="lg" fw={700} mb="md">
              📊 Resumen de Carga
            </Text>

            <Grid gutter="md">
              <Grid.Col span={6}>
                <Box p="sm" style={{ backgroundColor: '#f0f9ff', borderRadius: '4px' }}>
                  <Text size="sm" c="dimmed">
                    Total de registros
                  </Text>
                  <Text size="xl" fw={700}>
                    {uploadSummary.total}
                  </Text>
                </Box>
              </Grid.Col>

              <Grid.Col span={6}>
                <Box p="sm" style={{ backgroundColor: '#f0fdf4', borderRadius: '4px' }}>
                  <Text size="sm" c="dimmed">
                    Exitosos
                  </Text>
                  <Text size="xl" fw={700} c="green">
                    {uploadSummary.successful}
                  </Text>
                </Box>
              </Grid.Col>

              <Grid.Col span={6}>
                <Box p="sm" style={{ backgroundColor: '#fffbeb', borderRadius: '4px' }}>
                  <Text size="sm" c="dimmed">
                    Creados
                  </Text>
                  <Text size="xl" fw={700} c="blue">
                    {uploadSummary.created}
                  </Text>
                </Box>
              </Grid.Col>

              <Grid.Col span={6}>
                <Box p="sm" style={{ backgroundColor: '#fef3f2', borderRadius: '4px' }}>
                  <Text size="sm" c="dimmed">
                    Actualizados
                  </Text>
                  <Text size="xl" fw={700} c="orange">
                    {uploadSummary.updated}
                  </Text>
                </Box>
              </Grid.Col>

              {uploadSummary.errors > 0 && (
                <Grid.Col span={12}>
                  <Box p="sm" style={{ backgroundColor: '#fef2f2', borderRadius: '4px' }}>
                    <Text size="sm" c="dimmed">
                      Errores
                    </Text>
                    <Text size="xl" fw={700} c="red">
                      {uploadSummary.errors}
                    </Text>
                  </Box>
                </Grid.Col>
              )}
            </Grid>

            {uploadSummary.errorDetails.length > 0 && (
              <Box mt="md">
                <Text size="md" fw={600} mb="sm" c="red">
                  ⚠️ Detalles de Errores:
                </Text>
                <Box
                  style={{
                    maxHeight: '200px',
                    overflowY: 'auto',
                    border: '1px solid #fee2e2',
                    borderRadius: '4px',
                    padding: '8px',
                    backgroundColor: '#fef2f2',
                  }}
                >
                  {uploadSummary.errorDetails.map((error, idx) => (
                    <Box key={idx} mb="xs" p="xs" style={{ borderBottom: '1px solid #fecaca' }}>
                      <Text size="sm" fw={600}>
                        Fila {error.row} - {error.email}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {error.error}
                      </Text>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            <Group justify="flex-end" mt="md">
              <Button
                onClick={() => {
                  setBulkUploadModalOpen(false)
                  setUploadSummary(null)
                }}
              >
                Cerrar
              </Button>
            </Group>
          </Box>
        )}
      </Modal>
    </Container>
  )
}
export { DataTable }
