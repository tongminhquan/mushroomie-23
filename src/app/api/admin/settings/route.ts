import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const maskAccount = (acc: string) => {
  if (!acc) return ''
  if (acc.length <= 4) return '***' + acc
  return '******' + acc.slice(-4)
}

const maskEmail = (email: string) => {
  if (!email) return ''
  const parts = email.split('@')
  if (parts.length !== 2) return '******'
  return '******@' + parts[1]
}

export async function GET() {
  try {
    const session = await auth()
    if (!session || !['super_admin', 'admin', 'viewer'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Lấy thông tin từ bảng Settings
    const settingsList = await prisma.setting.findMany()
    const settings = settingsList.reduce((acc, curr) => {
      acc[curr.key] = curr.value
      return acc
    }, {} as Record<string, string>)

    // Lấy và mask thông tin từ biến môi trường
    const env = {
      bank_name: process.env.BANK_NAME || process.env.CASSO_BANK_NAME || 'Không xác định',
      bank_account: maskAccount(process.env.BANK_ACCOUNT_NUMBER || ''),
      email_provider: process.env.SMTP_HOST || 'Không xác định',
      email_sender: maskEmail(process.env.SMTP_USER || '')
    }

    return NextResponse.json({ settings, env })
  } catch (error: any) {
    console.error('Lỗi khi lấy Settings:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || !['super_admin', 'admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { settings } = await req.json()
    
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Upsert từng setting
    const operations = Object.entries(settings).map(([key, value]) => {
      return prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
      })
    })

    await prisma.$transaction(operations)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Lỗi khi lưu Settings:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
