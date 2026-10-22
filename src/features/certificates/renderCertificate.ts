import { drawText } from 'canvas-txt'

import {
  type EllipseObject,
  type FreeDrawObject,
  type IconObject,
  type RectangleObject,
} from '@/config/types'
import hexToRgba from '@/utils/hexToRgba'
import renderEllipse from '@/utils/render/renderEllipse'
import renderFreeDrawing from '@/utils/render/renderFreeDrawing'
import renderRectangle from '@/utils/render/renderRectangle'
import renderSVGIcon from '@/utils/render/renderSVGIcon'

import { resolveElementText } from './fields'
import { type CertificateElement } from './types'

export const DEFAULT_SIZE = { width: 1920, height: 1080 }

// Elementos creados con el editor nuevo respetan la alineación también en los
// campos dinámicos; los antiguos se centraban siempre
export const ELEMENT_VERSION = 2

const imageCache = new Map<string, Promise<HTMLImageElement>>()

export const loadImage = (url: string): Promise<HTMLImageElement> => {
  if (!imageCache.has(url)) {
    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.crossOrigin = 'anonymous'
      image.onload = () => resolve(image)
      image.onerror = () => {
        imageCache.delete(url)
        reject(new Error(`No se pudo cargar la imagen ${url.slice(0, 80)}`))
      }
      image.src = url
    })
    imageCache.set(url, promise)
  }
  return imageCache.get(url)!
}

const ensureFontsLoaded = async (elements: CertificateElement[]) => {
  if (!('fonts' in document)) return
  const fonts = new Set(
    elements
      .filter((el) => el.type === 'text' || el.type === 'attribute')
      .map(
        (el) =>
          `${el.fontStyle ?? 'normal'} ${el.fontWeight ?? 'normal'} ${el.fontSize ?? 32}px "${
            el.fontFamily ?? 'sans-serif'
          }"`,
      ),
  )
  await Promise.all([...fonts].map((font) => document.fonts.load(font).catch(() => null)))
}

export const textAlignOf = (element: CertificateElement) => {
  const isLegacyAttribute = element.type === 'attribute' && element.version !== ELEMENT_VERSION
  return {
    horizontal: isLegacyAttribute ? 'center' : element.textAlignHorizontal ?? 'center',
    vertical: isLegacyAttribute ? 'middle' : element.textAlignVertical ?? 'middle',
  } as const
}

export async function renderCertificateToCanvas(
  canvas: HTMLCanvasElement,
  elements: CertificateElement[],
  size: { width: number; height: number } | undefined,
  values: Record<string, string>,
) {
  const { width, height } = size?.width && size?.height ? size : DEFAULT_SIZE
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('El navegador no soporta canvas')

  const images = await Promise.all(
    elements.map((el) =>
      el.type === 'image' && el.imageUrl ? loadImage(el.imageUrl).catch(() => null) : null,
    ),
  )
  await ensureFontsLoaded(elements)

  context.clearRect(0, 0, width, height)
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)

  elements.forEach((element, index) => {
    const opacity = element.opacity ?? 100
    switch (element.type) {
      case 'image': {
        const image = images[index]
        if (!image) break
        context.globalAlpha = opacity / 100
        context.drawImage(image, element.x, element.y, element.width, element.height)
        context.globalAlpha = 1
        break
      }
      case 'text':
      case 'attribute': {
        const text = resolveElementText(element, values)
        if (!text) break
        const align = textAlignOf(element)
        const fontSize = element.fontSize ?? 32
        context.beginPath()
        context.fillStyle = hexToRgba({ hex: element.fontColorHex ?? '#000000', opacity })
        drawText(context, text, {
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
          fontSize,
          font: element.fontFamily ?? 'sans-serif',
          fontStyle: element.fontStyle ?? 'normal',
          fontVariant: element.fontVariant ?? 'normal',
          fontWeight: element.fontWeight ?? 'normal',
          align: align.horizontal,
          vAlign: align.vertical,
          justify: element.textJustify ?? false,
          lineHeight: (element.fontLineHeightRatio ?? 1.2) * fontSize,
        })
        context.closePath()
        break
      }
      // Tipos del editor anterior
      case 'rectangle':
        renderRectangle({ context, ...(element as unknown as RectangleObject) })
        break
      default: {
        const legacy = element as unknown as { type: string }
        if (legacy.type === 'ellipse')
          renderEllipse({ context, ...(element as unknown as EllipseObject) })
        if (legacy.type === 'free-draw')
          renderFreeDrawing({ context, ...(element as unknown as FreeDrawObject) })
        if (legacy.type === 'icon')
          renderSVGIcon({ context, ...(element as unknown as IconObject) })
      }
    }
  })
}

export async function certificateToPngBlob(
  elements: CertificateElement[],
  size: { width: number; height: number } | undefined,
  values: Record<string, string>,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  await renderCertificateToCanvas(canvas, elements, size, values)
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo generar la imagen'))),
      'image/png',
    ),
  )
}

export const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const certificateFileName = (eventName?: string, personName?: string) =>
  `${['Certificado', eventName, personName].filter(Boolean).join(' - ')}`
    .replace(/[\\/:*?"<>|]/g, '')
    .slice(0, 120) + '.png'
