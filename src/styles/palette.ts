import { type MantineColorsTuple } from '@mantine/core'

// Paleta del admin y de la consulta pública: blanco, azul claro y naranja suave
const brand: MantineColorsTuple = [
  '#f0f7fd',
  '#e1effa',
  '#c6e0f5',
  '#a6cdee',
  '#86bae6',
  '#68a7dd',
  '#4d93d0',
  '#3d7fba',
  '#336b9c',
  '#29577f',
]

const accent: MantineColorsTuple = [
  '#fff7ef',
  '#ffeddc',
  '#fdd9b6',
  '#fbc48e',
  '#f8af6b',
  '#f39d52',
  '#ea8c42',
  '#cc7433',
  '#a95e29',
  '#874b21',
]

const palette = {
  page: '#f7fafd',
  surface: '#ffffff',
  border: '#e3ecf5',
  text: '#1f2d3d',
  muted: '#6b7c8f',
  primary: brand[6],
  primarySoft: brand[0],
  primaryLight: brand[2],
  accent: accent[5],
  accentSoft: accent[0],
}

export { accent, brand, palette }
