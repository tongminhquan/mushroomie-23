import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  DEFAULT_GIFT_WRAP_UPDATED_AT,
  giftWrapFeeValueSchema,
  normalizeGiftWrapEnabled,
  normalizeGiftWrapFee,
} from '@/lib/gift-wrap'
import { GIFT_WRAP_SETTING_KEYS, getGiftWrapSnapshot } from '@/lib/gift-wrap-server'

const updateSchema = z.object({
  fee: giftWrapFeeValueSchema,
  enabled: z.boolean(),
}).strict()

const MAX_TRANSACTION_ATTEMPTS = 3

async function persistGiftWrapSettings({
  fee,
  enabled,
  userId,
  ipAddress,
}: {
  fee: number
  enabled: boolean
  userId: number
  ipAddress?: string
}) {
  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        const now = new Date().toISOString()
        const settings = await tx.setting.findMany({
          where: { key: { in: [...GIFT_WRAP_SETTING_KEYS] } },
          select: { key: true, value: true },
        })
        const values = new Map(settings.map((setting) => [setting.key, setting.value]))
        const previousFee = normalizeGiftWrapFee(values.get('gift_wrap_fee'))
        const previousEnabled = normalizeGiftWrapEnabled(values.get('gift_wrap_enabled'))

        if (previousFee === fee && previousEnabled === enabled) {
          const persistedUpdatedAt = values.get('gift_wrap_updated_at')
          const updatedAt = persistedUpdatedAt && !Number.isNaN(Date.parse(persistedUpdatedAt))
            ? new Date(persistedUpdatedAt).toISOString()
            : DEFAULT_GIFT_WRAP_UPDATED_AT

          return { fee: previousFee, enabled: previousEnabled, updatedAt, changed: false }
        }

        await tx.setting.upsert({
          where: { key: 'gift_wrap_fee' },
          update: { value: String(fee) },
          create: { key: 'gift_wrap_fee', value: String(fee) },
        })
        await tx.setting.upsert({
          where: { key: 'gift_wrap_enabled' },
          update: { value: String(enabled) },
          create: { key: 'gift_wrap_enabled', value: String(enabled) },
        })
        await tx.setting.upsert({
          where: { key: 'gift_wrap_updated_at' },
          update: { value: now },
          create: { key: 'gift_wrap_updated_at', value: now },
        })
        await tx.adminLog.create({
          data: {
            user_id: userId,
            action: 'UPDATE',
            entity: 'SETTINGS',
            details: JSON.stringify({
              key: 'gift_wrap',
              previousFee,
              fee,
              previousEnabled,
              enabled,
              updatedAt: now,
            }),
            ip_address: ipAddress,
          },
        })

        return { fee, enabled, updatedAt: now, changed: true }
      }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      })
    } catch (error) {
      const shouldRetry = (
        error instanceof Prisma.PrismaClientKnownRequestError
        && error.code === 'P2034'
        && attempt < MAX_TRANSACTION_ATTEMPTS
      )
      if (!shouldRetry) throw error
    }
  }

  throw new Error('Gift wrap transaction retry limit reached')
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || !['super_admin', 'admin', 'viewer'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(await getGiftWrapSnapshot(), {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    console.error('[ADMIN GIFT WRAP GET]', error)
    return NextResponse.json({ error: 'Không thể tải cấu hình gói quà' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || !['super_admin', 'admin'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = updateSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const result = await persistGiftWrapSettings({
      fee: parsed.data.fee,
      enabled: parsed.data.enabled,
      userId: Number(session.user.id),
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[ADMIN GIFT WRAP PATCH]', error)
    return NextResponse.json({ error: 'Không thể lưu cấu hình gói quà' }, { status: 500 })
  }
}
