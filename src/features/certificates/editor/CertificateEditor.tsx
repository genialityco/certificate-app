import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Image,
  Loader,
  Modal,
  Paper,
  Text,
  Tooltip,
} from '@mantine/core'
import { IconArrowBackUp, IconArrowForwardUp, IconDeviceFloppy, IconEye } from '@tabler/icons-react'

import { formatEventName } from '@/features/admin/format'
import { saveEventCertificate, uploadImage } from '@/services/api/certificateAdminService'
import fileToBase64 from '@/utils/fileToBase64'
import generateUniqueId from '@/utils/generateUniqueId'
import notification from '@/utils/notification'

import { DEFAULT_ATTENDEE_FIELDS, allFields } from '../fields'
import {
  DEFAULT_SIZE,
  ELEMENT_VERSION,
  loadImage,
  renderCertificateToCanvas,
} from '../renderCertificate'
import { type CertificateDoc, type CertificateElement, type CertificateField } from '../types'
import { EditorSidebar } from './EditorSidebar'
import { EditorStage } from './EditorStage'
import { ElementToolbar } from './ElementToolbar'
import { newTextElement, useEditorState } from './useEditorState'

// Una imagen que cubre todo el lienzo desde la esquina es el fondo
const markBackground = (elements: CertificateElement[], size: { width: number; height: number }) =>
  elements.map((el, index) =>
    el.type === 'image' &&
    index === 0 &&
    Math.abs(el.x) < 5 &&
    Math.abs(el.y) < 5 &&
    el.width >= size.width * 0.95 &&
    el.height >= size.height * 0.95
      ? { ...el, isBackground: true }
      : el,
  )

const sampleValuesFor = (eventName: string, fields: CertificateField[]) => ({
  fullName: 'María Fernanda Gómez Restrepo',
  idNumber: '1.234.567.890',
  email: 'maria.gomez@correo.com',
  phone: '300 123 4567',
  eventName,
  typeAttendee: 'Asistente',
  certificationHours: '20',
  ...Object.fromEntries(
    fields
      .filter((f) => !['typeAttendee', 'certificationHours'].includes(f.key))
      .map((f) => [f.key, f.label]),
  ),
})

// Los elementos del editor antiguo pueden traer campos que no se deben guardar
const cleanForSave = (elements: CertificateElement[]) =>
  elements.map((el) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { imageElement, ...rest } = el as CertificateElement & { imageElement?: unknown }
    return rest
  })

interface Props {
  eventId: string
  eventName: string
  certificate: CertificateDoc | null
  onSaved?: (certificate: CertificateDoc) => void
}

export function CertificateEditor({ eventId, eventName, certificate, onSaved }: Props) {
  const initialSize = certificate?.size?.width ? certificate.size : DEFAULT_SIZE
  const [size, setSize] = useState(initialSize)
  const state = useEditorState(markBackground(certificate?.elements ?? [], initialSize))
  const [fields, setFields] = useState<CertificateField[]>(
    certificate?.fields?.length ? certificate.fields : DEFAULT_ATTENDEE_FIELDS,
  )
  const [certificateId, setCertificateId] = useState<string | null>(certificate?._id ?? null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const { elements, selectedId, dirty } = state
  const selected = elements.find((el) => el.id === selectedId)
  const fieldsForSelect = useMemo(() => allFields(fields), [fields])
  const fieldLabels = useMemo(
    () => Object.fromEntries(fieldsForSelect.map((f) => [f.key, f.label])),
    [fieldsForSelect],
  )
  const sampleValues = useMemo(() => sampleValuesFor(eventName, fields), [eventName, fields])
  const usageByKey = useMemo(
    () =>
      elements
        .filter((el) => el.type === 'attribute')
        .reduce<Record<string, number>>((acc, el) => {
          acc[el.text ?? ''] = (acc[el.text ?? ''] ?? 0) + 1
          return acc
        }, {}),
    [elements],
  )

  const handleBackground = async (file: File) => {
    setUploading(true)
    try {
      let url: string
      try {
        url = await uploadImage(file)
      } catch {
        url = (await fileToBase64(file)) as string
      }
      const image = await loadImage(url)
      const nextSize = { width: image.naturalWidth, height: image.naturalHeight }
      const ratioX = nextSize.width / size.width
      const ratioY = nextSize.height / size.height
      const sizeChanged = ratioX !== 1 || ratioY !== 1

      state.commit((prev) => {
        // Si cambia el tamaño, los textos se reubican en la misma proporción
        const rest = prev
          .filter((el) => !el.isBackground)
          .map((el) =>
            sizeChanged
              ? {
                  ...el,
                  x: Math.round(el.x * ratioX),
                  y: Math.round(el.y * ratioY),
                  width: Math.round(el.width * ratioX),
                  height: Math.round(el.height * ratioY),
                  fontSize: el.fontSize ? Math.round(el.fontSize * ratioY) : el.fontSize,
                }
              : el,
          )
        const background: CertificateElement = {
          id: generateUniqueId(),
          version: ELEMENT_VERSION,
          type: 'image',
          isBackground: true,
          x: 0,
          y: 0,
          ...nextSize,
          opacity: 100,
          imageUrl: url,
        }
        return [background, ...rest]
      })
      setSize(nextSize)
    } catch (error) {
      notification.error({ message: 'No se pudo cargar la imagen' })
    } finally {
      setUploading(false)
    }
  }

  const handleSave = useCallback(async () => {
    if (saving) return
    setSaving(true)
    try {
      const saved = await saveEventCertificate(certificateId, {
        eventId,
        elements: cleanForSave(elements),
        size,
        fields,
      })
      if (saved?._id) setCertificateId(saved._id)
      state.setDirty(false)
      notification.success({ message: 'Certificado guardado' })
      onSaved?.(saved)
    } catch (error) {
      notification.error({ message: 'No se pudo guardar el certificado' })
    } finally {
      setSaving(false)
    }
  }, [saving, certificateId, eventId, elements, size, fields, state, onSaved])

  const openPreview = async () => {
    setPreviewOpen(true)
    setPreview(null)
    try {
      const canvas = document.createElement('canvas')
      await renderCertificateToCanvas(canvas, elements, size, sampleValues)
      setPreview(canvas.toDataURL('image/png'))
    } catch {
      notification.error({ message: 'No se pudo generar la vista previa' })
      setPreviewOpen(false)
    }
  }

  // Atajos de teclado
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      const typing =
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable
      const mod = event.ctrlKey || event.metaKey

      if (mod && event.key.toLowerCase() === 's') {
        event.preventDefault()
        handleSave()
        return
      }
      if (typing) return
      if (mod && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) state.redo()
        else state.undo()
        return
      }
      if (mod && event.key.toLowerCase() === 'y') {
        event.preventDefault()
        state.redo()
        return
      }
      if (!selected || selected.isBackground) return
      if (mod && event.key.toLowerCase() === 'd') {
        event.preventDefault()
        state.duplicateElement(selected.id)
        return
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault()
        state.removeElement(selected.id)
        return
      }
      const step = event.shiftKey ? 10 : 1
      const moves: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      }
      if (moves[event.key]) {
        event.preventDefault()
        const [dx, dy] = moves[event.key]
        state.updateElement(selected.id, { x: selected.x + dx, y: selected.y + dy })
      }
      if (event.key === 'Escape') state.setSelectedId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleSave, selected, state])

  // Avisar si se sale con cambios sin guardar
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  const updateFields = (next: CertificateField[]) => {
    setFields(next)
    state.setDirty(true)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Paper
        px="md"
        py={10}
        radius={0}
        withBorder
        style={{ borderLeft: 0, borderRight: 0, borderTop: 0 }}
      >
        <Group justify="space-between">
          <Group gap="xs">
            <Text fw={700}>{formatEventName(eventName)}</Text>
            {dirty ? (
              <Badge color="orange" variant="light">
                Cambios sin guardar
              </Badge>
            ) : (
              <Badge color="green" variant="light">
                {certificateId ? 'Guardado' : 'Nuevo'}
              </Badge>
            )}
          </Group>
          <Group gap="xs">
            <Tooltip label="Deshacer (Ctrl+Z)">
              <ActionIcon
                variant="default"
                size="lg"
                onClick={state.undo}
                disabled={!state.canUndo}
              >
                <IconArrowBackUp size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Rehacer (Ctrl+Y)">
              <ActionIcon
                variant="default"
                size="lg"
                onClick={state.redo}
                disabled={!state.canRedo}
              >
                <IconArrowForwardUp size={18} />
              </ActionIcon>
            </Tooltip>
            <Button variant="default" leftSection={<IconEye size={16} />} onClick={openPreview}>
              Vista previa
            </Button>
            <Button
              color="brand"
              leftSection={<IconDeviceFloppy size={16} />}
              onClick={handleSave}
              loading={saving}
              disabled={!dirty && !!certificateId}
            >
              Guardar
            </Button>
          </Group>
        </Group>
      </Paper>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <EditorSidebar
          hasBackground={elements.some((el) => el.isBackground)}
          uploading={uploading}
          onBackground={handleBackground}
          onAddText={() => state.addElement(newTextElement('text', 'Texto', size))}
          onAddField={(key) => state.addElement(newTextElement('attribute', key, size))}
          attendeeFields={fields}
          onFieldsChange={updateFields}
          usageByKey={usageByKey}
        />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <ElementToolbar
            state={state}
            element={selected}
            fields={fieldsForSelect}
            canvasWidth={size.width}
          />
          <EditorStage
            state={state}
            size={size}
            sampleValues={sampleValues}
            fieldLabels={fieldLabels}
          />
        </div>
      </div>

      <Modal
        opened={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Vista previa con datos de ejemplo"
        size="80%"
        centered
      >
        {preview ? (
          <Image src={preview} alt="Vista previa" />
        ) : (
          <Group justify="center" p="xl">
            <Loader color="brand" />
          </Group>
        )}
      </Modal>
    </div>
  )
}
