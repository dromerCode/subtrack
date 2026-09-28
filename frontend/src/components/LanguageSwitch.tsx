import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

export function LanguageSwitch() {
  const { t, i18n } = useTranslation()
  const next = i18n.resolvedLanguage === 'es' ? 'en' : 'es'
  return (
    <Button type="button" variant="ghost" size="sm" onClick={() => void i18n.changeLanguage(next)}>
      {t('nav.switchLanguage')}
    </Button>
  )
}
