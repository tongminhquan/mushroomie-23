import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const checkoutSource = readFileSync(
  resolve(process.cwd(), 'src', 'app', '(user)', 'thanh-toan', 'page.tsx'),
  'utf8',
)
const confirmationSource = readFileSync(
  resolve(process.cwd(), 'src', 'app', '(user)', 'thanh-toan', 'xac-nhan', 'page.tsx'),
  'utf8',
)

describe('purchase funnel integration', () => {
  it('records successful order creation as intent instead of an Ads Purchase', () => {
    expect(checkoutSource).toContain('createOrderCreatedAnalyticsEvent')
    expect(checkoutSource).not.toContain('GOOGLE_ADS_PURCHASE_SEND_TO')
    expect(checkoutSource).not.toContain('ads_click_')
  })

  it('delegates confirmation analytics to the paid-only policy', () => {
    expect(confirmationSource).toContain('createPaidPurchaseAnalyticsEvents')
    expect(confirmationSource).toContain('providerPaymentStatus: paymentStatus?.status')
    expect(confirmationSource).toContain('orderPaymentStatus: paymentStatus?.paymentStatus')
    expect(confirmationSource).not.toContain(
      "const isCompleted = paymentStatus?.status === 'PAID' || orderInfo?.payment_method === 'cod'",
    )
  })
})
