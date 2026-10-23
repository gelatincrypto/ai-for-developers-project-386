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
