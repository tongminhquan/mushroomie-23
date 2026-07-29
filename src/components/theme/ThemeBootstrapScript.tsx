import Script from 'next/script'
import { buildThemeBootstrapScript } from '@/lib/theme'

export default function ThemeBootstrapScript() {
  return (
    <Script
      id="mushroomie-theme-bootstrap"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: buildThemeBootstrapScript() }}
    />
  )
}
