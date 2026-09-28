import { useMutation, useQueryClient } from '@tanstack/react-query'
import { LogOutIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { LanguageSwitch } from '@/components/LanguageSwitch'
import { Logo } from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { cn } from '@/lib/utils'

function navClass({ isActive }: { isActive: boolean }) {
  return cn(
    'rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
    isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
  )
}

export function AppLayout() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const logout = useMutation({
    mutationFn: () => api<void>('/api/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      queryClient.clear()
      queryClient.setQueryData(queryKeys.me, null)
      navigate('/login', { replace: true })
    },
  })

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-background">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link to="/" className="rounded-md" aria-label="subtrack">
            <Logo />
          </Link>
          {/* On phones the nav drops to its own full-width row below the logo and controls. */}
          <nav className="order-last -mx-1 flex w-full gap-1 overflow-x-auto sm:order-none sm:mx-0 sm:w-auto">
            <NavLink to="/" end className={navClass}>
              {t('nav.dashboard')}
            </NavLink>
            <NavLink to="/subscriptions" className={navClass}>
              {t('nav.subscriptions')}
            </NavLink>
            <NavLink to="/settings" className={navClass}>
              {t('nav.settings')}
            </NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <LanguageSwitch />
            <ThemeToggle />
            <Button variant="outline" size="sm" className="ml-1" onClick={() => logout.mutate()}>
              <LogOutIcon aria-hidden="true" />
              {t('nav.logout')}
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 pt-8 pb-16">
        <Outlet />
      </main>
    </div>
  )
}
