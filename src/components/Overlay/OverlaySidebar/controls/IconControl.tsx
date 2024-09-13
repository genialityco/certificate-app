import { useEffect, useState } from 'react'
import ReactDOMServer from 'react-dom/server'

import { ActionIcon, Button, Input, Tooltip } from '@mantine/core'
import {
  IconArrowDown,
  IconBell,
  IconCheck,
  IconHeart,
  IconHome,
  IconMail,
  IconSearch,
  IconSettings,
  IconStar,
  IconUser,
  IconX,
} from '@tabler/icons-react'

import useCanvasContext from '@/context/useCanvasContext'
import useActiveObjectId from '@/store/useActiveObjectId'
import useCanvasObjects from '@/store/useCanvasObjects'
import useDefaultParams from '@/store/useDefaultParams'
import useUserMode from '@/store/useUserMode'
import generateUniqueId from '@/utils/generateUniqueId'
import getDimensionsFromSVGIconObject from '@/utils/getDimensionsFromSVGIconObject'

import ControlHeader from './ControlHeader'

const iconEntries = Object.entries({
  IconHeart,
  IconStar,
  IconBell,
  IconHome,
  IconSettings,
  IconMail,
  IconCheck,
  IconUser,
})

interface Props {
  pageSize?: number
}

export default function IconControl({ pageSize = 60 }: Props) {
  const [visibleIcons, setVisibleIcons] = useState<number>(pageSize)
  const { contextRef } = useCanvasContext()

  const defaultParams = useDefaultParams((state) => state.defaultParams)
  const setDefaultParams = useDefaultParams((state) => state.setDefaultParams)

  const setActiveObjectId = useActiveObjectId((state) => state.setActiveObjectId)

  const setUserMode = useUserMode((state) => state.setUserMode)

  const appendIconObject = useCanvasObjects((state) => state.appendIconObject)

  const iconEntriesToRender = iconEntries
    .filter(([slug]) => slug.toLowerCase().includes(defaultParams.searchQueryIcons.toLowerCase()))
    .slice(0, visibleIcons)

  const hasMore = visibleIcons <= iconEntriesToRender.length

  useEffect(() => {
    setVisibleIcons(pageSize)
  }, [pageSize, defaultParams.searchQueryIcons])

  return (
    <>
      <ControlHeader title="Search Icons" />
      <Input
        size="xs"
        type="search"
        placeholder="Search"
        value={defaultParams.searchQueryIcons}
        onChange={(event) => {
          setDefaultParams({
            searchQueryIcons: event.currentTarget.value,
          })
        }}
        leftSection={<IconSearch size={12} style={{ transform: 'translateY(1px)' }} />}
      />
      {iconEntriesToRender.length > 0 ? (
        <>
          <div
            style={{
              width: '100%',
              pointerEvents: 'auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              margin: '5px 0',
              border: '0.0625rem solid var(--color-borderPrimary)',
              borderRadius: '0.25rem',
            }}
          >
            {iconEntriesToRender.map(([key, Icon]) => (
              <Tooltip key={key} position="bottom" withArrow label={key}>
                <ActionIcon
                  size="lg"
                  m="xs"
                  onClick={() => {
                    const svgPath =
                      Icon({}).props.children[0].props.d ||
                      ReactDOMServer.renderToString(<Icon />)
                        ?.split('<path d="')?.[1]
                        ?.split('"></path></svg>')?.[0]
                    const dimensions = getDimensionsFromSVGIconObject({
                      context: contextRef?.current,
                      iconObject: { x: 0, y: 0, width: 0, height: 0, svgPath },
                    })
                    const createdObjectId = generateUniqueId()
                    appendIconObject({
                      id: createdObjectId,
                      x: 0,
                      y: 0,
                      width: dimensions.initialWidth,
                      height: dimensions.initialHeight,
                      backgroundColorHex: defaultParams.backgroundColorHex,
                      opacity: 100,
                      svgPath,
                    })
                    setActiveObjectId(createdObjectId)
                    setUserMode('select')
                  }}
                >
                  <Icon style={{ width: '70%', height: '70%' }} />
                </ActionIcon>
              </Tooltip>
            ))}
          </div>
          {hasMore && (
            <Button
              leftSection={<IconArrowDown style={{ transform: 'translateY(1px)' }} />}
              variant="default"
              size="xs"
              onClick={() => {
                setVisibleIcons((prevVisibleIcons) => prevVisibleIcons + pageSize)
              }}
            >
              Load more icons
            </Button>
          )}
        </>
      ) : (
        <>
          <p style={{ fontSize: '0.95rem', marginTop: '0.5rem', marginBottom: '0.6rem' }}>
            No results found.
          </p>
          <Button
            leftSection={<IconX />}
            variant="default"
            size="xs"
            onClick={() => {
              setDefaultParams({
                searchQueryIcons: '',
              })
            }}
          >
            Clear
          </Button>
        </>
      )}
    </>
  )
}
