import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'
import i18n from '@/i18n'
import { server } from './server'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

beforeEach(async () => {
  document.cookie = 'XSRF-TOKEN=test-token; path=/'
  await i18n.changeLanguage('en')
})

afterEach(() => {
  server.resetHandlers()
  cleanup()
  localStorage.clear()
  document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
})

afterAll(() => server.close())
