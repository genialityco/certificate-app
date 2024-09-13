import { useState } from 'react'

import { Menu } from '@mantine/core'
import { IconDownload, IconUser, IconX } from '@tabler/icons-react'
import startCase from 'lodash/startCase'

import { type ObjectDimensions, type UnsplashImage } from '@/config/types'
import useCanvasContext from '@/context/useCanvasContext'
import getDimensionsFromImage from '@/utils/getDimensionsFromImage'
import getImageElementFromUrl from '@/utils/getImageElementFromUrl'
import notification from '@/utils/notification'

interface OptionItem {
  imageUrl: string
  imageElement: HTMLImageElement
  dimensions: ObjectDimensions
}

interface Props {
  image: UnsplashImage
  pushImageObject: (optionItem: OptionItem) => void
}

export default function UnsplashImageButton({ image, pushImageObject }: Props) {
  const [imageMenuOptions, setImageMenuOptions] = useState<Record<string, OptionItem>>({})
  const { contextRef } = useCanvasContext()

  return (
    <Menu shadow="md" width={220}>
      <Menu.Target>
        <button
          style={{
            width: '100%',
            height: '100%',
            padding: 0,
            border: 0,
            background: 'transparent',
            cursor: 'pointer',
          }}
          key={image.id}
          onClick={async () => {
            try {
              const newState: Record<string, OptionItem> = {}
              for (const [key, imageUrl] of Object.entries(image.urls || {})) {
                const imageElement = await getImageElementFromUrl(imageUrl)
                const dimensions = await getDimensionsFromImage({
                  context: contextRef?.current,
                  imageObject: { x: 0, y: 0, imageElement },
                })
                newState[key] = {
                  imageUrl,
                  imageElement: imageElement,
                  dimensions,
                }
              }
              setImageMenuOptions(newState)
            } catch (error) {
              notification.error({
                message: (error as Error)?.message,
              })
            }
          }}
        >
          <img
            src={image.urls.small}
            alt={image.description}
            style={{
              width: '100%',
              maxWidth: '100%',
              objectFit: 'cover',
              height: '120px',
            }}
            // onMouseOver={(e) => (e.currentTarget.style.opacity = '0.8')}
            // onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
          />
        </button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Image Sizes</Menu.Label>
        {Object.keys(imageMenuOptions).length === 0 ? (
          <Menu.Item>Loading...</Menu.Item>
        ) : (
          Object.entries(imageMenuOptions).map(([key, imageOption]) => (
            <Menu.Item
              key={key}
              leftSection={<IconDownload size={14} />} // Reemplazo de ícono de Tabler
              onClick={() => {
                pushImageObject(imageOption)
              }}
            >
              {`${startCase(key)} (${imageOption.dimensions.width} x ${imageOption.dimensions.height} px)`}
            </Menu.Item>
          ))
        )}
        <Menu.Divider />
        <Menu.Item
          style={{ opacity: 0.75 }}
          leftSection={<IconUser size={14} />} // Reemplazo de ícono de Tabler
          onClick={() => {
            if (image.author.url) {
              window.open(image.author.url, '_blank')
            }
          }}
        >
          Photo by {image.author.name} on Unsplash
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item leftSection={<IconX size={14} />} color="red"></Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}

export type { OptionItem }
