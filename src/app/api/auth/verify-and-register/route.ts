import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'Legacy OAuth completion endpoint retired. Please sign in with Google again.' },
    { status: 410 },
  )
}
