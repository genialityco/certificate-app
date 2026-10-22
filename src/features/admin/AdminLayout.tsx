import { ReactNode, useEffect, useState } from 'react'
import { Link, Navigate, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'

import { Box, Burger, Group, Select, Stack, Text, UnstyledButton } from '@mantine/core'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'
import {
  IconCalendarEvent,
  IconCertificate,
  IconLayoutDashboard,
  IconLogout,
  IconUsers,
  IconWorld,
} from '@tabler/icons-react'

import { fetchAllOrganizations } from '@/services/api/certificateAdminService'
import { palette } from '@/styles/palette'

import { isAdminLogged, logoutAdmin, rememberOrganization } from './session'

const SIDEBAR_WIDTH = 256

interface NavItem {
  label: string
  to: string
  icon: ReactNode
  external?: boolean
}

export function AdminLayout() {
  const { organizationId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const isMobile = useMediaQuery('(max-width: 900px)')
  const [opened, { toggle, close }] = useDisclosure(false)
  const [organizations, setOrganizations] = useState<{ _id: string; name: string }[]>([])

  useEffect(() => {
    fetchAllOrganizations()
      .then(setOrganizations)
      .catch(() => setOrganizations([]))
  }, [])

  useEffect(() => {
    if (organizationId) rememberOrganization(organizationId)
  }, [organizationId])

  useEffect(close, [location.pathname, close])

  if (!isAdminLogged()) return <Navigate to="/" replace />

  const base = `/admin/org/${organizationId}`
  const navItems: NavItem[] = organizationId
    ? [
        { label: 'Dashboard', to: base, icon: <IconLayoutDashboard size={20} /> },
        { label: 'Eventos', to: `${base}/events`, icon: <IconCalendarEvent size={20} /> },
        { label: 'Miembros', to: `${base}/members`, icon: <IconUsers size={20} /> },
        {
          label: 'Consulta pública',
          to: `/consulta/${organizationId}`,
          icon: <IconWorld size={20} />,
          external: true,
        },
      ]
    : []

  const isActive = (to: string) =>
    to === base ? location.pathname === base : location.pathname.startsWith(to)

  const sidebar = (
    <Stack
      gap={0}
      h="100%"
      style={{
        width: SIDEBAR_WIDTH,
        background: palette.surface,
        borderRight: `1px solid ${palette.border}`,
        color: palette.text,
      }}
    >
      <Box px={24} py={28} style={{ borderBottom: `1px solid ${palette.border}` }}>
        <Group gap={10}>
          <Box
            style={{
              display: 'grid',
              placeItems: 'center',
              width: 38,
              height: 38,
              borderRadius: 10,
              background: palette.primarySoft,
              color: palette.primary,
            }}
          >
            <IconCertificate size={22} />
          </Box>
          <Text fw={800} size="xl" c={palette.text}>
            Admin Certs
          </Text>
        </Group>
      </Box>

      <Box px={16} pt={20}>
        <Text size="xs" c={palette.muted} mb={6} fw={600} tt="uppercase">
          Organización
        </Text>
        <Select
          size="sm"
          placeholder="Selecciona"
          searchable
          data={organizations.map((org) => ({ value: org._id, label: org.name }))}
          value={organizationId ?? null}
          onChange={(value) => value && navigate(`/admin/org/${value}`)}
          allowDeselect={false}
          nothingFoundMessage="Sin resultados"
        />
      </Box>

      <Stack gap={4} px={16} py={20} style={{ flex: 1 }}>
        {navItems.map((item) => {
          const active = isActive(item.to)
          return (
            <UnstyledButton
              key={item.to}
              component={Link}
              to={item.to}
              target={item.external ? '_blank' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 16px',
                borderRadius: 8,
                fontWeight: 500,
                color: active ? palette.primary : palette.muted,
                background: active ? palette.primarySoft : 'transparent',
                borderLeft: active ? `3px solid ${palette.accent}` : '3px solid transparent',
                transition: 'background 120ms',
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </UnstyledButton>
          )
        })}
      </Stack>

      <Box px={16} py={16} style={{ borderTop: `1px solid ${palette.border}` }}>
        <UnstyledButton
          onClick={() => {
            logoutAdmin()
            navigate('/')
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: palette.muted,
            padding: '8px 16px',
          }}
        >
          <IconLogout size={18} />
          <span>Cerrar sesión</span>
        </UnstyledButton>
      </Box>
    </Stack>
  )

  return (
    <div
      style={{
        display: 'flex',
        width: '100vw',
        minHeight: '100vh',
        background: palette.page,
        color: palette.text,
        colorScheme: 'light',
        textAlign: 'left',
      }}
    >
      {isMobile ? (
        <>
          <Burger
            opened={opened}
            onClick={toggle}
            aria-label="Menú"
            style={{ position: 'fixed', top: 12, left: 12, zIndex: 201 }}
            color={palette.text}
          />
          {opened && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex' }}>
              {sidebar}
              <div style={{ flex: 1, background: 'rgba(0,0,0,0.35)' }} onClick={close} />
            </div>
          )}
        </>
      ) : (
        <aside style={{ position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100 }}>
          {sidebar}
        </aside>
      )}

      <main
        style={{
          flex: 1,
          minWidth: 0,
          marginLeft: isMobile ? 0 : SIDEBAR_WIDTH,
          paddingTop: isMobile ? 48 : 0,
        }}
      >
        <Outlet />
      </main>
    </div>
  )
}

// Contenedor estándar de una página del admin
export function AdminPage({
  title,
  description,
  actions,
  children,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <Box p={{ base: 16, md: 32 }}>
      <Group justify="space-between" align="flex-start" mb="lg" gap="md">
        <div>
          <Text component="h1" fz={28} fw={800} m={0} c={palette.text}>
            {title}
          </Text>
          <Box w={40} h={3} mt={6} style={{ borderRadius: 2, background: palette.accent }} />
          {description && (
            <Text c="dimmed" mt={4}>
              {description}
            </Text>
          )}
        </div>
        {actions && <Group gap="xs">{actions}</Group>}
      </Group>
      {children}
    </Box>
  )
}
