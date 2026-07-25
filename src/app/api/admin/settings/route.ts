import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const GENERAL_SETTING_KEYS = ['brand_name', 'hotline', 'support_email'] as const
const generalSettingKeySet = new Set<string>(GENERAL_SETTING_KEYS)

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
    if (!session || !['super_admin', 'admin', 'viewer'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Lấy thông tin từ bảng Settings
    const settingsList = await prisma.setting.findMany({
      where: { key: { in: [...GENERAL_SETTING_KEYS] } },
    })
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
  } catch (error) {
    console.error('Lỗi khi lấy Settings:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || !['super_admin', 'admin'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const settings = body?.settings
    
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const entries = Object.entries(settings)
    if (entries.some(([key]) => !generalSettingKeySet.has(key))) {
      return NextResponse.json({ error: 'Unsupported setting key' }, { status: 400 })
    }
    if (entries.some(([, value]) => typeof value !== 'string' || value.length > 500)) {
      return NextResponse.json({ error: 'Invalid setting value' }, { status: 400 })
    }

    // Upsert từng setting
    const operations = entries.map(([key, value]) => {
      return prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
      })
    })

    await prisma.$transaction(operations)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Lỗi khi lưu Settings:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
