import { useState } from 'react'

import {
  ActionIcon,
  Badge,
  Button,
  Divider,
  FileButton,
  Group,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core'
import { IconPhoto, IconPlus, IconTrash, IconTypography, IconVariable } from '@tabler/icons-react'

import { EVENT_FIELDS, MEMBER_FIELDS, labelToKey } from '../fields'
import { type CertificateField } from '../types'

interface Props {
  hasBackground: boolean
  uploading: boolean
  onBackground: (file: File) => void
  onAddText: () => void
  onAddField: (key: string) => void
  attendeeFields: CertificateField[]
  onFieldsChange: (fields: CertificateField[]) => void
  usageByKey: Record<string, number>
}

const RESERVED_KEYS = [...MEMBER_FIELDS, ...EVENT_FIELDS].map((f) => f.key)

export function EditorSidebar({
  hasBackground,
  uploading,
  onBackground,
  onAddText,
  onAddField,
  attendeeFields,
  onFieldsChange,
  usageByKey,
}: Props) {
  const [newLabel, setNewLabel] = useState('')
  const newKey = labelToKey(newLabel)
  const keyTaken =
    RESERVED_KEYS.includes(newKey) || attendeeFields.some((field) => field.key === newKey)

  const addField = () => {
    if (!newKey || keyTaken) return
    onFieldsChange([...attendeeFields, { key: newKey, label: newLabel.trim() }])
    setNewLabel('')
  }

  const FieldButton = ({ field, removable }: { field: CertificateField; removable?: boolean }) => (
    <Group gap={4} wrap="nowrap">
      <Button
        variant="light"
        color="brand"
        size="xs"
        justify="space-between"
        fullWidth
        leftSection={<IconVariable size={14} />}
        rightSection={
          usageByKey[field.key] ? (
            <Badge size="xs" variant="filled" color="brand" circle>
              {usageByKey[field.key]}
            </Badge>
          ) : (
            <IconPlus size={14} />
          )
        }
        onClick={() => onAddField(field.key)}
        styles={{ label: { flex: 1, textAlign: 'left' } }}
      >
        {field.label}
      </Button>
      {removable && (
        <Tooltip label={usageByKey[field.key] ? 'Está en uso en el diseño' : 'Quitar campo'}>
          <ActionIcon
            variant="subtle"
            color="red"
            disabled={!!usageByKey[field.key]}
            onClick={() => onFieldsChange(attendeeFields.filter((f) => f.key !== field.key))}
          >
            <IconTrash size={14} />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  )

  return (
    <ScrollArea
      h="100%"
      type="auto"
      style={{ borderRight: '1px solid #e5e7eb', background: '#fff' }}
    >
      <Stack gap="md" p="md" w={290}>
        <div>
          <Text fw={700} size="sm" mb={6}>
            1. Imagen de fondo
          </Text>
          <FileButton
            onChange={(file) => file && onBackground(file)}
            accept="image/png,image/jpeg,image/webp"
          >
            {(props) => (
              <Button
                {...props}
                fullWidth
                variant={hasBackground ? 'default' : 'filled'}
                color="brand"
                leftSection={<IconPhoto size={16} />}
                loading={uploading}
              >
                {hasBackground ? 'Cambiar imagen' : 'Subir imagen del certificado'}
              </Button>
            )}
          </FileButton>
          <Text size="xs" c="dimmed" mt={4}>
            El certificado toma el tamaño de la imagen (PNG o JPG).
          </Text>
        </div>

        <Divider />

        <div>
          <Text fw={700} size="sm" mb={6}>
            2. Textos
          </Text>
          <Button
            fullWidth
            variant="default"
            size="xs"
            leftSection={<IconTypography size={14} />}
            onClick={onAddText}
          >
            Texto fijo
          </Button>
          <Text size="xs" c="dimmed" mt={10} mb={4}>
            Datos de la persona (haz clic para ponerlos en el certificado)
          </Text>
          <Stack gap={4}>
            {[...MEMBER_FIELDS, ...EVENT_FIELDS].map((field) => (
              <FieldButton key={field.key} field={field} />
            ))}
          </Stack>
        </div>

        <Divider />

        <div>
          <Text fw={700} size="sm">
            3. Campos de este certificado
          </Text>
          <Text size="xs" c="dimmed" mb={6}>
            Datos propios del evento que se cargan por cada asistente (horas, rol, etc.). Serán las
            columnas extra del Excel de carga.
          </Text>
          <Stack gap={4}>
            {attendeeFields.map((field) => (
              <FieldButton key={field.key} field={field} removable />
            ))}
          </Stack>
          <Group gap={4} mt={8} wrap="nowrap" align="flex-start">
            <TextInput
              size="xs"
              placeholder="Nuevo campo, ej: Rol"
              value={newLabel}
              onChange={(e) => setNewLabel(e.currentTarget.value)}
              onKeyDown={(e) => e.key === 'Enter' && addField()}
              error={newLabel && keyTaken ? 'Ya existe' : undefined}
              style={{ flex: 1 }}
            />
            <ActionIcon size="md" color="brand" onClick={addField} disabled={!newKey || keyTaken}>
              <IconPlus size={16} />
            </ActionIcon>
          </Group>
        </div>
      </Stack>
    </ScrollArea>
  )
}
