import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Vui lòng đăng nhập' }, { status: 401 })
    }

    const { code } = await request.json()
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ message: 'Mã voucher không hợp lệ' }, { status: 400 })
    }

    const voucherCode = code.trim().toUpperCase()

    // Find the voucher template
    const template = await prisma.voucher.findUnique({
      where: { code: voucherCode }
    })

    if (!template) {
      return NextResponse.json({ message: 'Mã voucher không tồn tại' }, { status: 404 })
    }

    if (template.status !== 'ACTIVE') {
      return NextResponse.json({ message: 'Mã voucher đã ngừng hoạt động' }, { status: 400 })
    }

    if (template.type === 'GAME_REWARD') {
      return NextResponse.json({ message: 'Voucher này chỉ nhận được thông qua mini game' }, { status: 400 })
    }

    const now = new Date()
    if (template.startsAt && template.startsAt > now) {
      return NextResponse.json({ message: 'Chương trình khuyến mãi chưa bắt đầu' }, { status: 400 })
    }
    if (template.expiresAt && template.expiresAt < now) {
      return NextResponse.json({ message: 'Mã voucher đã hết hạn' }, { status: 400 })
    }

    // Check usage limits
    const [totalUsed, userUsed] = await Promise.all([
      template.usageLimit ? prisma.userVoucher.count({ where: { voucherId: template.id } }) : 0,
      prisma.userVoucher.count({ where: { voucherId: template.id, userId: Number(session.user.id) } })
    ])

    if (template.usageLimit && totalUsed >= template.usageLimit) {
      return NextResponse.json({ message: 'Mã voucher đã hết số lượng phát' }, { status: 400 })
    }
    if (userUsed >= template.perUserLimit) {
      return NextResponse.json({ message: `Bạn chỉ được nhận mã này tối đa ${template.perUserLimit} lần` }, { status: 400 })
    }

    // Create the user voucher
    const userVoucher = await prisma.userVoucher.create({
      data: {
        userId: Number(session.user.id),
        voucherId: template.id,
        status: 'AVAILABLE',
        source: 'manual_input',
        expiresAt: template.expiresAt,
      }
    })

    return NextResponse.json({ success: true, message: 'Nhận voucher thành công', data: userVoucher })
  } catch (error) {
    console.error('Redeem voucher error:', error)
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 })
  }
}
