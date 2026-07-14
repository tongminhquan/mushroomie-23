export const GOOGLE_ANALYTICS_ID = 'G-R95TLDCP0W'
export const GOOGLE_ADS_ID = 'AW-18206718336'

/** Nhãn chuyển đổi "Lượt mua hàng" lấy từ Google Ads. */
export const GOOGLE_ADS_PURCHASE_LABEL = 'OMl8CKSds9AcEIDz0elD'

/** Đích cho gtag('event','conversion', { send_to }) trên trang xác nhận đơn. */
export const GOOGLE_ADS_PURCHASE_SEND_TO = `${GOOGLE_ADS_ID}/${GOOGLE_ADS_PURCHASE_LABEL}`

export type GoogleTag = (...args: unknown[]) => void

export function configureGoogleTags(gtag: GoogleTag, initializedAt = new Date()) {
  gtag('js', initializedAt)
  gtag('config', GOOGLE_ANALYTICS_ID)
  gtag('config', GOOGLE_ADS_ID)
}
