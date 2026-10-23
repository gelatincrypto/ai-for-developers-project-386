import { useEffect, useState, type FormEvent } from 'react'
import { Button, Container, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core'
import { Link } from 'react-router'
import { getOwnerSession, login, logout } from '../generated/api'

function OwnerPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [owner, setOwner] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    void getOwnerSession({ baseUrl: window.location.origin }).then(({ data }) => {
      if (active) {
        setOwner(data?.username ?? null)
        setLoading(false)
      }
    }).catch(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [])

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    try {
      const { data } = await login({ baseUrl: window.location.origin, body: { username, password } })
      if (!data) {
        setError('Неверный логин или пароль')
        return
      }
      setOwner(data.username)
      setPassword('')
    } catch {
      setError('Не удалось войти. Попробуйте ещё раз.')
    }
  }

  async function signOut() {
    try {
      const { error: signOutError } = await logout({ baseUrl: window.location.origin })
      if (signOutError) {
        setError('Не удалось выйти. Попробуйте ещё раз.')
        return
      }
      setOwner(null)
    } catch {
      setError('Не удалось выйти. Попробуйте ещё раз.')
    }
  }

  return (
    <Container component="main" size="sm" py="xl">
      <Stack gap="lg">
        <Title order={1}>Управление календарём</Title>
        {loading ? <Text>Проверяем вход…</Text> : owner ? (
          <>
            <Text>Вы вошли как {owner}</Text>
            <Button onClick={() => void signOut()}>Выйти</Button>
          </>
        ) : (
          <form onSubmit={(event) => void signIn(event)}>
            <Stack gap="md">
              <Title order={2}>Вход владельца</Title>
              <TextInput label="Логин" required value={username} onChange={(event) => setUsername(event.currentTarget.value)} />
              <PasswordInput label="Пароль" required value={password} onChange={(event) => setPassword(event.currentTarget.value)} />
              <Button type="submit">Войти</Button>
            </Stack>
          </form>
        )}
        {error && <Text role="alert" c="red">{error}</Text>}
        <Button component={Link} to="/" variant="subtle">На главную</Button>
      </Stack>
    </Container>
  )
}

export default OwnerPage
