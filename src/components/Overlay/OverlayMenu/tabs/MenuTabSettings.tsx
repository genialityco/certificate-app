import { Button, NativeSelect, Text } from '@mantine/core'
import { IconMoon, IconSun } from '@tabler/icons-react'

import ColorPickerElement from '@/components/ColorPicker/ColorPickerElement'
import { COLOR_PICKERS } from '@/config/constants'
import { type ColorPickerType } from '@/config/types'
import useColorSchemeContext from '@/context/useColorSchemeContext'
import useDefaultParams from '@/store/useDefaultParams'

export default function MenuTabSettings() {
  const { colorScheme, toggleColorScheme } = useColorSchemeContext()

  const defaultParams = useDefaultParams((state) => state.defaultParams)
  const setDefaultParams = useDefaultParams((state) => state.setDefaultParams)

  return (
    <>
      <h3>Color Theme</h3>
      <Text style={{ marginBottom: '0.6rem' }}>
        Switch to {colorScheme === 'light' ? 'dark' : 'light'} mode theme.
      </Text>
      <Button
        size="xs"
        variant="default"
        onClick={() => {
          toggleColorScheme()
        }}
        rightSection={colorScheme === 'light' ? <IconMoon /> : <IconSun />}
      >
        Switch
      </Button>
      <h3 style={{ marginTop: '1.5rem' }}>Color Picker</h3>
      <Text style={{ marginBottom: '0.6rem' }}> Choose the default color picker style.</Text>
      <NativeSelect
        key={`color-picker-select-${defaultParams.activeColorPicker}`}
        size="xs"
        data={COLOR_PICKERS.map((colorPicker) => ({
          value: colorPicker,
          label: colorPicker?.replace('Picker', '')?.replace('Github', 'GitHub'),
        }))}
        value={defaultParams.activeColorPicker}
        onChange={(event) => {
          setDefaultParams({
            activeColorPicker: event.target.value as ColorPickerType,
          })
        }}
      />
      <ColorPickerElement type={defaultParams.activeColorPicker} />
    </>
  )
}
