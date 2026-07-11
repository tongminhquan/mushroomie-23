import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const redeemSchema = z.object({ code: z.string().trim().min(1).max(100) })

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Bạn cần đăng nhập' }, { status: 401 })
  }

  const parsed = redeemSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ message: 'Mã voucher không hợp lệ' }, { status: 400 })
  }

  const userId = Number(session.user.id)
  const code = parsed.data.code.toUpperCase()

  try {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const userVoucher = await prisma.$transaction(async (tx) => {
          const template = await tx.voucher.findUnique({ where: { code } })
          if (!template || template.status !== 'ACTIVE') throw new Error('VOUCHER_NOT_AVAILABLE')

          const now = new Date()
          if (template.startsAt && template.startsAt > now) throw new Error('VOUCHER_NOT_STARTED')
          if (template.expiresAt && template.expiresAt <= now) throw new Error('VOUCHER_EXPIRED')

          const [totalIssued, userIssued] = await Promise.all([
            tx.userVoucher.count({ where: { voucherId: template.id } }),
            tx.userVoucher.count({ where: { voucherId: template.id, userId } }),
          ])

          if (template.usageLimit !== null && totalIssued >= template.usageLimit) {
            throw new Error('VOUCHER_LIMIT_REACHED')
          }
          if (userIssued >= template.perUserLimit) throw new Error('USER_LIMIT_REACHED')

          return tx.userVoucher.create({
            data: {
              userId,
              voucherId: template.id,
              status: 'AVAILABLE',
              source: 'manual_input',
              expiresAt: template.expiresAt,
            },
          })
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

        return NextResponse.json({ success: true, message: 'Nhận voucher thành công', data: userVoucher })
      } catch (error) {
        const retryable = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034'
        if (!retryable || attempt === 2) throw error
      }
    }
  } catch (error) {
    const messages: Record<string, string> = {
      VOUCHER_NOT_AVAILABLE: 'Mã voucher không tồn tại hoặc đang tạm dừng',
      VOUCHER_NOT_STARTED: 'Chương trình khuyến mãi chưa bắt đầu',
      VOUCHER_EXPIRED: 'Mã voucher đã hết hạn',
      VOUCHER_LIMIT_REACHED: 'Mã voucher đã hết số lượng phát',
      USER_LIMIT_REACHED: 'Bạn đã đạt giới hạn nhận mã này',
    }
    if (error instanceof Error && messages[error.message]) {
      return NextResponse.json({ message: messages[error.message] }, { status: 400 })
    }
    console.error('Redeem voucher error:', error)
    return NextResponse.json({ message: 'Không thể nhận voucher, vui lòng thử lại' }, { status: 500 })
  }

  return NextResponse.json({ message: 'Không thể nhận voucher, vui lòng thử lại' }, { status: 500 })
}
