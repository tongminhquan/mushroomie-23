export type Theme = 'light' | 'dark'

export const THEME_COOKIE_NAME = 'mushroomie_theme'
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 400
export const THEME_CHANGE_EVENT = 'mushroomie:theme-change'
export const THEME_META_COLORS: Record<Theme, string> = {
  light: '#fff7f2',
  dark: '#171313',
}

export function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark'
}

export function readThemeCookie(cookieHeader: string): Theme {
  const prefix = `${THEME_COOKIE_NAME}=`
  const value = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length)

  return isTheme(value) ? value : 'light'
}

export function serializeThemeCookie(theme: Theme, secure: boolean): string {
  return [
    `${THEME_COOKIE_NAME}=${theme}`,
    `Max-Age=${THEME_COOKIE_MAX_AGE}`,
    'Path=/',
    'SameSite=Lax',
    secure ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ')
}

export function buildThemeBootstrapScript(): string {
  return `(function(){try{var name='${THEME_COOKIE_NAME}=',theme='light',parts=document.cookie.split(';');for(var i=0;i<parts.length;i++){var part=parts[i].trim();if(part.indexOf(name)===0){var value=part.slice(name.length);if(value==='light'||value==='dark'){theme=value;}break;}}var root=document.documentElement;root.dataset.theme=theme;root.style.colorScheme=theme;var meta=document.querySelector('meta[name="theme-color"]');if(meta){meta.setAttribute('content',theme==='dark'?'${THEME_META_COLORS.dark}':'${THEME_META_COLORS.light}');}document.cookie=name+theme+'; Max-Age=${THEME_COOKIE_MAX_AGE}; Path=/; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'');}catch(error){document.documentElement.dataset.theme='light';document.documentElement.style.colorScheme='light';}})();`
}
