import {
  ActionIcon,
  ColorInput,
  Divider,
  Group,
  NumberInput,
  Paper,
  Select,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core'
import {
  IconAlignCenter,
  IconAlignLeft,
  IconAlignRight,
  IconArrowsHorizontal,
  IconBold,
  IconChevronDown,
  IconChevronUp,
  IconCopy,
  IconItalic,
  IconLayoutAlignBottom,
  IconLayoutAlignMiddle,
  IconLayoutAlignTop,
  IconMinus,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react'

import { type CertificateElement, type CertificateField } from '../types'
import { type EditorState } from './useEditorState'

export const FONT_FAMILIES = [
  'Montserrat',
  'Poppins',
  'Roboto',
  'Open Sans',
  'Lora',
  'Playfair Display',
  'Great Vibes',
  'Dancing Script',
  'Arial',
  'Georgia',
  'Times New Roman',
  'Verdana',
  'Trebuchet MS',
]

interface Props {
  state: EditorState
  element: CertificateElement | undefined
  fields: CertificateField[]
  canvasWidth: number
}

const isBold = (weight?: string) =>
  weight === 'bold' || weight === 'bolder' || Number(weight) >= 600

export function ElementToolbar({ state, element, fields, canvasWidth }: Props) {
  if (!element || element.isBackground) {
    return (
      <Paper
        px="md"
        py={10}
        radius={0}
        withBorder
        style={{ borderLeft: 0, borderRight: 0, borderTop: 0 }}
      >
        <Text size="sm" c="dimmed">
          Selecciona un texto del certificado para editarlo. Arrástralo para moverlo y usa los
          puntos de las esquinas para cambiar su tamaño.
        </Text>
      </Paper>
    )
  }

  const update = (patch: Partial<CertificateElement>) => state.updateElement(element.id, patch)
  const isText = element.type === 'text' || element.type === 'attribute'
  const fontSize = element.fontSize ?? 32

  // Expandir / comprimir la caja del texto manteniendo su centro
  const resizeBox = (factor: number) => {
    const width = Math.max(Math.round(element.width * factor), 20)
    const clamped = Math.min(width, canvasWidth)
    update({ width: clamped, x: Math.round(element.x + (element.width - clamped) / 2) })
  }

  return (
    <Paper
      px="md"
      py={8}
      radius={0}
      withBorder
      style={{ borderLeft: 0, borderRight: 0, borderTop: 0 }}
    >
      <Group gap="xs" wrap="wrap">
        {element.type === 'attribute' && (
          <Select
            size="xs"
            w={190}
            aria-label="Campo"
            data={fields.map((f) => ({ value: f.key, label: f.label }))}
            value={element.text ?? null}
            onChange={(value) => value && update({ text: value })}
            allowDeselect={false}
            searchable
          />
        )}
        {element.type === 'text' && (
          <TextInput
            size="xs"
            w={260}
            aria-label="Texto"
            value={element.text ?? ''}
            onChange={(e) => update({ text: e.currentTarget.value })}
          />
        )}

        {isText && (
          <>
            <Divider orientation="vertical" />
            <Select
              size="xs"
              w={160}
              aria-label="Fuente"
              data={FONT_FAMILIES}
              value={element.fontFamily ?? 'Montserrat'}
              onChange={(value) => value && update({ fontFamily: value })}
              allowDeselect={false}
              styles={{ input: { fontFamily: element.fontFamily } }}
            />
            <Group gap={2}>
              <Tooltip label="Achicar letra">
                <ActionIcon
                  variant="default"
                  size="md"
                  onClick={() => update({ fontSize: Math.max(fontSize - 2, 6) })}
                >
                  <IconMinus size={14} />
                </ActionIcon>
              </Tooltip>
              <NumberInput
                size="xs"
                w={64}
                aria-label="Tamaño de letra"
                value={fontSize}
                min={6}
                max={400}
                hideControls
                onChange={(value) => typeof value === 'number' && update({ fontSize: value })}
              />
              <Tooltip label="Agrandar letra">
                <ActionIcon
                  variant="default"
                  size="md"
                  onClick={() => update({ fontSize: Math.min(fontSize + 2, 400) })}
                >
                  <IconPlus size={14} />
                </ActionIcon>
              </Tooltip>
            </Group>
            <Group gap={2}>
              <Tooltip label="Negrita">
                <ActionIcon
                  variant={isBold(element.fontWeight) ? 'filled' : 'default'}
                  color="brand"
                  onClick={() =>
                    update({ fontWeight: isBold(element.fontWeight) ? 'normal' : 'bold' })
                  }
                >
                  <IconBold size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Cursiva">
                <ActionIcon
                  variant={element.fontStyle === 'italic' ? 'filled' : 'default'}
                  color="brand"
                  onClick={() =>
                    update({ fontStyle: element.fontStyle === 'italic' ? 'normal' : 'italic' })
                  }
                >
                  <IconItalic size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
            <ColorInput
              size="xs"
              w={120}
              aria-label="Color"
              value={element.fontColorHex ?? '#000000'}
              onChange={(value) => update({ fontColorHex: value })}
              format="hex"
            />
            <Divider orientation="vertical" />
            <Group gap={2}>
              {(
                [
                  ['left', IconAlignLeft, 'Alinear a la izquierda'],
                  ['center', IconAlignCenter, 'Centrar'],
                  ['right', IconAlignRight, 'Alinear a la derecha'],
                ] as const
              ).map(([value, Icon, label]) => (
                <Tooltip key={value} label={label}>
                  <ActionIcon
                    variant={
                      (element.textAlignHorizontal ?? 'center') === value ? 'filled' : 'default'
                    }
                    color="brand"
                    onClick={() => update({ textAlignHorizontal: value, version: 2 })}
                  >
                    <Icon size={16} />
                  </ActionIcon>
                </Tooltip>
              ))}
            </Group>
            <Group gap={2}>
              {(
                [
                  ['top', IconLayoutAlignTop, 'Arriba'],
                  ['middle', IconLayoutAlignMiddle, 'Al medio'],
                  ['bottom', IconLayoutAlignBottom, 'Abajo'],
                ] as const
              ).map(([value, Icon, label]) => (
                <Tooltip key={value} label={label}>
                  <ActionIcon
                    variant={
                      (element.textAlignVertical ?? 'middle') === value ? 'filled' : 'default'
                    }
                    color="brand"
                    onClick={() => update({ textAlignVertical: value, version: 2 })}
                  >
                    <Icon size={16} />
                  </ActionIcon>
                </Tooltip>
              ))}
            </Group>
          </>
        )}

        <Divider orientation="vertical" />
        <Group gap={2}>
          <Tooltip label="Comprimir caja">
            <ActionIcon variant="default" onClick={() => resizeBox(0.9)}>
              <IconArrowsHorizontal size={16} style={{ transform: 'scaleX(0.6)' }} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Expandir caja">
            <ActionIcon variant="default" onClick={() => resizeBox(1.1)}>
              <IconArrowsHorizontal size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Centrar en el certificado">
            <ActionIcon
              variant="default"
              onClick={() => update({ x: Math.round((canvasWidth - element.width) / 2) })}
            >
              <IconAlignCenter size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
        <Group gap={2}>
          <Tooltip label="Traer adelante">
            <ActionIcon variant="default" onClick={() => state.moveLayer(element.id, 1)}>
              <IconChevronUp size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Enviar atrás">
            <ActionIcon variant="default" onClick={() => state.moveLayer(element.id, -1)}>
              <IconChevronDown size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Duplicar (Ctrl+D)">
            <ActionIcon variant="default" onClick={() => state.duplicateElement(element.id)}>
              <IconCopy size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Eliminar (Supr)">
            <ActionIcon variant="light" color="red" onClick={() => state.removeElement(element.id)}>
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>
    </Paper>
  )
}
