import { FC } from 'react'
import { useNavigate } from 'react-router-dom'

import { Anchor, Box, Container, Flex, Title } from '@mantine/core'

const Home: FC = (): JSX.Element => {
  const navigate = useNavigate()

  return (
    <Container
      fluid
      style={{
        height: '100vh',
        width: '100vw',
        color: '#ddd',
        backgroundColor: '#242424',
      }}
    >
      <Flex display="flex" direction="column" justify="center" align="center" h="100%" gap="lg">
        <Title order={1}>Gestor de certificados</Title>
        <Box>
          <Anchor onClick={() => navigate('/dashboard/organizations')}>Ir a la dashboard</Anchor>
        </Box>
      </Flex>
    </Container>
  )
}

export { Home }
