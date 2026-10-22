import { useEffect, useState } from 'react'

import {
  ActionIcon,
  Alert,
  Button,
  Group,
  Modal,
  Stack,
  Switch,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core'
import { IconArrowBackUp, IconInfoCircle, IconPlus, IconTrash } from '@tabler/icons-react'

import { MEMBER_FIELDS } from '@/features/certificates/fields'
import { type MemberDoc } from '@/features/certificates/types'
import { updateMemberProperties } from '@/services/api/certificateAdminService'
import notification from '@/utils/notification'

type Value = string | number | boolean

// Datos que se pueden editar pero no eliminar
const LOCKED_KEYS = ['fullName', 'email', 'phone', 'idNumber']
const KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]{0,63}$/

const labelOf = (key: string) => MEMBER_FIELDS.find((f) => f.key === key)?.label ?? key

const editableEntries = (properties: Record<string, unknown>) => {
  const entries = Object.entries(properties).filter(
    ([key, value]) =>
      key !== 'password' &&
      (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'),
  ) as [string, Value][]
  // Asegura que los datos base aparezcan aunque estén vacíos
  for (const field of MEMBER_FIELDS) {
    if (!entries.some(([key]) => key === field.key)) entries.push([field.key, ''])
  }
  const order = (key: string) => {
    const index = MEMBER_FIELDS.findIndex((f) => f.key === key)
    return index === -1 ? MEMBER_FIELDS.length : index
  }
  return entries.sort(([a], [b]) => order(a) - order(b) || a.localeCompare(b))
}

interface Props {
  member: MemberDoc | null
  opened: boolean
  onClose: () => void
  onSaved: (detail: Awaited<ReturnType<typeof updateMemberProperties>>) => void
}

export function EditMemberModal({ member, opened, onClose, onSaved }: Props) {
  const [values, setValues] = useState<Record<string, Value>>({})
  const [original, setOriginal] = useState<Record<string, Value>>({})
  const [removed, setRemoved] = useState<string[]>([])
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!opened || !member) return
    const entries = Object.fromEntries(editableEntries(member.properties ?? {}))
    setValues(entries)
    setOriginal(entries)
    setRemoved([])
    setNewKey('')
    setNewValue('')
  }, [opened, member])

  const keys = Object.keys(values)
  const newKeyError =
    newKey && !KEY_PATTERN.test(newKey)
      ? 'Solo letras, números y _ (sin espacios)'
      : newKey === 'password' || keys.includes(newKey)
        ? 'Ya existe'
        : undefined

  const addProperty = () => {
    if (!newKey || newKeyError) return
    setValues((prev) => ({ ...prev, [newKey]: newValue }))
    setRemoved((prev) => prev.filter((key) => key !== newKey))
    setNewKey('')
    setNewValue('')
  }

  const save = async () => {
    if (!member) return
    const set = Object.fromEntries(
      Object.entries(values).filter(
        ([key, value]) => !removed.includes(key) && value !== original[key],
      ),
    )
    const unset = removed.filter((key) => key in original)
    if (!Object.keys(set).length && !unset.length) {
      onClose()
      return
    }
    setSaving(true)
    try {
      const detail = await updateMemberProperties(member._id, { set, unset })
      notification.success({ message: 'Datos del miembro actualizados' })
      onSaved(detail)
      onClose()
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message
      notification.error({ message: message || 'No se pudieron guardar los datos' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={700}>Editar datos del miembro</Text>}
      size="lg"
      centered
    >
      <Stack gap="sm">
        <Alert variant="light" color="blue" icon={<IconInfoCircle size={16} />} p="xs">
          <Text size="xs">
            Los cambios se ven en todos sus certificados. Cambiar el correo o el documento aquí no
            cambia su usuario de acceso.
          </Text>
        </Alert>

        {keys.map((key) => {
          const value = values[key]
          const isRemoved = removed.includes(key)
          const locked = LOCKED_KEYS.includes(key)
          return (
            <Group key={key} gap="xs" wrap="nowrap" align="flex-end">
              <div style={{ flex: 1, opacity: isRemoved ? 0.45 : 1 }}>
                {typeof value === 'boolean' ? (
                  <Switch
                    label={labelOf(key)}
                    color="brand"
                    checked={value}
                    disabled={isRemoved}
                    onChange={(e) => {
                      const checked = e.currentTarget.checked
                      setValues((prev) => ({ ...prev, [key]: checked }))
                    }}
                    py={6}
                  />
                ) : (
                  <TextInput
                    label={labelOf(key)}
                    value={String(value ?? '')}
                    disabled={isRemoved}
                    required={key === 'fullName'}
                    style={{ textDecoration: isRemoved ? 'line-through' : undefined }}
                    onChange={(e) => {
                      const next = e.currentTarget.value
                      setValues((prev) => ({
                        ...prev,
                        [key]:
                          typeof original[key] === 'number' && next !== '' && !isNaN(Number(next))
                            ? Number(next)
                            : next,
                      }))
                    }}
                  />
                )}
              </div>
              {!locked &&
                (isRemoved ? (
                  <Tooltip label="Deshacer">
                    <ActionIcon
                      variant="default"
                      size="lg"
                      onClick={() => setRemoved((prev) => prev.filter((k) => k !== key))}
                    >
                      <IconArrowBackUp size={16} />
                    </ActionIcon>
                  </Tooltip>
                ) : (
                  <Tooltip label="Eliminar este dato">
                    <ActionIcon
                      variant="light"
                      color="red"
                      size="lg"
                      onClick={() => setRemoved((prev) => [...prev, key])}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Tooltip>
                ))}
            </Group>
          )
        })}

        <Text fw={600} size="sm" mt="sm">
          Agregar dato
        </Text>
        <Group gap="xs" wrap="nowrap" align="flex-start">
          <TextInput
            placeholder="Nombre, ej: specialty"
            value={newKey}
            onChange={(e) => setNewKey(e.currentTarget.value.trim())}
            error={newKeyError}
            style={{ flex: 1 }}
          />
          <TextInput
            placeholder="Valor"
            value={newValue}
            onChange={(e) => setNewValue(e.currentTarget.value)}
            onKeyDown={(e) => e.key === 'Enter' && addProperty()}
            style={{ flex: 1 }}
          />
          <ActionIcon
            size="lg"
            color="brand"
            onClick={addProperty}
            disabled={!newKey || !!newKeyError}
          >
            <IconPlus size={16} />
          </ActionIcon>
        </Group>

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            color="brand"
            onClick={save}
            loading={saving}
            disabled={!String(values.fullName ?? '').trim() || removed.includes('fullName')}
          >
            Guardar
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
