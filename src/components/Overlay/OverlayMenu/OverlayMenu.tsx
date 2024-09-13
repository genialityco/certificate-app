import { useNavigate } from 'react-router-dom'

import { ActionIcon, Menu, Tooltip } from '@mantine/core'
import { IconEdit, IconMenu2, IconUserCog } from '@tabler/icons-react'

import useModalContext from '@/context/useModalContext'
import useActiveObjectId from '@/store/useActiveObjectId'

import { menuTabsDefinition } from './menuTabsDefinition'

export default function OverlayMenu() {
  const { openMenuModal } = useModalContext()

  const setActiveObjectId = useActiveObjectId((state) => state.setActiveObjectId)
  const navigate = useNavigate()

  const handleManageUsersClick = () => {
    navigate('/dashboard')
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
          <Menu.Item leftSection={<IconUserCog />} onClick={handleManageUsersClick}>
            Gestionar usuarios
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </div>
  )
}
