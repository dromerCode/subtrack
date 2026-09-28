import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'
import i18n from '@/i18n'
import { server } from './server'

// jsdom has no matchMedia; sonner's Toaster reads it to follow the system theme.
window.matchMedia ??= (query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList

// jsdom has no ResizeObserver; Radix's Switch measures itself with it inside forms.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

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
