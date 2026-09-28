import { http, HttpResponse } from 'msw'
import { expect, it } from 'vitest'
import { server } from '@/test/server'
import { ApiError, api } from './api'

it('sends the CSRF cookie back as a header on writes', async () => {
  server.use(
    http.post('/api/echo', ({ request }) => HttpResponse.json({ token: request.headers.get('X-XSRF-TOKEN') })),
  )
  await expect(api('/api/echo', { method: 'POST', json: {} })).resolves.toEqual({ token: 'test-token' })
})

it('fetches a CSRF cookie first when there is none (after login or logout)', async () => {
  document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
  server.use(
    http.get('/api/auth/me', () => {
      document.cookie = 'XSRF-TOKEN=fresh-token; path=/'
      return new HttpResponse(null, { status: 401 })
    }),
    http.post('/api/echo', ({ request }) => HttpResponse.json({ token: request.headers.get('X-XSRF-TOKEN') })),
  )
  await expect(api('/api/echo', { method: 'POST', json: {} })).resolves.toEqual({ token: 'fresh-token' })
})

it('turns problem details into an ApiError with field errors', async () => {
  server.use(
    http.post('/api/things', () =>
      HttpResponse.json(
        { status: 400, title: 'Validation failed', errors: [{ field: 'price', code: 'positive' }] },
        { status: 400, headers: { 'Content-Type': 'application/problem+json' } },
      ),
    ),
  )
  const error = await api('/api/things', { method: 'POST', json: {} }).catch((e: unknown) => e)
  expect(error).toBeInstanceOf(ApiError)
  expect((error as ApiError).status).toBe(400)
  expect((error as ApiError).fieldErrors()).toEqual({ price: 'positive' })
})

it('returns undefined for 204 and sends forms url-encoded', async () => {
  server.use(
    http.post('/api/form', async ({ request }) => {
      const body = await request.text()
      return body === 'username=a&password=b' ? new HttpResponse(null, { status: 204 }) : HttpResponse.error()
    }),
  )
  await expect(api('/api/form', { method: 'POST', form: { username: 'a', password: 'b' } })).resolves.toBeUndefined()
})
