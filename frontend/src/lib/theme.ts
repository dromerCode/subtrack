import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'

/** Same key and colours as the inline script in index.html, which applies the theme before the first paint. */
const STORAGE_KEY = 'subtrack.theme'
/** --background of each theme as hex, for the browser's own chrome (mobile address bar). */
const BROWSER_CHROME: Record<Theme, string> = { light: '#faf6ee', dark: '#18130e' }

const listeners = new Set<() => void>()

function currentTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export function setTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', BROWSER_CHROME[theme])
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // storage unavailable (private mode): the choice lasts until reload
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, currentTheme, () => 'light')
}
