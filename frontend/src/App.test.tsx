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
  const fetchMock = vi.fn(async (_request: { url: string }) => ({
    ok: true,
    status: 200,
    headers: new Headers({ 'Content-Type': 'application/json' }),
    text: async () => '{"status":"ok"}',
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
