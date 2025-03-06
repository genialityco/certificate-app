import { FC, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Box, Button, Container, Flex, Text, TextInput, Title } from '@mantine/core'

const Home: FC = (): JSX.Element => {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = () => {
    const correctPassword = 'admin123'

    if (password === correctPassword) {
      navigate('/dashboard/organizations')
    } else {
      setError('Contraseña incorrecta. Inténtalo de nuevo.')
    }
  }

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
      <Flex direction="column" justify="center" align="center" h="100%" gap="lg">
        <Title order={1}>Gestor de certificados</Title>

        <Box style={{ width: '300px' }}>
          <TextInput
            label="Contraseña"
            placeholder="Ingresa la contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            error={error}
          />
          {error && (
            <Text color="red" size="sm" mt="xs">
              {error}
            </Text>
          )}

          <Button fullWidth mt="md" onClick={handleLogin}>
            Acceder
          </Button>
        </Box>
      </Flex>
    </Container>
  )
}

export { Home }
