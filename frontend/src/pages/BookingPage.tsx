import { useEffect, useState } from 'react'
import { Badge, Button, Container, Paper, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router'
import { getHealth } from '../generated/api'

type ApiStatus = 'loading' | 'available' | 'unavailable'

const statusLabels: Record<ApiStatus, string> = {
  loading: 'Проверяем подключение к серверу…',
  available: 'Сервер доступен',
  unavailable: 'Сервер недоступен',
}

function BookingPage() {
  const [apiStatus, setApiStatus] = useState<ApiStatus>('loading')

  useEffect(() => {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 5000)
    let active = true

    async function checkHealth() {
      try {
        const { data } = await getHealth({ baseUrl: window.location.origin, signal: controller.signal })
        if (active) setApiStatus(data?.status === 'ok' ? 'available' : 'unavailable')
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
        <Title order={1}>Бронирование</Title>
        <Paper withBorder radius="md" p="lg">
          <Stack gap="md" align="flex-start">
            <Text>Бронирование пока недоступно</Text>
            <div role="status" aria-live="polite">
              <Badge
                color={apiStatus === 'available' ? 'green' : apiStatus === 'unavailable' ? 'red' : 'gray'}
                variant="light"
              >
                {statusLabels[apiStatus]}
              </Badge>
            </div>
            <Button component={Link} to="/" variant="light">На главную</Button>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  )
}

export default BookingPage
