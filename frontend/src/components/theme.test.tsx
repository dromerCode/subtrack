import { screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { emptyDashboard, loggedIn, renderApp } from '@/test/render'
import { server } from '@/test/server'

it('switches between light and dark and remembers the choice', async () => {
  const themeColor = document.createElement('meta')
  themeColor.name = 'theme-color'
  document.head.append(themeColor)
  server.use(loggedIn(), ...emptyDashboard())
  const { user } = renderApp('/')

  await user.click(await screen.findByRole('button', { name: 'Switch to dark mode' }))
  expect(document.documentElement).toHaveClass('dark')
  expect(localStorage.getItem('subtrack.theme')).toBe('dark')
  expect(themeColor.content).toBe('#18130e')

  await user.click(screen.getByRole('button', { name: 'Switch to light mode' }))
  expect(document.documentElement).not.toHaveClass('dark')
  expect(localStorage.getItem('subtrack.theme')).toBe('light')
  expect(themeColor.content).toBe('#faf6ee')
  themeColor.remove()
})
