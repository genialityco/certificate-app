import { CanvasContextProvider } from '@/context/useCanvasContext'
import { ModalContextProvider } from '@/context/useModalContext'
import {
  ErrorBoundaryProvider,
  NotificationProvider,
  QueryProvider,
  ThemeProvider,
} from '@/providers'
import { Routes } from '@/routes'

const App = () => {
  return (
    <ErrorBoundaryProvider>
      <ThemeProvider>
        <NotificationProvider>
          <QueryProvider>
            <CanvasContextProvider>
              <ModalContextProvider>
                <Routes />
              </ModalContextProvider>
            </CanvasContextProvider>
          </QueryProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundaryProvider>
  )
}

export { App }
