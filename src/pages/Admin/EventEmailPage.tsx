import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import {
  Alert,
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  ColorInput,
  CopyButton,
  Grid,
  Group,
  Loader,
  Menu,
  Modal,
  Stack,
  Switch,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import {
  IconAlertTriangle,
  IconChevronDown,
  IconDeviceFloppy,
  IconMailForward,
  IconPalette,
  IconSend,
  IconUsers,
} from '@tabler/icons-react'

import { AdminPage } from '@/features/admin/AdminLayout'
import { EventNameLink } from '@/features/admin/format'
import { EmailBlocksEditor } from '@/features/certificates/email/EmailBlocksEditor'
import {
  type CertificateEmailConfig,
  type CertificateEmailSettings,
} from '@/features/certificates/types'
import {
  fetchEmailConfig,
  previewEmail,
  saveEmailSettings,
  sendEventEmails,
  sendTestEmail,
} from '@/services/api/certificateAdminService'
import { palette } from '@/styles/palette'
import notification from '@/utils/notification'

const errorMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback

export function EventEmailPage() {
  const { organizationId, eventId } = useParams()
  const [config, setConfig] = useState<CertificateEmailConfig | null>(null)
  const [settings, setSettings] = useState<CertificateEmailSettings | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null)
  const [testOpen, setTestOpen] = useState(false)
  const [sendScope, setSendScope] = useState<'pending' | 'all' | null>(null)

  const applyConfig = useCallback((result: CertificateEmailConfig) => {
    setConfig(result)
    setSettings(
      result.saved
        ? result.settings
        : // Primera vez: la landing de descarga es este mismo sitio
          { ...result.settings, linkBaseUrl: window.location.origin },
    )
  }, [])

  useEffect(() => {
    if (!eventId) return
    fetchEmailConfig(eventId)
      .then(applyConfig)
      .catch(() => setLoadError(true))
  }, [eventId, applyConfig])

  // Mientras hay un envío masivo en curso se refrescan las cifras
  useEffect(() => {
    if (!eventId || !config?.sending) return
    const timer = setInterval(() => {
      fetchEmailConfig(eventId)
        .then((result) => setConfig((prev) => (prev ? { ...prev, ...pick(result) } : result)))
        .catch(() => null)
    }, 5000)
    return () => clearInterval(timer)
  }, [eventId, config?.sending])

  const [debouncedSettings] = useDebouncedValue(settings, 400)
  useEffect(() => {
    if (!eventId || !debouncedSettings) return
    previewEmail(eventId, debouncedSettings)
      .then(setPreview)
      .catch(() => null)
  }, [eventId, debouncedSettings])

  const dirty = useMemo(
    () =>
      Boolean(
        config &&
          settings &&
          (!config.saved || JSON.stringify(config.settings) !== JSON.stringify(settings)),
      ),
    [config, settings],
  )

  const set = <K extends keyof CertificateEmailSettings>(
    key: K,
    value: CertificateEmailSettings[K],
  ) => setSettings((prev) => (prev ? { ...prev, [key]: value } : prev))

  const save = async () => {
    if (!eventId || !settings) return
    setSaving(true)
    try {
      applyConfig(await saveEmailSettings(eventId, settings))
      notification.success({ message: 'Correo guardado' })
    } catch (err) {
      notification.error({ message: errorMessage(err, 'No se pudo guardar el correo') })
    } finally {
      setSaving(false)
    }
  }

  if (loadError) {
    return (
      <AdminPage title="Correo del certificado">
        <Alert color="red">No se pudo cargar el evento</Alert>
      </AdminPage>
    )
  }
  if (!config || !settings || !eventId) {
    return (
      <Group justify="center" p="xl">
        <Loader color="brand" />
      </Group>
    )
  }

  const designUrl = `/admin/org/${organizationId}/events/${eventId}/certificate`
  const attendeesUrl = `/admin/org/${organizationId}/events/${eventId}/attendees`
  const canSend = config.hasDesign && config.emailConfigured
  const bulkBlocked = !canSend || !config.settings.enabled || dirty || config.sending
  const bulkReason = !config.hasDesign
    ? 'El certificado necesita un diseño'
    : !config.emailConfigured
      ? 'El servidor de correo no está configurado'
      : dirty
        ? 'Guarda los cambios antes de enviar'
        : !config.settings.enabled
          ? 'Habilita el envío y guarda'
          : config.sending
            ? 'Hay un envío en curso'
            : ''

  return (
    <AdminPage
      title={<EventNameLink eventId={eventId} name={config.event.name} fw={800} />}
      description={
        <Group gap="xs">
          <Anchor component={Link} to={attendeesUrl} size="sm" c="brand.7">
            ← Asistentes
          </Anchor>
          <Text size="sm" c="dimmed">
            · Correo del certificado
          </Text>
        </Group>
      }
      actions={
        <>
          <Button
            component={Link}
            to={designUrl}
            variant="default"
            leftSection={<IconPalette size={16} />}
          >
            Diseño
          </Button>
          <Tooltip label="El certificado necesita un diseño" disabled={canSend}>
            <Button
              variant="default"
              leftSection={<IconSend size={16} />}
              onClick={() => setTestOpen(true)}
              disabled={!canSend}
            >
              Enviar prueba
            </Button>
          </Tooltip>
          <Button
            color="brand"
            leftSection={<IconDeviceFloppy size={16} />}
            onClick={save}
            loading={saving}
            disabled={!config.certificateId || !dirty}
          >
            Guardar
          </Button>
        </>
      }
    >
      <Stack gap="md" mb="md">
        {!config.hasDesign && (
          <Alert color="orange" icon={<IconAlertTriangle size={18} />}>
            El correo solo se puede enviar cuando el certificado tiene un diseño.{' '}
            <Anchor component={Link} to={designUrl} fw={600}>
              Crear el diseño
            </Anchor>
          </Alert>
        )}
        {!config.emailConfigured && (
          <Alert color="red" icon={<IconAlertTriangle size={18} />}>
            El servidor no tiene configurado el envío de correos (AWS SES: AWS_ACCESS_KEY_ID,
            AWS_SECRET_ACCESS_KEY, AWS_REGION y AWS_SES_EMAIL_FROM). Puedes editar la plantilla,
            pero no se enviará nada.
          </Alert>
        )}
      </Stack>

      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, lg: 5 }}>
          <Stack gap="md">
            <Card withBorder radius="md" padding="lg">
              <Text fw={700} mb="sm">
                Envío
              </Text>
              <Stack gap="sm">
                <Tooltip
                  label="Primero crea el diseño del certificado"
                  disabled={config.hasDesign}
                  position="top-start"
                >
                  <div>
                    <Switch
                      color="brand"
                      label="Habilitar envío de correos"
                      description="Sin esto no se envía ningún correo de este evento"
                      checked={settings.enabled}
                      disabled={!config.hasDesign}
                      onChange={(e) => set('enabled', e.currentTarget.checked)}
                    />
                  </div>
                </Tooltip>
                <Switch
                  color="brand"
                  label="Enviar automáticamente al crear el certificado"
                  description="Cada persona que se agregue (individual o carga masiva) recibe el correo"
                  checked={settings.autoSend}
                  disabled={!settings.enabled}
                  onChange={(e) => set('autoSend', e.currentTarget.checked)}
                />
                <Group gap="xs" mt={4}>
                  <Badge variant="light" color="gray">
                    {config.stats.total} con certificado
                  </Badge>
                  <Badge variant="light" color="green">
                    {config.stats.sent} enviados
                  </Badge>
                  <Badge variant="light" color="brand">
                    {config.stats.pending} pendientes
                  </Badge>
                  {config.stats.failed > 0 && (
                    <Badge variant="light" color="red">
                      {config.stats.failed} con error
                    </Badge>
                  )}
                  {config.sending && (
                    <Badge color="orange" leftSection={<Loader size={10} color="white" />}>
                      Enviando…
                    </Badge>
                  )}
                </Group>
                <Group gap={0}>
                  <Tooltip label={bulkReason} disabled={!bulkBlocked}>
                    <Button
                      color="brand"
                      variant="light"
                      leftSection={<IconMailForward size={16} />}
                      disabled={bulkBlocked || !config.stats.pending}
                      onClick={() => setSendScope('pending')}
                      style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                    >
                      Enviar a pendientes ({config.stats.pending})
                    </Button>
                  </Tooltip>
                  <Menu position="bottom-end" withinPortal>
                    <Menu.Target>
                      <Button
                        color="brand"
                        variant="light"
                        px={8}
                        disabled={bulkBlocked}
                        style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                      >
                        <IconChevronDown size={16} />
                      </Button>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<IconUsers size={16} />}
                        onClick={() => setSendScope('all')}
                      >
                        Reenviar a todos ({config.stats.total})
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Group>
              </Stack>
            </Card>

            <Card withBorder radius="md" padding="lg">
              <Text fw={700} mb="sm">
                Datos del correo
              </Text>
              <Stack gap="sm">
                <TextInput
                  label="Asunto"
                  value={settings.subject}
                  onChange={(e) => set('subject', e.currentTarget.value)}
                />
                <TextInput
                  label="Texto de vista previa"
                  description="Lo que se ve junto al asunto en la bandeja de entrada"
                  value={settings.preheader}
                  onChange={(e) => set('preheader', e.currentTarget.value)}
                />
                <Group grow>
                  <TextInput
                    label="Nombre del remitente"
                    placeholder="Ej. ACHO"
                    value={settings.fromName}
                    onChange={(e) => set('fromName', e.currentTarget.value)}
                  />
                  <TextInput
                    label="Responder a"
                    placeholder="soporte@…"
                    value={settings.replyTo}
                    onChange={(e) => set('replyTo', e.currentTarget.value)}
                  />
                </Group>
                <Group grow>
                  <ColorInput
                    label="Fondo"
                    value={settings.backgroundColor}
                    onChange={(value) => set('backgroundColor', value)}
                  />
                  <ColorInput
                    label="Fondo del contenido"
                    value={settings.contentBackgroundColor}
                    onChange={(value) => set('contentBackgroundColor', value)}
                  />
                </Group>
                <TextInput
                  label="URL de la página de descarga"
                  description="El enlace del correo será esta URL + /descarga/<id>"
                  value={settings.linkBaseUrl}
                  onChange={(e) => set('linkBaseUrl', e.currentTarget.value)}
                />
                <Box>
                  <Text size="sm" fw={500} mb={4}>
                    Variables (clic para copiar)
                  </Text>
                  <Group gap={6}>
                    {config.variables.map((variable) => (
                      <CopyButton key={variable.key} value={`{{${variable.key}}}`}>
                        {({ copied, copy }) => (
                          <Tooltip label={copied ? 'Copiado' : variable.label}>
                            <Badge
                              variant="light"
                              color={copied ? 'green' : 'brand'}
                              style={{ cursor: 'pointer', textTransform: 'none' }}
                              onClick={copy}
                            >
                              {`{{${variable.key}}}`}
                            </Badge>
                          </Tooltip>
                        )}
                      </CopyButton>
                    ))}
                  </Group>
                </Box>
              </Stack>
            </Card>

            <Card withBorder radius="md" padding="lg">
              <Text fw={700} mb="sm">
                Estructura y contenido
              </Text>
              <EmailBlocksEditor
                blocks={settings.blocks}
                onChange={(blocks) => set('blocks', blocks)}
              />
            </Card>
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 7 }}>
          <Card
            withBorder
            radius="md"
            padding={0}
            style={{ position: 'sticky', top: 16, overflow: 'hidden' }}
          >
            <Box px="md" py="sm" style={{ borderBottom: `1px solid ${palette.border}` }}>
              <Text size="xs" c="dimmed">
                Vista previa con datos de ejemplo
              </Text>
              <Text fw={600} size="sm" lineClamp={1}>
                {preview?.subject ?? '…'}
              </Text>
            </Box>
            {preview ? (
              <iframe
                title="Vista previa del correo"
                srcDoc={preview.html}
                sandbox=""
                style={{ width: '100%', height: '75vh', border: 0, display: 'block' }}
              />
            ) : (
              <Group justify="center" p="xl">
                <Loader color="brand" />
              </Group>
            )}
          </Card>
        </Grid.Col>
      </Grid>

      <TestEmailModal
        opened={testOpen}
        onClose={() => setTestOpen(false)}
        eventId={eventId}
        settings={settings}
      />
      <Modal
        opened={sendScope !== null}
        onClose={() => setSendScope(null)}
        title={<Text fw={700}>Enviar correos</Text>}
        centered
      >
        <ConfirmSend
          eventId={eventId}
          scope={sendScope ?? 'pending'}
          count={sendScope === 'all' ? config.stats.total : config.stats.pending}
          onDone={(queued) => {
            setSendScope(null)
            setConfig((prev) => (prev ? { ...prev, sending: queued > 0 } : prev))
          }}
          onCancel={() => setSendScope(null)}
        />
      </Modal>
    </AdminPage>
  )
}

// Solo lo que cambia durante un envío (no pisar la edición en curso)
const pick = ({ stats, sending }: CertificateEmailConfig) => ({ stats, sending })

function ConfirmSend({
  eventId,
  scope,
  count,
  onDone,
  onCancel,
}: {
  eventId: string
  scope: 'pending' | 'all'
  count: number
  onDone: (queued: number) => void
  onCancel: () => void
}) {
  const [sending, setSending] = useState(false)

  const send = async () => {
    setSending(true)
    try {
      const { queued } = await sendEventEmails(eventId, scope)
      notification.success({
        message: queued
          ? `Enviando ${queued.toLocaleString('es-CO')} correos en segundo plano`
          : 'No hay correos por enviar',
      })
      onDone(queued)
    } catch (err) {
      notification.error({ message: errorMessage(err, 'No se pudo iniciar el envío') })
    } finally {
      setSending(false)
    }
  }

  return (
    <Stack gap="md">
      <Text size="sm">
        {scope === 'all'
          ? `Se reenviará el correo a las ${count.toLocaleString('es-CO')} personas con certificado, incluso a quienes ya lo recibieron.`
          : `Se enviará el correo a ${count.toLocaleString('es-CO')} personas que aún no lo han recibido.`}{' '}
        Las personas sin correo válido se omiten.
      </Text>
      <Group justify="flex-end">
        <Button variant="default" onClick={onCancel}>
          Cancelar
        </Button>
        <Button color="brand" onClick={send} loading={sending}>
          Enviar
        </Button>
      </Group>
    </Stack>
  )
}

function TestEmailModal({
  opened,
  onClose,
  eventId,
  settings,
}: {
  opened: boolean
  onClose: () => void
  eventId: string
  settings: CertificateEmailSettings
}) {
  const [to, setTo] = useState('')
  const [sending, setSending] = useState(false)

  const send = async () => {
    setSending(true)
    try {
      const result = await sendTestEmail(eventId, to.trim(), settings)
      notification.success({ message: `Correo de prueba enviado a ${result.to}` })
      onClose()
    } catch (err) {
      notification.error({ message: errorMessage(err, 'No se pudo enviar la prueba') })
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={700}>Enviar correo de prueba</Text>}
      centered
    >
      <Stack gap="sm">
        <Text size="xs" c="dimmed">
          Se envía la versión actual (aunque no esté guardada) con datos de ejemplo.
        </Text>
        <TextInput
          label="Enviar a"
          placeholder="tucorreo@ejemplo.com"
          value={to}
          onChange={(e) => setTo(e.currentTarget.value)}
          data-autofocus
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancelar
          </Button>
          <Button color="brand" onClick={send} loading={sending} disabled={!to.includes('@')}>
            Enviar
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
