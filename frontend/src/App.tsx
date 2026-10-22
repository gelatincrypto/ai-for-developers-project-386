import { useEffect, useState } from 'react'
import { Badge, Container, Paper, Stack, Text, Title } from '@mantine/core'

type ApiStatus = 'loading' | 'available' | 'unavailable'

const statusLabels: Record<ApiStatus, string> = {
  loading: 'Проверяем подключение к серверу…',
  available: 'Сервер доступен',
  unavailable: 'Сервер недоступен',
}

function App() {
  const [apiStatus, setApiStatus] = useState<ApiStatus>('loading')

  useEffect(() => {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 5000)
    let active = true

    async function checkHealth() {
      try {
        const response = await fetch('/api/health', { signal: controller.signal })
        if (!response.ok) throw new Error('Health check failed')
        const data = await response.json()
        if (active) setApiStatus(data.status === 'ok' ? 'available' : 'unavailable')
      } catch {
        if (active) setApiStatus('unavailable')
      } finally {
        window.clearTimeout(timeout)
      }
    }

    void checkHealth()

    return () => {
      active = false
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [])

  return (
    <Container component="main" size="sm" py="xl">
      <Stack gap="xl">
        <Stack gap="sm">
          <Title order={1}>Календарь звонков</Title>
          <Text c="dimmed" size="lg">
            Удобное планирование встреч и звонков.
          </Text>
        </Stack>
        <Paper withBorder radius="md" p="lg">
          <Stack gap="sm">
            <Title order={2} size="h3">Сервис в разработке</Title>
            <Text>Бронирование времени появится позже. Сейчас проверяем связь с сервером.</Text>
            <div role="status" aria-live="polite">
              <Badge
                color={apiStatus === 'available' ? 'green' : apiStatus === 'unavailable' ? 'red' : 'gray'}
                variant="light"
              >
                {statusLabels[apiStatus]}
              </Badge>
            </div>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  )
}

export default App
