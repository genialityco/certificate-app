import { useRef, useState } from 'react'

import {
  ActionIcon,
  Button,
  Card,
  ColorInput,
  FileButton,
  Group,
  Menu,
  NumberInput,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  Textarea,
  Tooltip,
} from '@mantine/core'
import {
  IconArrowDown,
  IconArrowUp,
  IconClick,
  IconCode,
  IconH1,
  IconLineDashed,
  IconPhoto,
  IconPlus,
  IconSeparatorHorizontal,
  IconTextSize,
  IconTrash,
  IconUpload,
} from '@tabler/icons-react'

import {
  type EmailAlign,
  type EmailBlock,
  type EmailBlockType,
} from '@/features/certificates/types'
import { uploadImage } from '@/services/api/certificateAdminService'
import notification from '@/utils/notification'

const BLOCK_META: Record<EmailBlockType, { label: string; icon: JSX.Element }> = {
  heading: { label: 'Título', icon: <IconH1 size={16} /> },
  text: { label: 'Texto', icon: <IconTextSize size={16} /> },
  button: { label: 'Botón de descarga', icon: <IconClick size={16} /> },
  image: { label: 'Imagen', icon: <IconPhoto size={16} /> },
  divider: { label: 'Línea divisoria', icon: <IconSeparatorHorizontal size={16} /> },
  spacer: { label: 'Espacio', icon: <IconLineDashed size={16} /> },
  html: { label: 'HTML personalizado', icon: <IconCode size={16} /> },
}

const newId = () => Math.random().toString(36).slice(2, 10)

const createBlock = (type: EmailBlockType): EmailBlock => {
  const id = newId()
  switch (type) {
    case 'heading':
      return { id, type, text: 'Título', align: 'center', color: '#1f2d3d', size: 26 }
    case 'text':
      return { id, type, text: '', align: 'center', color: '#3d4b5c', size: 16 }
    case 'button':
      return {
        id,
        type,
        text: 'Descargar certificado',
        align: 'center',
        color: '#4d93d0',
        textColor: '#ffffff',
      }
    case 'image':
      return { id, type, url: '', width: 200, align: 'center', alt: '' }
    case 'divider':
      return { id, type, color: '#e3ecf5' }
    case 'spacer':
      return { id, type, height: 16 }
    default:
      return { id, type: 'html', html: '<p style="margin:0">{{fullName}}</p>' }
  }
}

const ALIGN_OPTIONS = [
  { value: 'left', label: 'Izq.' },
  { value: 'center', label: 'Centro' },
  { value: 'right', label: 'Der.' },
]

interface Props {
  blocks: EmailBlock[]
  onChange: (blocks: EmailBlock[]) => void
}

export function EmailBlocksEditor({ blocks, onChange }: Props) {
  const update = (id: string, patch: Partial<EmailBlock>) =>
    onChange(blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as EmailBlock) : b)))

  const move = (index: number, delta: number) => {
    const next = [...blocks]
    const [item] = next.splice(index, 1)
    next.splice(index + delta, 0, item)
    onChange(next)
  }

  const add = (type: EmailBlockType) => onChange([...blocks, createBlock(type)])
  const remove = (id: string) => onChange(blocks.filter((b) => b.id !== id))

  return (
    <Stack gap="sm">
      {blocks.map((block, index) => (
        <Card key={block.id} withBorder radius="md" padding="sm">
          <Group justify="space-between" mb="xs">
            <Group gap={6}>
              {BLOCK_META[block.type].icon}
              <Text size="sm" fw={600}>
                {BLOCK_META[block.type].label}
              </Text>
            </Group>
            <Group gap={2}>
              <Tooltip label="Subir">
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <IconArrowUp size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Bajar">
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  disabled={index === blocks.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <IconArrowDown size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Eliminar bloque">
                <ActionIcon variant="subtle" color="red" onClick={() => remove(block.id)}>
                  <IconTrash size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>
          <BlockFields block={block} onChange={(patch) => update(block.id, patch)} />
        </Card>
      ))}

      {!blocks.some((b) => b.type === 'button') && (
        <Text size="xs" c="orange.8">
          El correo no tiene botón de descarga. Agrega uno o usa {'{{link}}'} en un texto.
        </Text>
      )}

      <Menu position="bottom-start" withinPortal>
        <Menu.Target>
          <Button variant="light" color="brand" leftSection={<IconPlus size={16} />}>
            Agregar bloque
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          {(Object.keys(BLOCK_META) as EmailBlockType[]).map((type) => (
            <Menu.Item key={type} leftSection={BLOCK_META[type].icon} onClick={() => add(type)}>
              {BLOCK_META[type].label}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>
    </Stack>
  )
}

function BlockFields({
  block,
  onChange,
}: {
  block: EmailBlock
  onChange: (patch: Partial<EmailBlock>) => void
}) {
  const alignControl = 'align' in block && (
    <SegmentedControl
      size="xs"
      data={ALIGN_OPTIONS}
      value={block.align ?? 'center'}
      onChange={(value) => onChange({ align: value as EmailAlign })}
    />
  )

  switch (block.type) {
    case 'heading':
    case 'text':
      return (
        <Stack gap="xs">
          {block.type === 'heading' ? (
            <TextInput
              value={block.text}
              onChange={(e) => onChange({ text: e.currentTarget.value })}
            />
          ) : (
            <Textarea
              value={block.text}
              onChange={(e) => onChange({ text: e.currentTarget.value })}
              autosize
              minRows={3}
            />
          )}
          <Group gap="xs" align="flex-end">
            {alignControl}
            <ColorInput
              size="xs"
              w={120}
              value={block.color}
              onChange={(color) => onChange({ color })}
            />
            <NumberInput
              size="xs"
              w={80}
              suffix=" px"
              min={10}
              max={48}
              value={block.size}
              onChange={(size) => onChange({ size: Number(size) || undefined })}
            />
          </Group>
        </Stack>
      )
    case 'button':
      return (
        <Stack gap="xs">
          <TextInput
            value={block.text}
            onChange={(e) => onChange({ text: e.currentTarget.value })}
            description="Lleva a la página de descarga del certificado"
          />
          <Group gap="xs" align="flex-end">
            {alignControl}
            <ColorInput
              size="xs"
              w={120}
              label="Fondo"
              value={block.color}
              onChange={(color) => onChange({ color })}
            />
            <ColorInput
              size="xs"
              w={120}
              label="Texto"
              value={block.textColor}
              onChange={(textColor) => onChange({ textColor })}
            />
          </Group>
        </Stack>
      )
    case 'image':
      return <ImageFields block={block} onChange={onChange} alignControl={alignControl} />
    case 'divider':
      return (
        <ColorInput
          size="xs"
          w={140}
          value={block.color}
          onChange={(color) => onChange({ color })}
        />
      )
    case 'spacer':
      return (
        <NumberInput
          size="xs"
          w={120}
          suffix=" px"
          min={4}
          max={120}
          value={block.height}
          onChange={(height) => onChange({ height: Number(height) || 16 })}
        />
      )
    case 'html':
      return (
        <Textarea
          value={block.html}
          onChange={(e) => onChange({ html: e.currentTarget.value })}
          autosize
          minRows={4}
          styles={{ input: { fontFamily: 'monospace', fontSize: 12 } }}
          description="Las variables se reemplazan con los datos de cada persona"
        />
      )
  }
}

function ImageFields({
  block,
  onChange,
  alignControl,
}: {
  block: Extract<EmailBlock, { type: 'image' }>
  onChange: (patch: Partial<EmailBlock>) => void
  alignControl: React.ReactNode
}) {
  const [uploading, setUploading] = useState(false)
  const resetRef = useRef<() => void>(null)

  const upload = async (file: File | null) => {
    if (!file) return
    setUploading(true)
    try {
      onChange({ url: await uploadImage(file) })
    } catch {
      notification.error({ message: 'No se pudo subir la imagen' })
    } finally {
      setUploading(false)
      resetRef.current?.()
    }
  }

  return (
    <Stack gap="xs">
      <Group gap="xs" align="flex-end" wrap="nowrap">
        <TextInput
          style={{ flex: 1 }}
          placeholder="https://…"
          value={block.url}
          onChange={(e) => onChange({ url: e.currentTarget.value })}
        />
        <FileButton onChange={upload} accept="image/png,image/jpeg,image/gif" resetRef={resetRef}>
          {(props) => (
            <Button
              {...props}
              variant="default"
              loading={uploading}
              leftSection={<IconUpload size={14} />}
            >
              Subir
            </Button>
          )}
        </FileButton>
      </Group>
      <Group gap="xs" align="flex-end">
        {alignControl}
        <NumberInput
          size="xs"
          w={100}
          label="Ancho"
          suffix=" px"
          min={20}
          max={600}
          value={block.width}
          onChange={(width) => onChange({ width: Number(width) || 200 })}
        />
        <TextInput
          size="xs"
          label="Texto alternativo"
          value={block.alt ?? ''}
          onChange={(e) => onChange({ alt: e.currentTarget.value })}
        />
      </Group>
    </Stack>
  )
}
