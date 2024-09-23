import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { ActionIcon, Menu, Tooltip } from '@mantine/core'
import { IconAppWindow, IconEdit, IconLayoutDashboard, IconMenu2 } from '@tabler/icons-react'

import useModalContext from '@/context/useModalContext'
import useActiveObjectId from '@/store/useActiveObjectId'

import { menuTabsDefinition } from './menuTabsDefinition'

export default function OverlayMenu() {
  const { openMenuModal } = useModalContext()

  const setActiveObjectId = useActiveObjectId((state) => state.setActiveObjectId)
  const { eventId } = useParams()
  const location = useLocation()

  const queryParams = new URLSearchParams(location.search)
  const certificateId = queryParams.get('certificateId')
  const navigate = useNavigate()

  const handleGoToLanding = () => {
    navigate(`/event/${eventId}/certificate/${certificateId}`)
  }

  const handleGoToDashboard = () => {
    navigate(`/dashboard`)
  }

  return (
    <div style={{ pointerEvents: 'auto' }}>
      <Menu shadow="md" width={200} position="bottom-end">
        <Menu.Target>
          <Tooltip position="bottom-end" label="Open menu" offset={16}>
            <ActionIcon title="Settings" variant="default" size="xl">
              <IconMenu2 />
            </ActionIcon>
          </Tooltip>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu trigger="hover" shadow="md" width={200} position="left">
            <Menu.Target>
              <Menu.Item leftSection={<IconEdit />}>Editar certificado</Menu.Item>
            </Menu.Target>
            <Menu.Dropdown>
              {menuTabsDefinition.map((tab) => (
                <Menu.Item
                  key={tab.id}
                  leftSection={tab.icon}
                  onClick={() => {
                    setActiveObjectId(null)
                    openMenuModal(tab.id)
                  }}
                >
                  {tab.label}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>

          <Menu.Divider />
          <Menu.Item leftSection={<IconAppWindow />} onClick={handleGoToLanding}>
            Ir a la landing
          </Menu.Item>

          <Menu.Divider />
          <Menu.Item leftSection={<IconLayoutDashboard />} onClick={handleGoToDashboard}>
            Ir a la dashboard
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </div>
  )
}
