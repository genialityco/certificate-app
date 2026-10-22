import { FC, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Box, Button, Card, Container, Flex, PasswordInput, Text, Title } from '@mantine/core'
import { IconCertificate } from '@tabler/icons-react'

import { loginAdmin } from '@/features/admin/session'
import { palette } from '@/styles/palette'

const Home: FC = (): JSX.Element => {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = () => {
    if (loginAdmin(password)) {
      navigate('/admin')
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
        color: palette.text,
        background: `linear-gradient(180deg, ${palette.primarySoft} 0%, ${palette.surface} 75%)`,
        colorScheme: 'light',
      }}
    >
      <Flex direction="column" justify="center" align="center" h="100%" gap="lg">
        <Box
          style={{
            display: 'grid',
            placeItems: 'center',
            width: 60,
            height: 60,
            borderRadius: 16,
            background: palette.surface,
            color: palette.primary,
            boxShadow: '0 6px 20px rgba(77, 147, 208, 0.15)',
          }}
        >
          <IconCertificate size={32} />
        </Box>
        <Title order={1} c={palette.text} ta="center">
          Gestor de certificados
        </Title>
        <Box w={56} h={3} style={{ borderRadius: 2, background: palette.accent }} />

        <Card
          withBorder
          radius="lg"
          padding="xl"
          w={340}
          maw="100%"
          style={{ borderColor: palette.border, boxShadow: '0 10px 30px rgba(31, 45, 61, 0.06)' }}
        >
          <PasswordInput
            label="Contraseña"
            placeholder="Ingresa la contraseña"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            error={error || undefined}
          />
          <Button fullWidth mt="md" color="brand" onClick={handleLogin}>
            Acceder
          </Button>
          <Text size="xs" c={palette.muted} ta="center" mt="sm">
            Panel de administración
          </Text>
        </Card>
      </Flex>
    </Container>
  )
}

export { Home }
