import { MoonIcon, SunIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { setTheme, useTheme } from '@/lib/theme'

export function ThemeToggle() {
  const { t } = useTranslation()
  const theme = useTheme()
  const next = theme === 'dark' ? 'light' : 'dark'
  const label = t(next === 'dark' ? 'nav.darkMode' : 'nav.lightMode')
  return (
    <Button type="button" variant="ghost" size="icon-sm" aria-label={label} title={label} onClick={() => setTheme(next)}>
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </Button>
  )
}
