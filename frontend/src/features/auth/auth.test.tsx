import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { expect, it } from 'vitest'
import { loggedIn, loggedOut, renderApp } from '@/test/render'
import { server } from '@/test/server'

/** A fake backend session: login flips it on, logout clears it and the CSRF cookie, like Spring does. */
const emptyDashboard = () =>
  http.get('/api/dashboard', () => HttpResponse.json({ monthlyTotal: 0, yearlyTotal: 0, upcoming: [], byCategory: [] }))

function sessionHandlers() {
  let session = false
  return [
    emptyDashboard(),
    http.get('/api/auth/me', () => {
      if (!document.cookie.includes('XSRF-TOKEN=')) document.cookie = 'XSRF-TOKEN=new-token; path=/'
      return session ? HttpResponse.json({ username: 'picha' }) : new HttpResponse(null, { status: 401 })
    }),
    http.post('/api/auth/login', async ({ request }) => {
      const form = new URLSearchParams(await request.text())
      if (!request.headers.get('X-XSRF-TOKEN')) return new HttpResponse(null, { status: 403 })
      if (form.get('username') !== 'picha' || form.get('password') !== 'secret') {
        return new HttpResponse(null, { status: 401 })
      }
      session = true
      document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
      return new HttpResponse(null, { status: 204 })
    }),
    http.post('/api/auth/logout', () => {
      session = false
      document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
      return new HttpResponse(null, { status: 204 })
    }),
  ]
}

it('sends visitors without a session to the login page', async () => {
  server.use(loggedOut())
  renderApp('/')
  expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
})

it('logs in and shows the dashboard', async () => {
  server.use(...sessionHandlers())
  const { user } = renderApp('/')
  await user.type(await screen.findByLabelText('Username'), 'picha')
  await user.type(screen.getByLabelText('Password'), 'secret')
  await user.click(screen.getByRole('button', { name: 'Sign in' }))
  expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
})

it('says so when the credentials are wrong', async () => {
  server.use(...sessionHandlers())
  const { user } = renderApp('/login')
  await user.type(await screen.findByLabelText('Username'), 'picha')
  await user.type(screen.getByLabelText('Password'), 'nope')
  await user.click(screen.getByRole('button', { name: 'Sign in' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Wrong username or password')
})

it('can log out and log back in without reloading', async () => {
  server.use(...sessionHandlers())
  const { user } = renderApp('/login')
  await user.type(await screen.findByLabelText('Username'), 'picha')
  await user.type(screen.getByLabelText('Password'), 'secret')
  await user.click(screen.getByRole('button', { name: 'Sign in' }))
  await user.click(await screen.findByRole('button', { name: 'Log out' }))

  await user.type(await screen.findByLabelText('Username'), 'picha')
  await user.type(screen.getByLabelText('Password'), 'secret')
  await user.click(screen.getByRole('button', { name: 'Sign in' }))
  expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
})

it('switches the language', async () => {
  server.use(loggedIn(), emptyDashboard())
  const { user } = renderApp('/')
  await user.click(await screen.findByRole('button', { name: 'Español' }))
  expect(await screen.findByRole('heading', { name: 'Panel' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Salir' })).toBeInTheDocument()
})
