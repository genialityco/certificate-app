import { FC, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button, Card, Container, Group, SimpleGrid, Text } from '@mantine/core'
import { IconPlaylistAdd } from '@tabler/icons-react'

import { InterfaceOrganization, fetchOrganizations } from '@/services/api/organizationService'

const OrganizationsList: FC = () => {
  const [organizations, setOrganizations] = useState<InterfaceOrganization[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    fetchAllOrganizations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchAllOrganizations = async () => {
    try {
      const response = await fetchOrganizations()
      setOrganizations(response.data.items as InterfaceOrganization[])
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching organizations:', error)
    }
  }

  return (
    <Container>
      <Group justify="space-between" mt="md">
        <h1>Lista de organizaciones</h1>
        <Button leftSection={<IconPlaylistAdd />}>Crear nuevo organizacion</Button>
      </Group>
      <SimpleGrid cols={3} spacing="md" mt="md">
        {organizations.map((organization) => (
          <Card key={organization._id} shadow="md" padding="lg" withBorder>
            <Text size="lg">{organization.name}</Text>
            <Button
              mt="md"
              onClick={() =>
                navigate(`/dashboard/organization/${organization._id}/events`, {
                  state: {
                    propertiesDefinition: organization.propertiesDefinition,
                    organization: organization,
                  },
                })
              }
              fullWidth
            >
              Ver detalles
            </Button>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  )
}

export { OrganizationsList }
