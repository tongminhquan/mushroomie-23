'use client'

import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'
import {
  THEME_CHANGE_EVENT,
  THEME_META_COLORS,
  type Theme,
  isTheme,
  serializeThemeCookie,
} from '@/lib/theme'

function currentTheme(): Theme {
  const value = document.documentElement.dataset.theme
  return isTheme(value) ? value : 'light'
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.dataset.theme = theme
  root.style.colorScheme = theme
  document.cookie = serializeThemeCookie(theme, window.location.protocol === 'https:')
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_META_COLORS[theme])
  window.dispatchEvent(new CustomEvent<Theme>(THEME_CHANGE_EVENT, { detail: theme }))
}

export default function ThemeToggle({
  variant = 'icon',
  className,
}: {
  variant?: 'icon' | 'segmented'
  className?: string
}) {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    setTheme(currentTheme())

    const sync = (event: Event) => {
      const nextTheme = (event as CustomEvent<Theme>).detail
      if (isTheme(nextTheme)) setTheme(nextTheme)
    }

    window.addEventListener(THEME_CHANGE_EVENT, sync)
    return () => window.removeEventListener(THEME_CHANGE_EVENT, sync)
  }, [])

  const selectTheme = (nextTheme: Theme) => {
    applyTheme(nextTheme)
    setTheme(nextTheme)
  }

  if (variant === 'segmented') {
    return (
      <div className={cn('theme-transition flex items-center justify-between gap-3', className)}>
        <span className="text-sm font-bold text-theme-secondary">Giao diện</span>
        <div className="grid grid-cols-2 rounded-xl border border-theme bg-theme-subtle p-1">
          <button
            type="button"
            aria-label="Dùng giao diện sáng"
            aria-pressed={theme === 'light'}
            onClick={() => selectTheme('light')}
            className="theme-transition min-h-10 rounded-lg px-3 text-xs font-bold text-theme-muted aria-pressed:bg-theme-card aria-pressed:text-primary"
          >
            Sáng
          </button>
          <button
            type="button"
            aria-label="Dùng giao diện tối"
            aria-pressed={theme === 'dark'}
            onClick={() => selectTheme('dark')}
            className="theme-transition min-h-10 rounded-lg px-3 text-xs font-bold text-theme-muted aria-pressed:bg-theme-card aria-pressed:text-primary"
          >
            Tối
          </button>
        </div>
      </div>
    )
  }

  const dark = theme === 'dark'
  return (
    <button
      type="button"
      aria-label={dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      title={dark ? 'Giao diện sáng' : 'Giao diện tối'}
      onClick={() => selectTheme(dark ? 'light' : 'dark')}
      className={cn(
        'theme-transition grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-theme bg-theme-card text-theme-primary hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20',
        className,
      )}
    >
      {dark ? <Sun size={19} aria-hidden /> : <Moon size={19} aria-hidden />}
    </button>
  )
}
