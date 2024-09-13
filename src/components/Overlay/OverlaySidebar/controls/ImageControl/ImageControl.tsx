import { useEffect, useRef, useState } from 'react'

import { Button, Group, Input, Loader, Text, Tooltip } from '@mantine/core'
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone'
import { IconPhoto, IconPlus, IconSearch, IconUpload, IconX } from '@tabler/icons-react'
import { orderBy } from 'lodash'

import ControlHeader from '@/components/Overlay/OverlaySidebar/controls/ControlHeader'
import { UnsplashImage } from '@/config/types'
import useCanvasContext from '@/context/useCanvasContext'
import useActiveObjectId from '@/store/useActiveObjectId'
import useCanvasObjects from '@/store/useCanvasObjects'
import useDefaultParams from '@/store/useDefaultParams'
import useUnsplashImages from '@/store/useUnsplashImages'
import useUserMode from '@/store/useUserMode'
import fetchImages from '@/utils/api/fetchImages'
import fileToBase64 from '@/utils/fileToBase64'
import generateUniqueId from '@/utils/generateUniqueId'
import getDimensionsFromImage from '@/utils/getDimensionsFromImage'
import getImageElementFromUrl from '@/utils/getImageElementFromUrl'
import notification from '@/utils/notification'

import UnsplashImageButton, { type OptionItem } from './UnsplashImageButton'

export interface Props {
  pageSize?: number
}

export default function ImageControl({ pageSize = 60 }: Props) {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [imageUrl, setImageUrl] = useState<string>('')
  const [visibleImages, setVisibleImages] = useState<number>(pageSize)
  const { contextRef } = useCanvasContext()

  const defaultParams = useDefaultParams((state) => state.defaultParams)
  const setDefaultParams = useDefaultParams((state) => state.setDefaultParams)

  const imageUrlInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const setActiveObjectId = useActiveObjectId((state) => state.setActiveObjectId)

  const setUserMode = useUserMode((state) => state.setUserMode)

  const unsplashImagesMap = useUnsplashImages((state) => state.unsplashImagesMap)
  const setUnsplashImages = useUnsplashImages((state) => state.setUnsplashImages)

  const appendImageObject = useCanvasObjects((state) => state.appendImageObject)

  const imagesToRender = orderBy(Object.values(unsplashImagesMap), ['fetchedAt'], ['desc']).slice(
    0,
    visibleImages,
  )

  const hasAlreadyFetched = Object.values(unsplashImagesMap).some(
    (image) => image.query === defaultParams.searchQueryImages,
  )

  useEffect(() => {
    setVisibleImages(pageSize)
  }, [pageSize, defaultParams.searchQueryImages])

  const pushImageObject = async ({ imageUrl, imageElement, dimensions }: OptionItem) => {
    setImageUrl(imageUrl)
    const createdObjectId = generateUniqueId()
    appendImageObject({
      id: createdObjectId,
      x: 0,
      y: 0,
      width: dimensions.width,
      height: dimensions.height,
      opacity: 100,
      imageUrl,
      imageElement,
    })
    setActiveObjectId(createdObjectId)
    setUserMode('select')
  }

  const hasImages = imagesToRender.length > 0

  const commonPushImageObject = async (url: string) => {
    const imageElement = await getImageElementFromUrl(url)
    const dimensions = await getDimensionsFromImage({
      context: contextRef?.current,
      imageObject: { x: 0, y: 0, imageElement },
    })
    pushImageObject({ imageUrl: url, imageElement, dimensions })
  }

  return (
    <>
      <Dropzone
        mb="sm"
        accept={IMAGE_MIME_TYPE}
        maxSize={5000000} // 5 mb?
        maxFiles={1}
        multiple={false}
        loading={isLoading}
        onDrop={async (files) => {
          setIsLoading(true)
          try {
            const base64 = await fileToBase64(files[0])
            if (base64) {
              commonPushImageObject(base64)
            }
          } catch (error) {
            notification.error({
              message: (error as Error)?.message,
            })
          }
          setIsLoading(false)
        }}
        onReject={(files) => {
          const message = `Rejected ${files.length} files.`
          notification.error({
            message,
          })
        }}
      >
        <Group justify="center" p="xs" style={{ pointerEvents: 'none' }}>
          <Dropzone.Accept>
            <IconUpload size="3.2rem" style={{ opacity: 0.35 }} />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconX size="3.2rem" style={{ opacity: 0.35 }} />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconPhoto size="3.2rem" style={{ opacity: 0.35 }} />
          </Dropzone.Idle>

          <div>
            <Text size="lg" inline style={{ opacity: 0.8 }}>
              Drag an image here or click to select a file
            </Text>
            <Text size="sm" inline mt={7} p={3} style={{ opacity: 0.8 }}>
              File should not exceed 5 MB
            </Text>
          </div>
        </Group>
      </Dropzone>
      <ControlHeader title="Image URL" />
      <form
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, auto)',
          gridGap: '5px',
        }}
        onSubmit={async (event) => {
          event.preventDefault()
          if (imageUrl) {
            setIsLoading(true)
            commonPushImageObject(imageUrl)
            setIsLoading(false)
          } else {
            imageUrlInputRef.current?.focus()
          }
        }}
      >
        <Input
          ref={imageUrlInputRef}
          size="xs"
          placeholder="URL"
          value={imageUrl}
          onChange={(event) => {
            setImageUrl(event.currentTarget.value)
          }}
          mb="md"
          disabled={isLoading}
        />
        <Tooltip label="Add">
          <Button type="submit" size="xs" variant="default" disabled={isLoading}>
            <IconPlus />
          </Button>
        </Tooltip>
      </form>
      <ControlHeader title="Search Images" />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, auto)',
          gridGap: '5px',
        }}
        onSubmit={async (event) => {
          event.preventDefault()
          if (!hasAlreadyFetched) {
            if (defaultParams.searchQueryImages) {
              setIsLoading(true)
              try {
                const images = await fetchImages({
                  query: defaultParams.searchQueryImages,
                  page: 1,
                })
                setUnsplashImages(images)
              } catch (error) {
                notification.error({
                  message: (error as Error)?.message,
                })
              }
              setIsLoading(false)
            } else {
              searchInputRef.current?.focus()
            }
          }
        }}
      >
        <Input
          ref={searchInputRef}
          size="xs"
          type="search"
          placeholder="Search"
          value={defaultParams.searchQueryImages}
          onChange={(event) => {
            setDefaultParams({
              searchQueryImages: event.currentTarget.value,
            })
          }}
          disabled={isLoading}
        />
        <Tooltip label="Search">
          <Button type="submit" size="xs" variant="default" disabled={isLoading}>
            <IconSearch />
          </Button>
        </Tooltip>
      </div>
      {isLoading && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            margin: '1rem 0',
          }}
        >
          <Loader />
        </div>
      )}
      {hasImages && !isLoading && (
        <div
          style={{
            width: '100%',
            pointerEvents: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            marginTop: '10px',
            border: '0.0625rem solid var(--color-borderPrimary)',
            borderRadius: '0.25rem',
          }}
        >
          {imagesToRender.map((image: UnsplashImage) => (
            <UnsplashImageButton key={image.id} image={image} pushImageObject={pushImageObject} />
          ))}
        </div>
      )}
      {/* {!isLoading && (
        <p style={{ margin: 0, fontSize: '0.7rem', marginTop: '0.5rem' }}>
          <IconPhoto size={14} /> Powered by the{' '}
          <UnderlineLink href="https://unsplash.com/developers" target="_blank">
            Unsplash API
          </UnderlineLink>
        </p>
      )} */}
    </>
  )
}
