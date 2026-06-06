import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const now = new Date().toISOString()

  try {
    // Light database query to check connectivity
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json({
      status: 'ok',
      time: now,
      service: 'mushroomie',
      database: 'ok',
      uptime: process.uptime(),
    }, { status: 200 })
  } catch (error) {
    // Do not log the actual error stack trace to the response to prevent leakages
    console.error('Healthcheck DB Error:', error)
    return NextResponse.json({
      status: 'error',
      time: now,
      service: 'mushroomie',
      database: 'error',
    }, { status: 503 })
  }
}
