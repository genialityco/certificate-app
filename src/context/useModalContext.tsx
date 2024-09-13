import { type ReactNode, createContext, useCallback, useContext, useMemo, useState } from 'react'

import { Modal } from '@mantine/core'

// Importa el nuevo Modal
import MenuTabs from '@/components/Overlay/OverlayMenu/MenuTabs'
import { type MenuTabId } from '@/components/Overlay/OverlayMenu/menuTabsDefinition'
import theme from '@/theme'

interface ModalContextType {
  isModalActive: boolean
  openMenuModal: (menuTabId?: MenuTabId) => void
  closeModal: () => void
}

const initialState: ModalContextType = {
  isModalActive: false,
  openMenuModal: () => undefined,
  closeModal: () => undefined,
}

const ModalContext = createContext<ModalContextType>(initialState)

export function ModalContextProvider({ children }: { children: ReactNode }) {
  const [isModalActive, setIsModalActive] = useState<ModalContextType['isModalActive']>(
    initialState.isModalActive,
  )
  const [menuTabId, setMenuTabId] = useState<MenuTabId | undefined>(undefined) // Guardar la tab seleccionada

  const closeModal = useCallback(() => {
    setIsModalActive(false)
  }, [])

  const openMenuModal = useCallback((menuTabId?: MenuTabId) => {
    setMenuTabId(menuTabId)
    setIsModalActive(true)
  }, [])

  const value = useMemo(
    () => ({ isModalActive, openMenuModal, closeModal }),
    [isModalActive, openMenuModal, closeModal],
  )

  return (
    <ModalContext.Provider value={value}>
      {children}
      <Modal
        opened={isModalActive}
        onClose={closeModal}
        title="Menu"
        size="lg"
        centered
        zIndex={theme.layers.modalHeader}
        styles={{
          content: {},
          header: { borderBottom: '1px solid var(--color-borderPrimary)' },
          body: { padding: 0 },
        }}
      >
        <MenuTabs closeModal={closeModal} initialTab={menuTabId} />
      </Modal>
    </ModalContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export default function useModalContext() {
  return useContext(ModalContext)
}
