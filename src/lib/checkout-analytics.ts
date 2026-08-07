import type { AnalyticsItem } from '@/lib/analytics'
import { GOOGLE_ADS_PURCHASE_SEND_TO } from '@/lib/google-tags'

export interface AnalyticsEventDescriptor {
  key: string
  event: 'order_created' | 'purchase' | 'conversion'
  params: Record<string, unknown>
}

interface OrderCreatedAnalyticsInput {
  orderCode: string
  value: number
  paymentMethod: 'bank_transfer' | 'cod'
  items: readonly AnalyticsItem[]
}

interface PaidPurchaseAnalyticsInput {
  orderCode: string
  providerPaymentStatus: string | null | undefined
  orderPaymentStatus: string | null | undefined
  value: number
  items: readonly AnalyticsItem[]
}

function validTransaction(orderCode: string, value: number) {
  const transactionId = orderCode.trim()
  if (!transactionId || !Number.isFinite(value) || value < 0) return null
  return transactionId
}

export function createOrderCreatedAnalyticsEvent(
  input: OrderCreatedAnalyticsInput,
): AnalyticsEventDescriptor | null {
  const transactionId = validTransaction(input.orderCode, input.value)
  if (!transactionId) return null

  return {
    key: `order_created_${transactionId}`,
    event: 'order_created',
    params: {
      transaction_id: transactionId,
      currency: 'VND',
      value: input.value,
      payment_method: input.paymentMethod,
      items: input.items,
    },
  }
}

export function createPaidPurchaseAnalyticsEvents(
  input: PaidPurchaseAnalyticsInput,
): AnalyticsEventDescriptor[] {
  if (input.providerPaymentStatus !== 'PAID' || input.orderPaymentStatus !== 'PAID') return []

  const transactionId = validTransaction(input.orderCode, input.value)
  if (!transactionId) return []

  return [
    {
      key: `purchase_${transactionId}`,
      event: 'purchase',
      params: {
        transaction_id: transactionId,
        currency: 'VND',
        value: input.value,
        items: input.items,
      },
    },
    {
      key: `ads_purchase_${transactionId}`,
      event: 'conversion',
      params: {
        send_to: GOOGLE_ADS_PURCHASE_SEND_TO,
        transaction_id: transactionId,
        currency: 'VND',
        value: input.value,
      },
    },
  ]
}
