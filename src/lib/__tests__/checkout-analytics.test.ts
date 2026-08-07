import { describe, expect, it } from 'vitest'
import { GOOGLE_ADS_PURCHASE_SEND_TO } from '@/lib/google-tags'
import {
  createOrderCreatedAnalyticsEvent,
  createPaidPurchaseAnalyticsEvents,
} from '@/lib/checkout-analytics'

const items = [
  {
    item_id: '12',
    item_name: 'Vòng tay nấm đỏ',
    price: 120_000,
    quantity: 2,
  },
]

describe('checkout analytics policy', () => {
  it('keeps order creation as intent without targeting the Ads Purchase conversion', () => {
    const descriptor = createOrderCreatedAnalyticsEvent({
      orderCode: 'MSH-99',
      value: 230_000,
      paymentMethod: 'bank_transfer',
      items,
    })

    expect(descriptor).toEqual({
      key: 'order_created_MSH-99',
      event: 'order_created',
      params: {
        transaction_id: 'MSH-99',
        currency: 'VND',
        value: 230_000,
        payment_method: 'bank_transfer',
        items,
      },
    })
    expect(descriptor?.params).not.toHaveProperty('send_to')
  })

  it('does not build Purchase events for a pending bank transfer', () => {
    expect(createPaidPurchaseAnalyticsEvents({
      orderCode: 'MSH-99',
      providerPaymentStatus: 'PENDING',
      orderPaymentStatus: 'PENDING',
      value: 230_000,
      items,
    })).toEqual([])
  })

  it('does not treat an unpaid COD order as a Purchase', () => {
    expect(createPaidPurchaseAnalyticsEvents({
      orderCode: 'MSH-COD-1',
      providerPaymentStatus: 'PENDING',
      orderPaymentStatus: 'PENDING',
      value: 230_000,
      items,
    })).toEqual([])
  })

  it('does not build Purchase events for an inconsistent paid transition', () => {
    expect(createPaidPurchaseAnalyticsEvents({
      orderCode: 'MSH-99',
      providerPaymentStatus: 'PAID',
      orderPaymentStatus: 'PENDING',
      value: 230_000,
      items,
    })).toEqual([])
  })

  it('builds one GA4 Purchase and one Ads Purchase with the same transaction id', () => {
    const descriptors = createPaidPurchaseAnalyticsEvents({
      orderCode: ' MSH-99 ',
      providerPaymentStatus: 'PAID',
      orderPaymentStatus: 'PAID',
      value: 230_000,
      items,
    })

    expect(descriptors).toEqual([
      {
        key: 'purchase_MSH-99',
        event: 'purchase',
        params: {
          transaction_id: 'MSH-99',
          currency: 'VND',
          value: 230_000,
          items,
        },
      },
      {
        key: 'ads_purchase_MSH-99',
        event: 'conversion',
        params: {
          send_to: GOOGLE_ADS_PURCHASE_SEND_TO,
          transaction_id: 'MSH-99',
          currency: 'VND',
          value: 230_000,
        },
      },
    ])
    expect(descriptors.map(({ params }) => params.transaction_id)).toEqual(['MSH-99', 'MSH-99'])
  })

  it('refuses to build paid events without an authoritative order code or value', () => {
    expect(createPaidPurchaseAnalyticsEvents({
      orderCode: '',
      providerPaymentStatus: 'PAID',
      orderPaymentStatus: 'PAID',
      value: 230_000,
      items,
    })).toEqual([])
    expect(createPaidPurchaseAnalyticsEvents({
      orderCode: 'MSH-99',
      providerPaymentStatus: 'PAID',
      orderPaymentStatus: 'PAID',
      value: Number.NaN,
      items,
    })).toEqual([])
  })
})
