import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isGameKey } from '@/lib/game-config'
import { createGameToken } from '@/lib/game-server'
import { getApplicationSecret } from '@/lib/security'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const game = typeof body.game === 'string' ? body.game : ''
    if (!isGameKey(game)) {
      return NextResponse.json({ error: 'Invalid game' }, { status: 400 })
    }

    const token = createGameToken(Number(session.user.id), game, getApplicationSecret())
    return NextResponse.json({ token })
  } catch (error) {
    console.error('[GAME START]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
