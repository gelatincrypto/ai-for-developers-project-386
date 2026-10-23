import { useEffect, useState } from 'react'
import { Badge, Button, Container, Paper, Stack, Text, Title } from '@mantine/core'
import { Link, useParams } from 'react-router'
import { getHealth, listEventTypes, type EventType } from '../generated/api'

type ApiStatus = 'loading' | 'available' | 'unavailable'

const statusLabels: Record<ApiStatus, string> = {
  loading: 'Проверяем подключение к серверу…',
  available: 'Сервер доступен',
  unavailable: 'Сервер недоступен',
}

function BookingPage() {
  const [apiStatus, setApiStatus] = useState<ApiStatus>('loading')
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [catalogStatus, setCatalogStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const { eventTypeId } = useParams()

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

  useEffect(() => {
    let active = true
    void listEventTypes({ baseUrl: window.location.origin }).then(({ data }) => {
      if (active) {
        setEventTypes(data ?? [])
        setCatalogStatus(data ? 'ready' : 'error')
      }
    }).catch(() => {
      if (active) setCatalogStatus('error')
    })
    return () => { active = false }
  }, [])

  return (
    <Container component="main" size="sm" py="xl">
      <Stack gap="xl">
        <Title order={1}>Бронирование</Title>
        <Paper withBorder radius="md" p="lg">
          <Stack gap="md" align="flex-start">
            <Text>Бронирование пока недоступно</Text>
            {eventTypeId && <Text>Выбранный тип: {eventTypes.find((item) => item.id === eventTypeId)?.title ?? eventTypeId}</Text>}
            <Title order={2}>Типы событий</Title>
            {catalogStatus === 'loading' && <Text>Загружаем типы событий…</Text>}
            {catalogStatus === 'error' && <Text role="alert">Не удалось загрузить типы событий</Text>}
            {catalogStatus === 'ready' && eventTypes.length === 0 && <Text>Типы событий пока не добавлены</Text>}
            {eventTypes.map((item) => (
              <Paper key={item.id} withBorder p="md">
                <Text fw={700}>{item.title}</Text>
                <Text>{item.description}</Text>
                <Text>{item.durationMinutes} мин.</Text>
                <Button component={Link} to={`/booking/${encodeURIComponent(item.id)}`} variant="light">
                  Открыть календарь: {item.title}
                </Button>
              </Paper>
            ))}
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
