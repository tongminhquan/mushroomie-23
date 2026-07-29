import { describe, expect, it } from 'vitest'
import {
  THEME_COOKIE_MAX_AGE,
  buildThemeBootstrapScript,
  isTheme,
  readThemeCookie,
  serializeThemeCookie,
} from '@/lib/theme'

describe('theme contract', () => {
  it('accepts only supported themes', () => {
    expect(isTheme('light')).toBe(true)
    expect(isTheme('dark')).toBe(true)
    expect(isTheme('system')).toBe(false)
    expect(isTheme('')).toBe(false)
    expect(isTheme(null)).toBe(false)
  })

  it('defaults malformed or missing cookies to light', () => {
    expect(readThemeCookie('')).toBe('light')
    expect(readThemeCookie('session=abc')).toBe('light')
    expect(readThemeCookie('mushroomie_theme=system')).toBe('light')
    expect(readThemeCookie('a=1; mushroomie_theme=dark; b=2')).toBe('dark')
    expect(readThemeCookie('mushroomie_theme=light')).toBe('light')
  })

  it('serializes a rolling 400-day cookie', () => {
    expect(THEME_COOKIE_MAX_AGE).toBe(34_560_000)
    expect(serializeThemeCookie('dark', false)).toBe(
      'mushroomie_theme=dark; Max-Age=34560000; Path=/; SameSite=Lax',
    )
    expect(serializeThemeCookie('light', true)).toBe(
      'mushroomie_theme=light; Max-Age=34560000; Path=/; SameSite=Lax; Secure',
    )
  })

  it('generates a bootstrap script with a light fallback and rolling refresh', () => {
    const script = buildThemeBootstrapScript()
    expect(script).toContain('mushroomie_theme')
    expect(script).toContain('34560000')
    expect(script).toContain("theme='light'")
    expect(script).toContain('dataset.theme')
    expect(script).toContain('colorScheme')
  })
})
