import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  DEFAULT_SHIPPING_FEE_UPDATED_AT,
  normalizeShippingFee,
  shippingFeeValueSchema,
} from '@/lib/shipping-fee'

const updateSchema = z.object({
  shippingFee: shippingFeeValueSchema,
}).strict()

const MAX_TRANSACTION_ATTEMPTS = 3

async function persistShippingFee({
  shippingFee,
  userId,
  ipAddress,
}: {
  shippingFee: number
  userId: number
  ipAddress?: string
}) {
  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        const now = new Date().toISOString()
        const settings = await tx.setting.findMany({
          where: {
            key: { in: ['default_shipping_fee', 'shipping_fee_updated_at'] },
          },
          select: { key: true, value: true },
        })
        const values = new Map(settings.map((setting) => [setting.key, setting.value]))
        const previousFee = normalizeShippingFee(values.get('default_shipping_fee'))

        if (previousFee === shippingFee) {
          const persistedUpdatedAt = values.get('shipping_fee_updated_at')
          const updatedAt = persistedUpdatedAt && !Number.isNaN(Date.parse(persistedUpdatedAt))
            ? new Date(persistedUpdatedAt).toISOString()
            : DEFAULT_SHIPPING_FEE_UPDATED_AT

          return { shippingFee: previousFee, updatedAt, changed: false }
        }

        await tx.setting.upsert({
          where: { key: 'default_shipping_fee' },
          update: { value: String(shippingFee) },
          create: { key: 'default_shipping_fee', value: String(shippingFee) },
        })
        await tx.setting.upsert({
          where: { key: 'shipping_fee_updated_at' },
          update: { value: now },
          create: { key: 'shipping_fee_updated_at', value: now },
        })
        await tx.adminLog.create({
          data: {
            user_id: userId,
            action: 'UPDATE',
            entity: 'SETTINGS',
            details: JSON.stringify({
              key: 'default_shipping_fee',
              previousFee,
              shippingFee,
              updatedAt: now,
            }),
            ip_address: ipAddress,
          },
        })

        return { shippingFee, updatedAt: now, changed: true }
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

  throw new Error('Shipping fee transaction retry limit reached')
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

    const result = await persistShippingFee({
      shippingFee: parsed.data.shippingFee,
      userId: Number(session.user.id),
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[ADMIN SHIPPING FEE PATCH]', error)
    return NextResponse.json({ error: 'Không thể lưu phí vận chuyển' }, { status: 500 })
  }
}
