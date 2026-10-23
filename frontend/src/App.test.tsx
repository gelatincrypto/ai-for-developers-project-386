// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { MemoryRouter } from 'react-router'
import App from './App'

beforeEach(() => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

test('посетитель переходит с главной на страницу бронирования', () => {
  render(
    <MantineProvider env="test">
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    </MantineProvider>,
  )

  fireEvent.click(screen.getByRole('link', { name: 'Перейти к бронированию' }))

  expect(screen.getByRole('heading', { name: 'Бронирование' })).toBeTruthy()
  expect(screen.getByText('Бронирование пока недоступно')).toBeTruthy()
})

test('страница бронирования показывает доступность API через сгенерированный клиент', async () => {
  vi.stubGlobal('Request', class {
    url: string
    constructor(url: string) {
      this.url = url
    }
  })
  const fetchMock = vi.fn(async (request: { url: string }) => ({
    ok: true,
    status: 200,
    headers: new Headers({ 'Content-Type': 'application/json' }),
    text: async () => request.url.endsWith('/api/health') ? '{"status":"ok"}' : '[]',
  }))
  vi.stubGlobal('fetch', fetchMock)

  render(
    <MantineProvider env="test">
      <MemoryRouter initialEntries={['/booking']}>
        <App />
      </MemoryRouter>
    </MantineProvider>,
  )

  expect(await screen.findByText('Сервер доступен')).toBeTruthy()
  expect(fetchMock.mock.calls[0]?.[0].url).toBe(`${window.location.origin}/api/health`)
})

test('владелец входит в закрытую часть и выходит', async () => {
  vi.stubGlobal('Request', class {
    url: string
    method: string
    constructor(url: string, init: RequestInit) {
      this.url = url
      this.method = init.method ?? 'GET'
    }
  })
  let authenticated = false
  vi.stubGlobal('fetch', vi.fn(async (request: { method: string; url: string }) => {
    expect(request.url).toBe(`${window.location.origin}/api/owner/session`)
    if (request.method === 'POST') authenticated = true
    if (request.method === 'DELETE') authenticated = false
    const status = request.method === 'DELETE' ? 204 : authenticated ? 200 : 401
    return {
      ok: status < 400,
      status,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      text: async () => status === 200 ? '{"username":"test-owner"}' : '',
    }
  }))

  render(
    <MantineProvider env="test">
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    </MantineProvider>,
  )

  fireEvent.click(screen.getByRole('link', { name: 'Вход для владельца' }))
  expect(await screen.findByRole('heading', { name: 'Вход владельца' })).toBeTruthy()
  fireEvent.change(screen.getByRole('textbox', { name: 'Логин' }), { target: { value: 'test-owner' } })
  fireEvent.change(screen.getByLabelText(/Пароль/), { target: { value: 'test-password' } })
  fireEvent.click(screen.getByRole('button', { name: 'Войти' }))
  expect(await screen.findByText('Вы вошли как test-owner')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Выйти' }))
  expect(await screen.findByRole('heading', { name: 'Вход владельца' })).toBeTruthy()
})

test('созданный владельцем тип виден гостю в каталоге', async () => {
  vi.stubGlobal('Request', class {
    url: string
    method: string
    constructor(url: string, init: RequestInit) {
      this.url = url
      this.method = init.method ?? 'GET'
    }
  })
  let created = false
  vi.stubGlobal('fetch', vi.fn(async (request: { method: string; url: string }) => {
    if (request.url.endsWith('/api/event-types') && request.method === 'POST') created = true
    const data = request.url.endsWith('/api/owner/session')
      ? '{"username":"test-owner"}'
      : request.url.endsWith('/api/health') ? '{"status":"ok"}'
      : request.url.endsWith('/api/event-types/consultation/slots')
        ? '{"ownerTimeZone":"Europe/Moscow","slots":[{"start":"2026-10-26T09:00:00+03:00","end":"2026-10-26T09:45:00+03:00"}]}'
      : created ? '[{"id":"consultation","title":"Консультация","description":"Знакомство","durationMinutes":45}]' : '[]'
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      text: async () => request.method === 'POST' && request.url.endsWith('/api/event-types')
        ? '{"id":"consultation","title":"Консультация","description":"Знакомство","durationMinutes":45}' : data,
    }
  }))

  render(
    <MantineProvider env="test">
      <MemoryRouter initialEntries={['/owner']}>
        <App />
      </MemoryRouter>
    </MantineProvider>,
  )

  expect(await screen.findByRole('heading', { name: 'Новый тип события' })).toBeTruthy()
  fireEvent.change(screen.getByRole('textbox', { name: 'Идентификатор' }), { target: { value: 'consultation' } })
  fireEvent.change(screen.getByRole('textbox', { name: 'Название' }), { target: { value: 'Консультация' } })
  fireEvent.change(screen.getByRole('textbox', { name: 'Описание' }), { target: { value: 'Знакомство' } })
  fireEvent.change(screen.getByRole('spinbutton', { name: 'Длительность в минутах' }), { target: { value: '45' } })
  fireEvent.click(screen.getByRole('button', { name: 'Создать тип события' }))
  expect(await screen.findByText('Тип события «Консультация» создан')).toBeTruthy()

  fireEvent.click(screen.getByRole('link', { name: 'На главную' }))
  fireEvent.click(screen.getByRole('link', { name: 'Перейти к бронированию' }))
  expect(await screen.findByText('Консультация')).toBeTruthy()
  expect(screen.getByText('Знакомство')).toBeTruthy()
  expect(screen.getByText('45 мин.')).toBeTruthy()
  fireEvent.click(screen.getByRole('link', { name: 'Открыть календарь: Консультация' }))
  expect(await screen.findByText('Выбранный тип: Консультация')).toBeTruthy()
  expect(await screen.findByText('Часовой пояс владельца: Europe/Moscow')).toBeTruthy()
  expect(await screen.findByText(/26 окт.*09:00/)).toBeTruthy()
})

test('пустой календарь объясняет отсутствие слотов', async () => {
  vi.stubGlobal('Request', class {
    url: string
    constructor(url: string) {
      this.url = url
    }
  })
  vi.stubGlobal('fetch', vi.fn(async (request: { url: string }) => ({
    ok: true,
    status: 200,
    headers: new Headers({ 'Content-Type': 'application/json' }),
    text: async () => request.url.endsWith('/api/health') ? '{"status":"ok"}'
      : request.url.endsWith('/slots') ? '{"ownerTimeZone":"Europe/Moscow","slots":[]}'
      : '[{"id":"long","title":"Длинный звонок","description":"Тест","durationMinutes":541}]',
  })))

  render(
    <MantineProvider env="test">
      <MemoryRouter initialEntries={['/booking']}>
        <App />
      </MemoryRouter>
    </MantineProvider>,
  )

  fireEvent.click(await screen.findByRole('link', { name: 'Открыть календарь: Длинный звонок' }))
  expect(await screen.findByText('В ближайшие 14 дней свободных слотов нет')).toBeTruthy()
})
