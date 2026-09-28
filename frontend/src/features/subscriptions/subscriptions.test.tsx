import { screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { expect, it } from 'vitest'
import type { Subscription, SubscriptionInput } from '@/lib/types'
import { loggedIn, renderApp } from '@/test/render'
import { server } from '@/test/server'

function subscription(overrides: Partial<Subscription>): Subscription {
  return {
    id: 1,
    name: 'Netflix',
    price: 15.99,
    intervalCount: 1,
    intervalUnit: 'MONTH',
    anchorDate: '2026-01-20',
    sharedWith: 1,
    category: null,
    paymentMethod: null,
    notes: null,
    active: true,
    createdAt: '2026-01-01T10:00:00Z',
    updatedAt: '2026-01-01T10:00:00Z',
    yourShare: 15.99,
    monthlyCost: 15.99,
    yearlyCost: 191.88,
    nextChargeDate: '2026-01-20',
    ...overrides,
  }
}

const lookups = () => [
  http.get('/api/categories', () => HttpResponse.json([{ id: 3, name: 'Streaming' }])),
  http.get('/api/payment-methods', () => HttpResponse.json([])),
]

it('lists subscriptions with your share, billing and status', async () => {
  server.use(
    loggedIn(),
    http.get('/api/subscriptions', () =>
      HttpResponse.json([
        subscription({ id: 1, category: { id: 3, name: 'Streaming' } }),
        subscription({ id: 2, name: 'Spotify Duo', price: 16, sharedWith: 2, yourShare: 8, intervalCount: 2 }),
        subscription({ id: 3, name: 'Old gym', active: false, nextChargeDate: null }),
      ]),
    ),
  )
  renderApp('/subscriptions')

  const rows = await screen.findAllByRole('row')
  const netflix = within(rows[1])
  expect(netflix.getByRole('link', { name: 'Netflix' })).toHaveAttribute('href', '/subscriptions/1')
  expect(netflix.getByText('Streaming')).toBeInTheDocument()
  expect(netflix.getByText('€15.99')).toBeInTheDocument()
  expect(netflix.getByText('every month')).toBeInTheDocument()
  expect(netflix.getByText('Jan 20, 2026')).toBeInTheDocument()
  expect(within(rows[2]).getByText('total €16.00 ÷ 2')).toBeInTheDocument()
  expect(within(rows[2]).getByText('every 2 months')).toBeInTheDocument()
  expect(within(rows[3]).getByText('Cancelled')).toBeInTheDocument()
})

it('shows an empty state', async () => {
  server.use(loggedIn(), http.get('/api/subscriptions', () => HttpResponse.json([])))
  renderApp('/subscriptions')
  expect(await screen.findByText('No subscriptions yet')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Add the first one' })).toHaveAttribute('href', '/subscriptions/new')
})

it('creates a subscription', async () => {
  let sent: SubscriptionInput | undefined
  server.use(
    loggedIn(),
    ...lookups(),
    http.post('/api/subscriptions', async ({ request }) => {
      sent = (await request.json()) as SubscriptionInput
      return HttpResponse.json(subscription({}), { status: 201 })
    }),
    http.get('/api/subscriptions', () => HttpResponse.json([subscription({})])),
  )
  const { user } = renderApp('/subscriptions/new')

  await user.type(await screen.findByLabelText('Name'), 'Netflix')
  await user.type(screen.getByLabelText('Total price (€)'), '15.99')
  await screen.findByRole('option', { name: 'Streaming' })
  await user.selectOptions(screen.getByLabelText('Category'), 'Streaming')
  await user.click(screen.getByRole('button', { name: 'Save' }))

  expect(await screen.findByRole('heading', { name: 'Subscriptions' })).toBeInTheDocument()
  expect(sent).toEqual(
    expect.objectContaining({
      name: 'Netflix',
      price: 15.99,
      intervalCount: 1,
      intervalUnit: 'MONTH',
      sharedWith: 1,
      categoryId: 3,
      paymentMethodId: null,
      notes: null,
      active: true,
    }),
  )
  expect(sent?.anchorDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
})

it('shows translated server errors under each field', async () => {
  server.use(
    loggedIn(),
    ...lookups(),
    http.post('/api/subscriptions', () =>
      HttpResponse.json(
        {
          status: 400,
          title: 'Validation failed',
          errors: [
            { field: 'name', code: 'size' },
            { field: 'price', code: 'digits' },
          ],
        },
        { status: 400, headers: { 'Content-Type': 'application/problem+json' } },
      ),
    ),
  )
  const { user } = renderApp('/subscriptions/new')

  await user.type(await screen.findByLabelText('Name'), 'Netflix')
  await user.type(screen.getByLabelText('Total price (€)'), '15.99')
  await user.click(screen.getByRole('button', { name: 'Save' }))

  expect(await screen.findByText('Too long')).toBeInTheDocument()
  expect(screen.getByText('At most 2 decimals')).toBeInTheDocument()
})

it('goes to the login page when the session expired while saving', async () => {
  server.use(
    loggedIn(),
    ...lookups(),
    http.post('/api/subscriptions', () => new HttpResponse(null, { status: 401 })),
  )
  const { user } = renderApp('/subscriptions/new')

  await user.type(await screen.findByLabelText('Name'), 'Netflix')
  await user.type(screen.getByLabelText('Total price (€)'), '15.99')
  await user.click(screen.getByRole('button', { name: 'Save' }))

  expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
})

it('edits and cancels a subscription', async () => {
  let sent: SubscriptionInput | undefined
  server.use(
    loggedIn(),
    ...lookups(),
    http.get('/api/subscriptions/1', () => HttpResponse.json(subscription({ category: { id: 3, name: 'Streaming' } }))),
    http.put('/api/subscriptions/1', async ({ request }) => {
      sent = (await request.json()) as SubscriptionInput
      return HttpResponse.json(subscription({ active: false }))
    }),
    http.get('/api/subscriptions', () => HttpResponse.json([])),
  )
  const { user } = renderApp('/subscriptions/1')

  expect(await screen.findByLabelText('Name')).toHaveValue('Netflix')
  await screen.findByRole('option', { name: 'Streaming' })
  expect(screen.getByLabelText('Category')).toHaveValue('3')
  await user.click(screen.getByRole('switch', { name: 'Active' }))
  await user.click(screen.getByRole('button', { name: 'Save' }))

  expect(await screen.findByRole('heading', { name: 'Subscriptions' })).toBeInTheDocument()
  expect(sent).toEqual(expect.objectContaining({ name: 'Netflix', price: 15.99, categoryId: 3, active: false }))
})

it('deletes after confirming', async () => {
  let deleted = false
  server.use(
    loggedIn(),
    ...lookups(),
    http.get('/api/subscriptions/1', () => HttpResponse.json(subscription({}))),
    http.delete('/api/subscriptions/1', () => {
      deleted = true
      return new HttpResponse(null, { status: 204 })
    }),
    http.get('/api/subscriptions', () => HttpResponse.json([])),
  )
  const { user } = renderApp('/subscriptions/1')

  await user.click(await screen.findByRole('button', { name: 'Delete' }))
  const dialog = await screen.findByRole('alertdialog', { name: 'Delete this subscription?' })
  await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

  expect(await screen.findByText('No subscriptions yet')).toBeInTheDocument()
  expect(deleted).toBe(true)
})

it('says when the subscription does not exist', async () => {
  server.use(
    loggedIn(),
    ...lookups(),
    http.get('/api/subscriptions/999', () =>
      HttpResponse.json({ status: 404 }, { status: 404, headers: { 'Content-Type': 'application/problem+json' } }),
    ),
  )
  renderApp('/subscriptions/999')
  expect(await screen.findByText('This subscription does not exist')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Back to the list' })).toHaveAttribute('href', '/subscriptions')
})
