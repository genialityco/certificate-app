import { createTheme } from '@mantine/core'

import { accent, brand } from './palette'

const theme = createTheme({
  focusRing: 'never',
  scale: 1,
  colors: { brand, accent },
})

export { theme }
