import { screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { expect, it } from 'vitest'
import type { Lookup } from '@/lib/types'
import { loggedIn, renderApp } from '@/test/render'
import { server } from '@/test/server'

/** In-memory /api/categories and /api/payment-methods with the backend's duplicate rule. */
function lookupApi(initial: Record<string, Lookup[]>) {
  const store = structuredClone(initial)
  let nextId = 100
  const deleted: number[] = []
  const handlers = ['categories', 'payment-methods'].flatMap((kind) => [
    http.get(`/api/${kind}`, () => HttpResponse.json([...store[kind]].sort((a, b) => a.name.localeCompare(b.name)))),
    http.post(`/api/${kind}`, async ({ request }) => {
      const { name } = (await request.json()) as { name: string }
      if (store[kind].some((l) => l.name === name.trim())) {
        return HttpResponse.json(
          { status: 409, errors: [{ field: 'name', code: 'duplicate' }] },
          { status: 409, headers: { 'Content-Type': 'application/problem+json' } },
        )
      }
      const created = { id: nextId++, name: name.trim() }
      store[kind].push(created)
      return HttpResponse.json(created, { status: 201 })
    }),
    http.delete(`/api/${kind}/:id`, ({ params }) => {
      deleted.push(Number(params.id))
      store[kind] = store[kind].filter((l) => l.id !== Number(params.id))
      return new HttpResponse(null, { status: 204 })
    }),
  ])
  return { handlers, deleted }
}

it('lists categories by name and says when a list is empty', async () => {
  const { handlers } = lookupApi({ categories: [{ id: 1, name: 'Streaming' }, { id: 2, name: 'Gaming' }], 'payment-methods': [] })
  server.use(loggedIn(), ...handlers)
  renderApp('/settings')

  const categories = await screen.findByRole('region', { name: 'Categories' })
  const items = await within(categories).findAllByRole('listitem')
  expect(items.map((li) => li.textContent)).toEqual([
    expect.stringContaining('Gaming'),
    expect.stringContaining('Streaming'),
  ])
  const paymentMethods = screen.getByRole('region', { name: 'Payment methods' })
  expect(await within(paymentMethods).findByText(/Nothing here yet/)).toBeInTheDocument()
})

it('adds a category', async () => {
  const { handlers } = lookupApi({ categories: [], 'payment-methods': [] })
  server.use(loggedIn(), ...handlers)
  const { user } = renderApp('/settings')

  const categories = await screen.findByRole('region', { name: 'Categories' })
  await user.type(within(categories).getByLabelText('New name'), 'Music')
  await user.click(within(categories).getByRole('button', { name: 'Add' }))

  expect(await within(categories).findByText('Music')).toBeInTheDocument()
  expect(within(categories).getByLabelText('New name')).toHaveValue('')
})

it('shows a duplicate name error', async () => {
  const { handlers } = lookupApi({ categories: [{ id: 1, name: 'Music' }], 'payment-methods': [] })
  server.use(loggedIn(), ...handlers)
  const { user } = renderApp('/settings')

  const categories = await screen.findByRole('region', { name: 'Categories' })
  await user.type(within(categories).getByLabelText('New name'), ' Music ')
  await user.click(within(categories).getByRole('button', { name: 'Add' }))

  expect(await within(categories).findByText('That name already exists')).toBeInTheDocument()
})

it('deletes after confirming', async () => {
  const { handlers, deleted } = lookupApi({ categories: [], 'payment-methods': [{ id: 7, name: 'Visa' }] })
  server.use(loggedIn(), ...handlers)
  const { user } = renderApp('/settings')

  const paymentMethods = await screen.findByRole('region', { name: 'Payment methods' })
  const row = await within(paymentMethods).findByRole('listitem')
  await user.click(within(row).getByRole('button', { name: 'Delete' }))
  const dialog = await screen.findByRole('alertdialog', { name: 'Delete “Visa”?' })
  expect(dialog).toHaveTextContent('left without a payment method')
  await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

  expect(await within(paymentMethods).findByText(/Nothing here yet/)).toBeInTheDocument()
  expect(deleted).toEqual([7])
})

it('goes to the login page when the session has expired', async () => {
  server.use(
    loggedIn(),
    http.get('/api/categories', () => new HttpResponse(null, { status: 401 })),
    http.get('/api/payment-methods', () => new HttpResponse(null, { status: 401 })),
  )
  renderApp('/settings')
  expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
})
