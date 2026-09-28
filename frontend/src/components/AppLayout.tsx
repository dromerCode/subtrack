import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { LanguageSwitch } from '@/components/LanguageSwitch'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { cn } from '@/lib/utils'

function navClass({ isActive }: { isActive: boolean }) {
  return cn('text-sm', isActive ? 'font-semibold text-foreground' : 'text-muted-foreground hover:text-foreground')
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
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <span className="font-semibold">subtrack</span>
          <nav className="flex gap-4">
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
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitch />
            <Button variant="outline" size="sm" onClick={() => logout.mutate()}>
              {t('nav.logout')}
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
