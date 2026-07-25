import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  DEFAULT_GIFT_WRAP_UPDATED_AT,
  normalizeGiftWrapEnabled,
  normalizeGiftWrapFee,
  type GiftWrapSnapshot,
} from '@/lib/gift-wrap'

export const GIFT_WRAP_SETTING_KEYS = [
  'gift_wrap_enabled',
  'gift_wrap_fee',
  'gift_wrap_updated_at',
] as const

type GiftWrapSettingReader = Pick<Prisma.TransactionClient, 'setting'>

/** Đọc cấu hình gói quà hiện tại. Nhận `tx` để tính tiền trong cùng transaction đơn hàng. */
export async function getGiftWrapSnapshot(
  client: GiftWrapSettingReader = prisma,
): Promise<GiftWrapSnapshot> {
  const settings = await client.setting.findMany({
    where: {
      key: { in: [...GIFT_WRAP_SETTING_KEYS] },
    },
    select: {
      key: true,
      value: true,
    },
  })
  const values = new Map(settings.map((setting) => [setting.key, setting.value]))
  const updatedAtValue = values.get('gift_wrap_updated_at')
  const updatedAt = updatedAtValue && !Number.isNaN(Date.parse(updatedAtValue))
    ? new Date(updatedAtValue).toISOString()
    : DEFAULT_GIFT_WRAP_UPDATED_AT

  return {
    enabled: normalizeGiftWrapEnabled(values.get('gift_wrap_enabled')),
    fee: normalizeGiftWrapFee(values.get('gift_wrap_fee')),
    updatedAt,
  }
}
