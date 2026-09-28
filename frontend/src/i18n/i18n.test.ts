import { expect, it } from 'vitest'
import en from './en.json'
import es from './es.json'
import i18n from '.'

function keys(object: object, prefix = ''): string[] {
  return Object.entries(object).flatMap(([key, value]) =>
    typeof value === 'object' && value !== null ? keys(value, `${prefix}${key}.`) : [`${prefix}${key}`],
  )
}

it('has the same keys in both languages', () => {
  expect(keys(es).sort()).toEqual(keys(en).sort())
})

it('translates and pluralises', async () => {
  expect(i18n.t('login.title')).toBe('Sign in')
  expect(i18n.t('period.MONTH', { count: 1 })).toBe('every month')
  expect(i18n.t('period.MONTH', { count: 3 })).toBe('every 3 months')
  await i18n.changeLanguage('es')
  expect(i18n.t('login.title')).toBe('Iniciar sesión')
  expect(i18n.t('period.WEEK', { count: 2 })).toBe('cada 2 semanas')
})
