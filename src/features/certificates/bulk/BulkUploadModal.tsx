import { useState } from 'react'

import {
  Alert,
  Badge,
  Button,
  Group,
  Modal,
  Progress,
  ScrollArea,
  SimpleGrid,
  Stack,
  Table,
  Text,
} from '@mantine/core'
import { Dropzone } from '@mantine/dropzone'
import {
  IconAlertTriangle,
  IconDownload,
  IconFileSpreadsheet,
  IconUpload,
} from '@tabler/icons-react'

import { formatPersonName } from '@/features/admin/format'
import { bulkUploadAttendees } from '@/services/api/certificateAdminService'

import { fieldLabel } from '../fields'
import { type BulkRowResult, type CertificateField } from '../types'
import { ParsedSheet, downloadTemplate, parseAttendeesFile } from './parseSheet'

const CHUNK_SIZE = 100

interface Props {
  opened: boolean
  onClose: () => void
  eventId: string
  eventName: string
  fields: CertificateField[]
  onDone: () => void
}

const STATUS_LABEL: Record<BulkRowResult['status'], { label: string; color: string }> = {
  created: { label: 'Inscrito', color: 'green' },
  skipped: { label: 'Omitido', color: 'gray' },
  error: { label: 'Error', color: 'red' },
}

export function BulkUploadModal({ opened, onClose, eventId, eventName, fields, onDone }: Props) {
  const [parsed, setParsed] = useState<ParsedSheet | null>(null)
  const [fileName, setFileName] = useState('')
  const [progress, setProgress] = useState<number | null>(null)
  const [results, setResults] = useState<BulkRowResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setParsed(null)
    setFileName('')
    setProgress(null)
    setResults(null)
    setError(null)
  }

  const handleClose = () => {
    if (progress !== null && results === null) return
    reset()
    onClose()
  }

  const handleFile = async (file: File) => {
    setError(null)
    setResults(null)
    try {
      const sheet = await parseAttendeesFile(file, fields)
      if (!sheet.rows.length) {
        setError('El archivo no tiene filas con datos')
        return
      }
      setParsed(sheet)
      setFileName(file.name)
    } catch {
      setError('No se pudo leer el archivo. Usa Excel (.xlsx) o CSV.')
    }
  }

  const upload = async () => {
    if (!parsed) return
    setProgress(0)
    const all: BulkRowResult[] = []
    for (let i = 0; i < parsed.rows.length; i += CHUNK_SIZE) {
      const chunk = parsed.rows.slice(i, i + CHUNK_SIZE)
      try {
        const response = await bulkUploadAttendees(eventId, chunk)
        all.push(...response.results)
      } catch (err) {
        const message = (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message
        chunk.forEach((row) =>
          all.push({
            row: row.row ?? 0,
            status: 'error',
            fullName: row.fullName,
            message: message || 'Error de conexión',
            warnings: [],
          }),
        )
      }
      setProgress(Math.round(((i + chunk.length) / parsed.rows.length) * 100))
    }
    setResults(all)
    onDone()
  }

  const summary = results && {
    created: results.filter((r) => r.status === 'created').length,
    skipped: results.filter((r) => r.status === 'skipped').length,
    errors: results.filter((r) => r.status === 'error').length,
    newMembers: results.filter((r) => r.memberStatus === 'created').length,
  }
  const notable = results?.filter((r) => r.status !== 'created' || r.warnings.length) ?? []
  const uploading = progress !== null && results === null

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={<Text fw={700}>Carga masiva de asistentes</Text>}
      size="xl"
      centered
    >
      <Stack>
        {!results && (
          <>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Columnas: nombre, identificación, correo, celular
                {fields.length ? ` y ${fields.map((f) => f.label.toLowerCase()).join(', ')}` : ''}.
              </Text>
              <Button
                variant="subtle"
                color="brand"
                size="xs"
                leftSection={<IconDownload size={14} />}
                onClick={() => downloadTemplate(fields, eventName)}
              >
                Descargar plantilla
              </Button>
            </Group>

            <Dropzone
              onDrop={(files) => files[0] && handleFile(files[0])}
              accept={[
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-excel',
                'text/csv',
              ]}
              multiple={false}
              disabled={uploading}
            >
              <Group justify="center" gap="md" mih={110} style={{ pointerEvents: 'none' }}>
                <IconFileSpreadsheet size={40} color="#4d93d0" stroke={1.5} />
                <div>
                  <Text fw={600}>{fileName || 'Arrastra el Excel o haz clic para elegirlo'}</Text>
                  <Text size="sm" c="dimmed">
                    {parsed ? `${parsed.totalRows} filas detectadas` : '.xlsx o .csv'}
                  </Text>
                </div>
              </Group>
            </Dropzone>
          </>
        )}

        {error && (
          <Alert color="red" icon={<IconAlertTriangle size={18} />}>
            {error}
          </Alert>
        )}

        {parsed && !results && (
          <>
            {parsed.missingRequired.length > 0 && (
              <Alert color="orange" icon={<IconAlertTriangle size={18} />}>
                No se encontraron las columnas: {parsed.missingRequired.join(', ')}. Cada fila
                necesita al menos correo o identificación, y el nombre si la persona es nueva.
              </Alert>
            )}
            <div>
              <Text size="sm" fw={600} mb={6}>
                Columnas detectadas
              </Text>
              <Group gap={6}>
                {Object.entries(parsed.mapping).map(([header, key]) => (
                  <Badge
                    key={header}
                    color={key ? 'brand' : 'gray'}
                    variant={key ? 'light' : 'outline'}
                    tt="none"
                  >
                    {header} {key ? `→ ${fieldLabel(key, fields)}` : '(se ignora)'}
                  </Badge>
                ))}
              </Group>
            </div>
            {uploading && <Progress value={progress ?? 0} color="brand" striped animated />}
            <Group justify="flex-end">
              <Button variant="default" onClick={reset} disabled={uploading}>
                Cambiar archivo
              </Button>
              <Button
                color="brand"
                leftSection={<IconUpload size={16} />}
                onClick={upload}
                loading={uploading}
              >
                Cargar {parsed.totalRows} asistentes
              </Button>
            </Group>
          </>
        )}

        {results && summary && (
          <>
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
              {[
                ['Inscritos', summary.created, '#16a34a'],
                ['Miembros nuevos', summary.newMembers, '#4d93d0'],
                ['Omitidos (ya inscritos)', summary.skipped, '#6b7280'],
                ['Errores', summary.errors, '#dc2626'],
              ].map(([label, value, color]) => (
                <div
                  key={label as string}
                  style={{
                    borderTop: `4px solid ${color}`,
                    background: '#f9fafb',
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  <Text fz={24} fw={800}>
                    {value}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {label}
                  </Text>
                </div>
              ))}
            </SimpleGrid>

            {notable.length > 0 && (
              <ScrollArea h={280}>
                <Table striped stickyHeader fz="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Fila</Table.Th>
                      <Table.Th>Nombre</Table.Th>
                      <Table.Th>Estado</Table.Th>
                      <Table.Th>Detalle</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {notable.map((r) => (
                      <Table.Tr key={`${r.row}-${r.status}`}>
                        <Table.Td>{r.row}</Table.Td>
                        <Table.Td>{formatPersonName(r.fullName)}</Table.Td>
                        <Table.Td>
                          <Badge color={STATUS_LABEL[r.status].color} variant="light">
                            {STATUS_LABEL[r.status].label}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          {[r.message, ...r.warnings].filter(Boolean).join(' · ')}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            )}
            <Group justify="flex-end">
              <Button variant="default" onClick={reset}>
                Cargar otro archivo
              </Button>
              <Button color="brand" onClick={handleClose}>
                Listo
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  )
}
