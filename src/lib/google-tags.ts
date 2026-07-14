export const GOOGLE_ANALYTICS_ID = 'G-R95TLDCP0W'
export const GOOGLE_ADS_ID = 'AW-18206718336'

export type GoogleTag = (...args: unknown[]) => void

export function configureGoogleTags(gtag: GoogleTag, initializedAt = new Date()) {
  gtag('js', initializedAt)
  gtag('config', GOOGLE_ANALYTICS_ID)
  gtag('config', GOOGLE_ADS_ID)
}
