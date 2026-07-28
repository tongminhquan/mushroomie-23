import { NextResponse } from 'next/server'
import { readdir, stat, unlink } from 'fs/promises'
import { join } from 'path'
import fs from 'fs'
import { normalizeUploadPurpose, optimizeUploadImage } from '@/lib/image-processing'
import { requireAdmin, requireAuth } from '@/lib/auth'
import { rateLimiter } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const uploadDir = join(process.cwd(), 'public', 'uploads')

export async function GET() {
  try {
    await requireAdmin()

    // Check if directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const files = await readdir(uploadDir)
    const images = []
    
    for (const file of files) {
      if (file.match(/\.webp$/i)) {
        const fileStat = await stat(join(uploadDir, file))
        images.push({
          id: fileStat.mtimeMs,
          url: `/uploads/${file}`,
          filename: file,
          size: fileStat.size,
          created_at: fileStat.mtime.toISOString(),
        })
      }
    }
    
    // Sort by newest first
    images.sort((a, b) => b.id - a.id)
    
    return NextResponse.json(images)
  } catch (error) {
    const authResponse = getAuthErrorResponse(error)
    if (authResponse) return authResponse
    console.error('Error reading upload dir:', error)
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  try {
    const req = request as any
    if (rateLimiter.isLimited(req, 10, 60000, 'upload_post')) {
      return rateLimiter.getLimitResponse()
    }
    
    const session = await requireAuth()

    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File
    const purpose = normalizeUploadPurpose(data.get('purpose'))
    const isAdmin = ['super_admin', 'admin'].includes(session.user.role as string)

    if (!isAdmin && purpose !== 'avatar') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const optimized = await optimizeUploadImage({
      buffer,
      declaredMime: file.type,
      purpose,
      uploadDir,
    })

    return NextResponse.json(optimized)
  } catch (error) {
    const authResponse = getAuthErrorResponse(error)
    if (authResponse) return authResponse
    console.error('Upload error:', error)
    const message = error instanceof Error ? error.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const req = request as any
    if (rateLimiter.isLimited(req, 10, 60000, 'upload_del')) {
      return rateLimiter.getLimitResponse()
    }

    await requireAdmin()

    const url = new URL(request.url)
    const filename = url.searchParams.get('filename')
    
    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    // Security check: prevent directory traversal
    if (filename.includes('/') || filename.includes('..')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
    }

    const path = join(uploadDir, filename)
    
    if (fs.existsSync(path)) {
      await unlink(path)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const authResponse = getAuthErrorResponse(error)
    if (authResponse) return authResponse
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}

function getAuthErrorResponse(error: unknown) {
  if (!(error instanceof Error)) return null
  if (error.message === 'UNAUTHORIZED') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (error.message === 'FORBIDDEN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}
