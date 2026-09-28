import { screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { expect, it } from 'vitest'
import type { Dashboard } from '@/lib/types'
import { loggedIn, renderApp } from '@/test/render'
import { server } from '@/test/server'

const dashboard: Dashboard = {
  monthlyTotal: 36.17,
  yearlyTotal: 434,
  upcoming: [
    { id: 1, name: 'Netflix', date: '2026-01-20', yourShare: 15 },
    { id: 3, name: 'Gym', date: '2026-01-24', yourShare: 7 },
  ],
  byCategory: [
    { categoryId: null, name: null, monthly: 21.17 },
    { categoryId: 5, name: 'Streaming', monthly: 15 },
  ],
}

it('shows totals, upcoming charges and spend by category', async () => {
  server.use(loggedIn(), http.get('/api/dashboard', () => HttpResponse.json(dashboard)))
  renderApp('/')

  expect(await screen.findByText('€36.17')).toBeInTheDocument()
  expect(screen.getByText('€434.00')).toBeInTheDocument()

  const upcoming = screen.getByRole('region', { name: 'Upcoming charges (30 days)' })
  const charges = within(upcoming).getAllByRole('listitem')
  expect(charges[0]).toHaveTextContent('Jan 20, 2026')
  expect(charges[0]).toHaveTextContent('Netflix')
  expect(charges[0]).toHaveTextContent('€15.00')
  expect(charges[1]).toHaveTextContent('Gym')

  const byCategory = screen.getByRole('region', { name: 'Monthly spend by category' })
  const categories = within(byCategory).getAllByRole('listitem')
  expect(categories[0]).toHaveTextContent('Uncategorized')
  expect(categories[0]).toHaveTextContent('€21.17')
  expect(within(categories[0]).getByTestId('bar')).toHaveStyle({ width: '100%' })
  expect(categories[1]).toHaveTextContent('Streaming')
})

it('says when nothing is due in the next 30 days', async () => {
  server.use(
    loggedIn(),
    http.get('/api/dashboard', () => HttpResponse.json({ ...dashboard, upcoming: [] })),
  )
  renderApp('/')
  expect(await screen.findByText('No charges in the next 30 days')).toBeInTheDocument()
})

it('invites to add the first subscription when there are none', async () => {
  server.use(
    loggedIn(),
    http.get('/api/dashboard', () =>
      HttpResponse.json({ monthlyTotal: 0, yearlyTotal: 0, upcoming: [], byCategory: [] }),
    ),
  )
  renderApp('/')
  expect(await screen.findByText('No active subscriptions yet')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Add the first one' })).toHaveAttribute('href', '/subscriptions/new')
})
