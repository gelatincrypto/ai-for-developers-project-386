import { useEffect, useState, type FormEvent } from 'react'
import { Badge, Button, Container, Paper, Stack, Text, TextInput, Title } from '@mantine/core'
import { Link, useParams } from 'react-router'
import { createBooking, getHealth, listEventTypes, listSlots, type AvailableSlots, type BookingConfirmation, type EventType } from '../generated/api'

type ApiStatus = 'loading' | 'available' | 'unavailable'

const statusLabels: Record<ApiStatus, string> = {
  loading: 'Проверяем подключение к серверу…',
  available: 'Сервер доступен',
  unavailable: 'Сервер недоступен',
}

function BookingContent({ eventTypeId }: { eventTypeId?: string }) {
  const [apiStatus, setApiStatus] = useState<ApiStatus>('loading')
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [catalogStatus, setCatalogStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [calendar, setCalendar] = useState<AvailableSlots | null>(null)
  const [calendarStatus, setCalendarStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [selectedStart, setSelectedStart] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null)
  const [bookingError, setBookingError] = useState('')

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
    if (!eventTypeId) return
    let active = true
    void listSlots({ baseUrl: window.location.origin, path: { eventTypeId } }).then(({ data }) => {
      if (active) {
        setCalendar(data ?? null)
        setCalendarStatus(data ? 'ready' : 'error')
      }
    }).catch(() => {
      if (active) setCalendarStatus('error')
    })
    return () => { active = false }
  }, [eventTypeId])

  async function book(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!eventTypeId || !selectedStart) return
    setBookingError('')
    try {
      const { data, response } = await createBooking({
        baseUrl: window.location.origin,
        body: { eventTypeId, start: selectedStart, guestName, guestEmail },
      })
      if (data) {
        setConfirmation(data)
        return
      }
      if (response?.status === 409) {
        setBookingError('Выбранное время занято. Выберите другой слот.')
        setSelectedStart('')
        const refreshed = await listSlots({ baseUrl: window.location.origin, path: { eventTypeId } })
        setCalendar(refreshed.data ?? null)
      } else {
        setBookingError('Не удалось создать бронирование. Проверьте данные и попробуйте ещё раз.')
      }
    } catch {
      setBookingError('Не удалось создать бронирование. Попробуйте ещё раз.')
    }
  }

  function showTime(value: string, ownerTimeZone: string) {
    return new Intl.DateTimeFormat('ru-RU', {
      timeZone: ownerTimeZone,
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  }

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
            <Text>Выберите тип события и свободное время</Text>
            {eventTypeId && <Text>Выбранный тип: {eventTypes.find((item) => item.id === eventTypeId)?.title ?? eventTypeId}</Text>}
            {eventTypeId && calendarStatus === 'loading' && <Text>Загружаем календарь…</Text>}
            {eventTypeId && calendarStatus === 'error' && <Text role="alert">Не удалось загрузить календарь</Text>}
            {eventTypeId && calendar && calendarStatus === 'ready' && (
              <Stack>
                <Text>Часовой пояс владельца: {calendar.ownerTimeZone}</Text>
                {confirmation ? (
                  <Paper withBorder p="md" role="status">
                    <Title order={2}>Бронирование подтверждено</Title>
                    <Text>Номер: {confirmation.id}</Text>
                    <Text>Тип события: {confirmation.eventType.title}</Text>
                    <Text>Начало: {showTime(confirmation.start, calendar.ownerTimeZone)}</Text>
                    <Text>Окончание: {showTime(confirmation.end, calendar.ownerTimeZone)}</Text>
                  </Paper>
                ) : calendar.slots.length === 0 ? <Text>В ближайшие 14 дней свободных слотов нет</Text> : (
                  calendar.slots.map((slot) => (
                    <Button key={slot.start} variant={selectedStart === slot.start ? 'filled' : 'light'}
                      onClick={() => setSelectedStart(slot.start)}>
                      {showTime(slot.start, calendar.ownerTimeZone)}
                    </Button>
                  ))
                )}
                {selectedStart && !confirmation && (
                  <form onSubmit={(event) => void book(event)}>
                    <Stack gap="md">
                      <Text>Выбрано: {showTime(selectedStart, calendar.ownerTimeZone)}</Text>
                      <TextInput label="Ваше имя" required value={guestName} onChange={(event) => setGuestName(event.currentTarget.value)} />
                      <TextInput label="Email" type="email" required value={guestEmail} onChange={(event) => setGuestEmail(event.currentTarget.value)} />
                      <Button type="submit">Забронировать</Button>
                    </Stack>
                  </form>
                )}
                {bookingError && <Text role="alert" c="red">{bookingError}</Text>}
              </Stack>
            )}
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

function BookingPage() {
  const { eventTypeId } = useParams()
  return <BookingContent key={eventTypeId} eventTypeId={eventTypeId} />
}

export default BookingPage
