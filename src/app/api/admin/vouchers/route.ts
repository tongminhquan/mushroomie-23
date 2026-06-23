import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/admin-logger'

export const dynamic = 'force-dynamic'

const voucherSchema = z.object({
  code: z.string().trim().min(2).max(40),
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).optional().nullable(),
  type: z.enum(['GAME_REWARD', 'PROMOTION_CODE', 'MANUAL', 'AUTO_CAMPAIGN']).default('PROMOTION_CODE'),
  discountType: z.enum(['PERCENT', 'FIXED', 'FREE_SHIPPING']).default('PERCENT'),
  discountValue: z.coerce.number().min(0),
  maxDiscount: z.coerce.number().min(0).optional().nullable(),
  minOrderValue: z.coerce.number().min(0).optional().nullable(),
  usageLimit: z.coerce.number().int().positive().optional().nullable(),
  perUserLimit: z.coerce.number().int().positive().default(1),
  status: z.enum(['ACTIVE', 'INACTIVE', 'EXPIRED', 'REVOKED']).default('ACTIVE'),
  sourceGame: z.string().trim().max(80).optional().nullable(),
  requiredScore: z.coerce.number().int().positive().optional().nullable(),
  startsAt: z.string().datetime().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
}).superRefine((value, ctx) => {
  if (value.discountType === 'PERCENT' && (value.discountValue <= 0 || value.discountValue > 100)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['discountValue'],
      message: 'Phần trăm giảm phải lớn hơn 0 và không vượt quá 100.',
    })
  }

  if (value.discountType === 'FIXED' && value.discountValue <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['discountValue'],
      message: 'Số tiền giảm phải lớn hơn 0.',
    })
  }

  if (value.type === 'GAME_REWARD' && !value.requiredScore) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['requiredScore'],
      message: 'Voucher mini game cần mốc điểm yêu cầu.',
    })
  }

  if (value.startsAt && value.expiresAt && new Date(value.startsAt) >= new Date(value.expiresAt)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['expiresAt'],
      message: 'Ngày kết thúc phải sau ngày bắt đầu.',
    })
  }
})

function toNullableDate(value?: string | null) {
  return value ? new Date(value) : null
}

function isUniqueConstraintError(error: unknown): error is { code: string } {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: unknown }).code === 'P2002'
}

async function requireWritableAdmin() {
  const session = await auth()
  const role = session?.user?.role
  if (!session?.user || !role) return null
  if (!['super_admin', 'admin'].includes(role)) return null
  return session
}

export async function GET() {
  try {
    const session = await auth()
    const role = session?.user?.role
    if (!session?.user || !role || !['super_admin', 'admin', 'viewer'].includes(role)) {
      return NextResponse.json({ message: 'Bạn không có quyền truy cập.' }, { status: 401 })
    }

    const vouchers = await prisma.voucher.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { userVouchers: true } },
      },
    })

    return NextResponse.json({ vouchers })
  } catch (error) {
    console.error('[ADMIN VOUCHERS GET]', error)
    return NextResponse.json({ message: 'Không thể tải danh sách voucher.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireWritableAdmin()
    if (!session) {
      return NextResponse.json({ message: 'Bạn không có quyền tạo voucher.' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = voucherSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: 'Dữ liệu voucher không hợp lệ.',
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      )
    }

    const data = parsed.data
    const voucher = await prisma.voucher.create({
      data: {
        code: data.code.toUpperCase(),
        title: data.title,
        description: data.description || null,
        type: data.type,
        discountType: data.discountType,
        discountValue: data.discountType === 'FREE_SHIPPING' ? 0 : data.discountValue,
        maxDiscount: data.maxDiscount ?? null,
        minOrderValue: data.minOrderValue ?? null,
        usageLimit: data.usageLimit ?? null,
        perUserLimit: data.perUserLimit,
        startsAt: toNullableDate(data.startsAt),
        expiresAt: toNullableDate(data.expiresAt),
        status: data.status,
        sourceGame: data.type === 'GAME_REWARD' ? data.sourceGame || null : null,
        requiredScore: data.type === 'GAME_REWARD' ? data.requiredScore || null : null,
        createdById: Number(session.user.id),
      },
    })

    await logAdminAction({
      userId: Number(session.user.id),
      action: 'CREATE',
      entity: 'VOUCHER',
      details: { id: voucher.id, code: voucher.code, type: voucher.type },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    })

    return NextResponse.json({ success: true, voucher }, { status: 201 })
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ message: 'Mã voucher đã tồn tại.' }, { status: 409 })
    }

    console.error('[ADMIN VOUCHERS POST]', error)
    return NextResponse.json({ message: 'Không thể tạo voucher.' }, { status: 500 })
  }
}
