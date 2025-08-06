/* eslint-disable import/no-extraneous-dependencies */
import { Button, Checkbox } from '@mantine/core'
import { IconDownload } from '@tabler/icons-react'
import jsPDF from 'jspdf'

import CanvasPreview from '@/components/CanvasPreview'
import { CANVAS_PREVIEW_UNIQUE_ID } from '@/config/globalElementIds'
import useCanvasBackgroundColor from '@/store/useCanvasBackgroundColor'
import useCanvasWorkingSize from '@/store/useCanvasWorkingSize'
import useDefaultParams from '@/store/useDefaultParams'
import generateUniqueId from '@/utils/generateUniqueId'

export default function MenuTabDownload() {
  const defaultParams = useDefaultParams((state) => state.defaultParams)

  const canvasWorkingSize = useCanvasWorkingSize((state) => state.canvasWorkingSize)

  const canvasBackgroundColor = useCanvasBackgroundColor((state) => state.canvasBackgroundColor)
  const setCanvasBackgroundColor = useCanvasBackgroundColor(
    (state) => state.setCanvasBackgroundColor,
  )

  const downloadCanvas = (type: 'png' | 'jpg' | 'pdf') => {
    const canvas = document.getElementById(CANVAS_PREVIEW_UNIQUE_ID) as HTMLCanvasElement
    const image = canvas.toDataURL('image/' + type)

    if (type === 'pdf') {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height],
      })
      pdf.addImage(image, 'JPEG', 0, 0, canvas.width, canvas.height)
      pdf.save(`${generateUniqueId()}.pdf`)
    } else {
      const a = document.createElement('a')
      a.download = `${generateUniqueId()}.${type}`
      a.href = image
      a.click()
      a.remove()
    }
  }

  return (
    <>
      <h3>Download</h3>
      <div
        style={{
          display: 'flex',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '0.5rem',
          marginBottom: '1rem',
        }}
      >
        <Button
          size="xs"
          variant="default"
          onClick={() => {
            downloadCanvas('png')
          }}
          leftSection={<IconDownload />}
        >
          PNG
        </Button>
        <Button
          size="xs"
          variant="default"
          onClick={() => {
            downloadCanvas('jpg')
          }}
          leftSection={<IconDownload />}
        >
          JPG
        </Button>
        <Button
          size="xs"
          variant="default"
          onClick={() => {
            downloadCanvas('pdf')
          }}
          leftSection={<IconDownload />}
        >
          PDF
        </Button>
      </div>
      <h3>
        Preview<span>{`${canvasWorkingSize.width} x ${canvasWorkingSize.height} px`}</span>
      </h3>
      <CanvasPreview width={canvasWorkingSize.width} height={canvasWorkingSize.height} />{' '}
      <Checkbox
        size="sm"
        label="Transparent Background"
        checked={canvasBackgroundColor === 'transparent'}
        onChange={(event) => {
          if (event.target.checked) {
            setCanvasBackgroundColor('transparent')
          } else {
            setCanvasBackgroundColor(defaultParams.canvasBackgroundColor)
          }
        }}
      />
    </>
  )
}
