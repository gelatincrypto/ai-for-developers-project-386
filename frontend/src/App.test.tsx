// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { MemoryRouter } from 'react-router'
import App from './App'

afterEach(cleanup)

test('посетитель переходит с главной на страницу бронирования', () => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
  }))

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
