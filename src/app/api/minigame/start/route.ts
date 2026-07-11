import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'Legacy game endpoint retired. Use /api/game/start.' },
    { status: 410 },
  )
}
