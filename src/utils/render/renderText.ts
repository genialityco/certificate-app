import { drawText } from 'canvas-txt'

import { type TextObject } from '@/config/types'
import hexToRgba from '@/utils/hexToRgba'

export default function renderText({
  context,
  x,
  y,
  width,
  height,
  opacity,
  text,
  textJustify,
  textAlignHorizontal,
  textAlignVertical,
  fontColorHex,
  fontSize,
  fontFamily,
  fontStyle,
  fontVariant,
  fontWeight,
  fontLineHeightRatio,
}: {
  context: CanvasRenderingContext2D
} & Omit<TextObject, 'type'>): void {
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
    align: textAlignHorizontal, // Alineación horizontal
    vAlign: textAlignVertical, // Alineación vertical
    justify: textJustify, // Justificación del texto
    lineHeight: fontLineHeightRatio * fontSize, // Altura de línea
  })

  context.closePath()
}
