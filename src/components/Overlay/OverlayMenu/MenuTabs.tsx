import { useEffect } from 'react'

import { Tabs } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'

import useActiveObjectId from '@/store/useActiveObjectId'
import theme from '@/theme'

import { type MenuTabId, menuTabsDefinition } from './menuTabsDefinition'
import MenuTabAbout from './tabs/MenuTabAbout'
import MenuTabCanvas from './tabs/MenuTabCanvas'
import MenuTabDownload from './tabs/MenuTabDownload'
import MenuTabLayers from './tabs/MenuTabLayers'
import MenuTabSettings from './tabs/MenuTabSettings'

interface Props {
  closeModal: () => void
  initialTab?: MenuTabId
}

export default function MenuTabs({ closeModal, initialTab = menuTabsDefinition[0].id }: Props) {
  const setActiveObjectId = useActiveObjectId((state) => state.setActiveObjectId)

  const gteMedium = useMediaQuery(theme.medias.gteMedium.replace('@media ', ''))

  useEffect(() => {
    setActiveObjectId(null)
  }, [setActiveObjectId])

  return (
    <div style={{ width: '100%', maxWidth: '100%', pointerEvents: 'all' }}>
      <Tabs defaultValue={initialTab} orientation="vertical">
        <Tabs.List>
          {menuTabsDefinition.map((tab) => (
            <Tabs.Tab key={tab.id} value={tab.id}>
              <div
                style={{
                  padding: '6px 2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                }}
              >
                {tab.icon}
                {gteMedium ? tab.label : ''}
              </div>
            </Tabs.Tab>
          ))}
        </Tabs.List>
        <Tabs.Panel value="canvas">
          <div
            style={{
              position: 'relative',
              height: '700px',
              maxHeight: '80vh',
              width: '100%',
              maxWidth: '100%',
              overflowY: 'auto',
              padding: '1rem',
            }}
          >
            <MenuTabCanvas closeModal={closeModal} />
          </div>
        </Tabs.Panel>
        <Tabs.Panel value="layers">
          <div
            style={{
              position: 'relative',
              height: '700px',
              maxHeight: '80vh',
              width: '100%',
              maxWidth: '100%',
              overflowY: 'auto',
              padding: '1rem',
            }}
          >
            <MenuTabLayers />
          </div>
        </Tabs.Panel>
        <Tabs.Panel value="download">
          <div
            style={{
              position: 'relative',
              height: '700px',
              maxHeight: '80vh',
              width: '100%',
              maxWidth: '100%',
              overflowY: 'auto',
              padding: '1rem',
            }}
          >
            <MenuTabDownload />
          </div>
        </Tabs.Panel>
        <Tabs.Panel value="settings">
          <div
            style={{
              position: 'relative',
              height: '700px',
              maxHeight: '80vh',
              width: '100%',
              maxWidth: '100%',
              overflowY: 'auto',
              padding: '1rem',
            }}
          >
            <MenuTabSettings />
          </div>
        </Tabs.Panel>
        <Tabs.Panel value="about">
          <div
            style={{
              position: 'relative',
              height: '700px',
              maxHeight: '80vh',
              width: '100%',
              maxWidth: '100%',
              overflowY: 'auto',
              padding: '1rem',
            }}
          >
            <MenuTabAbout />
          </div>
        </Tabs.Panel>
      </Tabs>
    </div>
  )
}
