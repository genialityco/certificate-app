import { drawText } from 'canvas-txt'

import { type AttributeObject } from '@/config/types'
import hexToRgba from '@/utils/hexToRgba'

export default function renderAttribute({
  context,
  x,
  y,
  width,
  height,
  opacity,
  text,
  fontColorHex,
  fontSize,
  fontFamily,
  fontStyle,
  fontVariant,
  fontWeight,
  fontLineHeightRatio,
}: {
  context: CanvasRenderingContext2D
} & Omit<AttributeObject, 'type'>): void {
  context.beginPath()

  context.fillStyle = hexToRgba({ hex: fontColorHex, opacity })

  // Usar drawText directamente
  drawText(context, text, {
    x,
    y,
    width,
    height,
    fontSize,
    font: fontFamily,
    fontStyle,
    fontVariant,
    fontWeight,
    align: 'center',
    vAlign: 'middle',
    lineHeight: fontLineHeightRatio * fontSize,
  })

  context.closePath()
}
