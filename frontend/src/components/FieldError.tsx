import { useTranslation } from 'react-i18next'

/** Shows a backend error code (e.g. "positive") translated. */
export function FieldError({ code }: { code?: string }) {
  const { t } = useTranslation()
  if (!code) return null
  return <p className="text-sm text-destructive">{t(`fieldErrors.${code}`, { defaultValue: t('fieldErrors.invalid') })}</p>
}
