import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { Card, Loader, SimpleGrid, Text } from '@mantine/core'
import { IconBuilding } from '@tabler/icons-react'

import { AdminPage } from '@/features/admin/AdminLayout'
import { lastOrganization } from '@/features/admin/session'
import { fetchAllOrganizations } from '@/services/api/certificateAdminService'

// Sin organización elegida: retoma la última o muestra el listado
export function AdminHome() {
  const navigate = useNavigate()
  const remembered = lastOrganization()
  const [organizations, setOrganizations] = useState<{ _id: string; name: string }[] | null>(null)

  useEffect(() => {
    if (remembered) return
    fetchAllOrganizations()
      .then(setOrganizations)
      .catch(() => setOrganizations([]))
  }, [remembered])

  if (remembered) return <Navigate to={`/admin/org/${remembered}`} replace />

  return (
    <AdminPage title="Organizaciones" description="Elige la organización que vas a administrar">
      {!organizations ? (
        <Loader color="brand" />
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
          {organizations.map((org) => (
            <Card
              key={org._id}
              withBorder
              radius="md"
              padding="lg"
              style={{ cursor: 'pointer', borderTop: '4px solid #4d93d0' }}
              onClick={() => navigate(`/admin/org/${org._id}`)}
            >
              <IconBuilding size={28} color="#4d93d0" />
              <Text fw={700} size="lg" mt="sm">
                {org.name}
              </Text>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </AdminPage>
  )
}
