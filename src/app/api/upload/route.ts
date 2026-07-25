import { NextRequest, NextResponse } from 'next/server'
import { readdir, stat, unlink } from 'fs/promises'
import { join } from 'path'
import fs from 'fs'
import { normalizeUploadPurpose, optimizeUploadImage } from '@/lib/image-processing'
import { requireAdmin } from '@/lib/auth'
import { rateLimiter } from '@/lib/rate-limit'
import { getUploadErrorDetails } from '@/lib/upload-errors'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const uploadDir = join(process.cwd(), 'public', 'uploads')

export async function GET() {
  try {
    // Chỉ admin mới được liệt kê thư viện media (dùng bởi MediaPicker)
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
    const details = getUploadErrorDetails(error)
    if (details.status === 500) console.error('Error reading upload dir:', error)
    return NextResponse.json({ error: details.message }, { status: details.status })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    if (await rateLimiter.isLimited(request, 30, 60000, 'upload_post')) {
      return rateLimiter.getLimitResponse()
    }
    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File
    const purpose = normalizeUploadPurpose(data.get('purpose'))

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
    const details = getUploadErrorDetails(error)
    if (details.status === 500) console.error('Upload error:', error)
    return NextResponse.json({ error: details.message }, { status: details.status })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin()

    if (await rateLimiter.isLimited(request, 10, 60000, 'upload_del')) {
      return rateLimiter.getLimitResponse()
    }
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
    const details = getUploadErrorDetails(error)
    if (details.status === 500) console.error('Delete error:', error)
    return NextResponse.json(
      { error: details.status === 500 ? 'Delete failed' : details.message },
      { status: details.status },
    )
  }
}
