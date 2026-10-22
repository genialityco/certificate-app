import { useEffect, useMemo, useState } from 'react'

import {
  Alert,
  Button,
  Grid,
  Group,
  Image,
  Loader,
  Modal,
  Stack,
  Switch,
  Text,
  TextInput,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { IconDeviceFloppy, IconDownload, IconInfoCircle } from '@tabler/icons-react'

import { formatEventName } from '@/features/admin/format'
import { fetchRenderData, updateAttendeeData } from '@/services/api/certificateAdminService'
import notification from '@/utils/notification'

import { downloadAttendeeCertificate } from './download'
import { DEFAULT_ATTENDEE_FIELDS, MEMBER_FIELDS } from './fields'
import { renderCertificateToCanvas } from './renderCertificate'
import { type RenderData } from './types'

interface Props {
  attendeeId: string | null
  onClose: () => void
  onSaved?: () => void
}

type MemberForm = Record<'fullName' | 'idNumber' | 'email' | 'phone', string>

// Certificados antiguos no tienen campos definidos
const certificateFields = (data: RenderData) =>
  data.certificate.fields?.length ? data.certificate.fields : DEFAULT_ATTENDEE_FIELDS

const attributeValue = (data: RenderData, key: string) => {
  if (key === 'typeAttendee') return data.attendee.typeAttendee ?? ''
  if (key === 'certificationHours') return data.attendee.certificationHours ?? ''
  return String(data.attendee.properties?.[key] ?? '')
}

export function EditAttendeeModal({ attendeeId, onClose, onSaved }: Props) {
  const [data, setData] = useState<RenderData | null>(null)
  const [member, setMember] = useState<MemberForm>({
    fullName: '',
    idNumber: '',
    email: '',
    phone: '',
  })
  const [attributes, setAttributes] = useState<Record<string, string>>({})
  const [attended, setAttended] = useState(true)
  const [preview, setPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!attendeeId) return
    setData(null)
    setPreview(null)
    setError(null)
    fetchRenderData(attendeeId)
      .then((result) => {
        setData(result)
        const props = result.member?.properties ?? {}
        setMember({
          fullName: props.fullName ?? '',
          idNumber: props.idNumber ?? '',
          email: props.email ?? '',
          phone: props.phone ?? '',
        })
        setAttributes(
          Object.fromEntries(
            certificateFields(result).map((f) => [f.key, attributeValue(result, f.key)]),
          ),
        )
        setAttended(result.attendee.attended)
      })
      .catch((err) =>
        setError(
          err?.response?.data?.message || 'No se pudo cargar el certificado de este asistente',
        ),
      )
  }, [attendeeId])

  const values = useMemo(
    () => (data ? { ...data.values, ...member, ...attributes } : null),
    [data, member, attributes],
  )
  const [debouncedValues] = useDebouncedValue(values, 350)

  useEffect(() => {
    if (!data || !debouncedValues) return
    const canvas = document.createElement('canvas')
    renderCertificateToCanvas(
      canvas,
      data.certificate.elements,
      data.certificate.size,
      debouncedValues,
    )
      .then(() => setPreview(canvas.toDataURL('image/png')))
      .catch(() => setPreview(null))
  }, [data, debouncedValues])

  const save = async () => {
    if (!attendeeId) return
    setSaving(true)
    try {
      const updated = await updateAttendeeData(attendeeId, { member, attributes, attended })
      setData(updated)
      notification.success({ message: 'Datos actualizados; el certificado ya refleja los cambios' })
      onSaved?.()
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message
      notification.error({ message: message || 'No se pudo guardar' })
    } finally {
      setSaving(false)
    }
  }

  const download = async () => {
    if (!data || !values) return
    await downloadAttendeeCertificate({ ...data, values }, { count: false }).catch(() =>
      notification.error({ message: 'No se pudo generar el certificado' }),
    )
  }

  return (
    <Modal
      opened={!!attendeeId}
      onClose={onClose}
      size="90%"
      centered
      title={
        <Text fw={700}>
          Certificado {data?.event?.name ? `· ${formatEventName(data.event.name)}` : ''}
        </Text>
      }
    >
      {error && <Alert color="red">{error}</Alert>}
      {!data && !error && (
        <Group justify="center" p="xl">
          <Loader color="brand" />
        </Group>
      )}
      {data && (
        <Grid gutter="xl">
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap="sm">
              <Text fw={700} size="sm">
                Datos de la persona
              </Text>
              <Alert variant="light" color="blue" icon={<IconInfoCircle size={16} />} p="xs">
                <Text size="xs">
                  Estos datos son del miembro: el cambio se ve en todos sus certificados.
                </Text>
              </Alert>
              {MEMBER_FIELDS.map((field) => (
                <TextInput
                  key={field.key}
                  label={field.label}
                  value={member[field.key as keyof MemberForm]}
                  onChange={(e) => {
                    const value = e.currentTarget.value
                    setMember((prev) => ({ ...prev, [field.key]: value }))
                  }}
                />
              ))}

              {certificateFields(data).length > 0 && (
                <>
                  <Text fw={700} size="sm" mt="sm">
                    Datos de este certificado
                  </Text>
                  {certificateFields(data).map((field) => (
                    <TextInput
                      key={field.key}
                      label={field.label}
                      value={attributes[field.key] ?? ''}
                      onChange={(e) => {
                        const value = e.currentTarget.value
                        setAttributes((prev) => ({ ...prev, [field.key]: value }))
                      }}
                    />
                  ))}
                </>
              )}
              <Switch
                mt="xs"
                color="brand"
                label="Puede descargar el certificado"
                checked={attended}
                onChange={(e) => setAttended(e.currentTarget.checked)}
              />
              <Group mt="md">
                <Button
                  color="brand"
                  leftSection={<IconDeviceFloppy size={16} />}
                  onClick={save}
                  loading={saving}
                >
                  Guardar cambios
                </Button>
                <Button
                  variant="default"
                  leftSection={<IconDownload size={16} />}
                  onClick={download}
                >
                  PNG
                </Button>
              </Group>
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <div style={{ background: '#f3f4f6', borderRadius: 8, padding: 12, minHeight: 200 }}>
              {preview ? (
                <Image src={preview} alt="Certificado" radius="sm" />
              ) : (
                <Group justify="center" p="xl">
                  <Loader color="brand" size="sm" />
                </Group>
              )}
            </div>
          </Grid.Col>
        </Grid>
      )}
    </Modal>
  )
}
