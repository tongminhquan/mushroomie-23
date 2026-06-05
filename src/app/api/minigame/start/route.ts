import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import crypto from 'crypto'

const SECRET = process.env.NEXTAUTH_SECRET || 'mushroomie-secret-fallback'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    const startTime = Date.now()
    const payload = `${session.user.id}:${startTime}`
    const hmac = crypto.createHmac('sha256', SECRET).update(payload).digest('hex')
    const token = `${payload}.${hmac}`

    return NextResponse.json({ token })
  } catch (error) {
    console.error('Lỗi start game:', error)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
