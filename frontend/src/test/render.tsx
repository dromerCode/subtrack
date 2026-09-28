import { QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router'
import { AppRoutes } from '@/AppRoutes'
import { Toaster } from '@/components/ui/sonner'
import { createQueryClient } from '@/lib/queryClient'

/** Renders the whole app at `path`, as the router would. */
export function renderApp(path = '/') {
  const queryClient = createQueryClient()
  const user = userEvent.setup()
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
      <Toaster />
    </QueryClientProvider>,
  )
  return { user, queryClient, ...utils }
}

export const loggedIn = () => http.get('/api/auth/me', () => HttpResponse.json({ username: 'picha' }))
export const loggedOut = () => http.get('/api/auth/me', () => new HttpResponse(null, { status: 401 }))
