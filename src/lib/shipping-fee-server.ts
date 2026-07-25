import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  DEFAULT_SHIPPING_FEE_UPDATED_AT,
  normalizeShippingFee,
  type ShippingFeeSnapshot,
} from '@/lib/shipping-fee'

type ShippingFeeSettingReader = Pick<Prisma.TransactionClient, 'setting'>

export async function getShippingFeeSnapshot(
  client: ShippingFeeSettingReader = prisma,
): Promise<ShippingFeeSnapshot> {
  const settings = await client.setting.findMany({
    where: {
      key: { in: ['default_shipping_fee', 'shipping_fee_updated_at'] },
    },
    select: {
      key: true,
      value: true,
    },
  })
  const values = new Map(settings.map((setting) => [setting.key, setting.value]))
  const updatedAtValue = values.get('shipping_fee_updated_at')
  const updatedAt = updatedAtValue && !Number.isNaN(Date.parse(updatedAtValue))
    ? new Date(updatedAtValue).toISOString()
    : DEFAULT_SHIPPING_FEE_UPDATED_AT

  return {
    shippingFee: normalizeShippingFee(values.get('default_shipping_fee')),
    updatedAt,
  }
}
