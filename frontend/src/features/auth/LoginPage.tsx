import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation } from 'react-router'
import { LanguageSwitch } from '@/components/LanguageSwitch'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiError, api } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { useMe } from './useMe'

export function LoginPage() {
  const { t } = useTranslation()
  const me = useMe()
  const queryClient = useQueryClient()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const login = useMutation({
    mutationFn: () => api<void>('/api/auth/login', { method: 'POST', form: { username, password } }),
    // Refetching "me" logs us in; the redirect below then takes over.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.me }),
  })

  if (me.data) return <Navigate to={from} replace />

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    login.mutate()
  }
  const wrongCredentials = login.error instanceof ApiError && login.error.status === 401

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[radial-gradient(ellipse_at_top,var(--accent),transparent_60%)] p-4">
      <Logo large />
      <Card className="w-full max-w-sm shadow-[0_12px_40px_-12px_oklch(0.3_0.03_60/0.25)]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            <h1 className="font-display text-2xl font-semibold tracking-tight">{t('login.title')}</h1>
          </CardTitle>
          <LanguageSwitch />
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="username">{t('login.username')}</Label>
              <Input
                id="username"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{t('login.password')}</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {login.isError && (
              <p role="alert" className="text-sm text-destructive">
                {wrongCredentials ? t('login.invalid') : t('errors.generic')}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={login.isPending}>
              {t('login.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
