import { useTranslation } from 'react-i18next'
import { LookupList } from './LookupList'

export function SettingsPage() {
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t('settings.title')}</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <LookupList
          kind="categories"
          title={t('settings.categories')}
          deleteDescription={t('settings.deleteCategoryBody')}
        />
        <LookupList
          kind="payment-methods"
          title={t('settings.paymentMethods')}
          deleteDescription={t('settings.deletePaymentMethodBody')}
        />
      </div>
    </div>
  )
}
