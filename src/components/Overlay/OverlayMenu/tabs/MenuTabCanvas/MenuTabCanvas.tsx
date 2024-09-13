import { Button, Checkbox, ComboboxItem, NumberInput, OptionsFilter, Select } from '@mantine/core'
import { IconArrowAutofitWidth, IconLineHeight, IconRestore } from '@tabler/icons-react'

import ColorPicker from '@/components/ColorPicker'
import useCanvasContext from '@/context/useCanvasContext'
import useCanvasBackgroundColor from '@/store/useCanvasBackgroundColor'
import useCanvasObjects from '@/store/useCanvasObjects'
import useCanvasWorkingSize from '@/store/useCanvasWorkingSize'
import useDefaultParams from '@/store/useDefaultParams'
import theme from '@/theme'
import getSizePresetDataFromSlug from '@/utils/getSizePresetDataFromSlug'
import getSizePresetOptions from '@/utils/getSizePresetOptions'

import SizePresetSelectItem, { SizePresetOption } from './SizePresetSelectItem'

const data = getSizePresetOptions()

interface Props {
  closeModal: () => void
}

export default function MenuTabCanvas({ closeModal }: Props) {
  const { setCenter } = useCanvasContext()
  const resetCanvasObjects = useCanvasObjects((state) => state.resetCanvasObjects)
  const defaultParams = useDefaultParams((state) => state.defaultParams)
  const setDefaultParams = useDefaultParams((state) => state.setDefaultParams)
  const canvasWorkingSize = useCanvasWorkingSize((state) => state.canvasWorkingSize)
  const setCanvasWorkingWidth = useCanvasWorkingSize((state) => state.setCanvasWorkingWidth)
  const setCanvasWorkingHeight = useCanvasWorkingSize((state) => state.setCanvasWorkingHeight)
  const canvasBackgroundColor = useCanvasBackgroundColor((state) => state.canvasBackgroundColor)
  const setCanvasBackgroundColor = useCanvasBackgroundColor(
    (state) => state.setCanvasBackgroundColor,
  )

  const optionsFilter: OptionsFilter = ({ options, search }) => {
    const splittedSearch = search.toLowerCase().trim().split(' ')
    return (options as ComboboxItem[]).filter((option) => {
      const words = option.label.toLowerCase().trim().split(' ')
      return splittedSearch.every((searchWord) => words.some((word) => word.includes(searchWord)))
    })
  }

  return (
    <>
      <h2>Canvas Size</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: theme.medias.gteMedium ? 'repeat(2, minmax(0, 1fr))' : '1fr',
          gridGap: '0.75rem',
          marginBottom: '0.5rem',
        }}
      >
        <NumberInput
          label="Width"
          min={0}
          max={5000}
          value={canvasWorkingSize.width}
          onChange={(value) => {
            const numericValue = typeof value === 'number' ? value : parseFloat(value)
            if (numericValue && numericValue !== canvasWorkingSize.width) {
              setCanvasWorkingWidth(numericValue)
              setDefaultParams({
                sizePreset: null,
              })
              setCenter()
            }
          }}
          leftSection={<IconArrowAutofitWidth />}
          rightSection="px"
          rightSectionWidth={40}
        />
        <NumberInput
          label="Height"
          min={0}
          max={5000}
          value={canvasWorkingSize.height}
          onChange={(value) => {
            const numericValue = typeof value === 'number' ? value : parseFloat(value)
            if (numericValue && numericValue !== canvasWorkingSize.height) {
              setCanvasWorkingHeight(numericValue)
              setDefaultParams({
                sizePreset: null,
              })
              setCenter()
            }
          }}
          leftSection={<IconLineHeight />}
          rightSection="px"
          rightSectionWidth={40}
        />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <Select
          variant="default"
          size="sm"
          label="Presets"
          placeholder="Search presets"
          component={(item: unknown) => (
            <SizePresetSelectItem {...(item as unknown as SizePresetOption)} />
          )}
          data={data}
          searchable
          value={defaultParams.sizePreset}
          maxDropdownHeight={400}
          filter={optionsFilter}
          onChange={(value) => {
            const sizePresetData = getSizePresetDataFromSlug(value)
            if (sizePresetData) {
              setCanvasWorkingWidth(sizePresetData.width)
              setCanvasWorkingHeight(sizePresetData.height)
              setDefaultParams({
                sizePreset: value,
              })
              setCenter()
            }
          }}
        />
      </div>
      <h2 style={{ marginBottom: 0 }}>Canvas Background</h2>
      <div
        style={{
          marginTop: '0.7rem',
          marginBottom: '1rem',
          display: 'grid',
          gridTemplateColumns: '1fr',
          gridGap: '1rem',
        }}
      >
        {canvasBackgroundColor !== 'transparent' && (
          <ColorPicker
            color={canvasBackgroundColor}
            onChange={(color) => {
              setCanvasBackgroundColor(color)
              setDefaultParams({
                canvasBackgroundColor: color,
              })
            }}
          />
        )}
        <Checkbox
          size="sm"
          label="Transparent"
          checked={canvasBackgroundColor === 'transparent'}
          onChange={(event) => {
            if (event.target.checked) {
              setCanvasBackgroundColor('transparent')
            } else {
              setCanvasBackgroundColor(defaultParams.canvasBackgroundColor)
            }
          }}
        />
      </div>
      <h2>Reset Canvas</h2>
      <Button
        size="xs"
        variant="default"
        leftSection={<IconRestore />}
        onClick={() => {
          resetCanvasObjects()
          setCenter()
          closeModal()
        }}
      >
        Reset
      </Button>
    </>
  )
}
