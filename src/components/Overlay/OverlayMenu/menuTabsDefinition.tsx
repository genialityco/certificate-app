import { type ReactNode } from 'react'

import {
  IconCloudDownload,
  IconInfoCircle,
  IconLayersIntersect,
  IconPhotoFilled,
  IconSettings,
} from '@tabler/icons-react'

export type MenuTabId = 'canvas' | 'layers' | 'download' | 'settings' | 'about'

export const menuTabsDefinition: {
  id: MenuTabId
  label: string
  icon: ReactNode
}[] = [
  {
    id: 'canvas',
    label: 'Canvas',
    icon: <IconPhotoFilled />,
  },
  {
    id: 'download',
    label: 'Download',
    icon: <IconCloudDownload />,
  },
  {
    id: 'layers',
    label: 'Layers',
    icon: <IconLayersIntersect />,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <IconSettings />,
  },
  {
    id: 'about',
    label: 'About',
    icon: <IconInfoCircle />,
  },
]
